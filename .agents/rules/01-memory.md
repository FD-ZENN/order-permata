# Rule Sistem Memori Persisten Proyek

- Sebelum bertindak, baca `docs/MEMORY.md`. Cari kata kunci yang relevan dengan tugas (grep tag/kategori) sebelum bertanya ke user atau mengulang pengecekan.
- Jika info sudah ada di memori, pakai. Cek ulang hanya jika ada error nyata atau user memintanya.
- Saat menemukan info baru yang berguna (keputusan, bug dan solusinya, endpoint, struktur, konfigurasi), tambahkan entri ke MEMORY.md.
- Format entri:
  ### [KATEGORI] Judul singkat — YYYY-MM-DD
  - Fakta/keputusan: ...
  - Lokasi terkait: path file / nama env var
  - Tag: #tag1 #tag2
- Kategori: DB, ENV, DEPLOY, KEPUTUSAN, BUG, TODO, API, AKUN, STRUKTUR.
- LARANGAN KERAS: jangan pernah menulis password, token, API key, secret, atau nilai .env ke MEMORY.md, SCHEMA.md, PROGRESS.md, kode, atau file apa pun yang bisa di-commit. Untuk kredensial, catat hanya nama variabel dan lokasinya, contoh: "DB_PASS ada di .env".
- Untuk kategori AKUN, catat hanya di mana kredensial disimpan (misal "password manager, entri X"), bukan nilainya.
- Jika user menempelkan password di chat, jangan salin ke file mana pun. Ingatkan user untuk memindahkannya ke .env atau password manager.
- Jaga MEMORY.md di bawah ~200 baris: gabungkan entri lama yang mirip, hapus yang kedaluwarsa, tandai yang sudah tidak berlaku dengan "(usang)".
