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

// LOGIKA AUTHENTIKASI & SWITCH TAB...
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

// MEMUAT DASHBOARD NOSIZU MAP & STATS
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

// RENDER PATH MAP ZIG-ZAG SEPERTI DUOLINGO
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

// MULAI SESI KUIS DARI LEVEL
function startQuizSession(unitId) {
  if (nosUserStats.nyawa <= 0) {
    alert("Nyawa Anda habis! Tunggu beberapa saat atau perbarui nyawa.");
    return;
  }

  fetch(`${API_URL}?action=getSoalNOSIZU`)
  .then(res => res.json())
  .then(data => {
    if (!data || data.length <= 1) {
      alert("Belum ada soal kuis yang diinput di spreadsheet SoalNOSIZU.");
      return;
    }

    // Filter soal berdasarkan unit / ambil semua
    const rows = data.slice(1);
    currentQuestionList = rows.map(r => ({
      id: r[0],
      unit: r[1],
      tipe: r[2], // 'Pilihan Ganda', 'Perbandingan Gambar', 'Pernyataan'
      pertanyaan: r[3],
      opsiA: r[4], opsiB: r[5], opsiC: r[6], opsiD: r[7],
      gambarA: r[8], gambarB: r[9],
      kunci: String(r[10]).trim(),
      pembahasan: r[11]
    }));

    quizIndex = 0;
    document.getElementById("nosizuPage").classList.add("hidden");
    document.getElementById("nosizuQuizContainer").classList.remove("hidden");
    renderCurrentQuestion();
  });
}

// RENDER KARTU SOAL SESUAI 3 TIPE SOAL
function renderCurrentQuestion() {
  if (quizIndex >= currentQuestionList.length) {
    finishQuizSession();
    return;
  }

  userSelectedAnswer = null;
  const q = currentQuestionList[quizIndex];
  
  // Update Progress & Nyawa
  const pct = ((quizIndex) / currentQuestionList.length) * 100;
  document.getElementById("quizProgressBar").style.width = `${pct}%`;
  document.getElementById("quizLivesCount").innerText = nosUserStats.nyawa;

  document.getElementById("quizQuestionText").innerText = q.pertanyaan;
  document.getElementById("quizFeedbackPanel").classList.add("hidden");
  document.getElementById("btnCheckAnswer").disabled = false;
  document.getElementById("btnCheckAnswer").className = "w-full py-3.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-sm rounded-2xl shadow-md transition cursor-pointer";

  const box = document.getElementById("quizAnswersBox");

  // TIPE 1: PILIHAN GANDA (A, B, C, D)
  if (q.tipe === "Pilihan Ganda") {
    document.getElementById("quizTypeBadge").innerText = "PILIH JAWABAN YANG TEPAT";
    box.innerHTML = `
      ${renderOptionBtn('A', q.opsiA)}
      ${renderOptionBtn('B', q.opsiB)}
      ${renderOptionBtn('C', q.opsiC)}
      ${renderOptionBtn('D', q.opsiD)}
    `;
  }
  // TIPE 2: PERBANDINGAN GAMBAR (SPOT THE DIFFERENCE)
  else if (q.tipe === "Perbandingan Gambar") {
    document.getElementById("quizTypeBadge").innerText = "SPOT THE DIFFERENCE";
    let imgA = formatDriveImg(q.gambarA);
    let imgB = formatDriveImg(q.gambarB);

    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3 pt-1">
        <div onclick="selectQuizAnswer('A')" id="opt-A" class="quiz-opt border-2 border-gray-200 p-2 rounded-2xl flex flex-col items-center cursor-pointer hover:border-red-400 transition">
          <img src="${imgA}" class="w-full h-32 object-contain rounded-xl bg-gray-50">
          <span class="text-xs font-black mt-1">Gambar A</span>
        </div>
        <div onclick="selectQuizAnswer('B')" id="opt-B" class="quiz-opt border-2 border-gray-200 p-2 rounded-2xl flex flex-col items-center cursor-pointer hover:border-red-400 transition">
          <img src="${imgB}" class="w-full h-32 object-contain rounded-xl bg-gray-50">
          <span class="text-xs font-black mt-1">Gambar B</span>
        </div>
      </div>
    `;
  }
  // TIPE 3: PERNYATAAN BENAR ATAU SALAH
  else if (q.tipe === "Pernyataan") {
    document.getElementById("quizTypeBadge").innerText = "PERNYATAAN BENAR ATAU SALAH";
    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3 pt-2">
        <button type="button" onclick="selectQuizAnswer('Benar')" id="opt-Benar" class="quiz-opt py-4 bg-emerald-500 text-white font-extrabold rounded-2xl text-sm shadow-sm transition">
          ✓ Benar
        </button>
        <button type="button" onclick="selectQuizAnswer('Salah')" id="opt-Salah" class="quiz-opt py-4 bg-red-500 text-white font-extrabold rounded-2xl text-sm shadow-sm transition">
          ✕ Salah
        </button>
      </div>
    `;
  }
}

function renderOptionBtn(key, val) {
  if (!val) return '';
  return `
    <div onclick="selectQuizAnswer('${key}')" id="opt-${key}" class="quiz-opt border-2 border-gray-200 p-3 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-red-400 transition">
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

// CEK JAWABAN KUIS & TAMPILKAN FEEDBACK
function checkAnswer() {
  if (!userSelectedAnswer) {
    alert("Pilih salah satu jawaban terlebih dahulu!");
    return;
  }

  const q = currentQuestionList[quizIndex];
  const isCorrect = String(userSelectedAnswer).toLowerCase() === String(q.kunci).toLowerCase();

  const feedbackPanel = document.getElementById("quizFeedbackPanel");
  const feedbackIcon = document.getElementById("feedbackIcon");
  const feedbackTitle = document.getElementById("feedbackTitle");
  const feedbackText = document.getElementById("feedbackText");

  feedbackPanel.classList.remove("hidden");
  document.getElementById("btnCheckAnswer").disabled = true;

  if (isCorrect) {
    nosUserStats.xp += 20;
    feedbackPanel.className = "p-4 rounded-2xl border bg-emerald-50 border-emerald-300 space-y-2";
    feedbackIcon.innerText = "✅";
    feedbackTitle.innerText = "Hebat! Jawaban Tepat";
    feedbackTitle.className = "text-sm font-extrabold text-emerald-900";
  } else {
    nosUserStats.nyawa = Math.max(0, nosUserStats.nyawa - 1);
    feedbackPanel.className = "p-4 rounded-2xl border bg-red-50 border-red-300 space-y-2";
    feedbackIcon.innerText = "❌";
    feedbackTitle.innerText = "Kurang Tepat";
    feedbackTitle.className = "text-sm font-extrabold text-red-900";
  }

  feedbackText.innerText = q.pembahasan || "Langkah perbaikan dan pemahaman standar NOS.";
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
  
  // Update Backend Spreadsheet
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

// MEMUAT DATA LEADERBOARD
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

// NAVIGASI SWITCH TAB
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
