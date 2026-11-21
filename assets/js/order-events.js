// ═══════════════════════════════════════════════
// EVENTS MANAGEMENT — Permata Wedding
// ═══════════════════════════════════════════════

let eventCount = 0;

const STANDARD_EVENT_NAMES = [
  "Akad Nikah",
  "Resepsi Pernikahan",
  "Pemberkatan",
  "Ngunduh Mantu",
  "Walimatul 'Ursy",
  "Siraman & Pengajian",
  "Lainnya"
];

function getTimeOptionsHtml(selectedVal = "", placeholder = "Pilih Jam") {
  let html = `<option value="">${placeholder}</option>`;
  for (let h = 6; h <= 23; h++) {
    for (let m = 0; m < 60; m += 30) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      const timeStr = `${hh}:${mm}`;
      const isSel = timeStr === selectedVal ? " selected" : "";
      html += `<option value="${timeStr}"${isSel}>${timeStr} WIB</option>`;
    }
  }
  return html;
}

function handleEventNameChange(n) {
  const sel = document.getElementById(`ev-name-select-${n}`);
  const customInput = document.getElementById(`ev-name-custom-${n}`);
  if (!sel || !customInput) return;
  if (sel.value === "Lainnya") {
    customInput.style.display = "block";
    customInput.focus();
  } else {
    customInput.style.display = "none";
    customInput.value = "";
  }
  syncEventNameValue(n);
  if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
}

function syncEventNameValue(n) {
  const sel = document.getElementById(`ev-name-select-${n}`);
  const customInput = document.getElementById(`ev-name-custom-${n}`);
  const hiddenInput = document.getElementById(`ev-name-${n}`);
  if (!hiddenInput) return;
  if (sel && sel.value === "Lainnya") {
    hiddenInput.value = customInput ? customInput.value.trim() : "";
  } else if (sel) {
    hiddenInput.value = sel.value;
  }
}

function setEventNameValue(n, val) {
  const sel = document.getElementById(`ev-name-select-${n}`);
  const customInput = document.getElementById(`ev-name-custom-${n}`);
  const hiddenInput = document.getElementById(`ev-name-${n}`);
  if (!sel || !hiddenInput) return;

  if (STANDARD_EVENT_NAMES.includes(val) && val !== "Lainnya") {
    sel.value = val;
    if (customInput) {
      customInput.style.display = "none";
      customInput.value = "";
    }
  } else if (val) {
    sel.value = "Lainnya";
    if (customInput) {
      customInput.style.display = "block";
      customInput.value = val;
    }
  }
  hiddenInput.value = val || "";
}

function toggleUntilDone(n) {
  const checkbox = document.getElementById(`ev-until-done-${n}`);
  const timeSelect = document.getElementById(`ev-time-end-${n}`);
  if (checkbox && timeSelect) {
    if (checkbox.checked) {
      timeSelect.value = "";
      timeSelect.disabled = true;
    } else {
      timeSelect.disabled = false;
    }
    syncEventDateTime(n);
    if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
  }
}

function copyLocationFromFirstEvent(n) {
  if (n <= 1) return;
  const venue1 = document.getElementById("ev-venue-1")?.value || "";
  const maps1  = document.getElementById("ev-maps-1")?.value || "";
  const addr1  = document.getElementById("ev-addr-1")?.value || "";

  const venueN = document.getElementById(`ev-venue-${n}`);
  const mapsN  = document.getElementById(`ev-maps-${n}`);
  const addrN  = document.getElementById(`ev-addr-${n}`);

  if (venueN) venueN.value = venue1;
  if (mapsN) mapsN.value = maps1;
  if (addrN) addrN.value = addr1;

  toast(`Lokasi berhasil disalin dari Acara 1!`, "success");
  if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
}

function copyAddressFromPerson(n, personType) {
  const sourceId = personType === "groom" ? "g-address" : "b-address";
  const label = personType === "groom" ? "Mempelai Pria" : "Mempelai Wanita";
  const sourceAddr = document.getElementById(sourceId)?.value.trim() || "";

  if (!sourceAddr) {
    toast(`Alamat ${label} masih kosong di Langkah 2!`, "warning");
    return;
  }

  const targetAddr = document.getElementById(`ev-addr-${n}`);
  if (targetAddr) {
    targetAddr.value = sourceAddr;
    toast(`Alamat disalin dari Alamat ${label}!`, "success");
    if (typeof triggerAutoDraftSave === "function") triggerAutoDraftSave();
  }
}

function syncEventDateTime(n) {
  const dateVal = document.getElementById(`ev-date-${n}`)?.value;
  const timeStartVal = document.getElementById(`ev-time-start-${n}`)?.value;
  const timeEndVal = document.getElementById(`ev-time-end-${n}`)?.value;
  const untilDone = document.getElementById(`ev-until-done-${n}`)?.checked;

  const hiddenStart = document.getElementById(`ev-start-${n}`);
  const hiddenEnd   = document.getElementById(`ev-end-${n}`);

  if (hiddenStart) {
    hiddenStart.value = (dateVal && timeStartVal) ? `${dateVal}T${timeStartVal}` : (dateVal ? `${dateVal}T08:00` : "");
  }

  if (hiddenEnd) {
    if (untilDone) {
      hiddenEnd.value = ""; // S/d Selesai
    } else if (dateVal && timeEndVal) {
      hiddenEnd.value = `${dateVal}T${timeEndVal}`;
    } else {
      hiddenEnd.value = "";
    }
  }
}

function addEvent() {
  const n = ++eventCount;
  const el = document.createElement("div");
  el.className = "dynamic-item";
  el.id = `ev-item-${n}`;

  // Default nama acara
  const defaultEventName = n === 1 ? "Akad Nikah" : (n === 2 ? "Resepsi Pernikahan" : "Lainnya");
  const defaultStartTime = n === 1 ? "08:00" : (n === 2 ? "11:00" : "09:00");
  const defaultEndTime = n === 1 ? "11:00" : (n === 2 ? "14:00" : "12:00");

  el.innerHTML = `
    <button type="button" class="remove-btn" onclick="removeItem('ev-item-${n}')">×</button>
    <div style="font-weight:700;font-size:0.875rem;margin-bottom:0.75rem;color:var(--primary)">Sesi Acara ${n}</div>
    
    <div class="form-grid">
      <div class="form-group span-full">
        <label>Nama Acara <span class="req">*</span></label>
        <select id="ev-name-select-${n}" onchange="handleEventNameChange(${n})">
          <option value="Akad Nikah"${defaultEventName === "Akad Nikah" ? " selected" : ""}>Akad Nikah</option>
          <option value="Resepsi Pernikahan"${defaultEventName === "Resepsi Pernikahan" ? " selected" : ""}>Resepsi Pernikahan</option>
          <option value="Pemberkatan">Pemberkatan</option>
          <option value="Ngunduh Mantu">Ngunduh Mantu</option>
          <option value="Walimatul 'Ursy">Walimatul 'Ursy</option>
          <option value="Siraman &amp; Pengajian">Siraman &amp; Pengajian</option>
          <option value="Lainnya"${defaultEventName === "Lainnya" ? " selected" : ""}>Lainnya (Tulis Kustom)</option>
        </select>
        <input type="text" id="ev-name-custom-${n}" placeholder="Tulis nama acara kustom..." style="display:${defaultEventName === "Lainnya" ? "block" : "none"}; margin-top:0.4rem;" oninput="syncEventNameValue(${n}); if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave();" />
        <input type="hidden" id="ev-name-${n}" value="${defaultEventName}" />
      </div>

      <div class="form-group span-full">
        <label>Tanggal Acara <span class="req">*</span></label>
        <input id="ev-date-${n}" type="date" onchange="syncEventDateTime(${n}); if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave();" />
      </div>

      <div class="form-group">
        <label>Jam Mulai <span class="req">*</span></label>
        <select id="ev-time-start-${n}" onchange="syncEventDateTime(${n}); if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave();">
          ${getTimeOptionsHtml(defaultStartTime, "Pilih Jam Mulai")}
        </select>
        <input id="ev-start-${n}" type="hidden" />
      </div>

      <div class="form-group">
        <label>Jam Selesai</label>
        <select id="ev-time-end-${n}" onchange="syncEventDateTime(${n}); if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave();">
          ${getTimeOptionsHtml(defaultEndTime, "Pilih Jam Selesai")}
        </select>
        <div style="margin-top: 0.35rem;">
          <label class="checkbox-pill-label">
            <input type="checkbox" id="ev-until-done-${n}" onchange="toggleUntilDone(${n})" />
            <span>Sampai Selesai (s/d selesai)</span>
          </label>
        </div>
        <input id="ev-end-${n}" type="hidden" />
      </div>

      ${
        n > 1
          ? `
      <div class="form-group span-full">
        <button type="button" class="btn-copy-location" onclick="copyLocationFromFirstEvent(${n})">
          <span class="material-symbols-outlined" style="font-size:1.1rem;">content_copy</span>
          <span>Salin Lokasi &amp; Alamat dari Acara 1</span>
        </button>
      </div>`
          : ""
      }

      <div class="form-group">
        <label>Lokasi / Nama Tempat</label>
        <input type="text" id="ev-venue-${n}" placeholder="Gedung / Hotel / Masjid / Kediaman" oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group">
        <label>Google Maps URL</label>
        <input type="text" id="ev-maps-${n}" placeholder="https://maps.app.goo.gl/..." oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()" />
      </div>
      <div class="form-group span-full">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:0.25rem;">
          <label style="margin:0;">Alamat Lengkap</label>
          <div style="display:flex;gap:0.35rem;flex-wrap:wrap;">
            <button type="button" class="btn-copy-mini" onclick="copyAddressFromPerson(${n}, 'groom')">
              <span class="material-symbols-outlined" style="font-size:0.9rem;">person</span>
              <span>Alamat Pria</span>
            </button>
            <button type="button" class="btn-copy-mini" onclick="copyAddressFromPerson(${n}, 'bride')">
              <span class="material-symbols-outlined" style="font-size:0.9rem;">person_3</span>
              <span>Alamat Wanita</span>
            </button>
          </div>
        </div>
        <textarea id="ev-addr-${n}" placeholder="Alamat lengkap lokasi acara..." oninput="if(typeof triggerAutoDraftSave==='function') triggerAutoDraftSave()"></textarea>
      </div>
    </div>`;

  const list = document.getElementById("events-list");
  if (list) list.appendChild(el);

  // Sync initial datetime & name
  syncEventNameValue(n);
  syncEventDateTime(n);
}
