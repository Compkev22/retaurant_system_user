'use strict';

import jwt from 'jsonwebtoken';
import User from '../src/User/user.model.js';

export const validateJWT = async (req, res, next) => {

    try {

        // Obtener token
        const token =
            req.header('x-token') ||
            req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: 'No hay token en la petición'
            });
        }

        // Verificar token
        const { uid } = jwt.verify(token, process.env.SECRET_KEY);

        // Buscar usuario
        const user = await User.findById(uid);

        if (!user) {
            return res.status(401).json({
                message: 'Token no válido - Usuario inexistente'
            });
        }

        // Validaciones de seguridad
        if (user.UserStatus === 'INACTIVE') {
            return res.status(401).json({
                message: 'Usuario inactivo'
            });
        }

        if (user.deletedAt) {
            return res.status(401).json({
                message: 'Usuario eliminado'
            });
        }

        // Adjuntar usuario a la request
        req.user = user;

        next();

    } catch (error) {

        return res.status(401).json({
            message: 'Token no válido o expirado'
        });
    }
};