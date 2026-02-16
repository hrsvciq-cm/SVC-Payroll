'use client'

import { formatCurrency } from '@/lib/currency'

export default function Payslip({ payroll, deductions = [], showSignatures = false }) {
  const formatMonth = (month) => {
    if (!month) return ''
    const [year, monthNum] = month.split('-')
    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`
  }

  const getTypeLabel = (type) => {
    const labels = {
      deduction: 'خصم',
      bonus: 'مكافأة',
      advance: 'سلف'
    }
    return labels[type] || type
  }

  if (!payroll || !payroll.employee) {
    return null
  }

  return (
    <div className="payslip-wrapper" style={{ pageBreakAfter: 'always' }}>
      <div className="payslip-header">
        <h2>قسيمة راتب</h2>
        <p>شهر: {formatMonth(payroll.month)}</p>
      </div>

      <div className="payslip-info">
        <div>
          <p><strong>الاسم:</strong> {payroll.employee.name}</p>
          <p><strong>الرقم الوظيفي:</strong> {payroll.employee.employeeNumber}</p>
          <p><strong>الفرع:</strong> {payroll.employee.branch || '-'}</p>
          <p><strong>القسم:</strong> {payroll.employee.department || '-'}</p>
        </div>
        <div>
          <p><strong>المسمى الوظيفي:</strong> {payroll.employee.position || '-'}</p>
          <p><strong>الراتب الأساسي:</strong> {formatCurrency(payroll.employee.salary)}</p>
          <p><strong>عدد أيام الشهر (لحساب الراتب):</strong> 30 يوم (ثابت لجميع الشهور)</p>
          <p><strong>الراتب اليومي:</strong> {formatCurrency(payroll.employee.salary / 30)}</p>
        </div>
      </div>

      <div className="payslip-section">
        <h3>تفاصيل الحضور</h3>
        <div className="payslip-row">
          <span>أيام الحضور:</span>
          <span>{payroll.presentDays || 0} يوم</span>
        </div>
        <div className="payslip-row">
          <span>أيام الغياب (مع تبليغ):</span>
          <span>{payroll.absentDaysWithNotice || 0} يوم</span>
        </div>
        <div className="payslip-row">
          <span>أيام الغياب (بدون تبليغ):</span>
          <span>{payroll.absentDaysWithoutNotice || 0} يوم <span>(يخصم يومين لكل يوم)</span></span>
        </div>
        <div className="payslip-row">
          <span>إجمالي أيام الغياب:</span>
          <span>{((payroll.absentDaysWithNotice || 0) + (payroll.absentDaysWithoutNotice || 0))} يوم</span>
        </div>
        <div className="payslip-row">
          <span>أيام الإجازة:</span>
          <span>{payroll.leaveDays || 0} يوم</span>
        </div>
        <div className="payslip-row">
          <span>أيام العطل:</span>
          <span>{payroll.holidayDays || 0} يوم</span>
        </div>
      </div>

      <div className="payslip-section">
        <h3>الساعات الإضافية والتأخير</h3>
        {(() => {
          const overtimeHours = payroll.overtimeHours || 0
          const timeDelayMinutes = payroll.timeDelayMinutes || 0
          const nonTimeDelayMinutes = payroll.nonTimeDelayMinutes || 0
          
          if (overtimeHours > 0 || timeDelayMinutes > 0 || nonTimeDelayMinutes > 0) {
            return (
              <>
                {overtimeHours > 0 && (
                  <>
                    <div className="payslip-row">
                      <span>الساعات الإضافية:</span>
                      <span>{overtimeHours.toFixed(2)} ساعة</span>
                    </div>
                    <div className="payslip-row">
                      <span>مبلغ الساعات الإضافية:</span>
                      <span style={{ color: '#28a745', fontWeight: '600' }}>{formatCurrency(payroll.overtimePay || 0)}</span>
                    </div>
                  </>
                )}
                {timeDelayMinutes > 0 && (
                  <>
                    <div className="payslip-row">
                      <span>دقائق التأخير الزمني:</span>
                      <span>{timeDelayMinutes} دقيقة</span>
                    </div>
                    <div className="payslip-row">
                      <span>خصم التأخير الزمني:</span>
                      <span style={{ color: '#dc3545', fontWeight: '600' }}>{formatCurrency(payroll.timeDelayDeduction || 0)}</span>
                    </div>
                  </>
                )}
                {nonTimeDelayMinutes > 0 && (
                  <>
                    <div className="payslip-row">
                      <span>دقائق التأخير غير الزمني:</span>
                      <span>{nonTimeDelayMinutes} دقيقة <span>(يخصم دقيقتين لكل دقيقة)</span></span>
                    </div>
                    <div className="payslip-row">
                      <span>خصم التأخير غير الزمني:</span>
                      <span style={{ color: '#dc3545', fontWeight: '600' }}>{formatCurrency(payroll.nonTimeDelayDeduction || 0)}</span>
                    </div>
                  </>
                )}
              </>
            )
          } else {
            return (
              <div className="payslip-row">
                <span>لا توجد ساعات إضافية أو تأخير</span>
              </div>
            )
          }
        })()}
      </div>

      <div className="payslip-section">
        <h3>الراتب المستحق</h3>
        <div className="payslip-row">
          <span>الراتب الأساسي:</span>
          <span>{formatCurrency(payroll.baseSalary || payroll.employee.salary)}</span>
        </div>
        <div className="payslip-row">
          <span>عدد الأيام المستحقة:</span>
          <span>{payroll.daysDue || 30} يوم</span>
        </div>
        <div className="payslip-row">
          <span>إجمالي أيام الغياب (بعد حساب التكرار):</span>
          <span>{((payroll.absentDaysWithNotice || 0) + ((payroll.absentDaysWithoutNotice || 0) * 2))} يوم</span>
        </div>
        <div className="payslip-row">
          <span>الراتب بعد خصم الغياب:</span>
          <span>{(() => {
            const baseSalary = payroll.baseSalary || payroll.employee.salary
            const dailySalary = baseSalary / 30
            const totalAbsentDays = (payroll.absentDaysWithNotice || 0) + ((payroll.absentDaysWithoutNotice || 0) * 2)
            return formatCurrency(baseSalary - (dailySalary * totalAbsentDays))
          })()}</span>
        </div>
      </div>

      <div className="payslip-section">
        <h3>الإضافات</h3>
        {deductions.filter(d => d.type === 'bonus').length > 0 ? (
          deductions.filter(d => d.type === 'bonus').map((bonus, idx) => (
            <div key={idx} className="payslip-row">
              <span>{bonus.description || 'مكافأة'}:</span>
              <span>{formatCurrency(bonus.amount)}</span>
            </div>
          ))
        ) : (
          <div className="payslip-row">
            <span>لا توجد إضافات</span>
          </div>
        )}
        <div className="payslip-row" style={{ borderTop: '2px solid #667eea', marginTop: '8px' }}>
          <span><strong>إجمالي الإضافات:</strong></span>
          <span><strong>{formatCurrency(payroll.totalBonuses || 0)}</strong></span>
        </div>
      </div>

      <div className="payslip-section">
        <h3>الخصومات</h3>
        {deductions.filter(d => d.type === 'deduction' || d.type === 'advance').length > 0 ? (
          deductions.filter(d => d.type === 'deduction' || d.type === 'advance').map((ded, idx) => (
            <div key={idx} className="payslip-row">
              <span>{ded.description || getTypeLabel(ded.type)}:</span>
              <span>{formatCurrency(ded.amount)}</span>
            </div>
          ))
        ) : (
          <div className="payslip-row">
            <span>لا توجد خصومات</span>
          </div>
        )}
        <div className="payslip-row" style={{ borderTop: '2px solid #667eea', marginTop: '8px' }}>
          <span><strong>إجمالي الخصومات:</strong></span>
          <span><strong>{formatCurrency((payroll.totalDeductions || 0) + (payroll.totalAdvances || 0))}</strong></span>
        </div>
      </div>

      <div className="payslip-row total">
        <span>صافي الراتب:</span>
        <span>{formatCurrency(payroll.netSalary)}</span>
      </div>

      {showSignatures && (
        <div className="payslip-signatures" style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          marginTop: '40px',
          paddingTop: '20px',
          borderTop: '2px solid #ddd'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              borderTop: '1px solid #000',
              width: '200px',
              margin: '0 auto',
              paddingTop: '5px',
              marginTop: '50px'
            }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>توقيع المحاسب</p>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              borderTop: '1px solid #000',
              width: '200px',
              margin: '0 auto',
              paddingTop: '5px',
              marginTop: '50px'
            }}>
              <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>توقيع الموظف</p>
            </div>
          </div>
        </div>
      )}

      <div className="payslip-footer">
        <p>تم إنشاء هذه القسيمة بتاريخ: {new Date().toLocaleDateString('ar-IQ')}</p>
        <p style={{ marginTop: '8px' }}>
          القرية الصغيرة للتجارة العامة<br />
          برمجة وتصميم وإدارة: عبدالله عبدالرحمن عبود
        </p>
      </div>
    </div>
  )
}

