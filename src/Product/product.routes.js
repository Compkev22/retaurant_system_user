'use strict';

import { Router } from 'express';
import { getProducts } from './product.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';


const router = Router();

router.get('/', validateJWT, getProducts);
export default router;