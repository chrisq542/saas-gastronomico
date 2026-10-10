'use client';

import React, { useState, useEffect } from 'react';
import TenantProfileHUD, { TenantProfileData } from './TenantProfileHUD';

interface TenantInfoTabProps {
  tenant: TenantProfileData;
  tenantId: string;
  onUpdateSuccess: () => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function TenantInfoTab({
  tenant,
  tenantId,
  onUpdateSuccess,
  showToast,
}: TenantInfoTabProps) {
  const [name, setName] = useState(tenant.name || '');
  const [slug, setSlug] = useState(tenant.slug || '');
  const [phone, setPhone] = useState(tenant.phone || '');
  const [address, setAddress] = useState(tenant.address || '');
  const [rut, setRut] = useState(tenant.rut || '');
  const [customDomain, setCustomDomain] = useState(tenant.customDomain || '');
  const [isActive, setIsActive] = useState(tenant.isActive ?? true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    setName(tenant.name || '');
    setSlug(tenant.slug || '');
    setPhone(tenant.phone || '');
    setAddress(tenant.address || '');
    setRut(tenant.rut || '');
    setCustomDomain(tenant.customDomain || '');
    setIsActive(tenant.isActive ?? true);
  }, [tenant]);

  const hasChanges =
    name !== (tenant.name || '') ||
    slug !== (tenant.slug || '') ||
    phone !== (tenant.phone || '') ||
    address !== (tenant.address || '') ||
    rut !== (tenant.rut || '') ||
    customDomain !== (tenant.customDomain || '') ||
    isActive !== (tenant.isActive ?? true);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !phone.trim()) {
      showToast('error', 'Nombre, Subdominio y Teléfono son campos requeridos.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          phone: phone.trim(),
          address: address.trim() || null,
          rut: rut.trim() || null,
          customDomain: customDomain.trim() || null,
          isActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Información comercial actualizada con éxito.');
        onUpdateSuccess();
      } else {
        showToast('error', data.message || 'Error al actualizar información.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HUD de Portada, Avatar y Acciones */}
      <TenantProfileHUD
        tenant={tenant}
        onUpdateSuccess={onUpdateSuccess}
        showToast={showToast}
      />

      {/* Formulario de Datos Comerciales */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 className="text-base font-bold tracking-tight">Datos del Restaurante</h3>
            <p className="text-xs text-zinc-500">
              Modifica los datos comerciales, slug de acceso y estado de atención del local.
            </p>
          </div>
          {hasChanges && (
            <span className="text-[11px] font-semibold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
              Cambios pendientes por guardar
            </span>
          )}
        </div>

        <form onSubmit={handleUpdateInfo} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre Comercial *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Subdominio / Slug URL *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Teléfono WhatsApp de Pedidos *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+56912345678"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">RUT Empresa (Opcional)</label>
              <input
                type="text"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                placeholder="76.123.456-7"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Dirección Física del Local</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Av. Providencia 1234, Santiago"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Dominio Personalizado (Opcional)</label>
              <input
                type="text"
                value={customDomain}
                onChange={(e) => setCustomDomain(e.target.value)}
                placeholder="sazonperuana.cl"
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <input
              type="checkbox"
              id="isActiveCheckbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="isActiveCheckbox" className="text-xs font-medium cursor-pointer">
              Restaurante Activo (Permite recibir pedidos y visualizar catálogo público)
            </label>
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={isUpdating}
              className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {isUpdating ? 'Guardando...' : 'Guardar Información'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
