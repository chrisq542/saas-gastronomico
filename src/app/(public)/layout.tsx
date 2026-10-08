'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, UtensilsCrossed, PhoneCall, ShieldCheck, ArrowRight, Layers, Sparkles } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { totalItems, subtotal } = useCart();
  const isSaaSIndex = pathname === '/';

  const restaurantName = process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'SAS Burger Demo';
  const restaurantPhone = process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || '56912345678';

  // 1. Layout para el Portal Comercial / Index SaaS Multi-Tenant
  if (isSaaSIndex) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
        {/* Top Notification Bar */}
        <div className="bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs py-2 px-4 text-center font-medium">
          <div className="max-w-6xl mx-auto flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Arquitectura Multi-Tenant B2B con Supabase y PostgreSQL lista para operar</span>
          </div>
        </div>

        {/* Header Comercial SaaS */}
        <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur border-b border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30 group-hover:scale-105 transition">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white leading-tight">
                  FastFood<span className="text-orange-500">SaaS</span>
                </h1>
                <p className="text-[11px] text-slate-400">Plataforma Gastronómica Multi-Tenant</p>
              </div>
            </Link>

            {/* Enlaces de Navegación */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-300">
              <Link href="/sas-burger" className="hover:text-orange-400 transition flex items-center gap-1">
                <span>Demo Tienda (SAS Burger)</span>
              </Link>
              <Link href="/kds" className="hover:text-orange-400 transition">
                Cocina KDS
              </Link>
              <Link href="/orders" className="hover:text-orange-400 transition">
                Panel Pedidos
              </Link>
            </nav>

            {/* Botón de Acceso / Login Multi-tenant */}
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-lg shadow-orange-600/25"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Acceso Clientes / Staff</span>
                <ArrowRight className="w-3.5 h-3.5 hidden sm:inline" />
              </Link>
            </div>
          </div>
        </header>

        {/* Contenido Principal de la Landing */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Footer Comercial SaaS */}
        <footer className="bg-slate-900 border-t border-slate-800 py-10 text-xs text-slate-400">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2 text-white font-bold text-sm">
                <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                <span>FastFood SaaS • Christopher & Andrew Dev Team</span>
              </div>
              <p className="mt-1 text-slate-500">
                Next.js 14 App Router • Supabase Realtime • Prisma ORM Multi-tenant
              </p>
            </div>
            <div className="flex items-center gap-4 text-slate-400">
              <Link href="/login" className="hover:text-white transition">Portal de Login</Link>
              <span>•</span>
              <Link href="/superadmin" className="hover:text-white transition">Panel Master</Link>
              <span>•</span>
              <Link href="/sas-burger" className="hover:text-white transition">Demo Comensal</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. Layout para Tiendas Locales / Comensales (ej. /sas-burger, /checkout)
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
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
              href="/login"
              className="flex items-center gap-1 text-orange-400 hover:text-orange-300 font-medium transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Acceso Staff / Master
            </Link>
          </div>
        </div>
      </div>

      {/* Header Principal del Restaurante */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/sas-burger" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-900 leading-tight">{restaurantName}</h1>
              <p className="text-xs text-slate-500">Carta Digital Online • Sin Registro</p>
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
