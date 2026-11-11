import { requestApi } from './api';
import { ApiResponse, CartItem } from '@/types';

export interface BackendCartItemDto {
  cartItemId: string;
  productId: string;
  nameAr: string;
  nameEn: string;
  sku: string;
  price: number;
  imageUrl?: string;
  quantity: number;
  availableStock: number;
  subtotal: number;
  addedAt?: string;
}

export interface BackendCartDto {
  cartId: string;
  customerId: string;
  items: BackendCartItemDto[];
  totalItems: number;
  subtotal: number;
  freeShippingThreshold: number;
  amountForFreeShipping: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartPayload {
  productId: string;
  quantity: number;
}

export interface MergeCartPayload {
  items: AddToCartPayload[];
}

/**
 * Maps a backend CartItemDto into the unified frontend CartItem entity.
 */
export function mapBackendItemToCartItem(item: BackendCartItemDto): CartItem {
  return {
    cartItemId: item.cartItemId,
    productId: item.productId,
    quantity: item.quantity,
    addedAt: item.addedAt || new Date().toISOString(),
    product: {
      productId: item.productId,
      categoryId: '',
      slug: item.sku || item.productId,
      sku: item.sku || '',
      nameAr: item.nameAr,
      nameEn: item.nameEn,
      descriptionAr: '',
      descriptionEn: '',
      price: item.price,
      stockQuantity: item.availableStock,
      reservedQuantity: 0,
      availableStock: item.availableStock,
      isActive: true,
      images: item.imageUrl
        ? [
            {
              imageId: 'main',
              productId: item.productId,
              imageUrl: item.imageUrl,
              isMain: true,
              displayOrder: 0,
            },
          ]
        : [],
    },
  };
}

/**
 * Cart Service Layer communicating with Spring Boot `/api/cart`
 */
export const cartService = {
  /**
   * Retrieves active cart for the authenticated customer
   */
  async getCart(): Promise<BackendCartDto> {
    const res = await requestApi<ApiResponse<BackendCartDto>>('/cart');
    return res.data;
  },

  /**
   * Adds an item to the authenticated customer's cart
   */
  async addItem(productId: string, quantity: number = 1): Promise<BackendCartDto> {
    const res = await requestApi<ApiResponse<BackendCartDto>>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ productId, quantity }),
    });
    return res.data;
  },

  /**
   * Updates an item's quantity in the customer's cart
   */
  async updateQuantity(cartItemId: string, quantity: number): Promise<BackendCartDto> {
    const res = await requestApi<ApiResponse<BackendCartDto>>(`/cart/items/${cartItemId}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
    return res.data;
  },

  /**
   * Deletes an item from the customer's cart
   */
  async removeItem(cartItemId: string): Promise<BackendCartDto> {
    const res = await requestApi<ApiResponse<BackendCartDto>>(`/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });
    return res.data;
  },

  /**
   * Clears the customer's cart completely
   */
  async clearCart(): Promise<void> {
    await requestApi<ApiResponse<void>>('/cart', {
      method: 'DELETE',
    });
  },

  /**
   * Batch merges guest items into the customer's cart on login
   */
  async mergeCart(items: AddToCartPayload[]): Promise<BackendCartDto> {
    const res = await requestApi<ApiResponse<BackendCartDto>>('/cart/merge', {
      method: 'POST',
      body: JSON.stringify({ items }),
    });
    return res.data;
  },
};
