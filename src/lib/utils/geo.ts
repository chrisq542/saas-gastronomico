/**
 * Helper para obtener IP y ubicación aproximada del cliente a través de cabeceras de proxy/CDN
 */
export interface ClientGeoInfo {
  ip: string;
  city?: string;
  country?: string;
  device?: string;
}

export function extractClientGeo(headers: Headers): ClientGeoInfo {
  // IP: intentar x-forwarded-for, cf-connecting-ip, x-real-ip
  const forwardedFor = headers.get('x-forwarded-for');
  const cfConnectingIp = headers.get('cf-connecting-ip');
  const xRealIp = headers.get('x-real-ip');

  let ip = 'Desconocida';
  if (cfConnectingIp) {
    ip = cfConnectingIp;
  } else if (forwardedFor) {
    ip = forwardedFor.split(',')[0].trim();
  } else if (xRealIp) {
    ip = xRealIp;
  }

  // Normalizar localhost IPv6
  if (ip === '::1' || ip === '127.0.0.1') {
    ip = '127.0.0.1 (Local / Red Privada)';
  }

  // Ubicación: Cloudflare / Vercel headers o valores por defecto
  const cfCity = headers.get('cf-ipcity');
  const cfCountry = headers.get('cf-ipcountry');
  const vercelCity = headers.get('x-vercel-ip-city');
  const vercelCountry = headers.get('x-vercel-ip-country');

  const city = cfCity || vercelCity || (ip.startsWith('127.0') ? 'Santiago' : undefined);
  const country = cfCountry || vercelCountry || (ip.startsWith('127.0') ? 'Chile (CL)' : undefined);

  // Dispositivo / User Agent simplificado
  const userAgent = headers.get('user-agent') || '';
  let device = 'Navegador Web';
  if (/mobile/i.test(userAgent)) {
    device = 'Dispositivo Móvil';
  } else if (/windows/i.test(userAgent)) {
    device = 'Computador (Windows)';
  } else if (/macintosh|mac os/i.test(userAgent)) {
    device = 'Computador (macOS)';
  } else if (/linux/i.test(userAgent)) {
    device = 'Computador (Linux)';
  }

  return {
    ip,
    city: city ? decodeURIComponent(city) : undefined,
    country: country ? decodeURIComponent(country) : undefined,
    device,
  };
}
