# إصلاح سريع - Environment Variables في Vercel

## المشكلة
- البيانات تظهر لثواني ثم تختفي
- المتغيرات في Vercel مختلفة عن Supabase
- عند تغيير المتغيرات لم يتغير شيء

## الحل السريع (5 دقائق)

### 1. حذف Environment Variables القديمة

في Vercel Dashboard > Settings > Environment Variables:
- احذف `DATABASE_URL`
- احذف `DIRECT_URL`

### 2. إضافة Environment Variables الجديدة

#### DATABASE_URL:
```
postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

#### DIRECT_URL:
```
postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

**مهم:**
- ✅ استخدم `?pgbouncer=true` وليس `?pgbc`
- ✅ لا تضع علامات اقتباس في Vercel
- ✅ اختر جميع البيئات (Production, Preview, Development)

### 3. حذف آخر Deployment

- اذهب إلى Deployments
- احذف آخر deployment
- أنشئ deployment جديد (Redeploy)

### 4. التحقق

- افتح الموقع
- تحقق من ظهور البيانات
- انتظر دقيقة وتحقق من عدم اختفاء البيانات

## الفرق المهم

- ❌ **قديم:** `?pgbc`
- ✅ **جديد:** `?pgbouncer=true` (من Supabase)

## إذا لم يتغير شيء

1. احذف جميع Environment Variables
2. أضفها من جديد
3. احذف آخر deployment
4. أنشئ deployment جديد

