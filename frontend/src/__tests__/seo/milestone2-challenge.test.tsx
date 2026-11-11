import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

// Services and helpers
import { resolveApiBaseUrl, buildEndpointUrl, catalogService } from '@/services/api';
import { buildProductSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { Product } from '@/types';
import { mockProducts } from '@/data/mockProducts';

// Product Page components
import ProductDetailPage, { generateMetadata } from '@/app/products/[slug]/page';
import { getCachedProduct } from '@/app/products/[slug]/getProduct';
import { ProductDetailClient } from '@/app/products/[slug]/ProductDetailClient';
import * as CartContextModule from '@/context/CartContext';

// Mock next/navigation
const mockNotFound = vi.fn(() => {
  const err = new Error('NEXT_NOT_FOUND');
  (err as any).digest = 'NEXT_NOT_FOUND';
  throw err;
});

vi.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
  useRouter: () => ({ push: vi.fn() }),
}));

describe('Milestone 2 Empirical Stress-Test & Challenge Suite', () => {
  const sampleProduct: Product = {
    productId: 'test-watch-uuid-001',
    categoryId: 'cat-watches',
    slug: 'varellion-sovereign-gold',
    sku: 'VAR-W-SOV-01',
    nameAr: 'ساعة فارليون سوفرين جولد الفاخرة',
    nameEn: 'VARELLION Sovereign Gold Watch',
    descriptionAr: 'ساعة رجالية من الفولاذ 316L وزجاج ياقوتي ضد الخدش وماكينة يابانية كوارتز دقيقة.',
    descriptionEn: 'Luxury men watch crafted with 316L steel, sapphire crystal, and Japanese movement.',
    price: 2450,
    costPrice: 1200,
    stockQuantity: 10,
    reservedQuantity: 2,
    availableStock: 8,
    isActive: true,
    isFeatured: true,
    isBestSeller: true,
    category: {
      categoryId: 'cat-watches',
      nameAr: 'الساعات الفاخرة',
      nameEn: 'Luxury Watches',
      slug: 'watches',
      isActive: true,
    },
    images: [
      {
        imageId: 'img-1',
        imageUrl: 'https://images.unsplash.com/photo-watch-1.jpg',
        isMain: true,
        displayOrder: 1,
      },
      {
        imageId: 'img-2',
        imageUrl: 'https://images.unsplash.com/photo-watch-2.jpg',
        isMain: false,
        displayOrder: 2,
      },
    ],
    createdAt: '2026-11-01T12:00:00Z',
  };

  const sampleLeatherProduct: Product = {
    ...sampleProduct,
    productId: 'test-leather-uuid-002',
    slug: 'varellion-bifold-wallet',
    sku: 'VAR-L-WAL-01',
    nameAr: 'محفظة فارليون الجلدية الطبيعية',
    nameEn: 'VARELLION Genuine Leather Wallet',
    descriptionAr: 'محفظة من جلد البقر الطبيعي 100% بحماية RFID وخياطة يدوية متينة.',
    descriptionEn: '100% full-grain leather wallet with RFID protection.',
    category: {
      categoryId: 'cat-leather',
      nameAr: 'المحافظ والجلديات',
      nameEn: 'Leather Goods',
      slug: 'leather-goods',
      isActive: true,
    },
  };

  /* ==========================================================================
     1. API Base URL Resolution & Endpoint Building (api.ts)
     ========================================================================== */
  describe('1. API Base URL Resolution (resolveApiBaseUrl & buildEndpointUrl)', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
      delete process.env.INTERNAL_API_URL;
      delete process.env.BACKEND_URL;
      delete process.env.NEXT_PUBLIC_API_URL;
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    describe('Server-Side Resolution (typeof window === "undefined")', () => {
      const originalWindow = global.window;

      beforeEach(() => {
        // Simulate Node.js SSR runtime by making window undefined
        try {
          Object.defineProperty(global, 'window', {
            value: undefined,
            configurable: true,
            writable: true,
          });
        } catch {
          delete (global as any).window;
        }
      });

      afterEach(() => {
        try {
          Object.defineProperty(global, 'window', {
            value: originalWindow,
            configurable: true,
            writable: true,
          });
        } catch {
          (global as any).window = originalWindow;
        }
      });

      it('safely falls back to absolute localhost URL when NEXT_PUBLIC_API_URL is relative "/api" (preventing Node fetch crash)', () => {
        process.env.NEXT_PUBLIC_API_URL = '/api';
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('http://localhost:8080/api');
        expect(resolved.startsWith('http://')).toBe(true);
      });

      it('resolves absolute URL when NEXT_PUBLIC_API_URL is set to absolute URL', () => {
        process.env.NEXT_PUBLIC_API_URL = 'http://backend:8080/api';
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('http://backend:8080/api');
      });

      it('resolves default absolute URL when NEXT_PUBLIC_API_URL is unset', () => {
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('http://localhost:8080/api');
      });

      it('prioritizes INTERNAL_API_URL over NEXT_PUBLIC_API_URL on the server', () => {
        process.env.INTERNAL_API_URL = 'http://docker-backend:8080/api';
        process.env.NEXT_PUBLIC_API_URL = 'https://varellion.com/api';
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('http://docker-backend:8080/api');
      });

      it('prioritizes BACKEND_URL when INTERNAL_API_URL is unset', () => {
        process.env.BACKEND_URL = 'http://internal-service:8080/api';
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('http://internal-service:8080/api');
      });

      it('strips trailing slashes from internal and public URLs', () => {
        process.env.INTERNAL_API_URL = 'http://backend:8080/api///';
        expect(resolveApiBaseUrl()).toBe('http://backend:8080/api');

        delete process.env.INTERNAL_API_URL;
        process.env.NEXT_PUBLIC_API_URL = 'https://api.varellion.com/api//';
        expect(resolveApiBaseUrl()).toBe('https://api.varellion.com/api');
      });
    });

    describe('Browser Client-Side Resolution (typeof window !== "undefined")', () => {
      it('preserves relative "/api" in the browser for Next.js proxying', () => {
        process.env.NEXT_PUBLIC_API_URL = '/api';
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('/api');
      });

      it('resolves absolute URL when NEXT_PUBLIC_API_URL is absolute in browser', () => {
        process.env.NEXT_PUBLIC_API_URL = 'http://backend:8080/api';
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('http://backend:8080/api');
      });

      it('resolves fallback when NEXT_PUBLIC_API_URL is unset in browser', () => {
        const resolved = resolveApiBaseUrl();
        expect(resolved).toBe('http://localhost:8080/api');
      });
    });

    describe('buildEndpointUrl URL segment deduplication', () => {
      it('prevents duplicate /api segments when baseUrl ends with /api and endpoint starts with /api/', () => {
        process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080/api';
        const url = buildEndpointUrl('/api/products/sample-slug');
        expect(url).toBe('http://localhost:8080/api/products/sample-slug');
        expect(url).not.toContain('/api/api/');
      });

      it('handles endpoint without leading slash', () => {
        process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080/api';
        const url = buildEndpointUrl('products');
        expect(url).toBe('http://localhost:8080/api/products');
      });

      it('handles relative /api baseUrl without duplicating /api segment', () => {
        process.env.NEXT_PUBLIC_API_URL = '/api';
        const url = buildEndpointUrl('/api/categories');
        expect(url).toBe('/api/categories');
        expect(url).not.toBe('/api/api/categories');
      });
    });
  });

  /* ==========================================================================
     2. Server Component Verification (page.tsx)
     ========================================================================== */
  describe('2. Product Detail Page Server Component (app/products/[slug]/page.tsx)', () => {
    it('is a pure Server Component without "use client" directive in source code', () => {
      const pagePath = path.resolve(process.cwd(), 'frontend/src/app/products/[slug]/page.tsx');
      const fallbackPath = path.resolve(process.cwd(), 'src/app/products/[slug]/page.tsx');
      const filePath = fs.existsSync(pagePath) ? pagePath : fallbackPath;

      expect(fs.existsSync(filePath)).toBe(true);
      const content = fs.readFileSync(filePath, 'utf-8');

      // Must NOT contain 'use client' or "use client"
      expect(content).not.toMatch(/^\s*['"]use client['"]/m);
      expect(content).toContain('export default async function ProductDetailPage');
      expect(content).toContain('generateMetadata');
    });

    it('generates rich dynamic SEO metadata with canonical, OpenGraph, and Twitter tags', async () => {
      vi.spyOn(catalogService, 'getProductBySlug').mockResolvedValue(sampleProduct);

      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: sampleProduct.slug }),
      });

      expect(metadata.title).toBe(`${sampleProduct.nameAr} | VARELLION`);
      expect(metadata.description).toBe(sampleProduct.descriptionAr);
      expect(metadata.alternates?.canonical).toBe(
        `https://varellion.com/products/${encodeURIComponent(sampleProduct.slug)}`
      );

      // OpenGraph verification
      expect(metadata.openGraph?.title).toBe(`${sampleProduct.nameAr} | VARELLION`);
      expect(metadata.openGraph?.description).toBe(sampleProduct.descriptionAr);
      expect(metadata.openGraph?.url).toBe(
        `https://varellion.com/products/${encodeURIComponent(sampleProduct.slug)}`
      );
      expect(metadata.openGraph?.siteName).toBe('VARELLION');
      expect(metadata.openGraph?.locale).toBe('ar_EG');

      // Twitter card verification
      expect(metadata.twitter?.card).toBe('summary_large_image');
      expect(metadata.twitter?.title).toBe(`${sampleProduct.nameAr} | VARELLION`);
    });

    it('returns no-index fallback metadata when product is not found', async () => {
      vi.spyOn(catalogService, 'getProductBySlug').mockResolvedValue(null);

      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: 'non-existent-slug' }),
      });

      expect(metadata.title).toContain('المنتج غير متوفر');
      expect(metadata.description).toContain('غير متوفر');
      expect(metadata.robots).toEqual({ index: false, follow: false });
    });

    it('invokes notFound() when product does not exist in database', async () => {
      vi.spyOn(catalogService, 'getProductBySlug').mockResolvedValue(null);
      mockNotFound.mockClear();

      await expect(
        ProductDetailPage({
          params: Promise.resolve({ slug: 'missing-product-uuid' }),
        })
      ).rejects.toThrow('NEXT_NOT_FOUND');

      expect(mockNotFound).toHaveBeenCalledTimes(1);
    });

    it('renders complete initial SSR HTML containing product content without skeleton placeholders', async () => {
      vi.spyOn(catalogService, 'getProductBySlug').mockResolvedValue(sampleProduct);

      const mockCart = {
        items: [],
        isCartOpen: false,
        totalItems: 0,
        subtotal: 0,
        toastMessage: null,
        addItem: vi.fn(),
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        openCart: vi.fn(),
        closeCart: vi.fn(),
        toggleCart: vi.fn(),
        clearToast: vi.fn(),
      };
      vi.spyOn(CartContextModule, 'useCart').mockReturnValue(mockCart);

      const element = await ProductDetailPage({
        params: Promise.resolve({ slug: sampleProduct.slug }),
      });

      const { container } = render(element);

      // Verify Product Title, Price, Description
      expect(screen.getAllByText(sampleProduct.nameAr).length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText(/2,450|٢٬٤٥٠/)).toBeDefined();
      expect(screen.getByText(sampleProduct.descriptionAr)).toBeDefined();

      // Verify Specifications Table is present in initial HTML
      expect(screen.getByText('المواصفات الفنية والحرفية المعتمدة:')).toBeDefined();
      expect(screen.getByText('نوع الماكينة والحركة')).toBeDefined();
      expect(screen.getByText('كوارتز يابانية دقيقة (Miyota Precision Quartz)')).toBeDefined();
      expect(screen.getByText('فولاذ مقاوم للصدأ 316L فائق الصلابة (316L Stainless Steel)')).toBeDefined();

      // Verify Inspection and Trust Guarantees banner in initial HTML
      expect(screen.getByText('معاينة وفحص قبل الاستلام')).toBeDefined();
      expect(screen.getByText('توصيل سريع لكافة الـ 27 محافظة مصرية')).toBeDefined();
      expect(screen.getByText('ضمان استبدال واسترجاع 14 يوماً')).toBeDefined();

      // Verify Breadcrumbs
      const breadcrumbNav = container.querySelector('nav[aria-label="مسار التنقل"]');
      expect(breadcrumbNav).not.toBeNull();
      expect(breadcrumbNav?.textContent).toContain('الرئيسية');
      expect(breadcrumbNav?.textContent).toContain('المنتجات');
      expect(breadcrumbNav?.textContent).toContain(sampleProduct.nameAr);

      // Verify JSON-LD scripts are embedded in SSR HTML
      const productJsonLd = container.querySelector('script#product-jsonld');
      const breadcrumbJsonLd = container.querySelector('script#breadcrumb-jsonld');
      expect(productJsonLd).not.toBeNull();
      expect(breadcrumbJsonLd).not.toBeNull();

      // Verify no skeleton placeholders
      expect(container.querySelectorAll('.animate-pulse.bg-muted').length).toBe(0);
    });

    it('renders leather craftsmanship specifications when product is leather goods', async () => {
      vi.spyOn(catalogService, 'getProductBySlug').mockResolvedValue(sampleLeatherProduct);

      const mockCart = {
        items: [],
        isCartOpen: false,
        totalItems: 0,
        subtotal: 0,
        toastMessage: null,
        addItem: vi.fn(),
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        openCart: vi.fn(),
        closeCart: vi.fn(),
        toggleCart: vi.fn(),
        clearToast: vi.fn(),
      };
      vi.spyOn(CartContextModule, 'useCart').mockReturnValue(mockCart);

      const element = await ProductDetailPage({
        params: Promise.resolve({ slug: sampleLeatherProduct.slug }),
      });

      render(element);

      expect(screen.getByText('نوع وخامة الجلد')).toBeDefined();
      expect(screen.getByText('جلد طبيعي 100% مدبوغ نباتياً (100% Genuine Full-Grain Leather)')).toBeDefined();
      expect(screen.getByText('حماية RFID مدمجة لمنع سرقة البطاقات والبيانات')).toBeDefined();
    });
  });

  /* ==========================================================================
     3. Client Component Interactivity (ProductDetailClient.tsx)
     ========================================================================== */
  describe('3. ProductDetailClient Component Interactivity', () => {
    const mockAddItem = vi.fn();
    const mockOpenCart = vi.fn();

    beforeEach(() => {
      vi.clearAllMocks();
      vi.useFakeTimers();

      vi.spyOn(CartContextModule, 'useCart').mockReturnValue({
        items: [],
        isCartOpen: false,
        totalItems: 0,
        subtotal: 0,
        toastMessage: null,
        addItem: mockAddItem,
        removeItem: vi.fn(),
        updateQuantity: vi.fn(),
        clearCart: vi.fn(),
        openCart: mockOpenCart,
        closeCart: vi.fn(),
        toggleCart: vi.fn(),
        clearToast: vi.fn(),
      });
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('satisfies the ProductDetailClientProps interface { product: Product }', () => {
      const { container } = render(<ProductDetailClient product={sampleProduct} />);
      expect(container.querySelector('h1')?.textContent).toBe(sampleProduct.nameAr);
    });

    it('updates selectedImage state and aria-pressed when gallery thumbnail is clicked', () => {
      const { container } = render(<ProductDetailClient product={sampleProduct} />);

      const mainImg = container.querySelector('.relative.aspect-square img') as HTMLImageElement;
      expect(mainImg.src).toBe(sampleProduct.images[0].imageUrl);

      const thumbnails = container.querySelectorAll('button[aria-label^="عرض صورة رقم"]');
      expect(thumbnails.length).toBe(2);

      // Click second thumbnail
      fireEvent.click(thumbnails[1]);

      const updatedMainImg = container.querySelector('.relative.aspect-square img') as HTMLImageElement;
      expect(updatedMainImg.src).toBe(sampleProduct.images[1].imageUrl);
      expect(thumbnails[1].getAttribute('aria-pressed')).toBe('true');
      expect(thumbnails[0].getAttribute('aria-pressed')).toBe('false');
    });

    it('increments quantity bounded by availableStock and decrements bounded by minimum 1', () => {
      render(<ProductDetailClient product={sampleProduct} />);

      const incrementBtn = screen.getByRole('button', { name: 'زيادة الكمية' });
      const decrementBtn = screen.getByRole('button', { name: 'تقليل الكمية' });

      // Initially quantity = 1, decrement is disabled
      expect(decrementBtn.hasAttribute('disabled')).toBe(true);

      // Click increment
      fireEvent.click(incrementBtn);
      expect(screen.getByText('2')).toBeDefined();
      expect(decrementBtn.hasAttribute('disabled')).toBe(false);

      // Increment up to availableStock (8)
      for (let i = 2; i < sampleProduct.availableStock; i++) {
        fireEvent.click(incrementBtn);
      }
      expect(screen.getByText('8')).toBeDefined();
      expect(incrementBtn.hasAttribute('disabled')).toBe(true);

      // Further click does not exceed availableStock
      fireEvent.click(incrementBtn);
      expect(screen.getByText('8')).toBeDefined();

      // Decrement back down to 1
      for (let i = 8; i > 1; i--) {
        fireEvent.click(decrementBtn);
      }
      expect(screen.getByText('1')).toBeDefined();
      expect(decrementBtn.hasAttribute('disabled')).toBe(true);

      // Decrement does not drop below 1
      fireEvent.click(decrementBtn);
      expect(screen.getByText('1')).toBeDefined();
    });

    it('triggers useCart().addItem and displays visual confirmation for 2200ms', () => {
      render(<ProductDetailClient product={sampleProduct} />);

      const addToCartBtn = screen.getByRole('button', { name: 'أضف إلى سلة المشتريات' });
      expect(addToCartBtn).toBeDefined();

      // Click Add to Cart
      fireEvent.click(addToCartBtn);

      // Verify cart context was invoked
      expect(mockAddItem).toHaveBeenCalledWith(sampleProduct, 1);

      // Verify visual confirmation state
      expect(screen.getByText('تمت الإضافة إلى السلة ✓')).toBeDefined();

      // Advance timer by 2199ms: confirmation still visible
      act(() => {
        vi.advanceTimersByTime(2199);
      });
      expect(screen.getByText('تمت الإضافة إلى السلة ✓')).toBeDefined();

      // Advance past 2200ms: confirmation resets
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(screen.getByText('أضف إلى سلة المشتريات')).toBeDefined();
    });

    it('triggers useCart().addItem and useCart().openCart when Review Order button is clicked', () => {
      render(<ProductDetailClient product={sampleProduct} />);

      const fastBuyBtn = screen.getByRole('button', { name: 'عرض السلة ومراجعة الطلب' });
      fireEvent.click(fastBuyBtn);

      expect(mockAddItem).toHaveBeenCalledWith(sampleProduct, 1);
      expect(mockOpenCart).toHaveBeenCalledTimes(1);
    });

    it('disables purchase actions when product is out of stock', () => {
      const outOfStockProduct: Product = {
        ...sampleProduct,
        stockQuantity: 0,
        availableStock: 0,
      };

      const { container } = render(<ProductDetailClient product={outOfStockProduct} />);

      const addToCartBtn = screen.getByRole('button', { name: 'أضف إلى سلة المشتريات' });
      const fastBuyBtn = screen.getByRole('button', { name: 'عرض السلة ومراجعة الطلب' });

      expect(addToCartBtn.hasAttribute('disabled')).toBe(true);
      expect(fastBuyBtn.hasAttribute('disabled')).toBe(true);
      expect(screen.getByText('غير متوفر حالياً')).toBeDefined();
      expect(container.textContent).toContain('نفد من المخزون');
    });
  });

  /* ==========================================================================
     4. JSON-LD Structured Data Schema Verification
     ========================================================================== */
  describe('4. JSON-LD Schemas (Product, Offers, BreadcrumbList)', () => {
    it('produces valid Schema.org Product schema with required properties and Egyptian currency', () => {
      const schema = buildProductSchema(sampleProduct, 'https://varellion.com');

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('Product');
      expect(schema['@id']).toBe('https://varellion.com/products/varellion-sovereign-gold/#product');
      expect(schema.name).toBe(sampleProduct.nameAr);
      expect(schema.alternateName).toBe(sampleProduct.nameEn);
      expect(schema.description).toBe(sampleProduct.descriptionAr);
      expect(schema.sku).toBe('VAR-W-SOV-01');
      expect(schema.brand).toEqual({ '@type': 'Brand', name: 'VARELLION' });
      expect(schema.image).toEqual([
        'https://images.unsplash.com/photo-watch-1.jpg',
        'https://images.unsplash.com/photo-watch-2.jpg',
      ]);

      // Offers & Pricing
      const offer = schema.offers;
      expect(offer['@type']).toBe('Offer');
      expect(offer.priceCurrency).toBe('EGP');
      expect(offer.price).toBe(2450);
      expect(offer.availability).toBe('https://schema.org/InStock');
      expect(offer.seller).toEqual({ '@type': 'Organization', name: 'VARELLION' });

      // Egyptian Shipping Details
      expect(offer.shippingDetails.shippingDestination.addressCountry).toBe('EG');
      expect(offer.shippingDetails.shippingRate.currency).toBe('EGP');
      expect(offer.shippingDetails.shippingRate.value).toBe(60);
    });

    it('produces valid Schema.org BreadcrumbList with 1-based index and valid URLs', () => {
      const breadcrumbItems = [
        { name: 'الرئيسية', item: 'https://varellion.com' },
        { name: 'المنتجات', item: 'https://varellion.com/products' },
        { name: sampleProduct.nameAr, item: `https://varellion.com/products/${sampleProduct.slug}` },
      ];

      const schema = buildBreadcrumbSchema(breadcrumbItems);

      expect(schema['@context']).toBe('https://schema.org');
      expect(schema['@type']).toBe('BreadcrumbList');
      expect(schema.itemListElement).toHaveLength(3);

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
        name: sampleProduct.nameAr,
        item: `https://varellion.com/products/${sampleProduct.slug}`,
      });
    });

    it('safely escapes special characters in JsonLd component to prevent XSS vulnerability', () => {
      const xssData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: '<script>alert("xss")</script>',
      };

      const { container } = render(<JsonLd data={xssData} id="xss-test" />);
      const script = container.querySelector('script#xss-test');
      expect(script).not.toBeNull();
      expect(script?.innerHTML).not.toContain('<script>');
      expect(script?.innerHTML).toContain('\\u003cscript\\u003e');
    });
  });
});
