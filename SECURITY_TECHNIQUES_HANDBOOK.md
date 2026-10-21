# 🛡️ الدليل العملي لهندسة الأمان وحماية تطبيقات الويب (VARELLION Security Playbook)
> **دليل تعليمي شامل من الصفر للاحتراف: كيف تحمي كودك، قواعد بياناتك، وسيرفرك من واقع ثغرات حقيقية تم اكتشافها وترقيعها.**

---

## 📌 الفهرس العام
1. [المقدمة: عقلية مهندس الباك إند المحترف (Security Mindset)](#1-المقدمة-عقلية-مهندس-الباك-إند-المحترف)
2. [التكنيك الأول: إدارة الأسرار وحمايتها من التسريب (Secrets Management)](#2-التكنيك-الأول-إدارة-الأسرار-وحمايتها-من-التسريب)
3. [التكنيك الثاني: حماية قواعد البيانات المباشرة (PostgreSQL RLS & PostgREST Exposure)](#3-التكنيك-الثاني-حماية-قواعد-البيانات-المباشرة)
4. [التكنيك الثالث: منع تصعيد الصلاحيات في التسجيل (Privilege Escalation Prevention)](#4-التكنيك-الثالث-منع-تصعيد-الصلاحيات-في-التسجيل)
5. [التكنيك الرابع: تزوير عنوان الآي بي وحماية الـ Rate Limiter (IP Spoofing)](#5-التكنيك-الرابع-تزوير-عنوان-الآي-بي-وحماية-الـ-rate-limiter)
6. [التكنيك الخامس: منع هجمات استنزاف الذاكرة والـ DoS (In-Memory Resource Protection)](#6-التكنيك-الخامس-منع-هجمات-استنزاف-الذاكرة-والـ-dos)
7. [التكنيك السادس: منع تعداد الحسابات والتخمين (User Enumeration Prevention)](#7-التكنيك-السادس-منع-تعداد-الحسابات-والتخمين)
8. [التكنيك السابع: تأمين دورة حياة الـ Refresh Tokens وإبطالها (Token Revocation & Rotation)](#8-التكنيك-السابع-تأمين-دورة-حياة-الـ-refresh-tokens)
9. [التكنيك الثامن: هندسة الـ Cookies الآمنة لحماية الجلسات (HttpOnly, Secure, SameSite)](#9-التكنيك-الثامن-هندسة-الـ-cookies-الآمنة-لحماية-الجلسات)
10. [التكنيك التاسع: منع تسريب تفاصيل السيرفر الداخلية في الأخطاء (Information Leakage)](#10-التكنيك-التاسع-منع-تسريب-تفاصيل-السيرفر-الداخلية-في-الأخطاء)
11. [التكنيك العاشر: معايير قوة كلمات المرور والتحقق من المدخلات (OWASP Input Validation)](#11-التكنيك-العاشر-معايير-قوة-كلمات-المرور-والتحقق-من-المدخلات)
12. [نصائح ذهبية وقواعد لا تنساها أبداً (Golden Rules)](#12-نصائح-ذهبية-وقواعد-لا-تنساها-أبداً)

---

## 1. المقدمة: عقلية مهندس الباك إند المحترف

في عالم تطوير الـ Backend، الأمان مش مجرد كود بيتكتب في الآخر أو مكتبة بنضيفها، بل هو **عقلية (Mindset)** قائمة على مبدأين أساسيين:
1. **Never Trust the Client (لا تثق في العميل مطلقاً):** كل شيء قادم من المتصفح أو تطبيق الموبايل (Headers, Cookies, Query Params, Body) قابل للتزوير والتلاعب.
2. **Defense in Depth (الدفاع في العمق):** متعتمدش على خط دفاع واحد. لو السيرفر اتهكر، قاعدة البيانات لازم تكون محمية. لو الـ IP اتزور، الكود لازم يكون عنده وسيلة تحقق بديلة.

خلال فحص مشروع **VARELLION**، اكتشفنا 10 ثغرات ونقاط ضعف في الباك إند وقاعدة البيانات. في هذا الملف هنشرح كل تكنيك اتعلمناه، إزاي المخترق كان ممكن يستغله، وإزاي صلحناه بطريقة هندسية معيارية.

---

## 2. التكنيك الأول: إدارة الأسرار وحمايتها من التسريب
### (Secrets Management & Preventing Hardcoded Fallbacks)

### ⚠️ ما هي المشكلة؟
كتير من المطورين بيحطوا قيم افتراضية في ملفات الإعدادات زي `application.properties`:
```properties
# ❌ كود خطير جداً:
spring.datasource.password=${SUPABASE_DB_PASSWORD:MySecretPassword123!}
jwt.secret=${JWT_SECRET:varellion-super-secret-jwt-key-minimum-256-bits-length}
```

### 🎯 كيف يفكر المخترق؟ (Attack Scenario)
1. المخترق أو برامج البحث الآلي (Crawlers) بتدور في مستودعات Git (أو حتى الـ Commit History القديم) عن مفاتيح الـ JWT والباسووردات الافتراضية.
2. لو رفعت المشروع على سيرفر ونسيت تحط الـ Environment Variable، التطبيق هيشتغل بالـ Default Value الضعيف.
3. المخترق ياخد الـ JWT Secret الافتراضي ده، ويعمل بيه توكن لنفسه بصلاحية `ADMIN` ويدخل على كل بيانات الموقع دون الحاجة للباسوورد!

### 💡 الحل الهندسي (Fail-Fast Pattern)
التطبيق لازم **يرفض يشتغل إطلاقاً (Crashes on Startup)** لو المتغيرات السرية مش موجودة في البيئة، بدلاً من استخدام قيمة بديلة.

```properties
# ✅ الكود الصحيح بعد التعديل:
spring.datasource.password=${SUPABASE_DB_PASSWORD}
jwt.secret=${JWT_SECRET}
google.client.id=${GOOGLE_CLIENT_ID}
```
**الدرس:** الـ Secrets لا تُكتب أبداً في الكود ولا ملفات الإعدادات، بل تُمرر عن طريق متغيرات النظام (Environment Variables) أو ملف `.env` موضوع في `.gitignore`.

---

## 3. التكنيك الثاني: حماية قواعد البيانات المباشرة
### (PostgreSQL RLS & PostgREST Direct Table Exposure)

### ⚠️ ما هي المشكلة؟
خدمات مثل **Supabase** و **Firebase** بتوفر واجهة REST API تلقائية سريعة (PostgREST). إذا أنشأت جدول `users` بدون إعدادات حماية، الـ API ده بيعرض الجدول للعامة تلقائياً!

### 🎯 كيف يفكر المخترق؟ (Attack Scenario)
المخترق مش محتاج يهاجم الـ Spring Boot Backend أصلاً! بياخد رابط الـ Supabase ومشروعك (وهو متاح في الفرونت إند في المتصفح) ويبعت طلب بسيط:
```http
GET https://xyz.supabase.co/rest/v1/users
apikey: YOUR_PUBLIC_ANON_KEY
```
النتيجة: استرجاع كل بيانات المستخدمين، إيميلاتهم، وكلمات المرور المشفرة (Password Hashes) في ثوانٍ!

### 💡 الحل الهندسي: تفعيل Row Level Security وسحب الصلاحيات
أنشأنا Migration جديد في Flyway رقمه `V7__secure_users_table.sql`:
```sql
-- 1. تفعيل حماية على مستوى الصفوف
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users FORCE ROW LEVEL SECURITY;

-- 2. منع مستخدمي الـ API المباشر (anon و authenticated) من لمس الجدول نهائياً
REVOKE ALL ON TABLE public.users FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.users_id_seq FROM anon, authenticated;
```
**الدرس:** الوصول لجدول المستخدمين أصبح مقتصراً فقط على الـ Backend من خلال دور الـ `service_role` أو الاتصال المباشر بقاعدة البيانات عبر JDBC.

---

## 4. التكنيك الثالث: منع تصعيد الصلاحيات في التسجيل
### (Privilege Escalation Prevention in Public APIs)

### ⚠️ ما هي المشكلة؟
في دالة التسجيل (Registration)، كان الكود يفحص إذا كان إيميل المستخدم المسجل يطابق إيميلات الأدمن في ملف الإعدادات:
```java
// ❌ كود خطير:
String role = isAdminEmail(request.getEmail()) ? "ADMIN" : "USER";
```

### 🎯 كيف يفكر المخترق؟ (Attack Scenario)
1. في بعض الحالات، قد يتم تسريب قائمة إيميلات الأدمن أو تخمينها (مثل `admin@varellion.com` أو `ceo@varellion.com`).
2. لو المخترق قدر ينشئ إيميل مطابق أو يستغل خطأ في الـ Regex أو الحروف المشابهة (Unicode Normalization)، هيسجل وياخد صلاحية `ADMIN` فوراً.
3. قاعدة التصميم السليم: **لا يجوز لأي شخص الحصول على صلاحية Admin من خلال نموذج تسجيل متاح للجمهور.**

### 💡 الحل الهندسي: فرض الصلاحية الثابتة
```java
// ✅ الكود الصحيح في AuthService.java:
// التسجيل العام ينتج عنه دائماً وأبداً دور "USER" فقط:
String role = "USER";

User newUser = User.builder()
        .email(email)
        .username(username)
        .password(passwordEncoder.encode(request.getPassword()))
        .role(role)
        .enabled(true)
        .build();
```
**الدرس:** حسابات الأدمن لا تُنشأ من الشارع (Public Register)، بل عبر إما:
- Migration أولي محمي (Database Seeding).
- دعوة مخصصة يرسلها Super Admin موجود بالفعل (Protected Invite System).

---

## 5. التكنيك الرابع: تزوير عنوان الآي بي وحماية الـ Rate Limiter
### (Client IP Spoofing via X-Forwarded-For)

### ⚠️ ما هي المشكلة؟
في فلاتر تقييد الطلبات (Rate Limiting)، كان الكود يقبض على عنوان الآي بي بالشكل التالي:
```java
// ❌ كود خطير:
String clientIp = request.getHeader("X-Forwarded-For");
if (clientIp == null) {
    clientIp = request.getRemoteAddr();
}
```

### 🎯 كيف يفكر المخترق؟ (Attack Scenario)
هيدر `X-Forwarded-For` هو مجرد نص HTTP يرسله العميل. المخترق لما يحب يبعت 100,000 محاولة تخمين باسوورد، بيغير الهيدر في كل طلب:
```bash
curl -H "X-Forwarded-For: 1.1.1.1" https://api.varellion.com/api/auth/login
curl -H "X-Forwarded-For: 1.1.1.2" https://api.varellion.com/api/auth/login
```
الـ Rate Limiter يفتكر إن كل طلب جاي من شخص مختلف، والفلتر يتخطى تماماً!

### 💡 الحل الهندسي: الاعتماد على الاتصال الفعلي (TCP Socket)
```java
// ✅ الكود الصحيح:
private String getClientIp(HttpServletRequest request) {
    return request.getRemoteAddr();
}
```
**ملاحظة احترافية:** إذا كنت تستخدم Reverse Proxy حقيقي وموثوق (مثل Nginx أو Cloudflare)، يتم ضبط Spring Boot بخاصية:
`server.forward-headers-strategy=native`
وهو يتكفل بقراءة الـ IP من البروكسي الموثوق فقط ويهمل أي تزوير قادم من العميل الخارجي.

---

## 6. التكنيك الخامس: منع هجمات استنزاف الذاكرة والـ DoS
### (In-Memory Resource Protection & Cache Eviction)

### ⚠️ ما هي المشكلة؟
لتنفيذ الـ Rate Limiting، تم استخدام `ConcurrentHashMap<String, RateLimitEntry>` في الذاكرة. لو دخل آلاف المهاجمين بـ IPs مختلفة، حجم هذا الـ Map هيفضل يكبر ويكبر بلا نهاية.

### 🎯 كيف يفكر المخترق؟ (Attack Scenario)
هجوم استنزاف الذاكرة (Memory Exhaustion DoS):
المخترق يبعت طلبات من عناوين وهمية، حتى تمتلئ ذاكرة الرام (RAM) في السيرفر بالكامل، ويحدث:
`java.lang.OutOfMemoryError: Java heap space`
ويموت السيرفر بالكامل لكل المستخدمين الحقيقيين!

### 💡 الحل الهندسي: سقف أقصى + تنظيف تلقائي مجدول
1. وضع حد أقصى لعدد العناوين المخزنة في الذاكرة (`MAX_TRACKED_IPS = 50,000`).
2. إضافة دالة تنظيف تعمل كل دقيقتين لمسح السجلات التي انتهت صلاحيتها:

```java
// في RateLimitFilter.java
@Scheduled(fixedRate = 120_000) // كل دقيقتين
public void cleanupExpiredEntries() {
    long now = System.currentTimeMillis();
    requestCounts.entrySet().removeIf(entry ->
            (now - entry.getValue().windowStart) > WINDOW_MS);
}
```
3. وتفعيل الـ Scheduler في كلاس التطبيق الرئيسي:
```java
@SpringBootApplication
@EnableScheduling // ضروري جداً لتشغيل دوال @Scheduled
public class VarellionApplication { ... }
```

---

## 7. التكنيك السادس: منع تعداد الحسابات والتخمين
### (User Enumeration & Uniform Error Messages)

### ⚠️ ما هي المشكلة؟
عند فشل تسجيل الدخول، كان الكود يخبر المستخدم بالتفاصيل:
```java
// ❌ كود يكشف معلومات حساسة:
if (!passwordEncoder.matches(password, user.getPassword())) {
    int remaining = MAX_FAILED_ATTEMPTS - attempts;
    throw new BadCredentialsException("Invalid password. Remaining attempts: " + remaining);
}
```
وفي حالة عدم وجود الإيميل أصلاً، كان الخطأ مختلفاً!

### 🎯 كيف يفكر المخترق؟ (Attack Scenario)
1. **User Enumeration (فحص الإيميلات المسجلة):** المخترق يكتب لستة إيميلات موظفين أو مستخدمين. لو السيرفر رد بـ "Password incorrect"، المخترق عرف إن الإيميل ده موجود في الموقع فعلاً!
2. **Brute Force Optimization:** بمعرفة عدد المحاولات المتبقية بدقة، المخترق يقدر يوزع هجماته بحيث يتجنب قفل الحساب تماماً.

### 💡 الحل الهندسي: توحيد رسائل الخطأ وثبات زمن الاستجابة
سواء كان الإيميل غير موجود، أو الباسوورد غلط، السيرفر يرجع نفس الرسالة دائماً وبشكل مبهم:
```java
// ✅ الكود الموحد:
throw new BadCredentialsException("Invalid username or password");
```
**الدرس:** الرد الأمني لا يجب أن يكشف للعميل هل الخطأ في اسم المستخدم أم في كلمة المرور.

---

## 8. التكنيك السابع: تأمين دورة حياة الـ Refresh Tokens
### (Refresh Token Lifecycle, Revocation, and Rotation)

### ⚠️ ما هي المشكلة؟
الـ JWT بطبيعته **عديم الحالة (Stateless)**. يعني بمجرد ما السيرفر يصدر Token، مبيقدرش يلغيه أو يوقفه إلا لما تنتهي مدته (Expiration Date)!
لو جهاز المستخدم اتسرق أو التوكن اتسرب، الهاكر يقدر يستخدم الـ Refresh Token ويجدد الـ Session إلى ما لا نهاية.

### 💡 الحل الهندسي (Token Rotation & Revocation):
1. **قاعدة الـ Rotation:** كل مرة العميل يطلب Access Token جديد باستخدام الـ Refresh Token، السيرفر **يحرق** الـ Refresh Token القديم ويصدر له واحد جديد تماماً.
2. **كشف إعادة الاستخدام (Reuse Detection):** لو السيرفر استلم Refresh Token تم استخدامه مسبقاً، ده معناه فوراً إن فيه عملية اختراق أو سرقة توكن حصلت! في هذه اللحظة، السيرفر يبطل **كل** الجلسات والتوكنات التابعة لهذا المستخدم فوراً.
3. **تخزين الـ Tokens في قاعدة البيانات:** وجود جدول `refresh_tokens` يحتوي على:
   - `token_hash`: هاش التوكن لمنع قراءته في حال تسريب القاعدة.
   - `revoked`: هل تم إبطاله؟
   - `expires_at`: تاريخ الانتهاء.

---

## 9. التكنيك الثامن: هندسة الـ Cookies الآمنة لحماية الجلسات
### (HttpOnly, Secure, and SameSite Flags)

### ⚠️ ما هي المشكلة؟
تخزين التوكنات الحساسة (مثل الـ Refresh Token) داخل `localStorage` في المتصفح يجعلها عرضة للسرقة بنسبة 100% في حال وجود ثغرة **XSS (Cross-Site Scripting)** في أي مكتبة جافاسكريبت تستخدمها.
كما أن إرسال الكوكي عبر HTTP غير المشفر يعرضها للاعتراض على الشبكات العامة (Wi-Fi).

### 💡 الحل الهندسي: إعداد الكوكي الثلاثي الآمن
في `AuthController.java`:
```java
// ✅ إعداد الكوكي المعياري:
private ResponseCookie buildRefreshTokenCookie(String token, long maxAgeSeconds) {
    return ResponseCookie.from("refresh_token", token)
            .httpOnly(true)       // 🛡️ يمنع الجافاسكريبت تماماً من قراءة الكوكي (حماية ضد XSS)
            .secure(cookieSecure) // 🔒 لا يُرسل إلا عبر HTTPS المشفر فقط
            .path("/")
            .maxAge(maxAgeSeconds)
            .sameSite("Lax")      // 🛑 يحمي من هجمات تزوير الطلبات عبر المواقع (CSRF)
            .build();
}
```
**التعديل الذي طبقناه:**
جعلنا الـ Default لقيمة `cookieSecure` هي `true`:
`@Value("${app.security.cookie.secure:true}")`
حتى لا يتم تشغيل الموقع في بيئة الإنتاج بالخطأ بدون تشفير.

---

## 10. التكنيك التاسع: منع تسريب تفاصيل السيرفر الداخلية في الأخطاء
### (Information Leakage in Error Responses)

### ⚠️ ما هي المشكلة؟
في `JwtAuthenticationEntryPoint.java`، كان الرد على الأخطاء بالشكل التالي:
```java
// ❌ كود يسرب تفاصيل داخلية:
Map<String, Object> errorBody = Map.of(
    "status", 401,
    "error", "Unauthorized",
    "message", "Full authentication is required: " + authException.getMessage()
);
```

### 🎯 كيف يفكر المخترق؟ (Attack Scenario)
`authException.getMessage()` قد يحتوي على:
- أسماء كلاسات داخلية (Class Names).
- معلومات عن الـ Stack أو الـ Library ومكتبة التشفير وإصداراتها.
المخترق بياخد أسماء المكتبات والإصدارات دي ويبحث عن ثغرات الـ CVE المعروفة لها ليستغلها في كسر السيرفر.

### 💡 الحل الهندسي: رسائل عامة نظيفة (Generic Messages)
```java
// ✅ الكود بعد التصحيح:
Map<String, Object> errorBody = Map.of(
    "status", HttpStatus.UNAUTHORIZED.value(),
    "error", "Unauthorized",
    "message", "Full authentication is required to access this resource",
    "path", request.getRequestURI()
);
```
**الدرس:** التفاصيل التقنية الدقيقة تروح فقط في ملف الـ Logs المشفر في السيرفر للمطور (`log.error(...)`)، ولا تظهر أبداً للعميل في الـ Response Body.

---

## 11. التكنيك العاشر: معايير قوة كلمات المرور والتحقق من المدخلات
### (OWASP Password Standards & Input Validation)

### ⚠️ ما هي المشكلة؟
في `RegisterRequest.java`، كان الحد الأدنى لكلمة المرور 6 أحرف فقط:
```java
// ❌ ضعيف جداً وفقاً لمعايير الأمان الحديثة:
@Size(min = 6, message = "Password must be at least 6 characters")
private String password;
```
كلمة المرور من 6 أحرف يمكن كسرها باستخدام كروت الشاشة الحديثة (GPU Cracking) في بضع ثوانٍ أو دقائق!

### 💡 الحل الهندسي: معايير منظمة OWASP العالمية
وفقاً لـ **OWASP ASVS (Application Security Verification Standard)**:
- الحد الأدنى لكلمات المرور في تطبيقات الويب هو **8 أحرف** على الأقل (ويُفضل 12 في الأنظمة الحساسة).
- تم تعديل الـ DTO ليصبح:
```java
// ✅ متوافق مع معايير OWASP:
@NotBlank(message = "Password is required")
@Size(min = 8, message = "Password must be at least 8 characters")
private String password;
```

---

## 12. نصائح ذهبية وقواعد لا تنساها أبداً (Golden Rules)

احفظ القواعد دي وطبقها في أي مشروع تشتغله في حياتك:

1. 🚫 **لا تخزن باسوورد في كود أو Git:** استخدم دائماً Environment Variables.
2. 🔒 **كل جدول ينزل في قاعدة البيانات وله API عام لازم يتفعل عليه RLS:** متسمحش للمتصفح يكلم الداتا بيز مباشرة بدون تحكم الباك إند.
3. 👤 **الصلاحيات لا تُطلب من الـ Frontend:** الأدوار (Roles) تُحدد بحزم في السيرفر فقط.
4. 🌐 **الهيدرز جاية من العميل؟ إذن هي غير موثوقة:** لا تبني Rate Limiting أو أمان على `X-Forwarded-For` إلا لو متأكد من البروكسي بتاعك.
5. 💾 **أي كوليكشن في الميموري لازم يكون له سقف (Bounded):** الـ Collections غير المحدودة تقتل السيرفر بـ Out of Memory.
6. 🎭 **خلي كل رسايل فشل تسجيل الدخول متطابقة:** امنع الهاكر من معرفة هل الإيميل مسجل أم لا.
7. 🍪 **الـ Refresh Token مكانه في HttpOnly Cookie:** مش في الـ localStorage أبداً.
8. 🤫 **الـ Stack Traces للـ Logs مش للمتصفح:** اخفِ تفاصيل الـ Exceptions عن المستخدم.
9. 📏 **اتبع معايير OWASP في التحقق من صحة البيانات:** المدخلات النظيفة تعني سيستم آمن ونظيف.
10. 🧪 **اختبر الأمان مع كل تغيير:** كل ثغرة تصلحها، اكتب لها Test يتأكد إنها مش هترجع تاني (Regression Test).

---
*تم إعداد هذا الدليل ليكون مرجعاً هندسياً وتعليمياً دائماً لمشروع VARELLION.* 🚀
