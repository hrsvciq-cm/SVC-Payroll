# إصلاح شامل - محلياً وعلى Vercel

## المشكلة
```
Error: prepared statement "s28" does not exist
```
البيانات لا تظهر في لوحة التحكم محلياً وعلى Vercel.

## الحل الشامل

### الخطوة 1: تحديث ملف `.env.local` (للتطوير المحلي)

**افتح ملف `.env.local` واستخدم هذا:**

```env
# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=https://yglxbfjakoezxbrgopur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# للتطوير المحلي: استخدم DIRECT_URL (port 5432) - يدعم prepared statements
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

**أو (مع ترميز):**

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

### الخطوة 2: تحديث Environment Variables في Vercel

**اذهب إلى Vercel Dashboard:**

1. **افتح مشروعك:**
   - https://vercel.com/dashboard
   - اختر مشروع `svc-payroll`

2. **اذهب إلى Settings > Environment Variables**

3. **أضف/حدّث المتغيرات:**

   **DATABASE_URL (لـ Production):**
   ```
   postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   
   **DIRECT_URL (لـ Migrations):**
   ```
   postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
   ```

   **أو (مع ترميز):**
   
   **DATABASE_URL:**
   ```
   postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```
   
   **DIRECT_URL:**
   ```
   postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:5432/postgres
   ```

4. **تأكد من:**
   - ✅ Environment: **Production, Preview, Development** (جميع البيئات)
   - ✅ لا توجد مسافات قبل أو بعد القيم
   - ✅ القيم بين علامات اقتباس (اختياري في Vercel)

5. **احفظ التغييرات**

### الخطوة 3: إعادة Deployment على Vercel

1. **اذهب إلى Deployments tab**
2. **اضغط على آخر deployment**
3. **اضغط "Redeploy"**
4. **انتظر حتى يكتمل Deployment**

### الخطوة 4: إصلاح محلياً

**1. أوقف Development Server:**
```bash
# اضغط Ctrl+C في Terminal
```

**2. احذف Prisma Client القديم:**
```powershell
rmdir /s /q "node_modules\.prisma"
```

**3. أعد توليد Prisma Client:**
```bash
npm run prisma:generate
```

**4. أعد تشغيل Development Server:**
```bash
npm run dev
```

### الخطوة 5: التحقق من الإصلاح

**محلياً:**
1. ✅ افتح `http://localhost:3000/dashboard`
2. ✅ تحقق من عدم وجود أخطاء `prepared statement does not exist`
3. ✅ تحقق من ظهور البيانات (الموظفين، الحضور، الرواتب)

**على Vercel:**
1. ✅ افتح `https://svc-payroll.vercel.app/dashboard`
2. ✅ تحقق من عدم وجود أخطاء
3. ✅ تحقق من ظهور البيانات

## كيف يعمل الحل

### للتطوير المحلي:
- **يستخدم `DIRECT_URL` (port 5432)** - يدعم prepared statements
- **لا يحتاج إلى connection pooling** - اتصال مباشر
- **أسرع وأكثر استقراراً** للتطوير

### لـ Vercel (Production):
- **يستخدم `DATABASE_URL` (port 6543)** - connection pooling
- **يضيف `connection_limit=1`** تلقائياً - يمنع prepared statement issues
- **أفضل للأداء** في production

## استكشاف الأخطاء

### خطأ: `prepared statement "s28" does not exist` (محلياً)
- **السبب**: استخدام connection pooling (port 6543) محلياً
- **الحل**: استخدم `DIRECT_URL` (port 5432) في `.env.local`

### خطأ: `prepared statement "s28" does not exist` (على Vercel)
- **السبب**: PgBouncer لا يدعم prepared statements
- **الحل**: تأكد من استخدام `DATABASE_URL` مع `?pgbouncer=true` في Vercel

### خطأ: `Can't reach database server`
- **السبب**: `DATABASE_URL` غير صحيح أو غير مُرمز
- **الحل**: تحقق من ترميز كلمة المرور أو استخدام علامات اقتباس

### خطأ: البيانات لا تظهر
- **السبب**: Environment Variables غير صحيحة
- **الحل**: تحقق من `DATABASE_URL` و `DIRECT_URL` في Vercel Dashboard

## ملاحظات مهمة

### 1. الفرق بين المحلي و Vercel
- **المحلي**: يستخدم `DIRECT_URL` (port 5432) - يدعم prepared statements
- **Vercel**: يستخدم `DATABASE_URL` (port 6543) - connection pooling مع `connection_limit=1`

### 2. Environment Variables
- **`.env.local`**: للتطوير المحلي فقط
- **Vercel Dashboard**: لـ production فقط
- **لا ترفع `.env.local`** إلى GitHub (محمي في `.gitignore`)

### 3. Prisma Client
- **يتم تحديثه تلقائياً** بناءً على البيئة (محلي/vercel)
- **لا حاجة لتعديل يدوي** في `lib/prisma.js`

## بعد الإصلاح

بعد تطبيق الحل:
1. ✅ البيانات تظهر محلياً
2. ✅ البيانات تظهر على Vercel
3. ✅ لا توجد أخطاء `prepared statement does not exist`
4. ✅ الاتصال مع Supabase يعمل بشكل صحيح

