# خطوات إصلاح ملف .env خطوة بخطوة

## المشكلة
Prisma يقرأ من ملف `.env` والمتغيرات فارغة.

## الحل

### الخطوة 1: افتح ملف `.env`

### الخطوة 2: استبدل المحتوى بالكامل بهذا:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yglxbfjakoezxbrgopur.supabase.co

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_RyeDeKku2AnMdFJl6iss1A_AsP5Zo8y

DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"

DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"

SUPABASE_SERVICE_ROLE_KEY=
```

### الخطوة 3: تأكد من:

1. ✅ علامات الاقتباس `"` موجودة حول `DATABASE_URL` و `DIRECT_URL`
2. ✅ لا توجد مسافات قبل أو بعد `=`
3. ✅ كلمة المرور encoded: `m%403x%3Fu3x%40AR3ei%25`

### الخطوة 4: احفظ الملف

### الخطوة 5: جرب:

```bash
npx prisma db push
```

## إذا استمرت المشكلة:

1. تأكد من أن الملف اسمه `.env` (وليس `.env.txt`)
2. تأكد من عدم وجود مسافات إضافية
3. تأكد من أن علامات الاقتباس موجودة

## النتيجة المتوقعة:

بعد الإصلاح، يجب أن ترى:
```
✅ Database synchronized successfully
```

بدلاً من:
```
❌ Error: Can't reach database server at `3x:5432`
```

