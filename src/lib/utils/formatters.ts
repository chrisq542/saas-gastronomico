/**
 * Utilidades de formateo para moneda, RUT chileno, teléfonos y fechas.
 */

/**
 * Formatea un número a moneda (por defecto CLP)
 */
export function formatCurrency(
  amount: number | string,
  currency: string = process.env.NEXT_PUBLIC_CURRENCY_CODE || 'CLP',
  locale: string = 'es-CL'
): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numericAmount)) return '$0';

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'CLP' ? 0 : 2,
  }).format(numericAmount);
}

/**
 * Limpia un número telefónico para almacenamiento y WhatsApp (elimina espacios, guiones y signos)
 * Ejemplo: "+56 9 1234-5678" -> "56912345678"
 */
export function cleanPhoneNumber(phone: string): string {
  if (!phone) return '';
  let cleaned = phone.replace(/\D/g, '');
  // Si el usuario ingresa 9 dígitos comenzando con 9 (Chile), anteponer 56
  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    cleaned = `56${cleaned}`;
  }
  return cleaned;
}

/**
 * Formatea un número telefónico para visualización amigable
 * Ejemplo: "56912345678" -> "+56 9 1234 5678"
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = cleanPhoneNumber(phone);
  if (cleaned.length === 11 && cleaned.startsWith('56')) {
    return `+56 ${cleaned.slice(2, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
  }
  return phone;
}

/**
 * Valida un RUT chileno usando el algoritmo Módulo 11
 */
export function validateRut(rut: string): boolean {
  if (!rut || typeof rut !== 'string') return false;
  
  // Limpiar puntos y guiones
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 8 || clean.length > 9) return false;

  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);

  let suma = 0;
  let multiplo = 2;

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
    multiplo = multiplo < 7 ? multiplo + 1 : 2;
  }

  const dvEsperadoCalculado = 11 - (suma % 11);
  let dvEsperado = '';
  if (dvEsperadoCalculado === 11) dvEsperado = '0';
  else if (dvEsperadoCalculado === 10) dvEsperado = 'K';
  else dvEsperado = dvEsperadoCalculado.toString();

  return dv === dvEsperado;
}

/**
 * Formatea un RUT al formato estándar chileno (XX.XXX.XXX-X)
 */
export function formatRut(rut: string): string {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '').toUpperCase();
  if (clean.length < 2) return clean;

  const cuerpo = clean.slice(0, -1);
  const dv = clean.slice(-1);

  // Formatear cuerpo con puntos
  let cuerpoFormateado = '';
  let count = 0;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    cuerpoFormateado = cuerpo.charAt(i) + cuerpoFormateado;
    count++;
    if (count === 3 && i !== 0) {
      cuerpoFormateado = '.' + cuerpoFormateado;
      count = 0;
    }
  }

  return `${cuerpoFormateado}-${dv}`;
}

/**
 * Formatea una fecha u hora para comandas y KDS
 */
export function formatDateTime(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
}

/**
 * Formatea la hora simple (HH:mm) para tickets y KDS
 */
export function formatTimeSimple(date: string | Date | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Retorna el tiempo transcurrido en minutos (útil para alertar demoras en el KDS)
 */
export function getElapsedMinutes(date: string | Date | undefined): number {
  if (!date) return 0;
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  return Math.max(0, Math.floor(diffMs / 60000));
}
