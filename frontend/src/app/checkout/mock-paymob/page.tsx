'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { ShieldCheck, CreditCard, Lock, ArrowRight, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

function MockPaymobContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderNumber = searchParams.get('orderNumber') || 'VAR-PENDING';
  const amount = searchParams.get('amount') || '0';
  const customerName = searchParams.get('customerName') || 'عميل VARELLION';

  const [loadingAction, setLoadingAction] = useState<'success' | 'failure' | null>(null);

  const handleSimulateSuccess = () => {
    setLoadingAction('success');
    setTimeout(() => {
      router.push(
        `/checkout/callback?success=true&orderNumber=${encodeURIComponent(
          orderNumber
        )}&transactionId=PAYMOB_TXN_${Date.now()}`
      );
    }, 1200);
  };

  const handleSimulateFailure = () => {
    setLoadingAction('failure');
    setTimeout(() => {
      router.push(
        `/checkout/callback?success=false&orderNumber=${encodeURIComponent(
          orderNumber
        )}&errorMessage=${encodeURIComponent('تم رفض العملية من البنك: رصيد غير كافٍ أو خطأ في كود OTP')}`
      );
    }, 1000);
  };

  const handleCancel = () => {
    router.push('/checkout');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4 text-start">
        {/* Simulator Banner */}
        <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 p-3 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" aria-hidden="true" />
          <span>
            <strong>بيئة محاكاة تجريبية (Paymob Sandbox Simulator):</strong> لاختبار دورة الدفع بنجاح وفشل دون سحب رصيد حقيقي.
          </span>
        </div>

        {/* Paymob Styled Container */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-5 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 font-black tracking-wider text-lg">
                <ShieldCheck className="h-6 w-6 text-emerald-300" aria-hidden="true" />
                <span>PAYMOB CHECKOUT</span>
              </div>
              <span className="text-[10px] bg-white/20 font-mono px-2 py-0.5 rounded">
                3D-Secure 2.0
              </span>
            </div>

            <div className="text-xs text-blue-100/90 flex justify-between items-baseline">
              <span>المتجر: <strong>VARELLION Luxury</strong></span>
              <span className="font-mono text-sm font-bold text-white">
                {Number(amount).toLocaleString('ar-EG')} ج.م
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5 text-xs text-slate-300">
            <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60">
              <div className="flex justify-between">
                <span className="text-slate-400">رقم الطلب:</span>
                <span className="font-mono text-slate-200 font-bold">{orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">اسم العميل:</span>
                <span className="text-slate-200">{customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">القنوات المقبولة:</span>
                <span className="text-slate-200">Visa / Mastercard / Meeza / Wallets</span>
              </div>
            </div>

            {/* Test Action Buttons */}
            <div className="space-y-3 pt-2">
              <Button
                type="button"
                onClick={handleSimulateSuccess}
                disabled={loadingAction !== null}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 text-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                {loadingAction === 'success' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>جاري معالجة موافقة البنك...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <span>محاكاة دفع ناجح (3D Secure Approved)</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                onClick={handleSimulateFailure}
                disabled={loadingAction !== null}
                className="w-full bg-rose-600/80 hover:bg-rose-600 text-white font-bold py-3 text-xs flex items-center justify-center gap-2 cursor-pointer min-h-[44px]"
              >
                {loadingAction === 'failure' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>جاري تسجيل رفض البنك...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                    <span>محاكاة فشل العملية (Card Declined / OTP Error)</span>
                  </>
                )}
              </Button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loadingAction !== null}
                className="w-full text-center text-slate-400 hover:text-slate-200 text-xs py-2 cursor-pointer underline"
              >
                إلغاء المعاملة والرجوع لسلة الشراء
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MockPaymobPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white text-xs">
          جاري فتح بوابة الدفع...
        </div>
      }
    >
      <MockPaymobContent />
    </Suspense>
  );
}
