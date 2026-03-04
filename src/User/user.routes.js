import { Router } from 'express';
import {
    updateUser,
    getProfile,
} from './user.controller.js';

import {
    validateUpdateUserRequest,
} from '../../middlewares/user-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();


router.get('/profile', getProfile);

router.put(
    '/:id',
    validateJWT,
    validateUpdateUserRequest,
    updateUser
);


export default router;