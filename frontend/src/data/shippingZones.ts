/**
 * Egyptian Shipping Zones & Rates Configuration for VARELLION
 * Aligned with local courier delivery SLAs and rates.
 */

export interface GovernorateShippingInfo {
  governorateAr: string;
  governorateEn: string;
  zone: string;
  baseFee: number; // in EGP
  estimatedDeliveryAr: string;
  estimatedDeliveryEn: string;
}

export const FREE_SHIPPING_THRESHOLD = 2500; // in EGP

export const EGYPTIAN_GOVERNORATES: GovernorateShippingInfo[] = [
  // Zone 1: Greater Cairo & Giza
  {
    governorateAr: 'القاهرة',
    governorateEn: 'Cairo',
    zone: 'greater_cairo',
    baseFee: 50,
    estimatedDeliveryAr: 'خلال 24 إلى 48 ساعة',
    estimatedDeliveryEn: 'Within 24 to 48 hours',
  },
  {
    governorateAr: 'الجيزة',
    governorateEn: 'Giza',
    zone: 'greater_cairo',
    baseFee: 50,
    estimatedDeliveryAr: 'خلال 24 إلى 48 ساعة',
    estimatedDeliveryEn: 'Within 24 to 48 hours',
  },
  {
    governorateAr: 'القليوبية',
    governorateEn: 'Qalyubia',
    zone: 'greater_cairo',
    baseFee: 50,
    estimatedDeliveryAr: 'خلال 24 إلى 48 ساعة',
    estimatedDeliveryEn: 'Within 24 to 48 hours',
  },

  // Zone 2: Alexandria & North Coast
  {
    governorateAr: 'الإسكندرية',
    governorateEn: 'Alexandria',
    zone: 'alexandria',
    baseFee: 60,
    estimatedDeliveryAr: 'خلال 2 إلى 3 أيام عمل',
    estimatedDeliveryEn: '2 to 3 business days',
  },
  {
    governorateAr: 'مطروح',
    governorateEn: 'Matrouh',
    zone: 'alexandria',
    baseFee: 60,
    estimatedDeliveryAr: 'خلال 3 إلى 4 أيام عمل',
    estimatedDeliveryEn: '3 to 4 business days',
  },

  // Zone 3: Delta & Canal Cities
  {
    governorateAr: 'الدقهلية',
    governorateEn: 'Dakahlia',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'الغربية',
    governorateEn: 'Gharbia',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'الشرقية',
    governorateEn: 'Sharqia',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'المنوفية',
    governorateEn: 'Monufia',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'كفر الشيخ',
    governorateEn: 'Kafr El Sheikh',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'البحيرة',
    governorateEn: 'Beheira',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'دمياط',
    governorateEn: 'Damietta',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'بورسعيد',
    governorateEn: 'Port Said',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'الإسماعيلية',
    governorateEn: 'Ismailia',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },
  {
    governorateAr: 'السويس',
    governorateEn: 'Suez',
    zone: 'delta_canal',
    baseFee: 65,
    estimatedDeliveryAr: 'خلال 2 إلى 4 أيام عمل',
    estimatedDeliveryEn: '2 to 4 business days',
  },

  // Zone 4: North & Central Upper Egypt
  {
    governorateAr: 'الفيوم',
    governorateEn: 'Faiyum',
    zone: 'upper_egypt_north',
    baseFee: 75,
    estimatedDeliveryAr: 'خلال 3 إلى 5 أيام عمل',
    estimatedDeliveryEn: '3 to 5 business days',
  },
  {
    governorateAr: 'بني سويف',
    governorateEn: 'Beni Suef',
    zone: 'upper_egypt_north',
    baseFee: 75,
    estimatedDeliveryAr: 'خلال 3 إلى 5 أيام عمل',
    estimatedDeliveryEn: '3 to 5 business days',
  },
  {
    governorateAr: 'المنيا',
    governorateEn: 'Minya',
    zone: 'upper_egypt_north',
    baseFee: 75,
    estimatedDeliveryAr: 'خلال 3 إلى 5 أيام عمل',
    estimatedDeliveryEn: '3 to 5 business days',
  },
  {
    governorateAr: 'أسيوط',
    governorateEn: 'Asyut',
    zone: 'upper_egypt_north',
    baseFee: 75,
    estimatedDeliveryAr: 'خلال 3 إلى 5 أيام عمل',
    estimatedDeliveryEn: '3 to 5 business days',
  },

  // Zone 5: South Upper Egypt & Frontier
  {
    governorateAr: 'سوهاج',
    governorateEn: 'Sohag',
    zone: 'upper_egypt_south',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 4 إلى 6 أيام عمل',
    estimatedDeliveryEn: '4 to 6 business days',
  },
  {
    governorateAr: 'قنا',
    governorateEn: 'Qena',
    zone: 'upper_egypt_south',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 4 إلى 6 أيام عمل',
    estimatedDeliveryEn: '4 to 6 business days',
  },
  {
    governorateAr: 'الأقصر',
    governorateEn: 'Luxor',
    zone: 'upper_egypt_south',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 4 إلى 6 أيام عمل',
    estimatedDeliveryEn: '4 to 6 business days',
  },
  {
    governorateAr: 'أسوان',
    governorateEn: 'Aswan',
    zone: 'upper_egypt_south',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 4 إلى 6 أيام عمل',
    estimatedDeliveryEn: '4 to 6 business days',
  },
  {
    governorateAr: 'البحر الأحمر',
    governorateEn: 'Red Sea',
    zone: 'frontier',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 4 إلى 6 أيام عمل',
    estimatedDeliveryEn: '4 to 6 business days',
  },
  {
    governorateAr: 'الوادي الجديد',
    governorateEn: 'New Valley',
    zone: 'frontier',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 5 إلى 7 أيام عمل',
    estimatedDeliveryEn: '5 to 7 business days',
  },
  {
    governorateAr: 'جنوب سيناء',
    governorateEn: 'South Sinai',
    zone: 'frontier',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 4 إلى 6 أيام عمل',
    estimatedDeliveryEn: '4 to 6 business days',
  },
  {
    governorateAr: 'شمال سيناء',
    governorateEn: 'North Sinai',
    zone: 'frontier',
    baseFee: 85,
    estimatedDeliveryAr: 'خلال 5 إلى 7 أيام عمل',
    estimatedDeliveryEn: '5 to 7 business days',
  },
];

/**
 * Calculates shipping fee and delivery SLA based on governorate name and subtotal.
 */
export function calculateShippingFee(
  governorateName: string,
  subtotal: number
): {
  fee: number;
  isFree: boolean;
  estimatedDeliveryAr: string;
} {
  if (!governorateName) {
    return {
      fee: 0,
      isFree: false,
      estimatedDeliveryAr: 'يُحدد بعد اختيار المحافظة',
    };
  }

  const found = EGYPTIAN_GOVERNORATES.find(
    (g) => g.governorateAr === governorateName || g.governorateEn.toLowerCase() === governorateName.toLowerCase()
  );

  const baseFee = found ? found.baseFee : 60;
  const delivery = found ? found.estimatedDeliveryAr : 'خلال 2 إلى 4 أيام عمل';

  if (subtotal >= FREE_SHIPPING_THRESHOLD && subtotal > 0) {
    return {
      fee: 0,
      isFree: true,
      estimatedDeliveryAr: delivery,
    };
  }

  return {
    fee: baseFee,
    isFree: false,
    estimatedDeliveryAr: delivery,
  };
}
