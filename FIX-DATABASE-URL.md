# إصلاح مشكلة DATABASE_URL

## المشكلة
Prisma يحاول الاتصال بـ `3x:5432` بدلاً من عنوان Supabase الصحيح.

## السبب
كلمة المرور تحتوي على رموز خاصة (`@`, `?`, `%`) تحتاج إلى URL encoding.

## الحل السريع

### في ملف `.env.local`:

**قبل (خطأ):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**بعد (صحيح):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

### Encoding الرموز:
- `@` → `%40`
- `?` → `%3F`
- `%` → `%25`

## الحل البديل: استخدام DIRECT_URL

إذا كان لديك `DIRECT_URL` في ملفك، يمكنك استخدامه للمigrations:

### 1. استخدم DIRECT_URL للمigrations فقط:

```bash
# استخدم DIRECT_URL مباشرة
npx prisma migrate dev --schema=./prisma/schema.prisma
```

أو قم بتحديث `DATABASE_URL` مؤقتاً لاستخدام `DIRECT_URL`:

```env
# في .env.local - استخدم DIRECT_URL للمigrations
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**ملاحظة:** تأكد من encoding كلمة المرور في `DIRECT_URL` أيضاً!

## الطريقة الأسهل: الحصول على Connection String من Supabase

1. اذهب إلى Supabase Dashboard
2. Settings > Database
3. في قسم "Connection string" اختر "URI"
4. انسخ الرابط الكامل (يجب أن يكون encoded تلقائياً)
5. استبدل `DATABASE_URL` في `.env.local`

## بعد الإصلاح

```bash
# توليد Prisma Client
npm run prisma:generate

# رفع Schema إلى قاعدة البيانات
npx prisma db push

# أو استخدام Migrations
npx prisma migrate dev --name init
```

