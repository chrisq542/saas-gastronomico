import { NextRequest, NextResponse } from 'next/server';
import { ENV } from '@/constants/env';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto:
     * - api (las APIs se manejan directamente con su propia validación)
     * - _next/static, _next/image (archivos internos de Next)
     * - favicon.ico y archivos con extensión (imágenes, fuentes, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|[\\w-]+\\.\\w+).*)',
  ],
};

const PROTECTED_PREFIXES = ['/tenants', '/superadmin', '/kds', '/orders', '/products'];

export default async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const pathname = url.pathname;

  // 1. Protección de rutas administrativas y aislamiento por rol/tenant
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isProtectedRoute) {
    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);

    if (!session) {
      const loginUrl = new URL('/login', req.url);
      return NextResponse.redirect(loginUrl);
    }

    // Superadmin routes (/tenants, /superadmin) -> Exclusivo SUPERADMIN real (nunca Demo ni Store Admin)
    if (pathname.startsWith('/tenants') || pathname.startsWith('/superadmin')) {
      if (session.role !== 'SUPERADMIN' || session.isDemo) {
        const fallback = session.role === 'KITCHEN' ? '/kds' : '/orders';
        return NextResponse.redirect(new URL(fallback, req.url));
      }
    }

    // Rol KITCHEN solo tiene acceso a /kds
    if (
      session.role === 'KITCHEN' &&
      (pathname.startsWith('/orders') || pathname.startsWith('/products'))
    ) {
      return NextResponse.redirect(new URL('/kds', req.url));
    }

    // Prevenir manipulación de ?restaurantId= en la URL para usuarios no-SUPERADMIN
    if (session.role !== 'SUPERADMIN' && session.restaurantId) {
      const paramRestaurantId = url.searchParams.get('restaurantId');
      if (paramRestaurantId && paramRestaurantId !== session.restaurantId) {
        url.searchParams.set('restaurantId', session.restaurantId);
        return NextResponse.redirect(url);
      }
    }
  }

  // 2. Detección de subdominio y dominio personalizado para catálogo público
  const hostname = req.headers.get('host') || '';
  const hostWithoutPort = hostname.split(':')[0].toLowerCase();

  let subdomain: string | null = null;
  let isCustomDomain = false;

  const configuredRootDomain = ENV.ROOT_DOMAIN;
  const isIpAddress = /^\d+\.\d+\.\d+\.\d+$/.test(hostWithoutPort);

  if (isIpAddress || hostWithoutPort === 'localhost' || hostWithoutPort === '127.0.0.1') {
    subdomain = null;
    isCustomDomain = false;
  } else if (hostWithoutPort.endsWith('.localhost')) {
    subdomain = hostWithoutPort.replace('.localhost', '').split('.')[0];
  } else if (hostWithoutPort.endsWith('.lvh.me')) {
    subdomain = hostWithoutPort.replace('.lvh.me', '').split('.')[0];
  } else if (hostWithoutPort.endsWith(`.${configuredRootDomain}`)) {
    subdomain = hostWithoutPort.replace(`.${configuredRootDomain}`, '').split('.')[0];
  } else if (
    hostWithoutPort === configuredRootDomain ||
    hostWithoutPort === `www.${configuredRootDomain}`
  ) {
    subdomain = null;
  } else {
    const parts = hostWithoutPort.split('.');
    if (parts.length >= 3) {
      subdomain = parts[0];
    } else {
      isCustomDomain = true;
    }
  }

  if (subdomain === 'www' || subdomain === 'app') {
    subdomain = null;
  }

  if (!subdomain && !isCustomDomain) {
    return NextResponse.next();
  }

  const requestHeaders = new Headers(req.headers);
  if (subdomain) {
    requestHeaders.set('x-tenant-slug', subdomain);
  }
  if (isCustomDomain) {
    requestHeaders.set('x-custom-domain', hostWithoutPort);
  }

  if (pathname === '/') {
    const rewriteTarget = subdomain ? `/${subdomain}` : `/`;
    return NextResponse.rewrite(new URL(rewriteTarget, req.url), {
      request: { headers: requestHeaders },
    });
  }

  if (pathname === '/checkout' && subdomain) {
    url.searchParams.set('tenant', subdomain);
    return NextResponse.rewrite(url, {
      request: { headers: requestHeaders },
    });
  }

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
