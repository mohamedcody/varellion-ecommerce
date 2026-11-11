import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TrackOrderPage from '../page';
import { ordersService } from '@/services/orders';
import { Order } from '@/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => '/track-order',
  useSearchParams: () => new URLSearchParams(),
}));

describe('TrackOrderPage - End-to-End DELIVERED Status Reflection', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockDeliveredOrder: Order = {
    orderId: 'uuid-delivered-01',
    orderNumber: 'VAR-20261028-9999',
    customerName: 'فهد المصري',
    customerPhone: '01012345678',
    shippingGovernorate: 'القاهرة',
    shippingCityArea: 'التجمع الخامس',
    shippingDetailedAddress: 'شارع التسعين الشمالي',
    currency: 'EGP',
    subtotal: 5200,
    discountTotal: 0,
    shippingFee: 0,
    totalAmount: 5200,
    orderStatus: 'DELIVERED',
    statusDisplayAr: 'تم التسليم بنجاح',
    paymentMethod: 'CASH_ON_DELIVERY',
    items: [],
    statusHistory: [
      {
        newStatus: 'CONFIRMED',
        createdAt: '2026-10-28T10:00:00Z',
      },
      {
        newStatus: 'DELIVERED',
        createdAt: '2026-10-29T15:30:00Z',
      },
    ],
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-29T15:30:00Z',
  };

  it('queries tracking API, displays DELIVERED status badge, and marks timeline delivered stage as completed', async () => {
    const trackSpy = vi.spyOn(ordersService, 'trackOrder').mockResolvedValue(mockDeliveredOrder);

    render(<TrackOrderPage />);

    // Fill in Order Number and Phone
    const orderInput = screen.getByLabelText(/رقم الطلب/i);
    const phoneInput = screen.getByLabelText(/رقم الموبايل/i);

    fireEvent.change(orderInput, { target: { value: 'VAR-20261028-9999' } });
    fireEvent.change(phoneInput, { target: { value: '01012345678' } });

    // Click Track
    const submitBtn = screen.getByRole('button', { name: /تتبع/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(trackSpy).toHaveBeenCalledWith('VAR-20261028-9999', '01012345678');
    });

    // Check rendered results
    await waitFor(() => {
      // 1. Master status badge
      const badges = screen.getAllByText('تم التسليم بنجاح');
      expect(badges.length).toBeGreaterThanOrEqual(1);

      // 2. Timeline delivered stage marked as completed
      const deliveredStep = screen.getByTestId('timeline-step-delivered');
      expect(deliveredStep).toBeDefined();
      expect(deliveredStep.textContent).toContain('مكتمل');
      expect(deliveredStep.className).toContain('border-emerald-500/30');

      // 3. No active pulsing "الآن" tag remains
      expect(screen.queryByText('الآن')).toBeNull();

      // 4. Delivered delivery notice
      expect(
        screen.getByText(/تم تسليم الطلب بنجاح للعميل — اكتملت جميع مراحل الشحن والتوصيل/i)
      ).toBeDefined();
    });
  });

  it('normalizes phone number with spaces and +20 prefix during tracking', async () => {
    const trackSpy = vi.spyOn(ordersService, 'trackOrder').mockResolvedValue(mockDeliveredOrder);

    render(<TrackOrderPage />);

    const orderInput = screen.getByLabelText(/رقم الطلب/i);
    const phoneInput = screen.getByLabelText(/رقم الموبايل/i);

    fireEvent.change(orderInput, { target: { value: 'VAR-20261028-9999' } });
    fireEvent.change(phoneInput, { target: { value: '+20 10 1234 5678' } });

    const submitBtn = screen.getByRole('button', { name: /تتبع/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(trackSpy).toHaveBeenCalledWith('VAR-20261028-9999', '01012345678');
    });
  });

  it('displays field validation errors when submitting empty inputs without throwing', async () => {
    render(<TrackOrderPage />);

    const submitBtn = screen.getByRole('button', { name: /تتبع/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/يرجى إدخال رقم الطلب/i)).toBeDefined();
      expect(screen.getByText(/يرجى إدخال رقم الموبايل/i)).toBeDefined();
    });
  });

  it('clears error banner when clicking demo order button', async () => {
    vi.spyOn(ordersService, 'trackOrder').mockResolvedValue(null);

    render(<TrackOrderPage />);

    const orderInput = screen.getByLabelText(/رقم الطلب/i);
    const phoneInput = screen.getByLabelText(/رقم الموبايل/i);

    fireEvent.change(orderInput, { target: { value: 'VAR-INVALID' } });
    fireEvent.change(phoneInput, { target: { value: '01012345678' } });

    const submitBtn = screen.getByRole('button', { name: /تتبع/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/تعذر الوصول إلى الطلب/i)).toBeDefined();
    });

    const demoBtn = screen.getByRole('button', { name: /تجربة أوردر افتراضي للاختبار/i });
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.queryByText(/تعذر الوصول إلى الطلب/i)).toBeNull();
    });
  });
});
