'use strict';

import { body } from 'express-validator';
import { checkValidators } from './check.validators.js'; 

export const createCouponValidator = [
    body('code', 'El código es obligatorio')
        .notEmpty()
        .isString()
        .trim()
        .isLength({ min: 3, max: 15 })
        .withMessage('El código debe tener entre 3 y 15 caracteres'),
    
    body('discountPercentage', 'El porcentaje debe ser un número entre 1 y 100')
        .notEmpty()
        .isFloat({ min: 1, max: 100 }),
        
    body('expirationDate', 'Debe ser una fecha válida y futura')
        .notEmpty()
        .isISO8601() // Valida formato YYYY-MM-DD
        .toDate()
        .custom((value) => {
            if (value < new Date()) {
                throw new Error('La fecha de expiración no puede ser en el pasado');
            }
            return true;
        }),

    body('usageLimit', 'El límite de uso debe ser un número entero mayor a 0')
        .notEmpty()
        .isInt({ min: 1 }),

    body('description', 'La descripción no puede exceder los 100 caracteres')
        .optional()
        .isString()
        .isLength({ max: 100 }),

    checkValidators 
];