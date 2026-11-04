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

/**
 * Normalizes Egyptian phone numbers into an 11-digit standard string (01XXXXXXXXX).
 * Handles +20, 0020, 20 prefixes, spaces, and hyphens.
 */
export function normalizeEgyptianPhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0020')) {
    digits = '0' + digits.substring(4);
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = '0' + digits.substring(2);
  } else if (!digits.startsWith('0') && digits.length === 10 && ['10', '11', '12', '15'].some((p) => digits.startsWith(p))) {
    digits = '0' + digits;
  }
  return digits;
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
   * Submits a new authoritative order to the backend API.
   * Throws ApiError or Error on failure so the UI surfaces real backend messages.
   * Caches authoritative order in sessionStorage with a guarded try/catch.
   */
  async createOrder(params: PlaceOrderParams): Promise<Order> {
    const { request } = params;

    const headers: Record<string, string> = {};
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      headers['Idempotency-Key'] = crypto.randomUUID();
    }

    const response = await requestApi<{ data?: Order } | Order>('/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(request),
    });

    const createdOrder = (response as { data?: Order }).data ?? (response as Order);

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(createdOrder));
      } catch (storageErr) {
        console.warn('[ordersService] Failed to cache order in sessionStorage:', storageErr);
      }
    }

    return createdOrder;
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
   * Tracks an existing order by orderNumber and verified customer phone.
   * Attempts live backend query first, then falls back to session snapshot and realistic dev fixtures.
   */
  async trackOrder(orderNumber: string, phone: string): Promise<Order | null> {
    const cleanNum = (orderNumber || '').trim();
    const cleanPhone = normalizeEgyptianPhone(phone);

    try {
      const response = await requestApi<{ data?: Order } | Order>(
        `/orders/track?orderNumber=${encodeURIComponent(cleanNum)}&phone=${encodeURIComponent(cleanPhone)}`,
        {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
          },
        }
      );
      const result = (response as { data?: Order }).data ?? (response as Order);
      if (typeof window !== 'undefined' && result) {
        const lastOrder = this.getLastPlacedOrder();
        if (lastOrder && lastOrder.orderNumber.toLowerCase() === cleanNum.toLowerCase()) {
          sessionStorage.setItem(SESSION_ORDER_KEY, JSON.stringify(result));
        }
      }
      return result;
    } catch {
      // Offline / Local development fallback
      if (typeof window !== 'undefined') {
        const lastOrder = this.getLastPlacedOrder();
        if (lastOrder) {
          const storedPhone = normalizeEgyptianPhone(lastOrder.customerPhone);
          if (
            lastOrder.orderNumber.toLowerCase() === cleanNum.toLowerCase() &&
            storedPhone === cleanPhone
          ) {
            return lastOrder;
          }
        }
      }

      // Demo/Fixture Order for testing if user enters test order number
      if (
        (cleanNum.toUpperCase() === 'VAR-DEMO-2026' ||
         cleanNum.toUpperCase() === 'VAR-20261028-0001' ||
         cleanNum.toUpperCase() === 'VAR-DEMO-DELIVERED' ||
         cleanNum.toUpperCase() === 'VAR-20261028-DELIVERED') &&
        (cleanPhone === '01012345678' || cleanPhone === '01000000000')
      ) {
        const isDeliveredDemo = cleanNum.toUpperCase().includes('DELIVERED');
        return {
          orderId: isDeliveredDemo ? 'demo-ord-delivered-001' : 'demo-ord-uuid-001',
          orderNumber: cleanNum.toUpperCase(),
          customerName: 'محمد أحمد علي',
          customerPhone: '01012345678',
          shippingGovernorate: 'القاهرة',
          shippingCityArea: 'المعادي',
          shippingDetailedAddress: 'شارع 9، برج الصفا، الدور الرابع، شقة 12',
          currency: 'EGP',
          subtotal: 3450,
          discountTotal: 0,
          shippingFee: 0,
          totalAmount: 3450,
          orderStatus: isDeliveredDemo ? 'DELIVERED' : 'SHIPPED',
          statusDisplayAr: isDeliveredDemo ? 'تم التسليم بنجاح' : 'مع مندوب التوصيل',
          statusDisplayEn: isDeliveredDemo ? 'Delivered' : 'Out for Delivery',
          paymentMethod: 'CASH_ON_DELIVERY',
          customerNotes: 'يرجى الاتصال قبل الوصول بـ 30 دقيقة.',
          items: [
            {
              orderItemId: 'item-demo-1',
              productId: 'prod-watch-1',
              productNameAr: 'ساعة فاريليون كلاسيك رويال أسود ملكي',
              productNameEn: 'Varellion Classic Royal Black Watch',
              productSku: 'VAR-W-01',
              unitPrice: 2850,
              quantity: 1,
              totalPrice: 2850,
            },
            {
              orderItemId: 'item-demo-2',
              productId: 'prod-wallet-1',
              productNameAr: 'محفظة كروت جلد طبيعي 100% بني كونياك',
              productNameEn: 'Varellion Slim Cognac Leather Cardholder',
              productSku: 'VAR-L-04',
              unitPrice: 600,
              quantity: 1,
              totalPrice: 600,
            },
          ],
          statusHistory: isDeliveredDemo
            ? [
                {
                  newStatus: 'CONFIRMED',
                  statusDisplayAr: 'تم تأكيد الطلب بنجاح',
                  createdAt: new Date(Date.now() - 172800000).toISOString(),
                },
                {
                  newStatus: 'SHIPPED',
                  statusDisplayAr: 'مع مندوب التوصيل',
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                  newStatus: 'DELIVERED',
                  statusDisplayAr: 'تم التسليم بنجاح',
                  createdAt: new Date().toISOString(),
                },
              ]
            : [
                {
                  newStatus: 'CONFIRMED',
                  statusDisplayAr: 'تم تأكيد الطلب بنجاح',
                  createdAt: new Date(Date.now() - 86400000).toISOString(),
                },
                {
                  newStatus: 'SHIPPED',
                  statusDisplayAr: 'مع مندوب التوصيل',
                  createdAt: new Date().toISOString(),
                },
              ],
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

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
