'use strict';

import { body, param } from 'express-validator';
import Order from '../src/Order/order.model.js';
import { checkValidators } from './check.validators.js';

/*
=====================================
Estados permitidos
=====================================
*/
const allowedStatuses = [
    'Pendiente',
    'En Preparacion',
    'Listo',
    'Entregado',
    'Cancelado',
    'Finalizada'
];

/*
=====================================
Flujo válido de estados
=====================================
*/
const allowedTransitions = {
    Pendiente: ['En Preparacion', 'Cancelado'],
    'En Preparacion': ['Listo'],
    Listo: ['Entregado'],
    Entregado: ['Finalizada'],
    Cancelado: [],
    Finalizada: []
};

/*
=====================================
Tipos de orden permitidos
=====================================
*/
const allowedOrderTypes = [
    'DINE_IN',
    'PICKUP',
    'DELIVERY'
];

/*
=====================================
VALIDAR CREACIÓN DE ORDEN
=====================================
*/
export const validateCreateOrder = [

    /* ===============================
       ORDER TYPE
    =============================== */
    body('orderType')
        .notEmpty().withMessage('orderType es obligatorio')
        .isIn(allowedOrderTypes)
        .withMessage('Tipo de orden inválido'),

    /* ===============================
       BRANCH
    =============================== */
    body('branchId')
        .notEmpty().withMessage('branchId es obligatorio')
        .isMongoId().withMessage('branchId inválido'),

    /* ===============================
       ESTADO OPCIONAL
    =============================== */
    body('estado')
        .optional()
        .isIn(allowedStatuses)
        .withMessage('Estado inválido'),

    /* ===============================
       VALIDACIONES CONDICIONALES
    =============================== */
    body().custom((body) => {

        /*
        DINE_IN:
        - requiere mesa
        - empleado se toma del JWT (NO del body)
        */
        if (body.orderType === 'DINE_IN') {

            if (!body.mesaId) {
                throw new Error('mesaId requerido para DINE_IN');
            }
        }

        /*
        DELIVERY:
        - requiere dirección
        */
        if (body.orderType === 'DELIVERY') {

            if (!body.deliveryAddress) {
                throw new Error('deliveryAddress requerido para DELIVERY');
            }
        }

        return true;
    }),

    checkValidators
];

/*
=====================================
VALIDAR CAMBIO DE ESTADO
=====================================
*/
export const validateUpdateStatus = [

    param('id')
        .isMongoId()
        .withMessage('ID de orden inválido'),

    body('estado')
        .isIn(allowedStatuses)
        .withMessage('Estado inválido'),

    /*
    Validar transición correcta
    */
    body('estado').custom(async (newStatus, { req }) => {

        const order = await Order.findById(req.params.id);

        if (!order) {
            throw new Error('Orden no encontrada');
        }

        const currentStatus = order.estado;
        const validNextStatuses =
            allowedTransitions[currentStatus] || [];

        if (!validNextStatuses.includes(newStatus)) {
            throw new Error(
                `Transición inválida: ${currentStatus} → ${newStatus}`
            );
        }

        return true;
    }),

    checkValidators
];