'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product, Category, SelectedProductOption } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import {
  Plus,
  ShoppingBag,
  Check,
  ArrowRight,
  Sparkles,
  Search,
  X,
  FileText,
  ExternalLink,
  Clock,
} from 'lucide-react';
import ProductCustomizeModal from './_components/ProductCustomizeModal';
import RestaurantScheduleModal from './_components/RestaurantScheduleModal';
import Modal from '@/components/ui/Modal';
import { openPdfInNewTab } from '@/lib/utils/pdf';
import { getRestaurantOpenStatus, formatScheduleSummary } from '@/lib/utils/schedule';

interface TenantCatalogClientProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    rut?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
    menuPdfUrl?: string | null;
    schedule?: string | null;
    address?: string | null;
    customDomain?: string | null;
  };
  initialCategories: (Category & { products: Product[] })[];
}

export default function TenantCatalogClient({
  restaurant,
  initialCategories,
}: TenantCatalogClientProps) {
  const { addItem, totalItems, subtotal } = useCart();
  const [categories] = useState<any[]>(initialCategories);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCustomize = (product: Product) => {
    setSelectedProduct(product);
  };

  const handleQuickAdd = (product: Product) => {
    // Si el producto tiene grupos de opciones, abrir siempre el modal para que elija
    if (product.optionGroups && product.optionGroups.length > 0) {
      handleOpenCustomize(product);
      return;
    }

    addItem(product, 1, '', []);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
  };

  const handleCustomAddToCart = (
    product: Product,
    quantity: number,
    note: string,
    options: SelectedProductOption[]
  ) => {
    addItem(product, quantity, note, options);
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1500);
  };

  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Normalizar consulta de búsqueda
  const normalizedQuery = searchQuery.trim().toLowerCase();

  // Categorías y productos filtrados
  const { filteredCategories, totalGlobalMatches, totalCategoryMatches } = useMemo(() => {
    let globalMatches = 0;
    let categoryMatches = 0;

    // Calcular coincidencias globales (en todo el menú)
    categories.forEach((cat) => {
      (cat.products || []).forEach((prod: Product) => {
        const match =
          !normalizedQuery ||
          prod.name.toLowerCase().includes(normalizedQuery) ||
          (prod.description && prod.description.toLowerCase().includes(normalizedQuery));
        if (match) globalMatches++;
      });
    });

    const categoriesPool =
      activeCategoryId === 'all'
        ? categories
        : categories.filter((c) => c.id === activeCategoryId);

    const filtered = categoriesPool
      .map((cat) => {
        if (!normalizedQuery) return cat;

        const matchingProducts = (cat.products || []).filter((prod: Product) => {
          const matchName = prod.name.toLowerCase().includes(normalizedQuery);
          const matchDesc = prod.description?.toLowerCase().includes(normalizedQuery);
          return matchName || matchDesc;
        });

        categoryMatches += matchingProducts.length;

        return {
          ...cat,
          products: matchingProducts,
        };
      })
      .filter((cat) => {
        // Si hay búsqueda, sólo mostrar categorías con al menos 1 producto
        return !normalizedQuery || (cat.products && cat.products.length > 0);
      });

    return {
      filteredCategories: filtered,
      totalGlobalMatches: globalMatches,
      totalCategoryMatches: categoryMatches,
    };
  }, [categories, activeCategoryId, normalizedQuery]);

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Promocional y Banner del Restaurante */}
      <section className="-mx-4 -mt-6 sm:mx-0 sm:mt-4 relative overflow-hidden rounded-none sm:rounded-2xl border-b sm:border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-none sm:shadow-xs">
        {restaurant.bannerUrl && (
          <div className="relative h-48 sm:h-60 md:h-72 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.bannerUrl}
              alt={`Banner promocional de ${restaurant.name}`}
              className="w-full h-full object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
          </div>
        )}

        <div className={`px-4 pt-4 pb-6 sm:p-7 relative z-10 ${restaurant.bannerUrl ? '-mt-12 sm:-mt-16' : ''}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 shadow-lg flex-shrink-0 ${restaurant.bannerUrl
                  ? 'border-white dark:border-zinc-900 bg-white dark:bg-zinc-950 ring-2 ring-black/10'
                  : 'border-zinc-200 dark:border-zinc-700'
                  }`}
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-bold text-2xl sm:text-3xl shadow-lg flex-shrink-0 ${restaurant.bannerUrl
                  ? 'border-2 border-white dark:border-zinc-900 ring-2 ring-black/10'
                  : ''
                  }`}
              >
                {restaurant.name.charAt(0)}
              </div>
            )}

            <div className="space-y-1.5 flex-1 pt-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Carta Digital Online & Pedidos</span>
                </span>

                {restaurant.schedule && (
                  <button
                    type="button"
                    onClick={() => setIsScheduleModalOpen(true)}
                    className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full border transition cursor-pointer shadow-xs active:scale-95 ${getRestaurantOpenStatus(restaurant.schedule).isOpen
                      ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
                      : 'bg-zinc-500/10 hover:bg-zinc-500/20 text-zinc-600 dark:text-zinc-400 border-zinc-500/20'
                      }`}
                    title="Ver horarios completos de atención"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${getRestaurantOpenStatus(restaurant.schedule).isOpen
                        ? 'bg-emerald-500 animate-pulse'
                        : 'bg-zinc-400'
                        }`}
                    />
                    <span>{getRestaurantOpenStatus(restaurant.schedule).statusText}</span>
                    <span className="text-[10px] opacity-75 font-normal">
                      ({getRestaurantOpenStatus(restaurant.schedule).detailText})
                    </span>
                  </button>
                )}

                {restaurant.menuPdfUrl && (
                  <button
                    type="button"
                    onClick={() => setIsPdfModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 transition cursor-pointer shadow-xs active:scale-95"
                    title="Ver carta completa en PDF"
                  >
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span>Ver Menú (PDF)</span>
                  </button>
                )}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                {restaurant.name}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pt-0.5">
                {restaurant.address && (
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                    <span>📍</span>
                    <span>{restaurant.address}</span>
                  </p>
                )}
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                Selecciona tus productos favoritos, personaliza tus ingredientes y confirma directamente por WhatsApp.
              </p>
            </div>

            {restaurant.menuPdfUrl && (
              <div className="self-stretch sm:self-center shrink-0 pt-2 sm:pt-0">
                <button
                  type="button"
                  onClick={() => setIsPdfModalOpen(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 text-xs sm:text-sm font-semibold transition shadow-md active:scale-98 cursor-pointer group"
                >
                  <FileText className="w-4 h-4 text-rose-400 dark:text-rose-600 group-hover:scale-110 transition-transform" />
                  <span>Ver Menú</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 dark:text-rose-700">
                    PDF
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Buscador de Productos con Icono de Búsqueda */}
      {categories.length > 0 && (
        <div className="relative">
          <div className="relative flex items-center group">
            <Search className="w-4 h-4 absolute left-3.5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar productos o ingredientes en la carta..."
              className="w-full pl-10 pr-10 py-3 bg-white dark:bg-[#121215] border border-zinc-200/90 dark:border-zinc-800/90 rounded-2xl text-xs sm:text-sm text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                title="Limpiar búsqueda"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Feedback de búsqueda activa */}
          {normalizedQuery && (
            <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5 text-emerald-500" />
                <span>
                  Resultados para <span className="font-semibold text-zinc-900 dark:text-zinc-100">&ldquo;{searchQuery}&rdquo;</span>:
                </span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {activeCategoryId === 'all'
                    ? `${totalGlobalMatches} ${totalGlobalMatches === 1 ? 'producto' : 'productos'}`
                    : `${totalCategoryMatches} en esta categoría (${totalGlobalMatches} en total)`}
                </span>
              </div>

              {activeCategoryId !== 'all' && totalGlobalMatches > totalCategoryMatches && (
                <button
                  type="button"
                  onClick={() => setActiveCategoryId('all')}
                  className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Buscar en todo el menú ({totalGlobalMatches})
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selector de Categorías (Sleek Pills) */}
      {categories.length > 0 && (
        <div className="sticky top-14 z-20 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md py-2.5 -mx-4 px-4 overflow-x-auto flex items-center gap-2 border-b border-zinc-200/80 dark:border-zinc-800/80">

          {/* Acceso rápido a búsqueda en barra sticky si hay texto o para abrir */}
          <button
            type="button"
            onClick={handleFocusSearch}
            className={`p-1.5 rounded-lg text-xs font-medium transition shrink-0 ml-auto border ${searchQuery
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 border-zinc-200 dark:border-zinc-800'
              }`}
            title="Buscar en la carta"
            aria-label="Buscar productos"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setActiveCategoryId('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${activeCategoryId === 'all'
              ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
              : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
              }`}
          >
            Todo el Menú
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategoryId(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${activeCategoryId === cat.id
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
                }`}
            >
              {cat.name}
            </button>
          ))}

        </div>
      )}

      {/* Estado si el menú está completamente vacío */}
      {categories.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Este restaurante aún no ha publicado productos en su carta.
          </p>
          <p className="text-xs text-zinc-500 mt-1">Vuelve pronto para ver las novedades.</p>
        </div>
      )}

      {/* Estado cuando la búsqueda no arroja ningún resultado */}
      {normalizedQuery && filteredCategories.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-8 space-y-3 shadow-xs">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-400 dark:text-zinc-500 border border-zinc-200 dark:border-zinc-800">
            <Search className="w-5 h-5" />
          </div>
          <h4 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            No encontramos productos para &ldquo;{searchQuery}&rdquo;
          </h4>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            {activeCategoryId !== 'all' && totalGlobalMatches > 0
              ? 'No hay resultados en la categoría seleccionada, pero sí en otras categorías del menú.'
              : 'Verifica la ortografía o intenta buscar con palabras más generales (ej: pizza, carne, jugo).'}
          </p>
          <div className="pt-2 flex items-center justify-center gap-2">
            {activeCategoryId !== 'all' && totalGlobalMatches > 0 && (
              <button
                type="button"
                onClick={() => setActiveCategoryId('all')}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition"
              >
                Buscar en todo el menú ({totalGlobalMatches})
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setActiveCategoryId('all');
              }}
              className="px-4 py-2 rounded-xl text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            >
              Ver carta completa
            </button>
          </div>
        </div>
      )}

      {/* Listado de Productos agrupados por Categoría */}
      <div className="space-y-10">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            {/* Cabecera Sticky del Nombre de la Categoría */}
            <div className="sticky top-[106px] sm:top-[108px] z-10 py-2.5 -mx-4 px-4 sm:-mx-2 sm:px-2 bg-white/95 dark:bg-[#09090B]/95 backdrop-blur-md border-b border-zinc-200/60 dark:border-zinc-800/60 sm:rounded-lg">
              <h3 className="text-base sm:text-lg font-bold tracking-tight text-zinc-950 dark:text-zinc-100 flex items-center justify-between">
                <span>{cat.name}</span>
                <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">
                  {cat.products?.length || 0} {cat.products?.length === 1 ? 'producto' : 'productos'}
                </span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {cat.products?.map((prod: Product) => {
                const hasOptions = prod.optionGroups && prod.optionGroups.length > 0;

                return (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition flex flex-col justify-between"
                  >
                    {prod.imageUrl && (
                      <div className="relative h-44 w-full bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                          loading="lazy"
                        />
                        <span className="absolute bottom-2 right-2 bg-zinc-950/80 dark:bg-zinc-900/90 backdrop-blur-sm text-white font-medium text-xs px-2.5 py-1 rounded-md">
                          {formatCurrency(prod.price)}
                        </span>
                      </div>
                    )}

                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-zinc-950 dark:text-zinc-100 text-sm leading-snug">
                            {prod.name}
                          </h4>
                          {!prod.imageUrl && (
                            <span className="font-bold text-zinc-950 dark:text-zinc-50 text-xs shrink-0">
                              {formatCurrency(prod.price)}
                            </span>
                          )}
                        </div>

                        {prod.description && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                            {prod.description}
                          </p>
                        )}

                        {hasOptions && (
                          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                            <Sparkles className="w-3 h-3" />
                            <span>Personalizable (ingredientes y agregados)</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80">


                        <button
                          onClick={() => handleQuickAdd(prod)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs ${justAddedId === prod.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950'
                            }`}
                        >
                          {justAddedId === prod.id ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Agregado</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{hasOptions ? 'Personalizar' : 'Agregar'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Modular de Personalización de Ingredientes y Opciones */}
      <ProductCustomizeModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleCustomAddToCart}
      />

      {/* Modal Visor de Carta PDF */}
      {restaurant.menuPdfUrl && (
        <Modal
          isOpen={isPdfModalOpen}
          onClose={() => setIsPdfModalOpen(false)}
          maxWidth="5xl"
          title={
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-zinc-950 dark:text-zinc-50 leading-tight">
                  Carta / Menú de {restaurant.name}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal">
                  Visualización oficial de la carta en PDF
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-xs">
              <span className="text-zinc-600 dark:text-zinc-400">
                Puedes explorar la carta aquí o abrirla en una nueva pestaña para descargarla o ampliarla.
              </span>
              <button
                type="button"
                onClick={() => openPdfInNewTab(restaurant.menuPdfUrl!, `menu-${restaurant.slug}.pdf`)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-950 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 font-medium transition shrink-0 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Abrir en nueva pestaña</span>
              </button>
            </div>

            <div className="w-full h-[65vh] sm:h-[75vh] rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 relative shadow-inner">
              <iframe
                src={`${restaurant.menuPdfUrl}#toolbar=1&navpanes=0`}
                title={`Carta de ${restaurant.name}`}
                className="w-full h-full border-none"
              />
            </div>
          </div>
        </Modal>
      )}

      {/* Barra Flotante Inferior de Checkout */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-md mx-auto z-40 animate-in slide-in-from-bottom-5">
          <Link
            href={`/checkout?tenant=${restaurant.slug}`}
            className="flex items-center justify-between bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 p-3.5 rounded-xl shadow-lg hover:opacity-95 transition border border-zinc-800 dark:border-zinc-200"
          >
            <div className="flex items-center gap-3">
              <div className="bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-950 w-7 h-7 rounded-md flex items-center justify-center font-semibold text-xs">
                {totalItems}
              </div>
              <div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-600">Ver pedido</div>
                <div className="text-xs font-semibold">{formatCurrency(subtotal)}</div>
              </div>
            </div>

            <span className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-300 text-white dark:text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-medium transition">
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Finalizar</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        </div>
      )}

      {/* Modal de Horarios de Atención Semanales del Restaurante */}
      <RestaurantScheduleModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        restaurantName={restaurant.name}
        scheduleRaw={restaurant.schedule}
      />
    </div>
  );
}
