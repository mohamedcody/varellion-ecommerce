'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ordersService } from '@/services/orders';
import { Order } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  CheckCircle2,
  Package,
  PhoneCall,
  Clock,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Copy,
  Check,
  ShieldCheck,
  Printer,
} from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const urlOrderNumber = searchParams.get('orderNumber');

  const [order, setOrder] = useState<Order | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const cachedOrder = ordersService.getLastPlacedOrder();
    if (cachedOrder) {
      setOrder(cachedOrder);
    }
  }, []);

  const displayOrderNumber = order?.orderNumber || urlOrderNumber || 'VAR-ORD-PENDING';

  const handleCopyOrderNumber = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(displayOrderNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl py-10 md:py-16 text-start">
      {/* 1. Celebration Header */}
      <div className="text-center space-y-4 mb-10">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
        </div>

        <div className="space-y-1.5">
          <span className="text-xs font-bold tracking-widest text-primary uppercase">
            طلبك مؤكد وجارٍ التجهيز
          </span>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">
            شكراً لثقتك في VARELLION!
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            تم استلام تفاصيل طلبك بنجاح، وسيتم شحنه مباشرة إلى عنوانك مع ميزة المعاينة قبل الدفع.
          </p>
        </div>

        {/* Order Number Badge & Copy */}
        <div className="inline-flex items-center gap-3 p-2.5 px-4 rounded-xl border border-border bg-card shadow-xs">
          <div className="text-xs text-muted-foreground">
            رقم الطلب: <strong className="text-foreground font-mono text-sm">{displayOrderNumber}</strong>
          </div>
          <button
            type="button"
            onClick={handleCopyOrderNumber}
            className="flex items-center gap-1 text-xs text-primary font-bold hover:underline cursor-pointer"
            aria-label="نسخ رقم الطلب"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
                <span>تم النسخ</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>نسخ</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Column: What Happens Next & Instructions (7 cols) */}
        <div className="md:col-span-7 space-y-6">
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>ماذا يحدث بعد ذلك؟ (خطوات التوصيل)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              {/* Step 1 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-foreground">مراجعة وتأكيد هاتفي</h4>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    سيتواصل معك ممثل خدمة عملاء VARELLION هاتفياً أو عبر واتساب لتأكيد جاهزية العنوان وموعد التسليم.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-foreground">التجهيز والتغليف الملكي</h4>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    يتم فحص القطع يدوياً ووضعها في علب VARELLION الفاخرة مع بطاقات الضمان المعتمدة.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center shrink-0 text-xs">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-foreground">المعاينة والاستلام والدفع نقداً</h4>
                  <p className="text-muted-foreground mt-0.5 leading-relaxed">
                    عند وصول المندوب، يحق لك فتح الشحنة ومعاينتها بالكامل، ثم سداد المبلغ نقداً عند الرضا التام.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery & Customer Details Card */}
          {order && (
            <Card className="border border-border/80 bg-card shadow-xs">
              <CardHeader className="border-b border-border/40 pb-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                  <span>بيانات الشحن والتوصيل</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">اسم المستلم:</span>
                  <span className="font-bold text-foreground">{order.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">رقم الهاتف:</span>
                  <span className="font-mono font-bold text-foreground" dir="ltr">
                    {order.customerPhone}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">المحافظة والمنطقة:</span>
                  <span className="font-bold text-foreground">
                    {order.shippingGovernorate} — {order.shippingCityArea}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">العنوان التفصيلي:</span>
                  <span className="font-medium text-foreground max-w-[60%] text-end">
                    {order.shippingDetailedAddress}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">طريقة السداد:</span>
                  <span className="font-bold text-primary flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                    الدفع عند الاستلام (COD)
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link href="/products" className="flex-1">
              <Button variant="luxury" size="default" className="w-full gap-2 font-bold cursor-pointer min-h-[46px]">
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>متابعة تسوق التشكيلة</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="default"
              onClick={handlePrint}
              className="gap-2 text-xs font-semibold cursor-pointer min-h-[46px]"
            >
              <Printer className="w-4 h-4" aria-hidden="true" />
              <span>طباعة إشعار الطلب</span>
            </Button>
          </div>
        </div>

        {/* Right Column: Order Invoice Snapshot (5 cols) */}
        <div className="md:col-span-5">
          <Card className="border border-border/80 bg-card/90 shadow-md">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>فاتورة المنتجات</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              {order?.items && order.items.length > 0 ? (
                <div className="divide-y divide-border/40 max-h-[260px] overflow-y-auto pr-1">
                  {order.items.map((item, idx) => (
                    <div key={item.orderItemId || idx} className="py-2.5 first:pt-0 flex justify-between items-center">
                      <div>
                        <p className="font-bold text-foreground">{item.productNameAr}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          {item.quantity} × {item.unitPrice.toLocaleString('ar-EG')} ج.م
                        </p>
                      </div>
                      <span className="font-black text-foreground">
                        {item.totalPrice.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs py-2">
                  تم تسجيل البنود وتجهيز بوليصة الشحن بنجاح.
                </p>
              )}

              <div className="space-y-2 pt-3 border-t border-border/50">
                {order && (
                  <>
                    <div className="flex justify-between text-muted-foreground">
                      <span>المجموع الفرعي:</span>
                      <span className="font-bold text-foreground">
                        {order.subtotal.toLocaleString('ar-EG')} ج.م
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>مصاريف الشحن:</span>
                      <span className="font-bold text-foreground">
                        {order.shippingFee === 0 ? 'مجاني' : `${order.shippingFee.toLocaleString('ar-EG')} ج.م`}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between items-baseline pt-2 border-t border-border font-black text-sm text-foreground">
                  <span>المبلغ المطلوب عند الاستلام:</span>
                  <span className="text-lg text-primary font-black">
                    {(order?.totalAmount || 0).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-xs text-muted-foreground">
            جاري تحميل تفاصيل الطلب...
          </div>
        }
      >
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}
