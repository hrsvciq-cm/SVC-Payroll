// Database Management using IndexedDB
class PayrollDatabase {
    constructor() {
        this.db = null;
        this.dbName = 'PayrollSystem';
        this.version = 1;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Employees Store
                if (!db.objectStoreNames.contains('employees')) {
                    const employeeStore = db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true });
                    employeeStore.createIndex('employeeNumber', 'employeeNumber', { unique: true });
                    employeeStore.createIndex('department', 'department', { unique: false });
                    employeeStore.createIndex('status', 'status', { unique: false });
                }

                // Attendance Store
                if (!db.objectStoreNames.contains('attendance')) {
                    const attendanceStore = db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true });
                    attendanceStore.createIndex('employeeId', 'employeeId', { unique: false });
                    attendanceStore.createIndex('date', 'date', { unique: false });
                    attendanceStore.createIndex('employeeDate', ['employeeId', 'date'], { unique: true });
                }

                // Payroll Store
                if (!db.objectStoreNames.contains('payroll')) {
                    const payrollStore = db.createObjectStore('payroll', { keyPath: 'id', autoIncrement: true });
                    payrollStore.createIndex('employeeId', 'employeeId', { unique: false });
                    payrollStore.createIndex('month', 'month', { unique: false });
                    payrollStore.createIndex('employeeMonth', ['employeeId', 'month'], { unique: true });
                }

                // Deductions Store
                if (!db.objectStoreNames.contains('deductions')) {
                    const deductionStore = db.createObjectStore('deductions', { keyPath: 'id', autoIncrement: true });
                    deductionStore.createIndex('employeeId', 'employeeId', { unique: false });
                    deductionStore.createIndex('month', 'month', { unique: false });
                }

                // Quick Codes Store
                if (!db.objectStoreNames.contains('quickCodes')) {
                    const codeStore = db.createObjectStore('quickCodes', { keyPath: 'code', unique: true });
                    codeStore.createIndex('employeeIds', 'employeeIds', { unique: false });
                }
            };
        });
    }

    // Employees Operations
    async addEmployee(employee) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['employees'], 'readwrite');
            const store = transaction.objectStore('employees');
            const request = store.add(employee);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateEmployee(id, employee) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['employees'], 'readwrite');
            const store = transaction.objectStore('employees');
            employee.id = id;
            const request = store.put(employee);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getEmployee(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['employees'], 'readonly');
            const store = transaction.objectStore('employees');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllEmployees() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['employees'], 'readonly');
            const store = transaction.objectStore('employees');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getActiveEmployees() {
        const employees = await this.getAllEmployees();
        return employees.filter(emp => emp.status === 'active');
    }

    async deleteEmployee(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['employees'], 'readwrite');
            const store = transaction.objectStore('employees');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Attendance Operations
    async addAttendance(attendance) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');
            const request = store.add(attendance);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateAttendance(id, attendance) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');
            attendance.id = id;
            const request = store.put(attendance);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByDate(date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const index = store.index('date');
            const request = index.getAll(date);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendance(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByEmployeeAndDate(employeeId, date) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const index = store.index('employeeDate');
            const request = index.get([employeeId, date]);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAttendanceByEmployeeAndMonth(employeeId, month) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const index = store.index('employeeId');
            const request = index.getAll(employeeId);
            
            request.onsuccess = () => {
                const allAttendance = request.result;
                resolve(allAttendance.filter(att => att.date.startsWith(month)));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async deleteAttendance(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readwrite');
            const store = transaction.objectStore('attendance');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Payroll Operations
    async savePayroll(payroll) {
        return new Promise(async (resolve, reject) => {
            try {
                const transaction = this.db.transaction(['payroll'], 'readwrite');
                const store = transaction.objectStore('payroll');
                const index = store.index('employeeMonth');
                const getRequest = index.get([payroll.employeeId, payroll.month]);
                
                getRequest.onsuccess = () => {
                    const existing = getRequest.result;
                    if (existing) {
                        payroll.id = existing.id;
                        const putRequest = store.put(payroll);
                        putRequest.onsuccess = () => resolve(putRequest.result);
                        putRequest.onerror = () => reject(putRequest.error);
                    } else {
                        const addRequest = store.add(payroll);
                        addRequest.onsuccess = () => resolve(addRequest.result);
                        addRequest.onerror = () => reject(addRequest.error);
                    }
                };
                getRequest.onerror = () => reject(getRequest.error);
            } catch (error) {
                reject(error);
            }
        });
    }

    async getPayrollByMonth(month) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['payroll'], 'readonly');
            const store = transaction.objectStore('payroll');
            const index = store.index('month');
            const request = index.getAll(month);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getPayrollByEmployeeAndMonth(employeeId, month) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['payroll'], 'readonly');
            const store = transaction.objectStore('payroll');
            const index = store.index('employeeMonth');
            const request = index.get([employeeId, month]);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Deductions Operations
    async addDeduction(deduction) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deductions'], 'readwrite');
            const store = transaction.objectStore('deductions');
            const request = store.add(deduction);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getDeductionsByEmployeeAndMonth(employeeId, month) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deductions'], 'readonly');
            const store = transaction.objectStore('deductions');
            const index = store.index('employeeId');
            const request = index.getAll(employeeId);
            
            request.onsuccess = () => {
                const allDeductions = request.result;
                resolve(allDeductions.filter(ded => ded.month === month));
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getDeduction(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deductions'], 'readonly');
            const store = transaction.objectStore('deductions');
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateDeduction(id, deduction) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deductions'], 'readwrite');
            const store = transaction.objectStore('deductions');
            deduction.id = id;
            const request = store.put(deduction);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteDeduction(id) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deductions'], 'readwrite');
            const store = transaction.objectStore('deductions');
            const request = store.delete(id);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Quick Codes Operations
    async addQuickCode(code, employeeIds) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['quickCodes'], 'readwrite');
            const store = transaction.objectStore('quickCodes');
            const request = store.put({ code, employeeIds });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getQuickCode(code) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['quickCodes'], 'readonly');
            const store = transaction.objectStore('quickCodes');
            const request = store.get(code);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Backup and Restore
    async exportData() {
        const employees = await this.getAllEmployees();
        const attendance = await this.getAllAttendance();
        const payroll = await this.getAllPayroll();
        const deductions = await this.getAllDeductions();
        const quickCodes = await this.getAllQuickCodes();

        return {
            employees,
            attendance,
            payroll,
            deductions,
            quickCodes,
            exportDate: new Date().toISOString()
        };
    }

    async getAllAttendance() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['attendance'], 'readonly');
            const store = transaction.objectStore('attendance');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllPayroll() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['payroll'], 'readonly');
            const store = transaction.objectStore('payroll');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllDeductions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['deductions'], 'readonly');
            const store = transaction.objectStore('deductions');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllQuickCodes() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['quickCodes'], 'readonly');
            const store = transaction.objectStore('quickCodes');
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async importData(data) {
        const transaction = this.db.transaction(
            ['employees', 'attendance', 'payroll', 'deductions', 'quickCodes'],
            'readwrite'
        );

        // Clear existing data
        await Promise.all([
            transaction.objectStore('employees').clear(),
            transaction.objectStore('attendance').clear(),
            transaction.objectStore('payroll').clear(),
            transaction.objectStore('deductions').clear(),
            transaction.objectStore('quickCodes').clear()
        ]);

        // Import new data
        const promises = [];

        if (data.employees) {
            data.employees.forEach(emp => {
                promises.push(transaction.objectStore('employees').add(emp));
            });
        }

        if (data.attendance) {
            data.attendance.forEach(att => {
                promises.push(transaction.objectStore('attendance').add(att));
            });
        }

        if (data.payroll) {
            data.payroll.forEach(pay => {
                promises.push(transaction.objectStore('payroll').add(pay));
            });
        }

        if (data.deductions) {
            data.deductions.forEach(ded => {
                promises.push(transaction.objectStore('deductions').add(ded));
            });
        }

        if (data.quickCodes) {
            data.quickCodes.forEach(code => {
                promises.push(transaction.objectStore('quickCodes').add(code));
            });
        }

        return Promise.all(promises);
    }
}

// Initialize database instance
const db = new PayrollDatabase();

