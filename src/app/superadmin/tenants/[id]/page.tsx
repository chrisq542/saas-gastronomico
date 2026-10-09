'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  Users,
  CreditCard,
  Info,
  Shield,
  Phone,
  Globe,
  Edit,
  Trash2,
  UserPlus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  DollarSign,
  Receipt,
  Sparkles,
  ExternalLink,
  FolderPlus,
  UtensilsCrossed,
  Plus,
  ToggleLeft,
  ToggleRight,
  Search,
  Tag,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ROOT_URL } from '@/utils/contantes';

interface TenantUser {
  id: string;
  email: string;
  role: 'STORE_ADMIN' | 'KITCHEN';
  createdAt: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  amount: number;
  method: string;
  status: 'PAID' | 'PENDING' | 'FAILED';
  invoiceUrl?: string;
}

interface Category {
  id: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
  _count?: { products: number };
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  imageUrl: string | null;
  isActive: boolean;
  categoryId: string;
  category?: { id: string; name: string };
}

interface TenantDetail {
  id: string;
  slug: string;
  name: string;
  phone: string;
  rut?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  customDomain?: string | null;
  planType?: string | null;
  planExpiresAt?: string | null;
  isActive: boolean;
  createdAt: string;
  users?: TenantUser[];
  _count?: {
    products: number;
    categories: number;
    orders: number;
    users: number;
  };
}

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id as string;

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'categories' | 'products' | 'users' | 'subscription'>('info');

  // Tab 1: Formulario de Información General
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [rut, setRut] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // Tab Categorías
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatSortOrder, setNewCatSortOrder] = useState(0);
  const [isCreatingCat, setIsCreatingCat] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');

  // Tab Productos
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdPrice, setNewProdPrice] = useState<number | ''>('');
  const [newProdImg, setNewProdImg] = useState('');
  const [newProdCatId, setNewProdCatId] = useState('');
  const [isCreatingProd, setIsCreatingProd] = useState(false);
  const [editingProdId, setEditingProdId] = useState<string | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [editProdPrice, setEditProdPrice] = useState<number>(0);
  const [editProdImg, setEditProdImg] = useState('');
  const [editProdCatId, setEditProdCatId] = useState('');

  // Tab 2: Usuarios
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'STORE_ADMIN' | 'KITCHEN'>('STORE_ADMIN');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Tab 3: Suscripción & Pagos
  const [planType, setPlanType] = useState('PRO');
  const [planExpiresAt, setPlanExpiresAt] = useState('');
  const [isUpdatingPlan, setIsUpdatingPlan] = useState(false);

  // Mock template para historial de pagos
  const [payments] = useState<PaymentRecord[]>([
    {
      id: 'INV-2026-003',
      date: '2026-10-01',
      amount: 49900,
      method: 'Transferencia Bancaria',
      status: 'PAID',
    },
    {
      id: 'INV-2026-002',
      date: '2026-09-01',
      amount: 49900,
      method: 'Webpay Plus',
      status: 'PAID',
    },
    {
      id: 'INV-2026-001',
      date: '2026-08-01',
      amount: 49900,
      method: 'Webpay Plus',
      status: 'PAID',
    },
  ]);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // 1. Validar autenticación de Superadmin
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((res) => {
        if (!res.authenticated || res.user?.role !== 'SUPERADMIN') {
          router.push('/login');
        }
      })
      .catch(() => router.push('/login'));

    // 2. Cargar detalle del tenant y sus sub-mantenedores
    fetchTenantDetail();
    fetchCategories();
    fetchProducts();
  }, [tenantId, router]);

  const fetchTenantDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`);
      const data = await res.json();
      if (data.success && data.data) {
        const t: TenantDetail = data.data;
        setTenant(t);
        setName(t.name || '');
        setSlug(t.slug || '');
        setRut(t.rut || '');
        setLogoUrl(t.logoUrl || '');
        setAddress(t.address || '');
        setCustomDomain(t.customDomain || '');
        setPhone(t.phone || '');
        setIsActive(t.isActive);
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
  };

  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories`);
      const data = await res.json();
      if (data.success) {
        setCategories(data.data || []);
        if (data.data && data.data.length > 0 && !newProdCatId) {
          setNewProdCatId(data.data[0].id);
        }
      }
    } catch {
      console.error('Error fetching categories');
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch {
      console.error('Error fetching products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Guardar Cambios Tab 1: Información General
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !phone.trim()) {
      showToast('error', 'Nombre, Subdominio y Teléfono son campos requeridos.');
      return;
    }

    setIsUpdatingInfo(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim(),
          rut: rut.trim() || null,
          logoUrl: logoUrl.trim() || null,
          address: address.trim() || null,
          customDomain: customDomain.trim() || null,
          phone: phone.trim(),
          isActive,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Información del restaurante actualizada correctamente.');
        fetchTenantDetail();
      } else {
        showToast('error', data.message || 'Error al actualizar información.');
      }
    } catch {
      showToast('error', 'Error al comunicar con el servidor.');
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  // MANTENEDOR CATEGORÍAS
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreatingCat(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName.trim(),
          sortOrder: Number(newCatSortOrder) || 0,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Categoría creada con éxito.');
        setNewCatName('');
        setNewCatSortOrder(0);
        fetchCategories();
      } else {
        showToast('error', data.message || 'Error al crear categoría.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleToggleCategoryActive = async (cat: Category) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: cat.id,
          isActive: !cat.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Categoría "${cat.name}" ${!cat.isActive ? 'activada' : 'desactivada (ocultada)'}.`);
        setCategories((prev) => prev.map((c) => (c.id === cat.id ? { ...c, isActive: !cat.isActive } : c)));
      } else {
        showToast('error', data.message || 'Error al actualizar estado.');
      }
    } catch {
      showToast('error', 'Error al actualizar estado.');
    }
  };

  const handleDeleteCategory = async (catId: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta categoría y sus productos asociados?')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/categories?id=${catId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Categoría eliminada.');
        fetchCategories();
        fetchProducts();
      } else {
        showToast('error', data.message || 'Error al eliminar.');
      }
    } catch {
      showToast('error', 'Error al eliminar categoría.');
    }
  };

  // MANTENEDOR PRODUCTOS
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdCatId || newProdPrice === '') {
      showToast('error', 'Completa el nombre, precio y categoría.');
      return;
    }

    setIsCreatingProd(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProdName.trim(),
          description: newProdDesc.trim() || null,
          price: Number(newProdPrice),
          imageUrl: newProdImg.trim() || null,
          categoryId: newProdCatId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Producto agregado con éxito.');
        setNewProdName('');
        setNewProdDesc('');
        setNewProdPrice('');
        setNewProdImg('');
        fetchProducts();
      } else {
        showToast('error', data.message || 'Error al agregar producto.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsCreatingProd(false);
    }
  };

  const handleToggleProductActive = async (prod: Product) => {
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: prod.id,
          isActive: !prod.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', `Producto "${prod.name}" ${!prod.isActive ? 'activado' : 'desactivado (ocultado)'}.`);
        setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, isActive: !prod.isActive } : p)));
      } else {
        showToast('error', data.message || 'Error al actualizar producto.');
      }
    } catch {
      showToast('error', 'Error al actualizar producto.');
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/products?id=${prodId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Producto eliminado.');
        fetchProducts();
      } else {
        showToast('error', data.message || 'Error al eliminar.');
      }
    } catch {
      showToast('error', 'Error al eliminar producto.');
    }
  };

  // Guardar / Extender Plan Tab 3: Suscripción
  const handleUpdateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingPlan(true);

    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planType,
          planExpiresAt: planExpiresAt ? new Date(planExpiresAt).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Suscripción y acceso extendido con éxito.');
        fetchTenantDetail();
      } else {
        showToast('error', data.message || 'Error al actualizar suscripción.');
      }
    } catch {
      showToast('error', 'Error al actualizar la suscripción.');
    } finally {
      setIsUpdatingPlan(false);
    }
  };

  const handleQuickExtend = (days: number) => {
    const current = planExpiresAt ? new Date(planExpiresAt) : new Date();
    current.setDate(current.getDate() + days);
    setPlanExpiresAt(current.toISOString().split('T')[0]);
  };

  // Tab 2: Crear Usuario para Tenant
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) return;

    setIsCreatingUser(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail.trim(),
          password: newUserPassword.trim(),
          role: newUserRole,
        }),
      });

      const data = await res.json();
      if (data.success) {
        showToast('success', 'Usuario asignado exitosamente.');
        setTenantUsers((prev) => [data.data, ...prev]);
        setNewUserEmail('');
        setNewUserPassword('');
      } else {
        showToast('error', data.message || 'Error al crear usuario.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Deseas eliminar el acceso a este usuario?')) return;

    try {
      const res = await fetch(`/api/admin/restaurants/${tenantId}/users?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Usuario eliminado.');
        setTenantUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        showToast('error', data.message || 'No se pudo eliminar el usuario.');
      }
    } catch {
      showToast('error', 'Error al eliminar usuario.');
    }
  };

  if (loading || !tenant) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
                : 'bg-rose-950/90 text-rose-200 border-rose-800'
              }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Top Bar Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/superadmin"
              className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              title="Volver al panel Superadmin"
            >
              <ArrowLeft className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
            </Link>
            <div className="flex items-center gap-3">
              {tenant.logoUrl ? (
                <img
                  src={tenant.logoUrl}
                  alt={tenant.name}
                  className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-base">
                  {tenant.name.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-lg tracking-tight">{tenant.name}</h1>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tenant.isActive
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

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href={
                typeof window !== 'undefined' && window.location.host.includes('localhost')
                  ? `http://${tenant.slug}.localhost:${window.location.port || '3000'}`
                  : `https://${tenant.slug}.${ROOT_URL}`
              }
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition"
            >
              <span>Abrir Tienda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </header>

      {/* Grid Principal con SideMenu y Contenido */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Side Menu */}
          <aside className="md:col-span-1 space-y-2">
            <div className="p-3 bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-3 py-1 block">
                Navegación Tenant
              </span>

              <button
                onClick={() => setActiveTab('info')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${activeTab === 'info'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
              >
                <Info className="w-4 h-4" />
                <span>Información General</span>
              </button>

              <button
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${activeTab === 'categories'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <FolderPlus className="w-4 h-4" />
                  <span>Categorías</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {categories.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${activeTab === 'products'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Productos</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${activeTab === 'users'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Usuarios</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  {tenantUsers.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab('subscription')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition ${activeTab === 'subscription'
                    ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                  }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Suscripción & Pagos</span>
              </button>
            </div>

            {/* Card Resumen de Métricas */}
            <div className="p-4 bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                Métricas del Local
              </span>
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <span className="block font-bold text-base">{products.length}</span>
                  <span className="text-[10px] text-zinc-500">Productos</span>
                </div>
                <div className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                  <span className="block font-bold text-base">{categories.length}</span>
                  <span className="text-[10px] text-zinc-500">Categorías</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Panel Principal de Contenido */}
          <main className="md:col-span-3">
            {/* TAB 1: INFORMACIÓN GENERAL */}
            {activeTab === 'info' && (
              <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Información del Restaurante</h3>
                  <p className="text-xs text-zinc-500">
                    Modifica los datos comerciales, dominio y estado de atención del local.
                  </p>
                </div>

                <form onSubmit={handleUpdateInfo} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">Nombre Comercial *</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Subdominio / Slug *</label>
                      <input
                        type="text"
                        required
                        value={slug}
                        onChange={(e) => setSlug(e.target.value)}
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium mb-1">RUT Comercial</label>
                      <input
                        type="text"
                        value={rut}
                        onChange={(e) => setRut(e.target.value)}
                        placeholder="76.123.456-7"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium mb-1">Teléfono / WhatsApp *</label>
                      <input
                        type="text"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="56912345678"
                        className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">URL Imagen Logo / Icono</label>
                    <div className="flex gap-3">
                      <input
                        type="url"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        placeholder="https://midominio.com/logo.png"
                        className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      {logoUrl && (
                        <img
                          src={logoUrl}
                          alt="Preview"
                          className="w-9 h-9 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700"
                        />
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Dirección del Local</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Av. Providencia 1234, Santiago"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium mb-1">Dominio Personalizado (Opcional)</label>
                    <input
                      type="text"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="sazonperuana.cl"
                      className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800">
                    <input
                      type="checkbox"
                      id="isActiveCheckbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                    />
                    <label htmlFor="isActiveCheckbox" className="text-xs font-medium cursor-pointer">
                      Restaurante Activo (Permite recibir pedidos y visualizar catálogo público)
                    </label>
                  </div>

                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingInfo}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition disabled:opacity-50"
                    >
                      {isUpdatingInfo ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB: MANTENEDOR CATEGORÍAS */}
            {activeTab === 'categories' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <FolderPlus className="w-5 h-5" />
                    <h3 className="text-base font-bold">Agregar Nueva Categoría para {tenant.name}</h3>
                  </div>

                  <form onSubmit={handleCreateCategory} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium mb-1">Nombre Categoría *</label>
                        <input
                          type="text"
                          required
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Ej: Hamburguesas, Bebidas, Postres..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Orden de despliegue</label>
                        <input
                          type="number"
                          value={newCatSortOrder}
                          onChange={(e) => setNewCatSortOrder(Number(e.target.value))}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isCreatingCat}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50"
                      >
                        {isCreatingCat ? 'Creando...' : 'Crear Categoría'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold">Categorías Registradas ({categories.length})</h3>
                  <p className="text-xs text-zinc-500">
                    Si desactivas una categoría, se ocultará inmediatamente junto a sus productos de la carta del restaurant.
                  </p>

                  {loadingCategories ? (
                    <div className="py-8 text-center text-xs text-zinc-500">Cargando categorías...</div>
                  ) : categories.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">No hay categorías registradas en este local.</p>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {categories.map((cat) => (
                        <div key={cat.id} className="py-3.5 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${cat.isActive ? 'bg-emerald-500' : 'bg-zinc-400 dark:bg-zinc-600'
                                }`}
                            />
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">{cat.name}</p>
                              <span className="text-[10px] text-zinc-500">
                                {cat._count?.products || 0} producto(s) | Orden: {cat.sortOrder}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleCategoryActive(cat)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${cat.isActive
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                                }`}
                            >
                              {cat.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              <span>{cat.isActive ? 'Visible en Menú' : 'Oculto en Menú'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                              title="Eliminar categoría"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MANTENEDOR PRODUCTOS */}
            {activeTab === 'products' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <UtensilsCrossed className="w-5 h-5" />
                    <h3 className="text-base font-bold">Agregar Nuevo Producto a {tenant.name}</h3>
                  </div>

                  <form onSubmit={handleCreateProduct} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Nombre Producto *</label>
                        <input
                          type="text"
                          required
                          value={newProdName}
                          onChange={(e) => setNewProdName(e.target.value)}
                          placeholder="Ej: Hamburguesa Italiana"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Precio CLP ($) *</label>
                        <input
                          type="number"
                          required
                          value={newProdPrice}
                          onChange={(e) => setNewProdPrice(e.target.value ? Number(e.target.value) : '')}
                          placeholder="8900"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Categoría *</label>
                        <select
                          required
                          value={newProdCatId}
                          onChange={(e) => setNewProdCatId(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        >
                          <option value="">Selecciona Categoría...</option>
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Descripción</label>
                        <input
                          type="text"
                          value={newProdDesc}
                          onChange={(e) => setNewProdDesc(e.target.value)}
                          placeholder="Pan brioche, palta fresca, tomate, mayo de la casa..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">URL Imagen Ilustrativa</label>
                        <input
                          type="url"
                          value={newProdImg}
                          onChange={(e) => setNewProdImg(e.target.value)}
                          placeholder="https://..."
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isCreatingProd}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50"
                      >
                        {isCreatingProd ? 'Guardando...' : 'Crear Producto'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold">Catálogo de Productos ({products.length})</h3>
                  <p className="text-xs text-zinc-500">
                    Al desactivar un producto, se ocultará inmediatamente de la carta del restaurant.
                  </p>

                  {loadingProducts ? (
                    <div className="py-8 text-center text-xs text-zinc-500">Cargando productos...</div>
                  ) : products.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">No hay productos creados en este local.</p>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {products.map((prod) => (
                        <div key={prod.id} className="py-3.5 flex items-center justify-between text-xs gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {prod.imageUrl ? (
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-10 h-10 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                                <UtensilsCrossed className="w-4 h-4 text-zinc-400" />
                              </div>
                            )}

                            <div className="truncate">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{prod.name}</p>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                  ${prod.price.toLocaleString('es-CL')}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500 truncate">
                                Categoría: {prod.category?.name || 'Sin Categoría'} {prod.description ? `— ${prod.description}` : ''}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleToggleProductActive(prod)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition ${prod.isActive
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20'
                                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border-zinc-200 dark:border-zinc-700'
                                }`}
                            >
                              {prod.isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                              <span>{prod.isActive ? 'Visible' : 'Oculto'}</span>
                            </button>

                            <button
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                              title="Eliminar producto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: GESTIÓN DE USUARIOS */}
            {activeTab === 'users' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <UserPlus className="w-5 h-5" />
                    <h3 className="text-base font-bold">Agregar Usuario a {tenant.name}</h3>
                  </div>

                  <form onSubmit={handleCreateUser} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Email *</label>
                        <input
                          type="email"
                          required
                          value={newUserEmail}
                          onChange={(e) => setNewUserEmail(e.target.value)}
                          placeholder="usuario@local.cl"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Contraseña *</label>
                        <input
                          type="password"
                          required
                          value={newUserPassword}
                          onChange={(e) => setNewUserPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Rol *</label>
                        <select
                          value={newUserRole}
                          onChange={(e) => setNewUserRole(e.target.value as any)}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        >
                          <option value="STORE_ADMIN">STORE_ADMIN (Admin de Tienda)</option>
                          <option value="KITCHEN">KITCHEN (Pantalla Cocina KDS)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isCreatingUser}
                        className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50"
                      >
                        {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold">Usuarios Asignados ({tenantUsers.length})</h3>

                  {tenantUsers.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">No hay usuarios asignados a este restaurante.</p>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                      {tenantUsers.map((u) => (
                        <div key={u.id} className="py-3 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-zinc-100">{u.email}</p>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                              {u.role}
                            </span>
                          </div>

                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                            title="Eliminar acceso"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SUSCRIPCIÓN & HISTORIAL DE PAGOS */}
            {activeTab === 'subscription' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        Estado de Suscripción
                      </span>
                      <h3 className="text-xl font-bold tracking-tight">Plan {planType} Multi-Tenant</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleQuickExtend(30)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                      >
                        +30 Días
                      </button>
                      <button
                        onClick={() => handleQuickExtend(365)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
                      >
                        +1 Año
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleUpdateSubscription} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium mb-1">Tipo de Plan</label>
                        <select
                          value={planType}
                          onChange={(e) => setPlanType(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                        >
                          <option value="PRO">PRO Gastronómico ($49.900/mes)</option>
                          <option value="ENTERPRISE">ENTERPRISE ($99.900/mes)</option>
                          <option value="STARTER">STARTER ($29.900/mes)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium mb-1">Fecha de Vencimiento de Acceso *</label>
                        <input
                          type="date"
                          required
                          value={planExpiresAt}
                          onChange={(e) => setPlanExpiresAt(e.target.value)}
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent font-mono"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={isUpdatingPlan}
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md disabled:opacity-50"
                      >
                        {isUpdatingPlan ? 'Actualizando...' : 'Actualizar Vencimiento'}
                      </button>
                    </div>
                  </form>
                </div>

                <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold">Historial de Pagos & Comprobantes</h3>
                      <p className="text-xs text-zinc-500">Registro de cobros mensuales y renovaciones del tenant</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/40 text-[11px] font-semibold text-zinc-500">
                          <th className="py-3 px-4">N° Comprobante</th>
                          <th className="py-3 px-4">Fecha Pago</th>
                          <th className="py-3 px-4">Monto</th>
                          <th className="py-3 px-4">Método</th>
                          <th className="py-3 px-4 text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 font-mono">
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40">
                            <td className="py-3 px-4 font-semibold text-zinc-900 dark:text-zinc-100">{p.id}</td>
                            <td className="py-3 px-4 text-zinc-500">{p.date}</td>
                            <td className="py-3 px-4 font-bold text-zinc-950 dark:text-zinc-50">
                              ${p.amount.toLocaleString('es-CL')} CLP
                            </td>
                            <td className="py-3 px-4 text-zinc-600 dark:text-zinc-400 font-sans">{p.method}</td>
                            <td className="py-3 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-sans font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                PAGADO
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
