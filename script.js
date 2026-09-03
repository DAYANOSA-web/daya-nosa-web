const API_URL = "https://script.google.com/macros/s/AKfycbylS_vmqMVqqCd4FO5qEWEvNduioq9oQaSFg5UnQTfUi8oBBwrecWbwzs-vh2SF8b3C/exec"; // Ganti dengan URL Apps Script Anda


let activePicaId = null;
let referensiDataCache = [];
let selectedBase64Image = "";

let quizData = [];
let currentQuizIndex = 0;
let userScore = 0;

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

  // Sembunyikan Semua Tab Konten
  picaContent.classList.add("hidden");
  refContent.classList.add("hidden");
  nosizuContent.classList.add("hidden");

  // Reset Style Tombol
  const defaultBtnClass = "px-4 py-2 font-bold text-sm rounded-lg text-gray-600 hover:bg-gray-100";
  const activeBtnClass = "px-4 py-2 font-bold text-sm rounded-lg bg-red-600 text-white";

  picaBtn.className = defaultBtnClass;
  refBtn.className = defaultBtnClass;
  nosizuBtn.className = defaultBtnClass;

  // Tampilkan Tab Aktif
  if (tabName === 'pica') {
    picaContent.classList.remove("hidden");
    picaBtn.className = activeBtnClass;
  } else if (tabName === 'referensi') {
    refContent.classList.remove("hidden");
    refBtn.className = activeBtnClass;
  } else if (tabName === 'nosizu') {
    nosizuContent.classList.remove("hidden");
    nosizuBtn.className = activeBtnClass;
    loadQuizData(); // Load soal saat tab diklik
  }
}

// Fetch Data PICA
function loadPICAData() {
  const container = document.getElementById("picaContainer");
  container.innerHTML = `<p class="text-gray-500 text-sm">Sedang mengambil data PICA...</p>`;

  fetch(`${API_URL}?action=getPICA`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        container.innerHTML = `<p class="text-gray-500 text-sm">Belum ada item PICA.</p>`;
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
                <span class="text-xs font-bold text-gray-400">${id} • ${cabang}</span>
                <h4 class="font-bold text-lg text-gray-800">${item}</h4>
              </div>
              <span class="text-xs px-2.5 py-1 rounded-full font-bold ${statusBadge}">${status}</span>
            </div>
            
            <p class="text-xs text-gray-600"><strong>Catatan NOS:</strong> ${catatan || '-'}</p>

            <div class="flex justify-between items-center pt-2 border-t text-xs text-gray-500">
              <span>Prioritas: <strong class="text-red-600">${prioritas}</strong></span>
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
      container.innerHTML = `<p class="text-red-500 text-sm">Gagal memuat data PICA.</p>`;
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
    });
}

function renderReferensiCards(data) {
  const container = document.getElementById("referensiContainer");
  if (!data || data.length <= 1) {
    container.innerHTML = `<p class="text-gray-500 text-sm">Belum ada data referensi.</p>`;
    return;
  }

  let html = "";
  for (let i = 1; i < data.length; i++) {
    const [id, judul, kategori, deskripsi, fungsi, instruksi] = data[i];
    html += `
      <div class="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-2">
        <span class="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded">${kategori}</span>
        <h4 class="font-bold text-md text-gray-800">${judul}</h4>
        <p class="text-xs text-gray-600">${deskripsi}</p>
        <div class="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
          <p><strong>Fungsi:</strong> ${fungsi}</p>
          <p><strong>Instruksi & Spek:</strong> ${instruksi}</p>
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

// Logika Kuis NOSIZU
function loadQuizData() {
  const quizBox = document.getElementById("quizBox");
  quizBox.innerHTML = `<p class="text-gray-500 text-sm">Sedang menyiapkan soal kuis...</p>`;

  fetch(`${API_URL}?action=getSoalNOSIZU`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        quizBox.innerHTML = `<p class="text-gray-500 text-sm">Belum ada soal kuis yang tersedia di Google Sheets.</p>`;
        return;
      }
      quizData = data.slice(1);
      currentQuizIndex = 0;
      renderQuizCard();
    })
    .catch(err => {
      quizBox.innerHTML = `<p class="text-red-500 text-sm">Gagal memuat soal kuis.</p>`;
    });
}

function renderQuizCard() {
  const quizBox = document.getElementById("quizBox");

  if (currentQuizIndex >= quizData.length) {
    quizBox.innerHTML = `
      <div class="text-center py-8 space-y-3">
        <h3 class="text-2xl font-bold text-green-600">🎉 Misi Level Selesai!</h3>
        <p class="text-sm text-gray-600">Total Skor yang Anda dapatkan: <strong>${userScore} PTS</strong></p>
        <button onclick="loadQuizData()" class="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl text-sm hover:bg-red-700">Main Lagi</button>
      </div>
    `;
    return;
  }

  const [id, level, question, optA, optB, optC, optD, key] = quizData[currentQuizIndex];
  const options = [optA, optB, optC, optD];

  let optionsHtml = "";
  options.forEach(opt => {
    optionsHtml += `
      <button onclick="checkAnswer('${opt.replace(/'/g, "\\'")}', '${key.replace(/'/g, "\\'")}')" class="w-full text-left p-4 rounded-xl border border-gray-200 font-semibold text-sm hover:border-red-500 hover:bg-red-50 transition">
        ${opt}
      </button>
    `;
  });

  quizBox.innerHTML = `
    <div class="flex justify-between items-center">
      <span class="text-xs font-bold bg-gray-100 px-3 py-1 rounded-full text-gray-600">Level ${level}</span>
      <span class="text-xs font-semibold text-gray-400">Soal ${currentQuizIndex + 1} dari ${quizData.length}</span>
    </div>

    <h4 class="text-lg font-bold text-gray-800 pt-2">${question}</h4>

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
    alert(`❌ Salah! Jawaban yang benar adalah: ${key}`);
  }
  currentQuizIndex++;
  renderQuizCard();
}
