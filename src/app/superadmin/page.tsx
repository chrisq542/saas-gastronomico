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
  Building2,
  X,
  AlertTriangle,
  RefreshCw,
  ShoppingBag,
  Globe,
  Check,
  Edit,
  Trash2,
  Users,
  Image as ImageIcon,
  Key,
  UserPlus,
  CheckCircle2,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

interface TenantUser {
  id: string;
  email: string;
  role: 'STORE_ADMIN' | 'KITCHEN';
  createdAt: string;
}

interface Tenant {
  id: string;
  slug: string;
  name: string;
  phone: string;
  rut?: string | null;
  logoUrl?: string | null;
  address?: string | null;
  customDomain?: string | null;
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

export default function SuperadminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [usersModalTenant, setUsersModalTenant] = useState<Tenant | null>(null);
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Formulario de Creación / Edición
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [rut, setRut] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [address, setAddress] = useState('');
  const [customDomain, setCustomDomain] = useState('');
  const [phone, setPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('Admin1234!');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulario de Nuevo Usuario para Tenant
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'STORE_ADMIN' | 'KITCHEN'>('STORE_ADMIN');
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  // Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
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

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const openCreateModal = () => {
    setName('');
    setSlug('');
    setRut('');
    setLogoUrl('');
    setAddress('');
    setCustomDomain('');
    setPhone('');
    setAdminEmail('');
    setAdminPassword('Admin1234!');
    setEditingTenant(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setName(tenant.name);
    setSlug(tenant.slug);
    setRut(tenant.rut || '');
    setLogoUrl(tenant.logoUrl || '');
    setAddress(tenant.address || '');
    setCustomDomain(tenant.customDomain || '');
    setPhone(tenant.phone);
    setIsCreateModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || !phone.trim()) {
      showToast('error', 'Nombre, Subdominio y Teléfono son campos obligatorios.');
      return;
    }

    if (!editingTenant && (!adminEmail.trim() || !adminPassword.trim())) {
      showToast('error', 'El email y la contraseña inicial del administrador son obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = editingTenant
        ? `/api/admin/restaurants/${editingTenant.id}`
        : '/api/admin/restaurants';
      const method = editingTenant ? 'PATCH' : 'POST';

      const payload: any = {
        name: name.trim(),
        slug: slug.trim(),
        rut: rut.trim() || null,
        logoUrl: logoUrl.trim() || null,
        address: address.trim() || null,
        customDomain: customDomain.trim() || null,
        phone: phone.trim(),
      };

      if (!editingTenant) {
        payload.adminEmail = adminEmail.trim();
        payload.adminPassword = adminPassword.trim();
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        showToast('success', editingTenant ? 'Restaurante actualizado con éxito.' : 'Restaurante creado con éxito.');
        setIsCreateModalOpen(false);
        fetchTenants();
      } else {
        showToast('error', data.message || 'Ocurrió un error.');
      }
    } catch {
      showToast('error', 'Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
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
        showToast('success', `Restaurante ${!currentStatus ? 'activado' : 'desactivado'}.`);
      } else {
        showToast('error', data.message || 'Error al cambiar estado.');
      }
    } catch {
      showToast('error', 'Error al comunicar con el servidor.');
    }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (!confirm(`¿Estás seguro de eliminar el restaurante "${tenant.name}"? Se borrarán sus productos, menú y usuarios.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/restaurants/${tenant.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Restaurante eliminado correctamente.');
        fetchTenants();
      } else {
        showToast('error', data.message || 'No se pudo eliminar el restaurante.');
      }
    } catch {
      showToast('error', 'Error de comunicación al eliminar.');
    }
  };

  // --- Gestión de Usuarios de Tenant ---
  const openUsersModal = async (tenant: Tenant) => {
    setUsersModalTenant(tenant);
    setLoadingUsers(true);
    setTenantUsers([]);
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('STORE_ADMIN');

    try {
      const res = await fetch(`/api/admin/restaurants/${tenant.id}/users`);
      const data = await res.json();
      if (data.success) {
        setTenantUsers(data.data);
      }
    } catch (err) {
      console.error('Error obteniendo usuarios:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usersModalTenant || !newUserEmail.trim() || !newUserPassword.trim()) return;

    setIsCreatingUser(true);
    try {
      const res = await fetch(`/api/admin/restaurants/${usersModalTenant.id}/users`, {
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
        showToast('success', 'Usuario creado correctamente.');
        setTenantUsers((prev) => [data.data, ...prev]);
        setNewUserEmail('');
        setNewUserPassword('');
      } else {
        showToast('error', data.message || 'Error al crear usuario.');
      }
    } catch {
      showToast('error', 'Error de servidor al crear usuario.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!usersModalTenant) return;
    if (!confirm('¿Seguro que deseas eliminar este usuario?')) return;

    try {
      const res = await fetch(`/api/admin/restaurants/${usersModalTenant.id}/users?userId=${userId}`, {
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
      showToast('error', 'Error de red al eliminar usuario.');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#09090B] text-zinc-900 dark:text-zinc-100 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-4">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 text-emerald-200 border-emerald-800'
                : 'bg-rose-950/90 text-rose-200 border-rose-800'
            }`}
          >
            {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#09090B]/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base tracking-tight">Superadmin SaaS</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  Global Control
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Administración de restaurantes & inquilinos multi-tenant</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      {/* Body Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Banner de Acciones */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Inquilinos Gastronómicos</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              Administra marcas, logos, RUT, dominios y usuarios de cada local en el ecosistema.
            </p>
          </div>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Restaurante</span>
          </button>
        </div>

        {/* Lista de Tenants */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
          </div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-[#121215] rounded-2xl border border-zinc-200 dark:border-zinc-800">
            <Store className="w-10 h-10 mx-auto text-zinc-400 mb-3" />
            <p className="font-semibold text-sm">No hay restaurantes registrados</p>
            <p className="text-xs text-zinc-500 mt-1">Haz clic en "Nuevo Restaurante" para aprovisionar el primero.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tenants.map((tenant) => (
              <div
                key={tenant.id}
                className="flex flex-col justify-between rounded-2xl bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 p-6 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition"
              >
                <div className="space-y-4">
                  {/* Top: Logo & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {tenant.logoUrl ? (
                        <img
                          src={tenant.logoUrl}
                          alt={tenant.name}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-700 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold text-lg flex-shrink-0">
                          {tenant.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-base tracking-tight leading-snug">{tenant.name}</h3>
                        <p className="text-xs font-mono text-zinc-500">/{tenant.slug}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleStatus(tenant.id, tenant.isActive)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition ${
                        tenant.isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tenant.isActive ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>

                  {/* Info Detallada */}
                  <div className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    {tenant.rut && (
                      <p className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-500">RUT:</span>
                        <span className="font-mono">{tenant.rut}</span>
                      </p>
                    )}
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-zinc-400" />
                      <span>{tenant.phone}</span>
                    </p>
                    {tenant.address && (
                      <p className="flex items-center gap-2 text-zinc-500">
                        <span>📍 {tenant.address}</span>
                      </p>
                    )}
                    {tenant.customDomain && (
                      <p className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-mono">
                        <Globe className="w-3.5 h-3.5" />
                        <span>{tenant.customDomain}</span>
                      </p>
                    )}
                  </div>

                  {/* Contadores */}
                  <div className="grid grid-cols-4 gap-2 py-2 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-center text-xs">
                    <div>
                      <span className="block font-bold text-zinc-900 dark:text-zinc-100">{tenant._count?.products || 0}</span>
                      <span className="text-[10px] text-zinc-500">Prods</span>
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900 dark:text-zinc-100">{tenant._count?.categories || 0}</span>
                      <span className="text-[10px] text-zinc-500">Cats</span>
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900 dark:text-zinc-100">{tenant._count?.orders || 0}</span>
                      <span className="text-[10px] text-zinc-500">Pedidos</span>
                    </div>
                    <div>
                      <span className="block font-bold text-zinc-900 dark:text-zinc-100">{tenant._count?.users || 0}</span>
                      <span className="text-[10px] text-zinc-500">Users</span>
                    </div>
                  </div>
                </div>

                {/* Acciones de Tarjeta */}
                <div className="pt-4 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(tenant)}
                      className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                      title="Editar Restaurante"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openUsersModal(tenant)}
                      className="p-2 rounded-lg text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1 text-xs font-medium"
                      title="Gestionar Usuarios"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTenant(tenant)}
                      className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                      title="Eliminar Restaurante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <a
                    href={`/${tenant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    <span>Ver Carta</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* MODAL: Crear / Editar Restaurante */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <h3 className="text-lg font-bold">
                {editingTenant ? 'Editar Restaurante' : 'Aprovisionar Nuevo Restaurante'}
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Nombre del Local *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Sazón Peruana"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1">Subdominio / Slug *</label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="sazon-peruana"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">URL Imagen Logo / Icono</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://midominio.com/logo.png"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  {logoUrl && (
                    <img src={logoUrl} alt="Preview" className="w-9 h-9 rounded-lg object-cover border" />
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
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Dominio Personalizado (Opcional)</label>
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="sazonperuana.cl"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-transparent focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                />
              </div>

              {/* Si es creación nueva, pedir datos iniciales del admin */}
              {!editingTenant && (
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <span className="text-xs font-bold block text-emerald-600 dark:text-emerald-400">
                    Cuenta Administrador Inicial (STORE_ADMIN)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder="admin@sazon.cl"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">Contraseña *</label>
                      <input
                        type="text"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium rounded-xl text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-medium rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : editingTenant ? 'Actualizar' : 'Aprovisionar Tenant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Gestionar Usuarios de Tenant */}
      {usersModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div>
                <h3 className="text-lg font-bold">Usuarios de {usersModalTenant.name}</h3>
                <p className="text-xs text-zinc-500">Gestión de accesos para STORE_ADMIN y KITCHEN</p>
              </div>
              <button
                onClick={() => setUsersModalTenant(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Formulario Agregar Usuario */}
            <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
              <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <UserPlus className="w-4 h-4" />
                <span>Agregar Nuevo Usuario</span>
              </span>

              <div className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="Correo electrónico"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="password"
                    required
                    placeholder="Contraseña"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-transparent"
                  />

                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
                  >
                    <option value="STORE_ADMIN">STORE_ADMIN</option>
                    <option value="KITCHEN">KITCHEN (Cocina)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreatingUser}
                className="w-full py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm disabled:opacity-50"
              >
                {isCreatingUser ? 'Creando...' : 'Crear Usuario'}
              </button>
            </form>

            {/* Lista de Usuarios */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-zinc-500">Usuarios Registrados ({tenantUsers.length})</h4>
              {loadingUsers ? (
                <div className="py-6 text-center">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-emerald-500" />
                </div>
              ) : tenantUsers.length === 0 ? (
                <p className="text-xs text-zinc-500 py-4 text-center">No hay usuarios asignados a este restaurante.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {tenantUsers.map((u) => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-xs"
                    >
                      <div>
                        <p className="font-semibold">{u.email}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono">
                          {u.role}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition"
                        title="Eliminar Usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
