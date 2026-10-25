import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import {
  DEMO_TENANT_SLUG,
  SESSION_COOKIE_NAME,
  getSessionCookieOptions,
  signSessionToken,
} from '@/lib/auth';
import { ROUTES } from '@/constants';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requestedRole = body?.role === 'KITCHEN' ? 'KITCHEN' : 'STORE_ADMIN';

    // Buscar exclusivamente el tenant de demostración aislado
    const demoRestaurant = await prisma.restaurant.findUnique({
      where: { slug: DEMO_TENANT_SLUG },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    });

    if (!demoRestaurant || !demoRestaurant.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: 'El entorno de demostración no está disponible en este momento.',
        },
        { status: 404 }
      );
    }

    const demoSessionPayload = {
      userId: `demo-${requestedRole.toLowerCase()}-${demoRestaurant.id}`,
      email:
        requestedRole === 'KITCHEN'
          ? 'Cocina Demo (Sandbox)'
          : 'Admin Local Demo (Sandbox)',
      role: requestedRole as 'STORE_ADMIN' | 'KITCHEN',
      restaurantId: demoRestaurant.id,
      restaurantSlug: demoRestaurant.slug,
      restaurantName: demoRestaurant.name,
      isDemo: true,
    };

    // Sesión efímera de 4 horas para entorno Sandbox
    const demoMaxAge = 60 * 60 * 4;
    const signedToken = await signSessionToken(demoSessionPayload, demoMaxAge);

    const redirectUrl =
      requestedRole === 'KITCHEN' ? ROUTES.STORE.KDS : ROUTES.STORE.ORDERS;

    const response = NextResponse.json({
      success: true,
      message: 'Sesión de demostración iniciada en modo Sandbox aislado',
      user: demoSessionPayload,
      redirectUrl,
    });

    const isHttps =
      req.headers.get('x-forwarded-proto') === 'https' || req.nextUrl.protocol === 'https:';

    response.cookies.set(SESSION_COOKIE_NAME, signedToken, {
      ...getSessionCookieOptions(demoMaxAge),
      secure: isHttps,
    });

    return response;
  } catch (error: any) {
    console.error('Error en acceso demo:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'No se pudo iniciar la sesión de demostración',
      },
      { status: 500 }
    );
  }
}
