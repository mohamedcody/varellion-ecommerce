import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  adminOrdersService,
  getPermittedNextStatuses,
  PERMITTED_STATUS_TRANSITIONS,
} from '../adminOrders';
import * as apiModule from '../api';

describe('adminOrdersService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getPermittedNextStatuses', () => {
    it('returns valid forward transitions for CONFIRMED', () => {
      const transitions = getPermittedNextStatuses('CONFIRMED');
      expect(transitions).toEqual(['PREPARING', 'SHIPPED', 'CANCELLED']);
    });

    it('returns valid transitions for SHIPPED', () => {
      const transitions = getPermittedNextStatuses('SHIPPED');
      expect(transitions).toEqual(['DELIVERED', 'DELIVERY_FAILED', 'RETURNED', 'CANCELLED']);
    });

    it('returns empty array for terminal states like DELIVERED and CANCELLED', () => {
      expect(getPermittedNextStatuses('DELIVERED')).toEqual([]);
      expect(getPermittedNextStatuses('CANCELLED')).toEqual([]);
      expect(getPermittedNextStatuses('EXPIRED')).toEqual([]);
      expect(getPermittedNextStatuses('RETURNED')).toEqual([]);
    });
  });

  describe('getOrders', () => {
    it('calls /admin/orders with query parameters', async () => {
      const mockResponse = {
        orders: [],
        totalElements: 0,
        totalPages: 0,
        currentPage: 0,
        pageSize: 10,
      };

      const requestApiSpy = vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
        data: mockResponse,
      } as any);

      const result = await adminOrdersService.getOrders({
        page: 1,
        limit: 20,
        status: 'SHIPPED',
        search: '01012345678',
      });

      expect(requestApiSpy).toHaveBeenCalledWith(
        expect.stringContaining('/admin/orders?page=1&limit=20&status=SHIPPED&search=01012345678'),
        { method: 'GET' }
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getOrderByNumber', () => {
    it('calls /admin/orders/{orderNumber} with encoded order number', async () => {
      const mockOrder = { orderNumber: 'VAR-20261028-0001', orderStatus: 'CONFIRMED' };
      const requestApiSpy = vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
        data: mockOrder,
      } as any);

      const result = await adminOrdersService.getOrderByNumber('VAR-20261028-0001');

      expect(requestApiSpy).toHaveBeenCalledWith(
        '/admin/orders/VAR-20261028-0001',
        { method: 'GET' }
      );
      expect(result).toEqual(mockOrder);
    });
  });

  describe('updateOrderStatus', () => {
    it('calls PUT /admin/orders/{orderNumber}/status with newStatus and reason', async () => {
      const mockUpdated = { orderNumber: 'VAR-20261028-0001', orderStatus: 'SHIPPED' };
      const requestApiSpy = vi.spyOn(apiModule, 'requestApi').mockResolvedValue({
        data: mockUpdated,
      } as any);

      const result = await adminOrdersService.updateOrderStatus({
        orderNumber: 'VAR-20261028-0001',
        newStatus: 'SHIPPED',
        reason: 'تم التسليم لمندوب الشحن',
      });

      expect(requestApiSpy).toHaveBeenCalledWith(
        '/admin/orders/VAR-20261028-0001/status',
        {
          method: 'PUT',
          body: JSON.stringify({
            newStatus: 'SHIPPED',
            reason: 'تم التسليم لمندوب الشحن',
          }),
        }
      );
      expect(result).toEqual(mockUpdated);
    });
  });
});
