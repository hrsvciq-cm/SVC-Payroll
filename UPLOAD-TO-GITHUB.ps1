# Script لرفع المشروع إلى GitHub
# Run this script in PowerShell: .\UPLOAD-TO-GITHUB.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "رفع المشروع إلى GitHub" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# التحقق من تثبيت Git
Write-Host "التحقق من تثبيت Git..." -ForegroundColor Yellow
$gitCheck = Get-Command git -ErrorAction SilentlyContinue
if ($gitCheck) {
    $gitVersion = git --version
    Write-Host "✓ Git مثبت: $gitVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Git غير مثبت!" -ForegroundColor Red
    Write-Host ""
    Write-Host "يرجى تثبيت Git من:" -ForegroundColor Yellow
    Write-Host "https://git-scm.com/download/win" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "بعد التثبيت، أعد تشغيل هذا الـ script" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# الانتقال إلى مجلد المشروع
$projectPath = "C:\Users\HR\Videos\Payroll System"
Write-Host "الانتقال إلى مجلد المشروع: $projectPath" -ForegroundColor Yellow
Set-Location $projectPath

# التحقق من وجود .git
if (Test-Path .git) {
    Write-Host "✓ Git repository موجود" -ForegroundColor Green
} else {
    Write-Host "تهيئة Git repository..." -ForegroundColor Yellow
    git init
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ تم تهيئة Git repository" -ForegroundColor Green
    } else {
        Write-Host "✗ فشل تهيئة Git repository" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# إضافة Remote
Write-Host "إضافة Remote Repository..." -ForegroundColor Yellow
$remoteUrl = "https://github.com/hrsvciq-cm/SVC-Payroll.git"

# التحقق من وجود remote
$remoteCheck = git remote get-url origin 2>&1
if ($LASTEXITCODE -eq 0 -and $remoteCheck -notmatch "error") {
    Write-Host "✓ Remote موجود: $remoteCheck" -ForegroundColor Green
    if ($remoteCheck -ne $remoteUrl) {
        Write-Host "تحديث Remote URL..." -ForegroundColor Yellow
        git remote set-url origin $remoteUrl
        Write-Host "✓ تم تحديث Remote URL" -ForegroundColor Green
    }
} else {
    Write-Host "إضافة Remote جديد..." -ForegroundColor Yellow
    git remote add origin $remoteUrl
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ تم إضافة Remote" -ForegroundColor Green
    } else {
        Write-Host "✗ فشل إضافة Remote" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# إضافة جميع الملفات
Write-Host "إضافة جميع الملفات..." -ForegroundColor Yellow
git add .
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ تم إضافة جميع الملفات" -ForegroundColor Green
} else {
    Write-Host "✗ فشل إضافة الملفات" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Commit
Write-Host "عمل Commit..." -ForegroundColor Yellow
$commitMessage = "Initial commit: Payroll System with database optimizations and security improvements"
git commit -m $commitMessage
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ تم عمل Commit" -ForegroundColor Green
} else {
    Write-Host "⚠ قد يكون هناك ملفات غير متغيرة" -ForegroundColor Yellow
}

Write-Host ""

# تعيين Branch الرئيسي
Write-Host "تعيين Branch الرئيسي..." -ForegroundColor Yellow
git branch -M main
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ تم تعيين Branch الرئيسي" -ForegroundColor Green
}

Write-Host ""

# رفع المشروع
Write-Host "رفع المشروع إلى GitHub..." -ForegroundColor Yellow
Write-Host "⚠ قد يُطلب منك اسم المستخدم وكلمة المرور" -ForegroundColor Yellow
Write-Host "استخدم Personal Access Token بدلاً من كلمة المرور" -ForegroundColor Yellow
Write-Host ""

git push -u origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "✓ تم رفع المشروع بنجاح!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "المستودع: https://github.com/hrsvciq-cm/SVC-Payroll" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "✗ فشل رفع المشروع" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "الأسباب المحتملة:" -ForegroundColor Yellow
    Write-Host "1. مشكلة في Authentication" -ForegroundColor Yellow
    Write-Host "2. لا توجد صلاحيات على المستودع" -ForegroundColor Yellow
    Write-Host "3. مشكلة في الاتصال" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "الحلول:" -ForegroundColor Yellow
    Write-Host "1. استخدم Personal Access Token من: https://github.com/settings/tokens" -ForegroundColor Cyan
    Write-Host "2. تأكد من الصلاحيات على المستودع" -ForegroundColor Cyan
    Write-Host "3. حاول مرة أخرى" -ForegroundColor Cyan
}
