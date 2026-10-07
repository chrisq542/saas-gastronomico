'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Plus, ShoppingBag, Flame, Sparkles, Check } from 'lucide-react';

// Datos de fallback en caso de que la base de datos aún no tenga seed
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
      {
        id: 'prod-3',
        categoryId: 'cat-1',
        name: 'Crispy Chicken Spicy',
        description: 'Pechuga de pollo marinada en buttermilk, apanada ultra crocante, ensalada coleslaw y mayonesa chipotle picante.',
        price: 7990,
        imageUrl: 'https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?w=600&auto=format&fit=crop&q=80',
        isAvailable: true,
        preparationTime: 15,
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
      {
        id: 'prod-5',
        categoryId: 'cat-2',
        name: 'Aros de Cebolla Crocantes (8 un)',
        description: 'Aros de cebolla rebozados con salsa BBQ ahumada casera.',
        price: 3890,
        imageUrl: 'https://images.unsplash.com/photo-1639024471285-0afc38332a67?w=600&auto=format&fit=crop&q=80',
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

export default function MenuCatalogPage() {
  const { addItem, totalItems, subtotal } = useCart();
  const [categories, setCategories] = useState<any[]>(DEFAULT_CATEGORIES);
  const [activeCategoryId, setActiveCategoryId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [itemNote, setItemNote] = useState<string>('');
  const [justAddedId, setJustAddedId] = useState<string | null>(null);

  useEffect(() => {
    // Intentar consultar API de menú si está disponible
    fetch('/api/menu')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setCategories(res.data);
        }
      })
      .catch(() => {
        // En desarrollo inicial usamos los datos fallback
      });
  }, []);

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
    <div className="space-y-8 pb-20">
      {/* Hero Promocional */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 max-w-lg space-y-2">
          <span className="inline-flex items-center gap-1 bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            FastFood SaaS Online
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Pide en 3 clicks sin registros ni contraseñas.
          </h2>
          <p className="text-sm text-orange-100">
            Elige tus combos favoritos, dinos a dónde enviarlo y confirma directamente por WhatsApp.
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 opacity-15">
          <Flame className="w-64 h-64 text-white" />
        </div>
      </section>

      {/* Selector de Categorías (Pills) */}
      <div className="sticky top-16 z-20 bg-slate-50/90 backdrop-blur py-2 -mx-4 px-4 overflow-x-auto flex gap-2 no-scrollbar">
        <button
          onClick={() => setActiveCategoryId('all')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
            activeCategoryId === 'all'
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          🍔 Todo el Menú
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition whitespace-nowrap ${
              activeCategoryId === cat.id
                ? 'bg-orange-600 text-white shadow'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
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
            <h3 className="text-xl font-bold text-slate-900 border-l-4 border-orange-600 pl-3">
              {cat.name}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {cat.products?.map((prod: Product) => (
                <div
                  key={prod.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between"
                >
                  {prod.imageUrl && (
                    <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-full h-full object-cover hover:scale-105 transition duration-500"
                        loading="lazy"
                      />
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base leading-snug">
                        {prod.name}
                      </h4>
                      {prod.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {prod.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                      <button
                        onClick={() => setSelectedProduct(prod)}
                        className="text-xs text-orange-600 hover:text-orange-700 font-medium underline"
                      >
                        Personalizar nota
                      </button>

                      <button
                        onClick={() => handleQuickAdd(prod)}
                        className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                          justAddedId === prod.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-orange-600 hover:bg-orange-700 text-white'
                        }`}
                      >
                        {justAddedId === prod.id ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Agregado
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Agregar
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

      {/* Modal de Personalización (Notas de cocina: Sin cebolla, extra salsa, etc.) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedProduct.name}</h3>
              <p className="text-sm font-semibold text-orange-600">
                {formatCurrency(selectedProduct.price)}
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Instrucciones para cocina (opcional):
              </label>
              <textarea
                value={itemNote}
                onChange={(e) => setItemNote(e.target.value)}
                placeholder="Ej: Sin cebolla, salsa aparte, carne bien cocida..."
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleCustomAdd}
                className="px-5 py-2 text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-md"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barra Flotante Inferior de Checkout (Mobile/Desktop) */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-4 right-4 max-w-lg mx-auto z-40 animate-in slide-in-from-bottom-5">
          <a
            href="/checkout"
            className="flex items-center justify-between bg-slate-900 text-white p-4 rounded-2xl shadow-2xl hover:bg-black transition border border-slate-800"
          >
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 text-white w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm">
                {totalItems}
              </div>
              <div>
                <div className="text-xs text-slate-300">Ver pedido y pagar</div>
                <div className="text-sm font-bold">{formatCurrency(subtotal)}</div>
              </div>
            </div>

            <span className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition">
              <ShoppingBag className="w-4 h-4" />
              Finalizar Pedido
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
