'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ordersService } from '@/services/orders';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { CheckCircle2, AlertCircle, Loader2, ArrowRight, RotateCcw, Banknote, ShieldCheck } from 'lucide-react';

function PaymentCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();

  const successParam = searchParams.get('success');
  const orderNumber = searchParams.get('orderNumber') || searchParams.get('order_number') || 'VAR-ORD-PENDING';
  const transactionId = searchParams.get('transactionId') || searchParams.get('txn_response_code');
  const errorMessage = searchParams.get('errorMessage') || 'تعذر خصم المبلغ من البنك أو تم إلغاء العملية.';

  const isSuccess = successParam === 'true';
  const [isConvertingToCod, setIsConvertingToCod] = useState(false);

  useEffect(() => {
    if (isSuccess) {
      // 1. Update last placed order to CONFIRMED
      const cached = ordersService.getLastPlacedOrder();
      if (cached) {
        cached.orderStatus = 'CONFIRMED';
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('varellion_last_order', JSON.stringify(cached));
        }
      }

      // 2. Clear cart
      clearCart();

      // 3. Smooth transition to order success page
      const timer = setTimeout(() => {
        router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [isSuccess, orderNumber, clearCart, router]);

  // Convert to COD fallback handler if payment failed
  const handleConvertToCod = async () => {
    setIsConvertingToCod(true);
    const cached = ordersService.getLastPlacedOrder();
    if (cached) {
      cached.paymentMethod = 'CASH_ON_DELIVERY';
      cached.orderStatus = 'PENDING_CUSTOMER_CONFIRMATION';
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('varellion_last_order', JSON.stringify(cached));
      }
    }
    clearCart();
    router.push(`/checkout/success?orderNumber=${encodeURIComponent(orderNumber)}`);
  };

  if (isSuccess) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center space-y-5">
          <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center ring-8 ring-emerald-500/5 animate-pulse">
            <CheckCircle2 className="w-10 h-10" aria-hidden="true" />
          </div>

          <div className="space-y-1.5">
            <span className="text-xs font-bold tracking-widest text-emerald-600 dark:text-emerald-400 uppercase">
              تم التحقق البنكي بنجاح
            </span>
            <h1 className="text-2xl font-black text-foreground">
              تم تأكيد وسداد طلبك بنجاح!
            </h1>
            <p className="text-xs text-muted-foreground">
              رقم العملية: <span className="font-mono font-bold text-foreground">{transactionId || 'APPROVED'}</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4">
            <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            <span>جاري نقلك إلى إشعار الفاتورة الرسمية...</span>
          </div>
        </div>
      </div>
    );
  }

  // Payment Failed or Cancelled View
  return (
    <div className="min-h-[70vh] flex items-center justify-center py-16 px-4">
      <Card className="max-w-lg w-full border border-destructive/20 bg-card shadow-lg text-start overflow-hidden">
        <CardHeader className="bg-destructive/10 border-b border-destructive/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-destructive/20 text-destructive shrink-0">
              <AlertCircle className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <CardTitle className="text-base font-black text-foreground">
                تعذر إتمام الدفع الإلكتروني عبر البنك
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                رقم الطلب المعلق: <span className="font-mono font-bold text-foreground">{orderNumber}</span>
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5 pt-5 text-xs">
          <div className="p-3.5 rounded-xl bg-muted/50 border border-border/60 text-muted-foreground leading-relaxed">
            {errorMessage}
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-foreground">اختر كيف تفضل المتابعة دون فقدان طلبك:</h4>

            {/* Option A: Convert to Cash on Delivery (Hero action) */}
            <Button
              type="button"
              variant="luxury"
              size="lg"
              onClick={handleConvertToCod}
              disabled={isConvertingToCod}
              className="w-full gap-2 font-bold cursor-pointer min-h-[48px]"
            >
              {isConvertingToCod ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>جاري تحويل الطلب للدفع كاش...</span>
                </>
              ) : (
                <>
                  <Banknote className="h-4 w-4" aria-hidden="true" />
                  <span>تأكيد الطلب الآن كـ (الدفع عند الاستلام)</span>
                </>
              )}
            </Button>

            {/* Option B: Retry Online Payment */}
            <Link href="/checkout" className="block w-full">
              <Button
                type="button"
                variant="outline"
                size="default"
                className="w-full gap-2 text-xs font-semibold cursor-pointer min-h-[44px]"
              >
                <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                <span>إعادة محاولة الدفع ببطاقة أخرى</span>
              </Button>
            </Link>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              منتجاتك محفوظة في السلة بأمان
            </span>
            <Link href="/products" className="text-primary hover:underline font-semibold">
              الرجوع للتسوق
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentCallbackPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense
        fallback={
          <div className="min-h-[50vh] flex items-center justify-center text-xs text-muted-foreground">
            جاري تأكيد حالة المعاملة البنكية...
          </div>
        }
      >
        <PaymentCallbackContent />
      </Suspense>
    </main>
  );
}
