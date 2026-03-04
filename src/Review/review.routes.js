'use strict';

import { Router } from 'express';
import {
    createReview,
    getMyReviews,
    updateReview,
    deleteReview
} from './review.controller.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

import {
    validateCreateReview,
    validateUpdateReview,
    validateDeleteReview
} from '../../middlewares/review-validator.js';

const router = Router();

/* =========================================
   CLIENTES
========================================= */

// Soft Delete (PATCH)
router.patch(
    '/:id/status',
    validateJWT,
    hasRole('CLIENT','BRANCH_ADMIN', 'PLATFORM_ADMIN'),
    validateDeleteReview,
    deleteReview
);

// Crear reseña
router.post(
    '/',
    validateJWT,
    hasRole('CLIENT'),
    validateCreateReview,
    createReview
);

// Ver mis reseñas
router.get(
    '/mine',
    validateJWT,
    hasRole('CLIENT'),
    getMyReviews
);

// Actualizar reseña
router.put(
    '/:id',
    validateJWT,
    hasRole('CLIENT'),
    validateUpdateReview,
    updateReview
);






export default router;