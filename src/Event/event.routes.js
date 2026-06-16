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
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getEvents);

router.get(
    '/:id',
    validateJWT,
    hasRole('CLIENT'),
    validateGetEventById,
    getEventById
);

router.post(
    '/',
    validateJWT,
    hasRole('CLIENT'),
    validateCreateEvent,
    createEvent
);

export default router;