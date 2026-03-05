// Payroll Calculator - حساب تلقائي للرواتب الشهرية
// يعتمد على عدد أيام الحضور فقط
// معادلة الحساب: الراتب اليومي = الراتب الأساسي ÷ أيام العمل (30)
// الراتب الشهري = الراتب اليومي × أيام الحضور
// Standard month days for salary calculations (fixed at 30 days)
const STANDARD_MONTH_DAYS = 30

export function calculatePayrollForEmployee(employee, attendance, deductions, month) {
  const [year, monthNum] = month.split('-')
  const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1)
  const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0)
  
  // Determine effective start and end dates for salary calculation
  const hireDate = employee.hireDate ? new Date(employee.hireDate) : monthStart
  const effectiveStart = hireDate > monthStart ? hireDate : monthStart
  
  let effectiveEnd = monthEnd
  let suspensionDate = null
  let suspensionType = null
  
  // Check suspension
  if (employee.status === 'suspended' && employee.suspensionDate) {
    suspensionDate = new Date(employee.suspensionDate)
    suspensionType = employee.suspensionType || 'without_salary'
    if (suspensionDate >= monthStart && suspensionDate <= monthEnd) {
      effectiveEnd = new Date(suspensionDate)
    } else if (suspensionDate < monthStart) {
      if (suspensionType === 'without_salary') {
        return null // Skip if suspended without salary before this month
      }
    }
  }
  
  // Check termination
  // التحقق من الإنهاء
  if (employee.status === 'terminated' && employee.terminationDate) {
    const terminationDate = new Date(employee.terminationDate)
    terminationDate.setHours(0, 0, 0, 0)
    
    // If terminated before the start of this month, skip (they didn't work this month)
    // إذا انتهت الخدمة قبل بداية هذا الشهر، تخطي (لم يعملوا في هذا الشهر)
    if (terminationDate < monthStart) {
      return null // Terminated before this month - انتهت الخدمة قبل هذا الشهر
    }
    
    // If terminated during this month, set effective end to termination date
    // إذا انتهت الخدمة خلال هذا الشهر، تعيين نهاية الفعالية إلى تاريخ الإنهاء
    if (terminationDate >= monthStart && terminationDate <= monthEnd) {
      effectiveEnd = terminationDate
    }
    // If terminated after this month, they worked the full month (effectiveEnd remains monthEnd)
    // إذا انتهت الخدمة بعد هذا الشهر، عملوا الشهر كاملاً (effectiveEnd يبقى monthEnd)
  }
  
  // Filter attendance based on effective dates
  let filteredAttendance = attendance.filter(att => {
    const attDate = new Date(att.date)
    return attDate >= effectiveStart && attDate <= effectiveEnd
  })
  
  // Filter out attendance before hire date
  if (employee.hireDate) {
    const hireDateObj = new Date(employee.hireDate)
    filteredAttendance = filteredAttendance.filter(att => {
      const attDate = new Date(att.date)
      return attDate >= hireDateObj
    })
  }
  
  // Count attendance days
  const presentDays = filteredAttendance.filter(att => att.status === 'present').length
  const absentDaysWithNotice = filteredAttendance.filter(att => att.status === 'absent' && (!att.absentType || att.absentType === 'with_notice')).length
  const absentDaysWithoutNotice = filteredAttendance.filter(att => att.status === 'absent' && att.absentType === 'without_notice').length
  const leaveDays = filteredAttendance.filter(att => att.status === 'leave').length
  const holidayDays = filteredAttendance.filter(att => att.status === 'holiday').length
  
  // Prepare date objects for comparison (used for both daysDue and baseSalary calculations)
  // إعداد كائنات التاريخ للمقارنة (تُستخدم لكل من حساب الأيام المستحقة والراتب الأساسي)
  const monthStartObj = new Date(monthStart)
  monthStartObj.setHours(0, 0, 0, 0)
  const monthEndDate = new Date(monthEnd)
  monthEndDate.setHours(23, 59, 59, 999)
  
  const hireDateObj = employee.hireDate ? new Date(employee.hireDate) : null
  if (hireDateObj) {
    hireDateObj.setHours(0, 0, 0, 0)
  }
  
  // Check if employee was terminated during this month
  // التحقق من إنهاء خدمة الموظف خلال هذا الشهر
  const isTerminatedInMonth = employee.status === 'terminated' && 
                               employee.terminationDate && 
                               effectiveEnd <= monthEndDate &&
                               effectiveEnd >= monthStartObj
  
  // Check if employee started within this month
  // التحقق من بدء الموظف خلال هذا الشهر
  const startedInMonth = hireDateObj && 
                         hireDateObj >= monthStartObj && 
                         hireDateObj <= monthEndDate
  
  // Calculate workable days based on termination and/or start date
  // حساب أيام العمل بناءً على تاريخ الإنهاء و/أو تاريخ البدء
  let workableDays = STANDARD_MONTH_DAYS // Default: full month (30 days)
  
  if (isTerminatedInMonth) {
    // Employee was terminated during this month
    // الموظف تم إنهاء خدمته خلال هذا الشهر
    const terminationDateObj = new Date(employee.terminationDate)
    terminationDateObj.setHours(0, 0, 0, 0)
    
    if (startedInMonth && hireDateObj) {
      // Combined case: Employee both started AND ended in the same month
      // الحالة المركبة: الموظف بدأ وانتهى في نفس الشهر
      // Formula: (Termination Day - Joining Day) + 1
      // المعادلة: (يوم الإنهاء - يوم التعيين) + 1
      const terminationDay = terminationDateObj.getDate()
      const joiningDay = hireDateObj.getDate()
      workableDays = (terminationDay - joiningDay) + 1
    } else {
      // Employee started before this month but terminated during it
      // الموظف بدأ قبل هذا الشهر لكن تم إنهاء خدمته خلاله
      // Workable days = Termination Day number (e.g., Feb 20 = 20 days)
      // أيام العمل = رقم يوم الإنهاء (مثال: 20 فبراير = 20 يوم)
      workableDays = terminationDateObj.getDate()
    }
  } else if (employee.status === 'suspended' && suspensionDate) {
    // Employee was suspended during this month
    // الموظف تم إيقافه خلال هذا الشهر
    const effectiveEndDate = new Date(effectiveEnd)
    effectiveEndDate.setHours(23, 59, 59, 999)
    workableDays = Math.floor((effectiveEndDate - monthStart) / (1000 * 60 * 60 * 24)) + 1
  } else if (startedInMonth && hireDateObj) {
    // Employee started mid-month but not terminated (works until end of month)
    // الموظف بدأ في منتصف الشهر لكن لم يتم إنهاء خدمته (يعمل حتى نهاية الشهر)
    const joiningDay = hireDateObj.getDate()
    const monthLastDay = monthEndDate.getDate()
    workableDays = (monthLastDay - joiningDay) + 1
  }
  
  // Ensure workableDays is within valid range (1 to 30)
  // التأكد من أن أيام العمل ضمن النطاق الصحيح (1 إلى 30)
  if (workableDays < 1) workableDays = 1
  if (workableDays > STANDARD_MONTH_DAYS) workableDays = STANDARD_MONTH_DAYS
  
  // Calculate days due (same as workableDays for consistency)
  // حساب الأيام المستحقة (نفس أيام العمل للاتساق)
  const daysDue = workableDays
  
  // Calculate daily rate - الراتب اليومي = الراتب الأساسي ÷ أيام العمل (30)
  // Always use 30 days as denominator regardless of actual month days
  // دائماً استخدم 30 يوم كقاسم بغض النظر عن عدد أيام الشهر الفعلية
  const dailyRate = employee.salary / STANDARD_MONTH_DAYS
  
  // Calculate prorated base salary using fixed 30-day basis
  // حساب الراتب الأساسي النسبي باستخدام أساس 30 يوم ثابت
  // Formula: (Base Salary / 30) * Workable Days
  // المعادلة: (الراتب الأساسي / 30) × أيام العمل
  let baseSalary = dailyRate * workableDays
  
  // Calculate daily salary - الراتب اليومي (يستخدم لحساب خصم الغياب)
  const dailySalary = dailyRate
  
  // المنطق الجديد: إذا لم يتم تسجيل دوام = يعتبر حضور (افتراضي)
  // فقط الغياب المسجل صراحة = يخصم من الراتب
  // New logic: If no attendance recorded = considered present (default)
  // Only explicitly recorded absence = deducted from salary
  
  // حساب أيام الغياب الفعلية (المسجلة صراحة)
  // Calculate actual absent days (explicitly recorded)
  const totalAbsentDays = absentDaysWithNotice + (absentDaysWithoutNotice * 2)
  
  // الراتب المستحق = الراتب الأساسي - خصم أيام الغياب
  // Salary due = Base salary - Absence deduction
  const absentDeduction = dailySalary * totalAbsentDays
  const monthlySalaryDue = baseSalary - absentDeduction
  
  // Calculate overtime, time delays, and non-time delays
  const workHours = employee.workHours || 8
  const hourlySalary = employee.salary / (STANDARD_MONTH_DAYS * workHours)
  const minuteSalary = hourlySalary / 60
  
  let totalOvertimeHours = 0
  let totalTimeDelayMinutes = 0
  let totalNonTimeDelayMinutes = 0
  
  filteredAttendance.forEach(att => {
    if (att.status === 'present') {
      totalOvertimeHours += (att.overtimeHours || 0)
      totalTimeDelayMinutes += (att.timeDelayMinutes || 0)
      totalNonTimeDelayMinutes += (att.nonTimeDelayMinutes || 0)
    }
  })
  
  // Calculate overtime pay - الساعات الإضافية (تُضاف إلى صافي الراتب)
  const overtimePay = totalOvertimeHours * hourlySalary
  
  // Calculate time delay deduction - التأخير الزمني (يُخصم من صافي الراتب)
  const timeDelayDeduction = totalTimeDelayMinutes * minuteSalary
  
  // Calculate non-time delay deduction - التأخير غير الزمني (يُخصم من صافي الراتب)
  const nonTimeDelayDeduction = (totalNonTimeDelayMinutes * 2) * minuteSalary
  
  // Get deductions, bonuses, and advances
  let totalDeductions = 0
  let totalBonuses = 0
  let totalAdvances = 0
  
  deductions.forEach(ded => {
    if (ded.type === 'deduction') {
      totalDeductions += ded.amount
    } else if (ded.type === 'bonus') {
      totalBonuses += ded.amount
    } else if (ded.type === 'advance') {
      totalAdvances += ded.amount
    }
  })
  
  // Calculate net salary - صافي الراتب
  // الراتب الأساسي يبقى ثابت (employee.salary)
  // الراتب المستحق = الراتب الأساسي - خصم أيام الغياب
  // جميع الاستقطاعات الأخرى تُخصم من صافي الراتب
  // Base salary remains constant
  // Salary due = Base salary - Absence deduction
  // All other deductions are from net salary
  const netSalary = monthlySalaryDue  // الراتب المستحق (الراتب الأساسي - خصم الغياب)
    + overtimePay           // إضافة الساعات الإضافية
    + totalBonuses          // إضافة المكافآت
    - timeDelayDeduction    // خصم التأخير الزمني
    - nonTimeDelayDeduction // خصم التأخير غير الزمني
    - totalDeductions       // خصم الخصومات
    - totalAdvances         // خصم السلف
  
  // Ensure net salary is not negative
  const finalNetSalary = netSalary < 0 ? 0 : netSalary
  
  // Calculate last working day
  let lastWorkingDay = null
  
  if (employee.status === 'terminated' && employee.terminationDate) {
    const terminationDateObj = new Date(employee.terminationDate)
    if (terminationDateObj >= monthStart && terminationDateObj <= monthEnd) {
      lastWorkingDay = employee.terminationDate
    }
  } else if (employee.status === 'suspended' && suspensionDate) {
    const suspensionDateObj = new Date(suspensionDate)
    if (suspensionDateObj >= monthStart && suspensionDateObj <= monthEnd) {
      lastWorkingDay = employee.suspensionDate
    }
  }
  
  // Calculate actual present days (including unrecorded days as present)
  // حساب أيام الحضور الفعلية (بما في ذلك الأيام غير المسجلة كحضور)
  // If no attendance recorded for a day = considered present
  // إذا لم يتم تسجيل دوام ليوم = يعتبر حضور
  const actualPresentDays = daysDue - totalAbsentDays - leaveDays - holidayDays
  
  return {
    employeeId: employee.id,
    month: month,
    presentDays: actualPresentDays, // أيام الحضور الفعلية (بما في ذلك الأيام غير المسجلة)
    absentDays: absentDaysWithNotice + absentDaysWithoutNotice,
    absentDaysWithNotice: absentDaysWithNotice,
    absentDaysWithoutNotice: absentDaysWithoutNotice,
    leaveDays: leaveDays,
    holidayDays: holidayDays,
    daysDue: daysDue, // إجمالي الأيام المستحقة في الشهر
    lastWorkingDay: lastWorkingDay,
    overtimeHours: totalOvertimeHours,
    timeDelayMinutes: totalTimeDelayMinutes,
    nonTimeDelayMinutes: totalNonTimeDelayMinutes,
    overtimePay: overtimePay,
    timeDelayDeduction: timeDelayDeduction,
    nonTimeDelayDeduction: nonTimeDelayDeduction,
    baseSalary: baseSalary, // الراتب الأساسي (ثابت - من بيانات الموظف)
    monthlySalaryDue: monthlySalaryDue, // الراتب المستحق (الراتب الأساسي - خصم الغياب)
    absentDeduction: absentDeduction, // خصم الغياب (أيام الغياب × الراتب اليومي)
    totalDeductions: totalDeductions,
    totalBonuses: totalBonuses,
    totalAdvances: totalAdvances,
    netSalary: finalNetSalary // صافي الراتب بعد جميع الاستقطاعات
  }
}

