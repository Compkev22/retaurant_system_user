import { Router } from 'express';
import { updateUser, getProfile } from './user.controller.js';
import { validateUpdateUserRequest } from '../../middlewares/user-validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/profile', validateJWT, hasRole('CLIENT'), getProfile);

router.put(
    '/:id',
    validateJWT,
    hasRole('CLIENT'),
    validateUpdateUserRequest,
    updateUser
);

export default router;