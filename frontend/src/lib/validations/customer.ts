import { CustomerAddress } from '@/types';

export const EGYPTIAN_PHONE_REGEX = /^$|^01[0125][0-9]{8}$/;

export interface ProfileFormValues {
  fullName: string;
  phoneNumber?: string;
}

/**
 * Validates customer personal profile inputs
 */
export function validateProfile(values: ProfileFormValues): Record<string, string> {
  const errors: Record<string, string> = {};

  const name = values.fullName?.trim() || '';
  if (!name) {
    errors.fullName = 'الاسم بالكامل مطلوب';
  } else if (name.length < 3) {
    errors.fullName = 'الاسم يجب ألا يقل عن 3 أحرف';
  } else if (name.length > 150) {
    errors.fullName = 'الاسم طويل جداً (الحد الأقصى 150 حرفاً)';
  }

  const phone = values.phoneNumber?.trim() || '';
  if (phone && !EGYPTIAN_PHONE_REGEX.test(phone)) {
    errors.phoneNumber = 'رقم موبايل مصري غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً)';
  }

  return errors;
}

/**
 * Validates delivery address inputs
 */
export function validateAddress(values: Partial<CustomerAddress>): Record<string, string> {
  const errors: Record<string, string> = {};

  const gov = values.governorate?.trim() || '';
  if (!gov) {
    errors.governorate = 'المحافظة مطلوبة';
  } else if (gov.length > 100) {
    errors.governorate = 'اسم المحافظة يجب ألا يتجاوز 100 حرف';
  }

  const city = values.cityArea?.trim() || '';
  if (!city) {
    errors.cityArea = 'المنطقة أو الحي مطلوب';
  } else if (city.length > 100) {
    errors.cityArea = 'اسم المنطقة يجب ألا يتجاوز 100 حرف';
  }

  const detailed = values.detailedAddress?.trim() || '';
  if (!detailed) {
    errors.detailedAddress = 'العنوان بالتفصيل مطلوب';
  } else if (detailed.length < 5) {
    errors.detailedAddress = 'العنوان التفصيلي قصير جداً، يرجى كتابة اسم الشارع ورقم العمارة والشقة';
  } else if (detailed.length > 255) {
    errors.detailedAddress = 'العنوان التفصيلي يجب ألا يتجاوز 255 حرفاً';
  }

  return errors;
}
