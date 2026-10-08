'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Plus, ShoppingBag, Check, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';

const DEFAULT_CATEGORIES: (Category & { products: Product[] })[] = [
  {
    id: 'cat-1',
    name: 'Hamburguesas Smash',
    slug: 'smash-burgers',
    sortOrder: 1,
    isActive: true,
    products: [
      {
        id: 'prod-1',
        categoryId: 'cat-1',
        name: 'Doble Bacon Cheese Smash',
        description: 'Doble medallón 100g de carne angus smash, queso cheddar americano fundido, tocino ahumado crocante y salsa especial.',
        price: 8990,
        imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 15,
      },
      {
        id: 'prod-2',
        categoryId: 'cat-1',
        name: 'Triple Oklahoma Onion Burger',
        description: 'Tres medallones smash con cebolla caramelizada incrustada en la plancha, triple cheddar y pepinillos dulces.',
        price: 10490,
        imageUrl: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 20,
      },
    ],
  },
  {
    id: 'cat-2',
    name: 'Papas & Acompañamientos',
    slug: 'sides',
    sortOrder: 2,
    isActive: true,
    products: [
      {
        id: 'prod-4',
        categoryId: 'cat-2',
        name: 'Papas Rústicas Cheddar & Bacon',
        description: 'Papas fritas corte rústico cubiertas con salsa de queso cheddar fundido y trozos de tocino crujiente.',
        price: 4990,
        imageUrl: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 10,
      },
    ],
  },
  {
    id: 'cat-3',
    name: 'Bebidas & Refrescos',
    slug: 'drinks',
    sortOrder: 3,
    isActive: true,
    products: [
      {
        id: 'prod-6',
        categoryId: 'cat-3',
        name: 'Bebida Lata 350ml (Coca Cola / Zero)',
        description: 'Lata bien helada a elección del cliente.',
        price: 1800,
        imageUrl: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 2,
      },
    ],
  },
];

export default function TenantCatalogPage({ params }: { params: { slug: string } }) {
  const { addItem, totalItems, subtotal } = useCart();
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemNote, setItemNote] = useState<string>('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const tenantSlug = params.slug || 'sas-burger';

  useEffect(() => {
    fetch('/api/menu')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {});
  }, [tenantSlug]);

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
      {/* Back button to SaaS Index */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al portal principal SaaS</span>
        </Link>
        <span className="text-xs font-mono bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 px-2.5 py-0.5 rounded-md">
          Sucursal: /{tenantSlug}
        </span>
      </div>

      {/* Hero Promocional Minimalista */}
      <section className="relative overflow-hidden rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50 dark:bg-[#121215] p-6 sm:p-8 shadow-xs">
        <div className="relative z-10 max-w-xl space-y-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
            <span>Carta Digital Online</span>
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            Pide en 3 clics sin registro
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Selecciona tus productos favoritos, dinos a dónde enviarlo y confirma directamente por WhatsApp.
          </p>
        </div>
      </section>

      {/* Selector de Categorías (Sleek Pills) */}
      <div className="sticky top-16 z-20 bg-white/90 dark:bg-[#09090B]/90 backdrop-blur-md py-2 -mx-4 px-4 overflow-x-auto flex gap-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <button
          onClick={() => setActiveCategoryId('all')}
          className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
            activeCategoryId === 'all'
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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              activeCategoryId === cat.id
                ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 border border-zinc-200 dark:border-zinc-800'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-xs ${
                          justAddedId === prod.id
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
            href="/checkout"
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
