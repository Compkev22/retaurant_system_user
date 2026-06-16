import { Router } from 'express';
import { getAdditionalServices } from './additionalService.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getAdditionalServices);

export default router;