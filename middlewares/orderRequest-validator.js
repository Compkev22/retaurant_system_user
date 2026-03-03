'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from './check.validators.js';

// enums del modelo
const allowedOrderTypes = ['TAKEAWAY', 'DELIVERY'];

const allowedStatuses = [
    'Pendiente',
    'En Preparacion',
    'Listo',
    'Entregado',
    'Cancelado'
];

/**
 * Crear OrderRequest
 * Solo cliente puede crearlo
 */
export const validateCreateOrderRequest = [

    body('branch')
        .notEmpty().withMessage('branch es obligatorio')
        .isMongoId().withMessage('branch inválido'),

    body('orderType')
        .notEmpty().withMessage('orderType es obligatorio')
        .isIn(allowedOrderTypes)
        .withMessage('Tipo de pedido inválido'),

    // Validación condicional
    body().custom((body, { req }) => {

        // Solo clientes pueden crear OrderRequest
        if (req.user?.role !== 'CLIENT' && req.user?.role !== 'PLATFORM_ADMIN') {
            throw new Error('Solo clientes pueden crear un OrderRequest');
        }

        // Si es DELIVERY, requiere dirección
        if (body.orderType === 'DELIVERY' && !body.deliveryAddress) {
            throw new Error('deliveryAddress es requerido para DELIVERY');
        }

        return true;
    }),

    checkValidators
];


/**
 * Actualizar estado de OrderRequest
 * (Empleado o Admin normalmente)
 */
export const validateUpdateOrderRequestStatus = [

    param('id')
        .isMongoId().withMessage('ID inválido'),

    body('orderStatus')
        .notEmpty().withMessage('orderStatus es obligatorio')
        .isIn(allowedStatuses)
        .withMessage('Estado inválido'),

    checkValidators
];