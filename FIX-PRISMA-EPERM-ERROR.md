# إصلاح خطأ EPERM في Prisma

## المشكلة
```
EPERM: operation not permitted, rename '...query_engine-windows.dll.node.tmp...' -> '...query_engine-windows.dll.node'
```

## السبب
الملف `query_engine-windows.dll.node` قيد الاستخدام من قبل عملية أخرى (مثل development server).

## الحل

### الحل 1: إيقاف Development Server

1. **اذهب إلى Terminal الذي يعمل فيه `npm run dev`**
2. **اضغط `Ctrl+C` لإيقاف السيرفر**
3. **انتظر حتى يتوقف تماماً**
4. **شغّل الأمر:**
   ```bash
   npm run prisma:generate
   ```

### الحل 2: إغلاق جميع Terminals وإعادة المحاولة

1. **أغلق جميع Terminals**
2. **افتح Terminal جديد**
3. **شغّل الأمر:**
   ```bash
   npm run prisma:generate
   ```

### الحل 3: حذف مجلد .prisma وإعادة التوليد

إذا استمرت المشكلة:

1. **أوقف development server** (إذا كان يعمل)

2. **احذف مجلد `.prisma`:**
   ```bash
   rmdir /s /q "node_modules\.prisma"
   ```

3. **أعد توليد Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

### الحل 4: استخدام PowerShell كـ Administrator

إذا استمرت المشكلة:

1. **افتح PowerShell كـ Administrator:**
   - اضغط `Win + X`
   - اختر "Windows PowerShell (Admin)"

2. **انتقل إلى مجلد المشروع:**
   ```powershell
   cd "C:\Users\HR\Videos\Payroll System"
   ```

3. **شغّل الأمر:**
   ```powershell
   npm run prisma:generate
   ```

## بعد الإصلاح

بعد نجاح `prisma generate`:

1. **أعد تشغيل development server:**
   ```bash
   npm run dev
   ```

2. **تحقق من أن كل شيء يعمل بشكل صحيح**

## ملاحظات مهمة

- ✅ **أوقف development server** قبل توليد Prisma Client
- ✅ **انتظر** حتى يتوقف السيرفر تماماً
- ✅ **أغلق Terminals** إذا استمرت المشكلة
- ✅ **استخدم Administrator** إذا لزم الأمر

## منع المشكلة في المستقبل

- ✅ **أوقف development server** قبل تشغيل `prisma generate`
- ✅ **استخدم `npm run prisma:generate`** بدلاً من `npx prisma generate` مباشرة

