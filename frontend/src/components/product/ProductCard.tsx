'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const { addItem } = useCart();

  const availableImages = product.images?.filter((img) => Boolean(img?.imageUrl)) || [];
  const hasMultipleImages = availableImages.length > 1;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || !hasMultipleImages) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;

    // Minimum swipe threshold (40px)
    if (Math.abs(diff) > 40) {
      if (diff > 0) {
        // Swipe forward (in RTL, swiping left is next image)
        setActiveImageIndex((prev) => (prev + 1) % availableImages.length);
      } else {
        // Swipe backward
        setActiveImageIndex((prev) => (prev - 1 + availableImages.length) % availableImages.length);
      }
    }
    setTouchStartX(null);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.availableStock <= 0) return;

    addItem(product, 1);
    setIsAdded(true);
    if (onAddToCart) {
      onAddToCart(product);
    }
    setTimeout(() => setIsAdded(false), 2200);
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-card shadow-xs transition-all duration-300 hover:border-ivory-300 hover:shadow-md">
      {/* Product Image Frame with Dual-Image Luxury Crossfade & Mobile Gestures (UX-F08) */}
      <div
        className="relative aspect-square w-full overflow-hidden bg-secondary/50 select-none rounded-t-xl"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Clickable Image Layer Linking to Product Details */}
        <Link
          href={`/products/${product.slug}`}
          className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          aria-label={`عرض تفاصيل ${product.nameAr}`}
        >
          {availableImages.length > 0 ? (
            availableImages.map((img, idx) => {
              const isCurrent = activeImageIndex === idx;
              const isSecondaryHover = activeImageIndex === 0 && idx === 1;

              return (
                <img
                  key={img.imageId || idx}
                  src={img.imageUrl}
                  alt={img.altAr || product.nameAr}
                  loading={idx === 0 ? 'lazy' : 'lazy'}
                  className={cn(
                    'absolute inset-0 h-full w-full object-cover object-center transition-all duration-500 ease-out',
                    isCurrent
                      ? 'opacity-100 z-1 scale-100 group-hover:scale-105'
                      : isSecondaryHover
                      ? 'opacity-0 group-hover:opacity-100 z-2 group-hover:scale-105'
                      : 'opacity-0 z-0'
                  )}
                />
              );
            })
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground text-xs">
              لا توجد صورة
            </div>
          )}
        </Link>

        {/* Mobile Dot Indicators for Multi-Image Preview (Positioned as Sibling, Not Nested Inside Link) */}
        {hasMultipleImages && (
          <div
            className="absolute bottom-2.5 inset-x-0 flex items-center justify-center gap-2 z-10 pointer-events-auto"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            {availableImages.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setActiveImageIndex(idx);
                }}
                className={cn(
                  'relative h-1.5 rounded-full transition-all duration-300 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 p-0',
                  'before:absolute before:-inset-2 before:content-[""]', // WCAG 2.5.8 Target size >= 24px
                  activeImageIndex === idx
                    ? 'w-4 bg-gold-500'
                    : 'w-1.5 bg-white/75 hover:bg-white'
                )}
                aria-label={`عرض صورة ${idx + 1} من ${availableImages.length} لـ ${product.nameAr}`}
                aria-current={activeImageIndex === idx}
              />
            ))}
          </div>
        )}

        {/* Stock Badges Overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10 pointer-events-none">
          {product.availableStock <= 0 ? (
            <Badge variant="outline" className="bg-card/95 text-rose-700 border-rose-200 text-[11px] font-bold shadow-xs">
              نفد من المخزون
            </Badge>
          ) : product.availableStock <= 5 ? (
            <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300/60 text-[11px] font-bold shadow-xs">
              متبقي {product.availableStock} قطع فقط
            </Badge>
          ) : null}
        </div>
      </div>

      {/* Clickable Content Section */}
      <Link
        href={`/products/${product.slug}`}
        className="p-4 flex flex-col flex-1 gap-2 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label={`تفاصيل ${product.nameAr}`}
      >
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/80 tracking-wide">
              {product.category?.nameAr || 'منتج أصلي'}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {product.sku}
            </span>
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 group-hover:text-gold-700 transition-colors">
            {product.nameAr}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.descriptionAr}
          </p>

          {/* Price Block */}
          <div className="mt-auto pt-3 flex items-baseline justify-between border-t border-border/60">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-black text-foreground tabular-nums">
                {product.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-muted-foreground">ج.م</span>
            </div>

            {product.availableStock > 0 ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>جاهز للشحن</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                غير متوفر
              </span>
            )}
          </div>
        </Link>

      {/* Action Footer (Quick Add to Cart) */}
      <div className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={product.availableStock <= 0}
          variant={isAdded ? 'secondary' : 'luxury'}
          size="default"
          className="w-full gap-2 transition-all min-h-[44px]"
          aria-label={`إضافة ${product.nameAr} إلى سلة المشتريات`}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4 text-emerald-700" aria-hidden="true" />
              <span className="font-bold text-emerald-800">تمت الإضافة للسلة</span>
            </>
          ) : product.availableStock <= 0 ? (
            <span className="text-muted-foreground">نفد من المخزون</span>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4 text-gold-500" aria-hidden="true" />
              <span>أضف للسلة</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
