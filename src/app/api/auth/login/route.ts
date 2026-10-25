import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { ROUTES, ROLES } from '@/constants';
import { DEMO_TENANT_SLUG, SESSION_COOKIE_NAME, signSessionToken } from '@/lib/auth';

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

    // Verificar si la cuenta se encuentra bloqueada por seguridad
    if (user.isLocked) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Esta cuenta ha sido bloqueada por motivos de seguridad. Por favor contacta al administrador o escribe a soporte@afxapp.cl para reactivarla.',
        },
        { status: 403 }
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
    let redirectUrl: string = ROUTES.SUPERADMIN.ROOT;
    if (user.role === ROLES.SUPERADMIN) {
      redirectUrl = ROUTES.SUPERADMIN.ROOT;
    } else if (user.role === ROLES.STORE_ADMIN) {
      redirectUrl = ROUTES.STORE.ORDERS;
    } else if (user.role === ROLES.KITCHEN) {
      redirectUrl = ROUTES.STORE.KDS;
    }

    const isDemoTenant =
      user.role !== ROLES.SUPERADMIN && user.restaurant?.slug === DEMO_TENANT_SLUG;

    const sessionPayload = {
      userId: user.id,
      email: isDemoTenant
        ? user.role === ROLES.KITCHEN
          ? 'Cocina Demo (Sandbox)'
          : 'Admin Local Demo (Sandbox)'
        : user.email,
      role: user.role as 'SUPERADMIN' | 'STORE_ADMIN' | 'KITCHEN',
      restaurantId: user.restaurantId,
      restaurantSlug: user.restaurant?.slug || null,
      restaurantName: user.restaurant?.name || null,
      isDemo: isDemoTenant,
    };

    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';

    const maxAge = isDemoTenant ? 60 * 60 * 4 : 60 * 60 * 24 * 7;
    const signedToken = await signSessionToken(sessionPayload, maxAge);

    // Guardar cookie de sesión firmada y httpOnly
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, signedToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge,
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
