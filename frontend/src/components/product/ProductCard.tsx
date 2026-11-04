'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Check } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isAdded, setIsAdded] = useState(false);
  const { addItem } = useCart();

  const mainImage = product.images.find((img) => img.isMain) || product.images[0];
  const secondaryImage = product.images.find((img) => !img.isMain) || product.images[1];

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
      {/* Clickable Area for Image and Details */}
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-xl"
      >
        {/* Product Image Frame with Dual-Image Luxury Crossfade */}
        <div className="relative aspect-square w-full overflow-hidden bg-secondary/50">
          {mainImage?.imageUrl ? (
            <img
              src={mainImage.imageUrl}
              alt={mainImage.altAr || product.nameAr}
              loading="lazy"
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-secondary text-muted-foreground text-xs">
              لا توجد صورة
            </div>
          )}

          {/* Secondary Detail Image (Luxury Crossfade on Hover) */}
          {secondaryImage?.imageUrl && (
            <img
              src={secondaryImage.imageUrl}
              alt={secondaryImage.altAr || product.nameAr}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover object-center opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100"
            />
          )}

          {/* Stock Badges Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            {product.availableStock <= 0 ? (
              <Badge variant="outline" className="bg-card/95 text-rose-700 border-rose-200 text-[11px] font-bold shadow-xs">
                نفد من المخزون
              </Badge>
            ) : product.availableStock <= 5 ? (
              <Badge variant="outline" className="bg-[#FFF8E6] text-[#995B00] border-amber-300/60 text-[11px] font-bold shadow-xs">
                متبقي {product.availableStock} قطع فقط
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1 gap-2 text-start">
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
          <h3 className="font-bold text-base text-foreground leading-snug line-clamp-2 group-hover:text-[#876725] transition-colors">
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
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-[#EAF7EE] px-2 py-0.5 rounded-md border border-emerald-200/50">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>جاهز للشحن</span>
              </span>
            ) : (
              <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md">
                غير متوفر
              </span>
            )}
          </div>
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
              <ShoppingBag className="h-4 w-4 text-[#C5A059]" aria-hidden="true" />
              <span>أضف للسلة</span>
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
