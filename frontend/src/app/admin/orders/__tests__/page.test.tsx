import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AdminOrdersPage from '../page';
import * as AuthContextModule from '@/context/AuthContext';
import { adminOrdersService } from '@/services/adminOrders';
import { Order } from '@/types';

const sampleOrder: Order = {
  orderId: 'uuid-1',
  orderNumber: 'VAR-20261028-0001',
  customerName: 'محمد أحمد علي',
  customerPhone: '01012345678',
  shippingGovernorate: 'القاهرة',
  shippingCityArea: 'المعادي',
  shippingDetailedAddress: 'شارع 9',
  currency: 'EGP',
  subtotal: 1000,
  discountTotal: 0,
  shippingFee: 50,
  totalAmount: 1050,
  orderStatus: 'CONFIRMED',
  statusDisplayAr: 'تم تأكيد الطلب',
  paymentMethod: 'CASH_ON_DELIVERY',
  items: [],
  createdAt: '2026-10-28T12:00:00Z',
  updatedAt: '2026-10-28T12:00:00Z',
};

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/admin/orders',
}));

describe('AdminOrdersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: { username: 'admin', email: 'admin@varellion.com', role: 'ADMIN' },
      accessToken: 'token',
      login: vi.fn(),
      register: vi.fn(),
      loginWithGoogle: vi.fn(),
      logout: vi.fn(),
    });
  });

  it('renders order list in table when loaded successfully', async () => {
    vi.spyOn(adminOrdersService, 'getOrders').mockResolvedValue({
      orders: [sampleOrder],
      totalElements: 1,
      totalPages: 1,
      currentPage: 0,
      pageSize: 10,
    });

    render(<AdminOrdersPage />);

    expect(screen.getByText(/إدارة طلبات المتجر/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('VAR-20261028-0001')).toBeDefined();
      expect(screen.getByText('محمد أحمد علي')).toBeDefined();
      expect(screen.getByText('تحديث الحالة')).toBeDefined();
    });
  });

  it('renders empty state when no orders returned', async () => {
    vi.spyOn(adminOrdersService, 'getOrders').mockResolvedValue({
      orders: [],
      totalElements: 0,
      totalPages: 0,
      currentPage: 0,
      pageSize: 10,
    });

    render(<AdminOrdersPage />);

    await waitFor(() => {
      expect(screen.getByText('لا توجد طلبات مطابقة')).toBeDefined();
    });
  });
});
