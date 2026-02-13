# القراءات الطبيعية في Terminal

## عند تشغيل `npm run dev`

### ✅ القراءات الطبيعية:

```
> payroll-system@0.1.0 dev
> next dev

  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 2.5s
 ○ Compiling / ...
 ✓ Compiled / in 1.2s
```

### ✅ عند فتح صفحة:

```
○ Compiling /attendance ...
✓ Compiled /attendance in 0.8s
```

### ✅ عند استخدام API:

```
prisma:query SELECT ... FROM "employees" ...
prisma:query SELECT ... FROM "attendance" ...
prisma:query INSERT INTO "attendance" ...
```

### ✅ عند تسجيل الدوام بنجاح:

```
prisma:query SELECT ... FROM "employees" WHERE ...
prisma:query SELECT ... FROM "attendance" WHERE ...
prisma:query INSERT INTO "attendance" ...
POST /api/attendance 200 in 450ms
```

## ❌ القراءات غير الطبيعية (أخطاء):

### خطأ Prisma Client:

```
Unknown argument `absentType`. Available options are marked with ?.
Error creating attendance: PrismaClientValidationError
POST /api/attendance 500 in 382ms
```

**الحل**: يجب إيقاف الخادم وتشغيل `npx prisma generate`

### خطأ قاعدة البيانات:

```
Can't reach database server at ...
Error: P1001
```

**الحل**: تحقق من اتصال قاعدة البيانات

### خطأ المصادقة:

```
Unauthorized
POST /api/attendance 401 in 120ms
```

**الحل**: تأكد من تسجيل الدخول

## 📊 ملخص القراءات الطبيعية:

1. ✅ `Ready in X.Xs` - الخادم جاهز
2. ✅ `Compiled /page in X.Xs` - الصفحة تم تجميعها
3. ✅ `prisma:query SELECT/INSERT/UPDATE` - استعلامات قاعدة البيانات
4. ✅ `POST /api/... 200 in XXXms` - طلبات API ناجحة (200 = نجاح)
5. ✅ `GET /api/... 200 in XXXms` - طلبات API ناجحة

## ❌ أخطاء شائعة:

1. ❌ `500` - خطأ في الخادم (تحقق من السجلات)
2. ❌ `401` - غير مصرح (تحقق من تسجيل الدخول)
3. ❌ `400` - طلب خاطئ (تحقق من البيانات المرسلة)
4. ❌ `PrismaClientValidationError` - Prisma Client غير محدث

## 💡 نصائح:

- **الأرقام الخضراء (200, 201)** = نجاح ✅
- **الأرقام الحمراء (400, 401, 500)** = خطأ ❌
- **prisma:query** = طبيعي جداً (استعلامات قاعدة البيانات)
- **Compiled** = طبيعي (تجميع الصفحات)

