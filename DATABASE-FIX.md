# إصلاح مشكلة الاتصال بقاعدة البيانات

## المشكلة
Prisma يحاول الاتصال بـ `3x:5432` بدلاً من عنوان Supabase الصحيح.

## السبب
كلمة المرور في `DATABASE_URL` تحتوي على رموز خاصة (`@`, `?`, `%`) تحتاج إلى encoding.

## الحل

### الطريقة 1: استخدام URL Encoding (الأفضل)

في ملف `.env.local`، يجب encoding كلمة المرور:

**قبل (خطأ):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**بعد (صحيح):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**Encoding Table:**
- `@` → `%40`
- `?` → `%3F`
- `%` → `%25`

### الطريقة 2: استخدام DIRECT_URL للمigrations

إذا كان لديك `DIRECT_URL` في ملفك، استخدمه للمigrations:

```bash
# استخدم DIRECT_URL للمigrations
npx prisma migrate dev --schema=./prisma/schema.prisma
```

أو قم بتحديث `DATABASE_URL` لاستخدام `DIRECT_URL` مؤقتاً.

### الطريقة 3: الحصول على Connection String من Supabase

1. اذهب إلى Supabase Dashboard
2. Settings > Database
3. في قسم "Connection string" اختر "URI"
4. انسخ الرابط الكامل (يجب أن يكون encoded تلقائياً)

## التحقق من الإصلاح

بعد إصلاح `DATABASE_URL`، جرب:

```bash
npx prisma db push
```

أو:

```bash
npx prisma migrate dev
```

