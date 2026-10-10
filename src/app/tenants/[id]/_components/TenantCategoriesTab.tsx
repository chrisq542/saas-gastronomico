'use client';

import React, { useState } from 'react';
import { FolderPlus, ToggleLeft, ToggleRight, Trash2, Edit } from 'lucide-react';
import CategoryEditModal, { EditableCategory } from '@/components/shared/CategoryEditModal';

interface CategoryWithCount {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

interface TenantCategoriesTabProps {
  tenantId: string;
  tenantName: string;
  categories: CategoryWithCount[];
  loadingCategories: boolean;
  fetchCategories: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function TenantCategoriesTab({
  tenantId,
  tenantName,
  categories,
  loadingCategories,
  fetchCategories,
  fetchProducts,
  showToast,
}: TenantCategoriesTabProps) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatSortOrder, setNewCatSortOrder] = useState<number | ''>(0);
  const [isCreatingCat, setIsCreatingCat] = useState(false);

  const [editingCategory, setEditingCategory] = useState<EditableCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      showToast('error', 'El nombre de la categoría es requerido.');
      return;
    }

    setIsCreatingCat(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          sortOrder: Number(newCatSortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Categoría creada con éxito.');
        setNewCatName('');
        setNewCatSortOrder(0);
        fetchCategories();
      } else {
        showToast('error', data.message || 'Error al crear categoría.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleOpenEditCategory = (cat: CategoryWithCount) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleToggleCategoryActive = async (cat: CategoryWithCount) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cat.id,
          isActive: !cat.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          'success',
          `Categoría "${cat.name}" ${!cat.isActive ? 'activada' : 'desactivada (ocultada)'}.`
        );
        fetchCategories();
      } else {
        showToast('error', data.message || 'Error al actualizar estado.');
      }
    } catch {
      showToast('error', 'Error al actualizar estado.');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta categoría y sus productos asociados?')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories?id=${catId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Categoría eliminada.');
        fetchCategories();
        fetchProducts();
      } else {
        showToast('error', data.message || 'Error al eliminar.');
      }
    } catch {
      showToast('error', 'Error al eliminar categoría.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario Agregar Categoría */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <FolderPlus className="w-5 h-5" />
          <h3 className="text-base font-bold">Agregar Nueva Categoría para {tenantName}</h3>
        </div>

        <form onSubmit={handleCreateCategory} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium mb-1">Nombre Categoría *</label>
              <input
                type="text"
                required
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Ej: Hamburguesas, Bebidas, Postres..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Orden de despliegue</label>
              <input
                type="number"
                value={newCatSortOrder}
                onChange={(e) => setNewCatSortOrder(e.target.value ? Number(e.target.value) : 0)}
                placeholder="0"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreatingCat}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50"
            >
              {isCreatingCat ? 'Creando...' : 'Crear Categoría'}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Categorías */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold">Categorías Registradas ({categories.length})</h3>
        <p className="text-xs text-zinc-500">
          Si desactivas una categoría, se ocultará inmediatamente junto a sus productos de la carta del restaurant.
        </p>

        {loadingCategories ? (
          <div className="py-8 text-center text-xs text-zinc-500">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            No hay categorías registradas en este local.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {categories.map((cat) => (
              <div key={cat.id} className="py-3.5 flex items-center justify-between text-xs gap-3">
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      cat.isActive ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
                    }`}
                  />
                  <div>
                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">{cat.name}</p>
                    <span className="text-[10px] text-zinc-500">
                      {cat._count?.products || 0} producto(s) | Prioridad: {cat.sortOrder}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditCategory(cat)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition"
                    title="Editar nombre y prioridad de la categoría"
                  >
                    <Edit className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleToggleCategoryActive(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      cat.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {cat.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{cat.isActive ? 'Visible en Menú' : 'Oculto en Menú'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                    title="Eliminar categoría"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Editar Categoría */}
      <CategoryEditModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        category={editingCategory}
        restaurantId={tenantId}
        onSuccess={() => {
          fetchCategories();
          fetchProducts();
        }}
        showToast={showToast}
      />
    </div>
  );
}
