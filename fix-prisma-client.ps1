# Script to fix Prisma Client generation issue

Write-Host "إيقاف عمليات Node.js..." -ForegroundColor Yellow

# إيقاف جميع عمليات Node.js
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force -ErrorAction SilentlyContinue

Start-Sleep -Seconds 2

Write-Host "محاولة حذف مجلد .prisma..." -ForegroundColor Yellow

# محاولة حذف الملفات المحمية
$prismaPath = "node_modules\.prisma"
if (Test-Path $prismaPath) {
    try {
        # محاولة إزالة القراءة فقط
        Get-ChildItem -Path $prismaPath -Recurse | ForEach-Object {
            $_.Attributes = $_.Attributes -band (-bnot [System.IO.FileAttributes]::ReadOnly)
        }
        Remove-Item -Path $prismaPath -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "تم حذف مجلد .prisma" -ForegroundColor Green
    } catch {
        Write-Host "تعذر حذف بعض الملفات، سيتم المحاولة مرة أخرى..." -ForegroundColor Yellow
    }
}

Start-Sleep -Seconds 1

Write-Host "توليد Prisma Client..." -ForegroundColor Yellow
npx prisma generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ تم توليد Prisma Client بنجاح!" -ForegroundColor Green
    Write-Host "يمكنك الآن إعادة تشغيل خادم التطوير" -ForegroundColor Green
} else {
    Write-Host "`n❌ فشل توليد Prisma Client" -ForegroundColor Red
    Write-Host "يرجى إعادة تشغيل الكمبيوتر ثم المحاولة مرة أخرى" -ForegroundColor Yellow
}

