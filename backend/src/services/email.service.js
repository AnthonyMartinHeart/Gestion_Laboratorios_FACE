"use strict";
import nodemailer from 'nodemailer';
import { 
    MAIL_HOST, 
    MAIL_PORT, 
    MAIL_USER, 
    MAIL_PASS, 
    MAIL_FROM 
} from '../config/configEnv.js';

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
        const mailOptions = {
            from: MAIL_FROM,
            to: userEmail,
            subject: '🎉 ¡Bienvenido al Sistema de Gestión de Laboratorios FACE!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #2c3e50; margin-bottom: 10px;">¡Bienvenido!</h1>
                            <h2 style="color: #3498db; margin-top: 0;">Sistema de Gestión de Laboratorios FACE</h2>
                        </div>
                        
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            Hola <strong>${userName}</strong>,
                        </p>
                        
                        <p style="color: #333; font-size: 16px; line-height: 1.6;">
                            ¡Tu cuenta ha sido creada exitosamente! A continuación encontrarás tus credenciales de acceso:
                        </p>
                        
                        <div style="background-color: #ecf0f1; padding: 20px; border-radius: 8px; margin: 20px 0;">
                            <h3 style="color: #2c3e50; margin-top: 0;">📧 Tus Credenciales:</h3>
                            <p style="margin: 10px 0;"><strong>Usuario:</strong> <span style="color: #e74c3c;">${userEmail}</span></p>
                            <p style="margin: 10px 0;"><strong>Contraseña:</strong> <span style="color: #e74c3c;">${userPassword}</span></p>
                        </div>
                        
                        <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="color: #856404; margin: 0; font-size: 14px;">
                                <strong>💡 Importante:</strong> Te recomendamos guardar este correo en un lugar seguro. 
                                Puedes acceder al sistema con estas credenciales en cualquier momento.
                            </p>
                        </div>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <p style="color: #333; font-size: 16px;">
                                ¡Ya puedes comenzar a usar el sistema de laboratorios!
                            </p>
                        </div>
                        
                        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center;">
                            <p style="color: #777; font-size: 14px; margin: 0;">
                                Sistema de Gestión de Laboratorios FACE<br>
                                Universidad del Bío-Bío
                            </p>
                        </div>
                    </div>
                </div>
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
