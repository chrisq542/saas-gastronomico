'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  Utensils,
  CheckCircle2,
  XCircle,
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Building2,
  Filter,
  UtensilsCrossed,
  Check,
  AlertCircle,
  Layers,
} from 'lucide-react';
import ProductEditModal, { CategoryOption, EditableProduct } from '@/components/shared/ProductEditModal';
import CategoryEditModal, { EditableCategory } from '@/components/shared/CategoryEditModal';

interface RestaurantOption {
  id: string;
  name: string;
  slug: string;
}

interface ExtendedCategoryOption extends CategoryOption {
  sortOrder?: number;
  isActive?: boolean;
}

function ProductsAdminContent() {
  const searchParams = useSearchParams();
  const paramRestaurantId = searchParams.get('restaurantId');

  // Estado del local / tenant
  const [restaurantId, setRestaurantId] = useState<string | null>(paramRestaurantId);
  const [restaurants, setRestaurants] = useState<RestaurantOption[]>([]);
  const [currentRestaurantName, setCurrentRestaurantName] = useState<string>('');

  // Catálogo y Datos
  const [products, setProducts] = useState<EditableProduct[]>([]);
  const [categories, setCategories] = useState<ExtendedCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modal de edición / creación de productos
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<EditableProduct | null>(null);

  // Modal de edición / creación de categorías
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategoryToEdit, setSelectedCategoryToEdit] = useState<EditableCategory | null>(null);

  // Notificaciones Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Identificar el Tenant actual
  useEffect(() => {
    async function initTenant() {
      if (paramRestaurantId) {
        setRestaurantId(paramRestaurantId);
        return;
      }

      try {
        const authRes = await fetch('/api/auth/me');
        const authData = await authRes.json();

        if (authData.authenticated && authData.user) {
          if (authData.user.restaurantId) {
            setRestaurantId(authData.user.restaurantId);
            setCurrentRestaurantName(authData.user.restaurantName || '');
            return;
          }

          // Si es superadmin y no tiene restaurantId asignado, traer lista de restaurantes
          if (authData.user.role === 'SUPERADMIN') {
            const tenantsRes = await fetch('/api/admin/restaurants');
            const tenantsData = await tenantsRes.json();
            if (tenantsData.success && tenantsData.data?.length > 0) {
              setRestaurants(tenantsData.data);
              setRestaurantId(tenantsData.data[0].id);
              setCurrentRestaurantName(tenantsData.data[0].name);
            }
          }
        }
      } catch (err) {
        console.error('Error al resolver tenant:', err);
      }
    }

    initTenant();
  }, [paramRestaurantId]);

  // 2. Cargar Categorías y Productos del Tenant
  const loadCatalog = async () => {
    if (!restaurantId) return;

    setLoading(true);
    try {
      const [catsRes, prodsRes] = await Promise.all([
        fetch(`/api/admin/restaurants/${restaurantId}/categories`),
        fetch(`/api/admin/restaurants/${restaurantId}/products`),
      ]);

      const catsData = await catsRes.json();
      const prodsData = await prodsRes.json();

      if (catsData.success && catsData.data) {
        setCategories(catsData.data);
      }

      if (prodsData.success && prodsData.data) {
        const normalized = prodsData.data.map((p: any) => ({
          ...p,
          price: Number(p.price),
          isActive: p.isActive ?? true,
        }));
        setProducts(normalized);
      }
    } catch (e) {
      console.error('Error al cargar catálogo:', e);
      showToast('error', 'Error al cargar productos del local.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (restaurantId) {
      loadCatalog();
    }
  }, [restaurantId]);

  // Actualizar nombre del tenant al cambiar selector
  const handleSelectRestaurant = (id: string) => {
    setRestaurantId(id);
    const found = restaurants.find((r) => r.id === id);
    if (found) setCurrentRestaurantName(found.name);
  };

  // Toggle Rápido de Disponibilidad / Stock de Producto
  const handleToggleActive = async (prod: EditableProduct) => {
    if (!restaurantId) return;
    const newStatus = !(prod.isActive ?? true);

    try {
      const res = await fetch(`/api/admin/restaurants/${restaurantId}/products`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prod.id,
          isActive: newStatus,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === prod.id ? { ...p, isActive: newStatus } : p))
        );
        showToast(
          'success',
          `"${prod.name}" marcado como ${newStatus ? 'En Stock (Visible)' : 'Agotado (Oculto)'}.`
        );
      } else {
        showToast('error', data.message || 'Error al cambiar estado.');
      }
    } catch {
      showToast('error', 'Error al actualizar disponibilidad.');
    }
  };

  // Eliminar producto
  const handleDeleteProduct = async (prod: EditableProduct) => {
    if (!restaurantId) return;
    if (!confirm(`¿Estás seguro de eliminar permanentemente "${prod.name}"?`)) return;

    try {
      const res = await fetch(
        `/api/admin/restaurants/${restaurantId}/products?id=${encodeURIComponent(prod.id)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();

      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== prod.id));
        showToast('success', `Producto "${prod.name}" eliminado correctamente.`);
      } else {
        showToast('error', data.message || 'Error al eliminar producto.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    }
  };

  // Acciones de Productos
  const handleOpenCreateProduct = () => {
    setSelectedProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditProduct = (prod: EditableProduct) => {
    setSelectedProduct(prod);
    setIsProductModalOpen(true);
  };

  // Acciones de Categorías
  const handleOpenCreateCategory = () => {
    setSelectedCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    if (found) {
      setSelectedCategoryToEdit({
        id: found.id,
        name: found.name,
        sortOrder: found.sortOrder ?? 0,
        isActive: found.isActive ?? true,
      });
      setIsCategoryModalOpen(true);
    }
  };

  // Productos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        search.trim() === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

      const matchCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;

      const isAct = p.isActive ?? true;
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && isAct) ||
        (statusFilter === 'INACTIVE' && !isAct);

      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, selectedCategory, statusFilter]);

  // Agrupación por categoría
  const groupedCategories = useMemo(() => {
    if (selectedCategory !== 'ALL') {
      const currentCat = categories.find((c) => c.id === selectedCategory);
      return [
        {
          id: selectedCategory,
          name: currentCat ? currentCat.name : 'Categoría',
          products: filteredProducts,
        },
      ];
    }

    const map = new Map<string, { id: string; name: string; products: EditableProduct[] }>();

    categories.forEach((cat) => {
      map.set(cat.id, { id: cat.id, name: cat.name, products: [] });
    });

    const sinCategoriaKey = 'uncategorized';
    map.set(sinCategoriaKey, { id: sinCategoriaKey, name: 'Sin Categoría Asignada', products: [] });

    filteredProducts.forEach((prod) => {
      if (prod.categoryId && map.has(prod.categoryId)) {
        map.get(prod.categoryId)!.products.push(prod);
      } else {
        map.get(sinCategoriaKey)!.products.push(prod);
      }
    });

    return Array.from(map.values()).filter((group) => group.products.length > 0);
  }, [filteredProducts, categories, selectedCategory]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80'
              : 'bg-rose-950/90 text-rose-200 border-rose-800/80'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#121215] p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-100 tracking-tight">
              Administración de Menú & Categorías
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              {products.length} productos
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Edita nombres, precios, fotos, categorías y disponibilidad de tu catálogo gastronómico
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Tenant si hay varios (Superadmin) */}
          {restaurants.length > 1 && (
            <div className="flex items-center gap-2 bg-zinc-50 dark:bg-zinc-900 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <Building2 className="w-3.5 h-3.5 text-zinc-400" />
              <select
                value={restaurantId || ''}
                onChange={(e) => handleSelectRestaurant(e.target.value)}
                className="bg-transparent text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none cursor-pointer"
              >
                {restaurants.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Botón Refrescar */}
          <button
            onClick={loadCatalog}
            disabled={loading}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 transition"
            title="Recargar catálogo"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-500' : ''}`} />
          </button>

          {/* Botón Nueva Categoría */}
          <button
            onClick={handleOpenCreateCategory}
            disabled={!restaurantId}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition disabled:opacity-50"
          >
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span>Nueva Categoría</span>
          </button>

          {/* Botón Nuevo Producto */}
          <button
            onClick={handleOpenCreateProduct}
            disabled={!restaurantId}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#121215] p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o ingredientes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Selector de Categoría */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-zinc-400 hidden md:inline" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none"
            >
              <option value="ALL">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Filtro de Estado */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl self-start sm:self-auto text-xs">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === 'ALL'
                ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-zinc-100 shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === 'ACTIVE'
                ? 'bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            En Stock ({products.filter((p) => p.isActive ?? true).length})
          </button>
          <button
            onClick={() => setStatusFilter('INACTIVE')}
            className={`px-3 py-1 rounded-lg font-medium transition ${
              statusFilter === 'INACTIVE'
                ? 'bg-white dark:bg-zinc-800 text-rose-600 dark:text-rose-400 shadow-2xs'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900'
            }`}
          >
            Agotados ({products.filter((p) => !(p.isActive ?? true)).length})
          </button>
        </div>
      </div>

      {/* Grid de Categorías y Productos */}
      <div className="space-y-8">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mx-auto" />
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Cargando catálogo del local...</p>
          </div>
        ) : groupedCategories.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-8 space-y-3">
            <UtensilsCrossed className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              No se encontraron productos
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto">
              {search || selectedCategory !== 'ALL' || statusFilter !== 'ALL'
                ? 'Prueba modificando tus filtros o término de búsqueda.'
                : 'Comienza creando categorías y productos para la carta digital.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={handleOpenCreateCategory}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-semibold text-xs transition"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Crear Categoría</span>
              </button>
              <button
                onClick={handleOpenCreateProduct}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Primer Producto</span>
              </button>
            </div>
          </div>
        ) : (
          groupedCategories.map((group) => (
            <div key={group.id} className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
                    <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{group.name}</span>
                  </h3>

                  {group.id !== 'uncategorized' && (
                    <button
                      onClick={() => handleOpenEditCategory(group.id)}
                      className="px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 flex items-center gap-1 transition"
                      title="Editar nombre y prioridad de la categoría"
                    >
                      <Edit className="w-3 h-3 text-zinc-400" />
                      <span>Editar Categoría</span>
                    </button>
                  )}
                </div>

                <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {group.products.length} {group.products.length === 1 ? 'producto' : 'productos'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.products.map((prod) => {
                  const isAvailable = prod.isActive ?? true;

                  return (
                    <div
                      key={prod.id}
                      className={`bg-white dark:bg-[#121215] border rounded-2xl p-4 flex flex-col justify-between shadow-xs transition hover:shadow-md ${
                        isAvailable
                          ? 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                          : 'border-rose-200/60 dark:border-rose-950/40 opacity-80'
                      }`}
                    >
                      <div className="flex gap-3.5 items-start">
                        {/* Fotografía del Producto */}
                        {prod.imageUrl ? (
                          <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 shadow-2xs">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={prod.imageUrl}
                              alt={prod.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200/60 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 shrink-0">
                            <UtensilsCrossed className="w-5 h-5 opacity-60 mb-0.5" />
                            <span className="text-[9px]">Sin foto</span>
                          </div>
                        )}

                        {/* Información Principal */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-zinc-950 dark:text-zinc-100 text-xs leading-snug line-clamp-1">
                            {prod.name}
                          </h4>

                          <p className="text-zinc-950 dark:text-zinc-100 font-bold font-mono text-sm mt-0.5">
                            {formatCurrency(prod.price)}
                          </p>

                          {prod.description && (
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                              {prod.description}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Barra de Acciones y Estado */}
                      <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                        {/* Estado y Toggle Rápido */}
                        <button
                          onClick={() => handleToggleActive(prod)}
                          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition ${
                            isAvailable
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                          }`}
                          title="Hacer clic para cambiar disponibilidad"
                        >
                          {isAvailable ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>En Stock</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              <span>Agotado</span>
                            </>
                          )}
                        </button>

                        {/* Botones Editar y Eliminar */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditProduct(prod)}
                            className="px-2.5 py-1 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5 transition"
                            title="Editar nombre, precio, foto y características"
                          >
                            <Edit className="w-3 h-3 text-zinc-500" />
                            <span>Editar</span>
                          </button>

                          <button
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-1 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                            title="Eliminar producto"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Creación / Edición de Producto */}
      {restaurantId && (
        <ProductEditModal
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          product={selectedProduct}
          tenantId={restaurantId}
          categories={categories}
          onSuccess={loadCatalog}
          showToast={showToast}
        />
      )}

      {/* Modal de Creación / Edición de Categoría */}
      {restaurantId && (
        <CategoryEditModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          category={selectedCategoryToEdit}
          restaurantId={restaurantId}
          onSuccess={loadCatalog}
          showToast={showToast}
        />
      )}
    </div>
  );
}

export default function ProductsAdminPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-xs text-zinc-500">
          Cargando administración de productos...
        </div>
      }
    >
      <ProductsAdminContent />
    </Suspense>
  );
}
