'use client';

import React from 'react';
import Link from 'next/link';
import {
  UtensilsCrossed,
  ShieldCheck,
  ChefHat,
  Smartphone,
  ArrowRight,
  Store,
  Layers,
  Sparkles,
  Zap,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';

export default function SaaSIndexPage() {
  return (
    <div className="space-y-24 py-12 md:py-20">
      {/* 1. HERO SECTION */}
      <section className="max-w-5xl mx-auto px-4 text-center space-y-8">
        <div className="inline-flex items-center gap-2 bg-orange-950/80 border border-orange-800/80 px-4 py-1.5 rounded-full text-xs font-semibold text-orange-400">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Solución B2B Gastronómica Multi-Tenant</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight">
          Gestiona múltiples restaurantes con{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400">
            menú digital, KDS y WhatsApp
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
          La suite tecnológica para cadenas de comida rápida y locales independientes.
          Elimina comisiones de marketplaces con pedidos directos, comanda térmica de 80mm y aislamiento total por sucursal.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-7 py-3.5 rounded-xl shadow-xl shadow-orange-600/30 transition transform hover:-translate-y-0.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar al Portal (Login)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <Link
            href="/sas-burger"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-sm px-6 py-3.5 rounded-xl transition"
          >
            <span>🍔 Probar Tienda Demo (SAS Burger)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </Link>
        </div>
      </section>

      {/* 2. TENANT DEMO SHOWCASE CARD */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 relative z-10">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 text-xs font-semibold px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Inquilino Demo Activo en Base de Datos</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                SAS Burger Demo
              </h2>
              <p className="text-sm text-slate-400">
                Local de hamburguesas smash configurado en Supabase bajo el identificador único <code className="text-orange-400 font-mono">sas-burger</code>. Explora la experiencia del cliente o el flujo interno de cocina.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  <span>Catálogo de 4 productos activos</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  <span>Checkout sin registro en 3 clics</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  <span>Monitor KDS en tiempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-orange-500" />
                  <span>Despacho y comanda 80mm</span>
                </div>
              </div>
            </div>

            {/* Direct Access Buttons for Demo Tenant */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
              <Link
                href="/sas-burger"
                className="flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-xs px-5 py-3 rounded-xl shadow-lg transition"
              >
                <span>Ver Carta Comensal (/sas-burger)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/kds"
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-semibold text-xs px-5 py-3 rounded-xl transition"
              >
                <ChefHat className="w-4 h-4" />
                <span>Monitor Cocina KDS (/kds)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <Link
                href="/orders"
                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-xs px-5 py-3 rounded-xl transition"
              >
                <span>Panel de Pedidos (/orders)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. MULTI-TENANT ARCHITECTURE HIGHLIGHTS */}
      <section className="max-w-5xl mx-auto px-4 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Pilares de la Arquitectura Multi-Tenant
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            Diseñado para escalar de 1 a miles de locales bajo una base de datos centralizada y segura.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Aislamiento por Tenant</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cada restaurante opera de manera independiente mediante <code className="text-orange-400">restaurant_id</code>. Clientes, pedidos y productos nunca se cruzan entre locales.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Supabase Realtime</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Los pedidos creados en el checkout impactan de inmediato en la pantalla de cocina del local mediante WebSockets nativos de PostgreSQL.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">Consola Master Superadmin</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Panel maestro para Christopher y Andrew para monitorear inquilinos, crear tiendas, auditar estados y asignar credenciales de acceso.
            </p>
          </div>
        </div>
      </section>

      {/* 4. CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-r from-orange-900/40 via-slate-900 to-amber-950/40 border border-orange-800/40 rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            ¿Listo para gestionar tus locales?
          </h2>
          <p className="text-sm text-slate-300 max-w-lg mx-auto">
            Inicia sesión con tu cuenta Master para acceder a la administración global de inquilinos.
          </p>
          <div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm px-8 py-3.5 rounded-xl shadow-xl shadow-orange-600/30 transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Ingresar al Sistema (Login)</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
