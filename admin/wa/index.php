<?php
declare(strict_types=1);
require_once __DIR__ . '/WhatsAppService.php';
$service = new WhatsAppService();
$config = $service->getConfig();
$templates = $config['quick_templates'] ?? [];
$customers = $service->getCustomerList(100);
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WhatsApp Gateway &mdash; Permata Wedding</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,600;1,600&display=swap" rel="stylesheet">
  <link rel="preload" href="../assets/fonts/material-symbols-outlined.woff2" as="font" type="font/woff2" crossorigin>
  <style>
    @font-face {
      font-family: 'Material Symbols Outlined';
      font-style: normal;
      font-weight: 400;
      font-display: block;
      src: url('../assets/fonts/material-symbols-outlined.woff2') format('woff2');
    }
    .material-symbols-outlined {
      font-family: 'Material Symbols Outlined';
      font-weight: normal;
      font-style: normal;
      font-size: 24px;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      overflow: hidden;
      user-select: none;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      -webkit-font-feature-settings: 'liga';
      font-feature-settings: 'liga';
    }
    :root {
      --primary: #9a5b4a;
      --primary-hover: #834737;
      --primary-light: #fbf5f3;
      --wa-green: #25d366;
      --wa-dark: #075e54;
      --wa-bubble-out: #dcf8c6;
      --wa-bubble-in: #ffffff;
      --surface: #ffffff;
      --bg: #f8f6f5;
      --border: #e8e2de;
      --text: #2a2220;
      --muted: #7d6f69;
      --radius: 12px;
      --shadow: 0 4px 20px -2px rgba(154,91,74,0.08), 0 2px 6px -1px rgba(0,0,0,0.04);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 1rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 50;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: inherit;
    }
    .brand-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #25d366, #128c7e);
      color: #fff;
      display: grid;
      place-items: center;
      box-shadow: 0 4px 10px rgba(37,211,102,0.3);
    }
    .brand-title { font-weight: 800; font-size: 1.15rem; color: var(--primary); }
    .brand-sub { font-size: 0.75rem; color: var(--muted); }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 99px;
      font-size: 0.8rem;
      font-weight: 600;
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4caf50;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%{opacity:1;} 50%{opacity:0.4;} 100%{opacity:1;} }

    .nav-tabs {
      display: flex;
      gap: 0.5rem;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      padding: 0 1.5rem;
    }
    .tab-btn {
      padding: 0.9rem 1.25rem;
      border: none;
      background: none;
      font-family: inherit;
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--muted);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
    }
    .tab-btn:hover { color: var(--primary); }
    .tab-btn.active { color: var(--primary); border-bottom-color: var(--primary); }

    .container {
      max-width: 1200px;
      width: 100%;
      margin: 1.5rem auto;
      padding: 0 1rem;
      flex: 1;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }

    .grid-sender {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 1.5rem;
    }
    @media (max-width: 900px) {
      .grid-sender { grid-template-columns: 1fr; }
    }

    .card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 1.5rem;
      box-shadow: var(--shadow);
    }
    .card-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .card-desc {
      font-size: 0.825rem;
      color: var(--muted);
      margin-bottom: 1.25rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }
    label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
      color: var(--text);
    }
    input, select, textarea {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1px solid var(--border);
      border-radius: 8px;
      font-family: inherit;
      font-size: 0.875rem;
      background: #faf8f7;
      color: var(--text);
      transition: all 0.2s;
    }
    input:focus, select:focus, textarea:focus {
      outline: none;
      border-color: var(--primary);
      background: #fff;
      box-shadow: 0 0 0 3px rgba(154,91,74,0.1);
    }
    textarea {
      min-height: 180px;
      resize: vertical;
      font-size: 0.9rem;
      line-height: 1.5;
    }

    .btn {
      padding: 0.65rem 1.25rem;
      border-radius: 8px;
      font-family: inherit;
      font-weight: 700;
      font-size: 0.875rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
      border: none;
    }
    .btn-wa {
      background: linear-gradient(135deg, #25d366, #128c7e);
      color: #fff;
      box-shadow: 0 4px 12px rgba(37,211,102,0.3);
    }
    .btn-wa:hover {
      background: linear-gradient(135deg, #20ba59, #0f7569);
      box-shadow: 0 6px 16px rgba(37,211,102,0.4);
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
    }
    .btn-outline:hover {
      background: #f5f0ed;
    }

    /* Live WhatsApp Chat Bubble Preview */
    .wa-preview-box {
      background: #efeae2;
      background-image: radial-gradient(#d6cfc2 1px, transparent 1px);
      background-size: 16px 16px;
      border-radius: var(--radius);
      padding: 1.25rem;
      min-height: 320px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      border: 1px solid #d9d2c5;
    }
    .wa-bubble {
      background: var(--wa-bubble-out);
      align-self: flex-end;
      max-width: 88%;
      padding: 10px 14px;
      border-radius: 12px 0 12px 12px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.15);
      position: relative;
      font-size: 0.875rem;
      white-space: pre-wrap;
      word-break: break-word;
      color: #111;
    }
    .wa-bubble-meta {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      color: #667781;
      margin-top: 4px;
    }

    /* Message Table */
    .table-container {
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.85rem;
    }
    th, td {
      padding: 0.75rem 1rem;
      text-align: left;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: #faf8f7;
      font-weight: 700;
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .badge-out {
      background: #e3f2fd;
      color: #1565c0;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.7rem;
    }
    .badge-in {
      background: #e8f5e9;
      color: #2e7d32;
      padding: 3px 8px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 0.7rem;
    }

    #toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      padding: 0.85rem 1.25rem;
      background: #2a2220;
      color: #fff;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      transform: translateY(100px);
      opacity: 0;
      transition: all 0.3s;
      z-index: 100;
    }
    #toast.show {
      transform: translateY(0);
      opacity: 1;
    }
    #toast.success { background: #1f8a5b; }
    #toast.error { background: #c0392b; }
  </style>
</head>
<body>

  <header>
    <a href="../" class="brand">
      <div class="brand-icon">
        <span class="material-symbols-outlined">send</span>
      </div>
      <div>
        <div class="brand-title">Permata Wedding WA Gateway</div>
        <div class="brand-sub">GoWA Server: 103.91.149.145 &bull; Device: <?= htmlspecialchars($config['gowa_device_id'] ?? '') ?></div>
      </div>
    </a>
    <div style="display:flex;align-items:center;gap:12px;">
      <div class="status-badge" id="device-badge">
        <div class="status-dot"></div>
        <span id="device-status-text">Memeriksa Device...</span>
      </div>
      <a href="../" class="btn btn-outline" style="padding:0.45rem 0.9rem;font-size:0.8rem;">
        <span class="material-symbols-outlined" style="font-size:16px;">arrow_back</span>
        Kembali ke Admin
      </a>
    </div>
  </header>

  <nav class="nav-tabs">
    <button class="tab-btn active" onclick="switchTab('sender')">
      <span class="material-symbols-outlined" style="font-size:18px;">chat</span>
      Kirim Pesan WhatsApp
    </button>
    <button class="tab-btn" onclick="switchTab('history')">
      <span class="material-symbols-outlined" style="font-size:18px;">history</span>
      Riwayat Chat / Log Pesan
    </button>
    <button class="tab-btn" onclick="switchTab('bot')">
      <span class="material-symbols-outlined" style="font-size:18px;">smart_toy</span>
      Bot Otomatis &amp; Jam Kerja
    </button>
  </nav>

  <main class="container">

    <!-- TAB 1: SENDER -->
    <div id="tab-sender" class="tab-content active">
      <div class="grid-sender">
        <div class="card">
          <div class="card-title">
            <span class="material-symbols-outlined" style="color:var(--primary);">edit_note</span>
            Tulis Pesan WhatsApp
          </div>
          <div class="card-desc">Kirim pesan langsung ke calon pengantin dengan template resmi Permata Wedding.</div>

          <form id="form-send" onsubmit="handleSendWa(event)">
            <!-- Pilih Customer -->
            <div class="form-group">
              <label>Pilih Pesanan Klien (Otomatis Isi Nomor &amp; Link Undangan)</label>
              <select id="sel-customer" onchange="onCustomerSelect()">
                <option value="">&mdash; Pilih pesanan klien atau ketik manual &mdash;</option>
                <?php foreach ($customers as $c): ?>
                  <option value="<?= htmlspecialchars((string) $c['id']) ?>"
                    data-phone="<?= htmlspecialchars((string) $c['customer_phone']) ?>"
                    data-name="<?= htmlspecialchars((string) $c['customer_name']) ?>"
                    data-invitation="<?= htmlspecialchars((string) $c['invitation_url']) ?>"
                    data-kirim="<?= htmlspecialchars((string) $c['kirim_url']) ?>">
                    <?= htmlspecialchars((string) $c['order_code']) ?> &mdash; <?= htmlspecialchars((string) $c['customer_name']) ?> (<?= htmlspecialchars((string) $c['customer_phone']) ?>)
                  </option>
                <?php endforeach; ?>
              </select>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
              <div class="form-group">
                <label>Nomor WhatsApp Customer *</label>
                <input type="text" id="wa-phone" placeholder="Contoh: 085741773941 / 628..." required oninput="updatePreview()" />
              </div>
              <div class="form-group">
                <label>Nama Penerima (Opsional)</label>
                <input type="text" id="wa-name" placeholder="Nama Mempelai" />
              </div>
            </div>

            <!-- Pilih Quick Template -->
            <div class="form-group">
              <label>Pilihan Cepat Template</label>
              <select id="sel-template" onchange="onTemplateSelect()">
                <option value="">&mdash; Pilih format template cepat &mdash;</option>
                <?php foreach ($templates as $key => $tpl): ?>
                  <option value="<?= htmlspecialchars((string) $key) ?>">
                    <?= htmlspecialchars((string) ($tpl['label'] ?? $key)) ?>
                  </option>
                <?php endforeach; ?>
              </select>
            </div>

            <div class="form-group">
              <label>Isi Pesan WhatsApp *</label>
              <textarea id="wa-message" placeholder="Ketik pesan Anda di sini..." required oninput="updatePreview()"></textarea>
              <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-size:0.75rem;color:var(--muted);">Gunakan *teks* untuk bold, _teks_ untuk italic.</span>
                <span style="font-size:0.75rem;color:var(--muted);" id="char-count">0 karakter</span>
              </div>
            </div>

            <input type="hidden" id="wa-invitation-url" value="" />
            <input type="hidden" id="wa-kirim-url" value="" />

            <div style="display:flex;gap:10px;margin-top:1.5rem;">
              <button type="submit" class="btn btn-wa" id="btn-submit">
                <span class="material-symbols-outlined" style="font-size:18px;">send</span>
                Kirim Pesan Sekarang
              </button>
              <button type="button" class="btn btn-outline" onclick="resetForm()">Reset</button>
            </div>
          </form>
        </div>

        <!-- PREVIEW BUBBLE -->
        <div>
          <div class="card" style="margin-bottom:1rem;">
            <div class="card-title">
              <span class="material-symbols-outlined" style="color:#25d366;">preview</span>
              Live WhatsApp Preview
            </div>
            <div class="card-desc">Simulasi tampilan pesan yang akan diterima oleh customer.</div>

            <div class="wa-preview-box">
              <div class="wa-bubble">
                <div id="preview-text" style="min-height:50px;">Ketik pesan atau pilih template di sebelah kiri untuk melihat pratinjau pesan.</div>
                <div class="wa-bubble-meta">
                  <span id="preview-time"><?= date('H:i') ?></span>
                  <span class="material-symbols-outlined" style="font-size:15px;color:#53bdeb;">done_all</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-title" style="font-size:0.95rem;">
              <span class="material-symbols-outlined" style="font-size:18px;color:var(--primary);">info</span>
              Placeholder Variabel
            </div>
            <p style="font-size:0.8rem;color:var(--muted);margin-bottom:0.75rem;">
              Jika pesan mengandung tag variabel berikut, sistem akan menggantinya otomatis dengan data pesanan klien terpilih:
            </p>
            <ul style="font-size:0.8rem;padding-left:1.2rem;color:var(--text);display:flex;flex-direction:column;gap:4px;">
              <li><code>{INVITATION_URL}</code> &rarr; Link website undangan digital klien</li>
              <li><code>{KIRIM_URL}</code> &rarr; Link generator teks kirim tamu online</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- TAB 2: HISTORY -->
    <div id="tab-history" class="tab-content">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;flex-wrap:wrap;gap:10px;">
          <div>
            <div class="card-title" style="margin-bottom:2px;">
              <span class="material-symbols-outlined" style="color:var(--primary);">history</span>
              Riwayat Pesan WhatsApp
            </div>
            <div class="card-desc" style="margin:0;">Log pesan masuk dan keluar tersimpan di database lokal SQLite.</div>
          </div>
          <button class="btn btn-outline" onclick="loadMessagesHistory()" style="padding:0.45rem 0.9rem;font-size:0.8rem;">
            <span class="material-symbols-outlined" style="font-size:16px;">refresh</span>
            Muat Ulang
          </button>
        </div>

        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width:70px;">ID</th>
                <th style="width:90px;">Tipe</th>
                <th style="width:140px;">Nomor HP</th>
                <th>Isi Pesan</th>
                <th style="width:90px;">Status</th>
                <th style="width:160px;">Waktu</th>
              </tr>
            </thead>
            <tbody id="messages-tbody">
              <tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted);">Memuat riwayat chat...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- TAB 3: BOT -->
    <div id="tab-bot" class="tab-content">
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="card-title">
          <span class="material-symbols-outlined" style="color:var(--primary);">schedule</span>
          Jam Operasional Customer Service
        </div>
        <div class="card-desc">Sistem akan otomatis mengirimkan pesan offline jika customer menghubungi di luar jadwal ini.</div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit, minmax(200px, 1fr));gap:1rem;">
          <div style="padding:1rem;background:#faf8f7;border-radius:8px;border:1px solid var(--border);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--muted);">STATUS JAM KERJA</div>
            <div style="font-size:1.1rem;font-weight:700;margin-top:4px;" id="bot-work-status">Memeriksa...</div>
          </div>
          <div style="padding:1rem;background:#faf8f7;border-radius:8px;border:1px solid var(--border);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--muted);">JAM OPERASIONAL</div>
            <div style="font-size:1.1rem;font-weight:700;margin-top:4px;"><?= htmlspecialchars($config['working_hours']['start_hour'] ?? '08:00') ?> - <?= htmlspecialchars($config['working_hours']['end_hour'] ?? '17:00') ?> WIB</div>
          </div>
          <div style="padding:1rem;background:#faf8f7;border-radius:8px;border:1px solid var(--border);">
            <div style="font-size:0.75rem;font-weight:700;color:var(--muted);">HARI KERJA</div>
            <div style="font-size:1.1rem;font-weight:700;margin-top:4px;">Senin &ndash; Sabtu</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">
          <span class="material-symbols-outlined" style="color:var(--primary);">smart_toy</span>
          Daftar Respon Otomatis (Menu Bot)
        </div>
        <div class="card-desc">Trigger kata kunci: <code><?= htmlspecialchars(implode(', ', $config['menu_bot']['trigger_keywords'] ?? [])) ?></code></div>
        <div style="background:#faf8f7;border:1px solid var(--border);border-radius:8px;padding:1rem;white-space:pre-wrap;font-size:0.85rem;line-height:1.6;">
<?= htmlspecialchars($config['menu_bot']['welcome_message'] ?? '') ?>
        </div>
      </div>
    </div>

  </main>

  <div id="toast"></div>

  <script>
    const TEMPLATES = <?= json_encode($templates, JSON_UNESCAPED_UNICODE) ?>;

    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.currentTarget.classList.add('active');
      document.getElementById('tab-' + tab)?.classList.add('active');

      if (tab === 'history') {
        loadMessagesHistory();
      }
    }

    function onCustomerSelect() {
      const sel = document.getElementById('sel-customer');
      const opt = sel.options[sel.selectedIndex];
      if (!opt || !opt.value) return;

      document.getElementById('wa-phone').value = opt.dataset.phone || '';
      document.getElementById('wa-name').value = opt.dataset.name || '';
      document.getElementById('wa-invitation-url').value = opt.dataset.invitation || '';
      document.getElementById('wa-kirim-url').value = opt.dataset.kirim || '';

      // Refresh template jika sudah dipilih
      onTemplateSelect();
      updatePreview();
    }

    function onTemplateSelect() {
      const key = document.getElementById('sel-template').value;
      if (!key || !TEMPLATES[key]) return;

      let raw = TEMPLATES[key].text || '';
      const invUrl = document.getElementById('wa-invitation-url').value || 'https://invitation.permatawedding.com';
      const krmUrl = document.getElementById('wa-kirim-url').value || (invUrl + '#kirim');

      raw = raw.replace(/{INVITATION_URL}/g, invUrl).replace(/{KIRIM_URL}/g, krmUrl);
      document.getElementById('wa-message').value = raw;
      updatePreview();
    }

    function updatePreview() {
      const msg = document.getElementById('wa-message').value;
      const el = document.getElementById('preview-text');
      const cc = document.getElementById('char-count');
      cc.textContent = msg.length + ' karakter';

      if (!msg.trim()) {
        el.textContent = 'Ketik pesan atau pilih template di sebelah kiri untuk melihat pratinjau pesan.';
        return;
      }
      el.textContent = msg;
    }

    function toast(msg, type = 'success') {
      const t = document.getElementById('toast');
      t.className = 'show ' + type;
      t.textContent = msg;
      setTimeout(() => { t.className = ''; }, 3500);
    }

    async function handleSendWa(e) {
      e.preventDefault();
      const btn = document.getElementById('btn-submit');
      const phone = document.getElementById('wa-phone').value.trim();
      const message = document.getElementById('wa-message').value.trim();
      const name = document.getElementById('wa-name').value.trim();

      if (!phone || !message) {
        toast('Nomor HP dan pesan wajib diisi', 'error');
        return;
      }

      btn.disabled = true;
      btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">hourglass_top</span> Mengirim ke WhatsApp...';

      try {
        const res = await fetch('api.php?action=send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, message, customer_name: name })
        });
        const data = await res.json();

        if (data.success) {
          toast('Pesan berhasil terkirim ke WhatsApp ✓', 'success');
        } else {
          toast(data.message || data.error || 'Gagal mengirim pesan', 'error');
        }
      } catch (err) {
        toast('Terjadi kesalahan: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '<span class="material-symbols-outlined" style="font-size:18px;">send</span> Kirim Pesan Sekarang';
      }
    }

    function resetForm() {
      document.getElementById('form-send').reset();
      updatePreview();
    }

    async function checkDeviceStatus() {
      const badge = document.getElementById('device-badge');
      const text = document.getElementById('device-status-text');
      try {
        const res = await fetch('api.php?action=device_status');
        const r = await res.json();
        if (r.data?.online) {
          badge.style.background = '#e8f5e9';
          badge.style.color = '#2e7d32';
          text.textContent = 'GoWA Online & Terhubung';
        } else {
          badge.style.background = '#ffebee';
          badge.style.color = '#c62828';
          text.textContent = 'GoWA Offline / Unreachable';
        }
      } catch (_) {
        text.textContent = 'Status Tidak Dapat Dicek';
      }
    }

    async function loadMessagesHistory() {
      const tbody = document.getElementById('messages-tbody');
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted);">Memuat riwayat chat...</td></tr>';
      try {
        const res = await fetch('api.php?action=messages&limit=50');
        const json = await res.json();
        const msgs = json.data || [];
        if (msgs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--muted);">Belum ada riwayat pesan.</td></tr>';
          return;
        }

        tbody.innerHTML = msgs.map(m => `
          <tr>
            <td style="color:var(--muted);">#${m.id}</td>
            <td><span class="${m.direction === 'outbound' ? 'badge-out' : 'badge-in'}">${m.direction === 'outbound' ? 'KELUAR' : 'MASUK'}</span></td>
            <td><strong>${m.phone}</strong>${m.customer_name ? '<br><small style="color:var(--muted);">' + m.customer_name + '</small>' : ''}</td>
            <td style="max-width:380px;white-space:pre-wrap;word-break:break-word;">${m.message}</td>
            <td><span style="font-weight:600;font-size:0.75rem;color:${m.status === 'sent' || m.status === 'received' ? '#2e7d32' : '#c62828'}">${m.status}</span></td>
            <td style="font-size:0.78rem;color:var(--muted);">${m.created_at}</td>
          </tr>
        `).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#c0392b;padding:2rem;">Gagal memuat riwayat: ' + err.message + '</td></tr>';
      }
    }

    async function checkWorkingHours() {
      try {
        const res = await fetch('api.php?action=config_info');
        const json = await res.json();
        const el = document.getElementById('bot-work-status');
        if (json.data?.is_working_hours) {
          el.innerHTML = '<span style="color:#2e7d32;">AKTIF (Dalam Jam Operasional)</span>';
        } else {
          el.innerHTML = '<span style="color:#e65100;">OFFLINE (Di Luar Jam Operasional)</span>';
        }
      } catch (_) {}
    }

    document.addEventListener('DOMContentLoaded', () => {
      checkDeviceStatus();
      checkWorkingHours();
      updatePreview();
    });
  </script>
</body>
</html>
