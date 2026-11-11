import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Product } from '@/types';
import { getBaseSiteUrl } from '@/lib/url';
import { buildProductSchema, buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';
import { ProductDetailClient } from './ProductDetailClient';
import { getCachedProduct } from './getProduct';

export interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Next.js 15 Dynamic SEO, OpenGraph, and Twitter Metadata
 */
export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    return {
      title: 'المنتج غير متوفر | VARELLION',
      description: 'عذراً، المنتج المطلوب غير متوفر حالياً في متجر VARELLION.',
      robots: { index: false, follow: false },
    };
  }

  const baseUrl = getBaseSiteUrl();
  const canonicalUrl = `${baseUrl}/products/${encodeURIComponent(product.slug)}`;
  const mainImage =
    (product as any).primaryImage ||
    product.images?.find((img) => img.isMain)?.imageUrl ||
    product.images?.[0]?.imageUrl ||
    `${baseUrl}/placeholder-product.jpg`;

  const ogImages =
    product.images && product.images.length > 0
      ? product.images.map((img) => ({
          url: img.imageUrl,
          width: 800,
          height: 800,
          alt: img.altAr || product.nameAr,
        }))
      : [{ url: mainImage, width: 800, height: 800, alt: product.nameAr }];

  const title = `${product.nameAr} | VARELLION`;
  const description = product.descriptionAr;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: 'VARELLION',
      locale: 'ar_EG',
      type: 'website',
      images: ogImages,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [mainImage],
    },
  };
}

/**
 * Server-Side Rendered Product Detail Page
 */
export default async function ProductDetailPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    notFound();
  }

  const baseUrl = getBaseSiteUrl();
  const productUrl = `${baseUrl}/products/${encodeURIComponent(product.slug)}`;

  // Construct Structured Data Schemas
  const productSchema = buildProductSchema(product, baseUrl);
  const breadcrumbSchema = buildBreadcrumbSchema([
    { name: 'الرئيسية', item: baseUrl },
    { name: 'المنتجات', item: `${baseUrl}/products` },
    { name: product.nameAr, item: productUrl },
  ]);

  return (
    <>
      {/* Structured Data JSON-LD Schemas in initial SSR HTML */}
      <JsonLd data={productSchema} id="product-jsonld" />
      <JsonLd data={breadcrumbSchema} id="breadcrumb-jsonld" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10 max-w-6xl text-start">
        {/* Semantic Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-muted-foreground mb-8" aria-label="مسار التنقل">
          <Link href="/" className="hover:text-foreground transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition-colors">
            المنتجات
          </Link>
          <span>/</span>
          <span className="font-semibold text-foreground truncate max-w-xs">{product.nameAr}</span>
        </nav>

        {/* Client Interactive Component with complete initial SSR HTML */}
        <ProductDetailClient product={product} />
      </div>
    </>
  );
}
