import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names safely with Tailwind CSS conflict resolution.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formats a numeric amount as Egyptian Pounds (EGP).
 */
export function formatCurrency(amount: number, locale: 'ar' | 'en' = 'ar'): string {
  if (locale === 'ar') {
    return `${amount.toLocaleString('ar-EG')} ج.م`;
  }
  return `EGP ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
