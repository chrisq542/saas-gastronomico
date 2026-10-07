'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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

export default function CheckoutPage() {
  const { items, subtotal, totalItems, updateQuantity, removeItem, clearCart } = useCart();

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
      <div className="max-w-md mx-auto text-center space-y-6 py-12 px-4 bg-white rounded-3xl border border-slate-200 shadow-xl my-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-widest text-emerald-600">
            ¡Pedido Registrado con Éxito!
          </span>
          <h2 className="text-3xl font-black text-slate-900">
            Pedido #{createdOrderData.orderNumber}
          </h2>
          <p className="text-sm text-slate-600">
            Tu pedido ha ingresado a nuestra cola de cocina. Para una confirmación inmediata, envía el mensaje por WhatsApp:
          </p>
        </div>

        <div className="pt-2 space-y-3">
          <a
            href={createdOrderData.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition text-base"
          >
            <Send className="w-5 h-5" />
            Enviar Pedido por WhatsApp
            <ExternalLink className="w-4 h-4 ml-1 opacity-80" />
          </a>

          <Link
            href="/"
            className="block text-sm font-semibold text-slate-600 hover:text-slate-900 pt-2"
          >
            Volver al Menú Principal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 transition text-slate-600"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h2 className="text-2xl font-black text-slate-900">Finalizar Pedido</h2>
      </div>

      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-4 rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulario de Checkout */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-6">
          {/* Tipo de Entrega */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              1. Modalidad de Entrega
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setOrderType('DELIVERY')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-bold transition gap-1.5 ${
                  orderType === 'DELIVERY'
                    ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Bike className="w-6 h-6" />
                Delivery a Domicilio
                <span className="text-[11px] font-normal text-slate-500">+$2.000</span>
              </button>

              <button
                type="button"
                onClick={() => setOrderType('PICKUP')}
                className={`flex flex-col items-center justify-center p-4 rounded-xl border text-sm font-bold transition gap-1.5 ${
                  orderType === 'PICKUP'
                    ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Store className="w-6 h-6" />
                Retiro en Local
                <span className="text-[11px] font-normal text-emerald-600">Gratis</span>
              </button>
            </div>
          </div>

          {/* Datos del Cliente */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              2. Datos del Cliente (Sin Registro)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">
                  Teléfono Móvil (WhatsApp) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: 912345678"
                  value={phone}
                  onBlur={handlePhoneBlur}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">RUT / DNI (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: 12.345.678-K"
                  value={rut}
                  onChange={(e) => setRut(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Email (Opcional)</label>
                <input
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Dirección para Delivery */}
          {orderType === 'DELIVERY' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
                  3. Dirección de Entrega
                </h3>
                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                  Máximo 3 direcciones por cliente
                </span>
              </div>

              {/* Si tiene direcciones previas registradas */}
              {existingAddresses.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-slate-600">Direcciones guardadas:</span>
                  <div className="space-y-2">
                    {existingAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                          selectedAddressId === addr.id
                            ? 'border-orange-500 bg-orange-50/50 font-bold'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="addressSelection"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="accent-orange-600"
                        />
                        <span>
                          {addr.street} #{addr.number} {addr.apartment ? `Depto ${addr.apartment}` : ''}
                        </span>
                      </label>
                    ))}
                    <label
                      className={`flex items-center gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                        selectedAddressId === null
                          ? 'border-orange-500 bg-orange-50/50 font-bold'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="addressSelection"
                        checked={selectedAddressId === null}
                        onChange={() => setSelectedAddressId(null)}
                        className="accent-orange-600"
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
                    <label className="text-xs font-semibold text-slate-700">Calle *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Av. Providencia"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">Número *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: 1234"
                      value={number}
                      onChange={(e) => setNumber(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Depto / Torre / Casa (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Depto 402"
                      value={apartment}
                      onChange={(e) => setApartment(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700">
                      Referencia de entrega
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Portón negro, timbre 402"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Método de Pago */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">
              4. Forma de Pago
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === 'CASH'
                    ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-emerald-600" />
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('CARD_ON_DELIVERY')}
                className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === 'CARD_ON_DELIVERY'
                    ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <CreditCard className="w-5 h-5 text-blue-600" />
                Tarjeta (POS)
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`flex items-center gap-2 p-3.5 rounded-xl border text-xs font-bold transition ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-sm'
                    : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Banknote className="w-5 h-5 text-amber-600" />
                Transferencia
              </button>
            </div>

            {paymentMethod === 'CASH' && (
              <div className="pt-2">
                <label className="text-xs font-semibold text-slate-700">
                  ¿Con cuánto pagas? (Para llevarte vuelto):
                </label>
                <input
                  type="number"
                  placeholder="Ej: 20000"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2 mt-1 focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Notas generales */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-2 shadow-sm">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Notas adicionales del pedido
            </label>
            <textarea
              rows={2}
              placeholder="Instrucciones para el repartidor o detalles adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || items.length === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              'Enviando a cocina...'
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                Confirmar Pedido ({formatCurrency(grandTotal)})
              </>
            )}
          </button>
        </form>

        {/* Resumen del Carrito Sidebar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 sticky top-20">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Resumen del Pedido</h3>
              <span className="text-xs font-semibold text-slate-500">{totalItems} productos</span>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-8 text-slate-400 space-y-2">
                <ShoppingBag className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm">Tu carrito está vacío</p>
                <Link href="/" className="text-xs text-orange-600 font-bold underline">
                  Ir al catálogo
                </Link>
              </div>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {items.map((item) => (
                  <div
                    key={item.product.id}
                    className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 text-sm"
                  >
                    <div className="flex-1">
                      <div className="font-bold text-slate-900 leading-snug">{item.product.name}</div>
                      <div className="text-xs text-slate-500">
                        {formatCurrency(item.product.price)} c/u
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-orange-600 italic mt-0.5">
                          Nota: {item.notes}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:text-orange-600"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:text-orange-600"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeItem(item.product.id)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Totales */}
            <div className="space-y-1.5 pt-2 text-sm border-t border-slate-100">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Costo de Envío:</span>
                <span>{orderType === 'DELIVERY' ? formatCurrency(deliveryFee) : 'Gratis'}</span>
              </div>
              <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total:</span>
                <span className="text-orange-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
