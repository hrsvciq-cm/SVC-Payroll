# إصلاح مشكلة اختفاء البيانات على Vercel

## المشكلة
البيانات تظهر ثم تختفي بعد أقل من دقيقة على Vercel.

## السبب المحتمل
1. **Connection Pooling Issues**: Supabase connection pooler قد يقطع الاتصال
2. **Environment Variables**: قد تكون Environment Variables في Vercel غير صحيحة أو تتغير
3. **Prisma Client Instance**: قد يتم إنشاء instances متعددة من PrismaClient

## الحل

### الخطوة 1: التحقق من Environment Variables في Vercel

1. **اذهب إلى Vercel Dashboard:**
   - https://vercel.com/dashboard
   - اختر مشروع `svc-payroll`

2. **اذهب إلى Settings > Environment Variables**

3. **تحقق من وجود المتغيرات التالية:**
   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   DATABASE_URL
   ```

4. **تأكد من أن القيم صحيحة:**
   - `DATABASE_URL` يجب أن يكون بالشكل:
     ```
     postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc
     ```
   - **مهم:** يجب أن يحتوي على `?pgbc` في النهاية (لـ connection pooling)
   - **مهم:** كلمة المرور يجب أن تكون encoded (`%40` بدلاً من `@`)

5. **تأكد من أن Environment Variables مضبوطة لجميع البيئات:**
   - Production
   - Preview
   - Development

### الخطوة 2: استخدام Connection Pooler الصحيح

**مهم جداً:** استخدم **Pooler** connection string وليس Direct connection:

- ✅ **صحيح (Pooler):** `...pooler.supabase.com:6543/postgres?pgbc`
- ❌ **خطأ (Direct):** `...pooler.supabase.com:5432/postgres`

**الفرق:**
- **Pooler (6543)**: يدعم connection pooling - مناسب لـ Vercel serverless
- **Direct (5432)**: اتصال مباشر - قد يسبب مشاكل في serverless

### الخطوة 3: التحقق من Supabase Dashboard

1. **اذهب إلى Supabase Dashboard:**
   - https://supabase.com/dashboard
   - اختر مشروعك

2. **اذهب إلى Settings > Database**

3. **تحقق من Connection Pooling:**
   - يجب أن يكون مفعّل
   - انسخ Connection String من "Connection string" > "URI"
   - تأكد من أنه يحتوي على `?pgbc`

### الخطوة 4: إعادة Deployment

بعد تحديث Environment Variables:

1. **اذهب إلى Deployments tab في Vercel**
2. **اضغط "Redeploy"** للـ deployment الأخير
3. **أو ادفع commit جديد إلى GitHub**

### الخطوة 5: مراقبة Logs

بعد إعادة Deployment:

1. **اذهب إلى Vercel Dashboard > Deployments**
2. **اضغط على آخر deployment**
3. **اذهب إلى "Functions" tab**
4. **راقب Logs للتحقق من:**
   - أخطاء الاتصال
   - أخطاء Prisma
   - أخطاء Authentication

## استكشاف الأخطاء

### خطأ: "prepared statement already exists"
- **السبب:** عدة instances من PrismaClient
- **الحل:** تم إصلاحه في `lib/prisma.js` - يستخدم single instance

### خطأ: "Connection refused" أو "Connection timeout"
- **السبب:** `DATABASE_URL` غير صحيح أو connection pooler غير مفعّل
- **الحل:** 
  1. تحقق من `DATABASE_URL` في Vercel
  2. تأكد من استخدام Pooler (port 6543)
  3. تأكد من وجود `?pgbc` في نهاية URL

### البيانات تظهر ثم تختفي
- **السبب:** Connection drops أو Environment Variables تتغير
- **الحل:**
  1. تحقق من Environment Variables في Vercel
  2. تأكد من استخدام Pooler connection string
  3. تحقق من Supabase Dashboard - قد تكون هناك مشكلة في قاعدة البيانات

## التحقق من الاتصال

شغّل هذا الأمر محلياً للتحقق من الاتصال:
```bash
node verify-connection.js
```

يجب أن ترى:
```
✅ الاتصال بنجاح!
✅ اختبار Query نجح
```

## ملاحظات مهمة

- ✅ **استخدم Pooler:** دائماً استخدم port 6543 مع `?pgbc`
- ✅ **Environment Variables:** تأكد من أنها موجودة في Vercel
- ✅ **Single Instance:** PrismaClient يستخدم single instance لتجنب المشاكل
- ⚠️ **لا تستخدم Direct Connection:** Direct connection (port 5432) قد يسبب مشاكل في serverless

## بعد الإصلاح

بعد تطبيق الحلول:
1. ✅ البيانات يجب أن تظهر بشكل مستمر
2. ✅ لا يجب أن تختفي بعد دقيقة
3. ✅ الاتصال يجب أن يكون مستقراً

