import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ordersService, normalizeEgyptianPhone } from '../orders';
import * as apiModule from '../api';

describe('ordersService - Track Order & DELIVERED status', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  describe('normalizeEgyptianPhone', () => {
    it('normalizes local 11-digit phone', () => {
      expect(normalizeEgyptianPhone('01012345678')).toBe('01012345678');
    });

    it('normalizes +20 country code prefix', () => {
      expect(normalizeEgyptianPhone('+201012345678')).toBe('01012345678');
      expect(normalizeEgyptianPhone('+20 10 1234 5678')).toBe('01012345678');
    });

    it('normalizes 0020 prefix', () => {
      expect(normalizeEgyptianPhone('00201012345678')).toBe('01012345678');
    });

    it('normalizes 10-digit number missing leading zero', () => {
      expect(normalizeEgyptianPhone('1012345678')).toBe('01012345678');
    });

    it('handles null and empty safely', () => {
      expect(normalizeEgyptianPhone('')).toBe('');
    });
  });

  describe('trackOrder', () => {
    it('normalizes phone number and queries backend API with canonical query params', async () => {
      const mockOrder = {
        orderId: 'ord-123',
        orderNumber: 'VAR-20261028-0001',
        orderStatus: 'DELIVERED',
        customerPhone: '01012345678',
      };

      const requestApiSpy = vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
        data: mockOrder,
      } as any);

      const result = await ordersService.trackOrder('VAR-20261028-0001', '+20 10 1234 5678');

      expect(requestApiSpy).toHaveBeenCalledWith(
        expect.stringContaining('/orders/track?orderNumber=VAR-20261028-0001&phone=01012345678'),
        expect.any(Object)
      );
      expect(result).toEqual(mockOrder);
    });

    it('returns DELIVERED demo order with accurate timeline history for VAR-DEMO-DELIVERED', async () => {
      vi.spyOn(apiModule, 'requestApi').mockRejectedValue(new Error('Backend offline'));

      const result = await ordersService.trackOrder('VAR-DEMO-DELIVERED', '01012345678');

      expect(result).not.toBeNull();
      expect(result?.orderStatus).toBe('DELIVERED');
      expect(result?.statusDisplayAr).toBe('تم التسليم بنجاح');
      expect(result?.statusHistory).toBeDefined();
      expect(result?.statusHistory?.length).toBeGreaterThanOrEqual(3);
      expect(result?.statusHistory?.some((h) => h.newStatus === 'DELIVERED')).toBe(true);
    });

    it('falls back to sessionStorage with normalized phone match when offline', async () => {
      vi.spyOn(apiModule, 'requestApi').mockRejectedValue(new Error('Backend offline'));

      const cachedOrder = {
        orderId: 'cached-123',
        orderNumber: 'VAR-20261028-7777',
        orderStatus: 'DELIVERED',
        customerPhone: '01012345678',
      };
      sessionStorage.setItem('varellion_last_order', JSON.stringify(cachedOrder));

      // Query with +20 prefix: normalized phone should match cached order
      const result = await ordersService.trackOrder('VAR-20261028-7777', '+201012345678');

      expect(result).toEqual(cachedOrder);
    });
  });

  describe('createOrder', () => {
    const sampleRequest = {
      customerName: 'أحمد محمود',
      customerPhone: '01012345678',
      shippingGovernorate: 'القاهرة',
      shippingCityArea: 'المعادي',
      shippingDetailedAddress: 'شارع 9',
      paymentMethod: 'CASH_ON_DELIVERY' as const,
      items: [{ productId: 'prod-1', quantity: 2 }],
    };

    it('submits order via POST, unwraps data envelope, and caches in sessionStorage', async () => {
      const serverOrder = {
        orderId: 'ord-server-001',
        orderNumber: 'VAR-20261103-1234',
        orderStatus: 'PENDING_CUSTOMER_CONFIRMATION',
        customerName: 'أحمد محمود',
      };

      const requestApiSpy = vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
        success: true,
        data: serverOrder,
      } as any);

      const result = await ordersService.createOrder({
        request: sampleRequest,
        subtotal: 2000,
        shippingFee: 50,
        orderItems: [],
      });

      expect(requestApiSpy).toHaveBeenCalledWith('/orders', {
        method: 'POST',
        headers: {
          'Idempotency-Key': expect.any(String),
        },
        body: JSON.stringify(sampleRequest),
      });
      expect(result).toEqual(serverOrder);

      const cached = sessionStorage.getItem('varellion_last_order');
      expect(cached).toBe(JSON.stringify(serverOrder));
    });

    it('propagates backend ApiError without generating silent fake mock order', async () => {
      vi.spyOn(apiModule, 'requestApi').mockRejectedValue(
        new apiModule.ApiError('الكمية المطلوبة غير متوفرة في المخزون', 400)
      );

      await expect(
        ordersService.createOrder({
          request: sampleRequest,
          subtotal: 2000,
          shippingFee: 50,
          orderItems: [],
        })
      ).rejects.toThrow('الكمية المطلوبة غير متوفرة في المخزون');

      // Crucial: No fake order in sessionStorage
      expect(sessionStorage.getItem('varellion_last_order')).toBeNull();
    });

    it('returns created order even if sessionStorage.setItem throws', async () => {
      const serverOrder = {
        orderId: 'ord-server-002',
        orderNumber: 'VAR-20261103-5678',
        orderStatus: 'PENDING_CUSTOMER_CONFIRMATION',
      };

      vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
        data: serverOrder,
      } as any);

      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceededError');
      });

      const result = await ordersService.createOrder({
        request: sampleRequest,
        subtotal: 1000,
        shippingFee: 50,
        orderItems: [],
      });

      expect(result).toEqual(serverOrder);
    });
  });
});
