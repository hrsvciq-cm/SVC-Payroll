# دليل Deployment على Vercel

## المشاكل المحتملة والحلول

### 1. Prisma Client Generation
**المشكلة**: Prisma Client يجب أن يتم توليده قبل build.

**الحل المطبق**:
- ✅ إضافة `postinstall` script في `package.json`
- ✅ تحديث `build` script ليشمل `prisma generate`
- ✅ إضافة `vercel.json` مع build command

### 2. Environment Variables
**المشكلة**: Vercel يحتاج إلى environment variables.

**الحل**:
1. اذهب إلى Vercel Dashboard
2. Project Settings > Environment Variables
3. أضف المتغيرات التالية:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
```

### 3. Prisma Schema Configuration
**المشكلة**: Prisma schema يستخدم `DIRECT_URL` فقط.

**الحل المطبق**:
- ✅ تحديث schema لاستخدام `DATABASE_URL` (Vercel يستخدمه)
- ✅ `DIRECT_URL` كـ fallback للتطوير المحلي

## خطوات Deployment على Vercel

### الخطوة 1: إعداد Environment Variables في Vercel

1. اذهب إلى: https://vercel.com/dashboard
2. اختر المشروع
3. Settings > Environment Variables
4. أضف المتغيرات التالية:

#### Production Environment:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_url
```

#### Preview Environment (اختياري):
نفس المتغيرات

#### Development Environment (اختياري):
نفس المتغيرات

### الخطوة 2: ربط GitHub Repository

1. في Vercel Dashboard
2. Add New Project
3. Import Git Repository
4. اختر: `hrsvciq-cm/SVC-Payroll`
5. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: `./` (افتراضي)
   - Build Command: `npm run build` (سيستخدم `vercel.json`)
   - Output Directory: `.next` (افتراضي)

### الخطوة 3: Deployment

1. اضغط "Deploy"
2. Vercel سيقوم بـ:
   - Clone المشروع
   - Install dependencies
   - Run `prisma generate` (من postinstall)
   - Run `next build`
   - Deploy

## الملفات المهمة للـ Deployment

### ✅ `package.json`
- `postinstall`: يولد Prisma Client تلقائياً
- `build`: يتضمن `prisma generate`

### ✅ `vercel.json`
- يحدد build command
- يحدد framework

### ✅ `prisma/schema.prisma`
- يستخدم `DATABASE_URL` (متوافق مع Vercel)
- `DIRECT_URL` كـ fallback

### ✅ `next.config.js`
- محسّن لـ Prisma
- webpack configuration

## التحقق من النجاح

بعد Deployment:
1. ✅ يجب أن يكتمل Build بنجاح
2. ✅ يجب أن يعمل الموقع على Vercel URL
3. ✅ يجب أن يعمل تسجيل الدخول
4. ✅ يجب أن تعمل جميع الصفحات

## حل المشاكل الشائعة

### مشكلة: "Prisma Client not generated"
**الحل**: تأكد من وجود `postinstall` script في `package.json`

### مشكلة: "DATABASE_URL not found"
**الحل**: أضف `DATABASE_URL` في Vercel Environment Variables

### مشكلة: "Build timeout"
**الحل**: 
- تأكد من أن `prisma generate` يعمل بسرعة
- تحقق من حجم `node_modules`

### مشكلة: "Module not found: @prisma/client"
**الحل**: 
- تأكد من وجود `@prisma/client` في `dependencies`
- تأكد من أن `postinstall` script يعمل

## ملاحظات مهمة

1. ✅ **Environment Variables**: يجب إضافتها في Vercel Dashboard
2. ✅ **DATABASE_URL**: Vercel يستخدمه تلقائياً
3. ✅ **Prisma Generate**: يتم تلقائياً من `postinstall`
4. ✅ **Build Command**: محسّن في `vercel.json`

## بعد Deployment

1. ✅ اختبر الموقع على Vercel URL
2. ✅ اختبر تسجيل الدخول
3. ✅ اختبر جميع الصفحات
4. ✅ راقب Logs في Vercel Dashboard

