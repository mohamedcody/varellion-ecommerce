# معايير كتابة الكود والتسمية في مشروع VARELLION
# VARELLION Coding Conventions & Standards

> **الهدف:** الحفاظ على كود متناسق، احترافي، نظيف، وسهل القراءة للجميع.

---

## 1. مبادئ التصميم العامة (General Principles)

1. **مسؤولية واحدة لكل ملف (Single Responsibility Principle):**
   كل كلاس أو دالة مسؤولة عن شيء واحد ومحدد فقط.
2. **فصل منطق الأعمال عن العرض (Separation of Concerns):**
   - الـ Controllers تستقبل الطلبات وتتحقق من صحتها وتوجهها للـ Service.
   - الـ Services تحتوي على قواعد الأعمال والتحقق المالي وحسابات الأسعار والمخزون.
   - الـ Repositories تتعامل مع قاعدة البيانات فقط.
3. **عدم كشف الـ Entities للواجهات العامة:**
   يُمنع إرجاع JPA Entities في ردود الـ API؛ استخدم دائماً DTOs عبر MapStruct.
4. **تجنب التكرار (DRY):**
   عزل المنطق المشترك في حزمة `common`.

---

## 2. معايير التسمية في Java (Naming Conventions)

| العنصر | النمط (Convention) | أمثلة توضيحية |
| :--- | :--- | :--- |
| **الكلاسات (Classes)** | `PascalCase` مع لاحقة وظيفية | `ProductService`, `OrderController`, `CustomerRepository` |
| **الواجهات (Interfaces)** | `PascalCase` صريحة | `ProductService`, `UserMapper`, `JpaRepository` |
| **الدوال (Methods)** | `camelCase` تبدأ بفعل دال | `getProductById()`, `calculateTotal()`, `reserveStock()` |
| **المتغيرات (Variables)** | `camelCase` واضحة غير مختصرة | `unitPrice`, `reservedQuantity`, `customerAddress` |
| **الثوابت (Constants)** | `UPPERCASE_WITH_UNDERSCORES` | `DEFAULT_RESERVATION_HOURS`, `STORE_CURRENCY` |
| **الحزم (Packages)** | حروف صغيرة بالكامل بصيغة المفرد | `catalog`, `customer`, `order`, `security` |

---

## 3. التعامل مع الأخطاء والاستثناءات (Exception Handling)

- استخدم دائماً استثناءات مخصصة تصف المشكلة بدقة:
  - `ResourceNotFoundException`: عند عدم وجود مورد (مثل منتج أو قسم).
  - `BusinessException`: عند مخالفة قواعد العمل (مثل طلب كمية تفوق المخزون).
  - `SecurityException`: عند محاولة إجراء غير مصرح به.
- دع `GlobalExceptionHandler` يتولى تحويل الاستثناء إلى `ErrorResponse` موحد يحتوي على:
  - رمز الحالة (Status Code).
  - رسالة واضحة للمستخدم دون تسريب تفاصيل أو مسارات داخلية (No Stack Traces Leakage).
  - التوقيت الزمني بصيغة UTC.

---

## 4. كتابة الـ DTOs والـ Mappers

- استخدم الـ Java Records لإنشاء الـ DTOs (حيث توفر ثباتاً ومناعة ضد التعديل وتوافقاً ممتازاً مع Jackson).
- استخدم مكتبة MapStruct مع ضبط:
  ```java
  @Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
  ```
  ليكون الـ Mapper عبارة عن Spring Bean قابل للحقن التلقائي (`@Autowired` / Constructor Injection).
