// ISI DENGAN URL WEB APP APPS SCRIPT KAMU!
const API_URL = "https://script.google.com/macros/s/AKfycbxzlY8Hfge00hXIkhPbn-CkA-pIHUOcpv_ThL7qnKEkM6mC2fVXIUWTlgVsDjqbkwv-/exec";

let activePicaId = null;
let referensiDataCache = [];
let selectedBase64Image = "";

let quizData = [];
let currentQuizIndex = 0;
let userScore = 0;

// Logika Login
function handleLogin() {
  const email = document.getElementById("emailInput").value;
  const role = document.getElementById("roleSelect").value;

  if (!email) {
    alert("Silakan masukkan email terlebih dahulu!");
    return;
  }

  localStorage.setItem("userEmail", email);
  localStorage.setItem("userRole", role);

  renderDashboard(role);
}

function handleLogout() {
  localStorage.clear();
  document.getElementById("dashboardSection").classList.add("hidden");
  document.getElementById("loginSection").classList.remove("hidden");
}

function renderDashboard(role) {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("dashboardSection").classList.remove("hidden");
  document.getElementById("userRoleBadge").innerText = `Role: ${role}`;

  loadPICAData();
  loadReferensiData();
}

// Navigasi Tab
function switchTab(tabName) {
  const picaBtn = document.getElementById("tabPica");
  const refBtn = document.getElementById("tabReferensi");
  const nosizuBtn = document.getElementById("tabNosizu");

  const picaContent = document.getElementById("contentPica");
  const refContent = document.getElementById("contentReferensi");
  const nosizuContent = document.getElementById("contentNosizu");

  picaContent.classList.add("hidden");
  refContent.classList.add("hidden");
  nosizuContent.classList.add("hidden");

  const defaultBtnClass = "px-4 py-2 font-bold text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition";
  const activeBtnClass = "px-4 py-2 font-bold text-sm rounded-lg bg-red-600 text-white transition";

  picaBtn.className = defaultBtnClass;
  refBtn.className = defaultBtnClass;
  nosizuBtn.className = defaultBtnClass;

  if (tabName === 'pica') {
    picaContent.classList.remove("hidden");
    picaBtn.className = activeBtnClass;
  } else if (tabName === 'referensi') {
    refContent.classList.remove("hidden");
    refBtn.className = activeBtnClass;
  } else if (tabName === 'nosizu') {
    nosizuContent.classList.remove("hidden");
    nosizuBtn.className = activeBtnClass;
    loadQuizData();
  }
}

// Fetch Data PICA
function loadPICAData() {
  const container = document.getElementById("picaContainer");
  container.innerHTML = `<p class="text-gray-500 text-sm col-span-2">Sedang mengambil data PICA...</p>`;

  fetch(`${API_URL}?action=getPICA`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        container.innerHTML = `<p class="text-gray-500 text-sm col-span-2">Belum ada item PICA.</p>`;
        return;
      }

      let html = "";
      for (let i = 1; i < data.length; i++) {
        const [id, cabang, item, prioritas, status, foto, catatan, tgl] = data[i];
        
        let statusBadge = "bg-yellow-100 text-yellow-800";
        if (status === "Waiting Verification") statusBadge = "bg-blue-100 text-blue-800";
        if (status === "Verified") statusBadge = "bg-green-100 text-green-800";

        html += `
          <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-xs font-bold text-gray-400">${id || '-'} • ${cabang || '-'}</span>
                <h4 class="font-bold text-base text-gray-800 mt-0.5">${item || '-'}</h4>
              </div>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold ${statusBadge}">${status || 'Pending'}</span>
            </div>
            
            <p class="text-xs text-gray-600"><strong>Catatan NOS:</strong> ${catatan || '-'}</p>

            <div class="flex justify-between items-center pt-2 border-t text-xs text-gray-500">
              <span>Prioritas: <strong class="text-red-600">${prioritas || 'Normal'}</strong></span>
              ${foto && foto !== '-' ? `<a href="${foto}" target="_blank" class="text-blue-600 underline font-semibold">Lihat Bukti Foto</a>` : '<span class="italic text-gray-400">Belum ada bukti</span>'}
            </div>

            <button onclick="openUploadModal('${id}', '${item}')" class="w-full mt-2 bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-lg transition">
              📷 Upload Bukti Perbaikan
            </button>
          </div>
        `;
      }
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<p class="text-red-500 text-sm col-span-2">Gagal memuat data PICA. Cek koneksi API Apps Script.</p>`;
    });
}

// Fetch Data Referensi Standar
function loadReferensiData() {
  const container = document.getElementById("referensiContainer");

  fetch(`${API_URL}?action=getReferensi`)
    .then(res => res.json())
    .then(data => {
      referensiDataCache = data;
      renderReferensiCards(data);
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = `<p class="text-red-500 text-sm col-span-2">Gagal memuat data referensi.</p>`;
    });
}

function renderReferensiCards(data) {
  const container = document.getElementById("referensiContainer");
  if (!data || data.length <= 1) {
    container.innerHTML = `<p class="text-gray-500 text-sm col-span-2">Belum ada data referensi.</p>`;
    return;
  }

  let html = "";
  for (let i = 1; i < data.length; i++) {
    const [id, judul, kategori, deskripsi, fungsi, instruksi] = data[i];
    html += `
      <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
        <span class="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">${kategori || 'Standar'}</span>
        <h4 class="font-bold text-md text-gray-800">${judul || '-'}</h4>
        <p class="text-xs text-gray-600">${deskripsi || '-'}</p>
        <div class="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
          <p><strong>Fungsi:</strong> ${fungsi || '-'}</p>
          <p><strong>Instruksi & Spek:</strong> ${instruksi || '-'}</p>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

function filterReferensi() {
  const keyword = document.getElementById("searchRef").value.toLowerCase();
  const filtered = referensiDataCache.filter((row, index) => {
    if (index === 0) return true;
    return row.some(cell => String(cell).toLowerCase().includes(keyword));
  });
  renderReferensiCards(filtered);
}

// Modal Handlers
function openUploadModal(id, title) {
  activePicaId = id;
  selectedBase64Image = "";
  document.getElementById("modalPicaTitle").innerText = `${id}: ${title}`;
  document.getElementById("fotoFileInput").value = "";
  document.getElementById("previewContainer").classList.add("hidden");
  document.getElementById("uploadModal").classList.remove("hidden");
}

function closeUploadModal() {
  document.getElementById("uploadModal").classList.add("hidden");
  selectedBase64Image = "";
}

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    selectedBase64Image = e.target.result;
    const imgPreview = document.getElementById("imagePreview");
    imgPreview.src = selectedBase64Image;
    document.getElementById("previewContainer").classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function submitEvidence() {
  if (!selectedBase64Image) {
    alert("Silakan ambil/pilih foto bukti perbaikan terlebih dahulu!");
    return;
  }

  const btn = document.getElementById("btnSubmitFoto");
  btn.innerText = "Mengunggah...";
  btn.disabled = true;

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "updatePICA",
      idPica: activePicaId,
      status: "Waiting Verification",
      fotoUrl: selectedBase64Image
    })
  })
  .then(res => res.json())
  .then(res => {
    alert("Bukti perbaikan foto berhasil dikirim!");
    btn.innerText = "Kirim Bukti";
    btn.disabled = false;
    closeUploadModal();
    loadPICAData();
  })
  .catch(err => {
    alert("Gagal mengunggah foto.");
    btn.innerText = "Kirim Bukti";
    btn.disabled = false;
  });
}

// Logika Game NOSIZU & Leaderboard
function loadQuizData() {
  const quizBox = document.getElementById("quizBox");
  quizBox.innerHTML = `<p class="text-gray-500 text-sm">Sedang mengambil soal dari Google Sheets...</p>`;

  loadLeaderboard();

  fetch(`${API_URL}?action=getSoalNOSIZU`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        quizBox.innerHTML = `<p class="text-gray-500 text-sm">Belum ada soal kuis di sheet <strong>SoalNOSIZU</strong>.</p>`;
        return;
      }
      quizData = data.slice(1);
      currentQuizIndex = 0;
      userScore = 0;
      document.getElementById("nosizuScore").innerText = `0 PTS`;
      renderQuizCard();
    })
    .catch(err => {
      console.error(err);
      quizBox.innerHTML = `<p class="text-red-500 text-sm">Gagal memuat soal kuis.</p>`;
    });
}

function renderQuizCard() {
  const quizBox = document.getElementById("quizBox");

  if (currentQuizIndex >= quizData.length) {
    submitScoreToLeaderboard(userScore);

    quizBox.innerHTML = `
      <div class="text-center py-8 space-y-3">
        <h3 class="text-2xl font-bold text-green-600">🎉 Misi Level Selesai!</h3>
        <p class="text-sm text-gray-600">Total Skor yang Anda dapatkan: <strong>${userScore} PTS</strong></p>
        <p class="text-xs text-gray-400">Skor Anda telah otomatis dicatat di Leaderboard.</p>
        <button onclick="loadQuizData()" class="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700 transition">Main Lagi</button>
      </div>
    `;
    return;
  }

  const row = quizData[currentQuizIndex];
  const level = row[1] || '1';
  const question = row[2] || 'Pertanyaan tidak ditemukan';
  const optA = row[3] || '-';
  const optB = row[4] || '-';
  const optC = row[5] || '-';
  const optD = row[6] || '-';
  const key = row[7] || '-';

  const options = [optA, optB, optC, optD];

  let optionsHtml = "";
  options.forEach(opt => {
    const escapedOpt = String(opt).replace(/'/g, "\\'");
    const escapedKey = String(key).replace(/'/g, "\\'");
    optionsHtml += `
      <button onclick="checkAnswer('${escapedOpt}', '${escapedKey}')" class="w-full text-left p-4 rounded-xl border border-gray-200 font-semibold text-sm hover:border-red-500 hover:bg-red-50 transition">
        ${opt}
      </button>
    `;
  });

  quizBox.innerHTML = `
    <div class="flex justify-between items-center">
      <span class="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">Level ${level}</span>
      <span class="text-xs font-semibold text-gray-400">Soal ${currentQuizIndex + 1} dari ${quizData.length}</span>
    </div>

    <h4 class="text-lg font-bold text-gray-800 pt-1">${question}</h4>

    <div class="grid grid-cols-1 gap-3 pt-2">
      ${optionsHtml}
    </div>
  `;
}

function checkAnswer(selected, key) {
  if (selected === key) {
    alert("✨ Jawaban Benar! (+10 PTS)");
    userScore += 10;
    document.getElementById("nosizuScore").innerText = `${userScore} PTS`;
  } else {
    alert(`❌ Salah! Jawaban yang benar: ${key}`);
  }
  currentQuizIndex++;
  renderQuizCard();
}

function submitScoreToLeaderboard(score) {
  const email = localStorage.getItem("userEmail") || "Anonim";
  const role = localStorage.getItem("userRole") || "FLP";

  fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "submitScore",
      email: email,
      role: role,
      score: score
    })
  })
  .then(res => res.json())
  .then(() => {
    loadLeaderboard();
  })
  .catch(err => console.error("Gagal simpan skor:", err));
}

function loadLeaderboard() {
  const tbody = document.getElementById("leaderboardBody");
  if (!tbody) return;

  fetch(`${API_URL}?action=getLeaderboard`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-gray-400">Belum ada skor yang tercatat. Be the first!</td></tr>`;
        return;
      }

      const rows = data.slice(1).map(r => ({
        email: r[0],
        role: r[1],
        score: parseInt(r[2]) || 0,
        date: r[3]
      })).sort((a, b) => b.score - a.score);

      let html = "";
      rows.forEach((item, index) => {
        let badgeRank = `<span class="font-bold text-gray-500">#${index + 1}</span>`;
        if (index === 0) badgeRank = `🥇 <span class="font-bold text-yellow-600">#1</span>`;
        if (index === 1) badgeRank = `🥈 <span class="font-bold text-gray-400">#2</span>`;
        if (index === 2) badgeRank = `🥉 <span class="font-bold text-amber-700">#3</span>`;

        html += `
          <tr class="hover:bg-gray-50">
            <td class="p-3 font-semibold">${badgeRank}</td>
            <td class="p-3 font-semibold text-gray-800">${item.email}</td>
            <td class="p-3"><span class="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">${item.role}</span></td>
            <td class="p-3 text-right font-black text-red-600">${item.score} PTS</td>
          </tr>
        `;
      });

      tbody.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500">Gagal memuat leaderboard.</td></tr>`;
    });
}

// Auto-check session saat reload
window.onload = function() {
  const savedRole = localStorage.getItem("userRole");
  if (savedRole) {
    renderDashboard(savedRole);
  }
};
