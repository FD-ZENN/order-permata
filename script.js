// ═══════════════════════════════════════════════
// CONFIG — Mode Unified (Relatif & Otomatis)
// ═══════════════════════════════════════════════
const API_BASE = window.location.origin.includes('localhost')
  ? `${window.location.origin}/order-permata/api`
  : `${window.location.origin}/api`;

const BASE_DOMAIN = window.location.origin.includes('localhost')
  ? `${window.location.origin}/order-permata`
  : window.location.origin;
const WA_ADMIN = "+6285741773941";

// Helper mendapatkan tahun acara dinamis dari form Step 3 (Events)
function getEventYear() {
  const events = collectEvents();
  if (events && events.length > 0 && events[0].start_time) {
    const d = new Date(events[0].start_time);
    if (!isNaN(d.getFullYear()) && d.getFullYear() >= 2020) {
      return String(d.getFullYear());
    }
  }
  return String(new Date().getFullYear());
}

function getInvitationUrl(slug) {
  if (ORDER.invitationUrl) {
    return ORDER.invitationUrl.startsWith("http")
      ? ORDER.invitationUrl
      : `${BASE_DOMAIN}${ORDER.invitationUrl.startsWith("/") ? "" : "/"}${ORDER.invitationUrl}`;
  }
  const year = ORDER.eventYear || getEventYear();
  return `${BASE_DOMAIN}/${year}/${slug}`;
}

// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const ORDER = {
  selectedTheme: null,
  groomPhotoUrl: "",
  bridePhotoUrl: "",
  galleryFiles: [],
  galleryUrls: [],
  orderId: null,
  orderCode: "",
  coupleId: null,
  eventYear: "",
  invitationUrl: "",
};

let currentStep = 1;
const TOTAL_STEPS = 7;
let allThemes = [];

// Slug validation state & debounce
const slugCheckState = {
  slug: "",
  checking: false,
  available: null,
  checked: false,
};
let slugDebounceTimer = null;

// ═══════════════════════════════════════════════
// API Helper
// ═══════════════════════════════════════════════
async function apiPublic(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || res.statusText);
  return json.data ?? json;
}

async function uploadPublic(file, folder, label) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  fd.append("label", label);
  const res = await fetch(API_BASE + "/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Upload gagal");
  return json.data.url;
}

async function uploadMultiPublic(files, folder, label) {
  if (!files || !files.length) return [];
  const fd = new FormData();
  let validCount = 0;
  for (const f of files) {
    if (f && f.size > 0) {
      fd.append("files[]", f);
      validCount++;
    }
  }
  if (validCount === 0) return [];

  fd.append("folder", folder);
  fd.append("label", label);
  const res = await fetch(API_BASE + "/upload-multi", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || "Upload gagal");
  return json.data?.urls || [];
}

// ═══════════════════════════════════════════════
// Toast
// ═══════════════════════════════════════════════
function toast(msg, type = "info") {
  const map = { success: "toast-success", error: "toast-error", info: "toast-info" };
  const el = document.createElement("div");
  el.className = `toast ${map[type] || "toast-info"}`;
  el.textContent = msg;
  document.getElementById("toast-container").appendChild(el);
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 350);
  }, 3500);
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
const getV = (id) => {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
};
const slug = () => getV("o-slug");

function folderCouple() {
  const s = slug();
  return s ? `${s}/couple` : "";
}
function folderGallery() {
  const s = slug();
  return s ? `${s}/gallery` : "";
}

function triggerUpload(inputId) {
  document.getElementById(inputId)?.click();
}

// ═══════════════════════════════════════════════
// Auto-Check Slug Availability & Generator
// ═══════════════════════════════════════════════
function cleanSlug(text) {
  return (text || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function checkSlugAvailability(rawSlug) {
  const slugVal = cleanSlug(rawSlug);
  const icon = document.getElementById("slug-status-icon");
  const feedback = document.getElementById("slug-feedback");
  const input = document.getElementById("o-slug");

  if (!slugVal) {
    slugCheckState.slug = "";
    slugCheckState.available = null;
    slugCheckState.checked = false;
    slugCheckState.checking = false;
    if (icon) icon.style.display = "none";
    if (feedback) {
      feedback.style.color = "var(--text-light)";
      feedback.textContent = "Hanya huruf kecil, angka, dan tanda hubung (-)";
    }
    if (input) input.style.borderColor = "";
    return;
  }

  // Validasi format
  if (!/^[a-z0-9-]+$/.test(slugVal)) {
    slugCheckState.available = false;
    slugCheckState.checked = true;
    if (icon) {
      icon.style.display = "inline";
      icon.innerHTML = `<span style="color: #ba1a1a;">✕</span>`;
    }
    if (feedback) {
      feedback.style.color = "#ba1a1a";
      feedback.textContent = "Format tidak valid. Hanya huruf kecil, angka, dan tanda hubung (-)";
    }
    if (input) input.style.borderColor = "#ba1a1a";
    return;
  }

  // Tampilkan indikator loading
  slugCheckState.checking = true;
  if (icon) {
    icon.style.display = "inline";
    icon.innerHTML = `<span style="color: var(--primary); font-size: 0.9rem; animation: spin 1s infinite linear;">⌛</span>`;
  }
  if (feedback) {
    feedback.style.color = "var(--text-light)";
    feedback.textContent = `Memeriksa ketersediaan '${slugVal}'...`;
  }

  try {
    const res = await apiPublic("GET", `/couples?slug_url=${encodeURIComponent(slugVal)}&limit=1`);
    const total = res.pagination ? res.pagination.total : (Array.isArray(res.items) ? res.items.length : 0);
    const isAvailable = total === 0;

    slugCheckState.slug = slugVal;
    slugCheckState.available = isAvailable;
    slugCheckState.checked = true;
    slugCheckState.checking = false;

    if (isAvailable) {
      if (icon) {
        icon.style.display = "inline";
        icon.innerHTML = `<span style="color: #1b873f; font-weight: bold;">✓</span>`;
      }
      if (feedback) {
        feedback.style.color = "#1b873f";
        feedback.textContent = `Slug '${slugVal}' tersedia! Link: permatawedding.com/${slugVal}`;
      }
      if (input) input.style.borderColor = "#1b873f";
    } else {
      if (icon) {
        icon.style.display = "inline";
        icon.innerHTML = `<span style="color: #ba1a1a; font-weight: bold;">✕</span>`;
      }
      if (feedback) {
        feedback.style.color = "#ba1a1a";
        feedback.textContent = `Slug '${slugVal}' sudah digunakan, silakan coba kombinasi lain.`;
      }
      if (input) input.style.borderColor = "#ba1a1a";
    }
  } catch (err) {
    slugCheckState.checking = false;
    if (feedback) {
      feedback.style.color = "#ba1a1a";
      feedback.textContent = "Gagal memeriksa ketersediaan slug: " + err.message;
    }
  }
}

function handleSlugInput(val) {
  clearTimeout(slugDebounceTimer);
  slugDebounceTimer = setTimeout(() => {
    checkSlugAvailability(val);
  }, 400);
}

function autoGenerateSlugIfEmpty() {
  const slugInput = document.getElementById("o-slug");
  if (!slugInput) return;

  // Jika user sudah mengetik slug sendiri secara manual, jangan ditimpa
  if (slugInput.dataset.manual === "true" && slugInput.value.trim() !== "") return;

  const gNick = getV("g-nick") || getV("g-name").split(/[\s,]+/)[0] || "";
  const bNick = getV("b-nick") || getV("b-name").split(/[\s,]+/)[0] || "";

  if (gNick && bNick) {
    const generated = cleanSlug(`${gNick}-${bNick}`);
    if (generated && slugInput.value !== generated) {
      slugInput.value = generated;
      checkSlugAvailability(generated);
    }
  }
}

// ─── Upload foto single + preview ───────────────
async function handleSingleUpload(input, previewId, labelId, folderFn, uploadLabel = "foto") {
  const file = input.files[0];
  if (!file) return;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) return toast("Format: JPEG, PNG, atau WebP", "error");
  if (file.size > 20 * 1024 * 1024) return toast("Maks. 20 MB", "error");

  const label = document.getElementById(labelId);
  if (label) label.textContent = "Mengupload...";

  try {
    const folder = typeof folderFn === "function" ? folderFn() : folderFn;
    if (!folder) {
      toast("Isi Slug URL terlebih dahulu", "error");
      if (label) label.textContent = "Klik untuk upload foto";
      return;
    }
    const url = await uploadPublic(file, folder, uploadLabel);

    if (previewId === "groom-photo-preview") ORDER.groomPhotoUrl = url;
    if (previewId === "bride-photo-preview") ORDER.bridePhotoUrl = url;

    const img = document.getElementById(previewId);
    if (img) {
      img.src = url;
      img.style.display = "block";
    }
    if (label) label.textContent = "Foto berhasil diupload";
    toast("Foto berhasil diupload", "success");
  } catch (e) {
    toast("Upload gagal: " + e.message, "error");
    if (label) label.textContent = "Klik untuk upload foto";
  }
}

// ─── Preview galeri sebelum upload ──────────────
function previewGalleryFiles(input) {
  const files = Array.from(input.files);
  ORDER.galleryFiles = files;
  ORDER.galleryUrls = []; // reset URL lama jika ganti pilihan
  const wrap = document.getElementById("gallery-preview-wrap");
  const count = document.getElementById("gallery-count-label");
  wrap.innerHTML = "";
  if (!files.length) {
    count.textContent = "";
    return;
  }
  count.textContent = `${files.length} foto dipilih`;
  const limit = Math.min(files.length, 20);
  for (let i = 0; i < limit; i++) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      wrap.appendChild(img);
    };
    reader.readAsDataURL(files[i]);
  }
}

// ═══════════════════════════════════════════════
// Step Navigation
// ═══════════════════════════════════════════════
function goStep(n) {
  if (n < 1 || n > TOTAL_STEPS) return;

  if (n > currentStep) {
    const err = validateStep(currentStep);
    if (err) {
      toast(err, "error");
      return;
    }
  }

  if (n === 7) buildReview();

  document.querySelectorAll(".step-panel").forEach((p) => p.classList.remove("active"));
  const panel = document.getElementById(`panel-${n}`);
  if (panel) panel.classList.add("active");

  const fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = (n / TOTAL_STEPS) * 100 + "%";

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    if (!el) continue;
    el.classList.remove("active", "done");
    if (i < n) el.classList.add("done");
    else if (i === n) el.classList.add("active");
  }

  currentStep = n;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStep(step) {
  if (step === 1 && !ORDER.selectedTheme) return "Pilih tema undangan terlebih dahulu";

  if (step === 2) {
    if (!getV("o-phone")) return "Nomor WhatsApp wajib diisi";
    if (!getV("o-slug")) return "Slug URL undangan wajib diisi";
    if (!/^[a-z0-9-]+$/.test(getV("o-slug"))) return "Slug hanya boleh huruf kecil, angka, dan tanda hubung";
    if (slugCheckState.checked && !slugCheckState.available) return "Slug URL sudah digunakan, silakan pilih slug lain";
    if (!getV("g-name")) return "Nama lengkap mempelai pria wajib diisi";
    if (!getV("g-father")) return "Nama ayah mempelai pria wajib diisi";
    if (!getV("g-mother")) return "Nama ibu mempelai pria wajib diisi";
    if (!getV("b-name")) return "Nama lengkap mempelai wanita wajib diisi";
    if (!getV("b-father")) return "Nama ayah mempelai wanita wajib diisi";
    if (!getV("b-mother")) return "Nama ibu mempelai wanita wajib diisi";
  }
  return null;
}

// ═══════════════════════════════════════════════
// Theme Selection
// ═══════════════════════════════════════════════
function buildCategoryFilter(themes) {
  const select = document.getElementById("theme-cat-filter");
  if (!select) return;

  // Ambil kategori unik, buang yang null/kosong
  const categories = [...new Set(themes.map((t) => (t.category || "").trim().toLowerCase()).filter((c) => c !== ""))].sort();

  // Hapus semua option kecuali "Semua Kategori" (index 0)
  while (select.options.length > 1) {
    select.remove(1);
  }

  // Tambahkan option dari data DB [29]
  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    // Capitalize huruf pertama tiap kata untuk tampilan
    opt.textContent = cat.replace(/\b\w/g, (c) => c.toUpperCase());
    select.appendChild(opt);
  });
}

async function loadThemesPublic() {
  const grid = document.getElementById("theme-grid-public");
  try {
    const r = await apiPublic("GET", "/themes?limit=100");
    allThemes = Array.isArray(r) ? r : r.items || [];
    allThemes = allThemes.filter((t) => +t.is_active === 1);

    buildCategoryFilter(allThemes);

    renderThemesPublic(allThemes);
  } catch (e) {
    if (grid)
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#ba1a1a">
        Gagal memuat tema: ${esc(e.message)}
      </div>`;
  }
}

function renderThemesPublic(list) {
  const grid = document.getElementById("theme-grid-public");
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--outline)">
      Tidak ada tema tersedia.</div>`;
    return;
  }
    grid.innerHTML = list
      .map((t) => {
        let thumb = `${BASE_DOMAIN}/admin/assets/favicon.svg`;
        if (t.preview_img) {
          if (t.preview_img.startsWith("http")) {
            thumb = t.preview_img;
          } else {
            const cleanPath = t.preview_img.startsWith("/order-permata/")
              ? t.preview_img.substring("/order-permata".length)
              : (t.preview_img.startsWith("/") ? t.preview_img : "/" + t.preview_img);
            thumb = `${BASE_DOMAIN}${cleanPath}`;
          }
        }
        const isSelected = ORDER.selectedTheme?.id === t.id;
        return `
      <div class="theme-card ${isSelected ? "selected" : ""}"
           onclick="selectTheme(${JSON.stringify(t).replace(/"/g, "&quot;")})"
           id="theme-card-${t.id}">
        <div class="theme-thumb">
          <img src="${esc(thumb)}" alt="${esc(t.name)}" loading="lazy"
               onerror="this.src='${BASE_DOMAIN}/admin/assets/favicon.svg'">
          <div class="theme-check">✓</div>
        </div>
        <div class="theme-info">
          <div class="theme-name">${esc(t.name)}</div>
          <div class="theme-cat">${esc(t.category || "Atelier")}</div>
          ${
            t.preview_url
              ? `<a href="${esc(t.preview_url)}" target="_blank" rel="noopener"
                 onclick="event.stopPropagation()"
                 style="font-size:0.75rem;color:var(--primary);font-weight:600;
                        display:inline-flex;align-items:center;gap:0.2rem;margin-top:0.35rem">
                 <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>
                 Demo</a>`
              : ""
          }
        </div>
      </div>`;
      })
      .join("");
}

function selectTheme(t) {
  ORDER.selectedTheme = t;
  document.querySelectorAll(".theme-card").forEach((c) => c.classList.remove("selected"));
  const card = document.getElementById(`theme-card-${t.id}`);
  if (card) card.classList.add("selected");
  toast(`Tema "${t.name}" dipilih ✓`, "success");
}

function filterThemesPublic(q) {
  const cat = document.getElementById("theme-cat-filter")?.value || "";
  const query = (q || "").toLowerCase().trim();
  let list = allThemes;
  if (query) list = list.filter((t) => (t.name || "").toLowerCase().includes(query) || (t.category || "").toLowerCase().includes(query));
  if (cat) list = list.filter((t) => (t.category || "").toLowerCase() === cat.toLowerCase());
  renderThemesPublic(list);
}

// ═══════════════════════════════════════════════
// Dynamic Lists
// ═══════════════════════════════════════════════

// ─── Events ─────────────────────────────────────
let eventCount = 0;

const STANDARD_EVENT_NAMES = [
  "Akad Nikah",
  "Resepsi Pernikahan",
  "Pemberkatan",
  "Ngunduh Mantu",
  "Walimatul 'Ursy",
  "Siraman & Pengajian",
  "Lainnya"
];

function getTimeOptionsHtml(selectedVal = "", placeholder = "Pilih Jam") {
  let html = `<option value="">${placeholder}</option>`;
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const timeStr = `${hh}:${mm}`;
      const isSel = timeStr === selectedVal ? " selected" : "";
      html += `<option value="${timeStr}"${isSel}>${timeStr} WIB</option>`;
    }
  }
  return html;
}

function handleEventNameChange(n) {
  const sel = document.getElementById(`ev-name-select-${n}`);
  const customInput = document.getElementById(`ev-name-custom-${n}`);
  if (!sel || !customInput) return;
  if (sel.value === "Lainnya") {
    customInput.style.display = "block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
    customInput.value = "";
  }
  syncEventNameValue(n);
  triggerAutoDraftSave();
}

function syncEventNameValue(n) {
  const sel = document.getElementById(`ev-name-select-${n}`);
  const customInput = document.getElementById(`ev-name-custom-${n}`);
  const hiddenInput = document.getElementById(`ev-name-${n}`);
  if (!hiddenInput) return;
  if (sel && sel.value === "Lainnya") {
    hiddenInput.value = customInput ? customInput.value.trim() : "";
  } else if (sel) {
    hiddenInput.value = sel.value;
  }
}

function setEventNameValue(n, val) {
  const sel = document.getElementById(`ev-name-select-${n}`);
  const customInput = document.getElementById(`ev-name-custom-${n}`);
  const hiddenInput = document.getElementById(`ev-name-${n}`);
  if (!sel || !hiddenInput) return;

  if (STANDARD_EVENT_NAMES.includes(val) && val !== "Lainnya") {
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

function toggleUntilDone(n) {
  const checkbox = document.getElementById(`ev-until-done-${n}`);
  const timeSelect = document.getElementById(`ev-time-end-${n}`);
  if (checkbox && timeSelect) {
    if (checkbox.checked) {
      timeSelect.value = "";
      timeSelect.disabled = true;
    } else {
      timeSelect.disabled = false;
    }
    syncEventDateTime(n);
    triggerAutoDraftSave();
  }
}

function copyLocationFromFirstEvent(n) {
  if (n <= 1) return;
  const venue1 = document.getElementById("ev-venue-1")?.value || "";
  const maps1  = document.getElementById("ev-maps-1")?.value || "";
  const addr1  = document.getElementById("ev-addr-1")?.value || "";

  const venueN = document.getElementById(`ev-venue-${n}`);
  const mapsN  = document.getElementById(`ev-maps-${n}`);
  const addrN  = document.getElementById(`ev-addr-${n}`);

  if (venueN) venueN.value = venue1;
  if (mapsN) mapsN.value = maps1;
  if (addrN) addrN.value = addr1;

  toast(`Lokasi berhasil disalin dari Acara 1!`, "success");
  triggerAutoDraftSave();
}

function copyAddressFromPerson(n, personType) {
  const sourceId = personType === "groom" ? "g-address" : "b-address";
  const label = personType === "groom" ? "Mempelai Pria" : "Mempelai Wanita";
  const sourceAddr = document.getElementById(sourceId)?.value.trim() || "";

  if (!sourceAddr) {
    toast(`Alamat ${label} masih kosong di Langkah 2!`, "warning");
    return;
  }

  const targetAddr = document.getElementById(`ev-addr-${n}`);
  if (targetAddr) {
    targetAddr.value = sourceAddr;
    toast(`Alamat disalin dari Alamat ${label}!`, "success");
    triggerAutoDraftSave();
  }
}

function syncEventDateTime(n) {
  const dateVal = document.getElementById(`ev-date-${n}`)?.value;
  const timeStartVal = document.getElementById(`ev-time-start-${n}`)?.value;
  const timeEndVal = document.getElementById(`ev-time-end-${n}`)?.value;
  const untilDone = document.getElementById(`ev-until-done-${n}`)?.checked;

  const hiddenStart = document.getElementById(`ev-start-${n}`);
  const hiddenEnd   = document.getElementById(`ev-end-${n}`);

  if (hiddenStart) {
    hiddenStart.value = (dateVal && timeStartVal) ? `${dateVal}T${timeStartVal}` : (dateVal ? `${dateVal}T08:00` : "");
  }

  if (hiddenEnd) {
    if (untilDone) {
      hiddenEnd.value = ""; // S/d Selesai
    } else if (dateVal && timeEndVal) {
      hiddenEnd.value = `${dateVal}T${timeEndVal}`;
    } else {
      hiddenEnd.value = "";
    }
  }
}

function addEvent() {
  const n = ++eventCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `ev-item-${n}`;

  // Default nama acara
  const defaultEventName = n === 1 ? "Akad Nikah" : (n === 2 ? "Resepsi Pernikahan" : "Lainnya");
  const defaultStartTime = n === 1 ? "08:00" : (n === 2 ? "11:00" : "09:00");
  const defaultEndTime = n === 1 ? "11:00" : (n === 2 ? "14:00" : "12:00");

  el.innerHTML = `
    <button class="remove-btn" onclick="removeItem('ev-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Sesi Acara ${n}</div>
    
    <div class="form-grid">
      <div class="form-group span-full">
        <label>Nama Acara <span class="req">*</span></label>
        <select id="ev-name-select-${n}" onchange="handleEventNameChange(${n})">
          <option value="Akad Nikah"${defaultEventName === "Akad Nikah" ? " selected" : ""}>Akad Nikah</option>
          <option value="Resepsi Pernikahan"${defaultEventName === "Resepsi Pernikahan" ? " selected" : ""}>Resepsi Pernikahan</option>
          <option value="Pemberkatan">Pemberkatan</option>
          <option value="Ngunduh Mantu">Ngunduh Mantu</option>
          <option value="Walimatul 'Ursy">Walimatul 'Ursy</option>
          <option value="Siraman &amp; Pengajian">Siraman &amp; Pengajian</option>
          <option value="Lainnya"${defaultEventName === "Lainnya" ? " selected" : ""}>Lainnya (Tulis Kustom)</option>
        </select>
        <input type="text" id="ev-name-custom-${n}" placeholder="Tulis nama acara kustom..." style="display:${defaultEventName === "Lainnya" ? "block" : "none"}; margin-top:0.4rem;" oninput="syncEventNameValue(${n}); triggerAutoDraftSave();" />
        <input type="hidden" id="ev-name-${n}" value="${defaultEventName}" />
      </div>

      <div class="form-group span-full">
        <label>Tanggal Acara <span class="req">*</span></label>
        <input id="ev-date-${n}" type="date" onchange="syncEventDateTime(${n}); triggerAutoDraftSave();" />
      </div>

      <div class="form-group">
        <label>Jam Mulai <span class="req">*</span></label>
        <select id="ev-time-start-${n}" onchange="syncEventDateTime(${n}); triggerAutoDraftSave();">
          ${getTimeOptionsHtml(defaultStartTime, "Pilih Jam Mulai")}
        </select>
        <input id="ev-start-${n}" type="hidden" />
      </div>

      <div class="form-group">
        <label>Jam Selesai</label>
        <select id="ev-time-end-${n}" onchange="syncEventDateTime(${n}); triggerAutoDraftSave();">
          ${getTimeOptionsHtml(defaultEndTime, "Pilih Jam Selesai")}
        </select>
        <div style="margin-top: 0.35rem;">
          <label class="checkbox-pill-label">
            <input type="checkbox" id="ev-until-done-${n}" onchange="toggleUntilDone(${n})" />
            <span>Sampai Selesai (s/d selesai)</span>
          </label>
        </div>
        <input id="ev-end-${n}" type="hidden" />
      </div>

      ${
        n > 1
          ? `
      <div class="form-group span-full">
        <button type="button" class="btn-copy-location" onclick="copyLocationFromFirstEvent(${n})">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">content_copy</span>
          <span>Salin Lokasi &amp; Alamat dari Acara 1</span>
        </button>
      </div>`
          : ""
      }

      <div class="form-group">
        <label>Lokasi / Nama Tempat</label>
        <input type="text" id="ev-venue-${n}" placeholder="Gedung / Hotel / Masjid / Kediaman" oninput="triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Google Maps URL</label>
        <input type="text" id="ev-maps-${n}" placeholder="https://maps.app.goo.gl/..." oninput="triggerAutoDraftSave()" />
      </div>
      <div class="form-group span-full">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;">
          <label style="margin:0;">Alamat Lengkap</label>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <button type="button" class="btn-copy-mini" onclick="copyAddressFromPerson(${n}, 'groom')">
              <span class="material-symbols-outlined" style="font-size:0.9rem;">person</span>
              <span>Alamat Pria</span>
            </button>
            <button type="button" class="btn-copy-mini" onclick="copyAddressFromPerson(${n}, 'bride')">
              <span class="material-symbols-outlined" style="font-size:0.9rem;">person_3</span>
              <span>Alamat Wanita</span>
            </button>
          </div>
        </div>
        <textarea id="ev-addr-${n}" placeholder="Alamat lengkap lokasi acara..." oninput="triggerAutoDraftSave()"></textarea>
      </div>
    </div>`;

  document.getElementById("events-list").appendChild(el);

  // Sync initial datetime & name
  syncEventNameValue(n);
  syncEventDateTime(n);
}

// ─── Music Presets dari CDN Permata Wedding ──────────────────────────────────────
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

let musicCount = 0;
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
        <input type="text" id="mu-title-${n}" value="${defaultMusic.title}" placeholder="Judul lagu" oninput="triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Penyanyi / Artis</label>
        <input type="text" id="mu-artist-${n}" value="${defaultMusic.artist}" placeholder="Nama artis / penyanyi" oninput="triggerAutoDraftSave()" />
      </div>

      <!-- URL Audio & Opsi Disembunyikan (Default Aktif) -->
      <input type="hidden" id="mu-url-${n}" value="${defaultMusic.url}" />
      <input type="checkbox" id="mu-auto-${n}" checked style="display:none;" />
      <input type="checkbox" id="mu-loop-${n}" checked style="display:none;" />
    </div>`;
  document.getElementById("music-list").appendChild(el);

  // Set default selection
  const selectEl = document.getElementById(`mu-preset-${n}`);
  if (selectEl && defaultIdx !== "") {
    selectEl.value = defaultIdx;
  }
}

function applyMusicPreset(n) {
  const select = document.getElementById(`mu-preset-${n}`);
  const idx = select.value;
  if (idx === "" || !MUSIC_PRESETS[idx]) return;
  const m = MUSIC_PRESETS[idx];
  document.getElementById(`mu-title-${n}`).value  = m.title;
  document.getElementById(`mu-artist-${n}`).value = m.artist;
  document.getElementById(`mu-url-${n}`).value    = m.url;

  // Jika lagu ini sedang berputar lalu user memilih lagu lain, hentikan dulu
  if (currentPlayingNumber === n) {
    stopAllAudioPreview();
  }
  triggerAutoDraftSave();
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

/**
 * Fungsi hapus item (otomatis menghentikan audio jika item yang sedang berputar dihapus)
 */
function removeItem(id) {
  const el = document.getElementById(id);
  if (el) {
    const match = id.match(/mu-item-(\d+)/);
    if (match && parseInt(match[1]) === currentPlayingNumber) {
      stopAllAudioPreview();
    }
    el.remove();
  }
}

// Panggil fungsi saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", loadMusicPresetsFromCDN);


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
  triggerAutoDraftSave();
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

  // Rekomendasi judul default berdasarkan urutan cerita
  const defaultStoryPreset = n === 1 ? "Pertama Bertemu" : (n === 2 ? "Menjalin Hubungan" : (n === 3 ? "Lamaran / Khitbah" : (n === 4 ? "Menuju Hari Bahagia" : "Lainnya")));

  el.innerHTML = `
    <button class="remove-btn" onclick="removeItem('st-item-${n}')">×</button>
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
        <input type="text" id="st-title-custom-${n}" placeholder="Tulis judul cerita kustom..." style="display:${defaultStoryPreset === "Lainnya" ? "block" : "none"}; margin-top:0.4rem;" oninput="syncStoryTitleValue(${n}); triggerAutoDraftSave();" />
        <input type="hidden" id="st-title-${n}" value="${defaultStoryPreset}" />
      </div>
      <div class="form-group">
        <label>Tanggal Momen</label>
        <input id="st-date-${n}" type="date" onchange="triggerAutoDraftSave()" />
      </div>
      <div class="form-group span-full">
        <label>Isi Cerita</label>
        <textarea id="st-content-${n}" placeholder="Ceritakan momen spesial ini..." oninput="triggerAutoDraftSave()"></textarea>
      </div>
    </div>`;
  document.getElementById("stories-list").appendChild(el);

  // Sync initial value
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
  triggerAutoDraftSave();
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
    <button class="remove-btn" onclick="removeItem('lv-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Live Streaming ${n}</div>
    <div class="form-grid">
      <div class="form-group span-full">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;flex-wrap:wrap;gap:0.35rem;">
          <label style="margin:0;">Judul Siaran</label>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            ${eventPills}
          </div>
        </div>
        <input type="text" id="lv-title-${n}" placeholder="Akad Nikah Live" oninput="triggerAutoDraftSave()" />
      </div>
      <div class="form-group span-full">
        <label>URL YouTube / Platform Streaming <span class="req">*</span></label>
        <input type="text" id="lv-url-${n}" placeholder="https://youtube.com/live/..." oninput="triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Jadwal Mulai</label>
        <input id="lv-start-${n}" type="datetime-local" onchange="triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Jadwal Selesai</label>
        <input id="lv-end-${n}" type="datetime-local" onchange="triggerAutoDraftSave()" />
      </div>
    </div>`;
  document.getElementById("live-list").appendChild(el);
}

// ─── Entertainment ───────────────────────────────
let enCount = 0;
function addEntertainment() {
  const n = ++enCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `en-item-${n}`;
  el.innerHTML = `
    <button class="remove-btn" onclick="removeItem('en-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Hiburan ${n}</div>
    <div class="form-grid">
      <div class="form-group">
        <label>Nama *</label>
        <input type="text" id="en-name-${n}" placeholder="Arseka / pengisi acara" />
      </div>
      <div class="form-group">
        <label>Jenis</label>
        <input type="text" id="en-type-${n}" placeholder="Campursari / Organ Tunggal / MC" />
      </div>
      <div class="form-group span-full">
        <label>Deskripsi</label>
        <textarea id="en-desc-${n}" placeholder="Keterangan singkat..."></textarea>
      </div>
    </div>`;
  document.getElementById("entertainment-list").appendChild(el);
}

// ─── Bank / Digital Wallet ───────────────────────
let bankCount = 0;

const POPULAR_BANKS = ["BCA", "Mandiri", "BRI", "BNI", "BSI", "Bank Jago", "DANA", "GoPay", "OVO", "ShopeePay"];

function setBankPreset(n, bankName) {
  const bankInput = document.getElementById(`bk-bank-${n}`);
  if (bankInput) {
    bankInput.value = bankName;
    triggerAutoDraftSave();
  }
}

function cleanAccountNumber(input) {
  // Bersihkan spasi, tanda hubung, titik otomatis
  const cleaned = input.value.replace(/[^0-9]/g, "");
  if (input.value !== cleaned) {
    input.value = cleaned;
  }
  triggerAutoDraftSave();
}

function addBank() {
  const n = ++bankCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `bk-item-${n}`;

  const chipsHtml = POPULAR_BANKS.map((b) => `<span class="quick-chip" onclick="setBankPreset(${n}, '${b}')">${b}</span>`).join("");

  el.innerHTML = `
    <button class="remove-btn" onclick="removeItem('bk-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Rekening / E-Wallet ${n}</div>
    <div class="form-grid">
      <div class="form-group span-full">
        <label>Pilihan Bank / Dompet Digital <span class="req">*</span></label>
        <div class="quick-chips-wrap">
          ${chipsHtml}
        </div>
        <input type="text" id="bk-bank-${n}" placeholder="BCA / Mandiri / BRI / DANA" oninput="triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Atas Nama Pemilik Rekening <span class="req">*</span></label>
        <input type="text" id="bk-name-${n}" placeholder="Contoh: Muhammad Agung" oninput="triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Nomor Rekening / No. HP E-Wallet <span class="req">*</span></label>
        <input type="text" id="bk-number-${n}" placeholder="Nomor rekening tanpa spasi" oninput="cleanAccountNumber(this)" />
      </div>
    </div>`;
  document.getElementById("bank-list").appendChild(el);
}

// ─── Remove Item ─────────────────────────────────
function removeItem(id) {
  document.getElementById(id)?.remove();
}

// ═══════════════════════════════════════════════
// Collect Data
// ═══════════════════════════════════════════════
function collectEvents() {
  const events = [];
  document.querySelectorAll("[id^='ev-item-']").forEach((item) => {
    const n = item.id.replace("ev-item-", "");
    const name = document.getElementById(`ev-name-${n}`)?.value.trim();

    // Pastikan datetime tersinkronisasi sebelum dikumpulkan
    syncEventDateTime(n);

    const start = document.getElementById(`ev-start-${n}`)?.value;
    if (!name || !start) return; // event_name & event_datetime wajib [9]
    events.push({
      name,
      type: document.getElementById(`ev-type-${n}`)?.value.trim() || "",
      start_time: start,
      end_time: document.getElementById(`ev-end-${n}`)?.value || "",
      venue_name: document.getElementById(`ev-venue-${n}`)?.value.trim() || "",
      maps_url: document.getElementById(`ev-maps-${n}`)?.value.trim() || "",
      address: document.getElementById(`ev-addr-${n}`)?.value.trim() || "",
    });
  });
  return events;
}

function collectMusic() {
  const music = [];
  document.querySelectorAll("[id^='mu-item-']").forEach((item) => {
    const n = item.id.replace("mu-item-", "");
    const title = document.getElementById(`mu-title-${n}`)?.value.trim();
    const url = document.getElementById(`mu-url-${n}`)?.value.trim();
    if (!title || !url) return; // title & audio_url wajib [13]
    music.push({
      title,
      artist: document.getElementById(`mu-artist-${n}`)?.value.trim() || "",
      url,
      autoplay: document.getElementById(`mu-auto-${n}`)?.checked ? 1 : 0,
      loop: document.getElementById(`mu-loop-${n}`)?.checked ? 1 : 0,
    });
  });
  return music;
}

function collectStories() {
  const stories = [];
  document.querySelectorAll("[id^='st-item-']").forEach((item) => {
    const n = item.id.replace("st-item-", "");
    const title = document.getElementById(`st-title-${n}`)?.value.trim();
    if (!title) return; // title wajib [12]
    stories.push({
      title,
      date: document.getElementById(`st-date-${n}`)?.value || "",
      content: document.getElementById(`st-content-${n}`)?.value.trim() || "",
    });
  });
  return stories;
}

function collectLive() {
  const lives = [];
  document.querySelectorAll("[id^='lv-item-']").forEach((item) => {
    const n = item.id.replace("lv-item-", "");
    const url = document.getElementById(`lv-url-${n}`)?.value.trim();
    if (!url) return; // youtube_url wajib [11]
    lives.push({
      title: document.getElementById(`lv-title-${n}`)?.value.trim() || "",
      url,
      start_time: document.getElementById(`lv-start-${n}`)?.value || "",
      end_time: document.getElementById(`lv-end-${n}`)?.value || "",
    });
  });
  return lives;
}

function collectEntertainment() {
  const list = [];
  document.querySelectorAll("[id^='en-item-']").forEach((item) => {
    const n = item.id.replace("en-item-", "");
    const name = document.getElementById(`en-name-${n}`)?.value.trim();
    if (!name) return; // name wajib [8]
    list.push({
      name,
      type: document.getElementById(`en-type-${n}`)?.value.trim() || "",
      description: document.getElementById(`en-desc-${n}`)?.value.trim() || "",
    });
  });
  return list;
}

function collectBanks() {
  const banks = [];
  document.querySelectorAll("[id^='bk-item-']").forEach((item) => {
    const n = item.id.replace("bk-item-", "");
    const accountName = document.getElementById(`bk-name-${n}`)?.value.trim();
    if (!accountName) return; // account_holder wajib [7]
    banks.push({
      bank_name: document.getElementById(`bk-bank-${n}`)?.value.trim() || "",
      account_name: accountName,
      account_number: document.getElementById(`bk-number-${n}`)?.value.trim() || "",
    });
  });
  return banks;
}

// ═══════════════════════════════════════════════
// Build Review
// ═══════════════════════════════════════════════
function buildReview() {
  const r = document.getElementById("review-content");
  if (!r) return;

  const th = ORDER.selectedTheme;
  // [31] fix: hapus akad_date & resepsi_date — tidak ada di tabel couples [29][6]
  const rows = [
    ["Tema", th ? `${esc(th.name)} <span style="color:var(--outline);font-size:0.8rem">(${esc(th.category || "")})</span>` : "<em>Belum dipilih</em>"],
    ["WhatsApp", esc(getV("o-phone"))],
    ["Slug URL", esc(getV("o-slug"))],
    ["Paket", esc(getV("o-package")) || "-"],
    ["Nama Pria", esc(getV("g-name"))],
    ["Ayah Pria", esc(getV("g-father"))],
    ["Ibu Pria", esc(getV("g-mother"))],
    ["Nama Wanita", esc(getV("b-name"))],
    ["Ayah Wanita", esc(getV("b-father"))],
    ["Ibu Wanita", esc(getV("b-mother"))],
    ["Catatan", esc(getV("o-notes")) || "-"],
  ];

  const events = collectEvents();
  const music = collectMusic();
  const stories = collectStories();
  const lives = collectLive();
  const entertainments = collectEntertainment();
  const banks = collectBanks();

  r.innerHTML = `
    <table class="review-table">
      <tbody>
        ${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
        <tr>
          <td>Foto Pria</td>
          <td>${ORDER.groomPhotoUrl ? `<img src="${esc(ORDER.groomPhotoUrl)}" style="height:60px;border-radius:8px">` : "<em>Belum diupload</em>"}</td>
        </tr>
        <tr>
          <td>Foto Wanita</td>
          <td>${ORDER.bridePhotoUrl ? `<img src="${esc(ORDER.bridePhotoUrl)}" style="height:60px;border-radius:8px">` : "<em>Belum diupload</em>"}</td>
        </tr>
        <tr>
          <td>Galeri</td>
          <td>${
            ORDER.galleryUrls.length
              ? ORDER.galleryUrls.map((u) => `<img src="${esc(u)}" style="height:50px;border-radius:6px;margin:2px">`).join("")
              : ORDER.galleryFiles.length
                ? `${ORDER.galleryFiles.length} foto dipilih (belum diupload)`
                : "<em>Tidak ada</em>"
          }</td>
        </tr>
        <tr>
          <td>Acara</td>
          <td>${events.length ? events.map((e) => `<b>${esc(e.name)}</b> — ${esc(e.venue_name || "-")}`).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Musik</td>
          <td>${music.length ? music.map((m) => `${esc(m.title)}${m.artist ? " - " + esc(m.artist) : ""}`).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Love Story</td>
          <td>${stories.length ? stories.map((s) => esc(s.title)).join(", ") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Live Streaming</td>
          <td>${lives.length ? lives.map((l) => esc(l.title || l.url)).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Hiburan</td>
          <td>${entertainments.length ? entertainments.map((e) => esc(e.name)).join(", ") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Rekening Gift</td>
          <td>${banks.length ? banks.map((b) => `${esc(b.bank_name)} — ${esc(b.account_name)}`).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
      </tbody>
    </table>`;
}

// ═══════════════════════════════════════════════
// Submit Order with Real-time Status Modal
// ═══════════════════════════════════════════════
function updateSubmitModalStatus(step, message) {
  const modal = document.getElementById("order-processing-modal");
  const descEl = document.getElementById("modal-status-desc");
  if (descEl && message) {
    descEl.textContent = message;
  }

  const steps = ["upload", "db", "build"];
  const stepIdx = steps.indexOf(step);

  steps.forEach((s, idx) => {
    const el = document.getElementById(`step-status-${s}`);
    const icon = document.getElementById(`icon-status-${s}`);
    if (!el || !icon) return;

    if (idx < stepIdx) {
      el.className = "status-step-item done";
      icon.textContent = "check_circle";
    } else if (idx === stepIdx) {
      el.className = "status-step-item active";
      icon.textContent = s === "upload" ? "cloud_upload" : (s === "db" ? "sync" : "auto_fix_high");
    } else {
      el.className = "status-step-item";
      icon.textContent = s === "upload" ? "cloud_upload" : (s === "db" ? "database" : "auto_fix_high");
    }
  });
}

function openSubmitModal() {
  const modal = document.getElementById("order-processing-modal");
  if (modal && typeof modal.showModal === "function") {
    updateSubmitModalStatus("upload", "Mohon tunggu sebentar, sistem sedang memproses...");
    modal.showModal();
  }
}

function closeSubmitModal() {
  const modal = document.getElementById("order-processing-modal");
  if (modal && modal.open) {
    modal.close();
  }
}

async function submitOrder() {
  const btn = document.getElementById("btn-submit");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin-order 1s linear infinite;">progress_activity</span> Memproses...`;
  }

  // Tampilkan modal status pemrosesan interaktif
  openSubmitModal();

  try {
    // 1. Upload galeri jika belum
    if (ORDER.galleryFiles && ORDER.galleryFiles.length && !ORDER.galleryUrls.length) {
      updateSubmitModalStatus("upload", `Sedang mengunggah dan mengompresi ${ORDER.galleryFiles.length} foto galeri...`);
      toast("Mengupload foto galeri...", "info");
      const gFolder = folderGallery() || `${getV("o-slug") || "misc"}/gallery`;
      ORDER.galleryUrls = await uploadMultiPublic(ORDER.galleryFiles, gFolder, "galeri");
    } else {
      updateSubmitModalStatus("upload", "Foto mempelai dan berkas terverifikasi...");
    }

    // Beri jeda halus agar transisi status terbaca jelas oleh user
    await new Promise((r) => setTimeout(r, 400));

    // 2. Susun payload & simpan ke database
    updateSubmitModalStatus("db", "Menyimpan data mempelai, jadwal acara & amplop digital...");
    const payload = {
      theme_id: ORDER.selectedTheme?.id,
      phone: getV("o-phone"),
      slug: getV("o-slug"),
      package: getV("o-package") || null,
      notes: getV("o-notes") || null,
      groom: {
        full_name: getV("g-name"),
        nickname: getV("g-nick") || null,
        father: getV("g-father"),
        mother: getV("g-mother"),
        address: getV("g-address") || null, // groom_address
        photo_url: ORDER.groomPhotoUrl || null,
      },
      bride: {
        full_name: getV("b-name"),
        nickname: getV("b-nick") || null,
        father: getV("b-father"),
        mother: getV("b-mother"),
        address: getV("b-address") || null, // bride_address
        photo_url: ORDER.bridePhotoUrl || null,
      },
      gallery: ORDER.galleryUrls,
      events: collectEvents(),
      music: collectMusic(),
      love_stories: collectStories(),
      live_streamings: collectLive(),
      entertainments: collectEntertainment(),
      bank_accounts: collectBanks(),
    };

    // 3. Kirim ke API (backend otomatis melakukan kompilasi True Static Pre-rendering)
    updateSubmitModalStatus("build", "Melakukan pre-rendering tema & mengompilasi halaman statis...");
    const res = await apiPublic("POST", "/orders/public", payload);
    ORDER.orderId = res.order_id || null;
    ORDER.orderCode = res.order_code || "";
    ORDER.coupleId = res.couple_id || null;
    ORDER.eventYear = res.year || getEventYear();
    ORDER.invitationUrl = res.invitation_url || "";

    // Tandai selesai seluruh langkah
    const buildEl = document.getElementById("step-status-build");
    const buildIcon = document.getElementById("icon-status-build");
    if (buildEl && buildIcon) {
      buildEl.className = "status-step-item done";
      buildIcon.textContent = "check_circle";
    }
    updateSubmitModalStatus("build", "Kompilasi selesai! Membuka halaman sukses...");

    // Hapus draft tersimpan setelah pesanan berhasil terkirim
    localStorage.removeItem(DRAFT_KEY);

    await new Promise((r) => setTimeout(r, 500));
    closeSubmitModal();

    // 4. Tampilkan sukses
    showSuccess();
  } catch (e) {
    closeSubmitModal();
    toast("Gagal mengirim pesanan: " + e.message, "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">send</span> Kirim &amp; Simpan Data Order`;
    }
  }
}

// ═══════════════════════════════════════════════
// Show Success Panel
// ═══════════════════════════════════════════════
function showSuccess() {
  document.querySelectorAll(".step-panel").forEach((p) => p.classList.remove("active"));

  const pbWrap = document.getElementById("progress-bar-wrap");
  if (pbWrap) pbWrap.style.display = "none";
  const stepInd = document.getElementById("step-indicators");
  if (stepInd) stepInd.style.display = "none";

  const panel = document.getElementById("panel-success");
  if (panel) {
    panel.classList.add("active");
    const codeEl = document.getElementById("success-order-code");
    if (codeEl) codeEl.textContent = ORDER.orderCode || "-";
    // [30] fix: tampilkan slug di panel sukses
    const slugEl = document.getElementById("success-slug");
    if (slugEl) slugEl.textContent = getV("o-slug");
    // Preview pesan WA
    buildWaPreview();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Preview pesan WA di panel sukses ───────────
function buildWaPreview() {
  const el = document.getElementById("wa-preview-text");
  if (!el) return;
  const code = ORDER.orderCode || "-";
  const slugVal = getV("o-slug");
  const groomName = getV("g-name");
  const brideName = getV("b-name");
  const theme = ORDER.selectedTheme?.name || "-";
  const phone = getV("o-phone");
  const invitationUrl = getInvitationUrl(slugVal);
  el.textContent =
    `Halo Admin Permata Wedding \n\n` +
    `Saya ingin konfirmasi pesanan undangan digital:\n` +
    `Kode Pesanan  : ${code}\n` +
    `Nama Pasangan : ${groomName} & ${brideName}\n` +
    `Tema          : ${theme}\n` +
    `Slug URL      : ${invitationUrl}\n` +
    `Nomor WA      : ${phone}\n\n` +
    `Mohon segera diproses. Terima kasih! `;
}

// ═══════════════════════════════════════════════
// Share WhatsApp ke Admin
// ═══════════════════════════════════════════════
function shareToAdmin() {
  const code = ORDER.orderCode || "-";
  const slugVal = getV("o-slug");
  const groomName = getV("g-name");
  const brideName = getV("b-name");
  const theme = ORDER.selectedTheme?.name || "-";
  const phone = getV("o-phone");
  const invitationUrl = getInvitationUrl(slugVal);
  const msg = encodeURIComponent(
    `Halo Admin Permata Wedding \n\n` +
      `Saya ingin konfirmasi pesanan undangan digital:\n` +
      `Kode Pesanan  : *${code}*\n` +
      `Nama Pasangan : *${groomName} & ${brideName}*\n` +
      `Tema          : *${theme}*\n` +
      `Slug URL      : *${invitationUrl}*\n` +
      `Nomor WA      : *${phone}*\n\n` +
      `Mohon segera diproses. Terima kasih! `,
  );
  window.open(`https://wa.me/${WA_ADMIN}?text=${msg}`, "_blank");
}

// ═══════════════════════════════════════════════
// Copy ke Clipboard
// ═══════════════════════════════════════════════
function copyToClipboard(text) {
  navigator.clipboard
    .writeText(text)
    .then(() => {
      toast("Disalin ke clipboard ✓", "success");
    })
    .catch(() => {
      const el = document.createElement("textarea");
      el.value = text;
      el.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      toast("Disalin ke clipboard ✓", "success");
    });
}

// ═══════════════════════════════════════════════
// Phone Normalization & Auto-Draft (LocalStorage)
// ═══════════════════════════════════════════════
function normalizePhoneInput(input) {
  let val = input.value.replace(/[^0-9+]/g, "");
  // Jika diawali 08..., biarkan user mengetik wajar atau rapikan format
  if (val.startsWith("+62")) {
    val = "0" + val.slice(3);
  } else if (val.startsWith("62")) {
    val = "0" + val.slice(2);
  }
  input.value = val;
}

const DRAFT_KEY = "permata_order_form_draft_v1";
let draftSaveTimer = null;

function triggerAutoDraftSave() {
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(saveOrderDraft, 600);
}

function saveOrderDraft() {
  try {
    const draft = {
      timestamp: Date.now(),
      theme_id: ORDER.selectedTheme?.id || null,
      theme_name: ORDER.selectedTheme?.name || null,
      package: getV("o-package") || null,
      phone: getV("o-phone"),
      slug: getV("o-slug"),
      notes: getV("o-notes"),
      groom: {
        name: getV("g-name"),
        nick: getV("g-nick"),
        father: getV("g-father"),
        mother: getV("g-mother"),
        address: getV("g-address"),
        photo: ORDER.groomPhotoUrl || "",
      },
      bride: {
        name: getV("b-name"),
        nick: getV("b-nick"),
        father: getV("b-father"),
        mother: getV("b-mother"),
        address: getV("b-address"),
        photo: ORDER.bridePhotoUrl || "",
      },
      events: collectEvents(),
      stories: collectStories(),
      lives: collectLive(),
      entertainments: collectEntertainment(),
      banks: collectBanks(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn("Gagal menyimpan auto-draft:", err);
  }
}

function checkSavedDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    // Hanya tampilkan jika draft memiliki data penting (seperti slug atau nama pengantin)
    if (draft && (draft.slug || draft.groom?.name || draft.bride?.name || draft.phone)) {
      const banner = document.getElementById("draft-restore-banner");
      if (banner) banner.style.display = "flex";
    }
  } catch (err) {
    console.warn("Gagal mengecek draft tersimpan:", err);
  }
}

function restoreDraftData() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal("o-phone", draft.phone);
    setVal("o-slug", draft.slug);
    setVal("o-package", draft.package);
    setVal("o-notes", draft.notes);

    if (draft.groom) {
      setVal("g-name", draft.groom.name);
      setVal("g-nick", draft.groom.nick);
      setVal("g-father", draft.groom.father);
      setVal("g-mother", draft.groom.mother);
      setVal("g-address", draft.groom.address);
      if (draft.groom.photo) {
        ORDER.groomPhotoUrl = draft.groom.photo;
        const img = document.getElementById("groom-photo-preview");
        if (img) { img.src = draft.groom.photo; img.style.display = "block"; }
      }
    }

    if (draft.bride) {
      setVal("b-name", draft.bride.name);
      setVal("b-nick", draft.bride.nick);
      setVal("b-father", draft.bride.father);
      setVal("b-mother", draft.bride.mother);
      setVal("b-address", draft.bride.address);
      if (draft.bride.photo) {
        ORDER.bridePhotoUrl = draft.bride.photo;
        const img = document.getElementById("bride-photo-preview");
        if (img) { img.src = draft.bride.photo; img.style.display = "block"; }
      }
    }

    // Restore Events jika ada
    if (Array.isArray(draft.events) && draft.events.length > 0) {
      document.getElementById("events-list").innerHTML = "";
      eventCount = 0;
      draft.events.forEach((ev) => {
        addEvent();
        const n = eventCount;
        setEventNameValue(n, ev.name);
        setVal(`ev-venue-${n}`, ev.venue_name);
        setVal(`ev-maps-${n}`, ev.maps_url);
        setVal(`ev-addr-${n}`, ev.address);
        if (ev.start_time) {
          const parts = ev.start_time.split("T");
          setVal(`ev-date-${n}`, parts[0]);
          if (parts[1]) setVal(`ev-time-start-${n}`, parts[1].substring(0, 5));
        }
        if (ev.end_time) {
          const parts = ev.end_time.split("T");
          if (parts[1]) setVal(`ev-time-end-${n}`, parts[1].substring(0, 5));
        } else {
          const cb = document.getElementById(`ev-until-done-${n}`);
          if (cb) { cb.checked = true; toggleUntilDone(n); }
        }
        syncEventDateTime(n);
      });
    }

    // Restore Stories jika ada
    if (Array.isArray(draft.stories) && draft.stories.length > 0) {
      document.getElementById("stories-list").innerHTML = "";
      storyCount = 0;
      draft.stories.forEach((st) => {
        addStory();
        const n = storyCount;
        setStoryTitleValue(n, st.title);
        setVal(`st-date-${n}`, st.date);
        setVal(`st-content-${n}`, st.content);
      });
    }

    // Restore Banks jika ada
    if (Array.isArray(draft.banks) && draft.banks.length > 0) {
      document.getElementById("bank-list").innerHTML = "";
      bankCount = 0;
      draft.banks.forEach((bk) => {
        addBank();
        const n = bankCount;
        setVal(`bk-bank-${n}`, bk.bank_name);
        setVal(`bk-name-${n}`, bk.account_name);
        setVal(`bk-number-${n}`, bk.account_number);
      });
    }

    // Sembunyikan banner setelah dipulihkan
    discardDraftBanner();
    toast("Data pesanan berhasil dipulihkan dari draf!", "success");
    goStep(2);
  } catch (err) {
    console.error("Gagal memulihkan draf:", err);
    toast("Gagal memulihkan draf", "error");
  }
}

function discardDraftBanner() {
  const banner = document.getElementById("draft-restore-banner");
  if (banner) banner.style.display = "none";
}

function discardDraftData() {
  localStorage.removeItem(DRAFT_KEY);
  discardDraftBanner();
  toast("Draf lama dibersihkan. Memulai pesanan baru.", "info");
}

// ═══════════════════════════════════════════════
// Init
// ═══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  loadThemesPublic();
  checkSavedDraft();

  // Daftarkan auto draft save pada input utama
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", triggerAutoDraftSave);
    el.addEventListener("change", triggerAutoDraftSave);
  });

  // Navigasi step
  document.getElementById("btn-next-1")?.addEventListener("click", () => goStep(2));
  document.getElementById("btn-prev-2")?.addEventListener("click", () => goStep(1));
  document.getElementById("btn-next-2")?.addEventListener("click", () => goStep(3));
  document.getElementById("btn-prev-3")?.addEventListener("click", () => goStep(2));
  document.getElementById("btn-next-3")?.addEventListener("click", () => goStep(4));
  document.getElementById("btn-prev-4")?.addEventListener("click", () => goStep(3));
  document.getElementById("btn-next-4")?.addEventListener("click", () => goStep(5));
  document.getElementById("btn-prev-5")?.addEventListener("click", () => goStep(4));
  document.getElementById("btn-next-5")?.addEventListener("click", () => goStep(6));
  document.getElementById("btn-prev-6")?.addEventListener("click", () => goStep(5));
  document.getElementById("btn-next-6")?.addEventListener("click", () => goStep(7));
  document.getElementById("btn-prev-7")?.addEventListener("click", () => goStep(6));

  // Submit & WA
  document.getElementById("btn-submit")?.addEventListener("click", submitOrder);
  document.getElementById("btn-share-wa")?.addEventListener("click", shareToAdmin);

  // Upload foto mempelai
document.getElementById("groom-photo-input")?.addEventListener("change", function () {
  handleSingleUpload(this, "groom-photo-preview", "groom-photo-label", folderCouple, "mempelai-pria");
});
document.getElementById("bride-photo-input")?.addEventListener("change", function () {
  handleSingleUpload(this, "bride-photo-preview", "bride-photo-label", folderCouple, "mempelai-wanita");
});

  // Galeri
  document.getElementById("gallery-input")?.addEventListener("change", function () {
    previewGalleryFiles(this);
  });

  // Filter tema
  document.getElementById("theme-search")?.addEventListener("input", function () {
    filterThemesPublic(this.value);
  });
  document.getElementById("theme-cat-filter")?.addEventListener("change", function () {
    filterThemesPublic(document.getElementById("theme-search")?.value || "");
  });

  // Default items
  addEvent();
  addMusic();

  // Tombol tambah dynamic items
  document.getElementById("btn-add-event")?.addEventListener("click", addEvent);
  document.getElementById("btn-add-music")?.addEventListener("click", addMusic);
  document.getElementById("btn-add-story")?.addEventListener("click", addStory);
  document.getElementById("btn-add-live")?.addEventListener("click", addLive);
  document.getElementById("btn-add-entertainment")?.addEventListener("click", addEntertainment);
  document.getElementById("btn-add-bank")?.addEventListener("click", addBank);

  // Copy link undangan
  document.getElementById("btn-copy-link")?.addEventListener("click", () => {
    copyToClipboard(getInvitationUrl(getV("o-slug")));
  });

  // Event listener auto-check slug & auto-generate slug dari nama
  const slugInput = document.getElementById("o-slug");
  if (slugInput) {
    slugInput.addEventListener("input", function () {
      this.dataset.manual = "true";
      // Auto lowercase & bersihkan spasi saat mengetik
      const cleaned = cleanSlug(this.value);
      if (this.value !== cleaned && this.value.endsWith(" ")) {
        this.value = cleaned;
      }
      handleSlugInput(this.value);
    });
  }

  // Auto-generate saat user mengisi nama panggilan atau nama lengkap mempelai
  ["g-nick", "g-name", "b-nick", "b-name"].forEach((id) => {
    document.getElementById(id)?.addEventListener("blur", autoGenerateSlugIfEmpty);
  });

  goStep(1);
});
