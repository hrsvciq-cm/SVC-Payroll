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

## 📚 أفضل الممارسات والتغييرات المهمة

### 🎨 التصميم المتجاوب (Responsive Design)

#### المبادئ الأساسية:
1. **Mobile-First Approach**: ابدأ بالتصميم للجوال أولاً
2. **استخدم `clamp()` للخطوط**: `fontSize: 'clamp(12px, 2.5vw, 14px)'`
3. **استخدم `clamp()` للمسافات**: `padding: 'clamp(16px, 3vw, 24px)'`
4. **Grid متجاوب**: `gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))'`
5. **Max-width للشاشات الكبيرة**: `maxWidth: '1920px'` للشاشات الكبيرة

#### Breakpoints المستخدمة:
```javascript
// Mobile: < 640px
// Tablet: 768px - 1024px
// Laptop/Desktop: 1024px - 1536px
// Large Screens/TVs: > 1536px (max-width: 1920px)
```

#### مثال على Component متجاوب:
```javascript
<div style={{
  padding: 'clamp(16px, 3vw, 24px)',
  fontSize: 'clamp(14px, 3vw, 16px)',
  maxWidth: '1920px',
  margin: '0 auto'
}}>
  {/* Content */}
</div>
```

#### الجداول المتجاوبة:
```javascript
// استخدم className="table-responsive" مع overflow-x: auto
<div className="table-responsive" style={{ overflowX: 'auto' }}>
  <table style={{ minWidth: '600px' }}>
    {/* Table content */}
  </table>
</div>
```

### 🔐 الأمان والمصادقة

#### Middleware Pattern:
```javascript
// middleware.js
export async function middleware(request) {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (!user || error) {
    // Redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

#### Session Management:
- ✅ **استخدم `getUser()` بدلاً من `getSession()`** للتحقق من الجلسة
- ✅ **Session cookies فقط** (لا persistent sessions)
- ✅ **معالجة الأخطاء بشكل صحيح** (403, expired tokens)
- ✅ **لا تستدعي `signOut()` عدة مرات** - يسبب أخطاء 403

#### مثال على Authentication Check:
```javascript
// في API Route أو Server Component
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (!user || error) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### 🗄️ قاعدة البيانات (Prisma)

#### Prisma Client Singleton:
```javascript
// lib/prisma.js
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

#### Connection Pooling مع Supabase:
```javascript
// للـ Production/Vercel: استخدم DATABASE_URL مع ?pgbouncer=true&connection_limit=1
// للـ Local Development: استخدم DIRECT_URL (port 5432)

function getDatabaseUrl() {
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = process.env.VERCEL === '1'
  
  if (!isProduction && !isVercel && process.env.DIRECT_URL) {
    return process.env.DIRECT_URL // Local: port 5432
  }
  
  // Production: port 6543 with PgBouncer
  let dbUrl = process.env.DATABASE_URL
  if (dbUrl.includes(':6543') && !dbUrl.includes('pgbouncer=true')) {
    dbUrl = `${dbUrl}${dbUrl.includes('?') ? '&' : '?'}pgbouncer=true&connection_limit=1`
  }
  
  return dbUrl
}
```

#### Best Practices للـ Queries:
```javascript
// ✅ جيد: استخدم include بدلاً من queries متعددة
const employees = await prisma.employee.findMany({
  include: {
    attendance: true,
    payroll: true
  }
})

// ❌ سيء: N+1 problem
const employees = await prisma.employee.findMany()
for (const emp of employees) {
  emp.attendance = await prisma.attendance.findMany({ where: { employeeId: emp.id } })
}
```

### ⚛️ Next.js App Router

#### Layout Structure:
```javascript
// app/layout.js
export const metadata = {
  title: '...',
  description: '...',
}

// ✅ صحيح: viewport في export منفصل
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

// ❌ خطأ: لا تضع viewport في metadata
export const metadata = {
  viewport: '...', // ❌ سيسبب تحذيرات
}
```

#### API Routes Pattern:
```javascript
// app/api/employees/route.js
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // 1. التحقق من المصادقة
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. جلب البيانات
    const employees = await prisma.employee.findMany({
      where: { status: 'active' }
    })
    
    // 3. إرجاع النتيجة
    return NextResponse.json({ data: employees })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

#### Client Components:
```javascript
// استخدم 'use client' فقط عند الحاجة
'use client'

import { useState, useEffect } from 'react'

export default function MyComponent() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    // Fetch data
  }, [])
  
  return <div>{/* UI */}</div>
}
```

### 🎯 إضافة ميزة جديدة - دليل سريع

#### 1. إنشاء صفحة جديدة:
```bash
# إنشاء صفحة جديدة
app/new-feature/page.js
```

```javascript
// app/new-feature/page.js
'use client'

import Layout from '@/app/components/Layout'
import { useState, useEffect } from 'react'

export default function NewFeaturePage() {
  const [data, setData] = useState(null)
  
  useEffect(() => {
    async function loadData() {
      const response = await fetch('/api/new-feature')
      const result = await response.json()
      setData(result.data)
    }
    loadData()
  }, [])
  
  return (
    <Layout>
      <div style={{
        maxWidth: '1920px',
        margin: '0 auto',
        padding: 'clamp(16px, 3vw, 24px)'
      }}>
        {/* Content */}
      </div>
    </Layout>
  )
}
```

#### 2. إنشاء API Route:
```bash
# إنشاء API route
app/api/new-feature/route.js
```

```javascript
// app/api/new-feature/route.js
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    // 1. التحقق من المصادقة
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. جلب البيانات
    const data = await prisma.model.findMany()
    
    // 3. إرجاع النتيجة
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    // 1. التحقق من المصادقة
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (!user || error) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 2. قراءة البيانات
    const body = await request.json()
    
    // 3. التحقق من البيانات
    if (!body.field) {
      return NextResponse.json({ error: 'Field is required' }, { status: 400 })
    }
    
    // 4. حفظ البيانات
    const result = await prisma.model.create({
      data: body
    })
    
    // 5. إرجاع النتيجة
    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
```

#### 3. إضافة Model جديد في Prisma:
```prisma
// prisma/schema.prisma
model NewModel {
  id        String   @id @default(cuid())
  field     String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([field])
}
```

```bash
# تطبيق التغييرات
npx prisma migrate dev --name add_new_model
# أو
npx prisma db push
```

#### 4. إضافة Navigation Item:
```javascript
// app/components/Layout.js
const navItems = useMemo(() => [
  { path: '/dashboard', label: 'لوحة التحكم', icon: '📊' },
  { path: '/new-feature', label: 'الميزة الجديدة', icon: '✨' }, // إضافة هنا
  // ...
], [])
```

### 📝 التغييرات المهمة التي تمت

#### 1. إصلاح مشكلة Prepared Statements (42P05):
- **المشكلة**: `prepared statement "s0" already exists` مع PgBouncer
- **الحل**: إضافة `?pgbouncer=true&connection_limit=1` لـ DATABASE_URL في Production
- **الملف**: `lib/prisma.js`

#### 2. إصلاح مشكلة تسجيل الدخول (403 Error):
- **المشكلة**: خطأ 403 عند تسجيل الدخول
- **الحل**: إزالة استدعاءات `signOut()` المكررة ومعالجة الأخطاء بشكل صحيح
- **الملفات**: `middleware.js`, `app/login/page.js`

#### 3. تبسيط Middleware:
- **قبل**: منطق معقد مع session tracker
- **بعد**: منطق مبسط يعتمد على `getUser()` فقط
- **النتيجة**: كود أبسط وأكثر موثوقية

#### 4. التصميم المتجاوب:
- **قبل**: تصميم ثابت
- **بعد**: تصميم متجاوب بالكامل مع hamburger menu للجوال
- **الملفات**: `app/components/Layout.js`, `app/dashboard/page.js`, `app/employees/page.js`

#### 5. إصلاح Viewport Metadata:
- **المشكلة**: تحذير `Unsupported metadata viewport`
- **الحل**: نقل `viewport` إلى export منفصل
- **الملف**: `app/layout.js`

### 🔧 نصائح للتطوير

1. **استخدم TypeScript** (اختياري): لإضافة type safety
2. **استخدم ESLint**: للتحقق من جودة الكود
3. **استخدم Prettier**: لتنسيق الكود
4. **اكتب Tests**: للوظائف المهمة
5. **استخدم Git Hooks**: للتحقق قبل الـ commit

### 📖 مراجع مفيدة

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)

---

⭐ إذا أعجبك المشروع، لا تنسى إعطاء Star!
