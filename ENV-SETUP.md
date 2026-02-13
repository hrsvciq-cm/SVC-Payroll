# إعداد متغيرات البيئة - خطوات سريعة

## المشكلة الحالية
النظام يحتاج إلى متغيرات البيئة من Supabase لتشغيله.

## الحل السريع

### 1. أنشئ ملف `.env.local` في المجلد الرئيسي

أنشئ ملف جديد باسم `.env.local` (بدون أي امتداد) في نفس المجلد الذي يحتوي على `package.json`

### 2. انسخ هذا المحتوى إلى الملف:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database URL (from Supabase)
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

### 3. احصل على القيم من Supabase:

#### أ. أنشئ مشروع جديد على Supabase:
- اذهب إلى [https://supabase.com](https://supabase.com)
- سجل دخول أو أنشئ حساب
- اضغط "New Project"
- املأ البيانات وأنشئ المشروع

#### ب. احصل على Project URL و Anon Key:
- من Dashboard: Settings > API
- انسخ:
  - **Project URL** → ضعه في `NEXT_PUBLIC_SUPABASE_URL`
  - **anon public** key → ضعه في `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - **service_role** key → ضعه في `SUPABASE_SERVICE_ROLE_KEY`

#### ج. احصل على Database URL:
- من Dashboard: Settings > Database
- في قسم "Connection string" اختر "URI"
- انسخ الرابط → ضعه في `DATABASE_URL`
- **مهم**: استبدل `[YOUR-PASSWORD]` بكلمة المرور التي اخترتها عند إنشاء المشروع

### 4. مثال على ملف `.env.local` بعد التعبئة:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYzODk2NzI5MCwiZXhwIjoxOTU0NTQzMjkwfQ.example
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjM4OTY3MjkwLCJleHAiOjE5NTQ1NDMyOTB9.example
DATABASE_URL=postgresql://postgres:your_password@db.abcdefghijklmnop.supabase.co:5432/postgres
```

### 5. بعد التعبئة:

1. احفظ الملف `.env.local`
2. أعد تشغيل السيرفر:
   ```bash
   # أوقف السيرفر (Ctrl+C) ثم:
   npm run dev
   ```

## ملاحظات مهمة

- ⚠️ **لا تشارك ملف `.env.local`** - يحتوي على مفاتيح حساسة
- ✅ ملف `.env.local` موجود في `.gitignore` ولن يتم رفعه للـ Git
- ✅ بعد إضافة المتغيرات، ستعمل صفحة Login بشكل طبيعي

## إذا استمرت المشكلة

1. تأكد من أن الملف اسمه `.env.local` (وليس `.env.local.txt`)
2. تأكد من عدم وجود مسافات إضافية حول علامة `=`
3. أعد تشغيل السيرفر بعد التعديل
4. تأكد من أن جميع القيم مملوءة (لا تترك أي قيمة فارغة)

