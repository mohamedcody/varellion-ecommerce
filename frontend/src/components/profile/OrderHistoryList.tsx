'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersService } from '@/services/orders';
import { Order, OrderStatus } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Package, Clock, ArrowLeft, ShoppingBag, Truck, CheckCircle2 } from 'lucide-react';

export function OrderHistoryList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOrders() {
      try {
        setIsLoading(true);
        const data = await ordersService.getMyOrders(0, 10);
        if (isMounted) {
          setOrders(data);
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }
    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const getStatusBadge = (status: OrderStatus, label?: string) => {
    const text = label || status;
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{text}</span>
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
            <Truck className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{text}</span>
          </span>
        );
      case 'CONFIRMED':
      case 'PENDING_CUSTOMER_CONFIRMATION':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#FAF4E8] text-[#876725] border border-[#C5A059]/30">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{text}</span>
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <Card className="border-border bg-card shadow-2xs">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-[#C5A059]" aria-hidden="true" />
            <span>سجل طلباتي السابقة</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
          <div className="h-16 rounded-xl bg-muted/40 animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="border-border bg-card shadow-2xs">
        <CardHeader className="border-b border-border/40 pb-4">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Package className="h-5 w-5 text-[#C5A059]" aria-hidden="true" />
            <span>سجل طلباتي السابقة</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground">
            <ShoppingBag className="w-6 h-6" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground">لا توجد طلبات سابقة مسجلة</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              لم تقم بتسجيل أي طلبات بعد. تصفح تشكيلتنا الفاخرة من الساعات والمصنوعات الجلدية الطبيعية 100%.
            </p>
          </div>
          <Link href="/products">
            <Button variant="luxury" size="sm" className="gap-2 font-bold min-h-[40px]">
              <span>تصفح المنتجات الفاخرة</span>
              <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card shadow-2xs text-start">
      <CardHeader className="border-b border-border/40 pb-4 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          <Package className="h-5 w-5 text-[#C5A059]" aria-hidden="true" />
          <span>سجل طلباتي السابقة</span>
        </CardTitle>
        <Badge variant="luxury" className="text-xs">
          {orders.length} {orders.length === 1 ? 'طلب' : 'طلبات'}
        </Badge>
      </CardHeader>
      <CardContent className="pt-4 divide-y divide-border/50">
        {orders.map((ord) => {
          const trackUrl = `/track-order?orderNumber=${encodeURIComponent(ord.orderNumber)}${
            ord.customerPhone ? `&phone=${encodeURIComponent(ord.customerPhone)}` : ''
          }`;

          return (
            <div key={ord.orderId || ord.orderNumber} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm text-foreground">{ord.orderNumber}</span>
                  {getStatusBadge(ord.orderStatus, ord.statusDisplayAr)}
                </div>
                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                  <span>
                    التاريخ:{' '}
                    {new Date(ord.createdAt).toLocaleDateString('ar-EG', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <span>•</span>
                  <span>{ord.items?.length || 1} منتجات</span>
                  <span>•</span>
                  <span className="font-bold text-foreground tabular-nums">
                    {ord.totalAmount.toLocaleString('ar-EG')} ج.م
                  </span>
                </div>
              </div>

              <Link href={trackUrl}>
                <Button variant="outline" size="sm" className="gap-1.5 text-xs font-bold w-full sm:w-auto min-h-[38px]">
                  <span>تتبع مسار الشحنة</span>
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
