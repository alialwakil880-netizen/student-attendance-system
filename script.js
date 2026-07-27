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
// Helper: Get Student Field
// ============================================================

function getStudentField(student, field) {
    const fieldMap = {
        'name': ['name', 'student_name', 'full_name', 'studentName'],
        'code': ['code', 'student_code', 'studentCode', 'student_id'],
        'phone': ['phone', 'student_phone', 'studentPhone', 'phone_number'],
        'group_id': ['group_id', 'groupId', 'group'],
        'points': ['points', 'student_points', 'studentPoints'],
        'streak': ['streak', 'student_streak', 'studentStreak'],
        'fees': ['fees', 'student_fees', 'studentFees', 'fee'],
        'fees_paid': ['fees_paid', 'student_fees_paid', 'studentFeesPaid', 'feesPaid'],
        'is_star': ['is_star', 'isStar', 'star'],
        'medals': ['medals', 'student_medals', 'studentMedals'],
        'rewards': ['rewards', 'student_rewards', 'studentRewards'],
        'avatar': ['avatar', 'student_avatar', 'studentAvatar']
    };
    
    const possibleNames = fieldMap[field] || [field];
    for (let name of possibleNames) {
        if (student[name] !== undefined && student[name] !== null) {
            return student[name];
        }
    }
    return undefined;
}

// ============================================================
// Load Data (من Supabase)
// ============================================================

async function loadData() {
    try {
        if (!supabaseClient) {
            await initSupabaseClient();
        }
        
        const { data: studentsData, error: studentsError } = await supabaseClient
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (studentsError) throw studentsError;
        students = studentsData || [];
        
        const { data: groupsData, error: groupsError } = await supabaseClient
            .from('groups')
            .select('*')
            .order('created_at', { ascending: true });
        
        if (groupsError) throw groupsError;
        groups = groupsData || [];
        
        const { data: attendanceData, error: attendanceError } = await supabaseClient
            .from('attendance')
            .select('*')
            .order('date', { ascending: false });
        
        if (attendanceError) throw attendanceError;
        attendance = attendanceData || [];
        
        const { data: gradesData, error: gradesError } = await supabaseClient
            .from('grades')
            .select('*')
            .order('date', { ascending: false });
        
        if (gradesError) throw gradesError;
        grades = gradesData || [];
        
        console.log('✅ تم تحميل البيانات من Supabase. عدد الطلاب:', students.length);
        if (students.length > 0) {
            console.log('📊 أول طالب:', students[0]);
            console.log('📋 الحقول المتاحة:', Object.keys(students[0]));
        }
        
        saveData();
        
    } catch (error) {
        console.error('❌ خطأ في تحميل البيانات من Supabase:', error);
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
        students.forEach(s => allFees += (getStudentField(s, 'fees') || 0));
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
        const studentName = student ? (getStudentField(student, 'name') || 'غير معروف') : 'غير معروف';
        return `<tr><td>${studentName}</td><td>${group ? group.name : 'غير معروف'}</td><td class="${statusClass}">${statusText}</td><td>${new Date(a.date).toLocaleTimeString('ar-EG')}</td></tr>`;
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
                const studentName = getStudentField(student, 'name') || 'غير معروف';
                alerts.push({ type: 'danger', message: `⚠️ الطالب <strong>${studentName}</strong> غاب 3 أيام متتالية!` });
            }
        }
        
        const totalFees = getStudentField(student, 'fees') || 0;
        const paidFees = getStudentField(student, 'fees_paid') || 0;
        const remaining = totalFees - paidFees;
        if (totalFees > 0 && remaining > totalFees / 2) {
            const studentName = getStudentField(student, 'name') || 'غير معروف';
            alerts.push({ type: 'warning', message: `💰 الطالب <strong>${studentName}</strong> متأخر في المصاريف (المتبقي: ${remaining} ج)` });
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
// QR CODE FUNCTIONS
// ============================================================

function generateQRCode(elementId, code) {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.innerHTML = "";

    try {
        if (typeof QRCode !== 'undefined') {
            new QRCode(element, {
                text: code,
                width: 80,
                height: 80
            });
        } else {
            console.log('⏳ جاري تحميل مكتبة QR Code...');
            setTimeout(() => generateQRCode(elementId, code), 500);
        }
    } catch (error) {
        console.log("❌ خطأ في إنشاء QR Code:", error);
        element.innerHTML = `<span style="font-size:12px;color:#888;">${code}</span>`;
    }
}

function generateAllQRCodes() {
    students.forEach(s => {
        const code = getStudentField(s, 'code') || s.id || '---';
        generateQRCode(`qrcode-${s.id}`, code);
    });
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
        const codes = students.map(s => parseInt(getStudentField(s, 'code')) || 0);
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

// ============================================================
// loadStudents() - مع إضافة زر ولي الأمر 👨‍👦
// ============================================================

function loadStudents() {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    
    console.log('🔄 جاري تحميل الطلاب، العدد:', students.length);
    
    if (!students || students.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#888;padding:30px;">📭 لا يوجد طلاب</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = students.map((s, index) => {
        const studentName = getStudentField(s, 'name') || 'غير معروف';
        const studentCode = getStudentField(s, 'code') || '---';
        const studentPoints = getStudentField(s, 'points') || 0;
        const studentStreak = getStudentField(s, 'streak') || 0;
        
        const group = groups.find(g => g.id === s.group_id);
        const groupName = group ? group.name : 'غير محدد';
        
        const level = getLevelLabel(getStudentLevel(s.id));
        const levelClass = getLevelClass(getStudentLevel(s.id));
        
        return `<tr>
            <td>${index + 1}</td>
            <td><span style="font-size:20px;">${getAvatar(s.id)}</span> ${studentName}</td>
            <td><strong>${studentCode}</strong></td>
            <td>${groupName}</td>
            <td><span class="level-badge ${levelClass}">${level}</span></td>
            <td>⭐ ${studentPoints}</td>
            <td>🔥 ${studentStreak}</td>
            <td>
                <div id="qrcode-${s.id}"></div>
            </td>
            <td>
                <button class="btn-primary" onclick="editStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">✏️</button>
                <button class="btn-primary" onclick="viewProfile('${s.id}')" style="padding:4px 10px;font-size:11px;">👤</button>
                <button class="btn-danger" onclick="deleteStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">🗑️</button>
                <button class="btn-primary" onclick="openParentPortal('${s.id}')" style="padding:4px 10px;font-size:11px;background:#fbbf24;color:#000;" title="فتح بوابة ولي الأمر">👨‍👦</button>
            </td>
        </tr>`;
    }).join('');
    
    setTimeout(generateAllQRCodes, 100);
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
// Edit Student
// ============================================================

function editStudent(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) {
        alert('⚠️ الطالب غير موجود');
        return;
    }
    
    document.getElementById('editStudentId').value = studentId;
    document.getElementById('editStudentName').value = getStudentField(student, 'name') || '';
    document.getElementById('editStudentPhone').value = getStudentField(student, 'phone') || '';
    document.getElementById('editStudentFees').value = getStudentField(student, 'fees') || 0;
    
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
        filteredStudents = filteredStudents.filter(s => {
            const name = (getStudentField(s, 'name') || '').toLowerCase();
            const code = (getStudentField(s, 'code') || '').toLowerCase();
            return name.includes(searchText) || code.includes(searchText);
        });
    }
    if (filterGroup) {
        filteredStudents = filteredStudents.filter(s => s.group_id === filterGroup);
    }
    displayFilteredStudents(filteredStudents);
}

// ============================================================
// displayFilteredStudents() - مع إضافة زر ولي الأمر 👨‍👦
// ============================================================

function displayFilteredStudents(filteredStudents) {
    const tableBody = document.getElementById('studentsTableBody');
    if (!tableBody) return;
    
    if (!filteredStudents || filteredStudents.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center;color:#888;">❌ لا توجد نتائج مطابقة</td></tr>`;
        return;
    }
    
    tableBody.innerHTML = filteredStudents.map((s, index) => {
        const studentName = getStudentField(s, 'name') || 'غير معروف';
        const studentCode = getStudentField(s, 'code') || '---';
        const studentPoints = getStudentField(s, 'points') || 0;
        const studentStreak = getStudentField(s, 'streak') || 0;
        
        const group = groups.find(g => g.id === s.group_id);
        const groupName = group ? group.name : 'غير محدد';
        
        const level = getLevelLabel(getStudentLevel(s.id));
        const levelClass = getLevelClass(getStudentLevel(s.id));
        
        return `<tr>
            <td>${index + 1}</td>
            <td><span style="font-size:20px;">${getAvatar(s.id)}</span> ${studentName}</td>
            <td><strong>${studentCode}</strong></td>
            <td>${groupName}</td>
            <td><span class="level-badge ${levelClass}">${level}</span></td>
            <td>⭐ ${studentPoints}</td>
            <td>🔥 ${studentStreak}</td>
            <td>
                <div id="qrcode-${s.id}"></div>
            </td>
            <td>
                <button class="btn-primary" onclick="editStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">✏️</button>
                <button class="btn-primary" onclick="viewProfile('${s.id}')" style="padding:4px 10px;font-size:11px;">👤</button>
                <button class="btn-danger" onclick="deleteStudent('${s.id}')" style="padding:4px 10px;font-size:11px;">🗑️</button>
                <button class="btn-primary" onclick="openParentPortal('${s.id}')" style="padding:4px 10px;font-size:11px;background:#fbbf24;color:#000;" title="فتح بوابة ولي الأمر">👨‍👦</button>
            </td>
        </tr>`;
    }).join('');
    
    setTimeout(generateAllQRCodes, 100);
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
        const paid = getStudentField(s, 'fees_paid') || 0;
        const totalFees = getStudentField(s, 'fees') || 0;
        const remaining = totalFees - paid;
        const level = getLevelLabel(getStudentLevel(s.id));
        const points = getStudentField(s, 'points') || 0;
        const name = getStudentField(s, 'name') || 'غير معروف';
        const code = getStudentField(s, 'code') || '---';
        csv += `${code},${name},${group ? group.name : 'غير محدد'},${totalFees},${paid},${remaining},${points},${level}\n`;
    });
    csv += '\n\nسجل الحضور\nالطالب,الحالة,التاريخ\n';
    attendance.forEach(a => {
        const student = students.find(s => s.id === a.student_id);
        const studentName = student ? (getStudentField(student, 'name') || 'غير معروف') : 'غير معروف';
        csv += `${studentName},${a.status === 'present' ? 'حاضر' : 'غائب'},${new Date(a.date).toLocaleDateString('ar-EG')}\n`;
    });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `الطلاب_${new Date().toLocaleDateString('ar-EG')}.csv`;
    link.click();
    alert('✅ تم تصدير البيانات بنجاح');
}

// ============================================================
// Groups Management
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
        const { data, error } = await supabaseClient
            .from('groups')
            .insert([{ name: name, time: time || '00:00' }])
            .select();
        
        if (error) {
            console.error('❌ خطأ Supabase:', error);
            alert('❌ خطأ في Supabase: ' + error.message);
            return;
        }
        
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
// Attendance
// ============================================================

function showManualAttendance() {
    if (isCameraRunning) stopCameraReader();
    document.getElementById('manualAttendance').style.display = 'block';
    document.getElementById('cameraAttendance').style.display = 'none';
    const select = document.getElementById('studentSelect');
    if (select) {
        select.innerHTML = '<option value="">-- اختر طالب --</option>';
        students.forEach(s => {
            const name = getStudentField(s, 'name') || 'غير معروف';
            const code = getStudentField(s, 'code') || '---';
            select.innerHTML += `<option value="${s.id}">${name} (${code})</option>`;
        });
    }
}

function showCameraAttendance() {
    document.getElementById('cameraAttendance').style.display = 'block';
    document.getElementById('manualAttendance').style.display = 'none';
    setTimeout(() => startQRScanner(), 500);
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
            const currentStreak = getStudentField(student, 'streak') || 0;
            const currentPoints = getStudentField(student, 'points') || 0;
            
            const { error: updateError } = await supabaseClient
                .from('students')
                .update({ 
                    streak: currentStreak + 1,
                    points: currentPoints + 5
                })
                .eq('id', studentId);
            
            if (!updateError) {
                student.streak = currentStreak + 1;
                student.points = currentPoints + 5;
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
// QR SCANNER
// ============================================================

function startQRScanner() {
    const readerElement = document.getElementById('reader');
    const resultElement = document.getElementById('scanResult');
    
    if (!readerElement) {
        alert('⚠️ عنصر الكاميرا غير موجود');
        return;
    }
    
    if (typeof Html5Qrcode === 'undefined') {
        alert('⚠️ جاري تحميل مكتبة المسح... يرجى الانتظار');
        return;
    }
    
    if (resultElement) {
        resultElement.textContent = '📷 جاري تشغيل الكاميرا...';
        resultElement.style.color = '#667eea';
    }
    
    const scanner = new Html5Qrcode("reader");
    
    scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
            if (resultElement) {
                resultElement.textContent = `✅ تم مسح الكود: ${decodedText}`;
                resultElement.style.color = '#4CAF50';
            }
            await markAttendanceByCode(decodedText);
            scanner.stop();
            if (resultElement) {
                resultElement.textContent = '⏹ تم إيقاف المسح';
                resultElement.style.color = '#888';
            }
        },
        (errorMessage) => {
            // تجاهل أخطاء القراءة المؤقتة
        }
    ).catch(err => {
        if (resultElement) {
            resultElement.textContent = '❌ لا يمكن تشغيل الكاميرا: ' + err.message;
            resultElement.style.color = '#f44336';
        }
        alert('⚠️ لا يمكن تشغيل الكاميرا. تأكد من السماح بالوصول إلى الكاميرا.');
    });
}

// ============================================================
// MARK ATTENDANCE BY QR CODE
// ============================================================

async function markAttendanceByCode(code) {
    const student = students.find(s => {
        const studentCode = getStudentField(s, 'code');
        return studentCode === code;
    });

    if (!student) {
        alert("❌ الطالب غير موجود");
        return;
    }

    const today = new Date().toISOString().split('T')[0];

    const already = attendance.find(a =>
        a.student_id === student.id &&
        a.date.startsWith(today)
    );

    if (already) {
        const studentName = getStudentField(student, 'name') || 'غير معروف';
        alert(`⚠️ ${studentName} مسجل حضور بالفعل`);
        return;
    }

    try {
        const { error } = await supabaseClient
            .from('attendance')
            .insert([{
                student_id: student.id,
                group_id: student.group_id,
                status: 'present',
                date: new Date().toISOString()
            }]);

        if (error) {
            console.error(error);
            alert("❌ فشل تسجيل الحضور");
            return;
        }

        const studentName = getStudentField(student, 'name') || 'غير معروف';
        alert(`✅ تم تسجيل حضور ${studentName}`);

        attendance.push({
            student_id: student.id,
            group_id: student.group_id,
            status: 'present',
            date: new Date().toISOString()
        });

        const currentStreak = getStudentField(student, 'streak') || 0;
        const currentPoints = getStudentField(student, 'points') || 0;
        
        student.streak = currentStreak + 1;
        student.points = currentPoints + 5;
        
        await supabaseClient
            .from('students')
            .update({ 
                streak: student.streak,
                points: student.points
            })
            .eq('id', student.id);
        
        checkMedals(student);
        saveData();
        updateDashboard();
        updateLeaderboard();
        updateHonorBoard();
        
    } catch (error) {
        console.error('❌ Error:', error);
        alert('❌ حدث خطأ في تسجيل الحضور');
    }
}

function stopCameraReader() {
    const resultElement = document.getElementById('scanResult');
    if (resultElement) {
        resultElement.textContent = '⏹ تم إيقاف الكاميرا';
        resultElement.style.color = '#888';
    }
}

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
    const sorted = [...students].sort((a, b) => (getStudentField(b, 'points') || 0) - (getStudentField(a, 'points') || 0));
    const index = sorted.findIndex(s => s.id === studentId);
    return index + 1;
}

function getMedals(student) {
    const medals = [];
    const points = getStudentField(student, 'points') || 0;
    const streak = getStudentField(student, 'streak') || 0;
    if (points >= 100) medals.push('🥇');
    if (points >= 50) medals.push('🥈');
    if (points >= 25) medals.push('🥉');
    if (streak >= 10) medals.push('🔥');
    if (streak >= 5) medals.push('⭐');
    return medals;
}

function checkMedals(student) {
    const points = getStudentField(student, 'points') || 0;
    const streak = getStudentField(student, 'streak') || 0;
    const medals = [];
    if (points >= 100) medals.push('🥇 الذهبية');
    if (points >= 50) medals.push('🥈 الفضية');
    if (points >= 25) medals.push('🥉 البرونزية');
    if (streak >= 10) medals.push('🔥 سلسلة 10 أيام');
    if (streak >= 5) medals.push('⭐ سلسلة 5 أيام');
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
    student.points = (getStudentField(student, 'points') || 0) + points;
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
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    alert(`🎉 تم منح ${studentName} مكافأة: ${reward}`);
}

function updateLeaderboard() {
    const container = document.getElementById('leaderboardContainer');
    if (!container) return;
    const sorted = [...students].sort((a, b) => (getStudentField(b, 'points') || 0) - (getStudentField(a, 'points') || 0));
    if (sorted.length === 0) {
        container.innerHTML = '<p style="color:var(--text-secondary);">لا يوجد طلاب لعرض الترتيب</p>';
        return;
    }
    container.innerHTML = sorted.slice(0, 10).map((s, i) => {
        const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : '';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i+1}`;
        const studentName = getStudentField(s, 'name') || 'غير معروف';
        const studentPoints = getStudentField(s, 'points') || 0;
        const studentStreak = getStudentField(s, 'streak') || 0;
        return `
            <div class="leaderboard-item">
                <span class="rank ${rankClass}">${medal}</span>
                <span class="name">${getAvatar(s.id)} ${studentName}</span>
                <span class="points">⭐ ${studentPoints}</span>
                <span style="font-size:12px;color:var(--text-secondary);">🔥 ${studentStreak}</span>
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
        const points = getStudentField(s, 'points') || 0;
        const level = getLevelLabel(getStudentLevel(s.id));
        const medals = getMedals(s);
        const studentName = getStudentField(s, 'name') || 'غير معروف';
        return `
            <div class="honor-card">
                <span class="honor-icon">${getAvatar(s.id)}</span>
                <div class="honor-name">${studentName}</div>
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
                        ${levels[key].map(s => {
                            const studentName = getStudentField(s, 'name') || 'غير معروف';
                            const studentCode = getStudentField(s, 'code') || '---';
                            return `<span class="level-student-tag">${getAvatar(s.id)} ${studentName} (${studentCode})</span>`;
                        }).join('')}
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
    const phone = getStudentField(student, 'phone');
    if (!phone) { alert('⚠️ هذا الطالب ليس لديه رقم هاتف مسجل'); return; }
    const statusText = status === 'present' ? '✅ حضر' : '❌ غاب';
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    const studentCode = getStudentField(student, 'code') || '---';
    const studentPoints = getStudentField(student, 'points') || 0;
    const message = `📚 *إشعار حضور وغياب*\n\nالطالب: ${studentName}\nالكود: ${studentCode}\nالحالة: ${statusText}\nالتاريخ: ${new Date().toLocaleDateString('ar-EG')}\nالوقت: ${new Date().toLocaleTimeString('ar-EG')}\n⭐ النقاط: ${studentPoints}\n\nشكراً لمتابعتكم`;
    let phoneNumber = phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.substring(1);
    if (!phoneNumber.startsWith('2')) phoneNumber = '2' + phoneNumber;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
}

function sendMonthlyReportDirect(studentId) {
    const student = students.find(s => s.id === studentId);
    if (!student) { alert('⚠️ الطالب غير موجود'); return; }
    const phone = getStudentField(student, 'phone');
    if (!phone) { alert('⚠️ هذا الطالب ليس لديه رقم هاتف مسجل'); return; }
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthAttendance = attendance.filter(a => a.student_id === studentId && new Date(a.date) >= monthStart);
    const present = monthAttendance.filter(a => a.status === 'present').length;
    const absent = monthAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    const studentGrades = grades.filter(g => g.student_id === studentId);
    const gradesList = studentGrades.map(g => `${g.subject}: ${g.value}`).join('\n');
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    const studentPoints = getStudentField(student, 'points') || 0;
    const totalFees = getStudentField(student, 'fees') || 0;
    const paidFees = getStudentField(student, 'fees_paid') || 0;
    const remainingFees = totalFees - paidFees;
    const message = `📊 *تقرير شهري - ${studentName}*\n\n📅 الشهر: ${now.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' })}\n✅ الحضور: ${present}\n❌ الغياب: ${absent}\n📊 نسبة الحضور: ${average}%\n⭐ النقاط: ${studentPoints}\n\n📝 *الدرجات:*\n${gradesList || 'لا توجد درجات'}\n\n💰 المصاريف:\nالإجمالي: ${totalFees} ج\nالمدفوع: ${paidFees} ج\nالمتبقي: ${remainingFees} ج\n\nشكراً لمتابعتكم`;
    let phoneNumber = phone.replace(/\D/g, '');
    if (phoneNumber.startsWith('0')) phoneNumber = phoneNumber.substring(1);
    if (!phoneNumber.startsWith('2')) phoneNumber = '2' + phoneNumber;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
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
// PARENT PORTAL - بوابة ولي الأمر
// ============================================================

function openParentPortal(studentId) {
    const url = `parent-portal.html?id=${studentId}`;
    window.open(url, '_blank', 'width=1100,height=900,scrollbars=yes,resizable=yes');
}

function loadParentData() {
    const container = document.getElementById('parentContent');
    if (!container) return;
    
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    
    console.log('🔍 Parent Portal - Student ID:', studentId);
    console.log('📊 Students count:', students.length);
    
    if (!studentId) {
        container.innerHTML = `
            <div class="parent-not-found">
                <h2>❌ لم يتم العثور على طالب</h2>
                <p>يرجى استخدام الرابط الصحيح للوصول إلى بيانات الطالب</p>
                <a href="index.html" class="parent-back-btn">🔙 العودة لتسجيل الدخول</a>
            </div>
        `;
        return;
    }
    
    const student = students.find(s => s.id === studentId);
    
    console.log('🎯 Found student:', student);
    
    if (!student) {
        container.innerHTML = `
            <div class="parent-not-found">
                <h2>❌ طالب غير موجود</h2>
                <p>الطالب الذي تبحث عنه غير موجود في النظام</p>
                <p style="font-size:14px;color:#667eea;margin-top:10px;">🔑 المعرف: ${studentId}</p>
                <a href="index.html" class="parent-back-btn">🔙 العودة لتسجيل الدخول</a>
            </div>
        `;
        return;
    }
    
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    const studentCode = getStudentField(student, 'code') || '---';
    const studentPhone = getStudentField(student, 'phone') || 'غير مسجل';
    const studentFees = getStudentField(student, 'fees') || 0;
    const studentFeesPaid = getStudentField(student, 'fees_paid') || 0;
    const studentPoints = getStudentField(student, 'points') || 0;
    const studentStreak = getStudentField(student, 'streak') || 0;
    const studentIsStar = student.is_star || false;
    
    const group = groups.find(g => g.id === student.group_id);
    const groupName = group ? group.name : 'غير محدد';
    
    const level = getLevelLabel(getStudentLevel(student.id));
    const levelClass = getLevelClass(getStudentLevel(student.id));
    const rank = getStudentRank(student.id);
    const medals = getMedals(student);
    const remainingFees = studentFees - studentFeesPaid;
    
    const studentAttendance = attendance.filter(a => a.student_id === student.id);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const totalAttendance = present + absent;
    const attendanceRate = totalAttendance > 0 ? Math.round((present / totalAttendance) * 100) : 0;
    
    const studentGrades = grades.filter(g => g.student_id === student.id);
    const gradesAvg = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length) : 0;
    
    const feesHistory = student.feesHistory || [];
    
    container.innerHTML = `
        <div class="parent-card">
            <div style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:20px;">
                <div style="font-size:80px;background:#f8f9fa;border-radius:50%;width:100px;height:100px;display:flex;align-items:center;justify-content:center;border:3px solid #667eea;">
                    ${getAvatar(student.id)}
                </div>
                <div style="flex:1;">
                    <h2 style="font-size:28px;color:#1a1a2e;margin:0;">${studentName}</h2>
                    <p style="color:#888;margin:5px 0;">🔑 الكود: <strong style="color:#667eea;font-size:20px;">${studentCode}</strong></p>
                    <p style="color:#888;margin:5px 0;">📋 المجموعة: <strong>${groupName}</strong></p>
                    ${studentIsStar ? '<span style="display:inline-block;background:#fbbf24;padding:4px 16px;border-radius:30px;font-weight:700;color:#000;font-size:14px;">⭐ طالب مميز</span>' : ''}
                </div>
                <div class="parent-qr-code">
                    <div id="parentQRCode"></div>
                </div>
            </div>
            
            <div class="parent-info-grid">
                <div class="parent-info-item">
                    <span class="label">📱 ولي الأمر</span>
                    <span class="value">${studentPhone}</span>
                </div>
                <div class="parent-info-item">
                    <span class="label">🏆 المستوى</span>
                    <span class="value"><span class="parent-level-badge parent-level-${levelClass.replace('level-', '')}">${level}</span></span>
                </div>
                <div class="parent-info-item">
                    <span class="label">⭐ النقاط</span>
                    <span class="value">${studentPoints} نقطة</span>
                </div>
                <div class="parent-info-item">
                    <span class="label">🥇 الترتيب</span>
                    <span class="value">#${rank}</span>
                </div>
                <div class="parent-info-item">
                    <span class="label">🔥 سلسلة الحضور</span>
                    <span class="value">${studentStreak} يوم</span>
                </div>
                <div class="parent-info-item">
                    <span class="label">🏅 الميداليات</span>
                    <span class="value"><span class="parent-medals">${medals.length > 0 ? medals.join(' ') : 'لا توجد'}</span></span>
                </div>
            </div>
        </div>
        
        <div class="parent-card">
            <h2>📊 إحصائيات الطالب</h2>
            <div class="parent-stats">
                <div class="parent-stat">
                    <div class="num green">${present}</div>
                    <div class="lbl">✅ حضور</div>
                </div>
                <div class="parent-stat">
                    <div class="num red">${absent}</div>
                    <div class="lbl">❌ غياب</div>
                </div>
                <div class="parent-stat">
                    <div class="num blue">${attendanceRate}%</div>
                    <div class="lbl">📊 نسبة الحضور</div>
                </div>
                <div class="parent-stat">
                    <div class="num purple">${gradesAvg}</div>
                    <div class="lbl">📝 متوسط الدرجات</div>
                </div>
                <div class="parent-stat">
                    <div class="num gold">${studentFees} ج</div>
                    <div class="lbl">💰 إجمالي المصاريف</div>
                </div>
                <div class="parent-stat">
                    <div class="num green">${studentFeesPaid} ج</div>
                    <div class="lbl">💳 المدفوع</div>
                </div>
                <div class="parent-stat">
                    <div class="num red">${remainingFees} ج</div>
                    <div class="lbl">📦 المتبقي</div>
                </div>
                <div class="parent-stat">
                    <div class="num purple">${studentGrades.length}</div>
                    <div class="lbl">📝 عدد الدرجات</div>
                </div>
            </div>
        </div>
        
        <div class="parent-card">
            <h2>📝 سجل الدرجات</h2>
            ${studentGrades.length > 0 ? `
            <table class="parent-table">
                <thead>
                    <tr><th>المادة</th><th>الدرجة</th><th>التاريخ</th></tr>
                </thead>
                <tbody>
                    ${studentGrades.map(g => `
                        <tr>
                            <td>${g.subject}</td>
                            <td><strong style="color:#667eea;">${g.value}</strong></td>
                            <td>${new Date(g.date).toLocaleDateString('ar-EG')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p style="color:#888;text-align:center;padding:20px;">📭 لا توجد درجات مسجلة</p>'}
        </div>
        
        <div class="parent-card">
            <h2>💰 سجل المصاريف</h2>
            ${feesHistory.length > 0 ? `
            <table class="parent-table">
                <thead>
                    <tr><th>التاريخ</th><th>المبلغ</th><th>الملاحظات</th></tr>
                </thead>
                <tbody>
                    ${feesHistory.map(f => `
                        <tr>
                            <td>${new Date(f.date).toLocaleDateString('ar-EG')}</td>
                            <td><strong style="color:#4CAF50;">${f.amount} ج</strong></td>
                            <td>${f.note || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ` : '<p style="color:#888;text-align:center;padding:20px;">📭 لا توجد مدفوعات مسجلة</p>'}
            
            <div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:15px;padding:15px;background:#f8f9fa;border-radius:12px;">
                <div><strong>الإجمالي:</strong> <span style="color:#667eea;font-weight:700;">${studentFees} ج</span></div>
                <div><strong>المدفوع:</strong> <span style="color:#4CAF50;font-weight:700;">${studentFeesPaid} ج</span></div>
                <div><strong>المتبقي:</strong> <span style="color:#f44336;font-weight:700;">${remainingFees} ج</span></div>
            </div>
        </div>
        
        <div class="parent-warning">
            <p>🔒 هذه الصفحة للعرض فقط - لا توجد صلاحيات تعديل</p>
        </div>
    `;
    
    generateQRCode('parentQRCode', studentCode);
}

// ============================================================
// Profile - معدلة بالكامل مع التحقق من وجود العناصر
// ============================================================

function loadProfileData() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    let student;

    if (code) {
        student = students.find(s => {
            const studentCode = getStudentField(s, 'code');
            return studentCode === code;
        });
    } else {
        const studentId = localStorage.getItem("viewStudentId");
        student = students.find(s => s.id === studentId);
    }

    if (!student) {
        alert("⚠️ الطالب غير موجود");
        window.location.href = "students.html";
        return;
    }

    currentStudentId = student.id;
    const group = groups.find(g => g.id === student.group_id);
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    const studentPhone = getStudentField(student, 'phone') || 'غير محدد';
    const studentCode = getStudentField(student, 'code') || 'غير محدد';
    const totalFees = getStudentField(student, 'fees') || 0;
    const points = getStudentField(student, 'points') || 0;
    const streak = getStudentField(student, 'streak') || 0;

    // التحقق من وجود العناصر قبل التعديل
    const elements = {
        profileName: document.getElementById('profileName'),
        profilePhone: document.getElementById('profilePhone'),
        profileGroup: document.getElementById('profileGroup'),
        profileCode: document.getElementById('profileCode'),
        profileAvatar: document.getElementById('profileAvatar'),
        profileFees: document.getElementById('profileFees'),
        profilePoints: document.getElementById('profilePoints'),
        profileRank: document.getElementById('profileRank'),
        profileStreak: document.getElementById('profileStreak'),
        profileMedals: document.getElementById('profileMedals'),
        studentPoints: document.getElementById('studentPoints'),
        studentLevel: document.getElementById('studentLevel'),
        studentMedals: document.getElementById('studentMedals'),
        profileAvgGrade: document.getElementById('profileAvgGrade'),
        profileGradeRank: document.getElementById('profileGradeRank'),
        profilePresent: document.getElementById('profilePresent'),
        profileAbsent: document.getElementById('profileAbsent'),
        profileAverage: document.getElementById('profileAverage'),
        profileTotalFees: document.getElementById('profileTotalFees'),
        profileGradesCount: document.getElementById('profileGradesCount'),
        profileGradesAvg: document.getElementById('profileGradesAvg')
    };

    // تحديث العناصر الموجودة فقط
    if (elements.profileName) elements.profileName.textContent = studentName;
    if (elements.profilePhone) elements.profilePhone.textContent = studentPhone;
    if (elements.profileGroup) elements.profileGroup.textContent = group ? group.name : 'غير محدد';
    if (elements.profileCode) elements.profileCode.textContent = studentCode;
    if (elements.profileAvatar) elements.profileAvatar.textContent = getAvatar(student.id);
    if (elements.profileFees) elements.profileFees.textContent = totalFees;
    
    const rank = getStudentRank(student.id);
    const medals = getMedals(student);
    
    if (elements.profilePoints) elements.profilePoints.textContent = points;
    if (elements.profileRank) elements.profileRank.textContent = rank;
    if (elements.profileStreak) elements.profileStreak.textContent = streak;
    if (elements.profileMedals) elements.profileMedals.textContent = medals.join(' ');
    
    if (elements.studentPoints) elements.studentPoints.textContent = points;
    if (elements.studentLevel) elements.studentLevel.textContent = getLevelLabel(getStudentLevel(student.id));
    if (elements.studentMedals) elements.studentMedals.textContent = medals.join(' ');
    
    const studentGrades = grades.filter(g => g.student_id === student.id);
    const avg = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length) : 0;
    
    if (elements.profileAvgGrade) elements.profileAvgGrade.textContent = avg + '%';
    if (elements.profileGradeRank) elements.profileGradeRank.textContent = rank;
    
    const studentAttendance = attendance.filter(a => a.student_id === student.id);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    
    if (elements.profilePresent) elements.profilePresent.textContent = present;
    if (elements.profileAbsent) elements.profileAbsent.textContent = absent;
    if (elements.profileAverage) elements.profileAverage.textContent = average + '%';
    if (elements.profileTotalFees) elements.profileTotalFees.textContent = totalFees;
    if (elements.profileGradesCount) elements.profileGradesCount.textContent = studentGrades.length;
    if (elements.profileGradesAvg) elements.profileGradesAvg.textContent = avg + '%';
    
    // إنشاء QR Code فقط إذا كان العنصر موجوداً
    if (document.getElementById('profileQRCode')) {
        generateQRCode('profileQRCode', studentCode);
    }
    
    loadGrades(student.id);
    loadFeesHistory(student.id);
}

function loadStudentFromQR() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    
    if (!code) {
        document.getElementById('studentProfileCard').innerHTML = `
            <div style="text-align:center;padding:40px;">
                <h2>❌ لم يتم العثور على طالب</h2>
                <p style="color:#888;">يرجى مسح QR Code صحيح</p>
                <button onclick="window.location.href='index.html'" class="btn-primary" style="margin-top:20px;">🔙 العودة لتسجيل الدخول</button>
            </div>
        `;
        return;
    }
    
    const student = students.find(s => {
        const studentCode = getStudentField(s, 'code');
        return studentCode === code;
    });
    
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
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    const studentPhone = getStudentField(student, 'phone') || 'غير محدد';
    const studentCode = getStudentField(student, 'code') || 'غير محدد';
    const totalFees = getStudentField(student, 'fees') || 0;
    const points = getStudentField(student, 'points') || 0;
    const streak = getStudentField(student, 'streak') || 0;
    
    document.getElementById('spAvatar').textContent = getAvatar(student.id);
    document.getElementById('spName').textContent = studentName;
    document.getElementById('spPhone').textContent = studentPhone;
    document.getElementById('spGroup').textContent = group ? group.name : 'غير محدد';
    document.getElementById('spCode').textContent = studentCode;
    document.getElementById('spFees').textContent = totalFees;
    
    const rank = getStudentRank(student.id);
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
    
    const totalFeesAmount = getStudentField(student, 'fees') || 0;
    const paidFees = getStudentField(student, 'fees_paid') || 0;
    const remainingFees = totalFeesAmount - paidFees;
    document.getElementById('spTotalFees').textContent = totalFeesAmount;
    document.getElementById('spPaidFees').textContent = paidFees;
    document.getElementById('spRemainingFees').textContent = remainingFees;
    
    generateQRCode('spQRCode', studentCode);
    
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
// Grades (مع Supabase) - معدلة
// ============================================================

async function addGrade() {
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
    
    if (!currentStudentId) {
        alert('⚠️ لا يوجد طالب محدد');
        return;
    }
    
    try {
        if (!supabaseClient) {
            await initSupabaseClient();
        }
        
        console.log('📤 جاري إضافة درجة للطالب:', currentStudentId);
        
        const { data, error } = await supabaseClient
            .from('grades')
            .insert([{
                student_id: currentStudentId,
                subject: subject,
                value: parseInt(value),
                date: new Date().toISOString()
            }])
            .select();
        
        if (error) {
            console.error('❌ خطأ Supabase:', error);
            saveGradeLocally(currentStudentId, subject, value);
            return;
        }
        
        console.log('✅ تم إضافة الدرجة:', data);
        
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
        if (student) {
            if (parseInt(value) >= 90) {
                student.points = (getStudentField(student, 'points') || 0) + 10;
                await supabaseClient
                    .from('students')
                    .update({ points: student.points })
                    .eq('id', student.id);
                alert('⭐ +10 نقاط على الدرجة الممتازة!');
            } else if (parseInt(value) >= 80) {
                student.points = (getStudentField(student, 'points') || 0) + 5;
                await supabaseClient
                    .from('students')
                    .update({ points: student.points })
                    .eq('id', student.id);
                alert('⭐ +5 نقاط على الدرجة الجيدة جداً!');
            }
            checkMedals(student);
        }
        
        saveData();
        loadProfileData();
        updateHonorBoard();
        updateLeaderboard();
        alert('✅ تم إضافة الدرجة بنجاح');
        
        document.getElementById('gradeSubject').value = '';
        document.getElementById('gradeValue').value = '';
        
    } catch (error) {
        console.error('❌ Error adding grade:', error);
        saveGradeLocally(currentStudentId, subject, value);
    }
}

function saveGradeLocally(studentId, subject, value) {
    try {
        const tempGrade = {
            id: Date.now().toString(),
            student_id: studentId,
            subject: subject,
            value: parseInt(value),
            date: new Date().toISOString()
        };
        grades.unshift(tempGrade);
        
        const student = students.find(s => s.id === studentId);
        if (student) {
            if (parseInt(value) >= 90) {
                student.points = (getStudentField(student, 'points') || 0) + 10;
            } else if (parseInt(value) >= 80) {
                student.points = (getStudentField(student, 'points') || 0) + 5;
            }
            checkMedals(student);
        }
        
        saveData();
        loadProfileData();
        updateHonorBoard();
        updateLeaderboard();
        alert('✅ تم إضافة الدرجة بنجاح (محلياً)');
        
        document.getElementById('gradeSubject').value = '';
        document.getElementById('gradeValue').value = '';
        
        return true;
    } catch (error) {
        console.error('❌ فشل الحفظ المحلي:', error);
        alert('⚠️ حدث خطأ في إضافة الدرجة: ' + error.message);
        return false;
    }
}

// ============================================================
// Fees (مع Supabase) - معدلة
// ============================================================

async function addFees() {
    const amount = document.getElementById('feesAmount').value;
    const note = document.getElementById('feesNote').value || 'دفعة جديدة';
    
    if (!amount || amount <= 0) { 
        alert('⚠️ من فضلك أدخل مبلغ صحيح'); 
        return; 
    }
    
    if (!currentStudentId) {
        alert('⚠️ لا يوجد طالب محدد');
        return;
    }
    
    try {
        if (!supabaseClient) {
            await initSupabaseClient();
        }
        
        console.log('📤 جاري إضافة مصاريف للطالب:', currentStudentId);
        
        const { data, error } = await supabaseClient
            .from('fees_history')
            .insert([{
                student_id: currentStudentId,
                amount: parseFloat(amount),
                note: note,
                date: new Date().toISOString()
            }])
            .select();
        
        if (error) {
            console.error('❌ خطأ Supabase:', error);
            saveFeesLocally(currentStudentId, amount, note);
            return;
        }
        
        console.log('✅ تم إضافة الدفعة:', data);
        
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
            student.fees_paid = (getStudentField(student, 'fees_paid') || 0) + parseFloat(amount);
            
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
        saveFeesLocally(currentStudentId, amount, note);
    }
}

function saveFeesLocally(studentId, amount, note) {
    try {
        const student = students.find(s => s.id === studentId);
        if (student) {
            if (!student.feesHistory) student.feesHistory = [];
            const tempFee = {
                id: Date.now().toString(),
                student_id: studentId,
                amount: parseFloat(amount),
                note: note,
                date: new Date().toISOString()
            };
            student.feesHistory.push(tempFee);
            student.fees_paid = (getStudentField(student, 'fees_paid') || 0) + parseFloat(amount);
            saveData();
            loadProfileData();
            alert('✅ تم إضافة الدفعة بنجاح (محلياً)');
            
            document.getElementById('feesAmount').value = '';
            document.getElementById('feesNote').value = '';
        }
    } catch (error) {
        console.error('❌ فشل الحفظ المحلي:', error);
        alert('⚠️ حدث خطأ في إضافة الدفعة: ' + error.message);
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
        const studentName = getStudentField(s, 'name') || 'غير معروف';
        const studentCode = getStudentField(s, 'code') || '---';
        select.innerHTML += `<option value="${s.id}">${studentName} (${studentCode})</option>`;
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
    
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    const studentCode = getStudentField(student, 'code') || '---';
    const studentPoints = getStudentField(student, 'points') || 0;
    
    document.getElementById('cardName').textContent = studentName;
    document.getElementById('cardCode').textContent = studentCode;
    document.getElementById('cardAvatar').textContent = getAvatar(studentId);
    document.getElementById('cardPoints').textContent = studentPoints;
    const group = groups.find(g => g.id === student.group_id);
    document.getElementById('cardGroup').textContent = group ? group.name : 'غير محدد';
    
    generateQRCode('cardQRCode', studentCode);
}

function showAllCards() {
    const container = document.getElementById('allCardsContainer');
    if (!container) return;
    if (students.length === 0) {
        container.innerHTML = '<p style="text-align:center;color:#888;">لا يوجد طلاب لعرض كارنيهاتهم</p>';
        return;
    }
    
    container.innerHTML = students.map(s => {
        const group = groups.find(g => g.id === s.group_id);
        const studentName = getStudentField(s, 'name') || 'غير معروف';
        const studentCode = getStudentField(s, 'code') || '---';
        const studentPoints = getStudentField(s, 'points') || 0;
        return `
            <div class="student-card" style="width:100%;">
                <div class="card-header"><h2>📚 أكاديمية النجاح</h2><p>بطاقة تعريف طالب</p></div>
                <div class="card-body">
                    <div class="card-photo"><div class="card-avatar">${getAvatar(s.id)}</div></div>
                    <div class="card-info">
                        <p><strong>الاسم:</strong> ${studentName}</p>
                        <p><strong>الكود:</strong> ${studentCode}</p>
                        <p><strong>المجموعة:</strong> ${group ? group.name : 'غير محدد'}</p>
                        <p><strong>⭐ نقاط:</strong> ${studentPoints}</p>
                    </div>
                    <div class="card-qr">
                        <div id="cardQRCode-${s.id}"></div>
                    </div>
                </div>
                <div class="card-footer"><p>✍️ توقيع المدير: _________________</p></div>
            </div>
        `;
    }).join('');
    
    setTimeout(() => {
        students.forEach(s => {
            const studentCode = getStudentField(s, 'code') || '---';
            generateQRCode(`cardQRCode-${s.id}`, studentCode);
        });
    }, 100);
}

function printCard() { window.print(); }
function printSingleCard() { window.print(); }

// ============================================================
// PDF
// ============================================================

function generatePDF() {
    const student = students.find(s => s.id === currentStudentId);
    if (!student) { alert('⚠️ الطالب غير موجود'); return; }
    
    const studentName = getStudentField(student, 'name') || 'غير معروف';
    const studentCode = getStudentField(student, 'code') || '---';
    const studentPhone = getStudentField(student, 'phone') || 'غير مسجل';
    const studentFees = getStudentField(student, 'fees') || 0;
    const studentFeesPaid = getStudentField(student, 'fees_paid') || 0;
    const studentPoints = getStudentField(student, 'points') || 0;
    const studentStreak = getStudentField(student, 'streak') || 0;
    
    const studentAttendance = attendance.filter(a => a.student_id === currentStudentId);
    const present = studentAttendance.filter(a => a.status === 'present').length;
    const absent = studentAttendance.filter(a => a.status === 'absent').length;
    const total = present + absent;
    const average = total > 0 ? Math.round((present / total) * 100) : 0;
    const studentGrades = grades.filter(g => g.student_id === currentStudentId);
    const gradesAvg = studentGrades.length > 0 ? Math.round(studentGrades.reduce((sum, g) => sum + g.value, 0) / studentGrades.length) : 0;
    const level = getLevelLabel(getStudentLevel(currentStudentId));
    const rank = getStudentRank(currentStudentId);
    const medals = getMedals(student);
    const remainingFees = studentFees - studentFeesPaid;
    const group = groups.find(g => g.id === student.group_id);
    
    let html = `
        <html>
        <head><title>تقرير الطالب - ${studentName}</title>
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
                <div class="info-item"><label>👤 اسم الطالب</label><span>${studentName}</span></div>
                <div class="info-item"><label>🔑 الكود</label><span>${studentCode}</span></div>
                <div class="info-item"><label>📋 المجموعة</label><span>${group ? group.name : 'غير محدد'}</span></div>
                <div class="info-item"><label>🏆 المستوى</label><span class="badge ${getLevelClass(getStudentLevel(currentStudentId))}">${level}</span></div>
                <div class="info-item"><label>⭐ النقاط</label><span>${studentPoints} نقطة</span></div>
                <div class="info-item"><label>🥇 الترتيب</label><span>#${rank}</span></div>
                <div class="info-item"><label>🏅 الميداليات</label><span class="medals">${medals.join(' ')}</span></div>
                <div class="info-item"><label>📱 ولي الأمر</label><span>${studentPhone}</span></div>
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
            <p><strong>الإجمالي:</strong> ${studentFees} ج | <strong>المدفوع:</strong> ${studentFeesPaid} ج | <strong>المتبقي:</strong> ${remainingFees} ج</p>
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
