<?php
$mempelai_laki = "Ryan";
$mempelai_wanita = "Dwi";
$undangan_link = "https://invitation.permata-wedding.my.id/Ryan&Dwi?kepada=";

$pesan_template = "Kepada Yth.
Bapak/Ibu/Saudara/i
*{NAMA_TAMU}*

‎السَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ

Tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara Resepsi Pernikahan kami:

*{$mempelai_laki}*
*&*
*{$mempelai_wanita}*

*Berikut link undangan kami:*
{LINK_UNDANGAN}

Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan untuk hadir dan memberikan doa restu.

*Mohon maaf perihal undangan hanya dibagikan melalui pesan ini.*

‎وَالسَّلاَمُ عَلَيْكُمْ وَرَحْمَةُ اللهِ وَبَرَكَاتُهُ

Kami yang berbahagia:
*{$mempelai_laki} & {$mempelai_wanita}*";

$pesan_template_js = json_encode($pesan_template);
?>

<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Kirim undangan pernikahan digital dengan mudah melalui WhatsApp. Masukkan nama tamu dan bagikan undangan resmi pernikahan Ryan & Dwi secara personal dan cepat.">
  <title>Undangan Pernikahan Ryan & Dwi – Kirim via WhatsApp</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    body {
      background-color: #f5f7fa;
      font-family: 'Inter', sans-serif;
      color: #333;
      padding-top: 2rem;
    }
    .app-container {
      max-width: 420px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .app-header {
      background: #4CAF50;
      color: white;
      padding: 16px;
      text-align: center;
    }
    .app-header h4 {
      font-weight: 500;
      font-size: 1.1rem;
      margin: 0;
    }
    .app-content {
      padding: 20px;
    }
    .form-control {
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      padding: 12px;
      font-size: 14px;
    }
    .form-control:focus {
      border-color: #8BC34A;
      box-shadow: 0 0 0 2px rgba(139, 195, 74, 0.2);
    }
    .form-label {
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }
    .btn-send {
      background: #4CAF50;
      border: none;
      border-radius: 8px;
      padding: 12px;
      width: 100%;
      font-weight: 500;
      font-size: 14px;
    }
    .btn-send:hover {
      background: #66BB6A;
    }
    .history-section {
      margin-top: 20px;
      border-top: 1px solid #eee;
      padding-top: 15px;
    }
    .history-title {
      font-size: 14px;
      color: #555;
      margin-bottom: 10px;
      font-weight: 500;
      display: flex;
      align-items: center;
    }
    #daftarUndangan {
      max-height: 200px;
      overflow-y: auto;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="app-container">
      <div class="app-header">
        <h4><i class="fas fa-envelope-open-text me-2"></i>Kirim Undangan</h4>
      </div>
      
      <div class="app-content">
        <form id="waForm" onsubmit="kirimWA(event)">
          <div class="mb-3">
            <label for="nama" class="form-label">Nama Tamu</label>
            <input type="text" class="form-control" id="nama" name="nama" placeholder="Masukkan nama tamu" required autocomplete="off">
          </div>
          <button type="submit" class="btn btn-send text-white">
            <i class="fab fa-whatsapp me-2"></i>Kirim via WhatsApp
          </button>
        </form>
        
        <div class="history-section">
          <div class="history-title"><i class="fas fa-history me-2"></i>Riwayat Terkirim</div>
          <ul id="daftarUndangan" class="list-group"></ul>
          <div class="card-footer text-end">
              <button onclick="hapusSemua()" class="btn btn-sm btn-danger">Hapus Semua</button>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Script -->
  <script>
    const pesanTemplate = <?php echo $pesan_template_js; ?>;

    document.addEventListener("DOMContentLoaded", () => {
      const terkirim = JSON.parse(localStorage.getItem('undanganTerkirim')) || [];
      terkirim.forEach(data => tampilkanKeDaftar(data.nama, data.waktu));
    });

    function kirimWA(event) {
      event.preventDefault();

      const nama = document.getElementById('nama').value.trim();
      if (!nama) return;

      if (nama.length < 2 || /[^a-zA-Z0-9\s.'-]/.test(nama)) {
        alert("Nama tamu tidak valid. Gunakan huruf dan angka saja.");
        return;
      }

      const namaUndangan = nama.replace(/\s+/g, '_');
      const namaURL = encodeURIComponent(namaUndangan);
      const undanganLink = "<?php echo $undangan_link; ?>" + namaURL;

      const pesan = pesanTemplate
        .replace(/{NAMA_TAMU}/g, nama)
        .replace(/{LINK_UNDANGAN}/g, undanganLink);

      const encodedPesan = encodeURIComponent(pesan);
      const urlWA = `https://wa.me/?text=${encodedPesan}`;

      const waktu = new Date().toLocaleString();
      simpanKeStorage(nama, waktu);
      tampilkanKeDaftar(nama, waktu);

      window.open(urlWA, '_blank');
      document.getElementById('waForm').reset();
    }

    function tampilkanKeDaftar(nama, waktu) {
      const daftar = document.getElementById('daftarUndangan');
      const item = document.createElement('li');
      item.className = 'list-group-item d-flex justify-content-between align-items-center';
      item.innerHTML = `<span>${nama}</span><small class="text-muted">${waktu}</small>`;
      daftar.appendChild(item);
    }

    function simpanKeStorage(nama, waktu) {
      let data = JSON.parse(localStorage.getItem('undanganTerkirim')) || [];
      const sudahAda = data.some(item => item.nama.toLowerCase() === nama.toLowerCase());
      if (sudahAda) return;
      data.push({ nama, waktu });
      localStorage.setItem('undanganTerkirim', JSON.stringify(data));
    }

    function hapusSemua() {
      localStorage.removeItem('undanganTerkirim');
      document.getElementById('daftarUndangan').innerHTML = '';
    }
  </script>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
