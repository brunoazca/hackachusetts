/* Piper mockup behaviour. Vanilla JS, no build. Illustrative data only. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = "http://www.w3.org/2000/svg";
  const svg = (tag, attrs = {}, parent) => {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
  };
  const html = (s) => { const t = document.createElement("template"); t.innerHTML = s.trim(); return t.content.firstElementChild; };
  const root = document.documentElement;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches || root.dataset.motion === "reduced";
  const cssVar = (name, el = root) => getComputedStyle(el).getPropertyValue(name).trim();
  const params = new URLSearchParams(location.search);
  if (params.has("static")) root.dataset.motion = "reduced";
  if (params.get("theme") === "bone") root.dataset.theme = "bone";

  // deterministic rng
  let seed = 7;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const gauss = () => { let u = 0, v = 0; while (!u) u = rnd(); while (!v) v = rnd(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  /* ---------------- theme + motion toggles ---------------- */
  function setTheme(t) {
    root.dataset.theme = t;
    $$("[data-theme-set]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.themeSet === t)));
    renderSwatches();
  }
  $$("[data-theme-set]").forEach((b) => b.addEventListener("click", () => setTheme(b.dataset.themeSet)));
  $("#theme-quick").addEventListener("click", () => setTheme(root.dataset.theme === "bone" ? "night" : "bone"));
  const rm = $("#reduce-motion");
  if (root.dataset.motion === "reduced") rm.setAttribute("aria-checked", "true");
  if (root.dataset.theme === "bone") $$("[data-theme-set]").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.themeSet === "bone")));
  rm.addEventListener("click", () => {
    const on = rm.getAttribute("aria-checked") !== "true";
    rm.setAttribute("aria-checked", String(on));
    if (on) root.dataset.motion = "reduced"; else delete root.dataset.motion;
  });
  // generic switches / segmented controls
  document.addEventListener("click", (e) => {
    const sw = e.target.closest(".switch:not([id])");
    if (sw && !sw.closest(".lens")) sw.setAttribute("aria-checked", String(sw.getAttribute("aria-checked") !== "true"));
    const rb = e.target.closest('.seg [role="radio"]:not([data-theme-set])');
    if (rb) $$('[role="radio"]', rb.parentElement).forEach((b) => b.setAttribute("aria-checked", String(b === rb)));
  });

  /* ---------------- intro ---------------- */
  function primeDraw(scope) {
    $$(".draw", scope).forEach((p) => {
      const len = Math.ceil(p.getTotalLength()) + 2;
      p.style.setProperty("--len", len);
    });
  }
  primeDraw($("#intro"));
  $("#replay-intro").addEventListener("click", () => {
    const intro = $("#intro");
    $$(".draw, .pop, .fade-up", intro).forEach((el) => { el.style.animation = "none"; void el.getBoundingClientRect(); el.style.animation = ""; });
  });

  /* ---------------- frame scaling ---------------- */
  const wrap = $("#frame-wrap"), scaleEl = $("#frame-scale");
  const fit = () => { const s = Math.min(1, wrap.clientWidth / 1280); scaleEl.style.transform = `scale(${s})`; wrap.style.height = `${800 * s}px`; };
  new ResizeObserver(fit).observe(wrap); fit();

  /* ---------------- data (illustrative) ---------------- */
  const SITES = [
    { id: "s3", rank: 3, street: "Normandy St", zip: "02121", x: 640, y: 470, reports: 16, back: 9, monitored: 11, p: 58, lot: { x: 724, y: 424, d: 31 } },
    { id: "s1", rank: 1, street: "Blue Hill Ave", zip: "02121", x: 560, y: 545, reports: 22, back: 12, monitored: 14, p: 66 },
    { id: "s2", rank: 2, street: "Dudley St", zip: "02119", x: 505, y: 360, reports: 19, back: 10, monitored: 9, p: 61 },
    { id: "s4", rank: 4, street: "Columbia Rd", zip: "02125", x: 735, y: 520, reports: 15, back: 7, monitored: 8, p: 52 },
    { id: "s5", rank: 5, street: "Geneva Ave", zip: "02121", x: 690, y: 585, reports: 14, back: 6, monitored: 9, p: 49 },
    { id: "s6", rank: 6, street: "Washington St", zip: "02119", x: 450, y: 430, reports: 13, back: 5, monitored: 7, p: 47 },
    { id: "s7", rank: 7, street: "Dorchester Ave", zip: "02127", x: 790, y: 395, reports: 12, back: 4, monitored: 6, p: 44 },
    { id: "s8", rank: 8, street: "Hancock St", zip: "02125", x: 700, y: 470, reports: 12, back: 4, monitored: 8, p: 41 },
    { id: "s9", rank: 9, street: "Bowdoin St", zip: "02122", x: 655, y: 640, reports: 11, back: 3, monitored: 5, p: 38 },
    { id: "s10", rank: 10, street: "Warren St", zip: "02119", x: 470, y: 505, reports: 10, back: 3, monitored: 6, p: 35 },
  ].sort((a, b) => a.rank - b.rank);
  const byId = Object.fromEntries(SITES.map((s) => [s.id, s]));
  const numberWords = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen"];

  /* ---------------- map ---------------- */
  const map = $("#map"), world = $("#world");
  function buildMap() {
    // water: harbor east + river north
    svg("path", { class: "water", d: "M880 0 H1280 V800 H1010 C980 700 1020 620 960 560 C910 510 960 440 900 380 C850 330 900 260 860 200 C830 150 870 60 880 0Z" }, $("#g-water"));
    svg("path", { class: "water", d: "M0 120 C200 150 360 90 520 130 C640 160 760 120 880 140 L880 175 C760 160 640 200 520 170 C360 130 200 190 0 160Z" }, $("#g-water"));
    const roads = $("#g-roads");
    for (let i = 0; i < 26; i++) { // minor grid, slightly skewed
      const y = 190 + i * 24 + rnd() * 6;
      svg("path", { class: "road", d: `M${rnd() * 120} ${y} L${880 + rnd() * 60} ${y + 40 - rnd() * 80}`, "stroke-width": 1 }, roads);
    }
    for (let i = 0; i < 30; i++) {
      const x = 40 + i * 30 + rnd() * 8;
      svg("path", { class: "road", d: `M${x} ${180} L${x - 60 + rnd() * 40} 800`, "stroke-width": 1 }, roads);
    }
    [["M300 180 C420 320 520 420 560 800", 3], ["M480 180 C560 300 640 380 760 800", 3], ["M120 300 C380 360 640 340 900 420", 3], ["M200 620 C420 560 640 600 960 560", 3]]
      .forEach(([d, w]) => svg("path", { class: "road major", d, "stroke-width": w }, roads));
    const labels = $("#g-labels");
    [["ROXBURY", 430, 300], ["DORCHESTER", 640, 690], ["SOUTH BOSTON", 820, 300], ["MATTAPAN", 470, 760], ["Boston Harbor", 1060, 300]]
      .forEach(([t, x, y]) => { const el = svg("text", { class: "label", x, y }, labels); el.textContent = t; });
    // listening-gap tracts + forecast cells
    svg("path", { class: "gap-tract", d: "M380 620 L560 600 L600 760 L360 780Z" }, $("#g-gap"));
    svg("path", { class: "gap-tract", d: "M330 400 L430 380 L450 470 L340 490Z" }, $("#g-gap"));
    const fc = $("#g-forecast");
    for (let gx = 0; gx < 8; gx++) for (let gy = 0; gy < 6; gy++) {
      const band = rnd(); if (band < 0.45) continue;
      svg("rect", { class: "forecast-cell", x: 470 + gx * 40, y: 380 + gy * 40, width: 40, height: 40, opacity: band > 0.85 ? 0.85 : band > 0.65 ? 0.5 : 0.25 }, fc);
    }
    // reports
    const rep = $("#g-reports");
    SITES.forEach((s) => {
      const n = 14 + Math.round(rnd() * 8);
      for (let i = 0; i < n; i++) {
        const x = s.x + gauss() * 26, y = s.y + gauss() * 22, k = rnd();
        if (k < 0.1) svg("circle", { class: "dot-return", cx: x, cy: y, r: 2.4 }, rep);
        else if (k < 0.45) svg("circle", { class: "dot-open", cx: x, cy: y, r: 2.4 }, rep);
        else svg("circle", { class: "dot-closed", cx: x, cy: y, r: 2.4 }, rep);
      }
    });
    for (let i = 0; i < 220; i++) {
      const x = 120 + rnd() * 780, y = 200 + rnd() * 580; if (x > 860 && y < 380) continue;
      svg("circle", rnd() < 0.4 ? { class: "dot-open", cx: x, cy: y, r: 2 } : { class: "dot-closed", cx: x, cy: y, r: 2 }, rep);
    }
    // drivers (outline glyphs)
    const dr = $("#g-drivers");
    const glyph = (type, x, y) => {
      if (type === "food") svg("rect", { class: "driver", x: x - 5, y: y - 5, width: 10, height: 10 }, dr);
      if (type === "shelter") svg("path", { class: "driver", d: `M${x} ${y - 7} L${x + 7} ${y} L${x} ${y + 7} L${x - 7} ${y}Z` }, dr);
      if (type === "works") svg("path", { class: "driver", d: `M${x} ${y - 6} L${x + 6} ${y + 5} L${x - 6} ${y + 5}Z` }, dr);
      if (type === "bin") { svg("circle", { class: "driver", cx: x, cy: y, r: 5 }, dr); svg("circle", { cx: x, cy: y, r: 1.2, fill: "var(--p-fg-2)" }, dr); }
    };
    SITES.slice(0, 5).forEach((s, i) => glyph(["food", "works", "bin", "food", "food"][i], s.x + 30 + rnd() * 20, s.y - 26 - rnd() * 10));
    glyph("shelter", 724, 424);
    // tune path
    const g = $("#g-tune");
    svg("path", { id: "tune-path", class: "tune-path", d: "M724 424 Q690 420 646 466" }, g);
    // chronic sites with rings
    const gs = $("#g-sites");
    SITES.forEach((s) => {
      const grp = svg("g", { class: "site", tabindex: "0", role: "button", "data-id": s.id, "aria-label": `Chronic site ${s.rank}: ${s.street}, ${s.back} came back` }, gs);
      const rings = Math.min(3, Math.max(1, Math.round(s.back / 4)));
      for (let i = rings; i >= 1; i--) svg("circle", { class: "ring", cx: s.x, cy: s.y, r: 6 + 6 * i, "stroke-opacity": (1 - 0.25 * i).toFixed(2) }, grp);
      svg("circle", { class: "sel", cx: s.x, cy: s.y, r: 6 + 6 * rings + 4 }, grp);
      svg("circle", { class: "dot-return", cx: s.x, cy: s.y, r: 4 }, grp);
      svg("circle", { cx: s.x, cy: s.y, r: 28, fill: "transparent" }, grp); // hit area
    });
  }
  buildMap();
  // phone map: static copy without interactive bits
  (() => {
    const pm = $("#phone-map");
    pm.innerHTML = world.innerHTML.replace(/ id="[^"]+"/g, "").replace(/tabindex="0"/g, "").replace(/role="button"/g, "");
  })();

  function animateRings(grp) {
    if (reduced()) return;
    $$(".ring", grp).reverse().forEach((r, i) => { r.classList.remove("ring-in"); void r.getBBox(); r.style.animationDelay = `${i * 80}ms`; r.classList.add("ring-in"); });
  }
  // map reveal
  if (!reduced()) $$("#g-sites .site").forEach((g, i) => setTimeout(() => animateRings(g), 400 + i * 60));

  // camera
  let cam = { x: 0, y: 0, k: 1 };
  const CLEAR = { left: 288, right: 1280 - 424, top: 80, bottom: 800 - 136 };
  function setCam(c) {
    cam = c; world.style.transition = reduced() ? "none" : "";
    world.style.transform = `translate(${c.x}px, ${c.y}px) scale(${c.k})`;
  }
  function flyTo(x, y, k = 1.6) {
    const cx = (CLEAR.left + CLEAR.right) / 2, cy = (CLEAR.top + CLEAR.bottom) / 2;
    setCam({ x: cx - x * k, y: cy - y * k, k });
  }
  $$("[data-zoom]").forEach((b) => b.addEventListener("click", () => {
    const z = +b.dataset.zoom;
    if (!z) return setCam({ x: 0, y: 0, k: 1 });
    const k = Math.max(1, Math.min(3, cam.k * (z > 0 ? 1.25 : 0.8)));
    const cx = 640, cy = 400; setCam({ x: cx - (cx - cam.x) * (k / cam.k), y: cy - (cy - cam.y) * (k / cam.k), k });
  }));

  // lenses
  $$(".lens").forEach((row) => {
    const sw = $(".switch", row);
    const toggle = () => {
      const on = sw.getAttribute("aria-checked") !== "true";
      sw.setAttribute("aria-checked", String(on));
      $("#" + row.dataset.layer).classList.toggle("layer-hidden", !on);
    };
    row.addEventListener("click", toggle);
  });

  // hover card
  const overlay = $("#overlay-root");
  let hover;
  map.addEventListener("pointerover", (e) => {
    const g = e.target.closest(".site"); if (!g) return;
    const s = byId[g.dataset.id]; hover?.remove();
    const px = s.x * cam.k + cam.x, py = s.y * cam.k + cam.y;
    hover = html(`<div class="hovercard" style="left:${px + 24}px;top:${py - 30}px"><span class="eyebrow">Chronic site · ${s.rank} of 10</span><div class="t-ui" style="font-weight:600;margin:2px 0">${s.street}, ${s.zip}</div><div class="t-data fg3">${s.reports} reports · ${s.back} came back</div></div>`);
    overlay.appendChild(hover);
  });
  map.addEventListener("pointerout", (e) => { if (e.target.closest(".site")) { hover?.remove(); hover = null; } });

  /* ---------------- side panel ---------------- */
  const body = $("#side-body");
  let selected = null, tab = "inspect";
  const icon = {
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m5 12 7-7 7 7M12 19V5"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m15 18-6-6 6-6"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m9 18 6-6-6-6"/></svg>',
    print: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
  };

  function countUp(el) {
    const to = +el.dataset.to, suffix = el.dataset.suffix || "";
    if (reduced()) { el.textContent = to + suffix; return; }
    const t0 = performance.now();
    const step = (t) => { const p = Math.min(1, (t - t0) / 600); const e = 1 - Math.pow(1 - p, 3); el.textContent = Math.round(to * e) + suffix; if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }

  function renderTop10() {
    body.innerHTML = "";
    const v = html(`<div class="rise"><div class="row" style="justify-content:space-between"><span class="eyebrow">This week's 10</span>
      <div class="seg" role="radiogroup" aria-label="Ranking"><button role="radio" aria-checked="true">Citywide</button><button role="radio" aria-checked="false">By neighborhood</button></div></div>
      <p class="t-headline font-display" style="margin:12px 0 8px">Where it keeps coming back.</p>
      <ol class="top10" id="top10" aria-label="Top 10 chronic sites (map list)"></ol>
      <p class="t-small fg3" style="margin-top:12px">Ranked by returns, reports and recency. Reports are not rat counts.</p></div>`);
    body.appendChild(v);
    const ol = $("#top10", v);
    SITES.forEach((s) => {
      const li = html(`<li><button data-id="${s.id}"><span class="rank">${String(s.rank).padStart(2, "0")}</span><span class="st"><b>${s.street}, ${s.zip}</b><span>${s.reports} reports · ${s.back} back</span></span>
        <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="2.5" fill="var(--p-return)"/>${[1, 2, 3].slice(0, Math.min(3, Math.round(s.back / 3))).map((i) => `<circle cx="11" cy="11" r="${2.5 + i * 2.8}" fill="none" stroke="var(--p-return)" stroke-opacity="${1 - i * .25}"/>`).join("")}</svg></button></li>`);
      ol.appendChild(li);
    });
    $$("button[data-id]", ol).forEach((b) => b.addEventListener("click", () => select(b.dataset.id)));
  }

  function returnTimeline(s) {
    const W = 360, H = 72, t = svg("svg", { class: "ret-tl", viewBox: `0 0 ${W} ${H}`, role: "img", "aria-label": `${s.reports} reports from 2024 to 2026; ${s.back} came back after a closure` });
    svg("line", { class: "base", x1: 0, x2: W, y1: 34, y2: 34 }, t);
    ["2024", "2025", "2026"].forEach((y, i) => { const tx = svg("text", { class: "axis", x: 4 + i * 160, y: 66 }, t); tx.textContent = y; });
    let x = 10; const pts = [];
    for (let i = 0; i < s.reports; i++) { x += 12 + (i % 3) * 6; pts.push(x); }
    const scale = (W - 20) / (pts[pts.length - 1] || 1);
    const backIdx = new Set(); for (let i = 2; backIdx.size < s.back && i < s.reports; i += 1 + (i % 2)) backIdx.add(i);
    pts.forEach((px, i) => {
      const cx = 10 + (px - 10) * scale * 0.95;
      if (backIdx.has(i)) {
        const prev = 10 + (pts[i - 1] - 10) * scale * 0.95;
        svg("path", { class: "arc", d: `M${prev} 30 Q${(prev + cx) / 2} 12 ${cx} 30` }, t);
        svg("circle", { cx, cy: 34, r: 4, fill: "var(--p-return)" }, t);
        svg("circle", { cx, cy: 34, r: 7, fill: "none", stroke: "var(--p-return)", "stroke-opacity": .6 }, t);
      } else svg("circle", { cx, cy: 34, r: 4, fill: i % 2 ? "none" : "var(--p-fg)", stroke: "var(--p-fg-3)" }, t);
      if (i % 2 === 0) svg("line", { x1: cx, x2: cx, y1: 42, y2: 50, stroke: "var(--p-fg-3)" }, t);
    });
    return t;
  }

  function renderDossier(s) {
    body.innerHTML = "";
    const v = html(`<div class="rise">
      <div class="row" style="justify-content:space-between"><span class="eyebrow">Chronic site · ${s.rank} of 10</span>
        <span class="row" style="gap:0"><button class="icon-btn" data-nav="-1" aria-label="Previous site (K)">${icon.chevL}</button><button class="icon-btn" data-nav="1" aria-label="Next site (J)">${icon.chevR}</button><button class="icon-btn" data-close aria-label="Close (Esc)">${icon.x}</button></span></div>
      <h3 class="t-headline font-display dossier-h">Monitored ${numberWords[s.monitored] || s.monitored} times.</h3>
      <p class="t-ui fg2">${s.street}, ${s.zip}</p>
      <div class="stats"><div><div class="t-data-lg" data-to="${s.reports}">0</div><div class="t-small">reports</div></div><div><div class="t-data-lg c-return" data-to="${s.back}">0</div><div class="t-small">came back</div></div><div><div class="t-data-lg c-forecast" data-to="${s.p}" data-suffix="%">0</div><div class="t-small">in 60 days</div></div></div>
      <div class="sec"><span class="eyebrow">Return timeline</span><div id="rtl"></div></div>
      <div class="sec"><span class="eyebrow">Two voices · latest report</span><div class="voices"><div class="voice"><span class="eyebrow">Resident</span><p class="t-body">“Rats by the dumpsters, again.”</p></div><div class="voice city"><span class="eyebrow">City · closed Sep 10</span><p>Inspected. Will monitor.</p></div></div></div>
      <div class="sec"><span class="eyebrow">What feeds it · within 100 m</span>
        <div class="row" style="flex-wrap:wrap"><button class="chip chip-driver"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--p-fg-2)" stroke-width="1.5"><rect x="3" y="3" width="10" height="10"/></svg>Trash out early <span class="n">7</span></button>
        ${s.lot ? `<button class="chip chip-driver"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--p-fg-2)" stroke-width="1.5"><path d="M8 1.5 14.5 8 8 14.5 1.5 8Z"/></svg>Vacant lot · ${s.lot.d} m <span class="n">1</span></button>` : ""}
        <button class="chip chip-driver"><svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--p-fg-2)" stroke-width="1.5"><path d="M8 2 14 13H2Z"/></svg>Demolition <span class="n">1</span></button></div>
        <p class="t-data fg3" style="margin-top:8px">built 1910 · 3 units · not owner-occupied · owner <span class="private"><span class="blur" aria-hidden="true">Xxxxx Xxxxxx</span><button class="icon-btn" data-reveal aria-label="Reveal owner name (logged)">${icon.eye}</button></span></p>
        ${s.lot ? `<label class="row t-ui" style="margin-top:8px"><button class="switch" role="switch" aria-checked="false" id="tune-toggle" aria-label="Show the Tune from the vacant lot"></button> Show the Tune · follow the rats</label>` : ""}</div>
      <div class="sec"><span class="eyebrow">Next 60 days</span><div class="prob" style="margin:6px 0"><i style="width:${s.p}%"></i></div><span class="t-small fg3">Model estimate · backtested</span></div>
      <div class="sec stack"><span class="eyebrow">Recommended</span>
        <div class="action escalate" data-action="violation"><span class="eyebrow">ISD · Code enforcement</span><b class="t-title">Issue a violation, not another visit</b>
          <p class="because">Monitoring left repeats at 14.1% → 14.2%; violations cut them to 12.2%.</p>
          <p class="t-small fg3">Source: 311 closures, 2025</p>
          <div class="row actions"><button class="btn btn-primary" data-approve>Approve</button><button class="btn btn-secondary">Edit</button><button class="btn btn-ghost" data-reject>Reject</button></div></div>
        ${s.lot ? `<div class="action" data-action="lot"><span class="eyebrow">Parks · Vacant lot</span><b class="t-title">Clear and bait the lot next door</b><p class="because">A vacant parcel ${s.lot.d} m away; returns cluster on its side of the block.</p>
          <div class="row actions"><button class="btn btn-primary" data-approve>Approve</button><button class="btn btn-secondary">Edit</button><button class="btn btn-ghost" data-reject>Reject</button></div></div>` : ""}
      </div>
      <p class="sec t-small fg3">Sources: 311 (updated 4 min ago) · Assessing FY2026 · model run Oct 24</p>
    </div>`);
    body.appendChild(v);
    $("#rtl", v).appendChild(returnTimeline(s));
    $$("[data-to]", v).forEach(countUp);
    $("[data-close]", v).addEventListener("click", () => select(null));
    $$("[data-nav]", v).forEach((b) => b.addEventListener("click", () => step(+b.dataset.nav)));
    $("[data-reveal]", v).addEventListener("click", (e) => reveal(e.currentTarget.closest(".private"), "R. Whitcombe Holdings"));
    $$("[data-approve]", v).forEach((b) => b.addEventListener("click", () => approve(s, b.closest(".action"))));
    $$("[data-reject]", v).forEach((b) => b.addEventListener("click", () => { const a = b.closest(".action"); a.innerHTML = `<div class="row"><span class="t-small fg3" style="flex:1">Rejected: ${$("b", a)?.textContent || "action"}</span><button class="btn btn-ghost btn-sm">Undo</button></div>`; }));
    const tt = $("#tune-toggle", v);
    if (tt) tt.addEventListener("click", () => { const on = tt.getAttribute("aria-checked") !== "true"; tt.setAttribute("aria-checked", String(on)); on ? tuneStart() : tuneStop(); });
    body.scrollTop = 0;
  }

  function reveal(el, value) {
    el.innerHTML = `<span class="t-data" style="color:var(--p-fg)">${value}</span> <span class="revealed-note">revealed · logged ${new Date().toTimeString().slice(0, 5)}</span>`;
  }
  $("#demo-private button").addEventListener("click", () => reveal($("#demo-private"), "Harbor Row Realty LLC"));

  function select(id) {
    $$("#g-sites .site").forEach((g) => g.classList.toggle("selected", g.dataset.id === id));
    tuneStop();
    selected = id;
    setTab("inspect");
    $("#sr-status").textContent = id ? `Selected ${byId[id].street}, ${byId[id].back} came back` : "Selection cleared";
    if (!id) { setCam({ x: 0, y: 0, k: 1 }); return; }
    const s = byId[id];
    flyTo(s.x, s.y, 1.6);
    animateRings($(`#g-sites .site[data-id="${id}"]`));
  }
  function step(d) {
    const i = SITES.findIndex((s) => s.id === selected);
    select(SITES[(i + d + SITES.length) % SITES.length].id);
  }
  $$("#g-sites .site").forEach((g) => {
    g.addEventListener("click", () => select(g.dataset.id));
    g.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(g.dataset.id); } });
  });

  /* ---------------- the Tune ---------------- */
  let tuneRaf = 0, tuneTimer = 0;
  const tuneG = $("#g-tune"), tunePath = $("#tune-path"), appRoot = $("#appRoot");
  function tuneStart() {
    tuneStop();
    if (reduced()) { appRoot.classList.add("tune-static"); return; }
    const L = tunePath.getTotalLength();
    const dots = [0, 1, 2, 3, 4].map(() => svg("circle", { class: "tune-dot", r: 2.4 }, tuneG));
    const t0 = performance.now();
    const frame = (t) => {
      const base = ((t - t0) % 2400) / 2400;
      dots.forEach((d, i) => { const p = (base + i * 0.2) % 1; const pt = tunePath.getPointAtLength(p * L); d.setAttribute("cx", pt.x); d.setAttribute("cy", pt.y); d.setAttribute("opacity", (Math.sin(p * Math.PI) * 0.9 + 0.1).toFixed(2)); });
      tuneRaf = requestAnimationFrame(frame);
    };
    tuneRaf = requestAnimationFrame(frame);
    tuneTimer = setTimeout(() => { cancelAnimationFrame(tuneRaf); $$(".tune-dot", tuneG).forEach((d) => d.remove()); appRoot.classList.add("tune-static"); }, 8000);
  }
  function tuneStop() {
    cancelAnimationFrame(tuneRaf); clearTimeout(tuneTimer);
    $$(".tune-dot", tuneG).forEach((d) => d.remove()); appRoot.classList.remove("tune-static");
  }

  /* ---------------- Ask ---------------- */
  function renderAsk(q) {
    body.innerHTML = "";
    const v = html(`<div class="stack" style="gap:16px;min-height:100%">
      <div class="msg-user t-body">${q || "Where does monitoring keep failing?"}</div>
      <div class="msg-piper"><svg width="28" height="16" viewBox="14 10 86 46" style="color:var(--p-accent);flex:none;margin-top:4px" aria-hidden="true"><use href="#rat-mark"/></svg>
        <div class="stack" style="gap:10px">
          <details class="ticker"><summary>→ 4 steps · 1.2 s</summary>
            <span>→ looked up closures tagged monitoring since 2024</span><span>→ joined returns within 60 days</span><span>→ ranked 1,912 addresses</span><span>→ checked parcels within 40 m</span></details>
          <p class="t-body">Three sites were monitored 9 or more times and still came back. Normandy St also has a vacant lot 31 m away.</p>
          <div class="row" style="flex-wrap:wrap"><button class="chip" data-id="s3"><span class="sd" style="background:var(--p-return)"></span>Normandy St</button><button class="chip" data-id="s1"><span class="sd" style="background:var(--p-return)"></span>Blue Hill Ave</button><button class="chip" data-id="s2"><span class="sd" style="background:var(--p-return)"></span>Dudley St</button></div>
          <div class="row" style="flex-wrap:wrap"><button class="chip chip-source">311 · Analyze Boston</button><button class="chip chip-source">What worked · 2025</button></div>
        </div></div>
      <div style="flex:1"></div>
      <div class="row" style="flex-wrap:wrap"><button class="chip">What will rise next month?</button><button class="chip">Compare Roxbury and Dorchester</button></div>
      <form class="composer" id="ask-form"><label class="sr-only" for="ask-in">Ask Piper</label><textarea id="ask-in" rows="1" placeholder="Ask about a place, a site, or a trend…"></textarea><button class="btn btn-primary btn-sm" aria-label="Send">${icon.up}</button></form>
    </div>`);
    body.appendChild(v);
    $$("button.chip[data-id]", v).forEach((b) => b.addEventListener("click", () => select(b.dataset.id)));
    $("#ask-form", v).addEventListener("submit", (e) => { e.preventDefault(); const val = $("#ask-in", v).value.trim(); if (val) renderAsk(val); });
  }

  /* ---------------- Findings ---------------- */
  function findingCard(compact) {
    const el = html(`<article class="${compact ? "" : "card "}finding" style="${compact ? "padding:0" : ""}">
      <span class="eyebrow">Finding 01 · What worked</span>
      <h3 class="t-headline font-display">Monitoring changes nothing. Violations do.</h3>
      <p class="t-small fg2">Share of addresses with a new report within 60 days, before and after each closure type.</p>
      <svg viewBox="0 0 320 140" role="img" aria-label="Monitoring: 14.1% before, 14.2% after. Violation: 15.3% before, 12.2% after."></svg>
      <div class="row" style="flex-wrap:wrap"><span class="t-data">monitoring 14.1% → 14.2% · violation 15.3% → 12.2%</span><span class="strength moderate">moderate</span></div>
      <p class="t-small fg3">Reports, not rats. Addresses differ in who reports; rates control for 311 volume.</p>
      <div class="row" style="flex-wrap:wrap"><button class="chip chip-source">311 · 2025 closures</button><button class="btn btn-secondary btn-sm" data-show>Show on map</button></div>
    </article>`);
    const c = $("svg", el);
    [0, 35, 70, 105].forEach((y) => svg("line", { x1: 0, x2: 320, y1: y + 10, y2: y + 10, stroke: "var(--p-line)", "stroke-dasharray": "2 4" }, c));
    const bars = [["Monitoring", 14.1, 14.2, 30], ["Violation", 15.3, 12.2, 190]];
    bars.forEach(([name, a, b, x]) => {
      const hA = a * 6, hB = b * 6;
      svg("rect", { x, y: 115 - hA, width: 36, height: hA, rx: 2, fill: "var(--p-fg-3)", opacity: .6 }, c);
      svg("rect", { x: x + 42, y: 115 - hB, width: 36, height: hB, rx: 2, fill: name === "Violation" ? "var(--p-held)" : "var(--p-return)" }, c);
      const t = svg("text", { x, y: 132, fill: "var(--p-fg-3)", "font-family": "var(--font-mono)", "font-size": 11 }, c); t.textContent = name.toLowerCase();
      const v1 = svg("text", { x: x + 2, y: 110 - hA, fill: "var(--p-fg-2)", "font-family": "var(--font-mono)", "font-size": 10 }, c); v1.textContent = a;
      const v2 = svg("text", { x: x + 44, y: 110 - hB, fill: "var(--p-fg)", "font-family": "var(--font-mono)", "font-size": 10 }, c); v2.textContent = b;
    });
    return el;
  }
  function renderFindings() {
    body.innerHTML = "";
    const v = html(`<div class="stack rise" style="gap:12px"></div>`);
    v.appendChild(findingCard(false));
    v.appendChild(html(`<article class="card finding"><span class="eyebrow">Finding 06 · Weather</span><h3 class="t-headline font-display">Rain: no effect.</h3>
      <p class="t-small fg2">Weekly reports against rainfall, 2023–2026, controlling for season.</p><div class="row"><span class="t-data">no measurable link</span><span class="strength none">none</span></div>
      <p class="t-small fg3">Null results get the same card. Honesty is part of the style.</p></article>`));
    body.appendChild(v);
    $$("[data-show]", v).forEach((b) => b.addEventListener("click", () => { $('.lens[data-layer="g-sites"] .switch').setAttribute("aria-checked", "true"); $("#g-sites").classList.remove("layer-hidden"); select("s3"); }));
  }
  $("#finding-demo").appendChild(findingCard(true));

  function setTab(t) {
    tab = t;
    $$('[role="tab"]').forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === t)));
    if (t === "inspect") selected ? renderDossier(byId[selected]) : renderTop10();
    if (t === "ask") renderAsk();
    if (t === "findings") renderFindings();
    if (!reduced()) { body.classList.remove("panel-in"); void body.offsetWidth; body.classList.add("panel-in"); }
  }
  $$('[role="tab"]').forEach((b) => b.addEventListener("click", () => setTab(b.dataset.tab)));
  setTab("inspect");

  /* ---------------- Approve → work order ---------------- */
  let lastFocus = null;
  function approve(s, card) {
    const title = $("b", card).textContent;
    card.classList.add("approved"); card.classList.remove("escalate");
    $(".actions", card).outerHTML = `<p class="t-data c-held">${icon.check.replace("<svg", '<svg width="14" height="14" style="vertical-align:-2px"')} Approved · follow up Dec 23 · <button class="btn btn-ghost btn-sm" data-view>View work order</button></p>`;
    $("[data-view]", card).addEventListener("click", () => openSheet(s, title));
    openSheet(s, title);
  }
  function openSheet(s, title) {
    lastFocus = document.activeElement;
    overlay.innerHTML = "";
    const scrim = html(`<div class="scrim"></div>`);
    const sheet = html(`<div class="sheet" data-theme="bone" role="dialog" aria-modal="true" aria-labelledby="wo-title" data-print="work-order">
      <div class="row"><svg width="40" height="22" viewBox="14 10 86 46" style="color:var(--p-fg)" aria-hidden="true"><use href="#rat-mark"/></svg><span class="font-display" style="font-style:italic;font-weight:500;font-size:22px;color:var(--p-accent)">Piper</span><span style="flex:1"></span><span class="t-data fg3">WO-2026-1024-00${s.rank}</span></div>
      <h3 id="wo-title" class="t-headline-sm font-display" style="margin-top:16px">Work order — ${s.street}, ${s.zip}</h3>
      <div class="fields">
        <div class="field"><span class="eyebrow">Action</span><span class="t-data">${title}</span></div>
        <div class="field"><span class="eyebrow">Owner agency</span><span class="t-data">ISD · Code enforcement</span></div>
        <div class="field"><span class="eyebrow">Site</span><span class="t-data">Specimen ${String(s.rank).padStart(2, "0")} · ${s.reports} reports · ${s.back} came back</span></div>
        <div class="field"><span class="eyebrow">Follow-up</span><span class="t-data">Dec 23, 2026 (+60 days)</span></div>
        <div class="field wide"><span class="eyebrow">Evidence</span><span class="t-data">Monitored ${s.monitored}× without change · violations cut repeats 15.3% → 12.2% · vacant lot 31 m</span></div>
        <div class="field wide"><label class="eyebrow" for="wo-note">Inspector note</label><textarea id="wo-note" rows="2" style="width:100%;margin-top:4px;border:1px solid var(--p-edge);border-radius:10px;background:var(--p-card);color:var(--p-fg);font:var(--t-body);padding:8px 10px"></textarea></div>
      </div>
      <div class="row" style="margin-top:20px"><button class="btn btn-primary">${icon.print.replace("<svg", '<svg width="18" height="18"')} Print</button><button class="btn btn-secondary">Copy text</button><button class="btn btn-ghost" data-close-sheet>Close</button></div>
      <svg class="seal" viewBox="0 0 100 100" role="img" aria-label="Seal: Draft, for inspector use">
        <defs><path id="sealPath" d="M50 50 m-36 0 a36 36 0 1 1 72 0 a36 36 0 1 1 -72 0"/></defs>
        <circle cx="50" cy="50" r="48" fill="var(--p-seal)"/><circle cx="50" cy="50" r="44" fill="none" stroke="#EDE6DA" stroke-opacity=".5" stroke-width=".8"/>
        <text font-family="Atkinson Hyperlegible Mono, monospace" font-size="9.5" letter-spacing="1.6" fill="#EDE6DA"><textPath href="#sealPath">DRAFT · FOR INSPECTOR USE · DRAFT ·</textPath></text>
        <svg x="28" y="36" width="44" height="26" viewBox="14 10 86 46" style="color:#EDE6DA"><use href="#rat-mark"/></svg>
      </svg>
    </div>`);
    overlay.append(scrim, sheet);
    const close = () => { overlay.innerHTML = ""; lastFocus?.focus(); };
    scrim.addEventListener("click", close);
    $("[data-close-sheet]", sheet).addEventListener("click", close);
    sheet.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") { const f = $$("button, textarea", sheet); if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); } else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); } }
    });
    $("textarea", sheet).focus({ preventScroll: true });
    toast("Approved · work order drafted");
  }
  function toast(msg) {
    const t = html(`<div class="toast" role="status">${icon.check.replace("<svg", '<svg width="16" height="16" style="color:var(--p-held)"')}${msg}</div>`);
    $("#appRoot").appendChild(t); setTimeout(() => t.remove(), 4000);
  }

  /* ---------------- ⌘K ---------------- */
  function openCmdk() {
    lastFocus = document.activeElement;
    overlay.innerHTML = "";
    const scrim = html(`<div class="scrim"></div>`);
    const box = html(`<div class="cmdk panel" role="dialog" aria-modal="true" aria-label="Search and ask">
      <input id="cmdk-in" role="combobox" aria-expanded="true" aria-controls="cmdk-list" aria-autocomplete="list" placeholder="Search a street, ZIP, or ask Piper…" autocomplete="off">
      <div role="listbox" id="cmdk-list"></div></div>`);
    overlay.append(scrim, box);
    const input = $("#cmdk-in", box), list = $("#cmdk-list", box);
    let opts = [], idx = 0;
    const draw = () => {
      const q = input.value.toLowerCase();
      const sites = SITES.filter((s) => !q || (s.street + " " + s.zip).toLowerCase().includes(q)).slice(0, 5);
      list.innerHTML = `<div class="grp eyebrow">Sites</div>` +
        sites.map((s) => `<div class="opt" role="option" data-id="${s.id}"><svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="2.5" fill="var(--p-return)"/><circle cx="7" cy="7" r="5.5" fill="none" stroke="var(--p-return)"/></svg>${s.street}, ${s.zip}<span class="meta">${s.reports} reports · ${s.back} back</span></div>`).join("") +
        `<div class="grp eyebrow">Ask Piper</div><div class="opt" role="option" data-ask="1"><svg width="22" height="12" viewBox="14 10 86 46" style="color:var(--p-accent)"><use href="#rat-mark"/></svg>Ask: ${input.value || "Where does monitoring keep failing?"}<span class="meta">↵</span></div>`;
      opts = $$(".opt", list); idx = Math.min(idx, opts.length - 1);
      opts.forEach((o, i) => { o.id = "opt" + i; o.setAttribute("aria-selected", String(i === idx)); o.addEventListener("click", () => run(o)); });
      input.setAttribute("aria-activedescendant", "opt" + idx);
    };
    const close = () => { overlay.innerHTML = ""; lastFocus?.focus(); };
    const run = (o) => { close(); if (o.dataset.id) select(o.dataset.id); else { setTab("ask"); renderAsk(input.value || undefined); } };
    input.addEventListener("input", () => { idx = 0; draw(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { e.preventDefault(); idx = (idx + 1) % opts.length; draw(); }
      if (e.key === "ArrowUp") { e.preventDefault(); idx = (idx - 1 + opts.length) % opts.length; draw(); }
      if (e.key === "Enter") { e.preventDefault(); run(opts[idx]); }
      if (e.key === "Escape") close();
    });
    scrim.addEventListener("click", close);
    draw(); input.focus({ preventScroll: true });
  }
  $("#cmdk-open").addEventListener("click", openCmdk);
  $("#help-btn").addEventListener("click", () => toast("⌘K search · J/K sites · Space play · T theme · Esc close"));

  /* ---------------- timeline ---------------- */
  const tl = $("#tl");
  const WEEKS = 52, weekly = [];
  for (let w = 0; w < WEEKS; w++) { const season = Math.sin(((w - 10) / 52) * Math.PI * 2 - Math.PI / 2) * -0.5 + 0.5; weekly.push(Math.round(30 + season * 70 + rnd() * 18)); }
  const bw = 520 / WEEKS;
  weekly.forEach((v, w) => {
    const h = (v / 120) * 70, r = Math.round(h * 0.18);
    svg("rect", { class: "tl-bar", "data-w": w, x: w * bw + 1, y: 80 - h, width: bw - 2, height: h - r, rx: 1 }, tl);
    svg("rect", { class: "tl-bar-ret", x: w * bw + 1, y: 80 - r, width: bw - 2, height: r }, tl);
  });
  svg("path", { class: "tl-temp", d: weekly.map((_, w) => `${w ? "L" : "M"}${w * bw + bw / 2} ${70 - Math.sin(((w - 12) / 52) * Math.PI * 2) * 22 - 30}`).join(" ") }, tl);
  const sep = 35 * bw; svg("line", { class: "tl-event", x1: sep, x2: sep, y1: 4, y2: 80 }, tl);
  const evt = svg("text", { x: sep + 3, y: 12, fill: "var(--p-accent)", "font-family": "var(--font-mono)", "font-size": 9 }, tl); evt.textContent = "move-out";
  svg("rect", { class: "tl-window", x: 39 * bw, y: 2, width: 13 * bw - 1, height: 80, rx: 2 }, tl);
  let week = 42, playT = 0;
  const monthStart = new Date(2025, 11, 29);
  const setWeek = (w) => {
    week = (w + WEEKS) % WEEKS;
    $$(".tl-bar", tl).forEach((b) => b.classList.toggle("active", +b.dataset.w === week));
    const d = new Date(monthStart.getTime() + week * 7 * 864e5), e = new Date(d.getTime() + 6 * 864e5);
    const f = (x) => x.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const end = d.getMonth() === e.getMonth() ? e.getDate() : f(e);
    $("#tl-label").textContent = `Wk ${week + 1} · ${f(d)}–${end}`;
  };
  setWeek(42);
  const play = $("#tl-play");
  const setPlaying = (on) => {
    clearInterval(playT);
    play.innerHTML = on ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m7 4 13 8-13 8V4z"/></svg>';
    play.setAttribute("aria-label", on ? "Pause (Space)" : "Play weeks (Space)");
    if (on) { setWeek(0); playT = setInterval(() => { if (week >= WEEKS - 1) return setPlaying(false); setWeek(week + 1); if (week % 6 === 0) animateRings($$("#g-sites .site")[week % SITES.length]); }, reduced() ? 120 : 400); }
  };
  let playing = false;
  play.addEventListener("click", () => { playing = !playing; setPlaying(playing); });
  $("#tl-prev").addEventListener("click", () => setWeek(week - 1));
  $("#tl-next").addEventListener("click", () => setWeek(week + 1));

  /* ---------------- keyboard ---------------- */
  document.addEventListener("keydown", (e) => {
    const typing = /INPUT|TEXTAREA/.test(document.activeElement?.tagName || "");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openCmdk(); return; }
    if (typing) return;
    if (e.key === "/") { e.preventDefault(); openCmdk(); }
    else if (e.key === "j" || e.key === "J") step(1);
    else if (e.key === "k" || e.key === "K") step(-1);
    else if (e.key === "t" || e.key === "T") setTheme(root.dataset.theme === "bone" ? "night" : "bone");
    else if (e.key === "Escape" && !overlay.childElementCount && selected) select(null);
    else if (e.key === " " && e.target === document.body) { e.preventDefault(); play.click(); }
  });

  /* ---------------- color section ---------------- */
  const lum = (hex) => { const h = hex.replace("#", ""); const c = [0, 2, 4].map((i) => { const v = parseInt(h.slice(i, i + 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const TOKENS = [
    ["bg", "app, map land", null], ["card", "cards", null], ["line", "hairlines", null], ["edge", "control borders", 3],
    ["fg", "primary text, open dots", 4.5], ["fg-2", "secondary text", 4.5], ["fg-3", "tertiary, closed dots", 4.5],
    ["accent", "brand, actions, focus", 4.5], ["return", "came back", 4.5], ["forecast", "model output", 4.5], ["held", "stayed closed", 4.5], ["seal", "stamps", null],
  ];
  function renderSwatches() {
    const box = $("#swatches"); box.innerHTML = "";
    const bg = cssVar("--p-bg");
    TOKENS.forEach(([t, use, need]) => {
      const v = cssVar("--p-" + t), r = ratio(v, bg);
      const txt = lum(v) > 0.3 ? "var(--c-soot)" : "var(--c-bone)";
      box.appendChild(html(`<div class="swatch"><div class="chip-color" style="background:${v};color:${txt}">${v}</div><div class="meta"><b>${t}</b><span>${use}</span>
        <span>${need ? `${r.toFixed(2)}:1 on bg <b class="${r >= need ? "pass" : "fail"}" style="font:inherit">${r >= need ? "pass" : "fail"} ${need}</b>` : "surface"}</span></div></div>`));
    });
  }
  renderSwatches();
  const ENC = [
    ["Open report", '<circle cx="12" cy="12" r="5" fill="var(--p-fg)" opacity=".85"/>', "filled dot"],
    ["Closed", '<circle cx="12" cy="12" r="5" fill="none" stroke="var(--p-fg-3)"/>', "hollow dot"],
    ["Came back", '<circle cx="12" cy="12" r="4" fill="var(--p-return)"/><circle cx="12" cy="12" r="8" fill="none" stroke="var(--p-return)" opacity=".6"/>', "dot + ring"],
    ["Chronic site", '<circle cx="12" cy="12" r="2.5" fill="var(--p-return)"/><circle cx="12" cy="12" r="6" fill="none" stroke="var(--p-return)"/><circle cx="12" cy="12" r="9.5" fill="none" stroke="var(--p-return)" opacity=".55"/>', "1–5 rings"],
    ["Forecast", '<rect x="3" y="3" width="18" height="18" fill="url(#hatch)" stroke="var(--p-forecast)" stroke-width=".8"/>', "45° hatch"],
    ["Held 60+ days", '<rect x="8" y="8" width="8" height="8" fill="var(--p-held)"/>', "filled square"],
    ["Driver", '<path d="M12 4 20 12 12 20 4 12Z" fill="none" stroke="var(--p-fg-2)" stroke-width="1.5"/>', "outline glyph"],
    ["Listening gap", '<rect x="2" y="2" width="20" height="20" rx="3" fill="url(#dots)" stroke="var(--p-line)"/>', "dot texture"],
    ["Selected", '<circle cx="12" cy="12" r="4" fill="var(--p-return)"/><circle cx="12" cy="12" r="8" fill="none" stroke="var(--p-accent)" stroke-width="2"/>', "brass halo"],
  ];
  $("#encode").innerHTML = ENC.map(([n, g, s]) => `<div class="card"><svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">${g}</svg><b class="t-ui" style="font-weight:600">${n}</b><span class="t-data fg3">${s}</span></div>`).join("");

  /* ---------------- type section ---------------- */
  const TYPES = [
    ["hero", "Bodoni Moda italic · 64/64 · 500", "Follow the rats."],
    ["headline", "Bodoni Moda italic · 36/40 · 500", "Monitored eleven times."],
    ["headline-sm", "Bodoni Moda italic · 28/32 · 500", "Work order — Normandy St"],
    ["title", "Atkinson Next · 18/26 · 600", "Issue a violation, not another visit"],
    ["body", "Atkinson Next · 16/24 · 400", "Three sites were monitored nine or more times and still came back. Il1 0O — every glyph is distinct."],
    ["ui", "Atkinson Next · 14/20 · 500", "Approve · Edit · Reject · Lenses"],
    ["small", "Atkinson Next · 13/18 · 400", "Reports, not rats. Rates control for 311 volume."],
    ["eyebrow", "Atkinson Mono · 11/16 · 500 · +0.08em caps", "Specimen 03 · Normandy St · Obs. 16"],
    ["data", "Atkinson Mono · 13/20 · tabular", "311:101006747135 · Oct 24, 2026 · 14.1% → 14.2%"],
    ["data-lg", "Atkinson Mono · 20/24 · 500 · tabular", "1,284   407   58%"],
  ];
  $("#type-rows").innerHTML = TYPES.map(([k, spec, s]) => `<div class="type-row"><div class="stack" style="gap:2px"><b class="t-ui" style="font-weight:600">text-${k}</b><span class="t-data fg3">${spec}</span></div>
    <div class="t-${k} ${/hero|headline/.test(k) ? "font-display" : ""} ${k === "eyebrow" ? "eyebrow" : ""}">${s}</div></div>`).join("");

  /* ---------------- space + buttons ---------------- */
  $("#space-scale").innerHTML = [2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64].map((n) => `<div class="stack" style="align-items:center;gap:4px;background:none"><div style="width:${n}px;height:${n}px"></div><span class="t-data fg3" style="font-size:11px">${n}</span></div>`).join("");
  const STATES = [["default", ""], ["hover", "is-hover"], ["press", "is-press"], ["focus", "is-focus"], ["disabled", "dis"], ["loading", "load"]];
  const VARIANTS = [["Primary", "btn-primary"], ["Secondary", "btn-secondary"], ["Ghost", "btn-ghost"], ["Escalate", "btn-return"]];
  const grid = $("#btn-states");
  grid.style.gridTemplateColumns = `90px repeat(${VARIANTS.length}, auto)`;
  grid.innerHTML = `<span></span>` + VARIANTS.map(([n]) => `<span class="eyebrow">${n}</span>`).join("") +
    STATES.map(([st, cls]) => `<span class="t-data fg3">${st}</span>` + VARIANTS.map(([n, v]) =>
      `<button class="btn btn-sm ${v} ${cls === "dis" || cls === "load" ? "" : cls}" ${cls === "dis" ? 'aria-disabled="true"' : ""} tabindex="-1">${cls === "load" ? '<span class="loading-dots" aria-label="Loading"><i></i><i></i><i></i></span>' : n === "Escalate" ? "Escalate" : "Approve"}</button>`).join("")).join("");

  /* ---------------- motion lab ---------------- */
  const LAB = [
    ["Rings", "600 ms · ease-out · stagger 80", "Each return adds a ring. Drawn once on select.",
      '<svg width="120" height="120" viewBox="0 0 120 120"><g class="lab-rings">' + [1, 2, 3, 4, 5].map((i) => `<circle class="ring" cx="60" cy="60" r="${8 + 9 * i}" fill="none" stroke="var(--p-return)" stroke-width="1.25" stroke-opacity="${(1 - .17 * i).toFixed(2)}"/>`).join("") + '</g><circle cx="60" cy="60" r="5" fill="var(--p-return)"/></svg>',
      (st) => $$(".ring", st).reverse().forEach((r, i) => { r.classList.remove("ring-in"); void r.getBBox(); r.style.animationDelay = `${i * 80}ms`; r.classList.add("ring-in"); })],
    ["The Tune", "2400 ms loop · linear · stops at 8 s", "Brass notes drift from the source to the site.",
      '<svg width="220" height="110" viewBox="0 0 220 110"><path class="lab-path" d="M200 30 Q120 20 40 80" fill="none" stroke="var(--p-accent)" stroke-dasharray="3 4" opacity=".35"/><path d="M193 23 L207 23 L207 37 L193 37Z" fill="none" stroke="var(--p-fg-2)" stroke-width="1.5" transform="rotate(45 200 30)"/><circle cx="40" cy="80" r="5" fill="var(--p-return)"/><g class="lab-dots"></g></svg>',
      (st) => { const p = $(".lab-path", st), g = $(".lab-dots", st); g.innerHTML = ""; if (reduced()) return; const L = p.getTotalLength(); const ds = [0, 1, 2, 3, 4].map(() => svg("circle", { r: 2.6, fill: "var(--p-accent)" }, g)); const t0 = performance.now(); const f = (t) => { const el = t - t0; const b = (el % 2400) / 2400; ds.forEach((d, i) => { const q = (b + i * .2) % 1, pt = p.getPointAtLength(q * L); d.setAttribute("cx", pt.x); d.setAttribute("cy", pt.y); d.setAttribute("opacity", (Math.sin(q * Math.PI) * .9 + .1).toFixed(2)); }); if (el < 8000) requestAnimationFrame(f); else g.innerHTML = ""; }; requestAnimationFrame(f); }],
    ["Panel in", "320 ms · ease-spring · content stagger 40", "Panels slide 24 px and fade. Content rises 8 px.",
      '<div class="lab-panel card" style="width:170px;padding:12px"><div class="rise"><span class="eyebrow">Specimen 03</span><div class="font-display" style="font-style:italic;font-size:22px;line-height:26px">Monitored eleven times.</div><div class="t-data c-return">9 came back</div></div></div>',
      (st) => { const p = $(".lab-panel", st); p.classList.remove("panel-in"); void p.offsetWidth; p.classList.add("panel-in"); const r = $(".rise", p); const c = r.cloneNode(true); r.replaceWith(c); }],
    ["Count-up", "600 ms · ease-out · tabular", "Stat values count once when a card opens.",
      '<div class="row" style="gap:20px"><div><div class="t-data-lg" data-to="16">16</div><div class="t-small fg3">reports</div></div><div><div class="t-data-lg c-return" data-to="9">9</div><div class="t-small fg3">back</div></div><div><div class="t-data-lg c-forecast" data-to="58" data-suffix="%">58%</div><div class="t-small fg3">60 days</div></div></div>',
      (st) => $$("[data-to]", st).forEach(countUp)],
    ["Approve + seal", "sheet 480 ms ease-out · seal 220 ms stamp, +300 ms", "The work order rises; the oxblood seal lands.",
      '<div class="lab-sheet" data-theme="bone" style="position:relative;width:180px;height:110px;border-radius:12px 12px 0 0;background:var(--p-bg);padding:12px;margin-top:30px"><div class="font-display" style="font-style:italic;font-size:16px;color:var(--p-fg)">Work order</div><div class="t-data" style="color:var(--p-fg-3);font-size:11px">DRAFT · FOR INSPECTOR USE</div><svg class="lab-seal" width="44" height="44" viewBox="0 0 44 44" style="position:absolute;right:10px;bottom:10px;transform:rotate(-8deg)"><circle cx="22" cy="22" r="21" fill="var(--p-seal)"/><circle cx="22" cy="22" r="17" fill="none" stroke="#EDE6DA" stroke-opacity=".5"/></svg></div>',
      (st) => { const s = $(".lab-sheet", st), seal = $(".lab-seal", st); s.style.animation = "none"; seal.style.animation = "none"; void s.offsetWidth; s.style.animation = "sheetIn 480ms var(--ease-out) both"; seal.style.animation = "stamp 220ms var(--ease-stamp) 300ms both"; }],
    ["Live dot", "2000 ms · ease-in-out · the only infinite loop", "Pulses opacity only. Static under reduced motion.",
      '<span class="live"><span class="dot"></span>Live · updated 4 min ago</span>', () => {}],
    ["Loading", "3 × 160 ms · pipe holes", "Loading reuses the three holes of the pipe.",
      '<button class="btn btn-primary"><span class="loading-dots" aria-label="Loading"><i></i><i></i><i></i></span> Refreshing</button>', () => {}],
    ["Line Rat", "1200 + 400 + 240 ms · in-out → out", "The intro and end card. Once per session.",
      '<svg width="200" height="108" viewBox="14 10 86 46" style="color:var(--p-fg)"><path class="draw" d="M70 30 C64 22 54 16 42 17 C30 18 22 26 22 34 C22 40 30 42 40 42 L62 42 C66 42 70 38 70 30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path class="draw" d="M50 18 C50 11 58 11 58 18" fill="none" stroke="currentColor" stroke-width="1.6"/><path class="draw tail" d="M22 36 C12 38 9 46 17 50 L97 50" fill="none" stroke="var(--p-accent)" stroke-width="1.6" stroke-linecap="round"/></svg>',
      (st) => { primeDraw(st); $$(".draw", st).forEach((p) => { p.style.animation = "none"; void p.getBoundingClientRect(); p.style.animation = ""; }); }],
  ];
  const lab = $("#motion-lab");
  LAB.forEach(([name, spec, desc, stage, run]) => {
    const card = html(`<div class="card stack"><div class="stage">${stage}</div><div class="row"><b class="t-ui" style="font-weight:600;flex:1">${name}</b><button class="btn btn-secondary btn-sm">Play</button></div><span class="t-data fg3">${spec}</span><p class="t-small fg2">${desc}</p></div>`);
    lab.appendChild(card);
    const st = $(".stage", card);
    $("button", card).addEventListener("click", () => run(st));
    if (name === "Line Rat") primeDraw(st);
  });

  /* ---------------- deep links for review: ?demo=site | ask | findings | approve | cmdk ---------------- */
  const demo = params.get("demo");
  if (demo) {
    if (!params.has("static")) $("#app").scrollIntoView();
    if (demo === "site" || demo === "approve") { select("s3"); const tt = $("#tune-toggle"); if (tt) tt.click(); }
    if (demo === "approve") $("[data-approve]").click();
    if (demo === "ask") setTab("ask");
    if (demo === "findings") setTab("findings");
    if (demo === "cmdk") openCmdk();
  }
})();
