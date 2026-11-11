'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Order, OrderStatus } from '@/types';
import {
  adminOrdersService,
  ORDER_STATUS_META,
  PagedOrdersResponse,
} from '@/services/adminOrders';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { OrderStatusUpdateDialog } from '@/components/admin/OrderStatusUpdateDialog';
import {
  Search,
  RefreshCw,
  AlertCircle,
  PackageCheck,
  ChevronRight,
  ChevronLeft,
  Calendar,
  Phone,
  User,
} from 'lucide-react';

export default function AdminOrdersPage() {
  const [data, setData] = useState<PagedOrdersResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [selectedOrderForUpdate, setSelectedOrderForUpdate] = useState<Order | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await adminOrdersService.getOrders({
        page,
        limit: 10,
        status: statusFilter || undefined,
        search: activeSearch || undefined,
      });
      setData(res);
    } catch (err: any) {
      setError(err?.message || 'فشل في تحميل قائمة الطلبات. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  }, [page, statusFilter, activeSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    setActiveSearch(searchInput.trim());
  };

  const handleStatusChangeSuccess = (updatedOrder: Order) => {
    setSuccessBanner(`تم تحديث حالة الطلب ${updatedOrder.orderNumber} بنجاح إلى "${updatedOrder.statusDisplayAr || updatedOrder.orderStatus}"`);
    setTimeout(() => setSuccessBanner(null), 5000);

    // Update locally in list to avoid full page reload jitter
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        orders: prev.orders.map((ord) =>
          ord.orderNumber === updatedOrder.orderNumber ? updatedOrder : ord
        ),
      };
    });
  };

  return (
    <AuthGuard requiredRole="ADMIN">
      <main className="container mx-auto px-4 py-8 max-w-7xl space-y-6 text-start">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">
                إدارة طلبات المتجر
              </h1>
              {data && (
                <Badge variant="outline" className="font-bold text-xs">
                  {data.totalElements} طلب إجمالي
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              متابعة وإدارة دورة حياة الطلبات وتحديث حالات الشحن والتوصيل.
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchOrders}
            disabled={isLoading}
            className="self-start sm:self-auto gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>تحديث القائمة</span>
          </Button>
        </div>

        {/* Success Banner */}
        {successBanner && (
          <div
            role="status"
            className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold flex items-center justify-between animate-fade-in"
          >
            <span>{successBanner}</span>
            <button
              onClick={() => setSuccessBanner(null)}
              className="text-xs underline hover:no-underline cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        )}

        {/* Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-card p-4 rounded-xl border border-border shadow-xs">
          <form onSubmit={handleSearchSubmit} className="sm:col-span-7 flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
              <Input
                type="text"
                placeholder="ابحث برقم الطلب، هاتف العميل، أو الاسم..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pr-10 h-10 text-sm"
              />
            </div>
            <Button type="submit" size="sm" variant="secondary" className="h-10 px-4">
              بحث
            </Button>
          </form>

          <div className="sm:col-span-5 flex items-center gap-2">
            <label htmlFor="filter-status" className="text-xs font-semibold text-muted-foreground shrink-0">
              الحالة:
            </label>
            <select
              id="filter-status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as OrderStatus | '');
                setPage(0);
              }}
              className="w-full h-10 px-3 rounded-lg border border-border bg-card text-foreground font-medium text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">جميع الحالات</option>
              {Object.keys(ORDER_STATUS_META).map((key) => (
                <option key={key} value={key}>
                  {ORDER_STATUS_META[key as OrderStatus]?.ar}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div
            role="alert"
            className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <Button size="sm" variant="outline" onClick={fetchOrders}>
              إعادة المحاولة
            </Button>
          </div>
        )}

        {/* Orders Table Container */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-start border-collapse text-sm">
              <thead>
                <tr className="bg-secondary/60 border-b border-border text-muted-foreground text-xs font-bold uppercase tracking-wider">
                  <th scope="col" className="py-3 px-4 text-start">رقم الطلب</th>
                  <th scope="col" className="py-3 px-4 text-start">بيانات العميل</th>
                  <th scope="col" className="py-3 px-4 text-start">التاريخ</th>
                  <th scope="col" className="py-3 px-4 text-start">الإجمالي</th>
                  <th scope="col" className="py-3 px-4 text-start">الحالة الحالية</th>
                  <th scope="col" className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={`skeleton-${idx}`} className="animate-pulse">
                      <td className="py-4 px-4"><Skeleton className="h-4 w-28 bg-muted/60" /></td>
                      <td className="py-4 px-4 space-y-1">
                        <Skeleton className="h-4 w-32 bg-muted/60" />
                        <Skeleton className="h-3 w-24 bg-muted/40" />
                      </td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-20 bg-muted/50" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-4 w-16 bg-muted/60" /></td>
                      <td className="py-4 px-4"><Skeleton className="h-6 w-24 rounded-full bg-muted/50" /></td>
                      <td className="py-4 px-4 text-center"><Skeleton className="h-8 w-24 mx-auto rounded-lg bg-muted/60" /></td>
                    </tr>
                  ))
                ) : data?.orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-muted-foreground">
                      <PackageCheck className="w-10 h-10 mx-auto text-muted-foreground/60 mb-2" aria-hidden="true" />
                      <p className="font-semibold text-base text-foreground">لا توجد طلبات مطابقة</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        جرب تغيير معايير البحث أو اختيار حالة أخرى.
                      </p>
                    </td>
                  </tr>
                ) : (
                  data?.orders.map((order) => {
                    const statusMeta = ORDER_STATUS_META[order.orderStatus];
                    const dateFormatted = new Date(order.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <tr key={order.orderId} className="hover:bg-secondary/20 transition-colors">
                        {/* Order Number */}
                        <td className="py-4 px-4 font-mono font-bold text-foreground text-xs dir-ltr text-end sm:text-start">
                          {order.orderNumber}
                        </td>

                        {/* Customer */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                            <span>{order.customerName}</span>
                          </div>
                          <div className="font-mono text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 dir-ltr justify-end sm:justify-start">
                            <Phone className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                            <span>{order.customerPhone}</span>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-4 px-4 text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" aria-hidden="true" />
                            <span>{dateFormatted}</span>
                          </div>
                        </td>

                        {/* Total Amount */}
                        <td className="py-4 px-4 font-bold text-foreground text-sm whitespace-nowrap">
                          {order.totalAmount.toLocaleString('en-US')} {order.currency}
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <Badge variant={statusMeta?.variant || 'secondary'} className="font-semibold">
                            {statusMeta?.ar || order.statusDisplayAr || order.orderStatus}
                          </Badge>
                        </td>

                        {/* Action: Update Status */}
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedOrderForUpdate(order)}
                            className="font-semibold text-xs h-8 px-3"
                          >
                            تحديث الحالة
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-secondary/30 text-xs">
              <span className="text-muted-foreground">
                صفحة <span className="font-bold text-foreground">{data.currentPage + 1}</span> من{' '}
                <span className="font-bold text-foreground">{data.totalPages}</span>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={data.currentPage === 0 || isLoading}
                  className="h-8 px-2.5"
                >
                  <ChevronRight className="w-4 h-4 ml-1" aria-hidden="true" />
                  <span>السابق</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(data.totalPages - 1, p + 1))}
                  disabled={data.currentPage >= data.totalPages - 1 || isLoading}
                  className="h-8 px-2.5"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4 mr-1" aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Order Status Update Dialog */}
        <OrderStatusUpdateDialog
          order={selectedOrderForUpdate}
          isOpen={!!selectedOrderForUpdate}
          onClose={() => setSelectedOrderForUpdate(null)}
          onSuccess={handleStatusChangeSuccess}
        />
      </main>
    </AuthGuard>
  );
}
