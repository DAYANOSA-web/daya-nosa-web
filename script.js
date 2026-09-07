// Gantilah URL ini jika URL Deployment Google Apps Script kamu diperbarui
const API_URL = "https://script.google.com/macros/s/AKfycbxzlY8Hfge00hXIkhPbn-CkA-pIHUOcpv_ThL7qnKEkM6mC2fVXIUWTlgVsDjqbkwv-/exec";

// ==========================================
// 1. SISTEM AUTENTIKASI & APLIKASI
// ==========================================

function handleLogin() {
  const emailInput = document.getElementById("emailInput").value.trim();
  const loginError = document.getElementById("loginError");
  const loginBtn = document.getElementById("loginBtn");

  if (!emailInput) {
    showError(loginError, "Masukkan email Anda terlebih dahulu!");
    return;
  }

  loginBtn.innerText = "Memeriksa...";
  loginBtn.disabled = true;

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
      loginBtn.innerText = "Masuk ke Aplikasi";
      loginBtn.disabled = false;

      if (data.status === "success") {
        const user = data.userData;
        localStorage.setItem("userEmail", user.email);
        localStorage.setItem("userRole", user.role);
        localStorage.setItem("userName", user.nama);
        localStorage.setItem("userCabang", user.cabang);

function renderDashboard(user) {
  const loginSec = document.getElementById("loginSection");
  const mainDash = document.getElementById("mainDashboard");
  const nameEl = document.getElementById("userDisplayName");
  const roleEl = document.getElementById("userDisplayRole");

  if (loginSec) loginSec.classList.add("hidden");
  if (mainDash) mainDash.classList.remove("hidden");

  if (nameEl) nameEl.innerText = user.nama || "";
  if (roleEl) roleEl.innerText = `${user.role || ""} - ${user.cabang || ""}`;

  loadPICAData();
  loadReferensiData();
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
// 2. DASHBOARD & RENDER TAMPILAN
// ==========================================

function renderDashboard(user) {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("mainDashboard").classList.remove("hidden");

  document.getElementById("userDisplayName").innerText = user.nama;
  document.getElementById("userDisplayRole").innerText = `${user.role} - ${user.cabang}`;

  loadPICAData();
  loadReferensiData();
}

// ==========================================
// 3. FITUR PICA (PROBLEM IDENTIFICATION & CORRECTIVE ACTION)
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
        const [id, cabang, item, prioritas, status, foto, catatan, tgl] = data[i];

        let statusBadge = "bg-yellow-100 text-yellow-800";
        if (status === "Waiting Verification") statusBadge = "bg-blue-100 text-blue-800";
        if (status === "Verified") statusBadge = "bg-green-100 text-green-800";

        let actionButtons = "";

        if (status !== "Verified") {
          actionButtons += '<button onclick="openUploadModal(\'' + id + '\', \'' + item + '\')" class="w-full mt-2 bg-gray-900 hover:bg-black text-white text-xs font-bold py-2.5 rounded-lg transition">📷 Upload Bukti Perbaikan</button>';
        }

        if (currentRole === "NOS Officer" && status === "Waiting Verification") {
          actionButtons += '<button onclick="openVerifyModal(\'' + id + '\', \'' + item + '\')" class="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-lg transition">🔍 Verifikasi Bukti (NOS Officer Only)</button>';
        }

        let linkFotoHtml = '<span class="italic text-gray-400">Belum ada bukti</span>';
        if (foto && foto !== "-" && foto.length > 5) {
          if (foto.startsWith("http")) {
            linkFotoHtml = '<a href="' + foto + '" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline font-semibold">Lihat Bukti Foto</a>';
          } else {
            linkFotoHtml = '<button onclick="viewBase64Image(\'' + id + '\')" class="text-blue-600 underline font-semibold">Lihat Bukti Foto</button>';
          }
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
// 4. MODAL UPLOAD & VERIFIKASI
// ==========================================

let currentUploadId = "";
let base64ImageString = "";

function openUploadModal(idPica, namaItem) {
  currentUploadId = idPica;
  document.getElementById("modalPicaTitle").innerText = `${idPica}: ${namaItem}`;
  document.getElementById("uploadModal").classList.remove("hidden");
  document.getElementById("uploadModal").classList.add("flex");
}

function closeUploadModal() {
  document.getElementById("uploadModal").classList.add("hidden");
  document.getElementById("uploadModal").classList.remove("flex");
  document.getElementById("fileInput").value = "";
  document.getElementById("imagePreview").classList.add("hidden");
  base64ImageString = "";
}

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    base64ImageString = e.target.result;
    const preview = document.getElementById("imagePreview");
    preview.src = base64ImageString;
    preview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

function submitPerbaikan() {
  if (!base64ImageString) {
    alert("Silakan pilih/ambil foto bukti perbaikan terlebih dahulu!");
    return;
  }

  const submitBtn = document.getElementById("submitUploadBtn");
  submitBtn.innerText = "Mengunggah...";
  submitBtn.disabled = true;

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
      submitBtn.innerText = "Mengunggah...";
      submitBtn.disabled = false;

      if (data.status === "success") {
        alert("Bukti perbaikan berhasil diunggah!");
        closeUploadModal();
        loadPICAData();
      } else {
        alert("Gagal simpan: " + data.message);
      }
    })
    .catch(err => {
      console.error(err);
      submitBtn.innerText = "Mengunggah...";
      submitBtn.disabled = false;
      alert("Terjadi kesalahan jaringan.");
    });
}

// ==========================================
// 5. REFERENSI STANDAR & DATA TAMBAHAN
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
            <span class="text-xs font-bold text-red-600">${data[i][0]}</span>
            <h5 class="font-bold text-sm text-gray-800">${data[i][1]}</h5>
            <p class="text-xs text-gray-600">${data[i][2]}</p>
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
// 6. INISIALISASI SAAT HALAMAN SELESAI DIMUAT
// ==========================================
// Cek paling bawah file script.js kamu
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
}); // <--- PASTIKAN ADA ADA KURUNG TUTUP BENAR SEPERTI INI
