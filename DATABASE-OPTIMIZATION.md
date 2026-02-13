# تحسين قاعدة البيانات والأداء

## التحسينات المطبقة

### 1. إضافة Indexes جديدة

#### جدول Attendance:
- ✅ `@@index([employeeId, date])` - Composite index للـ queries الشائعة
- ✅ `@@index([status])` - Index للتصفية حسب الحالة

#### جدول Deductions:
- ✅ `@@index([employeeId, month])` - Composite index للـ queries الشائعة
- ✅ `@@index([type])` - Index للتصفية حسب النوع

#### جدول Employees:
- ✅ `@@index([status, terminationDate])` - Composite index للموظفين المنتهية خدماتهم
- ✅ `@@index([hireDate])` - Index للتصفية حسب تاريخ التعيين

### 2. تحسين Queries

#### payroll/calculate (N+1 Query Problem):
**قبل التحسين:**
- جلب جميع الموظفين
- لكل موظف: query منفصل للحضور
- لكل موظف: query منفصل للخصومات
- **النتيجة**: N+1 queries (بطيء جداً)

**بعد التحسين:**
- جلب الموظفين المطلوبين فقط
- Batch fetch لجميع سجلات الحضور في query واحد
- Batch fetch لجميع الخصومات في query واحد
- Batch upsert لجميع سجلات الرواتب باستخدام transaction
- **النتيجة**: 3-4 queries فقط (سريع جداً)

#### dashboard/stats:
**قبل التحسين:**
- جلب جميع سجلات الحضور
- تصفية في JavaScript
- queries متعددة للعدادات

**بعد التحسين:**
- جلب الحقول المطلوبة فقط (select)
- استخدام reduce لحساب الإحصائيات
- Parallel fetch للعدادات
- **النتيجة**: أسرع وأكثر فعالية

#### API Routes الأخرى:
- ✅ إضافة `select` فقط للحقول المطلوبة
- ✅ تحسين `orderBy` لاستخدام indexes
- ✅ تحسين `where` clauses

### 3. تحسينات الأداء المتوقعة

#### payroll/calculate:
- **قبل**: ~2-5 ثواني (حسب عدد الموظفين)
- **بعد**: ~0.5-1 ثانية (تحسين 80-90%)

#### dashboard/stats:
- **قبل**: ~1-2 ثانية
- **بعد**: ~0.3-0.5 ثانية (تحسين 70-80%)

#### API Routes الأخرى:
- **قبل**: ~0.5-1 ثانية
- **بعد**: ~0.1-0.3 ثانية (تحسين 60-70%)

## كيفية تطبيق التحسينات

### 1. إنشاء Migration للـ Indexes:

```bash
npx prisma migrate dev --name add_performance_indexes
```

### 2. التحقق من الـ Indexes:

```bash
# في PostgreSQL
SELECT 
    tablename, 
    indexname, 
    indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

### 3. اختبار الأداء:

```bash
# قبل التحسين
time curl http://localhost:3000/api/payroll/calculate

# بعد التحسين
time curl http://localhost:3000/api/payroll/calculate
```

## أفضل الممارسات المطبقة

### 1. استخدام Select فقط للحقول المطلوبة:
```javascript
// ❌ قبل
const employees = await prisma.employee.findMany()

// ✅ بعد
const employees = await prisma.employee.findMany({
  select: {
    id: true,
    name: true,
    // فقط الحقول المطلوبة
  }
})
```

### 2. Batch Queries بدلاً من N+1:
```javascript
// ❌ قبل (N+1)
for (const emp of employees) {
  const attendance = await prisma.attendance.findMany({...})
}

// ✅ بعد (Batch)
const allAttendance = await prisma.attendance.findMany({
  where: { employeeId: { in: employeeIds } }
})
```

### 3. استخدام Composite Indexes:
```prisma
// ✅ Composite index للـ queries الشائعة
@@index([employeeId, month])
```

### 4. Parallel Queries:
```javascript
// ✅ جلب البيانات بشكل متوازي
const [employees, attendance, deductions] = await Promise.all([
  prisma.employee.findMany(),
  prisma.attendance.findMany(),
  prisma.deduction.findMany()
])
```

### 5. استخدام Transactions للـ Batch Operations:
```javascript
// ✅ Batch upsert باستخدام transaction
await prisma.$transaction(
  payrollToUpsert.map(p => prisma.payroll.upsert(p))
)
```

## Monitoring الأداء

### 1. استخدام Prisma Query Logging:
```javascript
// في lib/prisma.js
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})
```

### 2. مراقبة Slow Queries:
- فحص queries التي تستغرق أكثر من 100ms
- استخدام `EXPLAIN ANALYZE` في PostgreSQL

### 3. مراقبة Index Usage:
```sql
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

## ملاحظات مهمة

1. **Indexes تضيف overhead على INSERT/UPDATE**: لكن الفائدة في SELECT أكبر بكثير
2. **Composite Indexes**: يجب أن تكون الحقول مرتبة حسب الاستخدام الأكثر شيوعاً
3. **Select فقط للحقول المطلوبة**: يقلل حجم البيانات المنقولة
4. **Batch Queries**: تقلل عدد الـ round trips إلى قاعدة البيانات

## الخطوات التالية

1. ✅ تطبيق Migration للـ Indexes
2. ✅ اختبار الأداء
3. ⏳ مراقبة الأداء في الإنتاج
4. ⏳ إضافة المزيد من الـ Indexes حسب الحاجة
5. ⏳ تحسين queries إضافية إذا لزم الأمر

