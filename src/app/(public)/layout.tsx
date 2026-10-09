'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, UtensilsCrossed, PhoneCall, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function PublicLayout({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const { totalItems, subtotal } = useCart();
  const isSaaSIndex = pathname === '/';

  const restaurantName = process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'SAS Burger Demo';
  const restaurantPhone = process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || '56912345678';

  // 1. Layout para el Portal Comercial / Landing SaaS
  if (isSaaSIndex) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5]">
        {/* Header Comercial SaaS */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 transition">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-sm tracking-tight text-zinc-950 dark:text-zinc-100">
                  FastFood
                </span>
                <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 tracking-tight">
                  SaaS
                </span>
              </div>
            </Link>

            {/* Enlaces de Navegación */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400 tracking-tight">
              <Link
                href="/sas-burger"
                className="hover:text-zinc-950 dark:hover:text-zinc-100 transition"
              >
                Demo Tienda
              </Link>
              <Link
                href="/kds"
                className="hover:text-zinc-950 dark:hover:text-zinc-100 transition"
              >
                Cocina KDS
              </Link>
              <Link
                href="/orders"
                className="hover:text-zinc-950 dark:hover:text-zinc-100 transition"
              >
                Panel Pedidos
              </Link>
              <Link
                href="/superadmin"
                className="hover:text-zinc-950 dark:hover:text-zinc-100 transition"
              >
                Master
              </Link>
            </nav>

            {/* Acciones: Selector de Tema + Acceso */}
            <div className="flex items-center gap-3">
              <ThemeToggle />

              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-tight transition shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Acceder</span>
                <ArrowRight className="w-3 h-3 hidden sm:inline opacity-70" />
              </Link>
            </div>
          </div>
        </header>

        {/* Contenido Principal */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Footer Comercial SaaS */}
        <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 py-10 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-900 dark:text-zinc-100 font-medium text-xs">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>FastFood SaaS Suite • Christopher & Andrew</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">
                Next.js App Router • Supabase Realtime • Prisma Multi-Tenant
              </p>
            </div>
            <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
              <Link href="/login" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition">
                Portal Staff
              </Link>
              <span>•</span>
              <Link href="/superadmin" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition">
                Consola Master
              </Link>
              <span>•</span>
              <Link href="/sas-burger" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition">
                Demo Comensal
              </Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. Layout para Tiendas Locales / Comensales (ej. /sas-burger, /checkout)
  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5]">
      {/* Top Banner de Horario y Atención */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50/90 dark:bg-zinc-900/50 text-xs py-1.5 px-4 text-zinc-600 dark:text-zinc-400">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-normal">Abierto ahora • Tiempo aprox. 25-35 min</span>
          </span>
          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${restaurantPhone}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition"
            >
              <PhoneCall className="w-3 h-3 text-emerald-500" />
              <span>WhatsApp</span>
            </a>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>Staff</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Header Principal del Restaurante */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/sas-burger" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center transition">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-zinc-950 dark:text-zinc-100 leading-tight tracking-tight">
                {restaurantName}
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Carta Digital Online</p>
            </div>
          </Link>

          {/* ThemeToggle & Carrito */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href="/checkout"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900/90 dark:hover:bg-zinc-850 text-zinc-900 dark:text-zinc-100 text-xs font-medium transition shadow-xs"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                {totalItems > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 text-[10px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">
                {totalItems > 0 ? formatCurrency(subtotal) : 'Carrito'}
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} {restaurantName} • Desarrollado con FastFood SaaS Suite</p>
          <p className="text-zinc-400 dark:text-zinc-500">Next.js App Router • Supabase Realtime • Prisma ORM</p>
        </div>
      </footer>
    </div>
  );
}
