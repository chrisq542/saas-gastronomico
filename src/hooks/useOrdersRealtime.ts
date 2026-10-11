import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { playNewOrderSound, unlockAudio } from '@/lib/utils/sound';

export interface UseOrdersRealtimeOptions {
  restaurantId?: string | null;
  soundEnabled?: boolean;
  onOrderChange: () => void;
  onNewOrder?: (order: any) => void;
}

/**
 * Hook reutilizable para suscribirse a cambios de pedidos en tiempo real con Supabase Realtime (WebSockets).
 * Aísla por restaurantId cuando se especifica para evitar interferencia entre locales.
 */
export function useOrdersRealtime({
  restaurantId,
  soundEnabled = true,
  onOrderChange,
  onNewOrder,
}: UseOrdersRealtimeOptions) {
  // Referencias mutables para callbacks estables
  const onOrderChangeRef = useRef(onOrderChange);
  const onNewOrderRef = useRef(onNewOrder);
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    onOrderChangeRef.current = onOrderChange;
  }, [onOrderChange]);

  useEffect(() => {
    onNewOrderRef.current = onNewOrder;
  }, [onNewOrder]);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  // Listener para desbloquear audio en la primera interacción del usuario con la ventana
  useEffect(() => {
    const handleUserInteraction = () => {
      unlockAudio();
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };

    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('keydown', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    let isRealtimeActive = false;
    let channel: any = null;
    let supabase: any = null;

    try {
      supabase = createClient();
      const channelName = restaurantId
        ? `orders-realtime-${restaurantId}`
        : 'orders-realtime-all';

      // Filtro PostgreSQL a nivel de fila para aislar tenants
      const postgresFilter = restaurantId
        ? `restaurant_id=eq.${restaurantId}`
        : undefined;

      console.log(`[Realtime] Conectando WebSocket al canal "${channelName}"...`, { postgresFilter });

      channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            ...(postgresFilter ? { filter: postgresFilter } : {}),
          },
          (payload: any) => {
            console.log('[Realtime] ⚡ Evento recibido por WebSocket:', payload.eventType, payload.new);

            // Disparar recarga de pedidos
            if (onOrderChangeRef.current) {
              onOrderChangeRef.current();
            }

            // Notificación sonora y callback de nueva orden
            if (payload.eventType === 'INSERT') {
              if (soundEnabledRef.current) {
                playNewOrderSound();
              }
              if (onNewOrderRef.current) {
                onNewOrderRef.current(payload.new);
              }
            }
          }
        )
        .subscribe((status: string, err: any) => {
          console.log(`[Realtime] Estado de suscripción (${channelName}):`, status);
          if (status === 'SUBSCRIBED') {
            isRealtimeActive = true;
          }
          if (err || status === 'CHANNEL_ERROR') {
            console.warn('[Realtime] Falló conexión WebSocket de Supabase:', err || status, '-> Activando sondeo periódico (fallback)');
          }
        });
    } catch (e) {
      console.warn('[Realtime] Falló inicialización de Supabase Realtime:', e);
    }

    // Polling inteligente de respaldo: si los WebSockets no conectan (ej: clave anónima pendiente),
    // el panel consulta cada 5 segundos para que la cocina NUNCA quede a ciegas
    const fallbackInterval = setInterval(() => {
      if (!isRealtimeActive) {
        if (onOrderChangeRef.current) {
          onOrderChangeRef.current();
        }
      }
    }, 5000);

    return () => {
      clearInterval(fallbackInterval);
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [restaurantId]);
}
