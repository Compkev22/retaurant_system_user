'use strict';

import { Router } from 'express';
import { getOrderDetailsByOrder } from './orderDetail.controller.js';
import { validateOrderIdParam } from '../../middlewares/orderDetail-validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get(
    '/order/:orderId',
    validateJWT,
    hasRole('CLIENT'),
    validateOrderIdParam,
    getOrderDetailsByOrder
);

export default router;