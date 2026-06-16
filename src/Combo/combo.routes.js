import { Router } from 'express';
import {
    getCombos,
    getComboById,
} from './combo.controller.js';

import { validateGetComboById } from '../../middlewares/combo-validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getCombos);
router.get('/:id', validateJWT, hasRole('CLIENT'), validateGetComboById, getComboById);

export default router;