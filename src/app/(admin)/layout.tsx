'use client';

import React from 'react';
import { ChefHat, ClipboardList, Utensils, Store, BellRing } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra superior de administración */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center text-white font-bold shadow-md shadow-orange-600/30">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-sm text-white tracking-wide uppercase">
                FastFood KDS & Admin
              </h1>
              <p className="text-[10px] text-slate-400">Panel Operativo en Vivo</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <a
              href="/kds"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600/10 text-orange-400 hover:bg-orange-600/20 transition border border-orange-500/20"
            >
              <ChefHat className="w-4 h-4" />
              KDS Cocina (Realtime)
            </a>
            <a
              href="/orders"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <ClipboardList className="w-4 h-4" />
              Gestión de Pedidos
            </a>
            <a
              href="/products"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition"
            >
              <Utensils className="w-4 h-4" />
              Productos & Stock
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full text-xs text-slate-300 border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Supabase Realtime Conectado</span>
          </div>

          <a
            href="/"
            className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl transition border border-slate-700"
          >
            <Store className="w-3.5 h-3.5 text-orange-400" />
            Ver Tienda Pública
          </a>
        </div>
      </header>

      {/* Contenedor Admin */}
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
