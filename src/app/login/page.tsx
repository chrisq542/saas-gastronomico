'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, UtensilsCrossed, AlertCircle, Loader2 } from 'lucide-react';
import { ThemeToggle } from '@/components/theme/ThemeToggle';
import { ROUTES } from '@/constants';
import { ForgotPasswordModal } from './_components/ForgotPasswordModal';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al iniciar sesión');
      }

      // Redirección exitosa según rol
      router.push(data.redirectUrl || ROUTES.SUPERADMIN.ROOT);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#F4F4F5] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative">
      {/* Top Bar with ThemeToggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>


      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 text-center space-y-4">
        <div className="bg-white dark:bg-[#121215] border border-zinc-200/80 dark:border-zinc-800/80 py-8 px-6 shadow-xs rounded-xl sm:px-8 space-y-5">

          {/* Brand Logo */}
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-lg bg-zinc-950 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-950 transition">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-base font-semibold tracking-tight text-zinc-950 dark:text-zinc-100 block">
                FastFood SaaS
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400 block -mt-0.5 font-normal">
                Portal de Acceso
              </span>
            </div>
          </Link>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-100">
              Ingreso a la Plataforma
            </h2>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              Cuenta Master Superadmin o credenciales de sucursal
            </p>
          </div>
          {errorMessage && (
            <div className="rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-3 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="h-3.5 w-3.5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. contacto@tumenudigital.cl"
                  className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] text-zinc-500 hover:text-zinc-950 dark:hover:text-zinc-100 transition"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative rounded-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="h-3.5 w-3.5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 transition"
                />
              </div>
            </div>
            <div className=" border-t border-zinc-100 dark:border-zinc-800/80 text-center space-y-2" />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-xs text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 focus:outline-none disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-70" />
                </>
              )}
            </button>
          </form>

          {/* Modal de Recuperación de Contraseña */}
          <ForgotPasswordModal
            isOpen={isForgotOpen}
            onClose={() => setIsForgotOpen(false)}
            initialEmail={email}
          />

          {/* Cuentas de Acceso Rápido / Pruebas */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2 text-left">
            <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">
              Accesos Rápidos de Prueba:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => {
                  setEmail('gerente@sasburger.com');
                  setPassword('Admin1234!');
                }}
                className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-left transition"
              >
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px]">STORE ADMIN</div>
                <div className="truncate text-[10px] text-zinc-500">gerente@sasburger.com</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setEmail('cocina@sasburger.com');
                  setPassword('Admin1234!');
                }}
                className="p-2 rounded-lg bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-left transition"
              >
                <div className="font-bold text-blue-600 dark:text-blue-400 text-[10px]">KITCHEN KDS</div>
                <div className="truncate text-[10px] text-zinc-500">cocina@sasburger.com</div>
              </button>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-5">
          <Link
            href="/"
            className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition font-normal"
          >
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}
