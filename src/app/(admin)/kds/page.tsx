'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { getElapsedMinutes, formatTimeSimple } from '@/lib/utils/formatters';
import { ThermalTicket80mm } from '@/components/tickets/ThermalTicket80mm';
import { printThermalTicket } from '@/lib/print/thermal-ticket';
import {
  Printer,
  Clock,
  CheckCircle,
  Flame,
  Bike,
  Store,
  RefreshCw,
  Volume2,
  VolumeX,
  AlertTriangle,
} from 'lucide-react';

export default function KDSPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Carga inicial y actualización de pedidos activos
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?limit=100');
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data);
      }
    } catch (e) {
      console.error('Error fetching KDS orders:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Suscripción en Tiempo Real mediante Supabase Realtime
  useEffect(() => {
    fetchOrders();

    try {
      const supabase = createClient();
      const channel = supabase
        .channel('kds-orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          (payload) => {
            fetchOrders();

            // Alerta sonora para nuevos pedidos
            if (payload.eventType === 'INSERT' && soundEnabled) {
              try {
                const audio = new Audio(
                  'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'
                );
                audio.play().catch(() => {});
              } catch {}
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (e) {
      console.warn('Supabase Realtime fallback to periodic poll', e);
    }
  }, [fetchOrders, soundEnabled]);

  // Actualizar estado del pedido en la cocina
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      // Optimistic update
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );

      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
    } catch (err) {
      console.error('Error updating order status:', err);
      fetchOrders();
    }
  };

  // Filtrar pedidos por columnas activas
  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const preparingOrders = orders.filter((o) => o.status === 'PREPARING');
  const readyOrders = orders.filter((o) => o.status === 'READY');

  const renderOrderCard = (order: Order) => {
    const elapsed = getElapsedMinutes(order.createdAt);
    const isDelayed = elapsed >= 20;

    return (
      <div
        key={order.id}
        className={`bg-white dark:bg-[#121215] rounded-xl border flex flex-col justify-between overflow-hidden shadow-xs transition duration-150 ${
          isDelayed
            ? 'border-rose-400 dark:border-rose-900/70 bg-rose-50/10'
            : 'border-zinc-200/80 dark:border-zinc-800/80'
        }`}
      >
        {/* Cabecera de la Tarjeta */}
        <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-bold text-zinc-950 dark:text-zinc-50 tracking-tight">
              #{order.orderNumber}
            </span>
            <span
              className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 border ${
                order.orderType === 'DELIVERY'
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
              }`}
            >
              {order.orderType === 'DELIVERY' ? (
                <>
                  <Bike className="w-3 h-3" /> Delivery
                </>
              ) : (
                <>
                  <Store className="w-3 h-3" /> Retiro
                </>
              )}
            </span>
          </div>

          <div
            className={`flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
              isDelayed
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{elapsed}m</span>
          </div>
        </div>

        {/* Cuerpo: Cliente y Notas */}
        <div className="p-3.5 space-y-3 flex-1">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[170px]">
              {order.customer?.name || 'Cliente'}
            </span>
            <span className="text-zinc-500 dark:text-zinc-400 text-[11px]">
              {formatTimeSimple(order.createdAt)}
            </span>
          </div>

          {/* Notas generales de cocina */}
          {order.notes && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>{order.notes}</span>
            </div>
          )}

          {/* Lista de Items */}
          <div className="space-y-1.5 pt-1">
            {order.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="text-xs bg-zinc-50 dark:bg-zinc-900/60 p-2 rounded-lg border border-zinc-200/60 dark:border-zinc-800/60"
              >
                <div className="flex items-start gap-2">
                  <span className="bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 font-semibold px-1.5 py-0.5 rounded text-[10px]">
                    {item.quantity}x
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100 leading-snug">{item.productName}</div>
                    {item.notes && (
                      <div className="text-[10px] font-medium text-zinc-600 dark:text-zinc-400 mt-0.5 italic">
                        Nota: {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones de Cocina y Ticket */}
        <div className="p-2.5 bg-zinc-50/60 dark:bg-zinc-900/40 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
          {/* Botón de Impresión de Comanda 80mm */}
          <button
            onClick={() => setSelectedTicketOrder(order)}
            title="Imprimir comanda térmica 80mm"
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition border border-zinc-200 dark:border-zinc-800"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Botones de Cambio de Fase */}
          {order.status === 'PENDING' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
              className="flex-1 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <Flame className="w-3.5 h-3.5" />
              Cocinar
            </button>
          )}

          {order.status === 'PREPARING' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'READY')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Listo
            </button>
          )}

          {order.status === 'READY' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition flex items-center justify-center gap-1.5 shadow-xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Despachar
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Barra de control del KDS */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-[#121215] p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
            KDS: Monitor de Cocina
          </h2>
          <span className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-xs px-2.5 py-0.5 rounded-md">
            {orders.length} pedidos activos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
              soundEnabled
                ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-emerald-600 dark:text-emerald-400'
                : 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
          </button>

          <button
            onClick={fetchOrders}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Columnas KDS (Kanban de Cocina) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Columna 1: Pendientes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 px-3.5 py-2 rounded-lg">
            <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2 tracking-tight">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              POR INICIAR ({pendingOrders.length})
            </span>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-600 text-xs">
                Sin pedidos pendientes en cola
              </div>
            ) : (
              pendingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* Columna 2: En Preparación */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 px-3.5 py-2 rounded-lg">
            <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2 tracking-tight">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              EN PLANCHA / PREPARACIÓN ({preparingOrders.length})
            </span>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-600 text-xs">
                Ningún pedido en preparación actual
              </div>
            ) : (
              preparingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* Columna 3: Listos para Despacho */}
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-zinc-100/80 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800/80 px-3.5 py-2 rounded-lg">
            <span className="font-semibold text-xs text-zinc-800 dark:text-zinc-200 flex items-center gap-2 tracking-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              LISTO / EN ESPERA ({readyOrders.length})
            </span>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <div className="text-center py-12 text-zinc-400 dark:text-zinc-600 text-xs">
                No hay pedidos en zona de empaque
              </div>
            ) : (
              readyOrders.map(renderOrderCard)
            )}
          </div>
        </div>
      </div>

      {/* Modal de Previsualización e Impresión de Ticket Térmico 80mm */}
      {selectedTicketOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                  Comanda #{selectedTicketOrder.orderNumber}
                </h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Formato térmico optimizado 80mm</p>
              </div>
              <button
                onClick={() => setSelectedTicketOrder(null)}
                className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            {/* Vista previa del ticket térmico (Mantiene aislamiento fondo blanco y tinta negra) */}
            <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg flex justify-center border border-zinc-200 dark:border-zinc-800">
              <ThermalTicket80mm
                order={selectedTicketOrder}
                elementId="thermal-ticket-print"
                isKitchenCopy={true}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setSelectedTicketOrder(null)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg transition"
              >
                Cerrar
              </button>
              <button
                onClick={() => printThermalTicket('thermal-ticket-print')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir en Térmica (80mm)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
