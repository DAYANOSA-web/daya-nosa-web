// URL BACKEND GOOGLE APPS SCRIPT
const API_URL = "https://script.google.com/macros/s/AKfycby3Nv784S410kwfLsKDfexjrd4Mm1LJYYzzweWqgukZK-VegEhnEngNpVLN_wHUPsC5/exec";

let authMode = "login";
let selectedRole = "Kepala Cabang";
let currentUser = null;

// SELECT ROLE HANDLER
function selectRole(role) {
  selectedRole = role;
  const btnKacab = document.getElementById('btnRoleKacab');
  const btnPic = document.getElementById('btnRolePic');
  const btnFlp = document.getElementById('btnRoleFlp');

  [btnKacab, btnPic, btnFlp].forEach(btn => {
    btn.className = "flex-1 py-1.5 px-1 text-gray-600 text-[10px] font-normal transition-all";
  });

  if (role === 'Kepala Cabang') {
    btnKacab.className = "flex-1 py-1.5 px-1 bg-nosa-bgRole rounded-xl text-gray-900 text-[10px] font-bold transition-all shadow-xs";
  } else if (role === 'PIC NOS') {
    btnPic.className = "flex-1 py-1.5 px-1 bg-nosa-bgRole rounded-xl text-gray-900 text-[10px] font-bold transition-all shadow-xs";
  } else {
    btnFlp.className = "flex-1 py-1.5 px-1 bg-nosa-bgRole rounded-xl text-gray-900 text-[10px] font-bold transition-all shadow-xs";
  }
}

// TOGGLE MODE LOGIN / REGISTER
function setAuthMode(mode) {
  authMode = mode;
  const nameGroup = document.getElementById("nameInputGroup");
  const cabangGroup = document.getElementById("cabangInputGroup");
  const btnSubmit = document.getElementById("btnSubmitAuth");
  const tabLogin = document.getElementById("tabModeLogin");
  const tabReg = document.getElementById("tabModeRegister");

  if (mode === "register") {
    nameGroup.classList.remove("hidden");
    if (selectedRole !== "PIC NOS") cabangGroup.classList.remove("hidden");
    btnSubmit.innerText = "daftar akun";
    tabReg.className = "flex-1 py-1.5 rounded-xl bg-white text-gray-900 shadow-xs transition font-bold";
    tabLogin.className = "flex-1 py-1.5 rounded-xl hover:text-gray-900 transition";
  } else {
    nameGroup.classList.add("hidden");
    cabangGroup.classList.add("hidden");
    btnSubmit.innerText = "masuk";
    tabLogin.className = "flex-1 py-1.5 rounded-xl bg-white text-gray-900 shadow-xs transition font-bold";
    tabReg.className = "flex-1 py-1.5 rounded-xl hover:text-gray-900 transition";
  }
}

// HANDLER LOGIN / DAFTAR AKUN
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
    cabang: selectedRole === "PIC NOS" ? "Head Office" : (cabang || "Soekarno Hatta")
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
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
      alert(res.message || "Gagal memproses login.");
    }
  })
  .catch(err => {
    console.error("Fetch Error:", err);
    btn.disabled = false;
    btn.innerText = authMode === "register" ? "daftar akun" : "masuk";
    alert("Gagal terhubung ke server backend.");
  });
}

// RENDER DASHBOARD
function renderDashboard(user) {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("mainContainer").classList.remove("hidden");

  document.getElementById("dashUserNama").innerText = user.nama || user.email;
  document.getElementById("profNamaCabang").innerText = "Cabang " + (user.cabang || "Soekarno Hatta");

  switchTab("home");
  loadProfilCabangData(user.cabang || "Soekarno Hatta");
  loadReferensiData();
}

// -------------------------------------------------------------
// LOGIKA PEMUATAN TAMPILAN REFERENSI STANDAR VISUAL (PRESISI)
// -------------------------------------------------------------
function loadReferensiData() {
  const container = document.getElementById("referensiGridBox");
  if (!container) return;

  fetch(`${API_URL}?action=getReferensi`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length <= 1) {
      container.innerHTML = '<p class="text-xs text-gray-400 italic text-center col-span-full py-8">Belum ada data referensi standar di spreadsheet.</p>';
      return;
    }

    const rows = data.slice(1);
    let html = '';

    rows.forEach(row => {
      // Kolom A: ID [0], Kolom B: Kategori [1], Kolom C: Judul [2], Kolom D: Deskripsi [3], Kolom E: Instruksi [4], Kolom F: GambarUrl [5], Kolom G: LinkDownload [6]
      const kat = row[1] || 'visual dealer';
      const judul = row[2] || 'Judul Referensi';
      const deskripsi = row[3] || 'Deskripsi standar';
      const instruksi = row[4] || 'Instruksi & ketentuan standar.';
      const imgUrl = row[5] || '';
      const downloadUrl = row[6] || '';

      html += `
        <div class="bg-nosa-cardBg p-4 rounded-2xl border border-gray-200/70 shadow-xs flex flex-col justify-between space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            
            <!-- Sisi Kiri: Foto Gambar Referensi -->
              <div class="w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-white/90 p-2 flex items-center justify-center border border-gray-300/50 shadow-inner">
               ${imgUrl ? `<img src="${imgUrl}" alt="${judul}" class="w-full h-full object-contain">` : '<span class="text-xs text-gray-400 italic">Tidak ada gambar</span>'}
              </div>

            <!-- Sisi Kanan: Detail Informasi -->
            <div class="space-y-2">
              <!-- Badge Kategori (Kuning) -->
              <span class="inline-block bg-nosa-yellow text-gray-900 text-[10px] font-extrabold px-3 py-0.5 rounded-md uppercase tracking-wider shadow-2xs">
                ${kat}
              </span>

              <!-- Judul Utama -->
              <h3 class="text-2xl font-black text-nosa-green tracking-tight leading-none pt-0.5">
                ${judul}
              </h3>

              <!-- Deskripsi Singkat -->
              <p class="text-xs text-gray-700 font-normal leading-snug">
                ${deskripsi}
              </p>

              <!-- Sub-bagian: Instruksi dan Ketentuan -->
              <div class="pt-2 space-y-0.5">
                <h5 class="text-xs font-black text-nosa-green">instruksi dan ketentuan</h5>
                <p class="text-[11px] text-gray-600 leading-normal">
                  ${instruksi}
                </p>
              </div>

              <!-- Link Download Google Drive -->
              ${downloadUrl ? `
                <div class="pt-2">
                  <h5 class="text-xs font-black text-nosa-green">link download</h5>
                  <a href="${downloadUrl}" target="_blank" class="text-[10px] text-blue-600 underline font-semibold break-all hover:text-blue-800 transition block pt-0.5">
                    ${downloadUrl}
                  </a>
                </div>
              ` : ''}

            </div>

          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  })
  .catch(err => {
    console.error("Error loading referensi:", err);
    if (container) {
      container.innerHTML = '<p class="text-xs text-red-500 text-center col-span-full py-8">Gagal memuat data referensi dari server.</p>';
    }
  });
}

// PENARIKAN DATA PROFIL CABANG
function loadProfilCabangData(cabangName) {
  fetch(`${API_URL}?action=getProfilCabang&cabang=${encodeURIComponent(cabangName)}`)
  .then(res => res.json())
  .then(res => {
    if (res.status === "success") {
      if (res.info && res.info.skorNos) {
        const parts = res.info.skorNos.split('/');
        const currentScore = parts[0] ? parts[0].trim() : "GOLD";
        const targetScore = parts[1] ? parts[1].trim() : "PLATINUM";

        document.getElementById("profBadgeSkor").innerHTML = `
          <span class="bg-amber-400 text-gray-900 text-[10px] font-extrabold px-3 py-0.5 rounded-md shadow-2xs">${currentScore}</span>
          <span class="text-gray-400 font-light text-xs">/</span>
          <span class="bg-gray-300 text-gray-600 text-[10px] font-bold px-3 py-0.5 rounded-md">${targetScore}</span>
        `;
      }

      if (res.info && res.info.jadwalGenba) {
        document.getElementById("profJadwalGenba").innerText = res.info.jadwalGenba;
      }

      const picaBox = document.getElementById("profPicaBox");
      if (res.picaBelumSelesai && res.picaBelumSelesai.length > 0) {
        let picaHtml = '';
        res.picaBelumSelesai.forEach(item => {
          const badgeClass = item.status === 'Open' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-800';
          const iconStatus = item.status === 'Open' ? '⚠️' : '🗓️';
          const colorBar = item.status === 'Open' ? 'bg-red-500' : 'bg-amber-500';

          picaHtml += `
            <div class="flex items-center justify-between bg-white/50 p-1.5 rounded-lg">
              <div class="flex items-center gap-2">
                <div class="w-1 h-3 ${colorBar} rounded-full"></div>
                <span class="font-normal text-gray-700">${item.item}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500 flex items-center gap-1">${iconStatus} ${item.dueDate}</span>
                <span class="${badgeClass} font-bold px-2 py-0.5 rounded-full text-[9px]">${item.status}</span>
              </div>
            </div>
          `;
        });
        picaBox.innerHTML = picaHtml;
      } else {
        picaBox.innerHTML = '<p class="text-emerald-600 font-bold">Semua PICA terselesaikan! 🎉</p>';
      }

      const temuanBox = document.getElementById("profTemuanBerulangBox");
      if (res.temuanBerulang && res.temuanBerulang.length > 0) {
        let temuanHtml = '';
        res.temuanBerulang.forEach(item => {
          temuanHtml += `
            <div class="flex justify-between items-center border-b border-gray-200/40 pb-1.5">
              <span class="text-gray-700">${item.item}</span>
              <span class="bg-red-100 text-red-600 font-bold px-2.5 py-0.5 rounded-full text-[9px]">${item.jumlah}</span>
            </div>
          `;
        });
        temuanBox.innerHTML = temuanHtml;
      } else {
        temuanBox.innerHTML = '<p class="text-gray-500">Tidak ada temuan berulang.</p>';
      }

      const flpBox = document.getElementById("profTopFlpBox");
      if (res.top3Flp && res.top3Flp.length > 0) {
        let flpHtml = '';
        const medals = ['🥇', '🥈', '🥉'];
        const avatarBg = ['bg-blue-400', 'bg-emerald-400', 'bg-orange-400'];

        res.top3Flp.forEach((item, idx) => {
          flpHtml += `
            <div class="flex items-center justify-between bg-white/70 p-2 rounded-xl border border-gray-200/60">
              <div class="flex items-center gap-2">
                <span class="text-base">${medals[idx] || '🎖️'}</span>
                <div class="w-7 h-7 rounded-full ${avatarBg[idx] || 'bg-gray-400'} flex items-center justify-center text-white text-xs font-bold">👤</div>
                <div>
                  <h5 class="font-extrabold text-gray-800 leading-none">${item.nama}</h5>
                  <p class="text-[8px] text-gray-400 mt-0.5">${item.role}</p>
                </div>
              </div>
              <span class="font-black text-red-600">${item.skor} XP</span>
            </div>
          `;
        });
        flpBox.innerHTML = flpHtml;
      } else {
        flpBox.innerHTML = '<p class="text-gray-500">Belum ada skor tercatat.</p>';
      }
    }
  });
}

// NAVIGASI TAB UTAMA
function switchTab(tabId) {
  const dashboardPage = document.getElementById('dashboardPage');
  const referensiPage = document.getElementById('referensiPage');
  const profilPage = document.getElementById('profilPage');

  const navHome = document.getElementById('navHome');
  const navProfil = document.getElementById('navProfil');

  const barHome = document.getElementById('barHome');
  const barProfil = document.getElementById('barProfil');

  // Hide All Pages
  dashboardPage.classList.add('hidden');
  referensiPage.classList.add('hidden');
  profilPage.classList.add('hidden');

  if (tabId === 'home') {
    dashboardPage.classList.remove('hidden');
    navHome.classList.remove('opacity-70');
    navHome.classList.add('font-bold');
    barHome.classList.remove('hidden');

    navProfil.classList.add('opacity-70');
    navProfil.classList.remove('font-bold');
    barProfil.classList.add('hidden');
  } else if (tabId === 'referensi') {
    referensiPage.classList.remove('hidden');
    loadReferensiData();
  } else if (tabId === 'profil') {
    profilPage.classList.remove('hidden');
    navProfil.classList.remove('opacity-70');
    navProfil.classList.add('font-bold');
    barProfil.classList.remove('hidden');

    navHome.classList.add('opacity-70');
    navHome.classList.remove('font-bold');
    barHome.classList.add('hidden');
  }
}

// AUTO INITIALIZE SESSION
window.onload = function() {
  const saved = localStorage.getItem("nosa_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      renderDashboard(currentUser);
    } catch (e) {
      localStorage.removeItem("nosa_user");
    }
  }
};
