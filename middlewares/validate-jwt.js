'use strict';

import jwt from 'jsonwebtoken';
import User from '../src/User/user.model.js';

export const validateJWT = async (req, res, next) => {

    try {
        const token =
            req.header('x-token') ||
            req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                message: 'No hay token en la petición'
            });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const userId = decoded.uid || decoded.sub;

        if (!userId) {
            return res.status(401).json({
                message: 'Token inválido: sin identificador de usuario'
            });
        }

        // Buscar usuario en MongoDB
        const user = await User.findById(userId);

        if (!user) {
            return res.status(401).json({
                message: 'Token no válido - Usuario inexistente'
            });
        }

        if (user.UserStatus === 'INACTIVE') {
            return res.status(401).json({ message: 'Usuario inactivo' });
        }

        if (user.deletedAt) {
            return res.status(401).json({ message: 'Usuario eliminado' });
        }

        req.user = user;
        next();

    } catch (error) {
        return res.status(401).json({
            message: 'Token no válido o expirado'
        });
    }
};