'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CheckoutForm } from '@/components/checkout/CheckoutForm';
import { OrderSummaryCard } from '@/components/checkout/OrderSummaryCard';
import { calculateShippingFee } from '@/data/shippingZones';
import { ordersService } from '@/services/orders';
import { paymentService } from '@/services/payment';
import { CheckoutFormValues } from '@/lib/validations/checkout';
import { CreateOrderRequest, OrderItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, ArrowLeft, ArrowRight, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';

function CheckoutContent() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();

  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('القاهرة');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);

  // Dynamic shipping calculation
  const shippingCalculation = calculateShippingFee(selectedGovernorate, subtotal);
  const shippingFee = shippingCalculation.fee;
  const isShippingFree = shippingCalculation.isFree;
  const estimatedDelivery = shippingCalculation.estimatedDeliveryAr;
  const totalAmount = subtotal + shippingFee;

  // Empty cart fallback
  if (items.length === 0 && !isSubmitting) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center py-16 px-4">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <ShoppingBag className="w-10 h-10" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-black text-foreground">سلة الشراء فارغة</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              لم تقم بإضافة أي منتجات فاخرة إلى سلتك بعد. تصفح مجموعات الساعات والجلود الطبيعية الحصرية الآن.
            </p>
          </div>

          <Link href="/products">
            <Button variant="luxury" size="lg" className="w-full gap-2 font-bold cursor-pointer min-h-[46px]">
              <span>تصفح الكتالوج الفاخر</span>
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  const handleOrderSubmission = async (formValues: CheckoutFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Map to PostgreSQL CreateOrderRequest contract
      const orderRequest: CreateOrderRequest = {
        customerName: formValues.customerName.trim(),
        customerPhone: formValues.customerPhone.trim(),
        alternativePhone: formValues.alternativePhone?.trim() || undefined,
        shippingGovernorate: formValues.shippingGovernorate.trim(),
        shippingCityArea: formValues.shippingCityArea.trim(),
        shippingDetailedAddress: formValues.shippingDetailedAddress.trim(),
        paymentMethod: formValues.paymentMethod,
        customerNotes: formValues.customerNotes?.trim() || undefined,
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      };

      // Map cart items to authoritative OrderItem snapshots
      const orderItems: OrderItem[] = items.map((it) => ({
        orderItemId: it.cartItemId,
        productId: it.productId,
        productNameAr: it.product.nameAr,
        productNameEn: it.product.nameEn,
        productSku: it.product.sku,
        unitPrice: it.product.price,
        quantity: it.quantity,
        totalPrice: it.product.price * it.quantity,
        imageUrl: it.product.images?.[0]?.imageUrl,
      }));

      // Submit via ordersService (with backend and local fallbacks)
      const created = await ordersService.createOrder({
        request: orderRequest,
        subtotal,
        shippingFee,
        discountTotal: 0,
        orderItems,
      });

      // Handle Online Payment (Paymob Hosted Checkout)
      if (orderRequest.paymentMethod === 'CARD') {
        const paymentSession = await paymentService.initiatePaymobPayment({
          order: created,
          customerEmail: user?.email,
        });

        if (paymentSession.paymentUrl) {
          window.location.href = paymentSession.paymentUrl;
          return;
        }
      }

      // Cash on Delivery (COD): Clear cart and navigate directly to success screen
      clearCart();
      router.push(`/checkout/success?orderNumber=${encodeURIComponent(created.orderNumber)}`);
    } catch (err: unknown) {
      console.error('[CheckoutPage] Order submission failed:', err);
      setErrorMessage(
        err instanceof Error ? err.message : 'حدث خطأ غير متوقع أثناء تسجيل طلبك، يرجى المحاولة مرة أخرى.'
      );
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background py-8 md:py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Navigation Breadcrumbs */}
        <nav aria-label="مسار التنقل" className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-foreground transition-colors">
            المنتجات
          </Link>
          <span>/</span>
          <span className="text-foreground font-semibold">إتمام الطلب والدفع</span>
        </nav>

        {/* Page Header */}
        <div className="mb-8 border-b border-border/50 pb-6 text-start">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                إتمام الطلب الفاخر
              </h1>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                املأ تفاصيل التوصيل لتأكيد الشحن الفوري مع الدفع نقداً عند استلام ومعاينة الشحنة.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full self-start md:self-auto">
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              <span>تسوق آمن ومحمي 100%</span>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {errorMessage && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold text-start flex items-center justify-between"
          >
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs underline hover:no-underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Mobile Collapsible Summary Bar */}
        <div className="block lg:hidden mb-6">
          <button
            type="button"
            onClick={() => setMobileSummaryOpen(!mobileSummaryOpen)}
            className="w-full flex items-center justify-between p-3.5 rounded-xl border border-border bg-card/80 text-start cursor-pointer"
            aria-expanded={mobileSummaryOpen}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-foreground">
              <ShoppingBag className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>ملخص مشترياتك ({items.length} منتجات)</span>
              {mobileSummaryOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              )}
            </div>
            <div className="text-sm font-black text-primary">
              {totalAmount.toLocaleString('ar-EG')} ج.م
            </div>
          </button>

          {mobileSummaryOpen && (
            <div className="mt-3">
              <OrderSummaryCard
                items={items}
                subtotal={subtotal}
                shippingFee={shippingFee}
                isShippingFree={isShippingFree}
                governorateName={selectedGovernorate}
                estimatedDelivery={estimatedDelivery}
                total={totalAmount}
              />
            </div>
          )}
        </div>

        {/* Two-Column Responsive Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Checkout Form Column (8 of 12) */}
          <div className="lg:col-span-7 xl:col-span-8">
            <CheckoutForm
              subtotal={subtotal}
              shippingFee={shippingFee}
              total={totalAmount}
              selectedGovernorate={selectedGovernorate}
              onGovernorateChange={setSelectedGovernorate}
              onSubmitOrder={handleOrderSubmission}
              isSubmitting={isSubmitting}
            />
          </div>

          {/* Sticky Order Summary Column (Desktop: 5 of 12) */}
          <div className="hidden lg:block lg:col-span-5 xl:col-span-4">
            <OrderSummaryCard
              items={items}
              subtotal={subtotal}
              shippingFee={shippingFee}
              isShippingFree={isShippingFree}
              governorateName={selectedGovernorate}
              estimatedDelivery={estimatedDelivery}
              total={totalAmount}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <AuthGuard>
      <CheckoutContent />
    </AuthGuard>
  );
}
