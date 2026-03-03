import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateEmploye = [
    body('employeId')
        .notEmpty().withMessage('El ID de empleado es requerido')
        .isNumeric().withMessage('El ID debe ser un valor numérico'),

    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ max: 100 }),

    body('dpi')
        .notEmpty().withMessage('El DPI es requerido')
        .isNumeric().withMessage('El DPI debe contener solo números')
        .isLength({ min: 13, max: 13 }).withMessage('El DPI debe tener 13 dígitos'),

    body('cargo')
        .trim()
        .notEmpty().withMessage('El cargo es requerido'),

    body('salario')
        .notEmpty().withMessage('El salario es requerido')
        .isFloat({ min: 0 }).withMessage('El salario debe ser un número positivo'),

    checkValidators
];

export const validateEmployeId = [
    param('id').isMongoId().withMessage('ID de registro no válido'),
    checkValidators
];