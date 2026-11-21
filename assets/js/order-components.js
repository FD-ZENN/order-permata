// ═══════════════════════════════════════════════
// DYNAMIC COMPONENTS — Permata Wedding
// (Love Stories, Live Streaming, Digital Banks, Entertainment)
// ═══════════════════════════════════════════════

// ─── Love Stories ────────────────────────────────
let storyCount = 0;

const STANDARD_STORY_TITLES = [
  "Pertama Bertemu",
  "Menjalin Hubungan",
  "Lamaran / Khitbah",
  "Menuju Hari Bahagia",
  "Momen Spesial",
  "Lainnya"
];

function handleStoryTitleChange(n) {
  const sel = document.getElementById(`st-title-select-${n}`);
  const customInput = document.getElementById(`st-title-custom-${n}`);
  if (!sel || !customInput) return;
  if (sel.value === "Lainnya") {
    customInput.style.display = "block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
    customInput.value = "";
  }
  syncStoryTitleValue(n);
  if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
}

function syncStoryTitleValue(n) {
  const sel = document.getElementById(`st-title-select-${n}`);
  const customInput = document.getElementById(`st-title-custom-${n}`);
  const hiddenInput = document.getElementById(`st-title-${n}`);
  if (!hiddenInput) return;
  if (sel && sel.value === "Lainnya") {
    hiddenInput.value = customInput ? customInput.value.trim() : "";
  } else if (sel) {
    hiddenInput.value = sel.value;
  }
}

function setStoryTitleValue(n, val) {
  const sel = document.getElementById(`st-title-select-${n}`);
  const customInput = document.getElementById(`st-title-custom-${n}`);
  const hiddenInput = document.getElementById(`st-title-${n}`);
  if (!sel || !hiddenInput) return;

  if (STANDARD_STORY_TITLES.includes(val) && val !== "Lainnya") {
    sel.value = val;
    if (customInput) {
      customInput.style.display = "none";
      customInput.value = "";
    }
  } else if (val) {
    sel.value = "Lainnya";
    if (customInput) {
      customInput.style.display = "block";
      customInput.value = val;
    }
  }
  hiddenInput.value = val || "";
}

function addStory() {
  const n = ++storyCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `st-item-${n}`;

  const defaultStoryPreset = n === 1 ? "Pertama Bertemu" : (n === 2 ? "Menjalin Hubungan" : (n === 3 ? "Lamaran / Khitbah" : (n === 4 ? "Menuju Hari Bahagia" : "Lainnya")));

  el.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeItem('st-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Cerita ${n}</div>
    <div class="form-grid">
      <div class="form-group span-full">
        <label>Judul Cerita <span class="req">*</span></label>
        <select id="st-title-select-${n}" onchange="handleStoryTitleChange(${n})">
          <option value="Pertama Bertemu"${defaultStoryPreset === "Pertama Bertemu" ? " selected" : ""}>Pertama Bertemu</option>
          <option value="Menjalin Hubungan"${defaultStoryPreset === "Menjalin Hubungan" ? " selected" : ""}>Menjalin Hubungan</option>
          <option value="Lamaran / Khitbah"${defaultStoryPreset === "Lamaran / Khitbah" ? " selected" : ""}>Lamaran / Khitbah</option>
          <option value="Menuju Hari Bahagia"${defaultStoryPreset === "Menuju Hari Bahagia" ? " selected" : ""}>Menuju Hari Bahagia</option>
          <option value="Momen Spesial"${defaultStoryPreset === "Momen Spesial" ? " selected" : ""}>Momen Spesial</option>
          <option value="Lainnya"${defaultStoryPreset === "Lainnya" ? " selected" : ""}>Lainnya (Tulis Kustom)</option>
        </select>
        <input type="text" id="st-title-custom-${n}" placeholder="Tulis judul cerita kustom..." style="display:${defaultStoryPreset === "Lainnya" ? "block" : "none"}; margin-top:0.4rem;" oninput="syncStoryTitleValue(${n}); if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave();" />
        <input type="hidden" id="st-title-${n}" value="${defaultStoryPreset}" />
      </div>
      <div class="form-group">
        <label>Tanggal Momen</label>
        <input id="st-date-${n}" type="date" onchange="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group span-full">
        <label>Isi Cerita</label>
        <textarea id="st-content-${n}" placeholder="Ceritakan momen spesial ini..." oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()"></textarea>
      </div>
    </div>`;

  const list = document.getElementById("stories-list");
  if (list) list.appendChild(el);

  syncStoryTitleValue(n);
}

// ─── Live Streaming ──────────────────────────────
let liveCount = 0;

function copyLiveFromEvent(liveIndex, eventIndex) {
  const evName = document.getElementById(`ev-name-${eventIndex}`)?.value || `Acara ${eventIndex}`;
  const evDate = document.getElementById(`ev-date-${eventIndex}`)?.value || "";
  const evStartTime = document.getElementById(`ev-time-start-${eventIndex}`)?.value || "";
  const evEndTime = document.getElementById(`ev-time-end-${eventIndex}`)?.value || "";

  const titleInput = document.getElementById(`lv-title-${liveIndex}`);
  const startInput = document.getElementById(`lv-start-${liveIndex}`);
  const endInput = document.getElementById(`lv-end-${liveIndex}`);

  if (titleInput && evName) {
    titleInput.value = `Live Streaming ${evName}`;
  }
  if (startInput && evDate && evStartTime) {
    startInput.value = `${evDate}T${evStartTime}`;
  }
  if (endInput && evDate && evEndTime) {
    endInput.value = `${evDate}T${evEndTime}`;
  }

  toast(`Jadwal live streaming diselaraskan dengan ${evName}!`, "success");
  if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
}

function getEventOptionsForLiveHtml(n) {
  let buttons = "";
  for (let i = 1; i <= eventCount; i++) {
    const evItem = document.getElementById(`ev-item-${i}`);
    if (evItem) {
      const evName = document.getElementById(`ev-name-${i}`)?.value || `Acara ${i}`;
      buttons += `
        <button type="button" class="btn-copy-mini" onclick="copyLiveFromEvent(${n}, ${i})">
          <span class="material-symbols-outlined" style="font-size:0.9rem;">event_available</span>
          <span>Ambil dari ${evName}</span>
        </button>
      `;
    }
  }
  return buttons;
}

function addLive() {
  const n = ++liveCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `lv-item-${n}`;

  const eventPills = getEventOptionsForLiveHtml(n);

  el.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeItem('lv-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Live Streaming ${n}</div>
    <div class="form-grid">
      <div class="form-group span-full">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;flex-wrap:wrap;gap:0.35rem;">
          <label style="margin:0;">Judul Siaran</label>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            ${eventPills}
          </div>
        </div>
        <input type="text" id="lv-title-${n}" placeholder="Akad Nikah Live" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group span-full">
        <label>URL YouTube / Platform Streaming <span class="req">*</span></label>
        <input type="text" id="lv-url-${n}" placeholder="https://youtube.com/live/..." oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Jadwal Mulai</label>
        <input id="lv-start-${n}" type="datetime-local" onchange="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Jadwal Selesai</label>
        <input id="lv-end-${n}" type="datetime-local" onchange="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
    </div>`;

  const list = document.getElementById("live-list");
  if (list) list.appendChild(el);
}

// ─── Entertainment ───────────────────────────────
let enCount = 0;
function addEntertainment() {
  const n = ++enCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `en-item-${n}`;
  el.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeItem('en-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Hiburan ${n}</div>
    <div class="form-grid">
      <div class="form-group">
        <label>Nama *</label>
        <input type="text" id="en-name-${n}" placeholder="Arseka / pengisi acara" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Jenis</label>
        <input type="text" id="en-type-${n}" placeholder="Campursari / Organ Tunggal / MC" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group span-full">
        <label>Deskripsi</label>
        <textarea id="en-desc-${n}" placeholder="Keterangan singkat..." oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()"></textarea>
      </div>
    </div>`;

  const list = document.getElementById("entertainment-list");
  if (list) list.appendChild(el);
}

// ─── Bank / Digital Wallet ───────────────────────
let bankCount = 0;

const POPULAR_BANKS = ["BCA", "Mandiri", "BRI", "BNI", "BSI", "Bank Jago", "DANA", "GoPay", "OVO", "ShopeePay"];

function setBankPreset(n, bankName) {
  const bankInput = document.getElementById(`bk-bank-${n}`);
  if (bankInput) {
    bankInput.value = bankName;
    if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
  }
}

function cleanAccountNumber(input) {
  const cleaned = input.value.replace(/[^0-9]/g, "");
  if (input.value !== cleaned) {
    input.value = cleaned;
  }
  if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
}

function addBank() {
  const n = ++bankCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `bk-item-${n}`;

  const chipsHtml = POPULAR_BANKS.map((b) => `<span class="quick-chip" onclick="setBankPreset(${n}, '${b}')">${b}</span>`).join("");

  el.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeItem('bk-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Rekening / E-Wallet ${n}</div>
    <div class="form-grid">
      <div class="form-group span-full">
        <label>Pilihan Bank / Dompet Digital <span class="req">*</span></label>
        <div class="quick-chips-wrap">
          ${chipsHtml}
        </div>
        <input type="text" id="bk-bank-${n}" placeholder="BCA / Mandiri / BRI / DANA" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Atas Nama Pemilik Rekening <span class="req">*</span></label>
        <input type="text" id="bk-name-${n}" placeholder="Contoh: Muhammad Agung" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Nomor Rekening / No. HP E-Wallet <span class="req">*</span></label>
        <input type="text" id="bk-number-${n}" placeholder="Nomor rekening tanpa spasi" oninput="cleanAccountNumber(this)" />
      </div>
    </div>`;

  const list = document.getElementById("bank-list");
  if (list) list.appendChild(el);
}

// ─── Remove Item (Global) ────────────────────────
function removeItem(id) {
  const el = document.getElementById(id);
  if (el) {
    const match = id.match(/mu-item-(\d+)/);
    if (match && typeof currentPlayingNumber !== "undefined" && parseInt(match[1]) === currentPlayingNumber) {
      if (typeof stopAllAudioPreview === "function") stopAllAudioPreview();
    }
    el.remove();
    if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
  }
}
