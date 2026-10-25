'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, SelectedProductOption } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    notes?: string,
    selectedOptions?: SelectedProductOption[]
  ) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  updateNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function generateCartItemId(
  productId: string,
  selectedOptions?: SelectedProductOption[],
  notes?: string
): string {
  const optionsKey = (selectedOptions || [])
    .map((o) => `${o.id}:${o.price}`)
    .sort()
    .join('|');
  return `${productId}__${optionsKey}__${notes || ''}`;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fastfood_cart');
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = parsed.map((it: CartItem) => {
          const optionsPrice = (it.selectedOptions || []).reduce(
            (sum, o) => sum + Number(o.price || 0),
            0
          );
          const unitPrice = it.unitPrice ?? (Number(it.product.price) + optionsPrice);
          const cartItemId = it.cartItemId || generateCartItemId(it.product.id, it.selectedOptions, it.notes);
          return {
            ...it,
            cartItemId,
            unitPrice,
          };
        });
        setItems(normalized);
      }
    } catch (e) {
      console.error('Error loading cart from storage', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Guardar carrito en localStorage SOLO después de haber cargado el estado inicial
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem('fastfood_cart', JSON.stringify(items));
    } catch (e) {
      console.error('Error saving cart to storage', e);
    }
  }, [items, isHydrated]);

  const addItem = (
    product: Product,
    quantity: number = 1,
    notes: string = '',
    selectedOptions: SelectedProductOption[] = []
  ) => {
    const optionsPrice = (selectedOptions || []).reduce(
      (sum, o) => sum + Number(o.price || 0),
      0
    );
    const unitPrice = Number(product.price) + optionsPrice;
    const cartItemId = generateCartItemId(product.id, selectedOptions, notes);

    setItems((prev) => {
      // Aislamiento Multi-Tenant del carrito: si el producto pertenece a otro restaurante distinto,
      // reiniciar el carrito automáticamente para nunca mezclar productos de diferentes tiendas.
      const incomingRestaurantId = (product as any).restaurantId;
      const existingRestaurantId =
        prev.length > 0 ? (prev[0].product as any).restaurantId : null;

      const baseItems =
        incomingRestaurantId &&
        existingRestaurantId &&
        incomingRestaurantId !== existingRestaurantId
          ? []
          : prev;

      const existingIndex = baseItems.findIndex((i) => (i.cartItemId || i.product.id) === cartItemId);
      if (existingIndex > -1) {
        const next = [...baseItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [
        ...baseItems,
        {
          cartItemId,
          product,
          quantity,
          notes,
          selectedOptions,
          unitPrice,
        },
      ];
    });
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((i) => (i.cartItemId || i.product.id) !== itemId));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((i) => ((i.cartItemId || i.product.id) === itemId ? { ...i, quantity } : i))
    );
  };

  const updateNotes = (itemId: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => ((i.cartItemId || i.product.id) === itemId ? { ...i, notes } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce(
    (acc, curr) => acc + (curr.unitPrice ?? Number(curr.product.price)) * curr.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateNotes,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
