import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OrderTrackingTimeline } from '../OrderTrackingTimeline';
import { OrderStatus, OrderStatusHistory } from '@/types';

describe('OrderTrackingTimeline - DELIVERED Status & Lifecycle Verification', () => {
  const createdAt = '2026-10-28T10:00:00Z';
  const governorate = 'القاهرة';

  it('marks all 4 steps as completed when status is DELIVERED', () => {
    render(
      <OrderTrackingTimeline
        status="DELIVERED"
        createdAt={createdAt}
        governorate={governorate}
      />
    );

    // Verify all 4 step cards exist
    const receivedStep = screen.getByTestId('timeline-step-received');
    const preparingStep = screen.getByTestId('timeline-step-preparing');
    const shippedStep = screen.getByTestId('timeline-step-shipped');
    const deliveredStep = screen.getByTestId('timeline-step-delivered');

    expect(receivedStep).toBeDefined();
    expect(preparingStep).toBeDefined();
    expect(shippedStep).toBeDefined();
    expect(deliveredStep).toBeDefined();

    // The delivered step must have the completed tag / styling
    expect(deliveredStep.textContent).toContain('تم التسليم بنجاح');
    expect(deliveredStep.textContent).toContain('مكتمل');

    // No step should have the pulsing active "الآن" tag
    expect(screen.queryByText('الآن')).toBeNull();

    // All steps must have emerald completed background/border
    expect(deliveredStep.className).toContain('border-emerald-500/30');
    expect(shippedStep.className).toContain('border-emerald-500/30');
    expect(preparingStep.className).toContain('border-emerald-500/30');
    expect(receivedStep.className).toContain('border-emerald-500/30');

    // Delivered confirmation banner is rendered
    expect(
      screen.getByText(/تم تسليم الطلب بنجاح للعميل — اكتملت جميع مراحل الشحن والتوصيل/i)
    ).toBeDefined();
  });

  it('accurately renders timestamps from statusHistory on each step', () => {
    const history: OrderStatusHistory[] = [
      {
        newStatus: 'CONFIRMED',
        createdAt: '2026-10-28T10:15:00Z',
      },
      {
        newStatus: 'PREPARING',
        createdAt: '2026-10-28T12:30:00Z',
      },
      {
        newStatus: 'SHIPPED',
        createdAt: '2026-10-29T09:00:00Z',
      },
      {
        newStatus: 'DELIVERED',
        createdAt: '2026-10-29T16:45:00Z',
      },
    ];

    render(
      <OrderTrackingTimeline
        status="DELIVERED"
        createdAt={createdAt}
        governorate={governorate}
        statusHistory={history}
      />
    );

    const deliveredStep = screen.getByTestId('timeline-step-delivered');
    expect(deliveredStep).toBeDefined();
    // Should display delivered timestamp
    expect(deliveredStep.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('marks delivered stage as incomplete and shipped stage as active when status is SHIPPED', () => {
    render(
      <OrderTrackingTimeline
        status="SHIPPED"
        createdAt={createdAt}
        governorate={governorate}
      />
    );

    const shippedStep = screen.getByTestId('timeline-step-shipped');
    const deliveredStep = screen.getByTestId('timeline-step-delivered');

    // Shipped step should be active with "الآن"
    expect(shippedStep.textContent).toContain('الآن');

    // Delivered step must NOT be completed and NOT active
    expect(deliveredStep.textContent).not.toContain('مكتمل');
    expect(deliveredStep.textContent).not.toContain('الآن');
    expect(deliveredStep.className).toContain('opacity-70');
  });

  it('marks preparing stage as active when status is PREPARING', () => {
    render(
      <OrderTrackingTimeline
        status="PREPARING"
        createdAt={createdAt}
        governorate={governorate}
      />
    );

    const preparingStep = screen.getByTestId('timeline-step-preparing');
    const shippedStep = screen.getByTestId('timeline-step-shipped');
    const deliveredStep = screen.getByTestId('timeline-step-delivered');

    expect(preparingStep.textContent).toContain('الآن');
    expect(shippedStep.textContent).not.toContain('الآن');
    expect(deliveredStep.textContent).not.toContain('الآن');
  });

  it('safely renders without throwing when createdAt is empty or invalid', () => {
    expect(() => {
      render(
        <OrderTrackingTimeline
          status="DELIVERED"
          createdAt=""
          governorate={governorate}
        />
      );
    }).not.toThrow();

    const deliveredStep = screen.getByTestId('timeline-step-delivered');
    expect(deliveredStep).toBeDefined();
    expect(deliveredStep.textContent).toContain('مكتمل');
  });

  it('falls back to order createdAt for received step when not present in statusHistory', () => {
    const historyOnlyDelivered: OrderStatusHistory[] = [
      {
        newStatus: 'DELIVERED',
        createdAt: '2026-10-29T16:45:00Z',
      },
    ];

    render(
      <OrderTrackingTimeline
        status="DELIVERED"
        createdAt="2026-10-28T10:00:00Z"
        governorate={governorate}
        statusHistory={historyOnlyDelivered}
      />
    );

    const receivedStep = screen.getByTestId('timeline-step-received');
    expect(receivedStep.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('falls back to order updatedAt for delivered step when missing from statusHistory', () => {
    render(
      <OrderTrackingTimeline
        status="DELIVERED"
        createdAt="2026-10-28T10:00:00Z"
        updatedAt="2026-10-29T16:45:00Z"
        governorate={governorate}
        statusHistory={[]}
      />
    );

    const deliveredStep = screen.getByTestId('timeline-step-delivered');
    expect(deliveredStep.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('matches statusHistory entries with leading or trailing whitespace', () => {
    const untrimmedHistory: OrderStatusHistory[] = [
      {
        newStatus: ' delivered ',
        createdAt: '2026-10-29T16:45:00Z',
      },
    ];

    render(
      <OrderTrackingTimeline
        status="DELIVERED"
        createdAt="2026-10-28T10:00:00Z"
        governorate={governorate}
        statusHistory={untrimmedHistory}
      />
    );

    const deliveredStep = screen.getByTestId('timeline-step-delivered');
    expect(deliveredStep.querySelector('[dir="ltr"]')).not.toBeNull();
  });

  it('renders غير محدد for order registration date when createdAt is empty', () => {
    render(
      <OrderTrackingTimeline
        status="CONFIRMED"
        createdAt=""
        governorate={governorate}
      />
    );

    expect(screen.getByText('غير محدد')).toBeDefined();
  });
});
