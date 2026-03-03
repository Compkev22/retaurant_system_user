import { Router } from 'express';
import {
    saveInventory,
    getInventory,
    updateInventory,
    deleteInventory
} from './inventory.controller.js';
import { inventoryValidator, updateInventoryValidator } from '../../middlewares/inventory-validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
const api = Router();

api.post('/', validateJWT, inventoryValidator, saveInventory);
api.get('/', validateJWT, getInventory);
// Vamos a usar el estándar: solo el ID para editar y eliminar
api.put('/:id', validateJWT, updateInventoryValidator, updateInventory);
api.patch('/:id/status', validateJWT, deleteInventory);
export default api;
