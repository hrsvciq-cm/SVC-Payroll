# دليل رفع المشروع إلى GitHub

## المستودع المستهدف
**URL**: https://github.com/hrsvciq-cm/SVC-Payroll

## المتطلبات

### 1. تثبيت Git
إذا لم يكن Git مثبتاً:
1. تحميل Git من: https://git-scm.com/download/win
2. تثبيت Git
3. إعادة تشغيل Terminal/PowerShell

### 2. التحقق من تثبيت Git
```bash
git --version
```

## خطوات رفع المشروع

### الخطوة 1: التحقق من وجود Git Repository
```bash
cd "C:\Users\HR\Videos\Payroll System"
git status
```

إذا لم يكن هناك repository، قم بتهيئته:
```bash
git init
```

### الخطوة 2: إضافة Remote Repository
```bash
git remote add origin https://github.com/hrsvciq-cm/SVC-Payroll.git
```

إذا كان remote موجود بالفعل، قم بتحديثه:
```bash
git remote set-url origin https://github.com/hrsvciq-cm/SVC-Payroll.git
```

التحقق من Remote:
```bash
git remote -v
```

يجب أن يظهر:
```
origin  https://github.com/hrsvciq-cm/SVC-Payroll.git (fetch)
origin  https://github.com/hrsvciq-cm/SVC-Payroll.git (push)
```

### الخطوة 3: إضافة جميع الملفات
```bash
git add .
```

### الخطوة 4: عمل Commit
```bash
git commit -m "Initial commit: Payroll System with database optimizations and security improvements"
```

### الخطوة 5: رفع المشروع إلى GitHub
```bash
git branch -M main
git push -u origin main
```

## إذا واجهت مشاكل

### مشكلة: Authentication Required
إذا طُلب منك اسم المستخدم وكلمة المرور:
1. استخدم **Personal Access Token** بدلاً من كلمة المرور
2. إنشاء Token من: https://github.com/settings/tokens
3. الصلاحيات المطلوبة: `repo` (Full control of private repositories)

### مشكلة: Remote Already Exists
```bash
git remote remove origin
git remote add origin https://github.com/hrsvciq-cm/SVC-Payroll.git
```

### مشكلة: Branch Protection
إذا كان المستودع محمياً:
```bash
git push -u origin main --force
```
⚠️ **تحذير**: استخدم `--force` فقط إذا كنت متأكداً

## الملفات التي سيتم رفعها

### ✅ سيتم رفعها:
- جميع ملفات الكود (`app/`, `lib/`, `prisma/`, إلخ)
- ملفات الإعداد (`package.json`, `next.config.js`, إلخ)
- ملفات التوثيق (`.md` files)

### ❌ لن يتم رفعها (موجودة في `.gitignore`):
- `node_modules/`
- `.env.local`
- `.next/`
- `.prisma/`
- ملفات النظام

## التحقق من النجاح

بعد الرفع، افتح:
https://github.com/hrsvciq-cm/SVC-Payroll

يجب أن ترى جميع الملفات.

## أوامر سريعة (نسخ ولصق)

```bash
# الانتقال إلى مجلد المشروع
cd "C:\Users\HR\Videos\Payroll System"

# تهيئة Git (إذا لم يكن موجوداً)
git init

# إضافة Remote
git remote add origin https://github.com/hrsvciq-cm/SVC-Payroll.git

# إضافة جميع الملفات
git add .

# Commit
git commit -m "Initial commit: Payroll System"

# رفع إلى GitHub
git branch -M main
git push -u origin main
```

## ملاحظات مهمة

1. ✅ **تأكد من المسار**: `C:\Users\HR\Videos\Payroll System`
2. ✅ **تأكد من URL**: `https://github.com/hrsvciq-cm/SVC-Payroll.git`
3. ⚠️ **لا ترفع `.env.local`**: يحتوي على معلومات حساسة
4. ✅ **تحقق من `.gitignore`**: يجب أن يحتوي على الملفات الحساسة

## بعد الرفع

1. ✅ إضافة README.md للمستودع
2. ✅ إضافة وصف للمشروع
3. ✅ إضافة Topics/Tags
4. ✅ إعداد GitHub Actions (اختياري)

