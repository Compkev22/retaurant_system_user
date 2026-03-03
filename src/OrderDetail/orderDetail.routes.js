'use strict';

import { Router } from 'express';
import {
    createOrderDetail,
    getOrderDetailsByOrder,
    updateOrderDetail,
    deleteOrderDetail
} from './orderDetail.controller.js';

import {
    validateCreateOrderDetail,
    validateUpdateOrderDetail,
    validateOrderIdParam,
    validateOrderDetailIdParam
} from '../../middlewares/orderDetail-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

// Crear item de orden
router.post(
    '/',
    validateJWT,
    validateCreateOrderDetail,
    createOrderDetail
);

// Obtener items por orden
router.get(
    '/order/:orderId',
    validateJWT,
    validateOrderIdParam,
    getOrderDetailsByOrder
);

// Actualizar item
router.put(
    '/:id',
    validateJWT,
    validateUpdateOrderDetail,
    updateOrderDetail
);

// Eliminar item
router.delete(
    '/:id',
    validateJWT,
    validateOrderDetailIdParam,
    deleteOrderDetail
);

export default router;
