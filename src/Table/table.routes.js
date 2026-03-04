'use strict';

import { Router } from 'express';
import { getTables } from './table.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const api = Router();

api.get('/', validateJWT, getTables);


export default api;