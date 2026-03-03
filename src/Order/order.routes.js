'use strict';

import { Router } from 'express';
import {
    getOrders,
    getOrderById,
    createOrder,
    updateOrder,
    changeOrderStatus
} from '../Order/order.controller.js';

import {
    validateCreateOrder,
    validateUpdateStatus
} from '../../middlewares/order.validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

/* 
   RUTAS PÚBLICAS / CONSULTA
*/
router.get('/', getOrders);
router.get('/:id', getOrderById);

/* 
   CREAR ORDEN (DINE_IN SOLO EMPLEADO)
*/
router.post(
    '/',
    validateJWT,           // primero autenticación
    hasRole('EMPLOYEE','BRANCH_ADMIN',"PLATFORM_ADMIN"),    // solo empleados pueden crear
    validateCreateOrder,    // valida datos del body
    createOrder             // controller crea la orden
);

/*
   ACTUALIZAR ORDEN
*/
router.put(
    '/:id',
    validateJWT,
    hasRole('EMPLOYEE','BRANCH_ADMIN',"PLATFORM_ADMIN"), // solo personal autorizado puede actualizar
    updateOrder
);

/* 
   CAMBIAR ESTADO
*/
router.patch(
    '/:id/status',
    validateJWT,
    hasRole('EMPLOYEE', 'BRANCH_ADMIN',"PLATFORM_ADMIN"), // roles permitidos
    validateUpdateStatus,
    changeOrderStatus
);

export default router;