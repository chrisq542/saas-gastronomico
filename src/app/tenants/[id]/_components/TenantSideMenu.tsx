'use client';

import React from 'react';
import {
  Info,
  FolderPlus,
  UtensilsCrossed,
  Users,
  CreditCard,
} from 'lucide-react';

export type TenantTabType = 'info' | 'categories' | 'products' | 'users' | 'subscription';

interface TenantSideMenuProps {
  activeTab: TenantTabType;
  setActiveTab: (tab: TenantTabType) => void;
  categoriesCount: number;
  productsCount: number;
  usersCount: number;
}

export default function TenantSideMenu({
  activeTab,
  setActiveTab,
  categoriesCount,
  productsCount,
  usersCount,
}: TenantSideMenuProps) {
  const menuItems = [
    {
      id: 'info' as const,
      label: 'Información General',
      icon: Info,
      badge: null,
    },
    {
      id: 'categories' as const,
      label: 'Categorías',
      icon: FolderPlus,
      badge: categoriesCount,
    },
    {
      id: 'products' as const,
      label: 'Productos',
      icon: UtensilsCrossed,
      badge: productsCount,
    },
    {
      id: 'users' as const,
      label: 'Usuarios',
      icon: Users,
      badge: usersCount,
    },
    {
      id: 'subscription' as const,
      label: 'Suscripción & Pagos',
      icon: CreditCard,
      badge: null,
    },
  ];

  return (
    <aside className="md:col-span-1 space-y-3">
      {/* Caja de Navegación */}
      <div className="p-3 bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-1.5 block">
          Navegación Tenant
        </span>

        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${
                isActive
                  ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-white/20 text-white dark:bg-black/10 dark:text-zinc-900'
                      : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Card Resumen de Métricas */}
      <div className="p-4 bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
          Métricas del Local
        </span>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <span className="block font-bold text-base text-zinc-950 dark:text-zinc-100">
              {productsCount}
            </span>
            <span className="text-[10px] text-zinc-500">Productos</span>
          </div>
          <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
            <span className="block font-bold text-base text-zinc-950 dark:text-zinc-100">
              {categoriesCount}
            </span>
            <span className="text-[10px] text-zinc-500">Categorías</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
