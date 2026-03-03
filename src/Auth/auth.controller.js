import User from '../User/user.model.js';
import { generateJWT } from '../../helpers/generate-jwt.js';
import { sendTokenEmail } from '../../helpers/email.helper.js';

// REGISTER (Crear cuenta)
export const register = async (req, res) => {
    try {
        const data = req.body;
        const user = new User(data);
        
        // Guardar usuario (isVerified por defecto es false)
        await user.save();

        // Generar token de verificación
        const token = await generateJWT(user._id, user.UserEmail, user.role);

        // Enviar correo de verificación
        await sendTokenEmail(user.UserEmail, token);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado. Por favor, verifica tu correo para activar tu cuenta.',
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// LOGIN (Iniciar sesión)
export const login = async (req, res) => {
    try {
        const { UserEmail, password } = req.body;
        const user = await User.findOne({ UserEmail });

        if (!user || !(await user.comparePassword(password))) {
            return res.status(400).json({ message: 'Credenciales inválidas' });
        }

        // Verifica si la cuenta esta activa
        if (!user.isVerified) {
            return res.status(401).json({ 
                success: false,
                message: 'Por favor, verifica tu cuenta en tu correo electrónico antes de iniciar sesión.' 
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

export const verifyEmail = async (req, res) => {
    try {
        // El token viene del middleware validateJWT
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