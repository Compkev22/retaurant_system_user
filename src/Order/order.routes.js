'use strict';

import { Router } from 'express';
import {
    getOrders,
    getOrderById,

} from '../Order/order.controller.js';




const router = Router();

/* 
   RUTAS PÚBLICAS / CONSULTA
*/
router.get('/', getOrders);
router.get('/:id', getOrderById);


export default router;