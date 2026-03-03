'use strict';
import jwt from 'jsonwebtoken';

export const generateJWT = (uid, email, role) => {
    return new Promise((resolve, reject) => {
        const payload = { uid, email, role };

        jwt.sign(payload, process.env.SECRET_KEY, {
            expiresIn: '4h' // El token dura 4 horas
        }, (err, token) => {
            if (err) {
                console.log(err);
                reject('No se pudo generar el token');
            } else {
                resolve(token);
            }
        });
    });
};