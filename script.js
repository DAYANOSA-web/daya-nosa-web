const API_URL = "https://script.google.com/macros/s/AKfycby3Nv784S410kwfLsKDfexjrd4Mm1LJYYzzweWqgukZK-VegEhnEngNpVLN_wHUPsC5/exec";

let authMode = "login";
let selectedRole = "Kepala Cabang";
let currentUser = null;

// ENGINE DATA NOSIZU
let nosUserStats = { xp: 0, streak: 1, nyawa: 5, unit: 1 };
let currentQuestionList = [];
let quizIndex = 0;
let userSelectedAnswer = null;

function formatDateNice(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = String(d.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${day} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch (e) {
    return dateStr;
  }
}

// LOGIKA AUTHENTIKASI & ROLE
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
    email: email, password: password, nama: nama, role: selectedRole,
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

function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar dari akun ini?")) {
    localStorage.removeItem("nosa_user");
    currentUser = null;
    document.getElementById("mainContainer").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("authEmail").value = "";
    document.getElementById("authPassword").value = "";
    setAuthMode("login");
  }
}

function renderDashboard(user) {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("mainContainer").classList.remove("hidden");
  document.getElementById("dashUserNama").innerText = user.nama || user.email;
  document.getElementById("profNamaCabang").innerText = "Cabang " + (user.cabang || "Soekarno Hatta");
  
  document.getElementById("genbaNamaAuditor").value = user.nama || "Refan";
  document.getElementById("genbaJabatanAuditor").value = user.role || "NOS Officer";
  
  switchTab("home");
  loadProfilCabangData(user.cabang || "Soekarno Hatta");
  loadDropdownCabang();
}

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

// FUNGSI REFERENSI STANDAR
function loadReferensiData() {
  const container = document.getElementById("referensiGridBox");
  if (!container) return;
  
  container.innerHTML = '<p class="text-xs text-gray-400 italic text-center col-span-full py-8">Memuat data referensi standar...</p>';

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
        <div class="bg-nosa-cardBg p-4 sm:p-5 rounded-3xl border border-gray-200/70 shadow-xs flex flex-col justify-between space-y-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div class="w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-white/90 p-2 flex items-center justify-center border border-gray-300/50 shadow-inner">
              ${imgUrl ? `<img src="${imgUrl}" alt="${judul}" class="w-full h-full object-contain">` : '<span class="text-xs text-gray-400 italic">Tidak ada gambar</span>'}
            </div>
            <div class="space-y-2">
              <span class="inline-block bg-nosa-yellow text-gray-900 text-[10px] font-extrabold px-3 py-0.5 rounded-md uppercase tracking-wider">${kat}</span>
              <h3 class="text-xl sm:text-2xl font-black text-nosa-green tracking-tight leading-none pt-0.5">${judul}</h3>
              <p class="text-xs text-gray-700 leading-snug">${deskripsi}</p>
              <div class="pt-2 space-y-0.5">
                <h5 class="text-xs font-black text-nosa-green">Instruksi & Ketentuan</h5>
                <p class="text-[11px] text-gray-600 leading-normal">${instruksi}</p>
              </div>
              ${downloadUrl ? `
                <div class="pt-2">
                  <h5 class="text-xs font-black text-nosa-green">Link Download</h5>
                  <a href="${downloadUrl}" target="_blank" class="text-[10px] text-blue-600 underline font-semibold break-all">${downloadUrl}</a>
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
    console.error("Error loading Referensi:", err);
    container.innerHTML = '<p class="text-xs text-red-500 text-center col-span-full py-8">Gagal memuat data referensi standar.</p>';
  });
}

// LOGIKA AUDIT GENBA
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
          <div class="flex justify-between items-center border-b border-gray-300/50 pb-1.5">
            <h3 class="text-sm font-black text-nosa-green tracking-wider uppercase">${tipe}</h3>
            <span class="text-xs font-black text-nosa-green tracking-wider">${mandatory}</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-stretch">
            <div class="bg-gray-200/60 p-3 rounded-xl space-y-2 flex flex-col h-full">
              <h5 class="text-xs font-extrabold text-gray-900 border-b border-gray-300/60 pb-1 flex-shrink-0">${headerLabel || 'Item Ceklis'}</h5>
              <div class="max-h-40 overflow-y-auto pr-1 flex-1">
                <p class="text-[11px] text-gray-700 leading-relaxed whitespace-pre-line">${penjelasan}</p>
              </div>
            </div>
            <div class="bg-gray-200/60 p-3 rounded-xl flex flex-col justify-between items-center text-center space-y-2">
              <span class="text-[10px] font-black text-nosa-green tracking-widest uppercase">REFERENSI</span>
              <div class="w-full h-28 rounded-lg bg-white overflow-hidden flex items-center justify-center border border-gray-300/40">
                ${imgUrl ? `<img src="${imgUrl}" class="w-full h-full object-contain p-1">` : '<span class="text-[10px] text-gray-400 italic">No Reference Image</span>'}
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <button type="button" onclick="selectAuditStatus(${idx}, 'Exist Good', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-emerald-200 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">Exist Good</button>
            <button type="button" onclick="selectAuditStatus(${idx}, 'Exist Not Good', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-amber-200 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">Exist Not Good</button>
            <button type="button" onclick="selectAuditStatus(${idx}, 'Not Exist', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-red-200 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">Not Exist</button>
            <button type="button" onclick="selectAuditStatus(${idx}, 'N/A', '${headerLabel.replace(/'/g, "\\'")}')" class="audit-btn-${idx} py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 transition">N/A</button>
          </div>
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
  if (file) alert(`Foto evidence untuk item #${index + 1} berhasil dipilih: ${file.name}`);
}

function submitGenbaForm() {
  if (!currentAuditSession) { alert("Sesi audit tidak valid."); return; }
  const results = Object.values(auditSelection);
  if (results.length === 0) { alert("Silakan pilih status setidaknya pada satu item ceklis sebelum submit!"); return; }

  const btnSubmit = document.getElementById("btnSubmitGenbaAudit");
  if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = "Menyimpan PICA..."; }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "submitGenbaAudit", auditSession: currentAuditSession, auditResults: results })
  })
  .then(res => res.json())
  .then(res => {
    if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerText = "💾 Submit Audit"; }
    if (res.status === "success") {
      alert(`Audit Berhasil Disimpan! ${res.totalPicaCreated} temuan PICA baru telah ditambahkan.`);
      auditSelection = {};
      switchTab("pica");
    } else { alert(res.message || "Gagal menyimpan audit."); }
  });
}

// LOGIKA DASHBOARD PICA & MODAL
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
      const isOnCheck = item.status === 'On Check';
      let statusBadge = 'bg-red-200 text-red-800';
      if (isOnCheck) statusBadge = 'bg-amber-200 text-amber-800';
      if (isClosed) statusBadge = 'bg-emerald-200 text-emerald-800';

      html += `
        <div onclick="openPicaModal('${item.idPica}', '${item.item.replace(/'/g, "\\'")}', '${item.status}', '${(item.catatanPerbaikan || '').replace(/'/g, "\\'")}')" class="bg-nosa-cardBg p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2 cursor-pointer hover:border-nosa-green transition">
          <div class="flex justify-between items-start">
            <span class="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">${item.idPica}</span>
            <span class="${statusBadge} font-extrabold text-[9px] px-2.5 py-0.5 rounded-full">${item.status}</span>
          </div>
          <h4 class="text-xs font-black text-gray-900">${item.item}</h4>
          <p class="text-[11px] text-gray-600">${item.catatan || 'Temuan ketidaksesuaian saat GENBA.'}</p>
          <div class="pt-2 flex justify-between items-center text-[10px] border-t border-gray-300/40 text-gray-500">
            <span>👤 Auditor: ${item.auditor}</span>
            <span>📅 Due: <strong class="text-gray-800">${formatDateNice(item.dueDate)}</strong></span>
          </div>
        </div>
      `;
    });
    container.innerHTML = html;
  });
}

function openPicaModal(idPica, itemTitle, status, catatanPerbaikan) {
  activePicaId = idPica;
  document.getElementById("modalPicaTitle").innerText = `Detail PICA (${idPica})`;
  document.getElementById("modalPicaItem").innerText = itemTitle;
  const modalCabangForm = document.getElementById("modalCabangForm");
  const modalNosForm = document.getElementById("modalNosForm");

  if (status === "Open") {
    modalCabangForm.classList.remove("hidden");
    modalNosForm.classList.add("hidden");
  } else if (status === "On Check") {
    modalCabangForm.classList.add("hidden");
    modalNosForm.classList.remove("hidden");
    document.getElementById("modalCatatanPerbaikanView").innerText = catatanPerbaikan || "Cabang telah mengunggah bukti perbaikan.";
  } else {
    alert("PICA ini sudah Berstatus Closed (Selesai).");
    return;
  }
  document.getElementById("picaActionModal").classList.remove("hidden");
}

function closePicaModal() {
  document.getElementById("picaActionModal").classList.add("hidden");
  activePicaId = null;
}

function submitPicaPerbaikan(newStatus) {
  if (!activePicaId) return;
  const catatan = document.getElementById("modalCatatanPerbaikan").value.trim();
  const btn = document.getElementById("btnSubmitPerbaikan");
  btn.disabled = true; btn.innerText = "Mengirim...";

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "updatePicaStatus", idPica: activePicaId, newStatus: newStatus, catatanPerbaikan: catatan })
  })
  .then(res => res.json())
  .then(res => {
    btn.disabled = false; btn.innerText = "🚀 Kirim ke NOS Officer (Ubah Status ke On Check)";
    if (res.status === "success") {
      alert("Perbaikan berhasil dikirim! Status PICA sekarang: On Check");
      closePicaModal();
      loadPicaDashboardData();
    }
  });
}

function submitPicaVerifikasi(newStatus) {
  if (!activePicaId) return;
  const btn = document.getElementById("btnSubmitVerifikasi");
  btn.disabled = true; btn.innerText = "Memproses...";

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "updatePicaStatus", idPica: activePicaId, newStatus: newStatus })
  })
  .then(res => res.json())
  .then(res => {
    btn.disabled = false; btn.innerText = "✅ Verifikasi & Approve (Ubah Status ke Closed)";
    if (res.status === "success") {
      alert("PICA berhasil diverifikasi! Status PICA sekarang: Closed");
      closePicaModal();
      loadPicaDashboardData();
    }
  });
}

// LOGIKA NOSIZU GAME & LEADERBOARD
function loadNOSIZUDashboard() {
  const userEmail = (currentUser && currentUser.email) ? currentUser.email : "demo@daya.com";
  fetch(`${API_URL}?action=getUserNOSIZU&email=${encodeURIComponent(userEmail)}`)
  .then(res => res.json())
  .then(data => {
    nosUserStats = data;
    document.getElementById("nosStreakVal").innerText = data.streak || 1;
    document.getElementById("nosXpVal").innerText = data.xp || 0;
    document.getElementById("nosLivesVal").innerText = data.nyawa || 5;
    renderNOSIZUPathMap();
  });
}

function renderNOSIZUPathMap() {
  const mapBox = document.getElementById("nosizuPathMap");
  let html = '';
  const levels = [
    { id: 1, title: 'Level 1: Dasar NOS' },
    { id: 2, title: 'Level 2: Standar Display' },
    { id: 3, title: 'Level 3: Proses Servis' },
    { id: 4, title: 'Level 4: Handling Konsumen' },
  ];

  levels.forEach((lvl, idx) => {
    const isCompleted = lvl.id < nosUserStats.unit;
    const isCurrent = lvl.id === nosUserStats.unit;
    const alignClass = idx % 2 === 0 ? 'self-start ml-8' : 'self-end mr-8';

    let btnBg = 'bg-gray-400 border-gray-500 cursor-not-allowed';
    let icon = '🔒';

    if (isCompleted) {
      btnBg = 'bg-emerald-500 border-emerald-600 cursor-pointer shadow-md';
      icon = '✓';
    } else if (isCurrent) {
      btnBg = 'bg-yellow-400 border-yellow-500 animate-bounce cursor-pointer shadow-lg text-black';
      icon = '▶';
    }

    html += `
      <div class="${alignClass} flex flex-col items-center space-y-1">
        <button onclick="startQuizSession(${lvl.id})" ${!isCompleted && !isCurrent ? 'disabled' : ''} class="w-16 h-16 rounded-full border-b-4 flex items-center justify-center text-xl font-black ${btnBg} transition">
          ${icon}
        </button>
        <span class="text-[10px] font-extrabold text-white bg-black/30 px-2 py-0.5 rounded-full">${lvl.title}</span>
      </div>
    `;
  });
  mapBox.innerHTML = html;
}

function startQuizSession(unitId) {
  if (nosUserStats.nyawa <= 0) { alert("Nyawa Anda habis!"); return; }
  fetch(`${API_URL}?action=getSoalNOSIZU`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length <= 1) { alert("Belum ada soal kuis yang diinput di spreadsheet SoalNOSIZU."); return; }
    const rows = data.slice(1);
    currentQuestionList = rows.map(r => ({
      id: r[0], unit: r[1], tipe: r[2], pertanyaan: r[3],
      opsiA: r[4], opsiB: r[5], opsiC: r[6], opsiD: r[7],
      gambarA: r[8], gambarB: r[9], kunci: String(r[10]).trim(), pembahasan: r[11]
    }));
    quizIndex = 0;
    document.getElementById("nosizuPage").classList.add("hidden");
    document.getElementById("nosizuQuizContainer").classList.remove("hidden");
    renderCurrentQuestion();
  });
}

function renderCurrentQuestion() {
  if (quizIndex >= currentQuestionList.length) { finishQuizSession(); return; }
  userSelectedAnswer = null;
  const q = currentQuestionList[quizIndex];
  
  const pct = ((quizIndex) / currentQuestionList.length) * 100;
  document.getElementById("quizProgressBar").style.width = `${pct}%`;
  document.getElementById("quizLivesCount").innerText = nosUserStats.nyawa;

  document.getElementById("quizQuestionText").innerText = q.pertanyaan;
  document.getElementById("quizFeedbackPanel").classList.add("hidden");
  document.getElementById("btnCheckAnswer").disabled = false;

  const box = document.getElementById("quizAnswersBox");

  if (q.tipe === "Pilihan Ganda") {
    document.getElementById("quizTypeBadge").innerText = "PILIH JAWABAN YANG TEPAT";
    box.innerHTML = `
      ${renderOptionBtn('A', q.opsiA)}
      ${renderOptionBtn('B', q.opsiB)}
      ${renderOptionBtn('C', q.opsiC)}
      ${renderOptionBtn('D', q.opsiD)}
    `;
  } else if (q.tipe === "Perbandingan Gambar") {
    document.getElementById("quizTypeBadge").innerText = "SPOT THE DIFFERENCE";
    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3 pt-1">
        <div onclick="selectQuizAnswer('A')" id="opt-A" class="quiz-opt border-2 border-gray-200 p-2 rounded-2xl flex flex-col items-center cursor-pointer">
          <img src="${formatDriveImg(q.gambarA)}" class="w-full h-32 object-contain rounded-xl bg-gray-50">
          <span class="text-xs font-black mt-1">Gambar A</span>
        </div>
        <div onclick="selectQuizAnswer('B')" id="opt-B" class="quiz-opt border-2 border-gray-200 p-2 rounded-2xl flex flex-col items-center cursor-pointer">
          <img src="${formatDriveImg(q.gambarB)}" class="w-full h-32 object-contain rounded-xl bg-gray-50">
          <span class="text-xs font-black mt-1">Gambar B</span>
        </div>
      </div>
    `;
  } else if (q.tipe === "Pernyataan") {
    document.getElementById("quizTypeBadge").innerText = "PERNYATAAN BENAR ATAU SALAH";
    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onclick="selectQuizAnswer('Benar')" id="opt-Benar" class="quiz-opt py-4 bg-emerald-500 text-white font-extrabold rounded-2xl text-sm">✓ Benar</button>
        <button type="button" onclick="selectQuizAnswer('Salah')" id="opt-Salah" class="quiz-opt py-4 bg-red-500 text-white font-extrabold rounded-2xl text-sm">✕ Salah</button>
      </div>
    `;
  }
}

function renderOptionBtn(key, val) {
  if (!val) return '';
  return `
    <div onclick="selectQuizAnswer('${key}')" id="opt-${key}" class="quiz-opt border-2 border-gray-200 p-3 rounded-2xl flex items-center gap-3 cursor-pointer">
      <span class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs">${key}</span>
      <span class="text-xs text-gray-800 font-semibold leading-snug">${val}</span>
    </div>
  `;
}

function formatDriveImg(url) {
  if (!url) return '';
  if (url.includes('drive.google.com') && url.includes('/d/')) {
    const match = url.match(/\/d\/([^\/]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

function selectQuizAnswer(val) {
  userSelectedAnswer = val;
  document.querySelectorAll('.quiz-opt').forEach(el => {
    el.classList.remove('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-400');
  });
  const sel = document.getElementById(`opt-${val}`);
  if (sel) sel.classList.add('border-red-500', 'bg-red-50', 'ring-2', 'ring-red-400');
}

function checkAnswer() {
  if (!userSelectedAnswer) { alert("Pilih salah satu jawaban terlebih dahulu!"); return; }
  const q = currentQuestionList[quizIndex];
  const isCorrect = String(userSelectedAnswer).toLowerCase() === String(q.kunci).toLowerCase();

  const feedbackPanel = document.getElementById("quizFeedbackPanel");
  feedbackPanel.classList.remove("hidden");
  document.getElementById("btnCheckAnswer").disabled = true;

  if (isCorrect) {
    nosUserStats.xp += 20;
    feedbackPanel.className = "p-4 rounded-2xl border bg-emerald-50 border-emerald-300 space-y-2";
    document.getElementById("feedbackIcon").innerText = "✅";
    document.getElementById("feedbackTitle").innerText = "Hebat! Jawaban Tepat";
  } else {
    nosUserStats.nyawa = Math.max(0, nosUserStats.nyawa - 1);
    feedbackPanel.className = "p-4 rounded-2xl border bg-red-50 border-red-300 space-y-2";
    document.getElementById("feedbackIcon").innerText = "❌";
    document.getElementById("feedbackTitle").innerText = "Kurang Tepat";
  }

  document.getElementById("feedbackText").innerText = q.pembahasan || "Langkah perbaikan dan pemahaman standar NOS.";
}

function nextQuestion() {
  quizIndex++;
  renderCurrentQuestion();
}

function exitQuiz() {
  document.getElementById("nosizuQuizContainer").classList.add("hidden");
  document.getElementById("nosizuPage").classList.remove("hidden");
  loadNOSIZUDashboard();
}

function finishQuizSession() {
  alert(`Selamat! Anda menyelesaikan sesi kuis. Total XP Anda sekarang: ${nosUserStats.xp}`);
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "updateUserNOSIZU",
      email: currentUser ? currentUser.email : "demo@daya.com",
      addXp: 20,
      nyawa: nosUserStats.nyawa
    })
  });
  exitQuiz();
}

function loadLeaderboardData() {
  const container = document.getElementById("leaderboardListBox");
  container.innerHTML = '<p class="text-xs text-gray-400 italic text-center py-8">Memuat klasemen...</p>';

  fetch(`${API_URL}?action=getLeaderboard`)
  .then(res => res.json())
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = '<p class="text-xs text-gray-400 italic text-center py-8">Belum ada peringkat terdaftar.</p>';
      return;
    }
    let html = '';
    data.forEach((item, idx) => {
      let badge = `<span class="font-extrabold text-gray-400 text-xs w-5">${idx + 1}</span>`;
      if (idx === 0) badge = `<span class="text-base">🥇</span>`;
      if (idx === 1) badge = `<span class="text-base">🥈</span>`;
      if (idx === 2) badge = `<span class="text-base">🥉</span>`;

      html += `
        <div class="bg-nosa-cardBg p-3 rounded-2xl border border-gray-200/80 shadow-xs flex items-center justify-between">
          <div class="flex items-center gap-3">
            ${badge}
            <div>
              <h4 class="text-xs font-black text-gray-900">${item.nama}</h4>
              <p class="text-[9px] text-gray-500">${item.cabang}</p>
            </div>
          </div>
          <span class="text-xs font-black text-blue-600">${item.xp} XP</span>
        </div>
      `;
    });
    container.innerHTML = html;
  });
}

// FUNGSI PROFIL CABANG DINAMIS
function loadProfilCabangData(cabangName) {
  const picaBox = document.getElementById("profPicaBox");
  const berulangBox = document.getElementById("profTemuanBerulangBox");
  const topFlpBox = document.getElementById("profTopFlpBox");

  if (picaBox) picaBox.innerHTML = '<p class="text-gray-400 italic">Memuat data PICA...</p>';
  if (berulangBox) berulangBox.innerHTML = '<p class="text-gray-400 italic">Memuat temuan berulang...</p>';
  if (topFlpBox) topFlpBox.innerHTML = '<p class="text-gray-400 italic">Memuat peringkat FLP...</p>';

  fetch(`${API_URL}?action=getProfilCabang&cabang=${encodeURIComponent(cabangName)}`)
  .then(res => res.json())
  .then(res => {
    if (res.status === "success") {
      if (res.info && res.info.skorNos) {
        const parts = res.info.skorNos.split('/');
        document.getElementById("profBadgeSkor").innerHTML = `
          <span class="bg-amber-400 text-gray-900 text-xs font-extrabold px-3 py-0.5 rounded-md shadow-2xs">${parts[0] ? parts[0].trim() : "GOLD"}</span>
          <span class="text-gray-400 font-light text-xs">/</span>
          <span class="bg-gray-300 text-gray-600 text-xs font-bold px-3 py-0.5 rounded-md">${parts[1] ? parts[1].trim() : "PLATINUM"}</span>
        `;
      }
      
      if (res.info && res.info.jadwalGenba) {
        document.getElementById("profJadwalGenba").innerText = formatDateNice(res.info.jadwalGenba);
      }

      // PICA Belum Selesai
      if (res.picaBelumSelesai && res.picaBelumSelesai.length > 0) {
        let picaHtml = '';
        res.picaBelumSelesai.forEach(item => {
          const badgeClass = item.status === 'Open' ? 'bg-red-200 text-red-700' : 'bg-amber-200 text-amber-800';
          picaHtml += `
            <div class="flex items-center justify-between bg-white/60 p-2 rounded-xl">
              <div class="flex items-center gap-2">
                <div class="w-1.5 h-4 ${item.status === 'Open' ? 'bg-red-500' : 'bg-amber-500'} rounded-full"></div>
                <span class="font-bold text-gray-800 text-xs">${item.item}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-gray-500 font-semibold text-[10px]">${formatDateNice(item.dueDate)}</span>
                <span class="${badgeClass} font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">${item.status}</span>
              </div>
            </div>
          `;
        });
        picaBox.innerHTML = picaHtml;
      } else {
        picaBox.innerHTML = '<p class="text-emerald-600 font-bold text-xs">Semua PICA terselesaikan! 🎉</p>';
      }

      // Temuan Berulang
      if (res.temuanBerulang && res.temuanBerulang.length > 0) {
        let berulangHtml = '';
        res.temuanBerulang.forEach(tb => {
          berulangHtml += `
            <div class="flex items-center justify-between bg-white/60 p-2 rounded-xl">
              <span class="font-bold text-gray-800 text-xs">${tb.item}</span>
              <span class="bg-red-100 text-red-700 border border-red-200 font-extrabold px-2.5 py-0.5 rounded-full text-[10px]">${tb.jumlah}</span>
            </div>
          `;
        });
        berulangBox.innerHTML = berulangHtml;
      } else {
        berulangBox.innerHTML = '<p class="text-gray-500 italic text-xs">Tidak ada temuan berulang.</p>';
      }

      // 3 Besar FLP NOSIZU Per Cabang
      if (res.top3Flp && res.top3Flp.length > 0) {
        let flpHtml = '';
        res.top3Flp.forEach((flp, index) => {
          let badge = `<span class="font-extrabold text-gray-400 text-xs w-5">${index + 1}</span>`;
          if (index === 0) badge = `<span class="text-base">🥇</span>`;
          if (index === 1) badge = `<span class="text-base">🥈</span>`;
          if (index === 2) badge = `<span class="text-base">🥉</span>`;

          flpHtml += `
            <div class="flex items-center justify-between bg-white/60 p-2.5 rounded-xl">
              <div class="flex items-center gap-2.5">
                ${badge}
                <div>
                  <h5 class="font-extrabold text-gray-900 text-xs leading-tight">${flp.nama}</h5>
                  <p class="text-[10px] text-gray-500 font-medium">${flp.role || "FLP"}</p>
                </div>
              </div>
              <span class="font-extrabold text-red-600 text-xs">${flp.xp} XP</span>
            </div>
          `;
        });
        topFlpBox.innerHTML = flpHtml;
      } else {
        topFlpBox.innerHTML = '<p class="text-gray-500 italic text-xs">Belum ada peringkat FLP di cabang ini.</p>';
      }
    }
  })
  .catch(err => {
    console.error("Error loading Profil Cabang:", err);
    if (picaBox) picaBox.innerHTML = '<p class="text-red-500 text-xs">Gagal memuat profil cabang.</p>';
  });
}

// SWITCH TAB NAVIGATION
function switchTab(tabId) {
  const pages = ['dashboardPage', 'referensiPage', 'genbaFormPage', 'genbaAuditPage', 'picaDashboardPage', 'nosizuPage', 'leaderboardPage', 'profilPage'];
  pages.forEach(p => {
    const el = document.getElementById(p);
    if (el) el.classList.add('hidden');
  });

  const navHome = document.getElementById('navHome');
  const navPica = document.getElementById('navPica');
  const navLeaderboard = document.getElementById('navLeaderboard');
  const navProfil = document.getElementById('navProfil');

  [navHome, navPica, navLeaderboard, navProfil].forEach(n => { if (n) n.classList.add('opacity-70'); });

  if (tabId === 'home') {
    document.getElementById('dashboardPage').classList.remove('hidden');
    navHome.classList.remove('opacity-70');
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
    loadPicaDashboardData();
  } else if (tabId === 'nosizu') {
    document.getElementById('nosizuPage').classList.remove('hidden');
    loadNOSIZUDashboard();
  } else if (tabId === 'leaderboard') {
    document.getElementById('leaderboardPage').classList.remove('hidden');
    navLeaderboard.classList.remove('opacity-70');
    loadLeaderboardData();
  } else if (tabId === 'profil') {
    document.getElementById('profilPage').classList.remove('hidden');
    navProfil.classList.remove('opacity-70');
    if (currentUser && currentUser.cabang) {
      loadProfilCabangData(currentUser.cabang);
    }
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
