'use strict';

import { Router } from 'express';
import { getProducts } from './product.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getProducts);
export default router;