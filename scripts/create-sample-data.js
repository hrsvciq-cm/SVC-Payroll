// Script لإنشاء بيانات تجريبية في قاعدة البيانات
// استخدم: node scripts/create-sample-data.js

const { PrismaClient } = require('@prisma/client')

// استخدام single instance لتجنب prepared statement errors
const globalForPrisma = global
const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['error']
})

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma
}

async function createSampleData() {
  try {
    console.log('🔄 جاري إنشاء بيانات تجريبية...\n')
    
    // التحقق من وجود موظفين
    const existingEmployees = await prisma.employee.count()
    if (existingEmployees > 0) {
      console.log(`⚠️  يوجد بالفعل ${existingEmployees} موظف في قاعدة البيانات`)
      console.log('   إذا كنت تريد إنشاء بيانات تجريبية، احذف البيانات الموجودة أولاً\n')
      return
    }
    
    // إنشاء موظفين تجريبيين
    console.log('📝 إنشاء موظفين تجريبيين...')
    
    const employee1 = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP001',
        name: 'أحمد محمد علي',
        branch: 'الفرع الرئيسي',
        department: 'المبيعات',
        position: 'مندوب مبيعات',
        salary: 500000,
        workHours: 8,
        hireDate: new Date('2024-01-01'),
        status: 'active'
      }
    })
    console.log(`   ✅ تم إنشاء موظف: ${employee1.employeeNumber} - ${employee1.name}`)
    
    const employee2 = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP002',
        name: 'فاطمة أحمد حسن',
        branch: 'الفرع الرئيسي',
        department: 'الإدارة',
        position: 'مدير مبيعات',
        salary: 750000,
        workHours: 8,
        hireDate: new Date('2023-06-01'),
        status: 'active'
      }
    })
    console.log(`   ✅ تم إنشاء موظف: ${employee2.employeeNumber} - ${employee2.name}`)
    
    const employee3 = await prisma.employee.create({
      data: {
        employeeNumber: 'EMP003',
        name: 'خالد إبراهيم محمود',
        branch: 'الفرع الثاني',
        department: 'المحاسبة',
        position: 'محاسب',
        salary: 600000,
        workHours: 8,
        hireDate: new Date('2024-03-01'),
        status: 'active'
      }
    })
    console.log(`   ✅ تم إنشاء موظف: ${employee3.employeeNumber} - ${employee3.name}`)
    
    console.log('')
    
    // إنشاء سجلات حضور تجريبية
    console.log('📅 إنشاء سجلات حضور تجريبية...')
    
    const today = new Date()
    const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    
    // حضور لآخر 7 أيام
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      // حضور للموظف الأول
      await prisma.attendance.create({
        data: {
          employeeId: employee1.id,
          date: dateStr,
          status: i % 7 === 0 ? 'holiday' : 'present',
          overtimeHours: i % 3 === 0 ? 2 : 0,
          timeDelayMinutes: i % 4 === 0 ? 15 : 0
        }
      })
      
      // حضور للموظف الثاني
      await prisma.attendance.create({
        data: {
          employeeId: employee2.id,
          date: dateStr,
          status: i % 7 === 0 ? 'holiday' : 'present',
          overtimeHours: i % 2 === 0 ? 1.5 : 0
        }
      })
      
      // حضور للموظف الثالث
      await prisma.attendance.create({
        data: {
          employeeId: employee3.id,
          date: dateStr,
          status: i % 7 === 0 ? 'holiday' : 'present',
          overtimeHours: 0,
          timeDelayMinutes: i % 5 === 0 ? 10 : 0
        }
      })
    }
    
    console.log('   ✅ تم إنشاء 21 سجل حضور (7 أيام × 3 موظفين)')
    console.log('')
    
    // إنشاء قسيمة راتب تجريبية
    console.log('💰 إنشاء قسائم رواتب تجريبية...')
    
    await prisma.payroll.create({
      data: {
        employeeId: employee1.id,
        month: currentMonth,
        presentDays: 20,
        absentDays: 0,
        absentDaysWithNotice: 0,
        absentDaysWithoutNotice: 0,
        leaveDays: 2,
        holidayDays: 8,
        overtimeHours: 10,
        timeDelayMinutes: 60,
        overtimePay: 62500,
        timeDelayDeduction: 12500,
        baseSalary: 500000,
        totalDeductions: 12500,
        totalBonuses: 0,
        totalAdvances: 0,
        netSalary: 550000
      }
    })
    
    await prisma.payroll.create({
      data: {
        employeeId: employee2.id,
        month: currentMonth,
        presentDays: 22,
        absentDays: 0,
        absentDaysWithNotice: 0,
        absentDaysWithoutNotice: 0,
        leaveDays: 0,
        holidayDays: 8,
        overtimeHours: 15,
        timeDelayMinutes: 0,
        overtimePay: 93750,
        timeDelayDeduction: 0,
        baseSalary: 750000,
        totalDeductions: 0,
        totalBonuses: 50000,
        totalAdvances: 0,
        netSalary: 893750
      }
    })
    
    await prisma.payroll.create({
      data: {
        employeeId: employee3.id,
        month: currentMonth,
        presentDays: 21,
        absentDays: 0,
        absentDaysWithNotice: 0,
        absentDaysWithoutNotice: 0,
        leaveDays: 1,
        holidayDays: 8,
        overtimeHours: 5,
        timeDelayMinutes: 30,
        overtimePay: 31250,
        timeDelayDeduction: 6250,
        baseSalary: 600000,
        totalDeductions: 6250,
        totalBonuses: 0,
        totalAdvances: 0,
        netSalary: 625000
      }
    })
    
    console.log('   ✅ تم إنشاء 3 قسائم رواتب')
    console.log('')
    
    console.log('✅ تم إنشاء البيانات التجريبية بنجاح!\n')
    console.log('📊 الملخص:')
    console.log('   - 3 موظفين')
    console.log('   - 21 سجل حضور')
    console.log('   - 3 قسائم رواتب')
    console.log('')
    console.log('💡 يمكنك الآن فتح الموقع والتحقق من البيانات!')
    
  } catch (error) {
    console.error('❌ خطأ في إنشاء البيانات:', error.message)
    console.error('\n🔍 تفاصيل الخطأ:')
    console.error(error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleData()

