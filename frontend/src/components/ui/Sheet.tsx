'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  side?: 'left' | 'right';
  title?: string;
  className?: string;
}

export function Sheet({
  isOpen,
  onClose,
  children,
  side = 'right',
  title,
  className,
}: SheetProps) {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'sheet-title' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        className={cn(
          'fixed inset-y-0 z-50 flex h-full w-full max-w-md flex-col bg-card p-6 shadow-2xl transition ease-in-out duration-300 animate-in',
          side === 'right' ? 'right-0 slide-in-from-right' : 'left-0 slide-in-from-left',
          className
        )}
      >
        <div className="flex items-center justify-between border-b pb-4">
          {title && (
            <h2 id="sheet-title" className="text-lg font-bold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer mr-auto focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="إغلاق الدرج"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">{children}</div>
      </div>
    </div>
  );
}
