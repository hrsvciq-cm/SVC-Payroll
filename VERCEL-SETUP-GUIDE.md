# دليل إعداد Vercel Deployment

## ✅ التحسينات المطبقة

### 1. `package.json`
- ✅ إضافة `postinstall` script لتوليد Prisma Client تلقائياً
- ✅ تحديث `build` script ليشمل `prisma generate`
- ✅ إضافة `engines` لتحديد Node.js version

### 2. `prisma/schema.prisma`
- ✅ تحديث لاستخدام `DATABASE_URL` (Vercel يستخدمه)
- ✅ `DIRECT_URL` كـ fallback للتطوير المحلي

### 3. `vercel.json`
- ✅ إعداد build command
- ✅ إعداد framework

### 4. `next.config.js`
- ✅ تحسين webpack configuration لـ Prisma

## 📋 خطوات Deployment على Vercel

### الخطوة 1: إعداد Environment Variables في Vercel

1. اذهب إلى: https://vercel.com/dashboard
2. اختر المشروع (أو أنشئ مشروع جديد)
3. Settings > Environment Variables
4. أضف المتغيرات التالية:

#### Production Environment:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
```

**مهم جداً:**
- ✅ لا تضع علامات اقتباس حول القيم
- ✅ تأكد من أن `DATABASE_URL` موجود (Vercel يحتاجه)
- ✅ يمكنك نسخ القيم من `.env.local` المحلي

### الخطوة 2: ربط GitHub Repository

إذا لم يكن المشروع مربوطاً:
1. في Vercel Dashboard
2. Add New Project
3. Import Git Repository
4. اختر: `hrsvciq-cm/SVC-Payroll`
5. Configure Project:
   - Framework Preset: **Next.js** (سيتم اكتشافه تلقائياً)
   - Root Directory: `./` (افتراضي)
   - Build Command: `npm run build` (سيستخدم من `package.json`)
   - Output Directory: `.next` (افتراضي)
   - Install Command: `npm install` (افتراضي)

### الخطوة 3: Deployment

1. اضغط "Deploy"
2. Vercel سيقوم بـ:
   - ✅ Clone المشروع من GitHub
   - ✅ Install dependencies (`npm install`)
   - ✅ Run `postinstall` (يولد Prisma Client)
   - ✅ Run `npm run build` (يولد Prisma Client ثم يبني Next.js)
   - ✅ Deploy

## 🔍 التحقق من النجاح

بعد Deployment:
1. ✅ يجب أن يكتمل Build بنجاح (بدون أخطاء)
2. ✅ يجب أن يعمل الموقع على Vercel URL
3. ✅ يجب أن يعمل تسجيل الدخول
4. ✅ يجب أن تعمل جميع الصفحات

## 🐛 حل المشاكل الشائعة

### مشكلة: "Prisma Client not generated"
**الأعراض**: `Error: Cannot find module '@prisma/client'`

**الحل**:
1. تأكد من وجود `postinstall` script في `package.json`
2. تأكد من أن `@prisma/client` في `dependencies` (ليس `devDependencies`)
3. أعد Deployment

### مشكلة: "DATABASE_URL not found"
**الأعراض**: `Error: Can't reach database server`

**الحل**:
1. أضف `DATABASE_URL` في Vercel Environment Variables
2. تأكد من أن القيمة صحيحة (بدون علامات اقتباس)
3. أعد Deployment

### مشكلة: "Build timeout"
**الأعراض**: Build يتوقف أو يفشل بسبب timeout

**الحل**:
1. تأكد من أن `prisma generate` يعمل بسرعة
2. تحقق من حجم `node_modules`
3. تأكد من أن `DATABASE_URL` موجود (قد يسبب Prisma تأخير)

### مشكلة: "Module not found: @prisma/client"
**الأعراض**: خطأ في build عن `@prisma/client`

**الحل**:
1. تأكد من وجود `@prisma/client` في `dependencies`
2. تأكد من وجود `postinstall` script
3. أعد Deployment

### مشكلة: "Environment variables not loaded"
**الأعراض**: الموقع لا يعمل بسبب missing env vars

**الحل**:
1. تأكد من إضافة جميع Environment Variables في Vercel
2. تأكد من أن القيم صحيحة
3. أعد Deployment بعد إضافة المتغيرات

## 📝 Checklist قبل Deployment

- [ ] ✅ `package.json` يحتوي على `postinstall` script
- [ ] ✅ `package.json` يحتوي على `build` script مع `prisma generate`
- [ ] ✅ `@prisma/client` في `dependencies` (ليس `devDependencies`)
- [ ] ✅ `prisma/schema.prisma` يستخدم `DATABASE_URL`
- [ ] ✅ `vercel.json` موجود ومحدّث
- [ ] ✅ Environment Variables مضافة في Vercel Dashboard
- [ ] ✅ `DATABASE_URL` موجود في Vercel Environment Variables

## 🎯 بعد Deployment الناجح

1. ✅ اختبر الموقع على Vercel URL
2. ✅ اختبر تسجيل الدخول
3. ✅ اختبر جميع الصفحات (Dashboard, Employees, Attendance, Payroll)
4. ✅ راقب Logs في Vercel Dashboard
5. ✅ تحقق من أن البيانات تُحفظ بشكل صحيح

## 📊 Monitoring

بعد Deployment، راقب:
- ✅ Build Logs في Vercel Dashboard
- ✅ Runtime Logs في Vercel Dashboard
- ✅ Function Logs (API routes)
- ✅ Error Logs

## 🔄 إعادة Deployment

إذا فشل Deployment:
1. تحقق من Build Logs
2. أصلح المشكلة
3. Commit التغييرات إلى GitHub
4. Vercel سيعيد Deployment تلقائياً

## 📞 الدعم

إذا استمرت المشاكل:
1. تحقق من Vercel Build Logs
2. تحقق من Environment Variables
3. تأكد من أن جميع الملفات محدثة في GitHub
4. أعد Deployment

