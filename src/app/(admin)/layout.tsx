'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChefHat, ClipboardList, Utensils, Store } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navItems = [
    { href: '/kds', label: 'KDS Cocina (Realtime)', icon: ChefHat },
    { href: '/orders', label: 'Gestión de Pedidos', icon: ClipboardList },
    { href: '/products', label: 'Productos & Stock', icon: Utensils },
  ];

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5] flex flex-col">
      {/* Barra superior de administración */}
      <header className="bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href="/kds" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-xs text-zinc-950 dark:text-zinc-100 tracking-tight uppercase">
                FastFood KDS
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Panel Operativo</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-md text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Realtime Activo</span>
          </div>

          <ThemeToggle />

          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg transition border border-zinc-200 dark:border-zinc-800 font-medium"
          >
            <Store className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden sm:inline">Tienda</span>
          </Link>
        </div>
      </header>

      {/* Contenedor Admin */}
      <main className="flex-1 p-4 md:p-6 bg-zinc-50/50 dark:bg-[#09090B] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
