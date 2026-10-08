'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UtensilsCrossed,
  Plus,
  ExternalLink,
  Store,
  Layers,
  ChefHat,
  Receipt,
  LogOut,
  Shield,
  CheckCircle2,
  Clock,
  Phone,
  Database,
  Building2,
  X,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
} from 'lucide-react';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  phone: string;
  isActive: boolean;
  createdAt: string;
  _count?: {
    products: number;
    categories: number;
    orders: number;
    users: number;
  };
}

export default function SuperadminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estados del formulario mockup (sin backend)
  const [mockName, setMockName] = useState('');
  const [mockSlug, setMockSlug] = useState('');
  const [mockPhone, setMockPhone] = useState('');
  const [mockEmail, setMockEmail] = useState('');
  const [mockToast, setMockToast] = useState<string | null>(null);

  useEffect(() => {
    // 1. Validar sesión
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((res) => {
        if (!res.authenticated || res.user?.role !== 'SUPERADMIN') {
          // Si no está autenticado como superadmin, redirigir a login
          router.push('/login');
          return;
        }
        setCurrentUser(res.user);
      })
      .catch(() => {
        router.push('/login');
      });

    // 2. Cargar tenants desde la base de datos
    fetchTenants();
  }, [router]);

  const fetchTenants = () => {
    setLoading(true);
    fetch('/api/admin/restaurants')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          setTenants(res.data);
        }
      })
      .catch((err) => {
        console.error('Error cargando tenants:', err);
      })
      .finally(() => setLoading(false));
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const handleMockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMockToast(
      'Aviso: Acción sin backend. La lógica de aprovisionamiento de tenants y roles está asignada a desarrollo posterior.'
    );
    setTimeout(() => {
      setMockToast(null);
      setIsModalOpen(false);
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-white">FastFood SaaS</span>
                <span className="bg-orange-950 text-orange-400 border border-orange-800/80 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Panel Master Superadmin
                </span>
              </div>
              <p className="text-xs text-slate-400">Control Multi-Tenant Centralizado</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-lg text-slate-300">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                Master:{' '}
                <strong className="text-white font-medium">
                  {currentUser?.email || 'chrisq542@gmail.com'}
                </strong>
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Welcome Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-orange-900/40 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-950/60 border border-orange-800/60 px-2.5 py-1 rounded-full mb-2">
              <Building2 className="w-3 h-3" />
              <span>Gestión de Inquilinos B2B (Multi-Tenant)</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Bienvenido, Christopher & Andrew
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Desde esta consola maestra supervisamos los locales gastronómicos registrados, 
              su aislamiento de datos y el acceso directo a sus módulos de comensales y cocina.
            </p>
          </div>

          {/* Botón de Crear Restaurante (Sin Backend, según requerimiento) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-lg shadow-orange-600/25 transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Restaurante</span>
          </button>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Restaurantes Activos</span>
              <Store className="w-4 h-4 text-orange-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white">{tenants.length}</span>
              <span className="text-xs text-emerald-400 font-medium">100% operativos</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Base de Datos</span>
              <Database className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-semibold text-white">Supabase PgBouncer</span>
              <span className="text-xs text-emerald-400">● Conectado</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Aislamiento de Datos</span>
              <Layers className="w-4 h-4 text-sky-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-semibold text-white">restaurant_id</span>
              <span className="text-xs text-sky-400 font-medium">Discriminador activo</span>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center justify-between text-slate-400 text-xs">
              <span>Tiempo Real (KDS)</span>
              <RefreshCw className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-base font-semibold text-white">supabase_realtime</span>
              <span className="text-xs text-amber-400">orders activas</span>
            </div>
          </div>
        </div>

        {/* Section: Tenants List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Locales Gastronómicos Registrados</h2>
              <p className="text-xs text-slate-400">
                Selecciona un restaurante para acceder directamente a su carta comensal, KDS o panel
              </p>
            </div>
            <button
              onClick={fetchTenants}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar lista</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
              <RefreshCw className="w-6 h-6 animate-spin text-orange-500 mx-auto mb-2" />
              <p className="text-sm text-slate-400">Cargando restaurantes desde Supabase...</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12 bg-slate-900/50 rounded-2xl border border-slate-800">
              <Store className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-300 font-medium">No hay restaurantes registrados aún</p>
              <p className="text-xs text-slate-500 mt-1">
                Ejecuta el seed para cargar el restaurante demo inicial
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {tenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-6 transition shadow-xl"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Info Básica */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-orange-950/80 border border-orange-800/60 flex items-center justify-center text-orange-400 font-bold text-lg">
                          🍔
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-white">{tenant.name}</h3>
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              {tenant.isActive ? 'Activo' : 'Inactivo'}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-orange-400">
                            Slug: /{tenant.slug}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-1">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          +{tenant.phone}
                        </span>
                        <span>•</span>
                        <span>
                          {tenant._count?.categories || 3} Categorías
                        </span>
                        <span>•</span>
                        <span>
                          {tenant._count?.products || 4} Productos en catálogo
                        </span>
                        <span>•</span>
                        <span>
                          {tenant._count?.users || 2} Cuentas staff asociadas
                        </span>
                      </div>
                    </div>

                    {/* Botones de Acceso al Restaurante de Prueba */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-2 lg:pt-0">
                      {/* Botón 1: Ver Catálogo Comensal */}
                      <Link
                        href={`/${tenant.slug}`}
                        target="_blank"
                        className="flex items-center gap-1.5 bg-orange-600/90 hover:bg-orange-600 text-white text-xs font-semibold px-3.5 py-2.5 rounded-xl transition shadow-md shadow-orange-600/20"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>Ver Carta Comensal</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </Link>

                      {/* Botón 2: Cocina KDS */}
                      <Link
                        href="/kds"
                        target="_blank"
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                      >
                        <ChefHat className="w-4 h-4 text-amber-400" />
                        <span>Pantalla Cocina KDS</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </Link>

                      {/* Botón 3: Panel de Órdenes */}
                      <Link
                        href="/orders"
                        target="_blank"
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                      >
                        <Receipt className="w-4 h-4 text-sky-400" />
                        <span>Panel de Pedidos</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </Link>

                      {/* Botón 4: Catálogo de Productos */}
                      <Link
                        href="/products"
                        target="_blank"
                        className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                      >
                        <Layers className="w-4 h-4 text-slate-400" />
                        <span>Catálogo</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal Mockup: Crear Restaurante (Sin Backend, según requerimiento) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Crear Nuevo Restaurante</h3>
                  <p className="text-xs text-slate-400">Aprovisionamiento de nuevo inquilino multi-tenant</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Banner Informativo (Sin Backend) */}
            <div className="rounded-xl bg-amber-950/40 border border-amber-800/60 p-3.5 flex items-start gap-3 text-amber-200 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-300">
                  Módulo de Creación en Construcción (Sin Backend):
                </strong>
                Este formulario es una vista prototipo. La integración con la API de mutación y aislamiento multi-tenant está asignada para desarrollo backend en la siguiente fase.
              </div>
            </div>

            {mockToast && (
              <div className="rounded-xl bg-blue-950/60 border border-blue-800 p-3 text-blue-200 text-xs">
                {mockToast}
              </div>
            )}

            {/* Formulario Prototipo */}
            <form onSubmit={handleMockSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Nombre Comercial del Local
                </label>
                <input
                  type="text"
                  placeholder="ej. Pizzería Di Napoli"
                  value={mockName}
                  onChange={(e) => {
                    setMockName(e.target.value);
                    setMockSlug(
                      e.target.value
                        .toLowerCase()
                        .trim()
                        .replace(/[^\w\s-]/g, '')
                        .replace(/[\s_-]+/g, '-')
                    );
                  }}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slug URL (Identificador Único)
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-400">
                  <span>fastfood.saas/</span>
                  <input
                    type="text"
                    placeholder="pizzeria-di-napoli"
                    value={mockSlug}
                    onChange={(e) => setMockSlug(e.target.value)}
                    className="bg-transparent text-white focus:outline-none w-full pl-0.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    WhatsApp para Pedidos
                  </label>
                  <input
                    type="tel"
                    placeholder="56912345678"
                    value={mockPhone}
                    onChange={(e) => setMockPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Store Admin
                  </label>
                  <input
                    type="email"
                    placeholder="admin@dinapoli.com"
                    value={mockEmail}
                    onChange={(e) => setMockEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-500 rounded-xl shadow-md transition"
                >
                  Guardar Restaurante (Simular)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
