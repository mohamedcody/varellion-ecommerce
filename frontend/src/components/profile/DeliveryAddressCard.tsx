'use client';

import React, { useState, useEffect } from 'react';
import { CustomerAddress } from '@/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ShippingGovernorateSelect } from '@/components/checkout/ShippingGovernorateSelect';
import { validateAddress } from '@/lib/validations/customer';
import { ApiError } from '@/services/api';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';

interface DeliveryAddressCardProps {
  address?: CustomerAddress | null;
  onSaveAddress: (address: CustomerAddress) => Promise<void>;
  onDeleteRequest: () => void;
  isSaving: boolean;
}

export function DeliveryAddressCard({
  address,
  onSaveAddress,
  onDeleteRequest,
  isSaving,
}: DeliveryAddressCardProps) {
  const [isEditing, setIsEditing] = useState(!address);
  const [governorate, setGovernorate] = useState(address?.governorate || '');
  const [cityArea, setCityArea] = useState(address?.cityArea || '');
  const [detailedAddress, setDetailedAddress] = useState(address?.detailedAddress || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setGovernorate(address?.governorate || '');
    setCityArea(address?.cityArea || '');
    setDetailedAddress(address?.detailedAddress || '');
    setErrors({});
    if (!address) {
      setIsEditing(false);
    }
  }, [address]);

  const handleStartEdit = () => {
    setGovernorate(address?.governorate || '');
    setCityArea(address?.cityArea || '');
    setDetailedAddress(address?.detailedAddress || '');
    setErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setGovernorate(address?.governorate || '');
    setCityArea(address?.cityArea || '');
    setDetailedAddress(address?.detailedAddress || '');
    setErrors({});
    setIsEditing(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(false);

    const payload: CustomerAddress = {
      governorate,
      cityArea,
      detailedAddress,
    };

    const validationErrors = validateAddress(payload);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    try {
      await onSaveAddress(payload);
      setIsSaved(true);
      setIsEditing(false);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.validationErrors) {
        setErrors(err.validationErrors);
      }
      // Handled by parent error toast
    }
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-md p-6 space-y-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">عنوان التوصيل الافتراضي</h2>
            <p className="text-xs text-muted-foreground">العنوان الذي يظهر تلقائياً عند إتمام الطلب والدفع</p>
          </div>
        </div>

        {isSaved && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-500 font-medium animate-fade-in">
            <CheckCircle2 className="h-4 w-4" />
            تم الحفظ بنجاح
          </span>
        )}
      </div>

      {!isEditing && address ? (
        <div className="rounded-xl border border-border/50 bg-background/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
              {address.governorate}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleStartEdit}
                className="h-8 px-2.5 text-xs gap-1 text-muted-foreground hover:text-foreground"
              >
                <Edit2 className="h-3.5 w-3.5" />
                تعديل
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onDeleteRequest}
                className="h-8 px-2.5 text-xs gap-1 text-destructive/80 hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                حذف
              </Button>
            </div>
          </div>

          <div className="text-start space-y-1">
            <p className="text-sm font-semibold text-foreground">{address.cityArea}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{address.detailedAddress}</p>
          </div>
        </div>
      ) : isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <ShippingGovernorateSelect
            value={governorate}
            onChange={(val) => {
              setGovernorate(val);
              if (errors.governorate) setErrors((prev) => ({ ...prev, governorate: '' }));
            }}
            error={errors.governorate}
          />

          <Input
            label="المنطقة أو الحي *"
            placeholder="مثال: سموحة / مدينة نصر / الدقي"
            value={cityArea}
            onChange={(e) => {
              setCityArea(e.target.value);
              if (errors.cityArea) setErrors((prev) => ({ ...prev, cityArea: '' }));
            }}
            error={errors.cityArea}
          />

          <div className="space-y-1.5 text-start">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              العنوان بالتفصيل *
            </label>
            <textarea
              rows={3}
              placeholder="اسم الشارع، رقم العمارة، رقم الشقة، علامة مميزة بجوارك"
              value={detailedAddress}
              onChange={(e) => {
                setDetailedAddress(e.target.value);
                if (errors.detailedAddress) setErrors((prev) => ({ ...prev, detailedAddress: '' }));
              }}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 transition-colors"
            />
            {errors.detailedAddress && (
              <p className="text-xs font-medium text-destructive">{errors.detailedAddress}</p>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSaving}
              className="text-xs"
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              isLoading={isSaving}
              className="w-full sm:w-auto px-6 text-xs gap-1.5"
            >
              حفظ العنوان
            </Button>
          </div>
        </form>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 p-8 text-center space-y-3">
          <div className="h-10 w-10 mx-auto rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">لم تقم بتسجيل أي عنوان شحن حتى الآن</p>
            <p className="text-xs text-muted-foreground">أضف عنوانك المفضل لتسريع عملية الشراء والشحن بضغطة زر واحدة</p>
          </div>
          <Button
            type="button"
            onClick={() => setIsEditing(true)}
            variant="outline"
            className="text-xs gap-1.5 mt-2"
          >
            <Plus className="h-4 w-4" />
            إضافة عنوان شحن جديد
          </Button>
        </div>
      )}
    </div>
  );
}
