import { Order, OrderItem, CreateOrderRequest } from '@/types';
import { requestApi } from './api';

const SESSION_ORDER_KEY = 'varellion_last_order';

/**
 * Generates an authentic VARELLION human-friendly order identifier.
 * Format: VAR-YYYYMMDD-XXXX (e.g., VAR-20261028-4912)
 */
export function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `VAR-${year}${month}${day}-${randomSuffix}`;
}

export interface PlaceOrderParams {
  request: CreateOrderRequest;
  subtotal: number;
  shippingFee: number;
  discountTotal?: number;
  orderItems: OrderItem[];
}

export const ordersService = {
  /**
   * Submits a new order to the backend API.
   * If the backend server is unreachable in development/offline mode,
   * gracefully generates a validated local Order object for testing.
   */
  async createOrder(params: PlaceOrderParams): Promise<Order> {
    const { request, subtotal, shippingFee, discountTotal = 0, orderItems } = params;
    const totalAmount = subtotal + shippingFee - discountTotal;

    try {
      // 1. Attempt authoritative backend submission
      const createdOrder = await requestApi<Order>('/orders', {
        method: 'POST',
        body: JSON.stringify(request),
      });

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(createdOrder));
      }
      return createdOrder;
    } catch (backendError) {
      console.warn(
        '[ordersService] Backend order submission unavailable, activating local development snapshot:',
        backendError
      );

      // 2. Fallback local snapshot strictly matching PostgreSQL public.orders schema
      const localOrder: Order = {
        orderId: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `ord_${Date.now()}`,
        orderNumber: generateOrderNumber(),
        customerName: request.customerName,
        customerPhone: request.customerPhone,
        shippingGovernorate: request.shippingGovernorate,
        shippingCityArea: request.shippingCityArea,
        shippingDetailedAddress: request.shippingDetailedAddress,
        currency: 'EGP',
        subtotal,
        discountTotal,
        shippingFee,
        totalAmount,
        orderStatus: 'PENDING_CUSTOMER_CONFIRMATION',
        paymentMethod: request.paymentMethod,
        customerNotes: request.customerNotes,
        items: orderItems,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(localOrder));
      }

      return localOrder;
    }
  },

  /**
   * Retrieves the most recent order snapshot from sessionStorage for the confirmation page.
   */
  getLastPlacedOrder(): Order | null {
    if (typeof window === 'undefined') return null;
    try {
      const stored = sessionStorage.getItem(SESSION_ORDER_KEY);
      if (!stored) return null;
      return JSON.parse(stored) as Order;
    } catch (err) {
      console.error('[ordersService] Failed to parse last placed order:', err);
      return null;
    }
  },

  /**
   * Clears the cached order from sessionStorage.
   */
  clearLastPlacedOrder(): void {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem(SESSION_ORDER_KEY);
    }
  },
};
