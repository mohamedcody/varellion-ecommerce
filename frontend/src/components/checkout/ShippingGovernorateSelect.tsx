'use client';

import React from 'react';
import { EGYPTIAN_GOVERNORATES } from '@/data/shippingZones';
import { MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingGovernorateSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

export function ShippingGovernorateSelect({
  value,
  onChange,
  error,
  disabled = false,
}: ShippingGovernorateSelectProps) {
  const selectId = 'shipping-governorate-select';

  return (
    <div className="w-full space-y-1.5 text-start">
      <div className="flex items-center justify-between">
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
        >
          المحافظة <span className="text-destructive">*</span>
        </label>
        {value && (
          <span className="text-[11px] text-primary/80 font-medium">
            توصيل سريع متاح
          </span>
        )}
      </div>

      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : undefined}
          className={cn(
            'flex h-11 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer pr-3 pl-10',
            error && 'border-destructive focus-visible:ring-destructive',
            !value && 'text-muted-foreground'
          )}
        >
          <option value="" disabled>
            اختر المحافظة لتحديد تكلفة ومدة الشحن...
          </option>
          {EGYPTIAN_GOVERNORATES.map((gov) => (
            <option key={gov.governorateAr} value={gov.governorateAr} className="bg-background text-foreground py-1">
              {gov.governorateAr} ({gov.estimatedDeliveryAr} - {gov.baseFee} ج.م)
            </option>
          ))}
        </select>

        {/* Decorative Pin Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
          <MapPin className="h-4 w-4" aria-hidden="true" />
        </div>
      </div>

      {error && (
        <p id={`${selectId}-error`} className="text-xs font-medium text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
