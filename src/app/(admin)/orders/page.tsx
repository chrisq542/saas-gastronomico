'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime, formatPhoneNumber, formatRut } from '@/lib/utils/formatters';
import { ThermalTicket80mm } from '@/components/tickets/ThermalTicket80mm';
import { printThermalTicket } from '@/lib/print/thermal-ticket';
import { generateOrderWhatsAppUrl } from '@/lib/whatsapp/order-formatter';
import {
  Search,
  Printer,
  MessageCircle,
  Bike,
  Store,
  RefreshCw,
} from 'lucide-react';

function OrdersContent() {
  const searchParams = useSearchParams();
  const restaurantId = searchParams.get('restaurantId');

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/api/orders?limit=100';
      if (restaurantId) url += `&restaurantId=${encodeURIComponent(restaurantId)}`;
      if (statusFilter !== 'ALL') url += `&status=${statusFilter}`;
      if (searchTerm.trim()) url += `&phone=${encodeURIComponent(searchTerm)}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success && json.data) {
        setOrders(json.data);
      }
    } catch (e) {
      console.error('Error fetching admin orders:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders();
  };

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    try {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (e) {
      fetchOrders();
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<OrderStatus, { bg: string; text: string; border: string; label: string }> = {
      PENDING: {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-900/50',
        label: 'Pendiente',
      },
      PREPARING: {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-900/50',
        label: 'En Preparación',
      },
      READY: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-900/50',
        label: 'Listo',
      },
      DELIVERED: {
        bg: 'bg-zinc-100 dark:bg-zinc-850',
        text: 'text-zinc-700 dark:text-zinc-300',
        border: 'border-zinc-200 dark:border-zinc-800',
        label: 'Entregado',
      },
      CANCELLED: {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-900/50',
        label: 'Cancelado',
      },
    };
    const c = config[status] || {
      bg: 'bg-zinc-100 dark:bg-zinc-800',
      text: 'text-zinc-600 dark:text-zinc-400',
      border: 'border-zinc-200 dark:border-zinc-700',
      label: status,
    };
    return (
      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${c.bg} ${c.text} ${c.border}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] p-4 sm:p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight">
            Gestión de Pedidos
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Historial de comandas, reimpresión térmica y contacto WhatsApp
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Búsqueda por Teléfono / RUT */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por Teléfono o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 w-52 sm:w-60"
            />
          </form>

          {/* Filtro de Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-800 dark:text-zinc-200 py-1.5 px-3 rounded-lg focus:outline-none"
          >
            <option value="ALL">Todos los Estados</option>
            <option value="PENDING">Pendientes</option>
            <option value="PREPARING">En Preparación</option>
            <option value="READY">Listos</option>
            <option value="DELIVERED">Entregados</option>
            <option value="CANCELLED">Cancelados</option>
          </select>

          <button
            onClick={fetchOrders}
            className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50/80 dark:bg-zinc-900/60 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider border-b border-zinc-200/80 dark:border-zinc-800/80">
              <tr>
                <th className="py-3 px-4 font-semibold text-[11px]">N° Pedido</th>
                <th className="py-3 px-4 font-semibold text-[11px]">Fecha / Hora</th>
                <th className="py-3 px-4 font-semibold text-[11px]">Cliente</th>
                <th className="py-3 px-4 font-semibold text-[11px]">Modalidad</th>
                <th className="py-3 px-4 font-semibold text-[11px]">Total</th>
                <th className="py-3 px-4 font-semibold text-[11px]">Estado</th>
                <th className="py-3 px-4 font-semibold text-[11px] text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 dark:divide-zinc-800/80 text-zinc-800 dark:text-zinc-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-zinc-400 dark:text-zinc-600">
                    {loading ? 'Cargando pedidos...' : 'No se encontraron pedidos'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition">
                    <td className="py-3 px-4 font-semibold text-zinc-950 dark:text-zinc-50 text-xs">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 dark:text-zinc-400 text-[11px]">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{order.customer?.name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {order.customer?.phone && formatPhoneNumber(order.customer.phone)}
                        {order.customer?.rut && ` • ${formatRut(order.customer.rut)}`}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
                        {order.orderType === 'DELIVERY' ? (
                          <>
                            <Bike className="w-3.5 h-3.5 text-blue-500" /> Delivery
                          </>
                        ) : (
                          <>
                            <Store className="w-3.5 h-3.5 text-emerald-500" /> Retiro
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-zinc-950 dark:text-zinc-100">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                          className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] rounded-md px-2 py-0.5 text-zinc-700 dark:text-zinc-300 focus:outline-none"
                        >
                          <option value="PENDING">Pendiente</option>
                          <option value="PREPARING">En Preparación</option>
                          <option value="READY">Listo</option>
                          <option value="DELIVERED">Entregado</option>
                          <option value="CANCELLED">Cancelado</option>
                        </select>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Imprimir Comanda 80mm */}
                        <button
                          onClick={() => setTicketOrder(order)}
                          title="Imprimir Ticket Térmico 80mm"
                          className="p-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-600 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition border border-zinc-200 dark:border-zinc-800"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* WhatsApp con cliente */}
                        <a
                          href={generateOrderWhatsAppUrl({
                            order,
                            recipientPhone: order.customer?.phone,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir WhatsApp con cliente"
                          className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/80 transition"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Impresión */}
      {ticketOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-5 space-y-4 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
                Imprimir Ticket #{ticketOrder.orderNumber}
              </h3>
              <button
                onClick={() => setTicketOrder(null)}
                className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 text-xs font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg flex justify-center border border-zinc-200 dark:border-zinc-800">
              <ThermalTicket80mm
                order={ticketOrder}
                elementId="admin-order-ticket-print"
                isKitchenCopy={false}
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setTicketOrder(null)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg transition"
              >
                Cerrar
              </button>
              <button
                onClick={() => printThermalTicket('admin-order-ticket-print')}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg shadow-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir (80mm)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center space-y-2">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto text-zinc-400" />
            <p className="text-xs text-zinc-500">Cargando pedidos...</p>
          </div>
        </div>
      }
    >
      <OrdersContent />
    </Suspense>
  );
}
