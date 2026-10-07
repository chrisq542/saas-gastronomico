'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import { formatCurrency, formatDateTime, formatPhoneNumber, formatRut } from '@/lib/utils/formatters';
import { ThermalTicket80mm } from '@/components/tickets/ThermalTicket80mm';
import { printThermalTicket } from '@/lib/print/thermal-ticket';
import { generateOrderWhatsAppUrl } from '@/lib/whatsapp/order-formatter';
import {
  Search,
  Printer,
  MessageCircle,
  Filter,
  CheckCircle,
  Clock,
  Bike,
  Store,
  RefreshCw,
} from 'lucide-react';

export default function OrdersAdminPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ticketOrder, setTicketOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let url = '/api/orders?limit=100';
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
    const config: Record<OrderStatus, { bg: string; text: string; label: string }> = {
      PENDING: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Pendiente' },
      PREPARING: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'En Preparación' },
      READY: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Listo' },
      DELIVERED: { bg: 'bg-slate-700', text: 'text-slate-300', label: 'Entregado' },
      CANCELLED: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Cancelado' },
    };
    const c = config[status] || { bg: 'bg-slate-800', text: 'text-slate-400', label: status };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
        {c.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Encabezado y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">Administración de Pedidos</h2>
          <p className="text-xs text-slate-400">Historial completo, emisión de tickets y WhatsApp</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda por Teléfono / RUT */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por Teléfono o RUT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-60"
            />
          </form>

          {/* Filtro de Estado */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 py-2 px-3 rounded-xl focus:outline-none"
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
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4 font-bold">N° Pedido</th>
                <th className="py-3.5 px-4 font-bold">Fecha / Hora</th>
                <th className="py-3.5 px-4 font-bold">Cliente & Teléfono</th>
                <th className="py-3.5 px-4 font-bold">Tipo</th>
                <th className="py-3.5 px-4 font-bold">Total</th>
                <th className="py-3.5 px-4 font-bold">Estado</th>
                <th className="py-3.5 px-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                    {loading ? 'Cargando pedidos...' : 'No se encontraron pedidos coincidentes'}
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-black text-white text-sm">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100">{order.customer?.name}</div>
                      <div className="text-[11px] text-slate-400">
                        {order.customer?.phone && formatPhoneNumber(order.customer.phone)}
                        {order.customer?.rut && ` • ${formatRut(order.customer.rut)}`}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-300">
                        {order.orderType === 'DELIVERY' ? (
                          <>
                            <Bike className="w-3.5 h-3.5 text-blue-400" /> Delivery
                          </>
                        ) : (
                          <>
                            <Store className="w-3.5 h-3.5 text-emerald-400" /> Retiro
                          </>
                        )}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-orange-400">
                      {formatCurrency(order.total)}
                    </td>
                    <td className="py-3.5 px-4">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as OrderStatus)}
                        className="bg-slate-950 border border-slate-700 text-[11px] rounded-lg px-2 py-1 font-semibold text-slate-200"
                      >
                        <option value="PENDING">Pendiente</option>
                        <option value="PREPARING">En Preparación</option>
                        <option value="READY">Listo</option>
                        <option value="DELIVERED">Entregado</option>
                        <option value="CANCELLED">Cancelado</option>
                      </select>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Imprimir Comanda 80mm */}
                        <button
                          onClick={() => setTicketOrder(order)}
                          title="Imprimir Ticket 80mm"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Reenviar WhatsApp */}
                        <a
                          href={generateOrderWhatsAppUrl({
                            order,
                            recipientPhone: order.customer?.phone,
                          })}
                          target="_blank"
                          rel="noreferrer"
                          title="Abrir WhatsApp con cliente"
                          className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition"
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
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">
                Imprimir Ticket #{ticketOrder.orderNumber}
              </h3>
              <button
                onClick={() => setTicketOrder(null)}
                className="text-slate-400 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl flex justify-center border border-slate-800">
              <ThermalTicket80mm
                order={ticketOrder}
                elementId="admin-order-ticket-print"
                isKitchenCopy={false}
              />
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setTicketOrder(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl"
              >
                Cerrar
              </button>
              <button
                onClick={() => printThermalTicket('admin-order-ticket-print')}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-lg transition"
              >
                <Printer className="w-4 h-4" />
                Imprimir (80mm)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
