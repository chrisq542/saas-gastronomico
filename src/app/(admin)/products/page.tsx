'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { Product, Category } from '@/types';
import { formatCurrency } from '@/lib/utils/formatters';
import { Utensils, CheckCircle2, XCircle, Search, Clock } from 'lucide-react';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121215] p-4 sm:p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100 tracking-tight">
            Catálogo de Productos & Stock
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Control de disponibilidad para el menú digital del restaurante
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 w-52 sm:w-60"
            />
          </div>
        </div>
      </div>

      {/* Grid de Categorías y Productos */}
      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-12 text-zinc-400 dark:text-zinc-600 text-xs">
            Cargando catálogo...
          </div>
        ) : (
          categories.map((cat) => (
            <div key={cat.id} className="space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100 flex items-center gap-2">
                  <Utensils className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{cat.name}</span>
                </h3>
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                  {cat.products?.length || 0} ítems registrados
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cat.products?.map((prod: Product) => (
                  <div
                    key={prod.id}
                    className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-3.5 flex gap-3.5 items-center justify-between shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition"
                  >
                    {prod.imageUrl && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="w-14 h-14 rounded-lg object-cover shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                      />
                    )}

                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-zinc-950 dark:text-zinc-100 text-xs truncate leading-snug">
                        {prod.name}
                      </h4>
                      <p className="text-zinc-900 dark:text-zinc-200 font-semibold text-xs mt-0.5">
                        {formatCurrency(prod.price)}
                      </p>
                      {prod.preparationTime && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                          <Clock className="w-2.5 h-2.5" /> ~{prod.preparationTime} min
                        </span>
                      )}
                    </div>

                    <div>
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                          prod.isAvailable
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50'
                        }`}
                      >
                        {prod.isAvailable ? (
                          <>
                            <CheckCircle2 className="w-3 h-3" /> En Stock
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Agotado
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
