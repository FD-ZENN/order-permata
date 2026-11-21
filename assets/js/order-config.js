// ═══════════════════════════════════════════════
// CONFIG & CORE HELPERS — Permata Wedding
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
  if (typeof collectEvents === "function") {
    const events = collectEvents();
    if (events && events.length > 0 && events[0].start_time) {
      const d = new Date(events[0].start_time);
      if (!isNaN(d.getFullYear()) && d.getFullYear() >= 2020) {
        return String(d.getFullYear());
      }
    }
  }
  return String(new Date().getFullYear());
}

function getInvitationUrl(slugVal) {
  if (ORDER.invitationUrl) {
    return ORDER.invitationUrl.startsWith("http")
      ? ORDER.invitationUrl
      : `${BASE_DOMAIN}${ORDER.invitationUrl.startsWith("/") ? "" : "/"}${ORDER.invitationUrl}`;
  }
  const year = ORDER.eventYear || getEventYear();
  return `${BASE_DOMAIN}/${year}/${slugVal}`;
}

// ═══════════════════════════════════════════════
// Global Order State
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
// Toast Notification
// ═══════════════════════════════════════════════
function toast(msg, type = "info") {
  const map = { success: "toast-success", error: "toast-error", info: "toast-info" };
  const el = document.createElement("div");
  el.className = `toast ${map[type] || "toast-info"}`;
  el.textContent = msg;
  const container = document.getElementById("toast-container");
  if (container) {
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add("fade-out");
      setTimeout(() => el.remove(), 350);
    }, 3500);
  }
}

// ═══════════════════════════════════════════════
// DOM Helpers & Sanitizers
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

// ═══════════════════════════════════════════════
// Phone Normalization
// ═══════════════════════════════════════════════
function normalizePhoneInput(input) {
  let val = input.value.replace(/[^0-9+]/g, "");
  if (val.startsWith("+62")) {
    val = "0" + val.slice(3);
  } else if (val.startsWith("62")) {
    val = "0" + val.slice(2);
  }
  input.value = val;
}
