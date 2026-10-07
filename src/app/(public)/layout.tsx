'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, UtensilsCrossed, PhoneCall, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { totalItems, subtotal } = useCart();
  const restaurantName = process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Burger & Fries Fast SaaS';
  const restaurantPhone = process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || '56912345678';

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Banner de Horario y Atención */}
      <div className="bg-slate-900 text-white text-xs py-1.5 px-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Abierto ahora • Pedidos con entrega en 25-35 min
          </span>
          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${restaurantPhone}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 text-slate-300 hover:text-white transition"
            >
              <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Local
            </a>
            <Link
              href="/kds"
              className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Acceso Admin / KDS
            </Link>
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">{restaurantName}</h1>
              <p className="text-xs text-slate-500">Fast Food Online • Sin Registro</p>
            </div>
          </Link>

          {/* Carrito en Header */}
          <Link
            href="/checkout"
            className="flex items-center gap-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 px-3.5 py-2 rounded-xl font-medium text-sm transition border border-orange-200"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              {totalItems > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-orange-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
            <span className="hidden sm:inline font-semibold">
              {totalItems > 0 ? formatCurrency(subtotal) : 'Mi Carrito'}
            </span>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} {restaurantName}. Desarrollado con FastFood SaaS Suite.</p>
          <p className="text-slate-400">Next.js App Router • Supabase Realtime • Prisma ORM</p>
        </div>
      </footer>
    </div>
  );
}
