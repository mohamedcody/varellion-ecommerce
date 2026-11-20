import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCheckoutForm, CheckoutFormValues } from '@/lib/validations/checkout';
import MockPaymobPage from '../mock-paymob/page';
import PaymentCallbackPage from '../callback/page';
import OrderSuccessPage from '../success/page';
import { PaymentMethod, Order } from '@/types';

// Mock Next.js navigation primitives
const mockRedirect = vi.fn();
let mockSearchParams = new URLSearchParams();

vi.mock('next/navigation', () => ({
  redirect: (url: string) => mockRedirect(url),
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
}));

describe('MISSION 08: Secure COD-Only Checkout Remediation Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockRedirect.mockClear();
    mockSearchParams = new URLSearchParams();
    sessionStorage.clear();
  });

  const baseValidForm: CheckoutFormValues = {
    customerName: 'أحمد محمود عبد الله',
    customerPhone: '01012345678',
    shippingGovernorate: 'القاهرة',
    shippingCityArea: 'المعادي',
    shippingDetailedAddress: 'شارع 9، عمارة 15، الدور الثالث',
    paymentMethod: 'CASH_ON_DELIVERY',
  };

  // --------------------------------------------------------------------------
  // 1. Checkout Validation (Strict COD-Only)
  // --------------------------------------------------------------------------
  describe('Checkout Validation (COD-Only Enforcement)', () => {
    it('accepts CASH_ON_DELIVERY as valid payment method', () => {
      const result = validateCheckoutForm(baseValidForm);
      expect(result.isValid).toBe(true);
      expect(result.errors.paymentMethod).toBeUndefined();
    });

    it('rejects CARD and specifies that COD is the only accepted method', () => {
      const result = validateCheckoutForm({
        ...baseValidForm,
        paymentMethod: 'CARD' as PaymentMethod,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.paymentMethod).toMatch(/CASH_ON_DELIVERY/);
    });

    it('rejects INSTAPAY', () => {
      const result = validateCheckoutForm({
        ...baseValidForm,
        paymentMethod: 'INSTAPAY' as PaymentMethod,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.paymentMethod).toBeDefined();
    });

    it('rejects VODAFONE_CASH', () => {
      const result = validateCheckoutForm({
        ...baseValidForm,
        paymentMethod: 'VODAFONE_CASH' as PaymentMethod,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.paymentMethod).toBeDefined();
    });

    it('rejects empty string as payment method', () => {
      const result = validateCheckoutForm({
        ...baseValidForm,
        paymentMethod: '' as PaymentMethod,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.paymentMethod).toBeDefined();
    });

    it('rejects unknown or arbitrary payment method string', () => {
      const result = validateCheckoutForm({
        ...baseValidForm,
        paymentMethod: 'CRYPTO_BITCOIN' as any,
      });
      expect(result.isValid).toBe(false);
      expect(result.errors.paymentMethod).toMatch(/CASH_ON_DELIVERY/);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Mock Paymob Route Closure (P0-A)
  // --------------------------------------------------------------------------
  describe('Mock Paymob Route Closure', () => {
    it('immediately redirects to /checkout and renders no simulator UI', () => {
      MockPaymobPage();
      expect(mockRedirect).toHaveBeenCalledWith('/checkout');

      // Verify no simulator DOM or window variables are set
      expect(screen.queryByText(/PAYMOB CHECKOUT/i)).toBeNull();
      expect(screen.queryByText(/بيئة محاكاة تجريبية/i)).toBeNull();
      expect(screen.queryByText(/PAYMOB_TXN_/i)).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 3. Payment Callback Route Closure (P0-B)
  // --------------------------------------------------------------------------
  describe('Payment Callback Route Closure', () => {
    it('immediately redirects to /checkout even if success=true query param is passed', () => {
      mockSearchParams = new URLSearchParams('success=true&orderNumber=VAR-FAKE-1234&transactionId=TXN_999');

      PaymentCallbackPage();

      expect(mockRedirect).toHaveBeenCalledWith('/checkout');
      expect(sessionStorage.getItem('varellion_last_order')).toBeNull();
    });

    it('does not mutate sessionStorage or clear the cart on callback visit', () => {
      // Simulate existing cart item in local/session storage
      sessionStorage.setItem('test_cart_probe', 'active_cart');

      PaymentCallbackPage();

      expect(mockRedirect).toHaveBeenCalledWith('/checkout');
      expect(sessionStorage.getItem('test_cart_probe')).toBe('active_cart');
      expect(sessionStorage.getItem('varellion_last_order')).toBeNull();
    });

    it('does not display any fake bank success or convert-to-cod buttons', () => {
      PaymentCallbackPage();

      expect(screen.queryByText(/تم التحقق البنكي بنجاح/i)).toBeNull();
      expect(screen.queryByText(/تأكيد الطلب الآن كـ \(الدفع عند الاستلام\)/i)).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // 4. Order Success Page Security (P1)
  // --------------------------------------------------------------------------
  describe('Order Success Page Security & Privacy', () => {
    it('displays safe fallback when visited with fabricated orderNumber and no trusted session order', async () => {
      mockSearchParams = new URLSearchParams('orderNumber=VAR-FABRICATED-9999');

      render(<OrderSuccessPage />);

      await waitFor(() => {
        expect(screen.getByText(/لا توجد بيانات طلب نشطة لعرضها/i)).toBeDefined();
      });

      // Crucial: Must NOT celebrate fabricated order
      expect(screen.queryByText(/طلبك مؤكد وجارٍ التجهيز/i)).toBeNull();
      expect(screen.queryByText(/فاتورة المنتجات/i)).toBeNull();
      expect(screen.getByRole('link', { name: /الانتقال لصفحة تتبع الطلب/i })).toBeDefined();
    });

    it('displays safe fallback when URL orderNumber does not match trusted session order', async () => {
      const realOrder: Partial<Order> = {
        orderId: 'ord-real-001',
        orderNumber: 'VAR-20261120-1111',
        orderStatus: 'PENDING_CUSTOMER_CONFIRMATION',
        customerName: 'محمود عبد السلام',
        customerPhone: '01012345678',
        shippingGovernorate: 'القاهرة',
        shippingCityArea: 'المعادي',
        shippingDetailedAddress: 'شارع 9',
        subtotal: 1500,
        shippingFee: 50,
        totalAmount: 1550,
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [],
      };
      sessionStorage.setItem('varellion_last_order', JSON.stringify(realOrder));

      // Attempt spoof with mismatched orderNumber in query string
      mockSearchParams = new URLSearchParams('orderNumber=VAR-DIFFERENT-2222');

      render(<OrderSuccessPage />);

      await waitFor(() => {
        expect(screen.getByText(/لا توجد بيانات طلب نشطة لعرضها/i)).toBeDefined();
      });

      expect(screen.queryByText(/1,550/)).toBeNull();
    });

    it('renders authentic order details with PENDING_CUSTOMER_CONFIRMATION message when trusted order matches', async () => {
      const trustedOrder: Partial<Order> = {
        orderId: 'ord-real-002',
        orderNumber: 'VAR-20261120-7777',
        orderStatus: 'PENDING_CUSTOMER_CONFIRMATION',
        customerName: 'كريم المنشاوي',
        customerPhone: '01198765432',
        shippingGovernorate: 'الإسكندرية',
        shippingCityArea: 'سموحة',
        shippingDetailedAddress: 'فيكتور عمانويل',
        subtotal: 2000,
        shippingFee: 60,
        totalAmount: 2060,
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [
          {
            orderItemId: 'item-1',
            productId: 'prod-1',
            productNameAr: 'ساعة فارليون كرونوغراف',
            productNameEn: 'Chronograph',
            productSku: 'VAR-W-01',
            unitPrice: 2000,
            quantity: 1,
            totalPrice: 2000,
          },
        ],
      };
      sessionStorage.setItem('varellion_last_order', JSON.stringify(trustedOrder));
      mockSearchParams = new URLSearchParams('orderNumber=VAR-20261120-7777');

      render(<OrderSuccessPage />);

      await waitFor(() => {
        // Must show accurate pending confirmation copy, not "مؤكد وجار التجهيز"
        expect(screen.getByText(/تم استلام طلبك بنجاح، وهو في انتظار التأكيد/i)).toBeDefined();
        expect(screen.getByText(/في انتظار التأكيد الهاتفي/i)).toBeDefined();
      });

      expect(screen.getByText('VAR-20261120-7777')).toBeDefined();
      expect(screen.getByText(/ساعة فارليون كرونوغراف/i)).toBeDefined();
      expect(screen.getByText(new RegExp((2060).toLocaleString('ar-EG')))).toBeDefined();
      expect(screen.getByText(/الدفع عند الاستلام \(COD\)/i)).toBeDefined();

      // Check privacy: Phone number MUST NOT be in the tracking link URL
      const trackLinks = screen.getAllByRole('link', { name: /تتبع/i });
      trackLinks.forEach((link) => {
        const href = link.getAttribute('href') || '';
        expect(href).not.toContain('&phone=');
        expect(href).not.toContain('01198765432');
      });
    });

    it('preserves order display when customer refreshes the success page', async () => {
      const persistentOrder: Partial<Order> = {
        orderId: 'ord-refresh-001',
        orderNumber: 'VAR-20261120-8888',
        orderStatus: 'PENDING_CUSTOMER_CONFIRMATION',
        customerName: 'طارق الدسوقي',
        customerPhone: '01234567890',
        shippingGovernorate: 'الجيزة',
        shippingCityArea: 'الدقي',
        shippingDetailedAddress: 'شارع مصدق',
        subtotal: 1000,
        shippingFee: 50,
        totalAmount: 1050,
        paymentMethod: 'CASH_ON_DELIVERY',
        items: [],
      };
      sessionStorage.setItem('varellion_last_order', JSON.stringify(persistentOrder));
      mockSearchParams = new URLSearchParams('orderNumber=VAR-20261120-8888');

      // First render (Initial landing after order placement)
      const { unmount } = render(<OrderSuccessPage />);
      await waitFor(() => {
        expect(screen.getByText('VAR-20261120-8888')).toBeDefined();
      });

      // Simulate page refresh (unmount and re-render)
      unmount();
      render(<OrderSuccessPage />);

      await waitFor(() => {
        expect(screen.getByText('VAR-20261120-8888')).toBeDefined();
        expect(screen.getByText(/تم استلام طلبك بنجاح، وهو في انتظار التأكيد/i)).toBeDefined();
      });
    });
  });
});
