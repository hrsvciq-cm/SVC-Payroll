# إصلاح DATABASE_URL الصحيح

## DATABASE_URL الصحيح

### في Vercel Environment Variables:

**DATABASE_URL (الصحيح):**
```
postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc
```

**مهم جداً:**
- ✅ استخدم كلمة المرور كما هي: `m@3x?u3x@AR3ei%` (بدون encoding)
- ✅ استخدم port `6543` (Pooler)
- ✅ تأكد من وجود `?pgbc` في النهاية
- ✅ لا تضع علامات اقتباس حول القيمة في Vercel

### الخطوات في Vercel:

1. **اذهب إلى Vercel Dashboard:**
   - https://vercel.com/dashboard
   - اختر مشروع `svc-payroll`

2. **اذهب إلى Settings > Environment Variables**

3. **ابحث عن `DATABASE_URL` أو أنشئه جديداً:**
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc`
   - **Environment:** اختر `Production`, `Preview`, `Development` (أو الكل)

4. **احفظ التغييرات**

5. **أعد Deployment:**
   - اذهب إلى Deployments tab
   - اضغط "Redeploy" للـ deployment الأخير

### في ملف `.env.local` المحلي:

**استخدم نفس القيمة:**

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc"
```

**ملاحظة:** في `.env.local`، ضع علامات اقتباس حول القيمة.

## التحقق من الإعداد

بعد تحديث `DATABASE_URL` في Vercel:

1. **تحقق من القيمة:**
   - تأكد من أن `DATABASE_URL` في Vercel مطابق تماماً للقيمة أعلاه
   - تأكد من عدم وجود مسافات إضافية
   - تأكد من أن port هو `6543` وليس `5432`

2. **أعد Deployment:**
   - اذهب إلى Deployments
   - اضغط "Redeploy"

3. **راقب Logs:**
   - بعد Deployment، اذهب إلى Functions tab
   - راقب Logs للتحقق من عدم وجود أخطاء اتصال

## استكشاف الأخطاء

### إذا استمرت المشكلة:

1. **تحقق من Supabase Dashboard:**
   - اذهب إلى Supabase Dashboard
   - Settings > Database
   - Connection string > URI
   - انسخ الرابط الكامل واستخدمه

2. **تحقق من Connection Pooling:**
   - تأكد من أن Pooler مفعّل في Supabase
   - تأكد من استخدام port `6543` مع `?pgbc`

3. **تحقق من Logs في Vercel:**
   - اذهب إلى Deployments > Functions
   - ابحث عن أخطاء الاتصال أو Prisma errors

## ملاحظات مهمة

- ✅ **في Vercel:** لا تضع علامات اقتباس حول القيمة
- ✅ **في .env.local:** ضع علامات اقتباس حول القيمة
- ✅ **Port:** استخدم `6543` (Pooler) وليس `5432` (Direct)
- ✅ **Connection Pooling:** تأكد من وجود `?pgbc` في النهاية

