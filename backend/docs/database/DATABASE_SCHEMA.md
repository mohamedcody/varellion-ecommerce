# مخطط وقواعد قاعدة بيانات VARELLION الحية
# VARELLION Live Database Schema & Rules

> **المصدر:** الفحص الميداني الحي لقاعدة بيانات Supabase (PostgreSQL 17.11 على AWS EU-West-1)  
> **حالة الهجرات:** 5 هجرات مطبقة بنجاح كامل بواسطة Flyway (`V1` إلى `V5`).  
> **مرجع الفحص الصارم:** `docs/database/database_snapshot.txt`.

---

## 1. ملخص الجداول الـ 10 الحية (Live Database Tables Summary)

| الرقم | اسم الجدول في PostgreSQL | ملف الهجرة المنشئ له | المسؤولية والدور التجاري |
| :---: | :--- | :--- | :--- |
| **1** | `public.customers` | `V1__create_customers_and_addresses.sql` | الملف الشخصي للمتسوق المرتبط بنظام الهوية. |
| **2** | `public.customer_addresses` | `V1__create_customers_and_addresses.sql` | عناوين الشحن والتوصيل المسجلة للعميل. |
| **3** | `public.categories` | `V2__create_categories.sql` | أقسام وتصنيفات المتجر مع الأسماء ثنائية اللغة والـ Slug. |
| **4** | `public.products` | `V2` & `V3` | المنتجات، الأسعار، المخزون، والكميات المحجوزة، و الـ SKU. |
| **5** | `public.product_images` | `V2__create_categories.sql` | روابط ومعرض صور المنتجات وترتيب عرضها والصورة الرئيسية. |
| **6** | `public.carts` | `V4__create_carts_and_cart_items.sql` | سلة التسوق النشطة للعميل (سلة واحدة فريدة لكل عميل). |
| **7** | `public.cart_items` | `V4__create_carts_and_cart_items.sql` | المنتجات والكميات المضافة داخل السلة. |
| **8** | `public.orders` | `V5__create_orders_module.sql` | سجلات الطلبات المالية، العناوين، وحالة الشحن والدفع. |
| **9** | `public.order_items` | `V5__create_orders_module.sql` | لقطة تاريخية للمنتجات والأسعار والكميات وقت الشراء. |
| **10** | `public.order_status_history` | `V5__create_orders_module.sql` | السجل التاريخي لتتبع تغيرات حالة الطلب والمسؤول والسبب. |

---

## 2. التفاصيل الهيكلية والقيود الصارمة (Schema Attributes & Constraints)

### 2.1 جدول الأقسام (`public.categories`)
- `category_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `name_ar`: `TEXT NOT NULL`
- `name_en`: `TEXT NOT NULL`
- `slug`: `TEXT NOT NULL UNIQUE`
- `description_ar`: `TEXT NULL`
- `description_en`: `TEXT NULL`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at` / `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2.2 جدول المنتجات (`public.products`)
- `product_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `category_id`: `UUID NOT NULL REFERENCES public.categories(category_id) ON DELETE RESTRICT`
- `name_ar`: `TEXT NOT NULL`
- `name_en`: `TEXT NOT NULL`
- `description_ar`: `TEXT NULL`
- `description_en`: `TEXT NULL`
- `price`: `NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (price >= 0)`
- `cost_price`: `NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (cost_price >= 0)`
- `stock_quantity`: `INTEGER NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0)`
- `reserved_quantity`: `INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0)`
- `sku`: `VARCHAR(100) NULL`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at` / `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`
- **قيد حجز المخزون الصارم:**
  ```sql
  CONSTRAINT chk_stock_available CHECK (reserved_quantity <= stock_quantity)
  ```

### 2.3 جدول صور المنتجات (`public.product_images`)
- `image_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `product_id`: `UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE`
- `image_url`: `TEXT NOT NULL`
- `is_main`: `BOOLEAN NOT NULL DEFAULT FALSE`
- `display_order`: `INTEGER NOT NULL DEFAULT 0`
- `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2.4 جدول العملاء (`public.customers`)
- `user_id`: `UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE RESTRICT`
- `full_name`: `VARCHAR(150) NULL`
- `phone_number`: `VARCHAR(30) NULL`
- `is_active`: `BOOLEAN NOT NULL DEFAULT TRUE`
- `created_at` / `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2.5 جدول عناوين العملاء (`public.customer_addresses`)
- `address_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `customer_id`: `UUID NOT NULL REFERENCES public.customers(user_id) ON DELETE CASCADE`
- `governorate`: `TEXT NOT NULL`
- `city_area`: `TEXT NOT NULL`
- `detailed_address`: `TEXT NOT NULL`
- `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2.6 جدول السلة (`public.carts`) وعناصر السلة (`public.cart_items`)
- `carts.cart_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `carts.customer_id`: `UUID NOT NULL UNIQUE REFERENCES public.customers(user_id) ON DELETE CASCADE`
- `cart_items.cart_item_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `cart_items.cart_id`: `UUID NOT NULL REFERENCES public.carts(cart_id) ON DELETE CASCADE`
- `cart_items.product_id`: `UUID NOT NULL REFERENCES public.products(product_id) ON DELETE CASCADE`
- `cart_items.quantity`: `INTEGER NOT NULL CHECK (quantity > 0)`
- **قيد فريد:** `UNIQUE (cart_id, product_id)` لمنع تكرار المنتج في نفس السلة.

### 2.7 جدول الطلبات (`public.orders`)
- `order_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `order_number`: `VARCHAR(32) NOT NULL UNIQUE CHECK (LENGTH(TRIM(order_number)) >= 6)`
- `customer_id`: `UUID NOT NULL REFERENCES public.customers(user_id) ON DELETE RESTRICT`
- `customer_name`: `VARCHAR(150) NOT NULL`
- `customer_phone`: `VARCHAR(30) NOT NULL`
- `shipping_governorate`: `VARCHAR(100) NOT NULL`
- `shipping_city_area`: `VARCHAR(100) NOT NULL`
- `shipping_detailed_address`: `TEXT NOT NULL`
- `currency`: `VARCHAR(3) NOT NULL DEFAULT 'EGP' CHECK (currency = 'EGP')`
- `subtotal`: `NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0)`
- `discount_total`: `NUMERIC(10, 2) NOT NULL DEFAULT 0.00`
- `shipping_fee`: `NUMERIC(10, 2) NULL CHECK (shipping_fee IS NULL OR shipping_fee >= 0)`
- `total_amount`: `NUMERIC(10, 2) NULL CHECK (total_amount IS NULL OR total_amount >= 0)`
- `order_status`: `VARCHAR(50) NOT NULL DEFAULT 'PENDING_CUSTOMER_CONFIRMATION'`
  - الحالات المسموحة: `PENDING_CUSTOMER_CONFIRMATION`, `CONFIRMED`, `PREPARING`, `SHIPPED`, `DELIVERED`, `DELIVERY_FAILED`, `CANCELLED`, `EXPIRED`.
- `shipping_fee_status`: `VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (shipping_fee_status IN ('PENDING', 'CONFIRMED'))`
- `confirmation_deadline`: `TIMESTAMPTZ NULL` (مهلة الـ 24 ساعة)
- `customer_notes` / `admin_notes`: `TEXT NULL`
- `created_at` / `updated_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

### 2.8 جدول عناصر الطلب (`public.order_items`)
- `order_item_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `order_id`: `UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE`
- `product_id`: `UUID NULL REFERENCES public.products(product_id) ON DELETE RESTRICT`
- `product_name_ar`: `TEXT NOT NULL`
- `product_name_en`: `TEXT NOT NULL`
- `sku`: `VARCHAR(100) NOT NULL`
- `unit_price`: `NUMERIC(10, 2) NOT NULL CHECK (unit_price >= 0)`
- `unit_cost`: `NUMERIC(10, 2) NOT NULL DEFAULT 0.00`
- `quantity`: `INTEGER NOT NULL CHECK (quantity > 0)`
- `line_total`: `NUMERIC(10, 2) NOT NULL CHECK (line_total >= 0)`
- **قيد فريد:** `UNIQUE (order_id, product_id)` لمنع تكرار نفس المنتج في سطور طلب واحد.

### 2.9 جدول تاريخ حالات الطلب (`public.order_status_history`)
- `history_id`: `UUID PRIMARY KEY DEFAULT gen_random_uuid()`
- `order_id`: `UUID NOT NULL REFERENCES public.orders(order_id) ON DELETE CASCADE`
- `previous_status`: `VARCHAR(50) NULL`
- `new_status`: `VARCHAR(50) NOT NULL`
- `reason`: `TEXT NULL`
- `actor_id`: `UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL`
- `created_at`: `TIMESTAMPTZ NOT NULL DEFAULT NOW()`

---

## 3. قواعد ونزاهة العمليات المالية والمخزنية (Invariants & Rules)
1. **الكمية المتاحة للبيع:**
   $$\text{Available Stock} = \text{stock\_quantity} - \text{reserved\_quantity}$$
2. **إنشاء الطلب وحجز المخزون:**
   عند إتمام الطلب، يتم حجز الكمية (`reserved_quantity += quantity`)، وضبط `confirmation_deadline = NOW() + INTERVAL '24 hours'`.
3. **تحرير المخزون عند الإلغاء أو انتهاء المهلة:**
   إذا انتقلت الحالة إلى `CANCELLED` أو `EXPIRED`، يتم تحرير الكمية المحجوزة فوراً وذرياً (`reserved_quantity -= quantity`).
4. **ثبات أسعار الطلبات التاريخية:**
   أسماء المنتجات وأسعارها و الـ SKU يتم حفظ لقطة منها في `order_items` لضمان عدم تأثر الفواتير القديمة بأي تغيير مستقبلي في أسعار الكتالوج.
