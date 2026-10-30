'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Customer, CustomerAddress } from '@/types';
import { customerService } from '@/services/customer';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PersonalInfoCard } from '@/components/profile/PersonalInfoCard';
import { DeliveryAddressCard } from '@/components/profile/DeliveryAddressCard';
import { DeleteAddressDialog } from '@/components/profile/DeleteAddressDialog';
import { useAuth } from '@/context/AuthContext';
import { Package, ShoppingBag, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const data = await customerService.getProfile();
      setCustomer(data);
      setErrorMessage(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحميل بيانات الملف الشخصي';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdateProfile = async (payload: { fullName: string; phoneNumber?: string }) => {
    try {
      setIsSavingProfile(true);
      setErrorMessage(null);
      const updated = await customerService.updateProfile(payload);
      setCustomer((prev) => (prev ? { ...prev, ...updated } : updated));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل تحديث البيانات الشخصية';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveAddress = async (address: CustomerAddress) => {
    try {
      setIsSavingAddress(true);
      setErrorMessage(null);
      const saved = await customerService.saveAddress(address);
      setCustomer((prev) => (prev ? { ...prev, address: saved } : null));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حفظ عنوان الشحن';
      setErrorMessage(msg);
      throw err;
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleConfirmDeleteAddress = async () => {
    try {
      setIsDeletingAddress(true);
      setErrorMessage(null);
      await customerService.deleteAddress();
      setCustomer((prev) => (prev ? { ...prev, address: null } : null));
      setIsDeleteDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'فشل حذف عنوان الشحن';
      setErrorMessage(msg);
    } finally {
      setIsDeletingAddress(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl space-y-8 animate-fade-in">
          {/* Top Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-6">
            <div className="text-start space-y-1">
              <span className="text-xs uppercase tracking-widest text-primary font-bold">
                حسابك في VARELLION
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                الملف الشخصي
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                مرحباً بك {customer?.fullName || user?.username}! يمكنك هنا إدارة بياناتك الشخصية وعناوين التوصيل
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <Link
                href="/track-order"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-border/60 bg-card/60 hover:bg-card text-xs font-semibold text-foreground transition-colors shadow-sm"
              >
                <Package className="h-4 w-4 text-primary" />
                تتبع طلباتك
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-semibold transition-colors shadow-sm"
              >
                <ShoppingBag className="h-4 w-4" />
                تسوق الآن
              </Link>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start" data-testid="profile-skeleton">
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4 animate-pulse">
                <div className="h-6 w-1/3 bg-muted/60 rounded" />
                <div className="h-10 bg-muted/40 rounded" />
                <div className="h-10 bg-muted/40 rounded" />
                <div className="h-10 bg-muted/40 rounded" />
              </div>
              <div className="rounded-2xl border border-border/60 bg-card/60 p-6 space-y-4 animate-pulse">
                <div className="h-6 w-1/3 bg-muted/60 rounded" />
                <div className="h-10 bg-muted/40 rounded" />
                <div className="h-10 bg-muted/40 rounded" />
                <div className="h-20 bg-muted/40 rounded" />
              </div>
            </div>
          )}

          {/* Main Profile Grid */}
          {!isLoading && customer && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <PersonalInfoCard
                customer={customer}
                onUpdate={handleUpdateProfile}
                isSaving={isSavingProfile}
              />

              <DeliveryAddressCard
                address={customer.address}
                onSaveAddress={handleSaveAddress}
                onDeleteRequest={() => setIsDeleteDialogOpen(true)}
                isSaving={isSavingAddress}
              />
            </div>
          )}

          {/* Privacy & Security Note */}
          <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/20 p-4 text-muted-foreground text-xs text-start">
            <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
            <p>
              بياناتك مشفرة ومحمية بأعلى معايير الأمان المصرفي. نستخدم بيانات التوصيل فقط لإصدار بوليصة الشحن وتوصيل طلباتك بأمان.
            </p>
          </div>
        </div>

        {/* Delete Address Confirmation Modal */}
        <DeleteAddressDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleConfirmDeleteAddress}
          isDeleting={isDeletingAddress}
        />
      </div>
    </AuthGuard>
  );
}
