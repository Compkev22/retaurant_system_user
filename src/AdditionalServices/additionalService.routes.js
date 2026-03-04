import { Router } from 'express';
import {
    getAdditionalServices,
} from './additionalService.controller.js';



import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/', validateJWT, getAdditionalServices);



export default router;