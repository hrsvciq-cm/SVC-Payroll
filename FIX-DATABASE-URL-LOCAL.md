# إصلاح مشكلة DATABASE_URL على السيرفر المحلي

## المشكلة
```
Can't reach database server at `3x:5432`
```

هذا الخطأ يعني أن `DATABASE_URL` غير صحيح أو لم يتم ترميزه بشكل صحيح.

## السبب
كلمة المرور في `DATABASE_URL` تحتوي على أحرف خاصة (`@`, `?`, `%`) يجب ترميزها في URL.

## الحل

### الخطوة 1: فتح ملف `.env.local`

افتح ملف `.env.local` في مجلد المشروع:
```
C:\Users\HR\Videos\Payroll System\.env.local
```

### الخطوة 2: التحقق من DATABASE_URL الحالي

يجب أن يكون `DATABASE_URL` بهذا الشكل:
```
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

### الخطوة 3: ترميز كلمة المرور

كلمة المرور الحالية: `m@3x?u3x@AR3ei%`

يجب ترميزها إلى:
- `@` → `%40`
- `?` → `%3F`
- `%` → `%25`

**كلمة المرور المرمزة:**
```
m%403x%3Fu3x%40AR3ei%25
```

### الخطوة 4: تحديث DATABASE_URL

**قبل (غير صحيح):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**بعد (صحيح - مع ترميز):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**أو (بدون ترميز - إذا كان في ملف .env.local بين علامات اقتباس):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

### الخطوة 5: التحقق من DIRECT_URL

تأكد من أن `DIRECT_URL` صحيح أيضاً:

```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**أو مع ترميز:**
```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

### الخطوة 6: إعادة تشغيل Development Server

1. **أوقف development server** (`Ctrl+C` في Terminal)
2. **أعد تشغيله:**
   ```bash
   npm run dev
   ```

### الخطوة 7: التحقق من الاتصال

بعد إعادة التشغيل، تحقق من:
- ✅ لا توجد أخطاء `Can't reach database server`
- ✅ البيانات تظهر في Dashboard
- ✅ يمكن الوصول إلى الموظفين والرواتب

## ملاحظات مهمة

### 1. ترميز URL
- **في ملف `.env.local`**: يمكن استخدام كلمة المرور بدون ترميز إذا كانت بين علامات اقتباس `""`
- **في Vercel Environment Variables**: يجب ترميز كلمة المرور دائماً
- **في الكود**: Node.js يقرأ المتغيرات من `.env.local` بدون ترميز إذا كانت بين علامات اقتباس

### 2. اختلاف بين Local و Vercel
- **Local**: يمكن استخدام كلمة المرور بدون ترميز في `.env.local`
- **Vercel**: يجب ترميز كلمة المرور دائماً

### 3. إذا استمرت المشكلة

إذا استمرت المشكلة بعد التحديث:

1. **احذف `node_modules/.prisma`**:
   ```bash
   rmdir /s /q "node_modules\.prisma"
   ```

2. **أعد توليد Prisma Client**:
   ```bash
   npm run prisma:generate
   ```

3. **أعد تشغيل development server**:
   ```bash
   npm run dev
   ```

## مثال كامل لملف `.env.local`

```env
# Supabase Database Connection
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

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

