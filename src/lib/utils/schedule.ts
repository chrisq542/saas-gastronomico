/**
 * Tipos y utilidades para la gestión de horarios semanales del restaurante
 */

export type DayOfWeek =
  | 'Lunes'
  | 'Martes'
  | 'Miércoles'
  | 'Jueves'
  | 'Viernes'
  | 'Sábado'
  | 'Domingo';

export interface DaySchedule {
  day: DayOfWeek;
  isOpen: boolean;
  openTime: string; // formato "HH:MM", ej: "12:00"
  closeTime: string; // formato "HH:MM", ej: "23:00"
}

export const DAYS_OF_WEEK: DayOfWeek[] = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

export const DEFAULT_WEEK_SCHEDULE: DaySchedule[] = [
  { day: 'Lunes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Martes', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Miércoles', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Jueves', isOpen: true, openTime: '12:00', closeTime: '23:00' },
  { day: 'Viernes', isOpen: true, openTime: '12:00', closeTime: '00:00' },
  { day: 'Sábado', isOpen: true, openTime: '12:00', closeTime: '00:00' },
  { day: 'Domingo', isOpen: true, openTime: '12:00', closeTime: '22:00' },
];

/**
 * Parsea un string almacenado en base de datos.
 * Puede ser un JSON con DaySchedule[] o un texto simple.
 */
export function parseSchedule(scheduleRaw?: string | null): DaySchedule[] | null {
  if (!scheduleRaw || !scheduleRaw.trim()) return null;

  try {
    const parsed = JSON.parse(scheduleRaw);
    if (Array.isArray(parsed) && parsed.length === 7) {
      // Validar estructura básica
      const isValid = parsed.every(
        (item) =>
          typeof item.day === 'string' &&
          typeof item.isOpen === 'boolean' &&
          typeof item.openTime === 'string' &&
          typeof item.closeTime === 'string'
      );
      if (isValid) return parsed as DaySchedule[];
    }
  } catch {
    // Si no es JSON, es texto plano heredado
  }

  return null;
}

/**
 * Convierte un arreglo de 7 días a un JSON string para guardarlo en la base de datos
 */
export function serializeSchedule(days: DaySchedule[]): string {
  return JSON.stringify(days);
}

/**
 * Retorna un resumen legible en texto de la semana
 */
export function formatScheduleSummary(scheduleRaw?: string | null): string {
  if (!scheduleRaw || !scheduleRaw.trim()) return 'Horario no configurado';

  const structured = parseSchedule(scheduleRaw);
  if (!structured) {
    // Si es texto plano
    return scheduleRaw;
  }

  const openDays = structured.filter((d) => d.isOpen);
  if (openDays.length === 0) return 'Temporalmente cerrado toda la semana';

  // Verificar si todos los días abiertos tienen el mismo horario
  const first = openDays[0];
  const allSameTime = openDays.every(
    (d) => d.openTime === first.openTime && d.closeTime === first.closeTime
  );

  if (openDays.length === 7 && allSameTime) {
    return `Todos los días: ${first.openTime} a ${first.closeTime} hrs`;
  }

  // Agrupar Lun-Vie si son iguales
  const lunVie = structured.slice(0, 5);
  const sabDom = structured.slice(5, 7);

  const lunVieSame = lunVie.every(
    (d) => d.isOpen && d.openTime === lunVie[0].openTime && d.closeTime === lunVie[0].closeTime
  );
  const sabDomSame = sabDom.every(
    (d) => d.isOpen && d.openTime === sabDom[0].openTime && d.closeTime === sabDom[0].closeTime
  );

  if (lunVieSame && sabDomSame && lunVie[0].openTime === sabDom[0].openTime && lunVie[0].closeTime === sabDom[0].closeTime) {
    return `Lun a Dom: ${lunVie[0].openTime} a ${lunVie[0].closeTime} hrs`;
  }

  if (lunVieSame && sabDomSame) {
    return `Lun a Vie: ${lunVie[0].openTime}-${lunVie[0].closeTime} | Sáb y Dom: ${sabDom[0].openTime}-${sabDom[0].closeTime}`;
  }

  return `${openDays.length} días de atención • Toca para ver detalle`;
}

/**
 * Obtiene el índice (0-6 donde 0 = Lunes) del día actual según la fecha local
 */
export function getTodayDayIndex(): number {
  const day = new Date().getDay(); // 0 es Domingo, 1 es Lunes...
  return day === 0 ? 6 : day - 1;
}

/**
 * Calcula si el local está actualmente abierto según la hora y día actual
 */
export function getRestaurantOpenStatus(scheduleRaw?: string | null): {
  isOpen: boolean;
  statusText: string;
  detailText: string;
} {
  if (!scheduleRaw) {
    return {
      isOpen: true,
      statusText: 'Abierto',
      detailText: 'Atención online disponible',
    };
  }

  const structured = parseSchedule(scheduleRaw);
  if (!structured) {
    return {
      isOpen: true,
      statusText: 'Abierto',
      detailText: scheduleRaw.split('\n')[0] || 'Horario continuo',
    };
  }

  const now = new Date();
  const todayIdx = getTodayDayIndex();
  const todaySchedule = structured[todayIdx];

  if (!todaySchedule || !todaySchedule.isOpen) {
    // Buscar próximo día abierto
    let nextOpenDay = '';
    for (let i = 1; i <= 7; i++) {
      const nextIdx = (todayIdx + i) % 7;
      if (structured[nextIdx].isOpen) {
        nextOpenDay = `${structured[nextIdx].day} a las ${structured[nextIdx].openTime}`;
        break;
      }
    }

    return {
      isOpen: false,
      statusText: 'Cerrado hoy',
      detailText: nextOpenDay ? `Abre el ${nextOpenDay}` : 'Cerrado temporalmente',
    };
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openH, openM] = todaySchedule.openTime.split(':').map(Number);
  const [closeH, closeM] = todaySchedule.closeTime.split(':').map(Number);

  const openMinutes = openH * 60 + (openM || 0);
  let closeMinutes = closeH * 60 + (closeM || 0);

  // Si la hora de cierre es 00:00 o menor a la de apertura (madrugada del día siguiente, ej 01:00)
  if (closeMinutes <= openMinutes) {
    closeMinutes += 24 * 60; // extiende después de medianoche
  }

  // Ajustar currentMinutes si estamos en la madrugada post-medianoche
  let adjustedCurrent = currentMinutes;
  if (currentMinutes < openMinutes && closeMinutes > 24 * 60) {
    adjustedCurrent += 24 * 60;
  }

  if (adjustedCurrent >= openMinutes && adjustedCurrent < closeMinutes) {
    return {
      isOpen: true,
      statusText: 'Abierto ahora',
      detailText: `Cierra a las ${todaySchedule.closeTime} hrs`,
    };
  }

  if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      statusText: 'Cerrado por ahora',
      detailText: `Abre hoy a las ${todaySchedule.openTime} hrs`,
    };
  }

  return {
    isOpen: false,
    statusText: 'Cerrado por hoy',
    detailText: `Abrió hasta las ${todaySchedule.closeTime} hrs`,
  };
}
