'use client'

import { memo } from 'react'

/**
 * Stable employee selection list for the Dashboard.
 * Memoized so it does not re-render its entire list when only the selected value changes.
 * Keeps the "Employee Selection List" visible and resilient when switching between employees.
 */
function EmployeeSelect({ employees, value, onChange, disabled, id }) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          marginBottom: '8px',
          fontWeight: '600',
          color: '#333',
          fontSize: '14px'
        }}
      >
        الموظف (اختياري):
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        aria-label="اختر موظفاً لعرض بياناته"
        style={{
          width: '100%',
          padding: '10px',
          border: '1px solid #ddd',
          borderRadius: '6px',
          fontSize: '14px',
          background: 'white'
        }}
      >
        <option value="">جميع الموظفين</option>
        {employees.map((emp) => (
          <option key={emp.id} value={emp.id}>
            {emp.employeeNumber} - {emp.name}
          </option>
        ))}
      </select>
    </div>
  )
}

export default memo(EmployeeSelect)
