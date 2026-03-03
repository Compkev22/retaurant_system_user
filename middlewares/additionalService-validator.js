import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

// Validar creación de servicio adicional
export const validateCreateAdditionalService = [
    body('Name')
        .trim()
        .notEmpty()
        .withMessage('El nombre del servicio es obligatorio')
        .isLength({ max: 100 })
        .withMessage('El nombre no puede exceder los 100 caracteres'),

    body('Description')
        .trim()
        .notEmpty()
        .withMessage('La descripción es obligatoria')
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder los 500 caracteres'),

    body('AdditionalPrice')
        .notEmpty()
        .withMessage('El precio adicional es obligatorio')
        .isFloat({ gt: 0 })
        .withMessage('El precio adicional debe ser un número mayor a 0'),

    checkValidators,
];

// Validar actualización de servicio adicional
export const validateUpdateAdditionalService = [
    param('id')
        .isMongoId()
        .withMessage('El ID debe ser válido'),

    body('Name')
        .optional()
        .trim()
        .isLength({ max: 100 })
        .withMessage('El nombre no puede exceder los 100 caracteres'),

    body('Description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('La descripción no puede exceder los 500 caracteres'),

    body('AdditionalPrice')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage('El precio adicional debe ser un número mayor a 0'),

    checkValidators,
];

// Validar cambio de estado
export const validateAdditionalServiceStatusChange = [
    param('id')
        .isMongoId()
        .withMessage('El ID debe ser válido'),

    checkValidators,
];