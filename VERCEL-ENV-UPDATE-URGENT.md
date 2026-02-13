# تحديث عاجل - Environment Variables في Vercel

## المشكلة
المتغيرات في Vercel مختلفة عن Supabase، والبيانات تظهر لثواني ثم تختفي.

## الحل الفوري

### الخطوة 1: تحديث Environment Variables في Vercel

اذهب إلى Vercel Dashboard > Settings > Environment Variables وحدّث:

#### 1. DATABASE_URL

**القيمة الصحيحة (من Supabase):**
```
postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
```

**مهم جداً:**
- ✅ استخدم `?pgbouncer=true` وليس `?pgbc`
- ✅ Port: `6543` (Pooler)
- ✅ كلمة المرور: `m@3x?u3x@AR3ei%` (كما هي)
- ✅ **لا تضع علامات اقتباس** حول القيمة في Vercel

#### 2. DIRECT_URL

**القيمة الصحيحة (من Supabase):**
```
postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
```

**مهم:**
- ✅ Port: `5432` (Direct)
- ✅ كلمة المرور: `m@3x?u3x@AR3ei%` (كما هي)
- ✅ **لا تضع علامات اقتباس** حول القيمة في Vercel

#### 3. NEXT_PUBLIC_SUPABASE_URL

```
https://yglxbfjakoezxbrgopur.supabase.co
```

#### 4. NEXT_PUBLIC_SUPABASE_ANON_KEY

```
sb_publishable_RyeDeKku2AnMdFJl6iss1A_AsP5Zo8y
```

### الخطوة 2: حذف وإعادة إضافة المتغيرات

إذا لم يتغير شيء بعد التحديث:

1. **احذف `DATABASE_URL` و `DIRECT_URL` من Vercel**
2. **أضفهما من جديد** بالقيم الصحيحة
3. **تأكد من أن Environment مضبوط لجميع البيئات:**
   - Production
   - Preview
   - Development

### الخطوة 3: إعادة Deployment

بعد تحديث Environment Variables:

1. **اذهب إلى Deployments tab**
2. **احذف آخر deployment** (اختياري - للتأكد من بداية جديدة)
3. **اضغط "Redeploy"** أو ادفع commit جديد إلى GitHub

### الخطوة 4: التحقق من Logs

بعد إعادة Deployment:

1. **اذهب إلى Deployments > Functions**
2. **راقب Logs للتحقق من:**
   - عدم وجود أخطاء `Can't reach database server at '3x:5432'`
   - عدم وجود أخطاء connection
   - نجاح API calls

## الفرق بين ?pgbc و ?pgbouncer=true

- **`?pgbc`**: معيار قديم
- **`?pgbouncer=true`**: معيار Supabase الجديد - **استخدم هذا**

## تحديث .env.local المحلي

**DATABASE_URL:**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**DIRECT_URL:**
```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## لماذا البيانات تظهر ثم تختفي؟

السبب المحتمل:
1. **Connection Pooling Issues**: الاتصال ينقطع بعد فترة
2. **Prepared Statements**: مشكلة في prepared statements
3. **Environment Variables**: القيم القديمة لا تزال مستخدمة

**الحل:**
- ✅ استخدام `?pgbouncer=true` بدلاً من `?pgbc`
- ✅ حذف وإعادة إضافة Environment Variables في Vercel
- ✅ إعادة Deployment كامل

## التحقق النهائي

بعد تطبيق جميع الخطوات:

1. **افتح https://svc-payroll.vercel.app/dashboard**
2. **تحقق من ظهور البيانات**
3. **انتظر دقيقة وتحقق من عدم اختفاء البيانات**
4. **راقب Logs في Vercel**

## ملاحظات مهمة

- ✅ **استخدم القيم من Supabase بالضبط:** `?pgbouncer=true`
- ✅ **حذف وإعادة إضافة:** إذا لم يتغير شيء
- ✅ **إعادة Deployment:** بعد كل تحديث
- ✅ **مراقبة Logs:** للتحقق من الأخطاء

