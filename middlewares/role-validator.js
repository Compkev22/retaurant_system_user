'use strict';

export const hasRole = (...roles) => {

    return (req, res, next) => {

        if (!req.user) {
            return res.status(500).json({
                message: 'validateJWT debe ejecutarse primero'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Acceso denegado. Roles permitidos: ${roles.join(', ')}`
            });
        }

        next();
    };
};