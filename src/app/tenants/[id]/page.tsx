'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Store,
  ExternalLink,
  ChefHat,
  ClipboardList,
  Check,
  AlertCircle,
} from 'lucide-react';
import { ROLES } from '@/constants/roles';
import { ROUTES } from '@/constants/routes';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import TenantSideMenu, { TenantTabType } from './_components/TenantSideMenu';
import TenantInfoTab from './_components/TenantInfoTab';
import TenantCategoriesTab from './_components/TenantCategoriesTab';
import TenantProductsTab from './_components/TenantProductsTab';
import TenantUsersTab, { TenantUser } from './_components/TenantUsersTab';
import TenantBillingTab, { PaymentRecord } from './_components/TenantBillingTab';
import { TenantProfileData } from './_components/TenantProfileHUD';
import { EditableProduct } from '@/components/shared/ProductEditModal';

interface CategoryWithCount {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

export default function TenantDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const tenantId = params.id;

  // Estado del Tenant
  const [tenant, setTenant] = useState<TenantProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Pestaña Activa del Side Menu
  const [activeTab, setActiveTab] = useState<TenantTabType>('info');

  // Datos de Categorías y Productos
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [products, setProducts] = useState<EditableProduct[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Usuarios del Tenant
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);

  // Suscripción
  const [planType, setPlanType] = useState('PRO');
  const [planExpiresAt, setPlanExpiresAt] = useState('');

  // Historial Mock de Pagos
  const [payments] = useState<PaymentRecord[]>([
    { id: 'INV-2026-003', date: '2026-10-01', amount: 49900, method: 'Transferencia Bancaria', status: 'PAID' },
    { id: 'INV-2026-002', date: '2026-09-01', amount: 49900, method: 'Webpay Plus', status: 'PAID' },
    { id: 'INV-2026-001', date: '2026-08-01', amount: 49900, method: 'Webpay Plus', status: 'PAID' },
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Carga de Detalle del Tenant
  const fetchTenantDetail = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const t = data.data;
        setTenant(t);
        setPlanType(t.planType || 'PRO');

        if (t.planExpiresAt) {
          const d = new Date(t.planExpiresAt);
          setPlanExpiresAt(d.toISOString().split('T')[0]);
        } else {
          const nextMonth = new Date();
          nextMonth.setDate(nextMonth.getDate() + 30);
          setPlanExpiresAt(nextMonth.toISOString().split('T')[0]);
        }

        if (t.users) {
          setTenantUsers(t.users);
        }
      } else {
        showToast('error', data.message || 'No se pudo cargar el restaurante.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Carga de Categorías
  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
      }
    } catch {
      showToast('error', 'Error al cargar categorías.');
    } finally {
      setLoadingCategories(false);
    }
  }, [tenantId]);

  // Carga de Productos
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products`);
      const data = await res.json();
      if (data.success) {
        const normalized = (data.data || []).map((p: any) => ({
          ...p,
          price: Number(p.price),
        }));
        setProducts(normalized);
      }
    } catch {
      showToast('error', 'Error al cargar productos.');
    } finally {
      setLoadingProducts(false);
    }
  }, [tenantId]);

  // 1. Validar autenticación de Superadmin y cargar datos
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((res) => {
        if (!res.authenticated || res.user?.role !== ROLES.SUPERADMIN) {
          router.push(ROUTES.LOGIN);
        }
      })
      .catch(() => router.push(ROUTES.LOGIN));

    fetchTenantDetail();
    fetchCategories();
    fetchProducts();
  }, [fetchTenantDetail, fetchCategories, fetchProducts, router]);

  if (loading || !tenant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-zinc-500">Cargando panel del restaurante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col">
      {/* Toast Notificación */}
      {toastMessage && (
        <div
          className={`fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800/80'
              : 'bg-rose-950/90 text-rose-200 border-rose-800/80'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Barra de Navegación Superior */}
      <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-[#121215]/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={ROUTES.SUPERADMIN.TENANTS}
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition"
            title="Volver a lista de tenants"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            {tenant.logoUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={tenant.logoUrl}
                alt={tenant.name}
                className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shadow-2xs"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center justify-center font-bold text-sm">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight">{tenant.name}</h1>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    tenant.isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
                  }`}
                >
                  {tenant.isActive ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <p className="text-xs font-mono text-zinc-500">/{tenant.slug}</p>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          <Link
            href={ROUTES.TENANT.PUBLIC_MENU(tenant.slug)}
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Abrir Tienda</span>
            <ExternalLink className="w-3 h-3 ml-0.5" />
          </Link>

          <Link
            href={ROUTES.SUPERADMIN.TENANT_KDS(tenant.id)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>KDS</span>
          </Link>

          <Link
            href={ROUTES.SUPERADMIN.TENANT_ORDERS(tenant.id)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-medium transition"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Pedidos</span>
          </Link>
        </div>
      </header>

      {/* Grid Principal con Side Menu y Contenido */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Side Menu */}
          <TenantSideMenu
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            categoriesCount={categories.length}
            productsCount={products.length}
            usersCount={tenantUsers.length}
          />

          {/* Panel Principal de Contenido */}
          <main className="md:col-span-3">
            {/* TAB 1: INFORMACIÓN GENERAL */}
            {activeTab === 'info' && (
              <TenantInfoTab
                tenant={tenant}
                tenantId={tenantId}
                onUpdateSuccess={fetchTenantDetail}
                showToast={showToast}
              />
            )}

            {/* TAB 2: CATEGORÍAS */}
            {activeTab === 'categories' && (
              <TenantCategoriesTab
                tenantId={tenantId}
                tenantName={tenant.name}
                categories={categories}
                loadingCategories={loadingCategories}
                fetchCategories={fetchCategories}
                fetchProducts={fetchProducts}
                showToast={showToast}
              />
            )}

            {/* TAB 3: PRODUCTOS */}
            {activeTab === 'products' && (
              <TenantProductsTab
                tenantId={tenantId}
                tenantName={tenant.name}
                categories={categories}
                products={products}
                loadingProducts={loadingProducts}
                fetchProducts={fetchProducts}
                showToast={showToast}
              />
            )}

            {/* TAB 4: USUARIOS */}
            {activeTab === 'users' && (
              <TenantUsersTab
                tenantId={tenantId}
                tenantName={tenant.name}
                tenantUsers={tenantUsers}
                onUserCreatedOrDeleted={fetchTenantDetail}
                showToast={showToast}
              />
            )}

            {/* TAB 5: SUSCRIPCIÓN & PAGOS */}
            {activeTab === 'subscription' && (
              <TenantBillingTab
                tenantId={tenantId}
                planType={planType}
                setPlanType={setPlanType}
                planExpiresAt={planExpiresAt}
                setPlanExpiresAt={setPlanExpiresAt}
                payments={payments}
                showToast={showToast}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
