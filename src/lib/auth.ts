import { cookies } from 'next/headers';

export interface SessionPayload {
  userId: string;
  email: string;
  role: 'SUPERADMIN' | 'STORE_ADMIN' | 'KITCHEN';
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantName: string | null;
  isDemo?: boolean;
  iat?: number;
  exp?: number;
}

export const SESSION_COOKIE_NAME = 'auth_session';
export const DEMO_TENANT_SLUG = 'sas-burger';

function getSecretKeyString(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'fastfood-saas-hmac-sha256-master-secret-key-2026'
  );
}

function base64UrlEncode(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64url');
  }
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(b64url: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64url, 'base64url').toString('utf-8');
  }
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const pad = b64.length % 4 === 0 ? '' : '='.repeat(4 - (b64.length % 4));
  const binary = atob(b64 + pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64url');
  }
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(getSecretKeyString());
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Firma criptográficamente el payload de sesión con HMAC-SHA256
 */
export async function signSessionToken(
  payload: Omit<SessionPayload, 'iat' | 'exp'>,
  maxAgeSeconds = 60 * 60 * 24 * 7
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + maxAgeSeconds,
  };

  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(encodedPayload)
  );
  const signature = arrayBufferToBase64Url(signatureBuffer);

  return `${encodedPayload}.${signature}`;
}

/**
 * Verifica la firma HMAC-SHA256 y expiración de la cookie de sesión
 */
export async function verifySessionToken(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, providedSignature] = parts;
  if (!encodedPayload || !providedSignature) return null;

  try {
    const key = await getCryptoKey();
    const expectedSigBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      new TextEncoder().encode(encodedPayload)
    );
    const expectedSignature = arrayBufferToBase64Url(expectedSigBuffer);

    // Comparación en tiempo constante
    if (providedSignature.length !== expectedSignature.length) return null;
    let mismatch = 0;
    for (let i = 0; i < providedSignature.length; i++) {
      mismatch |= providedSignature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    if (mismatch !== 0) return null;

    const decodedJson = base64UrlDecode(encodedPayload);
    const payload = JSON.parse(decodedJson) as SessionPayload;

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Obtiene y verifica la sesión actual desde las cookies de Next.js (Server Components / API Routes)
 */
export async function getSessionUser(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!sessionCookie?.value) return null;
    return await verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * Verifica que el usuario sea SUPERADMIN o STORE_ADMIN propietario del restaurantId indicado
 */
export async function verifyTenantAdminAccess(targetRestaurantId: string): Promise<{
  authorized: boolean;
  user: SessionPayload | null;
  isDemo: boolean;
  error?: string;
  status?: number;
}> {
  const user = await getSessionUser();
  if (!user) {
    return { authorized: false, user: null, isDemo: false, error: 'No autenticado', status: 401 };
  }

  if (user.role === 'SUPERADMIN' && !user.isDemo) {
    return { authorized: true, user, isDemo: false };
  }

  if (user.role === 'STORE_ADMIN' && user.restaurantId === targetRestaurantId) {
    return { authorized: true, user, isDemo: Boolean(user.isDemo) };
  }

  return {
    authorized: false,
    user,
    isDemo: Boolean(user.isDemo),
    error: 'Acceso denegado: No tienes permisos sobre este restaurante',
    status: 403,
  };
}

/**
 * Opciones estándar de seguridad para la cookie de sesión
 */
export function getSessionCookieOptions(maxAgeSeconds = 60 * 60 * 24 * 7) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' && process.env.ALLOW_INSECURE_COOKIES !== 'true',
    sameSite: 'lax' as const,
    maxAge: maxAgeSeconds,
    path: '/',
  };
}
