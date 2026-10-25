import type { Metadata } from 'next';
import '@/styles/globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'VARELLION — الفخامة الرجالية اليومية | الساعات والمصنوعات الجلدية',
  description:
    'متجر VARELLION الرائد في الساعات الفاخرة، المصنوعات الجلدية الطبيعية 100%، وحاملات البطاقات والإكسسوارات الرجالية الراقية في مصر. شحن لـ 27 محافظة مع معاينة قبل الاستلام.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <Header />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
