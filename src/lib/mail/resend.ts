import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'seguridad@afxapp.cl';

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Plantilla HTML estilizada para el envío de código de verificación
 */
export function getPasswordResetEmailHtml(code: string, email: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Recuperación de Contraseña</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 20px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 480px; background-color: #18181b; border: 1px solid #27272a; border-radius: 16px; overflow: hidden; padding: 32px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);">
            <!-- Header / Logo -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="display: inline-block; padding: 12px 20px; background: linear-gradient(135deg, #ea580c 0%, #c2410c 100%); border-radius: 12px; font-weight: 800; font-size: 20px; color: #ffffff; letter-spacing: -0.5px;">
                  AFX SaaS
                </div>
              </td>
            </tr>

            <!-- Title -->
            <tr>
              <td align="center" style="padding-bottom: 12px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff;">
                  Recuperación de Contraseña
                </h1>
              </td>
            </tr>

            <!-- Description -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #a1a1aa;">
                  Hemos recibido una solicitud para restablecer la contraseña asociada a tu cuenta:
                  <strong style="color: #f4f4f5; display: block; margin-top: 4px;">${email}</strong>
                </p>
              </td>
            </tr>

            <!-- Code Box -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="background-color: #09090b; border: 2px dashed #ea580c; border-radius: 12px; padding: 18px 24px; text-align: center; display: inline-block; min-width: 240px;">
                  <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #fb923c; margin-left: 8px;">
                    ${code}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Notice / Expiration -->
            <tr>
              <td style="padding-bottom: 24px;">
                <div style="background-color: #27272a; border-radius: 8px; padding: 12px 16px; font-size: 13px; color: #d4d4d8; line-height: 1.4;">
                  ⏳ <strong>Este código expirará en 15 minutos</strong> o después de 5 intentos incorrectos. Si no realizaste esta solicitud, puedes ignorar este correo de forma segura.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="border-top: 1px solid #27272a; padding-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #71717a;">
                  Plataforma Gastronómica AFX &bull; afxapp.cl
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
}

/**
 * Enviar correo de restablecimiento con Resend
 */
export async function sendPasswordResetEmail(email: string, code: string) {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY no configurado en entorno. Correo simulado.');
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: `AFX SaaS <${fromEmail}>`,
      to: email,
      subject: `Tu código de recuperación: ${code}`,
      html: getPasswordResetEmailHtml(code, email),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error]', error);
    throw new Error(error?.message || 'Error al enviar el correo transaccional.');
  }
}
