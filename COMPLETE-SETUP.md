# الإعداد الكامل - Prisma + Supabase

## المشكلة الحالية
Prisma لا يستطيع الاتصال بـ Supabase - يقرأ `3x` فقط من العنوان.

## الحل الكامل خطوة بخطوة

### 1. تحديث ملف `.env`

افتح ملف `.env` واستبدل المحتوى بالكامل بهذا:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yglxbfjakoezxbrgopur.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_RyeDeKku2AnMdFJl6iss1A_AsP5Zo8y

DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**مهم جداً:**
- ✅ علامات الاقتباس `"` موجودة حول DATABASE_URL و DIRECT_URL
- ✅ لا مسافات قبل أو بعد `=`
- ✅ كلمة المرور encoded: `m%403x%3Fu3x%40AR3ei%25`

### 2. التحقق من المتغيرات

```bash
node test-env.js
```

### 3. توليد Prisma Client

```bash
npm run prisma:generate
```

### 4. رفع Schema إلى Supabase

```bash
npx prisma db push
```

### 5. إذا استمرت المشكلة - استخدام DIRECT_URL مباشرة

عدّل `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DIRECT_URL")  // استخدام DIRECT_URL مباشرة
  directUrl = env("DIRECT_URL")
}
```

ثم:
```bash
npm run prisma:generate
npx prisma db push
```

### 6. اختبار الاتصال

```bash
node verify-connection.js
```

## إذا استمرت المشاكل

### الحل البديل: الحصول على Connection String من Supabase

1. اذهب إلى Supabase Dashboard
2. Settings > Database
3. Connection string > URI
4. انسخ الرابط الكامل
5. ضعه في `DATABASE_URL` و `DIRECT_URL` في ملف `.env`

## النتيجة المتوقعة

بعد الإصلاح:
```
✅ Database synchronized successfully
```

بدلاً من:
```
❌ Error: Can't reach database server at `3x:5432`
```

