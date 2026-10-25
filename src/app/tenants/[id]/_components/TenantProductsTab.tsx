'use client';

import React, { useState, useRef, useMemo } from 'react';
import { UtensilsCrossed, ToggleLeft, ToggleRight, Trash2, Edit, Camera, RefreshCw, Sparkles, Search, X } from 'lucide-react';
import { fileToBase64Optimized } from '@/lib/utils/image';
import ProductEditModal, { CategoryOption, EditableProduct } from '@/components/shared/ProductEditModal';
import { ProductOptionsModal } from '@/components/admin/ProductOptionsModal';

interface TenantProductsTabProps {
  tenantId: string;
  tenantName: string;
  categories: CategoryOption[];
  products: EditableProduct[];
  loadingProducts: boolean;
  fetchProducts: () => Promise<void>;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function TenantProductsTab({
  tenantId,
  tenantName,
  categories,
  products,
  loadingProducts,
  fetchProducts,
  showToast,
}: TenantProductsTabProps) {
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdCatId, setNewProdCatId] = useState('');
  const [isCreatingProd, setIsCreatingProd] = useState(false);
  const [isProcessingCreateImg, setIsProcessingCreateImg] = useState(false);
  const createProdFileRef = useRef<HTMLInputElement>(null);

  const [editingProduct, setEditingProduct] = useState<EditableProduct | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProductForOptions, setSelectedProductForOptions] = useState<any | null>(null);

  // Filtros de búsqueda en la lista de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('ALL');

  // Filtrado reactivo de productos por texto y categoría
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return products.filter((prod) => {
      const matchSearch =
        !q ||
        prod.name.toLowerCase().includes(q) ||
        (prod.description && prod.description.toLowerCase().includes(q));
      const matchCat =
        filterCategoryId === 'ALL' || prod.categoryId === filterCategoryId;
      return matchSearch && matchCat;
    });
  }, [products, searchQuery, filterCategoryId]);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCatId || newProdPrice === '') {
      showToast('error', 'Completa el nombre, precio y categoría.');
      return;
    }

    setIsCreatingProd(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName.trim(),
          description: newProdDesc.trim() || null,
          price: Number(newProdPrice),
          imageUrl: newProdImg.trim() || null,
          categoryId: newProdCatId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Producto agregado con éxito.');
        setNewProdName('');
        setNewProdDesc('');
        setNewProdPrice('');
        setNewProdImg('');
        fetchProducts();
      } else {
        showToast('error', data.message || 'Error al agregar producto.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsCreatingProd(false);
    }
  };

  const handleCreateProdImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingCreateImg(true);
    try {
      const base64 = await fileToBase64Optimized(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.82,
        mimeType: 'image/webp',
      });
      setNewProdImg(base64);
    } catch {
      showToast('error', 'Error al procesar la foto del producto.');
    } finally {
      setIsProcessingCreateImg(false);
      if (createProdFileRef.current) createProdFileRef.current.value = '';
    }
  };

  const handleOpenEditProduct = (prod: EditableProduct) => {
    setEditingProduct(prod);
    setIsProductModalOpen(true);
  };

  const handleToggleProductActive = async (prod: EditableProduct) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prod.id,
          isActive: !prod.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          'success',
          `Producto "${prod.name}" ${!prod.isActive ? 'activado' : 'desactivado (ocultado)'}.`
        );
        fetchProducts();
      } else {
        showToast('error', data.message || 'Error al actualizar producto.');
      }
    } catch {
      showToast('error', 'Error al actualizar producto.');
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products?id=${prodId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Producto eliminado.');
        fetchProducts();
      } else {
        showToast('error', data.message || 'Error al eliminar producto.');
      }
    } catch {
      showToast('error', 'Error al eliminar producto.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario Agregar Producto */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <UtensilsCrossed className="w-5 h-5" />
          <h3 className="text-base font-bold">Agregar Nuevo Producto a {tenantName}</h3>
        </div>

        <form onSubmit={handleCreateProduct} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Nombre Producto *</label>
              <input
                type="text"
                required
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder="Ej: Hamburguesa Italiana"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Precio CLP ($) *</label>
              <input
                type="number"
                required
                min={0}
                step={100}
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="8900"
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Categoría *</label>
              <select
                required
                value={newProdCatId}
                onChange={(e) => setNewProdCatId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value="">Selecciona Categoría...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Input oculto de foto */}
          <input
            ref={createProdFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleCreateProdImageFile}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Descripción y Características</label>
              <input
                type="text"
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                placeholder="Pan brioche, palta fresca, tomate, mayo de la casa..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium">Foto del Producto</label>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  Guardada en Base de Datos
                </span>
              </div>
              <div className="flex items-center gap-2">
                {newProdImg && (
                  <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={newProdImg} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewProdImg('')}
                      className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full text-[8px]"
                      title="Quitar foto"
                    >
                      ✕
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  disabled={isProcessingCreateImg}
                  onClick={() => createProdFileRef.current?.click()}
                  className="px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition flex-1"
                >
                  {isProcessingCreateImg ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
                  ) : (
                    <Camera className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                  <span>{newProdImg ? 'Cambiar foto desde equipo...' : 'Subir foto desde equipo (PNG/JPG)...'}</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreatingProd}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50"
            >
              {isCreatingProd ? 'Guardando...' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>

      {/* Listado de Productos */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
          <div>
            <h3 className="text-base font-bold text-zinc-950 dark:text-zinc-100">
              Catálogo de Productos ({filteredProducts.length}{filteredProducts.length !== products.length ? ` de ${products.length}` : ''})
            </h3>
            <p className="text-xs text-zinc-500">
              Al desactivar un producto, se ocultará inmediatamente de la carta del restaurant.
            </p>
          </div>

          {/* Barra de búsqueda con icono y selector de categoría */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px] flex-1 sm:flex-none">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar por nombre o descripción..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  title="Borrar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {categories.length > 0 && (
              <select
                value={filterCategoryId}
                onChange={(e) => setFilterCategoryId(e.target.value)}
                className="px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todas las Categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {loadingProducts ? (
          <div className="py-8 text-center text-xs text-zinc-500">Cargando productos...</div>
        ) : products.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No hay productos creados en este local.</p>
        ) : filteredProducts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs text-zinc-500">
              No se encontraron productos que coincidan con la búsqueda.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setFilterCategoryId('ALL');
              }}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Restablecer filtros
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {filteredProducts.map((prod) => (
              <div key={prod.id} className="py-3.5 flex items-center justify-between text-xs gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  {prod.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-4 h-4 text-zinc-400" />
                    </div>
                  )}

                  <div className="truncate">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{prod.name}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        ${prod.price.toLocaleString('es-CL')}
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-500 truncate">
                      Categoría: {prod.category?.name || 'Sin Categoría'}{' '}
                      {prod.description ? `— ${prod.description}` : ''}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setSelectedProductForOptions(prod)}
                    className="px-2.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:border-emerald-500/40 hover:bg-emerald-500/10 text-zinc-700 dark:text-zinc-300 hover:text-emerald-600 dark:hover:text-emerald-400 flex items-center gap-1.5 transition"
                    title="Personalizar ingredientes y agregados (Doble carne, sin cebolla, etc.)"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Opciones & Extras</span>
                  </button>

                  <button
                    onClick={() => handleOpenEditProduct(prod)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 transition"
                    title="Editar nombre, precio, foto y características"
                  >
                    <Edit className="w-3.5 h-3.5 text-zinc-500" />
                    <span>Editar</span>
                  </button>

                  <button
                    onClick={() => handleToggleProductActive(prod)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${
                      prod.isActive
                        ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    {prod.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <span>{prod.isActive ? 'Visible' : 'Oculto'}</span>
                  </button>

                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                    title="Eliminar producto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Editar Producto */}
      <ProductEditModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        product={editingProduct}
        tenantId={tenantId}
        categories={categories}
        onSuccess={fetchProducts}
        showToast={showToast}
      />

      {/* Modal Opciones & Extras (Ingredientes / Modificadores) */}
      {selectedProductForOptions && (
        <ProductOptionsModal
          isOpen={!!selectedProductForOptions}
          onClose={() => setSelectedProductForOptions(null)}
          restaurantId={tenantId}
          product={selectedProductForOptions}
          onSaved={fetchProducts}
        />
      )}
    </div>
  );
}
