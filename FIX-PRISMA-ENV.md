# إصلاح مشكلة Prisma مع متغيرات البيئة

## المشكلة
Prisma يقرأ من ملف `.env` وليس `.env.local`، والرسالة تقول:
```
Environment variables loaded from .env
```

## الحل

### الطريقة 1: ملء المتغيرات في `.env.local` (الأفضل)

في ملف `.env.local`، املأ المتغيرات بالقيم الصحيحة:

```env
NEXT_PUBLIC_SUPABASE_URL=https://yglxbfjakoezxbrgopur.supabase.co

NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=sb_publishable_RyeDeKku2AnMdFJl6iss1A_AsP5Zo8y

# مهم جداً: كلمة المرور يجب أن تكون encoded
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"

DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**ملاحظة مهمة:** 
- `m@3x?u3x@AR3ei%` → `m%403x%3Fu3x%40AR3ei%25`
- تأكد من وجود علامات الاقتباس `"` حول القيم

### الطريقة 2: إضافة المتغيرات إلى `.env` أيضاً

إذا كان Prisma يقرأ من `.env`، أضف نفس المتغيرات هناك:

في ملف `.env`:
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## بعد التعديل

1. احفظ الملف `.env.local` (و `.env` إذا استخدمت الطريقة 2)
2. جرب:
```bash
npx prisma db push
```

## التحقق

إذا كان كل شيء صحيح، يجب أن ترى:
```
✅ Database synchronized successfully
```

بدلاً من:
```
❌ Error: Can't reach database server at `3x:5432`
```

