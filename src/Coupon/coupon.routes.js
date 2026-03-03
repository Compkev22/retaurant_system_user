'use strict';

import { Router } from 'express';
import { 
    createCoupon, 
    getCoupons, 
    updateCoupon, 
    deleteCoupon 
} from './coupon.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { createCouponValidator } from '../../middlewares/coupon-validator.js';

const router = Router();

// Middleware global: Autenticación y Rol
router.use(validateJWT);
router.use(hasRole('PLATFORM_ADMIN')); 


// POST - Crear 
router.post('/', [createCouponValidator], createCoupon);

// GET - Listar
router.get('/', getCoupons);

// PUT - Actualizar datos generales
router.put('/:id', updateCoupon);

/**
 * PATCH - Borrado Lógico o Desactivación
 */
router.patch('/:id/status', deleteCoupon);

export default router;