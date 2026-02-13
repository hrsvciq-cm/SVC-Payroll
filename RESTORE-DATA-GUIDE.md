# دليل استعادة البيانات المفقودة

## المشكلة
جميع البيانات فُقدت - لا يوجد موظفين ولا قسائم رواتب ولا أي تفاصيل في الموقع على Vercel.

## الحل: استعادة البيانات من النظام المحلي

### الطريقة 1: تصدير من النظام المحلي (إذا كان يعمل)

إذا كان لديك النظام المحلي القديم يعمل في المتصفح:

#### الخطوة 1: تصدير البيانات من IndexedDB

1. **افتح النظام المحلي** في المتصفح (افتح `index.html`)

2. **افتح Developer Console:**
   - اضغط `F12` أو `Ctrl+Shift+I`
   - اذهب إلى تبويب `Console`

3. **انسخ والصق هذا الكود في Console:**

```javascript
const exportIndexedDBData = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PayrollSystem', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const data = {
        employees: [],
        attendance: [],
        payroll: [],
        deductions: [],
        quickCodes: []
      };
      
      // تصدير الموظفين
      const empTransaction = db.transaction(['employees'], 'readonly');
      const empStore = empTransaction.objectStore('employees');
      const empRequest = empStore.getAll();
      
      empRequest.onsuccess = () => {
        data.employees = empRequest.result;
        
        // تصدير الحضور
        const attTransaction = db.transaction(['attendance'], 'readonly');
        const attStore = attTransaction.objectStore('attendance');
        const attRequest = attStore.getAll();
        
        attRequest.onsuccess = () => {
          data.attendance = attRequest.result;
          
          // تصدير الرواتب
          const payTransaction = db.transaction(['payroll'], 'readonly');
          const payStore = payTransaction.objectStore('payroll');
          const payRequest = payStore.getAll();
          
          payRequest.onsuccess = () => {
            data.payroll = payRequest.result;
            
            // تصدير الخصومات
            const dedTransaction = db.transaction(['deductions'], 'readonly');
            const dedStore = dedTransaction.objectStore('deductions');
            const dedRequest = dedStore.getAll();
            
            dedRequest.onsuccess = () => {
              data.deductions = dedRequest.result;
              
              // تصدير الرموز السريعة
              const codeTransaction = db.transaction(['quickCodes'], 'readonly');
              const codeStore = codeTransaction.objectStore('quickCodes');
              const codeRequest = codeStore.getAll();
              
              codeRequest.onsuccess = () => {
                data.quickCodes = codeRequest.result;
                data.exportDate = new Date().toISOString();
                
                // تحميل الملف
                const json = JSON.stringify(data, null, 2);
                const blob = new Blob([json], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `payroll-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                console.log('✅ تم تصدير البيانات بنجاح!');
                console.log(`📊 الموظفين: ${data.employees.length}`);
                console.log(`📅 الحضور: ${data.attendance.length}`);
                console.log(`💰 الرواتب: ${data.payroll.length}`);
                console.log(`💸 الخصومات: ${data.deductions.length}`);
                console.log(`🔑 الرموز السريعة: ${data.quickCodes.length}`);
                
                resolve(data);
              };
              
              codeRequest.onerror = () => reject(codeRequest.error);
            };
            
            dedRequest.onerror = () => reject(dedRequest.error);
          };
          
          payRequest.onerror = () => reject(payRequest.error);
        };
        
        attRequest.onerror = () => reject(attRequest.error);
      };
      
      empRequest.onerror = () => reject(empRequest.error);
    };
  });
};

// تشغيل التصدير
exportIndexedDBData().catch(error => {
  console.error('❌ خطأ في التصدير:', error);
});
```

4. **اضغط Enter** - سيتم تحميل ملف JSON تلقائياً

5. **احفظ الملف** في مكان آمن (مثلاً: `C:\Users\HR\backup.json`)

#### الخطوة 2: استيراد البيانات إلى Supabase

1. **افتح Terminal** في مجلد المشروع:
   ```bash
   cd "C:\Users\HR\Videos\Payroll System"
   ```

2. **تأكد من أن `.env.local` يحتوي على `DATABASE_URL` الصحيح:**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database
   ```

3. **شغّل script الاستيراد:**
   ```bash
   node scripts/import-local-data.js "C:\Users\HR\backup.json"
   ```

4. **انتظر حتى يكتمل الاستيراد** - سترى رسائل تظهر التقدم

5. **تحقق من الاستيراد:**
   - افتح https://svc-payroll.vercel.app/dashboard
   - يجب أن تظهر جميع البيانات

### الطريقة 2: استخدام النسخة الاحتياطية الموجودة

إذا كان لديك ملف نسخة احتياطية سابقاً:

1. **ابحث عن ملفات `.json`** في مجلد Downloads أو Desktop
2. **استخدم script الاستيراد:**
   ```bash
   node scripts/import-local-data.js "مسار_الملف.json"
   ```

### الطريقة 3: إنشاء بيانات جديدة (إذا لم تكن هناك نسخة احتياطية)

إذا لم تكن هناك بيانات محلية أو نسخة احتياطية:

#### الخيار 1: إضافة البيانات يدوياً من الموقع

1. افتح https://svc-payroll.vercel.app
2. سجّل الدخول
3. استخدم:
   - صفحة "إضافة موظف جديد" لإضافة الموظفين
   - صفحة "تسجيل الدوام" لتسجيل الحضور
   - صفحة "الرواتب" لحساب الرواتب

#### الخيار 2: استخدام Prisma Studio

1. **شغّل Prisma Studio:**
   ```bash
   npm run prisma:studio
   ```

2. **افتح المتصفح على:** http://localhost:5555

3. **أضف البيانات يدوياً:**
   - اضغط على جدول `employees` وأضف موظفين
   - اضغط على جدول `attendance` وأضف سجلات حضور
   - اضغط على جدول `payroll` وأضف قسائم رواتب

## استكشاف الأخطاء

### خطأ: "الملف غير موجود"
- **الحل:** تحقق من مسار الملف واسمه

### خطأ: "موظف غير موجود" أثناء الاستيراد
- **الحل:** هذا تحذير طبيعي - يعني أن سجل حضور يشير لموظف غير موجود
- **الإجراء:** تأكد من استيراد الموظفين أولاً

### خطأ: "Connection refused" أو "Database connection failed"
- **الحل:** 
  1. تحقق من `DATABASE_URL` في `.env.local`
  2. تأكد من أن Supabase يعمل
  3. تحقق من أن Firewall لا يمنع الاتصال

### البيانات لا تظهر في الموقع بعد الاستيراد
- **الحل:**
  1. تحقق من أن الاستيراد اكتمل بنجاح (راجع Terminal)
  2. افتح Prisma Studio وتحقق من وجود البيانات
  3. أعد تحميل الصفحة (Ctrl+F5)
  4. تحقق من أن Environment Variables في Vercel صحيحة

## ملاحظات مهمة

- ✅ **Script الاستيراد آمن:** يمكن تشغيله عدة مرات - يستخدم `upsert` لذلك لن يكرر البيانات
- ✅ **البيانات محفوظة:** جميع البيانات (موظفين، حضور، رواتب) يتم استيرادها
- ✅ **التواريخ محفوظة:** جميع التواريخ والتواريخ المهمة محفوظة كما هي

## مثال كامل

```bash
# 1. تصدير من النظام المحلي (افتح index.html وافتح Console وانسخ الكود أعلاه)
# 2. حفظ الملف في: C:\Users\HR\backup-2026-02-13.json

# 3. استيراد إلى Supabase
cd "C:\Users\HR\Videos\Payroll System"
node scripts/import-local-data.js "C:\Users\HR\backup-2026-02-13.json"

# 4. انتظر حتى يكتمل الاستيراد
# 5. افتح الموقع وتحقق من البيانات
```

## بعد الاستيراد

بعد استيراد البيانات بنجاح:
- ✅ جميع الموظفين ستظهر في صفحة الموظفين
- ✅ جميع سجلات الحضور ستظهر في صفحة تسجيل الدوام
- ✅ جميع قسائم الرواتب ستظهر في صفحة الرواتب
- ✅ الموقع جاهز للاستخدام!

