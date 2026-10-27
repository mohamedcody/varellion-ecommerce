'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';
import { CheckCircle2, ShoppingBag, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function CartToast() {
  const { toastMessage, clearToast, openCart } = useCart();

  if (!toastMessage) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-primary/30 bg-background/95 backdrop-blur-md shadow-2xl text-foreground max-w-md w-[calc(100%-2rem)] animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />

      <p className="text-xs font-semibold flex-1 leading-snug line-clamp-1">
        {toastMessage}
      </p>

      <Button
        variant="luxury"
        size="sm"
        onClick={() => {
          clearToast();
          openCart();
        }}
        className="h-8 px-2.5 text-xs font-bold gap-1.5 shrink-0"
      >
        <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
        <span>عرض السلة</span>
      </Button>

      <button
        type="button"
        onClick={clearToast}
        className="text-muted-foreground hover:text-foreground p-1 transition-colors rounded-md min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer"
        aria-label="إغلاق الإشعار"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
