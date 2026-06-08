'use strict';

import { Router } from 'express';
import { getOrders, getOrderById } from '../Order/order.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

// Un cliente solo ve sus propias órdenes (el controller filtra por req.user._id)
router.get('/', validateJWT, hasRole('CLIENT', 'PLATFORM_ADMIN'), getOrders);
router.get('/:id', validateJWT, hasRole('CLIENT', 'PLATFORM_ADMIN'), getOrderById);

export default router;