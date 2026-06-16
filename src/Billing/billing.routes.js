'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
} from './billing.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getBillings);
router.get('/:id', validateJWT, hasRole('CLIENT'), getBillingById);

export default router;