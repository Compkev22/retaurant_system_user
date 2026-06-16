'use strict';

import jwt from 'jsonwebtoken';

export const validateJWT = async (req, res, next) => {
    try {
        const token =
            req.header('x-token') ||
            req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No se proporcionó un token',
                error: 'MISSING_TOKEN',
            });
        }

        // El SECRET_KEY debe ser el mismo que usa el Auth-Service de C#
        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        // Extraemos el ID y el Role inyectados desde el Auth-Service (.NET)
        const userId = decoded.uid || decoded.sub || decoded.id;
        const userRole = decoded.role || 'CLIENT';

        // Saltamos la búsqueda en MongoDB: el ID de Postgres no es un ObjectId válido.
        // La resolución al perfil local (Mongo) se hace por 'authId' donde se necesite.
        req.user = {
            id: userId,
            role: userRole,
        };

        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'El token ha expirado',
                error: 'TOKEN_EXPIRED',
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Token inválido o malformado',
                error: 'INVALID_TOKEN',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Error interno al validar el token',
            error: 'TOKEN_VALIDATION_ERROR',
        });
    }
};