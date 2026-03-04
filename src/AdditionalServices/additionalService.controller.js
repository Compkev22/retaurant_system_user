'use strict';

import AdditionalService from './additionalService.model.js';

//Todos
export const getAdditionalServices = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        const filter = {};
        if (req.user.role === 'CLIENT') {
            filter.status = 'ACTIVE';
        } else if (req.query.status) {
            filter.status = req.query.status;
        }


        const services = await AdditionalService.find(filter)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await AdditionalService.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: services,
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
            message: 'Error al obtener los servicios adicionales',
            error: error.message,
        });
    }
};
