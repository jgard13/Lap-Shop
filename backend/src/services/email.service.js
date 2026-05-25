const nodemailer = require('nodemailer');

class EmailService {
  static async enviarCodigoVerificacion(correo, codigo) {
    const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const port = process.env.EMAIL_PORT ? Number(process.env.EMAIL_PORT) : 587;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    // Log the verification code to console regardless for easy testing/debugging
    console.log('\n=============================================');
    console.log(`[MOCK EMAIL] Para: ${correo}`);
    console.log(`Codigo de verificacion de contrasena: ${codigo}`);
    console.log('=============================================\n');

    if (!user || !pass) {
      console.log('EMAIL_USER o EMAIL_PASS no estan configurados en el archivo .env. Usando fallback de consola.');
      return true;
    }

    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for other ports
        auth: {
          user,
          pass,
        },
      });

      const info = await transporter.sendMail({
        from: `"LapCompare Soporte" <${user}>`,
        to: correo,
        subject: 'Código de verificación de restablecimiento de contraseña - LapCompare',
        text: `Tu código de verificación para restablecer tu contraseña es: ${codigo}. Este código expirará en 15 minutos.`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #2b3e50; text-align: center; border-bottom: 2px solid #3498db; padding-bottom: 10px;">Restablecer tu contraseña</h2>
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta asociada a este correo electrónico.</p>
            <div style="background-color: #f7f9fa; border: 1px dashed #3498db; border-radius: 6px; padding: 15px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #2c3e50;">${codigo}</span>
            </div>
            <p style="font-size: 14px; color: #7f8c8d;">Este código de verificación es válido por 15 minutos. Si no solicitaste este cambio, puedes ignorar este correo de forma segura.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="font-size: 12px; color: #bdc3c7; text-align: center;">LapCompare © 2026 - Herramienta de Comparación de Laptops</p>
          </div>
        `,
      });

      console.log('Correo de verificacion enviado:', info.messageId);
      return true;
    } catch (error) {
      console.error('Error al enviar correo:', error);
      // We don't fail the request completely if the email server fails but log is printed.
      // However, if the user intended to send it, they should know it failed.
      throw new Error('No se pudo enviar el correo de verificación. Por favor intenta más tarde.');
    }
  }
}

module.exports = EmailService;
