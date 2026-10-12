import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendAccountLockedEmail } from '@/lib/mail/resend';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const sig = searchParams.get('sig');

    if (!email || !sig) {
      return new NextResponse(renderStatusHtml('Error de enlace', 'El enlace de bloqueo es inválido o está incompleto.', false), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 400,
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Buscar usuario
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return new NextResponse(renderStatusHtml('Usuario no encontrado', 'No se encontró la cuenta especificada.', false), {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 404,
      });
    }

    // 2. Si ya está bloqueada
    if (user.isLocked) {
      return new NextResponse(
        renderStatusHtml(
          'Cuenta Previamente Bloqueada',
          `La cuenta <strong>${cleanEmail}</strong> ya se encontraba bloqueada por seguridad. Ponte en contacto con soporte@afxapp.cl para el proceso de reactivación.`,
          true
        ),
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // 3. Bloquear la cuenta en la base de datos
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isLocked: true,
        lockedAt: new Date(),
      },
    });

    // 4. Enviar correo confirmando el bloqueo de seguridad e instrucciones de contacto
    try {
      await sendAccountLockedEmail(cleanEmail);
    } catch (err) {
      console.error('[Error enviando correo de cuenta bloqueada]', err);
    }

    return new NextResponse(
      renderStatusHtml(
        '¡Cuenta Bloqueada con Éxito!',
        `Hemos bloqueado preventivamente la cuenta <strong>${cleanEmail}</strong>. Nadie podrá acceder al sistema con estas credenciales. Hemos enviado una confirmación a tu correo con instrucciones para contactar a soporte@afxapp.cl cuando desees reactivarla.`,
        true
      ),
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  } catch (error: any) {
    console.error('Error al bloquear cuenta:', error);
    return new NextResponse(renderStatusHtml('Error', 'Ocurrió un error inesperado al procesar el bloqueo.', false), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 500,
    });
  }
}

function renderStatusHtml(title: string, message: string, success: boolean): string {
  const iconColor = success ? '#e11d48' : '#eab308';
  const iconText = success ? '🛡️' : '⚠️';

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} - AFX SaaS</title>
    <style>
      body {
        margin: 0;
        padding: 0;
        background-color: #09090b;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
        color: #f4f4f5;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
      }
      .card {
        background-color: #121215;
        border: 1px solid #27272a;
        border-radius: 20px;
        padding: 40px 32px;
        max-width: 480px;
        text-align: center;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        margin: 20px;
      }
      .icon {
        font-size: 48px;
        margin-bottom: 16px;
      }
      h1 {
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 16px 0;
        color: #ffffff;
      }
      p {
        font-size: 14px;
        line-height: 1.6;
        color: #a1a1aa;
        margin-bottom: 24px;
      }
      .btn {
        display: inline-block;
        background-color: #27272a;
        border: 1px solid #3f3f46;
        color: #ffffff;
        text-decoration: none;
        font-weight: 600;
        font-size: 13px;
        padding: 12px 24px;
        border-radius: 10px;
        transition: all 0.2s;
      }
      .btn:hover {
        background-color: #3f3f46;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">${iconText}</div>
      <h1>${title}</h1>
      <p>${message}</p>
      <a href="https://afxapp.cl/login" class="btn">Ir al Inicio de Sesión</a>
    </div>
  </body>
  </html>
  `;
}
