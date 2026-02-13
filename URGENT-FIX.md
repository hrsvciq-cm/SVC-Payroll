# إصلاح عاجل - Prisma + Supabase

## المشكلة
Prisma يقرأ `3x` فقط - الـ URL parsing فشل.

## الحل الفوري

### 1. تحديث ملف `.env`

افتح ملف `.env` واملأه بهذا بالضبط (بدون أي تعديلات):

```env
NEXT_PUBLIC_SUPABASE_URL=https://yglxbfjakoezxbrgopur.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_RyeDeKku2AnMdFJl6iss1A_AsP5Zo8y

DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**مهم جداً:**
- ✅ علامات الاقتباس `"` موجودة
- ✅ لا مسافات قبل أو بعد `=`
- ✅ لا أسطر فارغة بين المتغيرات

### 2. تحديث Prisma Schema

تم تحديث `prisma/schema.prisma` لاستخدام `DIRECT_URL` مباشرة.

### 3. تشغيل الأوامر

```bash
# توليد Prisma Client
npm run prisma:generate

# رفع Schema
npx prisma db push
```

## إذا استمرت المشكلة

### الحل البديل: الحصول على Connection String من Supabase Dashboard

1. اذهب إلى [Supabase Dashboard](https://supabase.com/dashboard)
2. اختر مشروعك
3. Settings > Database
4. Connection string > URI
5. انسخ الرابط الكامل (يجب أن يكون encoded تلقائياً)
6. ضعه في `DIRECT_URL` في ملف `.env`

## التحقق

بعد الإصلاح، يجب أن ترى:
```
✅ Database synchronized successfully
```

