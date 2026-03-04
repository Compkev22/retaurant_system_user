'use strict';

import { Router } from 'express';
import {
    createOrderRequest,
    getMyOrderRequests,
    cancelOrderRequest
} from './orderRequest.controller.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import {
    validateCreateOrderRequest,
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


export default router;