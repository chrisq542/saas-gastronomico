'use client';

import React from 'react';
import { Order } from '@/types';
import { formatCurrency, formatDateTime, formatRut, formatPhoneNumber } from '@/lib/utils/formatters';

interface ThermalTicket80mmProps {
  order: Order;
  elementId?: string;
  isKitchenCopy?: boolean; // Si es copia de cocina, enfatiza notas y productos más grandes
}

export const ThermalTicket80mm: React.FC<ThermalTicket80mmProps> = ({
  order,
  elementId = 'thermal-ticket-print',
  isKitchenCopy = false,
}) => {
  const restaurantName = process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'BURGER & FRIES SAAS';
  const restaurantRut = process.env.NEXT_PUBLIC_RESTAURANT_RUT || '76.543.210-K';
  const restaurantAddress = process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || 'Av. Providencia 1234, Santiago';

  const orderTypeLabels: Record<string, string> = {
    DELIVERY: '🛵 DELIVERY',
    PICKUP: '🥡 RETIRO EN LOCAL',
    DINE_IN: '🍽️ SALÓN / MESA',
  };

  const paymentMethodLabels: Record<string, string> = {
    CASH: 'EFECTIVO',
    CARD_ON_DELIVERY: 'TARJETA (POS MÓVIL)',
    TRANSFER: 'TRANSFERENCIA BANCARIA',
    ONLINE: 'PAGO ONLINE PAGADO',
  };

  return (
    <div className="thermal-ticket-wrapper">
      {/* Estilos CSS dedicados para impresión térmica de 80mm */}
      <style jsx global>{`
        @page {
          size: 80mm auto;
          margin: 0;
        }

        @media print {
          /* Ocultar cualquier elemento del layout administrativo o interfaz web */
          body * {
            visibility: hidden;
          }

          /* Hacer visible únicamente el ticket de comanda */
          #${elementId}, #${elementId} * {
            visibility: visible;
          }

          #${elementId} {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            max-width: 80mm;
            margin: 0;
            padding: 4mm 5mm;
            background: #ffffff !important;
            color: #000000 !important;
            font-family: 'Courier New', Courier, monospace !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>

      {/* Contenedor del Ticket */}
      <div
        id={elementId}
        className="w-[80mm] max-w-[80mm] bg-white text-black p-3 mx-auto font-mono text-[12px] leading-tight select-none shadow-sm print:shadow-none"
      >
        {/* Encabezado del Local */}
        <div className="text-center mb-2">
          <div className="text-sm font-black uppercase tracking-wider">{restaurantName}</div>
          <div className="text-[10px] text-gray-700">RUT: {restaurantRut}</div>
          <div className="text-[10px] text-gray-700">{restaurantAddress}</div>
          <div className="text-[10px] text-gray-700">{formatDateTime(order.createdAt)}</div>
        </div>

        {/* Separador discontinuo */}
        <div className="border-b border-dashed border-black my-2" />

        {/* Número de Comanda y Modalidad */}
        <div className="text-center my-2">
          <div className="text-[11px] font-bold uppercase tracking-widest text-gray-800">
            {isKitchenCopy ? '*** COMANDA DE COCINA ***' : '*** TICKET DE CLIENTE ***'}
          </div>
          <div className="text-2xl font-black my-1">
            PEDIDO #{order.orderNumber}
          </div>
          <div className="inline-block bg-black text-white px-2 py-0.5 rounded text-[11px] font-bold">
            {orderTypeLabels[order.orderType] || order.orderType}
          </div>
        </div>

        {/* Separador discontinuo */}
        <div className="border-b border-dashed border-black my-2" />

        {/* Datos del Cliente */}
        <div className="space-y-0.5 text-[11px]">
          <div>
            <span className="font-bold">Cliente: </span>
            <span className="uppercase">{order.customer?.name || 'Cliente Mostrador'}</span>
          </div>
          {order.customer?.phone && (
            <div>
              <span className="font-bold">Teléfono: </span>
              <span>{formatPhoneNumber(order.customer.phone)}</span>
            </div>
          )}
          {order.customer?.rut && (
            <div>
              <span className="font-bold">RUT: </span>
              <span>{formatRut(order.customer.rut)}</span>
            </div>
          )}

          {/* Dirección en caso de Delivery */}
          {order.orderType === 'DELIVERY' && order.address && (
            <div className="pt-1">
              <div className="font-bold">Dirección de Entrega:</div>
              <div className="font-semibold uppercase">
                {order.address.street} #{order.address.number}
                {order.address.apartment ? `, Depto ${order.address.apartment}` : ''}
              </div>
              <div className="text-[10px]">{order.address.city}</div>
              {order.address.reference && (
                <div className="text-[10px] italic bg-gray-100 p-1 mt-0.5 border border-dashed border-gray-300">
                  Ref: {order.address.reference}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Nota general / Observación del pedido */}
        {order.notes && (
          <div className="my-2 p-1 border-2 border-black bg-gray-50 text-[11px]">
            <div className="font-black uppercase text-[10px]">⚠️ NOTA DEL PEDIDO:</div>
            <div className="font-semibold">{order.notes}</div>
          </div>
        )}

        {/* Separador discontinuo */}
        <div className="border-b border-dashed border-black my-2" />

        {/* Encabezado de Productos */}
        <table className="w-full text-left text-[11px] border-collapse">
          <thead>
            <tr className="border-b border-black">
              <th className="py-1 w-[12%] text-center">CANT</th>
              <th className="py-1 w-[60%]">DESCRIPCIÓN</th>
              <th className="py-1 w-[28%] text-right">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <React.Fragment key={item.id || idx}>
                <tr className="align-top">
                  <td className="py-1 text-center font-black text-[13px]">{item.quantity}x</td>
                  <td className="py-1 font-bold">
                    <div className="text-[12px] uppercase leading-tight">{item.productName}</div>
                    {item.notes && (
                      <div className="text-[10px] font-semibold text-gray-800 italic mt-0.5 pl-1 border-l-2 border-black">
                        MOD: {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="py-1 text-right font-semibold whitespace-nowrap">
                    {formatCurrency(item.subtotal)}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {/* Separador discontinuo */}
        <div className="border-b border-dashed border-black my-2" />

        {/* Desglose de Totales */}
        <div className="space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>

          {Number(order.deliveryFee) > 0 && (
            <div className="flex justify-between">
              <span>ENVÍO DELIVERY:</span>
              <span>{formatCurrency(order.deliveryFee)}</span>
            </div>
          )}

          {Number(order.discount) > 0 && (
            <div className="flex justify-between font-bold">
              <span>DESCUENTO:</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}

          <div className="border-b border-black my-1" />

          <div className="flex justify-between text-base font-black">
            <span>TOTAL:</span>
            <span>{formatCurrency(order.total)}</span>
          </div>
        </div>

        {/* Datos de Pago */}
        <div className="mt-2 pt-1 border-t border-dashed border-black text-[10px]">
          <div className="flex justify-between">
            <span className="font-bold">FORMA DE PAGO:</span>
            <span className="font-semibold">{paymentMethodLabels[order.paymentMethod] || order.paymentMethod}</span>
          </div>
          <div className="flex justify-between mt-0.5">
            <span className="font-bold">ESTADO PAGO:</span>
            <span className={`font-black ${order.paymentStatus === 'PAID' ? 'text-black' : 'underline'}`}>
              {order.paymentStatus === 'PAID' ? 'PAGADO' : 'PENDIENTE DE COBRO'}
            </span>
          </div>
        </div>

        {/* Pie de ticket y corte */}
        <div className="text-center mt-3 pt-2 text-[10px] space-y-1">
          <div className="font-bold">¡MUCHAS GRACIAS POR SU COMPRA!</div>
          <div className="text-gray-500">FastFood SaaS System</div>
          <div className="text-gray-400 tracking-widest text-[9px] pt-1">
            - - - - - - - - - CORTE AQUÍ - - - - - - - - -
          </div>
        </div>
      </div>
    </div>
  );
};
