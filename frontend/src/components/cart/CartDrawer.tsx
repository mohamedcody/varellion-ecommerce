'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Info,
  PackageOpen,
  CheckCircle2,
} from 'lucide-react';

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    totalItems,
    subtotal,
    updateQuantity,
    removeItem,
  } = useCart();

  const [showAuthNotice, setShowAuthNotice] = useState(false);

  const handleCheckoutClick = () => {
    // Handled per user agreement in Grill-Me:
    // Inform user that checkout requires auth which will be enabled in the next phase
    setShowAuthNotice(true);
  };

  return (
    <Sheet
      isOpen={isCartOpen}
      onClose={() => {
        setShowAuthNotice(false);
        closeCart();
      }}
      side="left" // Decided in Grill-Me: matches cart trigger location on the left side of Header in RTL
      title={`سلة المشتريات (${totalItems})`}
      className="max-w-md w-full flex flex-col p-0 bg-background"
    >
      {items.length === 0 ? (
        /* Empty State */
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-16 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary mb-5 shadow-xs">
            <PackageOpen className="h-10 w-10 text-primary" aria-hidden="true" />
          </div>
          <h3 className="text-lg font-black text-foreground mb-2">
            سلة مشترياتك فارغة حالياً
          </h3>
          <p className="text-xs text-muted-foreground max-w-xs leading-relaxed mb-8">
            لم تقم بإضافة أي قطع بعد. استكشف مجموعتنا المختارة من الساعات الفاخرة والمصنوعات الجلدية الطبيعية 100%.
          </p>
          <Link href="/products" onClick={closeCart} className="w-full max-w-xs">
            <Button variant="luxury" size="lg" className="w-full gap-2 min-h-[44px]">
              <span>تصفح الكتالوج الآن</span>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      ) : (
        /* Cart Content */
        <div className="flex flex-col flex-1 h-full overflow-hidden">
          {/* Scrollable Items List */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 divide-y divide-border/60">
            {items.map((item) => {
              const mainImg =
                item.product.images.find((img) => img.isMain) || item.product.images[0];
              const isMaxStock = item.quantity >= item.product.availableStock;

              return (
                <div
                  key={item.cartItemId}
                  className="pt-4 first:pt-0 flex items-start gap-4"
                >
                  {/* Thumbnail Image */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    onClick={closeCart}
                    className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border/80 bg-muted/30 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`عرض تفاصيل ${item.product.nameAr}`}
                  >
                    {mainImg?.imageUrl ? (
                      <img
                        src={mainImg.imageUrl}
                        alt={mainImg.altAr || item.product.nameAr}
                        className="h-full w-full object-cover object-center"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                        لا صورة
                      </div>
                    )}
                  </Link>

                  {/* Details & Controls */}
                  <div className="flex flex-col flex-1 min-w-0 gap-1.5">
                    {/* Title */}
                    <Link
                      href={`/products/${item.product.slug}`}
                      onClick={closeCart}
                      className="font-bold text-xs sm:text-sm text-foreground hover:text-primary transition-colors line-clamp-1 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                    >
                      {item.product.nameAr}
                    </Link>

                    {/* SKU Indicator */}
                    <div className="text-[11px] font-mono text-muted-foreground">
                      كود: {item.product.sku}
                    </div>

                    {/* Price in EGP */}
                    <div className="text-xs font-black text-foreground">
                      {item.product.price.toLocaleString('ar-EG')}{' '}
                      <span className="font-bold text-[10px]">ج.م</span>
                    </div>

                    {/* Quantity Buttons & Delete */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center border border-border rounded-lg bg-card">
                        {/* Decrease */}
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                          className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-r-lg"
                          aria-label={`إنقاص كمية ${item.product.nameAr}`}
                        >
                          <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>

                        {/* Current Quantity */}
                        <span className="min-w-[28px] text-center text-xs font-bold text-foreground">
                          {item.quantity}
                        </span>

                        {/* Increase */}
                        <button
                          type="button"
                          disabled={isMaxStock}
                          onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          className={`flex min-h-[44px] min-w-[44px] items-center justify-center transition-colors rounded-l-lg ${
                            isMaxStock
                              ? 'text-muted-foreground/30 cursor-not-allowed'
                              : 'text-muted-foreground hover:text-foreground cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring'
                          }`}
                          aria-label={`زيادة كمية ${item.product.nameAr}`}
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>

                      {/* Remove Button */}
                      <button
                        type="button"
                        onClick={() => removeItem(item.cartItemId)}
                        className="flex min-h-[44px] min-w-[44px] items-center justify-center text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                        aria-label={`حذف ${item.product.nameAr} من السلة`}
                        title="حذف القطعة"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>

                    {/* Stock Limit Warning */}
                    {isMaxStock && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold pt-0.5">
                        أقصى كمية متوفرة في المخزون حالياً ({item.product.availableStock} قطع)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Drawer Footer: Subtotal & Actions */}
          <div className="border-t border-border bg-card p-6 space-y-4 shadow-lg">
            {/* Subtotal Display */}
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold text-muted-foreground">
                المجموع الفرعي ({totalItems} قطع):
              </span>
              <span className="text-xl font-black text-foreground">
                {subtotal.toLocaleString('ar-EG')}{' '}
                <span className="text-xs font-bold">ج.م</span>
              </span>
            </div>

            {/* Approved Shipping Disclaimer (No fake free shipping, no fake tax) */}
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              المجموع الفرعي لا يشمل رسوم الشحن. تُحدد وتُضاف رسوم التوصيل في الخطوة التالية وفقاً للمحافظة المحددة وطرق الشحن المعتمدة.
            </p>

            {/* Dependency Notice when Checkout is clicked */}
            {showAuthNotice && (
              <div
                className="p-3 rounded-lg border border-primary/30 bg-primary/10 text-xs text-foreground space-y-2 animate-in fade-in"
                role="alert"
              >
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="leading-relaxed">
                    <strong>إتمام الشراء يتطلب تسجيل الدخول:</strong> وفقاً لسياسة المتجر، يلزم تسجيل حساب أو الدخول قبل تأكيد الطلب. سيتم تفعيل شاشات تسجيل الدخول والـ Checkout في المرحلة القادمة مباشرة.
                  </p>
                </div>
              </div>
            )}

            {/* Primary Action Button */}
            <div className="space-y-2">
              <Button
                variant="luxury"
                size="lg"
                onClick={handleCheckoutClick}
                className="w-full gap-2 font-bold min-h-[48px] shadow-sm text-sm"
              >
                <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                <span>المتابعة لإتمام الطلب</span>
              </Button>

              <Button
                variant="outline"
                size="default"
                onClick={closeCart}
                className="w-full text-xs min-h-[44px]"
              >
                <span>متابعة التسوق</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
