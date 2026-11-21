// ═══════════════════════════════════════════════
// State
// ═══════════════════════════════════════════════
const defaultApiBase = window.location.origin.includes("localhost")
  ? window.location.origin + "/order-permata/api"
  : window.location.origin + "/api";

const S = {
  token: localStorage.getItem("wd_token") || "",
  baseUrl: (localStorage.getItem("wd_base") || defaultApiBase).replace(/\/+$/, ""),
  page: "dashboard",
  orderDetailId: null,
  orderDetailTab: "couple",
};

// Validasi jika baseUrl yang tersimpan di localStorage masih berisi path localhost saat dibuka di live domain
if (!window.location.origin.includes("localhost") && S.baseUrl.includes("/order-permata/api")) {
  S.baseUrl = defaultApiBase;
  localStorage.setItem("wd_base", defaultApiBase);
}

// Data Global State
let ordersData = [];
let themesData = [];
let commentsCache = [];

let allThemesData = [];
let allThemesLoaded = false;

// State grafik dashboard
let currentChartPeriod = "month";
let currentChartYear = new Date().getFullYear().toString();

// State Pagination
const ordersPagination = { page: 1, limit: 10, total: 0, totalPages: 1 };
const themesPagination = { page: 1, limit: 6, total: 0, totalPages: 1 };
const tmPagination = { page: 1, limit: 6, total: 0, totalPages: 1 };

let selectedPayStatus = "";
let selectedThemeCat = "";
let tmSelectedStatus = "";
let tmSelectedRating = 0;

// ═══════════════════════════════════════════════
// API
// ═══════════════════════════════════════════════
async function api(method, path, body = null) {
  const cleanPath = path.startsWith("/") ? path : "/" + path;
  const opts = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(S.token ? {
        Authorization: `Bearer ${S.token}`,
        "X-Authorization": `Bearer ${S.token}`
      } : {}),
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(S.baseUrl + cleanPath, opts);
  if (res.status === 401) {
    toast("Sesi berakhir, silakan login kembali", "error");
    doLogout();
    throw new Error("Unauthorized");
  }
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || res.statusText);
  return json.data ?? json;
}

// ═══════════════════════════════════════════════
// Cache tema lengkap
// ═══════════════════════════════════════════════
async function loadAllThemes(force = false) {
  if (allThemesLoaded && !force) return allThemesData;
  try {
    const r = await api("GET", "/themes?limit=100");
    allThemesData = r.items || [];
    allThemesLoaded = true;
  } catch (_) {}
  return allThemesData;
}

// ═══════════════════════════════════════════════
// Upload
// ═══════════════════════════════════════════════
async function uploadFile(file, folder = "misc", label = "foto", context = "") {
  if (!file) return null;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.type)) {
    toast("Format: JPEG, PNG, atau WebP", "error");
    return null;
  }
  if (file.size > 20 * 1024 * 1024) {
    toast("Maks 20 MB", "error");
    return null;
  }
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", typeof folder === "function" ? folder() : folder);
  fd.append("label", label);
  if (context) fd.append("context", context);
  try {
    const res = await fetch(S.baseUrl + "/upload", {
      method: "POST",
      headers: { Authorization: "Bearer " + S.token },
      body: fd,
    });
    if (res.status === 401) {
      toast("Sesi berakhir, silakan login kembali", "error");
      doLogout();
      return null;
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Upload gagal");
    toast("Foto diupload", "success");
    return json.data.url;
  } catch (e) {
    toast("Upload gagal: " + e.message, "error");
    return null;
  }
}

async function uploadMultipleFiles(files, folder = "misc", label = "galeri") {
  if (!files || files.length === 0) return [];
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  const fd = new FormData();
  let skipped = 0;
  for (const file of files) {
    if (!allowed.includes(file.type)) { skipped++; continue; }
    if (file.size > 20 * 1024 * 1024) { skipped++; continue; }
    fd.append("files[]", file);
  }
  if ([...fd.entries()].length === 0) {
    toast("Tidak ada file valid (JPEG/PNG/WebP, maks 20MB)", "error");
    return [];
  }
  fd.append("folder", typeof folder === "function" ? folder() : folder);
  fd.append("label", label);
  try {
    const res = await fetch(S.baseUrl + "/upload-multi", {
      method: "POST",
      headers: { Authorization: "Bearer " + S.token },
      body: fd,
    });
    if (res.status === 401) {
      toast("Sesi berakhir, silakan login kembali", "error");
      doLogout();
      return [];
    }
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || "Upload gagal");
    const urls = json.data.urls || [];
    const failed = json.data.failed || 0;
    toast(`${urls.length} foto diupload` + (failed ? `, ${failed} gagal` : "") + (skipped ? `, ${skipped} dilewati` : ""), "success");
    return urls;
  } catch (e) {
    toast("Upload gagal: " + e.message, "error");
    return [];
  }
}

const UPLOAD_LABEL = '<span class="material-symbols-outlined icon-xs">photo_camera</span> Upload';
const LOADING_LABEL = '<span class="material-symbols-outlined icon-xs icon-spin">progress_activity</span>';

function initUploadButton(inputId, btnId, previewId, folder, label, context) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.onclick = () => {
    const f = typeof folder === "function" ? folder() : folder;
    if (!f) return;
    const fi = document.createElement("input");
    fi.type = "file";
    fi.accept = "image/jpeg,image/png,image/webp";
    fi.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      btn.disabled = true;
      btn.innerHTML = LOADING_LABEL;
      const c = typeof context === "function" ? context() : context || "";
      let url;
      try {
        url = await uploadFile(file, f, label, c);
      } catch (err) {
        console.error("Upload gagal:", err);
      } finally {
        btn.disabled = false;
        btn.innerHTML = UPLOAD_LABEL;
      }
      if (url) {
        setVal(inputId, url);
        if (previewId) {
          const img = document.getElementById(previewId);
          if (img) { img.src = url; img.style.display = "block"; }
        }
      }
    };
    fi.click();
  };
}

// ═══════════════════════════════════════════════
// Toast / Confirm / Modal / Sidebar
// ═══════════════════════════════════════════════
function toast(msg, type = "info") {
  const map = { success: "toast-success", error: "toast-error", info: "toast-info", warn: "toast-warn" };
  const el = document.createElement("div");
  el.className = `toast ${map[type] || "toast-info"}`;
  el.textContent = msg;
  const container = document.getElementById("toast-container");
  if (container) container.appendChild(el);
  setTimeout(() => {
    el.classList.add("fade-out");
    setTimeout(() => el.remove(), 350);
  }, 3000);
}

function confirmDialog(title, msg) {
  return new Promise((resolve) => {
    const ov = document.getElementById("confirm-overlay");
    const tEl = document.getElementById("confirm-title");
    const mEl = document.getElementById("confirm-msg");
    if (tEl) tEl.textContent = title;
    if (mEl) mEl.textContent = msg;
    if (ov) ov.classList.add("open");
    const yes = document.getElementById("confirm-yes"),
      no = document.getElementById("confirm-no");
    const done = (v) => {
      if (ov) ov.classList.remove("open");
      if (yes) yes.onclick = null;
      if (no) no.onclick = null;
      resolve(v);
    };
    if (yes) yes.onclick = () => done(true);
    if (no) no.onclick = () => done(false);
  });
}

function openModal(id) {
  document.getElementById(id)?.classList.add("open");
}
function closeModal(id) {
  document.getElementById(id)?.classList.remove("open");
}
function toggleSidebar() {
  document.getElementById("sidebar")?.classList.toggle("open");
  document.getElementById("sidebar-overlay")?.classList.toggle("open");
}

// ═══════════════════════════════════════════════
// Navigation
// ═══════════════════════════════════════════════
const PAGE_TITLES = {
  dashboard: "Dashboard",
  themes: "Themes",
  orders: "Orders",
  "order-detail": "Detail Order",
  testimonials: "Testimoni",
  whatsapp: "WhatsApp Gateway Center",
  cdn: "Pusat Media & CDN Permata Wedding",
  settings: "Pengaturan",
};

function navigate(page, extra = {}) {
  Object.assign(S, { page }, extra);
  const titleEl = document.getElementById("topbar-title");
  if (titleEl) titleEl.textContent = PAGE_TITLES[page] || page;
  document.querySelectorAll(".page").forEach((p) => {
    p.classList.remove("active");
    p.style.display = "none";
  });
  const pg = document.getElementById(`page-${page}`);
  if (pg) { pg.style.display = "block"; pg.classList.add("active"); }
  document.querySelectorAll(".nav-item[data-page]").forEach((n) => {
    n.classList.toggle("active", n.dataset.page === page);
  });
  if (window.innerWidth <= 767) {
    document.getElementById("sidebar")?.classList.remove("open");
    document.getElementById("sidebar-overlay")?.classList.remove("open");
  }
  document.getElementById("content")?.scrollTo?.({ top: 0, behavior: "instant" });
  window.scrollTo?.({ top: 0, behavior: "instant" });
  loaders[page]?.();
}

// ═══════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════
const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const getVal = (id) => {
  const el = document.getElementById(id);
  return el ? el.value.trim() : "";
};
const setVal = (id, v) => {
  const el = document.getElementById(id);
  if (el) el.value = v ?? "";
};
const clearEl = (id) => setVal(id, "");

function emptyRow(cols, msg) {
  return `<tr><td colspan="${cols}"><div class="empty-state"><p>${msg}</p></div></td></tr>`;
}
function payBadge(s) {
  const m = { paid: "badge-success", unpaid: "badge-danger", partial: "badge-warn", cancelled: "badge-neutral" };
  return `<span class="badge ${m[s] || "badge-neutral"}">${esc(s)}</span>`;
}
function pkgBadge(s) {
  const m = { basic: "badge-neutral", premium: "badge-warn", exclusive: "badge-success" };
  return `<span class="badge ${m[s] || "badge-neutral"}">${esc(s)}</span>`;
}
function activeBadge(v) {
  return v ? '<span class="badge badge-success">Aktif</span>' : '<span class="badge badge-neutral">Nonaktif</span>';
}

function getInitials(name) {
  if (!name) return "PW";
  return name.replace(/&/g, "").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}

function getCoupleSlug() {
  const slug = getVal("c-slug");
  if (!slug) { toast("Isi Slug URL di tab Mempelai terlebih dahulu", "error"); return null; }
  return slug;
}
function folderCouple() { const s = getCoupleSlug(); return s ? s + "/couple" : "couple"; }
function folderGallery() { const s = getCoupleSlug(); return s ? s + "/gallery" : "gallery"; }
function folderLoveStory() { const s = getCoupleSlug(); return s ? s + "/love-stories" : "love-stories"; }
function folderQrcode() { const s = getCoupleSlug(); return s ? s + "/qrcode" : "qrcode"; }
function folderTheme() {
  const name = getVal("theme-name");
  if (!name) { toast("Isi Nama Tema terlebih dahulu", "error"); return null; }
  const slug = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return `templates/${slug}`;
}

// ═══════════════════════════════════════════════
// Login / Logout
// ═══════════════════════════════════════════════
async function doLogin() {
  const username = getVal("l-username"), password = getVal("l-password");
  if (!username || !password) return toast("Isi username dan password", "error");
  const btn = document.getElementById("l-btn");
  if (btn) { btn.disabled = true; btn.textContent = "Memuat…"; }
  try {
    const d = await api("POST", "/auth/login", { username, password });
    S.token = d.access_token;
    localStorage.setItem("wd_token", d.access_token);
    const adminName = d.admin?.name || d.admin?.username || "Permata Wedding Manager";
    const adminEmail = d.admin?.email || username || "admin@permatawedding.com";
    const topbarUser = document.getElementById("topbar-user");
    if (topbarUser) topbarUser.textContent = adminName;
    const sidebarName = document.getElementById("sidebar-user-name");
    if (sidebarName) sidebarName.textContent = adminName;
    const sidebarRole = document.getElementById("sidebar-user-role");
    if (sidebarRole) sidebarRole.textContent = adminEmail;
    showApp();
    navigate("dashboard");
    toast("Login berhasil", "success");
  } catch (_) {
    if (btn) { btn.disabled = false; btn.textContent = "Masuk ke Dashboard Admin"; }
  }
}

function doLogout() {
  S.token = "";
  localStorage.removeItem("wd_token");
  document.getElementById("app")?.classList.remove("visible");
  const loginPage = document.getElementById("login-page");
  if (loginPage) loginPage.style.display = "flex";
}
function showApp() {
  const loginPage = document.getElementById("login-page");
  if (loginPage) loginPage.style.display = "none";
  document.getElementById("app")?.classList.add("visible");
}

// ═══════════════════════════════════════════════
// Dashboard
// ═══════════════════════════════════════════════
async function loadDashboard() {
  try {
    const allOrders = await api("GET", "/orders?limit=200");
    ordersData = allOrders.items || [];
    await loadAllThemes(true);

    // Ambil statistik gabungan dari backend
    try {
      const statsRes = await api("GET", "/orders/stats");
      const statViews = document.getElementById("stat-views");
      if (statViews) statViews.textContent = Number(statsRes.total_views || 0).toLocaleString("id-ID");
    } catch (_) {}

    const statTotal = document.getElementById("stat-total");
    if (statTotal) statTotal.textContent = allOrders.pagination?.total ?? ordersData.length;
    const statActive = document.getElementById("stat-active");
    if (statActive) statActive.textContent = ordersData.filter((o) => +o.is_active).length;
    const statPaid = document.getElementById("stat-paid");
    if (statPaid) statPaid.textContent = ordersData.filter((o) => o.payment_status === "paid").length;
    const statThemes = document.getElementById("stat-themes");
    if (statThemes) statThemes.textContent = allThemesData.length;
    populateYearSelector();
    calculateAndRenderChart();
    renderPopularThemes();
    renderRecentOrders();
    updateNotifDot();
  } catch (_) {}
}

function getOrderDate(o) {
  const raw = o.created_at || o.updated_at || null;
  if (raw) { const d = new Date(raw); if (!isNaN(d.getTime())) return d; }
  return null;
}

function populateYearSelector() {
  const sel = document.getElementById("chart-year-select");
  if (!sel) return;
  const now = new Date();
  const currentYear = now.getFullYear();
  const yearsSet = new Set([currentYear.toString()]);
  (ordersData || []).forEach((o) => { const d = getOrderDate(o); if (d) yearsSet.add(d.getFullYear().toString()); });
  const sorted = Array.from(yearsSet).sort((a, b) => b - a);
  sel.innerHTML = sorted.map((y) => `<option value="${y}" ${y === currentChartYear ? "selected" : ""}>Tahun ${y} ${y == currentYear ? "(Aktif)" : "(Arsip)"}</option>`).join("");
}

function calculateAndRenderChart() {
  const container = document.getElementById("chart-container");
  if (!container) return;
  const targetYear = parseInt(currentChartYear, 10);
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const filtered = (ordersData || []).filter((o) => {
    const d = getOrderDate(o);
    return d ? d.getFullYear() === targetYear : targetYear === currentYear;
  });
  let totalRevenue = 0, totalPaid = 0;
  filtered.forEach((o) => { totalRevenue += parseFloat(o.total_price) || 0; if (o.payment_status === "paid") totalPaid++; });
  let bars = [];
  if (currentChartPeriod === "year") {
    const names = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
    const counts = new Array(12).fill(0);
    filtered.forEach((o) => { const d = getOrderDate(o); const m = d ? d.getMonth() : currentMonth; counts[m]++; });
    const max = Math.max(...counts, 1);
    bars = names.map((name, idx) => ({
      label: name, count: counts[idx],
      height: counts[idx] === 0 ? 6 : Math.max(14, Math.round((counts[idx] / max) * 140)),
      active: targetYear === currentYear && idx === currentMonth,
    }));
    const oEl = document.getElementById("chart-stat-orders"); if (oEl) oEl.textContent = filtered.length + " Pesanan";
    const rEl = document.getElementById("chart-stat-revenue"); if (rEl) rEl.textContent = "Rp " + Number(totalRevenue).toLocaleString("id-ID");
    const pEl = document.getElementById("chart-stat-paid"); if (pEl) pEl.textContent = totalPaid + " Lunas";
    const avg = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;
    const aEl = document.getElementById("chart-stat-avg"); if (aEl) aEl.textContent = "Rp " + Number(avg).toLocaleString("id-ID");
    renderBars(container, bars);
    return;
  }
  const targetMonth = targetYear === currentYear ? currentMonth : 11;
  const monthOrders = filtered.filter((o) => { const d = getOrderDate(o); return d ? d.getMonth() === targetMonth : true; });
  const weeks = [0,0,0,0];
  monthOrders.forEach((o) => { const d = getOrderDate(o); const day = d ? d.getDate() : now.getDate(); if (day <= 7) weeks[0]++; else if (day <= 14) weeks[1]++; else if (day <= 21) weeks[2]++; else weeks[3]++; });
  const max = Math.max(...weeks, 1);
  bars = weeks.map((count, idx) => ({ label: "Minggu " + (idx + 1), count, height: count === 0 ? 6 : Math.max(12, Math.round((count / max) * 140)), active: idx === 3 }));
  let monthRevenue = 0, monthPaid = 0;
  monthOrders.forEach((o) => { monthRevenue += parseFloat(o.total_price) || 0; if (o.payment_status === "paid") monthPaid++; });
  const oEl = document.getElementById("chart-stat-orders"); if (oEl) oEl.textContent = monthOrders.length + " Pesanan";
  const rEl = document.getElementById("chart-stat-revenue"); if (rEl) rEl.textContent = "Rp " + Number(monthRevenue).toLocaleString("id-ID");
  const pEl = document.getElementById("chart-stat-paid"); if (pEl) pEl.textContent = monthPaid + " Lunas";
  const avg = monthOrders.length > 0 ? Math.round(monthRevenue / monthOrders.length) : 0;
  const aEl = document.getElementById("chart-stat-avg"); if (aEl) aEl.textContent = "Rp " + Number(avg).toLocaleString("id-ID");
  renderBars(container, bars);
}

function renderBars(container, bars) {
  container.innerHTML = bars.map((b) =>
    `<div style="flex:1;min-width:36px;display:flex;flex-direction:column;align-items:center;gap:0.5rem">
      <div title="${b.count} Order" style="display:flex;gap:4px;align-items:flex-end;height:140px">
        <div style="width:20px;height:${b.height}px;background:${b.active ? "var(--primary)" : "var(--primary-container)"};border-radius:4px 4px 0 0;transition:height 0.3s"></div>
      </div>
      <span style="font-size:0.6875rem;color:${b.active ? "var(--primary)" : "var(--outline)"};font-weight:${b.active ? "700" : "500"};white-space:nowrap">${b.label}</span>
    </div>`
  ).join("");
}

function setChartPeriod(p) {
  currentChartPeriod = p;
  document.getElementById("btn-period-month")?.classList.toggle("active", p === "month");
  document.getElementById("btn-period-year")?.classList.toggle("active", p === "year");
  calculateAndRenderChart();
}
function changeChartYear(y) { currentChartYear = y; calculateAndRenderChart(); }

function renderPopularThemes() {
  const container = document.getElementById("popular-themes-list");
  if (!container) return;
  if (!allThemesData || allThemesData.length === 0) {
    container.innerHTML = '<div class="empty-state" style="padding:1rem 0"><p>Belum ada tema di database</p></div>';
    return;
  }
  const usage = {};
  (ordersData || []).forEach((o) => { if (o.theme_id) usage[o.theme_id] = (usage[o.theme_id] || 0) + 1; });
  const top = [...allThemesData].sort((a, b) => (usage[b.id] || 0) - (usage[a.id] || 0)).slice(0, 3);
  container.innerHTML = top.map((t, idx) => {
    const count = usage[t.id] || 0;
    const badges = ["★ Top 1", "#2 Top", "#3 Top"];
    return `
    <div style="display:flex;align-items:center;gap:0.75rem;padding:0.6rem 0.75rem;background:${idx === 0 ? "var(--surface-container-low)" : "var(--surface-container-lowest)"};border-radius:var(--r);border:1px solid var(--border)">
      <div style="width:36px;height:36px;flex-shrink:0;border-radius:var(--r);background:var(--surface-container-high);display:flex;align-items:center;justify-content:center;color:var(--primary);font-weight:700">#${idx + 1}</div>
      <div style="flex:1;min-width:0">
        <div style="font-size:0.8125rem;font-weight:700;color:var(--on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.name)}</div>
        <div style="font-size:0.6875rem;color:var(--outline)">${esc(t.category || "Atelier")} • ${count} Pasangan Memesan</div>
      </div>
      <span class="badge ${idx === 0 ? "badge-warn" : "badge-neutral"}" style="width:auto;flex-shrink:0">${badges[idx]}</span>
    </div>`;
  }).join("");
}

function renderRecentOrders() {
  const tbody = document.getElementById("dashboard-recent-orders-tbody");
  if (!tbody) return;
  if (!ordersData || ordersData.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8"><div class="empty-state"><p>Belum ada order masuk di database</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = ordersData.slice(0, 5).map((o) => {
    const theme = (allThemesData || []).find((t) => t.id === o.theme_id);
    const themeName = theme ? esc(theme.name) : '<span class="text-muted text-xs">—</span>';
    return `<tr>
      <td><span class="mono">${esc(o.order_code)}</span></td>
      <td><strong>${esc(o.customer_name)}</strong></td>
      <td><span>${themeName}</span></td>
      <td>${payBadge(o.payment_status)}</td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="openOrderDetail('${o.id}')">Detail</button>
      </td>
    </tr>`;
  }).join("");
}

// ═══════════════════════════════════════════════
// Themes
// ═══════════════════════════════════════════════
async function loadThemes(page = themesPagination.page) {
  themesPagination.page = page;
  const container = document.getElementById("themes-grid-container");
  if (container) container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--outline)">Memuat katalog tema...</div>';
  try {
    const q = encodeURIComponent(getVal("theme-search") || "");
    const cat = encodeURIComponent(selectedThemeCat || "");
    let queryPath = `/themes?page=${themesPagination.page}&limit=${themesPagination.limit}`;
    if (q) queryPath += `&search=${q}`;
    if (cat) queryPath += `&category=${cat}`;
    const r = await api("GET", queryPath);
    themesData = r.items || [];
    if (r.pagination) {
      themesPagination.total = r.pagination.total ?? themesData.length;
      themesPagination.totalPages = r.pagination.total_pages || Math.ceil(themesPagination.total / themesPagination.limit) || 1;
    } else {
      themesPagination.total = themesData.length;
      themesPagination.totalPages = 1;
    }
    renderThemes(themesData);
    renderThemesPagination();
  } catch (err) {
    if (container) container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--error)">Gagal memuat katalog tema</div>';
  }
}

function renderThemesPagination() {
  const infoEl = document.getElementById("themes-pagination-info");
  const controlsEl = document.getElementById("themes-pagination-controls");
  if (!controlsEl) return;
  const { page, limit, total, totalPages } = themesPagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  if (infoEl) infoEl.textContent = `Menampilkan ${start}-${end} dari ${total} tema`;
  let html = `<button class="btn btn-outline btn-sm" onclick="loadThemes(${page - 1})" ${page <= 1 ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}><span class="material-symbols-outlined icon-xs">chevron_left</span> Sebelumnya</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="btn ${i === page ? "btn-primary" : "btn-outline"} btn-sm" style="min-width:32px;padding:0.35rem 0.5rem" onclick="loadThemes(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="padding:0 0.25rem;color:var(--outline)">…</span>`;
    }
  }
  html += `<button class="btn btn-outline btn-sm" onclick="loadThemes(${page + 1})" ${page >= totalPages ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>Selanjutnya <span class="material-symbols-outlined icon-xs">chevron_right</span></button>`;
  controlsEl.innerHTML = html;
}

let themeSearchTimeout;
function filterThemes() {
  clearTimeout(themeSearchTimeout);
  themeSearchTimeout = setTimeout(() => loadThemes(1), 300);
}
function filterThemesByCat(cat, btn) {
  selectedThemeCat = cat;
  document.querySelectorAll("#theme-category-pills .cat-pill").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  loadThemes(1);
}

function renderThemes(data = themesData) {
  const container = document.getElementById("themes-grid-container");
  if (!container) return;
  const elTotal = document.getElementById("thm-stat-total");
  if (elTotal) {
    elTotal.textContent = themesPagination.total || themesData.length;
    const act = document.getElementById("thm-stat-active"); if (act) act.textContent = themesData.filter((t) => +t.is_active).length;
    const dft = document.getElementById("thm-stat-draft"); if (dft) dft.textContent = themesData.filter((t) => !+t.is_active).length;
    const cats = new Set(themesData.map((t) => t.category).filter(Boolean));
    const catEl = document.getElementById("thm-stat-cats"); if (catEl) catEl.textContent = cats.size;
  }
  if (!data || data.length === 0) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--outline)">Tidak ada tema ditemukan di database.</div>';
    return;
  }
  const usage = {};
  (ordersData || []).forEach((o) => { if (o.theme_id) usage[o.theme_id] = (usage[o.theme_id] || 0) + 1; });
  container.innerHTML = data.map((t) => {
    const thumbUrl = t.preview_img ? (t.preview_img.startsWith("http") ? t.preview_img : S.baseUrl + "/" + t.preview_img) : "assets/favicon.svg";
    const catLabel = t.category ? t.category.toUpperCase() : "ATELIER";
    const used = usage[t.id] || 0;
    return `
    <div class="theme-card">
      <div class="theme-thumb-wrap">
        <img src="${esc(t.preview_img)}" alt="${esc(t.name)}" onerror="this.src='assets/favicon.svg'" loading="lazy">
        <div class="theme-badge-overlay">
          <span class="badge badge-warn" style="font-size:0.625rem;width:auto">★ ${esc(catLabel)}</span>
          ${+t.is_active ? '<span class="badge badge-success" style="font-size:0.625rem;width:auto">Aktif</span>' : '<span class="badge badge-neutral" style="font-size:0.625rem;width:auto">Draft</span>'}
        </div>
      </div>
      <div class="theme-card-body">
        <div class="theme-card-title">${esc(t.name)}</div>
        <div class="theme-card-subtitle">Kategori: ${esc(t.category || "Umum")}${used > 0 ? " • " + used + " Pasangan Memesan" : ""}</div>
        <div class="theme-tags">
          <span class="theme-tag">${esc(t.category || "Undangan Digital")}</span>
          <span class="theme-tag">${+t.is_active ? "Siap Digunakan" : "Nonaktif"}</span>
          ${used > 0 ? '<span class="theme-tag">' + used + " Digunakan</span>" : ""}
        </div>
        <div class="theme-card-actions">
          ${t.preview_url ? '<a href="' + esc(t.preview_url) + '" target="_blank" rel="noopener" class="btn btn-outline btn-sm"><span class="material-symbols-outlined icon-xs">visibility</span> Pratinjau</a>' : ""}
          <button class="btn btn-primary btn-sm" onclick="editTheme('${t.id}')"><span class="material-symbols-outlined icon-xs">edit</span> Edit</button>
          <button class="btn btn-danger btn-sm" style="flex:0 0 auto;padding:0.35rem 0.6rem" onclick="deleteTheme('${t.id}')" title="Hapus"><span class="material-symbols-outlined icon-xs">delete</span></button>
        </div>
      </div>
    </div>`;
  }).join("");
}

function sortThemes(type) {
  let list = [...themesData];
  if (type === "nama") list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  else list.sort((a, b) => (b.id || 0) - (a.id || 0));
  renderThemes(list);
}
function selectPalette(el) {
  document.querySelectorAll(".palette-opt").forEach((p) => p.classList.remove("active"));
  el.classList.add("active");
}

function openThemeModal(id = null) {
  const t = id ? themesData.find((x) => x.id == id) : null;
  const mTitle = document.getElementById("theme-modal-title");
  if (mTitle) mTitle.textContent = t ? "Edit Tema" : "Tambah Tema";
  setVal("theme-id", t?.id ?? "");
  setVal("theme-name", t?.name ?? "");
  setVal("theme-category", t?.category ?? "");
  setVal("theme-preview", t?.preview_url ?? "");
  setVal("theme-active", t?.is_active ?? 1);
  setVal("theme-thumbnail", t?.preview_img ?? "");
  const img = document.getElementById("theme-thumb-preview");
  if (img) { if (t?.preview_img) { img.src = t.preview_img; img.style.display = "block"; } else { img.src = ""; img.style.display = "none"; } }
  openModal("theme-modal");
}
function editTheme(id) { openThemeModal(id); }
async function saveTheme() {
  const body = { name: getVal("theme-name"), category: getVal("theme-category"), preview_url: getVal("theme-preview"), preview_img: getVal("theme-thumbnail"), is_active: parseInt(getVal("theme-active")) };
  if (!body.name) return toast("Nama tema wajib", "error");
  if (!body.preview_img) return toast("Upload thumbnail terlebih dahulu", "error");
  const id = getVal("theme-id");
  try {
    if (id) await api("PUT", `/themes/${id}`, body);
    else await api("POST", "/themes", body);
    closeModal("theme-modal");
    toast(id ? "Tema diperbarui" : "Tema ditambahkan", "success");
    loadThemes();
    loadAllThemes(true);
  } catch (_) {}
}
async function deleteTheme(id) {
  if (!(await confirmDialog("Hapus Tema", "Yakin hapus tema ini?"))) return;
  try {
    await api("DELETE", `/themes/${id}`);
    toast("Tema dihapus", "success");
    loadThemes();
    loadAllThemes(true);
  } catch (_) {}
}

async function loadThemeOptions() {
  const select = document.getElementById("order-theme");
  if (!select) return;
  select.innerHTML = '<option value="">— Tanpa Tema —</option>';
  try {
    const items = await loadAllThemes();
    items.filter((t) => t.is_active).forEach((t) => {
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name + (t.category ? ` (${t.category})` : "");
      select.appendChild(opt);
    });
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Orders
// ═══════════════════════════════════════════════
async function loadOrders(page = ordersPagination.page) {
  ordersPagination.page = page;
  const tbody = document.getElementById("orders-tbody");
  if (tbody) tbody.innerHTML = emptyRow(7, "Memuat data pesanan...");
  try {
    await loadAllThemes();
    const q = encodeURIComponent(getVal("order-search") || "");
    const pkg = encodeURIComponent(getVal("order-filter-pkg") || "");
    const pay = encodeURIComponent(selectedPayStatus || "");
    let queryPath = `/orders?page=${ordersPagination.page}&limit=${ordersPagination.limit}`;
    if (q) queryPath += `&search=${q}`;
    if (pkg) queryPath += `&package_type=${pkg}`;
    if (pay) queryPath += `&payment_status=${pay}`;
    const r = await api("GET", queryPath);
    ordersData = r.items || [];
    if (r.pagination) {
      ordersPagination.total = r.pagination.total ?? ordersData.length;
      ordersPagination.totalPages = r.pagination.total_pages || Math.ceil(ordersPagination.total / ordersPagination.limit) || 1;
    } else {
      ordersPagination.total = ordersData.length;
      ordersPagination.totalPages = 1;
    }
    renderOrders(ordersData);
    renderOrdersPagination();
    updateNotifDot();
  } catch (err) {
    if (tbody) tbody.innerHTML = emptyRow(7, "Gagal memuat pesanan");
  }
}

function renderOrdersPagination() {
  const infoEl = document.getElementById("orders-pagination-info");
  const controlsEl = document.getElementById("orders-pagination-controls");
  if (!controlsEl) return;
  const { page, limit, total, totalPages } = ordersPagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  if (infoEl) infoEl.textContent = `Menampilkan ${start}-${end} dari ${total} pesanan`;
  let html = `<button class="btn btn-outline btn-sm" onclick="loadOrders(${page - 1})" ${page <= 1 ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}><span class="material-symbols-outlined icon-xs">chevron_left</span> Sebelumnya</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="btn ${i === page ? "btn-primary" : "btn-outline"} btn-sm" style="min-width:32px;padding:0.35rem 0.5rem" onclick="loadOrders(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="padding:0 0.25rem;color:var(--outline)">…</span>`;
    }
  }
  html += `<button class="btn btn-outline btn-sm" onclick="loadOrders(${page + 1})" ${page >= totalPages ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>Selanjutnya <span class="material-symbols-outlined icon-xs">chevron_right</span></button>`;
  controlsEl.innerHTML = html;
}

let searchTimeout;
function filterOrders() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => loadOrders(1), 300);
}
function filterOrdersByStatus(status, btn) {
  selectedPayStatus = status;
  document.querySelectorAll("#order-status-pills .cat-pill").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  loadOrders(1);
}

function renderOrders(data = ordersData) {
  const tbody = document.getElementById("orders-tbody");
  if (!tbody) return;
  if (!data.length) { tbody.innerHTML = emptyRow(8, "Belum ada pesanan yang sesuai filter"); return; }
  tbody.innerHTML = data.map((o) => {
    const theme = allThemesData.find((t) => t.id === o.theme_id);
    const themeName = theme ? esc(theme.name) : '<span class="text-muted text-xs">—</span>';
    const initials = getInitials(o.customer_name);
    const phone = o.customer_phone ? `<div class="text-xs text-muted" style="margin-top:2px">WA: ${esc(o.customer_phone)}</div>` : "";
    const views = Number(o.views_count || 0).toLocaleString("id-ID");
    return `<tr>
      <td><span class="mono">${esc(o.order_code || "#ORD-" + o.id)}</span></td>
      <td>
        <div style="display:flex;align-items:center;gap:0.75rem">
          <div style="width:38px;height:38px;border-radius:var(--r-full);background:var(--surface-container-high);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.75rem;color:var(--primary);flex-shrink:0">${initials}</div>
          <div style="min-width:0">
            <div style="font-weight:700;color:var(--on-surface)">${esc(o.customer_name)}</div>
            ${phone}
          </div>
        </div>
      </td>
      <td><div class="color:var(--on-surface)">${themeName}</div></td>
      <td><strong style="color:var(--on-surface)">Rp ${Number(o.total_price || 0).toLocaleString("id-ID")}</strong></td>
      <td>${payBadge(o.payment_status)}</td>
      <td>
        <span class="badge" style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;font-weight:600;font-size:0.75rem;display:inline-flex;align-items:center;gap:4px;">
          <span class="material-symbols-outlined" style="font-size:14px;">visibility</span> ${views}
        </span>
      </td>
      <td>
        <button onclick="toggleDomainStatus('${o.id}', ${o.is_active})" style="background:none;border:none;padding:0;cursor:pointer;display:inline-flex;align-items:center" title="Klik untuk ubah status domain">
          ${activeBadge(o.is_active)}
        </button>
      </td>
      <td class="td-actions" style="justify-content:flex-end">
        <button class="btn btn-outline btn-sm" onclick="previewOrderById('${o.id}')" title="Preview Website Undangan"><span class="material-symbols-outlined icon-xs">visibility</span> Preview</button>
        <button class="btn btn-outline btn-sm" onclick="recompileOrderById('${o.id}')" title="Recompile HTML Statis"><span class="material-symbols-outlined icon-xs">build</span></button>
        <button class="btn btn-outline btn-sm" onclick="openQuickWaModal('${esc(o.customer_phone)}', '${esc(o.customer_name)}', '${o.id}')" title="Kirim WhatsApp" style="color:#25d366;border-color:rgba(37,211,102,0.4)"><span class="material-symbols-outlined icon-xs">chat</span> WA</button>
        <button class="btn btn-outline btn-sm" onclick="openOrderDetail('${o.id}')" title="Buka Detail">Detail</button>
        <button class="btn btn-outline btn-sm" onclick="editOrder('${o.id}')" title="Edit Order"><span class="material-symbols-outlined icon-xs">edit</span></button>
        <button class="btn btn-danger btn-sm" onclick="deleteOrder('${o.id}')" title="Hapus Order"><span class="material-symbols-outlined icon-xs">delete</span></button>
      </td>
    </tr>`;
  }).join("");
}

async function toggleDomainStatus(id, currentStatus) {
  const nextStatus = +currentStatus === 1 ? 0 : 1;
  const action = nextStatus === 1 ? "mengaktifkan" : "menonaktifkan";
  if (!(await confirmDialog("Status Domain", `Yakin ingin ${action} domain untuk pesanan ini?`))) return;
  try {
    await api("PUT", `/orders/${id}`, { is_active: nextStatus });
    toast(`Domain berhasil ${nextStatus === 1 ? "diaktifkan" : "dinonaktifkan"}`, "success");
    loadOrders();
  } catch (_) {}
}

async function openOrderModal(id = null) {
  const o = id ? ordersData.find((x) => x.id == id) : null;
  const mTitle = document.getElementById("order-modal-title");
  if (mTitle) mTitle.textContent = o ? "Edit Order" : "Tambah Order";
  setVal("order-id", o?.id ?? "");
  setVal("order-code", o?.order_code ?? "");
  setVal("order-cust-name", o?.customer_name ?? "");
  setVal("order-cust-phone", o?.customer_phone ?? "");
  setVal("order-package", o?.package_type ?? "basic");
  setVal("order-pay-status", o?.payment_status ?? "unpaid");
  setVal("order-active", o?.is_active ?? 1);
  setVal("order-total-price", o?.total_price ?? 100000);
  setVal("order-notes", o?.notes ?? "");
  await loadThemeOptions();
  setVal("order-theme", o?.theme_id ?? "");
  openModal("order-modal");
}
function editOrder(id) { openOrderModal(id); }
async function saveOrder() {
  const body = {
    order_code: getVal("order-code") || undefined,
    customer_name: getVal("order-cust-name"),
    customer_phone: getVal("order-cust-phone"),
    package_type: getVal("order-package"),
    payment_status: getVal("order-pay-status"),
    total_price: parseFloat(getVal("order-total-price")) || 0,
    theme_id: getVal("order-theme") || null,
    notes: getVal("order-notes"),
    is_active: parseInt(getVal("order-active")) || 0,
  };
  if (!body.customer_name) return toast("Nama wajib diisi", "error");
  const id = getVal("order-id");
  try {
    let result;
    if (id) result = await api("PUT", `/orders/${id}`, body);
    else result = await api("POST", "/orders", body);
    closeModal("order-modal");
    toast(id ? "Order diperbarui" : "Order dibuat", "success");
    loadOrders();
    if (!id && result?.id) openOrderDetail(result.id);
  } catch (_) {}
}
async function deleteOrder(id) {
  if (!(await confirmDialog("Hapus Order", "Yakin? Semua data terkait akan terhapus."))) return;
  try {
    await api("DELETE", `/orders/${id}`);
    toast("Order dihapus", "success");
    loadOrders();
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Preview & Recompile Helpers
// ═══════════════════════════════════════════════
async function getOrderInvitationUrl(orderId) {
  try {
    const coupleRes = await api("GET", `/couples?order_id=${orderId}`);
    const couple = coupleRes.items?.[0];
    const slug = couple?.slug_url;
    if (slug) {
      // Periksa tahun event
      const eventsRes = await api("GET", `/events?order_id=${orderId}`);
      const events = eventsRes.items || [];
      let year = new Date().getFullYear();
      if (events[0]?.event_datetime) {
        year = new Date(events[0].event_datetime).getFullYear() || year;
      }
      return `../${year}/${slug}/`;
    }
  } catch (_) {}
  return null;
}

async function previewOrderById(orderId) {
  const url = await getOrderInvitationUrl(orderId);
  if (!url) {
    toast("Slug undangan belum dibuat atau data mempelai belum lengkap", "error");
    return;
  }
  openPreviewModalWithUrl(url);
}

function previewCurrentOrder() {
  if (!S.orderDetailId) return;
  previewOrderById(S.orderDetailId);
}

async function recompileOrderById(orderId) {
  if (!confirm("Kompilasi ulang website undangan ini dengan template dan data terbaru?")) return;
  try {
    toast("Mengompilasi ulang undangan...", "info");
    const res = await api("POST", `/orders/${orderId}/recompile`);
    toast("Undangan berhasil dikompilasi ulang!", "success");
    if (res.data?.invitation_url) {
      openPreviewModalWithUrl(res.data.invitation_url);
    }
  } catch (err) {
    toast("Gagal kompilasi: " + (err.message || "Terjadi kesalahan"), "error");
  }
}

function recompileCurrentOrder() {
  if (!S.orderDetailId) return;
  recompileOrderById(S.orderDetailId);
}

function openPreviewModalWithUrl(url) {
  const iframe = document.getElementById("preview-modal-iframe");
  const extLink = document.getElementById("preview-modal-external-link");
  if (iframe) iframe.src = url;
  if (extLink) extLink.href = url;
  setPreviewDevice("desktop");
  openModal("invitation-preview-modal");
}

function setPreviewDevice(device, btn) {
  const iframe = document.getElementById("preview-modal-iframe");
  const badge = document.getElementById("preview-modal-badge");
  if (btn) {
    btn.parentElement.querySelectorAll("button").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  }
  if (!iframe) return;
  if (device === "mobile") {
    iframe.style.width = "375px";
    iframe.style.borderRadius = "20px";
    iframe.style.boxShadow = "0 10px 30px rgba(0,0,0,0.5)";
    if (badge) {
      badge.textContent = "Mobile (375px)";
      badge.className = "badge badge-warn";
    }
  } else {
    iframe.style.width = "100%";
    iframe.style.borderRadius = "0";
    iframe.style.boxShadow = "none";
    if (badge) {
      badge.textContent = "Desktop View";
      badge.className = "badge badge-info";
    }
  }
}

// ═══════════════════════════════════════════════
// Order Detail
// ═══════════════════════════════════════════════
function openOrderDetail(id) {
  S.orderDetailId = id;
  navigate("order-detail");
}

// [FIX #2] Tampilkan Order ID + tombol copy di header detail
function loadOrderDetail() {
  const o = ordersData.find((x) => x.id == S.orderDetailId);
  const odTitle = document.getElementById("od-title");
  if (odTitle) {
    if (o) {
      odTitle.innerHTML = `${esc(o.order_code)} — ${esc(o.customer_name)}
        <span
          onclick="navigator.clipboard.writeText('${S.orderDetailId}').then(()=>toast('ID order disalin','success'))"
          title="Salin Order ID: ${S.orderDetailId}"
          style="display:inline-flex;align-items:center;gap:4px;margin-left:10px;
                 padding:2px 10px;background:var(--surface-container-high);
                 border:1px solid var(--border);border-radius:var(--r-full);
                 font-size:0.72rem;font-weight:600;color:var(--outline);
                 vertical-align:middle;cursor:pointer;user-select:none;">
          ID: ${S.orderDetailId}
          <span class="material-symbols-outlined" style="font-size:0.875rem">content_copy</span>
        </span>`;
    } else {
      odTitle.textContent = "Detail Order";
    }
  }
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  document.querySelector('.tab-btn[data-tab="couple"]')?.classList.add("active");
  document.getElementById("tab-couple")?.classList.add("active");
  loadCouple();
}

function switchTab(tab) {
  S.orderDetailTab = tab;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === `tab-${tab}`));
  tabLoaders[tab]?.();
}

let _coupleId = null;
async function loadCouple() {
  try {
    const d = await api("GET", `/couples?order_id=${S.orderDetailId}&limit=1`);
    const items = d.items || [];
    if (items.length > 0) { fillCoupleForm(items[0]); _coupleId = items[0].id; }
    else { fillCoupleForm({}); _coupleId = null; }
  } catch (_) { fillCoupleForm({}); _coupleId = null; }
}
function fillCoupleForm(d) {
  setVal("c-slug", d.slug_url ?? "");
  setVal("c-cover", d.cover_photo_url ?? "");
  setVal("c-groom-name", d.groom_name ?? "");
  setVal("c-groom-nick", d.groom_nickname ?? "");
  setVal("c-groom-father", d.groom_father ?? "");
  setVal("c-groom-mother", d.groom_mother ?? "");
  setVal("c-groom-photo", d.groom_photo_url ?? "");
  setVal("c-groom-addr", d.groom_address ?? "");
  setVal("c-bride-name", d.bride_name ?? "");
  setVal("c-bride-nick", d.bride_nickname ?? "");
  setVal("c-bride-father", d.bride_father ?? "");
  setVal("c-bride-mother", d.bride_mother ?? "");
  setVal("c-bride-photo", d.bride_photo_url ?? "");
  setVal("c-bride-addr", d.bride_address ?? "");
  showPreview("c-cover", "c-cover-preview");
  showPreview("c-groom-photo", "c-groom-preview");
  showPreview("c-bride-photo", "c-bride-preview");
}
function showPreview(inputId, previewId) {
  const v = getVal(inputId), img = document.getElementById(previewId);
  if (img) { if (v) { img.src = v; img.style.display = "block"; } else { img.style.display = "none"; } }
}
async function saveCouple() {
  const body = {
    order_id: S.orderDetailId,
    slug_url: getVal("c-slug"),
    cover_photo_url: getVal("c-cover") || null,
    groom_name: getVal("c-groom-name"),
    groom_nickname: getVal("c-groom-nick"),
    groom_father: getVal("c-groom-father"),
    groom_mother: getVal("c-groom-mother"),
    groom_photo_url: getVal("c-groom-photo") || null,
    groom_address: getVal("c-groom-addr"),
    bride_name: getVal("c-bride-name"),
    bride_nickname: getVal("c-bride-nick"),
    bride_father: getVal("c-bride-father"),
    bride_mother: getVal("c-bride-mother"),
    bride_photo_url: getVal("c-bride-photo") || null,
    bride_address: getVal("c-bride-addr"),
  };
  if (!body.groom_name || !body.bride_name || !body.slug_url) return toast("Nama mempelai dan slug URL wajib diisi", "error");
  try {
    if (_coupleId) await api("PUT", `/couples/${_coupleId}`, body);
    else await api("POST", "/couples", body);
    toast("Data mempelai disimpan", "success");
    loadCouple();
  } catch (_) {}
}

async function loadTabItems(endpoint, tbodyId, cols, renderRow) {
  try {
    const d = await api("GET", `/${endpoint}?order_id=${S.orderDetailId}&limit=100`);
    const items = d.items || [];
    const tbody = document.getElementById(tbodyId);
    if (!tbody) return items;
    if (!items.length) { tbody.innerHTML = emptyRow(cols, "Belum ada data"); return items; }
    tbody.innerHTML = items.map(renderRow).join("");
    return items;
  } catch (_) { return []; }
}
async function deleteItem(endpoint, id, reloadFn) {
  if (!(await confirmDialog("Hapus Data", "Yakin ingin menghapus?"))) return;
  try {
    await api("DELETE", `/${endpoint}/${id}`);
    toast("Dihapus", "success");
    reloadFn();
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Tab: Events
// ═══════════════════════════════════════════════
let _evId = null;
async function loadEvents() {
  await loadTabItems("events", "events-tbody", 5,
    (e) => `<tr><td><strong>${esc(e.event_name)}</strong></td><td>${(e.event_datetime || "").replace("T", " ").slice(0, 16)}</td><td>${esc(e.venue_name || "—")}</td><td>${e.sort_order ?? 0}</td><td class="td-actions"><button class="btn btn-outline btn-sm" onclick="editEvent('${e.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteItem('events','${e.id}',loadEvents)">Hapus</button></td></tr>`
  );
}
function openEventModal() {
  _evId = null;
  ["ev-name","ev-datetime","ev-end","ev-venue","ev-address","ev-maps","ev-desc"].forEach(clearEl);
  setVal("ev-sort", 0);
  const mTitle = document.getElementById("ev-modal-title"); if (mTitle) mTitle.textContent = "Tambah Acara";
  openModal("ev-modal");
}
async function editEvent(id) {
  try {
    const d = await api("GET", `/events/${id}`);
    _evId = id;
    setVal("ev-name", d.event_name);
    setVal("ev-datetime", (d.event_datetime || "").slice(0, 16));
    setVal("ev-end", (d.event_end || "").slice(0, 16));
    setVal("ev-venue", d.venue_name);
    setVal("ev-address", d.venue_address);
    setVal("ev-maps", d.google_maps_url);
    setVal("ev-desc", d.description);
    setVal("ev-sort", d.sort_order ?? 0);
    const mTitle = document.getElementById("ev-modal-title"); if (mTitle) mTitle.textContent = "Edit Acara";
    openModal("ev-modal");
  } catch (_) {}
}
async function saveEvent() {
  const body = {
    order_id: S.orderDetailId,
    event_name: getVal("ev-name"),
    event_datetime: getVal("ev-datetime"),
    event_end: getVal("ev-end") || null,
    venue_name: getVal("ev-venue"),
    venue_address: getVal("ev-address"),
    google_maps_url: getVal("ev-maps"),
    description: getVal("ev-desc"),
    sort_order: parseInt(getVal("ev-sort")) || 0,
  };
  if (!body.event_name || !body.event_datetime) return toast("Nama dan waktu wajib", "error");
  try {
    if (_evId) await api("PUT", `/events/${_evId}`, body);
    else await api("POST", "/events", body);
    closeModal("ev-modal");
    toast("Acara disimpan", "success");
    loadEvents();
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Tab: Music — CDN Permata Wedding + Audio Preview
// ═══════════════════════════════════════════════
const CDN_API_URL = window.location.origin.includes("localhost")
  ? window.location.origin + "/order-permata/cdn/api/music.php"
  : window.location.origin + "/cdn/api/music.php";
let MUSIC_PRESETS = [
  { title: "Sinarengan",  artist: "Permata Wedding", url: "cdn/uploads/music/denny-caknan-feat-bella-bonita-sinarengan.mp3" },
  { title: "Kabagyan",    artist: "Permata Wedding", url: "cdn/uploads/music/kabagyan-sadewok.mp3" },
  { title: "Pujaningsih", artist: "Permata Wedding", url: "cdn/uploads/music/pujaningsih-wisnu-jaya-trimmed.mp3" },
  { title: "Smaragita",   artist: "Permata Wedding", url: "cdn/uploads/music/smaragita.mp3" },
];
let currentPreviewAudio = null;

async function loadMusicPresetsFromCDN() {
  try {
    const res = await fetch(CDN_API_URL);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      MUSIC_PRESETS = data.map((item) => {
        let musicUrl = item.url;
        // Ubah link absolut domain / localhost menjadi path relatif CDN lokal jika relevan
        if (musicUrl.includes('/uploads/music/')) {
          const fileName = musicUrl.split('/uploads/music/').pop();
          musicUrl = 'cdn/uploads/music/' + fileName;
        }
        return {
          title:  item.judul  || item.title   || "Tanpa Judul",
          artist: item.artist || item.penyanyi || "Permata Wedding",
          url:    musicUrl,
        };
      });
      // Perbarui dropdown jika modal musik sedang terbuka
      const sel = document.getElementById("mu-preset");
      if (sel) sel.innerHTML = getMusicPresetOptionsHtml();
      console.log(`[CDN Musik] Berhasil memuat ${MUSIC_PRESETS.length} lagu lokal.`);
    }
  } catch (err) {
    console.warn("[CDN Musik] Menggunakan preset cadangan lokal:", err.message);
  }
}

function getMusicPresetOptionsHtml() {
  return `<option value="">— Pilih preset atau isi manual —</option>` +
    MUSIC_PRESETS.map((m, i) =>
      `<option value="${i}">${esc(m.title)} — ${esc(m.artist)}</option>`
    ).join("");
}

let _muId = null;
async function loadMusic() {
  await loadTabItems("music", "music-tbody", 4,
    (m) => `<tr>
      <td><strong>${esc(m.title)}</strong>${m.artist ? `<br><small class="text-muted">${esc(m.artist)}</small>` : ""}</td>
      <td>
        <a href="${esc(m.audio_url)}" target="_blank" rel="noopener" class="text-muted text-sm">
          <span class="material-symbols-outlined icon-xs">link</span> Audio
        </a>
        <button onclick="previewMusicUrl('${esc(m.audio_url)}')"
          style="margin-left:6px;background:#fff1f2;color:#f43f6e;border:1px solid #fecdd3;border-radius:6px;padding:2px 8px;font-size:0.75rem;cursor:pointer;">▶</button>
      </td>
      <td>
        <span class="badge ${m.autoplay ? "badge-success" : "badge-neutral"}" style="width:auto">Auto</span>
        <span class="badge ${m.loop    ? "badge-success" : "badge-neutral"}" style="width:auto">Loop</span>
      </td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="editMusic('${m.id}')">Edit</button>
        <button class="btn btn-danger btn-sm"  onclick="deleteItem('music','${m.id}',loadMusic)">Hapus</button>
      </td>
    </tr>`
  );
}

function previewMusicUrl(url) {
  if (!url) return;
  stopAllAudioPreview();
  // Jika URL berupa path relatif lokal 'cdn/uploads/music/...', sesuaikan dengan origin saat ini
  let playUrl = url;
  if (!playUrl.startsWith('http://') && !playUrl.startsWith('https://')) {
    const rootBase = window.location.origin.includes('localhost')
      ? window.location.origin + '/order-permata/'
      : window.location.origin + '/';
    playUrl = rootBase + playUrl.replace(/^\/+/, '');
  }
  currentPreviewAudio = new Audio(playUrl);
  currentPreviewAudio.onended = () => { currentPreviewAudio = null; };
  currentPreviewAudio.onerror = () => { toast("Gagal memutar audio", "error"); currentPreviewAudio = null; };
  currentPreviewAudio.play().catch(() => {});
}

function stopAllAudioPreview() {
  if (currentPreviewAudio) {
    currentPreviewAudio.pause();
    currentPreviewAudio.currentTime = 0;
    currentPreviewAudio = null;
  }
}

function openMusicModal() {
  _muId = null;
  ["mu-title", "mu-artist", "mu-url"].forEach(clearEl);
  setVal("mu-sort", 0);
  const ap = document.getElementById("mu-autoplay"); if (ap) ap.checked = false;
  const lp = document.getElementById("mu-loop");     if (lp) lp.checked = true;
  const mTitle = document.getElementById("mu-modal-title"); if (mTitle) mTitle.textContent = "Tambah Musik";
  const preset = document.getElementById("mu-preset"); if (preset) preset.innerHTML = getMusicPresetOptionsHtml();
  stopAllAudioPreview();
  openModal("mu-modal");
}
async function editMusic(id) {
  try {
    const d = await api("GET", `/music/${id}`);
    _muId = id;
    setVal("mu-title",  d.title);
    setVal("mu-artist", d.artist);
    setVal("mu-url",    d.audio_url);
    setVal("mu-sort",   d.sort_order ?? 0);
    const ap = document.getElementById("mu-autoplay"); if (ap) ap.checked = !!d.autoplay;
    const lp = document.getElementById("mu-loop");     if (lp) lp.checked = !!d.loop;
    const mTitle = document.getElementById("mu-modal-title"); if (mTitle) mTitle.textContent = "Edit Musik";
    const preset = document.getElementById("mu-preset"); if (preset) preset.innerHTML = getMusicPresetOptionsHtml();
    stopAllAudioPreview();
    openModal("mu-modal");
  } catch (_) {}
}
async function saveMusic() {
  const body = {
    order_id:   S.orderDetailId,
    title:      getVal("mu-title"),
    artist:     getVal("mu-artist"),
    audio_url:  getVal("mu-url"),
    autoplay:   document.getElementById("mu-autoplay")?.checked ? 1 : 0,
    loop:       document.getElementById("mu-loop")?.checked ? 1 : 0,
    sort_order: parseInt(getVal("mu-sort")) || 0,
  };
  if (!body.title || !body.audio_url) return toast("Judul dan URL wajib", "error");
  try {
    if (_muId) await api("PUT", `/music/${_muId}`, body);
    else       await api("POST", "/music", body);
    closeModal("mu-modal");
    toast("Musik disimpan", "success");
    loadMusic();
    stopAllAudioPreview();
  } catch (_) {}
}
function applyMusicPreset() {
  const select = document.getElementById("mu-preset");
  const idx = select?.value;
  if (idx === "" || !MUSIC_PRESETS[idx]) return;
  const m = MUSIC_PRESETS[idx];
  setVal("mu-title",  m.title);
  setVal("mu-artist", m.artist);
  setVal("mu-url",    m.url);
  stopAllAudioPreview();
  previewMusicUrl(m.url);
}
function toggleModalAudioPreview() {
  const url = getVal("mu-url");
  if (!url) { toast("Isi URL audio terlebih dahulu", "error"); return; }
  if (currentPreviewAudio && !currentPreviewAudio.paused) { stopAllAudioPreview(); return; }
  previewMusicUrl(url);
}

// ═══════════════════════════════════════════════
// Tab: Love Stories
// ═══════════════════════════════════════════════
let _lsId = null;
async function loadLoveStories() {
  await loadTabItems("love-stories", "ls-tbody", 4,
    (s) => `<tr><td><strong>${esc(s.title)}</strong></td><td>${s.story_date || "—"}</td><td class="truncate">${esc((s.content || "").slice(0, 60))}</td><td class="td-actions"><button class="btn btn-outline btn-sm" onclick="editLoveStory('${s.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteItem('love-stories','${s.id}',loadLoveStories)">Hapus</button></td></tr>`
  );
}
function openLsModal() {
  _lsId = null;
  ["ls-title","ls-date","ls-content","ls-photo"].forEach(clearEl);
  setVal("ls-sort", 0);
  const mTitle = document.getElementById("ls-modal-title"); if (mTitle) mTitle.textContent = "Tambah Cerita";
  openModal("ls-modal");
}
async function editLoveStory(id) {
  try {
    const d = await api("GET", `/love-stories/${id}`);
    _lsId = id;
    setVal("ls-title",   d.title);
    setVal("ls-date",    d.story_date);
    setVal("ls-content", d.content);
    setVal("ls-photo",   d.photo_url);
    setVal("ls-sort",    d.sort_order ?? 0);
    const mTitle = document.getElementById("ls-modal-title"); if (mTitle) mTitle.textContent = "Edit Cerita";
    openModal("ls-modal");
  } catch (_) {}
}
async function saveLoveStory() {
  const body = { order_id: S.orderDetailId, title: getVal("ls-title"), story_date: getVal("ls-date") || null, content: getVal("ls-content"), photo_url: getVal("ls-photo") || null, sort_order: parseInt(getVal("ls-sort")) || 0 };
  if (!body.title) return toast("Judul wajib", "error");
  try {
    if (_lsId) await api("PUT", `/love-stories/${_lsId}`, body);
    else       await api("POST", "/love-stories", body);
    closeModal("ls-modal");
    toast("Cerita disimpan", "success");
    loadLoveStories();
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Tab: Wallets
// ═══════════════════════════════════════════════
let _wlId = null;
async function loadWallets() {
  await loadTabItems("digital-wallets", "wl-tbody", 4,
    (w) => `<tr><td><strong>${esc(w.bank_name || w.wallet_type)}</strong><br><small class="text-muted text-xs">${esc(w.wallet_type)}</small></td><td><span class="mono">${esc(w.account_number || "—")}</span></td><td>${esc(w.account_holder)}</td><td class="td-actions"><button class="btn btn-outline btn-sm" onclick="editWallet('${w.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteItem('digital-wallets','${w.id}',loadWallets)">Hapus</button></td></tr>`
  );
}
function openWalletModal() {
  _wlId = null;
  ["wl-bank","wl-number","wl-holder","wl-qr"].forEach(clearEl);
  setVal("wl-type", "bank");
  const mTitle = document.getElementById("wl-modal-title"); if (mTitle) mTitle.textContent = "Tambah Rekening";
  openModal("wl-modal");
}
async function editWallet(id) {
  try {
    const d = await api("GET", `/digital-wallets/${id}`);
    _wlId = id;
    setVal("wl-type",   d.wallet_type);
    setVal("wl-bank",   d.bank_name);
    setVal("wl-number", d.account_number);
    setVal("wl-holder", d.account_holder);
    setVal("wl-qr",     d.qr_code_url);
    const mTitle = document.getElementById("wl-modal-title"); if (mTitle) mTitle.textContent = "Edit Rekening";
    openModal("wl-modal");
  } catch (_) {}
}
async function saveWallet() {
  const body = { order_id: S.orderDetailId, wallet_type: getVal("wl-type"), bank_name: getVal("wl-bank"), account_number: getVal("wl-number"), account_holder: getVal("wl-holder"), qr_code_url: getVal("wl-qr") || null };
  if (!body.account_holder) return toast("Atas nama wajib", "error");
  try {
    if (_wlId) await api("PUT", `/digital-wallets/${_wlId}`, body);
    else       await api("POST", "/digital-wallets", body);
    closeModal("wl-modal");
    toast("Rekening disimpan", "success");
    loadWallets();
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Tab: Gallery
// ═══════════════════════════════════════════════
let _glId = null;
async function loadGallery() {
  await loadTabItems("galleries", "gl-tbody", 4,
    (g) => `
    <tr>
      <td><img src="${esc(g.photo_url)}" style="width:52px;height:40px;object-fit:cover;border-radius:var(--r);border:1px solid var(--border)" onerror="this.style.display='none'"></td>
      <td>${esc(g.caption || "—")}</td>
      <td>${g.is_cover ? '<span class="badge badge-warn" style="width:auto">Cover</span>' : "—"}</td>
      <td class="td-actions">
        <button class="btn btn-outline btn-sm" onclick="editGallery('${g.id}')">Edit</button>
        <button class="btn btn-danger btn-sm"  onclick="deleteItem('galleries','${g.id}',loadGallery)">Hapus</button>
      </td>
    </tr>`
  );
}
function openGalleryModal() {
  _glId = null;
  clearEl("gl-url"); clearEl("gl-caption");
  setVal("gl-sort", 0);
  const cov = document.getElementById("gl-cover"); if (cov) cov.checked = false;
  const mTitle = document.getElementById("gl-modal-title"); if (mTitle) mTitle.textContent = "Tambah Foto";
  const sm = document.getElementById("gl-single-mode"); if (sm) sm.style.display = "none";
  const mm = document.getElementById("gl-multi-mode");  if (mm) mm.style.display = "block";
  const mp = document.getElementById("gl-multi-preview"); if (mp) mp.innerHTML = "";
  const mc = document.getElementById("gl-multi-count");   if (mc) mc.textContent = "";
  openModal("gl-modal");
}
async function editGallery(id) {
  try {
    const d = await api("GET", `/galleries/${id}`);
    _glId = id;
    setVal("gl-url",     d.photo_url);
    setVal("gl-caption", d.caption);
    setVal("gl-sort",    d.sort_order ?? 0);
    const cov = document.getElementById("gl-cover"); if (cov) cov.checked = !!d.is_cover;
    const mTitle = document.getElementById("gl-modal-title"); if (mTitle) mTitle.textContent = "Edit Foto";
    const sm = document.getElementById("gl-single-mode"); if (sm) sm.style.display = "block";
    const mm = document.getElementById("gl-multi-mode");  if (mm) mm.style.display = "none";
    openModal("gl-modal");
  } catch (_) {}
}
async function saveGallery() {
  if (_glId) {
    const body = { order_id: S.orderDetailId, photo_url: getVal("gl-url"), caption: getVal("gl-caption"), is_cover: document.getElementById("gl-cover")?.checked ? 1 : 0, sort_order: parseInt(getVal("gl-sort")) || 0 };
    if (!body.photo_url) return toast("URL foto wajib", "error");
    try { await api("PUT", `/galleries/${_glId}`, body); closeModal("gl-modal"); toast("Foto diperbarui", "success"); loadGallery(); } catch (_) {}
    return;
  }
  const fileInput = document.getElementById("gl-multi-input");
  const files = fileInput?.files;
  if (!files || files.length === 0) return toast("Pilih minimal 1 foto", "error");
  const saveBtn = document.getElementById("btn-save-gallery");
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = "Mengupload…"; }
  const folder = folderGallery();
  const urls = await uploadMultipleFiles(files, folder, "galeri");
  if (urls.length === 0) { if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Simpan"; } return; }
  const caption = getVal("gl-caption");
  let saved = 0;
  for (let i = 0; i < urls.length; i++) {
    try {
      await api("POST", "/galleries", { order_id: S.orderDetailId, photo_url: urls[i], caption: caption || null, is_cover: i === 0 && document.getElementById("gl-cover")?.checked ? 1 : 0, sort_order: parseInt(getVal("gl-sort")) + i });
      saved++;
    } catch (_) {}
  }
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = "Simpan"; }
  closeModal("gl-modal");
  toast(`${saved} foto berhasil ditambahkan`, "success");
  loadGallery();
}
function previewMultiGallery(input) {
  const container = document.getElementById("gl-multi-preview");
  const countEl   = document.getElementById("gl-multi-count");
  if (!container) return;
  container.innerHTML = "";
  const files = input.files;
  if (!files || !files.length) { if (countEl) countEl.textContent = ""; return; }
  if (countEl) countEl.textContent = `${files.length} foto dipilih`;
  const limit = Math.min(files.length, 20);
  for (let i = 0; i < limit; i++) {
    const file = files[i];
    if (!file.type.startsWith("image/")) continue;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = document.createElement("img");
      img.src = e.target.result;
      img.style.cssText = "width:64px;height:64px;object-fit:cover;border-radius:var(--r);border:1px solid var(--border)";
      container.appendChild(img);
    };
    reader.readAsDataURL(file);
  }
  if (files.length > 20 && countEl) countEl.textContent += " (maks 20 per upload)";
}

// ═══════════════════════════════════════════════
// Tab: Livestreaming
// ═══════════════════════════════════════════════
let _lvId = null;
async function loadLivestreaming() {
  await loadTabItems("livestreaming", "lv-tbody", 4,
    (l) => `<tr><td>${esc(l.title || "—")}</td><td><a href="${esc(l.youtube_url)}" target="_blank" rel="noopener" class="text-muted text-sm"><span class="material-symbols-outlined icon-xs">link</span> YouTube</a></td><td>${activeBadge(l.is_active)}</td><td class="td-actions"><button class="btn btn-outline btn-sm" onclick="editLivestreaming('${l.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteItem('livestreaming','${l.id}',loadLivestreaming)">Hapus</button></td></tr>`
  );
}
function openLvModal() {
  _lvId = null;
  ["lv-title","lv-url","lv-start","lv-end"].forEach(clearEl);
  setVal("lv-active", 1);
  const mTitle = document.getElementById("lv-modal-title"); if (mTitle) mTitle.textContent = "Tambah Livestreaming";
  openModal("lv-modal");
}
async function editLivestreaming(id) {
  try {
    const d = await api("GET", `/livestreaming/${id}`);
    _lvId = id;
    setVal("lv-title",  d.title);
    setVal("lv-url",    d.youtube_url);
    setVal("lv-start",  (d.stream_start || "").slice(0, 16));
    setVal("lv-end",    (d.stream_end   || "").slice(0, 16));
    setVal("lv-active", d.is_active);
    const mTitle = document.getElementById("lv-modal-title"); if (mTitle) mTitle.textContent = "Edit Livestreaming";
    openModal("lv-modal");
  } catch (_) {}
}
async function saveLivestreaming() {
  const body = { order_id: S.orderDetailId, title: getVal("lv-title"), youtube_url: getVal("lv-url"), stream_start: getVal("lv-start") || null, stream_end: getVal("lv-end") || null, is_active: parseInt(getVal("lv-active")) };
  if (!body.youtube_url) return toast("URL YouTube wajib", "error");
  try {
    if (_lvId) await api("PUT", `/livestreaming/${_lvId}`, body);
    else       await api("POST", "/livestreaming", body);
    closeModal("lv-modal");
    toast("Livestreaming disimpan", "success");
    loadLivestreaming();
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Tab: Entertainment
// ═══════════════════════════════════════════════
let _enId = null;
async function loadEntertainment() {
  await loadTabItems("entertainment", "en-tbody", 4,
    (e) => `<tr><td><strong>${esc(e.name)}</strong></td><td>${esc(e.type || "—")}</td><td class="truncate">${esc((e.description || "").slice(0, 60))}</td><td class="td-actions"><button class="btn btn-outline btn-sm" onclick="editEntertainment('${e.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteItem('entertainment','${e.id}',loadEntertainment)">Hapus</button></td></tr>`
  );
}
function openEnModal() {
  _enId = null;
  ["en-name","en-type","en-desc"].forEach(clearEl);
  setVal("en-sort", 0);
  const mTitle = document.getElementById("en-modal-title"); if (mTitle) mTitle.textContent = "Tambah Hiburan";
  openModal("en-modal");
}
async function editEntertainment(id) {
  try {
    const d = await api("GET", `/entertainment/${id}`);
    _enId = id;
    setVal("en-name", d.name);
    setVal("en-type", d.type);
    setVal("en-desc", d.description);
    setVal("en-sort", d.sort_order ?? 0);
    const mTitle = document.getElementById("en-modal-title"); if (mTitle) mTitle.textContent = "Edit Hiburan";
    openModal("en-modal");
  } catch (_) {}
}
async function saveEntertainment() {
  const body = { order_id: S.orderDetailId, name: getVal("en-name"), type: getVal("en-type"), description: getVal("en-desc"), sort_order: parseInt(getVal("en-sort")) || 0 };
  if (!body.name) return toast("Nama wajib", "error");
  try {
    if (_enId) await api("PUT", `/entertainment/${_enId}`, body);
    else       await api("POST", "/entertainment", body);
    closeModal("en-modal");
    toast("Hiburan disimpan", "success");
    loadEntertainment();
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Tab: Comments
// ═══════════════════════════════════════════════
async function loadComments() {
  try {
    const d = await api("GET", `/comments?order_id=${S.orderDetailId}&limit=200`);
    const items = d.items || [];
    commentsCache = items;
    const hEl = document.getElementById("cm-hadir");  if (hEl) hEl.textContent = items.filter((c) => c.attendance === "hadir").length;
    const tEl = document.getElementById("cm-tidak");  if (tEl) tEl.textContent = items.filter((c) => c.attendance === "tidak_hadir").length;
    const rEl = document.getElementById("cm-ragu");   if (rEl) rEl.textContent = items.filter((c) => c.attendance === "ragu_ragu").length;
    const totEl = document.getElementById("cm-total"); if (totEl) totEl.textContent = items.length;
    const tbody = document.getElementById("cm-tbody");
    const attMap = { hadir: "badge-success", tidak_hadir: "badge-danger", ragu_ragu: "badge-warn" };
    if (!tbody) return;
    if (!items.length) { tbody.innerHTML = emptyRow(4, "Belum ada ucapan"); return; }
    tbody.innerHTML = items.map((c) =>
      `<tr><td><strong>${esc(c.guest_name)}</strong></td><td>${esc(c.content)}</td><td><span class="badge ${attMap[c.attendance] || "badge-neutral"}" style="width:auto">${esc((c.attendance || "").replace(/_/g, " "))}</span></td><td class="td-actions"><button class="btn btn-outline btn-sm" onclick="editComment('${c.id}')">Edit</button><button class="btn btn-danger btn-sm" onclick="deleteComment('${c.id}')">Hapus</button></td></tr>`
    ).join("");
  } catch (_) {}
}
function editComment(id) {
  const c = commentsCache.find((x) => String(x.id) === String(id));
  if (!c) return;
  setVal("cm-edit-id",         c.id);
  setVal("cm-edit-name",       c.guest_name);
  setVal("cm-edit-content",    c.content);
  setVal("cm-edit-attendance", c.attendance);
  openModal("cm-modal");
}
async function saveComment() {
  const id = getVal("cm-edit-id");
  try {
    await api("PUT", `/comments/${id}`, { guest_name: getVal("cm-edit-name"), content: getVal("cm-edit-content"), attendance: getVal("cm-edit-attendance") });
    closeModal("cm-modal");
    toast("Ucapan diperbarui", "success");
    loadComments();
  } catch (_) {}
}
async function deleteComment(id) {
  if (!(await confirmDialog("Hapus", "Yakin?"))) return;
  try { await api("DELETE", `/comments/${id}`); toast("Dihapus", "success"); loadComments(); } catch (_) {}
}

// ── Ekspor & Salin Rekap RSVP Tamu ──
function exportRsvpCsv() {
  if (!commentsCache || !commentsCache.length) {
    toast("Belum ada data ucapan/konfirmasi tamu untuk diekspor", "info");
    return;
  }
  const currentOrder = (ordersData || []).find((x) => String(x.id) === String(S.orderDetailId));
  const orderCode = currentOrder?.order_code || "RSVP";
  const clientName = currentOrder?.customer_name || "Tamu";

  const headers = ["No", "Nama Tamu", "Status Kehadiran", "Pesan Ucapan / Doa", "Waktu Kirim"];
  const rows = commentsCache.map((c, i) => [
    i + 1,
    `"${(c.guest_name || "").replace(/"/g, '""')}"`,
    `"${(c.attendance || "").replace(/_/g, " ")}"`,
    `"${(c.content || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`,
    `"${c.created_at || ""}"`,
  ]);

  const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rekap-rsvp-${orderCode}-${clientName.toLowerCase().replace(/[^a-z0-9]/g, "-")}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("File CSV Rekap Tamu berhasil diunduh ✓", "success");
}

async function copyRsvpSummaryToClipboard() {
  if (!commentsCache || !commentsCache.length) {
    toast("Belum ada data RSVP untuk disalin", "info");
    return;
  }
  const currentOrder = (ordersData || []).find((x) => String(x.id) === String(S.orderDetailId));
  const clientName = currentOrder?.customer_name || "Kak";

  const hadirList = commentsCache.filter((c) => c.attendance === "hadir");
  const tidakList = commentsCache.filter((c) => c.attendance === "tidak_hadir");
  const raguList  = commentsCache.filter((c) => c.attendance === "ragu_ragu");

  let summaryText = `*REKAPITULASI RSVP & KEHADIRAN TAMU*\n`;
  summaryText += `Pesanan: *${currentOrder?.order_code || "Undangan"}* (${clientName})\n`;
  summaryText += `Waktu Rekap: ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })} WIB\n\n`;
  summaryText += `📊 *Ringkasan Kehadiran:*\n`;
  summaryText += `• Hadir Pasti: *${hadirList.length} tamu*\n`;
  summaryText += `• Berhalangan: *${tidakList.length} tamu*\n`;
  summaryText += `• Masih Ragu / Belum Konfirmasi: *${raguList.length} tamu*\n`;
  summaryText += `• Total Konfirmasi Masuk: *${commentsCache.length} tamu*\n\n`;

  summaryText += `📝 *Daftar Tamu Hadir:*\n`;
  if (hadirList.length > 0) {
    hadirList.forEach((h, idx) => {
      summaryText += `${idx + 1}. *${h.guest_name}*\n`;
      if (h.content && h.content.trim()) {
        summaryText += `   _"${h.content.trim()}"_\n`;
      }
    });
  } else {
    summaryText += `(Belum ada konfirmasi hadir)\n`;
  }

  if (tidakList.length > 0) {
    summaryText += `\n❌ *Daftar Tamu Berhalangan:*\n`;
    tidakList.forEach((t, idx) => {
      summaryText += `${idx + 1}. ${t.guest_name}\n`;
      if (t.content && t.content.trim()) {
        summaryText += `   _"${t.content.trim()}"_\n`;
      }
    });
  }

  summaryText += `\n— Permata Wedding Digital Invitation —`;

  try {
    await navigator.clipboard.writeText(summaryText);
    toast("Rekap RSVP berhasil disalin ke clipboard! Siap dikirim ke WhatsApp klien ✓", "success");
  } catch (err) {
    // Fallback prompt jika clipboard API ditolak browser
    prompt("Salin teks rekap berikut:", summaryText);
  }
}


// ═══════════════════════════════════════════════
// Testimonials
// ═══════════════════════════════════════════════
let testimonialsData = [];
async function loadTestimonials(page = tmPagination.page) {
  tmPagination.page = page;
  const container = document.getElementById("testimonials-grid");
  if (container) container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--outline)">Memuat testimoni...</div>';
  try {
    const q   = encodeURIComponent(getVal("tm-search") || "");
    const pub  = tmSelectedStatus !== "" ? encodeURIComponent(tmSelectedStatus) : "";
    const rating = tmSelectedRating > 0 ? encodeURIComponent(tmSelectedRating) : "";
    let queryPath = `/testimonials?page=${tmPagination.page}&limit=${tmPagination.limit}`;
    if (q) queryPath += `&search=${q}`;
    if (pub !== "") queryPath += `&is_published=${pub}`;
    if (rating) queryPath += `&rating=${rating}`;
    const r = await api("GET", queryPath);
    testimonialsData = r.items || [];
    if (r.pagination) {
      tmPagination.total = r.pagination.total ?? testimonialsData.length;
      tmPagination.totalPages = r.pagination.total_pages || Math.ceil(tmPagination.total / tmPagination.limit) || 1;
    } else {
      tmPagination.total = testimonialsData.length;
      tmPagination.totalPages = 1;
    }
    renderTestimonials(testimonialsData);
    renderTestimonialsPagination();
  } catch (err) {
    if (container) container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--error)">Gagal memuat ulasan testimoni</div>';
  }
}
function renderTestimonialsPagination() {
  const infoEl = document.getElementById("tm-pagination-info");
  const controlsEl = document.getElementById("tm-pagination-controls");
  if (!controlsEl) return;
  const { page, limit, total, totalPages } = tmPagination;
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  if (infoEl) infoEl.textContent = `Menampilkan ${start}-${end} dari ${total} ulasan`;
  let html = `<button class="btn btn-outline btn-sm" onclick="loadTestimonials(${page - 1})" ${page <= 1 ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}><span class="material-symbols-outlined icon-xs">chevron_left</span> Sebelumnya</button>`;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
      html += `<button class="btn ${i === page ? "btn-primary" : "btn-outline"} btn-sm" style="min-width:32px;padding:0.35rem 0.5rem" onclick="loadTestimonials(${i})">${i}</button>`;
    } else if (i === page - 2 || i === page + 2) {
      html += `<span style="padding:0 0.25rem;color:var(--outline)">…</span>`;
    }
  }
  html += `<button class="btn btn-outline btn-sm" onclick="loadTestimonials(${page + 1})" ${page >= totalPages ? "disabled style='opacity:0.5;cursor:not-allowed'" : ""}>Selanjutnya <span class="material-symbols-outlined icon-xs">chevron_right</span></button>`;
  controlsEl.innerHTML = html;
}
let tmSearchTimeout;
function filterTestimonials() { clearTimeout(tmSearchTimeout); tmSearchTimeout = setTimeout(() => loadTestimonials(1), 300); }
function filterTmByStatus(status, btn) {
  tmSelectedStatus = status; tmSelectedRating = 0;
  document.querySelectorAll("#tm-status-pills .cat-pill").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  loadTestimonials(1);
}
function filterTmByRating(rating, btn) {
  tmSelectedRating = rating; tmSelectedStatus = "";
  document.querySelectorAll("#tm-status-pills .cat-pill").forEach((b) => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  loadTestimonials(1);
}
function getTmAvatar(name) {
  return (name || "PW").replace(/&/g, "").split(" ").filter(Boolean).slice(0, 2).map((n) => n[0].toUpperCase()).join("");
}
function renderTestimonials(data = testimonialsData) {
  const container = document.getElementById("testimonials-grid");
  if (!container) return;
  const total = tmPagination.total || testimonialsData.length;
  const totalRating = testimonialsData.reduce((acc, cur) => acc + (parseInt(cur.rating) || 5), 0);
  const avg = testimonialsData.length > 0 ? (totalRating / testimonialsData.length).toFixed(1) : "5.0";
  const statTotal = document.getElementById("tm-stat-total");
  if (statTotal) {
    statTotal.textContent = total;
    const published = testimonialsData.filter((t) => +t.is_published === 1).length;
    const pEl = document.getElementById("tm-stat-pub");   if (pEl) pEl.textContent = published;
    const dEl = document.getElementById("tm-stat-draft"); if (dEl) dEl.textContent = testimonialsData.length - published;
    const aEl = document.getElementById("tm-stat-avg");   if (aEl) aEl.innerHTML = `${avg} <small style="font-size:0.8125rem;color:var(--outline)">/ 5.0</small>`;
    const sEl = document.getElementById("tm-stat-stars"); if (sEl) sEl.textContent = "★".repeat(Math.round(parseFloat(avg))) || "★★★★★";
  }
  if (!data.length) {
    container.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--outline)">Tidak ada ulasan testimoni yang cocok dengan filter.</div>';
    return;
  }
  container.innerHTML = data.map((t) => {
    const ratingCount = parseInt(t.rating) || 5;
    const stars = "★".repeat(ratingCount) + "☆".repeat(5 - ratingCount);
    const isPub = +t.is_published === 1;
    const initials = getTmAvatar(t.customer_name);
    const photo = t.photo_url ? `<img src="${esc(t.photo_url)}" alt="${esc(t.customer_name)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">` : initials;
    return `
    <div class="card" style="margin-bottom:0;display:flex;flex-direction:column;justify-content:space-between">
      <div>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:0.5rem;margin-bottom:1rem">
          <div style="display:flex;align-items:center;gap:0.75rem;min-width:0">
            <div style="width:42px;height:42px;border-radius:var(--r-full);background:var(--surface-container-high);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.875rem;color:var(--primary);overflow:hidden;flex-shrink:0">${photo}</div>
            <div style="min-width:0">
              <div style="font-weight:700;color:var(--on-surface);font-size:0.9375rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(t.customer_name)}</div>
              <div style="color:#c5a059;font-size:0.8125rem;letter-spacing:1px">${stars} <span style="font-size:0.6875rem;color:var(--outline)">(${ratingCount}.0)</span></div>
            </div>
          </div>
          <span class="badge ${isPub ? "badge-success" : "badge-neutral"}" style="width:auto;flex-shrink:0">${isPub ? "Published" : "Draft"}</span>
        </div>
        <div style="background:var(--surface-container-low);border:1px solid var(--border-light);border-radius:var(--r);padding:0.875rem 1rem;font-size:0.8125rem;color:var(--on-surface);line-height:1.6;font-style:italic;margin-bottom:1rem">"${esc(t.content || "")}"</div>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;border-top:1px solid var(--border-light);padding-top:0.75rem;margin-top:auto;flex-wrap:wrap;gap:0.5rem">
        <span style="font-size:0.6875rem;color:var(--outline)">Urutan Tampil: ${t.sort_order ?? 0}</span>
        <div class="td-actions">
          <button class="btn btn-outline btn-sm" onclick="editTestimonial('${t.id}')"><span class="material-symbols-outlined icon-xs">edit</span> Edit</button>
          <button class="btn btn-danger btn-sm"  onclick="deleteTestimonial('${t.id}')" title="Hapus"><span class="material-symbols-outlined icon-xs">delete</span></button>
        </div>
      </div>
    </div>`;
  }).join("");
}
function sortTestimonials(type) {
  let list = [...testimonialsData];
  if (type === "rating-tinggi") list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else if (type === "rating-rendah") list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
  else if (type === "nama") list.sort((a, b) => (a.customer_name || "").localeCompare(b.customer_name || ""));
  else list.sort((a, b) => (b.id || 0) - (a.id || 0));
  renderTestimonials(list);
}
function openTmModal() {
  ["tm-name","tm-content","tm-photo"].forEach(clearEl);
  setVal("tm-id", ""); setVal("tm-rating", 5); setVal("tm-sort", 0); setVal("tm-published", 0);
  const mTitle = document.getElementById("tm-modal-title"); if (mTitle) mTitle.textContent = "Tambah Testimoni";
  openModal("tm-modal");
}
function editTestimonial(id) {
  const d = testimonialsData.find((t) => t.id == id);
  if (!d) return;
  setVal("tm-id",        d.id);
  setVal("tm-name",      d.customer_name);
  setVal("tm-content",   d.content);
  setVal("tm-rating",    d.rating);
  setVal("tm-photo",     d.photo_url ?? "");
  setVal("tm-sort",      d.sort_order ?? 0);
  setVal("tm-published", d.is_published);
  const mTitle = document.getElementById("tm-modal-title"); if (mTitle) mTitle.textContent = "Edit Testimoni";
  openModal("tm-modal");
}
async function saveTestimonial() {
  const body = { customer_name: getVal("tm-name"), content: getVal("tm-content"), rating: parseInt(getVal("tm-rating")) || 5, photo_url: getVal("tm-photo") || null, sort_order: parseInt(getVal("tm-sort")) || 0, is_published: parseInt(getVal("tm-published")) };
  if (!body.customer_name || !body.content) return toast("Nama dan isi wajib", "error");
  const id = getVal("tm-id");
  try {
    if (id) await api("PUT", `/testimonials/${id}`, body);
    else    await api("POST", "/testimonials", body);
    closeModal("tm-modal");
    toast("Testimoni disimpan", "success");
    loadTestimonials();
  } catch (_) {}
}
async function deleteTestimonial(id) {
  if (!(await confirmDialog("Hapus", "Yakin?"))) return;
  try { await api("DELETE", `/testimonials/${id}`); toast("Dihapus", "success"); loadTestimonials(); } catch (_) {}
}

// ═══════════════════════════════════════════════
// Settings
// ═══════════════════════════════════════════════
function saveApiUrl() {
  const url = (document.getElementById("api-url-input")?.value || "").trim().replace(/\/+$/, "");
  if (!url) return toast("URL tidak boleh kosong", "error");
  S.baseUrl = url;
  localStorage.setItem("wd_base", url);
  toast("Base URL disimpan", "success");
}
async function changePassword() {
  const oldPw = getVal("pw-old"), newPw = getVal("pw-new"), confPw = getVal("pw-confirm");
  if (!oldPw || !newPw) return toast("Isi password", "error");
  if (newPw !== confPw) return toast("Konfirmasi tidak cocok", "error");
  if (newPw.length < 6) return toast("Password minimal 6 karakter", "error");
  try {
    await api("PUT", "/auth/change-password", { old_password: oldPw, new_password: newPw });
    ["pw-old","pw-new","pw-confirm"].forEach(clearEl);
    toast("Password diubah! Login ulang.", "success");
    setTimeout(doLogout, 2000);
  } catch (_) {}
}

// ═══════════════════════════════════════════════
// Loader maps
// ═══════════════════════════════════════════════
const loaders = { dashboard: loadDashboard, themes: loadThemes, orders: loadOrders, "order-detail": loadOrderDetail, testimonials: loadTestimonials, whatsapp: loadWhatsAppGateway, cdn: loadCdnManager, settings: () => {} };
const tabLoaders = { couple: loadCouple, events: loadEvents, music: loadMusic, "love-stories": loadLoveStories, wallets: loadWallets, gallery: loadGallery, livestreaming: loadLivestreaming, entertainment: loadEntertainment, comments: loadComments };

// ═══════════════════════════════════════════════
// Notifikasi
// ═══════════════════════════════════════════════
function updateNotifDot() {
  const dotEl = document.getElementById("notif-dot");
  if (!dotEl) return;
  const lastSeenId = localStorage.getItem("pw_last_seen_order") || "";
  const latestOrderId = ordersData && ordersData.length ? String(ordersData[0].id) : "";
  dotEl.style.display = latestOrderId && latestOrderId !== lastSeenId ? "block" : "none";
}
function toggleNotifDropdown() {
  const dd = document.getElementById("notif-dropdown");
  if (!dd) return;
  const isOpen = dd.style.display === "block";
  dd.style.display = isOpen ? "none" : "block";
  if (!isOpen) {
    renderNotifications();
    if (ordersData && ordersData.length) {
      localStorage.setItem("pw_last_seen_order", String(ordersData[0].id));
      const dotEl = document.getElementById("notif-dot"); if (dotEl) dotEl.style.display = "none";
    }
  }
}
function renderNotifications() {
  const listEl  = document.getElementById("notif-list");
  const countEl = document.getElementById("notif-badge-count");
  if (!listEl) return;
  const recent = (ordersData || []).slice(0, 5);
  if (countEl) countEl.textContent = `${recent.length} Pesanan`;
  if (!recent.length) {
    listEl.innerHTML = '<div style="padding:1.5rem;text-align:center;color:var(--outline);font-size:0.75rem">Tidak ada pesanan baru</div>';
    return;
  }
  listEl.innerHTML = recent.map((o) => `
    <div onclick="openOrderDetail('${o.id}'); toggleNotifDropdown();"
      style="padding:0.75rem 1rem;border-bottom:1px solid var(--border-light);cursor:pointer;display:flex;align-items:flex-start;gap:0.6rem;transition:background 0.15s"
      onmouseover="this.style.background='var(--surface-container-low)'" onmouseout="this.style.background='transparent'">
      <span class="material-symbols-outlined icon-sm" style="color:var(--primary-container);margin-top:2px">shopping_bag</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:0.8125rem;font-weight:700;color:var(--on-surface);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(o.customer_name)}</div>
        <div style="font-size:0.6875rem;color:var(--outline)"><span class="mono">${esc(o.order_code || "#ORD-" + o.id)}</span> • Rp ${Number(o.total_price || 0).toLocaleString("id-ID")}</div>
      </div>
      <span class="badge ${o.payment_status === "paid" ? "badge-success" : "badge-warn"}" style="font-size:0.625rem;width:auto;flex-shrink:0">${esc(o.payment_status || "unpaid")}</span>
    </div>`
  ).join("");
}

// ═══════════════════════════════════════════════
// WhatsApp Gateway Integration
// ═══════════════════════════════════════════════
const WA_TEMPLATES = {
  sapaan: {
    label: "Sapaan Awal",
    text: "Halo Kak! Terima kasih sudah menghubungi *Permata Wedding*.\nAda yang bisa kami bantu seputar pembuatan atau informasi undangan digital pernikahan?",
  },
  paket: {
    label: "Info Paket & Harga",
    text: "Halo Kak, berikut pilihan paket undangan digital *Permata Wedding*:\n\n*Paket Basic* (Rp 100.000)\n- Desain Elegan & Responsif\n- Hitung Mundur (Countdown)\n- Peta Lokasi Google Maps\n- Form Ucapan & Doa Tamu\n\n*Paket Premium*\n- Semua fitur Basic\n- Galeri Foto (hingga 10 foto)\n- Background Musik Pilihan\n- Love Story Timeline\n- Amplop Digital (Bank / E-Wallet)\n\n*Paket Exclusive*\n- Semua fitur Premium\n- Integrasi Live Streaming YouTube\n- Reservasi Kehadiran Tamu (RSVP)\n- Teks Undangan Custom Tamu (Nama Tamu Otomatis)\n\nKatalog tema selengkapnya dapat dilihat di:\nhttps://invitation.permatawedding.com",
  },
  form_data: {
    label: "Form Data Pemesanan",
    text: "Untuk pembuatan undangan digital, silakan lengkapi data berikut ya Kak:\n\n1. Nama Lengkap & Panggilan Pria:\n2. Nama Orang Tua Pria (Bapak & Ibu):\n3. Nama Lengkap & Panggilan Wanita:\n4. Nama Orang Tua Wanita (Bapak & Ibu):\n5. Hari, Tanggal, Jam & Tempat Akad Nikah:\n6. Hari, Tanggal, Jam & Tempat Resepsi:\n7. Alamat Lengkap & Shareloc Google Maps:\n8. Nomor Rekening/E-wallet (opsional untuk amplop digital):\n9. Foto mempelai & galeri (bisa kirim via dokumen WhatsApp)\n\nJika ada request khusus silakan disampaikan ya Kak.",
  },
  pembayaran: {
    label: "Konfirmasi Pembayaran",
    text: "Terima kasih atas pembayarannya Kak! Pembayaran sudah kami terima dengan baik.\n\nPesanan undangan digital Anda saat ini sedang dalam proses pengerjaan (estimasi 1-2 hari kerja). Nanti link preview akan kami kirimkan ke chat ini ya Kak.",
  },
  undangan_siap: {
    label: "Undangan Sudah Jadi",
    text: "Halo Kak! Undangan digital pernikahan Anda sudah selesai dan aktif.\n\nSilakan dicek link undangannya di bawah ini ya:\n{INVITATION_URL}\n\nSilakan diperiksa kembali penulisan nama, tanggal, dan lokasi acaranya. Jika ada bagian yang perlu direvisi, langsung infokan ke kami ya Kak.\n\nUntuk mempermudah pengiriman undangan, bisa menggunakan link berikut ya kak :\n\n{KIRIM_URL}\n\nLink tersebut bisa digunakan untuk mengirim undangan melalui WhatsApp, Instagram, Facebook, maupun Messenger.\n\nTerima kasih banyak!",
  },
  link_kirim: {
    label: "Link Kirim Tamu",
    text: "Untuk mempermudah pengiriman undangan, bisa menggunakan link berikut ya kak :\n\n{KIRIM_URL}\n\nLink tersebut bisa digunakan untuk mengirim undangan melalui WhatsApp, Instagram, Facebook, maupun Messenger.",
  },
  terima_kasih: {
    label: "Terima Kasih",
    text: "Sama-sama Kak! Semoga seluruh rangkaian acara pernikahan berjalan lancar dan penuh berkah. Jangan ragu menghubungi kami kembali jika membutuhkan bantuan ya Kak.",
  },
};

let waCustomersCache = [];
let waActiveChatPhone = "";
let waActiveChatName = "";
let waActiveChatOrderCode = "";
let waChatPollTimer = null;

async function loadWhatsAppGateway() {
  checkWaDeviceStatus();
  loadWaCustomersDropdown();
  loadWaInboxContacts();
  loadWaPanelLogs();
  checkWaWorkingHoursInfo();
}

function switchWaAdminTab(tab, btn) {
  document.querySelectorAll("#wa-tab-pills .cat-pill").forEach((b) => b.classList.remove("active"));
  btn?.classList.add("active");
  const inboxEl = document.getElementById("wa-tab-panel-inbox");
  const sendEl  = document.getElementById("wa-tab-panel-send");
  const logsEl  = document.getElementById("wa-tab-panel-logs");
  const botEl   = document.getElementById("wa-tab-panel-bot");

  if (inboxEl) inboxEl.style.display = tab === "inbox" ? "block" : "none";
  if (sendEl)  sendEl.style.display  = tab === "send"  ? "block" : "none";
  if (logsEl)  logsEl.style.display  = tab === "logs"  ? "block" : "none";
  if (botEl)   botEl.style.display   = tab === "bot"   ? "block" : "none";

  if (tab === "inbox") {
    loadWaInboxContacts();
  } else if (tab === "logs") {
    loadWaPanelLogs();
  }
}

async function checkWaDeviceStatus() {
  const badge = document.getElementById("wa-gateway-status-badge");
  const dot   = document.getElementById("wa-gateway-status-dot");
  const text  = document.getElementById("wa-gateway-status-text");
  if (!badge || !text) return;

  try {
    const res = await fetch("wa/api.php?action=device_status");
    const json = await res.json();
    const st = json.data?.status_key || (json.data?.online ? "connected" : "disconnected");
    const jid = json.data?.jid ? ` (${json.data.jid.split('@')[0]})` : "";

    if (st === "connected") {
      badge.className = "badge badge-success";
      if (dot) dot.style.background = "#22c55e";
      text.textContent = `Connected: permatawedding${jid}`;
    } else if (st === "need_qr") {
      badge.className = "badge badge-warn";
      if (dot) dot.style.background = "#f59e0b";
      text.textContent = "QR Code Needed (Silakan Scan)";
    } else {
      badge.className = "badge badge-danger";
      if (dot) dot.style.background = "#ef4444";
      text.textContent = "Disconnected / Server Offline";
    }
  } catch (_) {
    badge.className = "badge badge-warn";
    if (dot) dot.style.background = "#f59e0b";
    text.textContent = "GoWA Gateway Siap";
  }
}

async function reconnectWaDevice() {
  const btn = document.getElementById("btn-wa-reconnect");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined icon-xs icon-spin">sync</span> Reconnecting...';
  }
  toast("Mencoba menghubungkan kembali session GoWA...", "info");

  try {
    const res = await fetch("wa/api.php?action=reconnect", { method: "POST" });
    const json = await res.json();
    if (json.success) {
      toast("Reconnect berhasil dikirim ke GoWA server", "success");
    } else {
      toast(json.message || "Gagal reconnect: " + (json.error || "Device butuh scan QR"), "warn");
    }
    await checkWaDeviceStatus();
  } catch (err) {
    toast("Koneksi gagal: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined icon-xs">sync</span> Reconnect';
    }
  }
}

function openWaQrModal() {
  openModal("wa-qr-modal");
  fetchWaQrCode();
}

async function fetchWaQrCode() {
  const wrap = document.getElementById("wa-qr-img-wrap");
  if (!wrap) return;
  wrap.innerHTML = '<div style="color:var(--outline);font-size:0.875rem;"><span class="material-symbols-outlined icon-spin" style="vertical-align:middle;margin-right:6px;">sync</span> Mengambil QR code dari server GoWA...</div>';

  try {
    const res = await fetch("wa/api.php?action=get_qr");
    const json = await res.json();
    if (json.success && json.qr_link) {
      wrap.innerHTML = `<img src="${esc(json.qr_link)}?t=${Date.now()}" alt="Scan QR GoWA" style="max-width:280px;height:auto;border-radius:8px;" />`;
    } else {
      wrap.innerHTML = `<div style="color:var(--error);font-size:0.84rem;padding:1rem;">
        <span class="material-symbols-outlined" style="font-size:32px;display:block;margin:0 auto 8px;">error</span>
        ${esc(json.message || "Tidak dapat memuat QR Code saat ini.")}
      </div>`;
    }
  } catch (err) {
    wrap.innerHTML = `<div style="color:var(--error);font-size:0.84rem;">Gagal memuat QR: ${esc(err.message)}</div>`;
  }
}

// ═══════════════════════════════════════════════════════════════
// Live Chat Inbox & Two-Way Conversation View
// ═══════════════════════════════════════════════════════════════
async function loadWaInboxContacts() {
  const container = document.getElementById("wa-inbox-contacts-list");
  if (!container) return;

  try {
    const res = await fetch("wa/api.php?action=customers");
    const json = await res.json();
    waCustomersCache = json.data || [];
    renderWaInboxContacts(waCustomersCache);
  } catch (err) {
    container.innerHTML = `<div style="padding:1.5rem;text-align:center;color:var(--error);font-size:0.8125rem;">Gagal memuat kontak: ${err.message}</div>`;
  }
}

function renderWaInboxContacts(contacts) {
  const container = document.getElementById("wa-inbox-contacts-list");
  if (!container) return;

  if (!contacts || !contacts.length) {
    container.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--outline);font-size:0.8125rem;">Tidak ada kontak klien ditemukan.</div>';
    return;
  }

  container.innerHTML = contacts.map((c) => {
    const isActive = waActiveChatPhone === c.customer_phone ? "active" : "";
    const initial = (c.customer_name || "K").trim().charAt(0).toUpperCase();
    return `
      <div class="wa-contact-item ${isActive}" onclick="selectWaInboxContact('${esc(c.customer_phone)}', '${esc(c.customer_name)}', '${esc(c.order_code)}')">
        <div class="wa-contact-avatar">${initial}</div>
        <div class="wa-contact-meta">
          <div class="wa-contact-name">${esc(c.customer_name || "Tanpa Nama")}</div>
          <div class="wa-contact-sub">${esc(c.order_code)} &bull; ${esc(c.customer_phone)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function filterWaInboxContacts() {
  const q = (document.getElementById("wa-inbox-search")?.value || "").toLowerCase().trim();
  if (!q) {
    renderWaInboxContacts(waCustomersCache);
    return;
  }
  const filtered = waCustomersCache.filter((c) => {
    const n = (c.customer_name || "").toLowerCase();
    const p = (c.customer_phone || "").toLowerCase();
    const o = (c.order_code || "").toLowerCase();
    return n.includes(q) || p.includes(q) || o.includes(q);
  });
  renderWaInboxContacts(filtered);
}

async function selectWaInboxContact(phone, name, orderCode) {
  waActiveChatPhone = phone;
  waActiveChatName = name;
  waActiveChatOrderCode = orderCode;

  // Highlight active contact
  document.querySelectorAll(".wa-contact-item").forEach((el) => el.classList.remove("active"));
  renderWaInboxContacts(waCustomersCache);

  // Update Header Chat
  const headerName = document.getElementById("wa-chat-header-name");
  const headerPhone = document.getElementById("wa-chat-header-phone");
  const headerAvatar = document.getElementById("wa-chat-header-avatar");
  if (headerName) headerName.textContent = name || "Pelanggan";
  if (headerPhone) headerPhone.textContent = `${phone} (${orderCode})`;
  if (headerAvatar) headerAvatar.textContent = (name || "W").trim().charAt(0).toUpperCase();

  await loadActiveChatMessages();
}

async function loadActiveChatMessages() {
  if (!waActiveChatPhone) return;
  const body = document.getElementById("wa-chat-messages-body");
  if (!body) return;

  body.innerHTML = '<div style="margin:auto;text-align:center;color:var(--outline);font-size:0.8125rem;"><span class="material-symbols-outlined icon-spin" style="vertical-align:middle;margin-right:6px;">sync</span> Memuat percakapan...</div>';

  try {
    // 1. Ambil dari database lokal pesan
    const resLocal = await fetch(`wa/api.php?action=messages&phone=${encodeURIComponent(waActiveChatPhone)}&limit=100`);
    const jsonLocal = await resLocal.json();
    let messages = jsonLocal.data || [];

    // Jika lokal sedikit atau ingin kelengkapan, coba ambil dari API GoWA
    try {
      const resApi = await fetch(`wa/api.php?action=chat_messages&phone=${encodeURIComponent(waActiveChatPhone)}`);
      const jsonApi = await resApi.json();
      if (jsonApi.success && Array.isArray(jsonApi.data) && jsonApi.data.length > 0) {
        // Gabungkan atau gunakan data API jika ada
        const apiMap = new Map();
        jsonApi.data.forEach(m => apiMap.set(m.id || (m.timestamp + m.message), m));
        messages.forEach(m => {
          const key = m.wa_message_id || (m.created_at + m.message);
          if (!apiMap.has(key)) {
            apiMap.set(key, {
              id: m.wa_message_id || m.id,
              direction: m.direction,
              message: m.message,
              sender_name: m.customer_name,
              timestamp: m.created_at,
              status: m.status
            });
          }
        });
        messages = Array.from(apiMap.values());
        // Sort ascending berdasarkan waktu
        messages.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));
      }
    } catch (_) {}

    renderChatMessages(messages);
  } catch (err) {
    body.innerHTML = `<div style="margin:auto;text-align:center;color:var(--error);font-size:0.8125rem;">Gagal memuat riwayat: ${err.message}</div>`;
  }
}

function renderChatMessages(messages) {
  const body = document.getElementById("wa-chat-messages-body");
  if (!body) return;

  if (!messages || !messages.length) {
    body.innerHTML = `
      <div style="margin:auto;text-align:center;color:#667781;font-size:0.8125rem;background:rgba(255,255,255,0.7);padding:10px 18px;border-radius:8px;">
        Belum ada riwayat pesan dengan nomor ini.<br>Ketik pesan di bawah untuk memulai obrolan.
      </div>
    `;
    return;
  }

  body.innerHTML = messages.map((m) => {
    const isOut = m.direction === "outbound";
    const timeStr = m.timestamp ? m.timestamp.split(" ")[1]?.substring(0, 5) || m.timestamp : "";
    return `
      <div class="wa-bubble-row ${isOut ? "outbound" : "inbound"}">
        <div class="wa-bubble ${isOut ? "outbound" : "inbound"}">
          <div class="wa-bubble-text">${esc(m.message)}</div>
          <div class="wa-bubble-time">
            <span>${esc(timeStr)}</span>
            ${isOut ? '<span class="material-symbols-outlined" style="color:#53bdeb;">done_all</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }).join("");

  // Scroll otomatis ke bawah
  body.scrollTop = body.scrollHeight;
}

async function syncActiveChatFromApi() {
  if (!waActiveChatPhone) {
    toast("Pilih kontak klien terlebih dahulu", "info");
    return;
  }
  toast("Menyinkronkan riwayat chat dari GoWA...", "info");
  await loadActiveChatMessages();
  toast("Percakapan berhasil disinkronkan ✓", "success");
}

async function sendWaQuickReply() {
  if (!waActiveChatPhone) {
    toast("Pilih kontak klien terlebih dahulu", "error");
    return;
  }
  const input = document.getElementById("wa-chat-reply-input");
  const btn = document.getElementById("btn-wa-quick-reply");
  const message = (input?.value || "").trim();

  if (!message) {
    toast("Pesan tidak boleh kosong", "error");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="material-symbols-outlined icon-xs icon-spin">hourglass_top</span>';
  }

  try {
    const res = await fetch("wa/api.php?action=send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: waActiveChatPhone,
        message: message,
        customer_name: waActiveChatName,
      }),
    });
    const json = await res.json();
    if (json.success) {
      if (input) input.value = "";
      // Append pesan langsung ke chat view
      const body = document.getElementById("wa-chat-messages-body");
      if (body) {
        const timeNow = new Date().toTimeString().split(" ")[0].substring(0, 5);
        const newBubble = document.createElement("div");
        newBubble.className = "wa-bubble-row outbound";
        newBubble.innerHTML = `
          <div class="wa-bubble outbound">
            <div class="wa-bubble-text">${esc(message)}</div>
            <div class="wa-bubble-time">
              <span>${esc(timeNow)}</span>
              <span class="material-symbols-outlined" style="color:#53bdeb;">done_all</span>
            </div>
          </div>
        `;
        body.appendChild(newBubble);
        body.scrollTop = body.scrollHeight;
      }
      toast("Pesan terkirim ke " + waActiveChatPhone, "success");
      loadWaPanelLogs();
    } else {
      toast(json.message || json.error || "Gagal mengirim balasan", "error");
    }
  } catch (err) {
    toast("Kesalahan pengiriman: " + err.message, "error");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span class="material-symbols-outlined icon-xs">send</span> Kirim';
    }
  }
}


async function loadWaCustomersDropdown() {
  const sel = document.getElementById("wa-panel-order-select");
  if (!sel) return;
  try {
    const res = await fetch("wa/api.php?action=customers");
    const json = await res.json();
    waCustomersCache = json.data || [];
    sel.innerHTML = '<option value="">— Pilih pesanan klien atau isi nomor di bawah —</option>' +
      waCustomersCache.map((c) => `
        <option value="${c.id}" data-phone="${esc(c.customer_phone)}" data-name="${esc(c.customer_name)}" data-invitation="${esc(c.invitation_url)}" data-kirim="${esc(c.kirim_url)}">
          ${esc(c.order_code)} — ${esc(c.customer_name)} (${esc(c.customer_phone)})
        </option>
      `).join("");
  } catch (_) {}
}

function onWaPanelOrderSelect() {
  const sel = document.getElementById("wa-panel-order-select");
  const opt = sel?.options[sel.selectedIndex];
  if (!opt || !opt.value) return;

  setVal("wa-panel-phone", opt.dataset.phone || "");
  setVal("wa-panel-name", opt.dataset.name || "");
  setVal("wa-panel-invitation-url", opt.dataset.invitation || "");
  setVal("wa-panel-kirim-url", opt.dataset.kirim || "");

  onWaPanelTemplateSelect();
  updateWaPanelPreview();
}

function onWaPanelTemplateSelect() {
  const key = getVal("wa-panel-template");
  if (!key || !WA_TEMPLATES[key]) return;

  let text = WA_TEMPLATES[key].text;
  const invUrl = getVal("wa-panel-invitation-url") || "https://invitation.permatawedding.com";
  const krmUrl = getVal("wa-panel-kirim-url") || (invUrl + "#kirim");

  text = text.replace(/{INVITATION_URL}/g, invUrl).replace(/{KIRIM_URL}/g, krmUrl);
  setVal("wa-panel-message", text);
  updateWaPanelPreview();
}

function updateWaPanelPreview() {
  const msg = getVal("wa-panel-message");
  const el = document.getElementById("wa-panel-preview-text");
  const cc = document.getElementById("wa-panel-char-count");
  if (cc) cc.textContent = msg.length + " karakter";
  if (el) {
    el.textContent = msg.trim() ? msg : "Ketik pesan atau pilih template di sebelah kiri untuk melihat pratinjau pesan WhatsApp.";
  }
}

async function sendWaFromPanel() {
  const btn = document.getElementById("btn-wa-panel-send");
  const phone = getVal("wa-panel-phone").trim();
  const message = getVal("wa-panel-message").trim();
  const name = getVal("wa-panel-name").trim();

  if (!phone || !message) {
    toast("Nomor WhatsApp dan isi pesan wajib diisi", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined icon-xs">hourglass_top</span> Mengirim...';

  try {
    const res = await fetch("wa/api.php?action=send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message, customer_name: name }),
    });
    const json = await res.json();
    if (json.success) {
      toast("Pesan WhatsApp berhasil terkirim ke " + phone + " ✓", "success");
      loadWaPanelLogs();
    } else {
      toast(json.message || json.error || "Gagal mengirim WhatsApp", "error");
    }
  } catch (err) {
    toast("Gagal koneksi: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined icon-xs">send</span> Kirim via GoWA';
  }
}

function resetWaPanelForm() {
  setVal("wa-panel-phone", "");
  setVal("wa-panel-name", "");
  setVal("wa-panel-message", "");
  setVal("wa-panel-template", "");
  setVal("wa-panel-invitation-url", "");
  setVal("wa-panel-kirim-url", "");
  const sel = document.getElementById("wa-panel-order-select");
  if (sel) sel.selectedIndex = 0;
  updateWaPanelPreview();
}

async function loadWaPanelLogs() {
  const tbody = document.getElementById("wa-panel-logs-tbody");
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Memuat riwayat chat...</p></div></td></tr>';
  try {
    const res = await fetch("wa/api.php?action=messages&limit=50");
    const json = await res.json();
    const items = json.data || [];
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Belum ada rekaman pesan WhatsApp.</p></div></td></tr>';
      return;
    }
    tbody.innerHTML = items.map((m) => `
      <tr>
        <td class="mono" style="font-size:0.75rem">#${m.id}</td>
        <td>
          <span class="badge ${m.direction === "outbound" ? "badge-info" : "badge-success"}">
            ${m.direction === "outbound" ? "KELUAR" : "MASUK"}
          </span>
        </td>
        <td>
          <strong>${esc(m.phone)}</strong>
          ${m.customer_name ? `<div style="font-size:0.75rem;color:var(--outline)">${esc(m.customer_name)}</div>` : ""}
        </td>
        <td style="max-width:340px;white-space:pre-wrap;word-break:break-word;font-size:0.8125rem;">${esc(m.message)}</td>
        <td>
          <span class="badge ${m.status === "sent" || m.status === "received" ? "badge-success" : "badge-danger"}">${esc(m.status)}</span>
        </td>
        <td style="font-size:0.75rem;color:var(--outline)">${esc(m.created_at)}</td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p style="color:var(--err)">Gagal memuat log: ${err.message}</p></div></td></tr>`;
  }
}

async function checkWaWorkingHoursInfo() {
  try {
    const res = await fetch("wa/api.php?action=config_info");
    const json = await res.json();
    const stEl = document.getElementById("wa-bot-status-text");
    if (stEl) {
      if (json.data?.is_working_hours) {
        stEl.className = "badge badge-success";
        stEl.textContent = "Aktif (Dalam Jam Kerja)";
      } else {
        stEl.className = "badge badge-warn";
        stEl.textContent = "Offline (Di Luar Jam Kerja)";
      }
    }
  } catch (_) {}
}

// ── Quick WhatsApp Modal dari Orders Table / Detail ──
async function openQuickWaModal(phone, name, orderId) {
  setVal("qwa-phone", phone || "");
  setVal("qwa-name", name || "");
  setVal("qwa-template", "");
  setVal("qwa-message", "");

  // Cari slug jika ada
  let invUrl = "https://invitation.permatawedding.com";
  let krmUrl = invUrl + "#kirim";
  try {
    const cData = await api("GET", `/couples?order_id=${orderId}&limit=1`);
    if (cData.items && cData.items[0]?.slug_url) {
      const slug = cData.items[0].slug_url;
      let year = new Date().getFullYear();
      try {
        const evData = await api("GET", `/events?order_id=${orderId}&limit=1`);
        if (evData.items && evData.items[0]?.event_datetime) {
          const y = new Date(evData.items[0].event_datetime).getFullYear();
          if (!isNaN(y) && y >= 2020) year = y;
        }
      } catch (_) {}
      invUrl = `https://invitation.permatawedding.com/${year}/${slug}`;
      krmUrl = `${invUrl}#kirim`;
    }
  } catch (_) {}

  setVal("qwa-invitation-url", invUrl);
  setVal("qwa-kirim-url", krmUrl);

  openModal("quick-wa-modal");
}

function applyQuickWaTemplate() {
  const key = getVal("qwa-template");
  if (!key || !WA_TEMPLATES[key]) return;

  let text = WA_TEMPLATES[key].text;
  const invUrl = getVal("qwa-invitation-url") || "https://invitation.permatawedding.com";
  const krmUrl = getVal("qwa-kirim-url") || (invUrl + "#kirim");

  text = text.replace(/{INVITATION_URL}/g, invUrl).replace(/{KIRIM_URL}/g, krmUrl);
  setVal("qwa-message", text);
}

async function submitQuickWa() {
  const btn = document.getElementById("btn-send-qwa");
  const phone = getVal("qwa-phone").trim();
  const message = getVal("qwa-message").trim();
  const name = getVal("qwa-name").trim();

  if (!phone || !message) {
    toast("Nomor WhatsApp dan pesan wajib diisi", "error");
    return;
  }

  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined icon-xs">hourglass_top</span> Mengirim...';

  try {
    const res = await fetch("wa/api.php?action=send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, message, customer_name: name }),
    });
    const json = await res.json();
    if (json.success) {
      toast("Pesan WhatsApp berhasil dikirim ke " + phone + " ✓", "success");
      closeModal("quick-wa-modal");
    } else {
      toast(json.message || json.error || "Gagal mengirim WhatsApp", "error");
    }
  } catch (err) {
    toast("Terjadi kesalahan: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined icon-xs">send</span> Kirim via GoWA';
  }
}

function openOrderWaDirect() {
  const o = ordersData.find((x) => x.id == S.orderDetailId);
  if (!o) {
    toast("Data order tidak ditemukan", "error");
    return;
  }
  openQuickWaModal(o.customer_phone, o.customer_name, o.id);
}

// ═══════════════════════════════════════════════
// CDN Media Hub (cdn.permatawedding.com)
// ═══════════════════════════════════════════════
let cdnMusicData = [];
let cdnVideosData = [];
let cdnCurrentTab = "music";
let cdnAudio = new Audio();
let cdnCurrentlyPlayingId = null;

async function loadCdnManager() {
  loadCdnStats();
  if (cdnCurrentTab === "music") {
    loadCdnMusic();
  } else if (cdnCurrentTab === "video") {
    loadCdnVideos();
  }
}

async function loadCdnStats() {
  try {
    const res = await fetch("cdn/api.php?action=stats");
    const json = await res.json();
    if (json.success && json.data) {
      const d = json.data;
      const elM = document.getElementById("cdn-stat-music-count");
      const elV = document.getElementById("cdn-stat-video-count");
      const elS = document.getElementById("cdn-stat-storage");
      if (elM) elM.textContent = (d.music_count || 0) + " Lagu";
      if (elV) elV.textContent = (d.video_count || 0) + " Video";
      if (elS) elS.textContent = d.total_size_fmt || "0 MB";
    }
  } catch (err) {
    console.warn("Gagal memuat statistik CDN:", err.message);
  }
}

function switchCdnTab(tab, btn) {
  cdnCurrentTab = tab;
  document.querySelectorAll("#cdn-tab-pills .cat-pill").forEach((b) => b.classList.remove("active"));
  btn?.classList.add("active");

  const panelM = document.getElementById("cdn-panel-music");
  const panelV = document.getElementById("cdn-panel-video");
  const panelS = document.getElementById("cdn-panel-studio");

  if (panelM) panelM.style.display = tab === "music" ? "block" : "none";
  if (panelV) panelV.style.display = tab === "video" ? "block" : "none";
  if (panelS) panelS.style.display = tab === "studio" ? "block" : "none";

  if (tab === "music") loadCdnMusic();
  if (tab === "video") loadCdnVideos();
}

async function loadCdnMusic(force = false) {
  const tbody = document.getElementById("cdn-music-tbody");
  if (!tbody) return;
  if (force || !cdnMusicData.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>Memuat daftar musik dari CDN...</p></div></td></tr>';
  }

  try {
    const res = await fetch("cdn/api.php?action=music");
    const json = await res.json();
    cdnMusicData = json.data || [];
    renderCdnMusic(cdnMusicData);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><p style="color:var(--err)">Gagal memuat musik CDN: ${esc(err.message)}</p></div></td></tr>`;
  }
}

function renderCdnMusic(items) {
  const tbody = document.getElementById("cdn-music-tbody");
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="7"><div class="empty-state"><p>Tidak ada musik yang ditemukan.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = items.map((m) => {
    const isPlaying = cdnCurrentlyPlayingId === m.id;
    return `<tr>
      <td style="text-align:center;">
        <button onclick="togglePlayCdnMusic('${m.id}', '${esc(m.preview_url || m.public_url)}', '${esc(m.name)}', '${esc(m.artist)}')" 
          style="width:34px;height:34px;border-radius:50%;background:${isPlaying ? '#10b981' : '#0284c7'};color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;transition:transform 0.15s;"
          title="${isPlaying ? 'Jeda Audio' : 'Putar Audio'}">
          <span class="material-symbols-outlined icon-xs">${isPlaying ? 'pause' : 'play_arrow'}</span>
        </button>
      </td>
      <td>
        <div style="font-weight:700;color:var(--on-surface);">${esc(m.name)}</div>
        <div style="font-size:0.75rem;color:var(--outline);">${esc(m.artist || 'Permata Wedding')}</div>
      </td>
      <td>
        <span class="badge badge-info" style="font-size:0.6875rem;">${esc(m.category || 'Romantic Wedding')}</span>
      </td>
      <td>
        <span class="mono" style="font-size:0.8125rem;">${esc(m.duration || '—')}</span>
      </td>
      <td>
        <div style="font-size:0.75rem;">${esc(m.size)}</div>
        <div style="font-size:0.6875rem;color:var(--outline);">${esc(m.bitrate || '')}</div>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:6px;max-width:380px;">
          <input type="text" value="${esc(m.public_url)}" readonly 
            id="cdn-url-${m.id}"
            style="font-size:0.6875rem;padding:4px 8px;font-family:monospace;background:var(--surface-container-low);border:1px solid var(--border-light);border-radius:4px;flex:1;" />
          <button class="btn btn-outline btn-xs" onclick="copyCdnUrl('${esc(m.public_url)}')" title="Salin Link Publik">
            <span class="material-symbols-outlined icon-xs">content_copy</span>
          </button>
        </div>
      </td>
      <td class="td-actions text-right">
        <button class="btn btn-outline btn-xs" onclick="openCdnEditModal('${m.id}', 'music', '${esc(m.name)}', '${esc(m.artist)}', '${esc(m.category)}')" title="Edit Metadata">
          <span class="material-symbols-outlined icon-xs">edit</span>
        </button>
        <button class="btn btn-danger btn-xs" onclick="deleteCdnAsset('${m.id}', 'music', '${esc(m.name)}')" title="Hapus Aset">
          <span class="material-symbols-outlined icon-xs">delete</span>
        </button>
      </td>
    </tr>`;
  }).join("");
}

function filterCdnMusic() {
  const q = (document.getElementById("cdn-music-search")?.value || "").toLowerCase().trim();
  const cat = (document.getElementById("cdn-music-cat-filter")?.value || "").toLowerCase().trim();

  const filtered = cdnMusicData.filter((m) => {
    const matchQ = !q || (m.name || "").toLowerCase().includes(q) || (m.artist || "").toLowerCase().includes(q) || (m.filename || "").toLowerCase().includes(q);
    const matchC = !cat || (m.category || "").toLowerCase() === cat;
    return matchQ && matchC;
  });

  renderCdnMusic(filtered);
}

async function loadCdnVideos(force = false) {
  const tbody = document.getElementById("cdn-video-tbody");
  if (!tbody) return;
  if (force || !cdnVideosData.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Memuat daftar video dari CDN...</p></div></td></tr>';
  }

  try {
    const res = await fetch("cdn/api.php?action=videos");
    const json = await res.json();
    cdnVideosData = json.data || [];
    renderCdnVideos(cdnVideosData);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><p style="color:var(--err)">Gagal memuat video CDN: ${esc(err.message)}</p></div></td></tr>`;
  }
}

function renderCdnVideos(items) {
  const tbody = document.getElementById("cdn-video-tbody");
  if (!tbody) return;

  if (!items.length) {
    tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state"><p>Tidak ada video yang ditemukan.</p></div></td></tr>';
    return;
  }

  tbody.innerHTML = items.map((v) => `<tr>
    <td style="text-align:center;">
      <button onclick="previewCdnVideo('${esc(v.preview_url || v.public_url)}', '${esc(v.name)}', '${esc(v.public_url)}')"
        style="width:34px;height:34px;border-radius:8px;background:#8b5cf6;color:#fff;border:none;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
        <span class="material-symbols-outlined icon-xs">play_arrow</span>
      </button>
    </td>
    <td>
      <div style="font-weight:700;color:var(--on-surface);">${esc(v.name)}</div>
      <div style="font-size:0.6875rem;color:var(--outline);">${esc(v.filename)}</div>
    </td>
    <td>
      <span class="badge badge-neutral" style="font-size:0.6875rem;">${esc(v.category || 'Wedding Highlights')}</span>
    </td>
    <td>
      <span style="font-size:0.75rem;">${esc(v.size)}</span>
    </td>
    <td>
      <div style="display:flex;align-items:center;gap:6px;max-width:380px;">
        <input type="text" value="${esc(v.public_url)}" readonly 
          style="font-size:0.6875rem;padding:4px 8px;font-family:monospace;background:var(--surface-container-low);border:1px solid var(--border-light);border-radius:4px;flex:1;" />
        <button class="btn btn-outline btn-xs" onclick="copyCdnUrl('${esc(v.public_url)}')" title="Salin Link Publik">
          <span class="material-symbols-outlined icon-xs">content_copy</span>
        </button>
      </div>
    </td>
    <td class="td-actions text-right">
      <button class="btn btn-outline btn-xs" onclick="openCdnEditModal('${v.id}', 'video', '${esc(v.name)}', '', '${esc(v.category)}')" title="Edit Metadata">
        <span class="material-symbols-outlined icon-xs">edit</span>
      </button>
      <button class="btn btn-danger btn-xs" onclick="deleteCdnAsset('${v.id}', 'video', '${esc(v.name)}')" title="Hapus Aset">
        <span class="material-symbols-outlined icon-xs">delete</span>
      </button>
    </td>
  </tr>`).join("");
}

function filterCdnVideos() {
  const q = (document.getElementById("cdn-video-search")?.value || "").toLowerCase().trim();
  const filtered = cdnVideosData.filter((v) => {
    return !q || (v.name || "").toLowerCase().includes(q) || (v.filename || "").toLowerCase().includes(q);
  });
  renderCdnVideos(filtered);
}

// ── Audio Player Handlers ──
function togglePlayCdnMusic(id, url, title, artist) {
  if (cdnCurrentlyPlayingId === id && !cdnAudio.paused) {
    cdnAudio.pause();
    cdnCurrentlyPlayingId = null;
    updateCdnAudioBar(false);
    renderCdnMusic(cdnMusicData);
    return;
  }

  cdnCurrentlyPlayingId = id;
  cdnAudio.src = url;
  cdnAudio.play().then(() => {
    showCdnAudioBar(title, artist);
    renderCdnMusic(cdnMusicData);
  }).catch((err) => {
    // Fallback jika preview_url gagal, coba cari item dan gunakan public_url jika berbeda
    const item = cdnMusicData.find((m) => m.id === id);
    if (item && item.public_url && item.public_url !== url) {
      cdnAudio.src = item.public_url;
      cdnAudio.play().then(() => {
        showCdnAudioBar(title, artist);
        renderCdnMusic(cdnMusicData);
      }).catch((err2) => {
        toast("Tidak dapat memutar audio: " + err2.message, "error");
        cdnCurrentlyPlayingId = null;
        renderCdnMusic(cdnMusicData);
      });
      return;
    }
    toast("Tidak dapat memutar audio: " + err.message, "error");
    cdnCurrentlyPlayingId = null;
    renderCdnMusic(cdnMusicData);
  });

  cdnAudio.ontimeupdate = () => {
    const cur = cdnAudio.currentTime;
    const dur = cdnAudio.duration || 1;
    const seek = document.getElementById("cdn-bar-seek");
    const timeEl = document.getElementById("cdn-bar-time");
    if (seek) seek.value = (cur / dur) * 100;
    if (timeEl) timeEl.textContent = formatAudioSecs(cur) + " / " + formatAudioSecs(dur);
  };

  cdnAudio.onended = () => {
    cdnCurrentlyPlayingId = null;
    updateCdnAudioBar(false);
    renderCdnMusic(cdnMusicData);
  };
}

function showCdnAudioBar(title, artist) {
  const bar = document.getElementById("cdn-global-audio-bar");
  const titleEl = document.getElementById("cdn-bar-title");
  if (bar) bar.style.display = "flex";
  if (titleEl) titleEl.textContent = `${title} — ${artist || 'Permata Wedding'}`;
  updateCdnAudioBar(true);
}

function updateCdnAudioBar(isPlaying) {
  const icon = document.getElementById("cdn-bar-play-icon");
  if (icon) icon.textContent = isPlaying ? "pause" : "play_arrow";
}

function toggleCdnGlobalAudio() {
  if (!cdnAudio.src) return;
  if (cdnAudio.paused) {
    cdnAudio.play();
    updateCdnAudioBar(true);
  } else {
    cdnAudio.pause();
    updateCdnAudioBar(false);
  }
}

function seekCdnGlobalAudio(val) {
  if (cdnAudio.duration) {
    cdnAudio.currentTime = (val / 100) * cdnAudio.duration;
  }
}

function stopCdnGlobalAudio() {
  cdnAudio.pause();
  cdnAudio.currentTime = 0;
  cdnCurrentlyPlayingId = null;
  const bar = document.getElementById("cdn-global-audio-bar");
  if (bar) bar.style.display = "none";
  renderCdnMusic(cdnMusicData);
}

function formatAudioSecs(sec) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

// ── Copy URL Helper ──
function copyCdnUrl(url) {
  if (!url) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => {
      toast("Link CDN berhasil disalin: " + url, "success");
    }).catch(() => fallbackCopy(url));
  } else {
    fallbackCopy(url);
  }
}

function copyFromInput(id) {
  const el = document.getElementById(id);
  if (!el) return;
  copyCdnUrl(el.value);
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  toast("Link disalin ✓", "success");
}

// ── Upload Modal Handlers ──
function openCdnUploadModal(type = "music") {
  const form = document.getElementById("cdn-upload-form");
  if (form) form.reset();
  const radios = document.getElementsByName("cdn_upload_type");
  for (let r of radios) {
    if (r.value === type) r.checked = true;
  }
  onCdnUploadTypeChange(type);
  const chosen = document.getElementById("cdn-file-chosen-text");
  if (chosen) chosen.textContent = `Pilih file ${type === 'music' ? 'audio' : 'video'} atau seret ke sini`;
  openModal("cdn-upload-modal");
}

function onCdnUploadTypeChange(type) {
  const artistWrap = document.getElementById("cdn-upload-artist-wrap");
  const catSel = document.getElementById("cdn-upload-category");
  const fileInput = document.getElementById("cdn-file-input");

  if (type === "video") {
    if (artistWrap) artistWrap.style.display = "none";
    if (fileInput) fileInput.accept = "video/mp4,video/webm";
    if (catSel) catSel.value = "Wedding Highlights";
  } else {
    if (artistWrap) artistWrap.style.display = "block";
    if (fileInput) fileInput.accept = "audio/mpeg,audio/wav,audio/ogg,audio/mp4";
    if (catSel) catSel.value = "Romantic Wedding";
  }
}

function onCdnFileSelected(input) {
  const file = input.files[0];
  if (!file) return;
  const chosen = document.getElementById("cdn-file-chosen-text");
  if (chosen) chosen.textContent = `${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`;

  const titleInput = document.getElementById("cdn-upload-title");
  if (titleInput && !titleInput.value) {
    const raw = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");
    titleInput.value = raw.charAt(0).toUpperCase() + raw.slice(1);
  }
}

async function submitCdnUpload(e) {
  e.preventDefault();
  const fileInput = document.getElementById("cdn-file-input");
  const file = fileInput?.files[0];
  if (!file) {
    toast("Silakan pilih berkas file yang akan diunggah", "error");
    return;
  }

  const type = document.querySelector('input[name="cdn_upload_type"]:checked')?.value || "music";
  const title = getVal("cdn-upload-title");
  const artist = getVal("cdn-upload-artist");
  const category = getVal("cdn-upload-category");

  const btn = document.getElementById("btn-submit-cdn-upload");
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined icon-xs">hourglass_top</span> Mengunggah ke CDN...';

  const fd = new FormData();
  fd.append("file", file);
  fd.append("type", type);
  fd.append("title", title);
  fd.append("artist", artist);
  fd.append("category", category);

  try {
    const res = await fetch("cdn/api.php?action=upload", {
      method: "POST",
      body: fd,
    });
    const json = await res.json();
    if (json.success) {
      toast("Aset berhasil diunggah ke CDN! ✓", "success");
      closeModal("cdn-upload-modal");
      loadCdnStats();
      if (type === "music") {
        loadCdnMusic(true);
        loadMusicPresetsFromCDN(); // Sinkronkan ke tab preset order
      } else {
        loadCdnVideos(true);
      }
    } else {
      toast(json.message || "Gagal mengunggah aset", "error");
    }
  } catch (err) {
    toast("Error koneksi upload: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined icon-xs">cloud_upload</span> Mulai Unggah';
  }
}

// ── Import URL Handlers ──
function openCdnImportModal() {
  const form = document.getElementById("cdn-import-form");
  if (form) form.reset();
  openModal("cdn-import-modal");
}

async function submitCdnImport(e) {
  e.preventDefault();
  const url = getVal("cdn-import-url").trim();
  const title = getVal("cdn-import-title").trim();
  const artist = getVal("cdn-import-artist").trim();
  const category = getVal("cdn-import-category");

  if (!url) {
    toast("URL tautan media wajib diisi", "error");
    return;
  }

  const btn = document.getElementById("btn-submit-cdn-import");
  btn.disabled = true;
  btn.innerHTML = '<span class="material-symbols-outlined icon-xs">hourglass_top</span> Mengunduh &amp; Memproses...';

  try {
    const res = await fetch("cdn/api.php?action=import_url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, title, artist, category }),
    });
    const json = await res.json();
    if (json.success) {
      toast(json.message || "Import media berhasil! ✓", "success");
      closeModal("cdn-import-modal");
      loadCdnStats();
      loadCdnMusic(true);
      loadMusicPresetsFromCDN();
    } else {
      toast(json.message || "Gagal mengimpor media dari URL", "error");
    }
  } catch (err) {
    toast("Error koneksi import: " + err.message, "error");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span class="material-symbols-outlined icon-xs">download</span> Ekstrak &amp; Simpan ke CDN';
  }
}

// ── Edit Metadata Handlers ──
function openCdnEditModal(id, type, title, artist, category) {
  setVal("cdn-edit-id", id);
  setVal("cdn-edit-type", type);
  setVal("cdn-edit-title", title);
  setVal("cdn-edit-artist", artist);
  setVal("cdn-edit-category", category);

  const artistWrap = document.getElementById("cdn-edit-artist-wrap");
  if (artistWrap) artistWrap.style.display = type === "video" ? "none" : "block";

  openModal("cdn-edit-modal");
}

async function submitCdnEdit() {
  const id = getVal("cdn-edit-id");
  const type = getVal("cdn-edit-type");
  const title = getVal("cdn-edit-title").trim();
  const artist = getVal("cdn-edit-artist").trim();
  const category = getVal("cdn-edit-category");

  if (!title) {
    toast("Judul aset wajib diisi", "error");
    return;
  }

  try {
    const res = await fetch("cdn/api.php?action=update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type, title, artist, category }),
    });
    const json = await res.json();
    if (json.success) {
      toast("Metadata berhasil diperbarui! ✓", "success");
      closeModal("cdn-edit-modal");
      if (type === "music") {
        loadCdnMusic(true);
        loadMusicPresetsFromCDN();
      } else {
        loadCdnVideos(true);
      }
    } else {
      toast(json.message || "Gagal memperbarui metadata", "error");
    }
  } catch (err) {
    toast("Error pembaruan: " + err.message, "error");
  }
}

// ── Delete Asset Handlers ──
async function deleteCdnAsset(id, type, name) {
  const confirmed = await confirmDialog("Hapus Aset CDN", `Apakah Anda yakin ingin menghapus "${name}" dari server CDN? File fisik di disk akan dihapus.`);
  if (!confirmed) return;

  try {
    const res = await fetch("cdn/api.php?action=delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, type }),
    });
    const json = await res.json();
    if (json.success) {
      toast("Aset CDN berhasil dihapus ✓", "success");
      loadCdnStats();
      if (type === "music") {
        if (cdnCurrentlyPlayingId === id) stopCdnGlobalAudio();
        loadCdnMusic(true);
        loadMusicPresetsFromCDN();
      } else {
        loadCdnVideos(true);
      }
    } else {
      toast(json.message || "Gagal menghapus aset", "error");
    }
  } catch (err) {
    toast("Error saat menghapus: " + err.message, "error");
  }
}

// ── Video Preview Handlers ──
function previewCdnVideo(previewUrl, title, publicUrl) {
  const modal = document.getElementById("cdn-video-modal");
  const titleEl = document.getElementById("cdn-video-modal-title");
  const video = document.getElementById("cdn-video-player");
  const urlInput = document.getElementById("cdn-video-modal-url");

  if (titleEl) titleEl.textContent = title;
  if (video) {
    video.src = previewUrl;
    video.play().catch(() => {});
  }
  if (urlInput) urlInput.value = publicUrl;

  openModal("cdn-video-modal");
}

function closeCdnVideoModal() {
  const video = document.getElementById("cdn-video-player");
  if (video) {
    video.pause();
    video.src = "";
  }
  closeModal("cdn-video-modal");
}

// ═══════════════════════════════════════════════
// Boot
// ═══════════════════════════════════════════════
document.addEventListener("DOMContentLoaded", () => {
  // Muat preset musik dari CDN (fallback ke lokal jika gagal)
  loadMusicPresetsFromCDN();

  // Isi dropdown mu-preset jika sudah ada di DOM
  const presetSel = document.getElementById("mu-preset");
  if (presetSel) presetSel.innerHTML = getMusicPresetOptionsHtml();

  const ov = Object.assign(document.createElement("div"), { id: "sidebar-overlay" });
  document.body.appendChild(ov);
  ov.addEventListener("click", toggleSidebar);

  document.getElementById("l-password")?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") doLogin();
  });

  // Init upload buttons
  initUploadButton("c-cover",        "btn-upload-cover",   "c-cover-preview",  folderCouple,    "cover");
  initUploadButton("c-groom-photo",  "btn-upload-groom",   "c-groom-preview",  folderCouple,    "mempelai-pria");
  initUploadButton("c-bride-photo",  "btn-upload-bride",   "c-bride-preview",  folderCouple,    "mempelai-wanita");
  initUploadButton("gl-url",         "btn-upload-gallery", null,               folderGallery,   "galeri",
    () => {
      const existing = getVal("gl-url");
      if (existing) {
        const m = existing.match(/galeri-([0-9a-zA-Z_-]+)\./);
        if (m) return m[1];
      }
      return "";
    }
  );
  initUploadButton("ls-photo",       "btn-upload-story",   null,               folderLoveStory, "cerita",
    () => {
      const existing = getVal("ls-photo");
      if (existing) {
        const m = existing.match(/cerita-([0-9a-zA-Z_-]+)\./);
        if (m) return m[1];
      }
      return getVal("ls-title").toLowerCase().replace(/[^a-z0-9]/g, "-") || "";
    }
  );
  initUploadButton("tm-photo",       "btn-upload-testi",   null,               "testimonials",  "testimoni");
  initUploadButton("wl-qr",          "btn-upload-qr",      null,               folderQrcode,    "qrcode",
    () => getVal("wl-bank").toLowerCase().replace(/[^a-z0-9]/g, "-") || getVal("wl-type")
  );
  initUploadButton("theme-thumbnail","btn-upload-theme",   "theme-thumb-preview", folderTheme,  "thumbnail");

  // Tutup notif dropdown jika klik di luar
  document.addEventListener("click", (e) => {
    const dd  = document.getElementById("notif-dropdown");
    const btn = document.getElementById("btn-notif");
    if (!dd || dd.style.display !== "block") return;
    if (dd.contains(e.target) || btn?.contains(e.target)) return;
    dd.style.display = "none";
  });

  // [FIX #1] Modal TIDAK tutup saat klik di luar — listener lama dihapus
  // Tutup hanya via tombol × atau tombol Batal
  // (tidak ada listener backdrop close di sini)

  if (S.token) {
    showApp();
    navigate("dashboard");
  }
});