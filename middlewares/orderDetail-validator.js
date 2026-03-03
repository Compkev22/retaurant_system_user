'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

export const validateCreateOrderDetail = [
    body('order')
        .notEmpty().withMessage('order es obligatorio')
        .isMongoId().withMessage('order inválido'),

    body('productoId')
        .optional()
        .isMongoId().withMessage('productoId inválido'),

    body('comboId')
        .optional()
        .isMongoId().withMessage('comboId inválido'),

    body()
        .custom(body => {
            if (!body.productoId && !body.comboId) {
                throw new Error('Debe enviarse productoId o comboId');
            }
            if (body.productoId && body.comboId) {
                throw new Error('Solo puede enviarse productoId o comboId, no ambos');
            }
            return true;
        }),

    body('cantidad')
        .notEmpty().withMessage('cantidad es obligatoria')
        .isInt({ min: 1 }).withMessage('cantidad debe ser mayor a 0'),


    checkValidators
];

export const validateUpdateOrderDetail = [
    param('id')
        .isMongoId().withMessage('ID de item inválido'),

    body('cantidad')
        .optional()
        .isInt({ min: 1 }).withMessage('cantidad inválida'),


    checkValidators
];

export const validateOrderIdParam = [
    param('orderId')
        .isMongoId().withMessage('ID de orden inválido'),

    checkValidators
];

export const validateOrderDetailIdParam = [
    param('id')
        .isMongoId().withMessage('ID de item inválido'),

    checkValidators
];
