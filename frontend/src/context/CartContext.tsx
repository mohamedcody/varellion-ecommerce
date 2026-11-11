'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Product, CartItem } from '@/types';
import { useAuth } from './AuthContext';
import { cartService, mapBackendItemToCartItem } from '@/services/cart';

const CART_STORAGE_KEY = 'varellion_local_cart_v1';

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  totalItems: number;
  subtotal: number;
  toastMessage: string | null;
  addItem: (product: Product, quantity?: number) => void;
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
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Keep a reference to current items for rollbacks during optimistic failures
  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;

  // Track previous auth state to detect login / logout transitions
  const prevAuthRef = useRef<boolean | null>(null);

  // Sync / hydrate cart on mount and when authentication status transitions
  useEffect(() => {
    let isCancelled = false;

    async function syncCart() {
      if (isAuthLoading) return;

      const wasAuthenticated = prevAuthRef.current;
      const nowAuthenticated = isAuthenticated;
      prevAuthRef.current = nowAuthenticated;

      // 1. Initial Mount for Guest: Read from LocalStorage
      if (!nowAuthenticated) {
        if (wasAuthenticated === true) {
          // Transition: LOGOUT -> Clean Slate
          setItems([]);
          try {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
          } catch (err) {
            console.warn('[CartContext] Failed to clear local storage on logout:', err);
          }
        } else {
          // Initial guest load or already guest
          try {
            const stored = localStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && !isCancelled) {
                setItems(parsed);
              }
            }
          } catch (err) {
            console.warn('[CartContext] Failed to load local cart:', err);
          }
        }
        if (!isCancelled) setIsMounted(true);
        return;
      }

      // 2. User is Authenticated: Check for Guest Cart to Merge or Fetch from Backend
      try {
        let guestItems: CartItem[] = [];
        try {
          const stored = localStorage.getItem(CART_STORAGE_KEY);
          if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              guestItems = parsed;
            }
          }
        } catch {
          guestItems = [];
        }

        if (guestItems.length > 0) {
          // Merge guest items with user account cart in DB
          const payload = guestItems.map((gi) => ({
            productId: gi.productId,
            quantity: gi.quantity,
          }));

          const res = await cartService.mergeCart(payload);
          if (!isCancelled) {
            const mapped = res.items.map(mapBackendItemToCartItem);
            setItems(mapped);
            // Clear local storage after successful merge
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
          }
        } else {
          // Fetch existing user cart from backend
          const res = await cartService.getCart();
          if (!isCancelled) {
            const mapped = res.items.map(mapBackendItemToCartItem);
            setItems(mapped);
          }
        }
      } catch (err) {
        console.warn('[CartContext] Failed to synchronize authenticated cart:', err);
      } finally {
        if (!isCancelled) {
          setIsMounted(true);
        }
      }
    }

    syncCart();

    return () => {
      isCancelled = true;
    };
  }, [isAuthenticated, isAuthLoading]);

  // Persist guest cart changes to localStorage (Client-side guest only)
  useEffect(() => {
    if (!isMounted || isAuthenticated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('[CartContext] Failed to save cart to local storage:', err);
    }
  }, [items, isMounted, isAuthenticated]);

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
   * Uses Optimistic UI for authenticated users and persists to LocalStorage for guests.
   */
  const addItem = useCallback(
    (product: Product, quantity: number = 1) => {
      if (quantity <= 0) return;

      const previousItems = itemsRef.current;
      const lineItemId = product.productId;
      const maxStock = product.availableStock > 0 ? product.availableStock : 1;

      // Optimistic update
      setItems((prevItems) => {
        const existingIndex = prevItems.findIndex((item) => item.productId === product.productId);

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
          addedAt: new Date().toISOString(),
        };

        return [newItem, ...prevItems];
      });

      setToastMessage(`تمت إضافة "${product.nameAr}" إلى سلة المشتريات`);

      // Backend sync if user is authenticated
      if (isAuthenticated) {
        cartService
          .addItem(product.productId, quantity)
          .then((backendCart) => {
            setItems(backendCart.items.map(mapBackendItemToCartItem));
          })
          .catch((err) => {
            console.error('[CartContext] Failed to add item to backend cart:', err);
            setItems(previousItems);
            setToastMessage('حدث خطأ أثناء إضافة المنتج إلى السلة، يرجى المحاولة مرة أخرى');
          });
      }
    },
    [isAuthenticated]
  );

  /**
   * Update Quantity
   * Uses Optimistic UI for authenticated users.
   */
  const updateQuantity = useCallback(
    (cartItemId: string, newQuantity: number) => {
      const previousItems = itemsRef.current;
      const targetItem = previousItems.find(
        (item) => item.cartItemId === cartItemId || item.productId === cartItemId
      );

      if (newQuantity <= 0) {
        // Remove item
        setItems((prev) =>
          prev.filter((item) => item.cartItemId !== cartItemId && item.productId !== cartItemId)
        );

        if (isAuthenticated && targetItem) {
          cartService
            .removeItem(targetItem.cartItemId)
            .then((backendCart) => {
              setItems(backendCart.items.map(mapBackendItemToCartItem));
            })
            .catch((err) => {
              console.error('[CartContext] Failed to remove item from backend:', err);
              setItems(previousItems);
              setToastMessage('فشل حذف المنتج، يرجى المحاولة مرة أخرى');
            });
        }
        return;
      }

      // Update quantity optimistically
      setItems((prev) =>
        prev.map((item) => {
          if (item.cartItemId !== cartItemId && item.productId !== cartItemId) return item;
          const maxStock = item.product.availableStock > 0 ? item.product.availableStock : 99;
          const clampedQuantity = Math.min(newQuantity, maxStock);
          return {
            ...item,
            quantity: clampedQuantity,
          };
        })
      );

      if (isAuthenticated && targetItem) {
        cartService
          .updateQuantity(targetItem.cartItemId, newQuantity)
          .then((backendCart) => {
            setItems(backendCart.items.map(mapBackendItemToCartItem));
          })
          .catch((err) => {
            console.error('[CartContext] Failed to update quantity on backend:', err);
            setItems(previousItems);
            setToastMessage('فشل تعديل الكمية، يرجى المحاولة مرة أخرى');
          });
      }
    },
    [isAuthenticated]
  );

  /**
   * Remove item from cart
   */
  const removeItem = useCallback(
    (cartItemId: string) => {
      const previousItems = itemsRef.current;
      const targetItem = previousItems.find(
        (item) => item.cartItemId === cartItemId || item.productId === cartItemId
      );

      setItems((prev) =>
        prev.filter((item) => item.cartItemId !== cartItemId && item.productId !== cartItemId)
      );

      if (isAuthenticated && targetItem) {
        cartService
          .removeItem(targetItem.cartItemId)
          .then((backendCart) => {
            setItems(backendCart.items.map(mapBackendItemToCartItem));
          })
          .catch((err) => {
            console.error('[CartContext] Failed to remove item from backend:', err);
            setItems(previousItems);
            setToastMessage('فشل حذف المنتج، يرجى المحاولة مرة أخرى');
          });
      }
    },
    [isAuthenticated]
  );

  /**
   * Clear all cart items
   */
  const clearCart = useCallback(() => {
    const previousItems = itemsRef.current;
    setItems([]);

    if (isAuthenticated) {
      cartService.clearCart().catch((err) => {
        console.error('[CartContext] Failed to clear cart on backend:', err);
        setItems(previousItems);
        setToastMessage('فشل تفريغ السلة، يرجى المحاولة مرة أخرى');
      });
    } else {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]));
      } catch (err) {
        console.warn('[CartContext] Failed to clear local storage:', err);
      }
    }
  }, [isAuthenticated]);

  /**
   * Total items count
   */
  const totalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  /**
   * Subtotal in EGP
   */
  const subtotal = useMemo(() => {
    return items.reduce((acc, item) => acc + (item.product.price || 0) * item.quantity, 0);
  }, [items]);

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
