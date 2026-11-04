import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { CartProvider, useCart } from '../CartContext';
import { cartService } from '@/services/cart';
import { Product } from '@/types';

// Mock AuthContext
let mockAuthState = {
  user: null as { email: string; username: string; role: string } | null,
  isAuthenticated: false,
  isLoading: false,
};

vi.mock('../AuthContext', () => ({
  useAuth: () => mockAuthState,
}));

vi.mock('@/services/cart', () => ({
  cartService: {
    getCart: vi.fn(),
    addItem: vi.fn(),
    updateQuantity: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
    mergeCart: vi.fn(),
  },
  mapBackendItemToCartItem: vi.fn((item) => ({
    cartItemId: item.cartItemId,
    productId: item.productId,
    quantity: item.quantity,
    addedAt: item.addedAt || '2026-10-31T00:00:00Z',
    product: {
      productId: item.productId,
      categoryId: 'cat-1',
      slug: 'item',
      sku: 'SKU1',
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: '',
      descriptionEn: '',
      price: item.price,
      stockQuantity: 10,
      reservedQuantity: 0,
      availableStock: 10,
      isActive: true,
      images: [],
    },
  })),
}));

const mockProduct: Product = {
  productId: 'prod-123',
  categoryId: 'cat-1',
  slug: 'test-product',
  sku: 'TEST-SKU',
  nameAr: 'منتج تجريبي',
  nameEn: 'Test Product',
  descriptionAr: '',
  descriptionEn: '',
  price: 500,
  stockQuantity: 10,
  reservedQuantity: 0,
  availableStock: 10,
  isActive: true,
  images: [],
};

function TestComponent() {
  const { items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal } = useCart();
  return (
    <div>
      <div data-testid="total-items">{totalItems}</div>
      <div data-testid="subtotal">{subtotal}</div>
      <div data-testid="items-count">{items.length}</div>
      <ul data-testid="cart-list">
        {items.map((item) => (
          <li key={item.cartItemId} data-testid={`item-${item.productId}`}>
            {item.product.nameAr} - Qty: {item.quantity}
          </li>
        ))}
      </ul>
      <button data-testid="add-btn" onClick={() => addItem(mockProduct, 2)}>
        Add
      </button>
      <button data-testid="clear-btn" onClick={() => clearCart()}>
        Clear
      </button>
    </div>
  );
}

describe('CartContext Account Isolation & Sync', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('maintains guest cart in localStorage when unauthenticated', async () => {
    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await act(async () => {
      screen.getByTestId('add-btn').click();
    });

    expect(screen.getByTestId('total-items').textContent).toBe('2');
    const stored = JSON.parse(localStorage.getItem('varellion_local_cart_v1') || '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0].productId).toBe('prod-123');
    expect(stored[0].quantity).toBe(2);
  });

  it('auto-merges guest localStorage items into backend cart on login and clears localStorage', async () => {
    // 1. Pre-populate localStorage with guest items
    localStorage.setItem(
      'varellion_local_cart_v1',
      JSON.stringify([
        {
          cartItemId: 'prod-123',
          productId: 'prod-123',
          quantity: 2,
          addedAt: '2026-10-31T00:00:00Z',
          product: mockProduct,
        },
      ])
    );

    // Mock mergeCart response from backend
    (cartService.mergeCart as any).mockResolvedValueOnce({
      cartId: 'cart-backend-1',
      customerId: 'cust-1',
      items: [
        {
          cartItemId: 'item-db-1',
          productId: 'prod-123',
          nameAr: 'منتج تجريبي',
          nameEn: 'Test Product',
          sku: 'TEST-SKU',
          price: 500,
          quantity: 2,
          availableStock: 10,
          subtotal: 1000,
        },
      ],
      totalItems: 2,
      subtotal: 1000,
      freeShippingThreshold: 2500,
      amountForFreeShipping: 1500,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    });

    // 2. User logs in
    mockAuthState = {
      user: { email: 'user@varellion.com', username: 'user1', role: 'USER' },
      isAuthenticated: true,
      isLoading: false,
    };

    render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(cartService.mergeCart).toHaveBeenCalledWith([
        { productId: 'prod-123', quantity: 2 },
      ]);
    });

    // LocalStorage must be cleared after merge
    await waitFor(() => {
      const stored = localStorage.getItem('varellion_local_cart_v1');
      expect(stored).toBe('[]');
    });
  });

  it('resets cart state on logout (Clean Slate) preventing data leak between accounts', async () => {
    (cartService.getCart as any).mockResolvedValueOnce({
      cartId: 'cart-user-1',
      customerId: 'cust-1',
      items: [
        {
          cartItemId: 'item-db-1',
          productId: 'prod-123',
          nameAr: 'منتج تجريبي',
          nameEn: 'Test Product',
          sku: 'TEST-SKU',
          price: 500,
          quantity: 3,
          availableStock: 10,
          subtotal: 1500,
        },
      ],
      totalItems: 3,
      subtotal: 1500,
      freeShippingThreshold: 2500,
      amountForFreeShipping: 1000,
      createdAt: '2026-10-31T00:00:00Z',
      updatedAt: '2026-10-31T00:00:00Z',
    });

    mockAuthState = {
      user: { email: 'user1@varellion.com', username: 'user1', role: 'USER' },
      isAuthenticated: true,
      isLoading: false,
    };

    const { rerender } = render(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('3');
    });

    // User logs out
    mockAuthState = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    };

    rerender(
      <CartProvider>
        <TestComponent />
      </CartProvider>
    );

    // Cart must be completely empty on logout
    await waitFor(() => {
      expect(screen.getByTestId('total-items').textContent).toBe('0');
      expect(screen.getByTestId('items-count').textContent).toBe('0');
    });
  });
});
