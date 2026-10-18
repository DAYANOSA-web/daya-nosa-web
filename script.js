let selectedRole = "Kacab";

function selectRole(role) {
  selectedRole = role;
  document.querySelectorAll('.role-btn').forEach(btn => {
    btn.classList.remove('border-daya-red', 'bg-red-50');
  });
  if(role === 'Kacab') document.getElementById('roleKacab').classList.add('border-daya-red', 'bg-red-50');
  if(role === 'PIC NOS') document.getElementById('rolePic').classList.add('border-daya-red', 'bg-red-50');
  if(role === 'FLP') document.getElementById('roleFlp').classList.add('border-daya-red', 'bg-red-50');
}

function renderMenuByRole(role) {
  const container = document.getElementById("menuGrid");
  if (!container) return;

  let menus = [];

  if (role === "Kacab") {
    menus = [
      { id: 'ref', title: 'referensi standar', sub: 'cek dokumen dan standar NOS', icon: '📖' },
      { id: 'pica', title: 'dashboard PICA', sub: 'lihat performa cabang anda', icon: '📊' },
      { id: 'reminder', title: 'reminder', sub: 'kustomisasi pengingat yang anda butuhkan', icon: '🔔' },
      { id: 'nosizu', title: 'NOSIZU', sub: 'mainkan games dan tambah knowledgemu', icon: '🎮' },
      { id: 'genba', title: 'GENBA', sub: 'ayo lakukan GENBA untuk menjaga standar', icon: '📍' },
      { id: 'profil_cabang', title: 'profil cabang', sub: 'data dan informasi cabang', icon: '🏢' }
    ];
  } else if (role === "PIC NOS") {
    menus = [
      { id: 'ref', title: 'referensi standar', sub: 'isi referensi standar untuk cabang yuk', icon: '📖' },
      { id: 'pica', title: 'dashboard PICA', sub: 'lihat performa cabang nasional', icon: '📊' },
      { id: 'genba', title: 'GENBA', sub: 'ayo lakukan GENBA untuk menjaga standar', icon: '📍' },
      { id: 'nosizu', title: 'NOSIZU', sub: 'ayo tambahkan soal kuiznya', icon: '🎮' },
      { id: 'onboarding', title: 'onboarding FLP', sub: 'tambahin materi untuk FLP yuk', icon: '📋' },
      { id: 'profil_cabang', title: 'profil cabang', sub: 'data dan informasi cabang', icon: '🏢' }
    ];
  } else {
    // FLP Default
    menus = [
      { id: 'ref', title: 'referensi standar', sub: 'cek dokumen standar NOS', icon: '📖' },
      { id: 'pica', title: 'PICA Saya', sub: 'upload bukti perbaikan PICA', icon: '📸' },
      { id: 'nosizu', title: 'NOSIZU Arena', sub: 'mainkan games & kuis harian', icon: '🎮' }
    ];
  }

  let html = '';
  menus.forEach(m => {
    html += `
      <div onclick="switchTab('${m.id}')" class="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-3">
        <div class="text-2xl">${m.icon}</div>
        <div>
          <h4 class="font-extrabold text-xs text-gray-900 capitalize">${m.title}</h4>
          <p class="text-[10px] text-gray-400 font-medium leading-tight mt-0.5">${m.sub}</p>
        </div>
      </div>
    `;
  });
  container.innerHTML = html;
}
