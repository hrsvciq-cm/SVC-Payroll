# 🔴 إصلاح عاجل - فقدان البيانات على السيرفر المحلي

## المشكلة
```
Can't reach database server at `3x:5432`
```
هذا يعني أن `DATABASE_URL` غير صحيح أو لم يتم ترميزه بشكل صحيح.

## الحل الفوري (خطوة بخطوة)

### الخطوة 1: فتح ملف `.env.local`

افتح الملف:
```
C:\Users\HR\Videos\Payroll System\.env.local
```

### الخطوة 2: تحديث DATABASE_URL

**استبدل `DATABASE_URL` بهذا بالضبط:**

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**أو (بدون ترميز - إذا كان في ملف .env.local بين علامات اقتباس):**

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

### الخطوة 3: تحديث DIRECT_URL

**استبدل `DIRECT_URL` بهذا بالضبط:**

```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**أو (بدون ترميز):**

```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

### الخطوة 4: مثال كامل لملف `.env.local`

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://yglxbfjakoezxbrgopur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database Connection (مع ترميز)
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**أو (بدون ترميز - في ملف .env.local):**

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://yglxbfjakoezxbrgopur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Database Connection (بدون ترميز - بين علامات اقتباس)
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

### الخطوة 5: حفظ الملف

احفظ ملف `.env.local` بعد التعديل.

### الخطوة 6: إيقاف Development Server

في Terminal الذي يعمل فيه `npm run dev`:
1. اضغط `Ctrl+C`
2. انتظر حتى يتوقف تماماً

### الخطوة 7: حذف Prisma Client القديم

```powershell
rmdir /s /q "node_modules\.prisma"
```

### الخطوة 8: إعادة توليد Prisma Client

```bash
npm run prisma:generate
```

### الخطوة 9: إعادة تشغيل Development Server

```bash
npm run dev
```

### الخطوة 10: التحقق من الاتصال

بعد إعادة التشغيل:
1. ✅ افتح `http://localhost:3000/dashboard`
2. ✅ تحقق من عدم وجود أخطاء `Can't reach database server`
3. ✅ تحقق من ظهور البيانات

## إذا استمرت المشكلة

### الحل البديل 1: استخدام Connection String من Supabase Dashboard

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. Settings > Database
4. Connection string > URI
5. انسخ الرابط الكامل (يجب أن يكون encoded تلقائياً)
6. ضعه في `DATABASE_URL` و `DIRECT_URL` في ملف `.env.local`

### الحل البديل 2: التحقق من ملف `.env` أيضاً

إذا كان Prisma يقرأ من `.env` أيضاً، أضف نفس المتغيرات هناك:

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## ملاحظات مهمة

### 1. ترميز URL
- **في ملف `.env.local`**: يمكن استخدام كلمة المرور بدون ترميز إذا كانت بين علامات اقتباس `""`
- **في Vercel**: يجب ترميز كلمة المرور دائماً
- **في الكود**: Node.js يقرأ المتغيرات من `.env.local` بدون ترميز إذا كانت بين علامات اقتباس

### 2. علامات الاقتباس
- ✅ **يجب** وجود علامات اقتباس `"` حول `DATABASE_URL` و `DIRECT_URL`
- ❌ **لا** تضع مسافات قبل أو بعد `=`

### 3. ترميز الأحرف الخاصة
- `@` → `%40`
- `?` → `%3F`
- `%` → `%25`

## استكشاف الأخطاء

### خطأ: `Can't reach database server at '3x:5432'`
- **السبب**: كلمة المرور غير مُرمزة أو `DATABASE_URL` غير صحيح
- **الحل**: تأكد من ترميز كلمة المرور أو استخدام علامات اقتباس في `.env.local`

### خطأ: `Invalid connection string`
- **السبب**: تنسيق `DATABASE_URL` غير صحيح
- **الحل**: تأكد من التنسيق: `postgresql://user:password@host:port/database?options`

### خطأ: `Authentication failed`
- **السبب**: كلمة المرور أو اسم المستخدم غير صحيح
- **الحل**: تحقق من بيانات الاعتماد في Supabase Dashboard

## بعد الإصلاح

بعد إصلاح `DATABASE_URL`:
1. ✅ البيانات يجب أن تظهر في Dashboard
2. ✅ يجب أن يعمل الاتصال مع Supabase
3. ✅ لا يجب أن تكون هناك أخطاء في Terminal

