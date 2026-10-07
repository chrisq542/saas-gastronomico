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
  MessageSquare,
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
            console.log('Realtime order update received:', payload);
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

      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      const json = await res.json();
      if (json.customerWhatsAppNotificationUrl && nextStatus === 'READY') {
        // Opción de enviar notificación por WhatsApp al cliente
        console.log('Notification URL available:', json.customerWhatsAppNotificationUrl);
      }
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
        className={`bg-slate-900 rounded-2xl border flex flex-col justify-between overflow-hidden shadow-lg transition duration-200 ${
          isDelayed ? 'border-rose-500 shadow-rose-950/40' : 'border-slate-800'
        }`}
      >
        {/* Cabecera de la Tarjeta */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-white tracking-tight">
              #{order.orderNumber}
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                order.orderType === 'DELIVERY'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
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
            className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
              isDelayed ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{elapsed}m</span>
          </div>
        </div>

        {/* Cuerpo: Cliente y Notas */}
        <div className="p-4 space-y-3 flex-1">
          <div className="flex justify-between items-baseline text-xs">
            <span className="font-bold text-slate-200 truncate max-w-[170px]">
              {order.customer?.name || 'Cliente'}
            </span>
            <span className="text-slate-400 text-[11px]">
              {formatTimeSimple(order.createdAt)}
            </span>
          </div>

          {/* Notas generales de cocina */}
          {order.notes && (
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-[11px] text-amber-300 flex items-start gap-1.5 font-medium">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
              <span>{order.notes}</span>
            </div>
          )}

          {/* Lista de Items */}
          <div className="space-y-2 pt-1">
            {order.items.map((item, idx) => (
              <div
                key={item.id || idx}
                className="text-xs bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80"
              >
                <div className="flex items-start gap-2">
                  <span className="bg-orange-600 text-white font-black px-1.5 py-0.5 rounded text-[11px]">
                    {item.quantity}x
                  </span>
                  <div className="flex-1">
                    <div className="font-bold text-slate-100 leading-snug">{item.productName}</div>
                    {item.notes && (
                      <div className="text-[11px] font-semibold text-orange-400 mt-1 italic">
                        👉 {item.notes}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Acciones de Cocina y Ticket */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between gap-2">
          {/* Botón de Impresión de Comanda 80mm */}
          <button
            onClick={() => setSelectedTicketOrder(order)}
            title="Imprimir comanda térmica 80mm"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition border border-slate-700"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Botones de Cambio de Fase */}
          {order.status === 'PENDING' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'PREPARING')}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
            >
              <Flame className="w-3.5 h-3.5" />
              Cocinar
            </button>
          )}

          {order.status === 'PREPARING' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'READY')}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-black py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Listo
            </button>
          )}

          {order.status === 'READY' && (
            <button
              onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow"
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
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-black text-white tracking-wide">
            KDS: Monitor de Cocina
          </h2>
          <span className="bg-orange-500/20 text-orange-400 font-bold text-xs px-2.5 py-1 rounded-full border border-orange-500/30">
            {orders.length} pedidos activos
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-emerald-400'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            {soundEnabled ? 'Sonido ON' : 'Sonido OFF'}
          </button>

          <button
            onClick={fetchOrders}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Columnas KDS (Kanban de Cocina) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Columna 1: Pendientes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-xl">
            <span className="font-bold text-sm text-amber-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              POR INICIAR ({pendingOrders.length})
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs italic">
                Sin pedidos pendientes en cola
              </div>
            ) : (
              pendingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* Columna 2: En Preparación */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-blue-500/10 border border-blue-500/30 px-4 py-2.5 rounded-xl">
            <span className="font-bold text-sm text-blue-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              EN PLANCHA / PREPARACIÓN ({preparingOrders.length})
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs italic">
                Ningún pedido en preparación actual
              </div>
            ) : (
              preparingOrders.map(renderOrderCard)
            )}
          </div>
        </div>

        {/* Columna 3: Listos para Despacho */}
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 px-4 py-2.5 rounded-xl">
            <span className="font-bold text-sm text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              LISTO / EN ESPERA ({readyOrders.length})
            </span>
          </div>

          <div className="space-y-4 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {readyOrders.length === 0 ? (
              <div className="text-center py-12 text-slate-600 text-xs italic">
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  Ticket de Comanda #{selectedTicketOrder.orderNumber}
                </h3>
                <p className="text-xs text-slate-400">Formato térmico optimizado 80mm</p>
              </div>
              <button
                onClick={() => setSelectedTicketOrder(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Vista previa del ticket */}
            <div className="bg-slate-950 p-3 rounded-2xl flex justify-center border border-slate-800">
              <ThermalTicket80mm
                order={selectedTicketOrder}
                elementId="thermal-ticket-print"
                isKitchenCopy={true}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSelectedTicketOrder(null)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={() => printThermalTicket('thermal-ticket-print')}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg transition"
              >
                <Printer className="w-4 h-4" />
                Imprimir en Térmica (80mm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
