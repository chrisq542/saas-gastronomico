'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatCurrency, formatDateTime } from '@/lib/utils/formatters';
import { playNewOrderSound, unlockAudio } from '@/lib/utils/sound';
import {
  Clock,
  ChefHat,
  CheckCircle2,
  Bike,
  Store,
  RefreshCw,
  ArrowLeft,
  AlertCircle,
  PackageCheck,
  Send,
  ExternalLink,
} from 'lucide-react';
import { generateOrderWhatsAppUrl } from '@/lib/whatsapp/order-formatter';

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string | null;
  product?: {
    name: string;
  };
}

interface OrderDetail {
  id: string;
  orderNumber: number;
  status: 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  deliveryType: 'DELIVERY' | 'PICKUP' | 'DINE_IN';
  paymentMethod: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  notes?: string | null;
  createdAt: string;
  customer?: {
    name: string;
    phone: string;
  };
  restaurant?: {
    name: string;
    phone?: string;
  };
  items: OrderItem[];
}

const STEPS = [
  { key: 'PENDING', label: 'Recibido', desc: 'Esperando confirmación en cocina', icon: Clock },
  { key: 'PREPARING', label: 'En Cocina', desc: 'Preparando tus platos frescos', icon: ChefHat },
  { key: 'READY', label: 'Listo', desc: 'Empacado y listo para retiro o despacho', icon: PackageCheck },
  { key: 'DELIVERED', label: 'Entregado', desc: '¡Buen provecho! Pedido completado', icon: CheckCircle2 },
];

export default function OrderStatusPage() {
  const params = useParams();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar orden inicial
  const fetchOrder = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setOrder(json.data);
      } else {
        setError(json.error || 'No se encontró el pedido');
      }
    } catch {
      setError('Error al consultar el estado del pedido');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  // Suscripción Realtime por WebSockets para este pedido en particular
  useEffect(() => {
    if (!orderId) return;

    // Desbloquear audio en primera interacción
    const handleUnlock = () => {
      unlockAudio();
      window.removeEventListener('click', handleUnlock);
    };
    window.addEventListener('click', handleUnlock, { once: true });

    let channel: any = null;
    let supabase: any = null;

    try {
      supabase = createClient();
      channel = supabase
        .channel(`order-status-${orderId}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `id=eq.${orderId}`,
          },
          (payload: any) => {
            // Actualizar estado local inmediatamente
            if (payload.new) {
              setOrder((prev) => (prev ? { ...prev, status: payload.new.status } : null));
              playNewOrderSound();
            }
            fetchOrder();
          }
        )
        .subscribe();
    } catch (e) {
      console.warn('[Realtime] Subscription error:', e);
    }

    return () => {
      if (supabase && channel) {
        supabase.removeChannel(channel);
      }
      window.removeEventListener('click', handleUnlock);
    };
  }, [orderId, fetchOrder]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-zinc-500" />
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          Cargando seguimiento de tu orden...
        </p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-md mx-auto my-12 p-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-900/50">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-100">
          Pedido no encontrado
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {error || 'No pudimos localizar la información del pedido solicitado.'}
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-4 py-2 bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver al Menú
        </Link>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStepIndex = STEPS.findIndex((s) => s.key === order.status);

  const whatsappUrl = generateOrderWhatsAppUrl({
    order: {
      ...order,
      orderType: order.deliveryType,
      items: order.items.map((i) => ({
        ...i,
        productName: i.product?.name || i.productName || 'Producto',
      })),
    } as any,
    recipientPhone: order.restaurant?.phone,
    restaurantName: order.restaurant?.name,
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 pt-4 px-4 sm:px-0">
      {/* Botón Volver y Estado Vivo */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>WebSockets en Vivo</span>
        </div>
      </div>

      {/* Tarjeta Principal de Estado */}
      <div className="bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-850 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                Orden #{order.orderNumber}
              </h1>
              <span className="text-xs px-2 py-0.5 rounded-md font-medium border bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800">
                {order.deliveryType === 'DELIVERY' ? 'Delivery' : 'Retiro en Tienda'}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {formatDateTime(order.createdAt)} • Cliente: {order.customer?.name || 'Cliente'}
            </p>
          </div>

          <button
            onClick={fetchOrder}
            title="Refrescar datos"
            className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition self-start sm:self-auto"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper / Barra de Progreso en Vivo */}
        {isCancelled ? (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-center space-y-1">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-300">
              Este pedido ha sido cancelado
            </p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">
              Comunícate con el restaurante si necesitas asistencia.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Estado de la preparación
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STEPS.map((step, idx) => {
                const Icon = step.icon;
                const isPassed = currentStepIndex >= idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={step.key}
                    className={`p-3 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20'
                        : isPassed
                        ? 'bg-zinc-50 dark:bg-zinc-900/60 border-zinc-200 dark:border-zinc-800'
                        : 'bg-zinc-50/40 dark:bg-zinc-900/20 border-dashed border-zinc-200 dark:border-zinc-800/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                          isPassed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      {isPassed && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      )}
                    </div>
                    <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                      {step.label}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">
                      {step.desc}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Resumen de Productos */}
        <div className="border-t border-zinc-100 dark:border-zinc-850 pt-5 space-y-3">
          <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
            Detalle del Pedido
          </h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
            {order.items.map((item, idx) => (
              <div key={item.id || idx} className="py-2.5 flex justify-between items-start text-xs">
                <div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {item.quantity}x {item.product?.name || item.productName}
                  </span>
                  {item.notes && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 italic">
                      Nota: {item.notes}
                    </p>
                  )}
                </div>
                <span className="font-medium text-zinc-950 dark:text-zinc-50">
                  {formatCurrency(Number(item.subtotal || item.unitPrice * item.quantity))}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-zinc-100 dark:border-zinc-850 pt-3 space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(Number(order.subtotal))}</span>
            </div>
            {Number(order.deliveryFee) > 0 && (
              <div className="flex justify-between">
                <span>Costo de Envío:</span>
                <span>{formatCurrency(Number(order.deliveryFee))}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-zinc-950 dark:text-zinc-50 pt-1 border-t border-zinc-100 dark:border-zinc-850">
              <span>Total:</span>
              <span>{formatCurrency(Number(order.total))}</span>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="border-t border-zinc-100 dark:border-zinc-850 pt-5 space-y-2">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 px-4 rounded-lg shadow-xs transition text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Consultar por WhatsApp</span>
            <ExternalLink className="w-3 h-3 opacity-70" />
          </a>
        </div>
      </div>
    </div>
  );
}
