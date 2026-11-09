const API_URL = "https://script.google.com/macros/s/AKfycby3Nv784S410kwfLsKDfexjrd4Mm1LJYYzzweWqgukZK-VegEhnEngNpVLN_wHUPsC5/exec";

let authMode = "login";
let selectedRole = "Kepala Cabang";
let currentUser = null;

// ENGINE GENBA, DIRECT AUDIT & KALKULATOR RESULT
let allCeklisNOSData = [];
let activeGenbaCategory = "PREMISES H1";
let currentAuditSession = null;
let auditSelection = {}; // Memuat { status, pilar, categoryKey, headerLabel, fotoBase64 }

// ENGINE ROTASI 3D VIEWER
let isSpinning3D = false;
let startX3D = 0;
let currentRotationY = 0;

// ENGINE DATA NOSIZU
let nosUserStats = { xp: 0, streak: 1, nyawa: 5, unit: 1 };
let currentQuestionList = [];
let quizIndex = 0;
let userSelectedAnswer = null;

// GLOBAL LIST VIDEO ONBOARDING
let allOnboardingVideos = [];

// ENGINE GUIDED TOUR PANDUAN MASKOT
let currentTourStep = 0;
const tourSteps = [
  { badge: "PANDUAN NOSA (1/7)", targetId: null, tab: "home", text: "Halo! Aku Daya NOSA 👋. Selamat datang! Yuk, aku ajak keliling sebentar untuk mengenali setiap fitur hebat di Daya NOSA." },
  { badge: "REFERENSI STANDAR (2/7)", targetId: "cardRef", tab: "home", text: "Menu Referensi Standar berisi dokumen visual & 3D interaktif sebagai acuan standar dealer Anda." },
  { badge: "GENBA AUDIT (3/7)", targetId: "cardGenba", tab: "home", text: "Di sini Anda bisa langsung melakukan GENBA Audit per kategori (H1 & H23) dengan perhitungan Result otomatis!" },
  { badge: "DASHBOARD PICA (4/7)", targetId: "cardPerforma", tab: "home", text: "Pantau performa area Anda dan tindak lanjuti temuan PICA di sini." },
  { badge: "NOSIZU GAME (5/7)", targetId: "cardNosizu", tab: "home", text: "Sambil senggang, asah pengetahuan standar NOS Anda melalui game kuis interaktif NOSIZU!" },
  { badge: "ONBOARDING FLP (6/7)", targetId: "cardOnboarding", tab: "home", text: "Menu ini menyediakan video-video materi orientasi & pelatihan khusus FLP baru." },
  { badge: "PROFIL CABANG (7/7)", targetId: "cardProfil", tab: "home", text: "Terakhir, cek Skor NOS Cabang Anda, daftar temuan berulang, serta peringkat Top 3 FLP NOSIZU di menu Profil Cabang." }
];

// ENGINE REMINDER
let reminderState = { rule1: true, rule2: true, rule3: true, rule4: true };
let activeToastTargetTab = "pica";

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

function getGradingResult(percentageVal) {
  if (percentageVal === null || percentageVal === undefined || isNaN(percentageVal)) {
    return { title: '-', bgClass: 'bg-gray-400 text-gray-950 font-black' };
  }
  const val = parseFloat(percentageVal);
  if (val >= 90.0) return { title: 'Platinum', bgClass: 'bg-slate-700 text-white border border-slate-500' };
  if (val >= 70.0) return { title: 'Gold', bgClass: 'bg-amber-400 text-amber-950 font-black' };
  if (val >= 60.0) return { title: 'Silver', bgClass: 'bg-gray-400 text-gray-950 font-black' };
  return { title: 'Bronze', bgClass: 'bg-amber-700 text-white font-black' };
}

// FETCH & RENDER RESULT GENBA 6 PILAR PADA HOMEPAGE
function loadHomeLastGenbaResult(cabangName) {
  document.getElementById("homeGenbaCabang").innerText = `Cabang ${cabangName}`;

  fetch(`${API_URL}?action=getLastGenbaResult&cabang=${encodeURIComponent(cabangName)}`)
  .then(res => res.json())
  .then(res => {
    const categories = [
      { key: "premisesH1", scoreId: "homeScorePremisesH1", barId: "homeBarPremisesH1" },
      { key: "processH1", scoreId: "homeScoreProcessH1", barId: "homeBarProcessH1" },
      { key: "peopleH1", scoreId: "homeScorePeopleH1", barId: "homeBarPeopleH1" },
      { key: "premisesH23", scoreId: "homeScorePremisesH23", barId: "homeBarPremisesH23" },
      { key: "processH23", scoreId: "homeScoreProcessH23", barId: "homeBarProcessH23" },
      { key: "peopleH23", scoreId: "homeScorePeopleH23", barId: "homeBarPeopleH23" }
    ];

    let totalScore = 0;
    let countEvaluated = 0;
    let tglAudit = "-";

    const dataObj = (res.status === "success" && res.data) ? res.data : {};
    if (res.data && res.data.tanggal) tglAudit = formatDateNice(res.data.tanggal);

    categories.forEach(cat => {
      const scoreEl = document.getElementById(cat.scoreId);
      const barEl = document.getElementById(cat.barId);
      const rawVal = dataObj[cat.key];

      if (rawVal !== undefined && rawVal !== null && !isNaN(rawVal)) {
        const valNum = Math.round(parseFloat(rawVal));
        if (scoreEl) {
          scoreEl.innerText = `${valNum}%`;
          scoreEl.className = "text-base sm:text-xl font-black text-nosa-green";
        }
        if (barEl) barEl.style.width = `${valNum}%`;
        totalScore += valNum;
        countEvaluated++;
      } else {
        if (scoreEl) {
          scoreEl.innerText = "Belum Ada Nilai GENBA Terakhir";
          scoreEl.className = "text-[10px] sm:text-xs font-bold text-gray-400 italic leading-snug py-1";
        }
        if (barEl) barEl.style.width = "0%";
      }
    });

    const overallScore = countEvaluated > 0 ? Math.round(totalScore / countEvaluated) : null;
    const grading = getGradingResult(overallScore);

    const badgeEl = document.getElementById("homeGradingBadge");
    if (badgeEl) {
      badgeEl.innerText = grading.title;
      badgeEl.className = `${grading.bgClass} text-xs font-black px-3 py-0.5 rounded-lg shadow-xs uppercase tracking-wider`;
    }

    document.getElementById("homeOverallScoreVal").innerText = overallScore !== null ? `${overallScore}%` : "-";
    const circleBar = document.getElementById("homeCircleProgress");
    if (circleBar) circleBar.setAttribute("stroke-dasharray", overallScore !== null ? `${overallScore}, 100` : "0, 100");

    document.getElementById("homeGenbaDate").innerText = `Audit Terakhir: ${tglAudit}`;
  })
  .catch(err => {
    console.error("Gagal memuat result GENBA 6 Pilar Home", err);
  });
}

function initDirectGenbaSession() {
  const userCabang = currentUser ? (currentUser.cabang || "Cibiru") : "Cibiru";
  const userNama = currentUser ? (currentUser.nama || "Rafi") : "Rafi";
  const userRole = currentUser ? (currentUser.role || "Kepala Cabang") : "Kepala Cabang";

  currentAuditSession = { cabang: userCabang, nama: userNama, jabatan: userRole };
  document.getElementById("auditInfoCabang").innerText = `Cabang ${userCabang}`;
  document.getElementById("auditInfoAuditor").innerText = `Auditor: ${userNama} (${userRole})`;

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
    allCeklisNOSData = data.slice(1);
    filterGenbaCategory(activeGenbaCategory);
    calculateAuditScores();
  });
}

function filterGenbaCategory(categoryKey) {
  activeGenbaCategory = categoryKey;
  const categories = ['PREMISES H1', 'PROCESS H1', 'PEOPLE H1', 'PREMISES H23', 'PROCESS H23', 'PEOPLE H23'];
  
  categories.forEach(cat => {
    const btn = document.getElementById(`tabCat-${cat.replace(/\s+/g, '')}`);
    if (btn) {
      if (cat === categoryKey) {
        btn.className = "px-3.5 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap bg-nosa-green text-white shadow-xs transition";
      } else {
        btn.className = "px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-white text-gray-600 hover:bg-gray-100 transition";
      }
    }
  });

  renderFilteredCeklis();
}

// PENCOCOKAN FLEKSIBEL CEKLIS & PENANGANAN KOLOM MANDATORY (C) DAN ISNEEDFOTO (I)
function renderFilteredCeklis() {
  const container = document.getElementById("genbaCeklisContainer");
  
  const cleanActiveCat = activeGenbaCategory.replace(/\s+/g, '').toUpperCase();

  const filtered = allCeklisNOSData.filter(row => {
    const tipeSheet = (row[1] || '').toString().replace(/\s+/g, '').toUpperCase();
    return tipeSheet.includes(cleanActiveCat) || cleanActiveCat.includes(tipeSheet);
  });

  if (filtered.length === 0) {
    container.innerHTML = `<p class="text-xs text-gray-400 italic text-center py-6">Tidak ada item ceklis untuk kategori ${activeGenbaCategory}.</p>`;
    validateGenbaCompletion();
    return;
  }

  let html = '';
  filtered.forEach(row => {
    const originalIndex = allCeklisNOSData.indexOf(row);
    const idCeklis = (row[0] || '').toString().trim();
    const tipe = (row[1] || activeGenbaCategory).toString().trim();
    const mandatory = (row[2] || '-').toString().trim(); // Kolom C: Mandatory
    const itemVal = (row[3] || '').toString().trim();
    const subItem1 = (row[4] || '').toString().trim();
    const subItem2 = (row[5] || '').toString().trim();
    const penjelasan = (row[6] || 'Penjelasan item ceklis...').toString().trim();
    
    let rawImg = (row[7] || '').toString().trim();
    if (rawImg.includes('drive.google.com') && rawImg.includes('/d/')) {
      const match = rawImg.match(/\/d\/([^\/]+)/);
      if (match && match[1]) rawImg = `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
    const imgUrl = rawImg;
    const isNeedFoto = (row[8] || '').toString().trim().toLowerCase() === 'ya'; // Kolom I: IsNeedFoto

    const labelParts = [itemVal, subItem1, subItem2].filter(text => text !== '');
    const headerLabel = labelParts.join(', ');

    const currentSel = auditSelection[originalIndex] ? auditSelection[originalIndex].status : null;

    let pilar = "PREMISES";
    const uTipe = tipe.toUpperCase();
    if (uTipe.includes("PROCESS")) pilar = "PROCESS";
    if (uTipe.includes("PEOPLE")) pilar = "PEOPLE";

    html += `
      <div class="bg-nosa-cardBg p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-3 text-left">
        <div class="flex justify-between items-center border-b border-gray-300/50 pb-1.5">
          <div class="flex items-center gap-2">
            <span class="text-[10px] bg-nosa-green text-white px-2 py-0.5 rounded-md font-bold">${idCeklis || 'NOS'}</span>
            <h3 class="text-xs sm:text-sm font-black text-nosa-green tracking-wider uppercase">${tipe}</h3>
          </div>
          <div class="flex items-center gap-2">
            ${isNeedFoto ? `<span class="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md">📷 Wajib Foto</span>` : ''}
            <span class="text-xs font-black text-nosa-green bg-emerald-100/80 px-2.5 py-0.5 rounded-md border border-emerald-300">Mandatory: ${mandatory}</span>
          </div>
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

        ${isNeedFoto ? `
          <div class="bg-white/80 p-3 rounded-xl border border-amber-200 space-y-1.5">
            <label class="block text-[10px] font-extrabold text-amber-900 uppercase">Upload Bukti Foto Temuan/Kondisi</label>
            <input type="file" accept="image/*" onchange="handleAuditPhotoUpload(${originalIndex}, this)" class="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-100 file:text-amber-800 hover:file:bg-amber-200">
            <span id="photoStatus-${originalIndex}" class="text-[10px] text-gray-500 italic block">
              ${auditSelection[originalIndex] && auditSelection[originalIndex].fotoBase64 ? '✅ Foto telah diunggah' : 'Belum ada foto terpilih'}
            </span>
          </div>
        ` : ''}

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button type="button" data-index="${originalIndex}" data-status="Exist Good" onclick="selectAuditStatus(${originalIndex}, 'Exist Good', '${pilar}', '${activeGenbaCategory}')" class="audit-btn-${originalIndex} py-2 ${currentSel === 'Exist Good' ? 'bg-emerald-500 text-white font-extrabold shadow-xs' : 'bg-gray-300 hover:bg-emerald-200 text-gray-800 font-bold'} text-xs rounded-xl border border-gray-400/50 transition cursor-pointer">Exist Good</button>
          <button type="button" data-index="${originalIndex}" data-status="Exist Not Good" onclick="selectAuditStatus(${originalIndex}, 'Exist Not Good', '${pilar}', '${activeGenbaCategory}')" class="audit-btn-${originalIndex} py-2 ${currentSel === 'Exist Not Good' ? 'bg-amber-500 text-white font-extrabold shadow-xs' : 'bg-gray-300 hover:bg-amber-200 text-gray-800 font-bold'} text-xs rounded-xl border border-gray-400/50 transition cursor-pointer">Exist Not Good</button>
          <button type="button" data-index="${originalIndex}" data-status="Not Exist" onclick="selectAuditStatus(${originalIndex}, 'Not Exist', '${pilar}', '${activeGenbaCategory}')" class="audit-btn-${originalIndex} py-2 ${currentSel === 'Not Exist' ? 'bg-red-500 text-white font-extrabold shadow-xs' : 'bg-gray-300 hover:bg-red-200 text-gray-800 font-bold'} text-xs rounded-xl border border-gray-400/50 transition cursor-pointer">Not Exist</button>
          <button type="button" data-index="${originalIndex}" data-status="N/A" onclick="selectAuditStatus(${originalIndex}, 'N/A', '${pilar}', '${activeGenbaCategory}')" class="audit-btn-${originalIndex} py-2 ${currentSel === 'N/A' ? 'bg-gray-600 text-white font-extrabold shadow-xs' : 'bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold'} text-xs rounded-xl border border-gray-400/50 transition cursor-pointer">N/A</button>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
  validateGenbaCompletion();
}

function handleAuditPhotoUpload(originalIndex, inputEl) {
  if (inputEl.files && inputEl.files[0]) {
    const file = inputEl.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
      if (!auditSelection[originalIndex]) auditSelection[originalIndex] = {};
      auditSelection[originalIndex].fotoBase64 = e.target.result;
      const statusEl = document.getElementById(`photoStatus-${originalIndex}`);
      if (statusEl) statusEl.innerText = `✅ Foto (${file.name}) terlampir`;
    };
    reader.readAsDataURL(file);
  }
}

function selectAuditStatus(originalIndex, status, pilar, categoryKey) {
  const row = allCeklisNOSData[originalIndex] || [];
  const itemVal = (row[3] || '').toString().trim();
  const subItem1 = (row[4] || '').toString().trim();
  const subItem2 = (row[5] || '').toString().trim();
  const headerLabel = [itemVal, subItem1, subItem2].filter(t => t !== '').join(', ');
  
  // Ambil foto yang diunggah dari variabel atau input file DOM jika ada
  let prevFoto = auditSelection[originalIndex] ? auditSelection[originalIndex].fotoBase64 : null;
  
  auditSelection[originalIndex] = { 
    status: status, 
    pilar: pilar, 
    categoryKey: categoryKey,
    headerLabel: headerLabel,
    fotoBase64: prevFoto
  };
  
  const btns = document.querySelectorAll(`.audit-btn-${originalIndex}`);
  btns.forEach(btn => {
    const btnStatus = btn.getAttribute("data-status");
    if (btnStatus === status) {
      if (status === 'Exist Good') btn.className = `audit-btn-${originalIndex} py-2 bg-emerald-500 text-white text-xs font-extrabold rounded-xl shadow-xs border border-emerald-600 cursor-pointer transition`;
      else if (status === 'Exist Not Good') btn.className = `audit-btn-${originalIndex} py-2 bg-amber-500 text-white text-xs font-extrabold rounded-xl shadow-xs border border-amber-600 cursor-pointer transition`;
      else if (status === 'Not Exist') btn.className = `audit-btn-${originalIndex} py-2 bg-red-500 text-white text-xs font-extrabold rounded-xl shadow-xs border border-red-600 cursor-pointer transition`;
      else if (status === 'N/A') btn.className = `audit-btn-${originalIndex} py-2 bg-gray-600 text-white text-xs font-extrabold rounded-xl shadow-xs border border-gray-700 cursor-pointer transition`;
    } else {
      btn.className = `audit-btn-${originalIndex} py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 text-xs font-bold rounded-xl border border-gray-400/50 cursor-pointer transition`;
    }
  });

  calculateAuditScores();
  validateGenbaCompletion();
}

function calculateAuditScores() {
  let stats = {
    PREMISES: { totalPoin: 0, validChecklist: 0 },
    PROCESS:  { totalPoin: 0, validChecklist: 0 },
    PEOPLE:   { totalPoin: 0, validChecklist: 0 }
  };

  Object.values(auditSelection).forEach(item => {
    const pilar = item.pilar || "PREMISES";
    const st = item.status;

    if (st === "N/A") return;

    stats[pilar].validChecklist += 1;

    if (pilar === "PREMISES") {
      if (st === "Exist Good") stats.PREMISES.totalPoin += 1;
      else if (st === "Exist Not Good") stats.PREMISES.totalPoin += (-1);
    } else if (pilar === "PROCESS") {
      if (st === "Exist Good") stats.PROCESS.totalPoin += 1;
    } else if (pilar === "PEOPLE") {
      if (st === "Exist Good") stats.PEOPLE.totalPoin += 2;
      else if (st === "Exist Not Good") stats.PEOPLE.totalPoin += 1;
    }
  });

  const resPremises = stats.PREMISES.validChecklist > 0 ? (stats.PREMISES.totalPoin / stats.PREMISES.validChecklist) * 100 : 0;
  const resProcess  = stats.PROCESS.validChecklist > 0 ? (stats.PROCESS.totalPoin / stats.PROCESS.validChecklist) * 100 : 0;
  const resPeople   = stats.PEOPLE.validChecklist > 0 ? (stats.PEOPLE.totalPoin / (2 * stats.PEOPLE.validChecklist)) * 100 : 0;

  document.getElementById("resPremisesVal").innerText = `${Math.round(resPremises)}%`;
  document.getElementById("ptsPremisesVal").innerText = `${stats.PREMISES.totalPoin} Pts / ${stats.PREMISES.validChecklist} Item`;

  document.getElementById("resProcessVal").innerText = `${Math.round(resProcess)}%`;
  document.getElementById("ptsProcessVal").innerText = `${stats.PROCESS.totalPoin} Pts / ${stats.PROCESS.validChecklist} Item`;

  document.getElementById("resPeopleVal").innerText = `${Math.round(resPeople)}%`;
  document.getElementById("ptsPeopleVal").innerText = `${stats.PEOPLE.totalPoin} Pts / ${stats.PEOPLE.validChecklist * 2} Max`;
}

function validateGenbaCompletion() {
  const cleanActiveCat = activeGenbaCategory.replace(/\s+/g, '').toUpperCase();
  const currentCategoryItems = allCeklisNOSData.filter(row => {
    const tipeSheet = (row[1] || '').toString().replace(/\s+/g, '').toUpperCase();
    return tipeSheet.includes(cleanActiveCat) || cleanActiveCat.includes(tipeSheet);
  });

  const totalCurrentCat = currentCategoryItems.length;
  
  let answeredCurrentCat = 0;
  currentCategoryItems.forEach(row => {
    const origIdx = allCeklisNOSData.indexOf(row);
    if (auditSelection[origIdx] && auditSelection[origIdx].status) answeredCurrentCat++;
  });

  const progressText = document.getElementById("auditProgressText");
  const catBadge = document.getElementById("auditCatBadge");
  const btnSubmit = document.getElementById("btnSubmitGenbaAudit");

  if (catBadge) catBadge.innerText = `${activeGenbaCategory} Progress`;
  if (progressText) progressText.innerText = `${answeredCurrentCat}/${totalCurrentCat} Diselesaikan`;

  if (totalCurrentCat > 0 && answeredCurrentCat >= totalCurrentCat) {
    if (btnSubmit) {
      btnSubmit.disabled = false;
      btnSubmit.className = "flex-1 sm:flex-initial py-2.5 px-5 bg-nosa-green hover:bg-nosa-greenLight text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer";
      btnSubmit.innerText = `💾 Submit Audit (${activeGenbaCategory})`;
    }
  } else {
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.className = "flex-1 sm:flex-initial py-2.5 px-5 bg-gray-300 text-gray-500 font-extrabold text-xs rounded-xl shadow-xs transition cursor-not-allowed";
      btnSubmit.innerText = `🔒 Submit (${totalCurrentCat - answeredCurrentCat} tersisa)`;
    }
  }
}

function submitGenbaForm() {
  const cleanActiveCat = activeGenbaCategory.replace(/\s+/g, '').toUpperCase();
  const currentCategoryItems = allCeklisNOSData.filter(row => {
    const tipeSheet = (row[1] || '').toString().replace(/\s+/g, '').toUpperCase();
    return tipeSheet.includes(cleanActiveCat) || cleanActiveCat.includes(tipeSheet);
  });

  const categoryResults = [];
  currentCategoryItems.forEach(row => {
    const origIdx = allCeklisNOSData.indexOf(row);
    if (auditSelection[origIdx]) {
      categoryResults.push(auditSelection[origIdx]);
    }
  });

  if (categoryResults.length < currentCategoryItems.length) {
    alert(`Silakan lengkapi seluruh ceklis pada kategori ${activeGenbaCategory} sebelum melakukan submit!`);
    return;
  }

  const btnSubmit = document.getElementById("btnSubmitGenbaAudit");
  if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerText = "Menyimpan..."; }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ 
      action: "submitGenbaAudit", 
      auditSession: currentAuditSession, 
      category: activeGenbaCategory,
      auditResults: categoryResults 
    })
  })
  .then(res => res.json())
  .then(res => {
    if (res.status === "success") {
      alert(`Audit ${activeGenbaCategory} Berhasil Disimpan! ${res.totalPicaCreated || 0} temuan PICA baru telah ditambahkan.`);
      
      const userCabang = currentUser ? (currentUser.cabang || "Cibiru") : "Cibiru";
      loadHomeLastGenbaResult(userCabang);
      switchTab("home");
    } else { alert(res.message || "Gagal menyimpan audit."); }
  });
}

function evaluateRealtimeReminders(isManualClick = false) {
  const userCabang = currentUser ? (currentUser.cabang || "Cibiru") : "Cibiru";
  const today = new Date();
  today.setHours(0,0,0,0);

  const previewEl = document.getElementById("reminderPreviewText");
  if (previewEl) previewEl.innerText = "Mengambil data PICA & GENBA real-time...";

  fetch(`${API_URL}?action=getProfilCabang&cabang=${encodeURIComponent(userCabang)}`)
  .then(res => res.json())
  .then(res => {
    let triggeredMessage = null;
    let targetTab = "pica";

    if (res.status === "success") {
      if (res.picaBelumSelesai && res.picaBelumSelesai.length > 0) {
        for (let pica of res.picaBelumSelesai) {
          const due = new Date(pica.dueDate);
          due.setHours(0,0,0,0);
          const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));

          if (diffDays < 0 && reminderState.rule2) {
            triggeredMessage = `⚠️ PICA Overdue: Temuan "${pica.item}" telah melewati batas waktu jatuh tempo (${formatDateNice(pica.dueDate)}).`;
            targetTab = "pica";
            break;
          } else if (diffDays >= 0 && diffDays <= 2 && reminderState.rule1) {
            triggeredMessage = `Pengingat Due Date: PICA "${pica.item}" di Cabang ${userCabang} jatuh tempo ${diffDays === 0 ? 'hari ini' : 'dalam ' + diffDays + ' hari'}!`;
            targetTab = "pica";
            break;
          }
        }
      }

      if (!triggeredMessage && res.info && res.info.jadwalGenba && reminderState.rule3) {
        const genbaDate = new Date(res.info.jadwalGenba);
        genbaDate.setHours(0,0,0,0);
        const diffGenba = Math.ceil((genbaDate - today) / (1000 * 60 * 60 * 24));

        if (diffGenba >= 0 && diffGenba <= 3) {
          triggeredMessage = `📅 Pengingat GENBA: Audit Onsite berikutnya di Cabang ${userCabang} diselenggarakan tanggal ${formatDateNice(res.info.jadwalGenba)}.`;
          targetTab = "profil";
        }
      }
    }

    if (triggeredMessage) {
      if (previewEl) previewEl.innerText = triggeredMessage;
      showInAppReminderToast(triggeredMessage, targetTab);
    } else {
      const emptyMsg = `Tidak ada pengingat mendesak untuk Cabang ${userCabang} pada tanggal hari ini.`;
      if (previewEl) previewEl.innerText = emptyMsg;
      if (isManualClick) alert(emptyMsg);
    }
  })
  .catch(err => {
    if (previewEl) previewEl.innerText = "Gagal memverifikasi jadwal real-time.";
  });
}

function showInAppReminderToast(msg, targetTab = "pica") {
  const toast = document.getElementById("inAppReminderToast");
  const cabangBadge = document.getElementById("toastCabangBadge");
  const msgContent = document.getElementById("toastMessageContent");

  const cabang = currentUser ? (currentUser.cabang || "Cibiru") : "Cibiru";
  cabangBadge.innerText = `Cabang ${cabang}`;
  msgContent.innerText = msg;
  activeToastTargetTab = targetTab;

  toast.classList.remove("hidden");
}

function dismissInAppToast() { document.getElementById("inAppReminderToast").classList.add("hidden"); }
function handleToastAction() { dismissInAppToast(); switchTab(activeToastTargetTab); }

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
            <div onclick="open3DViewer('${imgUrl.replace(/'/g, "\\'")}', '${judul.replace(/'/g, "\\'")}', '${deskripsi.replace(/'/g, "\\'")}')" class="w-full h-48 sm:h-56 rounded-2xl overflow-hidden bg-white/90 p-2 flex items-center justify-center border border-gray-300/50 shadow-inner cursor-pointer relative group">
              ${imgUrl ? `<img src="${imgUrl}" alt="${judul}" class="w-full h-full object-contain transition group-hover:scale-105">` : '<span class="text-xs text-gray-400 italic">Tidak ada gambar</span>'}
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-extrabold text-xs gap-1">
                <span>🔄 Putar 3D</span>
              </div>
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
  });
}

function open3DViewer(imgUrl, title, desc) {
  document.getElementById("modal3DTitle").innerText = title;
  document.getElementById("modal3DImage").src = imgUrl;
  document.getElementById("modal3DDesc").innerText = desc;
  currentRotationY = 0;
  update3DRotation();

  const container = document.getElementById("spin3DContainer");
  container.onmousedown = start3DSpin;
  window.onmousemove = move3DSpin;
  window.onmouseup = end3DSpin;

  container.ontouchstart = (e) => start3DSpin(e.touches[0]);
  window.ontouchmove = (e) => move3DSpin(e.touches[0]);
  window.ontouchend = end3DSpin;

  document.getElementById("modal3DViewer").classList.remove("hidden");
}

function close3DViewer() { document.getElementById("modal3DViewer").classList.add("hidden"); }

function start3DSpin(e) { isSpinning3D = true; startX3D = e.clientX; }
function move3DSpin(e) {
  if (!isSpinning3D) return;
  const deltaX = e.clientX - startX3D;
  currentRotationY += deltaX * 0.8;
  startX3D = e.clientX;
  update3DRotation();
}
function end3DSpin() { isSpinning3D = false; }
function update3DRotation() {
  const img = document.getElementById("modal3DImage");
  if (img) img.style.transform = `perspective(1000px) rotateY(${currentRotationY}deg)`;
}

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
  btn.disabled = true; btn.innerText = "Proses...";
  const payload = {
    action: authMode === "register" ? "registerUser" : "loginUser",
    email: email, password: password, nama: nama, role: selectedRole,
    cabang: selectedRole === "PIC NOS" ? "Head Office" : (cabang || "Cibiru")
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
    } else { alert(res.message || "Gagal memproses login."); }
  });
}

function handleLogout() {
  if (confirm("Apakah Anda yakin ingin keluar dari akun ini?")) {
    localStorage.removeItem("nosa_user");
    localStorage.removeItem("nosa_has_toured");
    currentUser = null;
    document.getElementById("mainContainer").classList.add("hidden");
    document.getElementById("loginPage").classList.remove("hidden");
    setAuthMode("login");
  }
}

function renderDashboard(user) {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("mainContainer").classList.remove("hidden");
  document.getElementById("dashUserNama").innerText = user.nama || user.email;
  document.getElementById("profNamaCabang").innerText = "Cabang " + (user.cabang || "Cibiru");
  
  switchTab("home");
  loadHomeLastGenbaResult(user.cabang || "Cibiru");
  loadProfilCabangData(user.cabang || "Cibiru");
  initReminderUI();
  evaluateRealtimeReminders();

  setTimeout(() => { startAppTour(false); }, 600);
}

function initReminderUI() {
  const saved = localStorage.getItem("nosa_reminder_state");
  if (saved) { try { reminderState = JSON.parse(saved); } catch (e) {} }
  updateReminderButtons();
}

function toggleReminderRule(ruleKey) {
  reminderState[ruleKey] = !reminderState[ruleKey];
  localStorage.setItem("nosa_reminder_state", JSON.stringify(reminderState));
  updateReminderButtons();
  evaluateRealtimeReminders(true);
}

function updateReminderButtons() {
  const rules = ['rule1', 'rule2', 'rule3', 'rule4'];
  rules.forEach((rKey, idx) => {
    const btn = document.getElementById(`btnRule${idx + 1}`);
    if (!btn) return;
    if (reminderState[rKey]) {
      btn.innerText = "Aktif";
      btn.className = "px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition bg-emerald-400 text-emerald-950";
    } else {
      btn.innerText = "Non-Aktif";
      btn.className = "px-4 py-1.5 rounded-xl text-xs font-extrabold shadow-2xs transition bg-red-300 text-red-950";
    }
  });
}

function startAppTour(isManual = false) {
  const hasToured = localStorage.getItem("nosa_has_toured");
  if (!isManual && hasToured === "true") return;
  currentTourStep = 0;
  document.getElementById("tourOverlay").classList.remove("hidden");
  renderTourStep();
}

function renderTourStep() {
  const step = tourSteps[currentTourStep];
  switchTab(step.tab);
  document.getElementById("tourStepBadge").innerText = step.badge;
  document.getElementById("tourDialogText").innerText = step.text;
  document.querySelectorAll('.ring-4').forEach(el => el.classList.remove('ring-4', 'ring-yellow-400', 'scale-105'));

  if (step.targetId) {
    const target = document.getElementById(step.targetId);
    if (target) {
      target.classList.add('ring-4', 'ring-yellow-400', 'scale-105');
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
  const btnPrev = document.getElementById("btnTourPrev");
  const btnNext = document.getElementById("btnTourNext");
  if (currentTourStep === 0) btnPrev.classList.add("hidden"); else btnPrev.classList.remove("hidden");
  if (currentTourStep === tourSteps.length - 1) btnNext.innerText = "Selesai ✨"; else btnNext.innerText = "Lanjut \u203A";
}

function nextTourStep() { if (currentTourStep < tourSteps.length - 1) { currentTourStep++; renderTourStep(); } else endAppTour(); }
function prevTourStep() { if (currentTourStep > 0) { currentTourStep--; renderTourStep(); } }
function endAppTour() {
  document.querySelectorAll('.ring-4').forEach(el => el.classList.remove('ring-4', 'ring-yellow-400', 'scale-105'));
  document.getElementById("tourOverlay").classList.add("hidden");
  localStorage.setItem("nosa_has_toured", "true"); switchTab("home");
}

function switchTab(tabId) {
  const pages = ['dashboardPage', 'referensiPage', 'reminderPage', 'onboardingPage', 'genbaAuditPage', 'picaDashboardPage', 'nosizuPage', 'leaderboardPage', 'profilPage'];
  pages.forEach(p => { const el = document.getElementById(p); if (el) el.classList.add('hidden'); });

  const navHome = document.getElementById('navHome');
  const navPica = document.getElementById('navPica');
  const navLeaderboard = document.getElementById('navLeaderboard');
  const navProfil = document.getElementById('navProfil');
  [navHome, navPica, navLeaderboard, navProfil].forEach(n => { if (n) n.classList.add('opacity-70'); });

  if (tabId === 'home') {
    document.getElementById('dashboardPage').classList.remove('hidden'); navHome.classList.remove('opacity-70');
    if (currentUser && currentUser.cabang) loadHomeLastGenbaResult(currentUser.cabang);
  } else if (tabId === 'referensi') {
    document.getElementById('referensiPage').classList.remove('hidden'); loadReferensiData();
  } else if (tabId === 'reminder') {
    document.getElementById('reminderPage').classList.remove('hidden'); initReminderUI(); evaluateRealtimeReminders();
  } else if (tabId === 'onboarding') {
    document.getElementById('onboardingPage').classList.remove('hidden'); loadOnboardingData();
  } else if (tabId === 'genbaAudit') {
    document.getElementById('genbaAuditPage').classList.remove('hidden'); initDirectGenbaSession();
  } else if (tabId === 'pica') {
    document.getElementById('picaDashboardPage').classList.remove('hidden'); navPica.classList.remove('opacity-70'); loadPicaDashboardData();
  } else if (tabId === 'nosizu') {
    document.getElementById('nosizuPage').classList.remove('hidden'); loadNOSIZUDashboard();
  } else if (tabId === 'leaderboard') {
    document.getElementById('leaderboardPage').classList.remove('hidden'); navLeaderboard.classList.remove('opacity-70'); loadLeaderboardData();
  } else if (tabId === 'profil') {
    document.getElementById('profilPage').classList.remove('hidden'); navProfil.classList.remove('opacity-70');
    if (currentUser && currentUser.cabang) loadProfilCabangData(currentUser.cabang);
  }
}

function loadOnboardingData() {
  const container = document.getElementById("onboardingGridBox");
  if (!container) return;
  fetch(`${API_URL}?action=getOnboardingFLP`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length <= 1) { container.innerHTML = '<p class="text-xs text-gray-400 italic text-center col-span-full py-8">Belum ada materi video onboarding.</p>'; return; }
    allOnboardingVideos = data.slice(1).map(r => ({ id: r[0], judul: r[1] || 'Judul Video', deskripsi: r[2] || '', videoUrl: r[3] || '', kategori: r[4] || 'Training FLP' }));
    renderOnboardingVideos(allOnboardingVideos);
  });
}

function renderOnboardingVideos(videoList) {
  const container = document.getElementById("onboardingGridBox");
  if (!container) return;
  let html = '';
  videoList.forEach(vid => {
    const embedUrl = formatEmbedVideoUrl(vid.videoUrl);
    html += `
      <div class="bg-nosa-cardBg p-4 rounded-3xl border border-gray-200/80 shadow-xs space-y-3">
        <div class="w-full h-48 rounded-2xl overflow-hidden bg-black border border-gray-300 shadow-inner">
          ${embedUrl ? `<iframe class="w-full h-full" src="${embedUrl}" title="${vid.judul}" frameborder="0" allowfullscreen></iframe>` : '<div class="text-center p-4">🎬 Link tidak valid</div>'}
        </div>
        <div class="space-y-1">
          <span class="inline-block bg-nosa-yellow text-gray-900 text-[9px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider">${vid.kategori}</span>
          <h3 class="text-base font-extrabold text-nosa-green leading-snug">${vid.judul}</h3>
          <p class="text-xs text-gray-600 leading-normal">${vid.deskripsi}</p>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}

function filterOnboardingVideo() {
  const query = document.getElementById("searchVideoInput").value.toLowerCase().trim();
  const filtered = allOnboardingVideos.filter(v => v.judul.toLowerCase().includes(query) || v.deskripsi.toLowerCase().includes(query));
  renderOnboardingVideos(filtered);
}

function formatEmbedVideoUrl(url) {
  if (!url) return '';
  let str = url.trim();
  // Konversi otomatis link Google Drive agar bisa tampil di Iframe Web
  if (str.includes("drive.google.com")) {
    if (str.includes("/view")) {
      return str.replace(/\/view.*/, "/preview");
    }
    const match = str.match(/\/d\/([^\/]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
  }
  if (str.includes("youtube.com/watch?v=")) return `https://www.youtube.com/embed/${str.split("v=")[1].split("&")[0]}`;
  if (str.includes("youtu.be/")) return `https://www.youtube.com/embed/${str.split("youtu.be/")[1].split("?")[0]}`;
  return str;
}
function loadPicaDashboardData() {
  const container = document.getElementById("picaCardsContainer");
  if (!container) return;
  const userCabang = (currentUser && currentUser.cabang) ? currentUser.cabang : "Cibiru";
  fetch(`${API_URL}?action=getPicaList&cabang=${encodeURIComponent(userCabang)}`)
  .then(res => res.json())
  .then(data => {
    if (!Array.isArray(data) || data.length === 0) {
      container.innerHTML = `<div class="bg-nosa-cardBg p-6 rounded-2xl text-center space-y-2 border border-gray-200"><p class="text-2xl">🎉</p><h4 class="font-bold text-nosa-green text-sm">Tidak Ada PICA Aktif!</h4></div>`;
      return;
    }
    let html = '';
    data.forEach(item => {
      const isClosed = item.status === 'Closed' || item.status === 'Verified';
      const isOnCheck = item.status === 'On Check';
      let statusBadge = isClosed ? 'bg-emerald-200 text-emerald-800' : (isOnCheck ? 'bg-amber-200 text-amber-800' : 'bg-red-200 text-red-800');
      html += `
        <div onclick="openPicaModal('${item.idPica}', '${item.item.replace(/'/g, "\\'")}', '${item.status}', '${(item.catatanPerbaikan || '').replace(/'/g, "\\'")}')" class="bg-nosa-cardBg p-4 rounded-2xl border border-gray-200/80 shadow-xs space-y-2 cursor-pointer">
          <div class="flex justify-between items-start"><span class="text-[10px] font-extrabold text-gray-400">${item.idPica}</span><span class="${statusBadge} font-extrabold text-[9px] px-2.5 py-0.5 rounded-full">${item.status}</span></div>
          <h4 class="text-xs font-black text-gray-900">${item.item}</h4>
          <div class="pt-2 flex justify-between items-center text-[10px] border-t border-gray-300/40 text-gray-500"><span>👤 Auditor: ${item.auditor}</span><span>📅 Due: ${formatDateNice(item.dueDate)}</span></div>
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
  if (status === "Open") {
    document.getElementById("modalCabangForm").classList.remove("hidden"); document.getElementById("modalNosForm").classList.add("hidden");
  } else if (status === "On Check") {
    document.getElementById("modalCabangForm").classList.add("hidden"); document.getElementById("modalNosForm").classList.remove("hidden");
    document.getElementById("modalCatatanPerbaikanView").innerText = catatanPerbaikan || "Cabang telah mengunggah bukti perbaikan.";
  } else { alert("PICA ini sudah Closed."); return; }
  document.getElementById("picaActionModal").classList.remove("hidden");
}

function closePicaModal() { document.getElementById("picaActionModal").classList.add("hidden"); }

function submitPicaPerbaikan(newStatus) {
  if (!activePicaId) return;
  fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "updatePicaStatus", idPica: activePicaId, newStatus: newStatus, catatanPerbaikan: document.getElementById("modalCatatanPerbaikan").value.trim() })
  }).then(() => { closePicaModal(); loadPicaDashboardData(); });
}

function submitPicaVerifikasi(newStatus) {
  if (!activePicaId) return;
  fetch(API_URL, {
    method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "updatePicaStatus", idPica: activePicaId, newStatus: newStatus })
  }).then(() => { closePicaModal(); loadPicaDashboardData(); });
}

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
  const levels = [{ id: 1, title: 'Level 1: Dasar NOS' }, { id: 2, title: 'Level 2: Standar Display' }, { id: 3, title: 'Level 3: Proses Servis' }, { id: 4, title: 'Level 4: Handling Konsumen' }];
  levels.forEach((lvl, idx) => {
    const isCompleted = lvl.id < nosUserStats.unit;
    const isCurrent = lvl.id === nosUserStats.unit;
    const alignClass = idx % 2 === 0 ? 'self-start ml-8' : 'self-end mr-8';
    let btnBg = isCompleted ? 'bg-emerald-500 border-emerald-600' : (isCurrent ? 'bg-yellow-400 border-yellow-500 animate-bounce text-black' : 'bg-gray-400 border-gray-500');
    html += `
      <div class="${alignClass} flex flex-col items-center space-y-1">
        <button onclick="startQuizSession(${lvl.id})" ${!isCompleted && !isCurrent ? 'disabled' : ''} class="w-16 h-16 rounded-full border-b-4 flex items-center justify-center text-xl font-black ${btnBg}">${isCompleted ? '✓' : (isCurrent ? '▶' : '🔒')}</button>
        <span class="text-[10px] font-extrabold text-white bg-black/30 px-2 py-0.5 rounded-full">${lvl.title}</span>
      </div>
    `;
  });
  mapBox.innerHTML = html;
}

function startQuizSession(unitId) {
  fetch(`${API_URL}?action=getSoalNOSIZU`).then(res => res.json()).then(data => {
    currentQuestionList = data.slice(1).map(r => ({ id: r[0], unit: r[1], tipe: r[2], pertanyaan: r[3], opsiA: r[4], opsiB: r[5], opsiC: r[6], opsiD: r[7], gambarA: r[8], gambarB: r[9], kunci: String(r[10]).trim(), pembahasan: r[11] }));
    quizIndex = 0;
    document.getElementById("nosizuPage").classList.add("hidden");
    document.getElementById("nosizuQuizContainer").classList.remove("hidden");
    renderCurrentQuestion();
  });
}

function renderCurrentQuestion() {
  if (quizIndex >= currentQuestionList.length) { finishQuizSession(); return; }
  
  // Reset jawaban sebelumnya agar tidak lolos otomatis saat dipencet Periksa
  userSelectedAnswer = null;
  
  const q = currentQuestionList[quizIndex];
  document.getElementById("quizProgressBar").style.width = `${((quizIndex) / currentQuestionList.length) * 100}%`;
  document.getElementById("quizLivesCount").innerText = nosUserStats.nyawa;
  document.getElementById("quizQuestionText").innerText = q.pertanyaan;
  document.getElementById("quizFeedbackPanel").classList.add("hidden");
  
  const box = document.getElementById("quizAnswersBox");
  const tipe = (q.tipe || '').toLowerCase();
  
  // Render opsi berdasarkan TipeSoal di spreadsheet
  if (tipe.includes("perbandingan")) {
    let imgA = formatDriveImgUrl(q.gambarA);
    let imgB = formatDriveImgUrl(q.gambarB);
    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        <div onclick="selectQuizAnswer('A')" id="opt-A" class="quiz-opt border-2 border-gray-200 p-2 rounded-2xl cursor-pointer text-center space-y-1">
          <div class="h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            ${imgA ? `<img src="${imgA}" class="max-h-full max-w-full object-contain">` : '<span class="text-xs text-gray-400">Gambar A</span>'}
          </div>
          <span class="text-xs font-bold text-gray-800">Pilihan A</span>
        </div>
        <div onclick="selectQuizAnswer('B')" id="opt-B" class="quiz-opt border-2 border-gray-200 p-2 rounded-2xl cursor-pointer text-center space-y-1">
          <div class="h-32 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
            ${imgB ? `<img src="${imgB}" class="max-h-full max-w-full object-contain">` : '<span class="text-xs text-gray-400">Gambar B</span>'}
          </div>
          <span class="text-xs font-bold text-gray-800">Pilihan B</span>
        </div>
      </div>
    `;
  } else if (tipe.includes("pernyataan")) {
    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3">
        ${renderOptionBtn('Benar', 'Benar')}
        ${renderOptionBtn('Salah', 'Salah')}
      </div>
    `;
  } else {
    box.innerHTML = `
      ${renderOptionBtn('A', q.opsiA)}
      ${renderOptionBtn('B', q.opsiB)}
      ${renderOptionBtn('C', q.opsiC)}
      ${renderOptionBtn('D', q.opsiD)}
    `;
  }
}

function renderOptionBtn(key, val) {
  if (!val) return '';
  return `<div onclick="selectQuizAnswer('${key}')" id="opt-${key}" class="quiz-opt border-2 border-gray-200 p-3 rounded-2xl flex items-center gap-3 cursor-pointer"><span class="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xs">${key}</span><span class="text-xs text-gray-800 font-semibold">${val}</span></div>`;
}

function selectQuizAnswer(val) {
  userSelectedAnswer = val;
  document.querySelectorAll('.quiz-opt').forEach(el => el.classList.remove('border-red-500', 'bg-red-50'));
  const sel = document.getElementById(`opt-${val}`);
  if (sel) sel.classList.add('border-red-500', 'bg-red-50');
}

function formatDriveImgUrl(rawUrl) {
  if (!rawUrl) return '';
  let str = String(rawUrl).trim();
  if (str.includes('drive.google.com') && str.includes('/d/')) {
    const match = str.match(/\/d\/([^\/]+)/);
    if (match && match[1]) return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return str;
}

function checkAnswer() {
  if (!userSelectedAnswer) {
    alert("Silakan pilih salah satu jawaban terlebih dahulu!");
    return;
  }
  const q = currentQuestionList[quizIndex];
  const isCorrect = String(userSelectedAnswer).trim().toLowerCase() === String(q.kunci).trim().toLowerCase();
  
  const feedbackPanel = document.getElementById("quizFeedbackPanel");
  feedbackPanel.classList.remove("hidden");
  
  if (isCorrect) { 
    nosUserStats.xp += 20; 
    feedbackPanel.className = "p-4 rounded-2xl border bg-emerald-50 border-emerald-300 space-y-2"; 
    document.getElementById("feedbackTitle").innerText = "Hebat! Jawaban Benar"; 
  } else { 
    nosUserStats.nyawa = Math.max(0, nosUserStats.nyawa - 1); 
    feedbackPanel.className = "p-4 rounded-2xl border bg-red-50 border-red-300 space-y-2"; 
    document.getElementById("feedbackTitle").innerText = "Kurang Tepat"; 
  }
  document.getElementById("feedbackText").innerText = q.pembahasan || "";
}

function nextQuestion() { quizIndex++; renderCurrentQuestion(); }
function exitQuiz() { document.getElementById("nosizuQuizContainer").classList.add("hidden"); document.getElementById("nosizuPage").classList.remove("hidden"); loadNOSIZUDashboard(); }
function finishQuizSession() { alert(`Sesi Kuis Selesai! XP: ${nosUserStats.xp}`); exitQuiz(); }

function loadLeaderboardData() {
  const container = document.getElementById("leaderboardListBox");
  fetch(`${API_URL}?action=getLeaderboard`).then(res => res.json()).then(data => {
    let html = '';
    data.forEach((item, idx) => {
      html += `<div class="bg-nosa-cardBg p-3 rounded-2xl border flex justify-between"><div><h4 class="text-xs font-black">${item.nama}</h4><p class="text-[9px] text-gray-500">${item.cabang}</p></div><span class="text-xs font-black text-blue-600">${item.xp} XP</span></div>`;
    });
    container.innerHTML = html;
  });
}

function loadProfilCabangData(cabangName) {
  fetch(`${API_URL}?action=getProfilCabang&cabang=${encodeURIComponent(cabangName)}`).then(res => res.json()).then(res => {
    if (res.status === "success" && res.info) {
      if (res.info.jadwalGenba) document.getElementById("profJadwalGenba").innerText = formatDateNice(res.info.jadwalGenba);
    }
  });
}

window.onload = function() {
  const saved = localStorage.getItem("nosa_user");
  if (saved) {
    try { currentUser = JSON.parse(saved); renderDashboard(currentUser); } catch (e) { localStorage.removeItem("nosa_user"); }
  }
};
