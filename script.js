const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AUkAhnQYmEZ42MF2VGpTzE-lcxM4xY0l602Di_XT-V2ENnCtTDi1-DrEZUJfw0EyXsHXC234dtpZ-Uc6U7skk8aLy3E_egOSqd5J9V00fbBLm-Z6tGOLjP57x48vgOc4eQo96C8RI0CZ-EK3pTIdRM9gB2paSMibPEAQgLX-GJC3FEacm7RYzLVQ24Dflpn4ml6hXZZTkd3fUolWniW04gWQOJ2mjxG7A2iPUJJHzNPqPt9usUOAS4EDtMSKAbqyPA2lmB92mOgXO15yxfe_52dbNyGsLuSf9w&lib=MqyCyoXmwRTnPfNPYXVo4XshS9f0b4REu";

function handleLogin() {
  const email = document.getElementById("emailInput").value;
  const role = document.getElementById("roleSelect").value;

  if (!email) {
    alert("Silakan masukkan email terlebih dahulu!");
    return;
  }

  // Simpan session sederhana
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
  
  const roleBadge = document.getElementById("userRoleBadge");
  const content = document.getElementById("roleContent");

  roleBadge.innerText = `Role: ${role}`;

  if (role === "Kacab") {
    content.innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-lg mb-2">📌 Referensi Standar</h3>
          <p class="text-sm text-gray-600 mb-4">Galeri visual standar NOS & panduan implementasi ukuran banner/materi.</p>
          <button class="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg">Buka Galeri</button>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-lg mb-2">📊 Dashboard PICA</h3>
          <p class="text-sm text-gray-600 mb-4">Pantau item perbaikan dan upload bukti foto perbaikan.</p>
          <button class="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg">Lihat PICA</button>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-lg mb-2">🔔 Reminder & Grooming</h3>
          <p class="text-sm text-gray-600 mb-4">Pengingat seragam harian FLP & jadwal kunjungan GENBA.</p>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-lg mb-2">🏆 Leaderboard CSI</h3>
          <p class="text-sm text-gray-600 mb-4">Posisi peringkat dealer Anda saat ini.</p>
        </div>
      </div>
    `;
  } else if (role === "FLP") {
    content.innerHTML = `
      <div class="space-y-4">
        <div class="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl shadow-md">
          <h3 class="font-bold text-xl mb-1">🎮 Games NOSIZU</h3>
          <p class="text-sm opacity-90 mb-4">Uji pengetahuan standar NOS Anda dan tingkatkan level harian!</p>
          <button class="bg-white text-red-600 font-bold px-5 py-2.5 rounded-lg shadow hover:bg-gray-100">Mulai Kuis Level 1</button>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-lg mb-2">📚 Onboarding & Video NOS</h3>
          <p class="text-sm text-gray-600">Materi pengenalan standar untuk FLP baru.</p>
        </div>
      </div>
    `;
  } else if (role === "NOS Officer") {
    content.innerHTML = `
      <div class="space-y-4">
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-lg mb-2">✅ Verifikasi PICA Cabang</h3>
          <p class="text-sm text-gray-600 mb-4">Tinjau perbaikan yang diunggah oleh Kacab & kirim notifikasi reminder.</p>
          <button class="bg-red-600 text-white text-sm px-4 py-2 rounded-lg">Cek Pengajuan PICA</button>
        </div>
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="font-bold text-lg mb-2">✏️ Kelola Soal NOSIZU & Materi</h3>
          <p class="text-sm text-gray-600">Tambah/edit bank soal kuis dan video onboarding.</p>
        </div>
      </div>
    `;
  }
}