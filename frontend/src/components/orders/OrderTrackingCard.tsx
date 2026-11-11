'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Order } from '@/types';
import { cn } from '@/lib/utils';
import { OrderTrackingTimeline } from './OrderTrackingTimeline';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import {
  Package,
  MapPin,
  Phone,
  ShieldCheck,
  Printer,
  ShoppingBag,
  MessageCircle,
  FileText,
  BadgeCheck,
} from 'lucide-react';

interface OrderTrackingCardProps {
  order: Order;
}

export function OrderTrackingCard({ order }: OrderTrackingCardProps) {
  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً VARELLION، أود الاستفسار عن شحنتي رقم: ${order.orderNumber}`
  );

  return (
    <div className="space-y-6 text-start">
      {/* 1. Master Header Card with Status Badge */}
      <Card className="border border-border/80 bg-card shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                تفاصيل بوليصة الشحن
              </span>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" aria-hidden="true" />
                <h2 className="text-lg md:text-xl font-black font-mono text-foreground">
                  {order.orderNumber}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                data-testid="order-status-badge"
                className={cn(
                  'text-xs font-bold px-3 py-1 rounded-full border',
                  order.orderStatus === 'DELIVERED'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                    : 'bg-primary/10 text-primary border border-primary/20'
                )}
              >
                {order.statusDisplayAr ||
                  (order.orderStatus === 'DELIVERED'
                    ? 'تم التسليم بنجاح'
                    : order.orderStatus === 'SHIPPED'
                    ? 'مع مندوب التوصيل'
                    : order.orderStatus === 'PREPARING'
                    ? 'قيد التجهيز والفحص'
                    : 'تم استلام وتأكيد الطلب')}
              </span>

              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                {order.paymentMethod === 'CARD' ? 'مدفوع إلكترونياً' : 'الدفع عند الاستلام'}
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Tracking Timeline Component */}
          <OrderTrackingTimeline
            status={order.orderStatus}
            createdAt={order.createdAt}
            updatedAt={order.updatedAt}
            governorate={order.shippingGovernorate}
            statusHistory={order.statusHistory}
          />
        </CardContent>
      </Card>

      {/* 2. Two-Column Detailed Breakdown (Shipping Info & Invoice Items) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Shipping & Delivery Snapshot (7 Cols) */}
        <div className="md:col-span-7 space-y-6">
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardHeader className="border-b border-border/40 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>عنوان التوصيل المسجل في مصر</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">اسم المستلم:</span>
                <span className="font-bold text-foreground">{order.customerName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">رقم الهاتف للتواصل:</span>
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
                <span className="text-muted-foreground">العنوان بالتفصيل:</span>
                <span className="font-medium text-foreground max-w-[65%] text-end leading-relaxed">
                  {order.shippingDetailedAddress}
                </span>
              </div>

              {order.customerNotes && (
                <div className="pt-2 border-t border-border/50 flex justify-between">
                  <span className="text-muted-foreground">ملاحظات للمندوب:</span>
                  <span className="text-foreground italic max-w-[65%] text-end">
                    "{order.customerNotes}"
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Support & Guarantee Card */}
          <Card className="border border-border/80 bg-card shadow-xs">
            <CardContent className="pt-4 space-y-3 text-xs">
              <div className="flex items-center gap-2 text-foreground font-bold">
                <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>ضمان VARELLION الملكي وخدمة العملاء</span>
              </div>
              <p className="text-muted-foreground leading-relaxed text-[11px]">
                يحق لك فحص ومعاينة الشحنة بالكامل مع مندوب الشحن قبل سداد أي مبالغ نقدية. إذا كان لديك أي استفسار حول موعد وصول المندوب، تواصل معنا مباشرة.
              </p>

              <div className="flex flex-wrap gap-2.5 pt-1">
                <a
                  href={`https://wa.me/201012345678?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[140px]"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer min-h-[40px]"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>تواصل عبر واتساب</span>
                  </Button>
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="gap-1.5 text-xs font-semibold cursor-pointer min-h-[40px]"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  <span>طباعة البوليصة</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoice Items & Summary (5 Cols) */}
        <div className="md:col-span-5">
          <Card className="border border-border/80 bg-card/95 shadow-sm">
            <CardHeader className="border-b border-border/50 pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" aria-hidden="true" />
                <span>المنتجات المشمولة ({order.items?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-xs">
              {order.items && order.items.length > 0 ? (
                <div className="divide-y divide-border/40 max-h-[300px] overflow-y-auto pr-1">
                  {order.items.map((item) => {
                    const price = item.totalPrice ?? (item as unknown as { lineTotal?: number }).lineTotal ?? 0;
                    return (
                      <div key={item.orderItemId} className="py-3 first:pt-0 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.imageUrl && (
                            <div className="relative w-11 h-11 rounded-lg overflow-hidden border border-border/60 bg-muted shrink-0">
                              <Image
                                src={item.imageUrl}
                                alt={item.productNameAr}
                                fill
                                sizes="44px"
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate text-xs" title={item.productNameAr}>
                              {item.productNameAr}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              كود: {item.productSku || (item as unknown as { sku?: string }).sku} • الكمية: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <span className="font-black text-foreground shrink-0 text-xs tabular-nums">
                          {price.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-muted-foreground text-xs py-2">
                  تم تسجيل البنود في الشحنة.
                </p>
              )}

              {/* Financial Breakdown */}
              <div className="space-y-2 pt-3 border-t border-border/50">
                <div className="flex justify-between text-muted-foreground">
                  <span>المجموع الفرعي:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {(order.subtotal ?? 0).toLocaleString('ar-EG')} ج.م
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>تكلفة الشحن:</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {order.shippingFee === 0 || order.shippingFee == null ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">مجاني</span>
                    ) : (
                      `${order.shippingFee.toLocaleString('ar-EG')} ج.م`
                    )}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2.5 border-t border-border font-black text-sm text-foreground">
                  <span>
                    {order.paymentMethod === 'CARD'
                      ? 'إجمالي المبلغ المسدد بالكامل:'
                      : 'المبلغ المطلوب عند الاستلام:'}
                  </span>
                  <span className="text-lg text-primary font-black tabular-nums">
                    {(order.totalAmount ?? 0).toLocaleString('ar-EG')}{' '}
                    <span className="text-xs font-bold text-foreground">ج.م</span>
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
