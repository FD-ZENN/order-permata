# Alur Kerja Handoff (/handoff)

Gunakan alur kerja ini untuk mengakhiri sesi kerja dan menyimpan seluruh konteks penting ke memori proyek.

## Langkah Eksekusi:
1. **Rangkum Perubahan Sesi**:
   - Catat file yang dibuat atau diubah, keputusan teknis yang disepakati, dan kendala/masalah terbuka selama sesi berlangsung.
2. **Perbarui `docs/MEMORY.md`**:
   - Tambahkan entri baru menggunakan format baku:
     ```markdown
     ### [KATEGORI] Judul singkat — YYYY-MM-DD
     - Fakta/keputusan: ...
     - Lokasi terkait: path file / nama env var
     - Tag: #tag1 #tag2
     ```
   - Kategori yang diizinkan: `DB`, `ENV`, `DEPLOY`, `KEPUTUSAN`, `BUG`, `TODO`, `API`, `AKUN`, `STRUKTUR`.
3. **Perbarui `docs/PROGRESS.md`**:
   - Pindahkan tugas yang selesai ke bagian "Selesai".
   - Perbarui bagian "Sedang dikerjakan" dan "Belum dikerjakan / masalah terbuka".
4. **Perbarui `docs/SCHEMA.md`**:
   - Jika ada penambahan/perubahan tabel, kolom, tipe data, atau relasi database, sesuaikan ringkasan dan tanggal `Terakhir diperbarui`.
5. **Ringkas & Pangkas `docs/MEMORY.md`**:
   - Jika file `docs/MEMORY.md` sudah mendekati atau melebihi ~200 baris, gabungkan entri yang serupa dan tandai entri usang dengan `(usang)`.
6. **Verifikasi Keamanan Kredensial**:
   - Pastikan TIDAK ADA password, token, string rahasia, atau nilai .env yang tertulis di file dokumentasi atau kode yang di-commit.
