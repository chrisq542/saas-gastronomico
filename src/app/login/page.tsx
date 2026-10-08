'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, ArrowRight, ShieldCheck, UtensilsCrossed, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
      router.push(data.redirectUrl || '/superadmin');
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al autenticar');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMasterFill = () => {
    setEmail('chrisq542@gmail.com');
    setPassword('8Y9nIW1pVlJL');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Logo */}
        <div className="flex justify-center">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-xl shadow-orange-600/30 group-hover:scale-105 transition">
              <UtensilsCrossed className="w-6 h-6" />
            </div>
            <div className="text-left">
              <span className="text-xl font-bold tracking-tight text-white block">
                FastFood<span className="text-orange-500">SaaS</span>
              </span>
              <span className="text-xs text-slate-400 block -mt-1 font-medium">
                Portal de Acceso Unificado
              </span>
            </div>
          </Link>
        </div>

        <h2 className="mt-8 text-center text-2xl font-bold tracking-tight text-white">
          Acceso a Plataforma Multi-Tenant
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Ingresa con tu cuenta Master (Superadmin) o credenciales de restaurante
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10">
          {errorMessage && (
            <div className="mb-6 rounded-xl bg-red-950/50 border border-red-800/80 p-3.5 flex items-start gap-3 text-red-200 text-sm">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. chrisq542@gmail.com"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Contraseña
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-orange-600/20 text-sm font-semibold text-white bg-orange-600 hover:bg-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-orange-500 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verificando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al Sistema</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Shortcut for Master Devs (Christopher & Andrew) */}
          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-2">Acceso Rápido Cuenta Master Dev:</p>
            <button
              type="button"
              onClick={handleQuickMasterFill}
              className="inline-flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 bg-orange-950/40 border border-orange-800/40 px-3 py-1.5 rounded-lg transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Autocompletar (chrisq542@gmail.com)</span>
            </button>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-xs text-slate-400 hover:text-white transition font-medium"
          >
            ← Volver a la página principal
          </Link>
        </div>
      </div>
    </div>
  );
}
