'use strict';

import User from './user.model.js';
import { generateJWT } from '../../helpers/generate-jwt.js';

/* OBTENER USUARIOS*/
export const getUsers = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }


        const { role, UserStatus } = req.query;

        const filter = {};
        if (req.user.role === 'BRANCH_ADMIN') {
            filter.role = { $in: ['EMPLOYEE', 'CLIENT'] };
            if (role && !['EMPLOYEE', 'CLIENT'].includes(role)) {
                return res.status(403).json({ success: false, message: 'No puede ver administradores' });
            }
            if (role) filter.role = role;
        } else {
            if (role) filter.role = role;
        }

        if (UserStatus) filter.UserStatus = UserStatus;

        const users = await User.find(filter).select('-password');

        res.status(200).json({
            success: true,
            data: users
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuarios',
            error: error.message
        });
    }
};

/* OBTENER USUARIO POR ID*/
export const getUserById = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;

        const user = await User.findById(id).select('-password');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }

        if (req.user.role === 'BRANCH_ADMIN' && !['EMPLOYEE', 'CLIENT'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener usuario',
            error: error.message
        });
    }
};

/* CREAR USUARIO*/
export const createUser = async (req, res) => {
    try {

        const creator = req.user;
        let { role, ...data } = req.body;

        if (!creator) {
            return res.status(401).json({
                message: 'No autenticado'
            });
        }

        /* ===== CONTROL DE ROLES ===== */
        switch (creator.role) {

            case 'PLATFORM_ADMIN':
                break;

            case 'BRANCH_ADMIN':
                //Solo puede crear Empleado y Cliente
                if (role === 'PLATFORM_ADMIN' || role === 'BRANCH_ADMIN') {
                    return res.status(403).json({
                        message: 'No puede crear administradores'
                    });
                }
                break;

            default:
                return res.status(403).json({
                    message: 'No tiene permisos para crear usuarios'
                });
        }

        const user = new User({
            ...data,
            role
        });

        await user.save();

        res.status(201).json({
            success: true,
            message: 'Usuario creado correctamente',
            data: user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear usuario',
            error: error.message
        });
    }
};

/* ACTUALIZAR USUARIO*/
export const updateUser = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;
        const updates = req.body;

        // Protegemos la contraseña
        delete updates.password;

        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }

        // --- Lógica de Seguridad para el ROL ---
        if (updates.role) {
            // Un BRANCH_ADMIN no puede asignar roles de ADMIN
            if (req.user.role === 'BRANCH_ADMIN' && ['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(updates.role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tienes permiso para asignar roles administrativos' 
                });
            }
            // Si eres PLATFORM_ADMIN, permitimos el cambio que venga en el body
        } else {
            // Si no viene un rol en el body, lo borramos para asegurar que no se envíe un null
            delete updates.role;
        }

        // Validación de jerarquía para BRANCH_ADMIN
        if (req.user.role === 'BRANCH_ADMIN' && !['EMPLOYEE', 'CLIENT'].includes(targetUser.role)) {
            return res.status(403).json({ success: false, message: 'No puede editar a otros administradores' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Usuario actualizado correctamente',
            data: user
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error actualizando usuario',
            error: error.message
        });
    }
};

/* CAMBIO DE ESTADO (SOFT DELETE)*/
export const changeUserStatus = async (req, res) => {
    try {
        if (!['PLATFORM_ADMIN', 'BRANCH_ADMIN'].includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'No autorizado' });
        }

        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });

        if (req.user.role === 'BRANCH_ADMIN' && !['EMPLOYEE', 'CLIENT'].includes(user.role)) {
            return res.status(403).json({ success: false, message: 'No puede cambiar estado de administradores' });
        }

        if (!user) {
            return res.status(404).json({
                message: 'Usuario no encontrado'
            });
        }

        user.UserStatus =
            user.UserStatus === 'ACTIVE'
                ? 'INACTIVE'
                : 'ACTIVE';

        user.deletedAt =
            user.UserStatus === 'INACTIVE'
                ? new Date()
                : null;

        await user.save();

        res.status(200).json({
            success: true,
            message: `Usuario ${user.UserStatus}`,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error cambiando estado',
            error: error.message
        });
    }
};

/* PERFIL DEL USUARIO LOGUEADO*/
export const getProfile = async (req, res) => {

    res.status(200).json({
        success: true,
        user: req.user
    });
};