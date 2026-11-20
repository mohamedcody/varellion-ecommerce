import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'حسابي وطلباتي | VARELLION',
  description: 'إدارة بياناتك الشخصية، عناوين التوصيل، وسجل طلباتك في متجر VARELLION.',
  robots: { index: false, follow: false },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
