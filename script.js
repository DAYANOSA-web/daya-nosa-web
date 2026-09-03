const API_URL = "https://script.google.com/macros/s/AKfycbylS_vmqMVqqCd4FO5qEWEvNduioq9oQaSFg5UnQTfUi8oBBwrecWbwzs-vh2SF8b3C/exec"; // Ganti dengan URL Apps Script Anda

let activePicaId = null;
let referensiDataCache = [];

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

function switchTab(tabName) {
  const picaBtn = document.getElementById("tabPica");
  const refBtn = document.getElementById("tabReferensi");
  const picaContent = document.getElementById("contentPica");
  const refContent = document.getElementById("contentReferensi");

  if (tabName === 'pica') {
    picaContent.classList.remove("hidden");
    refContent.classList.add("hidden");
    picaBtn.className = "px-4 py-2 font-bold text-sm rounded-lg bg-red-600 text-white";
    refBtn.className = "px-4 py-2 font-bold text-sm rounded-lg text-gray-600 hover:bg-gray-100";
  } else {
    picaContent.classList.add("hidden");
    refContent.classList.remove("hidden");
    refBtn.className = "px-4 py-2 font-bold text-sm rounded-lg bg-red-600 text-white";
    picaBtn.className = "px-4 py-2 font-bold text-sm rounded-lg text-gray-600 hover:bg-gray-100";
  }
}

// Fetch Data PICA
function loadPICAData() {
  const container = document.getElementById("picaContainer");
  container.innerHTML = `<p class="text-gray-500 text-sm">Sedang mengambil data PICA dari Google Sheets...</p>`;

  fetch(`${API_URL}?action=getPICA`)
    .then(res => res.json())
    .then(data => {
      if (data.length <= 1) {
        container.innerHTML = `<p class="text-gray-500 text-sm">Belum ada item PICA.</p>`;
        return;
      }

      let html = "";
      // Loop dari baris ke-2 (skip header)
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
  if (data.length <= 1) {
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
    if (index === 0) return true; // Keep header
    return row.some(cell => String(cell).toLowerCase().includes(keyword));
  });
  renderReferensiCards(filtered);
}

// Variable untuk menampung data gambar
let selectedBase64Image = "";

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

// Fungsi Konversi Foto ke Base64 Data
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
    loadPICAData(); // Reload data PICA
  })
  .catch(err => {
    alert("Gagal mengunggah foto.");
    btn.innerText = "Kirim Bukti";
    btn.disabled = false;
  });
}
