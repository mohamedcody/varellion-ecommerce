'use client';

import { useEffect, useState } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { requestApi } from '@/services/api';
import { Skeleton } from '@/components/ui/Skeleton';

interface DashboardSummary {
  totalOrders?: number;
  totalRevenue?: number;
  totalCustomers?: number;
  lowStockProducts?: number;
}

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    requestApi<{ data?: DashboardSummary } | DashboardSummary>(
      '/admin/dashboard/summary'
    )
      .then((response) => {
        const directPayload =
          'totalOrders' in response ||
          'totalRevenue' in response ||
          'totalCustomers' in response ||
          'lowStockProducts' in response
            ? (response as DashboardSummary)
            : null;
        const wrappedPayload = 'data' in response ? response.data : null;
        setSummary(directPayload || wrappedPayload || null);
      })
      .catch((err: Error) => setError(err.message || 'تعذر تحميل الإحصائيات'));
  }, []);

  const cards = [
    { label: 'إجمالي الطلبات', value: summary?.totalOrders ?? '—' },
    {
      label: 'إجمالي الإيرادات',
      value: summary?.totalRevenue ? `${summary.totalRevenue} ج.م` : '—',
    },
    { label: 'إجمالي العملاء', value: summary?.totalCustomers ?? '—' },
    {
      label: 'المنتجات منخفضة المخزون',
      value: summary?.lowStockProducts ?? '—',
    },
  ];

  return (
    <AuthGuard requiredRole="ADMIN">
      <main className="container mx-auto max-w-7xl px-4 py-8 text-start">
        <div className="mb-6 border-b border-border pb-4">
          <h1 className="text-2xl font-extrabold sm:text-3xl">
            لوحة تحكم الإدارة
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            نظرة عامة على أداء المتجر والطلبات والعملاء
          </p>
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          >
            {error}
          </div>
        ) : !summary ? (
          <div
            className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            aria-label="جارٍ تحميل الإحصائيات"
          >
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {cards.map((card) => (
              <section
                key={card.label}
                className="rounded-xl border border-border bg-card p-5 shadow-sm"
              >
                <p className="text-sm text-muted-foreground">{card.label}</p>
                <p className="mt-3 text-2xl font-black text-foreground">
                  {card.value}
                </p>
              </section>
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
