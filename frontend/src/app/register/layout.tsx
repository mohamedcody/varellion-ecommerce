import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'إنشاء حساب جديد | VARELLION',
  description: 'أنشئ حسابك الجديد في متجر VARELLION لتجربة تسوق أسرع ومتابعة شحناتك.',
  robots: { index: false, follow: false },
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
