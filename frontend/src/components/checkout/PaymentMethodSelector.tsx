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
    if (disabled) return;

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(currentMethod);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextMethod: PaymentMethod = currentMethod === 'CASH_ON_DELIVERY' ? 'CARD' : 'CASH_ON_DELIVERY';
      onChange(nextMethod);
      const nextElement = document.getElementById(nextMethod === 'CASH_ON_DELIVERY' ? 'payment-opt-cod' : 'payment-opt-card');
      nextElement?.focus();
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
          معاملات بنكية مؤمنة 100%
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
            'relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
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

        {/* Option 2: Paymob Unified Hosted Checkout (Card, Meeza, Wallets, InstaPay) */}
        <div
          id="payment-opt-card"
          role="radio"
          aria-checked={value === 'CARD'}
          tabIndex={value === 'CARD' ? 0 : -1}
          onClick={() => !disabled && onChange('CARD')}
          onKeyDown={(e) => handleKeyDown(e, 'CARD')}
          className={cn(
            'relative flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl border transition-all cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            value === 'CARD'
              ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
              : 'border-border bg-card/50 hover:bg-card/80 opacity-90'
          )}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={cn(
                'p-2.5 rounded-lg shrink-0 mt-0.5',
                value === 'CARD'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <CreditCard className="h-5 w-5" aria-hidden="true" />
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold text-sm text-foreground">
                  الدفع الإلكتروني الفوري (Paymob Hosted Checkout)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Sparkles className="h-3 w-3" aria-hidden="true" />
                  أسرع للتجهيز والشحن
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                ادفع بأمان عبر صفحة البنك المشفرة (فيزا، ماستركارد، بطاقات ميزة، محافظ الموبايل مثل فودافون كاش، وإنستاباي).
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                <span className="border border-border/80 bg-background px-1.5 py-0.5 rounded font-mono">Visa</span>
                <span className="border border-border/80 bg-background px-1.5 py-0.5 rounded font-mono">Mastercard</span>
                <span className="border border-border/80 bg-background px-1.5 py-0.5 rounded font-mono">ميزة Meeza</span>
                <span className="border border-border/80 bg-background px-1.5 py-0.5 rounded font-mono">فودافون كاش</span>
                <span className="border border-border/80 bg-background px-1.5 py-0.5 rounded font-mono">InstaPay</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-3 md:mt-0 mr-10 md:mr-0 shrink-0">
            <CheckCircle2
              className={cn(
                'h-5 w-5 transition-colors',
                value === 'CARD' ? 'text-primary' : 'text-muted-foreground/30'
              )}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
