import { Router } from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    getProfile,
    changeUserStatus
} from './user.controller.js';

import {
    validateCreateUser,
    validateUpdateUserRequest,
    validateUserStatusChange,
    validateGetUserById
} from '../../middlewares/user-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/', validateJWT, getUsers);
router.get('/:id',validateJWT, validateGetUserById, getUserById);

router.post(
    '/',
    validateJWT,
    validateCreateUser,
    createUser
);

router.get('/profile', getProfile);

router.put(
    '/:id',
    validateJWT,
    validateUpdateUserRequest,
    updateUser
);

// Cambio a PATCH según la instrucción de Milián
router.patch('/:id/status', validateJWT, validateUserStatusChange, changeUserStatus);

export default router;