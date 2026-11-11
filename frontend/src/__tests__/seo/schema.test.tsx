import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildRootGraphSchema,
  buildProductSchema,
  buildBreadcrumbSchema,
} from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { Product } from '@/types';

describe('JSON-LD Schema Builders (frontend/src/lib/seo/schema.ts)', () => {
  const customBaseUrl = 'https://varellion.com';

  const sampleProduct: Product = {
    id: 101,
    productId: 'prod-uuid-101',
    sku: 'VAR-W-001',
    slug: 'imperial-gold-chronograph',
    nameAr: 'ساعة إمبريال جولد كرونوغراف',
    nameEn: 'Imperial Gold Chronograph',
    descriptionAr: 'ساعة يد رجالية فاخرة بإطار من الستانلس ستيل 316L ومينا زرقاء ملكية مع زجاج ياقوتي مقاوم للخدش.',
    descriptionEn: 'Luxury mens chronograph with 316L stainless steel and sapphire glass.',
    price: 1850,
    costPrice: 900,
    stockQuantity: 12,
    availableStock: 12,
    lowStockThreshold: 3,
    isActive: true,
    isFeatured: true,
    category: {
      categoryId: 1,
      nameAr: 'ساعات فاخرة',
      nameEn: 'Luxury Watches',
      slug: 'watches',
    },
    images: [
      {
        imageId: 1,
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
        isMain: true,
        displayOrder: 1,
      },
      {
        imageId: 2,
        imageUrl: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
        isMain: false,
        displayOrder: 2,
      },
    ],
    createdAt: '2026-10-01T12:00:00Z',
    updatedAt: '2026-10-01T12:00:00Z',
  };

  describe('buildOrganizationSchema', () => {
    it('produces valid Organization schema with Egyptian context and branding', () => {
      const schema = buildOrganizationSchema(customBaseUrl);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Organization');
      expect(schema['@id']).toBe(`${customBaseUrl}/#organization`);
      expect(schema.name).toBe('VARELLION');
      expect(schema.alternateName).toBe('فارليون');
      expect(schema.url).toBe(customBaseUrl);
      expect(schema.logo).toBe(`${customBaseUrl}/favicon.ico`);
      expect(schema.description).toContain('VARELLION');

      // Contact point in Egypt
      expect(schema.contactPoint).toBeDefined();
      expect(schema.contactPoint['@type']).toBe('ContactPoint');
      expect(schema.contactPoint.areaServed).toBe('EG');
      expect(schema.contactPoint.availableLanguage).toContain('Arabic');

      // Cairo address
      expect(schema.address).toBeDefined();
      expect(schema.address['@type']).toBe('PostalAddress');
      expect(schema.address.addressCountry).toBe('EG');
      expect(schema.address.addressLocality).toBe('Cairo');
    });
  });

  describe('buildWebSiteSchema', () => {
    it('produces valid WebSite schema with inLanguage ar-EG and SearchAction', () => {
      const schema = buildWebSiteSchema(customBaseUrl);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('WebSite');
      expect(schema['@id']).toBe(`${customBaseUrl}/#website`);
      expect(schema.name).toBe('VARELLION');
      expect(schema.alternateName).toBe('فارليون');
      expect(schema.inLanguage).toBe('ar-EG');
      expect(schema.publisher).toEqual({ '@id': `${customBaseUrl}/#organization` });

      // Search Action target
      expect(schema.potentialAction).toBeDefined();
      expect(schema.potentialAction['@type']).toBe('SearchAction');
      expect(schema.potentialAction.target).toBeDefined();
      expect(schema.potentialAction.target['@type']).toBe('EntryPoint');
      expect(schema.potentialAction.target.urlTemplate).toContain(
        `${customBaseUrl}/products?search={search_term_string}`
      );
    });
  });

  describe('buildRootGraphSchema', () => {
    it('returns combined @graph containing both Organization and WebSite', () => {
      const graph = buildRootGraphSchema(customBaseUrl);

      expect(graph['@context']).toBe('https://schema.org');
      expect(Array.isArray(graph['@graph'])).toBe(true);
      expect(graph['@graph'].length).toBe(2);

      const types = graph['@graph'].map((item: any) => item['@type']);
      expect(types).toContain('Organization');
      expect(types).toContain('WebSite');
    });
  });

  describe('buildProductSchema', () => {
    it('produces valid Product and Offer schema with EGP currency and InStock status', () => {
      const schema = buildProductSchema(sampleProduct, customBaseUrl);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema['@id']).toBe(`${customBaseUrl}/products/${sampleProduct.slug}/#product`);
      expect(schema.name).toBe(sampleProduct.nameAr);
      expect(schema.alternateName).toBe(sampleProduct.nameEn);
      expect(schema.sku).toBe('VAR-W-001');
      expect(schema.brand).toEqual({ '@type': 'Brand', name: 'VARELLION' });
      expect(schema.image).toEqual([
        'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9',
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d',
      ]);

      // Offer details
      const offer = schema.offers;
      expect(offer['@type']).toBe('Offer');
      expect(offer.priceCurrency).toBe('EGP');
      expect(offer.price).toBe(1850);
      expect(offer.availability).toBe('https://schema.org/InStock');
      expect(offer.url).toBe(`${customBaseUrl}/products/${sampleProduct.slug}`);
      expect(offer.seller).toEqual({ '@type': 'Organization', name: 'VARELLION' });

      // Egyptian shipping details
      expect(offer.shippingDetails).toBeDefined();
      expect(offer.shippingDetails['@type']).toBe('OfferShippingDetails');
      expect(offer.shippingDetails.shippingDestination.addressCountry).toBe('EG');
      expect(offer.shippingDetails.shippingRate.currency).toBe('EGP');
    });

    it('sets OutOfStock status when availableStock is 0', () => {
      const outOfStockProduct: Product = {
        ...sampleProduct,
        availableStock: 0,
        stockQuantity: 0,
      };

      const schema = buildProductSchema(outOfStockProduct, customBaseUrl);
      expect(schema.offers.availability).toBe('https://schema.org/OutOfStock');
    });

    it('falls back to placeholder image when product has empty images array', () => {
      const noImageProduct: Product = {
        ...sampleProduct,
        images: [],
      };

      const schema = buildProductSchema(noImageProduct, customBaseUrl);
      expect(schema.image).toEqual([`${customBaseUrl}/placeholder-product.jpg`]);
    });
  });

  describe('buildBreadcrumbSchema', () => {
    it('produces BreadcrumbList schema with 1-based sequential positions', () => {
      const items = [
        { name: 'الرئيسية', item: 'https://varellion.com' },
        { name: 'المنتجات', item: 'https://varellion.com/products' },
        { name: 'ساعات فاخرة', url: 'https://varellion.com/products?category=watches' },
        { name: 'ساعة إمبريال', item: 'https://varellion.com/products/imperial-gold' },
      ];

      const schema = buildBreadcrumbSchema(items);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(4);

      expect(schema.itemListElement[0]).toEqual({
        '@type': 'ListItem',
        position: 1,
        name: 'الرئيسية',
        item: 'https://varellion.com',
      });

      expect(schema.itemListElement[1]).toEqual({
        '@type': 'ListItem',
        position: 2,
        name: 'المنتجات',
        item: 'https://varellion.com/products',
      });

      expect(schema.itemListElement[2]).toEqual({
        '@type': 'ListItem',
        position: 3,
        name: 'ساعات فاخرة',
        item: 'https://varellion.com/products?category=watches',
      });

      expect(schema.itemListElement[3]).toEqual({
        '@type': 'ListItem',
        position: 4,
        name: 'ساعة إمبريال',
        item: 'https://varellion.com/products/imperial-gold',
      });
    });
  });
});

describe('JsonLd React Component (frontend/src/components/seo/JsonLd.tsx)', () => {
  it('renders a script element with type="application/ld+json" and correct id', () => {
    const data = { '@context': 'https://schema.org', '@type': 'Organization', name: 'VARELLION' };
    const { container } = render(<JsonLd data={data} id="org-jsonld" />);

    const script = container.querySelector('script#org-jsonld');
    expect(script).not.toBeNull();
    expect(script?.getAttribute('type')).toBe('application/ld+json');

    const parsed = JSON.parse(script!.textContent || '{}');
    expect(parsed.name).toBe('VARELLION');
    expect(parsed['@type']).toBe('Organization');
  });

  it('escapes "<" characters to "\\u003c" to prevent XSS script injection vulnerabilities', () => {
    // Malicious payload trying to break out of script tag
    const maliciousPayload = {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: '</script><script>alert("XSS Attack!")</script>',
      description: '<img src=x onerror=alert(1)>',
    };

    const { container } = render(<JsonLd data={maliciousPayload} id="xss-test-jsonld" />);
    const script = container.querySelector('script#xss-test-jsonld');

    expect(script).not.toBeNull();
    const rawHtml = script!.innerHTML;

    // Verify raw HTML contains escaped unicode instead of literal <
    expect(rawHtml).not.toContain('</script><script>');
    expect(rawHtml).toContain('\\u003c/script\\u003e');
    expect(rawHtml).toContain('\\u003cimg');

    // JSON.parse must still correctly decode the original string
    const decoded = JSON.parse(script!.textContent || '{}');
    expect(decoded.name).toBe('</script><script>alert("XSS Attack!")</script>');
  });
});
