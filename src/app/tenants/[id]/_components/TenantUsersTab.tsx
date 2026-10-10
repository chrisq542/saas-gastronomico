'use client';

import React, { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { ROLES, RoleType } from '@/constants/roles';

export interface TenantUser {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

interface TenantUsersTabProps {
  tenantId: string;
  tenantName: string;
  tenantUsers: TenantUser[];
  onUserCreatedOrDeleted: () => void;
  showToast: (type: 'success' | 'error', text: string) => void;
}

export default function TenantUsersTab({
  tenantId,
  tenantName,
  tenantUsers,
  onUserCreatedOrDeleted,
  showToast,
}: TenantUsersTabProps) {
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<RoleType>(ROLES.STORE_ADMIN);
  const [isCreatingUser, setIsCreatingUser] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      showToast('error', 'El email y la contraseña son requeridos.');
      return;
    }

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
        showToast('success', 'Usuario asignado con éxito.');
        setNewUserEmail('');
        setNewUserPassword('');
        onUserCreatedOrDeleted();
      } else {
        showToast('error', data.message || 'Error al agregar usuario.');
      }
    } catch {
      showToast('error', 'Error al conectar con el servidor.');
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Seguro que deseas eliminar el acceso de este usuario?')) return;
    try {
      const res = await fetch(
        `/api/admin/restaurants/${tenantId}/users?userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Usuario eliminado.');
        onUserCreatedOrDeleted();
      } else {
        showToast('error', data.message || 'Error al eliminar usuario.');
      }
    } catch {
      showToast('error', 'Error al eliminar usuario.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario Agregar Usuario */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
          <UserPlus className="w-5 h-5" />
          <h3 className="text-base font-bold">Agregar Usuario a {tenantName}</h3>
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
                onChange={(e) => setNewUserRole(e.target.value as RoleType)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900"
              >
                <option value={ROLES.STORE_ADMIN}>STORE_ADMIN (Admin de Tienda)</option>
                <option value={ROLES.KITCHEN}>KITCHEN (Monitor de Cocina KDS)</option>
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

      {/* Listado de Usuarios */}
      <div className="bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold">Usuarios Asignados ({tenantUsers.length})</h3>

        {tenantUsers.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">
            No hay usuarios asignados a este restaurante.
          </p>
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
  );
}
