'use client';

import React, { useState, useEffect, useRef } from 'react';
import Modal from '@/components/ui/Modal';
import { Camera, Trash2, RefreshCw, Check, UtensilsCrossed, Link as LinkIcon } from 'lucide-react';
import { fileToBase64Optimized } from '@/lib/utils/image';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface EditableProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive?: boolean;
  isAvailable?: boolean;
  categoryId: string;
  category?: { id: string; name: string };
}

interface ProductEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: EditableProduct | null;
  tenantId: string;
  categories: CategoryOption[];
  onSuccess: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function ProductEditModal({
  isOpen,
  onClose,
  product,
  tenantId,
  categories,
  onSuccess,
  showToast,
}: ProductEditModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  const isEditing = Boolean(product);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setDescription(product.description || '');
      setPrice(product.price ?? 0);
      setCategoryId(product.categoryId || '');
      setImageUrl(product.imageUrl || '');
      setIsActive(product.isActive ?? product.isAvailable ?? true);
      setShowUrlInput(Boolean(product.imageUrl && !product.imageUrl.startsWith('data:')));
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setCategoryId(categories.length > 0 ? categories[0].id : '');
      setImageUrl('');
      setIsActive(true);
      setShowUrlInput(false);
    }
  }, [product, categories, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    try {
      const base64 = await fileToBase64Optimized(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.82,
        mimeType: 'image/webp',
      });
      setImageUrl(base64);
      setShowUrlInput(false);
    } catch {
      showToast('error', 'Error al procesar la fotografía.');
    } finally {
      setIsProcessingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tenantId) {
      showToast('error', 'No se ha especificado el identificador del restaurante.');
      return;
    }

    if (!name.trim()) {
      showToast('error', 'El nombre del producto es obligatorio.');
      return;
    }

    if (price === '' || isNaN(Number(price)) || Number(price) < 0) {
      showToast('error', 'El precio debe ser un número válido.');
      return;
    }

    if (!categoryId) {
      showToast('error', 'Debes seleccionar una categoría.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && product) {
        const res = await fetch(`/api/admin/restaurants/${tenantId}/products`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            name: name.trim(),
            description: description.trim() || null,
            price: Number(price),
            categoryId,
            imageUrl: imageUrl.trim() || null,
            isActive,
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast('success', `Producto "${name}" actualizado con éxito.`);
          onSuccess();
          onClose();
        } else {
          showToast('error', data.message || 'Error al actualizar producto.');
        }
      } else {
        const res = await fetch(`/api/admin/restaurants/${tenantId}/products`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || null,
            price: Number(price),
            categoryId,
            imageUrl: imageUrl.trim() || null,
            isActive,
          }),
        });

        const data = await res.json();
        if (data.success) {
          showToast('success', `Producto "${name}" creado con éxito.`);
          onSuccess();
          onClose();
        } else {
          showToast('error', data.message || 'Error al crear producto.');
        }
      }
    } catch {
      showToast('error', 'Error al comunicar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar Producto' : 'Nuevo Producto'}
      description={
        isEditing
          ? 'Modifica el nombre, precio, categoría, fotografía y características del producto.'
          : 'Registra un nuevo producto con su precio, foto y características para el menú digital.'
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input oculto de subida de archivo */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* Nombre y Precio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div>
            <label className="block text-xs font-medium mb-1 text-zinc-900 dark:text-zinc-100">
              Nombre del Producto *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Hamburguesa Doble Queso"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium mb-1 text-zinc-900 dark:text-zinc-100">
              Precio CLP ($) *
            </label>
            <input
              type="number"
              required
              min={0}
              step={100}
              value={price}
              onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
              placeholder="Ej: 7990"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Categoría */}
        <div>
          <label className="block text-xs font-medium mb-1 text-zinc-900 dark:text-zinc-100">
            Categoría *
          </label>
          <select
            required
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="">Selecciona Categoría...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción y Características */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium text-zinc-900 dark:text-zinc-100">
              Descripción & Características
            </label>
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
              Ingredientes, tamaño, notas de preparación
            </span>
          </div>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Pan brioche artesanal, doble carne smashed 200g, queso cheddar fundido, tocino crujiente, cebolla caramelizada y salsa especial de la casa..."
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none leading-relaxed"
          />
        </div>

        {/* Fotografía del Producto */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-zinc-900 dark:text-zinc-100">
              Fotografía del Producto
            </label>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
              Almacenamiento directo en Base de Datos
            </span>
          </div>

          <div className="p-3.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center gap-4">
            {imageUrl ? (
              <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 shrink-0 shadow-sm group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="absolute top-1 right-1 p-1 rounded-md bg-black/60 hover:bg-rose-600 text-white transition opacity-90 group-hover:opacity-100"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 bg-zinc-100/60 dark:bg-zinc-800/60 flex flex-col items-center justify-center text-zinc-400 shrink-0">
                <UtensilsCrossed className="w-6 h-6 opacity-50 mb-1" />
                <span className="text-[9px] font-medium">Sin foto</span>
              </div>
            )}

            <div className="flex-1 space-y-2 w-full">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  disabled={isProcessingFile}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-1.5 rounded-xl bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs font-semibold flex items-center gap-1.5 transition disabled:opacity-50 shadow-xs"
                >
                  {isProcessingFile ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  <span>{imageUrl ? 'Cambiar foto desde equipo' : 'Subir foto desde equipo'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs transition flex items-center gap-1"
                >
                  <LinkIcon className="w-3 h-3 text-zinc-400" />
                  <span>{showUrlInput ? 'Ocultar URL' : 'Ingresar URL'}</span>
                </button>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-500 hover:text-rose-600 text-xs transition"
                  >
                    Quitar
                  </button>
                )}
              </div>

              {showUrlInput && (
                <input
                  type="url"
                  value={imageUrl.startsWith('data:') ? '' : imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto-producto.webp"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              )}

              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-normal">
                Soporta archivos PNG, JPG y WebP. Se optimizan automáticamente y se persisten en la base de datos PostgreSQL.
              </p>
            </div>
          </div>
        </div>

        {/* Visibilidad y Disponibilidad */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800">
          <input
            type="checkbox"
            id="editProductActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 cursor-pointer"
          />
          <label htmlFor="editProductActive" className="text-xs font-medium cursor-pointer text-zinc-800 dark:text-zinc-200">
            Producto visible y disponible en la carta digital (En stock)
          </label>
        </div>

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
            disabled={isSubmitting || isProcessingFile}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>{isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Producto'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
