// Ganti dengan URL Web App Apps Script milik kamu
const API_URL = "https://script.google.com/macros/s/AKfycbxzlY8Hfge00hXIkhPbn-CkA-pIHUOcpv_ThL7qnKEkM6mC2fVXIUWTlgVsDjqbkwv-/exec";

// ==========================================
// 1. NAVIGASI TAB
// ==========================================

function switchTab(tabName) {
  const tabPica = document.getElementById("tabPica");
  const tabRef = document.getElementById("tabRef");
  const tabKuis = document.getElementById("tabKuis");

  const btnPica = document.getElementById("tabBtnPica");
  const btnRef = document.getElementById("tabBtnRef");
  const btnKuis = document.getElementById("tabBtnKuis");

  // Sembunyikan semua tab
  if (tabPica) tabPica.classList.add("hidden");
  if (tabRef) tabRef.classList.add("hidden");
  if (tabKuis) tabKuis.classList.add("hidden");

  // Reset style semua tombol
  [btnPica, btnRef, btnKuis].forEach(btn => {
    if (btn) {
      btn.className = "px-4 py-2 text-xs font-bold border-b-2 border-transparent text-gray-500 hover:text-gray-800 transition";
    }
  });

  // Tampilkan tab yang dipilih
  if (tabName === "pica") {
    if (tabPica) tabPica.classList.remove("hidden");
    if (btnPica) btnPica.className = "px-4 py-2 text-xs font-bold border-b-2 border-red-600 text-red-600 transition";
  } else if (tabName === "ref") {
    if (tabRef) tabRef.classList.remove("hidden");
    if (btnRef) btnRef.className = "px-4 py-2 text-xs font-bold border-b-2 border-red-600 text-red-600 transition";
  } else if (tabName === "kuis") {
    if (tabKuis) tabKuis.classList.remove("hidden");
    if (btnKuis) btnKuis.className = "px-4 py-2 text-xs font-bold border-b-2 border-red-600 text-red-600 transition";
  }
}

// ==========================================
// 2. AUTENTIKASI & LOGOUT
// ==========================================

function handleLogin() {
  const emailInput = document.getElementById("emailInput").value.trim();
  const loginError = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  if (!emailInput) {
    showError(loginError, "Masukkan email Anda terlebih dahulu!");
    return;
  }

  if (loginBtn) {
    loginBtn.innerText = "Memeriksa...";
    loginBtn.disabled = true;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "loginUser",
      email: emailInput
    })
  })
    .then(res => res.json())
    .then(data => {
      if (loginBtn) {
        loginBtn.innerText = "Masuk ke Aplikasi";
        loginBtn.disabled = false;
      }

      if (data.status === "success") {
        const user = data.userData;
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userName", user.nama);
        localStorage.setItem("userCabang", user.cabang);

        renderDashboard(user);
      } else {
        showError(loginError, data.message || "Email tidak terdaftar!");
      }
    })
    .catch(err => {
      console.error(err);
      if (loginBtn) {
        loginBtn.innerText = "Masuk ke Aplikasi";
        loginBtn.disabled = false;
      }
      showError(loginError, "Gagal terhubung ke server database.");
    });
}

function handleLogout() {
  localStorage.clear();
  location.reload();
}

function showError(el, msg) {
  if (el) {
    el.innerText = msg;
    el.classList.remove("hidden");
  }
}

// ==========================================
// 3. TAMPILAN DASHBOARD
// ==========================================

function renderDashboard(user) {
  const loginSec = document.getElementById("loginSection");
  const mainDash = document.getElementById("mainDashboard");
  const nameEl = document.getElementById("userDisplayName");
  const roleEl = document.getElementById("userDisplayRole");

  if (loginSec) loginSec.classList.add("hidden");
  if (mainDash) mainDash.classList.remove("hidden");

  if (nameEl) nameEl.innerText = user.nama || "";
  if (roleEl) roleEl.innerText = `${user.role || ""} - ${user.cabang || ""}`;

  switchTab("pica");
  loadPICAData();
  loadReferensiData();
}

// ==========================================
// 4. AMBIL DATA PICA
// ==========================================

function loadPICAData() {
  const container = document.getElementById("picaContainer");
  if (!container) return;

  const currentRole = localStorage.getItem("userRole") || "FLP";
  container.innerHTML = '<p class="text-gray-500 text-sm col-span-2">Sedang mengambil data PICA...</p>';

  fetch(`${API_URL}?action=getPICA`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        container.innerHTML = '<p class="text-gray-500 text-sm col-span-2">Belum ada item PICA.</p>';
        return;
      }

      let html = "";
      for (let i = 1; i < data.length; i++) {
        const [id, cabang, item, prioritas, status, foto, catatan] = data[i];

        let statusBadge = "bg-yellow-100 text-yellow-800";
        if (status === "Waiting Verification") statusBadge = "bg-blue-100 text-blue-800";
        if (status === "Verified") statusBadge = "bg-green-100 text-green-800";

        let actionButtons = "";

        if (status !== "Verified") {
          actionButtons += '<button onclick="openUploadModal(\'' + id + '\', \'' + item + '\')" class="w-full mt-2 bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-lg transition">📷 Upload Bukti Perbaikan</button>';
        }

        let linkFotoHtml = '<span class="italic text-gray-400">Belum ada bukti</span>';
        if (foto && foto !== "-" && foto.length > 5) {
          linkFotoHtml = '<a href="' + foto + '" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold">Lihat Bukti Foto</a>';
        }

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
              ${linkFotoHtml}
            </div>

            ${actionButtons}
          </div>
        `;
      }
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<p class="text-red-500 text-sm col-span-2">Gagal memuat data PICA.</p>';
    });
}

// ==========================================
// 5. UPLOAD BUKTI FOTO
// ==========================================

let currentUploadId = "";
let base64ImageString = "";

function openUploadModal(idPica, namaItem) {
  currentUploadId = idPica;
  const titleEl = document.getElementById("modalPicaTitle");
  const modal = document.getElementById("uploadModal");

  if (titleEl) titleEl.innerText = `${idPica}: ${namaItem}`;
  if (modal) {
    modal.classList.remove("hidden");
    modal.classList.add("flex");
  }
}

function closeUploadModal() {
  const modal = document.getElementById("uploadModal");
  const fileInp = document.getElementById("fileInput");
  const preview = document.getElementById("imagePreview");

  if (modal) {
    modal.classList.add("hidden");
    modal.classList.remove("flex");
  }
  if (fileInp) fileInp.value = "";
  if (preview) preview.classList.add("hidden");
  
  base64ImageString = "";
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    base64ImageString = e.target.result;
    const preview = document.getElementById("imagePreview");
    if (preview) {
      preview.src = base64ImageString;
      preview.classList.remove("hidden");
    }
  };
  reader.readAsDataURL(file);
}

function submitPerbaikan() {
  if (!base64ImageString) {
    alert("Silakan pilih/ambil foto bukti perbaikan terlebih dahulu!");
    return;
  }

  const submitBtn = document.getElementById("submitUploadBtn");
  if (submitBtn) {
    submitBtn.innerText = "Mengunggah...";
    submitBtn.disabled = true;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "updatePICA",
      idPica: currentUploadId,
      status: "Waiting Verification",
      fotoUrl: base64ImageString
    })
  })
    .then(res => res.json())
    .then(data => {
      if (submitBtn) {
        submitBtn.innerText = "Kirim Bukti";
        submitBtn.disabled = false;
      }

      if (data.status === "success") {
        alert("Bukti perbaikan berhasil diunggah!");
        closeUploadModal();
        loadPICAData();
      } else {
        alert("Gagal menyimpan: " + data.message);
      }
    })
    .catch(err => {
      console.error(err);
      if (submitBtn) {
        submitBtn.innerText = "Kirim Bukti";
        submitBtn.disabled = false;
      }
      alert("Terjadi kesalahan jaringan.");
    });
}
function loadKuisData() {
  const container = document.getElementById("kuisContainer");
  if (!container) return;

  container.innerHTML = '<p class="text-gray-500 text-sm">Sedang memuat data kuis...</p>';

  fetch(`${API_URL}?action=getKuis`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Belum ada soal di tab SoalNOSIZU.</p>';
        return;
      }

      let html = "";
      // Loop mulai baris ke-2 (indeks 1) untuk lewati header
      for (let i = 1; i < data.length; i++) {
        const [id, level, pertanyaan, optA, optB, optC, optD, kunci] = data[i];

        // Pastikan baris tidak kosong
        if (!pertanyaan) continue;

        html += `
          <div class="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div class="flex justify-between items-center">
              <span class="text-xs font-bold text-red-600 uppercase tracking-wider">${id || 'SOAL'} • Level ${level || '1'}</span>
              <span class="text-xs text-gray-400 font-semibold">Soal ${i} dari ${data.length - 1}</span>
            </div>
            <h4 class="text-base font-bold text-gray-800">${pertanyaan}</h4>

            <div class="space-y-2">
              <button onclick="checkAnswer(this, \`${kunci}\`, \`${optA}\`)" class="w-full text-left p-3 text-xs rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition">
                A. ${optA}
              </button>
              <button onclick="checkAnswer(this, \`${kunci}\`, \`${optB}\`)" class="w-full text-left p-3 text-xs rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition">
                B. ${optB}
              </button>
              <button onclick="checkAnswer(this, \`${kunci}\`, \`${optC}\`)" class="w-full text-left p-3 text-xs rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition">
                C. ${optC}
              </button>
              <button onclick="checkAnswer(this, \`${kunci}\`, \`${optD}\`)" class="w-full text-left p-3 text-xs rounded-xl border border-gray-200 hover:bg-gray-50 font-medium transition">
                D. ${optD}
              </button>
            </div>

            <div class="quizFeedback hidden p-3 rounded-xl text-xs font-bold mt-2"></div>
          </div>
        `;
      }
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<p class="text-red-500 text-sm">Gagal memuat kuis dari database.</p>';
    });
}

function checkAnswer(btn, kunci, pilihanTeks) {
  const parentCard = btn.closest(".bg-white");
  const buttons = parentCard.querySelectorAll("button");
  const feedback = parentCard.querySelector(".quizFeedback");

  // Matikan semua tombol di soal ini setelah diklik
  buttons.forEach(b => b.disabled = true);

  // Bersihkan spasi berlebih untuk perbandingan
  const cleanKunci = String(kunci).trim().toLowerCase();
  const cleanPilihan = String(pilihanTeks).trim().toLowerCase();

  if (cleanPilihan === cleanKunci) {
    btn.classList.add("bg-green-100", "border-green-500", "text-green-900");
    feedback.innerText = "🎉 Jawaban Anda Benar!";
    feedback.className = "quizFeedback p-3 rounded-xl text-xs font-bold mt-2 bg-green-50 border border-green-200 text-green-800 block";
  } else {
    btn.classList.add("bg-red-100", "border-red-500", "text-red-900");
    feedback.innerText = `❌ Jawaban Kurang Tepat. Jawaban yang benar: "${kunci}"`;
    feedback.className = "quizFeedback p-3 rounded-xl text-xs font-bold mt-2 bg-red-50 border border-red-200 text-red-800 block";
  }
}
// ==========================================
// 6. REFERENSI DATA
// ==========================================

function loadReferensiData() {
  const container = document.getElementById("referensiContainer");
  if (!container) return;

  fetch(`${API_URL}?action=getReferensi`)
    .then(res => res.json())
    .then(data => {
      if (!data || data.length <= 1) {
        container.innerHTML = '<p class="text-gray-500 text-sm">Tidak ada data referensi.</p>';
        return;
      }

      let html = "";
      for (let i = 1; i < data.length; i++) {
        html += `
          <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm space-y-1">
            <span class="text-xs font-bold text-red-600">${data[i][0] || ''}</span>
            <h5 class="font-bold text-sm text-gray-800">${data[i][1] || ''}</h5>
            <p class="text-xs text-gray-600">${data[i][2] || ''}</p>
          </div>
        `;
      }
      container.innerHTML = html;
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<p class="text-red-500 text-sm">Gagal memuat data referensi.</p>';
    });
}

// ==========================================
// 7. KUIS NOSIZU
// ==========================================

function checkAnswer(btn, isCorrect) {
  const resEl = document.getElementById("quizResult");
  if (isCorrect) {
    btn.classList.add("bg-green-100", "border-green-500", "text-green-900");
    if (resEl) {
      resEl.innerText = "🎉 Benar! Tepat sekali sesuai dengan panduan standar NOSIZU.";
      resEl.className = "p-4 rounded-xl bg-green-50 border border-green-200 text-xs text-green-800 font-bold block";
    }
  } else {
    btn.classList.add("bg-red-100", "border-red-500", "text-red-900");
    if (resEl) {
      resEl.innerText = "❌ Kurang tepat, silakan pelajari kembali panduan di tab Referensi Standar.";
      resEl.className = "p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-bold block";
    }
  }
}

// ==========================================
// 8. INISIALISASI SETELAH HALAMAN READY
// ==========================================

document.addEventListener("DOMContentLoaded", function () {
  const savedEmail = localStorage.getItem("userEmail");
  const savedRole = localStorage.getItem("userRole");
  const savedName = localStorage.getItem("userName");
  const savedCabang = localStorage.getItem("userCabang");

  if (savedEmail && savedRole) {
    renderDashboard({
      email: savedEmail,
      nama: savedName,
      role: savedRole,
      cabang: savedCabang
    });
  }
});
