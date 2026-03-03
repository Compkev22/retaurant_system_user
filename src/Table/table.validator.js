import { body, validationResult } from 'express-validator';

const validateFields = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }
    next();
};

export const tableValidator = [
    body('numberTable')
        .optional()
        .isInt({ min: 1 }).withMessage('El número de mesa debe ser un número positivo'),
    body('capacity', 'La capacidad debe ser al menos para 1 persona').isInt({ min: 1 }),
    validateFields
];