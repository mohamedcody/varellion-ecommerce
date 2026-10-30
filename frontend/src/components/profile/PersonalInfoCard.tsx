'use client';

import React, { useState } from 'react';
import { Customer } from '@/types';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { validateProfile } from '@/lib/validations/customer';
import { ApiError } from '@/services/api';
import { User, Phone, Mail, CheckCircle2 } from 'lucide-react';

interface PersonalInfoCardProps {
  customer: Customer;
  onUpdate: (payload: { fullName: string; phoneNumber?: string }) => Promise<void>;
  isSaving: boolean;
}

export function PersonalInfoCard({ customer, onUpdate, isSaving }: PersonalInfoCardProps) {
  const [fullName, setFullName] = useState(customer.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(customer.phoneNumber || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    const validationErrors = validateProfile({ fullName, phoneNumber });
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      await onUpdate({ fullName, phoneNumber: phoneNumber || undefined });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.validationErrors) {
        setErrors(err.validationErrors);
      }
      // Error handled by parent page banner
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">البيانات الشخصية</h2>
            <p className="text-xs text-muted-foreground">بيانات الاتصال المستخدمة في الفواتير والتوصيل</p>
          </div>
        </div>
        {isSaved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            تم الحفظ بنجاح
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email - Read-only */}
        {customer.email && (
          <div className="space-y-1.5 text-start">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              البريد الإلكتروني الحساب
            </label>
            <div className="flex items-center gap-2 h-10 w-full rounded-md border border-input/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4 text-muted-foreground/70" />
              <span>{customer.email}</span>
            </div>
          </div>
        )}

        {/* Full Name */}
        <Input
          label="الاسم بالكامل *"
          placeholder="محمد أحمد علي"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: '' }));
          }}
          error={errors.fullName}
        />

        {/* Egyptian Phone Number */}
        <div className="space-y-1.5 text-start">
          <Input
            label="رقم الهاتف المحمول (مصر)"
            placeholder="01012345678"
            value={phoneNumber}
            onChange={(e) => {
              setPhoneNumber(e.target.value);
              if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: '' }));
            }}
            error={errors.phoneNumber}
            helperText="مخصص للتواصل مع مندوب التوصيل وتأكيد الأوردرات"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            isLoading={isSaving}
            className="w-full sm:w-auto px-6 text-xs gap-1.5"
          >
            حفظ التعديلات
          </Button>
        </div>
      </form>
    </div>
  );
}
