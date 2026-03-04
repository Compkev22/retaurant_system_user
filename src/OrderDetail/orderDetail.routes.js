'use strict';

import { Router } from 'express';
import {
    getOrderDetailsByOrder,
} from './orderDetail.controller.js';

import {
    validateOrderIdParam,

} from '../../middlewares/orderDetail-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();



// Obtener items por orden
router.get(
    '/order/:orderId',
    validateJWT,
    validateOrderIdParam,
    getOrderDetailsByOrder
);



export default router;
