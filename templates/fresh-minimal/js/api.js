"use strict";
// ─── NORMALIZE CONFIG ────────────────────────────────────────────
(function normalizeConfig() {
  window.CONFIG = window.CONFIG || {};
  const C = window.CONFIG;

  if (!C.apiBase) {
    // Deteksi otomatis jika berjalan di subfolder lokal (contoh: /order-permata/)
    const path = window.location.pathname || "";
    const m = path.match(/^(\/[^\/]+)?\/(?:20\d\d)\//);
    const prefix = m && m[1] ? m[1] : "";
    C.apiBase = window.location.origin + prefix + "/api";
  }
  C.apiBase = C.apiBase.replace(/\/+$/, "");
  C.ORDER_ID = C.ORDER_ID || C.id_orders || C.idOrders || "";
  C.id_orders = C.id_orders || C.ORDER_ID || "";
  C.idOrders = C.idOrders || C.ORDER_ID || "";
})();

// ─── DATA (global container) ─────────────────────────────────────
window.DATA = window.DATA || {
  couple: null,
  events: [],
  music: null,
  stories: [],
  galleries: [],
  live: null,
  wallets: [],
  entertainments: [],
  comments: [],
};

// ─── BASE DOMAIN ─────────────────────────────────────────────────
const _BASE_DOMAIN = window.location.origin;

// ─── DOM HELPERS ─────────────────────────────────────────────────
function photoUrl(path) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${_BASE_DOMAIN}${cleanPath}`;
}

function _setMeta(id, val) {
  const el = document.getElementById(id);
  if (el && val != null && String(val).trim() !== "") el.setAttribute("content", val);
}

function _setHtml(key, val) {
  if (val == null || String(val).trim() === "") return;
  const idEl = document.getElementById(key);
  if (idEl) idEl.innerHTML = val;
  document.querySelectorAll(`[data-key="${key}"]`).forEach((el) => {
    el.innerHTML = val;
  });
}

function _setText(key, val) {
  if (val == null || String(val).trim() === "") return;
  const idEl = document.getElementById(key);
  if (idEl) idEl.textContent = val;
  document.querySelectorAll(`[data-key="${key}"]`).forEach((el) => {
    el.textContent = val;
  });
}

function _setSrc(id, path) {
  const el = document.getElementById(id);
  if (!el || !path) return;
  el.src = photoUrl(path);
}

function _setCoverBg(id, path) {
  const el = document.getElementById(id);
  if (!el || !path) return;
  el.style.backgroundImage = `url('${photoUrl(path)}')`;
}

// ─── DATE HELPERS ────────────────────────────────────────────────
function tglIndo(datetime) {
  if (!datetime) return "";
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = new Date(datetime);
  if (isNaN(d)) return datetime;
  return `${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function tglCover(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  if (isNaN(d)) return datetime;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function jamWIB(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
}

// ─── INTERNAL FETCH UTIL ─────────────────────────────────────────
function _apiOid() {
  return encodeURIComponent(CONFIG.ORDER_ID);
}

async function _apiGet(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return res.json();
}

// ─── FETCH ALL ───────────────────────────────────────────────────
async function fetchAllData() {
  const oid = _apiOid();
  const b = CONFIG.apiBase;

  const [coupleJ, evJ, muJ, stJ, glJ, lvJ, wlJ, enJ, cmJ] = await Promise.all([
    _apiGet(`${b}/couples?order_id=${oid}&limit=1`),
    _apiGet(`${b}/events?order_id=${oid}&limit=20&sort=sort_order&dir=asc`),
    _apiGet(`${b}/music?order_id=${oid}&limit=5&sort=sort_order&dir=asc`),
    _apiGet(`${b}/love-stories?order_id=${oid}&limit=20&sort=sort_order&dir=asc`),
    _apiGet(`${b}/galleries?order_id=${oid}&limit=30&sort=sort_order&dir=asc`),
    _apiGet(`${b}/livestreaming?order_id=${oid}&limit=5`),
    _apiGet(`${b}/digital-wallets?order_id=${oid}&limit=10`),
    _apiGet(`${b}/entertainment?order_id=${oid}&limit=10&sort=sort_order&dir=asc`),
    _apiGet(`${b}/comments?order_id=${oid}&limit=30&sort=created_at&dir=desc`),
  ]);

  DATA.couple = coupleJ.success ? coupleJ.data?.items?.[0] || null : null;
  DATA.events = evJ.success ? evJ.data?.items || [] : [];
  DATA.music = muJ.success ? muJ.data?.items?.[0] || null : null;
  DATA.stories = stJ.success ? stJ.data?.items || [] : [];
  DATA.galleries = glJ.success ? glJ.data?.items || [] : [];
  DATA.live = lvJ.success ? lvJ.data?.items?.find((l) => +l.is_active === 1) || null : null;
  DATA.wallets = wlJ.success ? wlJ.data?.items?.filter((w) => +w.is_active === 1) || [] : [];
  DATA.entertainments = enJ.success ? enJ.data?.items || [] : [];
  DATA.comments = cmJ.success ? cmJ.data?.items || [] : [];

  return DATA;
}

// ─── RELOAD COMMENTS ─────────────────────────────────────────────
async function reloadComments() {
  try {
    const j = await _apiGet(`${CONFIG.apiBase}/comments?order_id=${_apiOid()}&limit=30&sort=created_at&dir=desc`);
    if (j.success) DATA.comments = j.data?.items || [];
  } catch (err) {
    console.warn("Gagal reload komentar:", err.message);
  }
  if (typeof renderComments === "function") renderComments();
}

// ─── POST COMMENT ────────────────────────────────────────────────
async function postComment({ guest_name, name, content, greeting, attendance }) {
  const res = await fetch(`${CONFIG.apiBase}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      order_id: CONFIG.ORDER_ID,
      guest_name: guest_name || name,
      content: content || greeting,
      attendance,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Gagal mengirim ucapan");
  return json;
}

// ─── RENDER COUPLE ───────────────────────────────────────────────
function renderCouple() {
  const c = DATA.couple;
  if (!c) return;

  const gNick = c.groom_nickname || c.groom_name || "";
  const bNick = c.bride_nickname || c.bride_name || "";
  const coupleNames = `${gNick} & ${bNick}`;
  const firstEvent = DATA.events[0];
  const mainDate = firstEvent?.event_datetime || null;
  const fullDate = mainDate ? tglIndo(mainDate) : "";

  _setText("cover-groom", gNick);
  _setText("cover-bride", bNick);
  _setText("name-groom", gNick);
  _setText("name-bride", bNick);
  _setText("groom-full", c.groom_name);
  _setText("groom-father", c.groom_father);
  _setText("groom-mother", c.groom_mother);
  _setText("groom-address", c.groom_address);
  _setText("bride-full", c.bride_name);
  _setText("bride-father", c.bride_father);
  _setText("bride-mother", c.bride_mother);
  _setText("bride-address", c.bride_address);
  _setSrc("groom-photo", c.groom_photo_url);
  _setSrc("bride-photo", c.bride_photo_url);
  _setText("closing-couple", coupleNames);
  _setText("closing-date", fullDate);
}

// ─── RENDER EVENTS ───────────────────────────────────────────────
function renderEvents() {
  if (!DATA.events.length) return;

  DATA.events.forEach((ev, i) => {
    const jamAkhir = ev.event_end ? ` - ${jamWIB(ev.event_end)}` : " - Selesai";
    _setText(`event-${i}-date`, tglIndo(ev.event_datetime));
    _setText(`event-${i}-time`, jamWIB(ev.event_datetime) + jamAkhir);
    _setText(`event-${i}-venue`, ev.venue_name || "");
    _setText(`event-${i}-address`, ev.venue_address || "");
    document.querySelectorAll(`[data-key="event-${i}-maps"]`).forEach((el) => {
      if (ev.google_maps_url) el.href = ev.google_maps_url;
    });
  });

  DATA.entertainments.forEach((en, i) => {
    const label = [en.type, en.name].filter(Boolean).join(" ");
    _setText(`event-${i}-entertainment`, label ? `Hiburan: ${label}` : "");
  });
}

// ─── RENDER STORIES ──────────────────────────────────────────────
function renderStories() {
  if (!DATA.stories.length) return;

  DATA.stories.forEach((st, i) => {
    const label = st.story_date ? tglIndo(st.story_date) : st.date_label || "";
    _setText(`story-${i}-label`, label);
    _setText(`story-${i}-title`, st.title || "");
    _setText(`story-${i}-content`, st.content || "");
  });
}

// ─── RENDER WALLETS ──────────────────────────────────────────────
function renderWallets() {
  if (!DATA.wallets.length) return;

  DATA.wallets.forEach((w, i) => {
    const bank = w.bank_name || w.wallet_type || "";
    const number = w.account_number || "";
    const holder = `a.n. ${w.account_holder || ""}`;

    _setText(`wallet-${i}-bank`, bank);
    _setText(`wallet-${i}-number`, number);
    _setText(`wallet-${i}-holder`, holder);

    document.querySelectorAll(`[data-key="wallet-${i}-copy"]`).forEach((btn) => {
      btn.setAttribute("data-copy", number);
    });
  });
}

// ─── RENDER MUSIC (Dengan Pencegahan 404 cdn) ──────────────────────
function renderMusic() {
  if (!DATA.music?.audio_url) return;
  const audio = document.getElementById("bg-music");
  if (!audio) return;
  var url = DATA.music.audio_url;
  if (url.startsWith("cdn/")) {
    url = "../../" + url;
  }
  audio.src = url;
  audio.loop = Boolean(+DATA.music.loop);
}

// ─── RENDER LIVESTREAM ───────────────────────────────────────────
function renderLiveStream() {
  if (!DATA.live?.stream_url) return;
  document.querySelectorAll('[data-key="stream-0-url"]').forEach((el) => {
    el.href = DATA.live.stream_url;
  });
}

// ─── RENDER META ─────────────────────────────────────────────────
function renderMeta() {
  const c = DATA.couple;
  if (!c) return;

  const gNick = c.groom_nickname || c.groom_name || "";
  const bNick = c.bride_nickname || c.bride_name || "";
  const coupleNames = `${gNick} & ${bNick}`;
  const firstEvent = DATA.events[0];
  const fullDate = firstEvent ? tglIndo(firstEvent.event_datetime) : "";
  const title = `Pernikahan ${coupleNames}`;
  const titleDate = fullDate ? `${title} — ${fullDate}` : title;
  const coverPhoto = c.cover_photo_url || DATA.galleries.find((g) => +g.is_cover === 1)?.photo_url || "";
  const desc = c.meta_description || `Undangan pernikahan ${coupleNames}${fullDate ? `, ${fullDate}` : ""}.`;
  const url = window.location.href;

  document.title = title;

  _setMeta("meta-description", desc);
  _setMeta("meta-og-title", titleDate);
  _setMeta("meta-og-description", desc);
  _setMeta("meta-og-image", coverPhoto);
  _setMeta("meta-twitter-title", titleDate);
  _setMeta("meta-twitter-description", desc);
  _setMeta("meta-twitter-image", coverPhoto);

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute("content", url);
}

// ─── AUTO INIT ───────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await fetchAllData();
    renderCouple();
    renderEvents();
    renderStories();
    renderWallets();
    renderLiveStream();
    renderMusic();
    renderMeta();
    if (typeof renderComments === "function") {
      renderComments();
    }
  } catch (err) {
    console.warn("api.js: fetchAllData gagal:", err.message);
  }
});
