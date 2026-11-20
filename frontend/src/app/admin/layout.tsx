import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'لوحة إدارة الطلبات | VARELLION',
  description: 'لوحة الإدارة الداخلية لمتجر VARELLION.',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
