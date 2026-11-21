"use strict";

/**
 * ============================================================
 * ROYAL PREMIUM — API & Interactivity Integration
 * Mengikuti Panduan Pengembangan Tema & Arsitektur Order Permata
 * ============================================================
 */

// ─── NORMALIZE CONFIG ────────────────────────────────────────────
(function normalizeConfig() {
  window.CONFIG = window.CONFIG || {};
  const C = window.CONFIG;

  if (!C.apiBase) {
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

var CONFIG = window.CONFIG;

function attendanceClass(a) {
  if (!a) return 'belum';
  const v = a.toLowerCase();
  return (v === 'hadir' || v === '1') ? 'hadir' : (v === 'tidak hadir' || v === 'tidak_hadir' || v === '0') ? 'tidak' : 'belum';
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.appendChild(document.createTextNode(s || ''));
  return d.innerHTML;
}

function renderCommentCard(data) {
  const rawAtt = data.attendance || 'hadir';
  const cls = attendanceClass(rawAtt);
  const badgeText = (rawAtt === 'tidak_hadir' || rawAtt === 'tidak hadir' || rawAtt === '0') ? 'Tidak Hadir' : 'Hadir';
  const name = escapeHtml(data.guest_name || data.name || 'Tamu Undangan');
  const greeting = escapeHtml(data.content || data.greeting || data.message || '');

  return `<div class="comment-item ${cls}" data-aos="fade-right">
      <div class="cm-head">
          <span class="cm-name">${name}</span>
          <span class="cm-badge">${badgeText}</span>
      </div>
      <p class="cm-text">${greeting}</p>
  </div>`;
}

async function loadComments() {
  const list = document.getElementById('comments-list');
  const countEl = document.getElementById('comments-count');
  if (!list) return;

  const orderId = CONFIG.ORDER_ID || CONFIG.idOrders;
  if (!orderId) {
    list.innerHTML = '<div class="text-center py-3 text-muted">Belum ada ucapan. Jadilah yang pertama mengirimkan doa restu!</div>';
    if (countEl) countEl.textContent = '0 UCAPAN';
    return;
  }

  try {
    const res = await fetch(`${CONFIG.apiBase}/comments?order_id=${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const comments = Array.isArray(json) ? json : (json.data || json.comments || []);
    if (!Array.isArray(comments) || comments.length === 0) {
      list.innerHTML = '<div class="text-center py-3 text-muted">Belum ada ucapan. Jadilah yang pertama mengirimkan doa restu!</div>';
      if (countEl) countEl.textContent = '0 UCAPAN';
      return;
    }
    list.innerHTML = comments.map(renderCommentCard).join('');
    if (countEl) countEl.textContent = `${comments.length} UCAPAN`;
  } catch (err) {
    console.warn('Gagal memuat komentar live:', err);
    list.innerHTML = '<div class="text-center py-3 text-muted">Belum ada ucapan. Jadilah yang pertama mengirimkan doa restu!</div>';
    if (countEl) countEl.textContent = '0 UCAPAN';
  }
}

async function handleRsvpSubmit(e) {
  e.preventDefault();
  const form = document.getElementById('rsvp-form');
  const feedback = document.getElementById('rsvp-feedback');
  const btn = form.querySelector('.btn-submit');

  const nameInput = form.querySelector('[name="name"]');
  const name = nameInput ? nameInput.value.trim() : '';
  const attChecked = form.querySelector('input[name="attendance"]:checked');
  const attendance = attChecked ? attChecked.value : '';
  const greetingInput = form.querySelector('[name="greeting"]');
  const greeting = greetingInput ? greetingInput.value.trim() : '';

  if (!name) return showFeedback(feedback, 'error', 'Maaf, harap isi nama lengkap Anda.');
  if (!attendance) return showFeedback(feedback, 'error', 'Harap konfirmasi kehadiran.');
  if (!greeting) return showFeedback(feedback, 'error', 'Harap melengkapi kolom ucapan.');

  btn.disabled = true;
  const origBtnText = btn.textContent;
  btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> MEMPROSES...';

  const orderId = CONFIG.ORDER_ID || CONFIG.idOrders;
  const attVal = (attendance.toLowerCase().includes('tidak') || attendance === '0') ? 'tidak_hadir' : 'hadir';

  try {
    const res = await fetch(`${CONFIG.apiBase}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        order_id: orderId,
        guest_name: name,
        attendance: attVal,
        content: greeting
      })
    });

    if (!res.ok) {
      const errRes = await res.json().catch(() => ({}));
      throw new Error(errRes.message || `HTTP ${res.status}`);
    }

    showFeedback(feedback, 'success', 'Terima kasih, konfirmasi kehadiran dan doa restu Anda telah tersimpan.');
    form.reset();
    await loadComments();
  } catch (err) {
    showFeedback(feedback, 'error', 'Terjadi kendala saat mengirim ucapan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = origBtnText;
  }
}

function showFeedback(el, type, msg) {
  if (!el) return;
  el.className = 'rsvp-feedback ' + type;
  el.textContent = msg;
  setTimeout(() => {
    el.className = 'rsvp-feedback';
    el.textContent = '';
  }, 6000);
}

window.loadComments = loadComments;
window.handleRsvpSubmit = handleRsvpSubmit;
