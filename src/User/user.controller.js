'use strict';

import User from './user.model.js';

/* PERFIL DEL USUARIO LOGUEADO (Mongo, vinculado por authId) */
export const getProfile = async (req, res) => {
    try {
        const profile = await User.findOne({ authId: req.user.id });

        if (!profile) {
            return res.status(404).json({ success: false, message: 'Perfil no encontrado' });
        }

        res.status(200).json({ success: true, user: profile });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el perfil' });
    }
};

/* ACTUALIZAR PERFIL DEL CLIENTE AUTENTICADO */
export const updateUser = async (req, res) => {
    try {
        const allowedFields = ['UserName', 'UserSurname', 'phone'];
        const updates = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) updates[field] = req.body[field];
        }

        const user = await User.findOneAndUpdate(
            { authId: req.user.id },
            updates,
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            success: true,
            message: 'Perfil actualizado correctamente',
            data: user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error actualizando el perfil',
            error: error.message
        });
    }
};

/* SINCRONIZA / CREA EL PERFIL LOCAL (Mongo) TRAS LOGIN EN AUTH-SERVICE */
export const syncProfile = async (req, res) => {
    try {
        const { UserName, UserSurname, UserEmail, phone } = req.body;
        const authId = req.user.id; // viene del JWT validado (Auth-Service)

        const profile = await User.findOneAndUpdate(
            { authId },
            {
                $set: {
                    UserName,
                    UserSurname,
                    UserEmail,
                    phone,
                    role: 'CLIENT',
                    isVerified: true,
                },
                $setOnInsert: { authId, UserCreatedAt: new Date() },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ success: true, data: profile });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al sincronizar el perfil',
            error: error.message,
        });
    }
};