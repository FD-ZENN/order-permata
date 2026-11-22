"use strict";

window.CONFIG = window.CONFIG || {
  apiBase: window.location.origin + "/api",
  ORDER_ID: "",
};
var CONFIG = window.CONFIG;

let isPlaying = false;
let audio = null;
let audioButton = null;
let audioIcon = null;

function escapeHtml(str) {
  const d = document.createElement("div");
  d.textContent = str;
  return d.innerHTML;
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

function showToast(msg) {
  const toast = document.getElementById("toast");
  if (!toast) return;
  toast.textContent = msg || "Berhasil disalin!";
  toast.style.display = "block";
  setTimeout(() => {
    toast.style.display = "none";
  }, 2000);
}

// ─── RENDER KOMENTAR ──────────────────────────────────────────────
function renderComments() {
  const listContainer = document.getElementById("rsvp-list");
  if (!listContainer) return;

  const comments = window.DATA?.comments || [];
  if (!comments.length) {
    listContainer.innerHTML = '<div class="text-center text-muted py-3">Belum ada ucapan. Jadilah yang pertama memberikan doa restu!</div>';
    return;
  }

  listContainer.innerHTML = comments
    .map((c) => {
      const name = escapeHtml(c.guest_name || c.name || "Tamu Undangan");
      const status = escapeHtml(c.attendance || "Hadir");
      const message = escapeHtml(c.content || c.greeting || "");
      const date = c.created_at ? new Date(c.created_at).toLocaleDateString("id-ID") : "Baru saja";

      return `
        <div class="col-12 mb-3">
          <div class="comment-card">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <h5 style="font-size: 1rem; margin: 0; font-weight: bold;">${name}</h5>
              <span class="badge bg-secondary" style="font-size: 0.75rem;">${status}</span>
            </div>
            <p class="mb-2" style="font-size: 0.9rem; color: #333;">${message}</p>
            <small class="text-muted" style="font-size: 0.75rem;">${date}</small>
          </div>
        </div>
      `;
    })
    .join("");
}

// ─── INIT UI & EVENT LISTENERS ────────────────────────────────────
document.addEventListener("DOMContentLoaded", function () {
  // AOS
  if (typeof AOS !== "undefined") {
    AOS.init({
      offset: -900,
      duration: 800,
      easing: "ease-in-out",
      once: true,
    });
  }

  // Nama Tamu dari parameter URL
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get("to") || urlParams.get("kepada") || urlParams.get("guest") || "Tamu Undangan";
  const guestEl = document.getElementById("guest-name");
  if (guestEl) guestEl.innerText = guestName;

  // Audio setup
  audio = document.getElementById("bg-music");
  audioButton = document.getElementById("audioButton");
  audioIcon = document.getElementById("audioIcon");

  if (audioButton && audio) {
    audioButton.addEventListener("click", function () {
      if (isPlaying) {
        audio.pause();
        if (audioIcon) audioIcon.className = "fa fa-volume-mute";
      } else {
        audio.play().catch((e) => console.log("Audio play error:", e));
        if (audioIcon) audioIcon.className = "fa fa-volume-up";
      }
      isPlaying = !isPlaying;
    });
  }

  // Buka Undangan
  const btnBuka = document.getElementById("bukaUndangan");
  if (btnBuka) {
    btnBuka.addEventListener("click", function () {
      const coverSection = document.getElementById("cover");
      const bottomNavbar = document.getElementById("bottom-navbar");
      if (bottomNavbar) bottomNavbar.style.display = "block";

      // Putar musik otomatis saat buka undangan
      if (audio && !isPlaying) {
        audio.play().catch((e) => console.log("Audio play prevented:", e));
        if (audioIcon) audioIcon.className = "fa fa-volume-up";
        isPlaying = true;
      }

      // Animasi transisi cover
      if (coverSection) {
        coverSection.style.transition = "opacity 0.8s ease";
        coverSection.style.opacity = "0";
        document.body.classList.remove("no-scroll");

        setTimeout(() => {
          coverSection.style.display = "none";
          const homeSec = document.getElementById("home");
          if (homeSec) homeSec.scrollIntoView({ behavior: "smooth" });
        }, 800);
      }
    });
  }

  // Countdown timer
  initCountdown();

  // Salin rekening (Event delegation untuk seluruh tombol data-key="wallet-*-copy")
  document.addEventListener("click", function (e) {
    const copyBtn = e.target.closest('[data-key^="wallet-"][data-key$="-copy"], #copy-account');
    if (copyBtn) {
      e.preventDefault();
      const num = copyBtn.getAttribute("data-copy") || document.getElementById("account-number")?.innerText || "";
      if (num) {
        navigator.clipboard.writeText(num.trim()).then(() => {
          showToast("Nomor rekening berhasil disalin!");
        }).catch(() => {
          showToast("Gagal menyalin otomatis.");
        });
      }
    }
  });

  // Handle Form RSVP Submission ke REST API
  const rsvpForm = document.getElementById("rsvp-form") || document.getElementById("rsvpForm");
  if (rsvpForm) {
    rsvpForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      const submitBtn = document.getElementById("rsvp-submit") || rsvpForm.querySelector('button[type="submit"]');
      const nameInput = document.getElementById("rsvp-name") || document.getElementById("name");
      const attendanceInput = document.getElementById("rsvp-attendance") || document.getElementById("kehadiran");
      const greetingInput = document.getElementById("rsvp-greeting") || document.getElementById("komentar");

      const name = (nameInput?.value || "").trim();
      const attendance = (attendanceInput?.value || "").trim();
      const content = (greetingInput?.value || "").trim();

      if (!name || !attendance || !content) {
        if (typeof Swal !== "undefined") {
          Swal.fire({ icon: "warning", title: "Perhatian", text: "Mohon lengkapi semua data ucapan & kehadiran." });
        } else {
          alert("Mohon lengkapi semua data ucapan & kehadiran.");
        }
        return;
      }

      const origText = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i> Mengirim...';
      }

      try {
        await postComment({ name, guest_name: name, attendance, content, greeting: content });
        if (typeof Swal !== "undefined") {
          Swal.fire({ icon: "success", title: "Berhasil!", text: "RSVP dan ucapan Anda telah tersimpan." });
        } else {
          showToast("RSVP dan ucapan Anda terkirim!");
        }
        rsvpForm.reset();
        await reloadComments();
      } catch (err) {
        console.error("Gagal mengirim RSVP:", err);
        if (typeof Swal !== "undefined") {
          Swal.fire({ icon: "error", title: "Oops...", text: "Terjadi kendala saat mengirim ucapan. Silakan coba lagi." });
        } else {
          alert("Gagal mengirim ucapan.");
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = origText;
        }
      }
    });
  }

  // Inisialisasi komentar awal jika ada
  renderComments();
});

// ─── COUNTDOWN TIMER ──────────────────────────────────────────────
function initCountdown() {
  const countdownContainer = document.querySelector(".countdown-container");
  if (!countdownContainer) return;

  function update() {
    const rawTarget = countdownContainer.getAttribute("data-count") || countdownContainer.getAttribute("data-target") || "";
    if (!rawTarget) return;

    // Normalisasi format tanggal yyyy/mm/dd atau ISO
    const weddingDate = new Date(rawTarget).getTime();
    const now = Date.now();
    const distance = weddingDate - now;

    const daysEl = document.getElementById("countdown-days");
    const hoursEl = document.getElementById("countdown-hours");
    const minutesEl = document.getElementById("countdown-minutes");
    const secondsEl = document.getElementById("countdown-seconds");

    if (distance < 0) {
      if (daysEl) daysEl.innerText = "00";
      if (hoursEl) hoursEl.innerText = "00";
      if (minutesEl) minutesEl.innerText = "00";
      if (secondsEl) secondsEl.innerText = "00";
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    if (daysEl) daysEl.innerText = days.toString().padStart(2, "0");
    if (hoursEl) hoursEl.innerText = hours.toString().padStart(2, "0");
    if (minutesEl) minutesEl.innerText = minutes.toString().padStart(2, "0");
    if (secondsEl) secondsEl.innerText = seconds.toString().padStart(2, "0");
  }

  setInterval(update, 1000);
  update();
}
