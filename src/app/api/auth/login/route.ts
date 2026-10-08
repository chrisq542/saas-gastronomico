import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'Email y contraseña requeridos' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Buscar usuario en base de datos junto con su restaurante asignado
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        restaurant: {
          select: {
            id: true,
            slug: true,
            name: true,
            isActive: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Verificar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }

    // Determinar URL de redirección según el rol
    let redirectUrl = '/superadmin';
    if (user.role === 'SUPERADMIN') {
      redirectUrl = '/superadmin';
    } else if (user.role === 'STORE_ADMIN') {
      redirectUrl = user.restaurant?.slug ? `/${user.restaurant.slug}/admin` : '/orders';
    } else if (user.role === 'KITCHEN') {
      redirectUrl = user.restaurant?.slug ? `/${user.restaurant.slug}/kds` : '/kds';
    }

    const sessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      restaurantId: user.restaurantId,
      restaurantSlug: user.restaurant?.slug || null,
      restaurantName: user.restaurant?.name || null,
    };

    // Guardar cookie de sesión
    const cookieStore = cookies();
    cookieStore.set('auth_session', JSON.stringify(sessionPayload), {
      httpOnly: false, // Accesible por cliente para hidratación UI
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días
    });

    return NextResponse.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: sessionPayload,
      redirectUrl,
    });
  } catch (error: any) {
    console.error('Error en /api/auth/login:', error);
    return NextResponse.json(
      { success: false, message: 'Error interno en el servidor de autenticación' },
      { status: 500 }
    );
  }
}
