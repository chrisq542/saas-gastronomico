'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Receipt,
  Users,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Award,
  ArrowUpRight,
  Truck,
  CreditCard,
  UtensilsCrossed,
  Layers,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  ORDER_STATUS_CONFIG,
  OrderStatusType,
  PAYMENT_METHOD_LABELS,
  DELIVERY_TYPE_LABELS,
  DeliveryType,
  PaymentMethodType,
} from '@/constants/orders';
import { ROUTES } from '@/constants/routes';

interface MonthlyStat {
  monthKey: string;
  monthLabel: string;
  orderCount: number;
  revenue: number;
  deliveredCount: number;
}

interface TopProduct {
  id: string;
  name: string;
  imageUrl: string | null;
  categoryName: string;
  unitsSold: number;
  revenue: number;
  percentageOfTotal: number;
}

interface BreakdownItem {
  type?: string;
  method?: string;
  count: number;
  total: number;
  percentage: number;
}

interface RecentOrder {
  id: string;
  orderNumber: number;
  customerName: string;
  total: number;
  status: OrderStatusType;
  deliveryType: DeliveryType;
  paymentMethod: PaymentMethodType;
  itemsCount: number;
  createdAt: string;
}

interface AnalyticsData {
  restaurant: {
    id: string;
    name: string;
    slug: string;
  };
  period: string;
  kpis: {
    totalRevenue: number;
    totalOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    cancelledOrders: number;
    averageTicket: number;
    deliverySuccessRate: number;
    uniqueCustomers: number;
  };
  monthlyStats: MonthlyStat[];
  topProducts: TopProduct[];
  paymentMethods: BreakdownItem[];
  deliveryTypes: BreakdownItem[];
  recentOrders: RecentOrder[];
}

interface TenantSalesTabProps {
  tenantId: string;
  tenantName: string;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function TenantSalesTab({
  tenantId,
  tenantName,
  showToast,
}: TenantSalesTabProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('all');

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/admin/restaurants/${tenantId}/analytics?period=${period}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        showToast('error', json.message || 'Error al cargar métricas de ventas.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [tenantId, period, showToast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Cálculos para el histograma de barras mensual
  const maxMonthlyOrders = useMemo(() => {
    if (!data?.monthlyStats || data.monthlyStats.length === 0) return 1;
    const max = Math.max(...data.monthlyStats.map((m) => m.orderCount));
    return max > 0 ? max : 1;
  }, [data]);

  const maxMonthlyRevenue = useMemo(() => {
    if (!data?.monthlyStats || data.monthlyStats.length === 0) return 1;
    const max = Math.max(...data.monthlyStats.map((m) => m.revenue));
    return max > 0 ? max : 1;
  }, [data]);

  const periods = [
    { id: 'all', label: 'Todo el histórico' },
    { id: '30d', label: 'Últimos 30 días' },
    { id: '90d', label: 'Últimos 3 meses' },
    { id: '6m', label: 'Últimos 6 meses' },
    { id: '1y', label: 'Último año' },
  ];

  if (loading && !data) {
    return (
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-12 text-center shadow-xs">
        <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
        <h4 className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
          Procesando métricas de ventas...
        </h4>
        <p className="text-xs text-zinc-500 mt-1">
          Calculando pedidos registrados, productos más vendidos y facturación de {tenantName}.
        </p>
      </div>
    );
  }

  const kpis = data?.kpis;
  const monthlyStats = data?.monthlyStats || [];
  const topProducts = data?.topProducts || [];
  const paymentMethods = data?.paymentMethods || [];
  const deliveryTypes = data?.deliveryTypes || [];
  const recentOrders = data?.recentOrders || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Cabecera del Dashboard con Filtro de Período */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-100 tracking-tight">
                Dashboard de Ventas & Métricas
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Análisis de pedidos, facturación y catálogo para {tenantName}
              </p>
            </div>
          </div>
        </div>

        {/* Selector de Período y Botón Refrescar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl text-xs">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${period === p.id
                    ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-2xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid de KPIs Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Ingresos Totales */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Ventas Totales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100 font-mono">
              {formatCurrency(kpis?.totalRevenue || 0)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <span>Sin pedidos cancelados</span>
            </p>
          </div>
        </div>

        {/* KPI 2: Total de Pedidos */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Pedidos Registrados
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100 font-mono">
              {kpis?.totalOrders || 0}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1.5 flex-wrap">
              <span className="text-emerald-600 font-medium">
                {kpis?.deliveredOrders || 0} entregados
              </span>
              <span>•</span>
              <span className="text-amber-600 font-medium">
                {kpis?.pendingOrders || 0} en curso
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Ticket Promedio (AOV)
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100 font-mono">
              {formatCurrency(kpis?.averageTicket || 0)}
            </div>
            <p className="text-[11px] text-zinc-500 mt-1">
              Gasto medio por orden válida
            </p>
          </div>
        </div>

        {/* KPI 4: Clientes Únicos & Cumplimiento */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
              Clientes & Efectividad
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100 font-mono">
              {kpis?.uniqueCustomers || 0}{' '}
              <span className="text-xs font-normal text-zinc-500 font-sans">comensales</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 inline" />
              <span>{kpis?.deliverySuccessRate || 0}% tasa de entrega</span>
            </p>
          </div>
        </div>
      </div>

      {/* SECCIÓN 1: Pedidos Registrados por Mes (Histograma Gráfico & Tabla) */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100">
                Evolución de Pedidos & Ventas por Mes
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Frecuencia histórica de pedidos registrados y facturación acumulada
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-zinc-500">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span>Facturación ($)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>Cantidad de Pedidos</span>
            </div>
          </div>
        </div>

        {monthlyStats.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500">
            No se han registrado pedidos en este período temporal.
          </div>
        ) : (
          <>
            {/* Visual Bar Chart (Responsive) */}
            <div className="pt-6 pb-2">
              <div className="h-48 flex items-end gap-3 sm:gap-6 border-b border-zinc-200 dark:border-zinc-800 px-2 sm:px-4">
                {monthlyStats.map((item) => {
                  const orderHeightPercent = Math.max(
                    8,
                    Math.round((item.orderCount / maxMonthlyOrders) * 100)
                  );
                  const revenueHeightPercent = Math.max(
                    6,
                    Math.round((item.revenue / maxMonthlyRevenue) * 100)
                  );

                  return (
                    <div
                      key={item.monthKey}
                      className="flex-1 flex flex-col items-center h-full justify-end group relative"
                    >
                      {/* Tooltip flotante al hacer hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none absolute -top-12 z-20 bg-zinc-950 text-white dark:bg-white dark:text-zinc-950 text-[10px] rounded-lg px-2.5 py-1.5 shadow-xl whitespace-nowrap font-medium flex flex-col items-center">
                        <span className="font-bold">{item.monthLabel}</span>
                        <span>
                          {item.orderCount} pedidos • {formatCurrency(item.revenue)}
                        </span>
                        <div className="w-2 h-2 bg-zinc-950 dark:bg-white rotate-45 -mb-1 mt-0.5" />
                      </div>

                      {/* Columnas duales */}
                      <div className="w-full max-w-[48px] flex items-end justify-center gap-1 h-full">
                        {/* Barra de Pedidos */}
                        <div
                          style={{ height: `${item.orderCount > 0 ? orderHeightPercent : 4}%` }}
                          className={`w-1/2 rounded-t-md transition-all duration-500 ${item.orderCount > 0
                              ? 'bg-blue-500/80 group-hover:bg-blue-500'
                              : 'bg-zinc-100 dark:bg-zinc-800'
                            }`}
                        />
                        {/* Barra de Facturación */}
                        <div
                          style={{ height: `${item.revenue > 0 ? revenueHeightPercent : 4}%` }}
                          className={`w-1/2 rounded-t-md transition-all duration-500 ${item.revenue > 0
                              ? 'bg-emerald-500/90 group-hover:bg-emerald-400'
                              : 'bg-zinc-100 dark:bg-zinc-800'
                            }`}
                        />
                      </div>

                      {/* Etiqueta del Mes */}
                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mt-2 truncate w-full text-center">
                        {item.monthLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabla Detallada por Mes */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Mes</th>
                    <th className="py-2.5 px-3 text-center">Pedidos Registrados</th>
                    <th className="py-2.5 px-3 text-center">Pedidos Entregados</th>
                    <th className="py-2.5 px-3 text-right">Facturación</th>
                    <th className="py-2.5 px-3 text-right">Ticket Medio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                  {monthlyStats.map((item) => (
                    <tr key={item.monthKey} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-sans font-semibold text-zinc-900 dark:text-zinc-100">
                        {item.monthLabel}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium">
                          {item.orderCount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-zinc-600 dark:text-zinc-400">
                        {item.deliveredCount}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(item.revenue)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-600 dark:text-zinc-400">
                        {formatCurrency(
                          item.orderCount > 0 ? Math.round(item.revenue / item.orderCount) : 0
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* SECCIÓN 2: Lo que Más se Vende (Ranking de Productos) */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100">
                Productos Más Vendidos (Ranking Top)
              </h3>
            </div>
            <p className="text-xs text-zinc-500 mt-0.5">
              Productos con mayor volumen de salida e ingresos generados
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            Top {topProducts.length}
          </span>
        </div>

        {topProducts.length === 0 ? (
          <div className="py-10 text-center text-xs text-zinc-500">
            No hay registros de ventas para ordenar los productos más vendidos en este período.
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {topProducts.map((prod, index) => {
              const badgeColors = [
                'bg-amber-500 text-white shadow-amber-500/20 shadow-md', // Oro
                'bg-zinc-400 text-white shadow-zinc-400/20 shadow-md', // Plata
                'bg-amber-700 text-white shadow-amber-700/20 shadow-md', // Bronce
              ];

              return (
                <div
                  key={prod.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Ranking Badge */}
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[11px] shrink-0 ${index < 3
                          ? badgeColors[index]
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                        }`}
                    >
                      {index + 1}
                    </div>

                    {/* Imagen del Producto */}
                    {prod.imageUrl ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-11 h-11 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                        <UtensilsCrossed className="w-4 h-4 text-zinc-400" />
                      </div>
                    )}

                    <div className="truncate">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                        {prod.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 truncate">
                        Categoría: {prod.categoryName}
                      </p>
                    </div>
                  </div>

                  {/* Cifras de Venta y Barra de Progresión */}
                  <div className="flex items-center gap-5 sm:justify-end shrink-0 pl-9 sm:pl-0">
                    <div className="w-28 sm:w-36 space-y-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {prod.unitsSold} {prod.unitsSold === 1 ? 'unidad' : 'unidades'}
                        </span>
                        <span className="text-zinc-400 font-mono">
                          {prod.percentageOfTotal}%
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          style={{ width: `${Math.min(100, Math.max(5, prod.percentageOfTotal))}%` }}
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div className="text-right min-w-[90px]">
                      <div className="font-bold font-mono text-zinc-900 dark:text-zinc-100 text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(prod.revenue)}
                      </div>
                      <span className="text-[10px] text-zinc-400">Facturado</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: Desgloses (Canales de Entrega & Métodos de Pago) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Canales de Entrega */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <Truck className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
              Canales & Tipos de Entrega
            </h3>
          </div>

          {deliveryTypes.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Sin datos de entrega.</p>
          ) : (
            <div className="space-y-3">
              {deliveryTypes.map((item) => {
                const label =
                  DELIVERY_TYPE_LABELS[item.type as DeliveryType] || item.type || 'Otro';

                return (
                  <div key={item.type} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-zinc-400" />
                        {label}
                      </span>
                      <div className="font-mono text-right">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {item.count} pedidos
                        </span>{' '}
                        <span className="text-zinc-400 text-[11px]">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Métodos de Pago */}
        <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
            <CreditCard className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
              Medios de Pago Utilizados
            </h3>
          </div>

          {paymentMethods.length === 0 ? (
            <p className="text-xs text-zinc-500 py-6 text-center">Sin datos de pagos.</p>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((item) => {
                const label =
                  PAYMENT_METHOD_LABELS[item.method as PaymentMethodType] || item.method || 'Otro';

                return (
                  <div key={item.method} className="space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-zinc-400" />
                        {label}
                      </span>
                      <div className="font-mono text-right">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100">
                          {formatCurrency(item.total)}
                        </span>{' '}
                        <span className="text-zinc-400 text-[11px]">({item.count} pedidos)</span>
                      </div>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                      <div
                        style={{ width: `${item.percentage}%` }}
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* SECCIÓN 4: Últimos Pedidos Recientes */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100">
              Últimos Pedidos del Local
            </h3>
            <p className="text-xs text-zinc-500 mt-0.5">
              Registro reciente de compras gestionadas por el restaurante
            </p>
          </div>

          <Link
            href={ROUTES.SUPERADMIN.TENANT_ORDERS(tenantId)}
            className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            <span>Ver todos los pedidos</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="text-xs text-zinc-500 py-6 text-center">No hay pedidos recientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                  <th className="py-2.5 px-3">N° Pedido</th>
                  <th className="py-2.5 px-3">Cliente</th>
                  <th className="py-2.5 px-3">Tipo Entrega</th>
                  <th className="py-2.5 px-3">Estado</th>
                  <th className="py-2.5 px-3 text-right">Total</th>
                  <th className="py-2.5 px-3 text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                {recentOrders.map((order) => {
                  const statusConf = ORDER_STATUS_CONFIG[order.status] || {
                    label: order.status,
                    badgeClass: 'bg-zinc-100 text-zinc-700',
                  };

                  return (
                    <tr key={order.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                      <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                        #{order.orderNumber}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-zinc-800 dark:text-zinc-200">
                        {order.customerName}
                      </td>
                      <td className="py-2.5 px-3 font-sans text-zinc-500">
                        {DELIVERY_TYPE_LABELS[order.deliveryType] || order.deliveryType}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-sans font-semibold border ${statusConf.badgeClass}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(order.total)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-zinc-400 text-[11px] font-sans">
                        {new Date(order.createdAt).toLocaleDateString('es-CL', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
