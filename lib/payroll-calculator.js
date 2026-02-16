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
  
  // Calculate days due (total working days in the month)
  // حساب الأيام المستحقة (إجمالي أيام العمل في الشهر)
  let daysDue = STANDARD_MONTH_DAYS
  if ((employee.status === 'terminated' && employee.terminationDate) || 
      (employee.status === 'suspended' && suspensionDate)) {
    const effectiveEndDate = new Date(effectiveEnd)
    effectiveEndDate.setHours(23, 59, 59, 999)
    daysDue = Math.floor((effectiveEndDate - monthStart) / (1000 * 60 * 60 * 24)) + 1
  } else if (employee.hireDate && effectiveStart > monthStart) {
    const hireDateObj = new Date(employee.hireDate)
    const monthEndDate = new Date(monthEnd)
    monthEndDate.setHours(23, 59, 59, 999)
    daysDue = Math.floor((monthEndDate - hireDateObj) / (1000 * 60 * 60 * 24)) + 1
  }
  
  // Calculate daily rate - الراتب اليومي = الراتب الأساسي ÷ أيام العمل (30)
  // Always use 30 days as denominator regardless of actual month days
  // دائماً استخدم 30 يوم كقاسم بغض النظر عن عدد أيام الشهر الفعلية
  const dailyRate = employee.salary / STANDARD_MONTH_DAYS
  
  // Calculate prorated base salary for new employees
  // حساب الراتب الأساسي النسبي للموظفين الجدد
  let baseSalary = employee.salary // Default: full salary (الافتراضي: الراتب الكامل)
  
  // If employee started within the current month, calculate prorated salary
  // إذا بدأ الموظف خلال الشهر الحالي، احسب الراتب النسبي
  if (employee.hireDate) {
    const hireDateObj = new Date(employee.hireDate)
    hireDateObj.setHours(0, 0, 0, 0)
    const monthStartObj = new Date(monthStart)
    monthStartObj.setHours(0, 0, 0, 0)
    const monthEndDate = new Date(monthEnd)
    monthEndDate.setHours(23, 59, 59, 999)
    
    // Check if employee started within the current payroll month
    // التحقق من أن الموظف بدأ خلال شهر الرواتب الحالي
    const hireDateInMonth = hireDateObj >= monthStartObj && hireDateObj <= monthEndDate
    
    // If employee started after the first day of the month (within this month)
    // إذا بدأ الموظف بعد اليوم الأول من الشهر (ضمن هذا الشهر)
    if (hireDateInMonth && hireDateObj > monthStartObj) {
      // Calculate workable days from hireDate to end of month (inclusive)
      // حساب أيام العمل من تاريخ التعيين إلى نهاية الشهر (شامل)
      // Formula: (endDate - startDate) / millisecondsPerDay + 1
      // المعادلة: (تاريخ النهاية - تاريخ البداية) / مللي ثانية في اليوم + 1
      const workableDays = Math.floor((monthEndDate - hireDateObj) / (1000 * 60 * 60 * 24)) + 1
      
      // Ensure workableDays is positive and within valid range
      // التأكد من أن أيام العمل إيجابية وضمن النطاق الصحيح
      if (workableDays > 0 && workableDays <= STANDARD_MONTH_DAYS) {
        // Calculate prorated base salary: (Base Salary / 30) * Workable Days
        // حساب الراتب الأساسي النسبي: (الراتب الأساسي / 30) × أيام العمل
        baseSalary = dailyRate * workableDays
      }
    }
    // If employee started before or on the first day of the month, use full salary
    // إذا بدأ الموظف قبل أو في اليوم الأول من الشهر، استخدم الراتب الكامل
    // If employee started before this month, they get full salary for this month
    // إذا بدأ الموظف قبل هذا الشهر، يحصل على الراتب الكامل لهذا الشهر
  }
  
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

