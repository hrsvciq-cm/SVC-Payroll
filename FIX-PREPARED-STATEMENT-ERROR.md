# إصلاح خطأ "prepared statement does not exist"

## المشكلة
```
Error: prepared statement "s7" does not exist
```

هذا الخطأ يحدث عند استخدام Prisma مع PgBouncer (connection pooling) في Supabase.

## السبب
PgBouncer في transaction mode لا يدعم prepared statements. Prisma يحاول استخدام prepared statements بشكل افتراضي، مما يسبب هذا الخطأ.

## الحل

### الحل 1: إضافة `?prepare=false` إلى DATABASE_URL (مطبّق)

تم تحديث `lib/prisma.js` لإضافة `?prepare=false` تلقائياً عند استخدام connection pooling.

**في ملف `.env.local`:**

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc&prepare=false"
```

**أو (مع ترميز):**

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m%403x%3Fu3x%40AR3ei%25@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbc&prepare=false"
```

### الحل 2: استخدام `?pgbouncer=true` بدلاً من `?pgbc`

```env
DATABASE_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&prepare=false"
```

### الحل 3: استخدام DIRECT_URL للاستعلامات (بدون connection pooling)

إذا استمرت المشكلة، استخدم `DIRECT_URL` للاستعلامات التي تحتاج prepared statements:

```env
DIRECT_URL="postgresql://postgres.yglxbfjakoezxbrgopur:m@3x?u3x@AR3ei%@aws-1-eu-central-1.pooler.supabase.com:5432/postgres"
```

## بعد الإصلاح

1. **أوقف development server** (`Ctrl+C`)
2. **أعد تشغيله:**
   ```bash
   npm run dev
   ```
3. **تحقق من عدم وجود أخطاء `prepared statement does not exist`**

## ملاحظات مهمة

### 1. Connection Pooling vs Direct Connection
- **Connection Pooling (`?pgbc` أو `?pgbouncer=true`)**: أفضل للأداء في production، لكن لا يدعم prepared statements
- **Direct Connection (port 5432)**: يدعم prepared statements، لكن أقل كفاءة في production

### 2. Prisma Client Configuration
تم تحديث `lib/prisma.js` لإضافة `?prepare=false` تلقائياً عند اكتشاف connection pooling.

### 3. الأداء
تعطيل prepared statements قد يقلل الأداء قليلاً، لكنه ضروري للعمل مع PgBouncer.

## استكشاف الأخطاء

### خطأ: `prepared statement "s7" does not exist`
- **السبب**: PgBouncer لا يدعم prepared statements
- **الحل**: أضف `?prepare=false` إلى `DATABASE_URL` أو استخدم `DIRECT_URL`

### خطأ: `Connection pool timeout`
- **السبب**: عدد كبير من الاتصالات المتزامنة
- **الحل**: استخدم connection pooling (`?pgbc` أو `?pgbouncer=true`)

### خطأ: `Too many connections`
- **السبب**: تجاوز حد الاتصالات في Supabase
- **الحل**: استخدم connection pooling لتقليل عدد الاتصالات

## المراجع

- [Prisma Connection Pooling](https://www.prisma.io/docs/guides/performance-and-optimization/connection-management)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PgBouncer Transaction Mode](https://www.pgbouncer.org/features.html#transaction-pooling)

