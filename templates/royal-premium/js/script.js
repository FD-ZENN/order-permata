/**
 * ============================================================
 * ROYAL PREMIUM PHOTO — Undangan Pernikahan (Model 111)
 * script.js — Interactivity, Animations, Audio & Navigation
 * ============================================================
 */

"use strict";

window.CONFIG = window.CONFIG || {};
var CONFIG = window.CONFIG;

let isMusicPlaying = false;

function getUrlParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

function updateCountdown() {
  const cdEl = document.getElementById('cover-countdown') || document.getElementById('countdown');
  const targetDateStr = (cdEl && cdEl.getAttribute('data-target')) || CONFIG.weddingDate || '2027-01-01T10:00:00+07:00';
  const diff = new Date(targetDateStr).getTime() - Date.now();
  if (diff <= 0) {
    const el = document.getElementById('cover-countdown');
    if (el) el.innerHTML = '<p style="font-family:var(--font-serif); font-size:1.5rem; color:var(--ryl-accent); text-align:center; padding:10px">Hari Bahagia Telah Tiba</p>';
    return;
  }
  const pad = n => String(Math.floor(n)).padStart(2, '0');

  const dEl = document.getElementById('count-days');
  const hEl = document.getElementById('count-hours');
  const mEl = document.getElementById('count-mins');
  const sEl = document.getElementById('count-secs');

  if (dEl) dEl.textContent = pad(diff / 864e5);
  if (hEl) hEl.textContent = pad((diff % 864e5) / 36e5);
  if (mEl) mEl.textContent = pad((diff % 36e5) / 6e4);
  if (sEl) sEl.textContent = pad((diff % 6e4) / 1e3);
}

function updateNavActive() {
  const sections = document.querySelectorAll('.section, .opened-header');
  const navItems = document.querySelectorAll('.nav-item');
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - window.innerHeight / 2) {
      current = s.id || s.classList.contains('opened-header') ? 'home' : s.id;
    }
  });

  navItems.forEach(n => {
    n.classList.toggle('active', n.getAttribute('data-section') === current || (current === 'home' && n.getAttribute('data-section') === 'mempelai'));
  });
}

function toggleMusic() {
  const audio = document.getElementById('bg-music');
  const btn = document.getElementById('music-btn');
  if (!audio || !btn) return;

  if (isMusicPlaying) {
    audio.pause();
    isMusicPlaying = false;
    btn.classList.remove('playing');
    btn.innerHTML = '<i class="fas fa-play"></i>';
  } else {
    audio.play().then(() => {
      isMusicPlaying = true;
      btn.classList.add('playing');
      btn.innerHTML = '<i class="fas fa-music"></i>';
    }).catch(() => {});
  }
}

function setupCopyButtons() {
  document.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy');
      if (!text) return;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.innerHTML;
        btn.innerHTML = 'BERHASIL DISALIN';
        setTimeout(() => { btn.innerHTML = orig; }, 3000);
      }).catch(() => {});
    });
  });
}

function smoothScrollTo(target) {
  const el = document.querySelector(target);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function handleOpenInvitation() {
  const heroSection = document.getElementById('hero');
  const mainContent = document.getElementById('main-content');

  if (!heroSection || !mainContent) return;

  heroSection.classList.add('opened');

  setTimeout(() => {
    mainContent.classList.add('show');
    document.body.style.overflow = '';

    if (typeof AOS !== 'undefined') {
      AOS.init({ duration: 1800, easing: 'ease', once: true, offset: 80 });
    }

    const audio = document.getElementById('bg-music');
    if (audio) {
      audio.volume = 0.5;
      audio.play().then(() => {
        isMusicPlaying = true;
        const mbtn = document.getElementById('music-btn');
        if (mbtn) {
          mbtn.classList.add('playing');
          mbtn.innerHTML = '<i class="fas fa-music"></i>';
        }
      }).catch(() => {});
    }

    if (typeof window.loadComments === 'function') {
      window.loadComments();
    }

    window.scrollTo({ top: 0, behavior: 'instant' });
  }, 1500);
}

document.addEventListener('DOMContentLoaded', () => {
  const guestEl = document.getElementById('guest-name');
  if (guestEl) {
    const toParam = getUrlParam('to');
    if (toParam) guestEl.textContent = decodeURIComponent(toParam.trim());
  }

  document.body.style.overflow = 'hidden';

  // Start countdown
  updateCountdown();
  setInterval(updateCountdown, 1000);

  // Fade out loading screen
  setTimeout(() => {
    const ls = document.getElementById('loading-screen');
    if (ls) {
      ls.style.transition = 'opacity 1s, visibility 1s';
      ls.classList.add('hidden');
    }
  }, 2200);

  const openBtn = document.getElementById('open-btn');
  if (openBtn) openBtn.addEventListener('click', handleOpenInvitation);

  setupCopyButtons();

  const musicBtn = document.getElementById('music-btn');
  if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        smoothScrollTo(href);
      }
    });
  });

  const rsvpForm = document.getElementById('rsvp-form');
  if (rsvpForm && typeof window.handleRsvpSubmit === 'function') {
    rsvpForm.addEventListener('submit', window.handleRsvpSubmit);
  }

  window.addEventListener('scroll', () => {
    updateNavActive();
  }, { passive: true });
});
