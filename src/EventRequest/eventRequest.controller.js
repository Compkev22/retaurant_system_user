'use strict';

import EventRequest from './eventRequest.model.js';
import User from '../User/user.model.js';

// GET /event-requests — el cliente ve sus propias solicitudes
export const getMyEventRequests = async (req, res) => {
    try {
        const localUser = await User.findOne({ authId: req.user.id });
        if (!localUser) return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });

        const requests = await EventRequest.find({ clientId: localUser._id })
            .populate('branchId', 'name zone')
            .populate('additionalServices.additionalServiceId', 'name price')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: requests });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener solicitudes.', error: error.message });
    }
};

// POST /event-requests — el cliente crea una solicitud
export const createEventRequest = async (req, res) => {
    try {
        const { branchId, name, eventDate, startTime, endTime, numberOfPersons, additionalServices, notes } = req.body;

        const localUser = await User.findOne({ authId: req.user.id });
        if (!localUser) return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });

        const clientId = localUser._id;

        // Límite de 5 solicitudes activas
        const activeCount = await EventRequest.countDocuments({
            clientId,
            status: { $in: ['Pendiente', 'Aceptada'] }
        });

        if (activeCount >= 5) {
            return res.status(400).json({
                success: false,
                message: 'Has alcanzado el límite de 5 solicitudes de evento activas. Espera a que alguna se resuelva para crear otra.'
            });
        }

        const newRequest = new EventRequest({
            branchId,
            clientId,
            name,
            eventDate: new Date(eventDate),
            startTime,
            endTime,
            numberOfPersons,
            additionalServices: additionalServices || [],
            notes
        });

        await newRequest.save();

        res.status(201).json({
            success: true,
            message: 'Solicitud de evento enviada. El administrador la revisará pronto.',
            data: newRequest
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear la solicitud.', error: error.message });
    }
};

// DELETE /event-requests/:id — el cliente cancela si sigue Pendiente
export const cancelEventRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const localUser = await User.findOne({ authId: req.user.id });
        if (!localUser) return res.status(401).json({ success: false, message: 'Usuario no encontrado.' });

        const request = await EventRequest.findById(id);
        if (!request) return res.status(404).json({ success: false, message: 'Solicitud no encontrada.' });

        if (request.clientId.toString() !== localUser._id.toString()) {
            return res.status(403).json({ success: false, message: 'No autorizado.' });
        }

        if (request.status !== 'Pendiente') {
            return res.status(400).json({
                success: false,
                message: 'Solo puedes cancelar solicitudes en estado Pendiente.'
            });
        }

        request.status = 'Rechazada';
        await request.save();

        res.status(200).json({ success: true, message: 'Solicitud cancelada.', data: request });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al cancelar la solicitud.', error: error.message });
    }
};