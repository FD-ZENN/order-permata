"use strict";

// CONFIG didefinisikan di index.html (sebelum api.js). Ini hanya fallback.
window.CONFIG = window.CONFIG || {
  apiBase: "https://invitation.permatawedding.com/api/API",
  ORDER_ID: "",
};

// DUMMY_COMMENTS — fallback kalau API gagal / belum ada komentar
function getDummyCoupleName() {
  const g = document.querySelector('[data-key="cover-groom"]')?.textContent?.trim() ||
            document.getElementById("cover-groom")?.textContent?.trim() ||
            document.getElementById("name-groom")?.textContent?.trim() || "";
  const b = document.querySelector('[data-key="cover-bride"]')?.textContent?.trim() ||
            document.getElementById("cover-bride")?.textContent?.trim() ||
            document.getElementById("name-bride")?.textContent?.trim() || "";
  if (g && b) return `${g} & ${b}`;
  if (g || b) return g || b;
  return "Mempelai";
}

const DUMMY_COMMENTS = [
  {
    name: "Keluarga & Sahabat",
    attendance: "Hadir",
    get greeting() {
      return `Selamat Menempuh Hidup Baru Kak ${getDummyCoupleName()} semoga menjadi keluarga sakinah, mawaddah, dan warrahmah.`;
    }
  }
];

const LS_KEY = "wedding_comments_local_116";
window.LS_KEY = LS_KEY; // dipakai fallback RSVP di api.js
let isMusicPlaying = false;

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function attendanceClass(a) {
  if (!a) return "badge-belum";
  const l = a.toLowerCase();
  if (l.includes("hadir") && !l.includes("tidak")) return "badge-hadir";
  if (l.includes("tidak")) return "badge-tidak";
  return "badge-belum";
}

function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
}

// ── Render komentar — pakai DATA.comments dari api.js ──
function renderComments() {
  const container = document.getElementById("comments-list");
  if (!container) return;
  const apiComments = (window.DATA?.comments || []).map((cm) => ({
    name: cm.guest_name || cm.name || "Tamu",
    attendance: cm.attendance || "",
    greeting: cm.content || cm.greeting || "",
  }));
  let local = [];
  try {
    const ls = JSON.parse(localStorage.getItem(LS_KEY) || "null");
    local = ls && ls.length ? ls : [];
  } catch (_) {}
  const all = [...local, ...apiComments];
  const toRender = all.length ? all : DUMMY_COMMENTS;
  container.innerHTML = toRender.map(renderCommentCard).join("");
  refreshAOS();
}

function formatAttendance(value) {
  const status = {
    hadir: "Hadir",
    tidak_hadir: "Tidak Hadir",
    ragu_ragu: "Belum Pasti"
  };

  return status[(value || "").toLowerCase()] || "Belum Pasti";
}

function renderCommentCard(data) {
  return `
    <div class="comment-card">
      <div class="comment-avatar">${getInitials(data.name)}</div>
      <div class="comment-body">
        <p class="comment-name">
          ${escapeHtml(data.name)}
          <span class="comment-badge ${attendanceClass(data.attendance)}">${escapeHtml(formatAttendance(data.attendance))}</span>
        </p>
        <p class="comment-text">${escapeHtml(data.greeting)}</p>
      </div>
    </div>`;
}

// ── Render galeri dari DATA.galleries (api.js hanya mengambil datanya) ──
function renderGallery() {
  const wrapper = document.querySelector(".mySwiper .swiper-wrapper");
  const items = window.DATA?.galleries || [];
  if (!wrapper || !items.length) return; // placeholder HTML tetap tampil
  wrapper.innerHTML = items.map((g, i) => `<div class="swiper-slide"><img src="${escapeHtml(photoUrl(g.photo_url))}" alt="Gallery image ${i + 1}" loading="lazy" /></div>`).join("");
  if (swiper) swiper.update();
}

// ─── AOS ─────────────────────────────────────────────────────────
function initAOS() {
  if (typeof AOS === "undefined") return;
  AOS.init({
    disable: "mobile", // Nonaktif di mobile untuk performa
    once: true,
    duration: 800,
  });
}

function refreshAOS() {
  if (typeof AOS !== "undefined") AOS.refreshHard();
}

// ─── SWIPER ──────────────────────────────────────────────────────
let swiper = null;
function initSwiper() {
  if (typeof Swiper === "undefined" || !document.querySelector(".mySwiper")) return;
  swiper = new Swiper(".mySwiper", {
    slidesPerView: 1.2,
    spaceBetween: 10,
    centeredSlides: true,
    pagination: {
      el: ".swiper-pagination",
      clickable: true,
    },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 20 },
      768: { slidesPerView: 3, spaceBetween: 30 },
    },
  });
}

// ─── KUNCI SCROLL COVER ──────────────────────────────────────────
function setScrollLocked(locked) {
  document.documentElement.style.overflow = locked ? "hidden" : "";
  document.body.style.overflow = locked ? "hidden" : "";
  document.body.style.touchAction = locked ? "none" : "";
}

// ─── SCROLL / NAV ────────────────────────────────────────────────
function updateScrollProgress() {
  const bar = document.getElementById("scroll-progress");
  if (!bar) return;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0) + "%";
}

function handleScrollBtns() {
  const btn = document.getElementById("back-to-top");
  if (btn) btn.classList.toggle("visible", window.scrollY > 500);
}

// Nav aktif saat scroll: <section id> ↔ .nav-link[href="#id"]
function updateNavActive() {
  let current = "";
  document.querySelectorAll("section[id]").forEach((section) => {
    if (window.scrollY >= section.offsetTop - 150) current = section.getAttribute("id");
  });
  document.querySelectorAll(".nav-link").forEach((link) => {
    const href = link.getAttribute("href") || "";
    link.classList.toggle("active", href.startsWith("#") && href.substring(1) === current);
  });
}

let scrollTicking = false;
function onScroll() {
  if (scrollTicking) return;
  scrollTicking = true;
  requestAnimationFrame(() => {
    updateScrollProgress();
    handleScrollBtns();
    updateNavActive();
    scrollTicking = false;
  });
}

function smoothScrollTo(target) {
  const el = document.querySelector(target);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ─── MUSIK ───────────────────────────────────────────────────────
function setMusicUI(playing) {
  const btn = document.getElementById("music-btn");
  const icon = document.getElementById("music-icon");
  isMusicPlaying = playing;
  if (btn) btn.classList.toggle("playing", playing);
  if (icon) icon.className = playing ? "fas fa-pause" : "fas fa-music";
}

function playMusic() {
  const audio = document.getElementById("bg-music");
  if (!audio || !audio.getAttribute("src")) return;
  audio
    .play()
    .then(() => setMusicUI(true))
    .catch(() => {});
}

function toggleMusic() {
  const audio = document.getElementById("bg-music");
  if (!audio) return;
  if (isMusicPlaying) {
    audio.pause();
    setMusicUI(false);
  } else playMusic();
}

// ─── COPY ────────────────────────────────────────────────────────
function copyToClipboard(text) {
  if (!text) return Promise.resolve(false);
  const fallback = () => {
    const ta = document.createElement("textarea");
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  };
  if (navigator.clipboard?.writeText)
    return navigator.clipboard
      .writeText(text)
      .then(() => true)
      .catch(fallback);
  return Promise.resolve(fallback());
}
window.copyToClipboard = copyToClipboard;

// Tombol .btn-copy: nilai diambil dari data-copy saat diklik (data-copy diisi api.js)
function setupCopyButtons() {
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const text = btn.getAttribute("data-copy");
      if (!text) return;
      const orig = btn.innerHTML;
      await copyToClipboard(text);
      btn.innerHTML = '<i class="fas fa-check me-2"></i>Tersalin!';
      setTimeout(() => {
        btn.innerHTML = orig;
      }, 2000);
    });
  });
}

// ─── INIT ────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // Nama tamu dari ?kepada=
  const guestEl = document.getElementById("guest-name");
  const toParam = getUrlParam("kepada");
  if (guestEl && toParam) guestEl.textContent = toParam;

  initAOS();
  initSwiper();

  // Cover terkunci (tidak bisa di-scroll) sampai "Buka Undangan" diklik
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  setScrollLocked(true);
  document.querySelector(".bottom-navbar").style.display = "none";

  document.querySelector(".btn-invite")?.addEventListener("click", (e) => {
    e.preventDefault();
    setScrollLocked(false);
    document.querySelector(".bottom-navbar").style.display = "";
    playMusic();
    refreshAOS();
    smoothScrollTo("#couple");
  });

  document.getElementById("music-btn")?.addEventListener("click", toggleMusic);
  document.getElementById("back-to-top")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  setupCopyButtons();

  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href?.startsWith("#") && href.length > 1) {
        e.preventDefault();
        smoothScrollTo(href);
      }
    });
  });

  // RSVP dihandle api.js
  if (typeof handleApiRsvpSubmit === "function") document.getElementById("rsvp-form")?.addEventListener("submit", handleApiRsvpSubmit);

  if (typeof lightbox !== "undefined") lightbox.option({ resizeDuration: 300, wrapAround: true, albumLabel: "Foto %1 dari %2" });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Tampilan awal komentar (sebelum API selesai)
  renderComments();

  // Setelah api.js selesai render (renderMeta adalah langkah terakhirnya),
  // render juga galeri & komentar dari DATA.
  // Countdown HANYA memakai tanggal dari API (tidak ada tanggal hardcode yang bisa menimpa).
  if (typeof window.renderMeta === "function") {
    const origRenderMeta = window.renderMeta;
    window.renderMeta = function () {
      origRenderMeta.apply(this, arguments);
      renderGallery();
      renderComments();
      const ev = window.DATA?.events || [];
      const dt = (ev[1] || ev[0])?.event_datetime;
      if (dt) startCountdown(new Date(dt));
      refreshAOS();
    };
  }

  const yearEl = document.getElementById("current-year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

// ─── COUNTDOWN (id: days, hours, minutes, seconds) ───────────────
let _countdownTimer = null;

function startCountdown(targetDate) {
  const target = new Date(targetDate);
  if (!targetDate || isNaN(target)) return; // abaikan tanggal kosong/tidak valid
  if (_countdownTimer) clearInterval(_countdownTimer);

  const pad = (n) => String(Math.floor(n)).padStart(2, "0");
  const setText = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  function update() {
    const diff = +target - Date.now();
    if (diff <= 0) {
      ["days", "hours", "minutes", "seconds"].forEach((id) => setText(id, "00"));
      const wrap = document.getElementById("countdown");
      if (wrap) wrap.innerHTML = "<p style='color:#fff;font-size:1.2rem;'>Alhamdulillah, Acara Telah Berlangsung</p>";
      clearInterval(_countdownTimer);
      return;
    }
    setText("days", pad(diff / 864e5));
    setText("hours", pad((diff % 864e5) / 36e5));
    setText("minutes", pad((diff % 36e5) / 6e4));
    setText("seconds", pad((diff % 6e4) / 1e3));
  }

  update();
  _countdownTimer = setInterval(update, 1000);
}
