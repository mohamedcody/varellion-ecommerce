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
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border/80 bg-card transition-all duration-300 hover:border-primary/40 hover:shadow-md">
      {/* Clickable Area for Image and Details */}
      <Link
        href={`/products/${product.slug}`}
        className="flex flex-col focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-t-xl"
      >
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

          {/* Stock Badges Overlay */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
            {product.availableStock <= 0 ? (
              <Badge variant="outline" className="bg-background/90 text-rose-600 border-rose-200 text-[11px] font-bold">
                نفد من المخزون
              </Badge>
            ) : product.availableStock <= 5 ? (
              <Badge variant="outline" className="bg-background/90 text-amber-700 dark:text-amber-400 border-amber-300/50 text-[11px] font-bold">
                متبقي {product.availableStock} قطع فقط
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Content Section */}
        <div className="p-4 flex flex-col flex-1 gap-2">
          {/* Category & SKU */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold text-primary/80">
              {product.category?.nameAr || 'منتج أصلي'}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {product.sku}
            </span>
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
          <div className="mt-auto pt-2 flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-foreground">
                {product.price.toLocaleString('ar-EG')}
              </span>
              <span className="text-xs font-bold text-muted-foreground">ج.م</span>
            </div>

            {product.availableStock > 0 && (
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                جاهز للشحن
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
