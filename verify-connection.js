// Script للتحقق من اتصال Supabase
const { PrismaClient } = require('@prisma/client')

async function testConnection() {
  const prisma = new PrismaClient()
  
  try {
    console.log('🔄 جاري التحقق من الاتصال...\n')
    
    // محاولة الاتصال
    await prisma.$connect()
    console.log('✅ الاتصال بنجاح!\n')
    
    // اختبار بسيط
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ اختبار Query نجح:', result)
    
    console.log('\n✅ كل شيء يعمل بشكل صحيح!')
    
  } catch (error) {
    console.error('❌ خطأ في الاتصال:', error.message)
    console.error('\n🔍 تفاصيل الخطأ:')
    console.error(error)
    
    console.log('\n💡 نصائح:')
    console.log('1. تأكد من أن DATABASE_URL في ملف .env صحيح')
    console.log('2. تأكد من encoding كلمة المرور')
    console.log('3. تأكد من أن Supabase Database يعمل')
    
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()

