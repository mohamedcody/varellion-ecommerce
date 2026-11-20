'use client';

import React from 'react';
import { PaymentMethod } from '@/types';
import { Banknote, ShieldCheck, CheckCircle2, CreditCard, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodSelectorProps {
  value: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

export function PaymentMethodSelector({
  value,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  const handleKeyDown = (e: React.KeyboardEvent, currentMethod: PaymentMethod) => {
    if (disabled || currentMethod !== 'CASH_ON_DELIVERY') return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange('CASH_ON_DELIVERY');
    }
  };

  return (
    <div className="w-full space-y-3 text-start">
      <div className="flex items-center justify-between">
        <label id="payment-methods-label" className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          طريقة الدفع <span className="text-destructive">*</span>
        </label>
        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          دفع آمن عند الاستلام والمعاينة
        </span>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="payment-methods-label"
        className="space-y-3"
      >
        {/* Option 1: Cash on Delivery */}
        <div
          id="payment-opt-cod"
          role="radio"
          aria-checked={value === 'CASH_ON_DELIVERY'}
          tabIndex={value === 'CASH_ON_DELIVERY' ? 0 : -1}
          onClick={() => !disabled && onChange('CASH_ON_DELIVERY')}
          onKeyDown={(e) => handleKeyDown(e, 'CASH_ON_DELIVERY')}
          className={cn(
            'relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-[background-color,border-color,box-shadow] cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === 'CASH_ON_DELIVERY'
              ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
              : 'border-border bg-card/50 hover:bg-card/80 opacity-90'
          )}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'p-2.5 rounded-lg shrink-0 mt-0.5',
                value === 'CASH_ON_DELIVERY'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <Banknote className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  الدفع عند الاستلام (Cash on Delivery)
                </span>
                <span className="text-[10px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full">
                  شائع في مصر
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ادفع نقداً لمندوب الشحن عند استلام وفحص طلبيتك والتأكد من مطابقتها لأعلى معايير VARELLION.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 md:mt-0 mr-10 md:mr-0 shrink-0">
            <CheckCircle2
              className={cn(
                'h-5 w-5 transition-colors',
                value === 'CASH_ON_DELIVERY' ? 'text-primary' : 'text-muted-foreground/30'
              )}
              aria-hidden="true"
            />
          </div>
        </div>

        {/* Option 2: Paymob Online Payment (Deferred for initial COD-only release — AUD-009) */}
        <div
          id="payment-opt-card"
          role="radio"
          aria-checked={false}
          aria-disabled="true"
          tabIndex={-1}
          className="relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border border-border bg-muted/40 opacity-60 cursor-not-allowed select-none"
        >
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg shrink-0 mt-0.5 bg-muted text-muted-foreground">
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-muted-foreground">
                  الدفع الإلكتروني (Paymob)
                </span>
                <span className="text-[10px] bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  قريباً — الدفع عند الاستلام متاح حالياً
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                الدفع بالبطاقات والمحافظ الإلكترونية سيكون متاحاً قريباً. يمكنك حالياً إتمام طلبك بأمان عبر الدفع عند الاستلام مع معاينة كاملة قبل الدفع.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
