import { Router } from 'express';
import {
    getAdditionalServices,
    createAdditionalService,
    updateAdditionalService,
    changeAdditionalServiceStatus
} from './additionalService.controller.js';

import {
    validateCreateAdditionalService,
    validateUpdateAdditionalService,
    validateAdditionalServiceStatusChange
} from '../../middlewares/additionalService-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/', validateJWT, getAdditionalServices);

router.post(
    '/',
    validateJWT,
    validateCreateAdditionalService,
    createAdditionalService
);

router.put(
    '/:id',
    validateJWT,
    validateUpdateAdditionalService,
    updateAdditionalService
);

router.patch(
    '/:id/status',
    validateJWT,
    validateAdditionalServiceStatusChange,
    changeAdditionalServiceStatus
);

export default router;