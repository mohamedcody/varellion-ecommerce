'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { requestApi } from '@/services/api';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';

interface AdminCustomer {
  customerId?: string;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  isActive?: boolean;
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestApi<
      | { data?: { customers?: AdminCustomer[] } }
      | { customers?: AdminCustomer[] }
    >('/admin/customers')
      .then((response) => {
        const directPayload = 'customers' in response ? response : null;
        const wrappedPayload = 'data' in response ? response.data : null;
        setCustomers(
          directPayload?.customers || wrappedPayload?.customers || []
        );
      })
      .catch((err: Error) => setError(err.message || 'تعذر تحميل العملاء'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = customers.filter((customer) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [
      customer.fullName,
      customer.username,
      customer.email,
      customer.phone,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <AuthGuard requiredRole="ADMIN">
      <main className="container mx-auto max-w-7xl px-4 py-8 text-start">
        <div className="mb-6 flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">
              إدارة بروفايلات العملاء
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              البحث عن العملاء وعرض بيانات حساباتهم وحالتهم
            </p>
          </div>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="ابحث بالاسم أو البريد أو الهاتف"
            aria-label="البحث عن عميل"
            className="w-full sm:w-80"
          />
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : loading ? (
          <div className="space-y-3" aria-label="جارٍ تحميل العملاء">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-16 rounded-xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
            لا توجد بيانات عملاء مطابقة للبحث
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="grid grid-cols-12 gap-3 border-b border-border bg-secondary/40 px-4 py-3 text-xs font-bold text-muted-foreground">
              <span className="col-span-4">العميل</span>
              <span className="col-span-4">البريد والهاتف</span>
              <span className="col-span-2">الحالة</span>
              <span className="col-span-2">الإجراء</span>
            </div>
            {filtered.map((customer) => (
              <div
                key={customer.customerId || customer.email || customer.username}
                className="grid grid-cols-12 gap-3 items-center border-b border-border px-4 py-4 last:border-0"
              >
                <div className="col-span-4 min-w-0">
                  <p className="truncate font-bold">
                    {customer.fullName || customer.username || 'عميل'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {customer.customerId || '—'}
                  </p>
                </div>
                <div className="col-span-4 min-w-0 text-sm">
                  <p className="truncate">{customer.email || '—'}</p>
                  <p className="truncate text-muted-foreground">
                    {customer.phone || '—'}
                  </p>
                </div>
                <p className="col-span-2 text-sm">
                  {customer.isActive === false ? 'غير نشط' : 'نشط'}
                </p>
                <p className="col-span-2 text-xs text-muted-foreground">
                  عرض التفاصيل
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
