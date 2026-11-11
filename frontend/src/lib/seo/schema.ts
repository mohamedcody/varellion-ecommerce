import { Product } from '@/types';
import { getBaseSiteUrl } from '@/lib/url';

export interface BreadcrumbItem {
  name: string;
  item?: string;
  url?: string;
}

/**
 * Organization Schema (Root Layout / Homepage)
 * Defines VARELLION brand identity, customer service, Egypt address, and WhatsApp contact.
 */
export function buildOrganizationSchema(baseUrl: string = getBaseSiteUrl()) {
  const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE || '+20 100 000 0000';
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/201000000000';

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${baseUrl}/#organization`,
    name: 'VARELLION',
    alternateName: 'فارليون',
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    description:
      'متجر VARELLION الرائد في الساعات الفاخرة، المصنوعات الجلدية الطبيعية 100%، وحاملات البطاقات والإكسسوارات الرجالية الراقية في مصر مع معاينة كاملة قبل الاستلام.',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: supportPhone,
      contactType: 'customer service',
      areaServed: 'EG',
      availableLanguage: ['Arabic', 'English'],
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'EG',
      addressLocality: 'Cairo',
    },
    sameAs: [whatsappUrl],
  };
}

/**
 * WebSite Schema with SearchAction (Root Layout / Homepage)
 * Supports sitelinks search and Google site name rich presentation.
 */
export function buildWebSiteSchema(baseUrl: string = getBaseSiteUrl()) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${baseUrl}/#website`,
    name: 'VARELLION',
    alternateName: 'فارليون',
    url: baseUrl,
    inLanguage: 'ar-EG',
    publisher: {
      '@id': `${baseUrl}/#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/products?search={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Combined Organization & WebSite Graph Schema
 */
export function buildRootGraphSchema(baseUrl: string = getBaseSiteUrl()) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      buildOrganizationSchema(baseUrl),
      buildWebSiteSchema(baseUrl),
    ],
  };
}

/**
 * Product & Offer Schema (Product Detail Page)
 * Includes EGP pricing, availability, brand, condition, and Egyptian shipping details.
 */
export function buildProductSchema(product: Product, baseUrl: string = getBaseSiteUrl()) {
  const encodedSlug = encodeURIComponent(product.slug);
  const validImages = (product.images || [])
    .map((img) => img?.imageUrl)
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0);
  const productImages = validImages.length > 0
    ? validImages
    : [`${baseUrl}/placeholder-product.jpg`];

  const inStock = product.availableStock !== undefined
    ? product.availableStock > 0
    : (product.stockQuantity || 0) > 0;

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${baseUrl}/products/${encodedSlug}/#product`,
    name: product.nameAr,
    alternateName: product.nameEn || undefined,
    description: product.descriptionAr,
    sku: product.sku,
    image: productImages,
    brand: {
      '@type': 'Brand',
      name: 'VARELLION',
    },
    category: product.category?.nameAr || 'ساعات ومصنوعات جلدية',
    offers: {
      '@type': 'Offer',
      url: `${baseUrl}/products/${encodedSlug}`,
      priceCurrency: 'EGP',
      price: product.price,
      priceValidUntil: '2027-12-31',
      itemCondition: 'https://schema.org/NewCondition',
      availability: inStock
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
      seller: {
        '@type': 'Organization',
        name: 'VARELLION',
      },
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingRate: {
          '@type': 'MonetaryAmount',
          value: 60,
          currency: 'EGP',
        },
        shippingDestination: {
          '@type': 'DefinedRegion',
          addressCountry: 'EG',
        },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: {
            '@type': 'QuantitativeValue',
            minValue: 0,
            maxValue: 1,
            unitCode: 'DAY',
          },
          transitTime: {
            '@type': 'QuantitativeValue',
            minValue: 1,
            maxValue: 3,
            unitCode: 'DAY',
          },
        },
      },
    },
  };
}

/**
 * BreadcrumbList Schema
 * Builds Schema.org breadcrumbs from array of items
 */
export function buildBreadcrumbSchema(items: { name: string; item?: string; url?: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((breadcrumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: breadcrumb.name,
      item: breadcrumb.item || breadcrumb.url || '',
    })),
  };
}
