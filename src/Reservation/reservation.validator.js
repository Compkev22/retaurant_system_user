import { body, validationResult } from 'express-validator';

const validateFields = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación en la reservación',
            errors: errors.array()
        });
    }
    next();
};

export const reservationValidator = [

    body('branchId', 'La sucursal es obligatoria')
        .notEmpty()
        .isMongoId(),

    body('clientId', 'El cliente es obligatorio')
        .notEmpty()
        .isMongoId(),

    body('date', 'La fecha es obligatoria')
        .notEmpty()
        .isISO8601()
        .toDate(),

    body('time', 'La hora es obligatoria')
        .notEmpty()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
        .withMessage('La hora debe tener formato HH:mm'),

    body('numberOfPersons', 'Debe indicar la cantidad de personas')
        .notEmpty()
        .isInt({ min: 1 }),

    body('status')
        .optional()
        .isIn(['Confirmada', 'Pendiente', 'Cancelada', 'Completada']),

    body('notes')
        .optional()
        .isString()
        .trim(),

    validateFields
];