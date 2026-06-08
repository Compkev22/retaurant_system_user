import User from '../User/user.model.js';
import { generateJWT } from '../../helpers/generate-jwt.js';
import { sendTokenEmail } from '../../helpers/email.helper.js';

// REGISTER — Solo permite rol CLIENT
export const register = async (req, res) => {
    try {
        const data = req.body;

        // Forzar rol CLIENT independientemente de lo que envíe el body
        data.role = 'CLIENT';

        const user = new User(data);
        await user.save();

        const token = await generateJWT(user._id, user.UserEmail, user.role);
        await sendTokenEmail(user.UserEmail, token);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado. Por favor, verifica tu correo para activar tu cuenta.',
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado',
                error: 'DUPLICATE_EMAIL'
            });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// LOGIN — Solo permite usuarios con rol CLIENT
export const login = async (req, res) => {
    try {
        const { UserEmail, password } = req.body;

        const user = await User.findOne({
            UserEmail,
            UserStatus: 'ACTIVE',
            deletedAt: null
        });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({
                success: false,
                message: 'Credenciales inválidas'
            });
        }

        if (!user.isVerified) {
            return res.status(401).json({
                success: false,
                message: 'Por favor, verifica tu cuenta en tu correo electrónico antes de iniciar sesión.'
            });
        }

        // Solo CLIENTs pueden acceder a la app del cliente
        if (user.role !== 'CLIENT') {
            return res.status(403).json({
                success: false,
                message: 'Acceso denegado. Esta aplicación es exclusiva para clientes.'
            });
        }

        const token = await generateJWT(user._id, user.UserEmail, user.role);

        res.status(200).json({
            success: true,
            token,
            userDetails: user
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en el servidor' });
    }
};

// VERIFY EMAIL
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