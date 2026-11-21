// ═══════════════════════════════════════════════
// MEDIA UPLOAD & COMPRESSION — Permata Wedding
// (Client-Side Canvas Compression & Gallery Manager)
// ═══════════════════════════════════════════════

/**
 * Mengompresi file gambar menggunakan Canvas di sisi browser (Client-Side)
 * - Mengubah resolusi maks ke 1920px (tetap tajam namun ukuran file susut drastis)
 * - Mengonversi ke format WebP (atau JPEG fallback) kualitas 0.82
 * - Berkas foto 5MB-15MB menyusut menjadi 300KB-600KB dalam hitungan milidetik
 */
async function compressImageFile(file, maxWidth = 1920, maxHeight = 1920, quality = 0.82) {
  // Jika bukan gambar biasa, lewati kompresi
  if (!file || !file.type.startsWith("image/")) {
    return file;
  }

  // Jika ukuran sudah kecil (< 250KB), tidak perlu dikompresi lagi
  if (file.size <= 250 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Hitung skala rasio agar tidak melebihi batas dimensi
        if (width > maxWidth || height > maxHeight) {
          if (width / maxWidth > height / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        // Berikan latar putih jika gambar memiliki transparansi saat konversi ke jpeg
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Pilih format webp jika didukung browser, jika tidak fallback ke jpeg
        const targetType = "image/jpeg";
        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              // Jika hasil kompresi malah lebih besar (jarang), gunakan file asli
              resolve(file);
            } else {
              const newFileName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
              const compressedFile = new File([blob], newFileName, {
                type: targetType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          targetType,
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

// ─── Upload foto single + preview ───────────────
async function handleSingleUpload(input, previewId, labelId, folderFn, uploadLabel = "foto") {
  const rawFile = input.files[0];
  if (!rawFile) return;
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(rawFile.type)) return toast("Format: JPEG, PNG, atau WebP", "error");
  if (rawFile.size > 25 * 1024 * 1024) return toast("Maks. 25 MB", "error");

  const label = document.getElementById(labelId);
  if (label) label.textContent = "Mengompresi...";

  try {
    const folder = typeof folderFn === "function" ? folderFn() : folderFn;
    if (!folder) {
      toast("Isi Slug URL terlebih dahulu", "error");
      if (label) label.textContent = "Klik untuk upload foto";
      return;
    }

    // Kompresi client-side sebelum dikirim ke server
    const file = await compressImageFile(rawFile, 1600, 1600, 0.85);

    if (label) label.textContent = "Mengunggah...";
    const url = await uploadPublic(file, folder, uploadLabel);

    if (previewId === "groom-photo-preview") ORDER.groomPhotoUrl = url;
    if (previewId === "bride-photo-preview") ORDER.bridePhotoUrl = url;

    const img = document.getElementById(previewId);
    if (img) {
      img.src = url;
      img.style.display = "block";
    }
    if (label) label.textContent = "Foto berhasil diupload";
    toast("Foto berhasil diupload", "success");
    if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
  } catch (e) {
    toast("Upload gagal: " + e.message, "error");
    if (label) label.textContent = "Klik untuk upload foto";
  }
}

// ─── Preview & Manajemen Galeri Interaktif ──────
function previewGalleryFiles(input) {
  const newFiles = Array.from(input.files || []);
  if (!newFiles.length) return;

  // Gabungkan ke daftar ORDER.galleryFiles yang sudah ada
  if (!Array.isArray(ORDER.galleryFiles)) {
    ORDER.galleryFiles = [];
  }

  // Tambahkan file baru (batasi total maksimal 30 foto)
  const combined = [...ORDER.galleryFiles, ...newFiles].slice(0, 30);
  ORDER.galleryFiles = combined;
  ORDER.galleryUrls = []; // reset URL tersimpan agar diupload saat submit

  renderGalleryPreviews();
}

function removeGalleryFile(index) {
  if (!Array.isArray(ORDER.galleryFiles)) return;
  ORDER.galleryFiles.splice(index, 1);
  renderGalleryPreviews();
  toast("Foto dihapus dari pilihan", "info");
}

function renderGalleryPreviews() {
  const wrap = document.getElementById("gallery-preview-wrap");
  const count = document.getElementById("gallery-count-label");
  if (!wrap) return;

  wrap.innerHTML = "";
  const files = ORDER.galleryFiles || [];

  if (!files.length) {
    if (count) count.textContent = "";
    return;
  }

  if (count) {
    count.textContent = `${files.length} foto dipilih (klik × untuk membatalkan foto)`;
  }

  files.forEach((file, idx) => {
    const item = document.createElement("div");
    item.className = "gallery-preview-item";

    const img = document.createElement("img");
    img.alt = `Pratinjau ${idx + 1}`;

    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "gallery-btn-remove";
    removeBtn.setAttribute("title", "Hapus foto ini");
    removeBtn.innerHTML = "×";
    removeBtn.onclick = (e) => {
      e.stopPropagation();
      removeGalleryFile(idx);
    };

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);

    item.appendChild(img);
    item.appendChild(removeBtn);
    wrap.appendChild(item);
  });
}
