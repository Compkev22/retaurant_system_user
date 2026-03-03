'use strict';

import Event from './event.model.js';
import Table from '../Table/table.model.js'

//TODOS
export const getEvents = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const filter = {};

        if (req.user.role === 'CLIENT') {
            filter.status = 'ACTIVE';
        } else if (req.user.role === 'BRANCH_ADMIN') {
            filter.branchId = req.user.branchId;
            if (req.query.status) filter.status = req.query.status;
        } else if (req.query.status) {
            filter.status = req.query.status;
        }

        const events = await Event.find(filter)
            .populate('branchId')
            .populate('clientId')
            .populate('tables')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Event.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / parseInt(limit)),
                totalRecords: total,
                limit: parseInt(limit),
            },
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los eventos',
            error: error.message,
        });
    }
};


export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const event = await Event.findById(id)
            .populate('branchId')
            .populate('clientId')
            .populate('tables');

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Evento no encontrado',
            });
        }

        res.status(200).json({
            success: true,
            data: event,
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener el evento',
            error: error.message,
        });
    }
};

//SOLO PLATFORM_ADMIN
export const createEvent = async (req, res) => {
    try {
        const { branchId, eventDate, startTime, endTime, numberOfPersons, name, additionalServices, notes } = req.body;
        const clientId = req.user._id;

        const dateFilter = new Date(eventDate);

        // BUSCAR MESAS OCUPADAS POR OTROS EVENTOS (Misma fecha y choque de horas)
        const overlappingEvents = await Event.find({
            branchId,
            eventDate: dateFilter,
            status: { $ne: 'Cancelado' }, 
            $or: [
                { startTime: { $lt: endTime }, endTime: { $gt: startTime } }
            ]
        }).select('tables');

        // BUSCAR MESAS OCUPADAS POR RESERVACIONES INDIVIDUALES
        // Bloqueamos cualquier mesa que tenga una reserva dentro del rango del evento
        const overlappingReservations = await Reservation.find({
            branchId,
            date: dateFilter,
            status: { $in: ['Confirmada', 'Pendiente'] },
            time: { $gte: startTime, $lte: endTime }
        }).select('tableId');

        // CONSOLIDAR "LISTA NEGRA" DE MESAS
        const occupiedTableIds = [
            ...overlappingEvents.flatMap(event => event.tables.map(t => t.toString())),
            ...overlappingReservations.map(res => res.tableId.toString())
        ];

        // BUSCAR MESAS DISPONIBLES EN LA SUCURSAL
        const availableTables = await Table.find({
            branchId,
            TableStatus: 'ACTIVE',
            availability: { $ne: 'Mantenimiento' },
            _id: { $nin: occupiedTableIds } 
        }).sort({ capacity: -1 }); 

        // VALIDAR CAPACIDAD TOTAL RESTANTE
        const totalCapacity = availableTables.reduce((acc, table) => acc + table.capacity, 0);
        
        if (totalCapacity < numberOfPersons) {
            return res.status(400).json({
                success: false,
                message: `Capacidad insuficiente por reservaciones existentes. Espacio disponible: ${totalCapacity} personas.`
            });
        }

        // ASIGNACIÓN AUTOMÁTICA
        let assignedTables = [];
        let accumulatedCapacity = 0;

        for (const table of availableTables) {
            if (accumulatedCapacity < numberOfPersons) {
                assignedTables.push(table._id);
                accumulatedCapacity += table.capacity;
            } else {
                break; 
            }
        }

        // GUARDAR EVENTO
        const newEvent = new Event({
            branchId,
            clientId,
            name,
            eventDate: dateFilter,
            startTime,
            endTime,
            numberOfPersons,
            notes,
            additionalServices,
            tables: assignedTables
        });

        await newEvent.save();

        res.status(201).json({
            success: true,
            message: 'Evento creado exitosamente respetando reservaciones previas',
            data: newEvent
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al crear el evento',
            error: error.message
        });
    }
};

//PLATFORM_ADMIN Y BRANCH_ADMIN
export const updateEvent = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const event = await Event.findByIdAndUpdate(id, req.body, { new: true, runValidators: true })
            .populate('branchId')
            .populate('clientId')
            .populate('tables');

        if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

        res.status(200).json({
            success: true,
            message: 'Evento actualizado exitosamente',
            data: event,
        });

    } catch (error) {
        res.status(400).json({ success: false, message: 'Error al actualizar el evento', error: error.message });
    }
};

//PLATFORM_ADMIN, BRANCH_ADMIN Y EMPLOYEE
export const changeEventStatus = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN', 'EMPLOYEE'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const { status } = req.body;

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

        event.status = status;
        await event.save();

        res.status(200).json({
            success: true,
            message: 'Estado del evento actualizado exitosamente',
            data: event,
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cambiar el estado del evento', error: error.message });
    }
};

// PLATFORM_ADMIN, BRANCH_ADMIN Y EMPLOYEE
export const toggleEventAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body; // 'INICIAR' o 'FINALIZAR'

        const event = await Event.findById(id);
        if (!event) return res.status(404).json({ success: false, message: 'Evento no encontrado' });

        let newTableStatus;
        let newEventStatus;

        if (action === 'INICIAR') {
            newTableStatus = 'Ocupada';
            newEventStatus = 'Confirmado';
        } else if (action === 'FINALIZAR') {
            newTableStatus = 'Disponible';
            newEventStatus = 'Finalizado';
        } else {
            return res.status(400).json({ success: false, message: 'Acción no válida. Use INICIAR o FINALIZAR' });
        }

        // Actualizar todas las mesas asignadas al evento en un solo paso
        await Table.updateMany(
            { _id: { $in: event.tables } },
            { $set: { availability: newTableStatus } }
        );

        // Actualizar el estado del evento
        event.status = newEventStatus;
        await event.save();

        res.status(200).json({
            success: true,
            message: `Evento ${action === 'INICIAR' ? 'iniciado' : 'finalizado'} con éxito. Mesas marcadas como ${newTableStatus}.`,
            data: {
                eventStatus: event.status,
                tablesUpdated: event.tables.length
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al gestionar la asistencia del evento',
            error: error.message
        });
    }
};