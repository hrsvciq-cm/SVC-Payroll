// Script للتحقق من البيانات الموجودة في قاعدة البيانات
// استخدم: node scripts/check-database-data.js

const { PrismaClient } = require('@prisma/client')

// استخدام single instance لتجنب prepared statement errors
const globalForPrisma = global
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error']
})

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

async function checkData() {
  try {
    console.log('🔄 جاري التحقق من البيانات في قاعدة البيانات...\n')
    
    // التحقق من الاتصال
    await prisma.$connect()
    console.log('✅ الاتصال بقاعدة البيانات نجح!\n')
    
    // التحقق من الموظفين (استخدام raw query لتجنب prepared statement errors)
    const employeesResult = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM employees`
    const employeesCount = Number(employeesResult[0]?.count || 0)
    console.log(`📊 عدد الموظفين: ${employeesCount}`)
    
    if (employeesCount > 0) {
      const employees = await prisma.$queryRaw`
        SELECT id, "employeeNumber", name, status 
        FROM employees 
        LIMIT 5
      `
      console.log('   أمثلة على الموظفين:')
      employees.forEach((emp) => {
        console.log(`   - ${emp.employeeNumber}: ${emp.name} (${emp.status})`)
      })
    } else {
      console.log('   ⚠️  لا يوجد موظفين في قاعدة البيانات')
    }
    console.log('')
    
    // التحقق من الحضور
    const attendanceResult = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM attendance`
    const attendanceCount = Number(attendanceResult[0]?.count || 0)
    console.log(`📅 عدد سجلات الحضور: ${attendanceCount}`)
    console.log('')
    
    // التحقق من الرواتب
    const payrollResult = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM payroll`
    const payrollCount = Number(payrollResult[0]?.count || 0)
    console.log(`💰 عدد قسائم الرواتب: ${payrollCount}`)
    console.log('')
    
    // التحقق من الخصومات
    const deductionsResult = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM deductions`
    const deductionsCount = Number(deductionsResult[0]?.count || 0)
    console.log(`💸 عدد الخصومات/المكافآت: ${deductionsCount}`)
    console.log('')
    
    // التحقق من الرموز السريعة
    const quickCodesResult = await prisma.$queryRaw`SELECT COUNT(*)::int as count FROM quick_codes`
    const quickCodesCount = Number(quickCodesResult[0]?.count || 0)
    console.log(`🔑 عدد الرموز السريعة: ${quickCodesCount}`)
    console.log('')
    
    // ملخص
    console.log('📋 الملخص:')
    console.log(`   - الموظفين: ${employeesCount}`)
    console.log(`   - الحضور: ${attendanceCount}`)
    console.log(`   - الرواتب: ${payrollCount}`)
    console.log(`   - الخصومات: ${deductionsCount}`)
    console.log(`   - الرموز السريعة: ${quickCodesCount}`)
    console.log('')
    
    if (employeesCount === 0 && attendanceCount === 0 && payrollCount === 0) {
      console.log('⚠️  قاعدة البيانات فارغة - لا توجد بيانات!')
      console.log('💡 يمكنك:')
      console.log('   1. استيراد البيانات من ملف نسخة احتياطية')
      console.log('   2. إنشاء بيانات تجريبية باستخدام: node scripts/create-sample-data.js')
      console.log('   3. إضافة البيانات يدوياً من الموقع')
    } else {
      console.log('✅ توجد بيانات في قاعدة البيانات!')
    }
    
  } catch (error) {
    console.error('❌ خطأ في التحقق:', error.message)
    console.error('\n🔍 تفاصيل الخطأ:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()

