'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, CartItem } from '@/types';

const CART_STORAGE_KEY = 'varellion_local_cart_v1';

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  totalItems: number;
  subtotal: number;
  toastMessage: string | null;
  addItem: (product: Product, quantity?: number, selectedColor?: string) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  clearToast: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // 1. Initial Client Mount: Safe load from localStorage to avoid SSR Hydration Mismatch
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (err) {
      console.warn('[CartContext] Failed to load local cart from storage:', err);
    } finally {
      setIsMounted(true);
    }
  }, []);

  // 2. Persist to localStorage on change (Client-side only)
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('[CartContext] Failed to save cart to local storage:', err);
    }
  }, [items, isMounted]);

  // Toast Auto-dismiss
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      setToastMessage(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  const clearToast = useCallback(() => {
    setToastMessage(null);
  }, []);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  /**
   * Add Item to Cart
   * Identifies unique line items by product ID and selected option/color
   */
  const addItem = useCallback(
    (product: Product, quantity: number = 1, selectedColor?: string) => {
      if (quantity <= 0) return;

      const lineItemId = `${product.productId}__${selectedColor || 'default'}`;
      const maxStock = product.availableStock > 0 ? product.availableStock : 1;

      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.cartItemId === lineItemId);

        if (existingIndex > -1) {
          const currentItem = prevItems[existingIndex];
          const newQuantity = Math.min(currentItem.quantity + quantity, maxStock);

          const updated = [...prevItems];
          updated[existingIndex] = {
            ...currentItem,
            quantity: newQuantity,
          };
          return updated;
        }

        const initialQuantity = Math.min(quantity, maxStock);
        const newItem: CartItem = {
          cartItemId: lineItemId,
          productId: product.productId,
          product,
          quantity: initialQuantity,
          selectedColor,
          addedAt: new Date().toISOString(),
        };

        return [newItem, ...prevItems];
      });

      // Show accessible toast notification (User decision in Grill-Me: Do NOT auto-open drawer)
      setToastMessage(`تمت إضافة "${product.nameAr}" إلى سلة المشتريات`);
    },
    []
  );

  /**
   * Update Quantity
   * Clamps between 1 and available stock
   */
  const updateQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      // Remove if reduced to 0
      setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
      return;
    }

    setItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId !== cartItemId) return item;
        const maxStock = item.product.availableStock > 0 ? item.product.availableStock : 99;
        const clampedQuantity = Math.min(newQuantity, maxStock);
        return {
          ...item,
          quantity: clampedQuantity,
        };
      })
    );
  }, []);

  /**
   * Remove item from cart
   */
  const removeItem = useCallback((cartItemId: string) => {
    setItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  /**
   * Clear all items
   */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  // Computed values
  const totalItems = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((acc, item) => acc + item.product.price * item.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isCartOpen,
      totalItems,
      subtotal,
      toastMessage,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      clearToast,
    }),
    [
      items,
      isCartOpen,
      totalItems,
      subtotal,
      toastMessage,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      clearToast,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
