import { EGYPTIAN_GOVERNORATES } from '@/data/shippingZones';
import { PaymentMethod } from '@/types';

export interface CheckoutFormValues {
  customerName: string;
  customerPhone: string;
  alternativePhone?: string;
  shippingGovernorate: string;
  shippingCityArea: string;
  shippingDetailedAddress: string;
  paymentMethod: PaymentMethod;
  customerNotes?: string;
  saveAddress?: boolean;
}

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutFormValues, string>>;

export interface ValidationResult {
  isValid: boolean;
  errors: CheckoutFieldErrors;
}

/**
 * Egyptian Mobile Number Regex:
 * Must start with 010, 011, 012, or 015 and be exactly 11 digits.
 */
const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;

/**
 * Validates checkout form values strictly matching PostgreSQL constraints.
 */
export function validateCheckoutForm(values: CheckoutFormValues): ValidationResult {
  const errors: CheckoutFieldErrors = {};

  // 1. Customer Name (orders.customer_name VARCHAR(150) NOT NULL)
  const cleanName = values.customerName?.trim() || '';
  if (!cleanName) {
    errors.customerName = 'الاسم بالكامل مطلوب لطباعة بوليصة الشحن';
  } else if (cleanName.length < 3) {
    errors.customerName = 'الاسم يجب ألا يقل عن 3 أحرف';
  } else if (cleanName.length > 150) {
    errors.customerName = 'الاسم طويل جداً (الحد الأقصى 150 حرفاً)';
  } else if (!cleanName.includes(' ') || cleanName.split(/\s+/).filter(Boolean).length < 2) {
    errors.customerName = 'يرجى كتابة الاسم ثنائياً أو ثلاثياً على الأقل';
  }

  // 2. Customer Phone (orders.customer_phone VARCHAR(30) NOT NULL)
  const cleanPhone = values.customerPhone?.trim() || '';
  if (!cleanPhone) {
    errors.customerPhone = 'رقم الموبايل مطلوب للتواصل مع مندوب التوصيل';
  } else if (!EGYPTIAN_PHONE_REGEX.test(cleanPhone)) {
    errors.customerPhone = 'رقم موبايل مصري غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً)';
  }

  // 3. Alternative Phone (DTO optional field)
  const cleanAltPhone = values.alternativePhone?.trim();
  if (cleanAltPhone) {
    if (!EGYPTIAN_PHONE_REGEX.test(cleanAltPhone)) {
      errors.alternativePhone = 'الرقم البديل يجب أن يكون رقم موبايل مصري صحيح (11 رقماً)';
    } else if (cleanAltPhone === cleanPhone) {
      errors.alternativePhone = 'الرقم البديل يجب أن يختلف عن الرقم الأساسي';
    }
  }

  // 4. Shipping Governorate (orders.shipping_governorate VARCHAR(100) NOT NULL)
  const cleanGov = values.shippingGovernorate?.trim() || '';
  if (!cleanGov) {
    errors.shippingGovernorate = 'يرجى اختيار المحافظة لتحديد تكلفة ومدة الشحن';
  } else {
    const isGovValid = EGYPTIAN_GOVERNORATES.some(
      (g) => g.governorateAr === cleanGov || g.governorateEn.toLowerCase() === cleanGov.toLowerCase()
    );
    if (!isGovValid) {
      errors.shippingGovernorate = 'المحافظة المختارة غير معتمدة في قائمة التوصيل';
    }
  }

  // 5. Shipping City / Area (orders.shipping_city_area VARCHAR(100) NOT NULL)
  const cleanCity = values.shippingCityArea?.trim() || '';
  if (!cleanCity) {
    errors.shippingCityArea = 'يرجى إدخال اسم المنطقة أو المركز أو الحي';
  } else if (cleanCity.length < 2) {
    errors.shippingCityArea = 'اسم المنطقة قصير جداً';
  } else if (cleanCity.length > 100) {
    errors.shippingCityArea = 'اسم المنطقة طويل جداً (الحد الأقصى 100 حرفاً)';
  }

  // 6. Detailed Address (orders.shipping_detailed_address TEXT NOT NULL)
  const cleanAddress = values.shippingDetailedAddress?.trim() || '';
  if (!cleanAddress) {
    errors.shippingDetailedAddress = 'يرجى كتابة العنوان بالتفصيل (اسم الشارع، رقم العمارة، رقم الدور والشقة)';
  } else if (cleanAddress.length < 6) {
    errors.shippingDetailedAddress = 'العنوان التفصيلي قصير جداً، يرجى توضيح بيانات الشارع والعمارة';
  }

  // 7. Payment Method (orders.payment_method VARCHAR(50) NOT NULL)
  if (!values.paymentMethod) {
    errors.paymentMethod = 'يرجى اختيار طريقة الدفع';
  }

  // 8. Customer Notes (orders.customer_notes TEXT NULL)
  const cleanNotes = values.customerNotes?.trim();
  if (cleanNotes && cleanNotes.length > 500) {
    errors.customerNotes = 'ملاحظات التوصيل يجب ألا تتجاوز 500 حرف';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
