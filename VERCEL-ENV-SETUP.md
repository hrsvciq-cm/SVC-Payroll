# إعداد Environment Variables في Vercel

## المتغيرات المطلوبة

يجب إضافة المتغيرات التالية في Vercel Dashboard:

### 1. Supabase Variables (مطلوبة)

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Database Variables (مطلوبة)

```
DATABASE_URL=postgresql://user:password@host:port/database?connection_params
```

**ملاحظة مهمة:**
- `DATABASE_URL` مطلوب للاتصال بقاعدة البيانات
- `DIRECT_URL` اختياري - يستخدم فقط للتطوير المحلي
- في Vercel، استخدم `DATABASE_URL` فقط

### 3. كيفية إضافة المتغيرات في Vercel

1. اذهب إلى Vercel Dashboard
2. اختر مشروعك
3. Settings > Environment Variables
4. أضف كل متغير:
   - **Name**: اسم المتغير (مثلاً `DATABASE_URL`)
   - **Value**: القيمة (انسخ من `.env.local` المحلي)
   - **Environment**: اختر `Production`, `Preview`, `Development` (أو الكل)
5. اضغط "Save"

### 4. التحقق من المتغيرات

بعد إضافة المتغيرات:
1. اذهب إلى Deployments
2. اضغط على آخر deployment
3. اضغط "Redeploy"
4. تأكد من أن Build نجح

## ملاحظات مهمة

- ✅ لا تضع علامات اقتباس حول القيم في Vercel
- ✅ تأكد من أن `DATABASE_URL` صحيح ومكتمل
- ✅ بعد إضافة المتغيرات، يجب إعادة Deployment
- ✅ يمكنك نسخ القيم من `.env.local` المحلي

## استكشاف الأخطاء

إذا فشل Build:
1. تحقق من أن جميع المتغيرات موجودة
2. تحقق من أن `DATABASE_URL` صحيح
3. تحقق من أن Prisma Client تم توليده بنجاح
4. راجع Build Logs في Vercel Dashboard

