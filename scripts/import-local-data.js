// Script لاستيراد البيانات من النظام المحلي
// استخدم: node scripts/import-local-data.js <path-to-backup-file.json>

const fs = require('fs')
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function importData(filePath) {
  try {
    console.log('📂 قراءة ملف النسخة الاحتياطية...')
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContent)

    console.log('🔄 بدء استيراد البيانات...\n')

    // استيراد الموظفين
    if (data.employees && data.employees.length > 0) {
      console.log(`📝 استيراد ${data.employees.length} موظف...`)
      for (const emp of data.employees) {
        try {
          await prisma.employee.upsert({
            where: { employeeNumber: emp.employeeNumber },
            update: {
              name: emp.name,
              branch: emp.branch || '',
              department: emp.department || '',
              position: emp.position || '',
              salary: parseFloat(emp.salary) || 0,
              workHours: parseFloat(emp.workHours) || 8,
              hireDate: emp.hireDate ? new Date(emp.hireDate) : null,
              status: emp.status || 'active',
              statusChangeDate: emp.statusChangeDate ? new Date(emp.statusChangeDate) : null,
              suspensionType: emp.suspensionType || null,
              suspensionDate: emp.suspensionDate ? new Date(emp.suspensionDate) : null,
              terminationDate: emp.terminationDate ? new Date(emp.terminationDate) : null
            },
            create: {
              employeeNumber: emp.employeeNumber,
              name: emp.name,
              branch: emp.branch || '',
              department: emp.department || '',
              position: emp.position || '',
              salary: parseFloat(emp.salary) || 0,
              workHours: parseFloat(emp.workHours) || 8,
              hireDate: emp.hireDate ? new Date(emp.hireDate) : null,
              status: emp.status || 'active',
              statusChangeDate: emp.statusChangeDate ? new Date(emp.statusChangeDate) : null,
              suspensionType: emp.suspensionType || null,
              suspensionDate: emp.suspensionDate ? new Date(emp.suspensionDate) : null,
              terminationDate: emp.terminationDate ? new Date(emp.terminationDate) : null
            }
          })
        } catch (error) {
          console.error(`❌ خطأ في استيراد موظف ${emp.employeeNumber}:`, error.message)
        }
      }
      console.log('✅ تم استيراد الموظفين\n')
    }

    // استيراد الحضور
    if (data.attendance && data.attendance.length > 0) {
      console.log(`📅 استيراد ${data.attendance.length} سجل حضور...`)
      let importedCount = 0
      let skippedCount = 0
      
      for (const att of data.attendance) {
        try {
          let employee = null
          
          // محاولة البحث عن الموظف بطرق مختلفة
          if (att.employeeId) {
            // محاولة 1: البحث بـ employeeNumber (إذا كان employeeId هو رقم الموظف)
            employee = await prisma.employee.findUnique({
              where: { employeeNumber: String(att.employeeId) }
            })
            
            // محاولة 2: البحث بـ ID (إذا كان employeeId هو ID قاعدة البيانات)
            if (!employee && !isNaN(parseInt(att.employeeId))) {
              employee = await prisma.employee.findUnique({
                where: { id: parseInt(att.employeeId) }
              })
            }
          }
          
          // محاولة 3: البحث بـ employeeNumber من البيانات
          if (!employee && att.employeeNumber) {
            employee = await prisma.employee.findUnique({
              where: { employeeNumber: String(att.employeeNumber) }
            })
          }
          
          if (!employee) {
            skippedCount++
            console.warn(`⚠️  موظف غير موجود: ${att.employeeId || att.employeeNumber || 'unknown'}`)
            continue
          }
          
          await prisma.attendance.upsert({
            where: {
              employeeId_date: {
                employeeId: employee.id,
                date: att.date
              }
            },
            update: {
              status: att.status || 'present',
              absentType: att.absentType || null,
              overtimeHours: parseFloat(att.overtimeHours) || 0,
              timeDelayMinutes: parseInt(att.timeDelayMinutes) || 0,
              nonTimeDelayMinutes: parseInt(att.nonTimeDelayMinutes) || 0
            },
            create: {
              employeeId: employee.id,
              date: att.date,
              status: att.status || 'present',
              absentType: att.absentType || null,
              overtimeHours: parseFloat(att.overtimeHours) || 0,
              timeDelayMinutes: parseInt(att.timeDelayMinutes) || 0,
              nonTimeDelayMinutes: parseInt(att.nonTimeDelayMinutes) || 0
            }
          })
          importedCount++
        } catch (error) {
          console.error(`❌ خطأ في استيراد حضور ${att.id || att.date}:`, error.message)
          skippedCount++
        }
      }
      console.log(`✅ تم استيراد ${importedCount} سجل حضور`)
      if (skippedCount > 0) {
        console.log(`⚠️  تم تخطي ${skippedCount} سجل (موظف غير موجود)\n`)
      } else {
        console.log('')
      }
    }

    // استيراد الرواتب
    if (data.payroll && data.payroll.length > 0) {
      console.log(`💰 استيراد ${data.payroll.length} سجل راتب...`)
      for (const pay of data.payroll) {
        try {
          const employee = await prisma.employee.findUnique({
            where: { id: parseInt(pay.employeeId) }
          })
          
          if (!employee) {
            console.warn(`⚠️  موظف غير موجود: ${pay.employeeId}`)
            continue
          }
          
          await prisma.payroll.upsert({
            where: {
              employeeId_month: {
                employeeId: employee.id,
                month: pay.month
              }
            },
            update: {
              presentDays: parseInt(pay.presentDays) || 0,
              absentDays: parseInt(pay.absentDays) || 0,
              absentDaysWithNotice: parseInt(pay.absentDaysWithNotice) || 0,
              absentDaysWithoutNotice: parseInt(pay.absentDaysWithoutNotice) || 0,
              leaveDays: parseInt(pay.leaveDays) || 0,
              holidayDays: parseInt(pay.holidayDays) || 0,
              daysDue: pay.daysDue ? parseInt(pay.daysDue) : null,
              lastWorkingDay: pay.lastWorkingDay ? new Date(pay.lastWorkingDay) : null,
              overtimeHours: parseFloat(pay.overtimeHours) || 0,
              timeDelayMinutes: parseInt(pay.timeDelayMinutes) || 0,
              nonTimeDelayMinutes: parseInt(pay.nonTimeDelayMinutes) || 0,
              overtimePay: parseFloat(pay.overtimePay) || 0,
              timeDelayDeduction: parseFloat(pay.timeDelayDeduction) || 0,
              nonTimeDelayDeduction: parseFloat(pay.nonTimeDelayDeduction) || 0,
              baseSalary: parseFloat(pay.baseSalary) || 0,
              totalDeductions: parseFloat(pay.totalDeductions) || 0,
              totalBonuses: parseFloat(pay.totalBonuses) || 0,
              totalAdvances: parseFloat(pay.totalAdvances) || 0,
              netSalary: parseFloat(pay.netSalary) || 0
            },
            create: {
              employeeId: employee.id,
              month: pay.month,
              presentDays: parseInt(pay.presentDays) || 0,
              absentDays: parseInt(pay.absentDays) || 0,
              absentDaysWithNotice: parseInt(pay.absentDaysWithNotice) || 0,
              absentDaysWithoutNotice: parseInt(pay.absentDaysWithoutNotice) || 0,
              leaveDays: parseInt(pay.leaveDays) || 0,
              holidayDays: parseInt(pay.holidayDays) || 0,
              daysDue: pay.daysDue ? parseInt(pay.daysDue) : null,
              lastWorkingDay: pay.lastWorkingDay ? new Date(pay.lastWorkingDay) : null,
              overtimeHours: parseFloat(pay.overtimeHours) || 0,
              timeDelayMinutes: parseInt(pay.timeDelayMinutes) || 0,
              nonTimeDelayMinutes: parseInt(pay.nonTimeDelayMinutes) || 0,
              overtimePay: parseFloat(pay.overtimePay) || 0,
              timeDelayDeduction: parseFloat(pay.timeDelayDeduction) || 0,
              nonTimeDelayDeduction: parseFloat(pay.nonTimeDelayDeduction) || 0,
              baseSalary: parseFloat(pay.baseSalary) || 0,
              totalDeductions: parseFloat(pay.totalDeductions) || 0,
              totalBonuses: parseFloat(pay.totalBonuses) || 0,
              totalAdvances: parseFloat(pay.totalAdvances) || 0,
              netSalary: parseFloat(pay.netSalary) || 0
            }
          })
        } catch (error) {
          console.error(`❌ خطأ في استيراد راتب ${pay.id}:`, error.message)
        }
      }
      console.log('✅ تم استيراد الرواتب\n')
    }

    // استيراد الخصومات
    if (data.deductions && data.deductions.length > 0) {
      console.log(`💸 استيراد ${data.deductions.length} خصم/مكافأة/سلف...`)
      for (const ded of data.deductions) {
        try {
          const employee = await prisma.employee.findUnique({
            where: { id: parseInt(ded.employeeId) }
          })
          
          if (!employee) {
            console.warn(`⚠️  موظف غير موجود: ${ded.employeeId}`)
            continue
          }
          
          await prisma.deduction.create({
            data: {
              employeeId: employee.id,
              month: ded.month,
              type: ded.type || 'deduction',
              amount: parseFloat(ded.amount) || 0,
              description: ded.description || null
            }
          })
        } catch (error) {
          console.error(`❌ خطأ في استيراد خصم ${ded.id}:`, error.message)
        }
      }
      console.log('✅ تم استيراد الخصومات\n')
    }

    // استيراد الرموز السريعة
    if (data.quickCodes && data.quickCodes.length > 0) {
      console.log(`🔑 استيراد ${data.quickCodes.length} رمز سريع...`)
      for (const code of data.quickCodes) {
        try {
          await prisma.quickCode.upsert({
            where: { code: code.code },
            update: {
              employeeIds: code.employeeIds || []
            },
            create: {
              code: code.code,
              employeeIds: code.employeeIds || []
            }
          })
        } catch (error) {
          console.error(`❌ خطأ في استيراد رمز ${code.code}:`, error.message)
        }
      }
      console.log('✅ تم استيراد الرموز السريعة\n')
    }

    console.log('✅ اكتمل الاستيراد بنجاح!')
  } catch (error) {
    console.error('❌ خطأ في الاستيراد:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// تشغيل الاستيراد
const filePath = process.argv[2]
if (!filePath) {
  console.error('❌ يرجى تحديد مسار ملف النسخة الاحتياطية')
  console.log('الاستخدام: node scripts/import-local-data.js <path-to-backup.json>')
  process.exit(1)
}

if (!fs.existsSync(filePath)) {
  console.error(`❌ الملف غير موجود: ${filePath}`)
  process.exit(1)
}

importData(filePath)


