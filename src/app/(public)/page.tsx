'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ChefHat,
  ArrowRight,
  Zap,
  Check,
  ExternalLink,
  Store,
  Receipt,
  Loader2,
  QrCode,
  MessageSquare,
  Sparkles,
  SlidersHorizontal,
  Printer,
  Smartphone,
  TrendingUp,
  HelpCircle,
  Clock,
  Layers,
} from 'lucide-react';
import { SEO_CONFIG } from '@/constants/seo';

export const dynamic = 'force-static';

export default function SaaSIndexPage() {
  const router = useRouter();
  const [demoLoading, setDemoLoading] = useState<'KDS' | 'ORDERS' | null>(null);

  const launchDemoSandbox = async (target: 'KDS' | 'ORDERS') => {
    setDemoLoading(target);
    try {
      const role = target === 'KDS' ? 'KITCHEN' : 'STORE_ADMIN';
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(target === 'KDS' ? '/kds' : '/orders');
        return;
      }
      router.push('/login');
    } catch {
      router.push('/login');
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24 py-12 sm:py-20">
      {/* 1. HERO SECTION OPTIMIZADA PARA SEO */}
      <section className="max-w-4xl mx-auto px-4 text-center space-y-6">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-xs font-semibold text-emerald-700 dark:text-emerald-400 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>SaaS para Abrir Menús Digitales en Restaurantes</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50 max-w-3xl mx-auto leading-[1.14]">
          La plataforma SaaS para abrir y gestionar menús digitales para restaurantes
        </h1>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto font-normal leading-relaxed">
          Crea tu <strong>carta digital interactiva con código QR</strong> en minutos. Vende directo a tus clientes por <strong>WhatsApp sin comisiones</strong>, personaliza opciones de ingredientes (doble carne, sin cebolla) y sincroniza tu cocina con <strong>monitor KDS en tiempo real</strong>.
        </p>

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
          <Link
            href="/sas-burger"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sm transition"
            title="Ver carta digital demo para restaurantes"
          >
            <Store className="w-4 h-4" />
            <span>Ver Menú Digital Demo (/sas-burger)</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </Link>

          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-xs transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Ingresar al Sistema (Login)</span>
          </Link>
        </div>

        {/* Métricas destacadas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 max-w-3xl mx-auto border-t border-zinc-200/80 dark:border-zinc-800/80">
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">0%</p>
            <p className="text-[11px] text-zinc-500">Comisiones por pedido</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">&lt; 3 min</p>
            <p className="text-[11px] text-zinc-500">Para abrir tu menú QR</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">100%</p>
            <p className="text-[11px] text-zinc-500">Pedidos a tu WhatsApp</p>
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 dark:text-zinc-100">Realtime</p>
            <p className="text-[11px] text-zinc-500">KDS y comanda 80mm</p>
          </div>
        </div>
      </section>

      {/* 2. FUNCIONALIDADES CLAVE PARA RESTAURANTES (SEO KEYWORDS EN H2 Y H3) */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            Todo lo que tu restaurante necesita para digitalizar sus ventas
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto">
            Herramientas diseñadas para locales de comida rápida, hamburgueserías, pizzerías, cafeterías y cadenas gastronómicas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Tarjeta 1: Menú Digital con QR */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 shadow-xs hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Menú Digital Interactivo con QR
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Tus comensales escanean el código QR en sus mesas o abren tu enlace en redes sociales para ver tu carta completa con fotos HD, descripciones y precios actualizados en segundos.
            </p>
          </div>

          {/* Tarjeta 2: Opciones de Ingredientes y Agregados */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 shadow-xs hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Agregados y Quitar Ingredientes
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Aumenta tu ticket promedio permitiendo agregar doble carne, queso extra o tocino con precio personalizable por tenant, así como solicitudes de ingredientes (sin cebolla, sin mayonesa).
            </p>
          </div>

          {/* Tarjeta 3: Pedidos por WhatsApp */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 shadow-xs hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Checkout Directo a WhatsApp
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Sin registros molestos ni descargas de apps. El cliente elige sus platos y envía el pedido estructurado y listo directamente al WhatsApp del local comercial con un clic.
            </p>
          </div>

          {/* Tarjeta 4: Monitor de Cocina KDS */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 shadow-xs hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <ChefHat className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Monitor de Cocina KDS en Vivo
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Tu equipo de cocina visualiza cada comanda en una pantalla táctil con tiempos de espera, alertas de demora y cambios de estado (Pendiente, En Preparación, Listo).
            </p>
          </div>

          {/* Tarjeta 5: Comanda Térmica 80mm */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 shadow-xs hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Impresión Térmica de Comanda (80mm)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Formato optimizado para impresoras térmicas POS estándar de 80mm y 58mm. Imprime con atajo de teclado o botón directo para despacho a repartidor y comensal.
            </p>
          </div>

          {/* Tarjeta 6: Arquitectura Multi-Tenant */}
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 shadow-xs hover:border-emerald-500/40 transition">
            <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">
              Aislamiento Multi-Tenant
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Cada restaurante o sucursal cuenta con su propia base de clientes, catálogo, métricas y usuarios independientes garantizando seguridad y escalabilidad continua.
            </p>
          </div>
        </div>
      </section>

      {/* 3. CÓMO ABRIR TU MENÚ DIGITAL EN 3 PASOS (FORMATO HOW-TO PARA GOOGLE) */}
      <section className="max-w-5xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            ¿Cómo abrir el menú digital de tu restaurante en 3 pasos?
          </h2>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
            Configura tu carta digital en minutos sin conocimientos técnicos ni equipos costosos.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 relative">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">01</span>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
              Registra tu local y productos
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Define el nombre de tu restaurante, sube tu logo, crea categorías (hamburguesas, bebidas, postres) y carga tus fotos con precios.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 relative">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">02</span>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
              Configura opciones y extras
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Usa la plantilla rápida de hamburguesas para sumar modificadores de doble carne, aderezos o remoción de ingredientes como sin cebolla.
            </p>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 rounded-2xl space-y-3 relative">
            <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">03</span>
            <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-100">
              Comparte tu QR y vende
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
              Descarga tu código QR para las mesas o publica tu link en Instagram y Google Maps para recibir pedidos a WhatsApp y KDS sin comisiones.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TENANT DEMO SHOWCASE CARD */}
      <section className="max-w-5xl mx-auto px-4">
        <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Restaurante Demo Disponible en Vivo</span>
              </div>

              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
                  Prueba la experiencia real con SAS Burger
                </h2>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                  Explora la carta digital de demostración en <code className="text-zinc-900 dark:text-zinc-200 font-mono font-medium px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-850 rounded text-xs">/sas-burger</code>. Prueba agregar doble carne, quitar ingredientes y ver cómo impacta en el carrito y WhatsApp.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-xs text-zinc-600 dark:text-zinc-400">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Catálogo con modificadores de ingredientes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Checkout rápido directo a WhatsApp</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Monitor KDS de cocina en tiempo real</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Comanda térmica de 80mm lista para imprimir</span>
                </div>
              </div>
            </div>

            {/* Botones de Acceso Directo */}
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
              <Link
                href="/sas-burger"
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs px-4 py-2.5 rounded-xl transition shadow-xs"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Ver Carta Digital (/sas-burger)</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </Link>

              <button
                type="button"
                onClick={() => launchDemoSandbox('KDS')}
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-medium text-xs px-4 py-2.5 rounded-xl transition"
              >
                {demoLoading === 'KDS' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ChefHat className="w-3.5 h-3.5" />
                )}
                <span>Probar Monitor Cocina (KDS)</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
              </button>

              <button
                type="button"
                onClick={() => launchDemoSandbox('ORDERS')}
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-medium text-xs px-4 py-2.5 rounded-xl transition"
              >
                {demoLoading === 'ORDERS' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Receipt className="w-3.5 h-3.5" />
                )}
                <span>Probar Admin de Local (Pedidos & Carta)</span>
                <ArrowRight className="w-3 h-3 opacity-60" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PREGUNTAS FRECUENTES (FAQ) CON ALINEACIÓN SCHEMA.ORG PARA GOOGLE */}
      <section className="max-w-4xl mx-auto px-4 space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Respuestas a Dudas Comunes</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
            Preguntas frecuentes sobre menús digitales para restaurantes
          </h2>
        </div>

        <div className="space-y-3">
          <details className="group border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#121215] p-4 transition [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              <span>¿Cómo funciona este SaaS para abrir menús digitales en restaurantes?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-zinc-500">▼</span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              FastFood SaaS permite a cualquier restaurante crear su carta o menú digital en minutos. Obtendrás un enlace único y códigos QR para tus mesas o redes sociales donde tus clientes pueden ver fotos, personalizar ingredientes y hacer pedidos directos sin intermediarios.
            </p>
          </details>

          <details className="group border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#121215] p-4 transition [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              <span>¿Cobran comisiones por los pedidos que recibe mi restaurante?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-zinc-500">▼</span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              No. A diferencia de las apps tradicionales de delivery que cobran entre un 20% y 30%, en nuestra plataforma SaaS todos los pedidos son 100% directos para tu restaurante sin comisiones por transacción.
            </p>
          </details>

          <details className="group border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#121215] p-4 transition [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              <span>¿Los clientes pueden personalizar sus pedidos con ingredientes extra o quitarlos?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-zinc-500">▼</span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Sí. Puedes configurar opciones personalizadas como doble carne, queso cheddar, salsas o quitar ingredientes específicos (ej. sin cebolla), con precios adicionales calculados en tiempo real.
            </p>
          </details>

          <details className="group border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#121215] p-4 transition [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              <span>¿Cómo se reciben los pedidos en el restaurante?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-zinc-500">▼</span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Los pedidos se envían con formato optimizado al WhatsApp del local y se sincronizan instantáneamente en la pantalla de cocina (KDS) y en la comanda térmica de 80mm.
            </p>
          </details>

          <details className="group border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-[#121215] p-4 transition [&_summary::-webkit-details-marker]:hidden">
            <summary className="flex cursor-pointer items-center justify-between gap-1.5 font-semibold text-sm text-zinc-900 dark:text-zinc-100">
              <span>¿Qué tipo de locales gastronómicos pueden utilizar la plataforma?</span>
              <span className="shrink-0 transition duration-300 group-open:-rotate-180 text-zinc-500">▼</span>
            </summary>
            <p className="mt-3 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
              Es ideal para locales de comida rápida, hamburgueserías, pizzerías, cafeterías, bares, sushi bars y cadenas gastronómicas con una o múltiples sucursales que buscan agilizar la atención y reducir errores en comanda.
            </p>
          </details>
        </div>
      </section>

      {/* 6. CALL TO ACTION FINAL */}
      <section className="max-w-4xl mx-auto px-4 text-center">
        <div className="bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 rounded-2xl p-8 sm:p-12 space-y-5 shadow-xs">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
              Abre el menú digital de tu restaurante hoy mismo
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 max-w-md mx-auto">
              Únete a los restaurantes que ya aumentaron sus ventas directas y optimizaron sus tiempos de preparación con FastFood SaaS.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-sm transition"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Acceder al Panel Administrativo</span>
              <ArrowRight className="w-3.5 h-3.5 opacity-80" />
            </Link>

            <Link
              href="/sas-burger"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 font-medium text-xs sm:text-sm px-5 py-2.5 rounded-xl transition"
            >
              <span>Ver Menú Digital de Prueba</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
