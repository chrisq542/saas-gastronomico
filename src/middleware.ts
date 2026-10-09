import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: [
    /*
     * Interceptar todas las rutas excepto:
     * - api (las APIs se manejan directamente)
     * - _next/static, _next/image (archivos internos de Next)
     * - favicon.ico y archivos con extensión (imágenes, fuentes, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|[\\w-]+\\.\\w+).*)',
  ],
};

export default function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';

  const hostWithoutPort = hostname.split(':')[0].toLowerCase();

  let subdomain: string | null = null;
  let isCustomDomain = false;

  // Detección de dominio raíz y subdominios
  const configuredRootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase().trim();

  if (hostWithoutPort.endsWith('.localhost')) {
    subdomain = hostWithoutPort.replace('.localhost', '').split('.')[0];
  } else if (hostWithoutPort.endsWith('.lvh.me')) {
    subdomain = hostWithoutPort.replace('.lvh.me', '').split('.')[0];
  } else if (configuredRootDomain && hostWithoutPort.endsWith(`.${configuredRootDomain}`)) {
    // Si NEXT_PUBLIC_ROOT_DOMAIN está configurado en las variables de entorno de Vercel
    subdomain = hostWithoutPort.replace(`.${configuredRootDomain}`, '').split('.')[0];
  } else {
    // Detección automática en producción si no se configuró NEXT_PUBLIC_ROOT_DOMAIN
    const parts = hostWithoutPort.split('.');

    // Descartar localhost, IPs y dominios directos de Vercel (vercel.app no soporta wildcards de fábrica)
    if (
      !hostWithoutPort.endsWith('.vercel.app') &&
      hostWithoutPort !== 'localhost' &&
      hostWithoutPort !== '127.0.0.1'
    ) {
      // Para dominios como: subdominio.tudominio.com o subdominio.tudominio.cl (3 o más partes)
      if (parts.length >= 3) {
        subdomain = parts[0];
      } else {
        // Es el dominio raíz (ej: tudominio.com o tudominio.cl)
        subdomain = null;
      }
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

  const pathname = url.pathname;

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
