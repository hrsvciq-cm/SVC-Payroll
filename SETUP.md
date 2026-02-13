# دليل الإعداد السريع

## الخطوات الأساسية

### 1. تثبيت الحزم

```bash
npm install
```

### 2. إعداد Supabase

1. أنشئ مشروع جديد على [Supabase](https://supabase.com)
2. من Settings > API احصل على:
   - Project URL
   - Anon Key
   - Service Role Key
3. من Settings > Database احصل على Connection String

### 3. إعداد متغيرات البيئة

أنشئ ملف `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres
```

### 4. إعداد قاعدة البيانات

```bash
# توليد Prisma Client
npx prisma generate

# تشغيل Migrations لإنشاء الجداول
npx prisma migrate dev --name init
```

### 5. إنشاء حساب Admin

1. من Supabase Dashboard > Authentication > Users
2. أنشئ مستخدم جديد (Email + Password)
3. احفظ User ID (UUID)

4. افتح Prisma Studio:
```bash
npx prisma studio
```

5. أضف سجل في جدول `users`:
   - `id`: UUID من Supabase Auth
   - `email`: نفس البريد المستخدم في Supabase
   - `role`: `admin`
   - `name`: اسم المستخدم

### 6. تشغيل النظام

```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## ملاحظات مهمة

- تأكد من أن Supabase Auth مفعل
- تأكد من إعداد RLS (Row Level Security) إذا لزم الأمر
- النظام مغلق بالكامل - لا يمكن الوصول لأي صفحة بدون تسجيل دخول

## نقل البيانات من النظام المحلي

1. من النظام المحلي: اضغط "نسخ احتياطي" واحفظ ملف JSON
2. استخدم Prisma Studio أو أنشئ script لاستيراد البيانات
3. تأكد من الحفاظ على:
   - أرقام الموظفين
   - التواريخ
   - الحسابات

