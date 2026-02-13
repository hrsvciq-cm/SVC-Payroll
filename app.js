// Main Application Logic
let currentEditingEmployeeId = null;
let currentPayrollMonth = null;

// Standard month days for salary calculations (fixed at 30 days)
const STANDARD_MONTH_DAYS = 30;

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    // Show loading screen initially
    const loadingScreen = document.getElementById('loadingScreen');
    const container = document.querySelector('.container');
    
    // Hide container initially
    if (container) {
        container.style.opacity = '0';
    }
    
    try {
        // Simulate minimum loading time for better UX
        const minLoadTime = Promise.resolve().then(() => 
            new Promise(resolve => setTimeout(resolve, 1500))
        );
        
        // Initialize app
        const initPromise = Promise.all([
            db.init(),
            new Promise(resolve => setTimeout(resolve, 500)) // Small delay for smooth transition
        ]);
        
        await Promise.all([initPromise, minLoadTime]);
        
        setupEventListeners();
        await loadEmployees();
        await setupTabs();
        setDefaultDates();
        
        // Hide loading screen and show container
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
            }
            if (container) {
                container.style.transition = 'opacity 0.5s ease-in';
                container.style.opacity = '1';
            }
        }, 300);
        
    } catch (error) {
        console.error('Error initializing app:', error);
        
        // Hide loading screen even on error
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }
        if (container) {
            container.style.opacity = '1';
        }
        
        alert('حدث خطأ في تهيئة النظام. يرجى تحديث الصفحة.');
    }
});

// Setup Event Listeners
function setupEventListeners() {
    // Tab Navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const tab = e.target.dataset.tab;
            await switchTab(tab);
        });
    });

    // Employee Management
    document.getElementById('addEmployeeBtn').addEventListener('click', () => openEmployeeModal());
    document.getElementById('employeeForm').addEventListener('submit', handleEmployeeSubmit);
    document.getElementById('cancelEmployeeBtn').addEventListener('click', closeEmployeeModal);
    document.getElementById('employeeSearch').addEventListener('input', filterEmployees);
    
    // Manage status-dependent fields visibility
    document.getElementById('employeeStatus').addEventListener('change', function() {
        const status = this.value;
        const suspensionFields = document.getElementById('suspensionFields');
        const suspensionDateField = document.getElementById('suspensionDateField');
        const terminationDateField = document.getElementById('terminationDateField');
        const statusChangeDate = document.getElementById('employeeStatusChangeDate');
        
        // Set today as default status change date
        const today = new Date().toISOString().split('T')[0];
        statusChangeDate.value = today;
        
        // Show/hide fields based on status
        if (status === 'suspended') {
            suspensionFields.style.display = 'block';
            suspensionDateField.style.display = 'block';
            terminationDateField.style.display = 'none';
            document.getElementById('employeeSuspensionDate').required = true;
            document.getElementById('employeeTerminationDate').required = false;
        } else if (status === 'terminated') {
            suspensionFields.style.display = 'none';
            suspensionDateField.style.display = 'none';
            terminationDateField.style.display = 'block';
            document.getElementById('employeeSuspensionDate').required = false;
            document.getElementById('employeeTerminationDate').required = true;
        } else {
            suspensionFields.style.display = 'none';
            suspensionDateField.style.display = 'none';
            terminationDateField.style.display = 'none';
            document.getElementById('employeeSuspensionDate').required = false;
            document.getElementById('employeeTerminationDate').required = false;
        }
    });

    // Attendance
    document.getElementById('attendanceDate').addEventListener('change', loadTodayAttendance);
    document.getElementById('markPresentBtn').addEventListener('click', markIndividualAttendance);
    document.getElementById('markByDeptBtn').addEventListener('click', markAttendanceByDepartment);
    document.getElementById('markByShiftBtn').addEventListener('click', markAttendanceByShift);
    document.getElementById('markSelectedBtn').addEventListener('click', markSelectedEmployees);
    
    // Setup custom employee select
    setupCustomEmployeeSelect();

    // Payroll
    document.getElementById('payrollMonth').addEventListener('change', (e) => {
        currentPayrollMonth = e.target.value;
    });
    document.getElementById('calculatePayrollBtn').addEventListener('click', calculatePayroll);

    // Reports
    document.getElementById('generateReportBtn').addEventListener('click', generateReport);
    document.getElementById('exportExcelBtn').addEventListener('click', exportReportToExcel);
    document.getElementById('reportType').addEventListener('change', handleReportTypeChange);

    // Dashboard
    document.getElementById('loadDashboardBtn').addEventListener('click', loadDashboard);
    document.getElementById('dashboardViewType').addEventListener('change', handleDashboardViewChange);

    // Backup & Restore
    document.getElementById('backupBtn').addEventListener('click', exportBackup);
    document.getElementById('restoreBtn').addEventListener('click', importBackup);

    // Quick Codes Management (removed from attendance page, but function still available if needed)
    document.getElementById('saveCodeBtn').addEventListener('click', saveQuickCode);
    document.getElementById('closeCodesBtn').addEventListener('click', () => {
        closeModal('quickCodesModal');
    });

    // Multiple Days Attendance
    document.getElementById('markMultipleDaysBtn').addEventListener('click', markMultipleDays);
    document.getElementById('multiDayStartDate').addEventListener('change', updateMultiDayPreview);
    document.getElementById('multiDayEndDate').addEventListener('change', updateMultiDayPreview);
    document.getElementById('excludeWeekends').addEventListener('change', updateMultiDayPreview);

    // Modal Close
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                closeModal(modal.id);
            }
        });
    });
    
    // Close modal when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Salary Slip
    document.getElementById('printSlipBtn').addEventListener('click', printSalarySlip);
    document.getElementById('savePdfBtn').addEventListener('click', saveSalarySlipToPDF);
    document.getElementById('closeSlipBtn').addEventListener('click', () => {
        closeModal('salarySlipModal');
    });
}

// Tab Management
async function setupTabs() {
    await switchTab('dashboard');
}

async function switchTab(tabName) {
    // Get current active tab
    const currentTab = document.querySelector('.tab-content.active');
    const targetTab = document.getElementById(`${tabName}-tab`);
    
    // If switching to the same tab, do nothing
    if (currentTab && currentTab.id === `${tabName}-tab`) {
        return;
    }
    
    // Hide all tabs with fade out animation
    document.querySelectorAll('.tab-content').forEach(tab => {
        if (tab.classList.contains('active')) {
            tab.style.opacity = '0';
            tab.style.transform = 'translateY(-10px)';
            setTimeout(() => {
                tab.classList.remove('active');
                tab.style.opacity = '';
                tab.style.transform = '';
            }, 200);
        } else {
            tab.classList.remove('active');
        }
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab with fade in animation
    setTimeout(() => {
        targetTab.classList.add('active');
        targetTab.style.opacity = '0';
        targetTab.style.transform = 'translateY(10px)';
        requestAnimationFrame(() => {
            targetTab.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
            targetTab.style.opacity = '1';
            targetTab.style.transform = 'translateY(0)';
        });
    }, 200);
    
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Load tab-specific data
    if (tabName === 'dashboard') {
        setupDashboardControls();
        await loadDashboardEmployees();
        await loadDashboard();
    } else if (tabName === 'attendance') {
        await loadEmployeeSelects();
        await loadTodayAttendance();
        await loadMultiDayEmployeeSelect();
    } else if (tabName === 'payroll') {
        await loadPayrollEmployees();
    } else if (tabName === 'reports') {
        await loadReportEmployees();
        await loadReportDepartments();
        handleReportTypeChange();
    }
}

// Set Default Dates
function setDefaultDates() {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    const monthStr = today.toISOString().substring(0, 7);
    
    document.getElementById('attendanceDate').value = dateStr;
    document.getElementById('payrollMonth').value = monthStr;
    document.getElementById('reportMonth').value = monthStr;
    currentPayrollMonth = monthStr;
}

// ==================== Employee Management ====================

async function loadEmployees() {
    try {
        const employees = await db.getAllEmployees();
        
        // Separate active and terminated employees
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get current month start for filtering terminated employees
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        
        // Filter employees: active and recently terminated (within current month)
        const activeEmployees = employees.filter(emp => {
            // Always show active and suspended employees
            if (emp.status === 'active' || emp.status === 'suspended') {
                return true;
            }
            
            // For terminated employees: only show if termination date is in current month or later
            if (emp.status === 'terminated' && emp.terminationDate) {
                const terminationDate = new Date(emp.terminationDate);
                terminationDate.setHours(0, 0, 0, 0);
                // Show if terminated in current month or later (for viewing/editing recently terminated)
                return terminationDate >= currentMonthStart;
            }
            
            return false;
        });
        
        // Terminated employees (terminated before current month)
        const terminatedEmployees = employees.filter(emp => {
            if (emp.status === 'terminated' && emp.terminationDate) {
                const terminationDate = new Date(emp.terminationDate);
                terminationDate.setHours(0, 0, 0, 0);
                // Show terminated employees that were terminated before current month
                return terminationDate < currentMonthStart;
            }
            return false;
        });
        
        displayEmployees(activeEmployees);
        displayTerminatedEmployees(terminatedEmployees);
        updateEmployeeSelects(employees);
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

function displayEmployees(employees) {
    const tbody = document.getElementById('employeesTableBody');
    tbody.innerHTML = '';

    if (employees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">لا يوجد موظفين مسجلين</td></tr>';
        return;
    }

    // Display only active/suspended employees and recently terminated (within current month)
    // عرض فقط الموظفين النشطين/الموقوفين والمنتهية خدماتهم حديثاً (في الشهر الحالي)
    employees.forEach(emp => {
        const row = document.createElement('tr');
        row.setAttribute('data-employee-id', emp.id);
        row.setAttribute('data-employee-name', emp.name.toLowerCase());
        row.setAttribute('data-employee-number', emp.employeeNumber.toLowerCase());
        
        // Determine if employee is terminated (recently terminated - within current month)
        const isRecentlyTerminated = emp.status === 'terminated' && emp.terminationDate;
        const isTerminated = emp.status === 'terminated';
        
        row.innerHTML = `
            <td>${emp.employeeNumber}</td>
            <td>${emp.name}</td>
            <td>${emp.branch || '-'}</td>
            <td>${emp.department}</td>
            <td>${emp.position}</td>
            <td>${formatCurrency(emp.salary)}</td>
            <td>
                <span class="status-badge status-${emp.status}">${emp.status === 'active' ? 'نشط' : emp.status === 'terminated' ? 'منتهية الخدمة' : emp.status === 'suspended' ? 'موقوف' : 'متوقف'}</span>
                ${emp.status === 'suspended' && emp.suspensionType ? `<br><small style="color: #666;">${emp.suspensionType === 'with_salary' ? 'براتب' : 'بدون راتب'}</small>` : ''}
                ${emp.statusChangeDate ? `<br><small style="color: #666;">من: ${new Date(emp.statusChangeDate).toLocaleDateString('ar-SA')}</small>` : ''}
                ${isTerminated && emp.terminationDate ? `<br><small style="color: #666;">تاريخ الإنهاء: ${new Date(emp.terminationDate).toLocaleDateString('ar-SA')}</small>` : ''}
            </td>
            <td>
                <div class="action-buttons">
                    ${isTerminated ? '' : `<button class="btn btn-primary" onclick="editEmployee(${emp.id})">تعديل</button>`}
                    <button class="btn btn-secondary" onclick="toggleEmployeeStatus(${emp.id}, '${emp.status}')">
                        ${isTerminated ? 'تنشيط' : 'تغيير الحالة'}
                    </button>
                    ${isTerminated ? '' : `<button class="btn btn-danger" onclick="deleteEmployee(${emp.id})">حذف</button>`}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function displayTerminatedEmployees(terminatedEmployees) {
    const section = document.getElementById('terminatedEmployeesSection');
    const tbody = document.getElementById('terminatedEmployeesTableBody');
    
    if (terminatedEmployees.length === 0) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    tbody.innerHTML = '';
    
    terminatedEmployees.forEach(emp => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${emp.employeeNumber}</td>
            <td>${emp.name}</td>
            <td>${emp.branch || '-'}</td>
            <td>${emp.department}</td>
            <td>${emp.position}</td>
            <td>${emp.terminationDate ? new Date(emp.terminationDate).toLocaleDateString('ar-SA') : '-'}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="toggleEmployeeStatus(${emp.id}, 'terminated')">تنشيط</button>
                    <button class="btn btn-info" onclick="viewTerminatedEmployeeDetails(${emp.id})">عرض التفاصيل</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function filterEmployees() {
    const searchTerm = document.getElementById('employeeSearch').value.toLowerCase().trim();
    const tbody = document.getElementById('employeesTableBody');
    
    // If search is empty, show only non-terminated or recently terminated employees
    if (!searchTerm) {
        await loadEmployees();
        return;
    }
    
    // If searching, load all employees including old terminated ones
    const allEmployees = await db.getAllEmployees();
    tbody.innerHTML = '';
    
    if (allEmployees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">لا يوجد موظفين مسجلين</td></tr>';
        return;
    }
    
    // Filter employees by search term (name or employee number)
    const matchingEmployees = allEmployees.filter(emp => {
        const nameMatch = emp.name.toLowerCase().includes(searchTerm);
        const numberMatch = emp.employeeNumber.toLowerCase().includes(searchTerm);
        return nameMatch || numberMatch;
    });
    
    if (matchingEmployees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">لا توجد نتائج للبحث</td></tr>';
        return;
    }
    
    // Display matching employees
    matchingEmployees.forEach(emp => {
        const row = document.createElement('tr');
        row.setAttribute('data-employee-id', emp.id);
        row.setAttribute('data-employee-name', emp.name.toLowerCase());
        row.setAttribute('data-employee-number', emp.employeeNumber.toLowerCase());
        row.innerHTML = `
            <td>${emp.employeeNumber}</td>
            <td>${emp.name}</td>
            <td>${emp.branch || '-'}</td>
            <td>${emp.department}</td>
            <td>${emp.position}</td>
            <td>${formatCurrency(emp.salary)}</td>
            <td>
                <span class="status-badge status-${emp.status}">${emp.status === 'active' ? 'نشط' : emp.status === 'terminated' ? 'منتهية الخدمة' : emp.status === 'suspended' ? 'موقوف' : 'متوقف'}</span>
                ${emp.status === 'suspended' && emp.suspensionType ? `<br><small style="color: #666;">${emp.suspensionType === 'with_salary' ? 'براتب' : 'بدون راتب'}</small>` : ''}
                ${emp.statusChangeDate ? `<br><small style="color: #666;">من: ${new Date(emp.statusChangeDate).toLocaleDateString('ar-SA')}</small>` : ''}
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn btn-primary" onclick="editEmployee(${emp.id})">تعديل</button>
                    <button class="btn btn-secondary" onclick="toggleEmployeeStatus(${emp.id}, '${emp.status}')">
                        تغيير الحالة
                    </button>
                    <button class="btn btn-danger" onclick="deleteEmployee(${emp.id})">حذف</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openEmployeeModal(employee = null) {
    const modal = document.getElementById('employeeModal');
    const form = document.getElementById('employeeForm');
    const title = document.getElementById('modalTitle');
    const salaryInput = document.getElementById('employeeSalary');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    
    if (employee) {
        // Check if employee is terminated (terminated before current month)
        const isOldTerminated = employee.status === 'terminated' && employee.terminationDate;
        let isTerminatedBeforeCurrentMonth = false;
        
        if (isOldTerminated) {
            const terminationDate = new Date(employee.terminationDate);
            terminationDate.setHours(0, 0, 0, 0);
            isTerminatedBeforeCurrentMonth = terminationDate < currentMonthStart;
        }
        
        if (isTerminatedBeforeCurrentMonth) {
            title.textContent = 'تفاصيل الموظف المنتهية خدمته - تنشيط';
        } else {
            title.textContent = employee.status === 'terminated' ? 'تعديل بيانات الموظف - تنشيط' : 'تعديل بيانات الموظف';
        }
        
        currentEditingEmployeeId = employee.id;
        document.getElementById('employeeId').value = employee.id;
        document.getElementById('employeeName').value = employee.name;
        document.getElementById('employeeNumber').value = employee.employeeNumber;
        document.getElementById('employeeBranch').value = employee.branch || '';
        document.getElementById('employeeDepartment').value = employee.department;
        document.getElementById('employeePosition').value = employee.position;
        document.getElementById('employeeSalary').value = employee.salary;
        document.getElementById('employeeWorkHours').value = employee.workHours || 8;
        document.getElementById('employeeHireDate').value = employee.hireDate || '';
        document.getElementById('employeeStatus').value = employee.status || 'active';
        document.getElementById('employeeStatusChangeDate').value = employee.statusChangeDate || '';
        document.getElementById('employeeSuspensionType').value = employee.suspensionType || 'without_salary';
        document.getElementById('employeeSuspensionDate').value = employee.suspensionDate || '';
        document.getElementById('employeeTerminationDate').value = employee.terminationDate || '';
        
        // If terminated before current month, disable salary editing and some fields
        // إذا كان منتهي الخدمة قبل الشهر الحالي، تعطيل تعديل الراتب وبعض الحقول
        if (isTerminatedBeforeCurrentMonth) {
            salaryInput.disabled = true;
            salaryInput.style.backgroundColor = '#f0f0f0';
            salaryInput.title = 'لا يمكن تعديل راتب الموظف المنتهية خدمته. يمكنك تنشيطه فقط.';
            
            // Show message
            let messageDiv = document.getElementById('terminatedEmployeeMessage');
            if (!messageDiv) {
                messageDiv = document.createElement('div');
                messageDiv.id = 'terminatedEmployeeMessage';
                messageDiv.style.cssText = 'background: #fff3cd; border: 1px solid #ffc107; padding: 10px; margin: 10px 0; border-radius: 5px; color: #856404;';
                salaryInput.parentNode.insertBefore(messageDiv, salaryInput.nextSibling);
            }
            messageDiv.textContent = 'الموظف منتهي الخدمة. يمكنك تنشيطه فقط (تغيير الحالة إلى "نشط"). لا يمكن تعديل الراتب.';
        } else {
            salaryInput.disabled = false;
            salaryInput.style.backgroundColor = '';
            salaryInput.title = '';
            const messageDiv = document.getElementById('terminatedEmployeeMessage');
            if (messageDiv) {
                messageDiv.remove();
            }
        }
        
        // Trigger status change to show/hide fields
        document.getElementById('employeeStatus').dispatchEvent(new Event('change'));
    } else {
        title.textContent = 'إضافة موظف جديد';
        currentEditingEmployeeId = null;
        form.reset();
        document.getElementById('employeeStatus').value = 'active';
        salaryInput.disabled = false;
        salaryInput.style.backgroundColor = '';
        salaryInput.title = '';
        const messageDiv = document.getElementById('terminatedEmployeeMessage');
        if (messageDiv) {
            messageDiv.remove();
        }
        // Set today as default hire date and status change date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('employeeHireDate').value = today;
        document.getElementById('employeeStatusChangeDate').value = today;
        // Trigger status change to hide conditional fields
        document.getElementById('employeeStatus').dispatchEvent(new Event('change'));
    }
    
    openModal('employeeModal');
}

// Helper functions for modal animations
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.style.display = 'block';
    // Force reflow to ensure display: block is applied
    modal.offsetHeight;
    // Add show class for animation
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Match animation duration
}

function closeEmployeeModal() {
    closeModal('employeeModal');
    currentEditingEmployeeId = null;
}

async function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'جاري الحفظ...';
    
    try {
        // التحقق من صحة البيانات
        const employeeNumber = document.getElementById('employeeNumber').value.trim();
        const name = document.getElementById('employeeName').value.trim();
        
        if (!name || !employeeNumber) {
            alert('يرجى إدخال جميع البيانات المطلوبة');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }

    const hireDate = document.getElementById('employeeHireDate').value;
    const status = document.getElementById('employeeStatus').value;
    const statusChangeDate = document.getElementById('employeeStatusChangeDate').value;
    const suspensionType = document.getElementById('employeeSuspensionType').value;
    const suspensionDate = document.getElementById('employeeSuspensionDate').value;
    const terminationDate = document.getElementById('employeeTerminationDate').value;
    
    // Validate required fields based on status
    if (!hireDate) {
        alert('يرجى إدخال تاريخ التعيين');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }
    
    if (status === 'suspended' && !suspensionDate) {
        alert('يرجى إدخال تاريخ الإيقاف');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }
    
    if (status === 'terminated' && !terminationDate) {
        alert('يرجى إدخال تاريخ آخر يوم عمل');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }
    
    // Validate dates
    const hireDateObj = new Date(hireDate);
    if (status === 'suspended') {
        const suspensionDateObj = new Date(suspensionDate);
        if (suspensionDateObj < hireDateObj) {
            alert('تاريخ الإيقاف لا يمكن أن يكون قبل تاريخ التعيين');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
    }
    
    if (status === 'terminated') {
        const terminationDateObj = new Date(terminationDate);
        if (terminationDateObj < hireDateObj) {
            alert('تاريخ إنهاء الخدمة لا يمكن أن يكون قبل تاريخ التعيين');
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            return;
        }
    }
    
    // Check if editing terminated employee and prevent salary modification
    // التحقق من تعديل موظف منتهي خدمته ومنع تعديل الراتب
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    let originalSalary = null;
    let isOldTerminated = false;
    
    if (currentEditingEmployeeId) {
        const originalEmployee = await db.getEmployee(currentEditingEmployeeId);
        if (originalEmployee) {
            originalSalary = originalEmployee.salary;
            
            // If employee was terminated before current month and status is still terminated, prevent salary modification
            // إذا كان الموظف منتهي خدمته قبل الشهر الحالي والحالة ما زالت منتهية، منع تعديل الراتب
            if (originalEmployee.status === 'terminated' && originalEmployee.terminationDate && status === 'terminated') {
                const terminationDate = new Date(originalEmployee.terminationDate);
                terminationDate.setHours(0, 0, 0, 0);
                
                if (terminationDate < currentMonthStart) {
                    isOldTerminated = true;
                    // Keep original salary - don't allow modification for old terminated employees
                    // الاحتفاظ بالراتب الأصلي - عدم السماح بالتعديل للموظفين المنتهية خدماتهم قديماً
                }
            }
        }
    }
    
    const employee = {
        name: name,
        employeeNumber: employeeNumber,
        branch: document.getElementById('employeeBranch').value.trim(),
        department: document.getElementById('employeeDepartment').value.trim(),
        position: document.getElementById('employeePosition').value.trim(),
        salary: (isOldTerminated && status === 'terminated') ? originalSalary : parseFloat(document.getElementById('employeeSalary').value),
        workHours: parseFloat(document.getElementById('employeeWorkHours').value) || 8,
        hireDate: hireDate,
        status: status,
        statusChangeDate: statusChangeDate || hireDate,
        suspensionType: status === 'suspended' ? suspensionType : null,
        suspensionDate: status === 'suspended' ? suspensionDate : null,
        terminationDate: status === 'terminated' ? terminationDate : null,
        // Clear endDate - we use specific dates based on status
        endDate: null
    };
    
    // If changing from terminated to active, clear termination date and allow salary modification
    // إذا تم تغيير الحالة من منتهي إلى نشط، مسح تاريخ الإنهاء والسماح بتعديل الراتب
    if (currentEditingEmployeeId && status === 'active' && isOldTerminated) {
        employee.terminationDate = null;
        employee.salary = parseFloat(document.getElementById('employeeSalary').value);
    }

    // التحقق من صحة الأرقام
    if (isNaN(employee.salary) || employee.salary <= 0) {
        alert('يرجى إدخال راتب صحيح');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
    }

        if (currentEditingEmployeeId) {
            await db.updateEmployee(currentEditingEmployeeId, employee);
        } else {
            await db.addEmployee(employee);
        }
        
        closeEmployeeModal();
        await loadEmployees();
        // Update all employee selects automatically
        await loadEmployeeSelects();
        await loadMultiDayEmployeeSelect();
        await loadDashboardEmployees();
        await loadReportEmployees();
        alert('تم حفظ بيانات الموظف بنجاح');
    } catch (error) {
        console.error('Error saving employee:', error);
        if (error.name === 'ConstraintError') {
            alert('الرقم الوظيفي موجود مسبقاً. يرجى استخدام رقم وظيفي آخر.');
        } else {
            alert('حدث خطأ في حفظ بيانات الموظف: ' + (error.message || 'خطأ غير معروف'));
        }
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
}

async function editEmployee(id) {
    try {
        const employee = await db.getEmployee(id);
        openEmployeeModal(employee);
    } catch (error) {
        console.error('Error loading employee:', error);
        alert('حدث خطأ في تحميل بيانات الموظف');
    }
}

async function toggleEmployeeStatus(id, currentStatus) {
    try {
        const employee = await db.getEmployee(id);
        // Open modal to change status with proper fields
        openEmployeeModal(employee);
    } catch (error) {
        console.error('Error loading employee:', error);
        alert('حدث خطأ في تحميل بيانات الموظف');
    }
}

async function deleteEmployee(id) {
    try {
        const employee = await db.getEmployee(id);
        if (!employee) {
            alert('الموظف غير موجود');
            return;
        }
        
        // Prevent deleting terminated employees (they are archived)
        // منع حذف الموظفين المنتهية خدماتهم (يتم أرشفتهم)
        if (employee.status === 'terminated') {
            alert('لا يمكن حذف الموظف المنتهية خدمته. يتم أرشفة الموظفين المنتهية خدماتهم للحفاظ على السجلات.');
            return;
        }
        
        const confirmMessage = `هل أنت متأكد من حذف الموظف "${employee.name}" (${employee.employeeNumber})؟\n\nتحذير: سيتم حذف جميع بيانات الموظف بما في ذلك سجلات الدوام والرواتب. لا يمكن التراجع عن هذا الإجراء.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Double confirmation for safety
        if (!confirm('هل أنت متأكد تماماً؟ هذا الإجراء لا يمكن التراجع عنه.')) {
            return;
        }
        
        await db.deleteEmployee(id);
        await loadEmployees();
        alert('تم حذف الموظف بنجاح');
    } catch (error) {
        console.error('Error deleting employee:', error);
        alert('حدث خطأ في حذف الموظف');
    }
}

async function viewTerminatedEmployeeDetails(id) {
    try {
        const employee = await db.getEmployee(id);
        if (!employee) {
            alert('الموظف غير موجود');
            return;
        }
        
        // Get termination month to show last salary slip
        let lastSalarySlipMonth = null;
        if (employee.terminationDate) {
            const terminationDate = new Date(employee.terminationDate);
            lastSalarySlipMonth = `${terminationDate.getFullYear()}-${String(terminationDate.getMonth() + 1).padStart(2, '0')}`;
        }
        
        let details = `
            <h3>تفاصيل الموظف المنتهية خدمته</h3>
            <div style="margin: 20px 0;">
                <p><strong>الاسم:</strong> ${employee.name}</p>
                <p><strong>الرقم الوظيفي:</strong> ${employee.employeeNumber}</p>
                <p><strong>الفرع:</strong> ${employee.branch || '-'}</p>
                <p><strong>القسم:</strong> ${employee.department}</p>
                <p><strong>المسمى الوظيفي:</strong> ${employee.position}</p>
                <p><strong>الراتب الأساسي:</strong> ${formatCurrency(employee.salary)}</p>
                <p><strong>تاريخ التعيين:</strong> ${employee.hireDate ? new Date(employee.hireDate).toLocaleDateString('ar-SA') : '-'}</p>
                <p><strong>تاريخ إنهاء الخدمة:</strong> ${employee.terminationDate ? new Date(employee.terminationDate).toLocaleDateString('ar-SA') : '-'}</p>
            </div>
        `;
        
        if (lastSalarySlipMonth) {
            details += `
                <div style="margin: 20px 0;">
                    <button class="btn btn-success" onclick="showSalarySlip(${employee.id}, '${lastSalarySlipMonth}'); closeModal('terminatedEmployeeDetailsModal');">عرض قسيمة الراتب الأخيرة (${formatMonth(lastSalarySlipMonth)})</button>
                </div>
            `;
        }
        
        details += `
            <div style="margin: 20px 0;">
                <button class="btn btn-secondary" onclick="toggleEmployeeStatus(${employee.id}, 'terminated'); closeModal('terminatedEmployeeDetailsModal');">تنشيط الموظف (إعادة للعمل)</button>
            </div>
        `;
        
        // Create or update modal content
        let modal = document.getElementById('terminatedEmployeeDetailsModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'terminatedEmployeeDetailsModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" onclick="closeModal('terminatedEmployeeDetailsModal')">&times;</span>
                    <div id="terminatedEmployeeDetailsContent"></div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        
        document.getElementById('terminatedEmployeeDetailsContent').innerHTML = details;
        openModal('terminatedEmployeeDetailsModal');
    } catch (error) {
        console.error('Error viewing terminated employee details:', error);
        alert('حدث خطأ في عرض تفاصيل الموظف');
    }
}

function updateEmployeeSelects(employees) {
    // Filter employees based on status and dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const activeEmployees = employees.filter(emp => {
        // Must be active status
        if (emp.status !== 'active') {
            return false;
        }
        
        // Check hire date
        if (emp.hireDate) {
            const hireDate = new Date(emp.hireDate);
            hireDate.setHours(0, 0, 0, 0);
            if (hireDate > today) {
                return false; // Not hired yet
            }
        }
        
        return true;
    });
    
    // Update employee select
    const employeeSelect = document.getElementById('employeeSelect');
    if (employeeSelect) {
        employeeSelect.innerHTML = '<option value="">-- اختر موظف --</option>';
        activeEmployees.forEach(emp => {
            const option = document.createElement('option');
            option.value = emp.id;
            option.textContent = `${emp.name} (${emp.employeeNumber})`;
            employeeSelect.appendChild(option);
        });
    }

    // Update department select
    const departments = [...new Set(activeEmployees.map(emp => emp.department))];
    const deptSelect = document.getElementById('departmentSelect');
    if (deptSelect) {
        deptSelect.innerHTML = '<option value="">-- اختر قسم --</option>';
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept;
            option.textContent = dept;
            deptSelect.appendChild(option);
        });
    }

    // Update custom multi-select dropdown
    updateCustomEmployeeSelect(activeEmployees);
}

// Custom Multi-Select Employee Functions
let selectedEmployeeIds = new Set();

function updateCustomEmployeeSelect(employees) {
    const optionsContainer = document.getElementById('employeeSelectOptions');
    const display = document.getElementById('employeeSelectDisplay');
    const tagsContainer = document.getElementById('selectedEmployeesTags');
    
    if (!optionsContainer || !display) return;
    
    // Clear existing options
    optionsContainer.innerHTML = '';
    
    // Store employees for search
    window.employeeSelectData = employees;
    
    // Create options
    employees.forEach(emp => {
        const option = document.createElement('div');
        option.className = 'custom-multi-select-option';
        option.dataset.employeeId = emp.id;
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.value = emp.id;
        checkbox.id = `emp-${emp.id}`;
        checkbox.checked = selectedEmployeeIds.has(emp.id);
        if (checkbox.checked) {
            option.classList.add('selected');
        }
        
        checkbox.addEventListener('change', (e) => {
            const empId = parseInt(e.target.value);
            if (e.target.checked) {
                selectedEmployeeIds.add(empId);
                option.classList.add('selected');
            } else {
                selectedEmployeeIds.delete(empId);
                option.classList.remove('selected');
            }
            updateSelectedTags(employees);
        });
        
        const label = document.createElement('label');
        label.htmlFor = `emp-${emp.id}`;
        label.textContent = `${emp.name} (${emp.employeeNumber}) - ${emp.branch || ''} - ${emp.department}`;
        label.style.cursor = 'pointer';
        label.style.flex = '1';
        
        option.appendChild(checkbox);
        option.appendChild(label);
        optionsContainer.appendChild(option);
    });
    
    updateSelectedTags(employees);
}

function updateSelectedTags(employees) {
    const display = document.getElementById('employeeSelectDisplay');
    const tagsContainer = document.getElementById('selectedEmployeesTags');
    
    if (!display || !tagsContainer) return;
    
    // Update display text
    const placeholder = display.querySelector('.placeholder');
    if (selectedEmployeeIds.size === 0) {
        placeholder.textContent = 'انقر لاختيار الموظفين...';
        placeholder.style.color = '#999';
    } else {
        placeholder.textContent = `تم اختيار ${selectedEmployeeIds.size} موظف`;
        placeholder.style.color = '#333';
    }
    
    // Update tags
    tagsContainer.innerHTML = '';
    selectedEmployeeIds.forEach(empId => {
        const emp = employees.find(e => e.id === empId);
        if (emp) {
            const tag = document.createElement('span');
            tag.className = 'employee-tag';
            tag.innerHTML = `
                ${emp.name} (${emp.employeeNumber})
                <span class="remove-tag" data-employee-id="${empId}">×</span>
            `;
            
            tag.querySelector('.remove-tag').addEventListener('click', (e) => {
                e.stopPropagation();
                selectedEmployeeIds.delete(empId);
                const checkbox = document.getElementById(`emp-${empId}`);
                if (checkbox) checkbox.checked = false;
                const option = document.querySelector(`[data-employee-id="${empId}"]`);
                if (option) option.classList.remove('selected');
                updateSelectedTags(employees);
            });
            
            tagsContainer.appendChild(tag);
        }
    });
}

function setupCustomEmployeeSelect() {
    const display = document.getElementById('employeeSelectDisplay');
    const dropdown = document.getElementById('employeeSelectDropdown');
    const searchInput = document.getElementById('employeeSearchInput');
    const selectAllBtn = document.getElementById('selectAllEmployees');
    const deselectAllBtn = document.getElementById('deselectAllEmployees');
    
    if (!display || !dropdown) return;
    
    // Toggle dropdown
    display.addEventListener('click', (e) => {
        e.stopPropagation();
        const isActive = display.classList.contains('active');
        
        // Close all other dropdowns
        document.querySelectorAll('.custom-multi-select-display').forEach(d => {
            if (d !== display) {
                d.classList.remove('active');
                d.nextElementSibling?.classList.remove('show');
            }
        });
        
        display.classList.toggle('active');
        dropdown.classList.toggle('show');
        
        if (!isActive && searchInput) {
            setTimeout(() => searchInput.focus(), 100);
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!display.contains(e.target) && !dropdown.contains(e.target)) {
            display.classList.remove('active');
            dropdown.classList.remove('show');
        }
    });
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const options = dropdown.querySelectorAll('.custom-multi-select-option');
            
            options.forEach(option => {
                const text = option.textContent.toLowerCase();
                option.style.display = text.includes(searchTerm) ? 'flex' : 'none';
            });
        });
    }
    
    // Select all
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            if (!window.employeeSelectData) return;
            window.employeeSelectData.forEach(emp => {
                selectedEmployeeIds.add(emp.id);
                const checkbox = document.getElementById(`emp-${emp.id}`);
                if (checkbox) checkbox.checked = true;
                const option = document.querySelector(`[data-employee-id="${emp.id}"]`);
                if (option) option.classList.add('selected');
            });
            updateSelectedTags(window.employeeSelectData);
        });
    }
    
    // Deselect all
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', () => {
            selectedEmployeeIds.clear();
            document.querySelectorAll('#employeeSelectOptions input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            document.querySelectorAll('#employeeSelectOptions .custom-multi-select-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            updateSelectedTags(window.employeeSelectData || []);
        });
    }
}

async function loadMultiDayEmployeeSelect() {
    const allEmployees = await db.getAllEmployees();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Filter active employees
    const employees = allEmployees.filter(emp => {
        if (emp.status !== 'active') return false;
        if (emp.hireDate) {
            const hireDate = new Date(emp.hireDate);
            if (hireDate > today) return false;
        }
        return true;
    });
    
    const select = document.getElementById('multiDayEmployeeSelect');
    select.innerHTML = '<option value="">-- اختر موظف --</option>';
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.employeeNumber})`;
        select.appendChild(option);
    });
}

async function loadEmployeeSelects() {
    const employees = await db.getAllEmployees();
    updateEmployeeSelects(employees);
}

// ==================== Attendance Management ====================

async function loadTodayAttendance() {
    const date = document.getElementById('attendanceDate').value;
    if (!date) return;

    try {
        const attendance = await db.getAttendanceByDate(date);
        const employees = await db.getAllEmployees();
        const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

        const tbody = document.getElementById('todayAttendanceBody');
        tbody.innerHTML = '';

        if (attendance.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" class="empty-state">لا يوجد دوام مسجل لهذا اليوم</td></tr>';
            return;
        }

        attendance.forEach(att => {
            const emp = employeeMap.get(att.employeeId);
            if (!emp) return;

            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${emp.employeeNumber}</td>
                <td>${emp.name}</td>
                <td>${emp.branch || '-'}</td>
                <td>${emp.department}</td>
                <td><span class="status-badge status-${att.status}">${getStatusText(att.status, att.absentType)}</span></td>
                <td>
                    <input type="number" step="0.5" min="0" value="${att.overtimeHours || 0}" 
                           onchange="updateAttendanceOvertime(${att.id}, this.value)" 
                           style="width: 80px; padding: 5px;" placeholder="0">
                </td>
                <td>
                    <input type="number" step="1" min="0" value="${att.timeDelayMinutes || 0}" 
                           onchange="updateAttendanceTimeDelay(${att.id}, this.value)" 
                           style="width: 80px; padding: 5px;" placeholder="0">
                </td>
                <td>
                    <input type="number" step="1" min="0" value="${att.nonTimeDelayMinutes || 0}" 
                           onchange="updateAttendanceNonTimeDelay(${att.id}, this.value)" 
                           style="width: 80px; padding: 5px;" placeholder="0">
                </td>
                <td>
                    <div class="action-buttons">
                        <select onchange="changeAttendanceStatus(${att.id}, this.value)" class="btn">
                            <option value="present" ${att.status === 'present' ? 'selected' : ''}>حاضر</option>
                            <option value="absent" ${att.status === 'absent' && (!att.absentType || att.absentType === 'with_notice') ? 'selected' : ''}>غياب (مع تبليغ)</option>
                            <option value="absent_without_notice" ${att.status === 'absent' && att.absentType === 'without_notice' ? 'selected' : ''}>غياب (بدون تبليغ) - يخصم يومين</option>
                            <option value="leave" ${att.status === 'leave' ? 'selected' : ''}>إجازة</option>
                            <option value="holiday" ${att.status === 'holiday' ? 'selected' : ''}>عطلة</option>
                        </select>
                        <button class="btn btn-danger" onclick="deleteAttendance(${att.id})">حذف</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading attendance:', error);
    }
}

function getStatusText(status, absentType) {
    if (status === 'absent') {
        if (absentType === 'without_notice') {
            return 'غياب بدون تبليغ';
        }
        return 'غياب';
    }
    const statusMap = {
        'present': 'حاضر',
        'leave': 'إجازة',
        'holiday': 'عطلة رسمية'
    };
    return statusMap[status] || status;
}

async function markIndividualAttendance() {
    const employeeId = parseInt(document.getElementById('employeeSelect').value);
    const date = document.getElementById('attendanceDate').value;

    if (!employeeId || !date) {
        alert('يرجى اختيار الموظف والتاريخ');
        return;
    }

    try {
        await markAttendance(employeeId, date, 'present');
        await loadTodayAttendance();
        document.getElementById('employeeSelect').value = '';
        alert('تم تسجيل الدوام بنجاح');
    } catch (error) {
        console.error('Error marking attendance:', error);
        alert('حدث خطأ في تسجيل الدوام');
    }
}

async function markAttendanceByDepartment() {
    const department = document.getElementById('departmentSelect').value;
    const date = document.getElementById('attendanceDate').value;

    if (!department || !date) {
        alert('يرجى اختيار القسم والتاريخ');
        return;
    }

    try {
        const allEmployees = await db.getAllEmployees();
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        
        // Filter active employees who can have attendance on this date
        const employees = allEmployees.filter(emp => {
            if (emp.status !== 'active') return false;
            if (emp.hireDate) {
                const hireDate = new Date(emp.hireDate);
                if (hireDate > dateObj) return false;
            }
            if (emp.suspensionDate) {
                const suspensionDate = new Date(emp.suspensionDate);
                if (dateObj >= suspensionDate) return false;
            }
            if (emp.terminationDate) {
                const terminationDate = new Date(emp.terminationDate);
                if (dateObj > terminationDate) return false;
            }
            return true;
        });
        
        const deptEmployees = employees.filter(emp => emp.department === department);

        if (deptEmployees.length === 0) {
            alert('لا يوجد موظفين نشطين في هذا القسم');
            return;
        }

        let successCount = 0;
        for (const emp of deptEmployees) {
            try {
                await markAttendance(emp.id, date, 'present');
                successCount++;
            } catch (error) {
                console.error(`Error marking attendance for employee ${emp.id}:`, error);
            }
        }

        await loadTodayAttendance();
        alert(`تم تسجيل دوام ${successCount} من ${deptEmployees.length} موظف بنجاح`);
    } catch (error) {
        console.error('Error marking attendance by department:', error);
        alert('حدث خطأ في تسجيل الدوام');
    }
}

async function markAttendanceByShift() {
    const shift = document.getElementById('shiftInput').value;
    const date = document.getElementById('attendanceDate').value;

    if (!shift || !date) {
        alert('يرجى إدخال اسم الشفت والتاريخ');
        return;
    }

    // For now, we'll use shift as a quick code
    // In a real system, you'd have a shift-employee mapping
    alert('يرجى استخدام نظام الرموز السريعة لتسجيل الشفتات');
}

async function markSelectedEmployees() {
    const date = document.getElementById('attendanceDate').value;
    
    if (selectedEmployeeIds.size === 0 || !date) {
        alert('يرجى اختيار موظفين على الأقل والتاريخ');
        return;
    }

    try {
        let successCount = 0;
        for (const employeeId of selectedEmployeeIds) {
            try {
                await markAttendance(employeeId, date, 'present');
                successCount++;
            } catch (error) {
                console.error(`Error marking attendance for employee ${employeeId}:`, error);
            }
        }

        // Clear selection
        selectedEmployeeIds.clear();
        document.querySelectorAll('#employeeSelectOptions input[type="checkbox"]').forEach(cb => {
            cb.checked = false;
        });
        document.querySelectorAll('#employeeSelectOptions .custom-multi-select-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        if (window.employeeSelectData) {
            updateSelectedTags(window.employeeSelectData);
        }
        
        await loadTodayAttendance();
        alert(`تم تسجيل دوام ${successCount} موظف بنجاح`);
    } catch (error) {
        console.error('Error marking selected employees:', error);
        alert('حدث خطأ في تسجيل الدوام');
    }
}

async function markAttendance(employeeId, date, status = 'present') {
    // Get employee data to validate dates
    const employee = await db.getEmployee(employeeId);
    if (!employee) {
        throw new Error('الموظف غير موجود');
    }
    
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);
    
    // Check if date is before hire date
    if (employee.hireDate) {
        const hireDate = new Date(employee.hireDate);
        hireDate.setHours(0, 0, 0, 0);
        if (attendanceDate < hireDate) {
            throw new Error(`لا يمكن تسجيل الدوام قبل تاريخ التعيين (${new Date(employee.hireDate).toLocaleDateString('ar-SA')})`);
        }
    }
    
    // Check if employee is suspended or terminated
    // Day of suspension/termination is the last working day (included in salary but no attendance allowed)
    // Day after suspension/termination: no attendance and no salary
    if (employee.status === 'suspended' && employee.suspensionDate) {
        const suspensionDate = new Date(employee.suspensionDate);
        suspensionDate.setHours(0, 0, 0, 0);
        // Block attendance on suspension date and after (suspension date is last working day, no attendance allowed)
        if (attendanceDate >= suspensionDate) {
            throw new Error(`لا يمكن تسجيل الدوام في تاريخ الإيقاف أو بعده (تاريخ الإيقاف: ${new Date(employee.suspensionDate).toLocaleDateString('ar-SA')} - آخر يوم عمل)`);
        }
    }
    
    if (employee.status === 'terminated' && employee.terminationDate) {
        const terminationDate = new Date(employee.terminationDate);
        terminationDate.setHours(0, 0, 0, 0);
        // Block attendance on termination date and after (termination date is last working day, no attendance allowed)
        if (attendanceDate >= terminationDate) {
            throw new Error(`لا يمكن تسجيل الدوام في تاريخ إنهاء الخدمة أو بعده (تاريخ إنهاء الخدمة: ${new Date(employee.terminationDate).toLocaleDateString('ar-SA')} - آخر يوم عمل)`);
        }
    }
    
    // Check if attendance already exists
    const existing = await db.getAttendanceByEmployeeAndDate(employeeId, date);
    
    if (existing) {
        // Update existing attendance
        existing.status = status;
        // Initialize overtime and delays if not exists
        if (existing.overtimeHours === undefined) existing.overtimeHours = 0;
        if (existing.timeDelayMinutes === undefined) existing.timeDelayMinutes = 0;
        if (existing.nonTimeDelayMinutes === undefined) existing.nonTimeDelayMinutes = 0;
        await db.updateAttendance(existing.id, existing);
    } else {
        // Create new attendance
        await db.addAttendance({
            employeeId: employeeId,
            date: date,
            status: status,
            overtimeHours: 0,
            timeDelayMinutes: 0,
            nonTimeDelayMinutes: 0,
            timestamp: new Date().toISOString()
        });
    }
}

async function changeAttendanceStatus(attendanceId, newStatus) {
    try {
        // Get attendance record first
        const transaction = db.db.transaction(['attendance'], 'readonly');
        const store = transaction.objectStore('attendance');
        const getRequest = store.get(attendanceId);
        
        const attendance = await new Promise((resolve, reject) => {
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject(getRequest.error);
        });
        
        if (attendance) {
            // Handle absent without notice
            if (newStatus === 'absent_without_notice') {
                attendance.status = 'absent';
                attendance.absentType = 'without_notice';
            } else if (newStatus === 'absent') {
                attendance.status = 'absent';
                attendance.absentType = 'with_notice';
            } else {
                attendance.status = newStatus;
                attendance.absentType = null;
            }
            
            // Update attendance
            await db.updateAttendance(attendanceId, attendance);
            await loadTodayAttendance();
        } else {
            alert('لم يتم العثور على تسجيل الدوام');
        }
    } catch (error) {
        console.error('Error updating attendance status:', error);
        alert('حدث خطأ في تحديث حالة الدوام: ' + (error.message || 'خطأ غير معروف'));
    }
}

async function updateAttendanceOvertime(attendanceId, overtimeHours) {
    try {
        const attendance = await db.getAttendance(attendanceId);
        if (attendance) {
            attendance.overtimeHours = parseFloat(overtimeHours) || 0;
            await db.updateAttendance(attendanceId, attendance);
        }
    } catch (error) {
        console.error('Error updating overtime:', error);
    }
}

async function updateAttendanceTimeDelay(attendanceId, timeDelayMinutes) {
    try {
        const attendance = await db.getAttendance(attendanceId);
        if (attendance) {
            attendance.timeDelayMinutes = parseInt(timeDelayMinutes) || 0;
            await db.updateAttendance(attendanceId, attendance);
        }
    } catch (error) {
        console.error('Error updating time delay:', error);
    }
}

async function updateAttendanceNonTimeDelay(attendanceId, nonTimeDelayMinutes) {
    try {
        const attendance = await db.getAttendance(attendanceId);
        if (attendance) {
            attendance.nonTimeDelayMinutes = parseInt(nonTimeDelayMinutes) || 0;
            await db.updateAttendance(attendanceId, attendance);
        }
    } catch (error) {
        console.error('Error updating non-time delay:', error);
    }
}

async function deleteAttendance(attendanceId) {
    if (!confirm('هل أنت متأكد من حذف تسجيل الدوام؟')) return;

    try {
        await db.deleteAttendance(attendanceId);
        await loadTodayAttendance();
        alert('تم حذف تسجيل الدوام بنجاح');
    } catch (error) {
        console.error('Error deleting attendance:', error);
        alert('حدث خطأ في حذف تسجيل الدوام');
    }
}

// ==================== Payroll Management ====================

async function calculatePayroll() {
    const month = document.getElementById('payrollMonth').value;
    if (!month) {
        alert('يرجى اختيار الشهر');
        return;
    }

    try {
        // Get all employees (including terminated) to calculate payroll for the selected month
        const allEmployees = await db.getAllEmployees();
        const [year, monthNum] = month.split('-');
        const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
        const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0);
        
        // Filter employees: include employees who worked during this month
        // تصفية الموظفين: إدراج الموظفين الذين عملوا خلال هذا الشهر
        const employees = allEmployees.filter(emp => {
            // Check if employee was hired before or during this month
            // التحقق من تعيين الموظف قبل أو خلال هذا الشهر
            if (emp.hireDate) {
                const hireDate = new Date(emp.hireDate);
                if (hireDate > monthEnd) {
                    return false; // Not hired yet - لم يتم التعيين بعد
                }
            }
            
            // Check termination date - exclude terminated employees after termination month
            // التحقق من تاريخ الإنهاء - استبعاد الموظفين المنتهية خدماتهم بعد شهر الإنهاء
            if (emp.status === 'terminated' && emp.terminationDate) {
                const terminationDate = new Date(emp.terminationDate);
                terminationDate.setHours(0, 0, 0, 0);
                
                // Get termination month
                const terminationMonth = `${terminationDate.getFullYear()}-${String(terminationDate.getMonth() + 1).padStart(2, '0')}`;
                
                // Only include if this month is the termination month or before
                // إدراج فقط إذا كان هذا الشهر هو شهر الإنهاء أو قبله
                if (month < terminationMonth) {
                    // Employee was terminated in a future month relative to selected month
                    // الموظف سينتهي خدمته في شهر لاحق بالنسبة للشهر المحدد
                    return false;
                } else if (month > terminationMonth) {
                    // Employee was terminated before this month - exclude from payroll
                    // الموظف انتهت خدمته قبل هذا الشهر - استبعاد من الرواتب
                    return false;
                }
                // If month === terminationMonth, include (to calculate final salary)
                // إذا كان الشهر === شهر الإنهاء، إدراج (لحساب الراتب النهائي)
            }
            
            return true;
        });
        
        const payrollData = [];

        for (const emp of employees) {
            // Get attendance for the month
            let attendance = await db.getAttendanceByEmployeeAndMonth(emp.id, month);
            
            // Determine effective start and end dates for salary calculation
            const hireDate = emp.hireDate ? new Date(emp.hireDate) : monthStart;
            const effectiveStart = hireDate > monthStart ? hireDate : monthStart;
            
            let effectiveEnd = monthEnd;
            let suspensionDate = null;
            let suspensionType = null;
            
            // Check suspension
            if (emp.status === 'suspended' && emp.suspensionDate) {
                suspensionDate = new Date(emp.suspensionDate);
                suspensionType = emp.suspensionType || 'without_salary';
                if (suspensionDate >= monthStart && suspensionDate <= monthEnd) {
                    // Suspension happened during this month
                    // Day of suspension is INCLUDED in salary calculation (last working day)
                    effectiveEnd = new Date(suspensionDate);
                    // effectiveEnd remains as suspensionDate (inclusive)
                } else if (suspensionDate < monthStart) {
                    // Suspended before this month
                    if (suspensionType === 'without_salary') {
                        continue; // Skip if suspended without salary before this month
                    }
                    // If with salary, continue but no attendance expected
                }
            }
            
            // Check termination
            if (emp.status === 'terminated' && emp.terminationDate) {
                const terminationDate = new Date(emp.terminationDate);
                if (terminationDate >= monthStart && terminationDate <= monthEnd) {
                    // Day of termination is INCLUDED in salary calculation (last working day)
                    effectiveEnd = terminationDate;
                    // effectiveEnd remains as terminationDate (inclusive)
                } else if (terminationDate < monthStart) {
                    continue; // Terminated before this month
                }
            }
            
            // Filter attendance based on effective dates
            // This ensures we only count attendance within the valid period (up to termination/suspension date)
            attendance = attendance.filter(att => {
                const attDate = new Date(att.date);
                return attDate >= effectiveStart && attDate <= effectiveEnd;
            });
            
            // Filter out attendance before hire date
            if (emp.hireDate) {
                const hireDateObj = new Date(emp.hireDate);
                attendance = attendance.filter(att => {
                    const attDate = new Date(att.date);
                    return attDate >= hireDateObj;
                });
            }
            
            // Count attendance days (only within effective period)
            // For terminated employees, only present days count towards salary
            const presentDays = attendance.filter(att => att.status === 'present').length;
            const absentDaysWithNotice = attendance.filter(att => att.status === 'absent' && (!att.absentType || att.absentType === 'with_notice')).length;
            const absentDaysWithoutNotice = attendance.filter(att => att.status === 'absent' && att.absentType === 'without_notice').length;
            const leaveDays = attendance.filter(att => att.status === 'leave').length;
            // Holidays are already filtered by effectiveEnd, so they won't include holidays after termination date
            const holidayDays = attendance.filter(att => att.status === 'holiday').length;

            // Note: Salary calculations always use STANDARD_MONTH_DAYS (30 days) regardless of actual month length
            // This ensures consistent calculations for all months (28, 30, or 31 days)
            
            // Calculate daily salary - always use standard 30 days for salary calculations
            // This ensures consistent calculations regardless of actual month length (28, 30, or 31 days)
            // الراتب اليومي = الراتب الأساسي ÷ 30 (ثابت لجميع الشهور)
            const dailySalary = emp.salary / STANDARD_MONTH_DAYS;
            
            // Calculate base salary based on employee status
            let baseSalary = 0;
            
            // Special handling for terminated employees
            if (emp.status === 'terminated' && emp.terminationDate) {
                // للموظفين المنتهية خدمتهم:
                // تاريخ إنهاء الخدمة = آخر يوم عمل (يُحتسب ضمن الراتب)
                // عدد الأيام المستحقة = من بداية الشهر حتى تاريخ الإنهاء (شامل)
                // الراتب المستحق = الراتب اليومي × (عدد الأيام المستحقة - أيام الغياب)
                
                // Use effectiveEnd which is already set to termination date (if within month) or monthEnd
                const effectiveEndDate = new Date(effectiveEnd);
                effectiveEndDate.setHours(23, 59, 59, 999); // End of day
                
                // Calculate days from month start to effective end (inclusive)
                // This includes the termination date as the last working day
                const daysFromStartToTermination = Math.floor((effectiveEndDate - monthStart) / (1000 * 60 * 60 * 24)) + 1;
                
                // Calculate absent days within the period (from start to termination)
                const totalAbsentDays = absentDaysWithNotice + (absentDaysWithoutNotice * 2);
                
                // Base salary = daily salary × (days due - absent days)
                // أيام الغياب تُخصم من الأيام المستحقة
                baseSalary = dailySalary * (daysFromStartToTermination - totalAbsentDays);
                
                // Ensure base salary is not negative
                if (baseSalary < 0) baseSalary = 0;
            }
            // If suspended with salary, calculate proportional salary
            else if (emp.status === 'suspended' && suspensionType === 'with_salary' && suspensionDate) {
                const suspensionDateObj = new Date(suspensionDate);
                if (suspensionDateObj >= monthStart && suspensionDateObj <= monthEnd) {
                    // Calculate proportional salary: (days worked / standard 30 days) * full salary
                    const daysWorked = Math.floor((suspensionDateObj - monthStart) / (1000 * 60 * 60 * 24)) + 1;
                    baseSalary = (daysWorked / STANDARD_MONTH_DAYS) * emp.salary;
                    
                    // Still deduct absent days from worked period
                    const totalAbsentDays = absentDaysWithNotice + (absentDaysWithoutNotice * 2);
                    const dailySalaryForSuspension = emp.salary / STANDARD_MONTH_DAYS;
                    baseSalary = baseSalary - (dailySalaryForSuspension * totalAbsentDays);
                } else if (suspensionDateObj < monthStart) {
                    // Suspended before this month but with salary - full salary
                    baseSalary = emp.salary;
                }
            } else if (emp.status === 'suspended' && suspensionType === 'without_salary') {
                // Suspended without salary - calculate only for days up to and including suspension date
                // Suspension date is the last working day (included in salary)
                // Days after suspension date: no salary
                const totalAbsentDays = absentDaysWithNotice + (absentDaysWithoutNotice * 2);
                const dailySalaryForSuspension = emp.salary / STANDARD_MONTH_DAYS;
                baseSalary = emp.salary - (dailySalaryForSuspension * totalAbsentDays);
                
                // Adjust for suspension period (no salary for days AFTER suspension date)
                if (suspensionDate) {
                    const suspensionDateObj = new Date(suspensionDate);
                    if (suspensionDateObj >= monthStart && suspensionDateObj <= monthEnd) {
                        // Days after suspension date (not including suspension date itself)
                        const daysAfterSuspension = STANDARD_MONTH_DAYS - Math.floor((suspensionDateObj - monthStart) / (1000 * 60 * 60 * 24)) - 1;
                        if (daysAfterSuspension > 0) {
                            baseSalary = baseSalary - (dailySalaryForSuspension * daysAfterSuspension);
                        }
                    }
                }
            } else {
                // Normal calculation: Full salary minus absent days
                // الحساب العادي: الراتب الكامل - خصم أيام الغياب
                // الغياب بدون تبليغ: يخصم يومين لكل يوم
                // الغياب مع تبليغ: يخصم يوم واحد لكل يوم
                // جميع الحسابات تعتمد على 30 يوم ثابت
                
                // Check if employee started mid-month
                // التحقق من بدء الموظف في منتصف الشهر
                if (emp.hireDate && effectiveStart > monthStart) {
                    // Employee started mid-month: calculate proportional salary
                    // الموظف بدأ في منتصف الشهر: حساب الراتب النسبي
                    const hireDateObj = new Date(emp.hireDate);
                    const daysFromHireToMonthEnd = Math.floor((monthEnd - hireDateObj) / (1000 * 60 * 60 * 24)) + 1;
                    // Calculate proportional salary: (days from hire date / 30) * full salary
                    // حساب الراتب النسبي: (الأيام من تاريخ التعيين / 30) × الراتب الكامل
                    baseSalary = (daysFromHireToMonthEnd / STANDARD_MONTH_DAYS) * emp.salary;
                    
                    // Subtract absent days from proportional salary
                    // خصم أيام الغياب من الراتب النسبي
                    const totalAbsentDays = absentDaysWithNotice + (absentDaysWithoutNotice * 2);
                    baseSalary = baseSalary - (dailySalary * totalAbsentDays);
                } else {
                    // Employee started at beginning of month or before: Full salary minus absent days
                    // الموظف بدأ في بداية الشهر أو قبله: الراتب الكامل - خصم أيام الغياب
                    const totalAbsentDays = absentDaysWithNotice + (absentDaysWithoutNotice * 2);
                    baseSalary = emp.salary - (dailySalary * totalAbsentDays);
                }
            }

            // Calculate overtime, time delays, and non-time delays
            // Always use standard 30 days for hourly salary calculation
            const workHours = emp.workHours || 8;
            const hourlySalary = emp.salary / (STANDARD_MONTH_DAYS * workHours);
            const minuteSalary = hourlySalary / 60;
            
            let totalOvertimeHours = 0;
            let totalTimeDelayMinutes = 0;
            let totalNonTimeDelayMinutes = 0;
            
            attendance.forEach(att => {
                if (att.status === 'present') {
                    totalOvertimeHours += (att.overtimeHours || 0);
                    totalTimeDelayMinutes += (att.timeDelayMinutes || 0);
                    totalNonTimeDelayMinutes += (att.nonTimeDelayMinutes || 0);
                }
            });
            
            // Calculate overtime pay (same rate as regular hours)
            const overtimePay = totalOvertimeHours * hourlySalary;
            
            // Calculate time delay deduction (1 minute = 1 minute deduction)
            const timeDelayDeduction = totalTimeDelayMinutes * minuteSalary;
            
            // Calculate non-time delay deduction (1 minute = 2 minutes deduction)
            const nonTimeDelayDeduction = (totalNonTimeDelayMinutes * 2) * minuteSalary;
            
            // Adjust base salary with overtime and delays
            baseSalary = baseSalary + overtimePay - timeDelayDeduction - nonTimeDelayDeduction;

            // Get deductions, bonuses, and advances
            const deductions = await db.getDeductionsByEmployeeAndMonth(emp.id, month);
            let totalDeductions = 0;
            let totalBonuses = 0;
            let totalAdvances = 0;

            deductions.forEach(ded => {
                if (ded.type === 'deduction') {
                    totalDeductions += ded.amount;
                } else if (ded.type === 'bonus') {
                    totalBonuses += ded.amount;
                } else if (ded.type === 'advance') {
                    totalAdvances += ded.amount;
                }
            });

            // Calculate net salary
            const netSalary = baseSalary + totalBonuses - totalDeductions - totalAdvances;

            // Calculate days due (for terminated/suspended employees: from start to effective end inclusive)
            // عدد الأيام المستحقة: من بداية الشهر حتى آخر يوم عمل (شامل)
            // For normal employees: always 30 days (STANDARD_MONTH_DAYS)
            // For terminated/suspended: calculate from start to termination/suspension date
            // For employees who started mid-month: calculate from hire date to end of month
            let daysDue = STANDARD_MONTH_DAYS;
            let lastWorkingDay = null;
            
            // Calculate different daysDue if employee is terminated, suspended, or started mid-month
            if ((emp.status === 'terminated' && emp.terminationDate) || 
                (emp.status === 'suspended' && suspensionDate)) {
                const effectiveEndDate = new Date(effectiveEnd);
                effectiveEndDate.setHours(23, 59, 59, 999);
                daysDue = Math.floor((effectiveEndDate - monthStart) / (1000 * 60 * 60 * 24)) + 1;
                
                // Set last working day only if termination/suspension is within the month
                if (emp.status === 'terminated' && emp.terminationDate) {
                    const terminationDateObj = new Date(emp.terminationDate);
                    if (terminationDateObj >= monthStart && terminationDateObj <= monthEnd) {
                        lastWorkingDay = emp.terminationDate;
                    }
                } else if (emp.status === 'suspended' && suspensionDate) {
                    const suspensionDateObj = new Date(suspensionDate);
                    if (suspensionDateObj >= monthStart && suspensionDateObj <= monthEnd) {
                        lastWorkingDay = emp.suspensionDate;
                    }
                }
            } else if (emp.hireDate && effectiveStart > monthStart) {
                // Employee started mid-month: calculate days from hire date to end of month
                // الموظف بدأ في منتصف الشهر: حساب الأيام من تاريخ التعيين حتى نهاية الشهر
                const hireDateObj = new Date(emp.hireDate);
                const monthEndDate = new Date(monthEnd);
                monthEndDate.setHours(23, 59, 59, 999);
                daysDue = Math.floor((monthEndDate - hireDateObj) / (1000 * 60 * 60 * 24)) + 1;
            }

            const payroll = {
                employeeId: emp.id,
                month: month,
                presentDays: presentDays,
                absentDays: absentDaysWithNotice + absentDaysWithoutNotice,
                absentDaysWithNotice: absentDaysWithNotice,
                absentDaysWithoutNotice: absentDaysWithoutNotice,
                leaveDays: leaveDays,
                holidayDays: holidayDays,
                daysDue: daysDue, // عدد الأيام المستحقة (من بداية الشهر حتى آخر يوم عمل)
                lastWorkingDay: lastWorkingDay, // آخر يوم عمل (تاريخ الإنهاء أو الإيقاف)
                overtimeHours: totalOvertimeHours,
                timeDelayMinutes: totalTimeDelayMinutes,
                nonTimeDelayMinutes: totalNonTimeDelayMinutes,
                overtimePay: overtimePay,
                timeDelayDeduction: timeDelayDeduction,
                nonTimeDelayDeduction: nonTimeDelayDeduction,
                baseSalary: baseSalary,
                totalDeductions: totalDeductions,
                totalBonuses: totalBonuses,
                totalAdvances: totalAdvances,
                netSalary: netSalary
            };

            await db.savePayroll(payroll);
            payrollData.push({ employee: emp, payroll });
        }

        displayPayroll(payrollData);
        alert('تم حساب الرواتب بنجاح');
    } catch (error) {
        console.error('Error calculating payroll:', error);
        alert('حدث خطأ في حساب الرواتب');
    }
}

async function loadPayrollEmployees() {
    const month = document.getElementById('payrollMonth').value || currentPayrollMonth;
    if (!month) return;

    try {
        const payrollRecords = await db.getPayrollByMonth(month);
        const employees = await db.getAllEmployees();
        const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

        const payrollData = payrollRecords.map(pr => ({
            employee: employeeMap.get(pr.employeeId),
            payroll: pr
        })).filter(pd => pd.employee);

        displayPayroll(payrollData);
    } catch (error) {
        console.error('Error loading payroll:', error);
    }
}

function displayPayroll(payrollData) {
    const tbody = document.getElementById('payrollTableBody');
    tbody.innerHTML = '';

    if (payrollData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">لا توجد بيانات رواتب لهذا الشهر</td></tr>';
        return;
    }

    // Filter out terminated employees that were terminated before the selected month
    // تصفية الموظفين المنتهية خدماتهم الذين انتهت خدماتهم قبل الشهر المحدد
    const month = document.getElementById('payrollMonth').value;
    const filteredPayrollData = payrollData.filter(({ employee, payroll }) => {
        // If employee is terminated, check if termination date is before selected month
        // إذا كان الموظف منتهي خدمته، التحقق من أن تاريخ الإنهاء قبل الشهر المحدد
        if (employee.status === 'terminated' && employee.terminationDate && month) {
            const terminationDate = new Date(employee.terminationDate);
            const terminationMonth = `${terminationDate.getFullYear()}-${String(terminationDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Only show if this month is the termination month (for final salary slip)
            // عرض فقط إذا كان هذا الشهر هو شهر الإنهاء (لقسيمة الراتب النهائية)
            return month === terminationMonth;
        }
        
        return true;
    });

    if (filteredPayrollData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">لا توجد بيانات رواتب لهذا الشهر</td></tr>';
        return;
    }

    filteredPayrollData.forEach(({ employee, payroll }) => {
        const isTerminatedThisMonth = employee.status === 'terminated' && employee.terminationDate && month;
        let terminationMonth = null;
        if (isTerminatedThisMonth) {
            const terminationDate = new Date(employee.terminationDate);
            terminationMonth = `${terminationDate.getFullYear()}-${String(terminationDate.getMonth() + 1).padStart(2, '0')}`;
        }
        const isFinalPayroll = isTerminatedThisMonth && month === terminationMonth;
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.employeeNumber}</td>
            <td>${employee.name}</td>
            <td>${payroll.presentDays}</td>
            <td>${formatCurrency(employee.salary)}</td>
            <td>${formatCurrency(payroll.baseSalary)}</td>
            <td>${formatCurrency(payroll.totalDeductions)}</td>
            <td>${formatCurrency(payroll.totalBonuses)}</td>
            <td>${formatCurrency(payroll.totalAdvances)}</td>
            <td><strong>${formatCurrency(payroll.netSalary)}</strong></td>
            <td>
                <div class="action-buttons">
                    ${isFinalPayroll ? '' : `<button class="btn btn-primary" onclick="addDeduction(${employee.id}, '${payroll.month}')">خصم/إضافة</button>`}
                    ${isFinalPayroll ? '' : `<button class="btn btn-info" onclick="manageDeductions(${employee.id}, '${payroll.month}')">إدارة</button>`}
                    <button class="btn btn-success" onclick="showSalarySlip(${employee.id}, '${payroll.month}')">قسيمة راتب</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function addDeduction(employeeId, month) {
    const modal = document.getElementById('deductionModal');
    document.getElementById('deductionId').value = '';
    document.getElementById('deductionEmployeeId').value = employeeId;
    document.getElementById('deductionMonth').value = month;
    document.getElementById('deductionModalTitle').textContent = 'إضافة خصم / إضافة';
    document.getElementById('deductionForm').reset();
    openModal('deductionModal');
}

document.getElementById('deductionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const deductionId = document.getElementById('deductionId').value;
    const employeeId = parseInt(document.getElementById('deductionEmployeeId').value);
    const month = document.getElementById('deductionMonth').value;
    const type = document.getElementById('deductionType').value;
    const amount = parseFloat(document.getElementById('deductionAmount').value);
    const description = document.getElementById('deductionDescription').value;

    if (!amount || amount <= 0) {
        alert('يرجى إدخال مبلغ صحيح');
        return;
    }

    try {
        if (deductionId) {
            // Update existing deduction
            const deduction = await db.getDeduction(parseInt(deductionId));
            if (deduction) {
                deduction.type = type;
                deduction.amount = amount;
                deduction.description = description;
                await db.updateDeduction(parseInt(deductionId), deduction);
                alert('تم تحديث العملية بنجاح');
            }
        } else {
            // Add new deduction
            await db.addDeduction({
                employeeId: employeeId,
                month: month,
                type: type,
                amount: amount,
                description: description,
                date: new Date().toISOString()
            });
            alert('تم إضافة العملية بنجاح');
        }

        closeModal('deductionModal');
        
        // Recalculate and refresh payroll automatically
        await calculatePayroll();
    } catch (error) {
        console.error('Error saving deduction:', error);
        alert('حدث خطأ في حفظ العملية');
    }
});

document.getElementById('cancelDeductionBtn').addEventListener('click', () => {
    closeModal('deductionModal');
});

document.getElementById('closeDeductionManagementBtn').addEventListener('click', () => {
    closeModal('deductionManagementModal');
});

async function manageDeductions(employeeId, month) {
    try {
        const deductions = await db.getDeductionsByEmployeeAndMonth(employeeId, month);
        const employee = await db.getEmployee(employeeId);
        
        const modal = document.getElementById('deductionManagementModal');
        const listDiv = document.getElementById('deductionsList');
        
        if (deductions.length === 0) {
            listDiv.innerHTML = '<p class="empty-state">لا توجد خصومات أو إضافات مسجلة</p>';
        } else {
            let html = '<table><thead><tr><th>النوع</th><th>الوصف</th><th>المبلغ</th><th>التاريخ</th><th>الإجراءات</th></tr></thead><tbody>';
            
            deductions.forEach(ded => {
                const typeText = ded.type === 'deduction' ? 'خصم' : ded.type === 'bonus' ? 'مكافأة' : 'سلف';
                const typeClass = ded.type === 'deduction' ? 'danger' : ded.type === 'bonus' ? 'success' : 'warning';
                const date = new Date(ded.date).toLocaleDateString('ar-SA');
                
                html += `
                    <tr>
                        <td><span class="status-badge status-${typeClass}">${typeText}</span></td>
                        <td>${ded.description || '-'}</td>
                        <td>${formatCurrency(ded.amount)}</td>
                        <td>${date}</td>
                        <td>
                            <button class="btn btn-primary" onclick="editDeduction(${ded.id}, ${employeeId}, '${month}')">تعديل</button>
                            <button class="btn btn-danger" onclick="deleteDeduction(${ded.id}, ${employeeId}, '${month}')">حذف</button>
                        </td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            listDiv.innerHTML = html;
        }
        
        openModal('deductionManagementModal');
    } catch (error) {
        console.error('Error loading deductions:', error);
        alert('حدث خطأ في تحميل البيانات');
    }
}

async function editDeduction(deductionId, employeeId, month) {
    try {
        const deduction = await db.getDeduction(deductionId);
        if (!deduction) {
            alert('لم يتم العثور على العملية');
            return;
        }
        
        const modal = document.getElementById('deductionModal');
        document.getElementById('deductionId').value = deductionId;
        document.getElementById('deductionEmployeeId').value = employeeId;
        document.getElementById('deductionMonth').value = month;
        document.getElementById('deductionType').value = deduction.type;
        document.getElementById('deductionAmount').value = deduction.amount;
        document.getElementById('deductionDescription').value = deduction.description || '';
        document.getElementById('deductionModalTitle').textContent = 'تعديل خصم / إضافة';
        
        // Close management modal
        closeModal('deductionManagementModal');
        
        // Open edit modal
        openModal('deductionModal');
    } catch (error) {
        console.error('Error loading deduction:', error);
        alert('حدث خطأ في تحميل البيانات');
    }
}

async function deleteDeduction(deductionId, employeeId, month) {
    if (!confirm('هل أنت متأكد من حذف هذه العملية؟')) {
        return;
    }
    
    try {
        await db.deleteDeduction(deductionId);
        alert('تم حذف العملية بنجاح');
        
        // Refresh the management modal
        await manageDeductions(employeeId, month);
        
        // Recalculate and refresh payroll automatically
        await calculatePayroll();
    } catch (error) {
        console.error('Error deleting deduction:', error);
        alert('حدث خطأ في حذف العملية');
    }
}

async function showSalarySlip(employeeId, month) {
    try {
        const employee = await db.getEmployee(employeeId);
        const payroll = await db.getPayrollByEmployeeAndMonth(employeeId, month);
        const deductions = await db.getDeductionsByEmployeeAndMonth(employeeId, month);

        if (!payroll) {
            alert('لا توجد بيانات راتب لهذا الموظف في هذا الشهر');
            return;
        }
        
        // Check if employee is terminated and if month is after termination month
        // التحقق من أن الموظف منتهي خدمته وإذا كان الشهر بعد شهر الإنهاء
        if (employee.status === 'terminated' && employee.terminationDate) {
            const terminationDate = new Date(employee.terminationDate);
            const terminationMonth = `${terminationDate.getFullYear()}-${String(terminationDate.getMonth() + 1).padStart(2, '0')}`;
            
            // Only allow viewing salary slip for termination month
            // السماح بعرض قسيمة الراتب فقط لشهر الإنهاء
            if (month > terminationMonth) {
                alert(`لا يمكن عرض قسيمة راتب لموظف منتهي الخدمة بعد شهر الإنهاء.\nيمكنك عرض قسيمة الراتب الأخيرة فقط (شهر الإنهاء: ${formatMonth(terminationMonth)})`);
                return;
            }
        }

        const slipContent = document.getElementById('salarySlipContent');
        slipContent.innerHTML = `
            <div class="salary-slip-header">
                <h2>قسيمة راتب</h2>
                <p>شهر: ${formatMonth(month)}</p>
            </div>
            <div class="salary-slip-info">
                <div>
                    <p><strong>الاسم:</strong> ${employee.name}</p>
                    <p><strong>الرقم الوظيفي:</strong> ${employee.employeeNumber}</p>
                    <p><strong>الفرع:</strong> ${employee.branch || '-'}</p>
                    <p><strong>القسم:</strong> ${employee.department}</p>
                </div>
                <div>
                    <p><strong>المسمى الوظيفي:</strong> ${employee.position}</p>
                    <p><strong>الراتب الأساسي:</strong> ${formatCurrency(employee.salary)}</p>
                    <p><strong>عدد أيام الشهر (لحساب الراتب):</strong> 30 يوم (ثابت لجميع الشهور)</p>
                    <p><strong>الراتب اليومي:</strong> ${formatCurrency(employee.salary / 30)}</p>
                    ${payroll.daysDue !== undefined && payroll.daysDue !== 30 ? `<p><strong>عدد الأيام المستحقة:</strong> ${payroll.daysDue} يوم (من بداية الشهر حتى آخر يوم عمل)</p>` : ''}
                    ${payroll.lastWorkingDay ? `<p><strong>آخر يوم عمل (مُحتسب ضمن الراتب):</strong> ${new Date(payroll.lastWorkingDay).toLocaleDateString('ar-SA')}</p>` : ''}
                    ${employee.status === 'terminated' && employee.terminationDate ? `<p><strong>تاريخ إنهاء الخدمة:</strong> ${new Date(employee.terminationDate).toLocaleDateString('ar-SA')}</p>` : ''}
                    ${employee.status === 'suspended' && employee.suspensionDate ? `<p><strong>تاريخ الإيقاف:</strong> ${new Date(employee.suspensionDate).toLocaleDateString('ar-SA')}</p>` : ''}
                </div>
            </div>
            <div class="salary-slip-section">
                <h3>تفاصيل الحضور</h3>
                <div class="salary-slip-row">
                    <span>أيام الحضور:</span>
                    <span>${payroll.presentDays} يوم</span>
                </div>
                <div class="salary-slip-row">
                    <span>أيام الغياب (مع تبليغ):</span>
                    <span>${payroll.absentDaysWithNotice || 0} يوم</span>
                </div>
                <div class="salary-slip-row">
                    <span>أيام الغياب (بدون تبليغ):</span>
                    <span>${payroll.absentDaysWithoutNotice || 0} يوم (يخصم يومين لكل يوم)</span>
                </div>
                <div class="salary-slip-row">
                    <span>إجمالي أيام الغياب:</span>
                    <span>${payroll.absentDays} يوم</span>
                </div>
                <div class="salary-slip-row">
                    <span>أيام الإجازة:</span>
                    <span>${payroll.leaveDays} يوم</span>
                </div>
                <div class="salary-slip-row">
                    <span>أيام العطل:</span>
                    <span>${payroll.holidayDays} يوم</span>
                </div>
            </div>
            <div class="salary-slip-section">
                <h3>الراتب المستحق</h3>
                <div class="salary-slip-row">
                    <span>الراتب الأساسي:</span>
                    <span>${formatCurrency(employee.salary)}</span>
                </div>
                <div class="salary-slip-row">
                    <span>عدد الأيام المستحقة:</span>
                    <span>${payroll.daysDue !== undefined ? payroll.daysDue : STANDARD_MONTH_DAYS} يوم</span>
                </div>
                <div class="salary-slip-row">
                    <span>إجمالي أيام الغياب (بعد حساب التكرار):</span>
                    <span>${(payroll.absentDaysWithNotice || 0) + ((payroll.absentDaysWithoutNotice || 0) * 2)} يوم</span>
                </div>
                <div class="salary-slip-row">
                    <span>الراتب بعد خصم الغياب:</span>
                    <span>${formatCurrency((() => {
                        // Always use standard 30 days for salary calculations
                        const dailySalary = employee.salary / STANDARD_MONTH_DAYS;
                        let salaryAfterAbsence;
                        
                        if (employee.status === 'terminated' && employee.terminationDate && payroll.daysDue) {
                            // For terminated: (days due - absent days) × daily salary
                            // تاريخ الإنهاء = آخر يوم عمل (مُحتسب)
                            const totalAbsentDays = (payroll.absentDaysWithNotice || 0) + ((payroll.absentDaysWithoutNotice || 0) * 2);
                            salaryAfterAbsence = dailySalary * (payroll.daysDue - totalAbsentDays);
                        } else {
                            // For others: Full salary - absent days deduction
                            const totalAbsentDays = (payroll.absentDaysWithNotice || 0) + ((payroll.absentDaysWithoutNotice || 0) * 2);
                            salaryAfterAbsence = employee.salary - (dailySalary * totalAbsentDays);
                        }
                        return salaryAfterAbsence;
                    })())}</span>
                </div>
            </div>
            ${(payroll.overtimeHours || 0) > 0 || (payroll.timeDelayMinutes || 0) > 0 || (payroll.nonTimeDelayMinutes || 0) > 0 ? `
            <div class="salary-slip-section">
                <h3>العمل الإضافي والتأخيرات</h3>
                ${(payroll.overtimeHours || 0) > 0 ? `
                <div class="salary-slip-row">
                    <span>ساعات العمل الإضافية:</span>
                    <span>${payroll.overtimeHours || 0} ساعة (+${formatCurrency(payroll.overtimePay || 0)})</span>
                </div>
                ` : ''}
                ${(payroll.timeDelayMinutes || 0) > 0 ? `
                <div class="salary-slip-row">
                    <span>تأخير زمني:</span>
                    <span>${payroll.timeDelayMinutes || 0} دقيقة (-${formatCurrency(payroll.timeDelayDeduction || 0)})</span>
                </div>
                ` : ''}
                ${(payroll.nonTimeDelayMinutes || 0) > 0 ? `
                <div class="salary-slip-row">
                    <span>تأخير غير زمني:</span>
                    <span>${payroll.nonTimeDelayMinutes || 0} دقيقة (-${formatCurrency(payroll.nonTimeDelayDeduction || 0)})</span>
                </div>
                ` : ''}
                <div class="salary-slip-row">
                    <span>الراتب بعد العمل الإضافي والتأخيرات:</span>
                    <span>${formatCurrency(payroll.baseSalary)}</span>
                </div>
            </div>
            ` : ''}
            <div class="salary-slip-section">
                <h3>الإضافات</h3>
                ${deductions.filter(d => d.type === 'bonus').map(d => `
                    <div class="salary-slip-row">
                        <span>${d.description || 'مكافأة'}:</span>
                        <span>+${formatCurrency(d.amount)}</span>
                    </div>
                `).join('')}
                ${deductions.filter(d => d.type === 'bonus').length === 0 ? '<div class="salary-slip-row"><span>لا توجد إضافات</span></div>' : ''}
                <div class="salary-slip-row">
                    <span><strong>إجمالي الإضافات:</strong></span>
                    <span><strong>${formatCurrency(payroll.totalBonuses)}</strong></span>
                </div>
            </div>
            <div class="salary-slip-section">
                <h3>الخصومات</h3>
                ${(payroll.timeDelayDeduction || 0) > 0 ? `
                <div class="salary-slip-row">
                    <span>خصم التأخير الزمني:</span>
                    <span>-${formatCurrency(payroll.timeDelayDeduction || 0)}</span>
                </div>
                ` : ''}
                ${(payroll.nonTimeDelayDeduction || 0) > 0 ? `
                <div class="salary-slip-row">
                    <span>خصم التأخير غير الزمني:</span>
                    <span>-${formatCurrency(payroll.nonTimeDelayDeduction || 0)}</span>
                </div>
                ` : ''}
                ${deductions.filter(d => d.type === 'deduction').map(d => `
                    <div class="salary-slip-row">
                        <span>${d.description || 'خصم'}:</span>
                        <span>-${formatCurrency(d.amount)}</span>
                    </div>
                `).join('')}
                ${deductions.filter(d => d.type === 'advance').map(d => `
                    <div class="salary-slip-row">
                        <span>${d.description || 'سلف'}:</span>
                        <span>-${formatCurrency(d.amount)}</span>
                    </div>
                `).join('')}
                ${deductions.filter(d => d.type === 'deduction' || d.type === 'advance').length === 0 && (payroll.timeDelayDeduction || 0) === 0 && (payroll.nonTimeDelayDeduction || 0) === 0 ? '<div class="salary-slip-row"><span>لا توجد خصومات</span></div>' : ''}
                <div class="salary-slip-row">
                    <span><strong>إجمالي الخصومات:</strong></span>
                    <span><strong>${formatCurrency((payroll.timeDelayDeduction || 0) + (payroll.nonTimeDelayDeduction || 0) + payroll.totalDeductions + payroll.totalAdvances)}</strong></span>
                </div>
            </div>
            <div class="salary-slip-section">
                <div class="salary-slip-row total">
                    <span>صافي الراتب:</span>
                    <span>${formatCurrency(payroll.netSalary)}</span>
                </div>
            </div>
            <div class="salary-slip-footer">
                <p>تم إنشاء هذه القسيمة بتاريخ: ${new Date().toLocaleDateString('ar-SA')}</p>
                <p style="margin-top: 10px; font-size: 12px; color: #999;">
                    القرية الصغيرة للتجارة العامة<br>
                    برمجة وتصميم وإدارة: عبدالله عبدالرحمن عبود
                </p>
            </div>
        `;

        // Store slip data for PDF export
        window.currentSalarySlipData = {
            employee: employee,
            payroll: payroll,
            deductions: deductions,
            month: month
        };
        
        openModal('salarySlipModal');
    } catch (error) {
        console.error('Error generating salary slip:', error);
        alert('حدث خطأ في إنشاء قسيمة الراتب');
    }
}

// Print salary slip - only prints the slip content
function printSalarySlip() {
    // Open print dialog with only the salary slip visible
    window.print();
}

// Save salary slip to PDF using html2canvas
async function saveSalarySlipToPDF() {
    // Check if required libraries are loaded
    if (typeof html2canvas === 'undefined') {
        alert('مكتبة html2canvas غير محملة. يرجى تحديث الصفحة والمحاولة مرة أخرى');
        return;
    }

    // Check if jsPDF library is loaded (try different possible locations)
    let jsPDFClass = null;
    
    if (typeof window.jsPDF !== 'undefined' && window.jsPDF.jsPDF) {
        jsPDFClass = window.jsPDF.jsPDF;
    } else if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
        jsPDFClass = window.jspdf.jsPDF;
    } else if (typeof window.jsPDF !== 'undefined') {
        jsPDFClass = window.jsPDF;
    } else if (typeof jsPDF !== 'undefined') {
        jsPDFClass = jsPDF;
    }
    
    if (!jsPDFClass) {
        alert('مكتبة PDF غير محملة. يرجى تحديث الصفحة والمحاولة مرة أخرى');
        return;
    }

    if (!window.currentSalarySlipData) {
        alert('لا توجد بيانات قسيمة راتب للتصدير');
        return;
    }

    try {
        // Get the salary slip content element
        const slipContent = document.getElementById('salarySlipContent');
        if (!slipContent) {
            alert('لا يمكن العثور على محتوى قسيمة الراتب');
            return;
        }

        // Show loading message
        const originalBtnText = document.getElementById('savePdfBtn').textContent;
        document.getElementById('savePdfBtn').textContent = 'جاري الحفظ...';
        document.getElementById('savePdfBtn').disabled = true;

        // Convert HTML to canvas
        const canvas = await html2canvas(slipContent, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        // Get canvas dimensions
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        
        // Calculate PDF dimensions (A4 size: 210mm x 297mm)
        const pdfWidth = 210;
        const pdfHeight = (imgHeight * pdfWidth) / imgWidth;

        // Create PDF
        const doc = new jsPDFClass('p', 'mm', 'a4');
        
        // Add image to PDF
        const imgData = canvas.toDataURL('image/png');
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        // Save PDF
        const { employee, month } = window.currentSalarySlipData;
        const fileName = `قسيمة_راتب_${employee.employeeNumber}_${month}.pdf`;
        doc.save(fileName);
        
        // Restore button
        document.getElementById('savePdfBtn').textContent = originalBtnText;
        document.getElementById('savePdfBtn').disabled = false;
        
        alert('تم حفظ قسيمة الراتب بنجاح');
    } catch (error) {
        console.error('Error saving PDF:', error);
        alert('حدث خطأ في حفظ PDF: ' + (error.message || 'خطأ غير معروف'));
        
        // Restore button
        const saveBtn = document.getElementById('savePdfBtn');
        if (saveBtn) {
            saveBtn.textContent = 'حفظ PDF';
            saveBtn.disabled = false;
        }
    }
}

// ==================== Reports ====================

async function loadReportEmployees() {
    const employees = await db.getAllEmployees();
    const select = document.getElementById('reportEmployee');
    select.innerHTML = '<option value="">جميع الموظفين</option>';
    
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.employeeNumber})`;
        select.appendChild(option);
    });
}

function handleReportTypeChange() {
    const reportType = document.getElementById('reportType').value;
    const monthGroup = document.getElementById('reportMonthGroup');
    const departmentGroup = document.getElementById('reportDepartmentGroup');
    const employeeGroup = document.getElementById('reportEmployeeGroup');
    const exportBtn = document.getElementById('exportExcelBtn');

    if (reportType === 'employees') {
        monthGroup.style.display = 'none';
        departmentGroup.style.display = 'block';
        employeeGroup.style.display = 'block';
        exportBtn.style.display = 'none'; // Hide until report is generated
        loadReportDepartments();
    } else if (reportType === 'activeEmployeesMonthly') {
        // تقرير الموظفين النشطين شهرياً - يتطلب اختيار شهر فقط
        monthGroup.style.display = 'block';
        departmentGroup.style.display = 'none';
        employeeGroup.style.display = 'none'; // لا حاجة لاختيار موظف محدد
        exportBtn.style.display = 'none'; // Hide until report is generated
    } else {
        monthGroup.style.display = 'block';
        departmentGroup.style.display = 'none';
        employeeGroup.style.display = 'block';
        exportBtn.style.display = 'none'; // Hide until report is generated
    }
    
    // Clear previous report data when changing report type
    window.currentReportData = null;
    document.getElementById('reportResults').innerHTML = '';
}

async function loadReportDepartments() {
    const employees = await db.getAllEmployees();
    const departments = [...new Set(employees.map(emp => emp.department))].filter(d => d);
    const select = document.getElementById('reportDepartment');
    select.innerHTML = '<option value="">جميع الأقسام</option>';
    
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        select.appendChild(option);
    });
}

async function generateReport() {
    const reportType = document.getElementById('reportType').value;
    const month = document.getElementById('reportMonth').value;
    const employeeId = document.getElementById('reportEmployee').value;
    const department = document.getElementById('reportDepartment').value;
    const exportBtn = document.getElementById('exportExcelBtn');

    // Hide export button initially
    exportBtn.style.display = 'none';
    
    try {
        if (reportType === 'employees') {
            await generateEmployeesReport(employeeId, department);
        } else if (reportType === 'activeEmployeesMonthly') {
            if (!month) {
                alert('يرجى اختيار الشهر');
                return;
            }
            await generateActiveEmployeesMonthlyReport(month);
        } else if (reportType === 'attendance') {
            if (!month) {
                alert('يرجى اختيار الشهر');
                return;
            }
            await generateAttendanceReport(month, employeeId);
        } else if (reportType === 'payroll') {
            if (!month) {
                alert('يرجى اختيار الشهر');
                return;
            }
            await generatePayrollReport(month, employeeId);
        }
        
        // Show export button after report is generated
        if (window.currentReportData && window.currentReportData.data && window.currentReportData.data.length > 0) {
            exportBtn.style.display = 'inline-block';
        }
    } catch (error) {
        console.error('Error generating report:', error);
        alert('حدث خطأ في إنشاء التقرير');
        exportBtn.style.display = 'none';
    }
}

async function generateEmployeesReport(employeeId, department) {
    let employees = await db.getAllEmployees();
    
    // Filter by employee if selected
    if (employeeId) {
        employees = employees.filter(emp => emp.id === parseInt(employeeId));
    }
    
    // Filter by department if selected
    if (department) {
        employees = employees.filter(emp => emp.department === department);
    }

    let html = '<div class="report-results"><h3>تقرير الموظفين</h3>';
    html += '<div class="table-container"><table><thead><tr><th>الرقم الوظيفي</th><th>الاسم</th><th>الفرع</th><th>القسم</th><th>المسمى الوظيفي</th><th>الراتب الأساسي</th><th>الحالة</th></tr></thead><tbody>';

    if (employees.length === 0) {
        html += '<tr><td colspan="7" class="empty-state">لا يوجد موظفين</td></tr>';
    } else {
        employees.forEach(emp => {
            html += `
                <tr>
                    <td>${emp.employeeNumber}</td>
                    <td>${emp.name}</td>
                    <td>${emp.branch || '-'}</td>
                    <td>${emp.department}</td>
                    <td>${emp.position}</td>
                    <td>${formatCurrency(emp.salary)}</td>
                    <td><span class="status-badge status-${emp.status}">${emp.status === 'active' ? 'نشط' : emp.status === 'terminated' ? 'منتهية الخدمة' : 'متوقف'}</span></td>
                </tr>
            `;
        });
    }

    html += '</tbody></table></div></div>';
    document.getElementById('reportResults').innerHTML = html;
    
    // Store report data for Excel export (always store, even if empty)
    window.currentReportData = {
        type: 'employees',
        data: employees || [],
        title: 'تقرير الموظفين',
        headers: ['الرقم الوظيفي', 'الاسم', 'الفرع', 'القسم', 'المسمى الوظيفي', 'الراتب الأساسي', 'الحالة']
    };
    
    console.log('✅ Employees report data stored:', window.currentReportData);
    console.log('✅ Data length:', window.currentReportData.data.length);
    console.log('✅ Data sample:', window.currentReportData.data.slice(0, 2));
    
    // Show/hide export button based on data
    const exportBtn = document.getElementById('exportExcelBtn');
    if (employees && employees.length > 0) {
        exportBtn.style.display = 'inline-block';
        console.log('✅ Export button shown');
    } else {
        exportBtn.style.display = 'none';
        console.log('⚠️ Export button hidden - no data');
    }
    
    console.log('Report data stored:', window.currentReportData);
}

async function generateActiveEmployeesMonthlyReport(month) {
    // Parse month (format: YYYY-MM)
    const [year, monthNum] = month.split('-');
    const monthStart = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthEnd = new Date(parseInt(year), parseInt(monthNum), 0); // Last day of month
    monthEnd.setHours(23, 59, 59, 999);
    
    // Get all employees
    const allEmployees = await db.getAllEmployees();
    
    // Filter employees who were active during the specified month
    // تصفية الموظفين الذين كانوا نشطين خلال الشهر المحدد
    // الموظف يُعتبر نشط خلال الشهر إذا:
    // - تاريخ التعيين (Hire Date) ≤ آخر يوم في الشهر المحدد
    // - و (تاريخ إنهاء الخدمة فارغ OR تاريخ إنهاء الخدمة ≥ أول يوم في الشهر المحدد)
    const activeEmployees = allEmployees.filter(emp => {
        // Check hire date: must be hired before or during the month (hireDate ≤ monthEnd)
        // التحقق من تاريخ التعيين: يجب أن يكون التعيين قبل أو خلال الشهر (تاريخ التعيين ≤ آخر يوم في الشهر)
        if (emp.hireDate) {
            const hireDate = new Date(emp.hireDate);
            hireDate.setHours(0, 0, 0, 0);
            if (hireDate > monthEnd) {
                return false; // Not hired yet - لم يتم التعيين بعد
            }
        }
        
        // Check termination date: must be either not terminated OR terminated during or after month start
        // التحقق من تاريخ الإنهاء: يجب أن يكون غير منتهي الخدمة OR منتهي خلال أو بعد بداية الشهر
        // (terminationDate === null OR terminationDate ≥ monthStart)
        if (emp.status === 'terminated' && emp.terminationDate) {
            const terminationDate = new Date(emp.terminationDate);
            terminationDate.setHours(0, 0, 0, 0);
            if (terminationDate < monthStart) {
                return false; // Terminated before this month - منتهي قبل هذا الشهر
            }
        }
        
        // Include active, suspended, and terminated (if terminated during this month) employees
        // إدراج الموظفين النشطين والموقوفين والمنتهية خدماتهم (إذا انتهت خدماتهم خلال هذا الشهر)
        // The termination check above already filtered out employees terminated before the month
        // التحقق من الإنهاء أعلاه قام بالفعل بتصفية الموظفين المنتهية خدماتهم قبل الشهر
        // So if we reach here and status is terminated, it means they were terminated during or after the month
        // لذا إذا وصلنا هنا والحالة منتهية، فهذا يعني أنهم انتهت خدماتهم خلال أو بعد الشهر
        return emp.status === 'active' || emp.status === 'suspended' || emp.status === 'terminated';
    });
    
    // Sort by employee number
    activeEmployees.sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber));
    
    // Generate report HTML
    let html = '<div class="report-results"><h3>تقرير الموظفين النشطين شهرياً - ' + formatMonth(month) + '</h3>';
    html += '<div class="table-container"><table><thead><tr>';
    html += '<th>الرقم الوظيفي</th>';
    html += '<th>الاسم الكامل</th>';
    html += '<th>الحالة الوظيفية</th>';
    html += '<th>تاريخ التعيين</th>';
    html += '<th>تاريخ إنهاء الخدمة</th>';
    html += '<th>القسم</th>';
    html += '<th>المسمى الوظيفي</th>';
    html += '</tr></thead><tbody>';
    
    if (activeEmployees.length === 0) {
        html += '<tr><td colspan="7" class="empty-state">لا يوجد موظفين نشطين خلال هذا الشهر</td></tr>';
    } else {
        activeEmployees.forEach(emp => {
            // Determine status text
            let statusText = 'نشط';
            if (emp.status === 'suspended') {
                statusText = 'موقوف';
                if (emp.suspensionType) {
                    statusText += emp.suspensionType === 'with_salary' ? ' (براتب)' : ' (بدون راتب)';
                }
            } else if (emp.status === 'terminated' && emp.terminationDate) {
                const terminationDate = new Date(emp.terminationDate);
                terminationDate.setHours(0, 0, 0, 0);
                // If terminated during this month, show as "منتهي" but still include in report
                if (terminationDate >= monthStart && terminationDate <= monthEnd) {
                    statusText = 'منتهي (خلال الشهر)';
                }
            }
            
            html += `
                <tr>
                    <td>${emp.employeeNumber}</td>
                    <td>${emp.name}</td>
                    <td><span class="status-badge status-${emp.status}">${statusText}</span></td>
                    <td>${emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('ar-SA') : '-'}</td>
                    <td>${emp.terminationDate ? new Date(emp.terminationDate).toLocaleDateString('ar-SA') : '-'}</td>
                    <td>${emp.department}</td>
                    <td>${emp.position}</td>
                </tr>
            `;
        });
    }
    
    html += '</tbody></table></div></div>';
    document.getElementById('reportResults').innerHTML = html;
    
    // Store report data for Excel export
    const reportData = activeEmployees.map(emp => {
        let statusText = 'نشط';
        if (emp.status === 'suspended') {
            statusText = 'موقوف';
            if (emp.suspensionType) {
                statusText += emp.suspensionType === 'with_salary' ? ' (براتب)' : ' (بدون راتب)';
            }
        } else if (emp.status === 'terminated' && emp.terminationDate) {
            const terminationDate = new Date(emp.terminationDate);
            terminationDate.setHours(0, 0, 0, 0);
            if (terminationDate >= monthStart && terminationDate <= monthEnd) {
                statusText = 'منتهي (خلال الشهر)';
            }
        }
        
        return {
            employeeNumber: emp.employeeNumber,
            name: emp.name,
            status: statusText,
            hireDate: emp.hireDate ? new Date(emp.hireDate).toLocaleDateString('ar-SA') : '-',
            terminationDate: emp.terminationDate ? new Date(emp.terminationDate).toLocaleDateString('ar-SA') : '-',
            department: emp.department,
            position: emp.position
        };
    });
    
    window.currentReportData = {
        type: 'activeEmployeesMonthly',
        data: reportData,
        title: `تقرير الموظفين النشطين شهرياً - ${formatMonth(month)}`,
        headers: ['الرقم الوظيفي', 'الاسم الكامل', 'الحالة الوظيفية', 'تاريخ التعيين', 'تاريخ إنهاء الخدمة', 'القسم', 'المسمى الوظيفي'],
        month: month
    };
    
    // Show/hide export button based on data
    const exportBtn = document.getElementById('exportExcelBtn');
    if (reportData && reportData.length > 0) {
        exportBtn.style.display = 'inline-block';
    } else {
        exportBtn.style.display = 'none';
    }
    
    console.log('✅ Active employees monthly report generated:', window.currentReportData);
    console.log('✅ Employees count:', reportData.length);
}

async function generateAttendanceReport(month, employeeId) {
    const employees = employeeId 
        ? [await db.getEmployee(parseInt(employeeId))]
        : await db.getActiveEmployees();

    let html = '<div class="report-results"><h3>تقرير حضور - ' + formatMonth(month) + '</h3>';
    html += '<div class="table-container"><table><thead><tr><th>الرقم الوظيفي</th><th>الاسم</th><th>الفرع</th><th>القسم</th><th>أيام الحضور</th><th>أيام الغياب</th><th>أيام الإجازة</th><th>أيام العطل</th></tr></thead><tbody>';

    // Store report data for Excel export
    const attendanceData = [];
    
    for (const emp of employees) {
        let attendance = await db.getAttendanceByEmployeeAndMonth(emp.id, month);
        
        // Filter out attendance after end date if employee has end date
        if (emp.endDate) {
            const endDate = new Date(emp.endDate);
            endDate.setHours(23, 59, 59, 999);
            attendance = attendance.filter(att => {
                const attDate = new Date(att.date);
                return attDate <= endDate;
            });
        }
        
        const presentDays = attendance.filter(att => att.status === 'present').length;
        const absentDaysWithNotice = attendance.filter(att => att.status === 'absent' && (!att.absentType || att.absentType === 'with_notice')).length;
        const absentDaysWithoutNotice = attendance.filter(att => att.status === 'absent' && att.absentType === 'without_notice').length;
        const totalAbsentDays = absentDaysWithNotice + absentDaysWithoutNotice;
        const leaveDays = attendance.filter(att => att.status === 'leave').length;
        const holidayDays = attendance.filter(att => att.status === 'holiday').length;

        html += `
            <tr>
                <td>${emp.employeeNumber}</td>
                <td>${emp.name}</td>
                <td>${emp.branch || '-'}</td>
                <td>${emp.department}</td>
                <td>${presentDays}</td>
                <td>${totalAbsentDays} (${absentDaysWithNotice} مع تبليغ، ${absentDaysWithoutNotice} بدون تبليغ)</td>
                <td>${leaveDays}</td>
                <td>${holidayDays}</td>
            </tr>
        `;
        
        // Store data for export
        attendanceData.push({
            employeeNumber: emp.employeeNumber,
            name: emp.name,
            branch: emp.branch || '-',
            department: emp.department,
            presentDays: presentDays,
            absentDays: totalAbsentDays,
            leaveDays: leaveDays,
            holidayDays: holidayDays
        });
    }

    html += '</tbody></table></div></div>';
    document.getElementById('reportResults').innerHTML = html;
    
    // Always store data, even if empty
    window.currentReportData = {
        type: 'attendance',
        data: attendanceData || [],
        title: `تقرير حضور - ${formatMonth(month)}`,
        headers: ['الرقم الوظيفي', 'الاسم', 'الفرع', 'القسم', 'أيام الحضور', 'أيام الغياب', 'أيام الإجازة', 'أيام العطل']
    };
    
    console.log('Attendance report data stored:', window.currentReportData);
    console.log('Data length:', window.currentReportData.data.length);
    
    // Show/hide export button based on data
    const exportBtn = document.getElementById('exportExcelBtn');
    if (attendanceData && attendanceData.length > 0) {
        exportBtn.style.display = 'inline-block';
    } else {
        exportBtn.style.display = 'none';
    }
}

async function generatePayrollReport(month, employeeId) {
    const employees = employeeId 
        ? [await db.getEmployee(parseInt(employeeId))]
        : await db.getActiveEmployees();

    let html = '<div class="report-results"><h3>تقرير رواتب - ' + formatMonth(month) + '</h3>';
    html += '<div class="table-container"><table><thead><tr><th>الرقم الوظيفي</th><th>الاسم</th><th>الراتب الأساسي</th><th>الراتب المستحق</th><th>الخصومات</th><th>المكافآت</th><th>السلف</th><th>صافي الراتب</th></tr></thead><tbody>';

    for (const emp of employees) {
        const payroll = await db.getPayrollByEmployeeAndMonth(emp.id, month);
        if (payroll) {
            html += `
                <tr>
                    <td>${emp.employeeNumber}</td>
                    <td>${emp.name}</td>
                    <td>${formatCurrency(emp.salary)}</td>
                    <td>${formatCurrency(payroll.baseSalary)}</td>
                    <td>${formatCurrency(payroll.totalDeductions)}</td>
                    <td>${formatCurrency(payroll.totalBonuses)}</td>
                    <td>${formatCurrency(payroll.totalAdvances)}</td>
                    <td><strong>${formatCurrency(payroll.netSalary)}</strong></td>
                </tr>
            `;
        }
    }

    html += '</tbody></table></div></div>';
    document.getElementById('reportResults').innerHTML = html;
    
    // Store report data for Excel export
    const payrollData = [];
    for (const emp of employees) {
        const payroll = await db.getPayrollByEmployeeAndMonth(emp.id, month);
        if (payroll) {
            payrollData.push({
                employeeNumber: emp.employeeNumber,
                name: emp.name,
                baseSalary: emp.salary,
                earnedSalary: payroll.baseSalary,
                deductions: payroll.totalDeductions,
                bonuses: payroll.totalBonuses,
                advances: payroll.totalAdvances,
                netSalary: payroll.netSalary
            });
        }
    }
    
    // Always store data, even if empty
    window.currentReportData = {
        type: 'payroll',
        data: payrollData || [],
        title: `تقرير رواتب - ${formatMonth(month)}`,
        headers: ['الرقم الوظيفي', 'الاسم', 'الراتب الأساسي', 'الراتب المستحق', 'الخصومات', 'المكافآت', 'السلف', 'صافي الراتب']
    };
    
    console.log('Payroll report data stored:', window.currentReportData);
    console.log('Data length:', window.currentReportData.data.length);
    
    // Show/hide export button based on data
    const exportBtn = document.getElementById('exportExcelBtn');
    if (payrollData && payrollData.length > 0) {
        exportBtn.style.display = 'inline-block';
    } else {
        exportBtn.style.display = 'none';
    }
}

// ==================== Backup & Restore ====================

async function exportBackup() {
    try {
        const data = await db.exportData();
        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payroll-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        alert('تم إنشاء النسخة الاحتياطية بنجاح');
    } catch (error) {
        console.error('Error exporting backup:', error);
        alert('حدث خطأ في إنشاء النسخة الاحتياطية');
    }
}

async function importBackup() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!confirm('هل أنت متأكد من استعادة البيانات؟ سيتم استبدال جميع البيانات الحالية.')) {
            return;
        }

        try {
            const text = await file.text();
            const data = JSON.parse(text);
            await db.importData(data);
            alert('تم استعادة البيانات بنجاح');
            // Reload all data without page refresh
            await loadEmployees();
            await loadEmployeeSelects();
            await loadMultiDayEmployeeSelect();
            await loadDashboardEmployees();
            await loadReportEmployees();
            await loadTodayAttendance();
            if (currentPayrollMonth) {
                await loadPayrollEmployees();
            }
            // Switch to dashboard to show updated data
            await switchTab('dashboard');
            await loadDashboard();
        } catch (error) {
            console.error('Error importing backup:', error);
            alert('حدث خطأ في استعادة البيانات. يرجى التحقق من صحة الملف.');
        }
    };

    input.click();
}

// ==================== Utility Functions ====================

function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatMonth(monthStr) {
    const [year, month] = monthStr.split('-');
    const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 
                   'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    return `${months[parseInt(month) - 1]} ${year}`;
}

// ==================== Excel Export ====================

async function exportReportToExcel() {
    console.log('🔵 Export button clicked');
    console.log('🔵 Current report data:', window.currentReportData);
    
    // Check if XLSX library is loaded
    if (typeof XLSX === 'undefined') {
        alert('مكتبة Excel غير محملة. يرجى تحديث الصفحة والمحاولة مرة أخرى');
        console.error('❌ XLSX library not loaded');
        return;
    }

    // Check if report data exists - if not, try to generate it
    if (!window.currentReportData) {
        console.log('⚠️ No report data found, attempting to regenerate...');
        const reportType = document.getElementById('reportType').value;
        const month = document.getElementById('reportMonth').value;
        const employeeId = document.getElementById('reportEmployee').value;
        const department = document.getElementById('reportDepartment').value;
        
        if (reportType === 'employees') {
            await generateEmployeesReport(employeeId, department);
        } else if (reportType === 'activeEmployeesMonthly' && month) {
            await generateActiveEmployeesMonthlyReport(month);
        } else if (reportType === 'attendance' && month) {
            await generateAttendanceReport(month, employeeId);
        } else if (reportType === 'payroll' && month) {
            await generatePayrollReport(month, employeeId);
        } else {
            alert('لا توجد بيانات للتصدير. يرجى إنشاء التقرير أولاً');
            console.error('❌ No report data found and cannot regenerate');
            return;
        }
        
        // Wait a bit for data to be stored
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!window.currentReportData) {
            alert('لا توجد بيانات للتصدير. يرجى إنشاء التقرير أولاً');
            console.error('❌ Still no report data after regeneration');
            return;
        }
    }

    const reportData = window.currentReportData;
    console.log('Exporting report:', reportData);
    console.log('Report type:', reportData.type);
    console.log('Data array:', reportData.data);
    console.log('Data length:', reportData.data ? reportData.data.length : 'N/A');
    
    // Check if data array exists and has items
    if (!reportData.data) {
        alert('لا توجد بيانات للتصدير. يرجى إنشاء التقرير أولاً');
        console.error('❌ Report data.data is undefined');
        console.error('Full reportData:', reportData);
        return;
    }
    
    if (!Array.isArray(reportData.data)) {
        alert('خطأ في تنسيق البيانات. يرجى إنشاء التقرير مرة أخرى');
        console.error('❌ Report data.data is not an array:', typeof reportData.data);
        console.error('Full reportData:', reportData);
        return;
    }
    
    if (reportData.data.length === 0) {
        alert('التقرير فارغ. لا توجد بيانات للتصدير');
        console.error('❌ Report data is empty array');
        console.error('Full reportData:', reportData);
        return;
    }
    
    console.log('✅ All checks passed, proceeding with export...');
    
    // Prepare data array
    const data = [];
    
    // Add title row
    data.push([reportData.title]);
    data.push([]); // Empty row
    
    // Add headers
    data.push(reportData.headers);
    
    // Add data rows
    reportData.data.forEach(row => {
        const values = [];
        
        if (reportData.type === 'employees') {
            values.push(
                row.employeeNumber,
                row.name,
                row.branch || '-',
                row.department,
                row.position,
                row.salary,
                row.status === 'active' ? 'نشط' : row.status === 'terminated' ? 'منتهية الخدمة' : 'متوقف'
            );
        } else if (reportData.type === 'activeEmployeesMonthly') {
            values.push(
                row.employeeNumber,
                row.name,
                row.status,
                row.hireDate,
                row.terminationDate,
                row.department,
                row.position
            );
        } else if (reportData.type === 'attendance') {
            values.push(
                row.employeeNumber,
                row.name,
                row.branch || '-',
                row.department,
                row.presentDays,
                row.absentDays,
                row.leaveDays,
                row.holidayDays
            );
        } else if (reportData.type === 'payroll') {
            values.push(
                row.employeeNumber,
                row.name,
                row.baseSalary,
                row.earnedSalary,
                row.deductions,
                row.bonuses,
                row.advances,
                row.netSalary
            );
        }
        
        data.push(values);
    });
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // Set column widths for better formatting
    const colWidths = reportData.headers.map(() => ({ wch: 15 }));
    worksheet['!cols'] = colWidths;
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'التقرير');
    
    // Generate file name
    const fileName = reportData.title.replace(/\s+/g, '_').replace(/[^\w\-_\u0600-\u06FF]/g, '') + '_' + new Date().toISOString().split('T')[0] + '.xlsx';
    
    // Export to file
    XLSX.writeFile(workbook, fileName);
    
    alert('تم تصدير التقرير بنجاح بصيغة Excel');
}

// ==================== Dashboard ====================

function setupDashboardControls() {
    const viewType = document.getElementById('dashboardViewType');
    const monthGroup = document.getElementById('dashboardMonthGroup');
    const rangeGroup = document.getElementById('dashboardRangeGroup');
    const rangeGroup2 = document.getElementById('dashboardRangeGroup2');

    viewType.addEventListener('change', handleDashboardViewChange);
    handleDashboardViewChange();
    
    // Set default dates
    const today = new Date();
    const monthStr = today.toISOString().substring(0, 7);
    document.getElementById('dashboardMonth').value = monthStr;
    document.getElementById('dashboardStartDate').value = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
    document.getElementById('dashboardEndDate').value = today.toISOString().split('T')[0];
}

function handleDashboardViewChange() {
    const viewType = document.getElementById('dashboardViewType').value;
    const monthGroup = document.getElementById('dashboardMonthGroup');
    const rangeGroup = document.getElementById('dashboardRangeGroup');
    const rangeGroup2 = document.getElementById('dashboardRangeGroup2');

    if (viewType === 'month') {
        monthGroup.style.display = 'block';
        rangeGroup.style.display = 'none';
        rangeGroup2.style.display = 'none';
    } else {
        monthGroup.style.display = 'none';
        rangeGroup.style.display = 'block';
        rangeGroup2.style.display = 'block';
    }
}

async function loadDashboard() {
    const viewType = document.getElementById('dashboardViewType').value;
    const employeeId = document.getElementById('dashboardEmployee').value;
    let startDate, endDate;

    if (viewType === 'month') {
        const month = document.getElementById('dashboardMonth').value;
        if (!month) {
            alert('يرجى اختيار الشهر');
            return;
        }
        const [year, monthNum] = month.split('-');
        startDate = `${year}-${monthNum}-01`;
        const lastDay = new Date(parseInt(year), parseInt(monthNum), 0).getDate();
        endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`;
    } else {
        startDate = document.getElementById('dashboardStartDate').value;
        endDate = document.getElementById('dashboardEndDate').value;
        if (!startDate || !endDate) {
            alert('يرجى اختيار تاريخ البداية والنهاية');
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
            return;
        }
    }

    try {
        // Get all attendance records in the date range
        const allAttendance = await db.getAllAttendance();
        const employees = await db.getAllEmployees();
        const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

        // Filter attendance by date range and employee
        let filteredAttendance = allAttendance.filter(att => {
            const dateMatch = att.date >= startDate && att.date <= endDate;
            const employeeMatch = !employeeId || att.employeeId === parseInt(employeeId);
            return dateMatch && employeeMatch;
        });
        
        // Filter out attendance after employee end date
        filteredAttendance = filteredAttendance.filter(att => {
            const emp = employeeMap.get(att.employeeId);
            if (!emp || !emp.endDate) return true;
            
            const endDate = new Date(emp.endDate);
            endDate.setHours(23, 59, 59, 999);
            const attDate = new Date(att.date);
            return attDate <= endDate;
        });

        // Calculate statistics
        const stats = calculateDashboardStats(filteredAttendance, employees, employeeId);

        // Display statistics
        displayDashboardStats(stats, viewType === 'month' ? document.getElementById('dashboardMonth').value : `${startDate} إلى ${endDate}`);

        // Display attendance table
        displayDashboardTable(filteredAttendance, employeeMap);

    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('حدث خطأ في تحميل البيانات');
    }
}

function calculateDashboardStats(attendance, employees, selectedEmployeeId) {
    const stats = {
        totalEmployees: 0,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        leaveDays: 0,
        holidayDays: 0,
        attendanceRate: 0
    };

    // Get unique employees
    const uniqueEmployees = new Set();
    attendance.forEach(att => uniqueEmployees.add(att.employeeId));
    
    if (selectedEmployeeId) {
        stats.totalEmployees = 1;
    } else {
        const activeEmployees = employees.filter(emp => emp.status === 'active');
        stats.totalEmployees = activeEmployees.length;
    }

    stats.totalDays = attendance.length;

    attendance.forEach(att => {
        switch(att.status) {
            case 'present':
                stats.presentDays++;
                break;
            case 'absent':
                stats.absentDays++;
                break;
            case 'leave':
                stats.leaveDays++;
                break;
            case 'holiday':
                stats.holidayDays++;
                break;
        }
    });

    if (stats.totalDays > 0) {
        stats.attendanceRate = ((stats.presentDays + stats.holidayDays) / stats.totalDays * 100).toFixed(1);
    }

    return stats;
}

function displayDashboardStats(stats, period) {
    const statsDiv = document.getElementById('dashboardStats');
    
    statsDiv.innerHTML = `
        <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div class="stat-content">
                <h3>${stats.totalEmployees}</h3>
                <p>عدد الموظفين</p>
            </div>
        </div>
        <div class="stat-card">
            <div class="stat-icon">📅</div>
            <div class="stat-content">
                <h3>${stats.totalDays}</h3>
                <p>إجمالي أيام الدوام</p>
            </div>
        </div>
        <div class="stat-card stat-success">
            <div class="stat-icon">✅</div>
            <div class="stat-content">
                <h3>${stats.presentDays}</h3>
                <p>أيام الحضور</p>
            </div>
        </div>
        <div class="stat-card stat-danger">
            <div class="stat-icon">❌</div>
            <div class="stat-content">
                <h3>${stats.absentDays}</h3>
                <p>أيام الغياب</p>
            </div>
        </div>
        <div class="stat-card stat-warning">
            <div class="stat-icon">🏖️</div>
            <div class="stat-content">
                <h3>${stats.leaveDays}</h3>
                <p>أيام الإجازة</p>
            </div>
        </div>
        <div class="stat-card stat-info">
            <div class="stat-icon">🎉</div>
            <div class="stat-content">
                <h3>${stats.holidayDays}</h3>
                <p>أيام العطل</p>
            </div>
        </div>
        <div class="stat-card stat-primary">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
                <h3>${stats.attendanceRate}%</h3>
                <p>نسبة الحضور</p>
            </div>
        </div>
        <div class="stat-card stat-period">
            <div class="stat-icon">📆</div>
            <div class="stat-content">
                <h3 style="font-size: 16px;">${period}</h3>
                <p>الفترة المحددة</p>
            </div>
        </div>
    `;
}

function displayDashboardTable(attendance, employeeMap) {
    const tbody = document.getElementById('dashboardTableBody');
    tbody.innerHTML = '';

    if (attendance.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="empty-state">لا يوجد دوام مسجل في الفترة المحددة</td></tr>';
        return;
    }

    // Sort by date (newest first)
    attendance.sort((a, b) => b.date.localeCompare(a.date));

    attendance.forEach(att => {
        const emp = employeeMap.get(att.employeeId);
        if (!emp) return;

        const date = new Date(att.date);
        const dateStr = date.toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${dateStr}</td>
            <td>${emp.employeeNumber}</td>
            <td>${emp.name}</td>
            <td>${emp.branch || '-'}</td>
            <td>${emp.department}</td>
            <td><span class="status-badge status-${att.status}">${getStatusText(att.status, att.absentType)}</span></td>
        `;
        tbody.appendChild(row);
    });
}

// Load dashboard employee select
async function loadDashboardEmployees() {
    const employees = await db.getAllEmployees();
    const select = document.getElementById('dashboardEmployee');
    select.innerHTML = '<option value="">جميع الموظفين</option>';
    employees.forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.name} (${emp.employeeNumber})`;
        select.appendChild(option);
    });
}

// ==================== Quick Codes Management ====================

async function openQuickCodesModal() {
    const modal = document.getElementById('quickCodesModal');
    const employees = await db.getActiveEmployees();
    const checklist = document.getElementById('codeEmployeesChecklist');
    
    checklist.innerHTML = '';
    employees.forEach(emp => {
        const label = document.createElement('label');
        label.innerHTML = `
            <input type="checkbox" value="${emp.id}">
            ${emp.name} (${emp.employeeNumber}) - ${emp.branch || ''} - ${emp.department}
        `;
        checklist.appendChild(label);
    });

    await loadSavedCodes();
    openModal('quickCodesModal');
}

async function saveQuickCode() {
    const codeName = document.getElementById('newCodeName').value.trim();
    const checkboxes = document.querySelectorAll('#codeEmployeesChecklist input[type="checkbox"]:checked');

    if (!codeName) {
        alert('يرجى إدخال اسم الرمز');
        return;
    }

    if (checkboxes.length === 0) {
        alert('يرجى اختيار موظفين على الأقل');
        return;
    }

    const employeeIds = Array.from(checkboxes).map(cb => parseInt(cb.value));

    try {
        await db.addQuickCode(codeName, employeeIds);
        document.getElementById('newCodeName').value = '';
        checkboxes.forEach(cb => cb.checked = false);
        await loadSavedCodes();
        alert('تم حفظ الرمز بنجاح');
    } catch (error) {
        console.error('Error saving quick code:', error);
        if (error.name === 'ConstraintError') {
            alert('هذا الرمز موجود مسبقاً');
        } else {
            alert('حدث خطأ في حفظ الرمز');
        }
    }
}

async function loadSavedCodes() {
    try {
        const codes = await db.getAllQuickCodes();
        const listDiv = document.getElementById('savedCodesList');
        
        if (codes.length === 0) {
            listDiv.innerHTML = '<p class="empty-state">لا توجد رموز محفوظة</p>';
            return;
        }

        const employees = await db.getAllEmployees();
        const employeeMap = new Map(employees.map(emp => [emp.id, emp]));

        let html = '<div class="table-container"><table><thead><tr><th>الرمز</th><th>الموظفين</th><th>الإجراءات</th></tr></thead><tbody>';
        
        codes.forEach(code => {
            const employeeNames = code.employeeIds
                .map(id => employeeMap.get(id))
                .filter(emp => emp)
                .map(emp => emp.name)
                .join(', ');
            
            html += `
                <tr>
                    <td><strong>${code.code}</strong></td>
                    <td>${employeeNames}</td>
                    <td>
                        <button class="btn btn-danger" onclick="deleteQuickCode('${code.code}')">حذف</button>
                    </td>
                </tr>
            `;
        });
        
        html += '</tbody></table></div>';
        listDiv.innerHTML = html;
    } catch (error) {
        console.error('Error loading saved codes:', error);
    }
}

async function deleteQuickCode(code) {
    if (!confirm(`هل أنت متأكد من حذف الرمز "${code}"؟`)) return;

    try {
        const transaction = db.db.transaction(['quickCodes'], 'readwrite');
        const store = transaction.objectStore('quickCodes');
        const request = store.delete(code);
        
        await new Promise((resolve, reject) => {
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
        
        await loadSavedCodes();
        alert('تم حذف الرمز بنجاح');
    } catch (error) {
        console.error('Error deleting quick code:', error);
        alert('حدث خطأ في حذف الرمز');
    }
}

// Auto-refresh function to update all data
async function refreshAllData() {
    try {
        // Refresh employees
        await loadEmployees();
        await loadEmployeeSelects();
        await loadMultiDayEmployeeSelect();
        await loadDashboardEmployees();
        await loadReportEmployees();
        
        // Refresh attendance if on attendance tab
        const attendanceTab = document.getElementById('attendance-tab');
        if (attendanceTab && attendanceTab.classList.contains('active')) {
            await loadTodayAttendance();
        }
        
        // Refresh payroll if on payroll tab
        const payrollTab = document.getElementById('payroll-tab');
        if (payrollTab && payrollTab.classList.contains('active')) {
            await loadPayrollEmployees();
        }
        
        // Refresh dashboard if on dashboard tab
        const dashboardTab = document.getElementById('dashboard-tab');
        if (dashboardTab && dashboardTab.classList.contains('active')) {
            await loadDashboard();
        }
    } catch (error) {
        console.error('Error refreshing data:', error);
    }
}

// ==================== Multiple Days Attendance ====================

function updateMultiDayPreview() {
    const startDate = document.getElementById('multiDayStartDate').value;
    const endDate = document.getElementById('multiDayEndDate').value;
    const excludeWeekends = document.getElementById('excludeWeekends').checked;
    const previewDiv = document.getElementById('multiDayPreview');
    const countSpan = document.getElementById('previewDaysCount');

    if (!startDate || !endDate) {
        previewDiv.style.display = 'none';
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        previewDiv.style.display = 'none';
        return;
    }

    let count = 0;
    const current = new Date(start);
    
    while (current <= end) {
        const dayOfWeek = current.getDay();
        // 5 = Friday, 6 = Saturday
        if (!excludeWeekends || (dayOfWeek !== 5 && dayOfWeek !== 6)) {
            count++;
        }
        current.setDate(current.getDate() + 1);
    }

    countSpan.textContent = count;
    previewDiv.style.display = 'block';
}

async function markMultipleDays() {
    const employeeId = parseInt(document.getElementById('multiDayEmployeeSelect').value);
    const startDate = document.getElementById('multiDayStartDate').value;
    const endDate = document.getElementById('multiDayEndDate').value;
    const status = document.getElementById('multiDayStatus').value;
    const excludeWeekends = document.getElementById('excludeWeekends').checked;

    if (!employeeId || !startDate || !endDate) {
        alert('يرجى إدخال جميع البيانات المطلوبة');
        return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
        alert('تاريخ البداية يجب أن يكون قبل تاريخ النهاية');
        return;
    }

    if (!confirm('هل أنت متأكد من تسجيل الدوام لجميع الأيام المحددة؟')) {
        return;
    }

    try {
        const btn = document.getElementById('markMultipleDaysBtn');
        const originalText = btn.textContent;
        btn.disabled = true;
        btn.textContent = 'جاري التسجيل...';

        let successCount = 0;
        let skipCount = 0; // عطلة نهاية الأسبوع
        let failedCount = 0; // أيام فشل تسجيلها (قبل التعيين، بعد الإيقاف/الإنهاء، أو أي سبب آخر)
        const current = new Date(start);
        
        while (current <= end) {
            const dayOfWeek = current.getDay();
            const dateStr = current.toISOString().split('T')[0];
            
            // Skip weekends if option is checked
            if (excludeWeekends && (dayOfWeek === 5 || dayOfWeek === 6)) {
                skipCount++;
            } else {
                try {
                    await markAttendance(employeeId, dateStr, status);
                    successCount++;
                } catch (error) {
                    console.error(`Error marking attendance for ${dateStr}:`, error);
                    failedCount++;
                }
            }
            
            current.setDate(current.getDate() + 1);
        }

        btn.disabled = false;
        btn.textContent = originalText;

        // Clear form
        document.getElementById('multiDayEmployeeSelect').value = '';
        document.getElementById('multiDayStartDate').value = '';
        document.getElementById('multiDayEndDate').value = '';
        document.getElementById('multiDayStatus').value = 'present';
        document.getElementById('excludeWeekends').checked = false;
        document.getElementById('multiDayPreview').style.display = 'none';

        let message = `تم تسجيل ${successCount} يوم بنجاح`;
        if (skipCount > 0) {
            message += ` (تم تخطي ${skipCount} يوم - عطلة نهاية الأسبوع)`;
        }
        if (failedCount > 0) {
            message += ` (تعذر تسجيل ${failedCount} يوم - تحقق من تاريخ التعيين أو الإيقاف/إنهاء الخدمة)`;
        }
        alert(message);

        // Reload today's attendance if the current date is in range
        const today = new Date().toISOString().split('T')[0];
        if (today >= startDate && today <= endDate) {
            await loadTodayAttendance();
        }
    } catch (error) {
        console.error('Error marking multiple days:', error);
        alert('حدث خطأ في تسجيل الدوام');
        document.getElementById('markMultipleDaysBtn').disabled = false;
        document.getElementById('markMultipleDaysBtn').textContent = 'تسجيل الأيام المحددة';
    }
}

