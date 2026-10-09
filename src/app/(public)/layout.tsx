'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, UtensilsCrossed, PhoneCall, ShieldCheck, ArrowRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatters';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function PublicLayout({ children }: { children: React.ReactNode; }) {
  const pathname = usePathname();
  const { totalItems, subtotal } = useCart();

  // Por defecto se asume Vista del Cliente (isSaaSRoot = false) para evitar parpadeos en recargas
  const [isSaaSRoot, setIsSaaSRoot] = useState(false);
  const [userSession, setUserSession] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'saasgastronomico.cl').toLowerCase();

      // Es el portal raíz comercial si es exactamente el dominio principal o localhost sin subdominio
      const isExactRoot =
        hostname === rootDomain ||
        hostname === `www.${rootDomain}` ||
        ((hostname === 'localhost' || hostname === '127.0.0.1') && !hostname.includes('.localhost'));

      setIsSaaSRoot(isExactRoot);
    }

    // Verificar si el usuario tiene sesión activa (para mostrar acceso rápido de staff)
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data?.authenticated && data?.user) {
          setUserSession(data.user);
        }
      })
      .catch(() => { });
  }, []);

  const isSaaSIndex = pathname === '/' && isSaaSRoot;
  const restaurantPhone = process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || '56912345678';

  // 1. Layout para el Portal Comercial / Landing SaaS (Solo si estamos 100% en el dominio raíz)
  if (isSaaSIndex) {
    return (
      <div className="flex flex-col min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5]">
        {/* Header Comercial SaaS */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
            {/* Logo Plataforma */}
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

            {/* Enlaces Comercial Plataforma */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-600 dark:text-zinc-400 tracking-tight">
              <Link href="/login" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition">
                Acceso Tiendas
              </Link>
              {userSession?.role === 'SUPERADMIN' && (
                <Link href="/superadmin" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition">
                  Master Panel
                </Link>
              )}
            </nav>

            {/* Acciones */}
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link
                href={userSession ? (userSession.role === 'SUPERADMIN' ? '/superadmin' : '/orders') : '/login'}
                className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 px-3.5 py-1.5 rounded-lg text-xs font-medium tracking-tight transition shadow-xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{userSession ? 'Ir al Panel' : 'Acceder'}</span>
                <ArrowRight className="w-3 h-3 hidden sm:inline opacity-70" />
              </Link>
            </div>
          </div>
        </header>

        {/* Contenido Principal Landing */}
        <main className="flex-1 w-full">
          {children}
        </main>

        {/* Footer Comercial SaaS */}
        <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 py-8 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
            <div className="space-y-1">
              <div className="flex items-center justify-center md:justify-start gap-2 text-zinc-900 dark:text-zinc-100 font-medium text-xs">
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>FastFood SaaS Suite</span>
              </div>
              <p className="text-zinc-500 dark:text-zinc-400">
                Plataforma Multi-Tenant de Cartas Digitales y Pedidos para Gastronomía
              </p>
            </div>
            <div className="flex items-center gap-4 text-zinc-500 dark:text-zinc-400">
              <Link href="/login" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition">
                Portal Staff
              </Link>
              {userSession?.role === 'SUPERADMIN' && (
                <>
                  <span>•</span>
                  <Link href="/superadmin" className="hover:text-zinc-950 dark:hover:text-zinc-100 transition">
                    Consola Master
                  </Link>
                </>
              )}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. Layout Limpio por Defecto para Vista de Cliente / Comensales (Subdominios o /[slug])
  const segments = pathname.split('/').filter(Boolean);
  const currentSlug = segments[0] && !['checkout', 'login', 'superadmin', 'kds', 'orders'].includes(segments[0])
    ? segments[0]
    : '';

  const tenantHomeLink = currentSlug ? `/${currentSlug}` : '/';

  return (
    <div className="flex flex-col min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5]">
      {/* Top Banner de Atención */}
      <div className="border-b border-zinc-200/80 dark:border-zinc-800/60 bg-zinc-50/90 dark:bg-zinc-900/50 text-xs py-1.5 px-4 text-zinc-600 dark:text-zinc-400">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="font-normal">Abierto ahora • Carta Digital Online</span>
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

            {/* Si el usuario tiene sesión iniciada (Admin/Staff), se muestra acceso a su panel */}
            {userSession && (
              <Link
                href={userSession.role === 'SUPERADMIN' ? '/superadmin' : '/orders'}
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
              >
                <ShieldCheck className="w-3 h-3" />
                <span>Ir al Panel Admin</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Header Limpio del Cliente (Sin enlaces comerciales de SaaS) */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={tenantHomeLink} className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center transition">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-sm text-zinc-950 dark:text-zinc-100 leading-tight tracking-tight">
                Menú Digital
              </h1>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Carta en Línea</p>
            </div>
          </Link>

          {/* ThemeToggle & Carrito */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            <Link
              href={currentSlug ? `/checkout?tenant=${currentSlug}` : '/checkout'}
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

      {/* Contenido Principal del Restaurante */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {children}
      </main>

      {/* Footer Limpio para el Cliente */}
      <footer className="border-t border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-950 py-6 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <div className="max-w-5xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} Carta Digital • Pedidos Directos</p>
        </div>
      </footer>
    </div>
  );
}
