// ═══════════════════════════════════════════════
// STEPPER WIZARD & THEMES — Permata Wedding
// ═══════════════════════════════════════════════

function goStep(n) {
  if (n < 1 || n > TOTAL_STEPS) return;

  // Jika melompat maju, validasi langkah-langkah di antaranya
  if (n > currentStep) {
    for (let step = 1; step < n; step++) {
      const err = validateStep(step);
      if (err) {
        toast(`Langkah ${step}: ${err}`, "error");
        return;
      }
    }
  }

  if (n === 7 && typeof buildReview === "function") {
    buildReview();
  }

  document.querySelectorAll(".step-panel").forEach((p) => p.classList.remove("active"));
  const panel = document.getElementById(`panel-${n}`);
  if (panel) panel.classList.add("active");

  const fill = document.getElementById("progress-fill");
  if (fill) fill.style.width = (n / TOTAL_STEPS) * 100 + "%";

  for (let i = 1; i <= TOTAL_STEPS; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    if (!el) continue;
    el.classList.remove("active", "done");
    if (i < n) el.classList.add("done");
    else if (i === n) el.classList.add("active");
  }

  currentStep = n;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function validateStep(step) {
  if (step === 1 && !ORDER.selectedTheme) return "Pilih tema undangan terlebih dahulu";

  if (step === 2) {
    if (!getV("o-phone")) return "Nomor WhatsApp wajib diisi";
    if (!getV("o-slug")) return "Slug URL undangan wajib diisi";
    if (!/^[a-z0-9-]+$/.test(getV("o-slug"))) return "Slug hanya boleh huruf kecil, angka, dan tanda hubung";
    if (slugCheckState.checked && !slugCheckState.available) return "Slug URL sudah digunakan, silakan pilih slug lain";
    if (!getV("g-name")) return "Nama lengkap mempelai pria wajib diisi";
    if (!getV("g-father")) return "Nama ayah mempelai pria wajib diisi";
    if (!getV("g-mother")) return "Nama ibu mempelai pria wajib diisi";
    if (!getV("b-name")) return "Nama lengkap mempelai wanita wajib diisi";
    if (!getV("b-father")) return "Nama ayah mempelai wanita wajib diisi";
    if (!getV("b-mother")) return "Nama ibu mempelai wanita wajib diisi";
  }
  return null;
}

// ═══════════════════════════════════════════════
// Theme Selection & Filtering
// ═══════════════════════════════════════════════
function buildCategoryFilter(themes) {
  const select = document.getElementById("theme-cat-filter");
  if (!select) return;

  const categories = [...new Set(themes.map((t) => (t.category || "").trim().toLowerCase()).filter((c) => c !== ""))].sort();

  while (select.options.length > 1) {
    select.remove(1);
  }

  categories.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat.replace(/\b\w/g, (c) => c.toUpperCase());
    select.appendChild(opt);
  });
}

async function loadThemesPublic() {
  const grid = document.getElementById("theme-grid-public");
  try {
    const r = await apiPublic("GET", "/themes?limit=100");
    allThemes = Array.isArray(r) ? r : r.items || [];
    allThemes = allThemes.filter((t) => +t.is_active === 1);

    buildCategoryFilter(allThemes);
    renderThemesPublic(allThemes);
  } catch (e) {
    if (grid) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:#ba1a1a">
        Gagal memuat tema: ${esc(e.message)}
      </div>`;
    }
  }
}

function renderThemesPublic(list) {
  const grid = document.getElementById("theme-grid-public");
  if (!grid) return;
  if (!list.length) {
    grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:3rem;color:var(--outline)">
      Tidak ada tema tersedia.</div>`;
    return;
  }
  grid.innerHTML = list
    .map((t) => {
      let thumb = `${BASE_DOMAIN}/admin/assets/favicon.svg`;
      if (t.preview_img) {
        if (t.preview_img.startsWith("http")) {
          thumb = t.preview_img;
        } else {
          const cleanPath = t.preview_img.startsWith("/order-permata/")
            ? t.preview_img.substring("/order-permata".length)
            : (t.preview_img.startsWith("/") ? t.preview_img : "/" + t.preview_img);
          thumb = `${BASE_DOMAIN}${cleanPath}`;
        }
      }
      const isSelected = ORDER.selectedTheme?.id === t.id;
      return `
    <div class="theme-card ${isSelected ? "selected" : ""}"
         onclick="selectTheme(${JSON.stringify(t).replace(/"/g, "&quot;")})"
         id="theme-card-${t.id}">
      <div class="theme-thumb">
        <img src="${esc(thumb)}" alt="${esc(t.name)}" loading="lazy"
             onerror="this.src='${BASE_DOMAIN}/admin/assets/favicon.svg'">
        <div class="theme-check">✓</div>
      </div>
      <div class="theme-info">
        <div class="theme-name">${esc(t.name)}</div>
        <div class="theme-cat">${esc(t.category || "Atelier")}</div>
        ${
          t.preview_url
            ? `<a href="${esc(t.preview_url)}" target="_blank" rel="noopener"
               onclick="event.stopPropagation()"
               style="font-size:0.75rem;color:var(--primary);font-weight:600;
                      display:inline-flex;align-items:center;gap:0.2rem;margin-top:0.35rem">
               <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>
               Demo</a>`
            : ""
        }
      </div>
    </div>`;
    })
    .join("");
}

function selectTheme(t) {
  ORDER.selectedTheme = t;
  document.querySelectorAll(".theme-card").forEach((c) => c.classList.remove("selected"));
  const card = document.getElementById(`theme-card-${t.id}`);
  if (card) card.classList.add("selected");
  toast(`Tema "${t.name}" dipilih ✓`, "success");
  if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
}

function filterThemesPublic(q) {
  const cat = document.getElementById("theme-cat-filter")?.value || "";
  const query = (q || "").toLowerCase().trim();
  let list = allThemes;
  if (query) list = list.filter((t) => (t.name || "").toLowerCase().includes(query) || (t.category || "").toLowerCase().includes(query));
  if (cat) list = list.filter((t) => (t.category || "").toLowerCase() === cat.toLowerCase());
  renderThemesPublic(list);
}
