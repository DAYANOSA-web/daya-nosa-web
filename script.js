const API_URL = "https://script.google.com/macros/s/AKfycby3Nv784S410kwfLsKDfexjrd4Mm1LJYYzzweWqgukZK-VegEhnEngNpVLN_wHUPsC5/exec";

let authMode = "login";
let selectedRole = "Kepala Cabang";
let currentUser = null;
let currentAuditSession = null;
let auditSelection = {};

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

// HANDLER LOGIN / REGISTER
function handleAuthSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById("btnSubmitAuth");
  const email = document.getElementById("authEmail").value.trim();
  const password = document.getElementById("authPassword").value.trim();
  const nama = document.getElementById("regNama").value.trim();
  const cabang = document.getElementById("authCabang").value.trim();
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
    btn.disabled = false;
    btn.innerText = authMode === "register" ? "daftar akun" : "masuk";
    alert("Gagal terhubung ke server.");
  });
}

function renderDashboard(user) {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("mainContainer").classList.remove("hidden");
  document.getElementById("dashUserNama").innerText = user.nama || user.email;
  document.getElementById("profNamaCabang").innerText = "Cabang " + (user.cabang || "Soekarno Hatta");
  
  // Pre-fill Form GENBA
  document.getElementById("genbaNamaAuditor").value = user.nama || "Refan";
  document.getElementById("genbaJabatanAuditor").value = user.role || "NOS Officer";
  
  switchTab("home");
  loadProfilCabangData(user.cabang || "Soekarno Hatta");
  loadDropdownCabang();
}

// LOAD DROPDOWN LIST CABANG DARI SPREADSHEET
function loadDropdownCabang() {
  const select = document.getElementById("genbaSelectCabang");
  fetch(`${API_URL}?action=getCabangList`)
  .then(res => res.json())
  .then(data => {
    if (Array.isArray(data) && data.length > 0) {
      let options = '<option value="">--Pilih Cabang--</option>';
      data.forEach(cab => {
        options += `<option value="${cab}">${cab}</option>`;
      });
      select.innerHTML = options;
      if (currentUser && currentUser.cabang) select.value = currentUser.cabang;
    }
  });
}

// HANDLER MEMULAI AUDIT GENBA
function startGenbaAudit(e) {
  e.preventDefault();
  const cabang = document.getElementById("genbaSelectCabang").value;
  const nama = document.getElementById("genbaNamaAuditor").value;
  const jabatan = document.getElementById("genbaJabatanAuditor").value;
  const noHp = document.getElementById("genbaNoHp").value;
  currentAuditSession = { cabang, nama, jabatan, noHp };
  auditSelection = {};
  
  document.getElementById("auditInfoCabang").innerText = cabang || "Soekarno Hatta";
  document.getElementById("auditInfoAuditor").innerText = `${nama} (${jabatan})`;
  
  switchTab("genbaAudit");
  loadCeklisNOSData();
}

// MEMUAT KARTU CEKLIS AUDIT GENBA DENGAN DYNAMIC ITEM & SUB ITEM
function loadCeklisNOSData() {
  const container = document.getElementById("genbaCeklisContainer");
  container.innerHTML = '<p class="text-xs text-gray-400 italic text-center py-6">Memuat item ceklis NOS...</p>';
  
  fetch(`${API_URL}?action=getCeklisNOS`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length <= 1) {
      container.innerHTML = '<p class="text-xs text-gray-400 italic text-center py-6">Belum ada item ceklis di spreadsheet CeklisNOS.</p>';
      return;
    }
    const rows = data.slice(1);
    let html = '';
    
    rows.forEach((row, idx) => {
      const tipe = row[1] || 'PREMISES H1';
      const mandatory = row[2] || 'S, G, P';
      
      const itemVal = (row[3] || '').toString().trim();
      const subItem1 = (row[4] || '').toString().trim();
      const subItem2 = (row[5] || '').toString().trim();
      const penjelasan = row[6] || 'Penjelasan item ceklis...';
      
      const labelParts = [itemVal, subItem1, subItem2].filter(text => text !== '');
      const headerLabel = labelParts.join(', ');
      
      let rawImg = row[7] || '';
      if (rawImg.includes('drive.google.com') && rawImg.includes('/d/')) {
        const match = rawImg.match(/\/d\/([^\/]+)/);
        if (match && match[1]) rawImg = `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
      const imgUrl = rawImg;
      const isNeedFoto = (row[8] || 'Ya').toString().toLowerCase() === 'ya';
      
      html += `
        <div class="bg-nosa-cardBg p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3">
          
          <!-- TIPE & MANDATORY HEADER -->
          <div class="flex justify-between items-center border-b border-gray-300/50 pb-1.5">
            <h3 class="text-sm font-black text-nosa-green tracking-wider uppercase">${tipe}</h3>
            <span class="text-xs font-black text-nosa-green tracking-wider">${mandatory}</span>
          </div>
          
          <!-- GRID PENJELASAN (KIRI) VS REFERENSI (KANAN) -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
            
            <!-- Kiri: Judul Kombinasi Item/Sub Item & Penjelasan -->
            <div class="bg-gray-200/60 p-3 rounded-xl space-y-2 flex flex-col h-full">
              <h5 class="text-xs font-extrabold text-gray-900 border-b border-gray-300/60 pb-1 flex-shrink-0">
                ${headerLabel || 'Item Ceklis'}
              </h5>
              
              <div class="max-h-40 overflow-y-auto pr-1 flex-1">
                <p class="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">${penjelasan}</p>
              </div>
            </div>

            <!-- Kanan: Referensi Standar & Gambar -->
            <div class="bg-gray-200/60 p-3 rounded-xl flex flex-col justify-between items-center text-center space-y-2">
              <span class="text-[10px] font-black text-nosa-green tracking-widest uppercase">REFERENSI</span>
              <div class="w-full h-28 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-gray-300/40">
                ${imgUrl ? `<img src="${imgUrl}" class="w-full h-full object-contain p-1">` : '<span class="text-[10px] text-gray-400 italic">No Reference Image</span>'}
              </div>
            </div>
          </div>
          
          <!-- 4 TOMBOL STATUS CEKLIS -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button type="button" onclick="selectAuditStatus(${idx}, 'Exist Good', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-emerald-200 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">
              Exist Good
            </button>
            <button type="button" onclick="selectAuditStatus(${idx}, 'Exist Not Good', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-amber-200 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">
              Exist Not Good
            </button>
            <button type="button" onclick="selectAuditStatus(${idx}, 'Not Exist', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-red-200 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">
              Not Exist
            </button>
            <button type="button" onclick="selectAuditStatus(${idx}, 'N/A', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">
              N/A
            </button>
          </div>
          
          <!-- INPUT UPLOAD FOTO EVIDENSE (KHUSUS PREMISES) -->
          ${isNeedFoto ? `
            <div class="bg-gray-200/60 p-2.5 rounded-xl flex items-center justify-between gap-2 pt-2">
              <div class="space-y-0.5">
                <p class="text-[11px] font-bold text-gray-800 flex items-center gap-1">📸 Foto Bukti Audit (Wajib)</p>
                <p class="text-[9px] text-gray-500">Ambil langsung via Kamera HP atau pilih file galeri</p>
              </div>
              <label class="bg-emerald-400 hover:bg-emerald-500 text-gray-900 font-bold text-[10px] px-3 py-1.5 rounded-xl cursor-pointer shadow-2xs transition flex items-center gap-1">
                <span>📷 Ambil Foto/File</span>
                <input type="file" accept="image/*" capture="environment" class="hidden" onchange="handleEvidenceUpload(event, ${idx})">
              </label>
            </div>
          ` : ''}
        </div>
      `;
    });
    container.innerHTML = html;
  })
  .catch(err => {
    console.error("Error loading CeklisNOS:", err);
    container.innerHTML = '<p class="text-xs text-red-500 text-center py-6">Gagal memuat item ceklis NOS.</p>';
  });
}

function selectAuditStatus(index, status, headerLabel) {
  auditSelection[index] = { status: status, headerLabel: headerLabel };

  const btns = document.querySelectorAll(`.audit-btn-${index}`);
  btns.forEach(btn => {
    btn.className = "py-2 bg-gray-300 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition";
    if (btn.innerText.trim() === status) {
      if (status === 'Exist Good') btn.className = "py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs";
      if (status === 'Exist Not Good') btn.className = "py-2 bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-xs";
      if (status === 'Not Exist') btn.className = "py-2 bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-xs";
      if (status === 'N/A') btn.className = "py-2 bg-gray-600 text-white text-xs font-extrabold rounded-xl shadow-xs";
    }
  });
}

function handleEvidenceUpload(event, index) {
  const file = event.target.files[0];
  if (file) {
    alert(`Foto evidence untuk item #${index + 1} berhasil dipilih: ${file.name}`);
  }
}

// SUBMIT HASIL AUDIT KE SPREADSHEET (MENCATAT PICA BARU)
function submitGenbaForm() {
  if (!currentAuditSession) {
    alert("Sesi audit tidak valid.");
    return;
  }

  const results = Object.values(auditSelection);
  if (results.length === 0) {
    alert("Silakan pilih status setidaknya pada satu item ceklis sebelum submit!");
    return;
  }

  const btnSubmit = document.getElementById("btnSubmitGenbaAudit");
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Menyimpan PICA...";
  }

  const payload = {
    action: "submitGenbaAudit",
    auditSession: currentAuditSession,
    auditResults: results
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  })
  .then(res => res.json())
  .then(res => {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerText = "💾 Submit Audit";
    }
    if (res.status === "success") {
      alert(`Audit Berhasil Disimpan! ${res.totalPicaCreated} temuan PICA baru telah ditambahkan.`);
      auditSelection = {};
      switchTab("pica");
    } else {
      alert(res.message || "Gagal menyimpan audit.");
    }
  })
  .catch(err => {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.innerText = "💾 Submit Audit";
    }
    console.error("Submit Error:", err);
    alert("Gagal terhubung ke server saat mengirim audit.");
  });
}

// MEMUAT CARDS PICA DI DASHBOARD PICA
function loadPicaDashboardData() {
  const container = document.getElementById("picaCardsContainer");
  if (!container) return;

  const userCabang = (currentUser && currentUser.cabang) ? currentUser.cabang : "Soekarno Hatta";
  container.innerHTML = '<p class="text-xs text-gray-400 italic text-center py-8">Memuat data PICA...</p>';

  fetch(`${API_URL}?action=getPicaList&cabang=${encodeURIComponent(userCabang)}`)
  .then(res => res.json())
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `
        <div class="bg-nosa-cardBg p-6 rounded-2xl text-center space-y-2 border border-gray-200">
          <p class="text-2xl">🎉</p>
          <h4 class="font-bold text-nosa-green text-sm">Tidak Ada PICA Aktif!</h4>
          <p class="text-xs text-gray-500">Semua standar di cabang ${userCabang} sudah terpenuhi dengan baik.</p>
        </div>
      `;
      return;
    }

    let html = '';
    data.forEach(item => {
      const isClosed = item.status === 'Closed' || item.status === 'Verified';
      const statusBadge = isClosed ? 'bg-emerald-200 text-emerald-800' : (item.status === 'Open' ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-800');

      html += `
        <div class="bg-nosa-cardBg p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">${item.idPica}</span>
            <span class="${statusBadge} font-extrabold text-[9px] px-2.5 py-0.5 rounded-full">${item.status}</span>
          </div>

          <h4 class="text-xs font-black text-gray-900">${item.item}</h4>
          <p class="text-[11px] text-gray-600">${item.catatan || 'Temuan ketidaksesuaian saat GENBA.'}</p>

          <div class="pt-2 flex justify-between items-center text-[10px] border-t border-gray-300/40 text-gray-500">
            <span>👤 Auditor: ${item.auditor}</span>
            <span>📅 Due: <strong class="text-gray-800">${item.dueDate}</strong></span>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  })
  .catch(err => {
    console.error("Error loading PICA:", err);
    container.innerHTML = '<p class="text-xs text-red-500 text-center py-8">Gagal memuat data PICA dari server.</p>';
  });
}

// REFERENSI STANDAR & PROFIL CABANG LOADER
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
      const kat = row[1] || 'visual dealer';
      const judul = row[2] || 'Judul Referensi';
      const deskripsi = row[3] || 'Deskripsi standar';
      const instruksi = row[4] || 'Instruksi & ketentuan standar.';
      
      let rawImg = row[5] || '';
      if (rawImg.includes('drive.google.com') && rawImg.includes('/d/')) {
        const match = rawImg.match(/\/d\/([^\/]+)/);
        if (match && match[1]) rawImg = `https://lh3.googleusercontent.com/d/${match[1]}`;
      }
      const imgUrl = rawImg;
      const downloadUrl = row[6] || '';
      html += `
        <div class="bg-nosa-cardBg p-4 rounded-2xl border border-gray-200/70 shadow-xs flex flex-col justify-between space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-start">
            <div class="w-full h-48 sm:h-56 rounded-xl overflow-hidden bg-white/90 p-2 flex items-center justify-center border border-gray-300/50 shadow-inner">
              ${imgUrl ? `<img src="${imgUrl}" alt="${judul}" class="w-full h-full object-contain">` : '<span class="text-xs text-gray-400 italic">Tidak ada gambar</span>'}
            </div>
            <div class="space-y-2">
              <span class="inline-block bg-nosa-yellow text-gray-900 text-[10px] font-extrabold px-3 py-0.5 rounded-md uppercase tracking-wider">${kat}</span>
              <h3 class="text-2xl font-black text-nosa-green tracking-tight leading-none pt-0.5">${judul}</h3>
              <p class="text-xs text-gray-700 leading-snug">${deskripsi}</p>
              <div class="pt-2 space-y-0.5">
                <h5 class="text-xs font-black text-nosa-green">instruksi dan ketentuan</h5>
                <p class="text-[11px] text-gray-600 leading-normal">${instruksi}</p>
              </div>
              ${downloadUrl ? `
                <div class="pt-2">
                  <h5 class="text-xs font-black text-nosa-green">link download</h5>
                  <a href="${downloadUrl}" target="_blank" class="text-[10px] text-blue-600 underline font-semibold break-all">${downloadUrl}</a>
                </div>
              ` : ''}
            </div>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  });
}

function loadProfilCabangData(cabangName) {
  fetch(`${API_URL}?action=getProfilCabang&cabang=${encodeURIComponent(cabangName)}`)
  .then(res => res.json())
  .then(res => {
    if (res.status === "success") {
      if (res.info && res.info.skorNos) {
        const parts = res.info.skorNos.split('/');
        document.getElementById("profBadgeSkor").innerHTML = `
          <span class="bg-amber-400 text-gray-900 text-[10px] font-extrabold px-3 py-0.5 rounded-md shadow-2xs">${parts[0] ? parts[0].trim() : "GOLD"}</span>
          <span class="text-gray-400 font-light text-xs">/</span>
          <span class="bg-gray-300 text-gray-600 text-[10px] font-bold px-3 py-0.5 rounded-md">${parts[1] ? parts[1].trim() : "PLATINUM"}</span>
        `;
      }
      if (res.info && res.info.jadwalGenba) document.getElementById("profJadwalGenba").innerText = res.info.jadwalGenba;
      const picaBox = document.getElementById("profPicaBox");
      if (res.picaBelumSelesai && res.picaBelumSelesai.length > 0) {
        let picaHtml = '';
        res.picaBelumSelesai.forEach(item => {
          const badgeClass = item.status === 'Open' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-800';
          picaHtml += `
            <div class="flex items-center justify-between bg-white/50 p-1.5 rounded-lg">
              <div class="flex items-center gap-2">
                <div class="w-1 h-3 ${item.status === 'Open' ? 'bg-red-500' : 'bg-amber-500'} rounded-full"></div>
                <span class="font-normal text-gray-700">${item.item}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500 font-bold text-[9px]">${item.dueDate}</span>
                <span class="${badgeClass} font-bold px-2 py-0.5 rounded-full text-[9px]">${item.status}</span>
              </div>
            </div>
          `;
        });
        picaBox.innerHTML = picaHtml;
      } else {
        picaBox.innerHTML = '<p class="text-emerald-600 font-bold">Semua PICA terselesaikan! 🎉</p>';
      }
    }
  });
}

// NAVIGASI SWITCH TAB
function switchTab(tabId) {
  const pages = ['dashboardPage', 'referensiPage', 'genbaFormPage', 'genbaAuditPage', 'picaDashboardPage', 'profilPage'];
  pages.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.add('hidden');
  });

  const navHome = document.getElementById('navHome');
  const navPica = document.getElementById('navPica');
  const navProfil = document.getElementById('navProfil');
  const barHome = document.getElementById('barHome');
  const barPica = document.getElementById('barPica');
  const barProfil = document.getElementById('barProfil');

  [navHome, navPica, navProfil].forEach(n => { if (n) n.classList.add('opacity-70'); });
  [barHome, barPica, barProfil].forEach(b => { if (b) b.classList.add('hidden'); });

  if (tabId === 'home') {
    document.getElementById('dashboardPage').classList.remove('hidden');
    navHome.classList.remove('opacity-70');
    barHome.classList.remove('hidden');
  } else if (tabId === 'referensi') {
    document.getElementById('referensiPage').classList.remove('hidden');
    loadReferensiData();
  } else if (tabId === 'genbaForm') {
    document.getElementById('genbaFormPage').classList.remove('hidden');
  } else if (tabId === 'genbaAudit') {
    document.getElementById('genbaAuditPage').classList.remove('hidden');
  } else if (tabId === 'pica') {
    document.getElementById('picaDashboardPage').classList.remove('hidden');
    navPica.classList.remove('opacity-70');
    barPica.classList.remove('hidden');
    loadPicaDashboardData();
  } else if (tabId === 'profil') {
    document.getElementById('profilPage').classList.remove('hidden');
    navProfil.classList.remove('opacity-70');
    barProfil.classList.remove('hidden');
  }
}

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
