'use client';

import React, { useState } from 'react';
import { Mail, KeyRound, Lock, CheckCircle2, AlertCircle, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
}

type Step = 'REQUEST' | 'VERIFY_AND_RESET' | 'SUCCESS';

export function ForgotPasswordModal({
  isOpen,
  onClose,
  initialEmail = '',
}: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>('REQUEST');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Reiniciar estado al abrir/cerrar
  const handleModalClose = () => {
    setError(null);
    setInfoMessage(null);
    setLoading(false);
    setStep('REQUEST');
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  // Paso 1: Solicitar código
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al solicitar el código.');
      }

      setInfoMessage('Se ha enviado un código numérico de 6 dígitos a tu bandeja de entrada.');
      setStep('VERIFY_AND_RESET');
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Verificar código y cambiar contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (code.trim().length !== 6) {
      setError('El código debe tener exactamente 6 dígitos.');
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code: code.trim(),
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña.');
      }

      setStep('SUCCESS');
    } catch (err: any) {
      setError(err.message || 'Error de conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleModalClose}
      title="Recuperar Contraseña"
      closeOnBackdropClick={false}
    >
      <div className="p-6 space-y-5">
        {/* Banner de Error */}
        {error && (
          <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 flex items-start gap-2.5 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Banner de Info */}
        {infoMessage && step === 'VERIFY_AND_RESET' && (
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 p-3 flex items-start gap-2.5 text-emerald-700 dark:text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* PASO 1: Formulario Solicitar Código */}
        {step === 'REQUEST' && (
          <form onSubmit={handleRequestCode} className="space-y-4">
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un código de seguridad de 6 dígitos válido por 15 minutos.
            </p>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ej. gerente@sasburger.com"
                  className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-xs text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando código...</span>
                </>
              ) : (
                <span>Enviar Código de Verificación</span>
              )}
            </button>
          </form>
        )}

        {/* PASO 2: Ingresar Código de 6 Dígitos y Nueva Clave */}
        {step === 'VERIFY_AND_RESET' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Código de 6 Dígitos
                </label>
                <button
                  type="button"
                  onClick={() => setStep('REQUEST')}
                  className="text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 inline-flex items-center gap-1 transition"
                >
                  <ArrowLeft className="w-3 h-3" /> Reenviar o cambiar email
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <KeyRound className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  className="block w-full pl-9 pr-3 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 font-mono text-center tracking-[0.4em] text-base font-bold focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
              <p className="text-[10px] text-zinc-400 mt-1">
                Ingresa el código que te enviamos a <strong>{email}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  className="block w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-950 dark:text-zinc-100 placeholder-zinc-400 text-xs focus:outline-none focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-lg shadow-xs text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 disabled:opacity-60 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validando y actualizando...</span>
                </>
              ) : (
                <span>Restablecer Contraseña</span>
              )}
            </button>
          </form>
        )}

        {/* PASO 3: Éxito */}
        {step === 'SUCCESS' && (
          <div className="text-center py-4 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                ¡Contraseña restablecida!
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Tu contraseña ha sido actualizada con éxito. Ya puedes iniciar sesión con tus nuevas credenciales.
              </p>
            </div>

            <button
              type="button"
              onClick={handleModalClose}
              className="w-full py-2.5 px-4 rounded-lg shadow-xs text-xs font-medium text-white bg-zinc-950 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 transition"
            >
              Volver al Inicio de Sesión
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
