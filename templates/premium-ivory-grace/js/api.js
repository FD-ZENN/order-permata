"use strict";

// ─── NORMALIZE CONFIG ────────────────────────────────────────────
(function normalizeConfig() {
  window.CONFIG = window.CONFIG || {};
  const C = window.CONFIG;

  // Endpoint API Permata Wedding
  C.apiBase = (C.apiBase || "https://invitation.permatawedding.com/api/API").replace(/\/+$/, "");

  // Deteksi otomatis ORDER_ID dari URL query parameter (?order_id=... atau ?id=... atau ?id_orders=...)
  const params = new URLSearchParams(window.location.search);
  const paramOid = params.get("order_id") || params.get("id") || params.get("id_orders") || params.get("order");
  if (paramOid) {
    C.ORDER_ID = paramOid;
  }
  C.ORDER_ID = C.ORDER_ID || C.id_orders || C.idOrders || "";
  C.id_orders = C.id_orders || C.ORDER_ID || "";
  C.idOrders = C.idOrders || C.ORDER_ID || "";
})();

// ─── DATA STORE ──────────────────────────────────────────────────
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
const _BASE_DOMAIN = (function () {
  try {
    return new URL(CONFIG.apiBase).origin;
  } catch {
    return window.location.origin;
  }
})();

// ─── DOM HELPERS ─────────────────────────────────────────────────
function photoUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${_BASE_DOMAIN}${path}`;
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
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  const d = new Date(datetime);
  if (isNaN(d)) return datetime;
  return `${hari[d.getDay()]}, ${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function tglCover(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  const bulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  if (isNaN(d)) return datetime;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function tglAngka(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  if (isNaN(d)) return datetime;
  const pad = (n) => String(n).padStart(2, "0");
  const thn = String(d.getFullYear()).slice(-2);
  return `${pad(d.getDate())} . ${pad(d.getMonth() + 1)} . ${thn}`;
}

function jamWIB(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") + " WIB";
}

// ─── INTERNAL API FETCH UTIL ─────────────────────────────────────
function _apiOid() {
  return encodeURIComponent(CONFIG.ORDER_ID);
}

async function _apiGet(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return res.json();
}

// ─── FETCH ALL DATA ──────────────────────────────────────────────
async function fetchAllData() {
  // ⚡ Jika data sudah di-injeksi langsung oleh InvitationCompiler (Pre-rendered)
  if (window.INVITATION_DATA) {
    const inj = window.INVITATION_DATA;
    DATA.couple    = inj.couple || null;
    DATA.events    = inj.events || [];
    DATA.music     = inj.music || null;
    DATA.stories   = inj.stories || [];
    DATA.galleries = inj.galleries || [];
    DATA.wallets   = inj.wallets || [];
    // Load komentar via API agar selalu realtime
    if (CONFIG.ORDER_ID) {
      try {
        const cmJ = await _apiGet(`${CONFIG.apiBase}/comments?order_id=${_apiOid()}&limit=30&sort=created_at&dir=desc`);
        DATA.comments = cmJ.success ? cmJ.data?.items || [] : [];
      } catch (e) {
        console.warn("api.js: load realtime comments error:", e.message);
      }
    }
    return DATA;
  }

  if (!CONFIG.ORDER_ID) {
    return DATA; // Mode demo / fallback data
  }

  const oid = _apiOid();
  const b = CONFIG.apiBase;

  try {
    const [coupleJ, evJ, muJ, stJ, glJ, lvJ, wlJ, cmJ] = await Promise.all([
      _apiGet(`${b}/couples?order_id=${oid}&limit=1`),
      _apiGet(`${b}/events?order_id=${oid}&limit=20&sort=sort_order&dir=asc`),
      _apiGet(`${b}/music?order_id=${oid}&limit=5&sort=sort_order&dir=asc`),
      _apiGet(`${b}/love-stories?order_id=${oid}&limit=20&sort=sort_order&dir=asc`),
      _apiGet(`${b}/galleries?order_id=${oid}&limit=30&sort=sort_order&dir=asc`),
      _apiGet(`${b}/livestreaming?order_id=${oid}&limit=5`),
      _apiGet(`${b}/digital-wallets?order_id=${oid}&limit=10`),
      _apiGet(`${b}/comments?order_id=${oid}&limit=30&sort=created_at&dir=desc`),
    ]);

    DATA.couple = coupleJ.success ? coupleJ.data?.items?.[0] || null : null;
    DATA.events = evJ.success ? evJ.data?.items || [] : [];
    DATA.music = muJ.success ? muJ.data?.items?.[0] || null : null;
    DATA.stories = stJ.success ? stJ.data?.items || [] : [];
    DATA.galleries = glJ.success ? glJ.data?.items || [] : [];
    DATA.live = lvJ.success ? lvJ.data?.items?.find((l) => +l.is_active === 1) || null : null;
    DATA.wallets = wlJ.success ? wlJ.data?.items?.filter((w) => +w.is_active === 1) || [] : [];
    DATA.comments = cmJ.success ? cmJ.data?.items || [] : [];
  } catch (err) {
    console.warn("api.js: fetchAllData error:", err.message);
  }

  return DATA;
}

// ─── RELOAD COMMENTS ─────────────────────────────────────────────
async function reloadComments() {
  if (!CONFIG.ORDER_ID) return;
  try {
    const j = await _apiGet(`${CONFIG.apiBase}/comments?order_id=${_apiOid()}&limit=30&sort=created_at&dir=desc`);
    if (j.success) DATA.comments = j.data?.items || [];
  } catch (err) {
    console.warn("Gagal reload komentar:", err.message);
  }
  if (typeof renderComments === "function") renderComments();
}

// ─── POST COMMENT ────────────────────────────────────────────────
async function postComment({ name, guest_name, attendance, content, greeting }) {
  const res = await fetch(`${CONFIG.apiBase}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      order_id: CONFIG.ORDER_ID,
      guest_name: guest_name || name,
      content: content || greeting,
      attendance: attendance || "Hadir",
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(json.message || "Gagal mengirim pesan");
  return json;
}

// ─── RSVP SUBMIT HANDLER ─────────────────────────────────────────
async function handleApiRsvpSubmit(e) {
  e.preventDefault();
  const form = e.target;
  const fb = document.getElementById("rsvp-feedback");
  const btn = document.getElementById("rsvp-submit") || form.querySelector('button[type="submit"]');

  const name = (form.name?.value || form["rsvp-name"]?.value || "").trim();
  const attendance = form.attendance?.value || form["rsvp-att"]?.value || "";
  const greeting = (form.greeting?.value || form["rsvp-msg"]?.value || form.content?.value || "").trim();

  const showFb = (type, msg) => {
    if (!fb) return;
    fb.className = `mt-4 text-center font-poppins fw-bold text-xs ${type === "error" ? "text-primary" : "text-green"}`;
    fb.textContent = msg;
    fb.style.display = "block";
    fb.classList.remove("d-none");
    setTimeout(() => {
      fb.style.display = "none";
      fb.classList.add("d-none");
    }, 5000);
  };

  if (!name || !attendance || !greeting) return showFb("error", "Harap lengkapi semua kolom formulir.");

  if (btn) {
    btn.disabled = true;
    btn.dataset.origText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENGIRIM...';
  }

  try {
    if (CONFIG.ORDER_ID) {
      await postComment({ name, attendance, greeting });
      showFb("success", "Terima kasih atas doa restunya!");
      form.reset();
      await reloadComments();
    } else {
      // Mode offline / demo
      const LS_KEY = "ivory_grace_comments_local";
      const ls = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
      ls.unshift({ name, attendance, greeting, created_at: new Date().toISOString() });
      localStorage.setItem(LS_KEY, JSON.stringify(ls));
      showFb("success", "Terima kasih atas ucapan & doa Anda (Mode Offline).");
      form.reset();
      if (typeof renderComments === "function") renderComments();
    }
  } catch (err) {
    showFb("error", err.message || "Gagal mengirim ucapan.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.origText || "KIRIM PESAN";
    }
  }
}

// ─── RENDER COUPLE ───────────────────────────────────────────────
function renderCouple() {
  const c = DATA.couple;
  if (!c) return; // Fallback demo data tetap tampil

  const gNick = c.groom_nickname || c.groom_name || "";
  const bNick = c.bride_nickname || c.bride_name || "";
  const coupleNames = `${bNick} & ${gNick}`;
  const firstEvent = DATA.events[0];
  const mainDate = firstEvent?.event_datetime || null;
  const coverDateText = mainDate ? tglCover(mainDate) : "";
  const heroDateText = mainDate ? tglAngka(mainDate) : "";
  const fullDate = mainDate ? tglIndo(mainDate) : "";
  const coverPhoto = c.cover_photo_url || DATA.galleries.find((g) => +g.is_cover === 1)?.photo_url;

  // Cover & Backgrounds
  if (coverPhoto) {
    _setCoverBg("cover", coverPhoto);
    _setCoverBg("desktop-bg", coverPhoto);
    _setSrc("hero-cover-img", coverPhoto);
  }

  // Initials (Bride & Groom)
  const initB = (bNick[0] || "E").toUpperCase();
  const initG = (gNick[0] || "S").toUpperCase();
  _setText("cover-initials-bride", initB);
  _setText("cover-initials-groom", initG);

  // Nicknames & Fullnames
  _setText("desktop-names", coupleNames);
  _setText("cover-bride", bNick);
  _setText("cover-groom", gNick);
  _setText("hero-bride", bNick);
  _setText("hero-groom", gNick);
  _setText("name-bride", bNick);
  _setText("name-groom", gNick);

  _setText("cover-date", coverDateText);
  _setText("hero-date", heroDateText);

  _setText("bride-full", c.bride_name);
  _setText("bride-father", c.bride_father);
  _setText("bride-mother", c.bride_mother);
  if (c.bride_address) {
    _setText("bride-address", c.bride_address);
    const wrap = document.getElementById("bride-address-wrap");
    if (wrap) wrap.style.display = "inline";
  }

  _setText("groom-full", c.groom_name);
  _setText("groom-father", c.groom_father);
  _setText("groom-mother", c.groom_mother);
  if (c.groom_address) {
    _setText("groom-address", c.groom_address);
    const wrap = document.getElementById("groom-address-wrap");
    if (wrap) wrap.style.display = "inline";
  }

  _setSrc("bride-photo", c.bride_photo_url);
  _setSrc("groom-photo", c.groom_photo_url);

  _setText("closing-couple", coupleNames);
  _setText("closing-date", fullDate);
}

// ─── RENDER EVENTS ───────────────────────────────────────────────
function renderEvents() {
  if (!DATA.events.length) return;

  DATA.events.forEach((ev, i) => {
    const jamAkhir = ev.event_end ? ` - ${jamWIB(ev.event_end)}` : " - Selesai";

    _setText(`event-${i}-date`, tglIndo(ev.event_datetime));
    _setText(`event-${i}-time`, `${jamWIB(ev.event_datetime)}${jamAkhir}`);
    _setText(`event-${i}-venue`, ev.venue_name || "");
    _setText(`event-${i}-address`, ev.venue_address || "");

    // Google Maps link
    document.querySelectorAll(`[data-key="event-${i}-maps"]`).forEach((el) => {
      if (ev.google_maps_url) {
        el.href = ev.google_maps_url;
        el.style.display = "inline-flex";
      }
    });
  });

  // Sinkronkan countdown ke acara pertama atau kedua
  const targetDate = DATA.events[0]?.event_datetime;
  if (targetDate && typeof startCountdown === "function") {
    startCountdown(new Date(targetDate));
  }
}

// ─── RENDER STORIES ──────────────────────────────────────────────
function renderStories() {
  if (!DATA.stories.length) return;

  DATA.stories.forEach((st, i) => {
    const label = st.story_date ? tglCover(st.story_date) : st.date_label || "";
    _setText(`story-${i}-label`, label || st.title || "");
    _setText(`story-${i}-title`, st.title || "");
    _setText(`story-${i}-content`, st.content || "");
  });
}

// ─── RENDER WALLETS ──────────────────────────────────────────────
function renderWallets() {
  if (DATA.wallets.length) {
    DATA.wallets.forEach((w, i) => {
      const bank = w.bank_name || w.wallet_type || "Bank";
      const number = w.account_number || "";
      const holder = `a.n. ${w.account_holder || ""}`;

      _setText(`wallet-${i}-bank`, bank);
      _setText(`wallet-${i}-number`, number);
      _setText(`wallet-${i}-holder`, holder);

      // Update data-copy pada tombol salin
      document.querySelectorAll(`[data-key="wallet-${i}-copy"]`).forEach((btn) => {
        btn.setAttribute("data-copy", number);
      });
    });
  }

  // Render Kirim Kado Fisik (mengambil nama & alamat mempelai wanita atau pria)
  const c = DATA.couple;
  if (c) {
    const giftName = c.bride_name || c.groom_name || "";
    const giftAddr = c.bride_address || c.groom_address || "";

    const elName = document.getElementById("gift-recipient");
    const elAddr = document.getElementById("gift-address");
    const btnCopy = document.getElementById("gift-copy-btn");
    const wrapGift = document.getElementById("gift-wrapper");

    if (giftAddr) {
      if (elName) elName.textContent = giftName;
      if (elAddr) elAddr.textContent = giftAddr;
      if (btnCopy) btnCopy.setAttribute("data-copy", giftAddr);
      if (wrapGift) wrapGift.style.display = "block";
    } else if (!giftAddr && wrapGift) {
      // Jika kedua mempelai tidak mengisi alamat, sembunyikan section kado fisik
      wrapGift.style.display = "none";
    }
  }
}

// ─── RENDER MUSIC ────────────────────────────────────────────────
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

// ─── RENDER LIVE STREAM ──────────────────────────────────────────
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
  const coupleNames = `${bNick} & ${gNick}`;
  const firstEvent = DATA.events[0];
  const fullDate = firstEvent ? tglIndo(firstEvent.event_datetime) : "";
  const title = `The Wedding of ${coupleNames}`;
  const titleDate = fullDate ? `${title} — ${fullDate}` : title;
  const coverPhoto = c.cover_photo_url || DATA.galleries.find((g) => +g.is_cover === 1)?.photo_url || "";
  const desc = c.meta_description || `Undangan Pernikahan ${coupleNames}${fullDate ? `, ${fullDate}` : ""}.`;
  const url = window.location.href;

  document.title = title;

  _setMeta("meta-description", desc);
  _setMeta("meta-og-title", titleDate);
  _setMeta("meta-og-description", desc);
  _setMeta("meta-og-image", photoUrl(coverPhoto));
  _setMeta("meta-twitter-title", titleDate);
  _setMeta("meta-twitter-description", desc);
  _setMeta("meta-twitter-image", photoUrl(coverPhoto));

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute("content", url);
}

// ─── RENDER COMMENTS LIST ────────────────────────────────────────
function renderComments() {
  const list = document.getElementById("comments-list");
  const countEl = document.getElementById("comments-count");
  if (!list) return;

  const apiComments = (window.DATA?.comments || []).map((cm) => ({
    name: cm.guest_name || cm.name || "Anonim",
    attendance: cm.attendance || "Belum Pasti",
    greeting: cm.content || cm.greeting || "",
  }));

  // Fallback local storage
  const LS_KEY = "ivory_grace_comments_local";
  const ls = JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  const allComments = [...ls, ...apiComments];

  if (!allComments.length) {
    list.innerHTML = '<p class="text-center font-poppins text-xs text-dark" style="opacity:0.5;padding:20px 0">Belum ada ucapan.</p>';
    if (countEl) countEl.textContent = "0 Pesan";
    return;
  }

  const escapeHtml = (s) => {
    const d = document.createElement("div");
    d.appendChild(document.createTextNode(s || ""));
    return d.innerHTML;
  };

  list.innerHTML = allComments
    .map((data) => {
      const isAttendant = data.attendance && data.attendance.toLowerCase().includes("hadir") && !data.attendance.toLowerCase().includes("tidak");
      return `
      <div class="comment-item" style="padding: 12px; margin-bottom: 8px; border-bottom: 1px solid #f0f0f0;">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <span class="font-cormorant fw-bold text-primary" style="font-size:16px">${escapeHtml(data.name)}</span>
          <span class="badge ${isAttendant ? "bg-secondary text-white" : "bg-gray text-white"} p-1 rounded text-xs font-poppins">
            ${escapeHtml(data.attendance)}
          </span>
        </div>
        <p class="font-poppins text-xs text-dark" style="margin: 0; line-height: 1.5;">${escapeHtml(data.greeting)}</p>
      </div>`;
    })
    .join("");

  if (countEl) countEl.textContent = `${allComments.length} Pesan`;
}

// ─── AUTO-INIT ON LOAD ───────────────────────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await fetchAllData();
    renderCouple();
    renderEvents();
    renderStories();
    renderWallets();
    renderMusic();
    renderLiveStream();
    renderMeta();
    renderComments();
  } catch (err) {
    console.warn("api.js: Inisialisasi data gagal:", err.message);
  }
});
