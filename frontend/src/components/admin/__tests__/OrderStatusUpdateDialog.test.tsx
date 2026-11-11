import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderStatusUpdateDialog } from '../OrderStatusUpdateDialog';
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
  paymentMethod: 'CASH_ON_DELIVERY',
  items: [],
  createdAt: '2026-10-28T12:00:00Z',
  updatedAt: '2026-10-28T12:00:00Z',
};

describe('OrderStatusUpdateDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders order information and permitted forward statuses for CONFIRMED', () => {
    render(
      <OrderStatusUpdateDialog
        order={sampleOrder}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText('تحديث حالة الطلب')).toBeDefined();
    expect(screen.getByText('الطلب رقم: VAR-20261028-0001')).toBeDefined();
    expect(screen.getByText('محمد أحمد علي')).toBeDefined();

    const select = screen.getByLabelText(/الحالة الجديدة/i) as HTMLSelectElement;
    expect(select).toBeDefined();

    const options = Array.from(select.options).map((opt) => opt.value);
    expect(options).toContain('PREPARING');
    expect(options).toContain('SHIPPED');
    expect(options).toContain('CANCELLED');
    // Illogical backward transition should not be present
    expect(options).not.toContain('PENDING_CUSTOMER_CONFIRMATION');
    // Terminal jump should not be directly present
    expect(options).not.toContain('DELIVERED');
  });

  it('renders terminal state message when order is DELIVERED', () => {
    const deliveredOrder: Order = {
      ...sampleOrder,
      orderStatus: 'DELIVERED',
    };

    render(
      <OrderStatusUpdateDialog
        order={deliveredOrder}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    expect(screen.getByText(/هذا الطلب في حالة نهائية/i)).toBeDefined();
    expect(screen.queryByLabelText(/الحالة الجديدة/i)).toBeNull();
    expect(screen.queryByText('حفظ التغيير')).toBeNull();
  });

  it('calls adminOrdersService.updateOrderStatus and onSuccess on form submission', async () => {
    const updatedOrder: Order = {
      ...sampleOrder,
      orderStatus: 'SHIPPED',
    };

    vi.spyOn(adminOrdersService, 'updateOrderStatus').mockResolvedValue(updatedOrder);

    render(
      <OrderStatusUpdateDialog
        order={sampleOrder}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const select = screen.getByLabelText(/الحالة الجديدة/i);
    fireEvent.change(select, { target: { value: 'SHIPPED' } });

    const reasonInput = screen.getByPlaceholderText(/مثال: تم تسليم الشحنة/i);
    fireEvent.change(reasonInput, { target: { value: 'تم التسليم لشركة الشحن' } });

    const submitBtn = screen.getByRole('button', { name: 'حفظ التغيير' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminOrdersService.updateOrderStatus).toHaveBeenCalledWith({
        orderNumber: 'VAR-20261028-0001',
        newStatus: 'SHIPPED',
        reason: 'تم التسليم لشركة الشحن',
      });
      expect(mockOnSuccess).toHaveBeenCalledWith(updatedOrder);
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('surfaces backend error message when update fails', async () => {
    vi.spyOn(adminOrdersService, 'updateOrderStatus').mockRejectedValue(
      new Error('لا يمكن تحويل حالة الطلب إلى الحالة المختارة')
    );

    render(
      <OrderStatusUpdateDialog
        order={sampleOrder}
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );

    const select = screen.getByLabelText(/الحالة الجديدة/i);
    fireEvent.change(select, { target: { value: 'SHIPPED' } });

    const submitBtn = screen.getByRole('button', { name: 'حفظ التغيير' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('لا يمكن تحويل حالة الطلب إلى الحالة المختارة')
      ).toBeDefined();
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
