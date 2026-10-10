'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Plus, ShoppingBag, Check, ArrowLeft, ArrowRight, Sparkles, Store } from 'lucide-react';

interface TenantCatalogClientProps {
  restaurant: {
    id: string;
    name: string;
    slug: string;
    phone: string;
    rut?: string | null;
    logoUrl?: string | null;
    bannerUrl?: string | null;
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
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemNote, setItemNote] = useState<string>('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  const handleQuickAdd = (product: Product) => {
    addItem(product, 1, '');
    setJustAddedId(product.id);
    setTimeout(() => setJustAddedId(null), 1200);
  };

  const handleCustomAdd = () => {
    if (selectedProduct) {
      addItem(selectedProduct, 1, itemNote);
      setSelectedProduct(null);
      setItemNote('');
    }
  };

  const filteredCategories =
    activeCategoryId === 'all'
      ? categories
      : categories.filter((c) => c.id === activeCategoryId);

  return (
    <div className="space-y-8 pb-24">
      {/* Hero Promocional y Banner del Restaurante */}
      <section className="relative overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-[#121215] shadow-xs mx-1 sm:mx-3 mt-3 sm:mt-4">
        {restaurant.bannerUrl && (
          <div className="relative h-44 sm:h-60 md:h-72 w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={restaurant.bannerUrl}
              alt={`Banner promocional de ${restaurant.name}`}
              className="w-full h-full object-cover transition duration-700 hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />
          </div>
        )}

        <div className={`p-5 sm:p-7 relative z-10 ${restaurant.bannerUrl ? '-mt-14 sm:-mt-16' : ''}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
            {restaurant.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={restaurant.logoUrl}
                alt={restaurant.name}
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 shadow-lg flex-shrink-0 ${
                  restaurant.bannerUrl
                    ? 'border-white dark:border-zinc-900 bg-white dark:bg-zinc-950 ring-2 ring-black/10'
                    : 'border-zinc-200 dark:border-zinc-700'
                }`}
              />
            ) : (
              <div
                className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 font-bold text-2xl sm:text-3xl shadow-lg flex-shrink-0 ${
                  restaurant.bannerUrl
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
                  <span>Carta Digital Online</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
                {restaurant.name}
              </h2>
              {restaurant.address && (
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                  <span>📍</span>
                  <span>{restaurant.address}</span>
                </p>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                Selecciona tus productos favoritos, dinos a dónde enviarlo y confirma directamente por WhatsApp.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Selector de Categorías (Sleek Pills) */}
      {categories.length > 0 && (
        <div className="sticky top-16 z-20 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md py-2 -mx-4 px-4 overflow-x-auto flex gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
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

      {/* Estado si el menú está vacío */}
      {categories.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Este restaurante aún no ha publicado productos en su carta.</p>
          <p className="text-xs text-zinc-500 mt-1">Vuelve pronto para ver las novedades.</p>
        </div>
      )}

      {/* Listado de Productos agrupados por Categoría */}
      <div className="space-y-10">
        {filteredCategories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            <h3 className="text-lg font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              {cat.name}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {cat.products?.map((prod: Product) => (
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
                      <h4 className="font-semibold text-zinc-950 dark:text-zinc-100 text-sm leading-snug">
                        {prod.name}
                      </h4>
                      {prod.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/80">
                      <button
                        onClick={() => setSelectedProduct(prod)}
                        className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 font-medium underline underline-offset-2"
                      >
                        Personalizar
                      </button>

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
                            <span>Agregar</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Personalización */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
                {selectedProduct.name}
              </h3>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400 mt-0.5">
                {formatCurrency(selectedProduct.price)}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                Instrucciones para cocina (opcional):
              </label>
              <textarea
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Ej: Sin cebolla, salsa aparte, carne bien cocida..."
                rows={3}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomAdd}
                className="px-4 py-2 text-xs font-medium bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg shadow-xs transition"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
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
    </div>
  );
}
