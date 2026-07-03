'use strict';

import { Router } from 'express';
import {
    getMyEventRequests,
    createEventRequest,
    cancelEventRequest,
} from './eventRequest.controller.js';
import { validateCreateEventRequest, validateEventRequestId } from './eventRequest.validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('CLIENT'), getMyEventRequests);
router.post('/', validateJWT, hasRole('CLIENT'), validateCreateEventRequest, createEventRequest);
router.delete('/:id', validateJWT, hasRole('CLIENT'), validateEventRequestId, cancelEventRequest);

export default router;