# حل مشكلة EPERM في Prisma

## المشكلة
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node'
```

هذا الخطأ يحدث عندما يكون ملف Prisma قيد الاستخدام من قبل عملية أخرى.

## الحلول (جربها بالترتيب)

### الحل 1: إغلاق جميع عمليات Node.js

1. **إغلاق خادم التطوير** (إذا كان يعمل):
   - اضغط `Ctrl+C` في Terminal الذي يشغل `npm run dev`
   - أو أغلق نافذة Terminal

2. **إغلاق جميع عمليات Node.js**:
   - اضغط `Ctrl+Shift+Esc` لفتح Task Manager
   - ابحث عن `node.exe` في قائمة العمليات
   - انقر بزر الماوس الأيمن واختر "End Task" لكل عملية node

3. **إعادة المحاولة**:
   ```bash
   npx prisma generate
   ```

### الحل 2: إغلاق محرر النصوص وإعادة فتحه

1. أغلق Cursor/VS Code بالكامل
2. افتح Task Manager وتحقق من عدم وجود عمليات `Code.exe` أو `Cursor.exe`
3. أعد فتح المحرر
4. جرب الأمر مرة أخرى:
   ```bash
   npx prisma generate
   ```

### الحل 3: إعادة تشغيل الكمبيوتر

إذا لم تعمل الحلول السابقة:
1. أعد تشغيل الكمبيوتر
2. بعد إعادة التشغيل، جرب:
   ```bash
   npx prisma generate
   ```

### الحل 4: حذف مجلد .prisma يدوياً

1. أغلق جميع البرامج (Cursor, Terminal, Node.js)
2. افتح File Explorer
3. اذهب إلى: `C:\Users\HR\Videos\Payroll System\node_modules\.prisma`
4. احذف المجلد بالكامل (إذا كان محمي، اضغط Delete ثم Enter)
5. افتح Terminal جديد وجرب:
   ```bash
   npx prisma generate
   ```

### الحل 5: تشغيل كمسؤول

1. أغلق Terminal الحالي
2. افتح PowerShell كمسؤول:
   - اضغط `Win + X`
   - اختر "Windows PowerShell (Admin)" أو "Terminal (Admin)"
3. اذهب إلى مجلد المشروع:
   ```powershell
   cd "C:\Users\HR\Videos\Payroll System"
   ```
4. جرب الأمر:
   ```bash
   npx prisma generate
   ```

## بعد حل المشكلة

بعد نجاح `npx prisma generate`، يمكنك تشغيل:

```bash
npx prisma db push
```

أو إذا كنت تريد استخدام migrations:

```bash
npx prisma migrate dev --name add_absent_type
```

## ملاحظة مهمة

**قاعدة البيانات تم تحديثها بنجاح!** 

الرسالة التالية تظهر أن التحديث نجح:
```
Your database is now in sync with your Prisma schema. Done in 6.11s
```

الخطأ في `prisma generate` لا يؤثر على قاعدة البيانات - فقط على توليد Prisma Client. يمكنك الاستمرار في استخدام النظام، ولكن قد تحتاج إلى إعادة تشغيل خادم التطوير بعد حل المشكلة.

