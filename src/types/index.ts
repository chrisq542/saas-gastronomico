export type OrderType = 'DELIVERY' | 'PICKUP' | 'DINE_IN';
export type OrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type PaymentMethod = 'CASH' | 'CARD_ON_DELIVERY' | 'TRANSFER' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'REFUNDED';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  rut?: string | null;
  notes?: string | null;
  createdAt?: string | Date;
}

export interface Address {
  id: string;
  customerId: string;
  street: string;
  number: string;
  apartment?: string | null;
  city: string;
  reference?: string | null;
  isDefault: boolean;
  createdAt?: string | Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sortOrder: number;
  isActive: boolean;
  products?: Product[];
}

export interface Product {
  id: string;
  categoryId: string;
  name: string;
  description?: string | null;
  price: number;
  imageUrl?: string | null;
  isAvailable: boolean;
  preparationTime?: number | null;
}

export interface OrderItem {
  id?: string;
  orderId?: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  notes?: string | null;
}

export interface Order {
  id: string;
  orderNumber: number;
  customerId: string;
  addressId?: string | null;
  orderType: OrderType;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;
  notes?: string | null;
  kitchenNotes?: string | null;
  createdAt: string | Date;
  updatedAt?: string | Date;
  customer?: Customer;
  address?: Address | null;
  items: OrderItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}
