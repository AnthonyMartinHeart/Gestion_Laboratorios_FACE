"use strict";
import nodemailer from 'nodemailer';
import { 
    MAIL_HOST, 
    MAIL_PORT, 
    MAIL_USER, 
    MAIL_PASS, 
    MAIL_FROM 
} from '../config/configEnv.js';
import { formatearNombre } from '../helpers/formatText.helper.js';

// Configurar el transportador de correo
const transporter = nodemailer.createTransport({
    host: MAIL_HOST,
    port: MAIL_PORT,
    secure: false, // true para 465, false para otros puertos
    auth: {
        user: MAIL_USER,
        pass: MAIL_PASS,
    },
});

/**
 * Envía un correo con las credenciales del usuario recién registrado
 * @param {string} userEmail - Email del usuario
 * @param {string} userPassword - Contraseña del usuario (sin encriptar)
 * @param {string} userName - Nombre completo del usuario
 * @returns {Promise<[boolean, string]>} - [success, error]
 */
export async function sendCredentialsEmail(userEmail, userPassword, userName) {
    try {
        // Formatear el nombre para que aparezca elegante en el correo
        const nombreFormateado = formatearNombre(userName);
        
        const mailOptions = {
            from: MAIL_FROM,
            to: userEmail,
            subject: '🎉 ¡Bienvenido al Sistema de Gestión de Laboratorios FACE!',
            // Versión de texto plano como respaldo
            text: `
¡Bienvenido ${nombreFormateado}!

Tu cuenta ha sido creada exitosamente en el Sistema de Gestión de Laboratorios FACE.

Tus Credenciales:
Usuario: ${userEmail}
Contraseña: ${userPassword}

Importante: Te recomendamos guardar este correo en un lugar seguro.

¡Ya puedes comenzar a usar el sistema de laboratorios!

---
Sistema de Gestión de Laboratorios FACE
Universidad del Bío-Bío
            `,
            // Versión HTML con diseño mejorado
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido al Sistema FACE</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: white; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin: 0 auto;">
                    <!-- Header -->
                    <tr>
                        <td style="padding: 30px 30px 20px 30px; text-align: center;">
                            <h1 style="color: #2c3e50; margin: 0 0 10px 0; font-size: 28px;">¡Bienvenido Al</h1>
                            <h2 style="color: #3498db; margin: 0; font-size: 22px; font-weight: normal;">Sistema de Gestión de Laboratorios FACE!</h2>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 15px 0;">
                                Hola <strong style="color: #2c3e50;">${nombreFormateado}</strong>,
                            </p>
                            
                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                                ¡Tu cuenta ha sido creada exitosamente! A continuación encontrarás tus credenciales de acceso:
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Credentials Box -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <table width="100%" cellpadding="20" cellspacing="0" style="background-color: #ecf0f1; border-radius: 8px; margin: 0 0 20px 0;">
                                <tr>
                                    <td>
                                        <h3 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 18px;">📧 Tus Credenciales:</h3>
                                        <p style="margin: 8px 0; font-size: 16px; color: #333;">
                                            <strong>Usuario:</strong> <span style="color: #e74c3c; font-weight: bold;">${userEmail}</span>
                                        </p>
                                        <p style="margin: 8px 0; font-size: 16px; color: #333;">
                                            <strong>Contraseña:</strong> <span style="color: #e74c3c; font-weight: bold;">${userPassword}</span>
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Important Notice -->
                    <tr>
                        <td style="padding: 0 30px;">
                            <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; margin: 0 0 25px 0;">
                                <tr>
                                    <td>
                                        <p style="color: #856404; margin: 0; font-size: 14px; line-height: 1.4;">
                                            <strong>💡 Importante:</strong> Te recomendamos guardar este correo en un lugar seguro. 
                                            Puedes acceder al sistema con estas credenciales en cualquier momento.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Call to Action -->
                    <tr>
                        <td style="padding: 0 30px; text-align: center;">
                            <p style="color: #333; font-size: 18px; margin: 0 0 30px 0; font-weight: bold;">
                                ¡Ya puedes comenzar a usar el sistema de laboratorios!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 30px 30px 30px; border-top: 1px solid #ddd; text-align: center;">
                            <p style="color: #777; font-size: 14px; margin: 0; line-height: 1.4;">
                                Sistema de Gestión de Laboratorios FACE<br>
                                Universidad del Bío-Bío
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        };

        await transporter.sendMail(mailOptions);
        return [true, null];

    } catch (error) {
        console.error('Error enviando correo:', error);
        return [false, error.message];
    }
}

/**
 * Verifica la configuración del transportador de correo
 * @returns {Promise<boolean>} - true si la configuración es correcta
 */
export async function verifyEmailConfig() {
    try {
        await transporter.verify();
        console.log('✅ Configuración de correo verificada correctamente');
        return true;
    } catch (error) {
        console.error('❌ Error en configuración de correo:', error.message);
        return false;
    }
}
