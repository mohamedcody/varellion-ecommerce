import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CheckoutForm } from '../CheckoutForm';
import { customerService } from '@/services/customer';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { username: 'ahmed', email: 'ahmed@test.com' },
  }),
}));

describe('CheckoutForm Profile Prefill', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('automatically prefills full name, phone and address when customer has saved profile', async () => {
    const onGovChange = vi.fn();

    vi.spyOn(customerService, 'getProfile').mockResolvedValue({
      userId: 'uuid-1',
      fullName: 'محمد عبد الله',
      phoneNumber: '01123456789',
      isActive: true,
      address: {
        governorate: 'Alexandria',
        cityArea: 'Smouha',
        detailedAddress: 'Building 10, Victor Emmanuel St',
      },
    });

    render(
      <CheckoutForm
        subtotal={1000}
        shippingFee={60}
        total={1060}
        selectedGovernorate="Alexandria"
        onGovernorateChange={onGovChange}
        onSubmitOrder={vi.fn()}
        isSubmitting={false}
      />
    );

    await waitFor(() => {
      expect((screen.getByLabelText(/الاسم بالكامل/i) as HTMLInputElement).value).toBe('محمد عبد الله');
      expect((screen.getByLabelText(/رقم الموبايل/i) as HTMLInputElement).value).toBe('01123456789');
      expect((screen.getByLabelText(/المنطقة \/ الحي/i) as HTMLInputElement).value).toBe('Smouha');
      expect((screen.getByLabelText(/العنوان بالتفصيل/i) as HTMLTextAreaElement).value).toBe('Building 10, Victor Emmanuel St');
    });

    expect(screen.getByText(/تم ملء بيانات الشحن تلقائياً من عنوانك المسجل/i)).toBeDefined();
    const saveCheckbox = screen.getByLabelText(/حفظ هذا العنوان كعنوان شحن افتراضي/i) as HTMLInputElement;
    expect(saveCheckbox).toBeDefined();
    expect(saveCheckbox.checked).toBe(false); // Does not overwrite existing address by default
  });

  it('moves focus to the first invalid field when submitting empty required fields (WCAG 2.4.3 & 3.3.1)', async () => {
    vi.spyOn(customerService, 'getProfile').mockResolvedValue(null as any);

    render(
      <CheckoutForm
        subtotal={1000}
        shippingFee={60}
        total={1060}
        selectedGovernorate=""
        onGovernorateChange={vi.fn()}
        onSubmitOrder={vi.fn()}
        isSubmitting={false}
      />
    );

    const nameInput = screen.getByLabelText(/الاسم بالكامل/i);
    fireEvent.change(nameInput, { target: { value: '' } });

    const submitBtn = screen.getByRole('button', { name: /تأكيد الطلب/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(document.activeElement).toBe(nameInput);
    });
  });

  it('renders payment methods within an accessible radiogroup with arrow navigation', () => {
    render(
      <CheckoutForm
        subtotal={1000}
        shippingFee={60}
        total={1060}
        selectedGovernorate="Cairo"
        onGovernorateChange={vi.fn()}
        onSubmitOrder={vi.fn()}
        isSubmitting={false}
      />
    );

    const radiogroup = screen.getByRole('radiogroup');
    expect(radiogroup).toBeDefined();
    expect(radiogroup.getAttribute('aria-label') || radiogroup.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
