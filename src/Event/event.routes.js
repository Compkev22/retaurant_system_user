import { Router } from 'express';
import {
    getEvents,
    getEventById,
    createEvent,

} from './event.controller.js';

import {
    validateGetEventById,
    validateCreateEvent,

} from '../../middlewares/event-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/', validateJWT, getEvents);

router.get(
    '/:id',
    validateJWT,
    validateGetEventById,
    getEventById
);

router.post(
    '/',
    validateJWT,
    validateCreateEvent,
    createEvent
);



export default router;
