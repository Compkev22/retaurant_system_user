import nodemailer from 'nodemailer';

export const sendTokenEmail = async (email, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER, // Correo
            pass: process.env.EMAIL_PASS  // contraseña de aplicacion
        }
    });

    const mailOptions = {
        from: '"Restaurante App" <no-reply@tu-restaurante.com>',
        to: email,
        subject: 'Tu Token de Acceso',
        html: `
            <h1>Bienvenido al Sistema</h1>
            <p>Has iniciado sesión exitosamente.</p>
            <p>Tu token de acceso es el siguiente (copia y pega):</p>
            <code style="background: #f4f4f4; padding: 10px; display: block;">${token}</code>
            <p>Este token expira en 4 horas.</p>
        `
    };

    await transporter.sendMail(mailOptions);
};