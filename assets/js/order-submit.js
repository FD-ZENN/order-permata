// ═══════════════════════════════════════════════
// DATA COLLECTION, REVIEW & SUBMIT — Permata Wedding
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// Collect Data Functions
// ═══════════════════════════════════════════════
function collectEvents() {
  const events = [];
  document.querySelectorAll("[id^='ev-item-']").forEach((item) => {
    const n = item.id.replace("ev-item-", "");
    const name = document.getElementById(`ev-name-${n}`)?.value.trim();

    if (typeof syncEventDateTime === "function") {
      syncEventDateTime(n);
    }

    const start = document.getElementById(`ev-start-${n}`)?.value;
    if (!name || !start) return;
    events.push({
      name,
      type: document.getElementById(`ev-type-${n}`)?.value.trim() || "",
      start_time: start,
      end_time: document.getElementById(`ev-end-${n}`)?.value || "",
      venue_name: document.getElementById(`ev-venue-${n}`)?.value.trim() || "",
      maps_url: document.getElementById(`ev-maps-${n}`)?.value.trim() || "",
      address: document.getElementById(`ev-addr-${n}`)?.value.trim() || "",
    });
  });
  return events;
}

function collectMusic() {
  const music = [];
  document.querySelectorAll("[id^='mu-item-']").forEach((item) => {
    const n = item.id.replace("mu-item-", "");
    const title = document.getElementById(`mu-title-${n}`)?.value.trim();
    const url = document.getElementById(`mu-url-${n}`)?.value.trim();
    if (!title || !url) return;
    music.push({
      title,
      artist: document.getElementById(`mu-artist-${n}`)?.value.trim() || "",
      url,
      autoplay: document.getElementById(`mu-auto-${n}`)?.checked ? 1 : 0,
      loop: document.getElementById(`mu-loop-${n}`)?.checked ? 1 : 0,
    });
  });
  return music;
}

function collectStories() {
  const stories = [];
  document.querySelectorAll("[id^='st-item-']").forEach((item) => {
    const n = item.id.replace("st-item-", "");
    const title = document.getElementById(`st-title-${n}`)?.value.trim();
    if (!title) return;
    stories.push({
      title,
      date: document.getElementById(`st-date-${n}`)?.value || "",
      content: document.getElementById(`st-content-${n}`)?.value.trim() || "",
    });
  });
  return stories;
}

function collectLive() {
  const lives = [];
  document.querySelectorAll("[id^='lv-item-']").forEach((item) => {
    const n = item.id.replace("lv-item-", "");
    const url = document.getElementById(`lv-url-${n}`)?.value.trim();
    if (!url) return;
    lives.push({
      title: document.getElementById(`lv-title-${n}`)?.value.trim() || "",
      url,
      start_time: document.getElementById(`lv-start-${n}`)?.value || "",
      end_time: document.getElementById(`lv-end-${n}`)?.value || "",
    });
  });
  return lives;
}

function collectEntertainment() {
  const list = [];
  document.querySelectorAll("[id^='en-item-']").forEach((item) => {
    const n = item.id.replace("en-item-", "");
    const name = document.getElementById(`en-name-${n}`)?.value.trim();
    if (!name) return;
    list.push({
      name,
      type: document.getElementById(`en-type-${n}`)?.value.trim() || "",
      description: document.getElementById(`en-desc-${n}`)?.value.trim() || "",
    });
  });
  return list;
}

function collectBanks() {
  const banks = [];
  document.querySelectorAll("[id^='bk-item-']").forEach((item) => {
    const n = item.id.replace("bk-item-", "");
    const accountName = document.getElementById(`bk-name-${n}`)?.value.trim();
    if (!accountName) return;
    banks.push({
      bank_name: document.getElementById(`bk-bank-${n}`)?.value.trim() || "",
      account_name: accountName,
      account_number: document.getElementById(`bk-number-${n}`)?.value.trim() || "",
    });
  });
  return banks;
}

// ═══════════════════════════════════════════════
// Build Review Summary Table
// ═══════════════════════════════════════════════
function buildReview() {
  const r = document.getElementById("review-content");
  if (!r) return;

  const th = ORDER.selectedTheme;
  const rows = [
    ["Tema", th ? `${esc(th.name)} <span style="color:var(--outline);font-size:0.8rem">(${esc(th.category || "")})</span>` : "<em>Belum dipilih</em>"],
    ["WhatsApp", esc(getV("o-phone"))],
    ["Slug URL", esc(getV("o-slug"))],
    ["Paket", esc(getV("o-package")) || "-"],
    ["Nama Pria", esc(getV("g-name"))],
    ["Ayah Pria", esc(getV("g-father"))],
    ["Ibu Pria", esc(getV("g-mother"))],
    ["Nama Wanita", esc(getV("b-name"))],
    ["Ayah Wanita", esc(getV("b-father"))],
    ["Ibu Wanita", esc(getV("b-mother"))],
    ["Catatan", esc(getV("o-notes")) || "-"],
  ];

  const events = collectEvents();
  const music = collectMusic();
  const stories = collectStories();
  const lives = collectLive();
  const entertainments = collectEntertainment();
  const banks = collectBanks();

  r.innerHTML = `
    <table class="review-table">
      <tbody>
        ${rows.map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`).join("")}
        <tr>
          <td>Foto Pria</td>
          <td>${ORDER.groomPhotoUrl ? `<img src="${esc(ORDER.groomPhotoUrl)}" style="height:60px;border-radius:8px">` : "<em>Belum diupload</em>"}</td>
        </tr>
        <tr>
          <td>Foto Wanita</td>
          <td>${ORDER.bridePhotoUrl ? `<img src="${esc(ORDER.bridePhotoUrl)}" style="height:60px;border-radius:8px">` : "<em>Belum diupload</em>"}</td>
        </tr>
        <tr>
          <td>Galeri</td>
          <td>${
            ORDER.galleryUrls.length
              ? ORDER.galleryUrls.map((u) => `<img src="${esc(u)}" style="height:50px;border-radius:6px;margin:2px">`).join("")
              : ORDER.galleryFiles.length
                ? `${ORDER.galleryFiles.length} foto dipilih (belum diupload)`
                : "<em>Tidak ada</em>"
          }</td>
        </tr>
        <tr>
          <td>Acara</td>
          <td>${events.length ? events.map((e) => `<b>${esc(e.name)}</b> — ${esc(e.venue_name || "-")}`).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Musik</td>
          <td>${music.length ? music.map((m) => `${esc(m.title)}${m.artist ? " - " + esc(m.artist) : ""}`).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Love Story</td>
          <td>${stories.length ? stories.map((s) => esc(s.title)).join(", ") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Live Streaming</td>
          <td>${lives.length ? lives.map((l) => esc(l.title || l.url)).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Hiburan</td>
          <td>${entertainments.length ? entertainments.map((e) => esc(e.name)).join(", ") : "<em>Tidak ada</em>"}</td>
        </tr>
        <tr>
          <td>Rekening Gift</td>
          <td>${banks.length ? banks.map((b) => `${esc(b.bank_name)} — ${esc(b.account_name)}`).join("<br>") : "<em>Tidak ada</em>"}</td>
        </tr>
      </tbody>
    </table>`;
}

// ═══════════════════════════════════════════════
// Submit Modal Controller
// ═══════════════════════════════════════════════
function updateSubmitModalStatus(step, message) {
  const modal = document.getElementById("order-processing-modal");
  const descEl = document.getElementById("modal-status-desc");
  if (descEl && message) {
    descEl.textContent = message;
  }

  const steps = ["upload", "db", "build"];
  const stepIdx = steps.indexOf(step);

  steps.forEach((s, idx) => {
    const el = document.getElementById(`step-status-${s}`);
    const icon = document.getElementById(`icon-status-${s}`);
    if (!el || !icon) return;

    if (idx < stepIdx) {
      el.className = "status-step-item done";
      icon.textContent = "check_circle";
    } else if (idx === stepIdx) {
      el.className = "status-step-item active";
      icon.textContent = s === "upload" ? "cloud_upload" : (s === "db" ? "sync" : "auto_fix_high");
    } else {
      el.className = "status-step-item";
      icon.textContent = s === "upload" ? "cloud_upload" : (s === "db" ? "database" : "auto_fix_high");
    }
  });
}

function openSubmitModal() {
  const modal = document.getElementById("order-processing-modal");
  if (modal && typeof modal.showModal === "function") {
    updateSubmitModalStatus("upload", "Mohon tunggu sebentar, sistem sedang memproses...");
    modal.showModal();
  }
}

function closeSubmitModal() {
  const modal = document.getElementById("order-processing-modal");
  if (modal && modal.open) {
    modal.close();
  }
}

// ═══════════════════════════════════════════════
// Submit Order Logic
// ═══════════════════════════════════════════════
async function submitOrder() {
  const btn = document.getElementById("btn-submit");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin-order 1s linear infinite;">progress_activity</span> Memproses...`;
  }

  // Buka modal status pemrosesan interaktif
  openSubmitModal();

  try {
    // 1. Upload galeri jika belum
    if (ORDER.galleryFiles && ORDER.galleryFiles.length && !ORDER.galleryUrls.length) {
      updateSubmitModalStatus("upload", `Sedang mengompresi & mengunggah ${ORDER.galleryFiles.length} foto galeri...`);
      toast("Mengompresi & mengunggah foto galeri...", "info");

      // Kompresi seluruh file galeri di client-side sebelum diunggah
      const compressedGalleryFiles = [];
      for (let i = 0; i < ORDER.galleryFiles.length; i++) {
        const comp = typeof compressImageFile === "function"
          ? await compressImageFile(ORDER.galleryFiles[i], 1600, 1600, 0.82)
          : ORDER.galleryFiles[i];
        compressedGalleryFiles.push(comp);
      }

      const gFolder = folderGallery() || `${getV("o-slug") || "misc"}/gallery`;
      ORDER.galleryUrls = await uploadMultiPublic(compressedGalleryFiles, gFolder, "galeri");
    } else {
      updateSubmitModalStatus("upload", "Foto mempelai dan berkas terverifikasi...");
    }

    await new Promise((r) => setTimeout(r, 400));

    // 2. Susun payload & simpan ke database
    updateSubmitModalStatus("db", "Menyimpan data mempelai, jadwal acara & amplop digital...");
    const payload = {
      theme_id: ORDER.selectedTheme?.id,
      phone: getV("o-phone"),
      slug: getV("o-slug"),
      package: getV("o-package") || null,
      notes: getV("o-notes") || null,
      groom: {
        full_name: getV("g-name"),
        nickname: getV("g-nick") || null,
        father: getV("g-father"),
        mother: getV("g-mother"),
        address: getV("g-address") || null,
        photo_url: ORDER.groomPhotoUrl || null,
      },
      bride: {
        full_name: getV("b-name"),
        nickname: getV("b-nick") || null,
        father: getV("b-father"),
        mother: getV("b-mother"),
        address: getV("b-address") || null,
        photo_url: ORDER.bridePhotoUrl || null,
      },
      gallery: ORDER.galleryUrls,
      events: collectEvents(),
      music: collectMusic(),
      love_stories: collectStories(),
      live_streamings: collectLive(),
      entertainments: collectEntertainment(),
      bank_accounts: collectBanks(),
    };

    // 3. Kirim ke API (backend otomatis melakukan kompilasi True Static Pre-rendering)
    updateSubmitModalStatus("build", "Melakukan pre-rendering tema & mengompilasi halaman statis...");
    const res = await apiPublic("POST", "/orders/public", payload);
    ORDER.orderId = res.order_id || null;
    ORDER.orderCode = res.order_code || "";
    ORDER.coupleId = res.couple_id || null;
    ORDER.eventYear = res.year || getEventYear();
    ORDER.invitationUrl = res.invitation_url || "";

    // Tandai selesai seluruh langkah
    const buildEl = document.getElementById("step-status-build");
    const buildIcon = document.getElementById("icon-status-build");
    if (buildEl && buildIcon) {
      buildEl.className = "status-step-item done";
      buildIcon.textContent = "check_circle";
    }
    updateSubmitModalStatus("build", "Kompilasi selesai! Membuka halaman sukses...");

    // Hapus draft tersimpan setelah pesanan berhasil terkirim
    localStorage.removeItem(DRAFT_KEY);

    await new Promise((r) => setTimeout(r, 500));
    closeSubmitModal();

    // 4. Tampilkan panel sukses
    showSuccess();
  } catch (e) {
    closeSubmitModal();
    toast("Gagal mengirim pesanan: " + e.message, "error");
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">send</span> Kirim &amp; Simpan Data Order`;
    }
  }
}

// ═══════════════════════════════════════════════
// Success Panel & WhatsApp Preview
// ═══════════════════════════════════════════════
function showSuccess() {
  document.querySelectorAll(".step-panel").forEach((p) => p.classList.remove("active"));

  const pbWrap = document.getElementById("progress-bar-wrap");
  if (pbWrap) pbWrap.style.display = "none";
  const stepInd = document.getElementById("step-indicators");
  if (stepInd) stepInd.style.display = "none";

  const panel = document.getElementById("panel-success");
  if (panel) {
    panel.classList.add("active");
    const codeEl = document.getElementById("success-order-code");
    if (codeEl) codeEl.textContent = ORDER.orderCode || "-";
    const slugEl = document.getElementById("success-slug");
    if (slugEl) slugEl.textContent = getV("o-slug");
    buildWaPreview();
  }
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function buildWaPreview() {
  const el = document.getElementById("wa-preview-text");
  if (!el) return;
  const code = ORDER.orderCode || "-";
  const slugVal = getV("o-slug");
  const groomName = getV("g-name");
  const brideName = getV("b-name");
  const theme = ORDER.selectedTheme?.name || "-";
  const phone = getV("o-phone");
  const invitationUrl = getInvitationUrl(slugVal);
  el.textContent =
    `Halo Admin Permata Wedding \n\n` +
    `Saya ingin konfirmasi pesanan undangan digital:\n` +
    `Kode Pesanan  : ${code}\n` +
    `Nama Pasangan : ${groomName} & ${brideName}\n` +
    `Tema          : ${theme}\n` +
    `Slug URL      : ${invitationUrl}\n` +
    `Nomor WA      : ${phone}\n\n` +
    `Mohon segera diproses. Terima kasih! `;
}

function shareToAdmin() {
  const code = ORDER.orderCode || "-";
  const slugVal = getV("o-slug");
  const groomName = getV("g-name");
  const brideName = getV("b-name");
  const theme = ORDER.selectedTheme?.name || "-";
  const phone = getV("o-phone");
  const invitationUrl = getInvitationUrl(slugVal);
  const msg = encodeURIComponent(
    `Halo Admin Permata Wedding \n\n` +
      `Saya ingin konfirmasi pesanan undangan digital:\n` +
      `Kode Pesanan  : *${code}*\n` +
      `Nama Pasangan : *${groomName} & ${brideName}*\n` +
      `Tema          : *${theme}*\n` +
      `Slug URL      : *${invitationUrl}*\n` +
      `Nomor WA      : *${phone}*\n\n` +
      `Mohon segera diproses. Terima kasih! `,
  );
  window.open(`https://wa.me/${WA_ADMIN}?text=${msg}`, "_blank");
}
