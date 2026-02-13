# رفع المشروع إلى GitHub - دليل سريع

## ⚡ الطريقة السريعة (استخدام Script)

### الخطوة 1: تشغيل Script
افتح PowerShell في مجلد المشروع وشغّل:
```powershell
.\UPLOAD-TO-GITHUB.ps1
```

## 📝 الطريقة اليدوية

### الخطوة 1: تثبيت Git (إذا لم يكن مثبتاً)
تحميل من: https://git-scm.com/download/win

### الخطوة 2: فتح PowerShell
```powershell
cd "C:\Users\HR\Videos\Payroll System"
```

### الخطوة 3: تنفيذ الأوامر
```powershell
# 1. تهيئة Git
git init

# 2. إضافة Remote
git remote add origin https://github.com/hrsvciq-cm/SVC-Payroll.git

# 3. إضافة جميع الملفات
git add .

# 4. Commit
git commit -m "Initial commit: Payroll System"

# 5. تعيين Branch الرئيسي
git branch -M main

# 6. رفع المشروع
git push -u origin main
```

## 🔐 Authentication

عند طلب اسم المستخدم وكلمة المرور:

### اسم المستخدم:
```
hrsvciq-cm
```

### كلمة المرور:
**استخدم Personal Access Token** (ليس كلمة المرور العادية)

#### إنشاء Token:
1. اذهب إلى: https://github.com/settings/tokens
2. انقر "Generate new token (classic)"
3. اختر الصلاحيات: ✅ `repo` (Full control of private repositories)
4. انسخ الـ Token
5. استخدمه ككلمة مرور

## ✅ التحقق من النجاح

بعد الرفع، افتح:
https://github.com/hrsvciq-cm/SVC-Payroll

يجب أن ترى جميع الملفات.

## 🔧 حل المشاكل

### مشكلة: "git is not recognized"
**الحل**: تثبيت Git من https://git-scm.com/download/win

### مشكلة: "Authentication failed"
**الحل**: استخدام Personal Access Token

### مشكلة: "Permission denied"
**الحل**: 
1. تأكد من الصلاحيات على المستودع
2. استخدم Personal Access Token

### مشكلة: "Remote already exists"
```powershell
git remote remove origin
git remote add origin https://github.com/hrsvciq-cm/SVC-Payroll.git
```

## 📋 الملفات التي سيتم رفعها

✅ **سيتم رفعها**:
- جميع ملفات الكود
- ملفات الإعداد
- ملفات التوثيق

❌ **لن يتم رفعها** (موجودة في `.gitignore`):
- `node_modules/`
- `.env.local`
- `.env`
- `.next/`

