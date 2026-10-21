# VARELLION Accessories — منصة التجارة الإلكترونية لإكسسوارات الرجال

[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.4-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17%2B-orange.svg)](https://www.oracle.com/java/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.11%20(Supabase)-blue.svg)](https://supabase.com)
[![Flyway](https://img.shields.io/badge/Flyway-Migrations%20(V1--V5)-red.svg)](https://flywaydb.org)
[![Security](https://img.shields.io/badge/Security-Spring%20Security%206%20%2B%20JJWT-yellow.svg)](https://jwt.io)

> **VARELLION** هو متجر إلكتروني تجاري مصري راقٍ متخصص في بيع إكسسوارات الموبايل والرجال (ساعات، محافظ جلدية، كابلات شحن ذكية، ملحقات تقنية).  
> يعتمد المشروع على معمارية **Modular Monolith** حديثة في الواجهة الخلفية مبنية بإطار **Spring Boot 3.3.4**، مع ربط بقاعدة بيانات **PostgreSQL سحابية على Supabase**، مع دعم كامل للغتين: **العربية (RTL)** كافتراضي والإنجليزية (LTR).

---

## 📁 خريطة وهيكل المشروع (Project Structure)

تم تنظيم المشروع بهيكل معياري احترافي يُسهل تصفحه وفهمه:

```text
/home/mohamed-saad/Desktop/براند/
├── README.md                           # هذا الدليل التعريفي الشامل
├── .gitignore                          # قواعد الأمان وتجاهل ملفات الأسرار
│
├── docs/                               # 📚 مركز التوثيق الهندسي الشامل
│   ├── architecture/                   # المعمارية والقرارات الهندسية
│   │   ├── PROJECT_AUDIT.md            # تقرير التدقيق المعماري الميداني
│   │   ├── TARGET_STRUCTURE.md         # تفاصيل الهيكل المعماري والمسؤوليات
│   │   ├── ARCHITECTURE.md             # الوثيقة المعمارية العليا للنظام
│   │   └── DEPENDENCY_MAP.md           # خريطة تدفق البيانات والاعتماديات
│   ├── specifications/                 # المواصفات الرسمية وقواعد الأعمال (00 إلى 10)
│   │   ├── 00_MASTER_BUILD_PROMPT.md   # الإطار العام ونطاق العمل
│   │   ├── 01_BRAND_IDENTITY_...md     # الهوية البصرية ونظام التصميم
│   │   ├── 02_UI_UX_SPECIFICATION.md   # مواصفات الشاشات وتجربة المستخدم
│   │   ├── 03_BUSINESS_PRODUCT_...md   # قواعد تصنيف المنتجات والمحتوى
│   │   ├── 04_FRONTEND_ARCHITECTURE.md # معمارية الواجهة الأمامية المستهدفة
│   │   ├── 05_AI_IMPLEMENTATION_...md  # قواعد التنفيذ الصارمة للذكاء الاصطناعي
│   │   ├── 06_INITIAL_CATALOG_...md    # بيانات الكتالوج المعتمدة والأسعار
│   │   ├── 07_MARKETING_CONTENT_...md  # دليل التسويق والمحتوى
│   │   ├── 08_BACKEND_DATABASE_...md   # مواصفات الأمان وقاعدة البيانات
│   │   ├── 09_ADMIN_UX_ADDENDUM.md     # ملحق شاشات لوحة الإدارة
│   │   └── 10_EXTERNAL_SERVICES_...md  # إعدادات الخدمات السحابية (Cloudinary)
│   ├── database/                       # تفاصيل قاعدة البيانات والهجرات
│   │   ├── DATABASE_SCHEMA.md          # توثيق الـ 10 جداول والعلاقات والقيود
│   │   ├── database_snapshot.txt       # الفحص الميداني الحي لجداول Supabase
│   │   └── database_audit_context.txt  # سجل تدقيق الهجرات السابقة
│   ├── development/                    # أدلة المطورين
│   │   ├── SETUP.md                    # دليل التثبيت والتشغيل المحلي
│   │   ├── CODING_CONVENTIONS.md       # معايير كتابة الكود والتسمية
│   │   └── TESTING.md                  # دليل واستراتيجية الاختبارات
│   └── archive/                        # النسخ القديمة والمتقاعدة
│
├── backend/                            # ⚙️ تطبيق الواجهة الخلفية (Spring Boot 3.3.4)
│   ├── pom.xml                         # ملف إدارة الاعتماديات (Maven)
│   ├── .env.example                    # نموذج المتغيرات البيئية الآمن
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/varellion/store/ # الكود المصدري (Java 17)
│   │   │   │   ├── VarellionApplication.java # نقطة البداية (Main Class)
│   │   │   │   ├── common/             # كود البنية التحتية المشترك
│   │   │   │   ├── catalog/            # وحدة المنتجات والتصنيفات والصور
│   │   │   │   ├── customer/           # وحدة العملاء وعناوين التوصيل
│   │   │   │   ├── cart/               # وحدة سلات التسوق
│   │   │   │   ├── order/              # وحدة الطلبات وحجز المخزون لمدة 24 ساعة
│   │   │   │   └── security/           # وحدة الأمان والمصادقة (JJWT)
│   │   │   └── resources/
│   │   │       ├── application.properties # إعدادات الاتصال وحجز المخزون
│   │   │       └── db/migration/       # هجرات Flyway الحية (V1 إلى V5)
│   │   └── test/                       # اختبارات الوحدة والتكامل
│
└── frontend/                           # 💻 تطبيق الواجهة الأمامية (Storefront)
```

---

## 🛠️ الحزمة التقنية (Tech Stack)

| الطبقة (Layer) | التقنية الأساسية | الدور والوظيفة |
| :--- | :--- | :--- |
| **Backend Framework** | Spring Boot 3.3.4 | بناء REST APIs بمعمارية Modular Monolith نظيفة. |
| **Language** | Java 17 | لغة برمجة قوية، آمنة من حيث النوعية (Type-Safe). |
| **Database** | PostgreSQL 17.11 (Supabase) | قاعدة بيانات علائقية سحابية موثوقة. |
| **Migration Tool** | Flyway 10.x | إدارة وتتبع ترقيات وتعديلات جداول قاعدة البيانات. |
| **Security** | Spring Security 6 + JJWT 0.12.6 | مصادقة التوكن عديمة الحالة (Stateless JWT Authentication). |
| **DTO Mapping** | MapStruct 1.6.3 | التحويل الآلي فائق السرعة بين الكيانات والـ DTOs. |
| **Connection Pool** | HikariCP | إدارة الاتصالات المجمعة مع خادم Supabase السحابي. |

---

## 🚀 التشغيل السريع للباك إند (Quick Start)

### المتطلبات الأساسية
- Java JDK 17 أو أحدث مثبت.
- Apache Maven 3.9+ مثبت.
- اتصال إنترنت للاتصال بقاعدة بيانات Supabase المدمجة.

### خطوات التشغيل
1. افتح المسار:
   ```bash
   cd /home/mohamed-saad/Desktop/براند/backend
   ```
2. تحقق من بناء المشروع:
   ```bash
   mvn clean compile
   ```
3. تشغيل الاختبارات الآلية:
   ```bash
   mvn test
   ```
4. تشغيل خادم الـ API:
   ```bash
   mvn spring-boot:run
   ```
   الخادم سيعمل افتراضياً على المنفذ `http://localhost:8080`.

---

## 🔒 الأمان وحماية البيانات (Security & Privacy)
- **لا توجد أسرار في المستودع:** تم تكوين ملف `.gitignore` لمنع رفع أي ملفات `.env` أو مفاتيح سرية.
- **نموذج المتغيرات الآمن:** استخدم دائماً ملف [`backend/.env.example`](file:///home/mohamed-saad/Desktop/براند/backend/.env.example) كمرجع للمتغيرات المطلوبة.
