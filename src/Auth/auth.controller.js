'use strict';

import User from '../User/user.model.js';
import { authServiceClient, buildAuthForm, pickField } from '../../helpers/authService.helper.js';

// ─────────────────────────────────────────────
// REGISTER — Crea el usuario en Auth-Service (Postgres) y sincroniza en MongoDB
// ─────────────────────────────────────────────
export const register = async (req, res) => {
    try {
        const { UserName, UserSurname, Username, UserEmail, password, phone } = req.body;

        const form = buildAuthForm({
            UserName,
            UserSurname,
            Username: Username || UserEmail, // fallback si el front no envía username
            Email: UserEmail,
            Password: password,
            Phone: phone,
        });

        const { data } = await authServiceClient.post('/register', form);

        const createdUser = data?.user || data?.User || {};
        const authId = pickField(createdUser, 'id', 'Id', 'userId', 'UserId');

        // Sincronización en MongoDB (perfil local del cliente)
        try {
            await User.create({
                authId,
                UserName,
                UserSurname,
                UserEmail,
                password,        // se hashea via pre-save (uso interno/legado)
                phone,
                role: 'CLIENT',
                isVerified: !data?.emailVerificationRequired && !data?.EmailVerificationRequired,
            });
        } catch (mongoErr) {
            if (mongoErr.code !== 11000) {
                console.error('Error sincronizando usuario en MongoDB:', mongoErr.message);
            }
            // si ya existe en Mongo (11000), no es crítico para el registro
        }

        return res.status(201).json({
            success: true,
            message: data?.message || data?.Message
                || 'Usuario registrado. Por favor, verifica tu correo para activar tu cuenta.',
        });

    } catch (error) {
        const status = error.response?.status;

        if (status === 409) {
            return res.status(400).json({
                success: false,
                message: 'El correo o nombre de usuario ya está registrado',
                error: 'DUPLICATE_EMAIL',
            });
        }

        return res.status(status || 500).json({
            success: false,
            message: error.response?.data?.message
                || error.response?.data?.title
                || 'No se pudo completar el registro. Intenta más tarde.',
        });
    }
};

// ─────────────────────────────────────────────
// LOGIN — Delega la autenticación y firma del JWT al Auth-Service (rol CLIENT)
// ─────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { UserEmail, password } = req.body;

        const form = buildAuthForm({
            EmailOrUsername: UserEmail,
            Password: password,
        });

        const { data } = await authServiceClient.post('/login-client', form);

        const ud = data?.userDetails || data?.UserDetails || {};
        const authId  = pickField(ud, 'id', 'Id', 'userId', 'UserId');
        const role    = pickField(ud, 'role', 'Role') || 'CLIENT';
        const name    = pickField(ud, 'userName', 'UserName');
        const surname = pickField(ud, 'userSurname', 'UserSurname');
        const email   = pickField(ud, 'email', 'Email') || UserEmail;

        // Sincroniza/crea el perfil en MongoDB
        let mongoUser = authId ? await User.findOne({ authId }) : null;

        if (!mongoUser) {
            mongoUser = await User.findOneAndUpdate(
                { UserEmail: email },
                {
                    $set: {
                        authId,
                        UserName: name,
                        UserSurname: surname,
                        UserEmail: email,
                        role: 'CLIENT',
                        isVerified: true,
                    },
                },
                { upsert: true, new: true, setDefaultsOnInsert: true }
            );
        }

        return res.status(200).json({
            success: true,
            token: data?.token || data?.Token,
            userDetails: {
                uid: mongoUser._id,
                authId,
                UserName: name,
                UserSurname: surname,
                UserEmail: email,
                role,
            },
        });

    } catch (error) {
        const status = error.response?.status;
        const msg =
            status === 403 ? 'Acceso denegado. Esta app es exclusiva para clientes.' :
            status === 401 ? 'Correo o contraseña incorrectos' :
            status === 400 ? 'Correo o contraseña incorrectos' :
                             'Error de conexión con el servicio de autenticación.';

        return res.status(status || 500).json({ success: false, message: msg });
    }
};

// ─────────────────────────────────────────────
// FORGOT PASSWORD — Proxy hacia Auth-Service
// ─────────────────────────────────────────────
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const form = buildAuthForm({ Email: email });

        const { data } = await authServiceClient.post('/forgot-password', form);

        return res.status(200).json({
            success: true,
            message: data?.message || data?.Message
                || 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña.',
        });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message: 'No se pudo procesar la solicitud. Intenta más tarde.',
        });
    }
};

// ─────────────────────────────────────────────
// RESET PASSWORD — Proxy hacia Auth-Service
// ─────────────────────────────────────────────
export const resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        const form = buildAuthForm({ Token: token, NewPassword: newPassword });

        const { data } = await authServiceClient.post('/reset-password', form);

        return res.status(200).json({
            success: true,
            message: data?.message || data?.Message || 'Contraseña actualizada correctamente.',
        });
    } catch (error) {
        return res.status(error.response?.status || 500).json({
            success: false,
            message: 'Token inválido o expirado.',
        });
    }
};

// ─────────────────────────────────────────────
// VERIFY EMAIL — se mantiene sin cambios (fuera del alcance de este flujo)
// ─────────────────────────────────────────────
export const verifyEmail = async (req, res) => {
    try {
        const user = req.user;

        if (user.isVerified) {
            return res.status(400).json({ message: 'La cuenta ya está verificada' });
        }

        user.isVerified = true;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Cuenta activada exitosamente. Ya puedes iniciar sesión.'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al verificar' });
    }
};