# إصلاح Environment Variables في Vercel - خطوة بخطوة

## المشكلة
- البيانات تظهر لثواني ثم تختفي
- المتغيرات في Vercel مختلفة عن Supabase
- عند تغيير المتغيرات في Vercel لم يتغير شيء

## الحل الكامل خطوة بخطوة

### الخطوة 1: الحصول على القيم الصحيحة من Supabase

1. **اذهب إلى Supabase Dashboard:**
   - https://supabase.com/dashboard
   - اختر مشروعك

2. **اذهب إلى Settings > Database**

3. **انسخ Connection Strings:**
   - **Connection Pooling (Session mode):** `postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
   - **Direct Connection:** `postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`

### الخطوة 2: حذف Environment Variables القديمة من Vercel

1. **اذهب إلى Vercel Dashboard:**
   - https://vercel.com/dashboard
   - اختر مشروع `svc-payroll`

2. **اذهب إلى Settings > Environment Variables**

3. **احذف المتغيرات التالية:**
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL` (إذا كان موجوداً)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (إذا كان موجوداً)

4. **احفظ التغييرات**

### الخطوة 3: إضافة Environment Variables الجديدة

**أضف المتغيرات التالية واحدة تلو الأخرى:**

#### 1. DATABASE_URL

- **Name:** `DATABASE_URL`
- **Value:** `postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true`
- **Environment:** اختر `Production`, `Preview`, `Development` (أو الكل)
- **مهم:** لا تضع علامات اقتباس حول القيمة

#### 2. DIRECT_URL

- **Name:** `DIRECT_URL`
- **Value:** `postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`
- **Environment:** اختر `Production`, `Preview`, `Development` (أو الكل)
- **مهم:** لا تضع علامات اقتباس حول القيمة

#### 3. NEXT_PUBLIC_SUPABASE_URL

- **Name:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://yglxbfjakoezxbrgopur.supabase.co`
- **Environment:** اختر `Production`, `Preview`, `Development` (أو الكل)

#### 4. NEXT_PUBLIC_SUPABASE_ANON_KEY

- **Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `sb_publishable_RyeDeKku2AnMdFJl6iss1A_AsP5Zo8y`
- **Environment:** اختر `Production`, `Preview`, `Development` (أو الكل)

### الخطوة 4: التحقق من القيم

بعد إضافة جميع المتغيرات:

1. **تحقق من أن `DATABASE_URL` يحتوي على:**
   - ✅ `?pgbouncer=true` في النهاية (وليس `?pgbc`)
   - ✅ Port `6543` (Pooler)
   - ✅ كلمة المرور الصحيحة: `m@3x?u3x@AR3ei%`

2. **تحقق من أن `DIRECT_URL` يحتوي على:**
   - ✅ Port `5432` (Direct)
   - ✅ كلمة المرور الصحيحة: `m@3x?u3x@AR3ei%`

### الخطوة 5: حذف Deployments القديمة وإعادة Deployment

1. **اذهب إلى Deployments tab**

2. **احذف آخر deployment** (اختياري - للتأكد من بداية جديدة):
   - اضغط على آخر deployment
   - اضغط "..." (ثلاث نقاط)
   - اختر "Delete"

3. **أنشئ deployment جديد:**
   - اضغط "Redeploy" أو
   - ادفع commit جديد إلى GitHub

### الخطوة 6: مراقبة Deployment

1. **راقب Deployment:**
   - انتظر حتى يكتمل Build
   - تحقق من عدم وجود أخطاء

2. **راقب Logs:**
   - اذهب إلى Functions tab
   - تحقق من عدم وجود أخطاء `Can't reach database server at '3x:5432'`
   - تحقق من نجاح API calls

### الخطوة 7: اختبار الموقع

بعد اكتمال Deployment:

1. **افتح https://svc-payroll.vercel.app/dashboard**

2. **تحقق من:**
   - ✅ ظهور البيانات (موظفين، حضور، رواتب)
   - ✅ عدم اختفاء البيانات بعد دقيقة
   - ✅ استقرار الاتصال

## الفرق بين ?pgbc و ?pgbouncer=true

- **`?pgbc`**: معيار قديم - قد لا يعمل بشكل صحيح
- **`?pgbouncer=true`**: معيار Supabase الجديد - **استخدم هذا**

## لماذا لم يتغير شيء عند تحديث المتغيرات؟

السبب المحتمل:
1. **Cache:** Vercel قد يستخدم cache للـ Environment Variables
2. **Deployment قديم:** آخر deployment لا يزال يستخدم القيم القديمة
3. **Environment Variables غير محدثة:** القيم لم تُحفظ بشكل صحيح

**الحل:**
- ✅ حذف وإعادة إضافة Environment Variables
- ✅ حذف آخر deployment وإعادة Deployment جديد
- ✅ التأكد من حفظ التغييرات

## تحديث .env.local المحلي

**DATABASE_URL:**
```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
```

**DIRECT_URL:**
```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## استكشاف الأخطاء

### خطأ: "Can't reach database server at '3x:5432'"
- **السبب:** URL parsing فشل - كلمة المرور تحتاج encoding
- **الحل:** في Vercel، قد تحتاج encoding: `m%403x%3Fu3x%40AR3ei%25`

### البيانات تظهر ثم تختفي
- **السبب:** Connection pooling issues أو prepared statements
- **الحل:** استخدام `?pgbouncer=true` بدلاً من `?pgbc`

### لم يتغير شيء بعد التحديث
- **السبب:** Cache أو deployment قديم
- **الحل:** حذف وإعادة إضافة Environment Variables + حذف deployment وإعادة Deployment

## ملاحظات مهمة

- ✅ **استخدم `?pgbouncer=true`:** من Supabase Dashboard
- ✅ **حذف وإعادة إضافة:** إذا لم يتغير شيء
- ✅ **حذف Deployment:** للتأكد من بداية جديدة
- ✅ **مراقبة Logs:** للتحقق من الأخطاء

