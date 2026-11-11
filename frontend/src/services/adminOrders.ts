import { Order, OrderStatus } from '@/types';
import { requestApi } from './api';

export interface PagedOrdersResponse {
  orders: Order[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface AdminOrdersFilterParams {
  page?: number;
  limit?: number;
  status?: OrderStatus | '';
  search?: string;
}

export interface UpdateOrderStatusParams {
  orderNumber: string;
  newStatus: OrderStatus;
  reason?: string;
}

export const PERMITTED_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_CUSTOMER_CONFIRMATION: ['CONFIRMED', 'CANCELLED', 'EXPIRED'],
  CONFIRMED: ['PREPARING', 'SHIPPED', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'DELIVERY_FAILED', 'RETURNED', 'CANCELLED'],
  DELIVERY_FAILED: ['SHIPPED', 'DELIVERED', 'RETURNED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
  EXPIRED: [],
  RETURNED: [],
  EXCHANGED: [],
};

export const ORDER_STATUS_META: Record<
  OrderStatus,
  {
    ar: string;
    en: string;
    variant: 'default' | 'luxury' | 'gold' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
> = {
  PENDING_CUSTOMER_CONFIRMATION: {
    ar: 'بانتظار تأكيد العميل',
    en: 'Pending Confirmation',
    variant: 'warning',
  },
  CONFIRMED: {
    ar: 'تم تأكيد الطلب',
    en: 'Confirmed',
    variant: 'secondary',
  },
  PREPARING: {
    ar: 'جاري التجهيز',
    en: 'Preparing',
    variant: 'secondary',
  },
  SHIPPED: {
    ar: 'مع مندوب التوصيل',
    en: 'Shipped',
    variant: 'default',
  },
  DELIVERED: {
    ar: 'تم التسليم بنجاح',
    en: 'Delivered',
    variant: 'success',
  },
  DELIVERY_FAILED: {
    ar: 'فشل التوصيل',
    en: 'Delivery Failed',
    variant: 'destructive',
  },
  CANCELLED: {
    ar: 'تم إلغاء الطلب',
    en: 'Cancelled',
    variant: 'destructive',
  },
  EXPIRED: {
    ar: 'انتهت الصلاحية',
    en: 'Expired',
    variant: 'outline',
  },
  RETURNED: {
    ar: 'تم إرجاع الطلب',
    en: 'Returned',
    variant: 'destructive',
  },
  EXCHANGED: {
    ar: 'تم استبدال الطلب',
    en: 'Exchanged',
    variant: 'luxury',
  },
};

export function getPermittedNextStatuses(currentStatus: OrderStatus): OrderStatus[] {
  return PERMITTED_STATUS_TRANSITIONS[currentStatus] || [];
}

export const adminOrdersService = {
  async getOrders(params: AdminOrdersFilterParams = {}): Promise<PagedOrdersResponse> {
    const { page = 0, limit = 10, status, search } = params;
    const query = new URLSearchParams();
    query.set('page', String(page));
    query.set('limit', String(limit));
    if (status) query.set('status', status);
    if (search && search.trim()) query.set('search', search.trim());

    const res = await requestApi<{ data?: PagedOrdersResponse } | PagedOrdersResponse>(
      `/admin/orders?${query.toString()}`,
      { method: 'GET' }
    );
    return (res as { data?: PagedOrdersResponse }).data ?? (res as PagedOrdersResponse);
  },

  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const res = await requestApi<{ data?: Order } | Order>(
      `/admin/orders/${encodeURIComponent(orderNumber.trim())}`,
      { method: 'GET' }
    );
    return (res as { data?: Order }).data ?? (res as Order);
  },

  async updateOrderStatus(params: UpdateOrderStatusParams): Promise<Order> {
    const { orderNumber, newStatus, reason } = params;
    const res = await requestApi<{ data?: Order } | Order>(
      `/admin/orders/${encodeURIComponent(orderNumber.trim())}/status`,
      {
        method: 'PUT',
        body: JSON.stringify({
          newStatus,
          reason: reason?.trim() || undefined,
        }),
      }
    );
    return (res as { data?: Order }).data ?? (res as Order);
  },
};
