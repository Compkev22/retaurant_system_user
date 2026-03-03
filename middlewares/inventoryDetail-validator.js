'use strict';

import { body } from 'express-validator';
import { checkValidators } from './check.validators.js'; // Verifica si tu archivo se llama validate.errors.js o check.validators.js

export const saveDetalleInventarioValidator = [
    body('productId', 'El ID del producto es requerido').notEmpty().isMongoId(),
    body('inventoryId', 'El ID del insumo es requerido').notEmpty().isMongoId(),
    body('cantidadUsada', 'La cantidad usada debe ser un número positivo').notEmpty().isNumeric(),
    checkValidators
];