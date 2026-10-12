import { Resend } from 'resend';
import { ClientGeoInfo } from '@/lib/utils/geo';
import { ROOT_DOMAIN } from '@/constants/env';

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'seguridad@afxapp.cl';

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Plantilla 1: Código de Recuperación de Contraseña (Diseño Premium Dark/Modern)
 */
export function getPasswordResetEmailHtml(
  code: string,
  email: string,
  geo?: ClientGeoInfo
): string {
  const locationText = [geo?.city, geo?.country].filter(Boolean).join(', ') || 'Ubicación no disponible';
  const ipText = geo?.ip || 'No registrada';
  const deviceText = geo?.device || 'Navegador Web';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Recuperación de Contraseña</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 520px; background-color: #121215; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; padding: 36px 28px; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);">
            
            <!-- Logo Header -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #f97316 0%, #ea580c 50%, #c2410c 100%); border-radius: 12px; font-weight: 800; font-size: 19px; color: #ffffff; letter-spacing: -0.5px; box-shadow: 0 4px 15px rgba(234, 88, 12, 0.35);">
                  AFX SaaS
                </div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-top: 8px; font-weight: 600;">
                  Centro de Seguridad
                </div>
              </td>
            </tr>

            <!-- Título -->
            <tr>
              <td align="center" style="padding-bottom: 12px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                  Recuperación de Contraseña
                </h1>
              </td>
            </tr>

            <!-- Mensaje -->
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #a1a1aa; max-width: 420px;">
                  Hemos recibido una solicitud para cambiar la contraseña de tu cuenta:
                  <strong style="color: #f4f4f5; display: block; margin-top: 4px; font-size: 14px;">${email}</strong>
                </p>
              </td>
            </tr>

            <!-- Caja de Código -->
            <tr>
              <td align="center" style="padding-bottom: 28px;">
                <div style="background: radial-gradient(circle, rgba(234,88,12,0.12) 0%, rgba(9,9,11,0.8) 100%); border: 2px dashed #f97316; border-radius: 16px; padding: 22px 30px; text-align: center; display: inline-block;">
                  <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #fb923c; margin-bottom: 8px; font-weight: 600;">
                    Tu Código de Verificación
                  </div>
                  <span style="font-family: 'SF Mono', Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ffffff; text-shadow: 0 0 20px rgba(249, 115, 22, 0.5); margin-left: 10px;">
                    ${code}
                  </span>
                </div>
              </td>
            </tr>

            <!-- Detalles de Solicitud (IP / Geo) -->
            <tr>
              <td style="padding-bottom: 24px;">
                <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px 20px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 10px;">
                    📍 Información de la Solicitud
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #d4d4d8;">
                    <tr>
                      <td style="color: #71717a; width: 35%;">Dirección IP:</td>
                      <td style="font-family: monospace; font-weight: 600; color: #f4f4f5;">${ipText}</td>
                    </tr>
                    <tr>
                      <td style="color: #71717a;">Ubicación aprox.:</td>
                      <td style="font-weight: 600; color: #f4f4f5;">${locationText}</td>
                    </tr>
                    <tr>
                      <td style="color: #71717a;">Dispositivo:</td>
                      <td style="font-weight: 600; color: #f4f4f5;">${deviceText}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <!-- Advertencia / Seguridad -->
            <tr>
              <td style="padding-bottom: 28px;">
                <div style="background-color: rgba(234, 88, 12, 0.08); border: 1px solid rgba(234, 88, 12, 0.25); border-radius: 12px; padding: 14px 18px; font-size: 12px; color: #fed7aa; line-height: 1.5;">
                  ⏳ <strong>Vigencia:</strong> Este código expira en <strong>15 minutos</strong> o tras 5 intentos erróneos. Si no solicitaste este cambio, no compartas este código con nadie.
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="border-top: 1px solid #27272a; padding-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #71717a;">
                  © AFX SaaS &bull; Seguridad de Cuentas &bull; <a href="https://${ROOT_DOMAIN}" style="color: #f97316; text-decoration: none;">afxapp.cl</a>
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
 * Plantilla 2: Confirmación de Contraseña Cambiada con botón de Bloqueo Inmediato
 */
export function getPasswordChangedEmailHtml(
  email: string,
  lockAccountUrl: string,
  geo?: ClientGeoInfo
): string {
  const locationText = [geo?.city, geo?.country].filter(Boolean).join(', ') || 'Ubicación no disponible';
  const ipText = geo?.ip || 'No registrada';
  const deviceText = geo?.device || 'Navegador Web';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contraseña Actualizada - AFX SaaS</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 520px; background-color: #121215; border: 1px solid #27272a; border-radius: 20px; overflow: hidden; padding: 36px 28px; box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.6);">
            
            <!-- Logo Header -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="display: inline-block; padding: 10px 24px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; font-weight: 800; font-size: 19px; color: #ffffff; letter-spacing: -0.5px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.35);">
                  AFX SaaS
                </div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #71717a; margin-top: 8px; font-weight: 600;">
                  Alerta de Seguridad
                </div>
              </td>
            </tr>

            <!-- Título -->
            <tr>
              <td align="center" style="padding-bottom: 12px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                  Tu contraseña ha sido modificada
                </h1>
              </td>
            </tr>

            <!-- Mensaje -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #a1a1aa; max-width: 420px;">
                  Te informamos que la contraseña asociada a tu cuenta <strong style="color: #f4f4f5;">${email}</strong> ha sido actualizada con éxito recientemente.
                </p>
              </td>
            </tr>

            <!-- Detalles de la Conexión -->
            <tr>
              <td style="padding-bottom: 24px;">
                <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 16px 20px;">
                  <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #a1a1aa; margin-bottom: 10px;">
                    📍 Datos de la Modificación
                  </div>
                  <table role="presentation" width="100%" cellspacing="0" cellpadding="4" style="font-size: 13px; color: #d4d4d8;">
                    <tr>
                      <td style="color: #71717a; width: 35%;">Dirección IP:</td>
                      <td style="font-family: monospace; font-weight: 600; color: #f4f4f5;">${ipText}</td>
                    </tr>
                    <tr>
                      <td style="color: #71717a;">Ubicación aprox.:</td>
                      <td style="font-weight: 600; color: #f4f4f5;">${locationText}</td>
                    </tr>
                    <tr>
                      <td style="color: #71717a;">Dispositivo:</td>
                      <td style="font-weight: 600; color: #f4f4f5;">${deviceText}</td>
                    </tr>
                  </table>
                </div>
              </td>
            </tr>

            <!-- Acción de Emergencia: Si no fuiste tú -->
            <tr>
              <td style="padding-bottom: 28px;">
                <div style="background-color: rgba(225, 29, 72, 0.08); border: 1px solid rgba(225, 29, 72, 0.3); border-radius: 14px; padding: 20px; text-align: center;">
                  <div style="color: #fda4af; font-size: 13px; font-weight: 600; margin-bottom: 8px;">
                    ⚠️ ¿No realizaste este cambio?
                  </div>
                  <p style="margin: 0 0 16px 0; font-size: 12px; color: #e2e8f0; line-height: 1.5;">
                    Si no reconoces esta acción, es posible que alguien haya comprometido tu cuenta. Haz clic en el siguiente botón para <strong>bloquear el acceso a tu cuenta inmediatamente</strong>:
                  </p>
                  <a href="${lockAccountUrl}" style="display: inline-block; background-color: #e11d48; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 700; padding: 12px 24px; border-radius: 10px; box-shadow: 0 4px 14px rgba(225, 29, 72, 0.4);">
                    Bloquear mi Cuenta Ahora
                  </a>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="border-top: 1px solid #27272a; padding-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #71717a;">
                  Si fuiste tú quien realizó el cambio, puedes ignorar este mensaje. &bull; <a href="https://${ROOT_DOMAIN}" style="color: #10b981; text-decoration: none;">afxapp.cl</a>
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
 * Plantilla 3: Notificación de Cuenta Bloqueada por Seguridad
 */
export function getAccountLockedEmailHtml(email: string): string {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cuenta Bloqueada por Seguridad - AFX SaaS</title>
  </head>
  <body style="margin: 0; padding: 0; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #09090b; padding: 40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width: 520px; background-color: #121215; border: 1px solid #e11d48; border-radius: 20px; overflow: hidden; padding: 36px 28px; box-shadow: 0 20px 40px -10px rgba(225, 29, 72, 0.3);">
            
            <!-- Logo Header -->
            <tr>
              <td align="center" style="padding-bottom: 24px;">
                <div style="display: inline-block; padding: 10px 24px; background: #e11d48; border-radius: 12px; font-weight: 800; font-size: 19px; color: #ffffff; letter-spacing: -0.5px;">
                  AFX SaaS
                </div>
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #f43f5e; margin-top: 8px; font-weight: 700;">
                  Cuenta Protegida y Bloqueada
                </div>
              </td>
            </tr>

            <!-- Título -->
            <tr>
              <td align="center" style="padding-bottom: 12px;">
                <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px;">
                  Tu cuenta ha sido bloqueada
                </h1>
              </td>
            </tr>

            <!-- Mensaje -->
            <tr>
              <td style="padding-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #d4d4d8; text-align: center;">
                  Hemos procedido a suspender el acceso de la cuenta <strong style="color: #ffffff;">${email}</strong> debido a un reporte de seguridad.
                </p>
              </td>
            </tr>

            <!-- Instrucciones de Soporte -->
            <tr>
              <td style="padding-bottom: 28px;">
                <div style="background-color: #18181b; border: 1px solid #27272a; border-radius: 12px; padding: 18px 20px; font-size: 13px; color: #a1a1aa; line-height: 1.6;">
                  <strong style="color: #f4f4f5; display: block; margin-bottom: 6px;">¿Cómo reactivar mi cuenta?</strong>
                  Por tu seguridad, ningún usuario ni atacante podrá iniciar sesión hasta que verifiques tu identidad. Para solicitar el desbloqueo, ponte en contacto directo con nuestro equipo a:
                  <div style="margin-top: 12px; text-align: center;">
                    <a href="mailto:soporte@afxapp.cl" style="display: inline-block; background-color: #27272a; border: 1px solid #3f3f46; color: #f4f4f5; text-decoration: none; font-weight: 600; padding: 10px 20px; border-radius: 8px; font-size: 13px;">
                      ✉️ soporte@afxapp.cl
                    </a>
                  </div>
                </div>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="border-top: 1px solid #27272a; padding-top: 20px;">
                <p style="margin: 0; font-size: 12px; color: #71717a;">
                  Plataforma Gastronómica AFX &bull; Soporte Oficial
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
 * Métodos de Envío
 */
export async function sendPasswordResetEmail(
  email: string,
  code: string,
  geo?: ClientGeoInfo
) {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY no configurado en entorno. Correo simulado.');
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: `AFX SaaS <${fromEmail}>`,
      to: email,
      subject: `Código de verificación de seguridad: ${code}`,
      html: getPasswordResetEmailHtml(code, email, geo),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error - Reset Code]', error);
    throw new Error(error?.message || 'Error al enviar el correo transaccional.');
  }
}

export async function sendPasswordChangedEmail(
  email: string,
  lockAccountUrl: string,
  geo?: ClientGeoInfo
) {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY no configurado. Correo simulado.');
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: `AFX SaaS <${fromEmail}>`,
      to: email,
      subject: `Alerta de Seguridad: Tu contraseña ha sido modificada`,
      html: getPasswordChangedEmailHtml(email, lockAccountUrl, geo),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error - Password Changed]', error);
    throw new Error(error?.message || 'Error al enviar el correo de aviso.');
  }
}

export async function sendAccountLockedEmail(email: string) {
  if (!resend) {
    console.warn('[Resend] RESEND_API_KEY no configurado. Correo simulado.');
    return { success: true, simulated: true };
  }

  try {
    const data = await resend.emails.send({
      from: `AFX SaaS <${fromEmail}>`,
      to: email,
      subject: `Aviso Importante: Tu cuenta de AFX SaaS ha sido bloqueada`,
      html: getAccountLockedEmailHtml(email),
    });

    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Error - Account Locked]', error);
    throw new Error(error?.message || 'Error al enviar el correo de bloqueo.');
  }
}
