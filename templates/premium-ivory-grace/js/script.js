"use strict";

window.CONFIG = window.CONFIG || {
  weddingDate: "2026-12-31T08:00:00+07:00",
  apiBase: "https://invitation.permatawedding.com/api/API",
  ORDER_ID: "",
};

let isMusicPlaying = false;
let countdownTimer = null;

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function escapeHtml(s) {
  const d = document.createElement("div");
  d.appendChild(document.createTextNode(s || ""));
  return d.innerHTML;
}

// ─── COUNTDOWN TIMER ─────────────────────────────────────────────
function startCountdown(targetDate) {
  if (countdownTimer) clearInterval(countdownTimer);

  const target = targetDate instanceof Date ? targetDate.getTime() : new Date(targetDate || CONFIG.weddingDate).getTime();

  function update() {
    const diff = target - Date.now();
    if (diff <= 0) {
      document.querySelectorAll(".countdown-hero").forEach((el) => {
        el.innerHTML = '<p class="font-cormorant fw-bold text-white px-4 py-8 text-center text-shadow" style="font-size:22px">Acara Telah Berlangsung</p>';
      });
      clearInterval(countdownTimer);
      return;
    }

    const pad = (n) => String(Math.floor(n)).padStart(2, "0");
    const days = pad(diff / 864e5);
    const hours = pad((diff % 864e5) / 36e5);
    const mins = pad((diff % 36e5) / 6e4);
    const secs = pad((diff % 6e4) / 1e3);

    document.querySelectorAll("#count-days").forEach((el) => (el.textContent = days));
    document.querySelectorAll("#count-hours").forEach((el) => (el.textContent = hours));
    document.querySelectorAll("#count-mins").forEach((el) => (el.textContent = mins));
    document.querySelectorAll("#count-secs").forEach((el) => (el.textContent = secs));
  }

  update();
  countdownTimer = setInterval(update, 1000);
}

// ─── AUDIO TOGGLE ────────────────────────────────────────────────
function toggleMusic() {
  const audio = document.getElementById("bg-music");
  const btn = document.getElementById("music-btn") || document.getElementById("music-toggle");
  if (!audio || !btn) return;

  if (isMusicPlaying) {
    audio.pause();
    isMusicPlaying = false;
    btn.innerHTML = '<i class="fas fa-play"></i>';
    btn.classList.remove("playing");
  } else {
    audio
      .play()
      .then(() => {
        isMusicPlaying = true;
        btn.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i>';
        btn.classList.add("playing");
      })
      .catch(() => { });
  }
}

// ─── COPY TO CLIPBOARD BUTTONS ───────────────────────────────────
function setupCopyButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-copy");
    if (!btn) return;
    const text = btn.getAttribute("data-copy");
    if (!text) return;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Tersalin';
        setTimeout(() => {
          btn.innerHTML = orig;
        }, 2000);
      })
      .catch(() => {
        // Fallback prompt jika clipboard API diblokir
        window.prompt("Salin nomor rekening:", text);
      });
  });
}

// ─── OPEN INVITATION ─────────────────────────────────────────────
function handleOpenInvitation() {
  const cover = document.getElementById("cover");
  const main = document.getElementById("main-content");
  const heroVid = document.getElementById("hero-video");
  const heroCard = document.getElementById("hero-card-wrapper");

  if (!cover || !main) return;

  cover.style.transition = "opacity 0.8s ease";
  cover.style.opacity = "0";

  setTimeout(() => {
    cover.style.display = "none";
    main.style.display = "block";

    // Putar video hero jika tersedia
    if (heroVid) {
      heroVid.play().catch((e) => console.log("Autoplay video info:", e.message));
      heroVid.addEventListener("ended", () => {
        heroVid.pause();
      });
      setTimeout(() => {
        if (heroCard) heroCard.style.opacity = "1";
      }, 3000);
    } else {
      if (heroCard) heroCard.style.opacity = "1";
    }

    // Inisialisasi AOS setelah main content dibuka
    if (typeof AOS !== "undefined") {
      AOS.init({ duration: 1000, easing: "ease-in-out", once: true, offset: 50 });
      AOS.refresh();
    }

    // Animasi komponen
    setTimeout(() => {
      document.querySelectorAll(".animate-up, .animate-zoom").forEach((el) => el.classList.add("show"));
    }, 100);

    // Putar lagu latar
    const audio = document.getElementById("bg-music");
    const mbtn = document.getElementById("music-btn") || document.getElementById("music-toggle");
    if (audio) {
      audio.volume = 0.6;
      audio
        .play()
        .then(() => {
          isMusicPlaying = true;
          if (mbtn) {
            mbtn.style.display = "flex";
            mbtn.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i>';
            mbtn.classList.add("playing");
          }
        })
        .catch(() => {
          if (mbtn) mbtn.style.display = "flex";
        });
    }

    document.body.style.overflow = "auto";
    document.body.style.position = "relative";
    window.scrollTo({ top: 0, behavior: "instant" });
  }, 800);
}

// ─── DOM INITIALIZATION ──────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  // 1. Ekstrak nama tamu dari parameter URL (?to=... atau ?u=...)
  const guestEl = document.getElementById("guest-name");
  if (guestEl) {
    const toParam = getUrlParam("to") || getUrlParam("kepada");
    if (toParam) {
      guestEl.textContent = decodeURIComponent(toParam.trim().replace(/\+/g, " "));
    }
  }

  // 2. Transisi loading screen
  setTimeout(() => {
    const ls = document.getElementById("loading-screen");
    if (ls) ls.classList.add("hidden");
  }, 1000);

  // 3. Animasi cover
  setTimeout(() => {
    document.querySelectorAll(".section-cover .animate-up, .section-cover .animate-zoom").forEach((el) => el.classList.add("show"));
    document.querySelectorAll(".col-left .animate-up, .col-left .animate-zoom").forEach((el) => el.classList.add("show"));
  }, 300);

  // 4. Tombol buka undangan
  const openBtn = document.getElementById("btn-buka") || document.getElementById("open-btn");
  if (openBtn) openBtn.addEventListener("click", handleOpenInvitation);

  // 5. Setup clipboard
  setupCopyButtons();

  // 6. Tombol musik
  const musicBtn = document.getElementById("music-btn") || document.getElementById("music-toggle");
  if (musicBtn) musicBtn.addEventListener("click", toggleMusic);

  // 7. Inisialisasi countdown default
  startCountdown(CONFIG.weddingDate);
});
