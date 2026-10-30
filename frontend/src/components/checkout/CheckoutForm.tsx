'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ShippingGovernorateSelect } from './ShippingGovernorateSelect';
import { PaymentMethodSelector } from './PaymentMethodSelector';
import {
  CheckoutFormValues,
  CheckoutFieldErrors,
  validateCheckoutForm,
} from '@/lib/validations/checkout';
import { PaymentMethod } from '@/types';
import { customerService } from '@/services/customer';
import { User, Phone, MapPin, FileText, CheckCircle2, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface CheckoutFormProps {
  subtotal: number;
  shippingFee: number;
  total: number;
  selectedGovernorate: string;
  onGovernorateChange: (governorate: string) => void;
  onSubmitOrder: (values: CheckoutFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function CheckoutForm({
  subtotal,
  shippingFee,
  total,
  selectedGovernorate,
  onGovernorateChange,
  onSubmitOrder,
  isSubmitting,
}: CheckoutFormProps) {
  const { user, isAuthenticated } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [alternativePhone, setAlternativePhone] = useState('');
  const [shippingCityArea, setShippingCityArea] = useState('');
  const [shippingDetailedAddress, setShippingDetailedAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH_ON_DELIVERY');
  const [saveAddress, setSaveAddress] = useState(true);

  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Auto-prefill customer profile and delivery address if logged in
  useEffect(() => {
    let isMounted = true;

    async function loadCustomerProfile() {
      if (isAuthenticated) {
        try {
          const profile = await customerService.getProfile();
          if (isMounted && profile) {
            if (profile.fullName) {
              setCustomerName(profile.fullName);
            } else if (user?.username) {
              setCustomerName(user.username);
            }

            if (profile.phoneNumber) {
              setCustomerPhone(profile.phoneNumber);
            }

            if (profile.address) {
              if (profile.address.governorate) {
                onGovernorateChange(profile.address.governorate);
              }
              if (profile.address.cityArea) {
                setShippingCityArea(profile.address.cityArea);
              }
              if (profile.address.detailedAddress) {
                setShippingDetailedAddress(profile.address.detailedAddress);
              }
              setHasPrefilled(true);
            }
          }
        } catch {
          if (isMounted && user?.username && !customerName) {
            setCustomerName(user.username);
          }
        }
      } else if (user?.username && !customerName) {
        setCustomerName(user.username);
      }
    }

    loadCustomerProfile();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const formValues: CheckoutFormValues = {
      customerName,
      customerPhone,
      alternativePhone: alternativePhone || undefined,
      shippingGovernorate: selectedGovernorate,
      shippingCityArea,
      shippingDetailedAddress,
      paymentMethod,
      customerNotes: customerNotes || undefined,
      saveAddress: isAuthenticated ? saveAddress : false,
    };

    const validation = validateCheckoutForm(formValues);

    if (!validation.isValid) {
      setFieldErrors(validation.errors);

      // Smooth scroll to the first erroneous input
      const firstErrorField = Object.keys(validation.errors)[0];
      if (firstErrorField) {
        const elem = document.getElementById(
          firstErrorField === 'shippingGovernorate'
            ? 'shipping-governorate-select'
            : `checkout-${firstErrorField}`
        );
        elem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setFieldErrors({});

    // If customer opted to save their address as default, sync with profile in background
    if (
      isAuthenticated &&
      saveAddress &&
      formValues.shippingGovernorate &&
      formValues.shippingCityArea &&
      formValues.shippingDetailedAddress
    ) {
      customerService
        .saveAddress({
          governorate: formValues.shippingGovernorate,
          cityArea: formValues.shippingCityArea,
          detailedAddress: formValues.shippingDetailedAddress,
        })
        .catch((err) => {
          console.warn('[Checkout] Failed to sync saved address:', err);
        });
    }

    await onSubmitOrder(formValues);
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6 text-start">
      {/* 1. Recipient Contact Information Card */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader className="border-b border-border/40 pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" aria-hidden="true" />
              <span>بيانات المستلم والتواصل</span>
            </CardTitle>
            {!isAuthenticated && (
              <Link
                href="/login?redirect=/checkout"
                className="text-xs text-primary hover:underline font-semibold"
              >
                لديك حساب؟ تسجيل الدخول
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {isAuthenticated && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>أهلاً بك يا {user?.username}، تم ربط الطلب بحسابك الموثق.</span>
            </div>
          )}

          {hasPrefilled && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 text-primary text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>تم ملء بيانات الشحن تلقائياً من عنوانك المسجل في ملفك الشخصي.</span>
            </div>
          )}

          {/* Customer Full Name */}
          <Input
            id="checkout-customerName"
            label="الاسم بالكامل (ثنائي أو ثلاثي) *"
            placeholder="مثال: محمد أحمد علي"
            value={customerName}
            onChange={(e) => {
              setCustomerName(e.target.value);
              if (fieldErrors.customerName) setFieldErrors((prev) => ({ ...prev, customerName: undefined }));
            }}
            error={fieldErrors.customerName}
            disabled={isSubmitting}
            autoComplete="name"
            required
          />

          {/* Phones Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Primary Phone */}
            <div className="space-y-1.5">
              <Input
                id="checkout-customerPhone"
                label="رقم الموبايل للتوصيل *"
                placeholder="010xxxxxxxx"
                type="tel"
                dir="ltr"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  if (fieldErrors.customerPhone) setFieldErrors((prev) => ({ ...prev, customerPhone: undefined }));
                }}
                error={fieldErrors.customerPhone}
                helperText="للتواصل والتأكيد عبر واتساب ومندوب الشحن"
                disabled={isSubmitting}
                autoComplete="tel"
                required
              />
            </div>

            {/* Alternative Phone */}
            <div className="space-y-1.5">
              <Input
                id="checkout-alternativePhone"
                label="رقم هاتف بديل (اختياري)"
                placeholder="011xxxxxxxx"
                type="tel"
                dir="ltr"
                value={alternativePhone}
                onChange={(e) => {
                  setAlternativePhone(e.target.value);
                  if (fieldErrors.alternativePhone) setFieldErrors((prev) => ({ ...prev, alternativePhone: undefined }));
                }}
                error={fieldErrors.alternativePhone}
                helperText="للطوارئ في حال تعذر الوصول للرقم الأساسي"
                disabled={isSubmitting}
                autoComplete="tel-national"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Shipping Address Card (PostgreSQL 1:1 Schema) */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardHeader className="border-b border-border/40 pb-3">
          <CardTitle className="text-sm md:text-base font-bold flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" aria-hidden="true" />
            <span>عنوان التوصيل في مصر</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Governorate Select */}
            <ShippingGovernorateSelect
              value={selectedGovernorate}
              onChange={(gov) => {
                onGovernorateChange(gov);
                if (fieldErrors.shippingGovernorate) {
                  setFieldErrors((prev) => ({ ...prev, shippingGovernorate: undefined }));
                }
              }}
              error={fieldErrors.shippingGovernorate}
              disabled={isSubmitting}
            />

            {/* City / Area */}
            <Input
              id="checkout-shippingCityArea"
              label="المنطقة / الحي / المركز *"
              placeholder="مثال: المعادي، مدينة نصر، سموحة..."
              value={shippingCityArea}
              onChange={(e) => {
                setShippingCityArea(e.target.value);
                if (fieldErrors.shippingCityArea) setFieldErrors((prev) => ({ ...prev, shippingCityArea: undefined }));
              }}
              error={fieldErrors.shippingCityArea}
              disabled={isSubmitting}
              required
            />
          </div>

          {/* Detailed Address */}
          <div className="space-y-1.5">
            <label
              htmlFor="checkout-shippingDetailedAddress"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              العنوان بالتفصيل *
            </label>
            <textarea
              id="checkout-shippingDetailedAddress"
              rows={3}
              placeholder="اسم الشارع، رقم العمارة، رقم الدور والشقة، أو أقرب علامة مميزة..."
              value={shippingDetailedAddress}
              onChange={(e) => {
                setShippingDetailedAddress(e.target.value);
                if (fieldErrors.shippingDetailedAddress) {
                  setFieldErrors((prev) => ({ ...prev, shippingDetailedAddress: undefined }));
                }
              }}
              disabled={isSubmitting}
              className={`w-full rounded-md border border-input bg-background p-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors ${
                fieldErrors.shippingDetailedAddress ? 'border-destructive focus-visible:ring-destructive' : ''
              }`}
            />
            {fieldErrors.shippingDetailedAddress && (
              <p className="text-xs font-medium text-destructive">
                {fieldErrors.shippingDetailedAddress}
              </p>
            )}
          </div>

          {/* Save Address as Default Checkbox */}
          {isAuthenticated && (
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="checkout-saveAddress"
                type="checkbox"
                checked={saveAddress}
                onChange={(e) => setSaveAddress(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <label
                htmlFor="checkout-saveAddress"
                className="text-xs text-muted-foreground select-none cursor-pointer"
              >
                حفظ هذا العنوان كعنوان شحن افتراضي لطلباتي القادمة
              </label>
            </div>
          )}

          {/* Delivery Notes for Courier */}
          <div className="space-y-1.5">
            <label
              htmlFor="checkout-customerNotes"
              className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              تعليمات خاصة للمندوب (اختياري)
            </label>
            <textarea
              id="checkout-customerNotes"
              rows={2}
              placeholder="مثال: يرجى التوصيل بعد الساعة 5 مساءً، أو الاتصال قبل الوصول بنصف ساعة..."
              value={customerNotes}
              onChange={(e) => {
                setCustomerNotes(e.target.value);
                if (fieldErrors.customerNotes) setFieldErrors((prev) => ({ ...prev, customerNotes: undefined }));
              }}
              disabled={isSubmitting}
              className="w-full rounded-md border border-input bg-background p-3 text-sm text-foreground ring-offset-background placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
            />
            {fieldErrors.customerNotes && (
              <p className="text-xs font-medium text-destructive">
                {fieldErrors.customerNotes}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 3. Payment Method Card */}
      <Card className="border border-border/80 bg-card shadow-xs">
        <CardContent className="pt-5">
          <PaymentMethodSelector
            value={paymentMethod}
            onChange={setPaymentMethod}
            disabled={isSubmitting}
          />
        </CardContent>
      </Card>

      {/* 4. Action Button Card */}
      <div className="pt-2">
        <Button
          type="submit"
          variant="luxury"
          size="lg"
          disabled={isSubmitting}
          className="w-full py-4 text-base font-black shadow-lg gap-2 cursor-pointer min-h-[52px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
              <span>جاري معالجة طلبك بأمان...</span>
            </>
          ) : paymentMethod === 'CARD' ? (
            <>
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span>
                المتابعة للدفع الآمن عبر Paymob ({total.toLocaleString('ar-EG')} ج.م)
              </span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
              <span>
                تأكيد الطلب الآن ({total.toLocaleString('ar-EG')} ج.م عند الاستلام)
              </span>
            </>
          )}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center mt-2 flex items-center justify-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
          <span>
            {paymentMethod === 'CARD'
              ? 'سيتم نقلك لصفحة البنك المشفرة 3D Secure لإتمام الدفع بفيزا أو ماستركارد أو ميزة أو المحافظ.'
              : 'بالضغط على تأكيد الطلب، فإنك تؤكد رغبتك في الشراء والدفع نقداً عند استلام ومعاينة الشحنة.'}
          </span>
        </p>
      </div>
    </form>
  );
}
