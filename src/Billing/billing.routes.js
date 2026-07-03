'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
    getBillingByOrder,
    sendInvoice,
} from './billing.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getBillings);
router.get('/order/:orderId', validateJWT, hasRole('CLIENT'), getBillingByOrder);
router.get('/:id', validateJWT, hasRole('CLIENT'), getBillingById);
router.post('/send-invoice/:orderId', validateJWT, hasRole('CLIENT'), sendInvoice);

export default router;