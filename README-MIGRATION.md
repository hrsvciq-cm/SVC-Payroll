# دليل تحويل النظام من Local إلى Online

## نظرة عامة

تم تحويل نظام HR & Payroll من نظام محلي (IndexedDB) إلى نظام Online باستخدام:
- **Next.js 14** (App Router)
- **Prisma ORM**
- **Supabase** (PostgreSQL + Auth)
- **shadcn/ui** (للواجهات)

## الميزات المحفوظة

✅ **جميع المنطق الحالي محفوظ بالكامل:**
- حساب الرواتب (نفس المعادلات والمنطق)
- تسجيل الحضور والانصراف
- الإجازات
- الخصومات والمكافآت والسلف
- حالات الموظفين (نشط / موقوف / منتهي خدمة)
- قواعد رؤية الموظفين

## الإعداد الأولي

### 1. إعداد Supabase

1. أنشئ مشروع جديد على [Supabase](https://supabase.com)
2. احصل على:
   - Project URL
   - Anon Key
   - Service Role Key
   - Database URL (من Settings > Database)

### 2. إعداد متغيرات البيئة

انسخ `env.example` إلى `.env.local` واملأ القيم:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=postgresql://user:password@host:port/database?schema=public
```

### 3. إعداد قاعدة البيانات

```bash
# توليد Prisma Client
npm run prisma:generate

# تشغيل Migrations
npm run prisma:migrate

# (اختياري) فتح Prisma Studio لعرض البيانات
npm run prisma:studio
```

### 4. إنشاء حساب Admin أولي

بعد إعداد Supabase Auth، أنشئ مستخدم في Supabase Dashboard ثم أضف سجل في جدول `users`:

```sql
INSERT INTO users (id, email, role, name)
VALUES (
  'uuid-from-supabase-auth',
  'admin@example.com',
  'admin',
  'Admin User'
);
```

## البنية الجديدة

### الملفات الرئيسية

```
├── app/
│   ├── login/          # صفحة تسجيل الدخول
│   ├── dashboard/       # لوحة التحكم
│   ├── employees/       # إدارة الموظفين
│   ├── attendance/     # تسجيل الحضور
│   ├── payroll/        # الرواتب
│   └── api/            # API Routes
├── lib/
│   ├── auth.js         # وظائف المصادقة والصلاحيات
│   ├── prisma.js       # Prisma Client
│   ├── payroll-calculator.js  # منطق حساب الرواتب (مطابق للنظام المحلي)
│   └── supabase/       # Supabase Clients
├── middleware.js       # حماية Routes
└── prisma/
    └── schema.prisma   # Prisma Schema
```

### نظام المصادقة

- **Middleware** يحمي جميع Routes تلقائياً
- **Supabase Auth** لإدارة الجلسات
- **RBAC** (Role-Based Access Control) مع 4 أدوار:
  - `admin`: صلاحيات كاملة
  - `hr`: إدارة الموظفين والرواتب
  - `finance`: عرض التقارير فقط
  - `viewer`: قراءة فقط

### قاعدة البيانات

Prisma Schema مطابق تماماً للبنية المحلية:
- `Employee`: الموظفين
- `Attendance`: الحضور والانصراف
- `Payroll`: الرواتب
- `Deduction`: الخصومات والمكافآت والسلف
- `QuickCode`: الرموز السريعة
- `User`: المستخدمين (للـ RBAC)

## نقل البيانات من النظام المحلي

### خطوات نقل البيانات:

1. **تصدير البيانات من النظام المحلي:**
   - افتح النظام المحلي
   - اضغط "نسخ احتياطي"
   - احفظ ملف JSON

2. **استيراد البيانات:**
   - استخدم Prisma Studio أو أنشئ script استيراد
   - تأكد من الحفاظ على:
     - أرقام الموظفين
     - التواريخ
     - الحسابات

## التشغيل

```bash
# التطوير
npm run dev

# الإنتاج
npm run build
npm start
```

## الأمان

✅ **ميزات الأمان المطبقة:**
- جميع Routes محمية بـ Middleware
- Session management آمن
- Server-side validation للعمليات الحساسة
- RBAC لمنع الوصول غير المصرح به

## ملاحظات مهمة

1. **لا تغيير في المنطق:** جميع حسابات الرواتب والحضور مطابقة تماماً للنظام المحلي
2. **قواعد رؤية الموظفين:** محفوظة كما هي (منتهي الخدمة لا يظهر في القوائم الافتراضية)
3. **النسخ الاحتياطي:** يمكن إضافة نظام نسخ احتياطي دوري لاحقاً

## الدعم

في حالة وجود أي مشاكل، راجع:
- ملفات API Routes في `app/api/`
- منطق حساب الرواتب في `lib/payroll-calculator.js`
- Prisma Schema في `prisma/schema.prisma`

