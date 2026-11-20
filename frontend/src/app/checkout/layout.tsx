import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إتمام الطلب والدفع | VARELLION',
  description: 'أكمل طلبك في متجر VARELLION مع خدمة الدفع عند الاستلام والمعاينة الكاملة قبل الاستلام.',
  robots: { index: false, follow: false },
};

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
