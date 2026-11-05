'use client';

import React from 'react';
import Image from 'next/image';
import { CartItem } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ShieldCheck, Truck, Package, Sparkles } from 'lucide-react';
import { FREE_SHIPPING_THRESHOLD } from '@/data/shippingZones';

interface OrderSummaryCardProps {
  items: CartItem[];
  subtotal: number;
  shippingFee: number;
  isShippingFree: boolean;
  governorateName: string;
  estimatedDelivery: string;
  total: number;
}

export function OrderSummaryCard({
  items,
  subtotal,
  shippingFee,
  isShippingFree,
  governorateName,
  estimatedDelivery,
  total,
}: OrderSummaryCardProps) {
  const amountForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const freeShippingProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <Card className="border border-border/80 bg-card/95 backdrop-blur-xs shadow-md overflow-hidden text-start sticky top-24">
      <CardHeader className="border-b border-border/50 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>ملخص طلبك</span>
          </CardTitle>
          <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {items.reduce((acc, it) => acc + it.quantity, 0)} قطع
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-4">
        {/* 1. Items List (Scrollable if many items) */}
        <div className="max-h-[260px] overflow-y-auto space-y-3.5 pr-1 divide-y divide-border/40">
          {items.map((item) => (
            <div key={item.cartItemId} className="pt-3 first:pt-0 flex items-center gap-3">
              {/* Product Thumbnail */}
              <div className="relative h-14 w-14 shrink-0 rounded-lg overflow-hidden border border-border/60 bg-muted">
                {item.product.images?.[0]?.imageUrl ? (
                  <Image
                    src={item.product.images[0].imageUrl}
                    alt={item.product.nameAr}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground font-bold">
                    VARELLION
                  </div>
                )}
                <span className="absolute bottom-0 right-0 bg-foreground/90 text-background text-[10px] font-black px-1.5 py-0.2 rounded-tl">
                  ×{item.quantity}
                </span>
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-foreground truncate" title={item.product.nameAr}>
                  {item.product.nameAr}
                </h4>
                <p className="text-[10px] font-mono text-muted-foreground">
                  كود: {item.product.sku}
                </p>
                <div className="text-xs font-black text-foreground mt-0.5">
                  {(item.product.price * item.quantity).toLocaleString('ar-EG')}{' '}
                  <span className="text-[10px] font-normal text-muted-foreground">ج.م</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 2. Free Shipping Progress Bar */}
        <div className="rounded-xl bg-muted/40 p-3 border border-border/40 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              {isShippingFree ? (
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  تهانينا! حصلت على شحن مجاني
                </span>
              ) : (
                <span>
                  أضف بـ{' '}
                  <strong className="text-primary font-bold">
                    {amountForFreeShipping.toLocaleString('ar-EG')} ج.م
                  </strong>{' '}
                  واحصل على شحن مجاني
                </span>
              )}
            </span>
          </div>

          <div
            className="w-full h-1.5 rounded-full bg-border/60 overflow-hidden"
            role="progressbar"
            aria-valuenow={Math.round(freeShippingProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full bg-primary transition-[width] duration-300 rounded-full"
              style={{ width: `${freeShippingProgress}%` }}
            />
          </div>
        </div>

        {/* 3. Financial Breakdown */}
        <div className="space-y-2.5 pt-2 border-t border-border/50 text-xs">
          <div className="flex justify-between text-muted-foreground">
            <span>المجموع الفرعي:</span>
            <span className="font-bold text-foreground">
              {subtotal.toLocaleString('ar-EG')} ج.م
            </span>
          </div>

          <div className="flex justify-between text-muted-foreground">
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5 text-muted-foreground" aria-hidden="true" />
              <span>مصاريف الشحن:</span>
            </span>
            <span>
              {!governorateName ? (
                <span className="text-muted-foreground text-[11px]">حدد المحافظة أولاً</span>
              ) : isShippingFree ? (
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <span className="line-through text-muted-foreground text-[10px]">{shippingFee} ج.م</span>
                  مجاني
                </span>
              ) : (
                <span className="font-bold text-foreground">
                  {shippingFee.toLocaleString('ar-EG')} ج.م
                </span>
              )}
            </span>
          </div>

          {governorateName && (
            <div className="flex justify-between text-[11px] text-muted-foreground bg-primary/5 p-2 rounded-lg">
              <span>موعد التسليم المتوقع:</span>
              <span className="font-bold text-foreground">{estimatedDelivery}</span>
            </div>
          )}

          <div className="flex justify-between items-baseline pt-3 border-t border-border font-black text-sm md:text-base text-foreground">
            <span>الإجمالي النهائي المستحق:</span>
            <span className="text-lg md:text-xl text-primary font-black">
              {total.toLocaleString('ar-EG')}{' '}
              <span className="text-xs font-bold text-foreground">ج.م</span>
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground text-center pt-0.5">
            السعر شامل ضريبة القيمة المضافة ومصاريف المعاينة مع المندوب.
          </p>
        </div>

        {/* 4. Luxury Trust Guarantee Footer */}
        <div className="pt-2 border-t border-border/50 space-y-1.5 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>معاينة وفحص المنتج قبل دفع المبلغ للمندوب.</span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-3.5 w-3.5 text-primary shrink-0" aria-hidden="true" />
            <span>تغليف فاخر مجاني ومحكم لحماية الساعات والجلود.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
