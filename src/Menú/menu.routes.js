import { Router } from 'express';
import { getMenu } from './menu.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const api = Router();

api.get('/', validateJWT, hasRole('CLIENT'), getMenu);

export default api;