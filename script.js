// ===== بيانات =====
let students = [];
let groups = [];
let attendance = [];
let grades = [];
let currentStudentId = null;
let charts = {};

// ===== الكاميرا وقراءة الباركود =====
let html5QrCode = null;
let isCameraRunning = false;

// ===== العينين =====
const eyes = document.querySelectorAll('.eye');
const pupils = document.querySelectorAll('.pupil');

if (eyes.length > 0) {
    document.addEventListener('mousemove', function(e) {
        pupils.forEach((pupil, index) => {
            const eye = eyes[index];
            const eyeRect = eye.getBoundingClientRect();
            const eyeCenterX = eyeRect.left + eyeRect.width / 2;
            const eyeCenterY = eyeRect.top + eyeRect.height / 2;
            
            const angle = Math.atan2(e.clientY - eyeCenterY, e.clientX - eyeCenterX);
            const distance = Math.min(15, Math.hypot(e.clientX - eyeCenterX, e.clientY - eyeCenterY) / 10);
            
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            
            pupil.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
        });
    });
}

// ===== Dark Mode =====
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark);
    const items = document.querySelectorAll('.sidebar ul li');
    items.forEach(item => {
        if (item.textContent.includes('الوضع الداكن')) {
            item.textContent = isDark ? '☀️ الوضع الفاتح' : '🌙 الوضع الداكن';
        }
    });
}

if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    setTimeout(() => {
        const items = document.querySelectorAll('.sidebar ul li');
        items.forEach(item => {
            if (item.textContent.includes('الوضع الداكن')) {
                item.textContent = '☀️ الوضع الفاتح';
            }
        });
    }, 100);
}

// ===== تسجيل الدخول =====
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if ((username === 'admin' || username === 'secretary') && password === '123') {
            localStorage.setItem('username', username);
            window.location.href = 'dashboard.html';
        } else {
            document.getElementById('errorMessage').textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    });
}

// ===== window.onload =====
window.onload = function() {
    const userName = localStorage.getItem('username');
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) {
        if (userName === 'admin') userNameDisplay.textContent = '👤 مدير';
        else if (userName === 'secretary') userNameDisplay.textContent = '👤 سكرتيرة';
    }
    
    loadData();
    updateDashboard();
    loadStudents();
    loadGroups();
    loadGroupSelect();
    updateFilterGroups();
    loadCardStudents();
    showAlerts();
    updateCharts();
    
    if (window.location.pathname.includes('profile.html')) {
        loadProfileData();
    }

    const searchInput = document.getElementById('searchStudent');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') filterStudents();
        });
    }
    
    // التحقق من وجود طالب للتعديل من البروفايل
    if (window.location.pathname.includes('students.html')) {
        const editId = localStorage.getItem('editStudentId');
        if (editId) {
            localStorage.removeItem('editStudentId');
            setTimeout(() => {
                editStudent(editId);
            }, 500);
        }
    }
    
    console.log('✅ النظام جاهز. عدد الطلاب:', students.length);
};

// ===== تسجيل الخروج =====
function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('username');
        window.location.href = 'index.html';
    }
}

// ===== تحميل وحفظ البيانات =====
function loadData() {
    try {
        const savedStudents = localStorage.getItem('students');
        const savedGroups = localStorage.getItem('groups');
        const savedAttendance = localStorage.getItem('attendance');
        const savedGrades = localStorage.getItem('grades');
        
        students = savedStudents ? JSON.parse(savedStudents) : [];
        groups = savedGroups ? JSON.parse(savedGroups) : [];
        attendance = savedAttendance ? JSON.parse(savedAttendance) : [];
        grades = savedGrades ? JSON.parse(savedGrades) : [];
        console.log('✅ تم تحميل البيانات. عدد الطلاب:', students.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        students = []; groups = []; attendance = []; grades = [];
    }
}

function saveData() {
    try {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('groups', JSON.stringify(groups));
        localStorage.setItem('attendance', JSON.stringify(attendance));
        localStorage.setItem('grades', JSON.stringify(grades));
        console.log('✅ تم حفظ البيانات. عدد الطلاب:', students.length);
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
        alert('⚠️ حدث خطأ في حفظ البيانات');
    }
}

// ===== تحديث لوحة التحكم =====
function updateDashboard() {
    const totalStudents = document.getElementById('totalStudents');
    const presentToday = document.getElementById('presentToday');
    const absentToday = document.getElementById('absentToday');
    const totalGroups = document.getElementById('totalGroups');
    const totalFees = document.getElementById('totalFees');
    const attendanceRate = document.getElementById('attendanceRate');
    
    if (totalStudents) totalStudents.textContent = students.length;
    if (totalGroups) totalGroups.textContent = groups.length;
    
    if (totalFees) {
        let allFees = 0;
        students.forEach(s => allFees += (s.fees || 0));
        totalFees.textContent = allFees + ' ج';
    }
    
    const today = new Date().toDateString();
    const todayAttendance = attendance.filter(a => new Date(a.date).toDateString() === today);
    const present = todayAttendance.filter(a => a.status === 'present').length;
    const absent = todayAttendance.filter(a => a.status === 'absent').length;
    
    if (presentToday) presentToday.textContent = present;
    if (absentToday) absentToday.textContent = absent;
    
    if (attendanceRate) {
        const totalAttendance = attendance.length;
        const totalPresent = attendance.filter(a => a.status === 'present').length;
        const rate = totalAttendance > 0 ? Math.round((totalPresent / totalAttendance) * 100) : 0;
        attendanceRate.textContent = rate + '%';
    }
    
    updateRecentAttendance();
    showAlerts();
    updateCharts();
}

// ===== آخر الحضور =====
function updateRecentAttendance() {
    const tableBody = document.querySelector('#recentAttendance tbody');
    if (!tableBody) return;
    if (attendance.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#888;">لا توجد تسجيلات</td></tr>`;
        return;
    }
    const recent = attendance.slice(-5).reverse();
    tableBody.innerHTML = recent.map(a => {
        const student = students.find(s => s.id === a.studentId);
        const group = groups.find(g => g.id === a.groupId);
        const statusClass = a.status === 'present' ? 'status-present' : 'status-absent';
        const statusText = a.status === 'present' ? '✅ حاضر' : '❌ غائب';
        return `<tr><td>${student ? student.name : 'غير معروف'}</td><td>${group ? group.name : 'غير معروف'}</td><td class="${statusClass}">${statusText}</td><td>${new Date(a.date).toLocaleTimeString('ar-EG')}</td></tr>`;
    }).join('');
}

// ===== التنبيهات =====
function showAlerts() {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    let alerts = [];
    
    students.forEach(student => {
        const studentAttendance = attendance.filter(a => a.studentId === student.id).sort((a, b) => new Date(b.date) - new Date(a.date));
        if (studentAttendance.length >= 3) {
            let absentDays = 0;
            for (let i = 0; i < Math.min(3, studentAttendance.length); i++) {
                const date = new Date(studentAttendance[i].date);
                const today = new Date();
                const diffDays = Math.floor((today - date) / (1000 * 60 * 60 * 24));
                if (diffDays <= 3 && studentAttendance[i].status === 'absent') absentDays++;
            }
            if (absentDays >= 3) {
                alerts.push({ type: 'danger', message: `⚠️ الطالب <strong>${student.name}</strong> غاب 3 أيام متتالية!` });
            }
        }
        
        const totalFees = student.fees || 0;
        const paidFees = student.feesPaid || 0;
        const remaining = totalFees - paidFees;
        if (totalFees > 0 && remaining > totalFees / 2) {
            alerts.push({ type: 'warning', message: `💰 الطالب <strong>${student.name}</strong> متأخر في المصاريف (المتبقي: ${remaining} ج)` });
        }
    });
    
    if (alerts.length === 0) {
        container.innerHTML = `<div class="alert alert-success">✅ لا توجد تنبيهات - كل شيء على ما يرام</div>`;
    } else {
        container.innerHTML = alerts.map(alert => `
            <div class="alert alert-${alert.type}">
                <span>${alert.message}</span>
                <button class="alert-close" onclick="this.parentElement.remove()">✕</button>
            </div>
        `).join('');
    }
}

// ===== الرسوم البيانية =====
function updateCharts() {
    if (typeof Chart === 'undefined') return;
    
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    
    const attendanceCtx = document.getElementById('attendanceChart');
    if (attendanceCtx) {
        if (charts.attendance) charts.attendance.destroy();
        charts.attendance = new Chart(attendanceCtx, {
            type: 'doughnut',
            data: {
                labels: ['✅ حضور', '❌ غياب'],
                datasets: [{ data: [present || 1, absent || 1], backgroundColor: ['#27ae60', '#e74c3c'] }]
            },
            options: { responsive: true, plugins: { legend: { position: 'bottom' } } }
        });
    }
    
    const gradeValues = grades.map(g => g.value);
    const gradeRanges = { 'ممتاز (90-100)': 0, 'جيد جداً (80-89)': 0, 'جيد (70-79)': 0, 'مقبول (60-69)': 0, 'ضعيف (<60)': 0 };
    gradeValues.forEach(v => {
        if (v >= 90) gradeRanges['ممتاز (90-100)']++;
        else if (v >= 80) gradeRanges['جيد جداً (80-89)']++;
        else if (v >= 70) gradeRanges['جيد (70-79)']++;
        else if (v >= 60) gradeRanges['مقبول (60-69)']++;
        else gradeRanges['ضعيف (<60)']++;
    });
    
    const gradesCtx = document.getElementById('gradesChart');
    if (gradesCtx) {
        if (charts.grades) charts.grades.destroy();
        charts.grades = new Chart(gradesCtx, {
            type: 'bar',
            data: {
                labels: Object.keys(gradeRanges),
                datasets: [{ label: 'عدد الطلاب', data: Object.values(gradeRanges), backgroundColor: ['#27ae60', '#2ecc71', '#f1c40f', '#e67e22', '#e74c3c'] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
    
    const groupsCtx = document.getElementById('groupsChart');
    if (groupsCtx) {
        if (charts.groups) charts.groups.destroy();
        const groupNames = groups.map(g => g.name);
        const groupAttendance = groups.map(g => {
            const groupStudents = students.filter(s => s.groupId === g.id);
            const groupAttendanceRecords = attendance.filter(a => groupStudents.some(s => s.id === a.studentId));
            const presentCount = groupAttendanceRecords.filter(a => a.status === 'present').length;
            const totalCount = groupAttendanceRecords.length || 1;
            return Math.round((presentCount / totalCount) * 100);
        });
        charts.groups = new Chart(groupsCtx, {
            type: 'bar',
            data: {
                labels: groupNames,
                datasets: [{ label: 'نسبة الحضور %', data: groupAttendance, backgroundColor: ['#667eea', '#764ba2', '#27ae60', '#f39c12', '#e74c3c'] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }
}

// ===== إدارة الطلاب =====
function showAddStudent() {
    document.getElementById('addStudentForm').style.display = 'block';
    document.getElementById('editStudentForm').style.display = 'none';
    loadGroupSelect();
}

function hideAddStudent() {
    document.getElementById('addStudentForm').style.display = 'none';
}

function loadGroupSelect() {
    const select = document.getElementById('studentGroup');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر مجموعة --</option>';
    groups.forEach(g => {
        select.innerHTML += `<option value="${g.id}">${g.name}</option>`;
    });
}

function saveStudent() {
    const name = document.getElementById('studentName').value;
    const phone = document.getElementById('studentPhone').value;
    const groupId = document.getElementById('studentGroup').value;
    const fees = document.getElementById('studentFees').value || 0;
    
    if (!name) {
        alert('⚠️ من فضلك أدخل اسم الطالب');
        return;
    }
    
    let lastCode = 1000;
    if (students.length > 0) {
        const codes = students.map(s => parseInt(s.code) || 0);
        lastCode = Math.max(...codes);
    }
    const newCode = lastCode + 1;
    
    const student = {
        id: Date.now().toString(),
        name: name,
        phone: phone,
        groupId: groupId,
        code: newCode.toString(),
        fees: parseFloat(fees) || 0,
        feesPaid: 0,
        feesHistory: [],
        createdAt: new Date().toISOString()
    };
    
    students.push(student);
    saveData();
    loadStudents();
    updateDashboard();
    updateFilterGroups();
    loadGroupSelect();
    loadCardStudents();
    hideAddStudent();
    showAlerts();
    updateCharts();
    
    alert(`✅ تم إضافة الطالب بنجاح\n📌 الكود: ${newCode}`);
    
    document.getElementById('studentName').value = '';
    document.getElementById('studentPhone').value = '';
    document.getElementById('studentGroup').value = '';
    document.getElementById('studentFees').value = '';
}

function loadStudents() {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;padding:30px;">📭 لا يوجد طلاب</td></tr>`;
        return;
    }
    tableBody.innerHTML = students.map((s, index) => {
        const group = groups.find(g => g.id === s.groupId);
        return `<tr>
            <td>${index + 1}</td>
            <td><strong>${s.code}</strong></td>
            <td>${s.name}</td>
            <td>${group ? group.name : 'غير محدد'}</td>
            <td>${s.fees || 0} ج</td>
            <td><img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${s.code}" class="qr-code-small" alt="QR"></td>
            <td>
                <button class="btn-primary" onclick="editStudent('${s.id}')" style="padding:5px 10px;font-size:12px;">✏️ تعديل</button>
                <button class="btn-primary" onclick="viewProfile('${s.id}')" style="padding:5px 10px;font-size:12px;">👤 عرض</button>
                <button class="btn-danger" onclick="deleteStudent('${s.id}')" style="padding:5px 10px;font-size:12px;">🗑️ حذف</button>
            </td>
        </tr>`;
    }).join('');
}

function viewProfile(studentId) {
    localStorage.setItem('viewStudentId', studentId);
    window.location.href = 'profile.html';
}

function deleteStudent(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        students = students.filter(s => s.id !== id);
        saveData();
        loadStudents();
        updateDashboard();
        showAlerts();
        updateCharts();
        alert('✅ تم حذف الطالب');
    }
}

// ===== تعديل الطالب =====
function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('⚠️ الطالب غير موجود');
        return;
    }
    
    document.getElementById('editStudentId').value = studentId;
    document.getElementById('editStudentName').value = student.name;
    document.getElementById('editStudentPhone').value = student.phone || '';
    document.getElementById('editStudentFees').value = student.fees || 0;
    
    const select = document.getElementById('editStudentGroup');
    select.innerHTML = '<option value="">-- اختر مجموعة --</option>';
    groups.forEach(g => {
        const selected = g.id === student.groupId ? 'selected' : '';
        select.innerHTML += `<option value="${g.id}" ${selected}>${g.name}</option>`;
    });
    
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('editStudentForm').style.display = 'block';
    document.getElementById('editStudentForm').scrollIntoView({ behavior: 'smooth' });
}

function hideEditStudent() {
    document.getElementById('editStudentForm').style.display = 'none';
}

function saveEditStudent() {
    const studentId = document.getElementById('editStudentId').value;
    const name = document.getElementById('editStudentName').value;
    const phone = document.getElementById('editStudentPhone').value;
    const groupId = document.getElementById('editStudentGroup').value;
    const fees = document.getElementById('editStudentFees').value || 0;
    
    if (!name) {
        alert('⚠️ من فضلك أدخل اسم الطالب');
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('⚠️ الطالب غير موجود');
        return;
    }
    
    student.name = name;
    student.phone = phone;
    student.groupId = groupId;
    student.fees = parseFloat(fees);
    
    saveData();
    loadStudents();
    updateDashboard();
    updateFilterGroups();
    loadGroupSelect();
    loadCardStudents();
    showAlerts();
    updateCharts();
    
    hideEditStudent();
    alert('✅ تم تحديث بيانات الطالب بنجاح');
}

function editStudentFromProfile() {
    const studentId = localStorage.getItem('viewStudentId');
    if (studentId) {
        localStorage.setItem('editStudentId', studentId);
        window.location.href = 'students.html';
    }
}

// ===== بحث وفلترة =====
function filterStudents() {
    const searchText = document.getElementById('searchStudent').value.toLowerCase();
    const filterGroup = document.getElementById('filterGroup').value;
    let filteredStudents = students;
    if (searchText) {
        filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(searchText) || s.code.includes(searchText));
    }
    if (filterGroup) {
        filteredStudents = filteredStudents.filter(s => s.groupId === filterGroup);
    }
    displayFilteredStudents(filteredStudents);
}

function displayFilteredStudents(filteredStudents) {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:#888;">❌ لا توجد نتائج مطابقة</td></tr>`;
        return;
    }
    tableBody.innerHTML = filteredStudents.map((s, index) => {
        const group = groups.find(g => g.id === s.groupId);
        return `<tr>
            <td>${index + 1}</td>
            <td><strong>${s.code}</strong></td>
            <td>${s.name}</td>
            <td>${group ? group.name : 'غير محدد'}</td>
            <td>${s.fees || 0} ج</td>
            <td><img src="https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${s.code}" class="qr-code-small" alt="QR"></td>
            <td>
                <button class="btn-primary" onclick="editStudent('${s.id}')" style="padding:5px 10px;font-size:12px;">✏️ تعديل</button>
                <button class="btn-primary" onclick="viewProfile('${s.id}')" style="padding:5px 10px;font-size:12px;">👤 عرض</button>
                <button class="btn-danger" onclick="deleteStudent('${s.id}')" style="padding:5px 10px;font-size:12px;">🗑️ حذف</button>
            </td>
        </tr>`;
    }).join('');
}

function clearFilters() {
    document.getElementById('searchStudent').value = '';
    document.getElementById('filterGroup').value = '';
    loadStudents();
}

function updateFilterGroups() {
    const filterSelect = document.getElementById('filterGroup');
    if (!filterSelect) return;
    filterSelect.innerHTML = '<option value="">📋 جميع المجاميع</option>';
    groups.forEach(g => {
        filterSelect.innerHTML += `<option value="${g.id}">${g.name}</option>`;
    });
}

// ===== تصدير Excel =====
function exportToExcel() {
    if (students.length === 0) {
        alert('⚠️ لا يوجد طلاب للتصدير');
        return;
    }
    let csv = 'الكود,الاسم,المجموعة,المصاريف,المدفوع,المتبقي\n';
    students.forEach(s => {
        const group = groups.find(g => g.id === s.groupId);
        const paid = s.feesPaid || 0;
        const remaining = (s.fees || 0) - paid;
        csv += `${s.code},${s.name},${group ? group.name : 'غير محدد'},${s.fees || 0},${paid},${remaining}\n`;
    });
    csv += '\n\nسجل الحضور\nالطالب,الحالة,التاريخ\n';
    attendance.forEach(a => {
        const student = students.find(s => s.id === a.studentId);
        csv += `${student ? student.name : 'غير معروف'},${a.status === 'present' ? 'حاضر' : 'غائب'},${new Date(a.date).toLocaleDateString('ar-EG')}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `الطلاب_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
    alert('✅ تم تصدير البيانات بنجاح');
}

// ===== إدارة المجاميع =====
function showAddGroup() {
    document.getElementById('addGroupForm').style.display = 'block';
}

function hideAddGroup() {
    document.getElementById('addGroupForm').style.display = 'none';
}

function saveGroup() {
    const name = document.getElementById('groupName').value;
    const time = document.getElementById('groupTime').value;
    if (!name) {
        alert('⚠️ من فضلك أدخل اسم المجموعة');
        return;
    }
    const group = {
        id: Date.now().toString(),
        name: name,
        time: time || '00:00',
        createdAt: new Date().toISOString()
    };
    groups.push(group);
    saveData();
    loadGroups();
    hideAddGroup();
    updateDashboard();
    updateFilterGroups();
    loadGroupSelect();
    loadCardStudents();
    alert('✅ تم إضافة المجموعة بنجاح');
    document.getElementById('groupName').value = '';
    document.getElementById('groupTime').value = '';
}

function loadGroups() {
    const tableBody = document.getElementById('groupsTableBody');
    if (!tableBody) return;
    if (groups.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;">لا يوجد مجاميع</td></tr>`;
        return;
    }
    tableBody.innerHTML = groups.map((g, index) => {
        const studentCount = students.filter(s => s.groupId === g.id).length;
        return `<tr>
            <td>${index + 1}</td>
            <td>${g.name}</td>
            <td>${g.time}</td>
            <td>${studentCount}</td>
            <td><button class="btn-danger" onclick="deleteGroup('${g.id}')" style="padding:5px 10px;font-size:12px;">🗑️ حذف</button></td>
        </tr>`;
    }).join('');
}

function deleteGroup(id) {
    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
        groups = groups.filter(g => g.id !== id);
        saveData();
        loadGroups();
        updateDashboard();
        updateFilterGroups();
        loadGroupSelect();
        alert('✅ تم حذف المجموعة');
    }
}

// ===== تسجيل الحضور =====
function showManualAttendance() {
    if (isCameraRunning) {
        stopCameraReader();
    }
    document.getElementById('manualAttendance').style.display = 'block';
    document.getElementById('cameraAttendance').style.display = 'none';
    const select = document.getElementById('studentSelect');
    if (select) {
        select.innerHTML = '<option value="">-- اختر طالب --</option>';
        students.forEach(s => {
            select.innerHTML += `<option value="${s.id}">${s.name} (${s.code})</option>`;
        });
    }
}

function showCameraAttendance() {
    document.getElementById('cameraAttendance').style.display = 'block';
    document.getElementById('manualAttendance').style.display = 'none';
    setTimeout(() => {
        startCameraReader();
    }, 500);
}

function saveManualAttendance() {
    const studentId = document.getElementById('studentSelect').value;
    const status = document.getElementById('attendanceStatus').value;
    if (!studentId) {
        alert('⚠️ من فضلك اختر طالب');
        return;
    }
    const student = students.find(s => s.id === studentId);
    const record = {
        id: Date.now().toString(),
        studentId: studentId,
        groupId: student.groupId || 'unknown',
        status: status,
        date: new Date().toISOString(),
        method: 'manual'
    };
    attendance.push(record);
    saveData();
    updateDashboard();
    alert('✅ تم تسجيل الحضور بنجاح');
    sendWhatsAppDirect(studentId, status);
}

// ===== الكاميرا =====
function startCameraReader() {
    const readerElement = document.getElementById('reader');
    const resultElement = document.getElementById('scanResult');
    
    if (!readerElement) {
        console.error('❌ عنصر القارئ غير موجود');
        return;
    }
    
    if (isCameraRunning) {
        if (resultElement) {
            resultElement.textContent = '📷 الكاميرا تعمل بالفعل';
            resultElement.style.color = '#27ae60';
        }
        return;
    }
    
    if (resultElement) {
        resultElement.textContent = '📷 جاري تشغيل الكاميرا...';
        resultElement.style.color = '#667eea';
        resultElement.style.background = '#f5f7fa';
    }
    
    if (typeof Html5Qrcode === 'undefined') {
        if (resultElement) {
            resultElement.textContent = '❌ جاري تحميل مكتبة الباركود... يرجى الانتظار';
            resultElement.style.color = '#e74c3c';
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode';
        script.onload = function() {
            startCameraReader();
        };
        document.head.appendChild(script);
        return;
    }
    
    try {
        html5QrCode = new Html5Qrcode("reader");
        
        const config = {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
        };
        
        html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanError
        ).then(() => {
            isCameraRunning = true;
            if (resultElement) {
                resultElement.textContent = '📷 الكاميرا تعمل... ضع الباركود أمام الكاميرا';
                resultElement.style.color = '#27ae60';
                resultElement.style.background = '#d4edda';
            }
            console.log('✅ الكاميرا تعمل');
        }).catch(err => {
            console.error('❌ خطأ في تشغيل الكاميرا:', err);
            if (resultElement) {
                resultElement.textContent = '❌ لا يمكن تشغيل الكاميرا: ' + err.message;
                resultElement.style.color = '#e74c3c';
                resultElement.style.background = '#f8d7da';
            }
        });
    } catch (error) {
        console.error('❌ خطأ:', error);
        if (resultElement) {
            resultElement.textContent = '❌ حدث خطأ: ' + error.message;
            resultElement.style.color = '#e74c3c';
        }
    }
}

function onScanSuccess(decodedText, decodedResult) {
    console.log('✅ تم مسح الكود:', decodedText);
    
    const resultElement = document.getElementById('scanResult');
    const student = students.find(s => s.code === decodedText);
    
    if (student) {
        const record = {
            id: Date.now().toString(),
            studentId: student.id,
            groupId: student.groupId || 'unknown',
            status: 'present',
            date: new Date().toISOString(),
            method: 'camera'
        };
        
        attendance.push(record);
        saveData();
        updateDashboard();
        
        if (resultElement) {
            resultElement.innerHTML = `✅ <strong>تم تسجيل حضور: ${student.name}</strong> (الكود: ${student.code})`;
            resultElement.style.color = '#155724';
            resultElement.style.background = '#d4edda';
        }
        
        sendWhatsAppDirect(student.id, 'present');
        
        setTimeout(() => {
            stopCameraReader();
        }, 3000);
        
    } else {
        if (resultElement) {
            resultElement.innerHTML = `❌ <strong>كود غير معروف:</strong> ${decodedText}`;
            resultElement.style.color = '#721c24';
            resultElement.style.background = '#f8d7da';
        }
        
        setTimeout(() => {
            if (isCameraRunning && resultElement) {
                resultElement.innerHTML = '📷 الكاميرا تعمل... ضع الباركود أمام الكاميرا';
                resultElement.style.color = '#27ae60';
                resultElement.style.background = '#d4edda';
            }
        }, 2000);
    }
}

function onScanError(error) {}

function stopCameraReader() {
    if (html5QrCode && isCameraRunning) {
        html5QrCode.stop().then(() => {
            isCameraRunning = false;
            const resultElement = document.getElementById('scanResult');
            if (resultElement) {
                resultElement.textContent = '⏹ تم إيقاف الكاميرا';
                resultElement.style.color = '#e74c3c';
                resultElement.style.background = '#f5f7fa';
            }
            console.log('✅ تم إيقاف الكاميرا');
        }).catch(err => {
            console.error('❌ خطأ في إيقاف الكاميرا:', err);
        });
    } else {
        const resultElement = document.getElementById('scanResult');
        if (resultElement) {
            resultElement.textContent = '⏹ الكاميرا متوقفة';
            resultElement.style.color = '#888';
            resultElement.style.background = '#f5f7fa';
        }
    }
}

window.addEventListener('beforeunload', function() {
    stopCameraReader();
});

// ===== واتساب =====
function sendWhatsAppDirect(studentId, status) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('⚠️ الطالب غير موجود');
        return;
    }
    
    if (!student.phone || student.phone === '') {
        alert('⚠️ هذا الطالب ليس لديه رقم هاتف مسجل');
        return;
    }
    
    const statusText = status === 'present' ? '✅ حضر' : '❌ غاب';
    const message = `📚 *إشعار حضور وغياب*\n\nالطالب: ${student.name}\nالكود: ${student.code}\nالحالة: ${statusText}\nالتاريخ: ${new Date().toLocaleDateString('ar-EG')}\nالوقت: ${new Date().toLocaleTimeString('ar-EG')}\n\nشكراً لمتابعتكم`;
    
    let phone = student.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('2')) phone = '2' + phone;
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

function sendMonthlyReportDirect(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('⚠️ الطالب غير موجود');
        return;
    }
    
    if (!student.phone || student.phone === '') {
        alert('⚠️ هذا الطالب ليس لديه رقم هاتف مسجل');
        return;
    }
    
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAttendance = attendance.filter(a => 
        a.studentId === studentId && new Date(a.date) >= monthStart
    );
    
    const present = monthAttendance.filter(a => a.status === 'present').length;
    const absent = monthAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    
    const studentGrades = grades.filter(g => g.studentId === studentId);
    const gradesList = studentGrades.map(g => `${g.subject}: ${g.value}`).join('\n');
    
    const message = `📊 *تقرير شهري - ${student.name}*\n\n` +
                   `📅 الشهر: ${now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}\n` +
                   `✅ الحضور: ${present}\n` +
                   `❌ الغياب: ${absent}\n` +
                   `📊 نسبة الحضور: ${average}%\n\n` +
                   `📝 *الدرجات:*\n${gradesList || 'لا توجد درجات'}\n\n` +
                   `💰 المصاريف:\n` +
                   `الإجمالي: ${student.fees || 0} ج\n` +
                   `المدفوع: ${student.feesPaid || 0} ج\n` +
                   `المتبقي: ${(student.fees || 0) - (student.feesPaid || 0)} ج\n\n` +
                   `شكراً لمتابعتكم`;
    
    let phone = student.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('2')) phone = '2' + phone;
    
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

// ===== نسخ احتياطي =====
function backupData() {
    const data = { students, groups, attendance, grades, backupDate: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `backup_${new Date().toLocaleDateString('ar-EG')}.json`;
    link.click();
    alert('✅ تم عمل نسخ احتياطي بنجاح');
}

function restoreData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                students = data.students || [];
                groups = data.groups || [];
                attendance = data.attendance || [];
                grades = data.grades || [];
                saveData();
                loadStudents();
                loadGroups();
                updateDashboard();
                updateFilterGroups();
                loadGroupSelect();
                loadCardStudents();
                showAlerts();
                updateCharts();
                alert('✅ تم استعادة البيانات بنجاح');
            } catch (err) {
                alert('❌ ملف غير صحيح');
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

// ===== بروفايل الطالب =====
function loadProfileData() {
    const studentId = localStorage.getItem('viewStudentId');
    if (!studentId) {
        window.location.href = 'students.html';
        return;
    }
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('⚠️ الطالب غير موجود');
        window.location.href = 'students.html';
        return;
    }
    
    currentStudentId = studentId;
    const group = groups.find(g => g.id === student.groupId);
    
    document.getElementById('profileName').textContent = student.name;
    document.getElementById('profilePhone').textContent = student.phone || 'غير محدد';
    document.getElementById('profileGroup').textContent = group ? group.name : 'غير محدد';
    document.getElementById('profileCode').textContent = student.code || 'غير محدد';
    
    const totalFees = student.fees || 0;
    const paidFees = student.feesPaid || 0;
    const remainingFees = totalFees - paidFees;
    
    document.getElementById('profileFees').textContent = totalFees;
    document.getElementById('profileFeesPaid').textContent = paidFees;
    document.getElementById('profileFeesRemaining').textContent = remainingFees;
    document.getElementById('profileTotalFees').textContent = totalFees;
    
    const studentAttendance = attendance.filter(a => a.studentId === studentId);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    
    document.getElementById('profilePresent').textContent = present;
    document.getElementById('profileAbsent').textContent = absent;
    document.getElementById('profileAverage').textContent = average + '%';
    
    const studentGrades = grades.filter(g => g.studentId === studentId);
    document.getElementById('profileGradesCount').textContent = studentGrades.length;
    if (studentGrades.length > 0) {
        const avg = studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length;
        document.getElementById('profileGradesAvg').textContent = Math.round(avg) + '%';
    } else {
        document.getElementById('profileGradesAvg').textContent = '0%';
    }
    
    const qrImg = document.getElementById('qrCode');
    if (qrImg) {
        qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.code}`;
    }
    
    loadGrades(studentId);
    loadFeesHistory(studentId);
}

function loadGrades(studentId) {
    const tableBody = document.getElementById('gradesTableBody');
    if (!tableBody) return;
    const studentGrades = grades.filter(g => g.studentId === studentId);
    if (studentGrades.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;">لا توجد درجات</td></tr>`;
        return;
    }
    tableBody.innerHTML = studentGrades.map(g => {
        return `<tr><td>${g.subject}</td><td><strong>${g.value}</strong></td><td>${new Date(g.date).toLocaleDateString('ar-EG')}</td></tr>`;
    }).join('');
}

function loadFeesHistory(studentId) {
    const tableBody = document.getElementById('feesTableBody');
    if (!tableBody) return;
    const student = students.find(s => s.id === studentId);
    if (!student || !student.feesHistory || student.feesHistory.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;">لا توجد مدفوعات</td></tr>`;
        return;
    }
    tableBody.innerHTML = student.feesHistory.map(f => {
        return `<tr><td>${new Date(f.date).toLocaleDateString('ar-EG')}</td><td><strong style="color:#27ae60;">${f.amount} ج</strong></td><td>${f.note || '-'}</td></tr>`;
    }).join('');
}

function addGrade() {
    const subject = document.getElementById('gradeSubject').value;
    const value = document.getElementById('gradeValue').value;
    if (!subject || !value) {
        alert('⚠️ من فضلك أدخل المادة والدرجة');
        return;
    }
    if (value < 0 || value > 100) {
        alert('⚠️ الدرجة يجب أن تكون بين 0 و 100');
        return;
    }
    const grade = {
        id: Date.now().toString(),
        studentId: currentStudentId,
        subject: subject,
        value: parseInt(value),
        date: new Date().toISOString()
    };
    grades.push(grade);
    saveData();
    loadProfileData();
    alert('✅ تم إضافة الدرجة بنجاح');
    document.getElementById('gradeSubject').value = '';
    document.getElementById('gradeValue').value = '';
}

function addFees() {
    const amount = document.getElementById('feesAmount').value;
    const note = document.getElementById('feesNote').value || 'دفعة جديدة';
    if (!amount || amount <= 0) {
        alert('⚠️ من فضلك أدخل مبلغ صحيح');
        return;
    }
    const student = students.find(s => s.id === currentStudentId);
    if (!student) return;
    const feesRecord = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        note: note,
        date: new Date().toISOString()
    };
    if (!student.feesHistory) student.feesHistory = [];
    student.feesHistory.push(feesRecord);
    student.feesPaid = (student.feesPaid || 0) + parseFloat(amount);
    saveData();
    loadProfileData();
    alert('✅ تم إضافة الدفعة بنجاح');
    document.getElementById('feesAmount').value = '';
    document.getElementById('feesNote').value = '';
}

// ===== الكارنيهات =====
function loadCardStudents() {
    const select = document.getElementById('cardStudentSelect');
    if (!select) return;
    select.innerHTML = '<option value="">-- اختر طالب --</option>';
    students.forEach(s => {
        select.innerHTML += `<option value="${s.id}">${s.name} (${s.code})</option>`;
    });
    showAllCards();
}

function showCard() {
    const select = document.getElementById('cardStudentSelect');
    const studentId = select.value;
    const container = document.getElementById('cardContainer');
    if (!studentId) {
        container.style.display = 'none';
        return;
    }
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    container.style.display = 'block';
    document.getElementById('cardName').textContent = student.name;
    document.getElementById('cardCode').textContent = student.code;
    const group = groups.find(g => g.id === student.groupId);
    document.getElementById('cardGroup').textContent = group ? group.name : 'غير محدد';
    document.getElementById('cardDate').textContent = new Date().toLocaleDateString('ar-EG');
    document.getElementById('cardQr').src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${student.code}`;
}

function showAllCards() {
    const container = document.getElementById('allCardsContainer');
    if (!container) return;
    if (students.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;">لا يوجد طلاب لعرض كارنيهاتهم</p>';
        return;
    }
    container.innerHTML = students.map(s => {
        const group = groups.find(g => g.id === s.groupId);
        return `
            <div class="student-card" style="width:100%;">
                <div class="card-header"><h2>📚 أكاديمية النجاح</h2><p>بطاقة تعريف طالب</p></div>
                <div class="card-body">
                    <div class="card-photo"><div class="card-avatar">👨‍🎓</div></div>
                    <div class="card-info">
                        <p><strong>الاسم:</strong> ${s.name}</p>
                        <p><strong>الكود:</strong> ${s.code}</p>
                        <p><strong>المجموعة:</strong> ${group ? group.name : 'غير محدد'}</p>
                    </div>
                    <div class="card-qr"><img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${s.code}" alt="QR"></div>
                </div>
                <div class="card-footer"><p>✍️ توقيع المدير: _________________</p></div>
            </div>
        `;
    }).join('');
}

function printCard() {
    window.print();
}

function printSingleCard() {
    window.print();
}