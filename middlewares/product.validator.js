import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateProduct = [
    body('nombre')
        .trim()
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ max: 100 }),

    body('categoria')
        .trim()
        .notEmpty().withMessage('La categoría es requerida'),

    body('precio')
        .notEmpty().withMessage('El precio es requerido')
        .isFloat({ min: 0 }).withMessage('El precio debe ser un número positivo'),

    body('imagen_url')
        .optional()
        .isString().withMessage('URL de imagen no válida'),

    body('estado')
        .optional()
        .isIn(['Disponible', 'Agotado', 'Descontinuado']).withMessage('Estado no válido'),

    checkValidators
];

export const validateProductId = [
    param('id').isMongoId().withMessage('ID de producto no válido'),
    checkValidators
];