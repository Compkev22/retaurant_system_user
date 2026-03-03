import { Router } from 'express';
import { login, register, verifyEmail } from './auth.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

// Ruta para registrarse
router.post('/register', register);

// verificacion de correo con validacion de token
router.get('/verify-email', [ validateJWT ], verifyEmail);

// Ruta para iniciar sesión
router.post('/login', login);

export default router;