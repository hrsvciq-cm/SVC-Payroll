# إصلاح فوري لـ DATABASE_URL

## المشكلة
كلمة المرور `m@3x?u3x@AR3ei%` تحتوي على رموز خاصة تحتاج إلى URL encoding.

## الحل الفوري

### في ملف `.env.local`:

**استبدل هذا (خطأ):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**بهذا (صحيح):**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

### وأيضاً في `DIRECT_URL`:

**استبدل هذا (خطأ):**
```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**بهذا (صحيح):**
```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## Encoding الرموز:
- `@` → `%40`
- `?` → `%3F`
- `%` → `%25`

## بعد التعديل:

1. احفظ الملف `.env.local`
2. أعد تشغيل السيرفر (إذا كان يعمل)
3. جرب:
```bash
npx prisma db push
```

## التحقق:

إذا كان كل شيء صحيح، يجب أن ترى:
```
✅ Database synchronized successfully
```

بدلاً من:
```
❌ Error: Can't reach database server at `3x:5432`
```

