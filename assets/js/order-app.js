// ═══════════════════════════════════════════════
// APPLICATION INITIALIZATION — Permata Wedding
// ═══════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  // 1. Memuat daftar tema dari database
  if (typeof loadThemesPublic === "function") {
    loadThemesPublic();
  }

  // 2. Memuat musik presets dari CDN
  if (typeof loadMusicPresetsFromCDN === "function") {
    loadMusicPresetsFromCDN();
  }

  // 3. Cek draf tersimpan di browser
  if (typeof checkSavedDraft === "function") {
    checkSavedDraft();
  }

  // 4. Daftarkan auto-draft save pada input utama
  document.querySelectorAll("input, textarea, select").forEach((el) => {
    el.addEventListener("input", () => {
      if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
    });
    el.addEventListener("change", () => {
      if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
    });
  });

  // 5. Navigasi Wizard Stepper (Step 1 - 7)
  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const indicator = document.getElementById(`step-indicator-${i}`);
    if (indicator) {
      indicator.addEventListener("click", () => goStep(i));
    }
  }

  document.getElementById("btn-next-1")?.addEventListener("click", () => goStep(2));
  document.getElementById("btn-prev-2")?.addEventListener("click", () => goStep(1));
  document.getElementById("btn-next-2")?.addEventListener("click", () => goStep(3));
  document.getElementById("btn-prev-3")?.addEventListener("click", () => goStep(2));
  document.getElementById("btn-next-3")?.addEventListener("click", () => goStep(4));
  document.getElementById("btn-prev-4")?.addEventListener("click", () => goStep(3));
  document.getElementById("btn-next-4")?.addEventListener("click", () => goStep(5));
  document.getElementById("btn-prev-5")?.addEventListener("click", () => goStep(4));
  document.getElementById("btn-next-5")?.addEventListener("click", () => goStep(6));
  document.getElementById("btn-prev-6")?.addEventListener("click", () => goStep(5));
  document.getElementById("btn-next-6")?.addEventListener("click", () => goStep(7));
  document.getElementById("btn-prev-7")?.addEventListener("click", () => goStep(6));

  // 6. Submit & WhatsApp Share
  document.getElementById("btn-submit")?.addEventListener("click", submitOrder);
  document.getElementById("btn-share-wa")?.addEventListener("click", shareToAdmin);

  // 7. Upload foto mempelai
  document.getElementById("groom-photo-input")?.addEventListener("change", function () {
    handleSingleUpload(this, "groom-photo-preview", "groom-photo-label", folderCouple, "mempelai-pria");
  });
  document.getElementById("bride-photo-input")?.addEventListener("change", function () {
    handleSingleUpload(this, "bride-photo-preview", "bride-photo-label", folderCouple, "mempelai-wanita");
  });

  // 8. Galeri foto
  document.getElementById("gallery-input")?.addEventListener("change", function () {
    previewGalleryFiles(this);
  });

  // 9. Filter tema
  document.getElementById("theme-search")?.addEventListener("input", function () {
    filterThemesPublic(this.value);
  });
  document.getElementById("theme-cat-filter")?.addEventListener("change", function () {
    filterThemesPublic(document.getElementById("theme-search")?.value || "");
  });

  // 10. Default items awal jika belum ada item
  if (typeof addEvent === "function" && eventCount === 0) {
    addEvent();
  }
  if (typeof addMusic === "function" && musicCount === 0) {
    addMusic();
  }

  // 11. Tombol tambah dynamic items
  document.getElementById("btn-add-event")?.addEventListener("click", addEvent);
  document.getElementById("btn-add-music")?.addEventListener("click", addMusic);
  document.getElementById("btn-add-story")?.addEventListener("click", addStory);
  document.getElementById("btn-add-live")?.addEventListener("click", addLive);
  document.getElementById("btn-add-entertainment")?.addEventListener("click", addEntertainment);
  document.getElementById("btn-add-bank")?.addEventListener("click", addBank);

  // 12. Salin link undangan pada panel sukses
  document.getElementById("btn-copy-link")?.addEventListener("click", () => {
    copyToClipboard(getInvitationUrl(getV("o-slug")));
  });

  // 13. Auto-check slug availability
  const slugInput = document.getElementById("o-slug");
  if (slugInput) {
    slugInput.addEventListener("input", function () {
      this.dataset.manual = "true";
      const cleaned = cleanSlug(this.value);
      if (this.value !== cleaned && this.value.endsWith(" ")) {
        this.value = cleaned;
      }
      handleSlugInput(this.value);
    });
  }

  // 14. Auto-generate slug dari nama panggilan/lengkap saat field blur
  ["g-nick", "g-name", "b-nick", "b-name"].forEach((id) => {
    document.getElementById(id)?.addEventListener("blur", autoGenerateSlugIfEmpty);
  });

  // 15. Mulai wizard di Step 1
  goStep(1);
});
