// src/Branch/branch.routes.js
'use strict';

import { Router } from 'express';
import {
    getBranches,
} from './branch.controller.js';


import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/', validateJWT, getBranches);

export default router;