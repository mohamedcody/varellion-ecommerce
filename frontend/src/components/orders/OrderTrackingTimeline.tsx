'use client';

import React from 'react';
import { OrderStatus, OrderStatusHistory } from '@/types';
import { CheckCircle2, Package, Truck, Home, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTrackingTimelineProps {
  status: OrderStatus;
  createdAt: string;
  updatedAt?: string;
  governorate: string;
  statusHistory?: OrderStatusHistory[];
}

interface StepInfo {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const TRACKING_STEPS: StepInfo[] = [
  {
    id: 'received',
    label: 'تم استلام الطلب',
    description: 'تم تسجيل الطلب وتأكيد تفاصيل الشحن',
    icon: Clock,
  },
  {
    id: 'preparing',
    label: 'التجهيز الملكي والفحص',
    description: 'فحص جودة القطع وتغليفها في صندوق VARELLION الفاخر',
    icon: Package,
  },
  {
    id: 'shipped',
    label: 'مع مندوب التوصيل',
    description: 'خرجت الشحنة وفي طريقها إلى عنوانك في محافظتك',
    icon: Truck,
  },
  {
    id: 'delivered',
    label: 'تم التسليم بنجاح',
    description: 'تم فحص ومعاينة المنتجات وسداد المبلغ',
    icon: Home,
  },
];

function getActiveStepIndex(status: OrderStatus): number {
  switch (status) {
    case 'PENDING_CUSTOMER_CONFIRMATION':
    case 'CONFIRMED':
      return 0;
    case 'PREPARING':
      return 1;
    case 'SHIPPED':
      return 2;
    case 'DELIVERED':
      return 3;
    default:
      return 0;
  }
}

export function OrderTrackingTimeline({ status, createdAt, updatedAt, governorate, statusHistory = [] }: OrderTrackingTimelineProps) {
  const isDelivered = status === 'DELIVERED';
  const isCancelled = status === 'CANCELLED' || status === 'EXPIRED';
  const isFailed = status === 'DELIVERY_FAILED' || status === 'RETURNED';
  const activeIndex = getActiveStepIndex(status);

  // Formatted date with safety check against invalid/empty createdAt
  const formattedDate = React.useMemo(() => {
    if (!createdAt) return '';
    try {
      const d = new Date(createdAt);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('ar-EG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  }, [createdAt]);

  // Extract progression timestamps from status history if available
  const getStepTimestamp = (stepId: string): string | null => {
    let targetStatuses: string[] = [];
    if (stepId === 'received') targetStatuses = ['PENDING_CUSTOMER_CONFIRMATION', 'CONFIRMED'];
    else if (stepId === 'preparing') targetStatuses = ['PREPARING'];
    else if (stepId === 'shipped') targetStatuses = ['SHIPPED'];
    else if (stepId === 'delivered') targetStatuses = ['DELIVERED'];

    // Search in reverse order to obtain the latest progression timestamp for this milestone
    const entry = (statusHistory && statusHistory.length > 0)
      ? [...statusHistory].reverse().find((h) =>
          targetStatuses.some((ts) => ts.toLowerCase() === h.newStatus?.trim().toLowerCase())
        )
      : undefined;

    const dateStr = entry?.createdAt ||
      (stepId === 'received' ? createdAt : (stepId === 'delivered' && isDelivered ? (updatedAt || createdAt) : null));
    if (!dateStr) return null;

    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return null;
      return d.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6 text-start">
      {/* Alert Header if Cancelled or Failed */}
      {isCancelled && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>هذا الطلب تم إلغاؤه. للتواصل وإعادة التفعيل، يرجى محادثة خدمة عملاء VARELLION.</span>
        </div>
      )}

      {isFailed && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-semibold flex items-center gap-2"
        >
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>تعذر تسليم الشحنة. جاري إعادة المحاولة والتواصل مع المندوب.</span>
        </div>
      )}

      {/* Main Horizontal/Vertical Stepper (Semantic Ordered List for Screen Readers) */}
      <div className="relative">
        <ol role="list" aria-label="مراحل تتبع الطلب" className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-2">
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = !isCancelled && (isDelivered ? index <= activeIndex : index < activeIndex);
            const isCurrent = !isCancelled && !isDelivered && index === activeIndex;
            const Icon = step.icon;
            const stepTimestamp = getStepTimestamp(step.id);

            return (
              <li
                key={step.id}
                data-testid={`timeline-step-${step.id}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={cn(
                  'relative flex md:flex-col items-start gap-3.5 md:gap-2 p-3.5 rounded-xl border transition-all list-none',
                  isCurrent
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                    : isCompleted
                    ? 'border-emerald-500/30 bg-emerald-500/5'
                    : 'border-border/60 bg-card/40 opacity-70'
                )}
              >
                {/* Step Icon Badge */}
                <div
                  className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-colors',
                    isCurrent
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  )}
                </div>

                {/* Step Text Details */}
                <div className="space-y-0.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        'text-xs font-bold truncate',
                        isCurrent
                          ? 'text-primary'
                          : isCompleted
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {step.label}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] bg-primary/10 text-primary font-black px-1.5 py-0.2 rounded-full shrink-0 animate-pulse">
                        الآن
                      </span>
                    )}
                    {isCompleted && step.id === 'delivered' && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                        مكتمل
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  {stepTimestamp && (
                    <span className="text-[10px] text-muted-foreground/80 font-mono block pt-0.5" dir="ltr">
                      {stepTimestamp}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Trust Notice / Delivered Confirmation */}
      {isDelivered ? (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden="true" />
            <span>
              تم تسليم الطلب بنجاح للعميل — اكتملت جميع مراحل الشحن والتوصيل.
            </span>
          </span>
          <span className="text-[11px] bg-emerald-600 text-white font-bold px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            تم التسليم بنجاح
          </span>
        </div>
      ) : (
        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span>
              تاريخ تسجيل الطلب: <strong className="text-foreground">{formattedDate || 'غير محدد'}</strong>
            </span>
          </span>
          <span className="text-[11px] bg-primary/10 text-primary font-bold px-2 py-0.5 rounded-full self-start sm:self-auto">
            المعاينة متاحة مع المندوب قبل السداد
          </span>
        </div>
      )}
    </div>
  );
}
