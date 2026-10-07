'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Utensils, CheckCircle2, XCircle, Search, Clock, Plus } from 'lucide-react';

export default function ProductsAdminPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchMenu = async () => {
    try {
      const res = await fetch('/api/menu');
      const json = await res.json();
      if (json.success && json.data) {
        setCategories(json.data);
      }
    } catch (e) {
      console.error('Error fetching menu in admin', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-black text-white">Catálogo de Productos & Stock</h2>
          <p className="text-xs text-slate-400">
            Control de disponibilidad en tiempo real para el menú público
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 w-56"
            />
          </div>
        </div>
      </div>

      {/* Grid de Categorías y Productos */}
      <div className="space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-lg font-bold text-orange-400 flex items-center gap-2">
                <Utensils className="w-4 h-4" />
                {cat.name}
              </h3>
              <span className="text-xs text-slate-400">
                {cat.products?.length || 0} items registrados
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.products?.map((prod: Product) => (
                <div
                  key={prod.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex gap-4 items-center justify-between shadow-md"
                >
                  {prod.imageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-800"
                    />
                  )}

                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-sm truncate">{prod.name}</h4>
                    <p className="text-orange-400 font-extrabold text-xs mt-0.5">
                      {formatCurrency(prod.price)}
                    </p>
                    {prod.preparationTime && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 mt-1">
                        <Clock className="w-3 h-3" /> ~{prod.preparationTime} min cocina
                      </span>
                    )}
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${
                        prod.isAvailable
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}
                    >
                      {prod.isAvailable ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" /> En Stock
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" /> Agotado
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
