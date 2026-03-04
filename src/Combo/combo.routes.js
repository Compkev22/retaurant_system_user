import { Router } from 'express';
import {
    getCombos,
    getComboById,
} from './combo.controller.js';

import {
    validateGetComboById
} from '../../middlewares/combo-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';


const router = Router();

router.get('/', validateJWT, getCombos);

router.get('/:id', validateJWT, validateGetComboById, getComboById);




export default router;
