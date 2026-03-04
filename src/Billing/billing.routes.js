'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
} from './billing.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

// --- RUTAS PROTEGIDAS POR JWT ---

// Obtener todas las facturas (Admin/Empleado ve todas, Customer solo las suyas)
router.get('/', validateJWT, getBillings);

// Obtener una factura específica
router.get('/:id', validateJWT, getBillingById);


export default router;