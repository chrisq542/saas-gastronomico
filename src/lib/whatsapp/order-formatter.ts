import { Order } from '@/types';
import { cleanPhoneNumber, formatCurrency, formatDateTime, formatRut } from '@/lib/utils/formatters';

interface WhatsAppUrlOptions {
  order: Order;
  recipientPhone?: string; // Si no se provee, usa NEXT_PUBLIC_RESTAURANT_WHATSAPP
  restaurantName?: string;
}

/**
 * Traduce el tipo de pedido a un formato amigable para WhatsApp
 */
function translateOrderType(type: string): string {
  switch (type) {
    case 'DELIVERY':
      return '🛵 Delivery a Domicilio';
    case 'PICKUP':
      return '🥡 Retiro en Local';
    case 'DINE_IN':
      return '🍽️ Consumo en Mesa';
    default:
      return type;
  }
}

/**
 * Traduce el método de pago a formato legible
 */
function translatePaymentMethod(method: string): string {
  switch (method) {
    case 'CASH':
      return '💵 Efectivo';
    case 'CARD_ON_DELIVERY':
      return '💳 Tarjeta al recibir (POS)';
    case 'TRANSFER':
      return '🏦 Transferencia Bancaria';
    case 'ONLINE':
      return '🌐 Pago Online (Webpay/MercadoPago)';
    default:
      return method;
  }
}

/**
 * Convierte un pedido completo en un texto estructurado optimizado con formato WhatsApp (negritas, cursivas y emojis)
 */
export function formatOrderToWhatsAppMessage(order: Order, customRestaurantName?: string): string {
  const restaurant = customRestaurantName || process.env.NEXT_PUBLIC_RESTAURANT_NAME || 'Restaurante FastFood';
  
  const customerName = order.customer?.name || 'Cliente';
  const customerPhone = order.customer?.phone || '';
  const customerRut = order.customer?.rut ? formatRut(order.customer.rut) : null;

  // Encabezado
  let msg = `🍔 *¡NUEVO PEDIDO #${order.orderNumber}!* 🍔\n`;
  msg += `🏪 *${restaurant}*\n\n`;

  // Datos del cliente
  msg += `👤 *Cliente:* ${customerName}\n`;
  if (customerPhone) {
    msg += `📞 *Teléfono:* ${customerPhone}\n`;
  }
  if (customerRut) {
    msg += `🆔 *RUT:* ${customerRut}\n`;
  }
  msg += `📦 *Modalidad:* ${translateOrderType(order.orderType)}\n`;

  // Dirección si es delivery
  if (order.orderType === 'DELIVERY' && order.address) {
    const addr = order.address;
    const apt = addr.apartment ? ` Depto/Casa ${addr.apartment}` : '';
    msg += `📍 *Dirección:* ${addr.street} #${addr.number}${apt}, ${addr.city}\n`;
    if (addr.reference) {
      msg += `📝 *Referencia:* _${addr.reference}_\n`;
    }
  }

  msg += `\n━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 *DETALLE DEL PEDIDO:*\n`;

  // Lista de items
  order.items.forEach((item) => {
    msg += `• *${item.quantity}x* ${item.productName} — ${formatCurrency(item.subtotal)}\n`;
    if (item.notes && item.notes.trim().length > 0) {
      msg += `   └ _Nota: ${item.notes.trim()}_\n`;
    }
  });

  msg += `━━━━━━━━━━━━━━━━━━━━\n`;

  // Totales
  msg += `💵 *Subtotal:* ${formatCurrency(order.subtotal)}\n`;
  if (Number(order.deliveryFee) > 0) {
    msg += `🛵 *Costo de Envío:* ${formatCurrency(order.deliveryFee)}\n`;
  }
  if (Number(order.discount) > 0) {
    msg += `🏷️ *Descuento:* -${formatCurrency(order.discount)}\n`;
  }
  msg += `💰 *TOTAL A PAGAR:* *${formatCurrency(order.total)}*\n\n`;

  // Método de pago
  msg += `💳 *Método de Pago:* ${translatePaymentMethod(order.paymentMethod)}\n`;
  msg += `⚡ *Estado del Pago:* ${order.paymentStatus === 'PAID' ? '✅ PAGADO' : '⏳ PENDIENTE'}\n`;

  // Comentarios o notas generales
  if (order.notes && order.notes.trim().length > 0) {
    msg += `💬 *Instrucciones especiales:* _${order.notes.trim()}_\n`;
  }

  // Fecha y hora
  msg += `🕒 *Fecha:* ${formatDateTime(order.createdAt)}\n\n`;
  msg += `🙏 _¡Gracias por tu preferencia! Confirmaremos tu pedido a la brevedad._`;

  return msg;
}

/**
 * Genera el enlace directo wa.me/<telefono>?text=...
 */
export function generateOrderWhatsAppUrl(options: WhatsAppUrlOptions): string {
  const { order, recipientPhone, restaurantName } = options;

  // Teléfono de destino (por defecto el WhatsApp oficial del restaurante)
  const targetPhone = cleanPhoneNumber(
    recipientPhone || process.env.NEXT_PUBLIC_RESTAURANT_WHATSAPP || ''
  );

  const rawMessage = formatOrderToWhatsAppMessage(order, restaurantName);
  const encodedMessage = encodeURIComponent(rawMessage);

  return `https://wa.me/${targetPhone}?text=${encodedMessage}`;
}

/**
 * Genera mensaje de actualización de estado para el cliente desde el KDS/Admin
 */
export function generateCustomerStatusWhatsAppUrl(order: Order, newStatus: string): string {
  if (!order.customer?.phone) return '';

  const cleanPhone = cleanPhoneNumber(order.customer.phone);
  let statusMessage = '';

  switch (newStatus) {
    case 'PREPARING':
      statusMessage = `👨‍🍳 ¡Hola ${order.customer.name}! Tu pedido *#${order.orderNumber}* ya está *en preparación* en nuestra cocina. Te avisaremos cuando salga. 🔥`;
      break;
    case 'READY':
      statusMessage = order.orderType === 'DELIVERY'
        ? `🛵 ¡Hola ${order.customer.name}! Tu pedido *#${order.orderNumber}* ya está *listo y va en camino* con nuestro repartidor.`
        : `🛍️ ¡Hola ${order.customer.name}! Tu pedido *#${order.orderNumber}* ya está *listo para retiro* en el mesón del local.`;
      break;
    case 'DELIVERED':
      statusMessage = `🎉 ¡Hola ${order.customer.name}! Tu pedido *#${order.orderNumber}* ha sido entregado. ¡Que lo disfrutes mucho! Recuerda calificarnos. ⭐⭐⭐⭐⭐`;
      break;
    default:
      statusMessage = `ℹ️ Hola ${order.customer.name}, tu pedido #${order.orderNumber} ha sido actualizado a estado: ${newStatus}.`;
  }

  const encoded = encodeURIComponent(statusMessage);
  return `https://wa.me/${cleanPhone}?text=${encoded}`;
}
