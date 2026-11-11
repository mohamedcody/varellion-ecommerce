'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ordersService } from '@/services/orders';
import { Order } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { OrderTrackingCard } from '@/components/orders/OrderTrackingCard';
import {
  Search,
  Package,
  Phone,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

const EGYPTIAN_PHONE_REGEX = /^01[0125][0-9]{8}$/;

function normalizeEgyptianPhone(raw: string): string {
  if (!raw) return '';
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith('0020')) {
    digits = '0' + digits.substring(4);
  } else if (digits.startsWith('20') && digits.length === 12) {
    digits = '0' + digits.substring(2);
  } else if (!digits.startsWith('0') && digits.length === 10 && ['10', '11', '12', '15'].some((p) => digits.startsWith(p))) {
    digits = '0' + digits;
  }
  return digits;
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const initialOrderParam = searchParams.get('orderNumber') || '';
  const initialPhoneParam = searchParams.get('phone') || '';

  const [orderNumber, setOrderNumber] = useState(initialOrderParam);
  const [phone, setPhone] = useState(initialPhoneParam);
  const [isSearching, setIsSearching] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ orderNumber?: string; phone?: string }>({});

  const performTrack = async (targetOrderNumber: string, targetPhone: string) => {
    setErrorMessage(null);
    setTrackedOrder(null);

    const errors: { orderNumber?: string; phone?: string } = {};
    const cleanNum = (targetOrderNumber || '').trim();
    const cleanPhone = normalizeEgyptianPhone(targetPhone);

    if (!cleanNum) {
      errors.orderNumber = 'يرجى إدخال رقم الطلب (مثال: VAR-20261028-1234)';
    } else if (cleanNum.length < 4) {
      errors.orderNumber = 'رقم الطلب غير صحيح أو قصير جداً';
    }

    if (!targetPhone || !targetPhone.trim()) {
      errors.phone = 'يرجى إدخال رقم الموبايل المسجل به الطلب';
    } else if (!EGYPTIAN_PHONE_REGEX.test(cleanPhone)) {
      errors.phone = 'رقم موبايل مصري غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً)';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSearching(true);

    try {
      const order = await ordersService.trackOrder(cleanNum, cleanPhone);

      if (!order) {
        setErrorMessage(
          'لم نتمكن من العثور على طلب مطابق لرقم الشحنة ورقم الهاتف المدخلين. يرجى التأكد من كتابة الأرقام بشكل صحيح أو التواصل مع خدمة العملاء.'
        );
      } else {
        setTrackedOrder(order);
      }
    } catch (err: unknown) {
      console.error('[TrackOrderPage] Search failed:', err);
      setErrorMessage(
        'حدث خطأ في الاتصال بالشبكة أثناء الاستعلام عن الطلب. يرجى المحاولة مرة أخرى.'
      );
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-fill from sessionStorage if customer just placed an order and phone is missing
  useEffect(() => {
    if (initialOrderParam && !phone && !initialPhoneParam) {
      const last = ordersService.getLastPlacedOrder();
      if (last && last.orderNumber.toLowerCase() === initialOrderParam.toLowerCase()) {
        setPhone(last.customerPhone);
      }
    }
  }, [initialOrderParam, phone, initialPhoneParam]);

  // WhatsApp 1-Click Concierge Tracking Auto-Lookup
  useEffect(() => {
    const candidateOrder = (initialOrderParam || orderNumber).trim();
    const candidatePhone = normalizeEgyptianPhone(initialPhoneParam || phone);

    if (candidateOrder && candidatePhone && EGYPTIAN_PHONE_REGEX.test(candidatePhone)) {
      performTrack(candidateOrder, candidatePhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderParam, initialPhoneParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performTrack(orderNumber, phone);
  };

  const handleApplyDemoOrder = () => {
    setOrderNumber('VAR-20261028-0001');
    setPhone('01012345678');
    setErrorMessage(null);
    setFieldErrors({});
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl py-8 md:py-14 text-start">
      {/* Navigation Breadcrumbs */}
      <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          الرئيسية
        </Link>
        <span>/</span>
        <span className="text-foreground font-semibold">تتبع حالة الشحنة</span>
      </nav>

      {/* Page Header */}
      <div className="mb-8 border-b border-border/50 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
              تتبع شحنتك وطلبك
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground mt-1">
              استعلم عن خط سير الشحنة مع المندوب وموعد التوصيل المتوقع باستخدام رقم الطلب ورقم الهاتف المسجل.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full self-start md:self-auto">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>بياناتك محمية وموثقة بالكامل</span>
          </div>
        </div>
      </div>

      {/* Search Lookup Form Card */}
      <Card className="border border-border/80 bg-card shadow-xs mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} noValidate className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
              {/* Order Number Input (5 cols) */}
              <div className="md:col-span-5">
                <Input
                  id="track-order-number"
                  label="رقم الطلب (Order Number) *"
                  placeholder="مثال: VAR-20261028-4821"
                  value={orderNumber}
                  onChange={(e) => {
                    setOrderNumber(e.target.value);
                    if (fieldErrors.orderNumber) setFieldErrors((p) => ({ ...p, orderNumber: undefined }));
                  }}
                  error={fieldErrors.orderNumber}
                  disabled={isSearching}
                  dir="ltr"
                  autoCapitalize="none"
                  spellCheck={false}
                  required
                />
              </div>

              {/* Customer Phone Input (5 cols) */}
              <div className="md:col-span-5">
                <Input
                  id="track-order-phone"
                  label="رقم الموبايل المسجل به الطلب *"
                  placeholder="010xxxxxxxx"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined }));
                  }}
                  error={fieldErrors.phone}
                  disabled={isSearching}
                  dir="ltr"
                  required
                />
              </div>

              {/* Submit Button (2 cols) */}
              <div className="md:col-span-2">
                <Button
                  type="submit"
                  variant="luxury"
                  size="default"
                  disabled={isSearching}
                  className="w-full h-11 gap-2 font-bold cursor-pointer"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      <span>بحث…</span>
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" aria-hidden="true" />
                      <span>تتبع</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Quick Demo Helper Hint */}
            <div className="flex flex-wrap items-center justify-between text-[11px] text-muted-foreground pt-1">
              <span>أدخل رقم الطلب الموجود في رسالة التأكيد أو الفاتورة.</span>
              <button
                type="button"
                onClick={handleApplyDemoOrder}
                className="text-primary hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>تجربة أوردر افتراضي للاختبار</span>
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Error Message Announcement Container */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="polite"
          className="mb-8 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs md:text-sm font-semibold flex items-start gap-3"
        >
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-bold">تعذر الوصول إلى الطلب</p>
            <p className="font-normal leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Successful Tracking Result */}
      {trackedOrder && (
        <div role="region" aria-label="بيانات تتبع الطلب" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <OrderTrackingCard order={trackedOrder} />
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-xs text-muted-foreground">
            جاري تحميل بوابة تتبع الشحنات…
          </div>
        }
      >
        <TrackOrderContent />
      </Suspense>
    </main>
  );
}
