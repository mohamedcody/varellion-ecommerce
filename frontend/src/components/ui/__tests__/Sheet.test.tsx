import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sheet } from '../Sheet';
import { Dialog } from '../Dialog';

describe('Sheet - Focus Trap, Auto-Focus & Return-Focus', () => {
  it('traps focus within sheet when tabbing forward and backward', () => {
    const handleClose = vi.fn();
    render(
      <div>
        <button data-testid="outside-button">Outside</button>
        <Sheet isOpen={true} onClose={handleClose} title="نافذة الاختبار">
          <button data-testid="inside-btn-1">Button 1</button>
          <button data-testid="inside-btn-2">Button 2</button>
        </Sheet>
      </div>
    );

    const closeBtn = screen.getByRole('button', { name: /إغلاق الدرج/i });
    const btn1 = screen.getByTestId('inside-btn-1');
    const btn2 = screen.getByTestId('inside-btn-2');

    // Focus starts at first focusable element (close button or btn1)
    expect(document.activeElement).toBe(closeBtn);

    // Tab from close button to btn1
    btn1.focus();
    expect(document.activeElement).toBe(btn1);

    // Tab from btn1 to btn2 (last focusable element)
    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    // Pressing Tab on the last element should wrap around to the first element (closeBtn)
    fireEvent.keyDown(btn2, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);

    // Pressing Shift+Tab on first element should wrap around to last element (btn2)
    fireEvent.keyDown(closeBtn, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(btn2);
  });

  it('traps focus within Dialog when tabbing', () => {
    const handleClose = vi.fn();
    render(
      <Dialog isOpen={true} onClose={handleClose} title="عنوان الحوار" description="وصف الحوار">
        <button data-testid="dialog-btn-1">Action 1</button>
        <button data-testid="dialog-btn-2">Action 2</button>
      </Dialog>
    );

    const closeBtn = screen.getByRole('button', { name: /إغلاق النافذة/i });
    const btn1 = screen.getByTestId('dialog-btn-1');
    const btn2 = screen.getByTestId('dialog-btn-2');

    expect(document.activeElement).toBe(closeBtn);

    btn2.focus();
    fireEvent.keyDown(btn2, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(closeBtn);
  });
});
