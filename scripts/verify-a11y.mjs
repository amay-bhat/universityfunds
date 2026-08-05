// Accessibility checks that Lighthouse does not run (tier-1 audit).
//
// Lighthouse scores 100 on every route here; axe-core's automated rules cover
// roughly a third of WCAG. This covers the parts that need a real browser and a
// real keyboard: tab order and focus visibility measured from pixels, the
// Chrome-computed accessibility tree (not our guess at accName), contrast for
// every rendered text run in BOTH colour schemes, 320px/400% reflow, and the
// table-view twin each chart claims as its screen-reader relief.
//
//   node scripts/verify-a11y.mjs [https://universityfunds.vercel.app]
//
// Exits non-zero on the first category with failures, so it can gate a release.
// --json <path> also dumps everything measured, for the audit write-up.

import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";

const args = process.argv.slice(2);
const jsonAt = args.indexOf("--json");
const JSON_OUT = jsonAt === -1 ? null : args[jsonAt + 1];
const BASE = args.find((a) => a.startsWith("http")) ?? "https://universityfunds.vercel.app";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const ROUTES = [
  "/",
  "/explore",
  "/explore/yale",
  "/explore/harvard",
  "/explore/stanford",
  "/explore/mit",
  "/explore/princeton",
  "/translate",
  "/translate?school=yale&year=2020",
  "/compare",
  "/methodology",
  "/glossary",
  "/this-route-does-not-exist",
];

let checks = 0;
const failures = [];
const warnings = [];
const ok = (cond, msg) => {
  checks++;
  if (!cond) failures.push(msg);
  console.log(`${cond ? "PASS  " : "FAIL  "}${msg}`);
  return cond;
};
// Something real but browser-dependent or arguably exempt: recorded, not gating.
const warn = (cond, msg) => {
  checks++;
  if (!cond) warnings.push(msg);
  console.log(`${cond ? "PASS  " : "WARN  "}${msg}`);
  return cond;
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const dump = {};
const snap = () => { if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(dump, null, 1)); };
for (const ev of ["uncaughtException", "unhandledRejection"]) {
  process.on(ev, (e) => { snap(); console.error(`\n${ev}:`, e); process.exit(2); });
}

const browser = await puppeteer.launch({ executablePath: CHROME });
const page = await browser.newPage();
const cdp = await page.createCDPSession();
await cdp.send("Accessibility.enable");

const TABBABLE_HELPERS = `
window.__sig = (e) => e.tagName.toLowerCase() + ":" +
  (e.getAttribute("aria-label") ?? e.textContent ?? "").replace(/\\s+/g, " ").trim().slice(0, 30);
window.__tabbables = () =>
  [...document.querySelectorAll('a[href],button,select,input,textarea,summary,[tabindex]:not([tabindex="-1"])')]
    .filter((e) => {
      const s = getComputedStyle(e);
      return s.display !== "none" && s.visibility !== "hidden" && !e.disabled && Number(s.opacity) !== 0;
    });
`;

const goto = async (route) => {
  // Chrome occasionally detaches the navigating frame on a tiny viewport; one
  // retry keeps a 350-check run from dying on a flake.
  for (let attempt = 0; ; attempt++) {
    try {
      await page.goto(`${BASE}${route}`, { waitUntil: "networkidle0" });
      break;
    } catch (e) {
      if (attempt >= 2) throw e;
      await wait(1000);
    }
  }
  await page.evaluate(TABBABLE_HELPERS);
  await wait(500);
};

// ---------------------------------------------------------------- helpers

// Chrome's own accessibility tree, flattened. Names here are the real
// accName-computed strings, which is the whole point: a hand-rolled accName
// (label.textContent) says a <select> wrapped in a <label> is called
// "Fiscal year of the mixFY2020FY2019…"; Chrome says otherwise.
async function axNodes() {
  const { nodes } = await cdp.send("Accessibility.getFullAXTree");
  const byId = new Map(nodes.map((n) => [n.nodeId, n]));
  return nodes.map((n) => {
    const prop = (name) => n.properties?.find((p) => p.name === name)?.value?.value;
    return {
      id: n.nodeId,
      role: n.role?.value,
      name: n.name?.value ?? "",
      desc: n.description?.value ?? "",
      value: n.value?.value,
      ignored: !!n.ignored,
      backendDOMNodeId: n.backendDOMNodeId,
      expanded: prop("expanded"),
      pressed: prop("pressed"),
      hidden: prop("hidden"),
      hiddenRoot: prop("hiddenRoot"),
      focusable: prop("focusable"),
      level: prop("level"),
      parentRole: n.parentId ? byId.get(n.parentId)?.role?.value : undefined,
      childCount: n.childIds?.length ?? 0,
    };
  });
}

const CONTRAST_PROBE = `(() => {
  const parse = (c) => {
    const m = c.match(/rgba?\\(([^)]+)\\)/);
    if (!m) return null;
    const p = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const over = (fg, bg) => ({
    r: fg.r * fg.a + bg.r * (1 - fg.a),
    g: fg.g * fg.a + bg.g * (1 - fg.a),
    b: fg.b * fg.a + bg.b * (1 - fg.a),
    a: 1,
  });
  const lum = (c) => {
    const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  // Effective background: composite every non-transparent painted ancestor.
  const bgOf = (el) => {
    const stack = [];
    let n = el;
    while (n && n.nodeType === 1) {
      const s = getComputedStyle(n);
      const c = parse(s.backgroundColor);
      if (c && c.a > 0) stack.push(c);
      if (c && c.a === 1) break;
      n = n.parentElement;
    }
    let out = { r: 255, g: 255, b: 255, a: 1 };
    // html/body default: if we ran out, use the documentElement's own colour
    if (!stack.length || stack[stack.length - 1].a < 1) {
      const root = parse(getComputedStyle(document.documentElement).backgroundColor);
      if (root && root.a === 1) out = root;
    }
    for (let i = stack.length - 1; i >= 0; i--) out = over(stack[i], out);
    return out;
  };
  const visible = (el) => {
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };

  const out = [];
  const push = (el, textEl, text, isSvg) => {
    const s = getComputedStyle(textEl);
    const fgRaw = parse(isSvg ? s.fill : s.color);
    if (!fgRaw) return;
    const bg = bgOf(el);
    const fg = fgRaw.a < 1 ? over(fgRaw, bg) : fgRaw;
    const px = parseFloat(s.fontSize);
    const w = s.fontWeight === "bold" ? 700 : Number(s.fontWeight) || 400;
    const large = px >= 24 || (px >= 18.66 && w >= 700);
    const need = large ? 3 : 4.5;
    const r = ratio(fg, bg);
    out.push({
      text: text.replace(/\\s+/g, " ").trim().slice(0, 46),
      tag: textEl.tagName.toLowerCase(),
      cls: (textEl.getAttribute("class") ?? "").slice(0, 70),
      fg: [Math.round(fg.r), Math.round(fg.g), Math.round(fg.b)],
      bg: [Math.round(bg.r), Math.round(bg.g), Math.round(bg.b)],
      px, weight: w, large, need,
      ratio: Math.round(r * 100) / 100,
      pass: r >= need - 0.005,
    });
  };

  // HTML text runs
  const gradientText = [];
  for (const el of document.querySelectorAll("body *")) {
    if (el.closest(".sr-only")) continue;
    if (["SCRIPT","STYLE","NOSCRIPT","SVG","svg"].includes(el.tagName)) continue;
    if (el.closest("svg")) continue;
    if (!visible(el)) continue;
    const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).map((n) => n.textContent).join(" ");
    if (!own.trim()) continue;
    const st = getComputedStyle(el);
    // background-clip: text paints the glyphs with the background image, so
    // computed color (transparent) is not what the eye sees. Measure each
    // gradient stop against the surface instead of reporting a bogus 1:1.
    if ((st.backgroundClip === "text" || st.webkitBackgroundClip === "text") && parse(st.color)?.a === 0) {
      const bg = bgOf(el.parentElement ?? el);
      const px = parseFloat(st.fontSize);
      const w = st.fontWeight === "bold" ? 700 : Number(st.fontWeight) || 400;
      const need = px >= 24 || (px >= 18.66 && w >= 700) ? 3 : 4.5;
      const stops = [...st.backgroundImage.matchAll(/(rgba?\([^)]*\)|lab\([^)]*\)|oklch\([^)]*\))/g)].map((m) => m[1]);
      for (const s of stops) {
        const probe = document.createElement("span");
        probe.style.color = s; el.appendChild(probe);
        const c = parse(getComputedStyle(probe).color); probe.remove();
        if (!c) continue;
        const r = ratio(c.a < 1 ? over(c, bg) : c, bg);
        gradientText.push({
          text: own.replace(/\s+/g, " ").trim().slice(0, 40), stop: s,
          fg: [Math.round(c.r), Math.round(c.g), Math.round(c.b)], bg: [Math.round(bg.r), Math.round(bg.g), Math.round(bg.b)],
          px, weight: w, need, ratio: Math.round(r * 100) / 100, pass: r >= need - 0.005,
        });
      }
      continue;
    }
    push(el, el, own, false);
  }
  // SVG text (recharts axis ticks, on-chart labels) — real text, real 1.4.3
  for (const t of document.querySelectorAll("svg text, svg tspan")) {
    if (t.tagName === "tspan" && t.parentElement.tagName === "text" && t.parentElement.childElementCount === 1) continue;
    if (!t.textContent.trim()) continue;
    const r = t.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const host = t.closest("figure, .viz-root") ?? t.parentElement;
    push(host, t, t.textContent, true);
  }
  // Non-text UI contrast (1.4.11): axis lines / gridlines against the surface
  const surf = (() => { const f = document.querySelector(".viz-root"); return f ? bgOf(f) : null; })();
  const nonText = [];
  if (surf) {
    for (const [role, cssVar] of [["gridline","--viz-grid"],["axis","--viz-axis"]]) {
      const f = document.querySelector(".viz-root");
      const raw = getComputedStyle(f).getPropertyValue(cssVar).trim();
      const probe = document.createElement("span");
      probe.style.color = raw; f.appendChild(probe);
      const c = parse(getComputedStyle(probe).color); probe.remove();
      if (c) nonText.push({ role, cssVar, hex: raw, ratio: Math.round(ratio(c, surf) * 100) / 100 });
    }
  }
  return { runs: out, nonText, surface: surf, gradientText };
})()`;

const FOCUS_STYLE = `(() => {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) return null;
  const s = getComputedStyle(a);
  const r = a.getBoundingClientRect();
  return {
    tag: a.tagName.toLowerCase(),
    sig: window.__sig ? window.__sig(a) : a.tagName.toLowerCase(),
    text: (a.getAttribute("aria-label") ?? a.textContent ?? "").replace(/\\s+/g, " ").trim().slice(0, 54),
    href: a.getAttribute("href"),
    inMain: !!a.closest("main"),
    inHeader: !!a.closest("header"),
    inFooter: !!a.closest("footer"),
    rect: { x: r.x, y: r.y, w: r.width, h: r.height },
    outline: s.outlineStyle + " " + s.outlineWidth + " " + s.outlineColor,
    boxShadow: s.boxShadow,
    matchesFocusVisible: a.matches(":focus-visible"),
    docTop: r.top + window.scrollY,
  };
})()`;

// -------------------------------------------------------- 1. LANDMARKS & HEADINGS
console.log("\n== structure: headings, landmarks, page titles ==");
const structure = {};
for (const route of ROUTES) {
  await goto(route);
  const ax = await axNodes();
  const live = ax.filter((n) => !n.ignored);
  const headings = live.filter((n) => n.role === "heading").map((n) => ({ level: n.level, name: n.name.slice(0, 70) }));
  const lm = live.filter((n) => ["banner", "navigation", "main", "contentinfo", "complementary", "region", "search", "form"].includes(n.role));
  structure[route] = { headings, landmarks: lm.map((n) => ({ role: n.role, name: n.name })) };

  ok(headings.filter((h) => h.level === 1).length === 1, `[${route}] exactly one level-1 heading`);
  let prev = 0;
  const skips = [];
  for (const h of headings) {
    if (prev && h.level > prev + 1) skips.push(`${prev}->${h.level} at "${h.name}"`);
    prev = h.level;
  }
  ok(skips.length === 0, `[${route}] no skipped heading levels${skips.length ? `: ${skips.join("; ")}` : ""}`);
  ok(lm.filter((n) => n.role === "main").length === 1, `[${route}] exactly one main landmark`);
  ok(lm.filter((n) => n.role === "banner").length === 1, `[${route}] one banner`);
  ok(lm.filter((n) => n.role === "contentinfo").length === 1, `[${route}] one contentinfo`);
  const navs = lm.filter((n) => n.role === "navigation");
  const navNames = navs.map((n) => n.name);
  ok(
    navs.length < 2 || new Set(navNames).size === navs.length,
    `[${route}] ${navs.length} navigation landmark(s) are distinguishable: ${JSON.stringify(navNames)}`,
  );
  const title = await page.title();
  structure[route].title = title;
  const DEFAULT_TITLE = "University Endowment Investing Explorer";
  ok(
    route === "/" ? title === DEFAULT_TITLE : title !== DEFAULT_TITLE && title.trim().length > 0,
    `[${route}] document title describes this page, not the site default (${JSON.stringify(title)})`,
  );
  snap();
}
dump.structure = structure;
snap();

// ------------------------------------------------------------------ 2. CHARTS
console.log("\n== charts: figure names, exposed SVG, table twins ==");
const CHART_ROUTES = [
  ["/explore/yale", 2],
  ["/explore/harvard", 2],
  ["/explore/stanford", 1],
  ["/explore/mit", 2],
  ["/explore/princeton", 2],
  ["/compare", 1],
  ["/translate?school=yale&year=2020", 1],
];
dump.charts = {};
for (const [route, expectFigures] of CHART_ROUTES) {
  await goto(route);
  const ax = await axNodes();
  const figures = ax.filter((n) => n.role === "figure" && !n.ignored);
  const apps = ax.filter((n) => n.role === "application" && !n.ignored);
  const svgRoots = ax.filter((n) => (n.role === "graphics-document" || n.role === "graphics-object" || n.role === "application" || n.role === "image" || n.role === "SvgRoot") && !n.ignored);

  const dom = await page.evaluate(() => {
    const figs = [...document.querySelectorAll("figure")];
    return {
      figureCount: figs.length,
      figs: figs.map((f) => {
        const d = f.querySelector("details");
        const t = d?.querySelector("table");
        const body = t ? [...t.querySelectorAll("tbody tr")] : [];
        const cols = t ? t.querySelectorAll("thead th").length : 0;
        return {
          title: f.querySelector("figcaption > div")?.textContent.trim().slice(0, 80) ?? null,
          hasDetails: !!d,
          summary: d?.querySelector("summary")?.textContent.trim() ?? null,
          caption: t?.querySelector("caption")?.textContent.trim().slice(0, 90) ?? null,
          colHeaders: cols,
          scopedCol: t ? [...t.querySelectorAll("thead th")].filter((h) => h.getAttribute("scope") === "col").length : 0,
          rowHeaders: t ? [...t.querySelectorAll("tbody th")].length : 0,
          bodyRows: body.length,
          firstColTag: body[0]?.firstElementChild?.tagName ?? null,
          // the claim under test: the twin carries every plotted value
          plottedSeries: f.querySelectorAll(".recharts-bar, .recharts-line, .recharts-area").length,
          tableCells: t ? t.querySelectorAll("tbody td").length : 0,
          // scroll container around the twin
          twinScroller: (() => {
            const sc = t?.parentElement;
            if (!sc) return null;
            const s = getComputedStyle(sc);
            return {
              overflowY: s.overflowY, overflowX: s.overflowX,
              tabindex: sc.getAttribute("tabindex"),
              focusableInside: sc.querySelectorAll('a[href],button,input,select,[tabindex]:not([tabindex="-1"])').length,
            };
          })(),
          exposedSvgTitles: [...f.querySelectorAll("svg")]
            .filter((s) => s.getAttribute("aria-hidden") !== "true")
            .map((s) => ({ role: s.getAttribute("role"), title: s.querySelector("title")?.textContent ?? null })),
          svgTextRuns: f.querySelectorAll("svg text").length,
        };
      }),
    };
  });
  dump.charts[route] = { axFigures: figures.map((f) => ({ name: f.name })), apps: apps.length, svgRoots: svgRoots.map((s) => ({ role: s.role, name: s.name })), dom };

  ok(dom.figureCount === expectFigures, `[${route}] ${expectFigures} chart figure(s) rendered (found ${dom.figureCount})`);
  ok(
    figures.length === dom.figureCount,
    `[${route}] every <figure> is exposed as a figure in the a11y tree (${figures.length}/${dom.figureCount})`,
  );
  ok(
    figures.length > 0 && figures.every((f) => f.name.trim().length > 0),
    `[${route}] every chart figure has a non-empty accessible name (${JSON.stringify(figures.map((f) => f.name.slice(0, 40)))})`,
  );
  ok(apps.length === 0, `[${route}] no role="application" nodes (found ${apps.length}) — Recharts sets it on its <svg>`);
  ok(
    svgRoots.every((s) => s.name.trim().length > 0),
    `[${route}] every SVG exposed to AT has an accessible name (unnamed: ${svgRoots.filter((s) => !s.name.trim()).length})`,
  );
  for (const [i, f] of dom.figs.entries()) {
    const at = `[${route}] figure ${i} "${(f.title ?? "").slice(0, 34)}"`;
    ok(f.hasDetails && !!f.caption, `${at} has a table twin with a <caption>`);
    ok(f.colHeaders > 0 && f.scopedCol === f.colHeaders, `${at} all ${f.colHeaders} column headers carry scope="col"`);
    ok(f.rowHeaders === f.bodyRows && f.bodyRows > 0, `${at} each of ${f.bodyRows} data rows has a row header <th scope="row"> (found ${f.rowHeaders}, first col is <${f.firstColTag}>)`);
    // Chrome >=127 focuses scrollers implicitly (proven in the scrollable-region
    // section below), so a missing tabindex is a cross-browser risk rather than a
    // reproducible Chrome defect — warned, not gated.
    warn(
      !f.twinScroller || f.twinScroller.overflowY === "visible" || f.twinScroller.tabindex !== null || f.twinScroller.focusableInside > 0,
      `${at} the twin's scroll container declares its own keyboard access (overflow-y:${f.twinScroller?.overflowY}, tabindex:${f.twinScroller?.tabindex}, focusables inside:${f.twinScroller?.focusableInside})`,
    );
    ok(
      f.exposedSvgTitles.length === 0,
      `${at} no chart SVG is left exposed to AT (${JSON.stringify(f.exposedSvgTitles.slice(0, 3))})`,
    );
    ok(
      f.svgTextRuns === 0,
      `${at} chart SVG text is not read as loose StaticText (${f.svgTextRuns} runs leak into the tree)`,
    );
  }
}

// Legend swatch names must be human labels, not dataKeys.
console.log("\n== charts: legend swatch accessible names ==");
await goto("/explore/yale");
const legendNames = await page.evaluate(() =>
  [...document.querySelectorAll(".recharts-legend-item svg, .recharts-legend-wrapper svg")].map((s) => ({
    ariaHidden: s.getAttribute("aria-hidden"),
    ariaLabel: s.getAttribute("aria-label"),
    role: s.getAttribute("role"),
    title: s.querySelector("title")?.textContent ?? null,
  })),
);
const axLegend = (await axNodes()).filter((n) => !n.ignored && /legend icon/.test(n.name));
dump.legendNames = { dom: legendNames, ax: axLegend.map((n) => ({ role: n.role, name: n.name })) };
const leaking = legendNames.filter(
  (l) => l.ariaHidden !== "true" && /_|legend icon/.test(l.ariaLabel ?? l.title ?? ""),
);
ok(
  legendNames.length > 0 && leaking.length === 0,
  `legend swatches are hidden from AT or humanly named (leaking: ${JSON.stringify(leaking.map((l) => l.ariaLabel ?? l.title))})`,
);
ok(
  axLegend.length === 0,
  `no "<dataKey> legend icon" strings reach the a11y tree (${JSON.stringify(axLegend.map((n) => n.name))})`,
);

// Recharts 3 turns on accessibilityLayer by default: the plot <svg> gets
// role="application" AND tabIndex=0 AND arrow-key navigation. If that is on, it
// must actually work; if it is half-on it is worse than off.
console.log("\n== charts: Recharts accessibilityLayer ==");
const PLOT = ".recharts-wrapper > svg.recharts-surface";
const rcLayer = await page.evaluate((sel) => {
  const s = document.querySelector(sel);
  return s
    ? {
        role: s.getAttribute("role"),
        tabindex: s.getAttribute("tabindex"),
        ariaLabel: s.getAttribute("aria-label"),
        ariaRoledescription: s.getAttribute("aria-roledescription"),
        activedescendant: s.getAttribute("aria-activedescendant"),
        ariaHidden: s.getAttribute("aria-hidden"),
      }
    : null;
}, PLOT);
await page.evaluate((sel) => document.querySelector(sel).focus(), PLOT);
for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
await wait(400);
const rcAfterArrow = await page.evaluate((sel) => {
  const s = document.querySelector(sel);
  const ad = s.getAttribute("aria-activedescendant");
  const tip = document.querySelector(".recharts-tooltip-wrapper");
  return {
    activedescendant: ad,
    activedescendantTargetExists: ad ? !!document.getElementById(ad) : null,
    tooltipVisible: !!tip && (tip.textContent ?? "").trim().length > 0,
    tooltipText: (tip?.textContent ?? "").slice(0, 70),
    tooltipInLiveRegion: !!tip?.closest("[aria-live],[role=status],[role=alert]"),
    tooltipAriaHidden: tip?.getAttribute("aria-hidden") ?? null,
  };
}, PLOT);
// Does anything the arrow keys produced actually reach the accessibility tree?
const axAfterArrow = (await axNodes()).filter(
  (n) => !n.ignored && /FY20\d\d/.test(n.name) && n.role !== "heading",
);
dump.rechartsLayer = { rcLayer, rcAfterArrow, axAfterArrow: axAfterArrow.map((n) => ({ role: n.role, name: n.name.slice(0, 50) })) };
ok(
  rcLayer?.role !== "application",
  `the plot svg does not claim role="application" (role=${rcLayer?.role}) — application mode disables the screen-reader virtual cursor`,
);
ok(
  rcLayer?.role !== "application" || !!rcLayer?.ariaLabel,
  `the plot svg carrying role="application" has an accessible name (aria-label=${rcLayer?.ariaLabel})`,
);
ok(
  rcLayer?.tabindex === null || rcAfterArrow.tooltipVisible,
  `arrowing inside the tabbable plot svg surfaces a value (tabindex=${rcLayer?.tabindex}, tooltip=${JSON.stringify(rcAfterArrow.tooltipText)})`,
);
ok(
  !rcAfterArrow.tooltipVisible ||
    rcAfterArrow.tooltipInLiveRegion ||
    !!rcAfterArrow.activedescendantTargetExists,
  `the keyboard-driven chart tooltip is announced (live region: ${rcAfterArrow.tooltipInLiveRegion}, aria-activedescendant: ${rcAfterArrow.activedescendant})`,
);

// The S&P overlay toggle is a real toggle: does its state reach the tree?
await goto("/explore/yale");
const beforeToggle = (await axNodes()).find((n) => /Compare with the S&P 500/.test(n.name));
await page.evaluate(() =>
  [...document.querySelectorAll("button")].find((b) => /Compare with the S&P/.test(b.textContent)).click(),
);
await wait(400);
const afterToggle = (await axNodes()).find((n) => /S&P 500 overlay|Compare with the S&P/.test(n.name));
dump.overlayToggle = { beforeToggle, afterToggle };
ok(beforeToggle?.pressed === "false", `the overlay toggle reports pressed=false when off (${beforeToggle?.pressed})`);
ok(afterToggle?.pressed === "true", `the overlay toggle reports pressed=true when on (${afterToggle?.pressed})`);

// -------------------------------------------------------- 3. TABLES OUTSIDE FIGURES
console.log("\n== data tables outside figures ==");
dump.tables = {};
for (const route of ["/compare", "/methodology", "/translate?school=yale&year=2020"]) {
  await goto(route);
  const tabs = await page.evaluate(() =>
    [...document.querySelectorAll("table")].filter((t) => !t.closest("figure")).map((t) => {
      const sc = t.closest(".overflow-x-auto");
      return {
        caption: t.querySelector("caption")?.textContent.trim().slice(0, 80) ?? null,
        colHeaders: [...t.querySelectorAll("thead th")].length,
        scopedCol: [...t.querySelectorAll("thead th")].filter((h) => h.getAttribute("scope") === "col").length,
        rowHeaders: t.querySelectorAll("tbody th").length,
        bodyRows: t.querySelectorAll("tbody tr").length,
        firstColTag: t.querySelector("tbody tr > *")?.tagName ?? null,
        scrollerTabindex: sc ? sc.getAttribute("tabindex") : null,
        scrollerOverflows: sc ? sc.scrollWidth > sc.clientWidth : null,
      };
    }),
  );
  dump.tables[route] = tabs;
  for (const [i, t] of tabs.entries()) {
    ok(!!t.caption, `[${route}] table ${i} has a <caption>`);
    ok(t.scopedCol === t.colHeaders && t.colHeaders > 0, `[${route}] table ${i} column headers scoped`);
    ok(
      t.rowHeaders === t.bodyRows,
      `[${route}] table ${i}: ${t.bodyRows} rows have row headers (found ${t.rowHeaders}, first col is <${t.firstColTag}>)`,
    );
  }
}

// ---------------------------------------------- 4. KEYBOARD: order, focus ring, traps
console.log("\n== keyboard: tab order, visible focus, traps ==");
dump.keyboard = {};
const KEY_ROUTES = ["/", "/explore/yale", "/translate?school=yale&year=2020", "/compare", "/methodology", "/glossary"];
for (const route of KEY_ROUTES) {
  await page.setViewport({ width: 1280, height: 900 });
  await goto(route);
  const expected = await page.evaluate(() =>
    [...document.querySelectorAll('a[href],button,select,input,textarea,summary,[tabindex]:not([tabindex="-1"])')]
      .filter((e) => {
        const s = getComputedStyle(e);
        return s.display !== "none" && s.visibility !== "hidden" && !e.disabled;
      }).length,
  );
  // --- pass A: the tab walk itself. Nothing here disturbs focus, so the
  // sequence is the browser's real order and a trap would really hang.
  const seq = [];
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.keyboard.down("Shift"); // park focus at the document start
  await page.keyboard.up("Shift");
  await page.evaluate(() => document.activeElement?.blur?.());
  let leftDocument = 0;
  let cycled = false;
  const limit = expected * 2 + 10;
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const st = await page.evaluate(FOCUS_STYLE);
    if (!st) { leftDocument++; if (leftDocument >= 1 && seq.length >= expected) break; continue; }
    if (seq.length && st.sig === seq[0].sig) { cycled = true; break; }
    seq.push(st);
    if (seq.length > expected + 8) break;
  }

  // --- pass B: focus indicators, measured from pixels. Driven element by
  // element from a clean load so the walk above is never perturbed.
  await goto(route);
  const noRing = [];
  const inconclusive = [];
  const ringData = [];
  const count = await page.evaluate(() => window.__tabbables().length);
  for (let i = 0; i < count; i++) {
    const sig0 = await page.evaluate((idx) => {
      const el = window.__tabbables()[idx];
      if (!el) return null;
      el.scrollIntoView({ block: "center" });
      return window.__sig(el);
    }, i);
    if (sig0 === null) continue;
    // Tab INTO the element from its predecessor so :focus-visible really applies,
    // THEN measure geometry — the skip link is 1x1 sr-only until focused, so a
    // clip taken beforehand would point at the wrong place.
    // Always arrive by a real Tab press: programmatic .focus() does not set
    // Chrome's keyboard modality, so :focus-visible would not match and any
    // focus-visible-only ring would be missed. The first control is reached by
    // Tabbing from the top of the document, which is how a user reaches it.
    const focusOk = await page.evaluate((idx) => {
      window.scrollTo(0, 0);
      document.activeElement?.blur?.();
      const prev = window.__tabbables()[idx - 1];
      if (!prev) return "fromTop";
      prev.focus();
      return document.activeElement === prev ? "fromPrev" : "failed";
    }, i);
    if (focusOk === "failed") await page.evaluate((idx) => window.__tabbables()[idx].focus(), i);
    else await page.keyboard.press("Tab");
    const landed = await page.evaluate(FOCUS_STYLE);
    if (!landed || landed.sig !== sig0) { ringData.push({ sig: sig0, landedOn: landed?.sig, skipped: "did not land" }); continue; }
    // page.screenshot({clip}) is in DOCUMENT coordinates, not viewport ones, and
    // a clip larger than the viewport is unreliable — so compare a small corner
    // box, which any outline or ring must cross.
    const geom = await page.evaluate(() => {
      const r = document.activeElement.getBoundingClientRect();
      return { x: r.x + window.scrollX, y: r.y + window.scrollY, w: r.width, h: r.height };
    });
    const clip = {
      x: Math.max(0, geom.x - 8), y: Math.max(0, geom.y - 8),
      width: Math.min(56, geom.w + 16), height: Math.min(56, geom.h + 16),
    };
    if (clip.width < 2 || clip.height < 2) continue;
    const focused = await page.screenshot({ clip, encoding: "base64" });
    await page.evaluate(() => document.activeElement?.blur?.());
    const blurred = await page.screenshot({ clip, encoding: "base64" });
    const changed = focused !== blurred;
    // The pixel diff is the primary signal, but a 56px corner clip is not
    // perfectly reliable for elements that move when focused (the sr-only skip
    // link) or that are far larger than the clip (the 942px plot svg). So a
    // "no change" verdict is only a failure when the computed style ALSO shows
    // no ring; otherwise it is corroborated as present and merely warned about.
    const hasRing =
      landed.matchesFocusVisible &&
      ((landed.outline && !/^(none|)\s/.test(landed.outline) && !landed.outline.startsWith("none")) ||
        (landed.boxShadow && landed.boxShadow !== "none"));
    ringData.push({ sig: sig0, changed, outline: landed.outline, focusVisible: landed.matchesFocusVisible, hasRing });
    if (!changed && !hasRing) noRing.push({ sig: sig0, outline: landed.outline, focusVisible: landed.matchesFocusVisible });
    if (!changed && hasRing) inconclusive.push({ sig: sig0, outline: landed.outline });
  }

  // logical order = non-decreasing document position; header/footer wrap excluded
  const inversions = [];
  for (let i = 1; i < seq.length; i++) {
    if (seq[i].docTop < seq[i - 1].docTop - 24) inversions.push(`${seq[i - 1].text} -> ${seq[i].text}`);
  }
  dump.keyboard[route] = { expected, reached: seq.length, cycled, leftDocument, seq, noRing, inconclusive, ringData, inversions };

  ok(seq.length >= expected, `[${route}] Tab reaches every focusable element (${seq.length}/${expected})`);
  ok(
    leftDocument >= 1 || cycled,
    `[${route}] no keyboard trap — focus either leaves the document or cycles back to the first control (reached ${seq.length}/${expected})`,
  );
  ok(noRing.length === 0, `[${route}] every focused control paints a visible focus indicator (no pixel change AND no computed ring on: ${JSON.stringify(noRing.map((n) => n.sig))})`);
  if (inconclusive.length)
    console.log(
      `NOTE  [${route}] pixel diff inconclusive but a focus ring is computed for ${JSON.stringify(inconclusive.map((n) => n.sig))}`,
    );
  ok(inversions.length === 0, `[${route}] tab order follows visual order${inversions.length ? `: ${inversions.join("; ")}` : ""}`);
}

// scrollable regions that no keyboard can reach or scroll (2.1.1)
console.log("\n== keyboard: scrollable regions ==");
dump.scrollers = {};
for (const route of ["/explore/yale", "/compare", "/methodology", "/translate?school=yale&year=2020"]) {
  for (const width of [1280, 320]) {
    await page.setViewport({ width, height: 900 });
    await goto(route);
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await wait(300);
    const bad = await page.evaluate(() =>
      [...document.querySelectorAll("*")]
        .filter((e) => {
          const s = getComputedStyle(e);
          const scrollsX = /auto|scroll/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 1;
          const scrollsY = /auto|scroll/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1;
          if (!scrollsX && !scrollsY) return false;
          if (e === document.body || e === document.documentElement) return false;
          const ti = e.getAttribute("tabindex");
          if (ti !== null && Number(ti) >= 0) return false;
          return e.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])').length === 0;
        })
        .map((e) => ({
          cls: (e.getAttribute("class") ?? "").slice(0, 60),
          overflowX: getComputedStyle(e).overflowX,
          overflowY: getComputedStyle(e).overflowY,
          sw: e.scrollWidth, cw: e.clientWidth, sh: e.scrollHeight, ch: e.clientHeight,
          contains: e.querySelector("table")?.querySelector("caption")?.textContent.trim().slice(0, 60) ?? e.tagName,
        })),
    );
    // Chrome >=127 focuses scrollers implicitly, so measure the browser's real
    // behaviour too rather than only the markup: is the scroller in the tab
    // order, and do arrow keys move it once it is?
    const drive = bad.length
      ? await (async () => {
          const target = await page.evaluateHandle(() =>
            [...document.querySelectorAll("*")].find((e) => {
              const s = getComputedStyle(e);
              return (
                ((/auto|scroll/.test(s.overflowX) && e.scrollWidth > e.clientWidth + 1) ||
                  (/auto|scroll/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 1)) &&
                e !== document.body &&
                e !== document.documentElement &&
                e.getAttribute("tabindex") === null &&
                e.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex]:not([tabindex="-1"])').length === 0
              );
            }),
          );
          const before = await target.evaluate((e) => ({ top: e.scrollTop, left: e.scrollLeft }));
          const reachable = await target.evaluate((e) => {
            e.scrollIntoView({ block: "center" });
            // last focusable preceding the scroller in DOM order
            const prior = [...document.querySelectorAll('a[href],button,select,summary,input,[tabindex="0"]')].filter(
              (c) => e.compareDocumentPosition(c) & Node.DOCUMENT_POSITION_PRECEDING,
            );
            const f = prior[prior.length - 1];
            if (f) { f.focus(); return document.activeElement === f; }
            return false;
          });
          if (reachable) await page.keyboard.press("Tab");
          const focusedIt = await target.evaluate((e) => document.activeElement === e);
          await page.keyboard.press("ArrowDown");
          await page.keyboard.press("ArrowRight");
          await wait(250);
          const after = await target.evaluate((e) => ({ top: e.scrollTop, left: e.scrollLeft }));
          return { before, after, focusedIt, moved: after.top !== before.top || after.left !== before.left };
        })()
      : null;
    dump.scrollers[`${route}@${width}`] = { bad, drive };
    ok(
      bad.length === 0 || (drive?.focusedIt && drive?.moved),
      `[${route}@${width}px] scrollable regions are keyboard-operable in THIS browser (Chrome implicit focus reached it: ${drive?.focusedIt}, arrows scrolled it: ${drive?.moved})`,
    );
    warn(
      bad.length === 0,
      `[${route}@${width}px] scrollable regions carry an explicit tabindex — ${bad.length} rely on Chrome >=127 focusable-scrollers, which Firefox and Safari do not implement (${JSON.stringify(bad.map((b) => b.contains))})`,
    );
  }
}

// ----------------------------------------------------- 5. TERM TOGGLETIP semantics
console.log("\n== <Term> toggletip ==");
await page.setViewport({ width: 1280, height: 900 });
await goto("/explore/yale");
const termProbe = {};
await page.evaluate(() => document.querySelector("main button[aria-expanded]").focus());
await page.keyboard.press("Enter");
await wait(300);
let ax = await axNodes();
termProbe.openTrigger = ax.find((n) => n.role === "button" && n.expanded === true) ?? null;
termProbe.liveRegionText = await page.evaluate(() => document.querySelector('body > [role="status"]')?.textContent ?? null);
ok(!!termProbe.openTrigger, "an open Term reports aria-expanded=true in the a11y tree");
ok(!!termProbe.liveRegionText && termProbe.liveRegionText.length > 20, "the open definition reaches the shared live region");
termProbe.triggerDescribedBy = await page.evaluate(() => {
  const b = document.querySelector("main button[aria-expanded]");
  return { describedby: b.getAttribute("aria-describedby"), controls: b.getAttribute("aria-controls"), title: b.getAttribute("title") };
});
await page.keyboard.press("Escape");
await wait(250);
ok(
  await page.evaluate(() => document.activeElement === document.querySelector("main button[aria-expanded]")),
  "Escape closes the bubble and leaves focus on the trigger",
);
ok(
  await page.evaluate(() => document.querySelector("main button[aria-expanded]").getAttribute("aria-expanded") === "false"),
  "aria-expanded returns to false after Escape",
);
// A collapsed toggletip must not keep a stale definition in the live region.
ok(
  (await page.evaluate(() => (document.querySelector('body > [role="status"]')?.textContent ?? "").trim())) === "",
  "the live region is cleared when the bubble closes",
);
dump.term = termProbe;

// -------------------------------------------------------------- 6. FORMS /translate
console.log("\n== forms: /translate pickers ==");
await goto("/translate");
ax = await axNodes();
const combos = ax.filter((n) => n.role === "combobox" && !n.ignored);
dump.forms = { comboNames: combos.map((c) => ({ name: c.name, value: c.value, desc: c.desc })) };
ok(combos.length === 2, `/translate exposes 2 comboboxes (${combos.length})`);
for (const c of combos) {
  ok(c.name.trim().length > 0, `combobox has an accessible name: ${JSON.stringify(c.name.slice(0, 60))}`);
  ok(
    c.name.length < 60,
    `combobox name is not polluted by its own option list (${c.name.length} chars: ${JSON.stringify(c.name.slice(0, 70))})`,
  );
}
const disabledOpt = await page.evaluate(() => {
  const s = document.querySelectorAll("select")[0];
  const d = [...s.options].filter((o) => o.disabled && o.value !== "");
  return d.map((o) => ({ text: o.textContent.trim(), title: o.getAttribute("title") }));
});
dump.forms.disabledOptions = disabledOpt;
ok(disabledOpt.every((o) => /—|:|\(/.test(o.text)), `disabled options carry their reason in the option text (${JSON.stringify(disabledOpt)})`);
// The year select is disabled until a school is chosen — is that explained?
const yearSelect = await page.evaluate(() => {
  const s = document.querySelectorAll("select")[1];
  return { disabled: s.disabled, describedby: s.getAttribute("aria-describedby"), firstOption: s.options[0].textContent.trim() };
});
dump.forms.yearSelect = yearSelect;
ok(
  !yearSelect.disabled || !!yearSelect.describedby || /first/i.test(yearSelect.firstOption),
  "the disabled year picker explains why it is disabled",
);
// Invalid deep link on a fresh page load: the message is static content, so a
// live region is not required — but it must be programmatically associated with
// the control it corrects, or a screen-reader user arriving at the select has no
// way to know why their link was rejected.

await goto("/translate?school=yale&year=1066");
const errProbe = await page.evaluate(() => {
  const msg = [...document.querySelectorAll("main p")].find((p) => /didn.t point at/i.test(p.textContent));
  return msg
    ? {
        text: msg.textContent.trim().slice(0, 90),
        role: msg.getAttribute("role"),
        live: msg.getAttribute("aria-live"),
        inLiveRegion: !!msg.closest("[aria-live],[role=status],[role=alert]"),
        tabindex: msg.getAttribute("tabindex"),
        precedesForm: !!(msg.compareDocumentPosition(document.querySelector("select")) & Node.DOCUMENT_POSITION_FOLLOWING),
      }
    : null;
});
const errAssoc = await page.evaluate(() => {
  const s = document.querySelectorAll("select")[0];
  const db = s.getAttribute("aria-describedby");
  return { describedby: db, resolves: db ? db.split(/\s+/).every((id) => !!document.getElementById(id)) : false };
});
dump.forms.invalidDeepLink = { errProbe, errAssoc };
ok(!!errProbe, "an invalid deep link renders a plain-English correction");
ok(
  !!errAssoc.describedby && errAssoc.resolves,
  `the rejection message is associated with the picker via aria-describedby (${JSON.stringify(errAssoc)})`,
);
// A select whose change navigates client-side: what happens to focus, and is
// the arrival of a whole new section announced? Driven with the keyboard, and
// with the select genuinely focused first, so the "before" state is real.
await goto("/translate");
const beforeUrl = page.url();
const beforeFocus = await page.evaluate(() => {
  const s = document.querySelectorAll("select")[0];
  s.focus();
  return { focusedSelect: document.activeElement === s, h2s: document.querySelectorAll("main h2").length };
});
await page.select("select", "yale");
await wait(3000);
const afterNav = await page.evaluate(() => ({
  active: document.activeElement.tagName + "." + (document.activeElement.getAttribute("class") ?? "").slice(0, 24),
  isBody: document.activeElement === document.body || document.activeElement === document.documentElement,
  isStillSelect: document.activeElement.tagName === "SELECT",
  h2s: document.querySelectorAll("main h2").length,
  liveRegions: [...document.querySelectorAll("[aria-live],[role=status],[role=alert]")].map((e) => (e.textContent ?? "").trim().slice(0, 40)),
}));
dump.forms.selectNav = { beforeUrl, beforeFocus, url: page.url(), afterNav };
ok(page.url() !== beforeUrl, "changing the school select navigates");
ok(beforeFocus.focusedSelect, "the select could be focused before the change (control)");
ok(
  afterNav.h2s > beforeFocus.h2s,
  `the navigation actually injected new sections (${beforeFocus.h2s} -> ${afterNav.h2s} h2s)`,
);
ok(
  afterNav.isStillSelect,
  `focus survives the select-driven client-side navigation (activeElement afterwards: ${afterNav.active})`,
);
ok(
  afterNav.liveRegions.some((t) => t.length > 0),
  `the newly-injected result is announced by some live region (${JSON.stringify(afterNav.liveRegions)})`,
);

// -------------------------------------------------------------- 7. CONTRAST
console.log("\n== contrast, both colour schemes ==");
dump.contrast = {};
for (const scheme of ["light", "dark"]) {
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
  const failing = [];
  const nonText = {};
  const gradients = [];
  for (const route of ROUTES) {
    await goto(route);
    await page.evaluate(() => document.querySelectorAll("details").forEach((d) => (d.open = true)));
    await wait(250);
    const res = await page.evaluate(CONTRAST_PROBE);
    for (const r of res.runs) if (!r.pass) failing.push({ route, ...r });
    for (const g of res.gradientText) gradients.push({ route, ...g });
    if (res.nonText.length) nonText[route] = res.nonText;
  }
  const badGradients = gradients.filter((g) => !g.pass);
  ok(
    badGradients.length === 0,
    `[${scheme}] every background-clip:text gradient stop meets its threshold (${gradients.length} stops checked, failing: ${JSON.stringify(badGradients.map((g) => `${g.text} @${g.ratio}:1`))})`,
  );
  // de-dupe by (text-ish signature)
  const seen = new Map();
  for (const f of failing) {
    const k = `${f.fg}|${f.bg}|${f.px}|${f.tag}|${f.cls}`;
    if (!seen.has(k)) seen.set(k, { ...f, routes: [f.route], samples: [f.text] });
    else {
      const e = seen.get(k);
      if (!e.routes.includes(f.route)) e.routes.push(f.route);
      if (e.samples.length < 4 && !e.samples.includes(f.text)) e.samples.push(f.text);
    }
  }
  const uniq = [...seen.values()].sort((a, b) => a.ratio - b.ratio);
  dump.contrast[scheme] = { unique: uniq, nonText, gradients, totalFailingRuns: failing.length };
  ok(uniq.length === 0, `[${scheme}] every text run meets its WCAG 1.4.3 threshold (${uniq.length} distinct failures across ${failing.length} runs)`);
  for (const [route, arr] of Object.entries(nonText)) {
    for (const n of arr) {
      if (n.role === "axis")
        ok(n.ratio >= 3, `[${scheme}][${route}] chart ${n.role} (${n.hex}) meets 3:1 against the chart surface (${n.ratio}:1)`);
      if (n.role === "gridline")
        warn(n.ratio >= 3, `[${scheme}][${route}] chart ${n.role} (${n.hex}) meets 3:1 against the chart surface (${n.ratio}:1) — gridlines are arguably not "required to understand"`);
    }
  }

  // 1.4.11 for the series themselves: a 2px line's colour IS its identity and
  // its position is the data, so each plotted series must clear 3:1 against the
  // chart surface. Measured on the routes that actually draw lines.
  for (const route of ["/compare", "/explore/stanford", "/translate?school=yale&year=2020"]) {
    await goto(route);
    const series = await page.evaluate(() => {
      const parse = (c) => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
        const p = m[1].split(/[,\s/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2]]; };
      const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
        return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      const root = document.querySelector(".viz-root");
      if (!root) return [];
      const probe = document.createElement("span");
      root.appendChild(probe);
      const resolve = (v) => { probe.style.color = v; return parse(getComputedStyle(probe).color); };
      const surf = resolve(getComputedStyle(root).getPropertyValue("--viz-surface").trim());
      const out = [];
      for (const el of document.querySelectorAll(".recharts-line-curve, .recharts-area-curve")) {
        const stroke = getComputedStyle(el).stroke;
        const c = parse(stroke);
        if (!c || !surf) continue;
        const name = el.closest(".recharts-layer")?.className?.baseVal ?? "";
        out.push({ name: String(name).replace(/recharts-\S+\s*/g, "").trim() || "series", stroke,
          ratio: Math.round(ratio(c, surf) * 100) / 100 });
      }
      probe.remove();
      return out;
    });
    dump.contrast[scheme][`series ${route}`] = series;
    for (const s of series)
      ok(s.ratio >= 3, `[${scheme}][${route}] plotted line ${s.stroke} meets 3:1 against the chart surface (${s.ratio}:1)`);
  }
}
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);

// -------------------------------------------------- 8. COLOUR AS THE ONLY CHANNEL
console.log("\n== meaning encoded in colour alone ==");
await goto("/explore/harvard");
const colourOnly = await page.evaluate(() => {
  // AllocationChart uses fillOpacity 0.65 vs 1 to mean target-vs-actual; the
  // footnote/subtitle carry it in words. Check that nothing on the chart relies
  // on hue alone with no text equivalent reachable without hover.
  const legendTexts = [...document.querySelectorAll(".recharts-legend-item")].map((e) => e.textContent.trim());
  const twinHeaders = [...document.querySelectorAll("figure table thead th")].map((e) => e.textContent.trim());
  const twinFirstCol = [...document.querySelectorAll("figure table tbody tr")].map((r) => r.firstElementChild.textContent.trim());
  return { legendTexts, twinHeaders, twinFirstCol };
});
dump.colourOnly = colourOnly;
ok(
  colourOnly.legendTexts.every((t) => colourOnly.twinHeaders.some((h) => h.toLowerCase().includes(t.toLowerCase().slice(0, 12)))),
  "every legend series has a matching named column in the table twin (series identity is not colour-only)",
);
ok(
  colourOnly.twinFirstCol.some((c) => /target/i.test(c)),
  "the target-vs-actual distinction (drawn as fill opacity) is also labelled in the table twin",
);

// --------------------------------------------------------- 9. REFLOW / ZOOM
console.log("\n== reflow at 320px and 400% zoom ==");
dump.reflow = {};
// 320 CSS px is the 1.4.10 requirement; 320x256 is 1280x1024 at 400% zoom.
for (const [w, h, tag] of [[320, 900, "320px"], [320, 256, "400% of 1280x1024"]]) {
  await page.setViewport({ width: w, height: h });
  for (const route of ROUTES) {
    await goto(route);
    const r = await page.evaluate((vw) => {
      // 1.4.10 exempts "content requiring two-dimensional layout" — a data
      // table inside its own scroller is the canonical example, so a table that
      // overflows only inside an overflow-x scroller is not counted.
      const exempt = (e) => {
        let n = e;
        while (n && n !== document.body) {
          const s = getComputedStyle(n);
          if (/auto|scroll/.test(s.overflowX) && n !== e) return true;
          n = n.parentElement;
        }
        return false;
      };
      const overflowing = [...document.querySelectorAll("body *")]
        .filter((e) => {
          const s = getComputedStyle(e);
          if (s.display === "none" || s.visibility === "hidden") return false;
          if (/auto|scroll|hidden/.test(s.overflowX)) return false;
          const rect = e.getBoundingClientRect();
          if (!(rect.right > vw + 1 && rect.width > 0)) return false;
          return !exempt(e);
        })
        .slice(0, 6)
        .map((e) => ({ tag: e.tagName.toLowerCase(), cls: (e.getAttribute("class") ?? "").slice(0, 50), right: Math.round(e.getBoundingClientRect().right), text: (e.textContent ?? "").trim().slice(0, 30) }));
      return { scrollWidth: document.documentElement.scrollWidth, overflowing };
    }, w);
    dump.reflow[`${tag} ${route}`] = r;
    ok(r.scrollWidth <= w + 1, `[${tag}] ${route}: no horizontal page scroll (scrollWidth ${r.scrollWidth} vs ${w})`);
    ok(r.overflowing.length === 0, `[${tag}] ${route}: nothing spills past the viewport (${JSON.stringify(r.overflowing)})`);
  }
}
// content loss: charts have a fixed pixel height; at 400% the plot must still be
// reachable and the table twin must still exist.
await page.setViewport({ width: 320, height: 256 });
await goto("/explore/yale");
const smallChart = await page.evaluate(() => {
  const f = document.querySelector("figure");
  const svg = f.querySelector(".recharts-wrapper");
  return {
    figureWidth: f.getBoundingClientRect().width,
    svgWidth: svg?.getBoundingClientRect().width ?? 0,
    svgHeight: svg?.getBoundingClientRect().height ?? 0,
    legendItems: f.querySelectorAll(".recharts-legend-item").length,
    xTicks: f.querySelectorAll(".recharts-xAxis .recharts-cartesian-axis-tick").length,
    detailsPresent: !!f.querySelector("details"),
  };
});
dump.reflow.smallChart = smallChart;
ok(smallChart.detailsPresent, "[400%] the table twin survives at 320x256");
ok(smallChart.svgWidth > 0 && smallChart.svgWidth <= 320, `[400%] the chart is not clipped horizontally (${Math.round(smallChart.svgWidth)}px)`);

// ---------------------------------------------- 10. MOTION / prefers-reduced-motion
console.log("\n== motion ==");
await page.setViewport({ width: 1280, height: 900 });
dump.motion = {};
for (const reduce of [false, true]) {
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: "light" },
    ...(reduce ? [{ name: "prefers-reduced-motion", value: "reduce" }] : []),
  ]);
  const m = {};
  for (const route of ["/explore/yale", "/compare", "/explore/stanford"]) {
    await goto(route);
    // hover the plot to raise a tooltip, then read what animates
    const box = await page.evaluate(() => {
      const w = document.querySelector(".recharts-wrapper");
      if (!w) return null;
      const r = w.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    if (box) await page.mouse.move(box.x, box.y);
    await wait(400);
    m[route] = await page.evaluate(() => {
      const animated = [];
      for (const e of document.querySelectorAll(".recharts-wrapper *, .recharts-tooltip-wrapper")) {
        const s = getComputedStyle(e);
        const t = s.transitionDuration.split(",").map((x) => parseFloat(x)).filter((x) => x > 0);
        const a = s.animationDuration.split(",").map((x) => parseFloat(x)).filter((x) => x > 0);
        if (t.length || a.length)
          animated.push({
            cls: (e.getAttribute("class") ?? "").slice(0, 46),
            transition: s.transitionProperty + " " + s.transitionDuration,
            animation: s.animationName + " " + s.animationDuration,
          });
      }
      return {
        animated: animated.slice(0, 8),
        animatedCount: animated.length,
        smilTags: document.querySelectorAll("svg animate, svg animateTransform, svg animateMotion").length,
        webAnimations: document.getAnimations ? document.getAnimations().length : -1,
      };
    });
  }
  dump.motion[reduce ? "reduce" : "no-preference"] = m;
  for (const [route, v] of Object.entries(m)) {
    ok(v.smilTags === 0, `[${reduce ? "reduce" : "default"}] ${route}: no SMIL animation in chart SVG`);
    if (reduce)
      ok(
        v.animatedCount === 0 && v.webAnimations <= 0,
        `[reduce] ${route}: no chart motion under prefers-reduced-motion (css:${v.animatedCount}, waapi:${v.webAnimations}, ${JSON.stringify(v.animated.slice(0, 2))})`,
      );
  }
}
await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);

// ----------------------------------------------------- 11. MISC SEMANTICS
console.log("\n== misc semantics ==");
await goto("/explore/yale");
const misc = await page.evaluate(() => ({
  lang: document.documentElement.lang,
  decorativeSpansHidden: [...document.querySelectorAll('[style*="background"]')].filter(
    (e) => e.getAttribute("aria-hidden") !== "true" && !e.textContent.trim() && e.getBoundingClientRect().height < 8,
  ).length,
  statTiles: [...document.querySelectorAll('section[aria-label="Headline figures"] > div')].map((d) => ({
    tag: d.tagName, childTags: [...d.children].map((c) => c.tagName + "." + (c.getAttribute("class") ?? "").slice(0, 14)),
  })),
  skipLink: (() => {
    const a = document.querySelector('a[href="#main"]');
    if (!a) return null;
    a.focus();
    const r = a.getBoundingClientRect();
    return { text: a.textContent.trim(), visibleOnFocus: r.width > 1 && r.height > 1, targetExists: !!document.getElementById("main") };
  })(),
}));
dump.misc = misc;
ok(misc.lang === "en", "html lang is set");
ok(misc.decorativeSpansHidden === 0, `decorative gradient rules are aria-hidden (${misc.decorativeSpansHidden} exposed)`);
ok(!!misc.skipLink?.visibleOnFocus && misc.skipLink.targetExists, "the skip link becomes visible on focus and its target exists");
// headline figures: are label/value programmatically paired?
ok(
  misc.statTiles.length === 0 || misc.statTiles.every((t) => t.tag === "DT" || t.tag === "DD" || t.childTags.length <= 3),
  `headline stat tiles pair label and value (${JSON.stringify(misc.statTiles[0])})`,
);

// details/summary state
await goto("/explore/yale");
const detState = await page.evaluate(async () => {
  const s = document.querySelector("figure details summary");
  s.focus();
  const before = { open: s.parentElement.open };
  s.click();
  await new Promise((r) => setTimeout(r, 200));
  return {
    before,
    after: { open: s.parentElement.open, focused: document.activeElement === s },
    tableVisibleAfter: !!s.parentElement.querySelector("table")?.getBoundingClientRect().height,
  };
});
ax = await axNodes();
const disclosure = ax.find((n) => /Disclosure|button/i.test(n.role ?? "") && /View this chart as a table/.test(n.name));
dump.details = { detState, disclosure };
ok(detState.after.open && detState.after.focused, "opening the table twin keeps focus on the summary");
ok(detState.tableVisibleAfter, "the table twin is rendered once opened");
ok(disclosure?.expanded === true, `the summary reports expanded=true when open (${disclosure?.role}, expanded=${disclosure?.expanded})`);

// ------------------------------------------ 12. control: is the empty figure
// name Chrome's doing or ours? A hand-built figure/figcaption, same page.
console.log("\n== control: figure naming ==");
await page.setViewport({ width: 1280, height: 900 });
await goto("/glossary");
await page.evaluate(() => {
  const mk = (inner, extra = "") =>
    `<figure ${extra} data-probe><figcaption>${inner}</figcaption><p>body</p></figure>`;
  document.querySelector("main").insertAdjacentHTML(
    "afterbegin",
    mk("plain text caption") +
      mk("<div>caption wrapped in a div</div>") +
      mk("<div>aria-labelled</div>", 'aria-label="explicit name"'),
  );
});
await wait(200);
const figProbe = (await axNodes())
  .filter((n) => n.role === "figure" && !n.ignored)
  .map((n) => n.name);
dump.figureNameControl = figProbe;
ok(
  figProbe[0] === "plain text caption",
  `control: Chrome names a figure from a plain-text <figcaption> (got ${JSON.stringify(figProbe[0])})`,
);
ok(
  figProbe[1] === "caption wrapped in a div",
  `control: Chrome names a figure from a <figcaption> whose content is a <div> (got ${JSON.stringify(figProbe[1])}) — this is exactly the site's markup`,
);
ok(figProbe[2] === "explicit name", `control: aria-label names a figure (got ${JSON.stringify(figProbe[2])})`);

// ----------------------------------------------------------------- report
snap();
await browser.close();
console.log(`\n${checks} checks run, ${failures.length} failure(s), ${warnings.length} warning(s)`);
if (failures.length) {
  console.log("\nFAILURES:");
  for (const f of failures) console.log(`  - ${f}`);
}
if (warnings.length) {
  console.log("\nWARNINGS (browser-dependent or arguably exempt):");
  for (const w of warnings) console.log(`  - ${w}`);
}
process.exit(failures.length ? 1 : 0);
