import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { sendPasswordChangedEmail } from '@/lib/mail/resend';
import { extractClientGeo } from '@/lib/utils/geo';

const MAX_ATTEMPTS = 5;

export async function POST(req: Request) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { error: 'Email, código y nueva contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: 'La nueva contraseña debe tener al menos 6 caracteres.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    // 1. Buscar el token activo más reciente para este correo
    const resetRecord = await prisma.passwordResetToken.findFirst({
      where: {
        email: cleanEmail,
        used: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!resetRecord) {
      return NextResponse.json(
        { error: 'No hay ninguna solicitud de recuperación activa o el código ya fue utilizado.' },
        { status: 400 }
      );
    }

    // 2. Verificar si expiró (15 min)
    if (new Date() > resetRecord.expiresAt) {
      await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: 'El código ha expirado. Por favor, solicita uno nuevo.' },
        { status: 400 }
      );
    }

    // 3. Verificar límite de intentos (anti-fuerza bruta: máximo 5)
    if (resetRecord.attempts >= MAX_ATTEMPTS) {
      await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });
      return NextResponse.json(
        { error: 'Has superado el número máximo de intentos permitidos (5). El código ha sido invalidado por seguridad.' },
        { status: 400 }
      );
    }

    // 4. Comparar el código
    if (resetRecord.code !== cleanCode) {
      const updated = await prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: {
          attempts: { increment: 1 },
        },
      });

      const remainingAttempts = MAX_ATTEMPTS - updated.attempts;
      if (remainingAttempts <= 0) {
        await prisma.passwordResetToken.update({
          where: { id: resetRecord.id },
          data: { used: true },
        });
        return NextResponse.json(
          { error: 'Código incorrecto. Has superado el límite de intentos y este código ha sido invalidado.' },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: `Código incorrecto. Te quedan ${remainingAttempts} intento(s).` },
        { status: 400 }
      );
    }

    // 5. Código correcto -> Hashear nueva contraseña con bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // 6. Actualizar usuario en PostgreSQL
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No se encontró el usuario para restablecer la contraseña.' },
        { status: 404 }
      );
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // 7. Marcar token como utilizado
    await prisma.passwordResetToken.update({
      where: { id: resetRecord.id },
      data: { used: true },
    });

    // 8. Enviar correo de confirmación de cambio con datos de IP/Ubicación y botón de bloqueo de emergencia
    try {
      const geo = extractClientGeo(req.headers);
      
      // Token temporal para permitir el bloqueo directo de la cuenta si el usuario no fue quien la cambió
      const lockSignature = Buffer.from(`${user.id}:${resetRecord.id}:${user.createdAt.getTime()}`).toString('base64url');
      const origin = req.headers.get('origin') || (process.env.NODE_ENV === 'production' ? 'https://afxapp.cl' : 'http://localhost:3000');
      const lockAccountUrl = `${origin}/api/auth/lock-account?email=${encodeURIComponent(cleanEmail)}&sig=${encodeURIComponent(lockSignature)}`;

      await sendPasswordChangedEmail(cleanEmail, lockAccountUrl, geo);
    } catch (mailErr) {
      console.error('[Error enviando correo de confirmación]', mailErr);
    }

    return NextResponse.json({
      message: '¡Contraseña actualizada exitosamente! Ya puedes iniciar sesión con tu nueva contraseña.',
    });
  } catch (error: any) {
    console.error('Error en reset-password:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al actualizar la contraseña.' },
      { status: 500 }
    );
  }
}
