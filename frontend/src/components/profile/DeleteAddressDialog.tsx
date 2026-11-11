'use client';

import React from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Trash2, AlertTriangle } from 'lucide-react';

interface DeleteAddressDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function DeleteAddressDialog({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}: DeleteAddressDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={isDeleting ? () => {} : onClose}
      title="حذف عنوان الشحن"
      className="max-w-md"
    >
      <div className="space-y-4 pt-2 text-start">
        <div className="flex items-start gap-3 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">
            هل أنت متأكد من رغبتك في حذف عنوان الشحن المسجل؟ لن تتمكن من استرجاعه وستحتاج لإدخال عنوان جديد عند طلبك القادم.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="text-xs"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            isLoading={isDeleting}
            className="text-xs gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            تأكيد الحذف
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
