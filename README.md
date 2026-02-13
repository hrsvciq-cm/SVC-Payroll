# نظام إدارة الدوام والرواتب (SVC Payroll System)

نظام متكامل لإدارة دوام الموظفين وحساب الرواتب مبني على Next.js 14 مع Supabase و Prisma.

## 🚀 المميزات

### 1. إدارة الموظفين
- إضافة وتعديل وحذف الموظفين
- إدارة حالات الموظفين (نشط، موقوف، منتهي الخدمة)
- تصفية وبحث متقدم
- دعم التواريخ (تاريخ التعيين، الإيقاف، الإنهاء)

### 2. نظام تسجيل الدوام
- تسجيل فردي وجماعي
- تسجيل برموز سريعة
- تتبع الساعات الإضافية والتأخير
- إدارة الإجازات والعطلات

### 3. نظام الرواتب
- حساب تلقائي للرواتب الشهرية
- حساب الساعات الإضافية والتأخير
- إدارة الخصومات والمكافآت والسلف
- قسائم رواتب قابلة للطباعة

### 4. الأمان
- نظام مصادقة آمن باستخدام Supabase
- إدارة أدوار المستخدمين (Admin, HR, Finance, Viewer)
- جلسات آمنة (Session cookies فقط)
- حماية من CSRF و XSS

### 5. الأداء
- قاعدة بيانات محسّنة مع Indexes
- Batch queries لتحسين الأداء
- تحسينات في الـ queries (N+1 problem solved)
- استجابة سريعة

## 🛠️ التقنيات المستخدمة

- **Next.js 14**: Framework React مع App Router
- **React 18**: مكتبة UI
- **Supabase**: Authentication & Backend
- **Prisma**: ORM لقاعدة البيانات
- **PostgreSQL**: قاعدة البيانات
- **Tailwind CSS**: التصميم (اختياري)

## 📋 المتطلبات

- Node.js 18+ 
- npm أو yarn
- حساب Supabase
- قاعدة بيانات PostgreSQL

## 🔧 التثبيت

### 1. استنساخ المشروع
```bash
git clone https://github.com/hrsvciq-cm/SVC-Payroll.git
cd SVC-Payroll
```

### 2. تثبيت Dependencies
```bash
npm install
```

### 3. إعداد متغيرات البيئة
أنشئ ملف `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Database
DATABASE_URL=your_database_url
DIRECT_URL=your_direct_database_url
```

### 4. إعداد قاعدة البيانات
```bash
# توليد Prisma Client
npx prisma generate

# تطبيق Migrations
npx prisma migrate dev

# أو استخدام db push
npx prisma db push
```

### 5. تشغيل المشروع
```bash
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000)

## 📁 هيكل المشروع

```
SVC-Payroll/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── components/        # React Components
│   ├── dashboard/         # Dashboard Page
│   ├── employees/         # Employees Page
│   ├── attendance/        # Attendance Page
│   └── payroll/          # Payroll Page
├── lib/                   # Utility Functions
│   ├── auth.js           # Authentication
│   ├── prisma.js         # Prisma Client
│   ├── supabase/         # Supabase Clients
│   └── payroll-calculator.js
├── prisma/               # Prisma Schema
│   └── schema.prisma
├── middleware.js         # Next.js Middleware
└── package.json
```

## 🔐 الأمان

- ✅ Session cookies فقط (لا persistent sessions)
- ✅ HttpOnly cookies
- ✅ SameSite protection
- ✅ Secure cookies في الإنتاج
- ✅ RBAC (Role-Based Access Control)
- ✅ Input validation
- ✅ Error handling آمن

## 📊 قاعدة البيانات

### الجداول الرئيسية:
- **Users**: المستخدمون والأدوار
- **Employees**: الموظفون
- **Attendance**: سجلات الحضور
- **Payroll**: سجلات الرواتب
- **Deductions**: الخصومات والمكافآت والسلف
- **QuickCodes**: الرموز السريعة

### Indexes محسّنة:
- Composite indexes للـ queries الشائعة
- Indexes على الحقول المستخدمة في البحث
- تحسينات الأداء بنسبة 60-90%

## 🚀 النشر

### Vercel (موصى به)
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t svc-payroll .
docker run -p 3000:3000 svc-payroll
```

## 📝 التطوير

### Scripts المتاحة:
```bash
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run lint         # ESLint
npm run prisma:generate  # Generate Prisma Client
npm run prisma:studio    # Prisma Studio
```

## 🤝 المساهمة

1. Fork المشروع
2. أنشئ branch للميزة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

## 📄 الترخيص

هذا المشروع مرخص للاستخدام الخاص والتجاري.

## 👥 المؤلفون

- **hrsvciq-cm** - [GitHub](https://github.com/hrsvciq-cm)

## 🙏 شكر وتقدير

- Next.js Team
- Supabase Team
- Prisma Team

## 📞 الدعم

للدعم والاستفسارات، افتح Issue في GitHub.

---

⭐ إذا أعجبك المشروع، لا تنسى إعطاء Star!
