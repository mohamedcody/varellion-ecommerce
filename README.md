# VARELLION — متجر الإكسسوارات الفاخرة والجلدية (E-Commerce Platform)

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%2B-orange.svg)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17%20(Supabase)-blue.svg)](https://supabase.com)
[![Spring Security](https://img.shields.io/badge/Security-Spring%20Security%206%20%2B%20JJWT-yellow.svg)](https://jwt.io)
[![Google OAuth 2.0](https://img.shields.io/badge/Google%20OAuth-2.0%20Verified-blue.svg)](https://developers.google.com/identity)
[![API Testing](https://img.shields.io/badge/API%20Testing-Bruno%20Collection-purple.svg)](https://usebruno.com)
[![Branch](https://img.shields.io/badge/Git%20Branch-dev-orange.svg)](https://github.com/mohamedcody/varellion-ecommerce/tree/dev)

> **VARELLION** هو متجر إلكتروني تجاري راقٍ يستهدف السوق المصري، متخصص في بيع **الساعات الفاخرة، المصنوعات والمحافظ الجلدية الطبيعية (Leather Goods)، وحاملات البطاقات، بالإضافة إلى ملحقات وإكسسوارات التكنولوجيا الذكية**.
> يعتمد المشروع على معمارية **Modular Monolith** حديثة في الواجهة الخلفية مبنية بإطار **Spring Boot 3.3.4** و **Java 17**، مع ربط بقاعدة بيانات **PostgreSQL سحابية على Supabase**، ودعم كامل للغتين: **العربية (RTL)** كافتراضي والإنجليزية (LTR)، والتعامل حصرياً بالجنيه المصري (**EGP**).

---

## 🌟 الميزات المكتملة في النظام (Implemented Features)

### 1. 🛡️ نواة الأمان والمصادقة (Authentication & Security Core)
* **المصادقة عديمة الحالة (Stateless JWT):**
  * إصدار `accessToken` صالح لمدة 15 دقيقة مع تشفير قوي (HMAC-SHA).
  * إصدار `refreshToken` صالح لمدة 7 أيام يتم إرساله داخل **HttpOnly Cookie** آمنة (`SameSite=Lax`) لحماية المستخدمين من هجمات XSS و CSRF.
* **تسجيل الدخول الموثق بجوجل (Google OAuth 2.0 ID Token Verification):**
  * فحص صارم ومباشر لتوقيع التوكن بمفاتيح جوجل العامة وتطابق الـ `Audience` مع معرف العميل (`Client ID`).
  * التسجيل التلقائي للمستخدمين الجدد (Auto-provisioning) وتوليد اسم مستخدم فريد وكلمة مرور عشوائية مشفرة بـ BCrypt مع توثيق البريد تلقائياً.
  * حماية النظام ومنع أي ثغرات أو تجاوزات تجريبية (Strict Verification).
* **الحماية من الهجمات:**
  * قفل الحساب المؤقت عند تكرار إدخال كلمة المرور الخاطئة (Account Lockout بعد 5 محاولات).
  * فلتر تحديد معدل الطلبات حسب عنوان الـ IP لحماية السيرفر من هجمات الحرمان من الخدمة (Rate Limiting Filter).
  * معالجة مركزية موحدة للأخطاء والتحقق من المدخلات عبر [`GlobalExceptionHandler.java`](file:///home/mohamed-saad/Desktop/براند/backend/src/main/java/com/varellion/store/common/exception/GlobalExceptionHandler.java) بصيغة JSON واضحة.
* **إعدادات CORS المحكمة:**
  * ربط محلي وسحابي مصرح به حصرياً للواجهة الأمامية (`http://localhost:3000` و `http://localhost:8080`).

### 2. 🧪 الاختبارات الآلية ومجموعة Bruno (Testing & Verification)
* **اختبارات الوحدة والتكامل (Unit & Integration Tests):**
  * 28 اختبار آلي كودي ناجح بنسبة 100% (`BUILD SUCCESS`) يغطي سيناريوهات تسجيل الدخول، تسجيل الحسابات، رفض التوكنات المزيفة، وتجديد الجلسات.
* **مجموعة اختبارات Bruno المجهزة:**
  * مجموعة ريكويستات جاهزة في مجلد [`bruno/`](file:///home/mohamed-saad/Desktop/براند/bruno) لتجربة الـ APIs مباشرة بدون الحاجة لفرونت إند مع إدارة المتغيرات والتوكنز تلقائياً.
* **واجهة اختبار تفاعلية محلية:**
  * صفحة مدمجة خفيفة على المنفذ `3000` لتجربة زرار تسجيل الدخول بجوجل الرسمي والربط المباشر مع الباك إند.

---

## 📁 خريطة وهيكل المشروع (Project Structure)

```text
/home/mohamed-saad/Desktop/براند/
├── README.md                           # هذا الدليل التعريفي الشامل للمشروع
├── .gitignore                          # قواعد الأمان الصارمة وتجاهل الأسرار والمفاتيح
├── client_secret_*.json                # بيانات اعتماد جوجل للمصادقة (مستثناة أمنياً)
│
├── backend/                            # ⚙️ تطبيق الواجهة الخلفية (Spring Boot 3.3.4)
│   ├── pom.xml                         # ملف إدارة الاعتماديات (Maven)
│   ├── .env.example                    # نموذج المتغيرات البيئية الآمن
│   ├── .env                            # المتغيرات البيئية المحلية والاتصال بـ Supabase (محمي)
│   └── src/
│       ├── main/
│       │   ├── java/com/varellion/store/ # الكود المصدري (Java 17)
│       │   │   ├── common/             # الاستجابات المشتركة ومعالجة الأخطاء العامة
│       │   │   ├── security/           # منظومة الأمان الكاملة، JWT، ومصادقة Google
│       │   │   ├── catalog/            # كيانات ومستودعات المنتجات والتصنيفات
│       │   │   ├── customer/           # بيانات العملاء وعناوين الشحن
│       │   │   ├── cart/               # سلة المشتريات
│       │   │   └── order/              # نظام الطلبات، تتبع الحالات، وحجز المخزون
│       │   └── resources/
│       │       ├── application.properties # الإعدادات العامة والتكامل
│       │       └── db/migration/       # ملفات هجرة الداتابيز الحية (Flyway)
│       └── test/                       # اختبارات الأمان والـ Services (JUnit 5 & Mockito)
│
├── bruno/                              # 📬 مجموعة ريكويستات Bruno للاختبار المباشر
│   ├── bruno.json                      # إعدادات المجموعة
│   ├── README.md                       # دليل استخدام Bruno
│   ├── environments/Local.bru          # بيئة الاختبار المحلية (localhost:8080)
│   └── Authentication/                 # طلبات المصادقة (تسجيل، دخول، جوجل، تجديد، خروج)
│
├── docs/                               # 📚 مركز التوثيق الهندسي والمعماري
│   ├── feature-guides/
│   │   └── AUTH_EXPLANATION.md         # شرح تفصيلي معماري وتدفق كود المصادقة
│   ├── architecture/                   # دراسات المعمارية وهيكل الوحدات
│   ├── database/                       # تفاصيل جداول Supabase الـ 10 والـ Schema
│   └── development/                    # أدلة التشغيل ومعايير الأكواد والاختبارات
│
└── frontend/                           # 💻 الواجهة الأمامية وصفحة الاختبار التفاعلية
    ├── package.json                    # إعدادات الحزمة
    ├── serve.js                        # سيرفر محلي خفيف لتشغيل تجربة الدخول بجوجل
    └── public/index.html               # واجهة تجربة Google Sign-In المباشرة
```

---

## 🛠️ الحزمة التقنية (Technology Stack)

| الطبقة (Layer) | التقنية الأساسية | الدور والوظيفة |
| :--- | :--- | :--- |
| **Backend Framework** | Spring Boot 3.3.4 | بناء REST APIs بمعمارية Modular Monolith نظيفة ومرنة. |
| **Language** | Java 17 LTS | لغة قوية ومعتمدة للأنظمة المالية والتجارية الحساسة. |
| **Database** | PostgreSQL 17 (Supabase) | قاعدة بيانات علائقية سحابية موثوقة وفائقة السرعة. |
| **Database Migrations** | Flyway | تتبع وإدارة ترقيات وهجرات جداول قاعدة البيانات بثبات. |
| **Security & Auth** | Spring Security 6 + JJWT | مصادقة التوكن وحماية المسارات وتشفير كلمات المرور بـ BCrypt. |
| **Identity Provider** | Google Identity Services API | تسجيل الدخول السريع والآمن بنقرة واحدة عبر حساب جوجل. |
| **API Testing** | Bruno | توثيق واختبار الـ APIs محلياً وسحابياً بدون تعقيد. |

---

## 🌿 استراتيجية الفروع وإدارة الكود (Git Strategy)

* **فرع التطوير الرئيسي (`dev`):** الفرع النشط حالياً الذي يحتوي على آخر التحديثات والتحسينات والاختبارات المكتملة.
* **فرع الإنتاج المستقر (`main`):** الفرع المخصص للنسخ النهائية المستقرة القابلة للنشر المباشر.
* رابط المستودع على GitHub: [mohamedcody/varellion-ecommerce](https://github.com/mohamedcody/varellion-ecommerce/tree/dev)

---

## 🚀 التشغيل السريع محلياً (Quick Start Guide)

### 1. تشغيل خادم الـ Backend
```bash
# الانتقال لمجلد الباك إند
cd backend

# تشغيل الاختبارات الآلية للتأكد من سلامة النظام
mvn test

# تشغيل التطبيق
mvn spring-boot:run
```
يعمل الخادم تلقائياً على الرابط: `http://localhost:8080` ويمكن فحص حالته عبر:
```bash
curl http://localhost:8080/actuator/health
# النتيجة المتوقعة: {"status":"UP"}
```

### 2. تشغيل واجهة اختبار Google Sign-In التفاعلية
```bash
# من جذر المشروع
node frontend/serve.js
```
افتح المتصفح على: `http://localhost:3000` واضغط على زر **Sign in with Google** لتجربة الدخول المباشر واستلام الـ JWT.

### 3. الاختبار عبر Bruno
1. افتح تطبيق **Bruno**.
2. افتح مجلد `bruno/` الموجود في المشروع.
3. اختر البيئة `Local`.
4. ابدأ بتجربة طلبات مجلد `Authentication` مباشرة (`Login`، `Register`، `Google Login`، `Refresh Token`).

---

## 📋 خريطة مسارات الـ APIs المتاحة حالياً

| طريقة الطلب (Method) | المسار (Endpoint) | الوصول (Access) | الوصف |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | عام (Public) | إنشاء حساب عميل جديد بكلمة مرور مشفرة. |
| `POST` | `/api/auth/login` | عام (Public) | تسجيل دخول بالبريد وإصدار الـ Tokens. |
| `POST` | `/api/auth/google` | عام (Public) | تسجيل دخول فوري وموثق بـ Google ID Token. |
| `POST` | `/api/auth/refresh` | عام (Public) | تجديد صلاحية الـ Access Token باستخدام الـ Refresh Token. |
| `POST` | `/api/auth/logout` | عام (Public) | إبطال الجلسة ومسح كوكيز الدخول. |
| `GET`  | `/actuator/health` | عام (Public) | فحص سلامة واتصال خادم الباك إند وقاعدة البيانات. |

---

## 🔒 إرشادات الأمان (Security & Secrets)
* **ملفات الأسرار والبيئة:** ملفات `.env` وملفات بيانات الاعتماد `client_secret*.json` مستثناة ومحمية تماماً في `.gitignore` ولا يتم رفعها إلى المستودع العام.
* **مرجع المتغيرات:** استخدم ملف [`backend/.env.example`](file:///home/mohamed-saad/Desktop/براند/backend/.env.example) للتعرف على مفاتيح الضبط المطلوبة لتشغيل بيئة جديدة.
