# حل مشكلة Forbidden عند حساب الرواتب

## المشكلة
```
Error calculating payroll: Error: Forbidden
POST /api/payroll/calculate 403
```

**السبب**: حساب الرواتب يتطلب صلاحية `admin` أو `hr`، لكن المستخدم الحالي لديه صلاحية `viewer`.

## الحل: تحديث صلاحية المستخدم

### الطريقة 1: استخدام Prisma Studio (الأسهل)

1. افتح Terminal واكتب:
   ```bash
   npx prisma studio
   ```

2. افتح المتصفح على `http://localhost:5555`

3. اذهب إلى جدول `users`

4. ابحث عن المستخدم الحالي (البريد الإلكتروني الذي تستخدمه لتسجيل الدخول)

5. انقر على السجل لتعديله

6. غيّر `role` من `viewer` إلى `admin` أو `hr`

7. احفظ التغييرات

8. أعد تحميل صفحة النظام وجرب حساب الرواتب مرة أخرى

### الطريقة 2: استخدام SQL مباشرة

1. افتح Supabase Dashboard
2. اذهب إلى SQL Editor
3. شغّل هذا الأمر (استبدل `your-email@example.com` ببريدك):

```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

### الطريقة 3: استخدام Node.js Script

أنشئ ملف `update-user-role.js`:

```javascript
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function updateUserRole() {
  const email = 'your-email@example.com' // استبدل ببريدك
  const newRole = 'admin' // أو 'hr'
  
  const user = await prisma.user.update({
    where: { email },
    data: { role: newRole }
  })
  
  console.log('تم تحديث صلاحية المستخدم:', user)
}

updateUserRole()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
```

ثم شغّله:
```bash
node update-user-role.js
```

## الصلاحيات المتاحة

- **admin**: صلاحيات كاملة (كل شيء)
- **hr**: إدارة الموظفين والحضور والرواتب
- **finance**: إدارة الرواتب والخصومات فقط
- **viewer**: عرض فقط (لا يمكن التعديل)

## بعد التحديث

1. أعد تحميل الصفحة (F5)
2. جرب حساب الرواتب مرة أخرى
3. يجب أن يعمل بدون خطأ Forbidden

