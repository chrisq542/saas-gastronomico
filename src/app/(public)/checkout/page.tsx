'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatCurrency, validateRut, cleanPhoneNumber } from '@/lib/utils/formatters';
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  Bike,
  Store,
  CreditCard,
  Banknote,
  Send,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

function CheckoutContent() {
  const { items, subtotal, totalItems, updateQuantity, removeItem, clearCart } = useCart();
  const searchParams = useSearchParams();
  const tenantSlug = searchParams.get('tenant') || '';

  // Estados del formulario sin registro
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [rut, setRut] = useState('');
  const [orderType, setOrderType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');

  // Dirección
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [apartment, setApartment] = useState('');
  const [reference, setReference] = useState('');

  // Cliente recurrente y direcciones guardadas (máx 3)
  const [existingAddresses, setExistingAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Pago y notas
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD_ON_DELIVERY' | 'TRANSFER'>('CASH');
  const [cashAmount, setCashAmount] = useState('');
  const [notes, setNotes] = useState('');

  // Estado de envío
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdOrderData, setCreatedOrderData] = useState<{
    orderNumber: number;
    whatsappUrl: string;
  } | null>(null);

  // Validar si el tenant del subdominio existe al cargar el checkout
  useEffect(() => {
    if (tenantSlug) {
      fetch(`/api/menu?slug=${encodeURIComponent(tenantSlug)}`)
        .then((res) => res.json())
        .then((res) => {
          if (!res.success || res.notFound) {
            const host = window.location.host;
            const protocol = window.location.protocol;
            if (host.includes('.localhost')) {
              const port = window.location.port ? `:${window.location.port}` : '';
              window.location.replace(`${protocol}//localhost${port}/`);
            } else if (host.includes('.lvh.me')) {
              const port = window.location.port ? `:${window.location.port}` : '';
              window.location.replace(`${protocol}//lvh.me${port}/`);
            } else {
              const parts = host.split(':')[0].split('.');
              if (parts.length > 2) {
                const port = window.location.port ? `:${window.location.port}` : '';
                window.location.replace(`${protocol}//${parts.slice(1).join('.')}${port}/`);
              }
            }
          }
        })
        .catch(() => {});
    }
  }, [tenantSlug]);

  const deliveryFee = orderType === 'DELIVERY' ? 2000 : 0;
  const grandTotal = subtotal + deliveryFee;

  // Autocompletado inteligente al ingresar teléfono
  const handlePhoneBlur = async () => {
    const cleaned = cleanPhoneNumber(phone);
    if (cleaned.length >= 8) {
      try {
        const res = await fetch(`/api/customers?phone=${cleaned}`);
        const data = await res.json();
        if (data.success && data.data) {
          const cust = data.data;
          if (!name) setName(cust.name);
          if (!email && cust.email) setEmail(cust.email);
          if (!rut && cust.rut) setRut(cust.rut);
          if (cust.addresses && cust.addresses.length > 0) {
            setExistingAddresses(cust.addresses);
            setSelectedAddressId(cust.addresses[0].id);
          }
        }
      } catch (e) {
        // Silencioso
      }
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (items.length === 0) {
      setErrorMessage('Tu carrito está vacío. Agrega productos antes de continuar.');
      return;
    }

    if (!name.trim()) {
      setErrorMessage('Por favor ingresa tu nombre completo.');
      return;
    }

    const cleanPhone = cleanPhoneNumber(phone);
    if (cleanPhone.length < 8) {
      setErrorMessage('Por favor ingresa un número de teléfono válido.');
      return;
    }

    if (rut.trim() && !validateRut(rut.trim())) {
      setErrorMessage('El RUT ingresado no es válido. Verifica el dígito verificador.');
      return;
    }

    if (orderType === 'DELIVERY' && !selectedAddressId && (!street.trim() || !number.trim())) {
      setErrorMessage('Por favor completa la calle y número para la entrega.');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalNotes = notes;
      if (paymentMethod === 'CASH' && cashAmount.trim()) {
        finalNotes = `${notes ? notes + ' | ' : ''}Paga con: $${cashAmount} (llevar vuelto)`;
      }

      const payload = {
        restaurantSlug: tenantSlug || null,
        customer: {
          name: name.trim(),
          phone: cleanPhone,
          email: email.trim() || null,
          rut: rut.trim() || null,
        },
        orderType: orderType,
        addressId: selectedAddressId || null,
        address:
          orderType === 'DELIVERY' && !selectedAddressId
            ? {
                street: street.trim(),
                number: number.trim(),
                apartment: apartment.trim() || null,
                city: 'Santiago',
                reference: reference.trim() || null,
              }
            : null,
        paymentMethod: paymentMethod,
        notes: finalNotes || null,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes || null,
        })),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No pudimos procesar tu pedido.');
      }

      // Éxito: Guardar datos de confirmación y vaciar carrito local
      setCreatedOrderData({
        orderNumber: json.data.orderNumber,
        whatsappUrl: json.whatsappUrl,
      });
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (createdOrderData) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12 px-6 bg-white dark:bg-[#121215] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs my-6">
        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800/80">
          <CheckCircle2 className="w-6 h-6" />
        </div>

        <div className="space-y-1.5">
          <span className="text-[11px] uppercase font-semibold tracking-wider text-emerald-600 dark:text-emerald-400">
            Pedido Registrado con Éxito
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            Orden #{createdOrderData.orderNumber}
          </h2>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Tu orden ha ingresado al monitor de cocina. Para confirmación y seguimiento, envía el pedido por WhatsApp:
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <a
            href={createdOrderData.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-5 rounded-lg shadow-xs transition text-xs sm:text-sm"
          >
            <Send className="w-4 h-4" />
            <span>Enviar Pedido por WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </a>

          <Link
            href="/"
            className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-100 transition pt-1"
          >
            ← Volver al Menú Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2.5">
        <Link
          href="/"
          className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition text-zinc-600 dark:text-zinc-400"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-zinc-100">
          Finalizar Pedido
        </h2>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs p-3.5 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
        {/* Formulario de Checkout */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-5">
          {/* Tipo de Entrega */}
          <div className="bg-white dark:bg-[#121215] p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3 shadow-xs">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-100 text-xs uppercase tracking-wide">
              1. Modalidad de Entrega
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('DELIVERY')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-medium transition gap-1 ${
                  orderType === 'DELIVERY'
                    ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Bike className="w-5 h-5" />
                <span>Delivery a Domicilio</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">+$2.000</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('PICKUP')}
                className={`flex flex-col items-center justify-center p-3.5 rounded-lg border text-xs font-medium transition gap-1 ${
                  orderType === 'PICKUP'
                    ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Store className="w-5 h-5" />
                <span>Retiro en Local</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Gratis</span>
              </button>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="bg-white dark:bg-[#121215] p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-4 shadow-xs">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-100 text-xs uppercase tracking-wide">
              2. Datos del Cliente (Sin Registro)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Teléfono Móvil (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 912345678"
                  value={phone}
                  onBlur={handlePhoneBlur}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">RUT / DNI (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 12.345.678-K"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dirección para Delivery */}
          {orderType === 'DELIVERY' && (
            <div className="bg-white dark:bg-[#121215] p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-4 shadow-xs">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-zinc-950 dark:text-zinc-100 text-xs uppercase tracking-wide">
                  3. Dirección de Entrega
                </h3>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                  Máximo 3 direcciones guardadas
                </span>
              </div>

              {/* Si tiene direcciones previas */}
              {existingAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">Direcciones guardadas:</span>
                  <div className="space-y-2">
                    {existingAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900 font-medium'
                            : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addressSelection"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="accent-zinc-950 dark:accent-zinc-100"
                        />
                        <span>
                          {addr.street} #{addr.number} {addr.apartment ? `Depto ${addr.apartment}` : ''}
                        </span>
                      </label>
                    ))}
                    <label
                      className={`flex items-center gap-3 p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        selectedAddressId === null
                          ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900 font-medium'
                          : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressSelection"
                        checked={selectedAddressId === null}
                        onChange={() => setSelectedAddressId(null)}
                        className="accent-zinc-950 dark:accent-zinc-100"
                      />
                      <span>Ingresar una dirección nueva</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Formulario de nueva dirección */}
              {selectedAddressId === null && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Calle *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Av. Providencia"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1234"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Depto / Torre / Casa (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Depto 402"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Referencia de entrega
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Portón negro, timbre 402"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Método de Pago */}
          <div className="bg-white dark:bg-[#121215] p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-3 shadow-xs">
            <h3 className="font-semibold text-zinc-950 dark:text-zinc-100 text-xs uppercase tracking-wide">
              4. Forma de Pago
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${
                  paymentMethod === 'CASH'
                    ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD_ON_DELIVERY')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${
                  paymentMethod === 'CARD_ON_DELIVERY'
                    ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Tarjeta (POS)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-xs font-medium transition ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-zinc-950 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900'
                }`}
              >
                <Banknote className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Transferencia</span>
              </button>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="pt-2">
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  ¿Con cuánto pagas? (Para llevarte vuelto):
                </label>
                <input
                  type="number"
                  placeholder="Ej: 20000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 mt-1 text-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Notas generales */}
          <div className="bg-white dark:bg-[#121215] p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 space-y-2 shadow-xs">
            <label className="text-xs font-semibold text-zinc-950 dark:text-zinc-100 uppercase tracking-wide">
              Notas adicionales del pedido
            </label>
            <textarea
              rows={2}
              placeholder="Instrucciones para el repartidor o detalles adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:ring-1 focus:ring-zinc-950 dark:focus:ring-zinc-100 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="w-full bg-zinc-950 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-950 font-medium py-3.5 px-6 rounded-lg text-sm shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Enviando a cocina...'
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Confirmar Pedido ({formatCurrency(grandTotal)})</span>
              </>
            )}
          </button>
        </form>

        {/* Resumen del Carrito Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-[#121215] p-5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-xs space-y-4 sticky top-20">
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
              <h3 className="font-semibold text-zinc-950 dark:text-zinc-100 text-sm">Resumen del Pedido</h3>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">{totalItems} productos</span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">Tu carrito está vacío</p>
                <Link href="/" className="text-xs text-zinc-950 dark:text-zinc-100 font-medium underline">
                  Ir al catálogo
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800/80 text-xs"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-zinc-950 dark:text-zinc-100 leading-snug">{item.product.name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {formatCurrency(item.product.price)} c/u
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 italic mt-0.5">
                          Nota: {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-md bg-zinc-50 dark:bg-zinc-900">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:text-zinc-950 dark:hover:text-zinc-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-medium text-zinc-950 dark:text-zinc-100">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:text-zinc-950 dark:hover:text-zinc-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-zinc-400 hover:text-rose-600 p-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totales */}
            <div className="space-y-1.5 pt-2 text-xs border-t border-zinc-100 dark:border-zinc-800/80">
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
                <span>Costo de Envío:</span>
                <span>{orderType === 'DELIVERY' ? formatCurrency(deliveryFee) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold text-zinc-950 dark:text-zinc-100 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <span>Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CheckoutFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-3 text-zinc-500 dark:text-zinc-400">
        <div className="w-8 h-8 border-2 border-zinc-950 dark:border-zinc-100 border-t-transparent animate-spin rounded-full" />
        <span className="text-xs font-medium">Cargando checkout...</span>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutContent />
    </Suspense>
  );
}

