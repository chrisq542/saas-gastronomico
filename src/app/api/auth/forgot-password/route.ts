import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/mail/resend';
import { extractClientGeo } from '@/lib/utils/geo';
import { DEMO_TENANT_SLUG } from '@/lib/auth';

// Duración del código: 15 minutos
const CODE_EXPIRATION_MINUTES = 15;

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { error: 'Debes proporcionar un correo electrónico válido.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const geo = extractClientGeo(req.headers);

    // 1. Verificar si el usuario existe en el sistema
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        restaurant: { select: { slug: true } },
      },
    });

    // Por seguridad (anti-user enumeration) y protección del Sandbox Demo:
    if (!user || user.restaurant?.slug === DEMO_TENANT_SLUG) {
      return NextResponse.json({
        message: 'Si el correo está registrado, recibirás un código de 6 dígitos en breve.',
      });
    }

    // 2. Invalidar códigos previos no utilizados de este correo
    await prisma.passwordResetToken.updateMany({
      where: {
        email: cleanEmail,
        used: false,
      },
      data: {
        used: true,
      },
    });

    // 3. Generar un código numérico aleatorio y criptográficamente seguro de 6 dígitos (100000 - 999999)
    const code = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + CODE_EXPIRATION_MINUTES * 60 * 1000);

    // 4. Guardar en base de datos
    await prisma.passwordResetToken.create({
      data: {
        email: cleanEmail,
        code,
        expiresAt,
        attempts: 0,
      },
    });

    // 5. Enviar correo vía Resend con datos de IP y ubicación
    await sendPasswordResetEmail(cleanEmail, code, geo);

    return NextResponse.json({
      message: 'Si el correo está registrado, recibirás un código de 6 dígitos en breve.',
    });
  } catch (error: any) {
    console.error('Error en forgot-password:', error);
    return NextResponse.json(
      { error: error?.message || 'Error interno al procesar la solicitud.' },
      { status: 500 }
    );
  }
}
