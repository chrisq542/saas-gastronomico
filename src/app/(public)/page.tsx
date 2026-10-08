'use client';

import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  ChefHat,
  ArrowRight,
  Layers,
  Zap,
  Check,
  ExternalLink,
  Store,
  Receipt,
} from 'lucide-react';

export default function SaaSIndexPage() {
  return (
    <div className="space-y-16 sm:space-y-24 py-12 sm:py-16">
      {/* 1. HERO SECTION */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 rounded-full text-xs font-medium text-zinc-700 dark:text-zinc-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Arquitectura Gastronómica Multi-Tenant B2B</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 max-w-3xl mx-auto leading-[1.12]">
          Gestión inteligente de locales gastronómicos con menú digital y KDS
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Plataforma centralizada para cadenas y restaurantes independientes. Pedidos directos sin comisiones, aislamiento total por sucursal, comanda térmica de 80mm y monitor de cocina en tiempo real.
        </p>

        {/* Action Buttons: High contrast neutral + 1px outline */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-xs sm:text-sm px-5 py-2.5 rounded-lg shadow-xs transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar al Sistema</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-70" />
          </Link>

          <Link
            href="/sas-burger"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-medium text-xs sm:text-sm px-5 py-2.5 rounded-lg transition"
          >
            <span>Ver Tienda Demo (/sas-burger)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>
      </section>

      {/* 2. TENANT DEMO SHOWCASE CARD */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 text-xs font-medium px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Inquilino de Demostración Activo</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
                  SAS Burger Demo
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Local configurado en base de datos bajo el identificador único <code className="text-zinc-900 dark:text-zinc-200 font-mono font-medium px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-850 rounded text-xs">sas-burger</code>. Explora la experiencia del cliente final o la operativa de cocina.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-200" />
                  <span>Catálogo de productos y categorías</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-200" />
                  <span>Checkout rápido sin registro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-200" />
                  <span>Pantalla KDS en tiempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-200" />
                  <span>Impresión térmica comanda 80mm</span>
                </div>
              </div>
            </div>

            {/* Direct Access Buttons for Demo Tenant */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Link
                href="/sas-burger"
                className="inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-xs px-4 py-2.5 rounded-lg transition shadow-xs"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Ver Carta Digital (/sas-burger)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>

              <Link
                href="/kds"
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-medium text-xs px-4 py-2.5 rounded-lg transition"
              >
                <ChefHat className="w-3.5 h-3.5" />
                <span>Monitor Cocina KDS (/kds)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>

              <Link
                href="/orders"
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-medium text-xs px-4 py-2.5 rounded-lg transition"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Gestión de Pedidos (/orders)</span>
                <ExternalLink className="w-3 h-3 opacity-60" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MULTI-TENANT ARCHITECTURE HIGHLIGHTS */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
            Arquitectura del Sistema
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-lg mx-auto">
            Diseñado para operar eficientemente desde un local individual hasta múltiples sucursales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-6 rounded-xl space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              Aislamiento por Tenant
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Cada restaurante opera de manera independiente con clave de aislamiento discriminada por <code className="font-mono text-zinc-900 dark:text-zinc-200">restaurant_id</code>. Clientes y pedidos nunca se mezclan.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-6 rounded-xl space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              Supabase Realtime
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Los pedidos registrados en el checkout impactan de forma instantánea en la pantalla de cocina mediante WebSockets nativos de PostgreSQL.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-5 sm:p-6 rounded-xl space-y-3 shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              Consola Master Superadmin
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Panel unificado para administración global de cuentas, monitoreo de sucursales activas y configuración de credenciales de acceso.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-xl p-8 sm:p-10 space-y-5 shadow-xs">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              Accede a la consola de administración
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Inicia sesión con tu cuenta Master o credenciales asignadas de sucursal.
            </p>
          </div>

          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-xs sm:text-sm px-6 py-2.5 rounded-lg shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ingresar al Portal (Login)</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-70" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
