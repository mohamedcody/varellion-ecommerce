# VARELLION Admin Architecture — Frontend Integration Guide (Next.js 15)

> **Document Version:** 2.0.0  
> **Target Frontend Stack:** Next.js 15.2.1 (App Router), React 19, TypeScript, Tailwind CSS, Lucide Icons, Shadcn UI  
> **Audience:** Senior Frontend Engineer & Full-Stack UI Specialists  

---

## 1. Architectural Integration Principles

The VARELLION Admin Frontend is hosted within the unified Next.js App Router repository under the route directory `frontend/src/app/admin/`.

### Core Integration Rules:
1. **Server-Authoritative Authority:** Navigation visibility is UX filtering only. The frontend evaluates user permissions stored in React context to show/hide navigation items, but every action and data mutation is guarded by backend HTTP 403 enforcement.
2. **Memory-Only Access Token:** Access tokens are stored exclusively in React memory (`AuthContext.tsx`). **Never write access tokens to `localStorage` or `sessionStorage`**. On page reload or session expiration, the frontend calls `POST /api/auth/refresh` using the secure HttpOnly cookie.
3. **Arabic RTL Luxury Design System:** All administrative screens default to native Arabic RTL (`dir="rtl"`), styled using the luxury design tokens (Obsidian `#0E0F11`, Warm Ivory `#FAF9F6`, Brushed Gold `#C5A059`, Dark Teal `#12363B`) and `Tajawal` typography.
4. **Resilient Data Fetching & Optimistic Rollbacks:** Tables and dashboards use SWR or TanStack Query for caching and revalidation. Status update dialogs reflect loading states, disable duplicate clicks, and roll back immediately if the server returns HTTP 409 or 400.

---

## 2. Admin Page Hierarchy & Route Mapping

The following table maps every proposed Admin UI screen to its backend REST endpoints:

| Frontend Route | Page Title (Arabic) | Primary Purpose | Backend Endpoints Called | Required Permission |
| :--- | :--- | :--- | :--- | :--- |
| `/admin` | إعادة التوجيه | Redirects to `/admin/dashboard` | None | `dashboard:read` |
| `/admin/dashboard` | لوحة القيادة التنفيذية | Executive KPIs, revenue chart, order status breakdown, low-stock warnings | `GET /api/admin/dashboard/summary`<br>`GET /api/admin/dashboard/sales-chart`<br>`GET /api/admin/dashboard/order-breakdown`<br>`GET /api/admin/dashboard/stock-alerts` | `dashboard:read` |
| `/admin/orders` | إدارة الطلبات والتوصيل | Master orders table, status filters, search by phone/number, status transition modal | `GET /api/admin/orders`<br>`PUT /api/admin/orders/{orderNumber}/status`<br>`GET /api/admin/orders/export` | `orders:read`<br>`orders:update` |
| `/admin/orders/[orderNumber]` | تفاصيل الطلب والشحن | Order item snapshots, delivery address, courier notes, status audit history | `GET /api/admin/orders/{orderNumber}`<br>`PATCH /api/admin/orders/{orderNumber}/notes`<br>`PUT /api/admin/orders/{orderNumber}/shipping-address`<br>`POST /api/admin/orders/{orderNumber}/cancel` | `orders:read`<br>`orders:update`<br>`orders:cancel` |
| `/admin/products` | كتالوج المنتجات الفاخرة | Products table, category filter, active toggle, pricing, stock overview | `GET /api/admin/products`<br>`PATCH /api/admin/products/{productId}/status`<br>`DELETE /api/admin/products/{productId}` | `products:read`<br>`products:update`<br>`products:delete` |
| `/admin/products/new` | إضافة منتج فاخر جديد | Multi-section product creation form (bilingual titles, descriptions, pricing, gallery) | `POST /api/admin/products`<br>`GET /api/admin/categories` | `products:create` |
| `/admin/products/[productId]` | تعديل المنتج والوسائط | Edit product details, update prices, manage media gallery order | `GET /api/admin/products/{productId}`<br>`PUT /api/admin/products/{productId}`<br>`POST /api/admin/products/{productId}/images`<br>`DELETE /api/admin/products/{productId}/images/{imageId}` | `products:update` |
| `/admin/inventory` | إدارة المخزون والتسويات | Stock balances, available stock, restock modal, stock movement ledger | `GET /api/admin/inventory`<br>`GET /api/admin/inventory/low-stock`<br>`PATCH /api/admin/inventory/products/{productId}/stock`<br>`GET /api/admin/inventory/movements` | `inventory:read`<br>`inventory:update` |
| `/admin/categories` | أقسام وتصنيفات المتجر | Categories table, product counts, add/edit category modal | `GET /api/admin/categories`<br>`POST /api/admin/categories`<br>`PUT /api/admin/categories/{categoryId}`<br>`DELETE /api/admin/categories/{categoryId}` | `categories:read`<br>`categories:create`<br>`categories:update` |
| `/admin/customers` | سجلات العملاء | Customer directory, search by Egyptian phone, lifetime spend metrics | `GET /api/admin/customers`<br>`PATCH /api/admin/customers/{customerId}/status` | `customers:read`<br>`customers:update` |
| `/admin/customers/[customerId]` | الملف التجاري للعميل | Order history, address, return rate, staff communication notes | `GET /api/admin/customers/{customerId}`<br>`GET /api/admin/customers/{customerId}/orders`<br>`PATCH /api/admin/customers/{customerId}/notes` | `customers:read` |
| `/admin/shipping` | مناطق وأسعار الشحن | 27 governorates shipping zones, base fees, transit duration, region toggle | `GET /api/admin/shipping/zones`<br>`PUT /api/admin/shipping/zones/{zoneId}`<br>`PATCH /api/admin/shipping/governorates/{governorateId}/status` | `shipping:read`<br>`shipping:update` |
| `/admin/coupons` | قسائم التخفيض والعروض | Promo codes table, usage counters, create coupon modal | `GET /api/admin/coupons`<br>`POST /api/admin/coupons`<br>`PUT /api/admin/coupons/{couponId}`<br>`PATCH /api/admin/coupons/{couponId}/status` | `coupons:read`<br>`coupons:create` |
| `/admin/settings` | إعدادات وسياسات المتجر | Free shipping threshold, low stock threshold, contact phone, maintenance mode | `GET /api/admin/settings`<br>`PUT /api/admin/settings` | `settings:read`<br>`settings:update` |
| `/admin/users` | حسابات المسؤولين والصلاحيات | Staff users table, role assignment, lockout unlock, password reset | `GET /api/admin/users`<br>`POST /api/admin/users`<br>`PUT /api/admin/users/{userId}`<br>`POST /api/admin/users/{userId}/unlock` | `admins:read`<br>`admins:manage` |
| `/admin/roles` | مصفوفة الأدوار والصلاحيات | Standard and custom roles, 43 permission toggles | `GET /api/admin/roles`<br>`GET /api/admin/permissions`<br>`PUT /api/admin/roles/{roleId}/permissions` | `roles:read`<br>`roles:manage` |
| `/admin/reports` | التقارير المالية والتحليلات | Sales reports, product performance, governorate logistics, CSV exports | `GET /api/admin/reports/sales`<br>`GET /api/admin/reports/products`<br>`GET /api/admin/reports/shipping`<br>`GET /api/admin/reports/export` | `reports:read`<br>`reports:export` |
| `/admin/audit-logs` | سجل تدقيق العمليات الإدارية | Filterable immutable audit trail, actor lookup, state diff viewer | `GET /api/admin/audit-logs`<br>`GET /api/admin/audit-logs/{logId}` | `audit:read` |
| `/admin/support` | خدمة واستفسارات العملاء | Support inquiry queue, status updates, staff assignments | `GET /api/admin/support/inquiries`<br>`PATCH /api/admin/support/inquiries/{inquiryId}/status`<br>`POST /api/admin/support/inquiries/{inquiryId}/notes` | `support:read`<br>`support:update` |

---

## 3. Client-Side API Communication Layer (`api-client.ts`)

All frontend administrative network communication routes through a centralized HTTP client wrapper (`frontend/src/services/api.ts`):

```typescript
// Core Request Handler with Bearer Injection and Refresh Rotation
export async function requestAdminApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAccessTokenFromMemory(); // Never localStorage!
  
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle Token Expiry (401)
  if (response.status === 401) {
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      // Retry original request with new token
      return requestAdminApi<T>(endpoint, options);
    } else {
      redirectToLogin();
      throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
    }
  }

  // Handle Forbidden (403)
  if (response.status === 403) {
    throw new Error('ليس لديك الصلاحية الكافية لإتمام هذا الإجراء');
  }

  // Handle Conflict (409)
  if (response.status === 409) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'حدث تعارض في البيانات، يرجى تحديث الصفحة');
  }

  // Parse Envelope
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب');
  }

  return payload.data;
}
```

---

## 4. UI Patterns, Skeletons, and Empty States

### 4.1 Loading Skeletons
To ensure smooth perceptual performance, every administrative table and card view displays an animated skeleton placeholder while data is loading:
```tsx
export function AdminTableSkeleton({ columns = 6, rows = 8 }) {
  return (
    <div className="w-full space-y-3">
      <div className="flex justify-between items-center mb-4">
        <Skeleton className="h-10 w-64 bg-secondary/20" />
        <Skeleton className="h-10 w-32 bg-secondary/20" />
      </div>
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <div className="h-12 bg-muted/40 border-b border-border/40" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4 p-4 border-b border-border/20 last:border-0">
            {Array.from({ length: columns }).map((_, j) => (
              <Skeleton key={j} className="h-6 flex-1 bg-secondary/10" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 4.2 Standard Empty States
When a search filter or empty table yields zero results, render a stylized luxury empty state with a call-to-action:
```tsx
export function AdminEmptyState({
  title = "لا توجد نتائج مطابقة",
  description = "لم يتم العثور على أي سجلات تطابق معايير البحث المحددة حالياً.",
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/60 rounded-xl bg-card/40 my-6">
      <PackageOpen className="w-16 h-16 text-muted-foreground/40 mb-4 stroke-1" />
      <h3 className="font-serif text-lg font-medium text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {actionText && onAction && (
        <Button onClick={onAction} variant="outline" className="border-gold/40 text-gold hover:bg-gold/10">
          {actionText}
        </Button>
      )}
    </div>
  );
}
```

---

## 5. UI Status Badge Mappings & Arabic Localization

Every `OrderStatus` enum maps directly to standardized luxury badge variants:

```typescript
export const ORDER_STATUS_UI_META: Record<
  OrderStatus,
  {
    ar: string;
    variant: 'default' | 'luxury' | 'gold' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning';
  }
> = {
  PENDING_CUSTOMER_CONFIRMATION: { ar: 'بانتظار تأكيد العميل', variant: 'warning' },
  CONFIRMED: { ar: 'تم تأكيد الطلب', variant: 'secondary' },
  PREPARING: { ar: 'جاري التجهيز والتغليف', variant: 'secondary' },
  SHIPPED: { ar: 'مع مندوب الشحن', variant: 'default' },
  DELIVERED: { ar: 'تم التسليم بنجاح', variant: 'success' },
  DELIVERY_FAILED: { ar: 'فشل التوصيل (مؤجل)', variant: 'destructive' },
  CANCELLED: { ar: 'ملغي', variant: 'outline' },
  EXPIRED: { ar: 'منتهي الصلاحية (تلقائي)', variant: 'outline' },
  RETURNED: { ar: 'مرتجع بعد المعاينة', variant: 'destructive' },
  EXCHANGED: { ar: 'تم الاستبدال', variant: 'secondary' },
};
```

---

## 6. Frontend Permissions Guard Component (`<PermissionGate>`)

To conditionally render UI components based on the logged-in administrator's granted permissions:

```tsx
interface PermissionGateProps {
  permission: string | string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  permission,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { user } = useAuth();
  const userPermissions = user?.permissions || [];

  const required = Array.isArray(permission) ? permission : [permission];
  const hasAccess = requireAll
    ? required.every((p) => userPermissions.includes(p))
    : required.some((p) => userPermissions.includes(p));

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

---

## 7. Frontend Integration Summary

This guide provides frontend engineers with a turnkey reference: verified route hierarchies, typed API clients, standardized error handling, and reusable luxury UI components. The contracts eliminate ambiguity and ensure seamless communication with the Spring Boot backend.
