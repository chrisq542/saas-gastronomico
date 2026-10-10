'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Check, RefreshCw, Layers } from 'lucide-react';

export interface EditableCategory {
  id: string;
  name: string;
  sortOrder?: number;
  isActive?: boolean;
}

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: EditableCategory | null;
  restaurantId: string;
  onSuccess: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function CategoryEditModal({
  isOpen,
  onClose,
  category,
  restaurantId,
  onSuccess,
  showToast,
}: CategoryEditModalProps) {
  const [name, setName] = useState('');
  const [sortOrder, setSortOrder] = useState<number | ''>(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = Boolean(category);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSortOrder(category.sortOrder ?? 0);
      setIsActive(category.isActive ?? true);
    } else {
      setName('');
      setSortOrder(0);
      setIsActive(true);
    }
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!restaurantId) {
      showToast('error', 'Identificador de restaurante no disponible.');
      return;
    }

    if (!name.trim()) {
      showToast('error', 'El nombre de la categoría es obligatorio.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && category) {
        const res = await fetch(`/api/admin/restaurants/${restaurantId}/categories`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            categoryId: category.id,
            name: name.trim(),
            sortOrder: Number(sortOrder) || 0,
            isActive,
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast('success', `Categoría "${name}" actualizada con éxito.`);
          onSuccess();
          onClose();
        } else {
          showToast('error', data.message || 'Error al actualizar categoría.');
        }
      } else {
        const res = await fetch(`/api/admin/restaurants/${restaurantId}/categories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            sortOrder: Number(sortOrder) || 0,
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast('success', `Categoría "${name}" creada con éxito.`);
          onSuccess();
          onClose();
        } else {
          showToast('error', data.message || 'Error al crear categoría.');
        }
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Categoría' : 'Nueva Categoría'}
      description={
        isEditing
          ? 'Modifica el nombre, orden de aparición y visibilidad de la sección en la carta digital.'
          : 'Crea una nueva sección para agrupar tus productos en el menú digital.'
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nombre de la Categoría */}
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-900 dark:text-zinc-100">
            Nombre de la Categoría *
          </label>
          <div className="relative">
            <Layers className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Hamburguesas, Bebidas, Promociones..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Orden de prioridad */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-zinc-900 dark:text-zinc-100">
              Orden de Prioridad (sort order)
            </label>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Menor valor aparece primero (0, 1, 2...)
            </span>
          </div>
          <input
            type="number"
            min={0}
            step={1}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value ? Number(e.target.value) : 0)}
            placeholder="0"
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>

        {/* Estado / Visibilidad (solo al editar) */}
        {isEditing && (
          <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
            <input
              type="checkbox"
              id="editCategoryActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
            />
            <label
              htmlFor="editCategoryActive"
              className="text-xs font-medium cursor-pointer text-zinc-800 dark:text-zinc-200"
            >
              Categoría visible en la carta digital del local
            </label>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-medium transition text-zinc-700 dark:text-zinc-300"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Categoría'}
            </span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
