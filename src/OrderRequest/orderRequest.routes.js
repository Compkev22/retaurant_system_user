'use strict';

import { Router } from 'express';
import {
    createOrderRequest,
    getMyOrderRequests,
    getBranchOrderRequests,
    updateOrderRequestStatus,
    cancelOrderRequest
} from './orderRequest.controller.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import {
    validateCreateOrderRequest,
    validateUpdateOrderRequestStatus
} from '../../middlewares/orderRequest-validator.js';

const router = Router();

//---------------------------------------------------
// CLIENTES
// Crear pedido
router.post(
    '/',
    validateJWT,
    hasRole('CLIENT', 'EMPLOYEE','PLATFORM_ADMIN'), // CLIENT para PICKUP/DELIVERY, EMPLOYEE para LOCAL
    validateCreateOrderRequest,
    createOrderRequest
);
// Ver mis pedidos
router.get(
    '/mine',
    validateJWT,
    hasRole('CLIENT'),
    getMyOrderRequests
);
// Cancelar pedido
router.put(
    '/cancel/:id',
    validateJWT,
    hasRole('CLIENT'),
    cancelOrderRequest
);
// ----------------------------------------------
// PERSONAL RESTAURANTE

// Ver pedidos por sucursal
router.get(
    '/branch/:branchId',
    validateJWT,
    hasRole('EMPLOYEE', 'BRANCH_ADMIN', 'PLATFORM_ADMIN'),
    getBranchOrderRequests
);
// Cambiar estado del pedido
router.patch(
    '/:id/status',
    validateJWT,
    hasRole('EMPLOYEE', 'BRANCH_ADMIN','PLATFORM_ADMIN'),
    validateUpdateOrderRequestStatus,
    updateOrderRequestStatus
);

export default router;