const STORAGE_KEY = "inspectionApp.v2";
const BACKEND_CONFIG = window.INSPECTION_BACKEND || {};

const $ = (id) => document.getElementById(id);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const today = () => new Date().toISOString().slice(0, 10);
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const els = {
  title: $("projectTitle"), name: $("projectNameInput"), address: $("projectAddressInput"), inspector: $("inspectorInput"), date: $("inspectionDateInput"),
  total: $("totalUnits"), complete: $("completeUnits"), open: $("openDeficiencies"), high: $("highDeficiencies"),
  tabs: $$(".tab-button"), panels: $$(".view-panel"), unitList: $("unitList"), unitSearch: $("unitSearchInput"), sort: $("sortUnitsBtn"),
  empty: $("emptyInspectionState"), activePanel: $("activeUnitPanel"), activeName: $("activeUnitName"), activeStatus: $("activeUnitStatus"),
  prev: $("prevUnitBtn"), next: $("nextUnitBtn"), noAccess: $("noAccessBtn"), completeUnit: $("completeUnitBtn"), continueNext: $("continueNextBtn"),
  form: $("deficiencyForm"), editing: $("editingId"), room: $("roomInput"), category: $("categoryInput"), location: $("locationInput"), severity: $("severityInput"), description: $("descriptionInput"), trade: $("tradeInput"), status: $("statusInput"), photos: $("photosInput"), due: $("dueDateInput"), loggedBy: $("loggedByInput"), notes: $("notesInput"), clearForm: $("clearFormBtn"), formLabel: $("deficiencyFormLabel"), saveDef: $("saveDeficiencyBtn"),
  unitDefCount: $("unitDeficiencyCount"), unitDefList: $("unitDeficiencyList"), unitNotes: $("unitNotesInput"),
  masterSearch: $("masterSearchInput"), filterStatus: $("filterStatusInput"), filterSeverity: $("filterSeverityInput"), filterUnitStatus: $("filterUnitStatusInput"), masterSummary: $("masterSummary"), masterBody: $("masterTableBody"),
  generator: $("unitGeneratorForm"), prefix: $("unitPrefixInput"), floorStart: $("floorStartInput"), floorEnd: $("floorEndInput"), suites: $("suitesPerFloorInput"), suiteStart: $("suiteStartInput"), digits: $("suiteDigitsInput"), paste: $("pasteUnitsInput"), addPasted: $("addPastedUnitsBtn"), clearUnits: $("clearUnitsBtn"), loadSample: $("loadSampleBtn"),
  team: $("teamMembersInput"), teamOptions: $("teamOptions"), saveTeam: $("saveTeamBtn"),
  contactId: $("portalContactIdInput"), contactName: $("portalContactNameInput"), contactEmail: $("portalEmailInput"), contactAccount: $("portalAccountInput"), saveContact: $("savePortalContactBtn"), clearContact: $("clearPortalContactBtn"), contactList: $("portalContactList"),
  backendStatus: $("backendStatus"), saveState: $("saveStateIndicator"), importJson: $("importJsonInput"), print: $("printBtn"),
  portalRequest: $("portalRequestForm"), portalEmail: $("portalLoginEmailInput"), portalAccount: $("portalLoginAccountInput"), portalCodeForm: $("portalCodeForm"), portalCode: $("portalCodeInput"), portalMessage: $("portalMessage"), portalLogin: $("portalLoginPanel"), portalDash: $("portalDashboard"), portalBuilding: $("portalBuildingName"), portalLine: $("portalAccountLine"), portalSummary: $("portalReportSummary"), portalBody: $("portalTableBody"), portalExport: $("portalExportCsvBtn"), portalOut: $("portalSignOutBtn"),
};

const blank = () => ({
  project: { name: "Building Inspection", address: "", currentUser: "", inspectionDate: today(), accountNumber: "100" },
  users: [], contacts: [], units: [], deficiencies: [], activeUnitId: null, activeView: "inspect", asc: true,
  portal: { pendingEmail: "", pendingAccount: "", code: "", expires: "", signedIn: false, sessionToken: "", report: null },
  filters: { search: "", status: "", severity: "", unitStatus: "" },
});

let state = load();
const backend = createBackend(BACKEND_CONFIG);

function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalize(data || blank());
  } catch { return blank(); }
}
function normalize(data) {
  const next = { ...blank(), ...data, project: { ...blank().project, ...(data.project || {}) }, portal: { ...blank().portal, ...(data.portal || {}) }, filters: { ...blank().filters, ...(data.filters || {}) } };
  next.contacts = data.contacts || data.portalContacts || [];
  if (!next.contacts.length) next.contacts = [{ id: uid(), name: "Trial Property Manager", email: "davedufresne121@gmail.com", accountNumber: "100", status: "active" }];
  if (!next.units.some((unit) => unit.id === next.activeUnitId)) next.activeUnitId = next.units[0]?.id || null;
  return next;
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  if (els.saveState) els.saveState.textContent = `Saved locally at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`;
}

function createBackend(config) {
  const url = String(config.supabaseUrl || "").replace(/\/$/, "");
  const key = String(config.supabaseAnonKey || "");
  async function call(name, body, token) {
    const res = await fetch(`${url}/functions/v1/${name}`, { method: "POST", headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${token || key}` }, body: JSON.stringify(body || {}) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Request failed.");
    return data;
  }
  return { ready: () => Boolean(url && key), request: (email, accountNumber) => call("request-portal-code", { email, accountNumber }), verify: (email, accountNumber, code) => call("verify-portal-code", { email, accountNumber, code }), report: (token) => call("portal-report", {}, token) };
}

function render() { renderProject(); renderStats(); renderTabs(); renderUnits(); renderActive(); renderMaster(); renderTeam(); renderContacts(); renderPortal(); }
function renderProject() {
  els.title.textContent = state.project.name || "Building Inspection";
  if (document.activeElement !== els.name) els.name.value = state.project.name || "";
  if (document.activeElement !== els.address) els.address.value = state.project.address || "";
  if (document.activeElement !== els.inspector) els.inspector.value = state.project.currentUser || "";
  els.date.value = state.project.inspectionDate || today();
  els.backendStatus.textContent = backend.ready() ? "Backend configured. Portal codes and reports use the live backend." : "Backend not configured. Portal runs in local demo mode.";
}
function renderStats() {
  els.total.textContent = state.units.length;
  els.complete.textContent = state.units.filter((u) => u.status === "complete").length;
  els.open.textContent = state.deficiencies.filter((d) => d.status !== "Closed").length;
  els.high.textContent = state.deficiencies.filter((d) => ["High", "Critical"].includes(d.severity) && d.status !== "Closed").length;
  els.continueNext.disabled = !nextUnit();
}
function renderTabs() { els.tabs.forEach((b) => b.classList.toggle("is-active", b.dataset.view === state.activeView)); els.panels.forEach((p) => p.classList.toggle("is-active", p.id === `${state.activeView}View`)); }
function orderedUnits() { return [...state.units].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true })).reverseIf(!state.asc); }
Array.prototype.reverseIf = function (yes) { return yes ? this.reverse() : this; };
function renderUnits() {
  els.sort.textContent = state.asc ? "A-Z" : "Z-A";
  const search = els.unitSearch.value.trim().toLowerCase();
  const units = orderedUnits().filter((u) => u.label.toLowerCase().includes(search));
  els.unitList.innerHTML = units.length ? units.map((u) => `<button class="unit-card ${u.id === state.activeUnitId ? "is-active" : ""}" data-unit-id="${u.id}" type="button"><span><strong>${esc(u.label)}</strong><small>${label(u.status)}${openFor(u.id) ? ` - ${openFor(u.id)} open` : ""}</small></span><span class="status-dot ${u.status}"></span></button>`).join("") : `<div class="inline-empty">No records yet.</div>`;
}
function renderActive() {
  const unit = activeUnit();
  els.empty.hidden = state.units.length > 0; els.activePanel.hidden = !state.units.length;
  if (!unit) return;
  els.activeName.textContent = unit.label; els.activeStatus.textContent = label(unit.status); els.activeStatus.className = `status-pill ${unit.status}`; els.unitNotes.value = unit.notes || "";
  const units = orderedUnits(); const index = units.findIndex((u) => u.id === unit.id); els.prev.disabled = index <= 0; els.next.disabled = index >= units.length - 1;
  const defs = state.deficiencies.filter((d) => d.unitId === unit.id);
  els.unitDefCount.textContent = defs.length;
  els.unitDefList.innerHTML = defs.length ? defs.map(defCard).join("") : `<div class="inline-empty">No deficiencies for this unit.</div>`;
}
function defCard(d) { return `<article class="deficiency-card"><div><h3>${esc(d.room || "General")} - ${esc(d.category)}</h3><p>${esc(d.description)}</p><div class="meta-row"><span class="severity-badge ${d.severity}">${d.severity}</span><span>${d.status}</span><span>${esc(d.trade || "Unassigned")}</span><span>${esc(d.loggedBy || "")}</span></div></div><div class="card-actions"><button class="small-button" data-action="edit" data-id="${d.id}">Edit</button><button class="small-button" data-action="close" data-id="${d.id}">Close</button><button class="small-button" data-action="delete" data-id="${d.id}">Delete</button></div></article>`; }
function renderMaster() {
  const rows = filtered();
  const summary = { total: rows.length, open: rows.filter((d) => d.status !== "Closed").length, high: rows.filter((d) => ["High", "Critical"].includes(d.severity)).length, units: new Set(rows.map((d) => d.unitId)).size };
  els.masterSummary.innerHTML = Object.entries(summary).map(([k, v]) => `<div class="summary-chip"><span>${k}</span><strong>${v}</strong></div>`).join("");
  els.masterBody.innerHTML = rows.length ? rows.map((d) => { const u = byId(d.unitId); return `<tr><td>${esc(u?.label || "")}</td><td>${esc(d.room)}</td><td>${esc(d.category)}</td><td>${esc(d.description)}<div class="table-note">${esc(d.location || "")}</div></td><td>${d.severity}</td><td>${d.status}</td><td>${esc(d.trade)}</td><td>${esc(d.loggedBy)}</td><td>${esc(d.photos)}</td><td>${esc(d.dueDate)}</td></tr>`; }).join("") : `<tr><td colspan="10">No records yet.</td></tr>`;
}
function renderTeam() { els.team.value = state.users.join("\n"); els.teamOptions.innerHTML = state.users.map((u) => `<option value="${esc(u)}"></option>`).join(""); }
function renderContacts() { els.contactList.innerHTML = state.contacts.length ? state.contacts.map((c) => `<article class="portal-contact-card"><div><strong>${esc(c.name || "Property Manager")}</strong><span>${esc(c.email)} - Account ${esc(c.accountNumber)}</span></div><div class="card-actions"><button class="small-button" data-portal-action="edit" data-id="${c.id}">Edit</button><button class="small-button" data-portal-action="remove" data-id="${c.id}">Remove</button></div></article>`).join("") : `<div class="inline-empty">No portal contacts yet.</div>`; }
function renderPortal() {
  els.portalCodeForm.hidden = !state.portal.code && !state.portal.pendingEmail;
  els.portalLogin.hidden = state.portal.signedIn; els.portalDash.hidden = !state.portal.signedIn;
  if (!state.portal.signedIn) return;
  const report = state.portal.report;
  const rows = report?.deficiencies || state.deficiencies.map((d) => ({ ...d, unit_label: byId(d.unitId)?.label || "" }));
  els.portalBuilding.textContent = report?.building?.name || state.project.name;
  els.portalLine.textContent = `Account ${state.portal.pendingAccount || state.project.accountNumber}`;
  els.portalSummary.innerHTML = `<div class="summary-chip"><span>Open</span><strong>${rows.filter((d) => d.status !== "Closed").length}</strong></div><div class="summary-chip"><span>Total</span><strong>${rows.length}</strong></div>`;
  els.portalBody.innerHTML = rows.length ? rows.map((d) => `<tr><td>${esc(d.unit_label || byId(d.unitId)?.label || "")}</td><td>${esc(d.room)}</td><td>${esc(d.category)}</td><td>${esc(d.description)}</td><td>${d.severity}</td><td>${d.status}</td><td>${esc(d.trade || d.trade_owner || "")}</td><td>${esc(d.logged_by || d.loggedBy || "")}</td><td>${esc(d.photo_refs || d.photos || "")}</td></tr>`).join("") : `<tr><td colspan="9">No records yet.</td></tr>`;
}

function wire() {
  els.name.oninput = () => { state.project.name = els.name.value.trim() || "Building Inspection"; save(); renderProject(); };
  els.address.oninput = () => { state.project.address = els.address.value.trim(); save(); };
  els.inspector.oninput = () => { state.project.currentUser = els.inspector.value.trim(); addUser(state.project.currentUser); save(); renderTeam(); };
  els.date.onchange = () => { state.project.inspectionDate = els.date.value; save(); };
  els.tabs.forEach((b) => b.onclick = () => { state.activeView = b.dataset.view; save(); renderTabs(); });
  $$('[data-jump-view]').forEach((b) => b.onclick = () => { state.activeView = b.dataset.jumpView; render(); });
  els.unitList.onclick = (e) => { const card = e.target.closest("[data-unit-id]"); if (card) { state.activeUnitId = card.dataset.unitId; if (activeUnit().status === "not-started") activeUnit().status = "in-progress"; save(); render(); } };
  els.sort.onclick = () => { state.asc = !state.asc; save(); renderUnits(); };
  els.unitSearch.oninput = renderUnits; els.prev.onclick = () => move(-1); els.next.onclick = () => move(1); els.continueNext.onclick = () => { const u = nextUnit(); if (u) { state.activeUnitId = u.id; u.status = "in-progress"; save(); render(); } };
  els.noAccess.onclick = () => finish("no-access"); els.completeUnit.onclick = () => finish("complete");
  $$('[data-room]').forEach((b) => b.onclick = () => { els.room.value = b.dataset.room; els.description.focus(); });
  els.form.onsubmit = saveDeficiency; els.clearForm.onclick = clearDeficiencyForm; els.unitNotes.oninput = () => { if (activeUnit()) activeUnit().notes = els.unitNotes.value; save(); };
  els.unitDefList.onclick = (e) => { const b = e.target.closest("[data-action]"); if (!b) return; if (b.dataset.action === "edit") editDef(b.dataset.id); if (b.dataset.action === "delete") removeDef(b.dataset.id); if (b.dataset.action === "close") setDefStatus(b.dataset.id, "Closed"); };
  [els.masterSearch, els.filterStatus, els.filterSeverity, els.filterUnitStatus].forEach((i) => i.oninput = updateFilters);
  els.generator.onsubmit = generateUnits; els.addPasted.onclick = () => addUnits(splitUnits(els.paste.value)); els.clearUnits.onclick = () => { if (confirm("Clear all units and deficiencies?")) { state.units = []; state.deficiencies = []; state.activeUnitId = null; save(); render(); } };
  els.loadSample.onclick = loadSample; els.saveTeam.onclick = () => { state.users = splitUnits(els.team.value); save(); renderTeam(); }; els.saveContact.onclick = saveContact; els.clearContact.onclick = clearContact;
  els.contactList.onclick = (e) => { const b = e.target.closest("[data-portal-action]"); if (!b) return; if (b.dataset.portalAction === "edit") editContact(b.dataset.id); if (b.dataset.portalAction === "remove") removeContact(b.dataset.id); };
  els.importJson.onchange = importBackup; $$('[id$="ExportCsvBtn"], #exportCsvBtnSecondary').forEach((b) => b.onclick = exportCsv); $$('[id$="ExportJsonBtn"]').forEach((b) => b.onclick = exportJson); els.print.onclick = () => { state.activeView = "master"; render(); window.print(); };
  els.portalRequest.onsubmit = requestCode; els.portalCodeForm.onsubmit = verifyCode; els.portalOut.onclick = () => { state.portal.signedIn = false; state.portal.sessionToken = ""; state.portal.report = null; save(); renderPortal(); }; els.portalExport.onclick = exportCsv;
}

function saveDeficiency(e) { e.preventDefault(); const unit = activeUnit(); if (!unit) return; const id = els.editing.value || uid(); const existing = state.deficiencies.find((d) => d.id === id); const item = { id, unitId: unit.id, room: els.room.value.trim(), category: els.category.value, location: els.location.value.trim(), description: els.description.value.trim(), severity: els.severity.value, trade: els.trade.value.trim(), status: els.status.value, photos: els.photos.value.trim(), dueDate: els.due.value, loggedBy: els.loggedBy.value.trim() || state.project.currentUser, notes: els.notes.value.trim(), createdAt: existing?.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() }; if (existing) Object.assign(existing, item); else state.deficiencies.push(item); if (unit.status === "not-started") unit.status = "in-progress"; addUser(item.loggedBy); clearDeficiencyForm(); save(); render(); }
function clearDeficiencyForm() { els.form.reset(); els.editing.value = ""; els.category.value = "General"; els.severity.value = "Medium"; els.status.value = "Open"; els.loggedBy.value = state.project.currentUser || ""; els.formLabel.textContent = "Add item"; els.saveDef.textContent = "Save deficiency"; }
function editDef(id) { const d = state.deficiencies.find((x) => x.id === id); if (!d) return; Object.entries({ editing: d.id, room: d.room, category: d.category, location: d.location, severity: d.severity, description: d.description, trade: d.trade, status: d.status, photos: d.photos, due: d.dueDate, loggedBy: d.loggedBy, notes: d.notes }).forEach(([k, v]) => els[k].value = v || ""); els.formLabel.textContent = "Edit item"; els.saveDef.textContent = "Update deficiency"; }
function removeDef(id) { state.deficiencies = state.deficiencies.filter((d) => d.id !== id); save(); render(); }
function setDefStatus(id, status) { const d = state.deficiencies.find((x) => x.id === id); if (d) d.status = status; save(); render(); }
function generateUnits(e) { e.preventDefault(); const out = []; for (let f = Math.min(+els.floorStart.value, +els.floorEnd.value); f <= Math.max(+els.floorStart.value, +els.floorEnd.value); f++) for (let i = 0; i < +els.suites.value; i++) out.push(`${els.prefix.value.trim()}${f}${String(+els.suiteStart.value + i).padStart(+els.digits.value, "0")}`); addUnits(out); }
function addUnits(labels) { const seen = new Set(state.units.map((u) => u.label.toLowerCase())); labels.map((x) => x.trim()).filter(Boolean).forEach((label) => { if (!seen.has(label.toLowerCase())) { seen.add(label.toLowerCase()); state.units.push({ id: uid(), label, status: "not-started", notes: "" }); } }); state.activeUnitId ||= state.units[0]?.id || null; els.paste.value = ""; state.activeView = "inspect"; save(); render(); }
function finish(status) { const u = activeUnit(); if (!u) return; u.status = status; const n = nextUnit(); if (n) { state.activeUnitId = n.id; if (n.status === "not-started") n.status = "in-progress"; } save(); render(); }
function move(delta) { const units = orderedUnits(); const i = units.findIndex((u) => u.id === state.activeUnitId); const u = units[i + delta]; if (u) { state.activeUnitId = u.id; save(); render(); } }
function loadSample() { if ((state.units.length || state.deficiencies.length) && !confirm("Replace current data with the sample building?")) return; state = blank(); state.project = { name: "The Performing Arts Lodge", address: "110 The Esplanade, Toronto, Ontario, Canada", currentUser: "Alex Chen", inspectionDate: today(), accountNumber: "100" }; state.users = ["Alex Chen", "Jordan Patel", "Sam Rivera"]; state.contacts = [{ id: uid(), name: "Trial Property Manager", email: "davedufresne121@gmail.com", accountNumber: "100", status: "active" }]; addUnits(["101", "102", "103", "201", "202", "203", "301", "302", "303"]); state.deficiencies.push({ id: uid(), unitId: state.units[0].id, room: "Kitchen", category: "Appliances", description: "Dishwasher not secured to underside of countertop.", severity: "Medium", status: "Open", trade: "Appliances", loggedBy: "Alex Chen", photos: "IMG_1004", createdAt: new Date().toISOString() }, { id: uid(), unitId: state.units[1].id, room: "Bathroom", category: "Plumbing", description: "Slow leak observed at trap connection.", severity: "High", status: "Ready for Review", trade: "Plumbing", loggedBy: "Jordan Patel", photos: "IMG_1011", createdAt: new Date().toISOString() }); save(); render(); }
function saveContact() { const email = els.contactEmail.value.trim().toLowerCase(); const accountNumber = els.contactAccount.value.trim() || "100"; if (!email) return alert("Enter a property manager email address."); if (!/^\d{3}$/.test(accountNumber)) return alert("Account numbers should be 3 digits, starting at 100."); const item = { id: els.contactId.value || uid(), name: els.contactName.value.trim(), email, accountNumber, status: "active" }; const i = state.contacts.findIndex((c) => c.id === item.id); if (i >= 0) state.contacts[i] = item; else state.contacts.push(item); state.project.accountNumber = accountNumber; clearContact(); save(); render(); }
function editContact(id) { const c = state.contacts.find((x) => x.id === id); if (!c) return; els.contactId.value = c.id; els.contactName.value = c.name || ""; els.contactEmail.value = c.email || ""; els.contactAccount.value = c.accountNumber || "100"; els.saveContact.textContent = "Update portal contact"; }
function removeContact(id) { state.contacts = state.contacts.filter((c) => c.id !== id); save(); renderContacts(); }
function clearContact() { els.contactId.value = ""; els.contactName.value = ""; els.contactEmail.value = ""; els.contactAccount.value = state.project.accountNumber || "100"; els.saveContact.textContent = "Save portal contact"; }
async function requestCode(e) { e.preventDefault(); const email = els.portalEmail.value.trim().toLowerCase(); const account = els.portalAccount.value.trim(); try { let code = ""; if (backend.ready()) { const res = await backend.request(email, account); code = res.demoCode || ""; } else { const ok = state.contacts.some((c) => c.email === email && c.accountNumber === account); if (!ok) throw new Error("Those portal details do not match this building."); code = String(Math.floor(100000 + Math.random() * 900000)); state.portal.code = code; } state.portal.pendingEmail = email; state.portal.pendingAccount = account; state.portal.expires = new Date(Date.now() + 600000).toISOString(); els.portalMessage.textContent = code ? `Demo one-time code: ${code}.` : `If those details match an active account, a one-time code has been emailed to ${email}.`; save(); renderPortal(); } catch (err) { els.portalMessage.textContent = err.message; } }
async function verifyCode(e) { e.preventDefault(); try { if (backend.ready()) { const session = await backend.verify(state.portal.pendingEmail, state.portal.pendingAccount, els.portalCode.value.trim()); state.portal.sessionToken = session.sessionToken; state.portal.report = await backend.report(session.sessionToken); } else if (els.portalCode.value.trim() !== state.portal.code || new Date(state.portal.expires) < new Date()) throw new Error("That code did not match or has expired."); state.portal.signedIn = true; state.portal.code = ""; save(); renderPortal(); } catch (err) { els.portalMessage.textContent = err.message; } }
function updateFilters() { state.filters = { search: els.masterSearch.value.trim(), status: els.filterStatus.value, severity: els.filterSeverity.value, unitStatus: els.filterUnitStatus.value }; save(); renderMaster(); }
function filtered() { const s = state.filters.search.toLowerCase(); return state.deficiencies.filter((d) => { const u = byId(d.unitId); const blob = [u?.label, d.room, d.category, d.description, d.severity, d.status, d.trade, d.loggedBy].join(" ").toLowerCase(); return (!s || blob.includes(s)) && (!state.filters.status || d.status === state.filters.status) && (!state.filters.severity || d.severity === state.filters.severity) && (!state.filters.unitStatus || u?.status === state.filters.unitStatus); }); }
function exportCsv() { const headers = ["building", "address", "date", "unit", "unit_status", "room", "category", "description", "severity", "status", "trade", "logged_by", "photos", "due_date"]; const rows = state.deficiencies.map((d) => { const u = byId(d.unitId); return [state.project.name, state.project.address, state.project.inspectionDate, u?.label || "", label(u?.status), d.room, d.category, d.description, d.severity, d.status, d.trade, d.loggedBy, d.photos, d.dueDate]; }); download([headers, ...rows].map((r) => r.map(csv).join(",")).join("\n"), "master-deficiencies.csv", "text/csv"); }
function exportJson() { download(JSON.stringify(state, null, 2), "inspection-backup.json", "application/json"); }
function importBackup(e) { const file = e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => { state = normalize(JSON.parse(r.result)); save(); render(); }; r.readAsText(file); }
function download(text, name, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); URL.revokeObjectURL(a.href); }
function byId(id) { return state.units.find((u) => u.id === id); } function activeUnit() { return byId(state.activeUnitId); } function nextUnit() { return orderedUnits().find((u) => !["complete", "no-access"].includes(u.status)); } function openFor(id) { return state.deficiencies.filter((d) => d.unitId === id && d.status !== "Closed").length; } function label(s) { return ({ "not-started": "Not started", "in-progress": "In progress", complete: "Complete", "no-access": "No access" })[s] || s || ""; } function splitUnits(v) { return String(v).split(/[\n,;\t]+/).map((x) => x.trim()).filter(Boolean); } function addUser(u) { if (u && !state.users.some((x) => x.toLowerCase() === u.toLowerCase())) state.users.unshift(u); } function esc(v) { return String(v ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); } function csv(v) { return `"${String(v ?? "").replaceAll('"', '""')}"`; }

wire();
render();
if ("serviceWorker" in navigator && location.protocol !== "file:") window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
