// ============================================================
// بيانات مؤقتة
// ============================================================

let students = [];
let groups = [];
let attendance = [];
let grades = [];
let currentStudentId = null;
let charts = {};
let html5QrCode = null;
let isCameraRunning = false;

// ============================================================
// Supabase Client
// ============================================================

let supabaseClient = null;

async function initSupabaseClient() {
    try {
        if (typeof supabase === 'undefined') {
            console.error('❌ مكتبة Supabase غير محملة');
            return null;
        }
        const SUPABASE_URL = 'https://stvidxlejnpfdbsqtkts.supabase.co';
        const SUPABASE_ANON_KEY = 'sb_publishable_VbueKulEaIE8eSSabON0Gw__8m87z06';
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        console.log('✅ Supabase Client initialized');
        return supabaseClient;
    } catch (error) {
        console.error('❌ Error initializing Supabase:', error);
        return null;
    }
}

// ============================================================
// Navigation
// ============================================================

function navigateTo(page) {
    const body = document.querySelector('.page-transition');
    if (body) {
        body.style.animation = 'pageFadeOut 0.3s ease forwards';
        setTimeout(() => { window.location.href = page; }, 300);
    } else {
        window.location.href = page;
    }
}

// ============================================================
// Eyes Animation
// ============================================================

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

// ============================================================
// Dark Mode
// ============================================================

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

// ============================================================
// LOGIN
// ============================================================

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();
        const errorElement = document.getElementById('errorMessage');
        
        errorElement.textContent = '';
        
        if (!username || !password) {
            errorElement.textContent = '⚠️ من فضلك أدخل اسم المستخدم وكلمة المرور';
            return;
        }
        
        if ((username === 'admin' || username === 'secretary') && password === '123') {
            localStorage.setItem('username', username);
            window.location.href = 'dashboard.html';
        } else {
            errorElement.textContent = '❌ اسم المستخدم أو كلمة المرور غير صحيحة';
        }
    });
}

// ============================================================
// Logout
// ============================================================

function logout() {
    if (confirm('هل أنت متأكد من تسجيل الخروج؟')) {
        localStorage.removeItem('username');
        window.location.href = 'index.html';
    }
}

// ============================================================
// Load Data (من Supabase)
// ============================================================

async function loadData() {
    try {
        // جلب الطلاب من Supabase
        const { data: studentsData, error: studentsError } = await supabaseClient
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (studentsError) throw studentsError;
        students = studentsData || [];
        
        // جلب المجاميع
        const { data: groupsData, error: groupsError } = await supabaseClient
            .from('groups')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (groupsError) throw groupsError;
        groups = groupsData || [];
        
        // جلب الحضور
        const { data: attendanceData, error: attendanceError } = await supabaseClient
            .from('attendance')
            .select('*')
            .order('date', { ascending: false });
        
        if (attendanceError) throw attendanceError;
        attendance = attendanceData || [];
        
        // جلب الدرجات
        const { data: gradesData, error: gradesError } = await supabaseClient
            .from('grades')
            .select('*')
            .order('date', { ascending: false });
        
        if (gradesError) throw gradesError;
        grades = gradesData || [];
        
        console.log('✅ تم تحميل البيانات من Supabase. عدد الطلاب:', students.length);
        
        // حفظ نسخة احتياطية في LocalStorage
        saveData();
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات من Supabase:', error);
        // الرجوع لـ LocalStorage
        loadDataLocal();
    }
}

function loadDataLocal() {
    try {
        const savedStudents = localStorage.getItem('students');
        const savedGroups = localStorage.getItem('groups');
        const savedAttendance = localStorage.getItem('attendance');
        const savedGrades = localStorage.getItem('grades');
        
        students = savedStudents ? JSON.parse(savedStudents) : [];
        groups = savedGroups ? JSON.parse(savedGroups) : [];
        attendance = savedAttendance ? JSON.parse(savedAttendance) : [];
        grades = savedGrades ? JSON.parse(savedGrades) : [];
        
        console.log('✅ تم تحميل البيانات من LocalStorage. عدد الطلاب:', students.length);
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات:', error);
        students = [];
        groups = [];
        attendance = [];
        grades = [];
    }
}

function saveData() {
    try {
        localStorage.setItem('students', JSON.stringify(students));
        localStorage.setItem('groups', JSON.stringify(groups));
        localStorage.setItem('attendance', JSON.stringify(attendance));
        localStorage.setItem('grades', JSON.stringify(grades));
        console.log('✅ تم حفظ البيانات في LocalStorage');
    } catch (error) {
        console.error('❌ خطأ في حفظ البيانات:', error);
        alert('⚠️ حدث خطأ في حفظ البيانات');
    }
}

// ============================================================
// Window Onload
// ============================================================

window.onload = async function() {
    await initSupabaseClient();
    
    const userName = localStorage.getItem('username');
    const userNameDisplay = document.getElementById('userNameDisplay');
    if (userNameDisplay) {
        if (userName === 'admin') userNameDisplay.textContent = '👤 مدير';
        else if (userName === 'secretary') userNameDisplay.textContent = '👤 سكرتيرة';
    }
    
    await loadData();
    updateDashboard();
    loadStudents();
    loadGroups();
    loadGroupSelect();
    updateFilterGroups();
    loadCardStudents();
    showAlerts();
    updateCharts();
    updateHonorBoard();
    updateLeaderboard();
    
    if (window.location.pathname.includes('profile.html')) {
        loadProfileData();
    }
    
    if (window.location.pathname.includes('student-profile.html')) {
        loadStudentFromQR();
    }

    const searchInput = document.getElementById('searchStudent');
    if (searchInput) {
        searchInput.addEventListener('keyup', function(e) {
            if (e.key === 'Enter') filterStudents();
        });
    }
    
    if (window.location.pathname.includes('students.html')) {
        const editId = localStorage.getItem('editStudentId');
        if (editId) {
            localStorage.removeItem('editStudentId');
            setTimeout(() => { editStudent(editId); }, 500);
        }
    }
    
    console.log('✅ النظام جاهز. عدد الطلاب:', students.length);
};

// ============================================================
// Update Dashboard
// ============================================================

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
    updateLeaderboard();
}

// ============================================================
// Recent Attendance
// ============================================================

function updateRecentAttendance() {
    const tableBody = document.querySelector('#recentAttendance tbody');
    if (!tableBody) return;
    if (attendance.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;color:#888;">لا توجد تسجيلات</td></tr>`;
        return;
    }
    const recent = attendance.slice(-5).reverse();
    tableBody.innerHTML = recent.map(a => {
        const student = students.find(s => s.id === a.student_id);
        const group = groups.find(g => g.id === a.group_id);
        const statusClass = a.status === 'present' ? 'status-present' : 'status-absent';
        const statusText = a.status === 'present' ? '✅ حاضر' : '❌ غائب';
        return `<tr><td>${student ? student.name : 'غير معروف'}</td><td>${group ? group.name : 'غير معروف'}</td><td class="${statusClass}">${statusText}</td><td>${new Date(a.date).toLocaleTimeString('ar-EG')}</td></tr>`;
    }).join('');
}

// ============================================================
// Alerts
// ============================================================

function showAlerts() {
    const container = document.getElementById('alertContainer');
    if (!container) return;
    let alerts = [];
    
    students.forEach(student => {
        const studentAttendance = attendance.filter(a => a.student_id === student.id).sort((a, b) => new Date(b.date) - new Date(a.date));
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
        const paidFees = student.fees_paid || 0;
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

// ============================================================
// Charts
// ============================================================

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
                datasets: [{ data: [present || 1, absent || 1], backgroundColor: ['#4CAF50', '#f44336'] }]
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
                datasets: [{ label: 'عدد الطلاب', data: Object.values(gradeRanges), backgroundColor: ['#f9a825', '#4CAF50', '#42a5f5', '#ff9800', '#f44336'] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }
        });
    }
    
    const groupsCtx = document.getElementById('groupsChart');
    if (groupsCtx) {
        if (charts.groups) charts.groups.destroy();
        const groupNames = groups.map(g => g.name);
        const groupAttendance = groups.map(g => {
            const groupStudents = students.filter(s => s.group_id === g.id);
            const groupAttendanceRecords = attendance.filter(a => groupStudents.some(s => s.id === a.student_id));
            const presentCount = groupAttendanceRecords.filter(a => a.status === 'present').length;
            const totalCount = groupAttendanceRecords.length || 1;
            return Math.round((presentCount / totalCount) * 100);
        });
        charts.groups = new Chart(groupsCtx, {
            type: 'bar',
            data: {
                labels: groupNames,
                datasets: [{ label: 'نسبة الحضور %', data: groupAttendance, backgroundColor: ['#667eea', '#764ba2', '#4CAF50', '#ff9800', '#42a5f5'] }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, max: 100 } } }
        });
    }
}

// ============================================================
// Students Management (مع Supabase)
// ============================================================

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

async function saveStudent() {
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
        code: newCode.toString(),
        name: name,
        phone: phone || '',
        group_id: groupId || null,
        fees: parseFloat(fees) || 0,
        fees_paid: 0,
        points: 0,
        is_star: false,
        streak: 0,
        medals: [],
        rewards: [],
        avatar: '👨‍🎓'
    };
    
    try {
        console.log('📤 جاري حفظ الطالب في Supabase:', student);
        console.log("Supabase Client =", supabaseClient);
console.log("Student =", student);
        const { data, error } = await supabaseClient
            .from('students')
            .insert([student])
            .select();
        
        if (error) {
            console.error('❌ خطأ Supabase:', error);
            alert('❌ خطأ في Supabase: ' + error.message);
            return;
        }
        
        console.log('✅ تم الحفظ في Supabase:', data);
        
        if (data && data.length > 0) {
            students.unshift(data[0]);
        } else {
            // لو Supabase مش شغال، نحفظ في LocalStorage مؤقتاً
            const tempStudent = {
                id: Date.now().toString(),
                ...student,
                created_at: new Date().toISOString()
            };
            students.unshift(tempStudent);
        }
        
        saveData();
        loadStudents();
        updateDashboard();
        updateFilterGroups();
        loadGroupSelect();
        loadCardStudents();
        showAlerts();
        updateCharts();
        updateHonorBoard();
        updateLeaderboard();
        hideAddStudent();
        
        alert(`✅ تم إضافة الطالب بنجاح\n📌 الكود: ${newCode}`);
        
        document.getElementById('studentName').value = '';
        document.getElementById('studentPhone').value = '';
        document.getElementById('studentGroup').value = '';
        document.getElementById('studentFees').value = '';
        
    } catch (error) {
        console.error('❌ خطأ عام:', error);
        alert('⚠️ حدث خطأ: ' + error.message);
    }
}

function loadStudents() {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    if (students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#888;padding:30px;">📭 لا يوجد طلاب</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = students.map((s, index) => {
        const group = groups.find(g => g.id === s.group_id);
        const level = getLevelLabel(getStudentLevel(s.id));
        const levelClass = getLevelClass(getStudentLevel(s.id));
        const points = s.points || 0;
        const streak = s.streak || 0;
        
        return `<tr>
            <td>${index + 1}</td>
            <td><span style="font-size:20px;">${getAvatar(s.id)}</span> ${s.name}</td>
            <td><strong>${s.code}</strong></td>
            <td>${group ? group.name : 'غير محدد'}</td>
            <td><span class="level-badge ${levelClass}">${level}</span></td>
            <td>⭐ ${points}</td>
            <td>🔥 ${streak}</td>
            <td>
                <canvas id="barcode-${s.id}" width="100" height="100"></canvas>
            </td>
            <td>
                <button class="btn-primary" onclick="editStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">✏️</button>
                <button class="btn-primary" onclick="viewProfile('${s.id}')" style="padding:4px 10px;font-size:11px;">👤</button>
                <button class="btn-danger" onclick="deleteStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">🗑️</button>
            </td>
        </tr>`;
    }).join('');
    
    setTimeout(generateAllBarcodes, 100);
}

function viewProfile(studentId) {
    localStorage.setItem('viewStudentId', studentId);
    window.location.href = 'profile.html';
}

async function deleteStudent(id) {
    if (confirm('هل أنت متأكد من حذف هذا الطالب؟')) {
        try {
            const { error } = await supabaseClient
                .from('students')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            students = students.filter(s => s.id !== id);
            saveData();
            loadStudents();
            updateDashboard();
            showAlerts();
            updateCharts();
            updateHonorBoard();
            updateLeaderboard();
            alert('✅ تم حذف الطالب');
            
        } catch (error) {
            console.error('❌ Error deleting student:', error);
            alert('⚠️ حدث خطأ في حذف الطالب');
        }
    }
}

// ============================================================
// Edit Student (مع Supabase)
// ============================================================

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
        const selected = g.id === student.group_id ? 'selected' : '';
        select.innerHTML += `<option value="${g.id}" ${selected}>${g.name}</option>`;
    });
    
    document.getElementById('addStudentForm').style.display = 'none';
    document.getElementById('editStudentForm').style.display = 'block';
    document.getElementById('editStudentForm').scrollIntoView({ behavior: 'smooth' });
}

function hideEditStudent() {
    document.getElementById('editStudentForm').style.display = 'none';
}

async function saveEditStudent() {
    const studentId = document.getElementById('editStudentId').value;
    const name = document.getElementById('editStudentName').value;
    const phone = document.getElementById('editStudentPhone').value;
    const groupId = document.getElementById('editStudentGroup').value;
    const fees = document.getElementById('editStudentFees').value || 0;
    
    if (!name) {
        alert('⚠️ من فضلك أدخل اسم الطالب');
        return;
    }
    
    try {
        const updates = {
            name: name,
            phone: phone,
            group_id: groupId || null,
            fees: parseFloat(fees)
        };
        
        const { data, error } = await supabaseClient
            .from('students')
            .update(updates)
            .eq('id', studentId)
            .select();
        
        if (error) throw error;
        
        const index = students.findIndex(s => s.id === studentId);
        if (index !== -1 && data && data.length > 0) students[index] = data[0];
        saveData();
        
        loadStudents();
        updateDashboard();
        updateFilterGroups();
        loadGroupSelect();
        loadCardStudents();
        showAlerts();
        updateCharts();
        updateHonorBoard();
        updateLeaderboard();
        
        hideEditStudent();
        alert('✅ تم تحديث بيانات الطالب بنجاح');
        
    } catch (error) {
        console.error('❌ Error updating student:', error);
        alert('⚠️ حدث خطأ في تحديث الطالب');
    }
}

function editStudentFromProfile() {
    const studentId = localStorage.getItem('viewStudentId');
    if (studentId) {
        localStorage.setItem('editStudentId', studentId);
        window.location.href = 'students.html';
    }
}

// ============================================================
// Filter Students
// ============================================================

function filterStudents() {
    const searchText = document.getElementById('searchStudent').value.toLowerCase();
    const filterGroup = document.getElementById('filterGroup').value;
    let filteredStudents = students;
    if (searchText) {
        filteredStudents = filteredStudents.filter(s => s.name.toLowerCase().includes(searchText) || s.code.includes(searchText));
    }
    if (filterGroup) {
        filteredStudents = filteredStudents.filter(s => s.group_id === filterGroup);
    }
    displayFilteredStudents(filteredStudents);
}

function displayFilteredStudents(filteredStudents) {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    if (filteredStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#888;">❌ لا توجد نتائج مطابقة</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = filteredStudents.map((s, index) => {
        const group = groups.find(g => g.id === s.group_id);
        const level = getLevelLabel(getStudentLevel(s.id));
        const levelClass = getLevelClass(getStudentLevel(s.id));
        const points = s.points || 0;
        const streak = s.streak || 0;
        
        return `<tr>
            <td>${index + 1}</td>
            <td><span style="font-size:20px;">${getAvatar(s.id)}</span> ${s.name}</td>
            <td><strong>${s.code}</strong></td>
            <td>${group ? group.name : 'غير محدد'}</td>
            <td><span class="level-badge ${levelClass}">${level}</span></td>
            <td>⭐ ${points}</td>
            <td>🔥 ${streak}</td>
            <td>
                <svg id="barcode-${s.id}" class="barcode-svg"></svg>
            </td>
            <td>
                <button class="btn-primary" onclick="editStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">✏️</button>
                <button class="btn-primary" onclick="viewProfile('${s.id}')" style="padding:4px 10px;font-size:11px;">👤</button>
                <button class="btn-danger" onclick="deleteStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">🗑️</button>
            </td>
        </tr>`;
    }).join('');
    
    setTimeout(generateAllBarcodes, 100);
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

// ============================================================
// Export Excel
// ============================================================

function exportToExcel() {
    if (students.length === 0) {
        alert('⚠️ لا يوجد طلاب للتصدير');
        return;
    }
    let csv = 'الكود,الاسم,المجموعة,المصاريف,المدفوع,المتبقي,النقاط,المستوى\n';
    students.forEach(s => {
        const group = groups.find(g => g.id === s.group_id);
        const paid = s.fees_paid || 0;
        const remaining = (s.fees || 0) - paid;
        const level = getLevelLabel(getStudentLevel(s.id));
        const points = s.points || 0;
        csv += `${s.code},${s.name},${group ? group.name : 'غير محدد'},${s.fees || 0},${paid},${remaining},${points},${level}\n`;
    });
    csv += '\n\nسجل الحضور\nالطالب,الحالة,التاريخ\n';
    attendance.forEach(a => {
        const student = students.find(s => s.id === a.student_id);
        csv += `${student ? student.name : 'غير معروف'},${a.status === 'present' ? 'حاضر' : 'غائب'},${new Date(a.date).toLocaleDateString('ar-EG')}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `الطلاب_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
    alert('✅ تم تصدير البيانات بنجاح');
}

// ============================================================
// Groups Management (مع Supabase)
// ============================================================

function showAddGroup() {
    document.getElementById('addGroupForm').style.display = 'block';
}

function hideAddGroup() {
    document.getElementById('addGroupForm').style.display = 'none';
}

async function saveGroup() {
    const name = document.getElementById('groupName').value;
    const time = document.getElementById('groupTime').value;
    if (!name) {
        alert('⚠️ من فضلك أدخل اسم المجموعة');
        return;
    }
    
    try {
        console.log('📤 جاري حفظ المجموعة في Supabase:', { name, time });
        
        const { data, error } = await supabaseClient
            .from('groups')
            .insert([{ name: name, time: time || '00:00' }])
            .select();
        
        if (error) {
            console.error('❌ خطأ Supabase:', error);
            alert('❌ خطأ في Supabase: ' + error.message);
            return;
        }
        
        console.log('✅ تم الحفظ في Supabase:', data);
        
        if (data && data.length > 0) {
            groups.push(data[0]);
        } else {
            const tempGroup = {
                id: Date.now().toString(),
                name: name,
                time: time || '00:00',
                created_at: new Date().toISOString()
            };
            groups.push(tempGroup);
        }
        
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
        
    } catch (error) {
        console.error('❌ خطأ عام:', error);
        alert('⚠️ حدث خطأ: ' + error.message);
    }
}

function loadGroups() {
    const tableBody = document.getElementById('groupsTableBody');
    if (!tableBody) return;
    if (groups.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:#888;">لا يوجد مجاميع</td></tr>`;
        return;
    }
    tableBody.innerHTML = groups.map((g, index) => {
        const studentCount = students.filter(s => s.group_id === g.id).length;
        return `<tr>
            <td>${index + 1}</td>
            <td>${g.name}</td>
            <td>${g.time}</td>
            <td>${studentCount}</td>
            <td><button class="btn-danger" onclick="deleteGroup('${g.id}')" style="padding:4px 10px;font-size:11px;">🗑️</button></td>
        </tr>`;
    }).join('');
}

async function deleteGroup(id) {
    if (confirm('هل أنت متأكد من حذف هذه المجموعة؟')) {
        try {
            const { error } = await supabaseClient
                .from('groups')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            
            groups = groups.filter(g => g.id !== id);
            saveData();
            loadGroups();
            updateDashboard();
            updateFilterGroups();
            loadGroupSelect();
            alert('✅ تم حذف المجموعة');
            
        } catch (error) {
            console.error('❌ Error deleting group:', error);
            alert('⚠️ حدث خطأ في حذف المجموعة');
        }
    }
}

// ============================================================
// Attendance (مع Supabase)
// ============================================================

function showManualAttendance() {
    if (isCameraRunning) stopCameraReader();
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
    setTimeout(() => startCameraReader(), 500);
}

async function saveManualAttendance() {
    const studentId = document.getElementById('studentSelect').value;
    const status = document.getElementById('attendanceStatus').value;
    if (!studentId) {
        alert('⚠️ من فضلك اختر طالب');
        return;
    }
    
    try {
        const student = students.find(s => s.id === studentId);
        
        const { data, error } = await supabaseClient
            .from('attendance')
            .insert([{
                student_id: studentId,
                group_id: student.group_id || null,
                status: status,
                method: 'manual'
            }])
            .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            attendance.unshift(data[0]);
        } else {
            const tempRecord = {
                id: Date.now().toString(),
                student_id: studentId,
                group_id: student.group_id || null,
                status: status,
                date: new Date().toISOString(),
                method: 'manual'
            };
            attendance.unshift(tempRecord);
        }
        
        if (status === 'present') {
            const { error: updateError } = await supabaseClient
                .from('students')
                .update({ 
                    streak: (student.streak || 0) + 1,
                    points: (student.points || 0) + 5
                })
                .eq('id', studentId);
            
            if (!updateError) {
                student.streak = (student.streak || 0) + 1;
                student.points = (student.points || 0) + 5;
                checkMedals(student);
            }
        } else {
            const { error: updateError } = await supabaseClient
                .from('students')
                .update({ streak: 0 })
                .eq('id', studentId);
            
            if (!updateError) {
                student.streak = 0;
            }
        }
        
        saveData();
        updateDashboard();
        updateLeaderboard();
        updateHonorBoard();
        alert('✅ تم تسجيل الحضور بنجاح');
        sendWhatsAppDirect(studentId, status);
        
    } catch (error) {
        console.error('❌ Error saving attendance:', error);
        alert('⚠️ حدث خطأ في تسجيل الحضور');
    }
}

// ============================================================
// Camera
// ============================================================

function startCameraReader() {
    const readerElement = document.getElementById('reader');
    const resultElement = document.getElementById('scanResult');
    if (!readerElement) return;
    if (isCameraRunning) {
        if (resultElement) {
            resultElement.textContent = '📷 الكاميرا تعمل بالفعل';
            resultElement.style.color = '#4CAF50';
        }
        return;
    }
    if (resultElement) {
        resultElement.textContent = '📷 جاري تشغيل الكاميرا...';
        resultElement.style.color = '#667eea';
    }
    if (typeof Html5Qrcode === 'undefined') {
        if (resultElement) {
            resultElement.textContent = '❌ جاري تحميل مكتبة الباركود... يرجى الانتظار';
            resultElement.style.color = '#f44336';
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode';
        script.onload = function() { startCameraReader(); };
        document.head.appendChild(script);
        return;
    }
    try {
        html5QrCode = new Html5Qrcode("reader");
        const config = { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 };
        html5QrCode.start({ facingMode: "environment" }, config, onScanSuccess, onScanError)
            .then(() => {
                isCameraRunning = true;
                if (resultElement) {
                    resultElement.textContent = '📷 الكاميرا تعمل... ضع الباركود أمام الكاميرا';
                    resultElement.style.color = '#4CAF50';
                }
            }).catch(err => {
                if (resultElement) {
                    resultElement.textContent = '❌ لا يمكن تشغيل الكاميرا: ' + err.message;
                    resultElement.style.color = '#f44336';
                }
            });
    } catch (error) {
        if (resultElement) {
            resultElement.textContent = '❌ حدث خطأ: ' + error.message;
            resultElement.style.color = '#f44336';
        }
    }
}

async function onScanSuccess(decodedText) {
    const resultElement = document.getElementById('scanResult');
    const student = students.find(s => s.code === decodedText);
    
    if (student) {
        try {
            const { data, error } = await supabaseClient
                .from('attendance')
                .insert([{
                    student_id: student.id,
                    group_id: student.group_id || null,
                    status: 'present',
                    method: 'camera'
                }])
                .select();
            
            if (error) throw error;
            
            if (data && data.length > 0) {
                attendance.unshift(data[0]);
            } else {
                const tempRecord = {
                    id: Date.now().toString(),
                    student_id: student.id,
                    group_id: student.group_id || null,
                    status: 'present',
                    date: new Date().toISOString(),
                    method: 'camera'
                };
                attendance.unshift(tempRecord);
            }
            
            const { error: updateError } = await supabaseClient
                .from('students')
                .update({ 
                    streak: (student.streak || 0) + 1,
                    points: (student.points || 0) + 5
                })
                .eq('id', student.id);
            
            if (!updateError) {
                student.streak = (student.streak || 0) + 1;
                student.points = (student.points || 0) + 5;
                checkMedals(student);
            }
            
            saveData();
            updateDashboard();
            updateLeaderboard();
            updateHonorBoard();
            
            if (resultElement) {
                resultElement.innerHTML = `✅ <strong>تم تسجيل حضور: ${student.name}</strong> ⭐ +5 نقاط`;
                resultElement.style.color = '#4CAF50';
            }
            
            const baseUrl = window.location.origin;
            window.location.href = `${baseUrl}/student-profile.html?code=${student.code}`;
            
            setTimeout(() => stopCameraReader(), 3000);
            
        } catch (error) {
            console.error('❌ Error:', error);
            if (resultElement) {
                resultElement.textContent = '❌ حدث خطأ في تسجيل الحضور';
                resultElement.style.color = '#f44336';
            }
        }
    } else {
        if (resultElement) {
            resultElement.innerHTML = `❌ <strong>كود غير معروف:</strong> ${decodedText}`;
            resultElement.style.color = '#f44336';
        }
        setTimeout(() => {
            if (isCameraRunning && resultElement) {
                resultElement.innerHTML = '📷 الكاميرا تعمل... ضع الباركود أمام الكاميرا';
                resultElement.style.color = '#4CAF50';
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
                resultElement.style.color = '#888';
            }
        }).catch(err => console.error(err));
    }
}

window.addEventListener('beforeunload', function() { stopCameraReader(); });

// ============================================================
// Gamification
// ============================================================

function getAvatar(studentId) {
    const avatars = ['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👦', '👧', '🧒', '👨‍🏫', '👩‍🏫'];
    const index = parseInt(studentId) % avatars.length;
    return avatars[index];
}

function getStudentLevel(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) return 'weak';
    const studentGrades = grades.filter(g => g.student_id === studentId);
    if (studentGrades.length === 0) return 'acceptable';
    const avg = studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length;
    if (avg >= 90) return 'excellent';
    if (avg >= 80) return 'very-good';
    if (avg >= 70) return 'good';
    if (avg >= 60) return 'acceptable';
    return 'weak';
}

function getLevelLabel(level) {
    const labels = { 'excellent': 'ممتاز', 'very-good': 'جيد جداً', 'good': 'جيد', 'acceptable': 'مقبول', 'weak': 'ضعيف' };
    return labels[level] || 'غير محدد';
}

function getLevelClass(level) { return `level-${level}`; }

function getStudentRank(studentId) {
    const sorted = [...students].sort((a, b) => (b.points || 0) - (a.points || 0));
    const index = sorted.findIndex(s => s.id === studentId);
    return index + 1;
}

function getMedals(student) {
    const medals = [];
    const points = student.points || 0;
    if (points >= 100) medals.push('🥇');
    if (points >= 50) medals.push('🥈');
    if (points >= 25) medals.push('🥉');
    if (student.streak >= 10) medals.push('🔥');
    if (student.streak >= 5) medals.push('⭐');
    return medals;
}

function checkMedals(student) {
    const points = student.points || 0;
    const medals = [];
    if (points >= 100) medals.push('🥇 الذهبية');
    if (points >= 50) medals.push('🥈 الفضية');
    if (points >= 25) medals.push('🥉 البرونزية');
    if (student.streak >= 10) medals.push('🔥 سلسلة 10 أيام');
    if (student.streak >= 5) medals.push('⭐ سلسلة 5 أيام');
    if (medals.length > 0) {
        student.medals = medals;
        saveData();
    }
}

function addPoints() {
    const student = students.find(s => s.id === currentStudentId);
    if (!student) return;
    const amount = prompt('أدخل عدد النقاط للإضافة (1-10):', '5');
    if (!amount) return;
    const points = parseInt(amount);
    if (isNaN(points) || points < 1 || points > 10) {
        alert('⚠️ من فضلك أدخل رقم بين 1 و 10');
        return;
    }
    student.points = (student.points || 0) + points;
    checkMedals(student);
    saveData();
    loadProfileData();
    updateHonorBoard();
    updateLeaderboard();
    alert(`✅ تم إضافة ${points} نقاط!`);
}

function toggleStar() {
    const student = students.find(s => s.id === currentStudentId);
    if (!student) return;
    student.is_star = !student.is_star;
    saveData();
    loadProfileData();
    updateHonorBoard();
    updateLeaderboard();
    alert(student.is_star ? '⭐ تم تثبيت الطالب في لوحة الشرف!' : '❌ تم إزالة الطالب من لوحة الشرف');
}

function giveReward() {
    const student = students.find(s => s.id === currentStudentId);
    if (!student) return;
    const rewards = ['🎁 دفتر ملاحظات', '🎁 قلم أنيق', '🎁 حقيبة مدرسية', '🎁 كوب مميز', '🎁 ميدالية تذكارية', '🎁 شهادة تقدير'];
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    student.rewards = student.rewards || [];
    student.rewards.push({ reward: reward, date: new Date().toISOString() });
    saveData();
    alert(`🎉 تم منح ${student.name} مكافأة: ${reward}`);
}

function updateLeaderboard() {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;
    const sorted = [...students].sort((a, b) => (b.points || 0) - (a.points || 0));
    if (sorted.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">لا يوجد طلاب لعرض الترتيب</p>';
        return;
    }
    container.innerHTML = sorted.slice(0, 10).map((s, i) => {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
        return `
            <div class="leaderboard-item">
                <span class="rank ${rankClass}">${medal}</span>
                <span class="name">${getAvatar(s.id)} ${s.name}</span>
                <span class="points">⭐ ${s.points || 0}</span>
                <span style="font-size:12px;color:var(--text-secondary);">🔥 ${s.streak || 0}</span>
            </div>
        `;
    }).join('');
}

function updateHonorBoard() {
    const container = document.getElementById('honorStudents');
    if (!container) return;
    const starStudents = students.filter(s => s.is_star);
    if (starStudents.length === 0) {
        container.innerHTML = '<p style="color:#888;">لا يوجد طلاب مميزين حتى الآن</p>';
        return;
    }
    container.innerHTML = starStudents.map(s => {
        const points = s.points || 0;
        const level = getLevelLabel(getStudentLevel(s.id));
        const medals = getMedals(s);
        return `
            <div class="honor-card">
                <span class="honor-icon">${getAvatar(s.id)}</span>
                <div class="honor-name">${s.name}</div>
                <div class="honor-points">⭐ ${points} نقطة</div>
                <div style="font-size:12px;color:var(--text-secondary);">المستوى: ${level}</div>
                <div style="font-size:14px;">${medals.join(' ')}</div>
            </div>
        `;
    }).join('');
}

function showLevels() {
    let modal = document.getElementById('levelModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'levelModal';
        modal.className = 'level-modal';
        document.body.appendChild(modal);
    }
    const levels = { excellent: [], 'very-good': [], good: [], acceptable: [], weak: [] };
    students.forEach(s => {
        const level = getStudentLevel(s.id);
        levels[level].push(s);
    });
    let html = `
        <div class="level-modal-content">
            <h2>📊 تقسيم الطلاب حسب المستوى</h2>
            <button onclick="closeLevelModal()" style="position:sticky;top:0;float:left;background:rgba(0,0,0,0.05);padding:8px 16px;border-radius:10px;border:none;color:var(--text-primary);cursor:pointer;">✕ إغلاق</button>
    `;
    const levelNames = { excellent: '⭐ ممتاز (90-100)', 'very-good': '🌟 جيد جداً (80-89)', good: '✅ جيد (70-79)', acceptable: '📖 مقبول (60-69)', weak: '📚 ضعيف (<60)' };
    Object.keys(levels).forEach(key => {
        if (levels[key].length > 0) {
            html += `
                <div class="level-group">
                    <h3>${levelNames[key]} (${levels[key].length} طالب)</h3>
                    <div class="level-students">
                        ${levels[key].map(s => `<span class="level-student-tag">${getAvatar(s.id)} ${s.name} (${s.code})</span>`).join('')}
                    </div>
                </div>
            `;
        }
    });
    if (students.length === 0) html += `<p style="color:var(--text-secondary);">لا يوجد طلاب لعرضهم</p>`;
    html += `</div>`;
    modal.innerHTML = html;
    modal.classList.add('show');
}

function closeLevelModal() {
    const modal = document.getElementById('levelModal');
    if (modal) modal.classList.remove('show');
}

function showLeaderboard() {
    updateLeaderboard();
    document.querySelector('.leaderboard-section')?.scrollIntoView({ behavior: 'smooth' });
}

// ============================================================
// WhatsApp
// ============================================================

function sendWhatsAppDirect(studentId, status) {
    const student = students.find(s => s.id === studentId);
    if (!student) { alert('⚠️ الطالب غير موجود'); return; }
    if (!student.phone) { alert('⚠️ هذا الطالب ليس لديه رقم هاتف مسجل'); return; }
    const statusText = status === 'present' ? '✅ حضر' : '❌ غاب';
    const message = `📚 *إشعار حضور وغياب*\n\nالطالب: ${student.name}\nالكود: ${student.code}\nالحالة: ${statusText}\nالتاريخ: ${new Date().toLocaleDateString('ar-EG')}\nالوقت: ${new Date().toLocaleTimeString('ar-EG')}\n⭐ النقاط: ${student.points || 0}\n\nشكراً لمتابعتكم`;
    let phone = student.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('2')) phone = '2' + phone;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

function sendMonthlyReportDirect(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) { alert('⚠️ الطالب غير موجود'); return; }
    if (!student.phone) { alert('⚠️ هذا الطالب ليس لديه رقم هاتف مسجل'); return; }
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAttendance = attendance.filter(a => a.student_id === studentId && new Date(a.date) >= monthStart);
    const present = monthAttendance.filter(a => a.status === 'present').length;
    const absent = monthAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    const studentGrades = grades.filter(g => g.student_id === studentId);
    const gradesList = studentGrades.map(g => `${g.subject}: ${g.value}`).join('\n');
    const message = `📊 *تقرير شهري - ${student.name}*\n\n📅 الشهر: ${now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}\n✅ الحضور: ${present}\n❌ الغياب: ${absent}\n📊 نسبة الحضور: ${average}%\n⭐ النقاط: ${student.points || 0}\n\n📝 *الدرجات:*\n${gradesList || 'لا توجد درجات'}\n\n💰 المصاريف:\nالإجمالي: ${student.fees || 0} ج\nالمدفوع: ${student.fees_paid || 0} ج\nالمتبقي: ${(student.fees || 0) - (student.fees_paid || 0)} ج\n\nشكراً لمتابعتكم`;
    let phone = student.phone.replace(/\D/g, '');
    if (phone.startsWith('0')) phone = phone.substring(1);
    if (!phone.startsWith('2')) phone = '2' + phone;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
}

// ============================================================
// Backup
// ============================================================

function backupData() {
    alert('⚠️ النسخ الاحتياطي محفوظ في LocalStorage و Supabase تلقائياً');
}

function restoreData() {
    alert('⚠️ استعادة البيانات تتم عبر Supabase تلقائياً');
}

// ============================================================
// Profile
// ============================================================

function loadProfileData() {
    const studentId = localStorage.getItem('viewStudentId');
    if (!studentId) { window.location.href = 'students.html'; return; }
    const student = students.find(s => s.id === studentId);
    if (!student) { alert('⚠️ الطالب غير موجود'); window.location.href = 'students.html'; return; }
    
    currentStudentId = studentId;
    const group = groups.find(g => g.id === student.group_id);
    
    document.getElementById('profileName').textContent = student.name;
    document.getElementById('profilePhone').textContent = student.phone || 'غير محدد';
    document.getElementById('profileGroup').textContent = group ? group.name : 'غير محدد';
    document.getElementById('profileCode').textContent = student.code || 'غير محدد';
    document.getElementById('profileAvatar').textContent = getAvatar(studentId);
    
    const totalFees = student.fees || 0;
    document.getElementById('profileFees').textContent = totalFees;
    
    const points = student.points || 0;
    const rank = getStudentRank(studentId);
    const streak = student.streak || 0;
    const medals = getMedals(student);
    
    document.getElementById('profilePoints').textContent = points;
    document.getElementById('profileRank').textContent = rank;
    document.getElementById('profileStreak').textContent = streak;
    document.getElementById('profileMedals').textContent = medals.join(' ');
    
    document.getElementById('studentPoints').textContent = points;
    document.getElementById('studentLevel').textContent = getLevelLabel(getStudentLevel(studentId));
    document.getElementById('studentMedals').textContent = medals.join(' ');
    
    const studentGrades = grades.filter(g => g.student_id === studentId);
    const avg = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length) : 0;
    document.getElementById('profileAvgGrade').textContent = avg + '%';
    document.getElementById('profileGradeRank').textContent = rank;
    
    const studentAttendance = attendance.filter(a => a.student_id === studentId);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    
    document.getElementById('profilePresent').textContent = present;
    document.getElementById('profileAbsent').textContent = absent;
    document.getElementById('profileAverage').textContent = average + '%';
    document.getElementById('profileTotalFees').textContent = totalFees;
    document.getElementById('profileGradesCount').textContent = studentGrades.length;
    document.getElementById('profileGradesAvg').textContent = avg + '%';
    
    generateBarcode('profileBarcode', student.code);
    
    loadGrades(studentId);
    loadFeesHistory(studentId);
}

function loadStudentFromQR() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (!code) {
        document.getElementById('studentProfileCard').innerHTML = `
            <div style="text-align:center;padding:40px;">
                <h2>❌ لم يتم العثور على طالب</h2>
                <p style="color:#888;">يرجى مسح باركود صحيح</p>
                <button onclick="window.location.href='index.html'" class="btn-primary" style="margin-top:20px;">🔙 العودة لتسجيل الدخول</button>
            </div>
        `;
        return;
    }
    
    const student = students.find(s => s.code === code);
    if (!student) {
        document.getElementById('studentProfileCard').innerHTML = `
            <div style="text-align:center;padding:40px;">
                <h2>❌ طالب غير موجود</h2>
                <p style="color:#888;">الكود: ${code}</p>
                <button onclick="window.location.href='index.html'" class="btn-primary" style="margin-top:20px;">🔙 العودة لتسجيل الدخول</button>
            </div>
        `;
        return;
    }
    
    currentStudentId = student.id;
    const group = groups.find(g => g.id === student.group_id);
    
    document.getElementById('spAvatar').textContent = getAvatar(student.id);
    document.getElementById('spName').textContent = student.name;
    document.getElementById('spPhone').textContent = student.phone || 'غير محدد';
    document.getElementById('spGroup').textContent = group ? group.name : 'غير محدد';
    document.getElementById('spCode').textContent = student.code || 'غير محدد';
    document.getElementById('spFees').textContent = student.fees || 0;
    
    const points = student.points || 0;
    const rank = getStudentRank(student.id);
    const streak = student.streak || 0;
    const medals = getMedals(student);
    
    document.getElementById('spPoints').textContent = points;
    document.getElementById('spRank').textContent = rank;
    document.getElementById('spStreak').textContent = streak;
    document.getElementById('spMedals').textContent = medals.join(' ');
    
    document.getElementById('spStudentPoints').textContent = points;
    document.getElementById('spLevel').textContent = getLevelLabel(getStudentLevel(student.id));
    document.getElementById('spStudentMedals').textContent = medals.join(' ');
    
    const studentAttendance = attendance.filter(a => a.student_id === student.id);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const avg = total > 0 ? Math.round((present / total) * 100) : 0;
    
    document.getElementById('spPresentCount').textContent = present;
    document.getElementById('spAbsentCount').textContent = absent;
    document.getElementById('spAttendanceRate').textContent = avg + '%';
    
    const studentGrades = grades.filter(g => g.student_id === student.id);
    const avgGrade = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length) : 0;
    document.getElementById('spAvgGrade').textContent = avgGrade + '%';
    document.getElementById('spGradeRank').textContent = rank;
    
    const totalFees = student.fees || 0;
    const paidFees = student.fees_paid || 0;
    const remainingFees = totalFees - paidFees;
    document.getElementById('spTotalFees').textContent = totalFees;
    document.getElementById('spPaidFees').textContent = paidFees;
    document.getElementById('spRemainingFees').textContent = remainingFees;
    
    generateBarcode('spBarcode', student.code);
    
    const gradesBody = document.getElementById('spGradesTableBody');
    if (gradesBody) {
        if (studentGrades.length === 0) {
            gradesBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;padding:20px;">لا توجد درجات</td></tr>`;
        } else {
            gradesBody.innerHTML = studentGrades.map(g => {
                return `<tr><td>${g.subject}</td><td><strong>${g.value}</strong></td><td>${new Date(g.date).toLocaleDateString('ar-EG')}</td></tr>`;
            }).join('');
        }
    }
    
    const feesBody = document.getElementById('spFeesTableBody');
    if (feesBody) {
        if (!student.feesHistory || student.feesHistory.length === 0) {
            feesBody.innerHTML = `<tr><td colspan="3" style="text-align:center;color:#888;padding:20px;">لا توجد مدفوعات</td></tr>`;
        } else {
            feesBody.innerHTML = student.feesHistory.map(f => {
                return `<tr><td>${new Date(f.date).toLocaleDateString('ar-EG')}</td><td><strong style="color:#4CAF50;">${f.amount} ج</strong></td><td>${f.note || '-'}</td></tr>`;
            }).join('');
        }
    }
}

function loadGrades(studentId) {
    const tableBody = document.getElementById('gradesTableBody');
    if (!tableBody) return;
    const studentGrades = grades.filter(g => g.student_id === studentId);
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
        return `<tr><td>${new Date(f.date).toLocaleDateString('ar-EG')}</td><td><strong style="color:#4CAF50;">${f.amount} ج</strong></td><td>${f.note || '-'}</td></tr>`;
    }).join('');
}

// ============================================================
// Grades (مع Supabase)
// ============================================================

async function addGrade() {
    const subject = document.getElementById('gradeSubject').value;
    const value = document.getElementById('gradeValue').value;
    if (!subject || !value) { alert('⚠️ من فضلك أدخل المادة والدرجة'); return; }
    if (value < 0 || value > 100) { alert('⚠️ الدرجة يجب أن تكون بين 0 و 100'); return; }
    
    try {
        const { data, error } = await supabaseClient
            .from('grades')
            .insert([{
                student_id: currentStudentId,
                subject: subject,
                value: parseInt(value)
            }])
            .select();
        
        if (error) throw error;
        
        if (data && data.length > 0) {
            grades.unshift(data[0]);
        } else {
            const tempGrade = {
                id: Date.now().toString(),
                student_id: currentStudentId,
                subject: subject,
                value: parseInt(value),
                date: new Date().toISOString()
            };
            grades.unshift(tempGrade);
        }
        
        const student = students.find(s => s.id === currentStudentId);
        if (student && parseInt(value) >= 90) {
            student.points = (student.points || 0) + 10;
            await supabaseClient
                .from('students')
                .update({ points: student.points })
                .eq('id', student.id);
            alert('⭐ +10 نقاط على الدرجة الممتازة!');
        } else if (student && parseInt(value) >= 80) {
            student.points = (student.points || 0) + 5;
            await supabaseClient
                .from('students')
                .update({ points: student.points })
                .eq('id', student.id);
            alert('⭐ +5 نقاط على الدرجة الجيدة جداً!');
        }
        
        checkMedals(student);
        saveData();
        loadProfileData();
        updateHonorBoard();
        updateLeaderboard();
        alert('✅ تم إضافة الدرجة بنجاح');
        
        document.getElementById('gradeSubject').value = '';
        document.getElementById('gradeValue').value = '';
        
    } catch (error) {
        console.error('❌ Error adding grade:', error);
        alert('⚠️ حدث خطأ في إضافة الدرجة');
    }
}

// ============================================================
// Fees (مع Supabase)
// ============================================================

async function addFees() {
    const amount = document.getElementById('feesAmount').value;
    const note = document.getElementById('feesNote').value || 'دفعة جديدة';
    if (!amount || amount <= 0) { alert('⚠️ من فضلك أدخل مبلغ صحيح'); return; }
    
    try {
        const { data, error } = await supabaseClient
            .from('fees_history')
            .insert([{
                student_id: currentStudentId,
                amount: parseFloat(amount),
                note: note
            }])
            .select();
        
        if (error) throw error;
        
        const student = students.find(s => s.id === currentStudentId);
        if (student) {
            if (!student.feesHistory) student.feesHistory = [];
            if (data && data.length > 0) {
                student.feesHistory.push(data[0]);
            } else {
                const tempFee = {
                    id: Date.now().toString(),
                    student_id: currentStudentId,
                    amount: parseFloat(amount),
                    note: note,
                    date: new Date().toISOString()
                };
                student.feesHistory.push(tempFee);
            }
            student.fees_paid = (student.fees_paid || 0) + parseFloat(amount);
            
            await supabaseClient
                .from('students')
                .update({ fees_paid: student.fees_paid })
                .eq('id', student.id);
            saveData();
        }
        
        loadProfileData();
        alert('✅ تم إضافة الدفعة بنجاح');
        
        document.getElementById('feesAmount').value = '';
        document.getElementById('feesNote').value = '';
        
    } catch (error) {
        console.error('❌ Error adding fee:', error);
        alert('⚠️ حدث خطأ في إضافة الدفعة');
    }
}

// ============================================================
// Cards
// ============================================================

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
    if (!studentId) { container.style.display = 'none'; return; }
    const student = students.find(s => s.id === studentId);
    if (!student) return;
    container.style.display = 'block';
    
    document.getElementById('cardName').textContent = student.name;
    document.getElementById('cardCode').textContent = student.code;
    document.getElementById('cardAvatar').textContent = getAvatar(studentId);
    document.getElementById('cardPoints').textContent = student.points || 0;
    const group = groups.find(g => g.id === student.group_id);
    document.getElementById('cardGroup').textContent = group ? group.name : 'غير محدد';
    
generateQRCode('cardQRCode', student.code);}

function showAllCards() {
    const container = document.getElementById('allCardsContainer');
    if (!container) return;
    if (students.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;">لا يوجد طلاب لعرض كارنيهاتهم</p>';
        return;
    }
    
    container.innerHTML = students.map(s => {
        const group = groups.find(g => g.id === s.group_id);
        const points = s.points || 0;
        return `
            <div class="student-card" style="width:100%;">
                <div class="card-header"><h2>📚 أكاديمية النجاح</h2><p>بطاقة تعريف طالب</p></div>
                <div class="card-body">
                    <div class="card-photo"><div class="card-avatar">${getAvatar(s.id)}</div></div>
                    <div class="card-info">
                        <p><strong>الاسم:</strong> ${s.name}</p>
                        <p><strong>الكود:</strong> ${s.code}</p>
                        <p><strong>المجموعة:</strong> ${group ? group.name : 'غير محدد'}</p>
                        <p><strong>⭐ نقاط:</strong> ${points}</p>
                    </div>
                    <div class="card-qr">
                        <svg id="cardBarcode-${s.id}" class="barcode-svg"></svg>
                    </div>
                </div>
                <div class="card-footer"><p>✍️ توقيع المدير: _________________</p></div>
            </div>
        `;
    }).join('');
    
    setTimeout(() => {
        students.forEach(s => {
            generateBarcode(`cardBarcode-${s.id}`, s.code);
        });
    }, 100);
}

function printCard() { window.print(); }
function printSingleCard() { window.print(); }

// ============================================================
// Barcode
// ============================================================

function generateBarcode(elementId, code) {
    try {
        if (typeof JsBarcode === 'undefined') {
            console.log('⏳ جاري تحميل مكتبة الباركود...');
            setTimeout(() => generateBarcode(elementId, code), 500);
            return;
        }

        let upcCode = code.padStart(11, '0');
        let sum = 0;

        for (let i = 0; i < upcCode.length; i++) {
            if (i % 2 === 0) {
                sum += parseInt(upcCode[i]) * 3;
            } else {
                sum += parseInt(upcCode[i]);
            }
        }

        const checkDigit = (10 - (sum % 10)) % 10;
        upcCode += checkDigit;

        const svg = document.getElementById(elementId);

        if (!svg) return;

        JsBarcode(svg, upcCode, {
            format: "UPC",
            width: 1.8,
            height: 60,
            displayValue: true,
            fontSize: 16,
            margin: 5
        });

    } catch (error) {
        console.log("❌ خطأ في إنشاء الباركود:", error);
    }
}

function generateQRCode(elementId, code) {

    const element = document.getElementById(elementId);

    if (!element) return;

    element.innerHTML = "";

    const url = `${window.location.origin}/profile.html?code=${code}`;

    new QRCode(element, {
        text: url,
        width: 70,
        height: 70
    });

}

function generateAllBarcodes() {

    students.forEach(s => {

        generateBarcode(`barcode-${s.id}`, s.code);

        generateQRCode(`qrcode-${s.id}`, s.code);

    });

}
// ============================================================
// PDF
// ============================================================

function generatePDF() {
    const student = students.find(s => s.id === currentStudentId);
    if (!student) { alert('⚠️ الطالب غير موجود'); return; }
    
    const studentAttendance = attendance.filter(a => a.student_id === currentStudentId);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    const studentGrades = grades.filter(g => g.student_id === currentStudentId);
    const gradesAvg = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length) : 0;
    const level = getLevelLabel(getStudentLevel(currentStudentId));
    const points = student.points || 0;
    const rank = getStudentRank(currentStudentId);
    const medals = getMedals(student);
    
    let html = `
        <html>
        <head><title>تقرير الطالب - ${student.name}</title>
        <style>
            * { font-family: 'Cairo', Arial, sans-serif; }
            body { background: white; padding: 40px; direction: rtl; }
            .header { text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 20px; }
            .header h1 { color: #667eea; font-size: 28px; }
            .header p { color: #666; font-size: 16px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 30px 0; }
            .info-item { background: #f5f7fa; padding: 15px; border-radius: 10px; }
            .info-item label { font-weight: bold; color: #555; }
            .info-item span { float: left; color: #333; }
            .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 30px 0; }
            .stat-item { text-align: center; background: #f5f7fa; padding: 20px; border-radius: 10px; }
            .stat-item .number { font-size: 30px; font-weight: bold; color: #667eea; }
            .stat-item .label { color: #888; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            table th { background: #667eea; color: white; padding: 10px; text-align: right; }
            table td { padding: 10px; border-bottom: 1px solid #eee; }
            .footer { text-align: center; margin-top: 30px; color: #888; font-size: 14px; border-top: 1px solid #ddd; padding-top: 20px; }
            .badge { display: inline-block; padding: 5px 15px; border-radius: 30px; font-weight: bold; float: left; }
            .level-excellent { background: #f9a825; color: #000; }
            .level-very-good { background: #4CAF50; color: #fff; }
            .level-good { background: #42a5f5; color: #fff; }
            .level-acceptable { background: #ff9800; color: #fff; }
            .level-weak { background: #f44336; color: #fff; }
            .medals { font-size: 24px; }
        </style>
        </head>
        <body>
            <div class="header">
                <h1>📚 تقرير الطالب الشهري</h1>
                <p>${new Date().toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div class="info-grid">
                <div class="info-item"><label>👤 اسم الطالب</label><span>${student.name}</span></div>
                <div class="info-item"><label>🔑 الكود</label><span>${student.code}</span></div>
                <div class="info-item"><label>📋 المجموعة</label><span>${groups.find(g => g.id === student.group_id)?.name || 'غير محدد'}</span></div>
                <div class="info-item"><label>🏆 المستوى</label><span class="badge ${getLevelClass(getStudentLevel(currentStudentId))}">${level}</span></div>
                <div class="info-item"><label>⭐ النقاط</label><span>${points} نقطة</span></div>
                <div class="info-item"><label>🥇 الترتيب</label><span>#${rank}</span></div>
                <div class="info-item"><label>🏅 الميداليات</label><span class="medals">${medals.join(' ')}</span></div>
                <div class="info-item"><label>📱 ولي الأمر</label><span>${student.phone || 'غير مسجل'}</span></div>
            </div>
            <div class="stats-grid">
                <div class="stat-item"><div class="number">${present}</div><div class="label">✅ حضور</div></div>
                <div class="stat-item"><div class="number">${absent}</div><div class="label">❌ غياب</div></div>
                <div class="stat-item"><div class="number">${average}%</div><div class="label">📊 نسبة الحضور</div></div>
                <div class="stat-item"><div class="number">${gradesAvg}</div><div class="label">📝 متوسط الدرجات</div></div>
            </div>
            <h3>📊 سجل الدرجات</h3>
            ${studentGrades.length > 0 ? `
            <table><thead><tr><th>المادة</th><th>الدرجة</th><th>التاريخ</th></tr></thead><tbody>
                ${studentGrades.map(g => `<tr><td>${g.subject}</td><td><strong>${g.value}</strong></td><td>${new Date(g.date).toLocaleDateString('ar-EG')}</td></tr>`).join('')}
            </tbody></table>` : '<p style="color:#888;">لا توجد درجات مسجلة</p>'}
            <h3>💰 سجل المصاريف</h3>
            ${student.feesHistory && student.feesHistory.length > 0 ? `
            <table><thead><tr><th>التاريخ</th><th>المبلغ</th><th>الملاحظات</th></tr></thead><tbody>
                ${student.feesHistory.map(f => `<tr><td>${new Date(f.date).toLocaleDateString('ar-EG')}</td><td><strong>${f.amount} ج</strong></td><td>${f.note || '-'}</td></tr>`).join('')}
            </tbody></table>
            <p><strong>الإجمالي:</strong> ${student.fees || 0} ج | <strong>المدفوع:</strong> ${student.fees_paid || 0} ج | <strong>المتبقي:</strong> ${(student.fees || 0) - (student.fees_paid || 0)} ج</p>
            ` : '<p style="color:#888;">لا توجد مدفوعات مسجلة</p>'}
            <div class="footer">
                <p>تم إنشاء هذا التقرير بواسطة نظام متابعة الطلاب</p>
                <p>📅 ${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG')}</p>
            </div>
        </body>
        </html>
    `;
    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
}
