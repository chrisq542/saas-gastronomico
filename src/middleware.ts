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

  if (hostWithoutPort.endsWith('.localhost')) {
    subdomain = hostWithoutPort.replace('.localhost', '').split('.')[0];
  } else if (hostWithoutPort.endsWith('.lvh.me')) {
    subdomain = hostWithoutPort.replace('.lvh.me', '').split('.')[0];
  } else {
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'saasgastronomico.cl';

    if (hostWithoutPort.endsWith(`.${rootDomain}`)) {
      subdomain = hostWithoutPort.replace(`.${rootDomain}`, '').split('.')[0];
    } else if (
      hostWithoutPort !== 'localhost' &&
      hostWithoutPort !== '127.0.0.1' &&
      hostWithoutPort !== rootDomain &&
      hostWithoutPort !== `www.${rootDomain}` &&
      !hostWithoutPort.endsWith('.vercel.app')
    ) {
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
