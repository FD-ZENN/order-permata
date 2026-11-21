// ═══════════════════════════════════════════════
// LOCALSTORAGE AUTO-DRAFT — Permata Wedding
// ═══════════════════════════════════════════════

const DRAFT_KEY = "permata_order_form_draft_v1";
let draftSaveTimer = null;

function triggerAutoDraftSave() {
  clearTimeout(draftSaveTimer);
  draftSaveTimer = setTimeout(saveOrderDraft, 600);
}

function saveOrderDraft() {
  try {
    const draft = {
      timestamp: Date.now(),
      theme_id: ORDER.selectedTheme?.id || null,
      theme_name: ORDER.selectedTheme?.name || null,
      package: getV("o-package") || null,
      phone: getV("o-phone"),
      slug: getV("o-slug"),
      notes: getV("o-notes"),
      groom: {
        name: getV("g-name"),
        nick: getV("g-nick"),
        father: getV("g-father"),
        mother: getV("g-mother"),
        address: getV("g-address"),
        photo: ORDER.groomPhotoUrl || "",
      },
      bride: {
        name: getV("b-name"),
        nick: getV("b-nick"),
        father: getV("b-father"),
        mother: getV("b-mother"),
        address: getV("b-address"),
        photo: ORDER.bridePhotoUrl || "",
      },
      events: typeof collectEvents === "function" ? collectEvents() : [],
      stories: typeof collectStories === "function" ? collectStories() : [],
      lives: typeof collectLive === "function" ? collectLive() : [],
      entertainments: typeof collectEntertainment === "function" ? collectEntertainment() : [],
      banks: typeof collectBanks === "function" ? collectBanks() : [],
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn("Gagal menyimpan auto-draft:", err);
  }
}

function checkSavedDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);
    if (draft && (draft.slug || draft.groom?.name || draft.bride?.name || draft.phone)) {
      const banner = document.getElementById("draft-restore-banner");
      if (banner) banner.style.display = "flex";
    }
  } catch (err) {
    console.warn("Gagal mengecek draft tersimpan:", err);
  }
}

function restoreDraftData() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    const draft = JSON.parse(raw);

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el && val !== undefined && val !== null) el.value = val;
    };

    setVal("o-phone", draft.phone);
    setVal("o-slug", draft.slug);
    setVal("o-package", draft.package);
    setVal("o-notes", draft.notes);

    if (draft.groom) {
      setVal("g-name", draft.groom.name);
      setVal("g-nick", draft.groom.nick);
      setVal("g-father", draft.groom.father);
      setVal("g-mother", draft.groom.mother);
      setVal("g-address", draft.groom.address);
      if (draft.groom.photo) {
        ORDER.groomPhotoUrl = draft.groom.photo;
        const img = document.getElementById("groom-photo-preview");
        if (img) { img.src = draft.groom.photo; img.style.display = "block"; }
      }
    }

    if (draft.bride) {
      setVal("b-name", draft.bride.name);
      setVal("b-nick", draft.bride.nick);
      setVal("b-father", draft.bride.father);
      setVal("b-mother", draft.bride.mother);
      setVal("b-address", draft.bride.address);
      if (draft.bride.photo) {
        ORDER.bridePhotoUrl = draft.bride.photo;
        const img = document.getElementById("bride-photo-preview");
        if (img) { img.src = draft.bride.photo; img.style.display = "block"; }
      }
    }

    // Restore Events
    if (Array.isArray(draft.events) && draft.events.length > 0) {
      const evList = document.getElementById("events-list");
      if (evList) evList.innerHTML = "";
      eventCount = 0;
      draft.events.forEach((ev) => {
        addEvent();
        const n = eventCount;
        setEventNameValue(n, ev.name);
        setVal(`ev-venue-${n}`, ev.venue_name);
        setVal(`ev-maps-${n}`, ev.maps_url);
        setVal(`ev-addr-${n}`, ev.address);
        if (ev.start_time) {
          const parts = ev.start_time.split("T");
          setVal(`ev-date-${n}`, parts[0]);
          if (parts[1]) setVal(`ev-time-start-${n}`, parts[1].substring(0, 5));
        }
        if (ev.end_time) {
          const parts = ev.end_time.split("T");
          if (parts[1]) setVal(`ev-time-end-${n}`, parts[1].substring(0, 5));
        } else {
          const cb = document.getElementById(`ev-until-done-${n}`);
          if (cb) { cb.checked = true; toggleUntilDone(n); }
        }
        syncEventDateTime(n);
      });
    }

    // Restore Stories
    if (Array.isArray(draft.stories) && draft.stories.length > 0) {
      const stList = document.getElementById("stories-list");
      if (stList) stList.innerHTML = "";
      storyCount = 0;
      draft.stories.forEach((st) => {
        addStory();
        const n = storyCount;
        setStoryTitleValue(n, st.title);
        setVal(`st-date-${n}`, st.date);
        setVal(`st-content-${n}`, st.content);
      });
    }

    // Restore Banks
    if (Array.isArray(draft.banks) && draft.banks.length > 0) {
      const bkList = document.getElementById("bank-list");
      if (bkList) bkList.innerHTML = "";
      bankCount = 0;
      draft.banks.forEach((bk) => {
        addBank();
        const n = bankCount;
        setVal(`bk-bank-${n}`, bk.bank_name);
        setVal(`bk-name-${n}`, bk.account_name);
        setVal(`bk-number-${n}`, bk.account_number);
      });
    }

    discardDraftBanner();
    toast("Data pesanan berhasil dipulihkan dari draf!", "success");
    goStep(2);
  } catch (err) {
    console.error("Gagal memulihkan draf:", err);
    toast("Gagal memulihkan draf", "error");
  }
}

function discardDraftBanner() {
  const banner = document.getElementById("draft-restore-banner");
  if (banner) banner.style.display = "none";
}

function discardDraftData() {
  localStorage.removeItem(DRAFT_KEY);
  discardDraftBanner();
  toast("Draf lama dibersihkan. Memulai pesanan baru.", "info");
}
