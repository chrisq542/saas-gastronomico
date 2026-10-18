'use client';

import React, { useState, useEffect } from 'react';
import { Product, ProductOptionGroup, ProductOption } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  X,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Settings2,
  DollarSign,
  Utensils,
  MinusCircle,
} from 'lucide-react';

interface ProductOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  restaurantId: string;
  product: Product | null;
  onSaved?: () => void;
}

export function ProductOptionsModal({
  isOpen,
  onClose,
  restaurantId,
  product,
  onSaved,
}: ProductOptionsModalProps) {
  const [optionGroups, setOptionGroups] = useState<ProductOptionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Formulario nuevo grupo
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(false);
  const [newGroupMaxSelect, setNewGroupMaxSelect] = useState<number>(5);

  // Formulario nueva opción por grupo (indexado por groupId)
  const [newOptionNames, setNewOptionNames] = useState<Record<string, string>>({});
  const [newOptionPrices, setNewOptionPrices] = useState<Record<string, number | ''>>({});

  // Configuración de plantilla rápida de hamburguesa
  const [showBurgerPresetModal, setShowBurgerPresetModal] = useState(false);
  const [presetDoubleMeatPrice, setPresetDoubleMeatPrice] = useState<number>(2500);
  const [presetCheesePrice, setPresetCheesePrice] = useState<number>(1000);
  const [presetBaconPrice, setPresetBaconPrice] = useState<number>(1200);

  const showToast = (text: string, type: 'success' | 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchOptions = async () => {
    if (!product) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products/${product.id}/options`);
      const json = await res.json();
      if (json.success && json.data) {
        setOptionGroups(json.data);
      }
    } catch (e) {
      showToast('Error al cargar las opciones del producto', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && product) {
      fetchOptions();
    } else {
      setOptionGroups([]);
      setIsCreatingGroup(false);
      setShowBurgerPresetModal(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  // Crear grupo personalizado
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products/${product.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CREATE_GROUP',
          name: newGroupName.trim(),
          isRequired: newGroupRequired,
          minSelect: newGroupRequired ? 1 : 0,
          maxSelect: Number(newGroupMaxSelect) || 5,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Grupo creado correctamente', 'success');
        setNewGroupName('');
        setIsCreatingGroup(false);
        fetchOptions();
        onSaved?.();
      } else {
        showToast(json.message || 'Error al crear grupo', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Aplicar plantilla rápida de hamburguesas
  const handleApplyBurgerPreset = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products/${product.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'APPLY_PRESET',
          presetType: 'BURGER',
          doubleMeatPrice: presetDoubleMeatPrice,
          cheesePrice: presetCheesePrice,
          baconPrice: presetBaconPrice,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Plantilla de hamburguesa aplicada con éxito', 'success');
        setShowBurgerPresetModal(false);
        fetchOptions();
        onSaved?.();
      } else {
        showToast(json.message || 'Error al aplicar plantilla', 'error');
      }
    } catch {
      showToast('Error de conexión', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Agregar opción a un grupo
  const handleAddOption = async (groupId: string) => {
    const name = newOptionNames[groupId]?.trim();
    const price = newOptionPrices[groupId] === '' || newOptionPrices[groupId] === undefined ? 0 : Number(newOptionPrices[groupId]);

    if (!name) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products/${product.id}/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_OPTION',
          groupId,
          name,
          price,
          isAvailable: true,
        }),
      });

      const json = await res.json();
      if (json.success) {
        showToast('Opción agregada exitosamente', 'success');
        setNewOptionNames((prev) => ({ ...prev, [groupId]: '' }));
        setNewOptionPrices((prev) => ({ ...prev, [groupId]: '' }));
        fetchOptions();
        onSaved?.();
      } else {
        showToast(json.message || 'Error al agregar opción', 'error');
      }
    } catch {
      showToast('Error al conectar con el servidor', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Cambiar disponibilidad de opción
  const handleToggleOptionAvailable = async (option: ProductOption) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products/${product.id}/options`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          optionId: option.id,
          isAvailable: !option.isAvailable,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setOptionGroups((prev) =>
          prev.map((g) => ({
            ...g,
            options: g.options.map((o) => (o.id === option.id ? { ...o, isAvailable: !o.isAvailable } : o)),
          }))
        );
        onSaved?.();
      }
    } catch {
      showToast('Error al actualizar disponibilidad', 'error');
    }
  };

  // Eliminar opción
  const handleDeleteOption = async (optionId: string) => {
    if (!confirm('¿Deseas eliminar esta opción?')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products/${product.id}/options?optionId=${optionId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Opción eliminada', 'success');
        fetchOptions();
        onSaved?.();
      }
    } catch {
      showToast('Error al eliminar opción', 'error');
    }
  };

  // Eliminar grupo
  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('¿Deseas eliminar este grupo y todas sus opciones asociadas?')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products/${product.id}/options?groupId=${groupId}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (json.success) {
        showToast('Grupo eliminado', 'success');
        fetchOptions();
        onSaved?.();
      }
    } catch {
      showToast('Error al eliminar grupo', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 overflow-hidden">
        {/* Toast Notificación */}
        {toastMessage && (
          <div className="absolute top-4 right-4 z-50">
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-md border ${
                toastMessage.type === 'success'
                  ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
                  : 'bg-rose-950/90 text-rose-200 border-rose-800'
              }`}
            >
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
          </div>
        )}

        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-start justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Settings2 className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                Personalizar Ingredientes & Extras
              </h3>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Producto: <strong className="text-zinc-900 dark:text-zinc-100">{product.name}</strong> • Base:{' '}
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(product.price)}
              </span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6">
          {/* Barra de Acciones Rápidas */}
          <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-zinc-100/70 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70">
            <button
              onClick={() => setShowBurgerPresetModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Plantilla Rápida de Hamburguesas</span>
            </button>

            <button
              onClick={() => setIsCreatingGroup(!isCreatingGroup)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-300 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo Grupo de Opciones</span>
            </button>
          </div>

          {/* Modal / Formulario de Plantilla Rápida de Hamburguesas */}
          {showBurgerPresetModal && (
            <div className="p-4 rounded-xl border-2 border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold text-xs uppercase tracking-wide">
                  <Utensils className="w-4 h-4" />
                  <span>Configurar Precios de la Plantilla de Hamburguesa</span>
                </div>
                <button
                  onClick={() => setShowBurgerPresetModal(false)}
                  className="text-xs text-zinc-400 hover:text-zinc-600"
                >
                  Cerrar
                </button>
              </div>

              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Esta plantilla creará automáticamente dos grupos:
                <br />
                1) <strong>Agregados & Extras</strong> (Doble carne, Cheddar, Tocino, Cebolla caramelizada).
                <br />
                2) <strong>Quitar Ingredientes</strong> (Sin cebolla, Sin tomate, Sin pepinillos, Sin mayonesa a $0).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Precio Doble Carne ($ CLP):
                  </label>
                  <input
                    type="number"
                    value={presetDoubleMeatPrice}
                    onChange={(e) => setPresetDoubleMeatPrice(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Precio Cheddar Extra ($ CLP):
                  </label>
                  <input
                    type="number"
                    value={presetCheesePrice}
                    onChange={(e) => setPresetCheesePrice(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Precio Tocino Crocante ($ CLP):
                  </label>
                  <input
                    type="number"
                    value={presetBaconPrice}
                    onChange={(e) => setPresetBaconPrice(Number(e.target.value) || 0)}
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowBurgerPresetModal(false)}
                  className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleApplyBurgerPreset}
                  className="px-4 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow-xs disabled:opacity-50"
                >
                  {saving ? 'Aplicando...' : 'Aplicar a este Producto'}
                </button>
              </div>
            </div>
          )}

          {/* Formulario de Nuevo Grupo */}
          {isCreatingGroup && (
            <form onSubmit={handleCreateGroup} className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-500" />
                <span>Crear Nuevo Grupo de Opciones</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium mb-1">Nombre del Grupo *</label>
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Ej: Agregados, Quitar Ingredientes, Tipo de Pan..."
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium mb-1">Máx. Opciones Seleccionables</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={newGroupMaxSelect}
                    onChange={(e) => setNewGroupMaxSelect(Number(e.target.value) || 1)}
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newGroupRequired}
                    onChange={(e) => setNewGroupRequired(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>¿Es de selección obligatoria para el cliente?</span>
                </label>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreatingGroup(false)}
                    className="px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-1.5 text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-lg transition disabled:opacity-50"
                  >
                    {saving ? 'Guardando...' : 'Crear Grupo'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Listado de Grupos Existentes */}
          {loading ? (
            <div className="py-12 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-500" />
              <span>Cargando opciones del producto...</span>
            </div>
          ) : optionGroups.length === 0 ? (
            <div className="py-12 text-center space-y-2 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
              <Layers className="w-8 h-8 mx-auto text-zinc-400 dark:text-zinc-600" />
              <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                Este producto no tiene opciones de personalización configuradas
              </p>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Puedes aplicar la <strong>Plantilla Rápida de Hamburguesas</strong> para generar opciones de doble carne, extras y remoción de ingredientes en un solo clic.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {optionGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#151518] overflow-hidden shadow-xs"
                >
                  {/* Encabezado del Grupo */}
                  <div className="p-4 bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">{group.name}</h4>
                        {group.isRequired ? (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40">
                            Obligatorio
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                            Opcional (Hasta {group.maxSelect})
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500">
                        {group.options.length} opciones configuradas
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                      title="Eliminar grupo completo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Listado de Opciones del Grupo */}
                  <div className="p-4 space-y-3">
                    {group.options.length === 0 ? (
                      <p className="text-xs text-zinc-400 italic py-2">
                        No hay opciones dentro de este grupo. Agrega una a continuación:
                      </p>
                    ) : (
                      <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
                        {group.options.map((option) => (
                          <div
                            key={option.id}
                            className="py-2.5 flex items-center justify-between text-xs gap-3"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  option.isAvailable ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {option.name}
                              </span>
                              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                                {Number(option.price) > 0 ? `+${formatCurrency(option.price)}` : 'Gratis ($0)'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleToggleOptionAvailable(option)}
                                className={`px-2 py-1 rounded-md text-[10px] font-medium border flex items-center gap-1 transition ${
                                  option.isAvailable
                                    ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                                }`}
                              >
                                {option.isAvailable ? (
                                  <>
                                    <ToggleRight className="w-3.5 h-3.5" /> En Stock
                                  </>
                                ) : (
                                  <>
                                    <ToggleLeft className="w-3.5 h-3.5" /> Agotado
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => handleDeleteOption(option.id)}
                                className="p-1 rounded text-zinc-400 hover:text-rose-500 transition"
                                title="Eliminar opción"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Formulario inline para agregar nueva opción a este grupo */}
                    <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Nombre opción (ej: Doble Carne, Sin Cebolla...)"
                        value={newOptionNames[group.id] || ''}
                        onChange={(e) =>
                          setNewOptionNames((prev) => ({ ...prev, [group.id]: e.target.value }))
                        }
                        className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2"
                      />

                      <div className="flex items-center gap-2">
                        <div className="relative w-28">
                          <span className="absolute left-2.5 top-2 text-[10px] text-zinc-400">$</span>
                          <input
                            type="number"
                            min={0}
                            placeholder="Precio CLP"
                            value={
                              newOptionPrices[group.id] === undefined ? '' : newOptionPrices[group.id]
                            }
                            onChange={(e) =>
                              setNewOptionPrices((prev) => ({
                                ...prev,
                                [group.id]: e.target.value ? Number(e.target.value) : '',
                              }))
                            }
                            className="w-full text-xs pl-6 pr-2 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-mono"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={saving || !newOptionNames[group.id]?.trim()}
                          onClick={() => handleAddOption(group.id)}
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition disabled:opacity-50 whitespace-nowrap"
                        >
                          + Agregar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 transition shadow-xs"
          >
            Listo / Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
