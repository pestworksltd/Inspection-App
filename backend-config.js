window.INSPECTION_BACKEND = {
  supabaseUrl: "https://ilarcelpromrtchulybh.supabase.co",
  supabaseAnonKey: "sb_publishable_jvlT2_i_kDc00L1wLbIWYQ_JYd45wHT",
};

(() => {
  const STORAGE_KEY = "inspectionApp.v3";
  const templates = {
    Entry: [
      ["entry-door", "Entry door closes, latches, and locks properly", "Doors / Hardware"],
      ["entry-hardware", "Door hardware, viewer, closer, and weatherstrip are secure", "Doors / Hardware"],
      ["entry-flooring", "Flooring is clean, complete, and free of trip hazards", "Finishes"],
      ["entry-walls", "Walls, ceiling, trim, and paint are acceptable", "Finishes"],
      ["entry-lighting", "Entry lighting and switches operate correctly", "Electrical"],
    ],
    Kitchen: [
      ["kitchen-sink", "Sink, faucet, drain, and supply lines are leak free", "Plumbing"],
      ["kitchen-cabinets", "Cabinets, drawers, doors, and hardware operate properly", "Millwork"],
      ["kitchen-counter", "Countertop, backsplash, and caulking are acceptable", "Finishes"],
      ["kitchen-appliances", "Appliances are installed and operating as expected", "Appliances"],
      ["kitchen-electrical", "GFCI, outlets, lighting, and switches operate correctly", "Electrical"],
      ["kitchen-finishes", "Flooring, walls, ceiling, and paint are acceptable", "Finishes"],
    ],
    Living: [
      ["living-flooring", "Flooring is complete and free of damage or trip hazards", "Flooring"],
      ["living-walls", "Walls, ceiling, trim, and paint are acceptable", "Finishes"],
      ["living-windows", "Windows, screens, locks, and coverings operate properly", "Windows"],
      ["living-electrical", "Outlets, switches, lighting, and smoke/CO devices are acceptable", "Electrical"],
      ["living-hvac", "Heating/cooling registers and controls are accessible and working", "HVAC"],
    ],
    Bedroom: [
      ["bedroom-door", "Door, latch, privacy hardware, and closet doors operate properly", "Doors / Hardware"],
      ["bedroom-flooring", "Flooring is complete and free of damage or trip hazards", "Flooring"],
      ["bedroom-walls", "Walls, ceiling, trim, and paint are acceptable", "Finishes"],
      ["bedroom-windows", "Windows, screens, locks, and egress are acceptable", "Windows"],
      ["bedroom-electrical", "Outlets, switches, lighting, and smoke/CO devices are acceptable", "Electrical"],
    ],
    Bathroom: [
      ["bathroom-sink", "Sink, faucet, drain, and vanity plumbing are leak free", "Plumbing"],
      ["bathroom-toilet", "Toilet is secure, flushing, and leak free", "Plumbing"],
      ["bathroom-tub", "Tub/shower, surround, caulking, and controls are acceptable", "Plumbing"],
      ["bathroom-vent", "Exhaust fan, lighting, and GFCI operate correctly", "Electrical"],
      ["bathroom-finishes", "Flooring, walls, ceiling, mirror, and accessories are acceptable", "Finishes"],
    ],
    Mechanical: [
      ["mechanical-panel", "Electrical panel access, labels, and cover are acceptable", "Electrical"],
      ["mechanical-hvac", "HVAC equipment, filters, and visible connections are acceptable", "HVAC"],
      ["mechanical-water", "Water heater, valves, and visible piping are leak free", "Plumbing"],
      ["mechanical-safety", "Smoke/CO devices and life safety items are present and working", "Life Safety"],
    ],
    Balcony: [
      ["balcony-door", "Balcony door, lock, screen, and threshold operate properly", "Doors / Hardware"],
      ["balcony-slab", "Balcony surface, drain, and slope are acceptable", "Exterior"],
      ["balcony-guard", "Guardrails, dividers, and handrails are secure", "Exterior"],
      ["balcony-exterior", "Exterior walls, ceiling, lighting, and outlets are acceptable", "Exterior"],
    ],
  };

  let activeRoom = "Entry";

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function activeUnit(state) {
    return (state.units || []).find((unit) => unit.id === state.activeUnitId);
  }

  function checklistRecords(state, unitId, room) {
    state.checklists ||= {};
    state.checklists[unitId] ||= {};
    state.checklists[unitId][room] ||= {};
    return state.checklists[unitId][room];
  }

  function setRoom(room) {
    if (!templates[room]) return;
    activeRoom = room;
    const roomInput = document.getElementById("roomInput");
    if (roomInput) roomInput.value = room;
    document.querySelectorAll("[data-room]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.room === room);
    });
    renderChecklist();
  }

  function ensurePanel() {
    if (document.getElementById("checklistList")) return true;
    const quickRow = document.querySelector(".quick-row");
    if (!quickRow) return false;
    quickRow.insertAdjacentHTML(
      "afterend",
      `<section class="checklist-panel" aria-labelledby="checklistLabel">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">Room Checklist</p>
            <h2 id="checklistLabel">Checklist</h2>
          </div>
          <span class="count-badge" id="checklistProgress">0 / 0</span>
        </div>
        <div class="checklist-list" id="checklistList"></div>
      </section>`,
    );
    return true;
  }

  function addStyles() {
    if (document.getElementById("checklistEnhancerStyles")) return;
    const style = document.createElement("style");
    style.id = "checklistEnhancerStyles";
    style.textContent = `
      .checklist-panel{display:grid;gap:0;overflow:hidden;background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);box-shadow:var(--shadow)}
      .checklist-list{display:grid;gap:10px;padding:0 16px 16px}
      .checklist-item{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(220px,.75fr);gap:12px;align-items:start;padding:13px;border:1px solid var(--line);border-radius:var(--radius);background:#fbfcfb}
      .checklist-item.is-pass{border-color:#9fd3c4;background:#f2fbf7}
      .checklist-item.is-issue{border-color:#e0a096;background:#fff7f5}
      .checklist-item.is-na{background:#f6f7f7}
      .checklist-item h3{margin:0 0 10px;font-size:.98rem;line-height:1.35}
      .checklist-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
      .checklist-actions button{min-height:40px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface);color:var(--muted);font-size:.82rem;font-weight:800}
      .checklist-actions button.is-selected{border-color:var(--accent);background:var(--accent-soft);color:var(--accent-strong)}
      .checklist-item.is-issue .checklist-actions button.is-selected{border-color:var(--danger);background:var(--danger-soft);color:var(--danger)}
      .checklist-note{display:grid;gap:6px;color:var(--muted);font-size:.78rem;font-weight:800}
      .checklist-note input{min-height:40px}
      .checklist-linked{margin:9px 0 0;color:var(--danger);font-size:.78rem;font-weight:800}
      @media(max-width:1100px){.checklist-item{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:720px){.checklist-item{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function renderChecklist() {
    if (!ensurePanel()) return;
    const state = readState();
    const unit = activeUnit(state);
    const list = document.getElementById("checklistList");
    const progress = document.getElementById("checklistProgress");
    if (!list || !progress || !unit) return;

    const items = templates[activeRoom] || templates.Entry;
    const records = checklistRecords(state, unit.id, activeRoom);
    const done = items.filter(([id]) => records[id]?.status).length;
    progress.textContent = `${done} / ${items.length}`;
    list.innerHTML = items
      .map(([id, label]) => {
        const record = records[id] || {};
        const status = record.status || "";
        return `<article class="checklist-item ${status ? `is-${status}` : ""}">
          <div>
            <h3>${escapeHtml(label)}</h3>
            <div class="checklist-actions" role="group" aria-label="${escapeHtml(label)}">
              <button class="${status === "pass" ? "is-selected" : ""}" type="button" data-checklist-id="${id}" data-checklist-status="pass">Pass</button>
              <button class="${status === "issue" ? "is-selected" : ""}" type="button" data-checklist-id="${id}" data-checklist-status="issue">Issue</button>
              <button class="${status === "na" ? "is-selected" : ""}" type="button" data-checklist-id="${id}" data-checklist-status="na">N/A</button>
            </div>
            ${record.deficiencyCreated ? `<p class="checklist-linked">Added to deficiency list</p>` : ""}
          </div>
          <label class="checklist-note">
            Note
            <input type="text" value="${escapeHtml(record.note || "")}" data-checklist-note="${id}" placeholder="Optional room note" />
          </label>
        </article>`;
      })
      .join("");
  }

  function createDeficiencyFromChecklist(room, item, note) {
    const form = document.getElementById("deficiencyForm");
    if (!form) return;
    const [, label, category] = item;
    const fields = {
      roomInput: room,
      categoryInput: category || "General",
      locationInput: label,
      severityInput: "Medium",
      descriptionInput: `${label} requires attention.`,
      tradeInput: category || "",
      statusInput: "Open",
      photosInput: "",
      dueDateInput: "",
      loggedByInput: document.getElementById("inspectorInput")?.value || "",
      notesInput: note || "",
    };
    Object.entries(fields).forEach(([id, value]) => {
      const input = document.getElementById(id);
      if (input) input.value = value;
    });
    form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
  }

  function setChecklistStatus(itemId, status) {
    const state = readState();
    const unit = activeUnit(state);
    if (!unit) return;
    const items = templates[activeRoom] || templates.Entry;
    const item = items.find(([id]) => id === itemId);
    if (!item) return;
    const records = checklistRecords(state, unit.id, activeRoom);
    const record = records[itemId] || {};
    record.status = status;
    record.updatedAt = new Date().toISOString();
    records[itemId] = record;
    writeState(state);

    if (status === "issue" && !record.deficiencyCreated) {
      createDeficiencyFromChecklist(activeRoom, item, record.note || "");
      const refreshed = readState();
      const refreshedRecords = checklistRecords(refreshed, unit.id, activeRoom);
      refreshedRecords[itemId] = {
        ...(refreshedRecords[itemId] || {}),
        status: "issue",
        note: record.note || "",
        deficiencyCreated: true,
        updatedAt: new Date().toISOString(),
      };
      writeState(refreshed);
    }

    renderChecklist();
  }

  function updateChecklistNote(itemId, note) {
    const state = readState();
    const unit = activeUnit(state);
    if (!unit) return;
    const records = checklistRecords(state, unit.id, activeRoom);
    records[itemId] = {
      ...(records[itemId] || {}),
      note,
      updatedAt: new Date().toISOString(),
    };
    writeState(state);
  }

  function init() {
    if (document.getElementById("checklistList")) return;
    addStyles();
    ensurePanel();
    document.querySelectorAll("[data-room]").forEach((button) => {
      button.addEventListener("click", () => setRoom(button.dataset.room));
    });
    document.addEventListener("click", (event) => {
      const button = event.target.closest("[data-checklist-status]");
      if (!button) return;
      setChecklistStatus(button.dataset.checklistId, button.dataset.checklistStatus);
    });
    document.addEventListener("input", (event) => {
      const input = event.target.closest("[data-checklist-note]");
      if (!input) return;
      updateChecklistNote(input.dataset.checklistNote, input.value);
    });
    setRoom(document.getElementById("roomInput")?.value || "Entry");
    setInterval(renderChecklist, 1000);
  }

  window.addEventListener("DOMContentLoaded", () => setTimeout(init, 0));
})();