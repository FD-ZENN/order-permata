// ═══════════════════════════════════════════════
// MUSIC & AUDIO PREVIEW — Permata Wedding
// ═══════════════════════════════════════════════

const CDN_API_URL = "https://content.permatawedding.com/api/music.php";

// Preset default (sebagai fallback cadangan jika koneksi lambat/offline)
let MUSIC_PRESETS = [
  { title: "Sinarengan",  artist: "Permata Wedding", url: "https://invitation.permatawedding.com/templates/assets/sinarengan.mp3" },
  { title: "Kabagyan",    artist: "Permata Wedding", url: "https://invitation.permatawedding.com/templates/assets/kabagyan.mp3" },
  { title: "Pujaningsih", artist: "Permata Wedding", url: "https://invitation.permatawedding.com/templates/assets/pujaningsih.mp3" },
  { title: "Smaragita",   artist: "Permata Wedding", url: "https://invitation.permatawedding.com/templates/assets/smaragita.mp3" },
];

// State Audio Player untuk Preview
let currentPreviewAudio = null;
let currentPlayingNumber = null;
let musicCount = 0;

/**
 * Mengambil daftar musik terbaru secara otomatis dari CDN Permata Wedding
 */
async function loadMusicPresetsFromCDN() {
  try {
    const res = await fetch(CDN_API_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();

    if (Array.isArray(data) && data.length > 0) {
      // Petakan field API CDN: 'judul', 'artist' / 'penyanyi', 'url'
      MUSIC_PRESETS = data.map((item) => ({
        title:  item.judul || item.title || "Tanpa Judul",
        artist: item.artist || item.penyanyi || "Permata Wedding",
        url:    item.url
      }));

      // Perbarui dropdown pilihan musik yang sudah terlanjur terbuka di layar
      refreshAllMusicDropdowns();
    }
  } catch (err) {
    console.warn("[CDN Musik] Menggunakan preset cadangan lokal:", err.message);
  }
}

/**
 * Helper untuk menyusun tag <option> dari preset
 */
function getMusicPresetOptionsHtml() {
  return MUSIC_PRESETS.map((m, i) =>
    `<option value="${i}">${m.title} — ${m.artist}</option>`
  ).join("");
}

/**
 * Memperbarui isi dropdown pada elemen musik yang sudah ada
 */
function refreshAllMusicDropdowns() {
  for (let i = 1; i <= musicCount; i++) {
    const select = document.getElementById(`mu-preset-${i}`);
    if (select) {
      const currentVal = select.value;
      select.innerHTML = `
        <option value="">— Pilih Musik Permata Wedding —</option>
        ${getMusicPresetOptionsHtml()}
      `;
      select.value = currentVal;
    }
  }
}

function addMusic() {
  const n = ++musicCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `mu-item-${n}`;

  // Default pilih lagu pertama jika ada
  const defaultIdx = MUSIC_PRESETS.length > 0 ? "0" : "";
  const defaultMusic = MUSIC_PRESETS[0] || { title: "Sinarengan", artist: "Permata Wedding", url: "https://invitation.permatawedding.com/templates/assets/sinarengan.mp3" };

  el.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeItem('mu-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Musik Latar ${n}</div>
    <div class="form-grid">
      <div class="form-group span-full">
        <label>Pilihan Musik</label>
        <div style="display:flex;gap:8px;align-items:stretch;">
          <select id="mu-preset-${n}" onchange="applyMusicPreset(${n})" style="flex:1;">
            <option value="">— Pilih Musik Permata Wedding —</option>
            ${getMusicPresetOptionsHtml()}
          </select>
          <button type="button" id="mu-btn-preview-${n}" class="btn-play-preview" onclick="togglePlayPreview(${n})">
            <span class="material-symbols-outlined" id="mu-icon-${n}" style="font-size:1.1rem;">play_arrow</span>
            <span id="mu-label-${n}">Putar</span>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label>Judul Lagu <span class="req">*</span></label>
        <input type="text" id="mu-title-${n}" value="${defaultMusic.title}" placeholder="Judul lagu" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Penyanyi / Artis</label>
        <input type="text" id="mu-artist-${n}" value="${defaultMusic.artist}" placeholder="Nama artis / penyanyi" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>

      <!-- URL Audio & Opsi Disembunyikan (Default Aktif) -->
      <input type="hidden" id="mu-url-${n}" value="${defaultMusic.url}" />
      <input type="checkbox" id="mu-auto-${n}" checked style="display:none;" />
      <input type="checkbox" id="mu-loop-${n}" checked style="display:none;" />
    </div>`;

  const list = document.getElementById("music-list");
  if (list) list.appendChild(el);

  // Set default selection
  const selectEl = document.getElementById(`mu-preset-${n}`);
  if (selectEl && defaultIdx !== "") {
    selectEl.value = defaultIdx;
  }
}

function applyMusicPreset(n) {
  const select = document.getElementById(`mu-preset-${n}`);
  if (!select) return;
  const idx = select.value;
  if (idx === "" || !MUSIC_PRESETS[idx]) return;
  const m = MUSIC_PRESETS[idx];
  const titleEl = document.getElementById(`mu-title-${n}`);
  const artistEl = document.getElementById(`mu-artist-${n}`);
  const urlEl = document.getElementById(`mu-url-${n}`);

  if (titleEl) titleEl.value  = m.title;
  if (artistEl) artistEl.value = m.artist;
  if (urlEl) urlEl.value    = m.url;

  // Jika lagu ini sedang berputar lalu user memilih lagu lain, hentikan dulu
  if (currentPlayingNumber === n) {
    stopAllAudioPreview();
  }
  if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
}

/**
 * ─── Logika Audio Preview (Play / Pause) ───────────────────────
 */
function togglePlayPreview(n) {
  const urlInput = document.getElementById(`mu-url-${n}`);
  const url = urlInput ? urlInput.value.trim() : "";

  if (!url) {
    toast("Silakan pilih musik dari dropdown terlebih dahulu.", "warning");
    return;
  }

  const btn = document.getElementById(`mu-btn-preview-${n}`);
  const icon = document.getElementById(`mu-icon-${n}`);
  const label = document.getElementById(`mu-label-${n}`);

  // 1. Jika tombol yang diklik adalah audio yang SEDANG berputar -> PAUSE / JEDA
  if (currentPlayingNumber === n && currentPreviewAudio && !currentPreviewAudio.paused) {
    currentPreviewAudio.pause();
    resetPreviewButton(n);
    return;
  }

  // 2. Hentikan audio sebelumnya jika ada yang sedang berputar di item lain
  stopAllAudioPreview();

  // 3. Buat dan mainkan audio baru
  currentPreviewAudio = new Audio(url);
  currentPlayingNumber = n;

  // Ubah status tombol menjadi Aktif
  if (btn) btn.classList.add("playing");
  if (icon) icon.textContent = "pause";
  if (label) label.textContent = "Jeda";

  // Event saat lagu selesai berputar
  currentPreviewAudio.onended = () => {
    resetPreviewButton(n);
    currentPreviewAudio = null;
    currentPlayingNumber = null;
  };

  // Event jika URL tidak valid / file audio gagal dimuat
  currentPreviewAudio.onerror = () => {
    toast("Gagal memutar audio! Format audio mungkin tidak didukung.", "error");
    resetPreviewButton(n);
    currentPreviewAudio = null;
    currentPlayingNumber = null;
  };

  // Putar lagu
  currentPreviewAudio.play().catch((err) => {
    console.warn("Autoplay dicegah browser:", err);
    resetPreviewButton(n);
  });
}

/**
 * Mereset tampilan tombol preview ke status awal
 */
function resetPreviewButton(n) {
  const btn = document.getElementById(`mu-btn-preview-${n}`);
  const icon = document.getElementById(`mu-icon-${n}`);
  const label = document.getElementById(`mu-label-${n}`);
  if (btn) btn.classList.remove("playing");
  if (icon) icon.textContent = "play_arrow";
  if (label) label.textContent = "Putar";
}

/**
 * Menghentikan semua pemutaran preview audio yang sedang berjalan
 */
function stopAllAudioPreview() {
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio.currentTime = 0;
    currentPreviewAudio = null;
  }
  if (currentPlayingNumber !== null) {
    resetPreviewButton(currentPlayingNumber);
    currentPlayingNumber = null;
  }
}
