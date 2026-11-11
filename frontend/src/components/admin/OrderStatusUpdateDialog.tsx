'use client';

import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '@/types';
import {
  adminOrdersService,
  getPermittedNextStatuses,
  ORDER_STATUS_META,
} from '@/services/adminOrders';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

export interface OrderStatusUpdateDialogProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: Order) => void;
}

export function OrderStatusUpdateDialog({
  order,
  isOpen,
  onClose,
  onSuccess,
}: OrderStatusUpdateDialogProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentStatus = order?.orderStatus;
  const permittedNextStatuses = currentStatus ? getPermittedNextStatuses(currentStatus) : [];
  const isTerminal = permittedNextStatuses.length === 0;

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus('');
      setReason('');
      setErrorMessage(null);
      setIsSubmitting(false);
    }
  }, [isOpen, order?.orderNumber]);

  if (!order) return null;

  const currentMeta = currentStatus ? ORDER_STATUS_META[currentStatus] : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) {
      setErrorMessage('يرجى اختيار الحالة الجديدة للطلب');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const updated = await adminOrdersService.updateOrderStatus({
        orderNumber: order.orderNumber,
        newStatus: selectedStatus as OrderStatus,
        reason: reason.trim() || undefined,
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      const msg = err?.message || 'حدث خطأ أثناء محاولة تحديث حالة الطلب. يرجى المحاولة مرة أخرى.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="تحديث حالة الطلب"
      description={`الطلب رقم: ${order.orderNumber}`}
      className="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5 text-start">
        {/* Customer & Current Status Summary */}
        <div className="bg-secondary/40 p-3.5 rounded-xl border border-border/50 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">العميل:</span>
            <span className="font-semibold text-foreground">{order.customerName}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">رقم الهاتف:</span>
            <span className="font-mono text-xs text-foreground dir-ltr">{order.customerPhone}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-1 border-t border-border/40">
            <span className="text-muted-foreground font-medium">الحالة الحالية:</span>
            {currentMeta && (
              <Badge variant={currentMeta.variant} className="font-semibold">
                {currentMeta.ar}
              </Badge>
            )}
          </div>
        </div>

        {/* Error Banner */}
        {errorMessage && (
          <div
            role="alert"
            className="flex items-start gap-2.5 p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-fade-in"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isTerminal ? (
          <div className="p-4 rounded-xl bg-secondary/60 border border-border text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-muted-foreground" aria-hidden="true" />
            <p className="text-sm font-semibold text-foreground">
              هذا الطلب في حالة نهائية ({currentMeta?.ar})
            </p>
            <p className="text-xs text-muted-foreground">
              لا يمكن إجراء أي تحويلات إضافية على الطلبات المكتملة أو الملغاة.
            </p>
          </div>
        ) : (
          <>
            {/* Status Selector */}
            <div className="space-y-1.5">
              <label htmlFor="new-status-select" className="text-sm font-semibold text-foreground block">
                الحالة الجديدة <span className="text-destructive">*</span>
              </label>
              <select
                id="new-status-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                disabled={isSubmitting}
                className="w-full h-11 px-3.5 rounded-lg border border-border bg-card text-foreground font-medium text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors disabled:opacity-50"
                required
              >
                <option value="">اختر الحالة التالية المسموح بها...</option>
                {permittedNextStatuses.map((st) => (
                  <option key={st} value={st}>
                    {ORDER_STATUS_META[st]?.ar} ({ORDER_STATUS_META[st]?.en})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">
                يتم عرض الحالات المسموح بالانتقال إليها فقط وفقاً لقواعد دورة حياة الطلب.
              </p>
            </div>

            {/* Reason Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="status-reason-input" className="text-sm font-semibold text-foreground">
                  سبب التغيير (اختياري)
                </label>
                <span className="text-[11px] text-muted-foreground">{reason.length}/500</span>
              </div>
              <textarea
                id="status-reason-input"
                value={reason}
                onChange={(e) => setReason(e.target.value.slice(0, 500))}
                disabled={isSubmitting}
                rows={3}
                placeholder="مثال: تم تسليم الشحنة لشركة الشحن، رقم البوليصة #..."
                className="w-full p-3 rounded-lg border border-border bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none disabled:opacity-50"
              />
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            إلغاء
          </Button>
          {!isTerminal && (
            <Button
              type="submit"
              variant="default"
              isLoading={isSubmitting}
              disabled={isSubmitting || !selectedStatus}
            >
              حفظ التغيير
            </Button>
          )}
        </div>
      </form>
    </Dialog>
  );
}
