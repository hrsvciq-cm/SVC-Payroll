# رفع المشروع إلى GitHub - دليل سريع

## 📍 المستودع المستهدف
**URL**: https://github.com/hrsvciq-cm/SVC-Payroll

## ⚠️ متطلبات أولية

### 1. تثبيت Git
إذا لم يكن Git مثبتاً:
- تحميل من: https://git-scm.com/download/win
- تثبيت وتشغيل
- إعادة تشغيل PowerShell/Terminal

### 2. التحقق من تثبيت Git
```powershell
git --version
```

## 🚀 خطوات الرفع (نسخ ولصق)

افتح PowerShell في مجلد المشروع وانسخ الأوامر التالية:

```powershell
# 1. الانتقال إلى مجلد المشروع
cd "C:\Users\HR\Videos\Payroll System"

# 2. تهيئة Git (إذا لم يكن موجوداً)
git init

# 3. إضافة Remote Repository
git remote add origin https://github.com/hrsvciq-cm/SVC-Payroll.git

# إذا كان Remote موجود بالفعل، استخدم:
# git remote set-url origin https://github.com/hrsvciq-cm/SVC-Payroll.git

# 4. التحقق من Remote
git remote -v

# 5. إضافة جميع الملفات
git add .

# 6. عمل Commit
git commit -m "Initial commit: Payroll System with optimizations"

# 7. تعيين Branch الرئيسي
git branch -M main

# 8. رفع المشروع إلى GitHub
git push -u origin main
```

## 🔐 إذا طُلب Authentication

### الطريقة 1: استخدام Personal Access Token
1. اذهب إلى: https://github.com/settings/tokens
2. انقر "Generate new token (classic)"
3. اختر الصلاحيات: `repo` (Full control)
4. انسخ الـ Token
5. عند طلب كلمة المرور، استخدم الـ Token

### الطريقة 2: استخدام GitHub CLI
```powershell
gh auth login
```

## ✅ التحقق من النجاح

بعد الرفع، افتح:
https://github.com/hrsvciq-cm/SVC-Payroll

يجب أن ترى جميع الملفات.

## 📋 الملفات التي سيتم رفعها

### ✅ سيتم رفعها:
- جميع ملفات الكود (`app/`, `lib/`, `prisma/`)
- ملفات الإعداد (`package.json`, `next.config.js`)
- ملفات التوثيق (`.md` files)
- `.gitignore`

### ❌ لن يتم رفعها (موجودة في `.gitignore`):
- `node_modules/` ❌
- `.env.local` ❌
- `.env` ❌
- `.next/` ❌
- ملفات النظام ❌

## 🔧 حل المشاكل الشائعة

### مشكلة: "git is not recognized"
**الحل**: تثبيت Git من https://git-scm.com/download/win

### مشكلة: "Remote already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/hrsvciq-cm/SVC-Payroll.git
```

### مشكلة: "Authentication failed"
**الحل**: استخدام Personal Access Token بدلاً من كلمة المرور

### مشكلة: "Permission denied"
**الحل**: 
1. تأكد من أن لديك صلاحيات على المستودع
2. استخدم Personal Access Token

## 📝 ملاحظات مهمة

1. ✅ **المسار الصحيح**: `C:\Users\HR\Videos\Payroll System`
2. ✅ **URL الصحيح**: `https://github.com/hrsvciq-cm/SVC-Payroll.git`
3. ⚠️ **لا ترفع `.env.local`**: يحتوي على معلومات حساسة
4. ✅ **`.gitignore` محدث**: يمنع رفع الملفات الحساسة

## 🎯 بعد الرفع

1. ✅ إضافة README.md للمستودع
2. ✅ إضافة وصف للمشروع
3. ✅ إضافة Topics (payroll, nextjs, prisma, supabase)
4. ✅ إعداد GitHub Actions (اختياري)

