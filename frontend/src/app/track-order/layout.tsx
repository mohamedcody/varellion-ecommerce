import type { Metadata } from 'next';
import { getBaseSiteUrl } from '@/lib/url';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';

const baseUrl = getBaseSiteUrl();
const canonicalUrl = `${baseUrl}/track-order`;

export const metadata: Metadata = {
  title: 'تتبع شحنتك وطلبك | VARELLION',
  description:
    'استعلم عن حالة طلبك وموعد توصيل شحنتك في جميع محافظات مصر باستخدام رقم الطلب ورقم الموبايل المسجل في متجر VARELLION.',
  alternates: {
    canonical: canonicalUrl,
  },
  openGraph: {
    title: 'تتبع شحنتك وطلبك | VARELLION',
    description:
      'استعلم عن حالة طلبك وموعد توصيل شحنتك في جميع محافظات مصر باستخدام رقم الطلب ورقم الموبايل المسجل.',
    url: canonicalUrl,
    siteName: 'VARELLION',
    locale: 'ar_EG',
    type: 'website',
    images: [{ url: `${baseUrl}/og-default.png`, width: 1200, height: 630, alt: 'تتبع طلبك في VARELLION' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'تتبع شحنتك وطلبك | VARELLION',
    description: 'تتبع شحنتك في 27 محافظة مصرية مع متجر VARELLION.',
    images: [`${baseUrl}/og-default.png`],
  },
};

export default function TrackOrderLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'الرئيسية', item: baseUrl },
    { name: 'تتبع حالة الشحنة', item: canonicalUrl },
  ]);

  return (
    <>
      <JsonLd data={breadcrumbSchema} id="track-order-breadcrumbs-schema" />
      {children}
    </>
  );
}
