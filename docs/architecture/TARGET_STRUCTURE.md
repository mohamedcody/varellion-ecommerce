# الهيكل المستهدف لمشروع VARELLION
# VARELLION Target Directory & Architecture Structure

> **الحالة:** اقتراح معماري جاهز للمراجعة والموافقة (Stage B - Target Proposal)  
> **الهدف:** تنظيم الكود والتوثيق بهيكل احترافي، معياري، قابل للتوسع، وسهل الفهم للمبتدئين والمطورين الكبار على حد سواء.  
> **مبدأ الأمان:** لن يتم نقل أو تعديل أي ملف كود حتى تصدر الموافقة الصريحة من المالك.

---

## 1. شجرة المجلدات المقترحة (Proposed Directory Tree)

```text
/home/mohamed-saad/Desktop/براند/
├── README.md                           # الدليل التعريفي الشامل للمشروع وطرق تشغيله
├── .gitignore                          # قواعد تجاهل الملفات الحساسة والتنفيذية
├── docs/                               # مركز التوثيق الهندسي الشامل
│   ├── architecture/                   # المعمارية والقرارات التصميمية
│   │   ├── PROJECT_AUDIT.md            # تقرير التدقيق المعماري الشامل
│   │   ├── TARGET_STRUCTURE.md         # هذا المستند (الهيكل المستهدف)
│   │   ├── ARCHITECTURE.md             # الوثيقة المعمارية العليا للنظام
│   │   └── DEPENDENCY_MAP.md           # خريطة تدفق البيانات والاعتماديات
│   ├── specifications/                 # المواصفات الرسمية المعتمدة (00 إلى 10)
│   │   ├── 00_MASTER_BUILD_PROMPT.md
│   │   ├── 01_BRAND_IDENTITY_DESIGN_SYSTEM.md
│   │   ├── 02_UI_UX_SPECIFICATION.md
│   │   ├── 03_BUSINESS_PRODUCT_CONTENT.md
│   │   ├── 04_FRONTEND_ARCHITECTURE.md
│   │   ├── 05_AI_IMPLEMENTATION_RULES.md
│   │   ├── 06_INITIAL_CATALOG_SITE_DATA.md
│   │   ├── 07_MARKETING_CONTENT_GUIDE.md
│   │   ├── 08_BACKEND_DATABASE_SECURITY.md
│   │   ├── 09_ADMIN_UX_ADDENDUM.md
│   │   └── 10_EXTERNAL_SERVICES_SETUP.md
│   ├── database/                       # وثائق قاعدة البيانات والمخططات
│   │   ├── DATABASE_SCHEMA.md          # شرح الجداول والعلاقات والقيود
│   │   ├── database_snapshot.txt       # الفحص الحي الميداني لجداول Supabase
│   │   └── database_audit_context.txt  # سجل تدقيق الهجرات السابقة
│   ├── development/                    # أدلة المطورين وتجهيز البيئة
│   │   ├── SETUP.md                    # خطوات تشغيل المشروع للمطور الجديد
│   │   ├── CODING_CONVENTIONS.md       # معايير كتابة الكود والتسمية
│   │   └── TESTING.md                  # استراتيجية الاختبارات الآلية
│   └── archive/                        # النسخ القديمة والمسودات الملغاة
│       └── 02_UI_UX_SPECIFICATION_OLD.md
│
├── backend/                            # خادم وتطبيق الواجهة الخلفية (Spring Boot)
│   ├── pom.xml                         # اعتماديات Maven وأدوات البناء
│   ├── .env.example                    # نموذج المتغيرات البيئية الآمن
│   ├── .gitignore                      # تأمين ملفات الباك إند ومنع تسريب .env
│   └── src/
│       ├── main/
│       │   ├── java/com/varellion/store/
│       │   │   ├── VarellionApplication.java  # نقطة الانطلاق الرئيسية (Entry Point)
│       │   │   │
│       │   │   ├── common/             # كود البنية التحتية المشترك
│       │   │   │   ├── exception/      # معالجات الأخطاء العامة (GlobalExceptionHandler)
│       │   │   │   ├── response/       # نماذج الاستجابة الموحدة (ErrorResponse, ApiResponse)
│       │   │   │   └── auditing/       # تدقيق التعديلات والتواريخ (JpaAuditingConfig)
│       │   │   │
│       │   │   ├── catalog/            # وحدة الكتالوج والمنتجات والأقسام
│       │   │   │   ├── entity/         # Category, Product, ProductImage
│       │   │   │   ├── repository/     # CategoryRepository, ProductRepository, ProductImageRepository
│       │   │   │   ├── service/        # CategoryService, ProductService
│       │   │   │   ├── controller/     # CategoryController, ProductController
│       │   │   │   └── dto/            # ProductResponse, CategoryResponse, ProductFilterRequest
│       │   │   │
│       │   │   ├── customer/           # وحدة إدارة العملاء وعناوين الشحن
│       │   │   │   ├── entity/         # Customer, CustomerAddress
│       │   │   │   ├── repository/     # CustomerRepository, CustomerAddressRepository
│       │   │   │   ├── service/        # CustomerService
│       │   │   │   ├── controller/     # CustomerController
│       │   │   │   └── dto/            # CustomerProfileDto, AddressDto
│       │   │   │
│       │   │   ├── cart/               # وحدة سلة التسوق
│       │   │   │   ├── entity/         # Cart, CartItem
│       │   │   │   ├── repository/     # CartRepository, CartItemRepository
│       │   │   │   ├── service/        # CartService
│       │   │   │   ├── controller/     # CartController
│       │   │   │   └── dto/            # CartResponse, AddToCartRequest, UpdateQuantityRequest
│       │   │   │
│       │   │   ├── order/              # وحدة الطلبات ودورة حياة الشراء
│       │   │   │   ├── entity/         # Order, OrderItem, OrderStatusHistory
│       │   │   │   ├── repository/     # OrderRepository, OrderItemRepository, OrderStatusHistoryRepository
│       │   │   │   ├── service/        # OrderService, OrderReservationService (24h Hold)
│       │   │   │   ├── controller/     # OrderController, GuestOrderLookupController
│       │   │   │   └── dto/            # CreateOrderRequest, OrderResponse, OrderSummaryDto
│       │   │   │
│       │   │   └── security/           # وحدة المصادقة والتحكم بالصلاحيات (JJWT)
│       │   │       ├── config/         # SecurityConfig, CorsConfig
│       │   │       ├── jwt/            # JwtTokenProvider, JwtAuthenticationFilter
│       │   │       ├── service/        # CustomUserDetailsService, AuthService
│       │   │       ├── controller/     # AuthController (/api/v1/auth)
│       │   │       └── dto/            # LoginRequest, RegisterRequest, AuthResponse
│       │   │
│       │   └── resources/
│       │       ├── application.properties
│       │       └── db/migration/       # هجرات Flyway الحية والمستقبلية (V1..V5)
│       └── test/                       # اختبارات الوحدة والتكامل
│           ├── java/com/varellion/store/
│           │   ├── catalog/            # اختبارات الكتالوج
│           │   ├── order/              # اختبارات الطلبات والمخزون
│           │   └── security/           # اختبارات التوكن والأمان
│           └── resources/
│               └── application-test.properties
│
└── frontend/                           # تطبيق الواجهة الأمامية (المستهدف بالوثيقة 04)
    ├── package.json
    ├── tsconfig.json
    ├── tailwind.config.ts
    ├── src/
    │   ├── app/                        # مسارات Next.js App Router (/[locale]/...)
    │   ├── components/                 # مكونات الواجهة (ui, layout, product, cart, checkout)
    │   ├── context/                    # سياق السلة والترجمة (CartContext, I18nContext)
    │   ├── services/                   # عميل الـ API والاتصال بالـ Backend
    │   └── types/                      # تعريفات TypeScript المعيارية المعتمدة
    └── public/                         # الأيقونات والخطوط والصور الثابتة
```

---

## 2. مسؤوليات المجلدات الرئيسية (Directory Responsibilities)

| المجلد | المسؤولية المعمارية الوحيدة (Single Responsibility) |
| :--- | :--- |
| **`docs/specifications/`** | المستندات القانونية والتصميمية الرسمية المعتمدة من صاحب المشروع (مصدر الحقيقة لقواعد الأعمال). |
| **`docs/architecture/`** | توثيق النواحي التقنية، مخططات الاعتماديات، وسجلات القرارات الهندسية (ADRs). |
| **`docs/database/`** | شرح هيكل الـ 10 جداول في Supabase وقيودها الصارمة وسجلات التدقيق الميداني. |
| **`backend/src/.../catalog/`** | إدارة وتصفح وحفظ المنتجات والتصنيفات وصورها وفقاً لجدولي `V2` و `V3`. |
| **`backend/src/.../customer/`** | إدارة بيانات وملفات المتسوقين وعناوين التوصيل المرتبطة بجدول `V1`. |
| **`backend/src/.../cart/`** | إدارة عناصر السلة والكميات وفقاً لجدول `V4`. |
| **`backend/src/.../order/`** | إدارة دورة حياة الطلب، حجز المخزون لمدة 24 ساعة، وإلغاء الحجز، وسجل الحالات وفقاً لجدول `V5`. |
| **`backend/src/.../security/`** | إصدار والتحقق من توكنات JJWT والتحكم في صلاحيات المسارات وتشفير كلمات المرور. |
| **`backend/src/.../common/`** | معالجات الأخطاء العامة والردود الموحدة والـ Auditing لمنع تكرار الكود. |

---

## 3. قواعد التسمية واتجاه الاعتماديات (Conventions & Dependency Direction)

### 3.1 قواعد التسمية (Naming Conventions)
1. **في لغة Java (Backend):**
   - الكلاسات والواجهات: `PascalCase` مع لاحقة تعبر عن الوظيفة (مثل `ProductService`, `ProductRepository`, `OrderController`).
   - الدوال والمتغيرات: `camelCase` مع أسماء دالة وواضحة (مثل `calculateOrderTotal`, `reservedQuantity`).
   - حزم المشروع (Packages): حروف صغيرة بالكامل بصيغة المفرد (مثل `catalog`, `customer`, `order`).
2. **في قواعد البيانات (PostgreSQL / Flyway):**
   - أسماء الجداول: `snake_case` بصيغة الجمع (مثل `customers`, `products`, `orders`).
   - المفاتيح الأساسية: `[singular_table]_id` (مثل `product_id`, `order_id`).
   - ملفات الهجرة: `V[Number]__[Description].sql` (مثل `V5__create_orders_module.sql`).
3. **في ملفات التوثيق:**
   - التسمية بالأحرف الإنجليزية الكبيرة والموجزة: `UPPERCASE_WITH_UNDERSCORES.md`.

### 3.2 اتجاه الاعتماديات (Dependency Direction Rule)
- **قاعدة الاتجاه الواحد:**
  `Controller` ➔ `Service` ➔ `Repository` ➔ `Database Entity`.
- يُمنع تماماً استدعاء `Controller` من داخل `Service`، أو تمرير `Entity` مباشرة لردود الـ API العامة بدون تحويلها إلى `DTO` عبر `MapStruct`.
- لا تعتمد أي وحدة بزنس (مثل `catalog`) على وحدة بزنس أخرى بشكل دائري (Circular Dependency)؛ التواصل يتم عبر الـ Services أو الأحداث.

---

## 4. جدول ترحيل الملفات الحالية إلى مواقعها المستهدفة (Mapping Existing Files)

| الملف الحالي (Current Location) | المسار المستهدف (Target Location) | سبب النقل / القرار |
| :--- | :--- | :--- |
| `00_VARELLION_MASTER_BUILD_PROMPT.md` | `docs/specifications/00_MASTER_BUILD_PROMPT.md` | تنظيم الوثائق في مجلد مخصص وتطهير جذر المشروع. |
| `01_VARELLION_BRAND_IDENTITY_...md` | `docs/specifications/01_BRAND_IDENTITY_DESIGN_SYSTEM.md` | تنظيم ملفات الهوية ونظام التصميم. |
| `02_VARELLION_UI_UX_SPECIFICATION.md` | `docs/archive/02_UI_UX_SPECIFICATION_OLD.md` | أرشفة النسخة القديمة لمنع التضارب. |
| `02_VARELLION_UI_UX_SPECIFICATION_FIXED.md` | `docs/specifications/02_UI_UX_SPECIFICATION.md` | اعتماد النسخة المصححة كنسخة رسمية وحيدة. |
| `03_VARELLION_BUSINESS_PRODUCT_...md` | `docs/specifications/03_BUSINESS_PRODUCT_CONTENT.md` | تصنيفها كمواصفات محتوى وبزنس. |
| `04_VARELLION_FRONTEND_ARCHITECTURE.md` | `docs/specifications/04_FRONTEND_ARCHITECTURE.md` | تصنيفها كمعمارية مرجعية للواجهة. |
| `05_VARELLION_AI_IMPLEMENTATION_RULES.md` | `docs/specifications/05_AI_IMPLEMENTATION_RULES.md` | تصنيفها كقواعد ملزمة للتطوير والذكاء الاصطناعي. |
| `06_VARELLION_INITIAL_CATALOG_...md` | `docs/specifications/06_INITIAL_CATALOG_SITE_DATA.md` | تصنيفها كبيانات المنتجات والتسعير المعتمد. |
| `07_VARELLION_MARKETING_CONTENT_...md` | `docs/specifications/07_MARKETING_CONTENT_GUIDE.md` | دليل تسويق في المواصفات. |
| `08_VARELLION_BACKEND_DATABASE_...md` | `docs/specifications/08_BACKEND_DATABASE_SECURITY.md` | مواصفات أمان وقواعد بيانات الباك إند. |
| `09_VARELLION_ADMIN_UX_ADDENDUM.md` | `docs/specifications/09_ADMIN_UX_ADDENDUM.md` | ملحق شاشات الإدارة. |
| `10_VARELLION_EXTERNAL_SERVICES_...md` | `docs/specifications/10_EXTERNAL_SERVICES_SETUP.md` | إعدادات الخدمات الخارجية السحابية. |
| `database_snapshot.txt` | `docs/database/database_snapshot.txt` | وثائق الفحص الميداني لقاعدة البيانات. |
| `database_audit_context.txt` | `docs/database/database_audit_context.txt` | سجل تدقيق قاعدة البيانات. |
| `backend/` | `backend/` (يبقى مكانه دون مساس بالمسار) | الحفاظ على المسار التشغيلي الأساسي لمشروع Spring Boot. |

---

## 5. ما الذي يجب أن يبقى بدون تغيير ولماذا؟ (What Remains Unchanged)

1. **ملفات هجرات Flyway الحالية (`backend/src/main/resources/db/migration/V1..V5`):**
   - **السبب الصارم:** هذه الملفات تم تطبيقها وسجلاتها مختومة داخل جدول `flyway_schema_history` في قاعدة بيانات Supabase الإنتاجية. أي تعديل في حروفها أو أسمائها سيؤدي لفشل `Flyway Checksum Validation` وتوقف التطبيق عن العمل.
2. **ملف إعدادات الباك إند الأساسي (`VarellionApplication.java` و `pom.xml`):**
   - تم تثبيت اعتمادات JJWT و Spring Boot 3.3.4 والتحقق من سلامة البناء (Build Success)، وسيبقى مستقراً لتبنى عليه الكيانات.
3. **ملفات الأسرار والبيئة (`backend/.env`):**
   - ستبقى في مجلد `backend/` محصنة ومحمية بواسطة `.gitignore` ولن تُنقل لتفادي أي خطر أمني.
