'use strict';

import { Router } from 'express';
import { saveTable, getTables, updateTable, changeTableStatus } from './table.controller.js';
import { tableValidator } from './table.validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const api = Router();

api.post('/', validateJWT, tableValidator, saveTable);
api.get('/', validateJWT, getTables);
// Usamos PATCH para el estado
api.put('/:id', validateJWT, tableValidator, updateTable);
api.patch('/:id/status', validateJWT, changeTableStatus);

export default api;