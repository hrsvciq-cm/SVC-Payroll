// Script لتصدير البيانات من IndexedDB (النظام المحلي)
// استخدم: افتح المتصفح وافتح Console، ثم انسخ والصق هذا الكود

const exportIndexedDBData = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('PayrollSystem', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const data = {
        employees: [],
        attendance: [],
        payroll: [],
        deductions: [],
        quickCodes: []
      };
      
      // تصدير الموظفين
      const empTransaction = db.transaction(['employees'], 'readonly');
      const empStore = empTransaction.objectStore('employees');
      const empRequest = empStore.getAll();
      
      empRequest.onsuccess = () => {
        data.employees = empRequest.result;
        
        // تصدير الحضور
        const attTransaction = db.transaction(['attendance'], 'readonly');
        const attStore = attTransaction.objectStore('attendance');
        const attRequest = attStore.getAll();
        
        attRequest.onsuccess = () => {
          data.attendance = attRequest.result;
          
          // تصدير الرواتب
          const payTransaction = db.transaction(['payroll'], 'readonly');
          const payStore = payTransaction.objectStore('payroll');
          const payRequest = payStore.getAll();
          
          payRequest.onsuccess = () => {
            data.payroll = payRequest.result;
            
            // تصدير الخصومات
            const dedTransaction = db.transaction(['deductions'], 'readonly');
            const dedStore = dedTransaction.objectStore('deductions');
            const dedRequest = dedStore.getAll();
            
            dedRequest.onsuccess = () => {
              data.deductions = dedRequest.result;
              
              // تصدير الرموز السريعة
              const codeTransaction = db.transaction(['quickCodes'], 'readonly');
              const codeStore = codeTransaction.objectStore('quickCodes');
              const codeRequest = codeStore.getAll();
              
              codeRequest.onsuccess = () => {
                data.quickCodes = codeRequest.result;
                data.exportDate = new Date().toISOString();
                
                // تحميل الملف
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
                
                console.log('✅ تم تصدير البيانات بنجاح!');
                console.log(`📊 الموظفين: ${data.employees.length}`);
                console.log(`📅 الحضور: ${data.attendance.length}`);
                console.log(`💰 الرواتب: ${data.payroll.length}`);
                console.log(`💸 الخصومات: ${data.deductions.length}`);
                console.log(`🔑 الرموز السريعة: ${data.quickCodes.length}`);
                
                resolve(data);
              };
              
              codeRequest.onerror = () => reject(codeRequest.error);
            };
            
            dedRequest.onerror = () => reject(dedRequest.error);
          };
          
          payRequest.onerror = () => reject(payRequest.error);
        };
        
        attRequest.onerror = () => reject(attRequest.error);
      };
      
      empRequest.onerror = () => reject(empRequest.error);
    };
  });
};

// تشغيل التصدير
exportIndexedDBData().catch(error => {
  console.error('❌ خطأ في التصدير:', error);
});

