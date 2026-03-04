'use strict';

import User from './user.model.js';
import { generateJWT } from '../../helpers/generate-jwt.js';


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


/* PERFIL DEL USUARIO LOGUEADO*/
export const getProfile = async (req, res) => {

    res.status(200).json({
        success: true,
        user: req.user
    });
};