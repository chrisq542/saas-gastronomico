'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Upload,
  Trash2,
  ExternalLink,
  Loader2,
  Clock,
  Eye,
  Calendar,
} from 'lucide-react';
import TenantProfileHUD, { TenantProfileData } from './TenantProfileHUD';
import TenantScheduleModal from './TenantScheduleModal';
import { pdfFileToBase64 } from '@/lib/utils/image';
import { openPdfInNewTab } from '@/lib/utils/pdf';
import {
  parseSchedule,
  formatScheduleSummary,
  DaySchedule,
} from '@/lib/utils/schedule';
import Modal from '@/components/ui/Modal';

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
  const [menuPdfUrl, setMenuPdfUrl] = useState(tenant.menuPdfUrl || '');
  const [schedule, setSchedule] = useState(tenant.schedule || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(tenant.name || '');
    setSlug(tenant.slug || '');
    setPhone(tenant.phone || '');
    setAddress(tenant.address || '');
    setRut(tenant.rut || '');
    setCustomDomain(tenant.customDomain || '');
    setIsActive(tenant.isActive ?? true);
    setMenuPdfUrl(tenant.menuPdfUrl || '');
    setSchedule(tenant.schedule || '');
  }, [tenant]);

  const hasChanges =
    name !== (tenant.name || '') ||
    slug !== (tenant.slug || '') ||
    phone !== (tenant.phone || '') ||
    address !== (tenant.address || '') ||
    rut !== (tenant.rut || '') ||
    customDomain !== (tenant.customDomain || '') ||
    isActive !== (tenant.isActive ?? true) ||
    menuPdfUrl !== (tenant.menuPdfUrl || '') ||
    schedule !== (tenant.schedule || '');

  const handlePdfFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      showToast('error', 'Por favor selecciona un archivo PDF válido.');
      return;
    }

    setIsUploadingPdf(true);
    try {
      const base64 = await pdfFileToBase64(file, 15 * 1024 * 1024);
      setMenuPdfUrl(base64);
      showToast('success', 'Archivo PDF cargado con éxito. Haz clic en "Guardar Información" para aplicar.');
    } catch (err: any) {
      showToast('error', err?.message || 'Error al procesar el archivo PDF.');
    } finally {
      setIsUploadingPdf(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

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
          menuPdfUrl: menuPdfUrl.trim() || null,
          schedule: schedule.trim() || null,
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

            {/* Horario de Atención Semanal (7 Días) */}
            <div className="sm:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div>
                  <label className="text-xs font-semibold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>Horario de Atención Semanal (Lunes a Domingo)</span>
                  </label>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Establece la hora de apertura y cierre para cada uno de los 7 días de la semana.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Configurar Horario (7 Días)</span>
                </button>
              </div>

              {/* Tarjeta de Resumen Visual de los 7 Días */}
              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-[11px] font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider">
                    Resumen de Atención al Cliente:
                  </span>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatScheduleSummary(schedule)}
                  </span>
                </div>

                {/* Grid con los 7 días */}
                {(() => {
                  const structured = parseSchedule(schedule);
                  if (structured) {
                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                        {structured.map((item) => (
                          <div
                            key={item.day}
                            className={`p-2.5 rounded-xl border text-center transition ${item.isOpen
                              ? 'bg-white dark:bg-zinc-950 border-emerald-500/30 dark:border-emerald-500/20 shadow-2xs'
                              : 'bg-zinc-100/50 dark:bg-zinc-900/30 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60'
                              }`}
                          >
                            <p className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100">
                              {item.day.slice(0, 3)}
                            </p>
                            {item.isOpen ? (
                              <div className="mt-1 space-y-0.5 font-mono text-[10px] text-zinc-600 dark:text-zinc-400">
                                <div className="font-semibold text-zinc-900 dark:text-zinc-200">{item.openTime}</div>
                                <div className="text-[9px] text-zinc-400 font-sans">a</div>
                                <div className="font-semibold text-zinc-900 dark:text-zinc-200">{item.closeTime}</div>
                              </div>
                            ) : (
                              <p className="mt-2 text-[10px] text-zinc-400 italic">Cerrado</p>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return (
                    <div className="text-xs text-zinc-500 italic bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                      <span>{schedule || 'Aún no has configurado los horarios de los 7 días.'}</span>
                      <button
                        type="button"
                        onClick={() => setIsScheduleModalOpen(true)}
                        className="text-emerald-600 dark:text-emerald-400 font-semibold text-xs hover:underline cursor-pointer"
                      >
                        Configurar ahora →
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Carta / Menú en Formato PDF */}
            <div className="sm:col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handlePdfFile}
              />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                <label className="text-xs font-semibold flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <span>Carta / Menú en Formato PDF</span>
                </label>
                <span className="text-[10px] text-zinc-400">
                  Visible para los clientes en el banner con el botón &quot;Ver Menú PDF&quot;
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50/70 dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800 space-y-3">
                {menuPdfUrl ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-xl bg-white dark:bg-zinc-950 border border-emerald-500/30 dark:border-emerald-500/20 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <span>Menú PDF vinculado</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                            Activo
                          </span>
                        </p>
                        <p className="text-[11px] text-zinc-500 truncate max-w-xs sm:max-w-md">
                          {menuPdfUrl.startsWith('data:application/pdf')
                            ? 'Archivo PDF almacenado directamente en el sistema'
                            : menuPdfUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setIsPdfPreviewOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer shadow-xs active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Previsualizar</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => pdfInputRef.current?.click()}
                        disabled={isUploadingPdf}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cambiar PDF</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setMenuPdfUrl('')}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 transition"
                        title="Quitar PDF"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 bg-white/50 dark:bg-zinc-950/50 text-center sm:text-left">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          Aún no has configurado la carta en PDF
                        </p>
                        <p className="text-[11px] text-zinc-400">
                          Sube el archivo en formato PDF (máximo 15MB) o especifica una URL externa.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => pdfInputRef.current?.click()}
                      disabled={isUploadingPdf}
                      className="px-4 py-2 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
                    >
                      {isUploadingPdf ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Procesando PDF...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Subir archivo PDF</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Input opcional de URL externa */}
                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    O escribe un enlace directo / URL externa del PDF (opcional):
                  </label>
                  <input
                    type="url"
                    value={menuPdfUrl.startsWith('data:application/pdf') ? '' : menuPdfUrl}
                    onChange={(e) => setMenuPdfUrl(e.target.value)}
                    placeholder="https://tudominio.com/archivos/carta-menu.pdf"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                  />
                </div>
              </div>
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

      {/* Modal de Previsualización de Carta PDF en Admin */}
      {menuPdfUrl && (
        <Modal
          isOpen={isPdfPreviewOpen}
          onClose={() => setIsPdfPreviewOpen(false)}
          maxWidth="5xl"
          title={
            <div className="flex items-center justify-between gap-4 w-full">
              {/* Bloque izquierdo: Ícono + Textos */}
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
                    Previsualización de Carta: {name || tenant.name}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                    Visor oficial del documento PDF configurado
                  </p>
                </div>
              </div>
              {/* Botón compacto alineado a la derecha */}
              <button
                type="button"
                onClick={() => openPdfInNewTab(menuPdfUrl, `menu-${slug || tenant.slug}.pdf`)}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1 text-xs rounded-lg bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium transition cursor-pointer shadow-xs shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Abrir en nueva pestaña</span>
              </button>
            </div>
          }
        >
          <div className="space-y-3.5">
            <div className="w-full h-[65vh] sm:h-[75vh] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 relative shadow-inner">
              <iframe
                src={`${menuPdfUrl}#toolbar=1&navpanes=0`}
                title={`Previsualización PDF de ${name || tenant.name}`}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Configuración de Horario Semanal (7 Días) */}
      <TenantScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        currentScheduleRaw={schedule}
        onSave={(newSchedule) => setSchedule(newSchedule)}
      />
    </div>
  );
}
