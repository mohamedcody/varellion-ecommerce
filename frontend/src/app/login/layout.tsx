import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'تسجيل الدخول | VARELLION',
  description: 'سجّل الدخول إلى حسابك في متجر VARELLION لإدارة طلباتك وعناوين الشحن.',
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
