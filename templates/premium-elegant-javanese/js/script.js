"use strict";

window.CONFIG = window.CONFIG || {
  apiBase: "https://invitation.permatawedding.com/api/API",
  ORDER_ID: "",
};
var CONFIG = window.CONFIG;

// DUMMY_COMMENTS tetap — fallback kalau API gagal
function getDummyCoupleName() {
  const g = document.getElementById("name-groom")?.textContent?.trim() ||
            document.getElementById("cover-groom")?.textContent?.trim() || "";
  const b = document.getElementById("name-bride")?.textContent?.trim() ||
            document.getElementById("cover-bride")?.textContent?.trim() || "";
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

function prefersDataSaver() {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  const slowConn = !!(conn && (conn.saveData || /^(slow-2g|2g|3g)$/i.test(conn.effectiveType || "")));
  return slowConn || (window.innerWidth <= 480 && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
}

// ── Render comment card — pakai DATA.comments dari api.js ──
function renderComments() {
  const container = document.getElementById("comments-list");
  if (!container) return;
  const apiComments = (window.DATA?.comments || []).map((cm) => ({
    name: cm.guest_name || cm.name || "Tamu",
    attendance: cm.attendance || "",
    greeting: cm.content || cm.greeting || "",
  }));
  const ls = JSON.parse(localStorage.getItem(LS_KEY) || "null");
  const local = ls && ls.length ? ls : [];
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
    <div class="comment-card" data-aos="fade-up">
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

function refreshAOS() {
  if (typeof AOS !== "undefined") AOS.refreshHard();
}
let aosRefreshTimer = null;
function debouncedRefreshAOS() {
  clearTimeout(aosRefreshTimer);
  aosRefreshTimer = setTimeout(refreshAOS, 150);
}

function setupAOSRefreshOnAssetsLoaded() {
  const main = document.getElementById("main-content");
  if (main)
    main.querySelectorAll("img").forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", debouncedRefreshAOS, { once: true });
      img.addEventListener("error", debouncedRefreshAOS, { once: true });
    });
  window.addEventListener("load", () => refreshAOS(), { once: true });
  if (document.fonts?.ready) document.fonts.ready.then(() => refreshAOS());
}

function showFeedback(el, type, msg) {
  if (!el) return;
  el.className = "rsvp-feedback " + (type === "success" ? "success" : "error");
  el.textContent = msg;
  el.style.display = "block";
  setTimeout(() => {
    el.style.display = "none";
  }, 4000);
}

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

function updateNavActive() {
  let current = "";
  document.querySelectorAll(".section").forEach((s) => {
    if (window.scrollY >= s.offsetTop - 200) current = s.id;
  });
  document.querySelectorAll(".nav-item").forEach((n) => n.classList.toggle("active", n.getAttribute("data-section") === current));
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

function toggleMusic() {
  const audio = document.getElementById("bg-music");
  const btn = document.getElementById("music-btn");
  const icon = document.getElementById("music-icon");
  if (!audio || !btn) return;
  if (isMusicPlaying) {
    audio.pause();
    isMusicPlaying = false;
    btn.classList.remove("playing");
    if (icon) icon.className = "fas fa-music";
  } else
    audio
      .play()
      .then(() => {
        isMusicPlaying = true;
        btn.classList.add("playing");
        if (icon) icon.className = "fas fa-pause";
      })
      .catch(() => {});
}

function smoothScrollTo(target) {
  const el = document.querySelector(target);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setupCopyButtons() {
  document.querySelectorAll(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const text = btn.getAttribute("data-copy");
      if (!text) return;
      const orig = btn.innerHTML;
      navigator.clipboard
        .writeText(text)
        .then(() => {
          btn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
          btn.style.background = "linear-gradient(135deg,#4caf50,#388e3c)";
          btn.style.color = "#fff";
          setTimeout(() => {
            btn.innerHTML = orig;
            btn.style.background = "";
            btn.style.color = "";
          }, 2000);
        })
        .catch(() => {
          const ta = document.createElement("textarea");
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand("copy");
          document.body.removeChild(ta);
          const orig2 = btn.innerHTML;
          btn.innerHTML = '<i class="fas fa-check"></i> Tersalin!';
          setTimeout(() => {
            btn.innerHTML = orig2;
          }, 2000);
        });
    });
  });
}

const COVER_FALLBACK_SECONDS = 15;
const COVER_FAST_PATH_SECONDS = 1.2;

function handleOpenInvitation() {
  const opener = document.getElementById("opener");
  const cover = document.getElementById("cover");
  const main = document.getElementById("main-content");
  const btn = document.getElementById("open-btn");
  const bgVideo = document.getElementById("bg-video");
  if (!opener || !cover || !main || !btn) return;

  btn.addEventListener("click", () => {
    const skipVideo = prefersDataSaver();
    const audio = document.getElementById("bg-music");
    if (audio) {
      audio.volume = 0;
      audio
        .play()
        .then(() => {
          isMusicPlaying = true;
          const mb = document.getElementById("music-btn");
          const ic = document.getElementById("music-icon");
          if (mb) mb.classList.add("playing");
          if (ic) ic.className = "fas fa-pause";
          const fadeIn = setInterval(() => {
            if (audio.volume < 0.95) audio.volume = Math.min(1, audio.volume + 0.05);
            else {
              audio.volume = 1;
              clearInterval(fadeIn);
            }
          }, 100);
        })
        .catch(() => {});
    }

    opener.style.transition = "opacity .8s ease";
    opener.style.opacity = "0";
    setTimeout(() => {
      opener.style.display = "none";
      let coverShown = false;
      function revealCover() {
        if (coverShown) return;
        coverShown = true;
        if (bgVideo) bgVideo.pause();
        document.body.style.overflow = "";
        main.classList.add("show");
        cover.style.display = "flex";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            cover.style.opacity = "1";
            if (typeof AOS !== "undefined") {
              AOS.init({ duration: 1500, once: true, offset: 60 });
              setupAOSRefreshOnAssetsLoaded();
            }
            renderComments();
          });
        });
      }
      if (skipVideo || !bgVideo) {
        setTimeout(revealCover, COVER_FAST_PATH_SECONDS * 1000);
      } else {
        bgVideo.style.display = "block";
        bgVideo.currentTime = 0;
        bgVideo.play().catch(() => revealCover());
        bgVideo.addEventListener("ended", revealCover, { once: true });
        setTimeout(revealCover, COVER_FALLBACK_SECONDS * 1000);
      }
    }, 800);
  });

  const scrollDownEl = cover.querySelector(".cover-scroll-down");
  if (scrollDownEl) {
    scrollDownEl.style.cursor = "pointer";
    scrollDownEl.addEventListener("click", () => {
      const t = document.getElementById("mempelai");
      if (t) t.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }
}

function createBatikParticles() {
  if (window.innerWidth <= 480) return;
  const symbols = ["*", "+", "x", "o", "#"];
  for (let i = 0; i < 8; i++) {
    const p = document.createElement("div");
    p.className = "wayang-particle";
    p.textContent = symbols[i % symbols.length];
    p.style.left = Math.random() * 100 + "%";
    p.style.fontSize = 12 + Math.random() * 16 + "px";
    p.style.animationDuration = 15 + Math.random() * 20 + "s";
    p.style.animationDelay = Math.random() * 10 + "s";
    p.style.color = "var(--java-gold)";
    document.body.appendChild(p);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const guestEl = document.getElementById("guest-name");
  if (guestEl) {
    const toParam = getUrlParam("kepada");
    if (toParam) {
      const textNode = [...guestEl.childNodes].find((n) => n.nodeType === Node.TEXT_NODE);
      if (textNode) textNode.textContent = " " + decodeURIComponent(toParam);
      else guestEl.appendChild(document.createTextNode(" " + decodeURIComponent(toParam)));
    }
  }

  document.body.style.overflow = "hidden";
  handleOpenInvitation();

  document.getElementById("music-btn")?.addEventListener("click", toggleMusic);
  document.getElementById("back-to-top")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));

  setupCopyButtons();

  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      const href = item.getAttribute("href");
      if (href?.startsWith("#")) {
        e.preventDefault();
        smoothScrollTo(href);
      }
    });
  });

  // RSVP pakai handleApiRsvpSubmit dari api.js
  document.getElementById("rsvp-form")?.addEventListener("submit", handleApiRsvpSubmit);

  window.addEventListener("scroll", onScroll, { passive: true });

  if (typeof lightbox !== "undefined") lightbox.option({ resizeDuration: 300, wrapAround: true, albumLabel: "Foto %1 dari %2" });
  createBatikParticles();
});

// ─── COUNTDOWN ───────────────────────────────────────────────────
let _countdownTimer = null;

function startCountdown(targetDate) {
  if (_countdownTimer) clearInterval(_countdownTimer);

  function update() {
    const diff = +targetDate - Date.now();
    if (diff <= 0) {
      const wrap = document.getElementById("countdown");
      if (wrap) wrap.innerHTML = "<p style='font-family:var(--font-heading);color:#fff;font-size:1.2rem;'>Alhamdulillah, Acara Telah Berlangsung</p>";
      clearInterval(_countdownTimer);
      return;
    }
    const pad = (n) => String(Math.floor(n)).padStart(2, "0");
    const el = (id) => document.getElementById(id);
    if (el("count-days")) el("count-days").textContent = pad(diff / 864e5);
    if (el("count-hours")) el("count-hours").textContent = pad((diff % 864e5) / 36e5);
    if (el("count-mins")) el("count-mins").textContent = pad((diff % 36e5) / 6e4);
    if (el("count-secs")) el("count-secs").textContent = pad((diff % 6e4) / 1e3);
  }

  update();
  _countdownTimer = setInterval(update, 1000);
}

document.getElementById("current-year").textContent = new Date().getFullYear();
