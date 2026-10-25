'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChefHat,
  ClipboardList,
  Utensils,
  Store,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ROUTES, ROLES } from '@/constants';

interface SessionUser {
  userId: string;
  email: string;
  role: string;
  restaurantId: string | null;
  restaurantSlug: string | null;
  restaurantName: string | null;
  isDemo?: boolean;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [switchingRole, setSwitchingRole] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated || !data.user) {
          router.replace(ROUTES.LOGIN);
          return;
        }
        setSessionUser(data.user);
      })
      .catch(() => {
        router.replace(ROUTES.LOGIN);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}
    router.push(ROUTES.LOGIN);
  };

  // Permite cambiar rápidamente entre Admin de Local y Cocina dentro del Sandbox Demo
  const handleSwitchDemoRole = async () => {
    if (!sessionUser?.isDemo || switchingRole) return;
    setSwitchingRole(true);
    const nextRole = sessionUser.role === ROLES.KITCHEN ? 'STORE_ADMIN' : 'KITCHEN';
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSessionUser(data.user);
        router.push(data.redirectUrl);
      }
    } catch {
      // Silencioso
    } finally {
      setSwitchingRole(false);
    }
  };

  const allNavItems = [
    { href: '/kds', label: 'KDS Cocina (Realtime)', icon: ChefHat, roles: [ROLES.SUPERADMIN, ROLES.STORE_ADMIN, ROLES.KITCHEN] },
    { href: '/orders', label: 'Gestión de Pedidos', icon: ClipboardList, roles: [ROLES.SUPERADMIN, ROLES.STORE_ADMIN] },
    { href: '/products', label: 'Productos & Stock', icon: Utensils, roles: [ROLES.SUPERADMIN, ROLES.STORE_ADMIN] },
  ];

  const visibleNavItems = allNavItems.filter((item) =>
    sessionUser ? item.roles.includes(sessionUser.role as any) : false
  );

  const storeUrl = sessionUser?.restaurantSlug
    ? `/${sessionUser.restaurantSlug}`
    : '/sas-burger';

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5] flex flex-col">
      {/* Barra superior de administración */}
      <header className="bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link href={sessionUser?.role === ROLES.KITCHEN ? '/kds' : '/orders'} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
              <ChefHat className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-xs text-zinc-950 dark:text-zinc-100 tracking-tight uppercase">
                {sessionUser?.restaurantName || 'FastFood KDS'}
              </h1>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                {sessionUser?.role === ROLES.KITCHEN
                  ? 'Monitor Cocina'
                  : sessionUser?.role === ROLES.STORE_ADMIN
                  ? 'Admin de Local'
                  : 'Superadmin'}
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 text-xs font-medium">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              const linkHref =
                sessionUser?.role === ROLES.SUPERADMIN && sessionUser?.restaurantId
                  ? `${item.href}?restaurantId=${sessionUser.restaurantId}`
                  : item.href;

              return (
                <Link
                  key={item.href}
                  href={linkHref}
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

            {sessionUser?.role === ROLES.SUPERADMIN && !sessionUser?.isDemo && (
              <Link
                href="/tenants"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition font-semibold"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Consola Tenants</span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5">
          {sessionUser?.isDemo && (
            <button
              type="button"
              onClick={handleSwitchDemoRole}
              disabled={switchingRole}
              title="Cambiar de rol dentro del entorno de prueba"
              className="inline-flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 px-2.5 py-1 rounded-md text-[11px] font-medium transition"
            >
              {switchingRole ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-500" />
              )}
              <span className="hidden sm:inline">
                Sandbox Demo · Cambiar a {sessionUser.role === ROLES.KITCHEN ? 'Admin Local' : 'Cocina KDS'}
              </span>
              <span className="sm:hidden">Cambiar Rol</span>
            </button>
          )}

          <div className="hidden lg:flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 rounded-md text-[11px] text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span>Realtime Activo</span>
          </div>

          {sessionUser && !sessionUser.isDemo && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800">
              <User className="w-3 h-3 text-zinc-400" />
              <span className="max-w-[140px] truncate font-medium">{sessionUser.email}</span>
            </div>
          )}

          <ThemeToggle />

          <Link
            href={storeUrl}
            target="_blank"
            className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 px-3 py-1.5 rounded-lg transition border border-zinc-200 dark:border-zinc-800 font-medium"
            title="Ver catálogo público del restaurante"
          >
            <Store className="w-3.5 h-3.5 opacity-70" />
            <span className="hidden sm:inline">Tienda</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-1.5 text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition border border-transparent hover:border-rose-200 dark:hover:border-rose-900/40"
            title="Cerrar Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Contenedor Admin */}
      <main className="flex-1 p-4 md:p-6 bg-zinc-50/50 dark:bg-[#09090B] overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
