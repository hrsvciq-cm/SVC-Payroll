// Script لاختبار الاتصال بقاعدة البيانات
// استخدم: node scripts/test-database-connection.js

const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient({
    log: ['query', 'error', 'warn']
  })
  
  try {
    console.log('🔄 جاري اختبار الاتصال...\n')
    
    // عرض DATABASE_URL (بدون كلمة المرور)
    const dbUrl = process.env.DATABASE_URL
    if (dbUrl) {
      // إخفاء كلمة المرور في العرض
      const maskedUrl = dbUrl.replace(/:[^:@]+@/, ':****@')
      console.log('📋 DATABASE_URL:', maskedUrl)
    } else {
      console.log('❌ DATABASE_URL غير موجود في Environment Variables')
      return
    }
    
    console.log('\n🔄 محاولة الاتصال...')
    
    // محاولة الاتصال
    await prisma.$connect()
    console.log('✅ الاتصال بنجاح!\n')
    
    // اختبار بسيط
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ اختبار Query نجح:', result)
    
    // اختبار جلب البيانات
    const employeesCount = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM employees`
    console.log(`\n📊 عدد الموظفين في قاعدة البيانات: ${employeesCount[0]?.count || 0}`)
    
    console.log('\n✅ كل شيء يعمل بشكل صحيح!')
    
  } catch (error) {
    console.error('\n❌ خطأ في الاتصال:', error.message)
    
    if (error.message.includes('3x')) {
      console.error('\n🔍 المشكلة: Prisma يقرأ "3x" فقط من DATABASE_URL')
      console.error('   هذا يعني أن URL parsing فشل بسبب الرموز الخاصة في كلمة المرور')
      console.error('\n💡 الحل:')
      console.error('   1. تأكد من أن DATABASE_URL في Vercel يحتوي على كلمة المرور encoded')
      console.error('   2. أو استخدم Connection String من Supabase Dashboard (يكون encoded تلقائياً)')
      console.error('\n   Encoding المطلوب:')
      console.error('   - @ → %40')
      console.error('   - ? → %3F')
      console.error('   - % → %25')
      console.error('\n   مثال:')
      console.error('   m@3x?u3x@AR3ei% → m%403x%3Fu3x%40AR3ei%25')
    }
    
    console.error('\n🔍 تفاصيل الخطأ الكاملة:')
    console.error(error)
    
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

