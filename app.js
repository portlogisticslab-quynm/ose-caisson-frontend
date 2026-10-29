// CScheck Web v4 - frontend logic
// State lives in the browser; all calculations are done by the backend API.

const FORM = [
  { tab: "Caisson",
    img: "img/caisson.png", draw: "caisson", caption: "Mặt đứng và mặt bằng thùng chìm: H, Td, Bd, Bt, Ct, L, Tt, Ts, Th, Tn, Cv",
    fields: [
    ["L", "Length L (m)"], ["Bt", "Width Bt (m)"], ["Ct", "Toe width Ct (m)"], ["H", "Height H (m)"],
    ["Kn", "Y cells Kn"], ["Km", "X cells Km"], ["Td", "Slab thickness Td (m)"],
    ["Tt", "Front wall Tt (m)"], ["Ts", "Rear wall Ts (m)"], ["Th", "Side wall Th (m)"],
    ["Tn", "Partition wall Tn (m)"], ["Cv", "Chamfer Cv (m)"], ["bh", "Ballast/fill height bh (m)"] ] },
  { tab: "Section",
    img: "img/section.png", draw: "section", caption: "Mặt cắt ngang tường bến: cao độ, mực nước, mũ bến, tải trọng",
    fields: [
    ["Cr", "Crown level Cr"], ["hb", "Berth height hb"], ["Tf", "Foundation thickness Tf"],
    ["hc", "Coping height hc"], ["Tc", "Coping thickness Tc"], ["Tp", "Pavement thickness Tp"],
    ["HWL", "High water level HWL"], ["MWL", "Mean water level MWL"], ["LWL", "Low water level LWL"],
    ["RWL", "Resident water level RWL"], ["CDL", "Chart datum CDL"] ] },
  { tab: "Materials", fields: [
    ["Gc", "RC unit wt Gc"], ["Gcc", "Lean RC unit wt Gcc"], ["Gsd", "Dry sand wt Gsd"],
    ["Gss", "Sat. sand wt Gss"], ["Gr", "Dry rock wt Gr"], ["Gp", "Pavement wt Gp"],
    ["Gw", "Seawater wt Gw"], ["fcc", "Concrete-concrete friction"], ["muRC", "Rock-concrete friction"] ] },
  { tab: "Soil", fields: [
    ["fsd", "Dry sand angle φsd (deg)"], ["fsw", "Wet sand angle φsw (deg)"], ["frd", "Rock angle φr (deg)"],
    ["frc", "Wall friction δ (deg)"], ["qa", "Foundation capacity qa"] ] },
  { tab: "Loads", fields: [
    ["dr", "Railway distance dr"], ["e", "Fender distance e"], ["b", "Coping dist. b"], ["c", "Coping dist. c"],
    ["Vs1", "Surcharge Vs1"], ["Vs2", "Surcharge Vs2"], ["Hm", "Mooring H"], ["Vm", "Mooring V"],
    ["Hc", "Crane H"], ["Vc", "Crane V"] ] },
  { tab: "Options", fields: [
    ["standard", "Standard", "select", ["Normalized", "OCDI2002", "BS6349"]],
    ["kh", "Seismic coeff kh"], ["useKv", "Use vertical seismic kv", "check"], ["kv", "Vertical coeff kv"],
    ["useBuoyancyLink", "Use Buoyancy linked values", "check"], ["autoSync", "Auto sync after Buoyancy", "check"] ] },
];

// Số liệu demo cho tab Caisson và Section (ghi đè giá trị mặc định của backend)
const DEMO = {
  L: 30, Bt: 15, Ct: 2, H: 17, Kn: 4, Km: 3, Td: 1.0, Tt: 0.4, Ts: 0.4, Th: 0.35, Tn: 0.25, Cv: 0.3, bh: 8,
  Cr: 6, hb: 14, Tf: 1.5, hc: 1.5, Tc: 2.5, Tp: 0.5, HWL: 3, MWL: 2, LWL: 1, RWL: 2.5, CDL: 0,
};
let DEFAULTS = { ...DEMO };
let LINKED = ["bh", "Gc", "Gsd", "Gw"];
const state = { inputs: {}, buoyancy: null, stability: null };

const $ = (id) => document.getElementById(id);
const fmt = (x) => (x === null || x === undefined || !Number.isFinite(x)) ? "Inf/NaN" : x.toFixed(3);

// ---------------- UI build ----------------
function buildForm() {
  const tabs = $("tabs"), bodies = $("tabBodies");
  FORM.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.textContent = t.tab;
    btn.onclick = () => activateTab(i);
    tabs.appendChild(btn);

    const body = document.createElement("div");
    body.className = "tabbody";
    if (t.draw) {
      const fig = document.createElement("figure");
      fig.className = "tabfig";
      const box = document.createElement("div");
      box.className = "drawbox"; box.dataset.draw = t.draw;
      box.title = "Bấm để phóng to";
      box.onclick = () => openLightboxSvg(box.innerHTML, t.caption);
      const cap = document.createElement("figcaption");
      cap.append(t.caption + " — vẽ theo số liệu nhập (bấm hình để phóng to) · ");
      const ref = document.createElement("a");
      ref.href = "#"; ref.textContent = "Hình mẫu";
      ref.onclick = (ev) => { ev.preventDefault(); openLightbox(t.img, t.caption + " (hình mẫu)"); };
      cap.appendChild(ref);
      fig.append(box, cap);
      body.appendChild(fig);
    } else if (t.img) {
      const fig = document.createElement("figure");
      fig.className = "tabfig";
      const im = document.createElement("img");
      im.src = t.img; im.alt = t.caption; im.loading = "lazy";
      im.title = "Bấm để phóng to";
      im.onclick = () => openLightbox(t.img, t.caption);
      const cap = document.createElement("figcaption");
      cap.textContent = t.caption + " (bấm hình để phóng to)";
      fig.append(im, cap);
      body.appendChild(fig);
    }
    t.fields.forEach(([key, label, type, items]) => {
      const row = document.createElement("div");
      row.className = "row";
      const lab = document.createElement("label");
      lab.textContent = label; lab.htmlFor = "in_" + key;
      let el;
      if (type === "select") {
        el = document.createElement("select");
        items.forEach(v => { const o = document.createElement("option"); o.value = o.textContent = v; el.appendChild(o); });
      } else if (type === "check") {
        el = document.createElement("input"); el.type = "checkbox";
      } else {
        el = document.createElement("input"); el.type = "number"; el.step = "any";
      }
      el.id = "in_" + key; el.dataset.key = key;
      row.append(lab, el);
      body.appendChild(row);
    });
    bodies.appendChild(body);
  });
  activateTab(0);
}

function openLightbox(src, caption) {
  const lb = $("lightbox");
  $("lbSvg").innerHTML = ""; $("lbSvg").style.display = "none"; $("lbImg").style.display = "";
  $("lbImg").src = src; $("lbImg").alt = caption;
  $("lbCap").textContent = caption;
  lb.classList.add("show");
}
function openLightboxSvg(svg, caption) {
  $("lbImg").style.display = "none"; $("lbImg").removeAttribute("src");
  $("lbSvg").innerHTML = svg; $("lbSvg").style.display = "";
  $("lbCap").textContent = caption;
  $("lightbox").classList.add("show");
}

// Vẽ lại hình Caisson / Section theo số liệu đang nhập
let _drawPending = 0;
function redrawFigures() {
  if (!window.CSDraw) return;
  cancelAnimationFrame(_drawPending);
  _drawPending = requestAnimationFrame(() => {
    const inp = collectInputs();
    document.querySelectorAll(".drawbox[data-draw]").forEach(box => {
      try { box.innerHTML = window.CSDraw[box.dataset.draw](inp); }
      catch (e) { box.textContent = "Không vẽ được hình: " + e.message; }
    });
  });
}

function closeLightbox() { $("lightbox").classList.remove("show"); }

function activateTab(i) {
  [...$("tabs").children].forEach((b, j) => b.classList.toggle("active", i === j));
  [...$("tabBodies").children].forEach((b, j) => b.classList.toggle("active", i === j));
}

function collectInputs() {
  const inp = {};
  document.querySelectorAll("[data-key]").forEach(el => {
    const k = el.dataset.key;
    if (el.type === "checkbox") inp[k] = el.checked;
    else if (el.tagName === "SELECT") inp[k] = el.value;
    else inp[k] = el.value === "" ? null : Number(el.value);
  });
  return inp;
}

function writeInputs(inp) {
  Object.entries(inp).forEach(([k, v]) => {
    const el = $("in_" + k);
    if (!el) return;
    if (el.type === "checkbox") el.checked = !!v;
    else el.value = v;
  });
  redrawFigures();
}

function lockLinked(tf) {
  LINKED.forEach(k => {
    const el = $("in_" + k);
    if (!el) return;
    el.readOnly = tf;
    el.title = tf ? "Locked by Buoyancy link" : "";
  });
}

// ---------------- API ----------------
async function api(path, body) {
  const res = await window.oseFetch(path, {
    method: body ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try { const j = await res.json(); msg = typeof j.detail === "string" ? j.detail : JSON.stringify(j.detail); } catch {}
    throw new Error(msg);
  }
  return res;
}

function toast(msg, kind = "") {
  const t = $("toast");
  t.textContent = msg; t.className = "toast show " + kind;
  clearTimeout(t._h); t._h = setTimeout(() => t.className = "toast", 3500);
}

function busy(tf) { document.querySelectorAll(".actions button, #btnSync").forEach(b => b.disabled = tf); }

// ---------------- Callbacks ----------------
async function onReset() {
  writeInputs(DEFAULTS);
  state.inputs = {}; state.buoyancy = null; state.stability = null;
  clearResults();
  lockLinked(false);
}

async function onRunBuoyancy() {
  try {
    const r = await (await api("/api/buoyancy", { inputs: collectInputs() })).json();
    state.inputs = r.inputs;
    state.buoyancy = r.buoyancy;
    updateBuoyancyPanel(r.buoyancy);
    updateCaissonBox(r.buoyancy);
    if ($("in_useBuoyancyLink").checked && $("in_autoSync").checked) onSyncNow();
    renderSummary();
    return true;
  } catch (e) { toast("Buoyancy error\n" + e.message, "error"); return false; }
}

function onSyncNow() {
  if (!state.buoyancy) { toast("Run Buoyancy first.", "error"); return; }
  const inp = collectInputs();
  LINKED.forEach(k => inp[k] = state.buoyancy[k]);
  writeInputs(inp);
  state.inputs = inp;
  lockLinked(true);
  updateBuoyancyPanel(state.buoyancy);
}

async function onRunStability() {
  try {
    const inp = collectInputs();
    if (inp.useBuoyancyLink) {
      if (!state.buoyancy) { toast('Run Buoyancy first or untick "Use Buoyancy linked values".', "error"); return; }
      LINKED.forEach(k => inp[k] = state.buoyancy[k]);
      writeInputs(inp);
      lockLinked(true);
    } else {
      lockLinked(false);
    }
    const r = await (await api("/api/stability", { inputs: inp, buoyancy: state.buoyancy })).json();
    state.inputs = r.inputs;
    state.stability = r.stability;
    updateStabilityUI(r.stability, r.inputs);
    renderSummary();
  } catch (e) { toast("Stability error\n" + e.message, "error"); }
}

async function onRunAll() {
  busy(true);
  try { if (await onRunBuoyancy()) await onRunStability(); } finally { busy(false); }
}

async function onExport() {
  if (!state.stability) { toast("Run Stability first.", "error"); return; }
  try {
    const res = await api("/api/export", state);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "CScheck_web_results.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Exported CScheck_web_results.xlsx", "success");
  } catch (e) { toast("Export error\n" + e.message, "error"); }
}

// ---------------- Render ----------------
function setStatus(el, text, ok) {
  el.textContent = text;
  el.classList.remove("pass", "fail");
  if (ok !== undefined) el.classList.add(ok ? "pass" : "fail");
}

function clearResults() {
  ["rFoN","rFsN","rP1N","rP2N","rQa","rKa","rPaH","rFoS","rFsS","rP1S","rP2S","rKh","rKv","rGM",
   "bDraft","bGM","bG1","bG2","oVcaisson","oGcaisson"].forEach(id => $(id).textContent = "-");
  setStatus($("rStatN"), "Ready"); setStatus($("rStatS"), "Ready"); setStatus($("bStat"), "No buoyancy data");
  $("oCaissonNote").textContent = "Run Buoyancy to calculate caisson self-weight.";
  $("summary").textContent = "Ready.";
  $("plotPressure").innerHTML = ""; $("plotBearing").innerHTML = "";
}

function updateBuoyancyPanel(b) {
  $("bDraft").textContent = fmt(b.draft);
  $("bGM").textContent = fmt(b.GM_legacy);
  $("bG1").textContent = fmt(b.G1_ballast);
  $("bG2").textContent = fmt(b.G2_caisson);
  setStatus($("bStat"), b.status, b.status === "Stable");
}

function updateCaissonBox(b) {
  $("oVcaisson").textContent = fmt(b.V_caisson);
  $("oGcaisson").textContent = fmt(b.G2_caisson);
  $("oCaissonNote").textContent =
    `Concrete volume V = ${fmt(b.V_caisson)} m³\nCaisson self-weight G2 = ${fmt(b.G2_caisson)}\nStatus = ${b.status}`;
}

function updateStabilityUI(s, inp) {
  $("rFoN").textContent = fmt(s.Fo_operation);
  $("rFsN").textContent = fmt(s.Fs_operation);
  $("rP1N").textContent = fmt(s.p1_operation_ULS);
  $("rP2N").textContent = fmt(s.p2_operation_ULS);
  $("rQa").textContent = fmt(inp.qa);
  $("rKa").textContent = fmt(s.Ka);
  $("rPaH").textContent = fmt(s.PaH_A);
  $("rFoS").textContent = fmt(s.Fo_seismic);
  $("rFsS").textContent = fmt(s.Fs_seismic);
  $("rP1S").textContent = fmt(s.p1_seismic);
  $("rP2S").textContent = fmt(s.p2_seismic);
  $("rKh").textContent = fmt(inp.kh);
  $("rKv").textContent = fmt(inp.useKv ? inp.kv : 0);
  $("rGM").textContent = fmt(s.GM_linked);
  setStatus($("rStatN"), s.statusOperation, s.statusOperation === "PASS");
  setStatus($("rStatS"), s.statusSeismic, s.statusSeismic === "PASS");
  plotPressure(s);
  plotBearing(s);
}

function renderSummary() {
  const b = state.buoyancy, s = state.stability;
  const L = [];
  L.push("CScheck Web v4 summary", "");
  L.push(b ? `Buoyancy status               = ${b.status}` : "Buoyancy status               = not run");
  L.push(b ? `Draft / GM legacy             = ${fmt(b.draft)} / ${fmt(b.GM_legacy)}` : "Draft / GM legacy             = - / -");
  L.push("");
  if (s) {
    L.push(`Operation status              = ${s.statusOperation}`);
    L.push(`Fo / Fs static                = ${fmt(s.Fo_operation)} / ${fmt(s.Fs_operation)}`);
    L.push(`p1 / p2 static                = ${fmt(s.p1_operation_ULS)} / ${fmt(s.p2_operation_ULS)}`);
    L.push(`Seismic status                = ${s.statusSeismic}`);
    L.push(`Fo / Fs seismic               = ${fmt(s.Fo_seismic)} / ${fmt(s.Fs_seismic)}`);
    L.push(`p1 / p2 seismic               = ${fmt(s.p1_seismic)} / ${fmt(s.p2_seismic)}`);
  } else {
    L.push("Stability status              = not run", "Fo / Fs static                = - / -",
           "p1 / p2 static                = - / -", "Seismic status                = not run",
           "Fo / Fs seismic               = - / -", "p1 / p2 seismic               = - / -");
  }
  L.push("", "Workflow: Run Buoyancy → Sync/Link → Run Stability → Export");
  $("summary").textContent = L.join("\n");
}

// ---------------- Minimal SVG line plotter (no external libs) ----------------
const COLORS = ["#1f5fa8", "#d9822b", "#2e8b57", "#8e44ad"];
const DASH = ["", "6 4", "2 3", "8 3 2 3"];

function niceTicks(min, max, n = 5) {
  if (min === max) { min -= 1; max += 1; }
  const span = max - min, step0 = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const step = [1, 2, 5, 10].map(m => m * mag).find(s => s >= step0);
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(+v.toFixed(10));
  return ticks;
}

function linePlot(container, series, xlabel, ylabel) {
  const W = 480, H = 270, m = { l: 48, r: 12, t: 10, b: 58 };
  const pts = series.flatMap(s => s.x.map((x, i) => [x, s.y[i]])).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));
  if (!pts.length) { container.innerHTML = "<div class='note'>No finite data to plot.</div>"; return; }
  const xt = niceTicks(Math.min(0, ...pts.map(p => p[0])), Math.max(...pts.map(p => p[0])));
  const yt = niceTicks(Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[1])));
  const [x0, x1, y0, y1] = [xt[0], xt.at(-1), yt[0], yt.at(-1)];
  const sx = x => m.l + (x - x0) / (x1 - x0) * (W - m.l - m.r);
  const sy = y => H - m.b - (y - y0) / (y1 - y0) * (H - m.t - m.b);

  let s = `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">`;
  xt.forEach(v => s += `<line class="gridl" x1="${sx(v)}" x2="${sx(v)}" y1="${m.t}" y2="${H - m.b}"/><text x="${sx(v)}" y="${H - m.b + 12}" text-anchor="middle">${+v.toFixed(3)}</text>`);
  yt.forEach(v => s += `<line class="gridl" x1="${m.l}" x2="${W - m.r}" y1="${sy(v)}" y2="${sy(v)}"/><text x="${m.l - 4}" y="${sy(v) + 3}" text-anchor="end">${+v.toFixed(3)}</text>`);
  s += `<line class="axis" x1="${m.l}" x2="${W - m.r}" y1="${H - m.b}" y2="${H - m.b}"/><line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${H - m.b}"/>`;
  series.forEach((ser, k) => {
    const d = ser.x.map((x, i) => [x, ser.y[i]]).filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]))
      .map((p, i) => `${i ? "L" : "M"}${sx(p[0]).toFixed(1)},${sy(p[1]).toFixed(1)}`).join("");
    s += `<path d="${d}" fill="none" stroke="${COLORS[k]}" stroke-width="2" stroke-dasharray="${DASH[k]}"/>`;
  });
  s += `<text x="${(m.l + W - m.r) / 2}" y="${H - m.b + 26}" text-anchor="middle">${xlabel}</text>`;
  s += `<text transform="translate(12 ${(m.t + H - m.b) / 2}) rotate(-90)" text-anchor="middle">${ylabel}</text>`;
  // legend
  let lx = m.l;
  series.forEach((ser, k) => {
    s += `<line x1="${lx}" x2="${lx + 18}" y1="${H - 10}" y2="${H - 10}" stroke="${COLORS[k]}" stroke-width="2" stroke-dasharray="${DASH[k]}"/><text x="${lx + 22}" y="${H - 7}">${ser.name}</text>`;
    lx += 30 + ser.name.length * 6;
  });
  container.innerHTML = s + "</svg>";
}

function plotPressure(st) {
  const yy = [st.Cb, st.MNT, st.RWL, st.Elev4].map(y => y - st.Cb);
  const pick = P => [P[5], P[4], P[3], P[1]];
  linePlot($("plotPressure"), [
    { name: "A / operation", x: pick(st.Pa_A), y: yy },
    { name: "B-A1M1", x: pick(st.Pa_BM1), y: yy },
    { name: "C-A2M2", x: pick(st.Pa_CM2), y: yy },
    { name: "SE", x: pick(st.PEa), y: yy },
  ], "Pressure (t/m²)", "Height above base Cb (m)");
}

function plotBearing(st) {
  linePlot($("plotBearing"), [
    { name: "Operation ULS", x: [0, st.Bd], y: [st.p2_operation_ULS, st.p1_operation_ULS] },
    { name: "Seismic", x: [0, st.Bd], y: [st.p2_seismic, st.p1_seismic] },
  ], "Base width coordinate (m)", "Pressure (t/m²)");
}

// ---------------- Init ----------------
(async function init() {
  buildForm();
  $("tabBodies").addEventListener("input", redrawFigures);
  redrawFigures();
  $("btnBuoy").onclick = onRunBuoyancy;
  $("btnStab").onclick = onRunStability;
  $("btnAll").onclick = onRunAll;
  $("btnReset").onclick = onReset;
  $("btnExport").onclick = onExport;
  $("btnSync").onclick = onSyncNow;
  $("lightbox").onclick = closeLightbox;
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeLightbox(); });
  try {
    const d = await (await api("/api/defaults")).json();
    DEFAULTS = { ...d.inputs, ...DEMO }; LINKED = d.linkedFields;
    onReset();
  } catch (e) { writeInputs(DEFAULTS); toast("Cannot reach backend: " + e.message, "error"); }
})();

/* Server selector: Auto / Home / Render (config.js reads ?api=) */
(async function initServerSelect() {
  if (window.OSE_SAME_ORIGIN || ["localhost", "127.0.0.1"].includes(location.hostname)) return;
  const box = document.createElement("div");
  box.style.cssText = "position:fixed;right:10px;bottom:10px;z-index:9999;display:flex;gap:6px;align-items:center;font:12px system-ui,sans-serif;background:rgba(255,255,255,.92);color:#222;border:1px solid #ccc;border-radius:6px;padding:4px 6px;box-shadow:0 1px 4px rgba(0,0,0,.15);max-width:calc(100vw - 20px)";
  const dot = document.createElement("span");
  dot.style.cssText = "width:8px;height:8px;border-radius:50%;background:#aaa;flex:none";
  const txt = document.createElement("span");
  txt.textContent = "\u0110ang k\u1ebft n\u1ed1i\u2026";
  const sel = document.createElement("select");
  sel.style.cssText = "font:inherit;max-width:150px";
  [["auto", "T\u1ef1 \u0111\u1ed9ng (Home \u2192 Render)"], ["home", "Home server"], ["render", "Render"]].forEach(([v, l]) => {
    const o = document.createElement("option"); o.value = v; o.textContent = l; sel.appendChild(o);
  });
  let pinned = new URLSearchParams(location.search).get("api");
  try { pinned = pinned || localStorage.getItem("ose_api"); } catch (e) {}
  sel.value = ["home", "render"].includes(pinned) ? pinned : "auto";
  sel.onchange = () => { const u = new URL(location.href); u.searchParams.set("api", sel.value); location.href = u.toString(); };
  box.append(dot, txt, sel);
  document.body.appendChild(box);
  const t0 = performance.now();
  try {
    const r = await window.oseFetch("/api/health", { cache: "no-store" });
    const h = await r.json();
    const name = String(window.OSE_API_BASE || "").includes("onrender.com") ? "Render" : "Home server";
    dot.style.background = "#2e9d4f";
    txt.textContent = `${name} \u00b7 v${h.version || "?"} \u00b7 ${Math.round(performance.now() - t0)} ms`;
  } catch (e) {
    dot.style.background = "#d33";
    txt.textContent = "M\u1ea5t k\u1ebft n\u1ed1i m\u00e1y ch\u1ee7";
  }
})();