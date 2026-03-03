'use strict';

import { Router } from 'express';
import {
    getBillings,
    getBillingById,
    createBilling,
    payBilling
} from './billing.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

// --- RUTAS PROTEGIDAS POR JWT ---

// Obtener todas las facturas (Admin/Empleado ve todas, Customer solo las suyas)
router.get('/', validateJWT, getBillings);

// Obtener una factura específica
router.get('/:id', validateJWT, getBillingById);

// Crear factura (Solo clientes o empleados)
router.post('/', [validateJWT, hasRole('BRANCH_ADMIN', 'EMPLOYEE', 'PLATFORM_ADMIN')], createBilling);

// Pagar y finalizar ciclo (Solo empleados/admin usualmente procesan el pago)
router.patch('/pay/:id', [validateJWT, hasRole('EMPLOYEE', 'BRANCH_ADMIN','PLATFORM_ADMIN')], payBilling);

export default router;