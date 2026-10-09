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
  Phone,
  Database,
  Building2,
  X,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Globe,
  Lock,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  phone: string;
  customDomain?: string | null;
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

  // Estados del formulario real de creación
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin1234!');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // 1. Validar sesión
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((res) => {
        if (!res.authenticated || res.user?.role !== 'SUPERADMIN') {
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

  const handleToggleStatus = async (tenantId: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setTenants((prev) =>
          prev.map((t) => (t.id === tenantId ? { ...t, isActive: !currentStatus } : t))
        );
        showToast('success', `Restaurante ${!currentStatus ? 'activado' : 'desactivado'} con éxito.`);
      } else {
        showToast('error', data.message || 'No se pudo actualizar el estado.');
      }
    } catch {
      showToast('error', 'Error al comunicar con el servidor.');
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !phone.trim() || !adminEmail.trim() || !adminPassword.trim()) {
      showToast('error', 'Por favor completa todos los campos requeridos.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/restaurants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          customDomain: customDomain.trim() || null,
          phone: phone.trim(),
          adminEmail: adminEmail.trim(),
          adminPassword: adminPassword.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al crear el restaurante.');
      }

      showToast('success', `¡Restaurante "${data.data.name}" creado con éxito con subdominio "${data.data.slug}"!`);
      // Reset form
      setName('');
      setSlug('');
      setCustomDomain('');
      setPhone('');
      setAdminEmail('');
      setAdminPassword('Admin1234!');
      setIsModalOpen(false);
      fetchTenants();
    } catch (err: any) {
      showToast('error', err.message || 'Ocurrió un error inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5] flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-zinc-950 dark:text-zinc-100 tracking-tight">FastFood SaaS</span>
                <span className="bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800 text-[10px] font-medium px-2 py-0.5 rounded-md uppercase tracking-wider">
                  Master Superadmin
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md text-zinc-600 dark:text-zinc-400">
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                Master:{' '}
                <strong className="text-zinc-950 dark:text-zinc-100 font-medium">
                  {currentUser?.email || 'chrisq542@gmail.com'}
                </strong>
              </span>
            </div>

            <ThemeToggle />

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Toast Alert */}
        {toastMessage && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs animate-in fade-in slide-in-from-top-2 duration-200 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-xs opacity-60 hover:opacity-100 p-1">
              ✕
            </button>
          </div>
        )}

        {/* Welcome Banner */}
        <div className="rounded-xl bg-zinc-50 dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1 rounded-md mb-2">
              <Building2 className="w-3 h-3" />
              <span>Gestión de Inquilinos Multi-Tenant</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-zinc-950 dark:text-zinc-50 tracking-tight">
              Bienvenido, Christopher & Andrew
            </h1>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-2xl leading-relaxed">
              Consola maestra para supervisar locales gastronómicos, aislamiento de datos por sucursal y accesos operativos de carta y cocina.
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium text-xs px-4 py-2.5 rounded-lg shadow-xs transition shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Restaurante</span>
          </button>
        </div>

        {/* Global KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Restaurantes Activos</span>
              <Store className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-zinc-950 dark:text-zinc-50">{tenants.length}</span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">100% operativos</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Base de Datos</span>
              <Database className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">Supabase PgBouncer</span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400">● Conectado</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Aislamiento de Datos</span>
              <Layers className="w-4 h-4 text-blue-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">restaurant_id</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Discriminador activo</span>
            </div>
          </div>

          <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-xs">
              <span>Tiempo Real (KDS)</span>
              <RefreshCw className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">supabase_realtime</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">orders activas</span>
            </div>
          </div>
        </div>

        {/* Section: Tenants List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-100">Locales Gastronómicos Registrados</h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Selecciona un restaurante para acceder directamente a su carta, KDS o panel de pedidos
              </p>
            </div>
            <button
              onClick={fetchTenants}
              className="text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2.5 py-1.5 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
              <RefreshCw className="w-5 h-5 animate-spin text-zinc-400 mx-auto mb-2" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Cargando restaurantes desde Supabase...</p>
            </div>
          ) : tenants.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80">
              <Store className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
              <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">No hay restaurantes registrados aún</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                Ejecuta el seed para cargar el restaurante demo inicial
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {tenants.map((tenant) => {
                const subHost = typeof window !== 'undefined' ? `${tenant.slug}.${window.location.host}` : `${tenant.slug}.localhost:3000`;
                const subUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${subHost}` : `http://${subHost}`;
                const customUrl = tenant.customDomain ? `https://${tenant.customDomain}` : null;

                return (
                  <div
                    key={tenant.id}
                    className={`bg-white dark:bg-[#121215] border rounded-xl p-5 transition shadow-xs ${
                      tenant.isActive
                        ? 'border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                        : 'border-rose-200/60 dark:border-rose-900/40 bg-rose-50/10'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                      {/* Info Básica */}
                      <div className="space-y-2">
                        <div className="flex items-start sm:items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-lg shrink-0">
                            🍔
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">{tenant.name}</h3>
                              
                              <button
                                onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                                className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-md border transition cursor-pointer ${
                                  tenant.isActive
                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-100'
                                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-100'
                                }`}
                                title="Clic para alternar estado"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${tenant.isActive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                <span>{tenant.isActive ? 'Activo (Clic para suspender)' : 'Inactivo (Clic para activar)'}</span>
                              </button>
                            </div>

                            {/* Subdominio & Dominio Personalizado */}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <a
                                href={subUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/50 hover:underline"
                                title="Visitar por Subdominio"
                              >
                                <Globe className="w-3 h-3" />
                                <span>{subHost}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                              </a>

                              {customUrl && (
                                <a
                                  href={customUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] font-mono text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-900/50 hover:underline"
                                  title="Dominio Propio / CNAME"
                                >
                                  <Globe className="w-3 h-3 text-purple-500" />
                                  <span>{tenant.customDomain}</span>
                                  <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                                </a>
                              )}

                              <span className="text-[11px] font-mono text-zinc-400">
                                (Ruta interna: /{tenant.slug})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 pt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-zinc-400" />
                            +{tenant.phone}
                          </span>
                          <span>•</span>
                          <span>{tenant._count?.categories || 0} Categorías</span>
                          <span>•</span>
                          <span>{tenant._count?.products || 0} Productos</span>
                          <span>•</span>
                          <span>{tenant._count?.orders || 0} Pedidos</span>
                          <span>•</span>
                          <span>{tenant._count?.users || 1} Staff</span>
                        </div>
                      </div>

                      {/* Botones de Acceso al Restaurante */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                        <Link
                          href={`/${tenant.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 text-xs font-medium px-3 py-2 rounded-lg transition shadow-xs"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Carta Digital</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>

                        <Link
                          href="/kds"
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Cocina KDS</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>

                        <Link
                          href="/orders"
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Pedidos</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>

                        <Link
                          href="/products"
                          target="_blank"
                          className="inline-flex items-center gap-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 text-xs font-medium px-3 py-2 rounded-lg transition"
                        >
                          <Layers className="w-3.5 h-3.5" />
                          <span>Catálogo</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Modal Real: Crear Restaurante (Aprovisionamiento Multi-Tenant) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150 overflow-y-auto">
          <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-xl max-w-lg w-full p-6 shadow-xl relative space-y-4 my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-zinc-950 dark:text-zinc-100">Crear Nuevo Inquilino (Tenant)</h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Aprovisionamiento con subdominio y usuario administrador</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Formulario de Aprovisionamiento */}
            <form onSubmit={handleCreateTenant} className="space-y-4">
              {/* Nombre Comercial */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Nombre Comercial del Restaurante *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej. Pizzería Di Napoli"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (!slug || slug === name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-')) {
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^\w\s-]/g, '')
                          .replace(/[\s_-]+/g, '-')
                      );
                    }
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>

              {/* Subdominio Asignado */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Subdominio Asignado (Identificador Único) *
                </label>
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-500">
                  <span className="font-mono text-zinc-400">https://</span>
                  <input
                    type="text"
                    required
                    placeholder="dinapoli"
                    value={slug}
                    onChange={(e) =>
                      setSlug(
                        e.target.value
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9-]/g, '-')
                      )
                    }
                    className="bg-transparent text-zinc-950 dark:text-zinc-100 font-mono font-medium focus:outline-none w-full px-1"
                  />
                  <span className="font-mono text-zinc-500 shrink-0">
                    .{typeof window !== 'undefined' ? window.location.host : 'tudominio.com'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Este subdominio resolverá directamente la carta y pedidos del local.
                </p>
              </div>

              {/* Dominio Personalizado (Opcional) */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Dominio Personalizado (Opcional)
                </label>
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-500">
                  <Globe className="w-3.5 h-3.5 mr-2 text-zinc-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="pedidos.dinapoli.cl (opcional)"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="bg-transparent text-zinc-950 dark:text-zinc-100 focus:outline-none w-full"
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Si el cliente tiene su propio dominio web (configurado vía registro DNS CNAME).
                </p>
              </div>

              {/* WhatsApp del Restaurante */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  WhatsApp Oficial para Pedidos *
                </label>
                <div className="flex items-center bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-500">
                  <span className="font-mono text-zinc-400 mr-1">+</span>
                  <input
                    type="tel"
                    required
                    placeholder="56912345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="bg-transparent text-zinc-950 dark:text-zinc-100 font-mono focus:outline-none w-full"
                  />
                </div>
              </div>

              {/* Credenciales de Acceso para el Administrador del Local */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg border border-zinc-200/80 dark:border-zinc-800/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-medium text-zinc-950 dark:text-zinc-100">
                  <Lock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Cuenta Administrador del Local (Store Admin)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Email de Acceso *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@dinapoli.com"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                      Contraseña Temporal *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Admin1234!"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-950 dark:text-zinc-100 font-mono focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                    />
                  </div>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/80">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 bg-zinc-100 dark:bg-zinc-900 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 rounded-lg shadow-xs transition disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Aprovisionando Tenant...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Crear e Iniciar Restaurante</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
