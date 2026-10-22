# 🚀 دليل تشغيل واستخدام Bruno لاختبار الـ APIs (مشروع VARELLION)

> **أهلاً بك يا معلم!** كل الـ URLs في الملفات دي **جاهزة ومكتوبة بالكامل** (`http://localhost:8080/api/auth/...`) بحيث تفتح البرنامج وتدوس **Send** فوراً من غير ما توجع دماغك بإعدادات أو متغيرات! 🎉

---

## 📂 1. إزاي تفتح الكوليكشن في Bruno؟ (في 10 ثواني)

1. افتح برنامج **Bruno** على جهازك (موجود عندك في الـ Applications أو اكتب `bruno` في التيرمينال).
2. من الشاشة الرئيسية، اضغط على زرار **"Open Collection"**.
3. اختار فولدر **`bruno`** الموجود على الديسك توب:
   ```text
   /home/mohamed-saad/Desktop/براند/bruno
   ```
4. مبروك! هتلاقي الكوليكشن فتح في الجنب الشمال باسم **`VARELLION E-Commerce API`**.

---

## ⚡ 2. كل الـ URLs جاهزة ومكتوبة بالكامل:

مش محتاج تختار Environment ولا تعمل أي إعداد يدوي! كل طلب مكتوب جواه الرابط المباشر بتاعه:

1. **`1. Register New User`** ➡️ `POST http://localhost:8080/api/auth/register`
   - بيسجل مستخدم جديد (Username: `mohamed_cody`).
2. **`2. Login User`** ➡️ `POST http://localhost:8080/api/auth/login`
   - بيسجل الدخول، وبيحفظ الـ Tokens تلقائياً في Bruno!
3. **`3. Refresh Access Token`** ➡️ `POST http://localhost:8080/api/auth/refresh`
   - بيجدد الـ Access Token تلقائياً.
4. **`4. Logout User`** ➡️ `POST http://localhost:8080/api/auth/logout`
   - بيسجل الخروج ويمسح الجلسة.
5. **`5. Security Test - Invalid Credentials`** ➡️ `POST http://localhost:8080/api/auth/login`
   - بيجرب باسوورد غلط عشان تشوف رسالة الأمان الموحدة (`401 Unauthorized`).
6. **`6. Security Test - Weak Password`** ➡️ `POST http://localhost:8080/api/auth/register`
   - بيجرب باسوورد أقل من 8 حروف عشان تشوف الـ Validation بيرفضه إزاي (`400 Bad Request`).
7. **`7. Google Login`** ➡️ `POST http://localhost:8080/api/auth/google`
   - بيسجل الدخول بجوجل ويوثق الحساب ويحفظ الـ Tokens تلقائياً في Bruno!

---

## 🧪 3. خطوات التيست العملي:

### الخطوة 1: تشغيل السيرفر أولاً
افتح تيرمينال واكتب:
```bash
cd backend
mvn spring-boot:run
```
*(أو اضغط Run لـ `VarellionApplication.java` من داخل الـ IDE)*.

### الخطوة 2: التجربة في Bruno
1. اضغط على أي طلب من الشمال (مثلاً `1. Register New User`).
2. اضغط على الزرار الأزرق الكبير **Send** (أو اختصار `Ctrl + Enter`).
3. بص في النص اليمين: هتلاقي الـ Status Code طلع بلون أخضر `200 OK` ورجعلك الـ JSON!

---
*كده كل حاجة متظبطة وجاهزة بضغطة زرار يا معلم!* 🚀
