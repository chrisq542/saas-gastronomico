'use client';

import React, { useRef, useState, useEffect } from 'react';
import {
  Camera,
  Trash2,
  RefreshCw,
  ExternalLink,
  Store,
  Edit3,
} from 'lucide-react';
import { fileToBase64Optimized } from '@/lib/utils/image';
import Modal from '@/components/ui/Modal';

export interface TenantProfileData {
  id: string;
  slug: string;
  name: string;
  phone: string;
  address?: string | null;
  isActive: boolean;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  rut?: string | null;
  customDomain?: string | null;
  planType?: string | null;
  planExpiresAt?: string | null;
  users?: any[];
}

interface TenantProfileHUDProps {
  tenant: TenantProfileData;
  onUpdateSuccess: () => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function TenantProfileHUD({
  tenant,
  onUpdateSuccess,
  showToast,
}: TenantProfileHUDProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const [logoUrl, setLogoUrl] = useState<string>(tenant.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState<string>(tenant.bannerUrl || '');
  const [processingLogo, setProcessingLogo] = useState(false);
  const [processingBanner, setProcessingBanner] = useState(false);

  // Modal para editar datos del local
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [name, setName] = useState(tenant.name || '');
  const [slug, setSlug] = useState(tenant.slug || '');
  const [phone, setPhone] = useState(tenant.phone || '');
  const [address, setAddress] = useState(tenant.address || '');
  const [rut, setRut] = useState(tenant.rut || '');
  const [customDomain, setCustomDomain] = useState(tenant.customDomain || '');
  const [isActive, setIsActive] = useState(tenant.isActive ?? true);
  const [isSavingData, setIsSavingData] = useState(false);

  useEffect(() => {
    setLogoUrl(tenant.logoUrl || '');
    setBannerUrl(tenant.bannerUrl || '');
    setName(tenant.name || '');
    setSlug(tenant.slug || '');
    setPhone(tenant.phone || '');
    setAddress(tenant.address || '');
    setRut(tenant.rut || '');
    setCustomDomain(tenant.customDomain || '');
    setIsActive(tenant.isActive ?? true);
  }, [tenant]);

  // Guardar Banner en DB
  const saveBannerToDB = async (newBanner: string) => {
    setProcessingBanner(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bannerUrl: newBanner || null }),
      });
      const data = await res.json();
      if (data.success) {
        setBannerUrl(newBanner);
        showToast(
          'success',
          newBanner
            ? 'Portada actualizada y guardada en PostgreSQL.'
            : 'Portada eliminada del restaurante.'
        );
        onUpdateSuccess();
      } else {
        showToast('error', data.message || 'Error al guardar portada.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setProcessingBanner(false);
    }
  };

  // Guardar Logo en DB
  const saveLogoToDB = async (newLogo: string) => {
    setProcessingLogo(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logoUrl: newLogo || null }),
      });
      const data = await res.json();
      if (data.success) {
        setLogoUrl(newLogo);
        showToast(
          'success',
          newLogo
            ? 'Logotipo actualizado y guardado en PostgreSQL.'
            : 'Logotipo eliminado del restaurante.'
        );
        onUpdateSuccess();
      } else {
        showToast('error', data.message || 'Error al guardar logotipo.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setProcessingLogo(false);
    }
  };

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64Optimized(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        mimeType: 'image/webp',
      });
      await saveLogoToDB(base64);
    } catch (err: any) {
      showToast('error', err.message || 'Error al procesar el archivo del logotipo.');
    } finally {
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64Optimized(file, {
        maxWidth: 1280,
        maxHeight: 500,
        quality: 0.82,
        mimeType: 'image/webp',
      });
      await saveBannerToDB(base64);
    } catch (err: any) {
      showToast('error', err.message || 'Error al procesar el archivo del banner.');
    } finally {
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  const handleUpdateProfileData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !phone.trim()) {
      showToast('error', 'Nombre, Subdominio y Teléfono son obligatorios.');
      return;
    }

    setIsSavingData(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenant.id}`, {
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
        showToast('success', 'Datos del restaurante actualizados con éxito.');
        setIsEditModalOpen(false);
        onUpdateSuccess();
      } else {
        showToast('error', data.message || 'Error al actualizar datos.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsSavingData(false);
    }
  };

  return (
    <>
      <div className="-mx-4 sm:mx-0 rounded-none sm:rounded-3xl overflow-hidden border-y sm:border border-zinc-800 bg-[#0F1419] dark:bg-black shadow-2xl text-white font-sans transition-all">
        {/* Inputs ocultos para subida directa */}
        <input
          ref={logoInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLogoFile}
        />
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleBannerFile}
        />

        {/* 1. SECCIÓN DE BANNER / PORTADA */}
        <div className="relative h-44 sm:h-56 md:h-64 w-full bg-[#202327] overflow-hidden group">
          {bannerUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={bannerUrl}
              alt="Banner del restaurante"
              className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-[#202327] via-[#2f3336] to-[#202327] text-zinc-400">
              <Camera className="w-10 h-10 mb-2 opacity-40 group-hover:opacity-80 transition" />
              <p className="text-xs font-medium text-zinc-400/80">Sin portada cargada</p>
              <span className="text-[10px] text-zinc-500">
                Pasa el cursor para subir una imagen directamente a la BD
              </span>
            </div>
          )}

          {/* Botones Flotantes en Hover del Banner */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button
              type="button"
              disabled={processingBanner}
              onClick={() => bannerInputRef.current?.click()}
              className="px-4 py-2 rounded-full bg-black/75 hover:bg-black/95 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-lg backdrop-blur-md transition transform active:scale-95 disabled:opacity-50"
              title="Subir archivo desde el equipo"
            >
              {processingBanner ? (
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Camera className="w-4 h-4 text-emerald-400" />
              )}
              <span>{bannerUrl ? 'Cambiar Portada (BD)' : 'Subir Portada (BD)'}</span>
            </button>

            {bannerUrl && (
              <button
                type="button"
                disabled={processingBanner}
                onClick={() => saveBannerToDB('')}
                className="p-2 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/30 shadow-lg backdrop-blur-md transition transform active:scale-95"
                title="Quitar portada"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* 2. BARRA INFERIOR CON AVATAR Y METADATOS */}
        <div className="px-4 sm:px-6 pb-6 pt-3 relative bg-[#0F1419] dark:bg-black">
          <div className="flex items-start justify-between">
            {/* Avatar / Logo Circular */}
            <div className="relative -mt-16 sm:-mt-20 group">
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-[#0F1419] dark:border-black bg-[#202327] shadow-2xl overflow-hidden relative flex items-center justify-center ring-1 ring-white/10">
                {logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={logoUrl} alt={tenant.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-white font-bold text-3xl sm:text-4xl">
                    {tenant.name ? (
                      tenant.name.charAt(0).toUpperCase()
                    ) : (
                      <Store className="w-10 h-10 text-zinc-400" />
                    )}
                  </div>
                )}

                {/* Overlay hover para cambiar logo */}
                <div
                  onClick={() => logoInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer backdrop-blur-[2px]"
                >
                  {processingLogo ? (
                    <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                  ) : (
                    <Camera className="w-6 h-6 text-white mb-1" />
                  )}
                  <span className="text-[10px] font-semibold text-zinc-200">
                    {processingLogo ? 'Guardando...' : 'Cambiar Logo'}
                  </span>
                </div>
              </div>

              {/* Botón remover logo */}
              {logoUrl && (
                <button
                  type="button"
                  disabled={processingLogo}
                  onClick={() => saveLogoToDB('')}
                  className="absolute top-0 right-0 p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md border-2 border-[#0F1419] dark:border-black transition transform active:scale-95"
                  title="Eliminar logotipo"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Botón Editar Información */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="px-4 py-2 rounded-full border border-zinc-700 hover:border-zinc-500 bg-white/5 hover:bg-white/10 text-xs font-semibold text-white flex items-center gap-2 transition"
            >
              <Edit3 className="w-3.5 h-3.5 text-zinc-300" />
              <span>Editar Perfil</span>
            </button>
          </div>

          {/* 3. METADATOS DEL LOCAL */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {tenant.name}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  tenant.isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                    : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}
              >
                {tenant.isActive ? 'Activo' : 'Inactivo'}
              </span>
            </div>

            <p className="text-xs font-mono text-zinc-400">/{tenant.slug}</p>

            {tenant.address && (
              <p className="text-xs text-zinc-400 flex items-center gap-1 pt-0.5">
                <span>📍</span>
                <span>{tenant.address}</span>
              </p>
            )}

            <div className="pt-2 flex items-center gap-4 text-xs text-zinc-400 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="font-semibold text-white">WhatsApp:</span> {tenant.phone}
              </span>
              <a
                href={`/${tenant.slug}`}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 hover:underline flex items-center gap-1 font-medium"
              >
                <span>Ver Menú Digital</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Editar Información del Local */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Datos del Local"
        description="Modifica los datos comerciales, subdominio y contacto del restaurante."
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateProfileData} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre Comercial *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Subdominio / Slug *</label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">WhatsApp / Teléfono *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">RUT Empresa</label>
              <input
                type="text"
                value={rut}
                onChange={(e) => setRut(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Dirección Física</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1">Dominio Personalizado (opcional)</label>
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="ej: pedidos.milocal.cl"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
            <input
              type="checkbox"
              id="tenantActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="tenantActiveCheck" className="text-xs font-medium cursor-pointer">
              Local activo (permite acceso de clientes y recepción de pedidos)
            </label>
          </div>

          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSavingData}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSavingData ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>{isSavingData ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
