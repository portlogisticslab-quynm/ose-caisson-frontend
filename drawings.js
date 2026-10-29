// drawings.js - CScheck Web v4: parametric drawings for the Caisson and Section tabs.
// Hình vẽ được dựng lại từ số liệu nhập (đúng tỉ lệ), cập nhật ngay khi sửa ô nhập.
(function () {
  "use strict";

  const C = {
    concrete: "#e0262b", concreteDark: "#b71c1c", cell: "#f7f6d2", fill: "#e3d79a",
    slab: "#9aa3ad", rubble: "#c9c2b2", backfill: "#8e8a78", soil: "#b39b6b",
    water: "#b9dcf2", waterLine: "#2f7fc1", coping: "#8d96a3", pave: "#a0522d",
    dim: "#1f5fa8", text: "#1c2733", muted: "#5d6b7a", warn: "#a02020",
  };
  const num = (v, d) => (Number.isFinite(+v) && v !== null && v !== "" ? +v : d);
  const f2 = (x) => (Math.round(x * 100) / 100).toString();
  const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));

  // ---------- SVG helpers (pixel coordinates) ----------
  const rect = (x, y, w, h, fill, extra = "") =>
    `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${Math.max(0, w).toFixed(2)}" height="${Math.max(0, h).toFixed(2)}" fill="${fill}" ${extra}/>`;
  const line = (x1, y1, x2, y2, stroke, extra = "") =>
    `<line x1="${x1.toFixed(2)}" y1="${y1.toFixed(2)}" x2="${x2.toFixed(2)}" y2="${y2.toFixed(2)}" stroke="${stroke}" ${extra}/>`;
  const poly = (pts, fill, extra = "") =>
    `<polygon points="${pts.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" ")}" fill="${fill}" ${extra}/>`;
  const text = (x, y, s, extra = "") =>
    `<text x="${x.toFixed(2)}" y="${y.toFixed(2)}" ${extra}>${esc(s)}</text>`;

  // Horizontal dimension line between x1..x2 at y (label above)
  function dimH(x1, x2, y, label, ext1, ext2) {
    let s = "";
    if (ext1 !== undefined) s += line(x1, ext1, x1, y + 3, C.dim, 'stroke-width="0.6"');
    if (ext2 !== undefined) s += line(x2, ext2, x2, y + 3, C.dim, 'stroke-width="0.6"');
    s += line(x1, y, x2, y, C.dim, 'stroke-width="0.9" marker-start="url(#arr)" marker-end="url(#arr)"');
    s += text((x1 + x2) / 2, y - 3, label, 'class="dl" text-anchor="middle"');
    return s;
  }
  // Vertical dimension line between y1..y2 at x (label rotated, left side)
  function dimV(y1, y2, x, label, ext1, ext2) {
    let s = "";
    if (ext1 !== undefined) s += line(ext1, y1, x - 3, y1, C.dim, 'stroke-width="0.6"');
    if (ext2 !== undefined) s += line(ext2, y2, x - 3, y2, C.dim, 'stroke-width="0.6"');
    s += line(x, y1, x, y2, C.dim, 'stroke-width="0.9" marker-start="url(#arr)" marker-end="url(#arr)"');
    const ym = (y1 + y2) / 2;
    s += text(x - 4, ym, label, `class="dl" text-anchor="middle" transform="rotate(-90 ${(x - 4).toFixed(2)} ${ym.toFixed(2)})"`);
    return s;
  }
  // Short leader label for thin members (thickness callouts)
  const tag = (x, y, s, anchor = "middle") => text(x, y, s, `class="tg" text-anchor="${anchor}"`);

  const defs = `<defs>
    <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M0,1 L9,5 L0,9" fill="none" stroke="${C.dim}" stroke-width="1.4"/></marker>
    <linearGradient id="gCell" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="${C.cell}"/></linearGradient>
    <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfe8f8"/><stop offset="1" stop-color="#7fb6de"/></linearGradient>
    <pattern id="pRock" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${C.backfill}"/><circle cx="3" cy="3" r="1.4" fill="#b8b4a3"/><circle cx="8" cy="7" r="1.1" fill="#b8b4a3"/></pattern>
    <pattern id="pRubble" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${C.rubble}"/><path d="M0,8 L8,0" stroke="#a89f8a" stroke-width="0.8"/></pattern>
    <pattern id="pSand" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="${C.fill}"/><circle cx="2" cy="2" r="0.7" fill="#c2b26a"/><circle cx="5" cy="4.5" r="0.6" fill="#c2b26a"/></pattern>
  </defs>`;
  const style = `<style>
    .dl{font:11px system-ui,'Segoe UI',sans-serif;fill:${C.dim}}
    .tg{font:10px system-ui,'Segoe UI',sans-serif;fill:${C.text}}
    .lv{font:11px system-ui,'Segoe UI',sans-serif;fill:${C.text}}
    .tt{font:600 12px system-ui,'Segoe UI',sans-serif;fill:${C.text}}
    .wn{font:600 11px system-ui,'Segoe UI',sans-serif;fill:${C.warn}}
  </style>`;
  const svgWrap = (W, H, body, title, uid) =>
    (`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H.toFixed(0)}" role="img" aria-label="${esc(title)}" preserveAspectRatio="xMidYMid meet">${defs}${style}<rect width="${W}" height="${H.toFixed(0)}" fill="#fff"/>${body}</svg>`)
      .replace(/(id="|url\(#)(arr|gCell|gWater|pRock|pRubble|pSand)\b/g, `$1${uid || "d"}-$2`);

  // ---------- Caisson geometry ----------
  function caissonGeom(p) {
    const g = {
      L: num(p.L, 30), Bt: num(p.Bt, 18), Ct: num(p.Ct, 0), H: num(p.H, 17),
      Kn: Math.max(1, Math.round(num(p.Kn, 4))), Km: Math.max(1, Math.round(num(p.Km, 3))),
      Td: num(p.Td, 1), Tt: num(p.Tt, 0.4), Ts: num(p.Ts, 0.4), Th: num(p.Th, 0.35),
      Tn: num(p.Tn, 0.25), Cv: num(p.Cv, 0), bh: num(p.bh, 0),
    };
    g.Kn = Math.min(g.Kn, 40); g.Km = Math.min(g.Km, 40);
    g.Bd = g.Bt + 2 * g.Ct;
    g.L1 = (g.L - 2 * g.Th - (g.Kn - 1) * g.Tn) / g.Kn;   // clear cell length
    g.B1 = (g.Bt - g.Tt - g.Ts - (g.Km - 1) * g.Tn) / g.Km; // clear cell width
    g.warn = [];
    if (!(g.L > 0 && g.Bt > 0 && g.H > 0)) g.warn.push("L, Bt, H phải > 0");
    if (!(g.L1 > 0)) g.warn.push("Ô theo L âm: giảm Kn hoặc Th/Tn");
    if (!(g.B1 > 0)) g.warn.push("Ô theo Bt âm: giảm Km hoặc Tt/Ts/Tn");
    if (!(g.Td < g.H)) g.warn.push("Td ≥ H");
    return g;
  }

  // Cell x-ranges along a length: start wall a, partitions t, n cells of clear size c
  function cells(a, t, n, c) {
    const out = []; let x = a;
    for (let i = 0; i < n; i++) { out.push([x, x + c]); x += c + t; }
    return out;
  }

  function drawCaisson(p) {
    const g = caissonGeom(p);
    const W = 560, ml = 64, mr = 92, gap = 62, mt = 44, mb = 46;
    if (g.warn.length && !(g.L > 0 && g.Bt > 0 && g.H > 0))
      return svgWrap(W, 120, text(W / 2, 60, g.warn.join(" · "), 'class="wn" text-anchor="middle"'), "Caisson", "cs");
    const s = Math.min((W - ml - mr) / g.L, 520 / (g.H + g.Bd));
    const wL = g.L * s;
    const x0 = ml + (W - ml - mr - wL) / 2;
    const X = (m) => x0 + m * s;
    let b = "";
    const ok = g.L1 > 0 && g.B1 > 0;
    const cv = Math.max(0, Math.min(g.Cv, (ok ? Math.min(g.L1, g.B1) : 0) / 2));

    // ===== Elevation (Mặt đứng) =====
    const ye0 = mt;                 // top of caisson
    const Ye = (z) => ye0 + (g.H - z) * s; // z from caisson bottom
    b += text(x0, ye0 - 26, "MẶT ĐỨNG (dọc L)", 'class="tt"');
    b += rect(X(0), Ye(g.H), wL, g.H * s, C.concrete, `stroke="${C.concreteDark}" stroke-width="0.8"`);
    if (ok) {
      const fillTop = Math.min(g.H, g.Td + g.bh);
      cells(g.Th, g.Tn, g.Kn, g.L1).forEach(([a, c]) => {
        b += rect(X(a), Ye(g.H), (c - a) * s, (g.H - g.Td) * s, "url(#gCell)");
        if (g.bh > 0) b += rect(X(a), Ye(fillTop), (c - a) * s, (fillTop - g.Td) * s, "url(#pSand)", 'opacity="0.9"');
        if (cv > 0) {
          b += poly([[X(a), Ye(g.Td)], [X(a + cv), Ye(g.Td)], [X(a), Ye(g.Td + cv)]], C.concrete);
          b += poly([[X(c), Ye(g.Td)], [X(c - cv), Ye(g.Td)], [X(c), Ye(g.Td + cv)]], C.concrete);
        }
      });
      if (g.bh > 0) {
        b += line(X(0) - 4, Ye(fillTop), X(g.L) + 4, Ye(fillTop), C.muted, 'stroke-width="0.8" stroke-dasharray="4 3"');
      }
    }
    // dims elevation
    b += dimV(Ye(g.H), Ye(0), X(0) - 28, `H = ${f2(g.H)}`, X(0) - 2, X(0) - 2);
    b += dimV(Ye(g.Td), Ye(0), X(g.L) + 18, `Td ${f2(g.Td)}`, X(g.L) + 2, X(g.L) + 2);
    if (g.bh > 0 && ok) b += dimV(Ye(Math.min(g.H, g.Td + g.bh)), Ye(g.Td), X(g.L) + 46, `bh ${f2(g.bh)}`, X(g.L) + 2, X(g.L) + 2);
    b += tag(X(g.Th / 2), Ye(g.H) - 4, `Th ${f2(g.Th)}`, "start");
    if (g.Kn > 1 && ok) b += tag(X(g.Th + g.L1 + g.Tn / 2), Ye(g.H) - 4, `Tn ${f2(g.Tn)}`);
    if (cv > 0 && ok) b += tag(X(g.Th + cv + 0.3), Ye(g.Td + cv) - 3, `Cv ${f2(g.Cv)}`, "start");

    // ===== Plan (Mặt bằng) =====
    const yp0 = Ye(0) + gap;            // top edge of base slab (rear side, y = Bd)
    const Yp = (y) => yp0 + (g.Bd - y) * s; // y from front toe edge (front = bottom)
    b += text(x0, yp0 - 26, "MẶT BẰNG", 'class="tt"');
    b += rect(X(0), Yp(g.Bd), wL, g.Bd * s, C.slab, `stroke="#6b7480" stroke-width="0.6"`);       // base slab + toes
    b += rect(X(0), Yp(g.Ct + g.Bt), wL, g.Bt * s, C.concrete, `stroke="${C.concreteDark}" stroke-width="0.8"`);
    if (ok) {
      const xs = cells(g.Th, g.Tn, g.Kn, g.L1);
      const ys = cells(g.Ct + g.Tt, g.Tn, g.Km, g.B1);
      xs.forEach(([a, c]) => ys.forEach(([d, e]) => {
        const px = [[a + cv, d], [c - cv, d], [c, d + cv], [c, e - cv], [c - cv, e], [a + cv, e], [a, e - cv], [a, d + cv]];
        b += poly(px.map(([u, v]) => [X(u), Yp(v)]), "url(#gCell)");
      }));
    }
    b += text(X(g.L / 2), Yp(0) + 30, "phía biển (tường trước Tt)", `class="tg" text-anchor="middle" fill="${C.muted}"`);
    // plan dims
    b += dimH(X(0), X(g.L), Yp(0) + 18, `L = ${f2(g.L)}`, Yp(0) + 2, Yp(0) + 2);
    b += dimV(Yp(g.Bd), Yp(0), X(0) - 28, `Bd = ${f2(g.Bd)}`, X(0) - 2, X(0) - 2);
    b += dimV(Yp(g.Ct + g.Bt), Yp(g.Ct), X(g.L) + 18, `Bt = ${f2(g.Bt)}`, X(g.L) + 2, X(g.L) + 2);
    const ctTxt = g.Ct > 0 ? ` · Ct ${f2(g.Ct)}` : "";
    b += tag(X(g.L) + 30, Yp(g.Ct) + 12, `Tt ${f2(g.Tt)}${ctTxt}`, "start");
    b += tag(X(g.L) + 30, Yp(g.Ct + g.Bt) - 4, `Ts ${f2(g.Ts)}${ctTxt}`, "start");
    if (ok) {
      b += dimH(X(g.Th), X(g.Th + g.L1), Yp(g.Bd) - 6, `L1 ${f2(g.L1)}`);
      b += tag(X(g.Th + g.L1 / 2), Yp(g.Ct + g.Tt + g.B1 / 2) + 4, `B1 ${f2(g.B1)}`);
      b += tag(X(g.Th + g.L1 / 2), Yp(g.Ct + g.Tt + g.B1 / 2) + 16, `${g.Kn} × ${g.Km} ô`);
    }
    let H = Yp(0) + mb;
    if (g.warn.length) { b += text(W / 2, H - 6, "⚠ " + g.warn.join(" · "), 'class="wn" text-anchor="middle"'); H += 6; }
    return svgWrap(W, H, b, "Caisson elevation and plan", "cs");
  }

  // ---------- Section (Mặt cắt ngang tường bến) ----------
  function drawSection(p) {
    const g = caissonGeom(p);
    const v = {
      Cr: num(p.Cr, 6), hb: num(p.hb, 14), Tf: num(p.Tf, 1.5), hc: num(p.hc, 1.5), Tc: num(p.Tc, 1),
      Tp: num(p.Tp, 0.5), HWL: num(p.HWL, 3), MWL: num(p.MWL, 2), LWL: num(p.LWL, 1),
      RWL: num(p.RWL, 2.5), CDL: num(p.CDL, 0),
      b: num(p.b, NaN), e: num(p.e, NaN),
    };
    // Quy ước theo hình mẫu: hb đo từ LWL xuống đáy thùng (= cao độ nền), Tf là lớp đệm đá dưới đáy
    const zb = v.LWL - v.hb;          // caisson bottom / seabed
    const zt = zb + g.H;              // caisson top
    const zF = zb - v.Tf;             // foundation bottom
    const warn = [];
    if (zt > v.Cr + 1e-6) warn.push(`Đỉnh thùng ${f2(zt)} > Cr ${f2(v.Cr)} (LWL − hb + H)`);
    if (!(v.hb > 0)) warn.push("hb phải > 0");
    if (!(g.B1 > 0)) warn.push("Ô theo Bt âm");

    // x = 0 tại mặt trước thùng, dương về phía bờ
    const eo = Number.isFinite(v.e) && v.e >= 0 ? v.e : 0.6;              // coping overhang
    const bw = Number.isFinite(v.b) && v.b > 0 ? v.b : Math.max(2, 0.2 * g.Bt); // coping width
    const zTopAll = Math.max(v.Cr, zt, v.HWL);
    const zFill = Math.max(zt, v.Cr - v.Tp);       // fill top under pavement
    const slopeW = Math.max(0, zt - zb);           // rubble 1:1 from caisson rear top to seabed
    const xmin = -g.Ct - v.Tf - Math.max(3, 0.3 * g.Bt);
    const xmax = g.Bt + slopeW + Math.max(2, 0.12 * g.Bt);
    const zmin = zF - Math.max(1, 0.06 * (zTopAll - zF));
    const zmax = zTopAll + Math.max(1.5, 0.08 * (zTopAll - zF));
    const W = 560, ml = 8, mr = 8, mt = 8, mb = 34;
    const s = Math.min((W - ml - mr) / (xmax - xmin), 620 / (zmax - zmin));
    const X = (x) => ml + (x - xmin) * s;
    const Z = (z) => mt + (zmax - z) * s;
    const xL = X(xmin), xR = X(xmax);
    let o = "";

    // đất nền dưới cao độ nền
    o += rect(xL, Z(zb), xR - xL, Z(zmin) - Z(zb), C.soil, 'opacity="0.55"');
    // nước phía biển (tới MWL)
    o += rect(xL, Z(v.MWL), X(-eo) - xL, Z(zb) - Z(v.MWL), "url(#gWater)", 'opacity="0.85"');
    o += rect(X(-eo), Z(Math.min(v.MWL, v.Cr - v.hc)), X(0) - X(-eo), Z(zb) - Z(Math.min(v.MWL, v.Cr - v.hc)), "url(#gWater)", 'opacity="0.85"');
    // san lấp phía sau (trên mái đá) và đá đổ 1:1
    o += poly([[X(g.Bt), Z(zFill)], [xR, Z(zFill)], [xR, Z(zb)], [X(g.Bt + slopeW), Z(zb)], [X(g.Bt), Z(zt)]], "#e9d48a", 'opacity="0.8"');
    o += poly([[X(g.Bt), Z(zt)], [X(g.Bt + slopeW), Z(zb)], [X(g.Bt), Z(zb)]], "url(#pRock)");
    if (zFill > zt) o += rect(X(bw), Z(zFill), X(g.Bt) - X(bw), (zFill - zt) * s, "#e9d48a", 'opacity="0.8"');
    o += text(Math.min(xR - 70, X(g.Bt + slopeW * 0.75)), Z(zb + slopeW * 0.6), "Reclamation", 'class="tg"');
    const sx = X(g.Bt + slopeW / 2) + 8, sz = Z(zb + slopeW / 2) - 2;
    o += text(sx, sz, "1:1", `class="tg" transform="rotate(45 ${sx.toFixed(1)} ${sz.toFixed(1)})"`);
    // lớp phủ mặt bãi
    if (v.Tp > 0) o += rect(X(bw), Z(v.Cr), xR - X(bw), v.Tp * s, C.pave, 'opacity="0.85"');

    // lớp đệm đá móng (hình thang 1:1)
    const fx1 = -g.Ct, fx2 = g.Bt + g.Ct;
    o += poly([[X(fx1 - v.Tf), Z(zb)], [X(fx2 + v.Tf), Z(zb)], [X(fx2), Z(zF)], [X(fx1), Z(zF)]], "url(#pRubble)", 'stroke="#8a826e" stroke-width="0.6"');

    // thùng chìm cắt ngang (theo Bt): bản đáy + chân khay Ct, tường trước Tt, tường sau Ts, vách Tn
    o += rect(X(-g.Ct), Z(zb + g.Td), g.Bd * s, g.Td * s, C.concrete, `stroke="${C.concreteDark}" stroke-width="0.6"`);
    o += rect(X(0), Z(zt), g.Tt * s, (g.H - g.Td) * s, C.concrete);
    o += rect(X(g.Bt - g.Ts), Z(zt), g.Ts * s, (g.H - g.Td) * s, C.concrete);
    if (g.B1 > 0) {
      const ys = cells(g.Tt, g.Tn, g.Km, g.B1);
      const zf = Math.min(zt, zb + g.Td + g.bh);
      ys.forEach(([a, c], i) => {
        o += rect(X(a), Z(zt), (c - a) * s, (g.H - g.Td) * s, "url(#gCell)");
        if (g.bh > 0) o += rect(X(a), Z(zf), (c - a) * s, (zf - zb - g.Td) * s, "url(#pSand)", 'opacity="0.9"');
        if (i < ys.length - 1) o += rect(X(c), Z(zt), g.Tn * s, (g.H - g.Td) * s, C.concrete);
      });
    }

    // mũ bến: nhô ra biển e, rộng b, phần trước sâu hc dưới Cr, phần trên thùng dày tới đỉnh thùng
    const zcb = v.Cr - v.hc;
    const cop = zcb > zt
      ? [[-eo, v.Cr], [bw, v.Cr], [bw, zt], [0, zt], [0, zcb], [-eo, zcb]]
      : [[-eo, v.Cr], [bw, v.Cr], [bw, zt], [-eo, zt]];
    o += poly(cop.map(([x, z]) => [X(x), Z(z)]), C.coping, 'stroke="#5d6672" stroke-width="0.7"');
    o += rect(X(-eo) - 5, Z(v.Cr - 0.1 * v.hc), 5, Math.max(6, (Math.max(v.hc, 0.8) * 0.8) * s), "#4a4a4a"); // fender

    // mực nước
    const lv = (z, name, stroke, dash) =>
      line(xL, Z(z), X(-eo), Z(z), stroke, `stroke-width="1" ${dash ? 'stroke-dasharray="5 3"' : ""}`) +
      text(xL + 4, Z(z) - 3, `${name} ${f2(z)}`, 'class="lv"');
    o += lv(v.HWL, "HWL", C.waterLine, true);
    o += lv(v.MWL, "MWL", C.waterLine, false);
    o += lv(v.LWL, "LWL", C.waterLine, true);
    if (v.CDL > zb && v.CDL < zmax) o += lv(v.CDL, "CDL", C.muted, true);
    o += line(X(g.Bt), Z(v.RWL), xR, Z(v.RWL), C.waterLine, 'stroke-width="1" stroke-dasharray="2 3"');
    o += text(xR - 4, Z(v.RWL) - 3, `RWL ${f2(v.RWL)}`, 'class="lv" text-anchor="end"');

    // cao độ đỉnh Cr
    const cx = X(-eo) - 34;
    o += poly([[cx - 6, Z(v.Cr) - 9], [cx + 6, Z(v.Cr) - 9], [cx, Z(v.Cr)]], "none", `stroke="${C.text}" stroke-width="1"`);
    o += line(cx - 14, Z(v.Cr), X(-eo), Z(v.Cr), C.text, 'stroke-width="0.7"');
    o += text(cx - 16, Z(v.Cr) - 2, `Cr ${f2(v.Cr)}`, 'class="lv" text-anchor="end"');

    // kích thước
    o += dimV(Z(v.LWL), Z(zb), X(-g.Ct - v.Tf) - 12, `hb = ${f2(v.hb)}`, undefined, X(-g.Ct - v.Tf));
    o += dimV(Z(zb), Z(zF), X(fx1) - 4, `Tf ${f2(v.Tf)}`);
    o += dimV(Z(v.Cr), Z(zcb), X(-eo) - 12, `hc ${f2(v.hc)}`);
    o += dimV(Z(zt), Z(zb), X(g.Bt) + 14, `H = ${f2(g.H)}`, X(g.Bt) + 2, X(g.Bt) + 2);
    if (v.Tc > 0) o += dimV(Z(Math.min(v.Cr, zt + v.Tc)), Z(zt), X(bw) + 12, `Tc ${f2(v.Tc)}`, X(bw) + 2, X(bw) + 2);
    if (v.Tp > 0) o += tag(xR - 4, Z(v.Cr) - 4, `Tp ${f2(v.Tp)}`, "end");
    o += dimH(X(0), X(g.Bt), Z(zF) + 16, `Bt = ${f2(g.Bt)}`, Z(zb) + 2, Z(zb) + 2);
    if (g.Ct > 0) o += tag(X(-g.Ct / 2), Z(zb + g.Td) - 3, "Ct");
    o += tag(X(g.Tt) + 3, Z((zb + zt) / 2), "Tt", "start");
    o += tag(X(g.Bt - g.Ts) - 3, Z((zb + zt) / 2), "Ts", "end");
    if (g.Km > 1 && g.B1 > 0) o += tag(X(g.Tt + g.B1 + g.Tn) + 3, Z((zb + zt) / 2) + 14, "Tn", "start");
    o += tag(X(fx2 + v.Tf) + 4, Z(zb) - 3, `▽ ${f2(zb)}`, "start");
    o += tag(X(g.Bt / 2), Z(zt) + 14, `▽ ${f2(zt)}`);

    let Hh = Z(zmin) + mb - 10;
    if (warn.length) { o += text(W / 2, Hh - 4, "⚠ " + warn.join(" · "), 'class="wn" text-anchor="middle"'); Hh += 6; }
    return svgWrap(W, Hh, o, "Quay wall cross-section", "sc");
  }

  window.CSDraw = { caisson: drawCaisson, section: drawSection };
})();
