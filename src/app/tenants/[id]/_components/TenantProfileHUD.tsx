'use client';

import React, { useRef, useState } from 'react';
import {
  Camera,
  Trash2,
  Check,
  RefreshCw,
  ExternalLink,
  Edit3,
  Sparkles,
  Store,
  Upload,
} from 'lucide-react';
import { fileToBase64Optimized } from '@/lib/utils/image';
import { ROOT_URL } from '@/constants';

interface TenantProfileHUDProps {
  tenant: {
    id: string;
    slug: string;
    name: string;
    phone: string;
    address?: string | null;
    isActive: boolean;
  };
  logoUrl: string;
  bannerUrl: string;
  onLogoChange: (base64: string) => void;
  onBannerChange: (base64: string) => void;
  onRemoveLogo: () => void;
  onRemoveBanner: () => void;
  onSave: () => void;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  onEditProfileClick?: () => void;
}

export default function TenantProfileHUD({
  tenant,
  logoUrl,
  bannerUrl,
  onLogoChange,
  onBannerChange,
  onRemoveLogo,
  onRemoveBanner,
  onSave,
  isSaving,
  hasUnsavedChanges,
  onEditProfileClick,
}: TenantProfileHUDProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [processingLogo, setProcessingLogo] = useState(false);
  const [processingBanner, setProcessingBanner] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingLogo(true);
    setErrorMessage(null);
    try {
      // Optimizar logo (máx 400x400 para almacenar directo en PostgreSQL de forma ultraliviana)
      const base64 = await fileToBase64Optimized(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.85,
        mimeType: 'image/webp',
      });
      onLogoChange(base64);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el archivo del logotipo.');
    } finally {
      setProcessingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleBannerFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessingBanner(true);
    setErrorMessage(null);
    try {
      // Optimizar banner (máx 1280x500 para excelente nitidez en clientes y bajo peso en PostgreSQL)
      const base64 = await fileToBase64Optimized(file, {
        maxWidth: 1280,
        maxHeight: 500,
        quality: 0.82,
        mimeType: 'image/webp',
      });
      onBannerChange(base64);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al procesar el archivo del banner.');
    } finally {
      setProcessingBanner(false);
      if (bannerInputRef.current) bannerInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full bg-[#0F1419] dark:bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl text-white font-sans transition-all">
      {/* Hidden File Inputs */}
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
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={bannerUrl}
            alt="Banner del restaurante"
            className="w-full h-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-r from-[#202327] via-[#2f3336] to-[#202327] text-zinc-400">
            <Camera className="w-10 h-10 mb-2 opacity-40 group-hover:opacity-80 transition" />
            <p className="text-xs font-medium text-zinc-400/80">Sin portada cargada</p>
            <span className="text-[10px] text-zinc-500">Haz clic en "Cambiar portada" para subir un archivo</span>
          </div>
        )}

        {/* Gradiente sutil para botones */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
          <button
            type="button"
            disabled={processingBanner}
            onClick={() => bannerInputRef.current?.click()}
            className="px-4 py-2 rounded-full bg-black/70 hover:bg-black/90 text-white text-xs font-semibold flex items-center gap-2 border border-white/20 shadow-lg backdrop-blur-md transition transform active:scale-95 disabled:opacity-50"
            title="Subir imagen desde tu ordenador"
          >
            {processingBanner ? (
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <Camera className="w-4 h-4 text-emerald-400" />
            )}
            <span>{bannerUrl ? 'Cambiar portada' : 'Subir portada (BD)'}</span>
          </button>

          {bannerUrl && (
            <button
              type="button"
              onClick={onRemoveBanner}
              className="p-2 rounded-full bg-rose-950/80 hover:bg-rose-900 text-rose-200 border border-rose-500/30 shadow-lg backdrop-blur-md transition transform active:scale-95"
              title="Quitar banner"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. BARRA INFERIOR CON AVATAR Y BOTÓN "EDITAR PERFIL" */}
      <div className="px-4 sm:px-6 pb-6 pt-3 relative bg-[#0F1419] dark:bg-black">
        <div className="flex items-start justify-between">
          {/* Avatar / Logo Circular Superpuesto */}
          <div className="relative -mt-16 sm:-mt-20 group">
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 border-[#0F1419] dark:border-black bg-[#202327] shadow-2xl overflow-hidden relative flex items-center justify-center ring-1 ring-white/10">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={tenant.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-800 text-white font-bold text-3xl sm:text-4xl">
                  {tenant.name ? tenant.name.charAt(0).toUpperCase() : <Store className="w-10 h-10 text-zinc-400" />}
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
                  {processingLogo ? 'Cargando...' : 'Cambiar'}
                </span>
              </div>
            </div>

            {/* Botón flotante para remover logo si existe */}
            {logoUrl && (
              <button
                type="button"
                onClick={onRemoveLogo}
                className="absolute top-0 right-0 p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-md border-2 border-[#0F1419] dark:border-black transition transform active:scale-95"
                title="Eliminar logotipo"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* 3. METADATOS DEL RESTAURANTE */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {tenant.name}
            </h2>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tenant.isActive
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                }`}
            >
              {tenant.isActive ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          <p className="text-xs font-mono text-zinc-400">
            /{tenant.slug}
          </p>

          {tenant.address && (
            <p className="text-xs text-zinc-400 flex items-center gap-1 pt-1">
              <span>📍</span>
              <span>{tenant.address}</span>
            </p>
          )}

          <div className="pt-2 flex items-center gap-4 text-xs text-zinc-400">
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

        {/* Mensaje de Error si ocurre */}
        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-950/80 border border-rose-700/60 text-rose-200 text-xs">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}
