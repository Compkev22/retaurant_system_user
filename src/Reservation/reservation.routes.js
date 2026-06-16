import { Router } from 'express';
import { saveReservation, getReservations, updateReservation, toggleReservationStatus } from './reservation.controller.js';
import { reservationValidator } from './reservation.validator.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const api = Router();

api.post('/', validateJWT, hasRole('CLIENT'), reservationValidator, saveReservation);
api.get('/', validateJWT, hasRole('CLIENT'), getReservations);
api.put('/:id', validateJWT, hasRole('CLIENT'), reservationValidator, updateReservation);
api.delete('/:id', validateJWT, hasRole('CLIENT'), toggleReservationStatus);

export default api;