import type { Metadata } from 'next';
import '@/styles/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { CartToast } from '@/components/cart/CartToast';
import { UtmTracker } from '@/components/providers/UtmTracker';
import { getBaseSiteUrl } from '@/lib/url';
import { JsonLd } from '@/components/seo/JsonLd';
import { buildOrganizationSchema, buildWebSiteSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
  metadataBase: new URL(getBaseSiteUrl()),
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
  const organizationSchema = buildOrganizationSchema();
  const webSiteSchema = buildWebSiteSchema();

  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800;900&family=Tajawal:wght@400;500;700;800&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={organizationSchema} id="organization-schema" />
        <JsonLd data={webSiteSchema} id="website-schema" />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-[#C5A059]/25 selection:text-[#876725]">
        {/* WCAG 2.4.1 Accessible Skip to Main Content Link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2.5 focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-ring"
        >
          الانتقال إلى المحتوى الرئيسي
        </a>

        <AuthProvider>
          <CartProvider>
            <UtmTracker />
            <Header />
            <main id="main-content" className="flex-1 scroll-mt-24 focus:outline-none" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <CartDrawer />
            <CartToast />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
