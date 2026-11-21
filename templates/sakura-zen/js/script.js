"use strict";

window.CONFIG = window.CONFIG || {};
var CONFIG = window.CONFIG;

let isMusicPlaying = false;
let countdownTimer = null;
const localPool = [];

const DATA = {
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

const FALLBACK_STORIES = [
  {
    title: "Awal Kenalan",
    story_date: null,
    date_label: "— Di Negeri Sakura —",
    content: "Pertemuan dimulai dari perkenalan sederhana saat sama-sama bekerja di negeri sakura.",
    icon: "fas fa-torii-gate",
  },
  {
    title: "Awal Ngedate",
    story_date: null,
    date_label: "— Perjalanan Indah Dimulai —",
    content: "Kencan pertama menjadi awal perjalanan. Jarak jauh berbuah cinta.",
    icon: "fas fa-heart",
  },
  {
    title: "Momen Jadian",
    story_date: "2024-02-04",
    date_label: "04 Februari 2024",
    content: "Resmi menjadi sepasang kekasih pada 4 Februari 2024.",
    icon: "fas fa-ring",
  },
  {
    title: "Lamaran",
    story_date: "2026-04-04",
    date_label: "04 April 2026",
    content: "Langkah menuju pelaminan dengan ikrar janji suci.",
    icon: "fas fa-gift",
  },
];

function getDummyCoupleName() {
  const g = document.getElementById("cover-groom")?.textContent?.trim() ||
            document.getElementById("name-groom")?.textContent?.trim() || "";
  const b = document.getElementById("cover-bride")?.textContent?.trim() ||
            document.getElementById("name-bride")?.textContent?.trim() || "";
  if (g && b) return `${g} & ${b}`;
  if (g || b) return g || b;
  return "Mempelai";
}

const DUMMY_COMMENTS = [
  {
    guest_name: "Keluarga & Sahabat",
    attendance: "hadir",
    get content() {
      return `Selamat Menempuh Hidup Baru Kak ${getDummyCoupleName()} semoga menjadi keluarga sakinah, mawaddah, dan warrahmah.`;
    },
    created_at: new Date().toISOString(),
  },
];

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

const esc = (s) => {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(s || ""));
  return d.innerHTML;
};

function _setText(key, val) {
  if (val == null || String(val).trim() === "") return;
  const idEl = document.getElementById(key);
  if (idEl) idEl.textContent = val;
  document.querySelectorAll(`[data-key="${key}"]`).forEach((el) => {
    el.textContent = val;
  });
}

// ─── BASE DOMAIN ─────────────────────────────────────────────────
const _BASE_DOMAIN = (function () {
  try {
    return new URL(CONFIG.apiBase).origin;
  } catch {
    return window.location.origin;
  }
})();

function photoUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${_BASE_DOMAIN}${path}`;
}

function _setSrc(id, path) {
  const el = document.getElementById(id);
  if (!el || !path) return;
  el.src = photoUrl(path);
}

function _setCoverBg(id, path) {
  const el = document.getElementById(id);
  if (!el || !path) return;
  const url = photoUrl(path);
  el.style.backgroundImage = `url('${url}')`;
}

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
  if (isNaN(d)) return datetime;
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())} · ${pad(d.getMonth() + 1)} · ${d.getFullYear()}`;
}

function jamWIB(datetime) {
  if (!datetime) return "";
  const d = new Date(datetime);
  if (isNaN(d)) return "";
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB";
}

function relativeDate(isoString) {
  if (!isoString) return "Baru saja";
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Baru saja";
  if (m < 60) return `${m} menit lalu`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} jam lalu`;
  return `${Math.floor(h / 24)} hari lalu`;
}

function mapAttToDb(val) {
  const v = (val || "").toLowerCase().trim();
  if (v === "tidak_hadir" || v.includes("tidak")) return "tidak_hadir";
  if (v === "ragu_ragu" || v.includes("belum") || v.includes("ragu")) return "ragu_ragu";
  return "hadir";
}

function attInfo(val) {
  const v = (val || "").toLowerCase();
  if (v === "tidak_hadir") return { cls: "tidak", label: "Iie" };
  if (v === "ragu_ragu") return { cls: "belum", label: "Tabun" };
  return { cls: "hadir", label: "Hai" };
}

async function fetchAllData() {
  if (!CONFIG.ORDER_ID || !CONFIG.ORDER_ID.trim()) {
    console.info("Static mode: CONFIG.ORDER_ID tidak diset, melewati fetchAllData.");
    return;
  }

  const oid = encodeURIComponent(CONFIG.ORDER_ID);
  const headers = { Accept: "application/json" };
  const base = CONFIG.apiBase || "/api";

  const [coupleRes, evRes, muRes, stRes, glRes, lvRes, wlRes, enRes, cmRes] = await Promise.all([
    fetch(`${base}/couples?order_id=${oid}&limit=1`, { headers }),
    fetch(`${base}/events?order_id=${oid}&limit=20&sort=sort_order&dir=asc`, { headers }),
    fetch(`${base}/music?order_id=${oid}&limit=5&sort=sort_order&dir=asc`, { headers }),
    fetch(`${base}/love-stories?order_id=${oid}&limit=20&sort=sort_order&dir=asc`, { headers }),
    fetch(`${base}/galleries?order_id=${oid}&limit=30&sort=sort_order&dir=asc`, { headers }),
    fetch(`${base}/livestreaming?order_id=${oid}&limit=5`, { headers }),
    fetch(`${base}/digital-wallets?order_id=${oid}&limit=10`, { headers }),
    fetch(`${base}/entertainment?order_id=${oid}&limit=10&sort=sort_order&dir=asc`, { headers }),
    fetch(`${base}/comments?order_id=${oid}&limit=30&sort=created_at&dir=desc`, { headers }),
  ]);

  const [coupleJ, evJ, muJ, stJ, glJ, lvJ, wlJ, enJ, cmJ] = await Promise.all([
    coupleRes.json(), evRes.json(), muRes.json(), stRes.json(), glRes.json(), lvRes.json(), wlRes.json(), enRes.json(), cmRes.json()
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
}

function renderCouple() {
  if (!DATA.couple) return;
  const c = DATA.couple;
  const gNick = c.groom_nickname || c.groom_name;
  const bNick = c.bride_nickname || c.bride_name;
  const coupleNames = `${gNick} & ${bNick}`;

  const firstEvent = DATA.events[0];
  const mainDate = firstEvent ? firstEvent.event_datetime : null;
  const coverDateText = mainDate ? tglCover(mainDate) : null;
  const formattedFullDate = mainDate ? tglIndo(mainDate) : null;

  const initials = `${(gNick[0] || "").toUpperCase()} <span class="text-xs">&amp;</span> ${(bNick[0] || "").toUpperCase()}`;

  const coverPhoto = c.cover_photo_url || DATA.galleries.find((g) => +g.is_cover === 1)?.photo_url;
  if (coverPhoto) {
    _setCoverBg("cover-photo", coverPhoto);
    _setCoverBg("cover", coverPhoto);
  }

  _setHtml("cover-initials", initials);
  _setHtml("cover-monogram", initials);
  _setText("cover-groom", gNick);
  _setText("cover-bride", bNick);
  if (coverDateText) _setText("cover-date", coverDateText);

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

  if (c.groom_photo_url) _setSrc("groom-photo", c.groom_photo_url);
  if (c.bride_photo_url) _setSrc("bride-photo", c.bride_photo_url);

  _setText("closing-couple", coupleNames.toUpperCase());
  if (formattedFullDate) _setText("closing-date", formattedFullDate);

  const title = `Pernikahan ${coupleNames}`;
  const titleDate = formattedFullDate ? `${title} — ${formattedFullDate}` : title;
  document.title = title;

  _setMeta("meta-og-title", titleDate);
  _setMeta("meta-og-description", c.meta_description);
  if (coverPhoto) _setMeta("meta-og-image", coverPhoto);
  _setMeta("meta-twitter-title", titleDate);
  _setMeta("meta-twitter-description", c.meta_description);
  if (coverPhoto) _setMeta("meta-twitter-image", coverPhoto);
}

function renderEvents() {
  const container = document.getElementById("event-cards-container");
  if (!container) return;

  // Jika HTML sudah ter-pre-render dengan class .event-card-jp dan bukan icon spinner loading
  if (container.querySelectorAll(".event-card-jp").length > 0) {
    const cdDays = document.getElementById("cd-days");
    const targetDateAttr = cdDays?.closest("[data-target]")?.getAttribute("data-target") || (DATA.events[0]?.event_datetime ? new Date(DATA.events[0].event_datetime) : null);
    if (targetDateAttr) {
      startCountdown(new Date(targetDateAttr));
    }
    return;
  }

  if (!DATA.events.length) {
    container.innerHTML = '<p style="text-align:center;opacity:.7;padding:1rem">Informasi acara belum tersedia.</p>';
    return;
  }

  startCountdown(new Date(DATA.events[0].event_datetime));

  container.innerHTML = DATA.events
    .map(
      (ev, i) => `
    <div class="event-card-jp ${i > 0 ? "mt-4" : ""}" data-aos="fade-${i % 2 === 0 ? "right" : "left"}">
      <div class="card-inner-jp">
        <div class="icon-torii mb-3">
          <i class="fas fa-${i === 0 ? "torii-gate" : "gem"} text-crimson fa-2x"></i>
        </div>
        <h3 class="font-calligraphy text-ink mb-2 text-2xl">${esc(ev.event_name)}</h3>
        <p class="font-bold text-crimson tracking-wide text-sm mb-1">${tglIndo(ev.event_datetime)}</p>
        <p class="text-ink text-sm">
          ${jamWIB(ev.event_datetime)}
          ${ev.event_end ? ` - ${jamWIB(ev.event_end)}` : " - Selesai"}
        </p>
        <div class="divider-brush my-3"></div>
        ${ev.venue_name ? `<p class="text-ink font-bold">${esc(ev.venue_name)}</p>` : ""}
        ${ev.venue_address ? `<p class="text-ink text-sm mt-1 opacity-70">${esc(ev.venue_address)}</p>` : ""}
        ${ev.description ? `<p class="text-ink text-sm mt-2 opacity-60">${esc(ev.description)}</p>` : ""}
        ${
          ev.google_maps_url
            ? `<a href="${esc(ev.google_maps_url)}" target="_blank" rel="noopener" class="btn-jp-sm mt-3 inline-flex items-center gap-1">
                 <i class="fas fa-map-marker-alt"></i> Petunjuk Arah
               </a>`
            : ""
        }
      </div>
    </div>`,
    )
    .join("");
}

function renderMaps() {
  const evWithMaps = DATA.events.find((ev) => ev.google_maps_url);
  const mapsBtn = document.getElementById("maps-btn");
  if (mapsBtn && evWithMaps?.google_maps_url) {
    mapsBtn.href = evWithMaps.google_maps_url;
    mapsBtn.style.display = "inline-flex";
  }
}

function renderEntertainment() {
  const container = document.getElementById("entertainment-container");
  if (!container) return;
  if (!DATA.entertainments.length) {
    container.style.display = "none";
    return;
  }
  container.style.display = "";
  container.innerHTML = DATA.entertainments
    .map(
      (en) => `
    <div class="ent-card" data-aos="fade-up">
      <i class="fas fa-music text-crimson mb-2" style="font-size:1.5rem;"></i>
      <p class="text-sm text-ink opacity-70">${esc(en.type || "Hiburan")}</p>
      <p class="font-bold text-ink">${esc(en.name)}</p>
      ${en.description ? `<p class="text-xs text-ink opacity-60 mt-1">${esc(en.description)}</p>` : ""}
    </div>`,
    )
    .join("");
}

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

function renderStories() {
  const container = document.getElementById("story-list");
  if (!container) return;

  // Jika HTML sudah ter-pre-render dengan class .tl-item dan bukan icon spinner loading
  if (container.querySelectorAll(".tl-item").length > 0) {
    return;
  }

  const stories = DATA.stories.length ? DATA.stories : FALLBACK_STORIES;
  const isFromDb = DATA.stories.length > 0;
  const icons = ["fas fa-torii-gate", "fas fa-heart", "fas fa-ring", "fas fa-gift", "fas fa-star"];

  container.innerHTML = stories
    .map((st, i) => {
      const dateLabel = isFromDb ? (st.story_date ? tglIndo(st.story_date) : "Momen Spesial") : st.date_label || (st.story_date ? tglIndo(st.story_date) : "Momen Spesial");
      const icon = isFromDb ? icons[i] || "fas fa-heart" : st.icon || "fas fa-heart";
      const delay = i * 100;

      return `
    <div class="tl-item" data-aos="fade-up" ${delay ? `data-aos-delay="${delay}"` : ""}>
      <div class="tl-dot"><i class="${icon}"></i></div>
      <div class="tl-content">
        <h4 class="tl-title">${esc(st.title)}</h4>
        <p class="tl-date">${dateLabel}</p>
        <p class="tl-text">${esc(st.content || "")}</p>
        ${isFromDb && st.photo_url ? `<img src="${photoUrl(st.photo_url)}" alt="${esc(st.title)}" style="width:100%;border-radius:8px;margin-top:.75rem;object-fit:cover;max-height:200px" loading="lazy" />` : ""}
      </div>
    </div>`;
    })
    .join("");
}

function renderGalleries() {
  const container = document.getElementById("gallery-container");
  if (!container) return;

  // Jika HTML sudah ter-pre-render dengan class .jpg-item dan bukan icon spinner loading
  if (container.querySelectorAll(".jpg-item").length > 0) {
    return;
  }

  if (!DATA.galleries.length) {
    container.innerHTML = '<p style="text-align:center;opacity:.7;grid-column:1/-1;padding:2rem">Galeri belum tersedia.</p>';
    return;
  }
  container.innerHTML = DATA.galleries
    .map(
      (g, i) => `
    <a href="${photoUrl(g.photo_url)}" data-lightbox="jp-gallery" data-title="${esc(g.caption || "")}" class="jpg-item">
      <div class="jpg-inner">
        <img src="${photoUrl(g.photo_url)}" alt="${esc(g.caption || `Galeri ${i + 1}`)}" loading="lazy" />
      </div>
    </a>`,
    )
    .join("");
}

function renderLive() {
  const section = document.getElementById("live-section");
  if (!section) return;
  if (!DATA.live?.youtube_url) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  _setText("live-title", DATA.live.title || "Siaran Langsung Pernikahan");

  const liveLink = document.getElementById("live-link");
  if (liveLink) liveLink.href = DATA.live.youtube_url;

  const liveSchedule = document.getElementById("live-schedule");
  if (liveSchedule) {
    if (DATA.live.stream_start) {
      liveSchedule.textContent = `${tglIndo(DATA.live.stream_start)} • ${jamWIB(DATA.live.stream_start)}`;
      liveSchedule.style.display = "";
    } else {
      liveSchedule.style.display = "none";
    }
  }
}

function renderWallets() {
  const container = document.getElementById("wallet-container");
  if (!container) return;

  // Jika HTML sudah ter-pre-render dengan class .gift-card-jp dan bukan icon spinner loading
  if (container.querySelectorAll(".gift-card-jp").length > 0) {
    initCopyButtons();
    return;
  }

  if (!DATA.wallets.length) {
    const section = document.getElementById("amplop");
    if (section) section.style.display = "none";
    return;
  }
  container.innerHTML = DATA.wallets
    .map(
      (w) => `
    <div class="gift-card-jp">
      <div class="hanko-watermark">${esc((w.bank_name || w.wallet_type || "PAY").substring(0, 3).toUpperCase())}</div>
      <h4 class="text-crimson font-bold text-lg border-b border-crimson pb-2 mb-3 inline-block">
        ${esc(w.bank_name || w.wallet_type.toUpperCase())}
      </h4>
      <p class="text-2xl font-bold text-ink tracking-wide mb-1">${esc(w.account_number || "—")}</p>
      <p class="text-ink text-sm mb-4 opacity-80">a.n ${esc(w.account_holder)}</p>
      ${w.qr_code_url ? `<img src="${photoUrl(w.qr_code_url)}" alt="QR Code ${esc(w.bank_name)}" style="width:140px;height:140px;object-fit:contain;margin:0 auto .75rem;display:block;border-radius:8px" />` : ""}
      <button class="btn-jp-sm btn-copy w-full" data-copy="${esc(w.account_number || "")}">
        <i class="fas fa-copy mr-1"></i> Salin Nomor Rekening
      </button>
    </div>`,
    )
    .join("");
  initCopyButtons();
}

function renderComments() {
  const list = document.getElementById("comments-list");
  if (!list) return;
  const allComments = [...localPool, ...DATA.comments];
  const commentsToRender = allComments.length ? allComments : DUMMY_COMMENTS;

  list.innerHTML = commentsToRender
    .map((cm) => {
      const att = attInfo(cm.attendance);
      return `
    <div class="jp-comment-box animate__animated animate__fadeIn">
      <div class="jpc-header">
        <span class="jpc-name">${esc(cm.guest_name || "Tamu")}</span>
        <span class="jpc-badge ${att.cls}">${att.label}</span>
      </div>
      <div class="jpc-text">${esc(cm.content || "")}</div>
      <div class="jpc-date">${relativeDate(cm.created_at || cm.date)}</div>
    </div>`;
    })
    .join("");
}

function renderAll() {
  renderCouple();
  renderEvents();
  renderMaps();
  renderEntertainment();
  renderMusic();
  renderStories();
  renderGalleries();
  renderLive();
  renderWallets();
  renderComments();
}

async function reloadComments() {
  try {
    const oid = encodeURIComponent(CONFIG.ORDER_ID);
    const res = await fetch(`${CONFIG.apiBase}/comments?order_id=${oid}&limit=30&sort=created_at&dir=desc`, {
      headers: { Accept: "application/json" },
    });
    const json = await res.json();
    if (json.success) DATA.comments = json.data?.items || [];
  } catch (err) {
    console.warn("Gagal reload komentar:", err.message);
  }
  renderComments();
}

async function handleSubmit(e) {
  e.preventDefault();
  const feedback = document.getElementById("rsvp-feedback");
  const btn = document.getElementById("rsvp-submit");
  const name = document.getElementById("rsvp-name")?.value.trim();
  const attRaw = document.getElementById("rsvp-att")?.value;
  const msg = document.getElementById("rsvp-msg")?.value.trim();

  const fb = (type, text) => {
    feedback.textContent = text;
    feedback.className = `feedback-msg show mt-3 ${type}`;
    setTimeout(() => {
      feedback.className = "feedback-msg mt-3 text-center text-sm font-bold";
    }, 5000);
  };

  if (!name || !attRaw || !msg) {
    return fb("error", "Silakan lengkapi semua isian.");
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Mengirim...';
  const attDb = mapAttToDb(attRaw);

  try {
    const res = await fetch(`${CONFIG.apiBase}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        order_id: CONFIG.ORDER_ID,
        guest_name: name,
        content: msg,
        attendance: attDb,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) throw new Error(json.message || "Gagal mengirim");

    fb("success", "Pesan dan konfirmasi terkirim.");
    document.getElementById("rsvp-form").reset();
    await reloadComments();
    const list = document.getElementById("comments-list");
    if (list) list.scrollTop = 0;
  } catch (err) {
    localPool.unshift({
      guest_name: name,
      attendance: attDb,
      content: msg,
      created_at: new Date().toISOString(),
    });
    renderComments();
    fb("success", "Pesan disimpan sementara.");
    document.getElementById("rsvp-form").reset();
    const list = document.getElementById("comments-list");
    if (list) list.scrollTop = 0;
  } finally {
    btn.disabled = false;
    btn.innerHTML = "Kirim Pesan";
  }
}

function initCopyButtons() {
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.onclick = () => {
      const text = btn.getAttribute("data-copy");
      if (!text) return;
      const original = btn.innerHTML;
      navigator.clipboard.writeText(text).then(() => {
        btn.innerHTML = '<i class="fas fa-check mr-1"></i> Tersalin!';
        btn.disabled = true;
        setTimeout(() => {
          btn.innerHTML = original;
          btn.disabled = false;
        }, 2000);
      });
    };
  });
}

function startCountdown(targetDate) {
  if (countdownTimer) clearInterval(countdownTimer);
  function update() {
    const diff = +targetDate - Date.now();
    if (diff <= 0) {
      const wrap = document.querySelector(".countdown-jp");
      if (wrap) wrap.innerHTML = '<div class="text-crimson" style="font-family:var(--ff-head);font-size:24px;font-weight:700;">Acara Telah Dimulai</div>';
      clearInterval(countdownTimer);
      return;
    }
    const pad = (n) => String(Math.floor(n)).padStart(2, "0");
    const el = (id) => document.getElementById(id);
    if (el("cd-days")) el("cd-days").textContent = pad(diff / 864e5);
    if (el("cd-hours")) el("cd-hours").textContent = pad((diff % 864e5) / 36e5);
    if (el("cd-mins")) el("cd-mins").textContent = pad((diff % 36e5) / 6e4);
    if (el("cd-secs")) el("cd-secs").textContent = pad((diff % 6e4) / 1e3);
  }
  update();
  countdownTimer = setInterval(update, 1000);
}

function toggleMusic() {
  const audio = document.getElementById("bg-music");
  const btn = document.getElementById("music-btn");
  if (!audio) return;
  if (isMusicPlaying) {
    audio.pause();
    btn?.classList.remove("spin");
    isMusicPlaying = false;
  } else {
    audio
      .play()
      .then(() => {
        btn?.classList.add("spin");
        isMusicPlaying = true;
      })
      .catch((err) => console.warn("Audio play gagal:", err));
  }
}

function createPetal() {
  const container = document.getElementById("sakura-container");
  if (!container) return;
  const p = document.createElement("div");
  p.classList.add("sakura-petal");
  p.style.left = Math.random() * 100 + "vw";
  p.style.animationDuration = Math.random() * 5 + 5 + "s";
  p.style.setProperty("--x-end", Math.random() * 200 - 100 + "px");
  p.style.setProperty("--rot-end", Math.random() * 360 + "deg");
  const size = Math.random() * 10 + 10;
  p.style.width = p.style.height = size + "px";
  container.appendChild(p);
  setTimeout(() => p.remove(), 10000);
}

function onScroll() {
  const st = window.scrollY;
  let current = "";
  const sections = ["opening", "couple", "story", "event", "gallery", "live-section", "rsvp", "amplop"];
  sections.forEach((id) => {
    const sec = document.getElementById(id);
    if (sec && sec.style.display !== "none" && st >= sec.offsetTop - 300) current = id;
  });
  document.querySelectorAll(".nav-btn-jp").forEach((item) => {
    item.classList.toggle("active", item.getAttribute("href") === "#" + current);
  });
}

function runLoading() {
  setTimeout(() => {
    const screen = document.getElementById("loading-screen");
    if (!screen) return;
    screen.style.transition = "opacity 0.8s ease";
    screen.style.opacity = "0";
    setTimeout(() => {
      screen.style.display = "none";
    }, 800);
  }, 1500);
}

function handleOpen() {
  const cover = document.getElementById("cover");
  const main = document.getElementById("main-content");
  if (!cover || !main) return;

  cover.style.transition = "opacity 1s ease";
  cover.style.opacity = "0";

  setTimeout(() => {
    cover.style.display = "none";
    main.style.display = "block";

    if (typeof AOS !== "undefined") AOS.init({ duration: 1000, once: true, offset: 50 });
    if (typeof lightbox !== "undefined") lightbox.option({ resizeDuration: 200, wrapAround: true, albumLabel: "Foto %1 dari %2" });

    setInterval(createPetal, 400);

    const audio = document.getElementById("bg-music");
    if (audio && audio.src && DATA.music?.autoplay) {
      audio.volume = 0.5;
      audio
        .play()
        .then(() => {
          document.getElementById("music-btn")?.classList.add("spin");
          isMusicPlaying = true;
        })
        .catch((err) => console.warn("Autoplay ditolak browser:", err));
    } else if (audio && audio.src) {
      audio.volume = 0.5;
    }

    window.scrollTo({ top: 0, behavior: "instant" });
  }, 1000);
}

document.addEventListener("DOMContentLoaded", async () => {
  const gEl = document.getElementById("guest-name");
  const params = new URLSearchParams(window.location.search);
  const guest = params.get("kepada") || params.get("to") || params.get("u") || params.get("guest");
  if (gEl && guest?.trim()) {
    gEl.textContent = decodeURIComponent(guest.trim());
  }

  runLoading();

  try {
    await fetchAllData();
    renderAll();
  } catch (err) {
    console.error("Gagal muat API:", err.message);
    renderStories();
    renderComments();
  }

  document.getElementById("open-btn")?.addEventListener("click", handleOpen);
  document.getElementById("rsvp-form")?.addEventListener("submit", handleSubmit);
  document.getElementById("music-btn")?.addEventListener("click", toggleMusic);

  window.addEventListener("scroll", onScroll, { passive: true });

  document.querySelectorAll(".nav-btn-jp").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = document.querySelector(link.getAttribute("href"));
      if (target) window.scrollTo({ top: target.offsetTop, behavior: "smooth" });
    });
  });

  initCopyButtons();
});
