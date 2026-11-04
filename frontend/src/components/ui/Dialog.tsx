'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function Dialog({
  isOpen,
  onClose,
  children,
  title,
  description,
  className,
}: DialogProps) {
  const dialogContentRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    // Save previous active element to restore on close
    previousActiveElementRef.current = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';

    // Auto-focus the first focusable element inside the dialog
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    const focusFirst = () => {
      const focusables = dialogContentRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusables && focusables.length > 0) {
        focusables[0].focus();
      }
    };
    focusFirst();
    const timer = setTimeout(focusFirst, 20);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key === 'Tab') {
        const focusables = dialogContentRef.current?.querySelectorAll<HTMLElement>(focusableSelector);
        if (!focusables || focusables.length === 0) {
          event.preventDefault();
          return;
        }

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === first || !dialogContentRef.current?.contains(document.activeElement)) {
            event.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last || !dialogContentRef.current?.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElementRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
      aria-describedby={description ? 'dialog-description' : undefined}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog Window */}
      <div
        ref={dialogContentRef}
        className={cn(
          'relative z-50 w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-2xl transition duration-200 animate-in zoom-in-95',
          className
        )}
      >
        <button
          onClick={onClose}
          className="absolute left-4 top-4 flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="إغلاق النافذة"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="space-y-2 pb-4 text-start">
          {title && (
            <h2 id="dialog-title" className="text-xl font-bold tracking-tight text-foreground">
              {title}
            </h2>
          )}
          {description && (
            <p id="dialog-description" className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}
