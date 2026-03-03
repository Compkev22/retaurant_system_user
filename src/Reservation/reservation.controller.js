'use strict';

import Reservation from './reservation.model.js';
import Table from '../Table/table.model.js';
import Event from '../Event/event.model.js';

/**
 * POST - Crear reservación
 * Permitido para: CLIENT, EMPLOYEE, BRANCH_ADMIN, PLATFORM_ADMIN
 */
export const saveReservation = async (req, res) => {
    try {
        const { branchId, date, time, numberOfPersons, notes } = req.body;
        
        // El empleado puede asignar un clientId manualmente (ventas presenciales/teléfono)
        const clientId = req.user.role === 'CLIENT' ? req.user._id : req.body.clientId;

        if (!clientId) {
            return res.status(400).send({ 
                success: false, 
                message: 'El ID del cliente es requerido.' 
            });
        }

        const reservationDate = new Date(date);

        // 1. Verificar conflictos en Eventos
        const overlapEvents = await Event.find({
            branchId,
            eventDate: reservationDate,
            status: { $ne: 'Cancelado' },
            $and: [
                { startTime: { $lte: time } },
                { endTime: { $gte: time } }
            ]
        }).select('tables');

        // 2. Verificar conflictos en otras Reservaciones
        const overlapReservations = await Reservation.find({
            branchId,
            date: reservationDate,
            status: { $in: ['Confirmada', 'Pendiente'] },
            statusRes: 'ACTIVADO', // Solo chocamos con las que no están en soft-delete
            time: time 
        }).select('tableId');

        const occupiedTableIds = [
            ...overlapEvents.flatMap(e => e.tables.map(t => t.toString())),
            ...overlapReservations.map(r => r.tableId.toString())
        ];

        // 3. Asignación automática de mesa
        const bestTable = await Table.findOne({
            branchId,
            TableStatus: 'ACTIVE',
            availability: { $ne: 'Mantenimiento' },
            capacity: { $gte: numberOfPersons },
            _id: { $nin: occupiedTableIds } 
        }).sort({ capacity: 1 });

        if (!bestTable) {
            return res.status(400).send({
                success: false,
                message: 'No hay mesas disponibles para este horario/capacidad.'
            });
        }

        const reservation = new Reservation({
            branchId,
            clientId,
            tableId: bestTable._id,
            date: reservationDate,
            time,
            numberOfPersons,
            notes,
            status: 'Pendiente'
        });

        await reservation.save();

        return res.status(201).send({ 
            success: true, 
            message: 'Reservación creada exitosamente', 
            assignedTable: { number: bestTable.numberTable },
            data: reservation 
        });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al reservar', error: err.message });
    }
};

/**
 * GET - Obtener reservaciones
 * Permitido para: CLIENT (propias), EMPLOYEE y ADMINS (sucursal/todas)
 */
export const getReservations = async (req, res) => {
    try {
        const filter = { statusRes: 'ACTIVADO' };
        
        if (req.user.role === 'CLIENT') {
            filter.clientId = req.user._id;
        } else if (req.user.role === 'EMPLOYEE' || req.user.role === 'BRANCH_ADMIN') {
            // El empleado ve todas las de su sucursal
            filter.branchId = req.user.branchId;
        }
        // PLATFORM_ADMIN no entra en filtros y ve todo

        const reservations = await Reservation.find(filter)
            .populate('tableId', 'numberTable capacity')
            .populate('clientId', 'UserName UserSurname email')
            .sort({ date: 1, time: 1 });

        return res.send({ success: true, reservations });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al obtener', error: err.message });
    }
};

/**
 * PUT - Actualizar reservación
 * Permitido para: CLIENT (solo si es suya), EMPLOYEE y ADMINS
 */
export const updateReservation = async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const reservation = await Reservation.findById(id);
        if (!reservation) return res.status(404).send({ success: false, message: 'No encontrada' });

        // Validación de permisos
        if (req.user.role === 'CLIENT' && reservation.clientId?.toString() !== req.user._id.toString()) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }
        
        // Si el empleado o admin editan, pueden proceder directamente
        const updated = await Reservation.findByIdAndUpdate(id, data, { new: true });
        return res.send({ success: true, message: 'Actualizado con éxito', updated });
    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error al actualizar', error: err.message });
    }
};

/**
 * PATCH - Toggle Soft Delete
 * Permitido para: CLIENT (propia), EMPLOYEE y ADMINS
 */
export const toggleReservationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const reservation = await Reservation.findById(id);

        if (!reservation) return res.status(404).send({ success: false, message: 'No encontrada' });

        // El empleado tiene permiso para cancelar cualquier reserva de su sucursal
        if (req.user.role === 'CLIENT' && reservation.clientId.toString() !== req.user._id.toString()) {
            return res.status(403).send({ success: false, message: 'No autorizado' });
        }

        const nuevoEstado = reservation.statusRes === 'ACTIVADO' ? 'DESACTIVADO' : 'ACTIVADO';
        reservation.status = (nuevoEstado === 'DESACTIVADO') ? 'Cancelada' : 'Pendiente';
        reservation.statusRes = nuevoEstado;
        
        await reservation.save();

        return res.send({
            success: true,
            message: `Reservación ${nuevoEstado.toLowerCase()} por ${req.user.role}`,
            statusRes: reservation.statusRes
        });

    } catch (err) {
        return res.status(500).send({ success: false, message: 'Error en el toggle', error: err.message });
    }
};