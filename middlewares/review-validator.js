'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

/* =========================================
   ENUMS / REGLAS
========================================= */

const MIN_RATING = 1;
const MAX_RATING = 5;


/* =========================================
   VALIDAR CREAR RESEÑA
========================================= */

export const validateCreateReview = [

    body('rating')
        .notEmpty().withMessage('rating es obligatorio')
        .isInt({ min: MIN_RATING, max: MAX_RATING })
        .withMessage(`rating debe estar entre ${MIN_RATING} y ${MAX_RATING}`),

    body('comment')
        .optional()
        .isString().withMessage('comment debe ser texto')
        .isLength({ max: 500 })
        .withMessage('comment no puede superar los 500 caracteres')
        .trim(),

    // impedir que envíen campos que no deben modificarse
    body('customer').not().exists()
        .withMessage('No puedes definir el customer manualmente'),

    body('branch').not().exists()
        .withMessage('No puedes definir la branch manualmente'),

    body('order').not().exists()
        .withMessage('No puedes definir la order manualmente'),

    body('isDeleted').not().exists()
        .withMessage('No puedes modificar isDeleted'),

    checkValidators
];


/* =========================================
   VALIDAR ACTUALIZAR RESEÑA
========================================= */

export const validateUpdateReview = [

    param('id')
        .isMongoId().withMessage('ID inválido'),

    body('rating')
        .optional()
        .isInt({ min: MIN_RATING, max: MAX_RATING })
        .withMessage(`rating debe estar entre ${MIN_RATING} y ${MAX_RATING}`),

    body('comment')
        .optional()
        .isString().withMessage('comment debe ser texto')
        .isLength({ max: 500 })
        .withMessage('comment no puede superar los 500 caracteres')
        .trim(),

    // bloquear campos sensibles
    body('customer').not().exists()
        .withMessage('No puedes modificar el customer'),

    body('order').not().exists()
        .withMessage('No puedes modificar la order'),

    body('branch').not().exists()
        .withMessage('No puedes modificar la branch'),

    body('isDeleted').not().exists()
        .withMessage('No puedes modificar isDeleted manualmente'),

    checkValidators
];


/* =========================================
   VALIDAR ELIMINAR RESEÑA
========================================= */

export const validateDeleteReview = [

    param('id')
        .isMongoId().withMessage('ID inválido'),

    checkValidators
];