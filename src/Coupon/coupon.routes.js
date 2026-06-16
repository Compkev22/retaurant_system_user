'use strict';

import { Router } from 'express';
import {
    getCoupons,
    getCouponById,
    getCouponByCode,
    createCoupon,
    updateCoupon,
    toggleCouponStatus,
} from './coupon.controller.js';

import {
    createCouponValidator,
    updateCouponValidator,
} from '../../middlewares/coupon-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getCoupons);
router.get('/code/:code', validateJWT, hasRole('CLIENT'), getCouponByCode);
router.get('/:id', validateJWT, hasRole('CLIENT'), getCouponById);

router.post('/', validateJWT, hasRole('CLIENT'), createCouponValidator, createCoupon);
router.put('/:id', validateJWT, hasRole('CLIENT'), updateCouponValidator, updateCoupon);
router.patch('/:id/status', validateJWT, hasRole('CLIENT'), toggleCouponStatus);

export default router;