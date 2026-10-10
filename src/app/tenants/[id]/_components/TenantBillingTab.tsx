'use client';

import React, { useState } from 'react';

export interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: string;
}

interface TenantBillingTabProps {
  tenantId: string;
  planType: string;
  setPlanType: (val: string) => void;
  planExpiresAt: string;
  setPlanExpiresAt: (val: string) => void;
  payments: PaymentRecord[];
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function TenantBillingTab({
  tenantId,
  planType,
  setPlanType,
  planExpiresAt,
  setPlanExpiresAt,
  payments,
  showToast,
}: TenantBillingTabProps) {
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPlan(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          planExpiresAt: new Date(planExpiresAt).toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Suscripción y vencimiento actualizados.');
      } else {
        showToast('error', data.message || 'Error al actualizar suscripción.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleQuickExtend = (days: number) => {
    const current = planExpiresAt ? new Date(planExpiresAt) : new Date();
    current.setDate(current.getDate() + days);
    setPlanExpiresAt(current.toISOString().split('T')[0]);
    showToast('success', `Fecha extendida por ${days} días.`);
  };

  return (
    <div className="space-y-6">
      {/* Formulario y Resumen de Suscripción */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
              Estado de Suscripción
            </span>
            <h3 className="text-xl font-bold tracking-tight">Plan {planType} Multi-Tenant</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleQuickExtend(30)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              +30 Días
            </button>
            <button
              onClick={() => handleQuickExtend(365)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              +1 Año
            </button>
          </div>
        </div>

        <form onSubmit={handleUpdateSubscription} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Tipo de Plan</label>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="PRO">PRO Gastronómico ($49.900/mes)</option>
                <option value="ENTERPRISE">ENTERPRISE ($99.900/mes)</option>
                <option value="STARTER">STARTER ($29.900/mes)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">
                Fecha de Vencimiento de Acceso *
              </label>
              <input
                type="date"
                required
                value={planExpiresAt}
                onChange={(e) => setPlanExpiresAt(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isUpdatingPlan}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md disabled:opacity-50"
            >
              {isUpdatingPlan ? 'Actualizando...' : 'Actualizar Vencimiento'}
            </button>
          </div>
        </form>
      </div>

      {/* Historial de Pagos & Facturas */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-bold">Historial de Pagos & Comprobantes</h3>
          <p className="text-xs text-zinc-500">
            Registro de cobros mensuales y renovaciones del tenant
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[11px] font-semibold text-zinc-500">
                <th className="py-3 px-4">N° Comprobante</th>
                <th className="py-3 px-4">Fecha Pago</th>
                <th className="py-3 px-4">Monto</th>
                <th className="py-3 px-4">Método</th>
                <th className="py-3 px-4 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                  <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{p.id}</td>
                  <td className="py-3 px-4 text-zinc-500">{p.date}</td>
                  <td className="py-3 px-4 font-bold text-zinc-950 dark:text-zinc-50">
                    ${p.amount.toLocaleString('es-CL')} CLP
                  </td>
                  <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-sans">{p.method}</td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      PAGADO
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
