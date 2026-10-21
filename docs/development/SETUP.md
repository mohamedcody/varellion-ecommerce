# دليل إعداد وتشغيل مشروع VARELLION
# VARELLION Local Development Setup Guide

> **الهدف:** توفير خطوات واضحة ومباشرة للمطور لتثبيت وتشغيل بيئة التطوير المحلية للباك إند وقاعدة البيانات.

---

## 1. المتطلبات المسبقة (Prerequisites)

تأكد من تثبيت الأدوات التالية على نظامك (Linux / macOS / Windows WSL):
1. **Java Development Kit (JDK):** الإصدار 17 أو أحدث.
   ```bash
   java -version
   ```
2. **Apache Maven:** الإصدار 3.9 أو أحدث.
   ```bash
   mvn -version
   ```
3. **Git:** لإدارة النسخ وتتبع التغييرات.

---

## 2. إعداد قاعدة البيانات والبيئة (Environment Configuration)

1. انتقل لمجلد الباك إند:
   ```bash
   cd /home/mohamed-saad/Desktop/براند/backend
   ```
2. انسخ ملف المتغيرات البيئية:
   ```bash
   cp .env.example .env
   ```
3. عدل القيم المطلوبة في `.env`:
   - `SPRING_DATASOURCE_URL`: رابط الاتصال بـ Supabase PostgreSQL (أو داتابيز محلية).
   - `SPRING_DATASOURCE_USERNAME`: اسم مستخدم قاعدة البيانات.
   - `SPRING_DATASOURCE_PASSWORD`: كلمة مرور قاعدة البيانات.
   - `JWT_SECRET`: مفتاح تشفير التوكن (Base64-encoded 256-bit).

---

## 3. بناء واختبار الباك إند (Build & Test)

1. **فحص التحزيم وتوليد كلاسات MapStruct:**
   ```bash
   mvn clean compile
   ```
   يجب أن يظهر في النهاية: `BUILD SUCCESS`.

2. **تشغيل الاختبارات الآلية (Unit & Integration Tests):**
   ```bash
   mvn test
   ```

---

## 4. تشغيل خادم التطبيق (Run Application)

تشغيل التطبيق مباشرة عبر Maven:
```bash
mvn spring-boot:run
```

- الخادم سيبدأ على المنفذ: `http://localhost:8080`.
- فحص الحالة والصحة:
  ```bash
  curl http://localhost:8080/actuator/health
  ```
  الرد المتوقع: `{"status":"UP"}`.

---

## 5. قواعد الأمان أثناء التطوير (Security Guidelines)
- **ممنوع نهائياً** حفظ كلمات مرور أو مفاتيح سرية حقيقية داخل كود الجافا أو ملفات الماركداون.
- ملف `.env` يتم تجاهله تلقائياً بواسطة Git ولا يتم رفعه إطلاقاً.
