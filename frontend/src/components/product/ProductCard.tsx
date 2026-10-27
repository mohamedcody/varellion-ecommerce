'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Star, Check, Sparkles } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const mainImage = product.images.find((img) => img.isMain) || product.images[0];
  const discountPercent =
    product.previousPrice && product.previousPrice > product.price
      ? Math.round(((product.previousPrice - product.price) / product.previousPrice) * 100)
      : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding || product.availableStock <= 0) return;

    setIsAdding(true);
    setTimeout(() => {
      setIsAdding(false);
      setIsAdded(true);
      if (onAddToCart) {
        onAddToCart(product);
      }
      setTimeout(() => setIsAdded(false), 2200);
    }, 400);
  };

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
      {/* Clickable Area for Image and Details */}
      <Link href={`/products/${product.slug}`} className="flex flex-col focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-xl">
        {/* Product Image Frame */}
        <div className="relative aspect-square w-full overflow-hidden bg-muted/30">
          {mainImage?.imageUrl ? (
            <img
              src={mainImage.imageUrl}
              alt={mainImage.altAr || product.nameAr}
              loading="lazy"
              className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              لا توجد صورة
            </div>
          )}

          {/* Badges Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            {product.badge && (
              <Badge variant="luxury" className="shadow-xs backdrop-blur-xs font-bold text-[11px]">
                {product.badge}
              </Badge>
            )}
            {discountPercent && (
              <Badge variant="gold" className="shadow-xs font-black text-[11px]">
                خصم {discountPercent}%
              </Badge>
            )}
          </div>

          {/* Low Stock Warning */}
          {product.availableStock > 0 && product.availableStock <= 5 && (
            <div className="absolute bottom-2.5 right-2.5 z-10 rounded-md bg-background/90 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400 backdrop-blur-xs border border-amber-200/50 shadow-xs">
              متبقي {product.availableStock} قطع فقط
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          {/* Rating & Category */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-medium text-primary/80">
              {product.category?.nameAr || 'إصدار فاخر'}
            </span>
            {product.rating && (
              <div className="flex items-center gap-1 font-bold text-foreground">
                <Star className="h-3.5 w-3.5 fill-[#C5A059] text-[#C5A059]" aria-hidden="true" />
                <span>{product.rating.toFixed(1)}</span>
                {product.reviewCount && (
                  <span className="text-muted-foreground text-[10px]">({product.reviewCount})</span>
                )}
              </div>
            )}
          </div>

          {/* Product Title */}
          <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
            {product.nameAr}
          </h3>

          {/* Short Description */}
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {product.descriptionAr}
          </p>

          {/* Price Block */}
          <div className="mt-auto pt-2 flex items-baseline gap-2">
            <span className="text-lg font-black text-foreground">
              {product.price.toLocaleString('ar-EG')} <span className="text-xs font-bold">ج.م</span>
            </span>
            {product.previousPrice && (
              <span className="text-xs text-muted-foreground line-through">
                {product.previousPrice.toLocaleString('ar-EG')} ج.م
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action Footer (Quick Add to Cart) */}
      <div className="p-4 pt-0">
        <Button
          onClick={handleAddToCart}
          disabled={product.availableStock <= 0 || isAdding}
          variant={isAdded ? 'secondary' : 'default'}
          size="default"
          className="w-full gap-2 transition-all min-h-[44px]"
          aria-label={`إضافة ${product.nameAr} إلى سلة المشتريات`}
        >
          {isAdded ? (
            <>
              <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <span className="font-bold text-emerald-700 dark:text-emerald-400">تمت الإضافة للسلة</span>
            </>
          ) : isAdding ? (
            <span>جاري الإضافة...</span>
          ) : product.availableStock <= 0 ? (
            <span className="text-muted-foreground">نفد من المخزون</span>
          ) : (
            <>
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>أضف للسلة</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
