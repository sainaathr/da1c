// Constants
const OT_RATE = 150.0;
const STORAGE_KEY = 'payroll_data';

// State
let employees = [];
let charts = {
    expense: null,
    top: null
};

// DOM Elements
const modals = {
    add: document.getElementById('addModal'),
    payslipInit: document.getElementById('payslipInitModal'),
    payslipView: document.getElementById('payslipViewModal'),
    delete: document.getElementById('deleteModal')
};

const forms = { add: document.getElementById('employeeForm') };
const selects = {
    payslip: document.getElementById('payslipSelect'),
    delete: document.getElementById('deleteSelect')
};
const searchInputs = {
    payslip: document.getElementById('payslipSearch'),
    delete: document.getElementById('deleteSearch')
};
const messages = {
    add: document.getElementById('addMessage'),
    payslip: document.getElementById('payslipMessage'),
    delete: document.getElementById('deleteMessage')
};

// Theme Toggle
const themeToggleBtn = document.getElementById('themeToggle');
let isDarkMode = localStorage.getItem('theme') === 'dark';

if (isDarkMode) {
    document.body.classList.add('dark-mode');
    themeToggleBtn.innerHTML = '<span class="theme-icon">☀️</span> Light Mode';
}

themeToggleBtn.addEventListener('click', () => {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    themeToggleBtn.innerHTML = isDarkMode ? '<span class="theme-icon">☀️</span> Light Mode' : '<span class="theme-icon">🌙</span> Dark Mode';
    updateCharts(); // Re-render charts for theme colors
});


// Format Currency
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR'
    }).format(amount);
};

// Calculate Salary Logic
const calculateSalary = (basicPay, otHours) => {
    const otPay = otHours * OT_RATE;
    const grossPay = basicPay + otPay;
    
    let taxDeduction = 0;
    if (grossPay > 50000) {
        taxDeduction = grossPay * 0.20;
    } else if (grossPay > 30000) {
        taxDeduction = grossPay * 0.10;
    }
    
    const netPay = grossPay - taxDeduction;
    return { otPay, grossPay, taxDeduction, netPay };
};

// LocalStorage
const saveRecords = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    updateCharts();
};
const loadRecords = () => {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) employees = JSON.parse(data);
    updateCharts();
};

// Populate Select Dropdowns with Filter
const populateSelects = (filterText = '') => {
    const lowerFilter = filterText.toLowerCase();
    const filteredEmployees = employees.filter(emp => 
        emp.name.toLowerCase().includes(lowerFilter) || 
        emp.empID.toLowerCase().includes(lowerFilter)
    );
    
    const optionsHtml = filteredEmployees.length > 0 
        ? filteredEmployees.map(emp => `<option value="${emp.empID}">${emp.empID} - ${emp.name}</option>`).join('')
        : `<option value="" disabled>No employees found</option>`;
        
    selects.payslip.innerHTML = optionsHtml;
    selects.delete.innerHTML = optionsHtml;
};

searchInputs.payslip.addEventListener('input', (e) => populateSelects(e.target.value));
searchInputs.delete.addEventListener('input', (e) => populateSelects(e.target.value));


// Show Message Utility
const showMessage = (element, msg, type = 'success') => {
    element.textContent = msg;
    element.className = `message ${type}`;
    setTimeout(() => { element.className = 'message hidden'; }, 3000);
};

// Navigation (Open Modals)
document.getElementById('btnOpenAdd').addEventListener('click', () => {
    forms.add.reset();
    modals.add.style.display = 'block';
});

document.getElementById('btnOpenPayslip').addEventListener('click', () => {
    searchInputs.payslip.value = '';
    populateSelects();
    modals.payslipInit.style.display = 'block';
});

document.getElementById('btnOpenDelete').addEventListener('click', () => {
    searchInputs.delete.value = '';
    populateSelects();
    modals.delete.style.display = 'block';
});

// CSV Export
document.getElementById('btnExport').addEventListener('click', () => {
    if (employees.length === 0) {
        alert('No employee records to export!');
        return;
    }
    
    const headers = ['Employee ID', 'Name', 'Basic Pay', 'OT Hours', 'OT Pay', 'Gross Pay', 'Tax Deduction', 'Net Pay'];
    const rows = employees.map(emp => [
        emp.empID,
        `"${emp.name}"`,
        emp.basicPay,
        emp.otHours,
        emp.otPay,
        emp.grossPay,
        emp.taxDeduction,
        emp.netPay
    ]);
    
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'employee_payroll.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// Close Modals
document.querySelectorAll('.close-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.target.getAttribute('data-modal');
        document.getElementById(modalId).style.display = 'none';
    });
});

window.onclick = function(event) {
    Object.values(modals).forEach(modal => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
};

// Add Employee Logic
forms.add.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const empID = document.getElementById('empID').value;
    const name = document.getElementById('empName').value;
    const basicPay = parseFloat(document.getElementById('basicPay').value);
    const otHours = parseFloat(document.getElementById('otHours').value) || 0;
    
    if (employees.some(emp => emp.empID === empID)) {
        showMessage(messages.add, 'Employee ID already exists!', 'error');
        return;
    }
    
    const calculated = calculateSalary(basicPay, otHours);
    employees.push({ empID, name, basicPay, otHours, ...calculated });
    saveRecords();
    
    forms.add.reset();
    showMessage(messages.add, 'Employee created successfully!');
    populateSelects();
});

// Generate Payslip Logic
document.getElementById('btnGeneratePayslip').addEventListener('click', () => {
    const empID = selects.payslip.value;
    if (!empID) {
        showMessage(messages.payslip, 'Please select an employee.', 'error');
        return;
    }
    
    const emp = employees.find(e => e.empID === empID);
    if (!emp) return;
    
    document.getElementById('payslipContent').innerHTML = `
        <div class="payslip-row">
            <span>Employee ID:</span>
            <strong>${emp.empID}</strong>
        </div>
        <div class="payslip-row">
            <span>Employee Name:</span>
            <strong>${emp.name}</strong>
        </div>
        
        <div class="payslip-section-title">Earnings</div>
        <div class="payslip-row">
            <span>Basic Pay:</span>
            <span>${formatCurrency(emp.basicPay)}</span>
        </div>
        <div class="payslip-row">
            <span>Overtime (${emp.otHours} hrs @ ₹${OT_RATE}/hr):</span>
            <span>${formatCurrency(emp.otPay)}</span>
        </div>
        <div class="payslip-row" style="font-weight: 600; background: ${isDarkMode ? '#334155' : '#f8fafc'}; padding: 10px; margin-top: 5px; border-radius: 6px;">
            <span>Gross Pay:</span>
            <span>${formatCurrency(emp.grossPay)}</span>
        </div>
        
        <div class="payslip-section-title">Deductions</div>
        <div class="payslip-row">
            <span>Tax Deduction:</span>
            <span style="color: var(--danger-color)">- ${formatCurrency(emp.taxDeduction)}</span>
        </div>
        
        <div class="payslip-row total">
            <span>NET PAY:</span>
            <span style="color: var(--success-color)">${formatCurrency(emp.netPay)}</span>
        </div>
    `;
    
    modals.payslipInit.style.display = 'none';
    modals.payslipView.style.display = 'block';
});

// Print Payslip Logic
document.getElementById('printBtn').addEventListener('click', () => {
    const printContent = document.getElementById('payslipContainer').innerHTML;
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    
    iframe.contentWindow.document.open();
    iframe.contentWindow.document.write(`
        <html>
        <head>
            <title>Payslip</title>
            <style>
                body { font-family: 'Inter', sans-serif; line-height: 1.6; color: #1e293b; padding: 20px; }
                .payslip-header { text-align: center; border-bottom: 2px solid #1e293b; padding-bottom: 20px; margin-bottom: 20px; }
                .payslip-header h2 { margin: 0; font-size: 24px; letter-spacing: 2px; border:none; padding:0; }
                .payslip-header p { color: #64748b; margin: 5px 0 0 0; }
                .payslip-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #e2e8f0; }
                .payslip-section-title { font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 600; margin: 20px 0 10px; }
                .total { border-bottom: none; border-top: 2px solid #1e293b; padding-top: 15px; margin-top: 10px; font-weight: 700; font-size: 18px; }
                .payslip-footer, .close-btn { display: none; }
            </style>
        </head>
        <body>${printContent}</body>
        </html>
    `);
    iframe.contentWindow.document.close();
    
    setTimeout(() => {
        iframe.contentWindow.print();
        document.body.removeChild(iframe);
    }, 500);
});

// Delete Employee Logic
document.getElementById('btnConfirmDelete').addEventListener('click', () => {
    const empID = selects.delete.value;
    if (!empID) {
        showMessage(messages.delete, 'Please select an employee.', 'error');
        return;
    }
    
    if (confirm('Are you sure you want to delete this employee record?')) {
        employees = employees.filter(emp => emp.empID !== empID);
        saveRecords();
        populateSelects();
        showMessage(messages.delete, 'Employee deleted successfully!');
    }
});

// Setup Chart Colors
const getChartColors = () => {
    return isDarkMode ? {
        text: '#f8fafc',
        grid: '#334155',
        blue: '#3b82f6',
        green: '#10b981',
        purple: '#a855f7',
        red: '#ef4444'
    } : {
        text: '#1e293b',
        grid: '#e2e8f0',
        blue: '#3b82f6',
        green: '#10b981',
        purple: '#a855f7',
        red: '#ef4444'
    };
};

// Update Dashboard Charts
const updateCharts = () => {
    const emptyMsg = document.getElementById('dashboardEmptyMsg');
    const chartContainers = document.querySelectorAll('.chart-container');
    
    if (employees.length === 0) {
        emptyMsg.style.display = 'block';
        chartContainers.forEach(c => c.style.display = 'none');
        return;
    }
    
    emptyMsg.style.display = 'none';
    chartContainers.forEach(c => c.style.display = 'block');
    
    const colors = getChartColors();
    Chart.defaults.color = colors.text;
    
    // Destroy existing charts
    if (charts.expense) charts.expense.destroy();
    if (charts.top) charts.top.destroy();
    
    // 1. Overall Expense Distribution (Doughnut)
    const totalBasic = employees.reduce((sum, e) => sum + e.basicPay, 0);
    const totalOT = employees.reduce((sum, e) => sum + e.otPay, 0);
    const totalTax = employees.reduce((sum, e) => sum + e.taxDeduction, 0);
    const totalNet = employees.reduce((sum, e) => sum + e.netPay, 0);
    
    const ctxExpense = document.getElementById('expenseChart').getContext('2d');
    charts.expense = new Chart(ctxExpense, {
        type: 'doughnut',
        data: {
            labels: ['Total Basic Pay', 'Total OT Pay', 'Total Taxes Deducted'],
            datasets: [{
                data: [totalBasic, totalOT, totalTax],
                backgroundColor: [colors.blue, colors.green, colors.red],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
    
    // 2. Top 5 Highest Paid (Bar)
    const topEmployees = [...employees].sort((a,b) => b.grossPay - a.grossPay).slice(0, 5);
    
    const ctxTop = document.getElementById('topEmployeesChart').getContext('2d');
    charts.top = new Chart(ctxTop, {
        type: 'bar',
        data: {
            labels: topEmployees.map(e => e.name),
            datasets: [{
                label: 'Gross Pay (₹)',
                data: topEmployees.map(e => e.grossPay),
                backgroundColor: colors.purple,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { grid: { color: colors.grid } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
};

// Init
loadRecords();
