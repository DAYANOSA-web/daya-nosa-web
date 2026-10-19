// URL BACKEND GOOGLE APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycby3Nv784S410kwfLsKDfexjrd4Mm1LJYYzzweWqgukZK-VegEhnEngNpVLN_wHUPsC5/exec";

let authMode = "login";
let selectedRole = "Kepala Cabang";
let currentUser = null;
let picaCache = [];
let referensiCache = [];
let quizData = [];
let currentQuizIdx = 0;
let userXP = 0;

// 1. SELECT ROLE HANDLER
function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => btn.className = 'role-btn border-2 border-gray-200 p-2.5 rounded-2xl text-center hover:border-daya-red transition');
  
  const cabangGroup = document.getElementById("cabangInputGroup");
  if (role === 'Kepala Cabang') {
    document.getElementById("roleKacab").className = 'role-btn border-2 border-daya-red bg-red-50 p-2.5 rounded-2xl text-center transition';
    if(cabangGroup) cabangGroup.classList.remove("hidden");
  } else if (role === 'PIC NOS') {
    document.getElementById("rolePic").className = 'role-btn border-2 border-daya-red bg-red-50 p-2.5 rounded-2xl text-center transition';
    if(cabangGroup) cabangGroup.classList.add("hidden"); // Auto Head Office
  } else {
    document.getElementById("roleFlp").className = 'role-btn border-2 border-daya-red bg-red-50 p-2.5 rounded-2xl text-center transition';
    if(cabangGroup) cabangGroup.classList.remove("hidden");
  }
}

// TOGGLE LOGIN / REGISTER MODE
function setAuthMode(mode) {
  authMode = mode;
  const nameGroup = document.getElementById("nameInputGroup");
  const cabangGroup = document.getElementById("cabangInputGroup");
  const title = document.getElementById("authTitle");
  const btnSubmit = document.getElementById("btnSubmitAuth");
  const tabLogin = document.getElementById("tabModeLogin");
  const tabReg = document.getElementById("tabModeRegister");

  if (mode === "register") {
    nameGroup.classList.remove("hidden");
    if (selectedRole !== "PIC NOS") cabangGroup.classList.remove("hidden");
    title.innerText = "daftar akun baru";
    btnSubmit.innerText = "daftar akun";
    tabReg.className = "flex-1 py-2 rounded-xl bg-white text-gray-900 shadow-sm transition font-bold";
    tabLogin.className = "flex-1 py-2 rounded-xl hover:text-gray-900 transition font-bold";
  } else {
    // Mode LOGIN: Sembunyikan Input Nama & Cabang
    nameGroup.classList.add("hidden");
    cabangGroup.classList.add("hidden");
    title.innerText = "masuk/daftar";
    btnSubmit.innerText = "masuk";
    tabLogin.className = "flex-1 py-2 rounded-xl bg-white text-gray-900 shadow-sm transition font-bold";
    tabReg.className = "flex-1 py-2 rounded-xl hover:text-gray-900 transition font-bold";
  }
}

// HANDLER AUTH SUBMIT
function handleAuthSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitAuth");
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const nama = document.getElementById("regNama").value.trim();
  const cabang = document.getElementById("authCabang").value.trim();

  if (!email) {
    alert("Silakan isi ID Karyawan / Email!");
    return;
  }

  btn.disabled = true;
  btn.innerText = "Proses...";

  const payload = {
    action: authMode === "register" ? "registerUser" : "loginUser",
    email: email,
    password: password,
    nama: nama,
    role: selectedRole,
    cabang: selectedRole === "PIC NOS" ? "Head Office" : cabang
  };

  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    btn.disabled = false;
    btn.innerText = authMode === "register" ? "daftar akun" : "masuk";

    if (res.status === "success") {
      // Murni gunakan data profil resmi dari database Google Sheets
      currentUser = res.userData;
      localStorage.setItem("nosa_user", JSON.stringify(currentUser));
      renderDashboard(currentUser);
    } else {
      alert(res.message || "Gagal memproses pendaftaran/login.");
    }
  })
  .catch(err => {
    console.error("Fetch Error:", err);
    btn.disabled = false;
    btn.innerText = authMode === "register" ? "daftar akun" : "masuk";
    alert("Gagal terhubung ke server backend. Pastikan koneksi internet stabil.");
  });
}

  // Menggunakan mode text & fallback JSON parsing agar aman dari pembatasan CORS GAS
  fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8"
    },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    btn.disabled = false;
    btn.innerText = authMode === "register" ? "daftar akun" : "masuk";

    if (res.status === "success") {
      currentUser = res.userData;
      localStorage.setItem("nosa_user", JSON.stringify(currentUser));
      renderDashboard(currentUser);
    } else {
      alert(res.message || "Gagal memproses pendaftaran/login.");
    }
  })
  .catch(err => {
    console.error("Fetch Error:", err);
    btn.disabled = false;
    btn.innerText = authMode === "register" ? "daftar akun" : "masuk";

    // Fallback Offline/Direct Session jika GAS terlambat merespons
    const fallbackUser = {
      email: payload.email,
      nama: payload.nama,
      role: payload.role,
      cabang: payload.cabang
    };
    
    // Konfirmasi lokal jika ada isu jaringan lambat
    currentUser = fallbackUser;
    localStorage.setItem("nosa_user", JSON.stringify(currentUser));
    renderDashboard(currentUser);
  });
}

// 4. RENDER DASHBOARD & MENU GRID BY ROLE
function renderDashboard(user) {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("dashboardSection").classList.remove("hidden");

  document.getElementById("userNameBadge").innerText = user.nama || user.email;
  document.getElementById("userRoleBadge").innerText = `${user.role} - ${user.cabang}`;
  document.getElementById("userAvatar").innerText = (user.nama || user.email).charAt(0).toUpperCase();
  document.getElementById("dashCabangName").innerText = user.cabang;

  renderMenuGrid(user.role);
  loadPICAData();
  loadReferensiData();
  loadGenbaMaster();
}

function renderMenuGrid(role) {
  const container = document.getElementById("menuGrid");
  let menus = [];

  if (role === "Kepala Cabang") {
    menus = [
      { id: 'referensi', title: 'referensi standar', sub: 'cek dokumen dari standar NOS', icon: '📖' },
      { id: 'pica', title: 'dashboard PICA', sub: 'lihat performa cabang anda', icon: '📊' },
      { id: 'genba', title: 'GENBA', sub: 'ayo lakukan GENBA untuk menjaga standar', icon: '📍' },
      { id: 'nosizu', title: 'NOSIZU', sub: 'mainkan games dan tambah knowledgemu', icon: '🎮' },
      { id: 'reminder', title: 'reminder', sub: 'kustomisasi pengingat yang anda butuhkan', icon: '🔔' },
      { id: 'profil', title: 'profil cabang', sub: 'data dan informasi cabang', icon: '🏢' }
    ];
  } else if (role === "PIC NOS") {
    menus = [
      { id: 'referensi', title: 'referensi standar', sub: 'isi referensi standar untuk cabang yuk', icon: '📖' },
      { id: 'pica', title: 'dashboard PICA', sub: 'lihat performa cabang nasional', icon: '📊' },
      { id: 'genba', title: 'GENBA', sub: 'ayo lakukan GENBA untuk menjaga standar', icon: '📍' },
      { id: 'nosizu', title: 'NOSIZU', sub: 'ayo tambahkan soal kuiznya', icon: '🎮' },
      { id: 'onboarding', title: 'onboarding FLP', sub: 'tambahin materi untuk FLP yuk', icon: '📋' },
      { id: 'profil', title: 'profil cabang', sub: 'data dan informasi cabang', icon: '🏢' }
    ];
  } else {
    // FLP
    menus = [
      { id: 'referensi', title: 'referensi standar', sub: 'cek dokumen standar NOS', icon: '📖' },
      { id: 'pica', title: 'PICA Saya', sub: 'upload bukti perbaikan PICA', icon: '📸' },
      { id: 'nosizu', title: 'NOSIZU Arena', sub: 'mainkan games & kuis harian', icon: '🎮' }
    ];
  }

  let html = '';
  menus.forEach(m => {
    html += `
      <div onclick="switchTab('${m.id}')" class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3">
        <div class="text-2xl">${m.icon}</div>
        <div>
          <h4 class="font-extrabold text-xs text-gray-900 capitalize">${m.title}</h4>
          <p class="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">${m.sub}</p>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

// 5. SWITCH TAB LOGIC
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  
  if (tabId === 'home' || tabId === 'profil' || tabId === 'reminder') {
    document.getElementById('tabHome').classList.remove('hidden');
  } else if (tabId === 'pica') {
    document.getElementById('tabPica').classList.remove('hidden');
  } else if (tabId === 'genba') {
    document.getElementById('tabGenba').classList.remove('hidden');
  } else if (tabId === 'referensi') {
    document.getElementById('tabReferensi').classList.remove('hidden');
  } else if (tabId === 'nosizu') {
    document.getElementById('tabNosizu').classList.remove('hidden');
    loadQuizData();
  }
}

// 6. LOAD DATA PICA & METRICS
function loadPICAData() {
  const container = document.getElementById("picaContainer");
  fetch(`${API_URL}?action=getPICA`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length <= 1) {
      container.innerHTML = '<p class="text-xs text-gray-400">Belum ada temuan PICA.</p>';
      updatePicaMetrics(0, 0, 0, 0);
      return;
    }

    picaCache = data.slice(1);
    let openCount = 0, waitingCount = 0, closedCount = 0;
    let html = '';

    picaCache.forEach(row => {
      const [id, cabang, temuan, area, pic, due, status, foto, catatan] = row;
      if (status === 'Open') openCount++;
      if (status === 'Waiting Verification') waitingCount++;
      if (status === 'Closed' || status === 'Verified') closedCount++;

      let badgeBg = 'bg-red-100 text-red-700';
      if (status === 'Waiting Verification') badgeBg = 'bg-amber-100 text-amber-700';
      if (status === 'Closed' || status === 'Verified') badgeBg = 'bg-emerald-100 text-emerald-700';

      html += `
        <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-bold text-gray-400">${id} • ${cabang}</span>
            <span class="text-[10px] font-black px-2.5 py-0.5 rounded-full ${badgeBg}">${status}</span>
          </div>
          <h4 class="text-xs font-bold text-gray-800">${temuan}</h4>
          <p class="text-[10px] text-gray-500">PIC: <strong>${pic || '-'}</strong> | Due: <strong class="text-red-600">${due || '-'}</strong></p>
        </div>
      `;
    });

    container.innerHTML = html;
    updatePicaMetrics(openCount, waitingCount, closedCount, picaCache.length);
  });
}

function updatePicaMetrics(open, waiting, closed, total) {
  document.getElementById("kpiOpen").innerText = open;
  document.getElementById("kpiWaiting").innerText = waiting;
  document.getElementById("kpiClosed").innerText = closed;
  document.getElementById("kpiTotal").innerText = total;

  const pct = total > 0 ? Math.round((closed / total) * 100) : 100;
  document.getElementById("picaPercentageText").innerText = `${pct}%`;
}

// 7. LOAD REFERENSI STANDAR
function loadReferensiData() {
  fetch(`${API_URL}?action=getReferensi`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length <= 1) return;
    referensiCache = data.slice(1);
    renderReferensiCards(referensiCache);
  });
}

function renderReferensiCards(data) {
  const container = document.getElementById("referensiContainer");
  let html = '';
  data.forEach(row => {
    const [id, judul, kat, desk, inst, imgUrl, driveUrl] = row;
    html += `
      <div class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-2">
        ${imgUrl ? `<img src="${imgUrl}" class="w-full h-36 object-cover rounded-xl mb-2">` : ''}
        <span class="text-[9px] font-bold bg-red-50 text-daya-red px-2 py-0.5 rounded-md uppercase">${kat || 'Standar'}</span>
        <h4 class="text-xs font-bold text-gray-800">${judul}</h4>
        <p class="text-[11px] text-gray-500">${desk || ''}</p>
        ${driveUrl ? `<a href="${driveUrl}" target="_blank" class="block text-center text-xs font-bold bg-daya-red text-white py-2 rounded-xl mt-2">Download File Master</a>` : ''}
      </div>
    `;
  });
  container.innerHTML = html;
}

// 8. LOGOUT
function handleLogout() {
  localStorage.removeItem("nosa_user");
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
}

// AUTO INITIALIZE
window.onload = function() {
  const saved = localStorage.getItem("nosa_user");
  if (saved) {
    currentUser = JSON.parse(saved);
    renderDashboard(currentUser);
  }
};
