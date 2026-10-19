const API_URL = "https://script.google.com/macros/s/AKfycby3Nv784S410kwfLsKDfexjrd4Mm1LJYYzzweWqgukZK-VegEhnEngNpVLN_wHUPsC5/exec";

let authMode = "login";
let selectedRole = "Kepala Cabang";
let currentUser = null;

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => btn.className = 'role-btn border-2 border-gray-200 p-2.5 rounded-2xl text-center hover:border-daya-red transition');
  
  const cabangGroup = document.getElementById("cabangInputGroup");
  if (role === 'Kepala Cabang') {
    document.getElementById("roleKacab").className = 'role-btn border-2 border-daya-red bg-red-50 p-2.5 rounded-2xl text-center transition';
    if (cabangGroup && authMode === 'register') cabangGroup.classList.remove("hidden");
  } else if (role === 'PIC NOS') {
    document.getElementById("rolePic").className = 'role-btn border-2 border-daya-red bg-red-50 p-2.5 rounded-2xl text-center transition';
    if (cabangGroup) cabangGroup.classList.add("hidden");
  } else {
    document.getElementById("roleFlp").className = 'role-btn border-2 border-daya-red bg-red-50 p-2.5 rounded-2xl text-center transition';
    if (cabangGroup && authMode === 'register') cabangGroup.classList.remove("hidden");
  }
}

function setAuthMode(mode) {
  authMode = mode;
  const nameGroup = document.getElementById("nameInputGroup");
  const cabangGroup = document.getElementById("cabangInputGroup");
  const title = document.getElementById("authTitle");
  const btnSubmit = document.getElementById("btnSubmitAuth");
  const tabLogin = document.getElementById("tabModeLogin");
  const tabReg = document.getElementById("tabModeRegister");

  if (mode === "register") {
    if (nameGroup) nameGroup.classList.remove("hidden");
    if (cabangGroup && selectedRole !== "PIC NOS") cabangGroup.classList.remove("hidden");
    if (title) title.innerText = "daftar akun baru";
    if (btnSubmit) btnSubmit.innerText = "daftar akun";
    if (tabReg) tabReg.className = "flex-1 py-2 rounded-xl bg-white text-gray-900 shadow-sm transition font-bold";
    if (tabLogin) tabLogin.className = "flex-1 py-2 rounded-xl hover:text-gray-900 transition font-bold";
  } else {
    if (nameGroup) nameGroup.classList.add("hidden");
    if (cabangGroup) cabangGroup.classList.add("hidden");
    if (title) title.innerText = "masuk/daftar";
    if (btnSubmit) btnSubmit.innerText = "masuk";
    if (tabLogin) tabLogin.className = "flex-1 py-2 rounded-xl bg-white text-gray-900 shadow-sm transition font-bold";
    if (tabReg) tabReg.className = "flex-1 py-2 rounded-xl hover:text-gray-900 transition font-bold";
  }
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitAuth");
  const emailInput = document.getElementById("authEmail");
  const passInput = document.getElementById("authPassword");
  const namaInput = document.getElementById("regNama");
  const cabangInput = document.getElementById("authCabang");

  const email = emailInput ? emailInput.value.trim() : "";
  const password = passInput ? passInput.value.trim() : "";
  const nama = namaInput ? namaInput.value.trim() : "";
  const cabang = cabangInput ? cabangInput.value.trim() : "";

  if (!email) {
    alert("Silakan isi ID Karyawan / Email!");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerText = "Proses...";
  }

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
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    if (btn) {
      btn.disabled = false;
      btn.innerText = authMode === "register" ? "daftar akun" : "masuk";
    }

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
    if (btn) {
      btn.disabled = false;
      btn.innerText = authMode === "register" ? "daftar akun" : "masuk";
    }
    alert("Gagal terhubung ke server backend. Pastikan koneksi internet Anda lancar.");
  });
}

function renderDashboard(user) {
  const loginSec = document.getElementById("loginSection");
  const dashSec = document.getElementById("dashboardSection");
  if (loginSec) loginSec.classList.add("hidden");
  if (dashSec) dashSec.classList.remove("hidden");

  const nameBadge = document.getElementById("userNameBadge");
  const roleBadge = document.getElementById("userRoleBadge");
  const avatar = document.getElementById("userAvatar");
  const dashCabang = document.getElementById("dashCabangName");

  if (nameBadge) nameBadge.innerText = user.nama || user.email;
  if (roleBadge) roleBadge.innerText = user.role + " - " + (user.cabang || "Cabang Utama");
  if (avatar) avatar.innerText = (user.nama || user.email).charAt(0).toUpperCase();
  if (dashCabang) dashCabang.innerText = user.cabang || "Cabang Utama";

  renderMenuGrid(user.role);
}

function renderMenuGrid(role) {
  const container = document.getElementById("menuGrid");
  if (!container) return;

  let menus = [
    { id: 'referensi', title: 'referensi standar', sub: 'cek dokumen standar NOS', icon: '📖' },
    { id: 'pica', title: 'dashboard PICA', sub: 'lihat performa cabang anda', icon: '📊' }
  ];

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

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  if (tabId === 'home') {
    document.getElementById('tabHome').classList.remove('hidden');
  } else if (tabId === 'pica') {
    document.getElementById('tabPica').classList.remove('hidden');
  } else if (tabId === 'referensi') {
    document.getElementById('tabReferensi').classList.remove('hidden');
  }
}

function handleLogout() {
  localStorage.removeItem("nosa_user");
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
}

window.onload = function() {
  const saved = localStorage.getItem("nosa_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      renderDashboard(currentUser);
    } catch(e) {
      localStorage.removeItem("nosa_user");
    }
  }
};
