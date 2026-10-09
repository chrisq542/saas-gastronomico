export const ORDER_STATUS = {
  PENDING: 'PENDING',
  PREPARING: 'PREPARING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;

export type OrderStatusType = (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_CONFIG: Record<
  OrderStatusType,
  { label: string; badgeClass: string }
> = {
  PENDING: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
  },
  PREPARING: {
    label: 'En Preparación',
    badgeClass: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
  },
  READY: {
    label: 'Listo',
    badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
  },
  DELIVERED: {
    label: 'Entregado',
    badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
  },
  CANCELLED: {
    label: 'Cancelado',
    badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
  },
};

export const DELIVERY_TYPE = {
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP',
  DINE_IN: 'DINE_IN',
} as const;

export type DeliveryType = (typeof DELIVERY_TYPE)[keyof typeof DELIVERY_TYPE];

export const DELIVERY_TYPE_LABELS: Record<DeliveryType, string> = {
  DELIVERY: 'Delivery',
  PICKUP: 'Retiro en Tienda',
  DINE_IN: 'Consumo en Local',
};

export const PAYMENT_METHOD = {
  CASH: 'CASH',
  CARD_ON_DELIVERY: 'CARD_ON_DELIVERY',
  TRANSFER: 'TRANSFER',
  ONLINE: 'ONLINE',
} as const;

export type PaymentMethodType = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethodType, string> = {
  CASH: 'Efectivo',
  CARD_ON_DELIVERY: 'Tarjeta al Entregar',
  TRANSFER: 'Transferencia',
  ONLINE: 'Pago Online',
};
