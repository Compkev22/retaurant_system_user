import { Router } from 'express';
import {
    getCombos,
    getComboById,
    createCombo,
    updateCombo,
    changeComboStatus
} from './combo.controller.js';

import {
    validateCreateCombo,
    validateUpdateComboRequest,
    validateComboStatusChange,
    validateGetComboById
} from '../../middlewares/combo-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';


const router = Router();

router.get('/', validateJWT, getCombos);

router.get('/:id', validateJWT, validateGetComboById, getComboById);

router.post(
    '/',
    validateJWT,
    validateCreateCombo,
    createCombo
);

router.put(
    '/:id',
    validateJWT,
    validateUpdateComboRequest,
    updateCombo
);

router.patch(
    '/:id/status',
    validateJWT,
    validateComboStatusChange,
    changeComboStatus
);


export default router;
