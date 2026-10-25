'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product } from '@/types';

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, notes?: string) => void;
  removeItem: (productId: string, notes?: string) => void;
  updateQuantity: (productId: string, quantity: number, notes?: string) => void;
  updateNotes: (productId: string, notes: string) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Cargar carrito desde localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('fastfood_cart');
      if (saved) {
        setItems(JSON.parse(saved));
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

  const addItem = (product: Product, quantity: number = 1, notes: string = '') => {
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

      const normalizedNotes = notes.trim();
      const existingIndex = baseItems.findIndex(
        (i) => i.product.id === product.id && (i.notes || '') === normalizedNotes
      );
      if (existingIndex > -1) {
        const next = [...baseItems];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }
      return [...baseItems, { product, quantity, notes: normalizedNotes }];
    });
  };

  const removeItem = (productId: string, notes?: string) => {
    setItems((prev) =>
      prev.filter((i) =>
        notes !== undefined
          ? !(i.product.id === productId && (i.notes || '') === notes)
          : i.product.id !== productId
      )
    );
  };

  const updateQuantity = (productId: string, quantity: number, notes?: string) => {
    if (quantity <= 0) {
      removeItem(productId, notes);
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        const matches =
          notes !== undefined
            ? i.product.id === productId && (i.notes || '') === notes
            : i.product.id === productId;
        return matches ? { ...i, quantity } : i;
      })
    );
  };

  const updateNotes = (productId: string, notes: string) => {
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, notes } : i))
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce(
    (acc, curr) => acc + Number(curr.product.price) * curr.quantity,
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
