# 🚀 VARELLION — Bruno API Testing Suite

مجموعة طلبات Bruno الاحترافية لاختبار وفحص جميع واجهات برمجة التطبيقات (APIs) الخاصة بمشروع **VARELLION** خطوة بخطوة وبأعلى معايير الأمان والاختبارات الآلية! 🎉

---

## 📂 1. طريقة فتح المجموعة في Bruno

1. افتح برنامج **Bruno** على جهازك.
2. اضغط على **"Open Collection"**.
3. حدد مجلد `bruno` داخل المشروع:
   ```text
   /home/mohamed-saad/Desktop/BRAND/bruno
   ```
4. في أعلى يمين نافذة Bruno، تأكد من اختيار بيئة **`Local`** (من قائمة Environments).

---

## 🗂️ 2. الهيكل والمجموعات المنظمة (Feature by Feature)

### `01-authentication/` — المصادقة وإدارة الجلسات:
* `01. Register - Valid User (Happy Path)` ➔ تسجيل مستخدم جديد مع توليد اسم وإيميل تلقائي ديناميكي وحفظ الـ Token.
* `02. Register - Duplicate Email Conflict` ➔ فحص رفض تكرار الإيميل (`400 Bad Request`).
* `03. Register - Validation - Weak Password` ➔ فحص رفض كلمات المرور الأقل من 8 خانات.
* `04. Register - Validation - Invalid Email` ➔ فحص رفض الإيميل غير المطابق للشروط.
* `05. Login - Valid Credentials (Happy Path)` ➔ تسجيل الدخول وتخزين الـ Access و Refresh Token تلقائياً في متغيرات Bruno.
* `06. Login - Security Test - Invalid Password` ➔ فحص رفض الباسوورد الخاطئ (`401 Unauthorized`).
* `07. Login - Security Test - Nonexistent User` ➔ فحص منع استكشاف الحسابات (Anti-Enumeration).
* `08. Refresh Token - Valid Token` ➔ تجديد الـ Access Token تلقائياً.
* `09. Refresh Token - Security Test - Malformed Token` ➔ رفض التوكن التالف أو المزور.
* `10. Logout User - Clear Session` ➔ تسجيل الخروج وتصفير الكوكيز والتخزين.
* `11. Google Login - Verification` ➔ تسجيل الدخول بحساب Google.
* `12. Security Test - Rate Limiter` ➔ فحص حماية الهجمات المتكررة (Rate Limiting).

### `02-customer-profile/` — ملف العميل وعناوين التوصيل:
* `01. Get Customer Profile & Address` ➔ استرجاع بيانات العميل الحالي والعنوان المسجل.
* `02. Update Profile` ➔ تحديث الاسم ورقم الهاتف المصري.
* `03. Save or Update Delivery Address (Upsert)` ➔ تسجيل أو تعديل عنوان التوصيل.
* `04. Delete Delivery Address` ➔ حذف عنوان التوصيل.
* `05. Security Test - Unauthorized Access` ➔ رفض الوصول بدون توكن (`401 Unauthorized`).

### `03-orders/` — إدارة وإنشاء الطلبات وحجز المخزون والتتبع:
* **`01-successful-creation/`** ➔ إنشاء الطلبات بنجاح (Single-Item COD، Multi-Item، الشحن المجاني فوق 2500 ج.م، وملاحظات التوصيل).
* **`02-request-validation/`** ➔ فحص صحة المدخلات (الجسم الفارغ، غياب الاسم/الهاتف/المحافظة، الكميات الصفرية والسالبة، تكرار المنتج، والأخطاء النحوية للـ JSON).
* **`03-authentication-authorization/`** ➔ حماية الـ Endpoints المحمية وفحص رفض التوكنات المزورة أو الناقصة.
* **`04-inventory-stock/`** ➔ فحص المنتجات غير الموجودة (404) وطلب كميات تفوق المخزون (400) وعدم تسريب الحجز.
* **`05-pricing-calculations/`** ➔ التدقيق في التسعير السيرفري المعتمد وحساب شرائح شحن المحافظات (القاهرة 50، الإسكندرية 60، الدلتا والقناة 65، الصعيد 75، والمحافظات الحدودية 85 ج.م).
* **`06-idempotency/`** ➔ منع تكرار الطلبات عبر الـ `Idempotency-Key` وإرجاع الاستجابة المخبأة فورياً بدون خصم مخزون إضافي.
* **`07-concurrency/`** ➔ حماية تضارب الطلبات المتزامنة (409 Conflict) وشرح الـ `PESSIMISTIC_WRITE` Lock.
* **`08-transactions-rollback/`** ➔ فحص الـ Atomicity والتراجع الكامل عن الحجز عند فشل أحد بنود الطلب المتعدد.
* **`09-status-and-tracking/`** ➔ تفاصيل الطلب، قائمة طلباتي (My Orders)، وتتبع الطلبات العام عبر POST و GET ورقم الهاتف.
* **`10-customer-isolation/`** ➔ عزل بيانات العملاء وحماية الـ IDOR (رفض وصول العميل B لطلب العميل A).
* **`11-boundary-edge-cases/`** ➔ اختبارات الحدود القصوى (اسم عميل 150 حرف، تطبيع الهاتف المصري +20، والـ Pagination).
* **`12-regression-tests/`** ➔ اختبارات الانحدار وفحص حقن الـ SQL وفحص التدفق المتكامل (Smoke Test).

---

## 📘 3. التوثيق والمراجع الهندسية

* **فهرس وتفاصيل جميع الـ Endpoints:** [`docs/testing/BACKEND_TEST_INVENTORY.md`](../docs/testing/BACKEND_TEST_INVENTORY.md)
* **خريطة طريق الاختبارات:** [`docs/testing/BACKEND_TEST_ROADMAP.md`](../docs/testing/BACKEND_TEST_ROADMAP.md)
* **الدليل التفصيلي لميزة المصادقة:** [`docs/testing/features/authentication.md`](../docs/testing/features/authentication.md)
* **الدليل التفصيلي لميزة الطلبات والمخزون:** [`docs/testing/features/orders.md`](../docs/testing/features/orders.md)
* **تقرير التنفيذ والنتائج:** [`docs/testing/TEST_EXECUTION_REPORT.md`](../docs/testing/TEST_EXECUTION_REPORT.md)
