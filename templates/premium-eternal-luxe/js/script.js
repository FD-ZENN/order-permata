// ================================================================
// KONFIGURASI — silakan ubah angka di sini sesuai kebutuhan
// ================================================================
window.CONFIG = Object.assign({
    weddingDate: '2027-12-31T00:00:00+07:00', // 31 Des 2025 WIB
    apiBase: 'https://invitation.permatawedding.com/api/komentar/komentar.php',
    idOrders: '143',
    heroRevealDelay: 1000,
    textRevealDelay: 1000,
    videoFallbackDelay: 2500,
}, window.CONFIG || {});
var CONFIG = window.CONFIG;

let isMusicPlaying = false;
let scrollUnlockTimer = null;

function getUrlParam(key) { return new URLSearchParams(window.location.search).get(key); }
function escapeHtml(s) { const d = document.createElement('div'); d.appendChild(document.createTextNode(s || '')); return d.innerHTML; }

/* ----------------------------------------------------------------
   Fix tinggi viewport asli di mobile (address bar browser sering
   membuat 100vh meleset). --vh dipakai lewat CSS: var(--app-height)
---------------------------------------------------------------- */
function setRealViewportHeight() {
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);
}

function renderCommentCard(data) {
    const isAttendant = data.attendance && data.attendance.toLowerCase() === 'hadir';
    return `<div class="comment-item border-bottom pb-4 mb-4" data-aos="fade-up">
        <div class="cm-head d-flex justify-content-between align-items-center mb-2">
            <span class="cm-name font-cormorant fw-bold fs-md text-primary">${escapeHtml(data.name || 'Anonim')}</span>
            <span class="badge ${isAttendant ? 'bg-secondary text-white' : 'bg-gray text-white'} p-1 rounded fs-xs font-poppins">${escapeHtml(data.attendance || 'Belum Pasti')}</span>
        </div>
        <p class="cm-text font-poppins text-xs text-dark tracking-wide">${escapeHtml(data.greeting || data.message || '')}</p>
    </div>`;
}

async function loadComments() {
    const list = document.getElementById('comments-list');
    const countEl = document.getElementById('comments-count');
    if (!list) return;

    try {
        const res = await fetch(`${CONFIG.apiBase}?id_orders=${CONFIG.idOrders}`, { method: 'GET', headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.json();
        const comments = Array.isArray(raw) ? raw : (raw.data || raw.komentar || []);

        if (!Array.isArray(comments) || comments.length === 0) {
            list.innerHTML = '<p class="text-center font-poppins text-xs text-dark opacity-50 py-4">Belum ada ucapan.</p>';
            if (countEl) countEl.textContent = `0 Pesan`;
            return;
        }

        list.innerHTML = comments.map(renderCommentCard).join('');
        if (countEl) countEl.textContent = `${comments.length} Pesan`;
    } catch {
        list.innerHTML = '<p class="text-center font-poppins text-xs text-dark opacity-50 py-4">Memuat data secara offline...</p>';
    }
}

async function handleRsvpSubmit(e) {
    e.preventDefault();
    const form = document.getElementById('rsvp-form');
    const feedback = document.getElementById('rsvp-feedback');
    const btn = form.querySelector('button[type="submit"]');

    const name = form.querySelector('[name="name"]').value.trim();
    const attendance = form.querySelector('[name="attendance"]').value;
    const greeting = form.querySelector('[name="greeting"]').value.trim();

    if (!name || !attendance || !greeting) return showFeedback(feedback, 'error', 'Harap lengkapi isi form.');

    btn.disabled = true;
    const origBtnText = btn.innerHTML;
    btn.innerHTML = 'MENGIRIM...';

    const fd = new FormData();
    fd.append('id_orders', CONFIG.idOrders);
    fd.append('name', name);
    fd.append('attendance', attendance);
    fd.append('greeting', greeting);

    try {
        const res = await fetch(CONFIG.apiBase, { method: 'POST', body: fd });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        showFeedback(feedback, 'success', 'Terima kasih atas doa restunya!');
        form.reset();
        await loadComments();
    } catch {
        const list = document.getElementById('comments-list');
        const countEl = document.getElementById('comments-count');

        if (list) {
            const prev = list.innerHTML.includes('Belum ada ucapan') || list.innerHTML.includes('offline') ? '' : list.innerHTML;
            list.innerHTML = renderCommentCard({ name, attendance, greeting }) + prev;
        }
        if (countEl) {
            const currNum = parseInt(countEl.textContent) || 0;
            countEl.textContent = `${currNum + 1} Pesan`;
        }

        showFeedback(feedback, 'success', 'Terima kasih atas ucapan & doa Anda (Mode Offline).');
        form.reset();
    } finally {
        btn.disabled = false;
        btn.innerHTML = origBtnText;
    }
}

function showFeedback(el, type, msg) {
    if (!el) return;
    el.className = 'mt-4 text-center font-poppins fw-bold text-xs ' + (type === 'error' ? 'text-primary' : 'text-secondary');
    el.textContent = msg;
    el.classList.remove('d-none');
    setTimeout(() => { el.classList.add('d-none'); el.textContent = ''; }, 5000);
}

function updateCountdown() {
    const diff = new Date(CONFIG.weddingDate).getTime() - Date.now();
    if (diff <= 0) {
        document.querySelectorAll('.countdown-hero').forEach(el => {
            el.innerHTML = '<p class="font-cormorant fw-bold text-white fs-xl px-4 py-8 text-center text-shadow">Acara Telah Berlangsung</p>';
        });
        return;
    }
    const pad = n => String(Math.floor(n)).padStart(2, '0');

    const days = pad(diff / 864e5);
    const hours = pad((diff % 864e5) / 36e5);
    const mins = pad((diff % 36e5) / 6e4);
    const secs = pad((diff % 6e4) / 1e3);

    document.querySelectorAll('#count-days').forEach(el => el.textContent = days);
    document.querySelectorAll('#count-hours').forEach(el => el.textContent = hours);
    document.querySelectorAll('#count-mins').forEach(el => el.textContent = mins);
    document.querySelectorAll('#count-secs').forEach(el => el.textContent = secs);
}

function toggleMusic() {
    const audio = document.getElementById('bg-music');
    const btn = document.getElementById('music-btn');
    if (!audio || !btn) return;

    if (isMusicPlaying) {
        audio.pause();
        isMusicPlaying = false;
        btn.innerHTML = '<i class="fas fa-play"></i>';
    } else {
        audio.play().then(() => {
            isMusicPlaying = true;
            btn.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i>';
        }).catch(() => { });
    }
}

function setupCopyButtons() {
    document.querySelectorAll('.btn-copy').forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-copy');
            if (!text) return;
            navigator.clipboard.writeText(text).then(() => {
                const orig = btn.innerHTML;
                btn.innerHTML = '<i class="fas fa-check"></i> Tersalin';
                setTimeout(() => { btn.innerHTML = orig; }, 2000);
            }).catch(() => { });
        });
    });
}

/* ----------------------------------------------------------------
   Membuka gembok scroll + menampilkan kartu nama mempelai & hint
   scroll. Dipanggil otomatis setelah CONFIG.heroRevealDelay, atau
   lebih cepat jika video gagal autoplay (lihat videoFallbackDelay).
---------------------------------------------------------------- */
function unlockScroll() {
    if (document.body.classList.contains('is-unlocked')) return; // hanya jalan sekali

    document.body.classList.add('is-unlocked');

    const heroCard = document.querySelector('.hero-card');
    const scrollHint = document.getElementById('scroll-hint');
    if (scrollHint) scrollHint.classList.add('is-visible');

    // Sembunyikan hint begitu tamu mulai scroll sendiri
    const hideHintOnScroll = () => {
        if (scrollHint) scrollHint.classList.remove('is-visible');
        window.removeEventListener('scroll', hideHintOnScroll);
    };
    window.addEventListener('scroll', hideHintOnScroll, { passive: true, once: true });
}

function showHeroText() {
    const heroCard = document.querySelector('.hero-card');
    if (heroCard) heroCard.classList.add('is-visible');
}

function scheduleScrollUnlock(delayMs) {
    if (scrollUnlockTimer) clearTimeout(scrollUnlockTimer);
    scrollUnlockTimer = setTimeout(unlockScroll, delayMs);
}

function handleOpenInvitation() {
    const cover = document.getElementById('cover');
    const main = document.getElementById('main-content');
    const heroVid = document.getElementById('hero-video');

    if (!cover || !main) return;

    cover.style.transition = 'opacity 1s ease';
    cover.style.opacity = '0';

    setTimeout(() => {
        cover.style.display = 'none';
        main.style.display = 'block';

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Untuk pengguna yang minta reduced motion, langsung buka scroll (aksesibilitas)
        const revealDelay = prefersReducedMotion ? 300 : CONFIG.heroRevealDelay;

        if (heroVid) {
            heroVid.play().then(() => {
                // Video berhasil diputar → scroll terkunci sampai heroRevealDelay
                scheduleScrollUnlock(revealDelay);
                setTimeout(showHeroText, CONFIG.textRevealDelay);
            }).catch(e => {
                console.log('Video autoplay diblokir:', e);
                // Video gagal autoplay (umum di beberapa browser mobile) →
                // jangan biarkan tamu terjebak, buka scroll lebih cepat.
                scheduleScrollUnlock(CONFIG.videoFallbackDelay);
                showHeroText();
            });

            // Freeze video di frame terakhir saat selesai (tidak loop)
            heroVid.addEventListener('ended', () => {
                heroVid.pause();
            });
        } else {
            scheduleScrollUnlock(revealDelay);
        }

        if (typeof AOS !== 'undefined') {
            AOS.init({
                duration: prefersReducedMotion ? 0 : 1000,
                easing: 'ease-in-out',
                once: true,
                offset: 50,
                disable: prefersReducedMotion
            });
        }

        // Trigger manual fade-ins for top elements
        setTimeout(() => {
            document.querySelectorAll('.animate-up, .animate-zoom').forEach(el => {
                el.classList.add('show');
            });
        }, 100);

        const audio = document.getElementById('bg-music');
        const mbtn = document.getElementById('music-btn');
        if (audio) {
            audio.volume = 0.5;
            audio.play().then(() => {
                isMusicPlaying = true;
                if (mbtn) {
                    mbtn.style.display = 'flex';
                    mbtn.innerHTML = '<i class="fas fa-compact-disc fa-spin"></i>';
                }
            }).catch(() => {
                // Autoplay diblokir browser — tampilkan tombol agar user bisa play manual
                if (mbtn) {
                    mbtn.style.display = 'flex';
                    mbtn.innerHTML = '<i class="fas fa-play"></i>';
                }
            });
        }

        loadComments();
        updateCountdown();
        setInterval(updateCountdown, 1000);

        window.scrollTo({ top: 0, behavior: 'instant' });
    }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
    setRealViewportHeight();
    window.addEventListener('resize', setRealViewportHeight);
    window.addEventListener('orientationchange', setRealViewportHeight);

    // Nama Tamu
    const guestEl = document.getElementById('guest-name');
    if (guestEl) {
        const toParam = getUrlParam('to');
        if (toParam) guestEl.textContent = decodeURIComponent(toParam.trim());
    }

    // Trigger cover animations directly
    setTimeout(() => {
        document.querySelectorAll('.section-cover .animate-up, .section-cover .animate-zoom').forEach(el => {
            el.classList.add('show');
        });
        document.querySelectorAll('.col-left .animate-up, .col-left .animate-zoom').forEach(el => {
            el.classList.add('show');
        });
    }, 500);

    setTimeout(() => {
        const ls = document.getElementById('loading-screen');
        if (ls) ls.classList.add('hidden');
    }, 1500);

    const openBtn = document.getElementById('btn-buka');
    if (openBtn) openBtn.addEventListener('click', handleOpenInvitation);

    setupCopyButtons();

    const musicBtn = document.getElementById('music-btn');
    if (musicBtn) musicBtn.addEventListener('click', toggleMusic);

    const rsvpForm = document.getElementById('rsvp-form');
    if (rsvpForm) rsvpForm.addEventListener('submit', handleRsvpSubmit);
});