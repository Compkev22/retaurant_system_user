'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from '../../middlewares/check.validators.js';

const isWithinTimeRange = (value) => {
    const [hours, minutes] = value.split(':').map(Number);
    const timeInMinutes = hours * 60 + minutes;
    if (timeInMinutes < 7 * 60 || timeInMinutes > 22 * 60) {
        throw new Error('El horario debe estar entre las 07:00 y las 22:00');
    }
    return true;
};

export const validateCreateEventRequest = [
    body('branchId').notEmpty().isMongoId().withMessage('Sucursal inválida'),
    body('name').trim().notEmpty().isLength({ max: 100 }).withMessage('Nombre requerido, máximo 100 caracteres'),
    body('eventDate')
        .notEmpty().isISO8601().toDate()
        .custom((value) => {
            const minDate = new Date();
            minDate.setMonth(minDate.getMonth() + 1);
            minDate.setHours(0, 0, 0, 0);
            if (value < minDate) throw new Error('La fecha debe ser al menos con 1 mes de anticipación');
            return true;
        }),
    body('startTime').notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).custom(isWithinTimeRange),
    body('endTime')
        .notEmpty().matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).custom(isWithinTimeRange)
        .custom((value, { req }) => {
            if (value <= req.body.startTime) throw new Error('La hora de fin debe ser posterior a la de inicio');
            return true;
        }),
    body('numberOfPersons').notEmpty().isInt({ min: 1 }).withMessage('Mínimo 1 persona'),
    body('notes').optional().trim().isLength({ max: 500 }),
    checkValidators,
];

export const validateEventRequestId = [
    param('id').isMongoId().withMessage('ID inválido'),
    checkValidators,
];