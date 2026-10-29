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

---

## 📘 3. التوثيق والمراجع الهندسية

* **فهرس وتفاصيل جميع الـ Endpoints:** [`docs/testing/BACKEND_TEST_INVENTORY.md`](../docs/testing/BACKEND_TEST_INVENTORY.md)
* **خريطة طريق الاختبارات:** [`docs/testing/BACKEND_TEST_ROADMAP.md`](../docs/testing/BACKEND_TEST_ROADMAP.md)
* **الدليل التفصيلي لميزة المصادقة:** [`docs/testing/features/authentication.md`](../docs/testing/features/authentication.md)
* **تقرير التنفيذ والنتائج:** [`docs/testing/TEST_EXECUTION_REPORT.md`](../docs/testing/TEST_EXECUTION_REPORT.md)
