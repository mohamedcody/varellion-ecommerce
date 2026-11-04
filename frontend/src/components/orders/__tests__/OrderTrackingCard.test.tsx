import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderTrackingCard } from '../OrderTrackingCard';
import { Order } from '@/types';

describe('OrderTrackingCard - DELIVERED Status Display', () => {
  const mockDeliveredOrder: Order = {
    orderId: 'uuid-123',
    orderNumber: 'VAR-20261028-0001',
    customerName: 'محمد أحمد',
    customerPhone: '01012345678',
    shippingGovernorate: 'القاهرة',
    shippingCityArea: 'المعادي',
    shippingDetailedAddress: 'شارع 9',
    currency: 'EGP',
    subtotal: 3450,
    discountTotal: 0,
    shippingFee: 0,
    totalAmount: 3450,
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
        createdAt: '2026-10-29T14:00:00Z',
      },
    ],
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-29T14:00:00Z',
  };

  it('accurately displays status as DELIVERED / تم التسليم بنجاح and marks timeline delivered step completed', () => {
    render(<OrderTrackingCard order={mockDeliveredOrder} />);

    // Check header status badge
    const badge = screen.getByTestId('order-status-badge');
    expect(badge).toBeDefined();
    expect(badge.textContent).toBe('تم التسليم بنجاح');
    expect(badge.className).toContain('text-emerald-700');

    // Check that timeline step for delivered is marked completed
    const deliveredStep = screen.getByTestId('timeline-step-delivered');
    expect(deliveredStep).toBeDefined();
    expect(deliveredStep.textContent).toContain('مكتمل');
    expect(deliveredStep.className).toContain('border-emerald-500/30');

    // Customer details should be present
    expect(screen.getByText('محمد أحمد')).toBeDefined();
    expect(screen.getByText('01012345678')).toBeDefined();
    expect(screen.getByText(/القاهرة — المعادي/i)).toBeDefined();
  });
});
