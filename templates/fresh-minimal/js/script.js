// js/script.js - fresh-minimal interactive & UI behaviors
"use strict";

document.addEventListener("DOMContentLoaded", function () {
  // 1. Inisialisasi AOS & LightGallery jika library tersedia
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 1000, once: true });
  }

  const galleryEl = document.getElementById("row-lightgallery");
  if (galleryEl && typeof lightGallery !== "undefined") {
    try {
      lightGallery(galleryEl, {
        mode: "lg-fade",
        cssEasing: "ease-in",
        speed: 1000,
        selector: "[data-src]",
        download: false,
      });
    } catch (e) {
      console.warn("lightGallery init skipped:", e);
    }
  }

  // 2. Music & Buka Undangan Handling
  const btnOpen = document.getElementById("btn-open-opening");
  const btnPlay = document.getElementById("btn-play");
  const audio = document.getElementById("bg-music") || document.getElementById("audio");

  if (btnOpen) {
    btnOpen.addEventListener("click", function () {
      document.body.classList.remove("opening-show");
      document.body.classList.add("opening-hide");
      setTimeout(() => {
        const openingSection = document.getElementById("opening");
        if (openingSection) {
          openingSection.style.display = "none";
        }
      }, 1500);

      if (audio) {
        audio.play().then(() => {
          if (btnPlay) btnPlay.innerHTML = '<i class="ri ri-volume-high"></i>';
        }).catch((err) => {
          console.warn("Autoplay audio blocked or error:", err);
        });
      }
    });
  }

  if (btnPlay && audio) {
    btnPlay.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().then(() => {
          btnPlay.innerHTML = '<i class="ri ri-volume-high"></i>';
        }).catch((err) => console.warn(err));
      } else {
        audio.pause();
        btnPlay.innerHTML = '<i class="ri ri-volume-off"></i>';
      }
    });
  }

  // 3. Salin Rekening / Teks
  document.querySelectorAll(".copy-text, [data-copy]").forEach((button) => {
    button.addEventListener("click", function () {
      const text = this.getAttribute("data-text") || this.getAttribute("data-copy");
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = this.innerHTML;
        this.innerHTML = '<i class="ri ri-check-line me-1"></i> Tersalin';
        setTimeout(() => {
          this.innerHTML = originalText;
        }, 2000);
      });
    });
  });

  // 4. Query Param 'to' atau 'u' atau 'kepada'
  const urlParams = new URLSearchParams(window.location.search);
  const guestName = urlParams.get("to") || urlParams.get("u") || urlParams.get("kepada");
  if (guestName) {
    const cleanGuest = guestName.replace(/_/g, " ").replace(/\+/g, " ");
    const guestEl = document.getElementById("guest");
    if (guestEl) guestEl.textContent = cleanGuest;
    const rsvpName = document.getElementById("rsvp-name") || document.getElementById("name");
    if (rsvpName) rsvpName.value = cleanGuest;
  }

  // 5. Countdown timer
  const countdownEl = document.getElementById("countdown") || document.getElementById("countdown-row");
  if (countdownEl) {
    const targetDateAttr = countdownEl.getAttribute("data-target") || countdownEl.getAttribute("data-date");
    let targetTime = targetDateAttr ? new Date(targetDateAttr).getTime() : NaN;
    if (isNaN(targetTime)) {
      // Fallback
      targetTime = new Date("2026-11-29T08:00:00").getTime();
    }

    function updateCountdown() {
      const now = new Date().getTime();
      const distance = targetTime - now;

      const daysEl = document.getElementById("days");
      const hoursEl = document.getElementById("hours");
      const minutesEl = document.getElementById("minutes");
      const secondsEl = document.getElementById("seconds");

      if (distance < 0) {
        if (daysEl) daysEl.textContent = "00";
        if (hoursEl) hoursEl.textContent = "00";
        if (minutesEl) minutesEl.textContent = "00";
        if (secondsEl) secondsEl.textContent = "00";
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (daysEl) daysEl.textContent = String(days).padStart(2, "0");
      if (hoursEl) hoursEl.textContent = String(hours).padStart(2, "0");
      if (minutesEl) minutesEl.textContent = String(minutes).padStart(2, "0");
      if (secondsEl) secondsEl.textContent = String(seconds).padStart(2, "0");
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }
});
