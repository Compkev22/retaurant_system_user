'use strict';

import Reservation from './reservation.model.js';
import Table from '../Table/table.model.js';
import Event from '../Event/event.model.js';
import User from '../User/user.model.js';

/**
 * Helper interno - Calcula qué mesas están ocupadas en una sucursal/fecha/hora
 * cruzando Eventos y Reservaciones activas.
 * No es una ruta, es reutilizado por getTableAvailability y saveReservation.
 */
const findOccupiedTableIds = async (branchId, reservationDate, time, excludeReservationId = null) => {
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
    const reservationFilter = {
        branchId,
        date: reservationDate,
        status: { $in: ['Confirmada', 'Pendiente'] },
        statusRes: 'ACTIVADO',
        time: time
    };

    // Al actualizar una reservación existente, no debe chocar contra sí misma
    if (excludeReservationId) {
        reservationFilter._id = { $ne: excludeReservationId };
    }

    const overlapReservations = await Reservation.find(reservationFilter).select('tableId');

    return [
        ...overlapEvents.flatMap(e => e.tables.map(t => t.toString())),
        ...overlapReservations.map(r => r.tableId.toString())
    ];
};

/**
 * GET - Disponibilidad de mesas para una sucursal/fecha/hora
 * Permitido para: CLIENT
 * El frontend usa esto para pintar la grilla de mesas libres/ocupadas
 * ANTES de que el cliente elija una y confirme la reservación.
 */
export const getTableAvailability = async (req, res) => {
    try {
        const { branchId, date, time } = req.query;

        if (!branchId || !date || !time) {
            return res.status(400).send({
                success: false,
                message: 'branchId, date y time son requeridos.'
            });
        }

        const reservationDate = new Date(date);

        const occupiedTableIds = await findOccupiedTableIds(branchId, reservationDate, time);
        
        const tables = await Table.find({
            branchId,
            TableStatus: 'ACTIVE',
            availability: 'Disponible'
        }).sort({ numberTable: 1 });

        // Anexamos el estado calculado (no el campo estático availability)
        const tablesWithStatus = tables.map(t => ({
            _id: t._id,
            numberTable: t.numberTable,
            capacity: t.capacity,
            isOccupied: occupiedTableIds.includes(t._id.toString())
        }));

        return res.send({
            success: true,
            tables: tablesWithStatus
        });

    } catch (err) {
        return res.status(500).send({
            success: false,
            message: 'Error al consultar disponibilidad',
            error: err.message
        });
    }
};

/**
 * POST - Crear reservación
 * Permitido para: CLIENT, EMPLOYEE, BRANCH_ADMIN, PLATFORM_ADMIN
 * El cliente ahora elige la mesa (tableId) desde el frontend.
 * El servidor SIEMPRE revalida que esa mesa siga libre antes de guardar.
 */
export const saveReservation = async (req, res) => {
    try {
        const { branchId, tableId, date, time, numberOfPersons, notes } = req.body;

        // El empleado puede asignar un clientId manualmente (ventas presenciales/teléfono)
        let clientId = req.body.clientId;
        if (req.user.role === 'CLIENT') {
            const localUser = await User.findOne({ authId: req.user.id });
            clientId = localUser?._id;
        }
        if (!clientId) {
            return res.status(400).send({
                success: false,
                message: 'El ID del cliente es requerido.'
            });
        }

        if (!tableId) {
            return res.status(400).send({
                success: false,
                message: 'Debes seleccionar una mesa.'
            });
        }

        const reservationDate = new Date(date);

        // Validamos que la mesa exista, pertenezca a la sucursal y esté activa
        const table = await Table.findOne({
            _id: tableId,
            branchId,
            TableStatus: 'ACTIVE'
        });

        if (!table) {
            return res.status(404).send({
                success: false,
                message: 'La mesa seleccionada no existe o no está disponible en esta sucursal.'
            });
        }

        if (table.capacity < numberOfPersons) {
            return res.status(400).send({
                success: false,
                message: `La mesa ${table.numberTable} tiene capacidad para ${table.capacity} personas.`
            });
        }

        // Revalidación de disponibilidad en servidor (nunca confiar solo en el frontend)
        const occupiedTableIds = await findOccupiedTableIds(branchId, reservationDate, time);

        if (occupiedTableIds.includes(tableId.toString())) {
            return res.status(409).send({
                success: false,
                message: 'Esa mesa ya fue reservada para este horario. Elige otra.'
            });
        }

        const reservation = new Reservation({
            branchId,
            clientId,
            tableId,
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
            assignedTable: { number: table.numberTable },
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
            const localUser = await User.findOne({ authId: req.user.id });
            filter.clientId = localUser?._id;
        } else if (req.user.role === 'EMPLOYEE' || req.user.role === 'BRANCH_ADMIN') {
            // El empleado ve todas las de su sucursal
            filter.branchId = req.user.branchId;
        }
        // PLATFORM_ADMIN no entra en filtros y ve todo

        const reservations = await Reservation.find(filter)
            .populate('tableId', 'numberTable capacity')
            .populate('clientId', 'UserName UserSurname email')
            .populate('branchId', 'name')
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
        if (req.user.role === 'CLIENT') {
            const localUser = await User.findOne({ authId: req.user.id });
            if (reservation.clientId?.toString() !== localUser?._id?.toString()) {
                return res.status(403).send({ success: false, message: 'No autorizado' });
            }
        }

        // Si el cliente está cambiando mesa, fecha u hora, revalidamos disponibilidad
        if (data.tableId || data.date || data.time) {
            const targetTableId = (data.tableId || reservation.tableId).toString();
            const targetDate = new Date(data.date || reservation.date);
            const targetTime = data.time || reservation.time;
            const targetBranchId = data.branchId || reservation.branchId;

            const occupiedTableIds = await findOccupiedTableIds(targetBranchId, targetDate, targetTime, id);

            if (occupiedTableIds.includes(targetTableId)) {
                return res.status(409).send({
                    success: false,
                    message: 'Esa mesa ya está ocupada para el nuevo horario. Elige otra.'
                });
            }
        }

        const updated = await Reservation.findByIdAndUpdate(id, data, { new: true })
            .populate('tableId', 'numberTable capacity');

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
        if (req.user.role === 'CLIENT') {
            const localUser = await User.findOne({ authId: req.user.id });
            if (reservation.clientId.toString() !== localUser?._id?.toString()) {
                return res.status(403).send({ success: false, message: 'No autorizado' });
            }
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