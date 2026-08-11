// Cross-engine probe: runs the SAME measurements in Blink (Chrome, via
// puppeteer-core/CDP) and WebKit (Safari, via safaridriver/W3C WebDriver) and
// diffs them. Written for the tier-2 cross-browser audit.
//
//   node scripts/verify-cross-browser.mjs --engine chrome  [--dark] [--width 1280]
//   node scripts/verify-cross-browser.mjs --engine safari  [--width 1280]
//
// Writes JSON to conduct/audits/data/xb-<engine>-<width>-<scheme>.json and
// screenshots to conduct/audits/screens/.
//
// Gecko is NOT covered: no Firefox on this machine and no playwright. See the
// audit for what that leaves unverified.

import puppeteer from "puppeteer-core";
import { writeFileSync, mkdirSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
const flag = (n, d = null) => {
  const i = args.indexOf(`--${n}`);
  return i === -1 ? d : args[i + 1];
};
const has = (n) => args.includes(`--${n}`);

const ENGINE = flag("engine", "chrome");
const WIDTH = Number(flag("width", 1280));
const HEIGHT = Number(flag("height", 900));
const DARK = has("dark");
const BASE = flag("base", "https://universityfunds.vercel.app");
const ROOT = "/Users/amayb/Projects/dashboardProject";
const OUT_DIR = path.join(ROOT, "conduct/audits/data");
const SHOT_DIR = path.join(ROOT, "conduct/audits/screens");
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(SHOT_DIR, { recursive: true });

const ROUTES = (flag("routes") ?? "").length
  ? flag("routes").split(",")
  : [
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

/* ------------------------------------------------------------------ probes */
// One self-contained function, stringified and run identically in both
// engines. Must return only JSON-serialisable values.
const PROBE = function () {
  const cls = (el) => el.getAttribute("class") || "";
  const desc = (el) =>
    !el
      ? null
      : {
          tag: el.tagName,
          type: el.getAttribute("type") || null,
          cls: cls(el).slice(0, 100),
          label: el.getAttribute("aria-label") || null,
          text: (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 50),
        };
  const de = document.documentElement;
  const out = { ua: navigator.userAgent, href: location.pathname + location.search };

  out.env = {
    innerWidth: innerWidth,
    innerHeight: innerHeight,
    dpr: devicePixelRatio,
    // If "hidden", this run's data is DEGRADED for streamed (dynamic) routes and
    // screenshots. macOS freezes the rendering pipeline of occluded windows: rAF
    // never fires, so React's Suspense reveal queue never drains and /compare +
    // /translate sit on their loading fallback forever, while screenshots come
    // back solid black. Layout still computes on demand, so DOM measurements of
    // server-rendered (static) routes remain valid. Measured 2026-08-11; no JS
    // workaround exists (visibilityState spoof + visibilitychange does not drain
    // the queue — it waits on real compositor frames). Keep the Safari window
    // visible on screen during a run, or discard dynamic-route data.
    visibility: document.visibilityState,
    dark: matchMedia("(prefers-color-scheme: dark)").matches,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    bodyColor: getComputedStyle(document.body).color,
    htmlTextSizeAdjust:
      getComputedStyle(de).webkitTextSizeAdjust ||
      getComputedStyle(de).textSizeAdjust ||
      null,
  };

  // ---- 1. feature support, straight from the engine
  const sup = (p, v) => {
    try {
      return CSS.supports(p, v);
    } catch (e) {
      return "throw";
    }
  };
  out.supports = {
    "paint-order:stroke": sup("paint-order", "stroke"),
    "background-clip:text": sup("background-clip", "text"),
    "-webkit-background-clip:text": sup("-webkit-background-clip", "text"),
    "color-scheme:dark": sup("color-scheme", "dark"),
    "text-size-adjust:100%": sup("text-size-adjust", "100%"),
    "-webkit-text-size-adjust:100%": sup("-webkit-text-size-adjust", "100%"),
    "height:100dvh": sup("height", "100dvh"),
    "position:sticky": sup("position", "sticky"),
    "overflow:clip": sup("overflow", "clip"),
  };

  // ---- 2. horizontal overflow of the PAGE (ignore legit scroll containers)
  out.overflowX = {
    docScrollWidth: de.scrollWidth,
    docClientWidth: de.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
    overflows: de.scrollWidth > de.clientWidth + 1,
    offenders: [],
  };
  if (out.overflowX.overflows) {
    const seen = [];
    const all = document.querySelectorAll("body *");
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      const r = el.getBoundingClientRect();
      if (r.width < 1 && r.height < 1) continue;
      if (r.right <= de.clientWidth + 1 && r.left >= -1) continue;
      // skip anything that lives inside a declared horizontal scroller
      let p = el.parentElement,
        inScroller = false;
      while (p && p !== document.body) {
        const ox = getComputedStyle(p).overflowX;
        if (ox === "auto" || ox === "scroll" || ox === "hidden") {
          inScroller = true;
          break;
        }
        p = p.parentElement;
      }
      if (inScroller) continue;
      seen.push({ ...desc(el), left: Math.round(r.left), right: Math.round(r.right) });
      if (seen.length >= 10) break;
    }
    out.overflowX.offenders = seen;
  }

  // ---- 3. every scroll container: is it actually scrollable, and reachable?
  out.scrollers = [];
  const cand = document.querySelectorAll("div,section,figure,pre,table");
  for (let i = 0; i < cand.length; i++) {
    const el = cand[i];
    const cs = getComputedStyle(el);
    const scrollableX =
      (cs.overflowX === "auto" || cs.overflowX === "scroll") &&
      el.scrollWidth > el.clientWidth + 1;
    const scrollableY =
      (cs.overflowY === "auto" || cs.overflowY === "scroll") &&
      el.scrollHeight > el.clientHeight + 1;
    if (!scrollableX && !scrollableY) continue;
    const focusables = el.querySelectorAll(
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"]),summary,details',
    );
    el.setAttribute("data-xb-scroller", String(out.scrollers.length));
    out.scrollers.push({
      idx: out.scrollers.length,
      ...desc(el),
      overflowX: cs.overflowX,
      overflowY: cs.overflowY,
      scrollableX,
      scrollableY,
      overflowAmountX: el.scrollWidth - el.clientWidth,
      overflowAmountY: el.scrollHeight - el.clientHeight,
      tabindexAttr: el.getAttribute("tabindex"),
      tabIndexProp: el.tabIndex,
      role: el.getAttribute("role"),
      focusableDescendants: focusables.length,
      // The known bug class: scrollable, keyboard-operable content, but no
      // tab stop of its own and nothing focusable inside it.
      keyboardOrphan: el.getAttribute("tabindex") === null && focusables.length === 0,
      webkitOverflowScrolling: cs.webkitOverflowScrolling || null,
      overscrollBehavior: cs.overscrollBehavior || null,
    });
  }

  // ---- 4. details/summary disclosure
  out.details = [];
  const dets = document.querySelectorAll("details");
  for (let i = 0; i < dets.length && i < 4; i++) {
    const d = dets[i];
    const s = d.querySelector("summary");
    const csS = s ? getComputedStyle(s) : null;
    const closedH = d.getBoundingClientRect().height;
    d.open = true;
    const openH = d.getBoundingClientRect().height;
    const body = d.querySelector("[role='group'],div");
    const bodyVisible = body ? body.getBoundingClientRect().height > 0 : null;
    d.open = false;
    let marker = null;
    try {
      marker = getComputedStyle(s, "::-webkit-details-marker").display;
    } catch (e) {
      marker = "n/a";
    }
    let listMarker = null;
    try {
      listMarker = getComputedStyle(s, "::marker").content;
    } catch (e) {
      listMarker = "n/a";
    }
    out.details.push({
      summaryText: s ? (s.textContent || "").trim().slice(0, 40) : null,
      summaryDisplay: csS ? csS.display : null,
      summaryCursor: csS ? csS.cursor : null,
      summaryListStyle: csS ? csS.listStyleType : null,
      webkitDetailsMarkerDisplay: marker,
      markerContent: listMarker,
      closedHeight: Math.round(closedH),
      openHeight: Math.round(openH),
      opensAndRevealsBody: openH > closedH + 10 && bodyVisible === true,
      summaryTabIndex: s ? s.tabIndex : null,
    });
  }

  // ---- 5. open every details, then inspect the chart table twins
  const allDets = document.querySelectorAll("details");
  for (let i = 0; i < allDets.length; i++) allDets[i].open = true;

  out.stickyHeaders = [];
  const groups = document.querySelectorAll(".max-h-80.overflow-auto, [role='group']");
  for (let i = 0; i < groups.length && i < 3; i++) {
    const g = groups[i];
    const th = g.querySelector("thead th");
    if (!th) continue;
    const csTh = getComputedStyle(th);
    const before = th.getBoundingClientRect();
    const gRect0 = g.getBoundingClientRect();
    g.scrollTop = Math.max(0, g.scrollHeight - g.clientHeight);
    const after = th.getBoundingClientRect();
    const gRect = g.getBoundingClientRect();
    // read the pixel behind the sticky header to see whether rows show through
    out.stickyHeaders.push({
      label: g.getAttribute("aria-label"),
      position: csTh.position,
      top: csTh.top,
      zIndex: csTh.zIndex,
      background: csTh.backgroundColor,
      borderBottom: csTh.borderBottomWidth + " " + csTh.borderBottomColor,
      tableBorderCollapse: getComputedStyle(g.querySelector("table")).borderCollapse,
      scrolledBy: Math.round(g.scrollTop),
      thTopBeforeScroll: Math.round(before.top - gRect0.top),
      thTopAfterScroll: Math.round(after.top - gRect.top),
      // sticky worked if the header stayed pinned to the container top
      staysPinned: Math.abs(after.top - gRect.top) < 2,
      // an unpainted (transparent) sticky header lets rows bleed through
      transparentBackground:
        csTh.backgroundColor === "rgba(0, 0, 0, 0)" || csTh.backgroundColor === "transparent",
    });
    g.scrollTop = 0;
  }

  // ---- 6. SVG text in charts: paint-order, halo stroke, clipping, overlap
  out.svg = [];
  // Only the real chart surfaces. `.recharts-surface` also matches the 14x14
  // legend swatch SVGs, which have no text and no bars.
  const svgs = document.querySelectorAll(".viz-root .recharts-wrapper > svg.recharts-surface");
  for (let i = 0; i < svgs.length && i < 4; i++) {
    const svg = svgs[i];
    const sRect = svg.getBoundingClientRect();
    const entry = {
      chart:
        (svg.closest("figure") && svg.closest("figure").getAttribute("aria-label")) || null,
      svgWidth: Math.round(sRect.width),
      svgHeight: Math.round(sRect.height),
      texts: [],
      bars: [],
    };
    // bar geometry, for overlap + var() resolution
    const barPaths = svg.querySelectorAll(".recharts-bar-rectangle path, .recharts-rectangle");
    const barRects = [];
    for (let b = 0; b < barPaths.length; b++) {
      const bp = barPaths[b];
      const r = bp.getBoundingClientRect();
      if (r.width < 0.5 || r.height < 0.5) continue;
      barRects.push(r);
      if (entry.bars.length < 3) {
        const cs = getComputedStyle(bp);
        entry.bars.push({
          fillAttr: bp.getAttribute("fill"),
          computedFill: cs.fill,
          strokeAttr: bp.getAttribute("stroke"),
          computedStroke: cs.stroke,
          fillOpacity: cs.fillOpacity,
        });
      }
    }
    entry.barCount = barRects.length;

    const texts = svg.querySelectorAll("text");
    for (let t = 0; t < texts.length; t++) {
      const el = texts[t];
      const s = (el.textContent || "").trim();
      if (!s) continue;
      const cs = getComputedStyle(el);
      const strokeW = parseFloat(cs.strokeWidth) || 0;
      const isHalo = strokeW > 1.5 && cs.stroke !== "none";
      // only report the annotation labels in full; tick labels are summarised
      const r = el.getBoundingClientRect();
      let bbox = null;
      try {
        const b = el.getBBox();
        bbox = { w: Math.round(b.width * 10) / 10, h: Math.round(b.height * 10) / 10 };
      } catch (e) {
        bbox = "throw";
      }
      let advance = null;
      try {
        advance = Math.round(el.getComputedTextLength() * 10) / 10;
      } catch (e) {
        advance = "throw";
      }
      const rec = {
        text: s.slice(0, 60),
        isHalo,
        paintOrderAttr: el.getAttribute("paint-order"),
        computedPaintOrder: cs.paintOrder || null,
        stroke: cs.stroke,
        strokeWidth: cs.strokeWidth,
        fill: cs.fill,
        fontSize: cs.fontSize,
        fontFamily: cs.fontFamily.slice(0, 60),
        bbox,
        advance,
        rect: {
          l: Math.round(r.left - sRect.left),
          r: Math.round(r.right - sRect.left),
          t: Math.round(r.top - sRect.top),
          b: Math.round(r.bottom - sRect.top),
        },
        // clipped by the svg viewport?
        clippedLeft: r.left < sRect.left - 0.5,
        clippedRight: r.right > sRect.right + 0.5,
        clippedTop: r.top < sRect.top - 0.5,
        clippedBottom: r.bottom > sRect.bottom + 0.5,
      };
      if (isHalo) {
        // how many bars does this annotation label sit on top of?
        let over = 0;
        for (let b = 0; b < barRects.length; b++) {
          const br = barRects[b];
          if (r.left < br.right && r.right > br.left && r.top < br.bottom && r.bottom > br.top)
            over++;
        }
        rec.barsOverlapped = over;
      }
      if (isHalo || t < 3) entry.texts.push(rec);
    }
    entry.haloCount = entry.texts.filter((x) => x.isHalo).length;
    out.svg.push(entry);
  }

  // ---- 7. bg-clip-text gradient headline
  out.gradientText = [];
  const grads = document.querySelectorAll(".bg-clip-text");
  for (let i = 0; i < grads.length; i++) {
    const el = grads[i];
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    out.gradientText.push({
      text: (el.textContent || "").trim().slice(0, 40),
      backgroundClip: cs.backgroundClip || null,
      webkitBackgroundClip: cs.webkitBackgroundClip || null,
      color: cs.color,
      backgroundImage: cs.backgroundImage.slice(0, 90),
      rect: { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top) },
      // transparent text + no clip:text == invisible headline
      atRiskInvisible:
        (cs.color === "rgba(0, 0, 0, 0)" || cs.color === "transparent") &&
        (cs.webkitBackgroundClip || cs.backgroundClip) !== "text",
    });
  }

  // ---- 8. CSS custom props resolving inside SVG presentation attributes
  const vizRoot = document.querySelector(".viz-root");
  if (vizRoot) {
    const rs = getComputedStyle(vizRoot);
    out.vizTokens = {
      colorScheme: rs.colorScheme || null,
      surface: rs.getPropertyValue("--viz-surface").trim(),
      text2: rs.getPropertyValue("--viz-text-2").trim(),
      axis: rs.getPropertyValue("--viz-axis").trim(),
      series1: rs.getPropertyValue("--series-1").trim(),
      series8: rs.getPropertyValue("--series-8").trim(),
    };
  }

  // ---- 9. tap targets (iOS 44x44 guidance) for interactive controls
  out.smallTapTargets = [];
  const inter = document.querySelectorAll("a[href],button,summary,[role='button']");
  for (let i = 0; i < inter.length; i++) {
    const el = inter[i];
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.height >= 24 && r.width >= 24) continue;
    out.smallTapTargets.push({
      ...desc(el),
      w: Math.round(r.width),
      h: Math.round(r.height),
    });
  }
  out.smallTapTargets = out.smallTapTargets.slice(0, 12);

  return out;
};

/* ------------------------------------------------- W3C WebDriver (Safari) */
class WebDriver {
  constructor(port) {
    this.base = `http://localhost:${port}`;
    this.sid = null;
  }
  async req(method, p, body) {
    const res = await fetch(this.base + p, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (j.value && j.value.error) {
      throw new Error(`${j.value.error}: ${j.value.message}`);
    }
    return j.value;
  }
  async start() {
    const v = await this.req("POST", "/session", {
      capabilities: { alwaysMatch: { browserName: "safari" } },
    });
    this.sid = v.sessionId;
    return v.capabilities;
  }
  s(p) {
    return `/session/${this.sid}${p}`;
  }
  goto(url) {
    return this.req("POST", this.s("/url"), { url });
  }
  exec(script, a = []) {
    return this.req("POST", this.s("/execute/sync"), { script, args: a });
  }
  setRect(r) {
    return this.req("POST", this.s("/window/rect"), r);
  }
  async shot() {
    return this.req("GET", this.s("/screenshot"));
  }
  // W3C key actions: keys is an array of {type:'keyDown'|'keyUp', value}
  keyActions(actions) {
    return this.req("POST", this.s("/actions"), {
      actions: [{ type: "key", id: "kbd", actions }],
    });
  }
  async press(key, times = 1) {
    const acts = [];
    for (let i = 0; i < times; i++) {
      acts.push({ type: "keyDown", value: key }, { type: "keyUp", value: key });
      acts.push({ type: "pause", duration: 20 });
    }
    return this.keyActions(acts);
  }
  quit() {
    return this.req("DELETE", this.s("")).catch(() => {});
  }
}

const KEY = { Tab: "", ArrowDown: "", ArrowRight: "", Space: " ", Enter: "" };

/* --------------------------------------------------------- engine adapters */
async function makeChrome() {
  const browser = await puppeteer.launch({
    executablePath:
      process.env.CHROME_PATH ??
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    headless: true,
    args: ["--force-device-scale-factor=1", "--hide-scrollbars=false"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 });
  if (DARK) await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  return {
    name: "chrome",
    async goto(url) {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 900));
    },
    evaluate(fn) {
      return page.evaluate(fn);
    },
    async pressTab(times) {
      for (let i = 0; i < times; i++) await page.keyboard.press("Tab");
    },
    async pressKey(k, times = 1) {
      for (let i = 0; i < times; i++) await page.keyboard.press(k);
    },
    async screenshot(file) {
      await page.screenshot({ path: file, fullPage: false });
    },
    async close() {
      await browser.close();
    },
  };
}

async function makeSafari() {
  const port = 4455;
  const proc = spawn("safaridriver", ["-p", String(port)], { stdio: "ignore", detached: true });
  await new Promise((r) => setTimeout(r, 1500));
  const d = new WebDriver(port);
  await d.start();
  // window rect sets the OUTER window; iterate until the viewport matches
  await d.setRect({ x: 0, y: 0, width: WIDTH, height: HEIGHT + 90 });
  await d.goto("about:blank");
  for (let i = 0; i < 4; i++) {
    const iw = await d.exec("return [window.innerWidth, window.innerHeight]");
    const dw = WIDTH - iw[0];
    const dh = HEIGHT - iw[1];
    if (Math.abs(dw) < 2 && Math.abs(dh) < 2) break;
    const cur = await d.req("GET", d.s("/window/rect"));
    await d.setRect({
      x: cur.x,
      y: cur.y,
      width: Math.round(cur.width + dw),
      height: Math.round(cur.height + dh),
    });
  }
  return {
    name: "safari",
    async goto(url) {
      await d.goto(url);
      await new Promise((r) => setTimeout(r, 1600));
    },
    async evaluate(fn) {
      return d.exec(`return (${fn.toString()}).apply(null, arguments)`);
    },
    async pressTab(times) {
      await d.press(KEY.Tab, times);
    },
    async pressKey(k, times = 1) {
      await d.press(KEY[k] ?? k, times);
    },
    async screenshot(file) {
      const b64 = await d.shot();
      writeFileSync(file, Buffer.from(b64, "base64"));
    },
    async close() {
      await d.quit();
      try {
        process.kill(-proc.pid);
      } catch (e) {}
    },
  };
}

/* ------------------------------------------------------- keyboard-reach test */
// Walks the real tab order and reports whether each scroll container becomes
// the active element, then whether arrow keys actually scroll it.
const TAB_REPORT = function () {
  const a = document.activeElement;
  if (!a) return null;
  return {
    tag: a.tagName,
    cls: (a.getAttribute("class") || "").slice(0, 70),
    role: a.getAttribute("role"),
    label: a.getAttribute("aria-label"),
    xbScroller: a.getAttribute("data-xb-scroller"),
    text: (a.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40),
    scrollTop: a.scrollTop,
    scrollLeft: a.scrollLeft,
  };
};

async function keyboardReach(drv, maxTabs) {
  // start from the very top of the document
  await drv.evaluate(function () {
    const dets = document.querySelectorAll("details");
    for (let i = 0; i < dets.length; i++) dets[i].open = true;
    if (document.activeElement && document.activeElement.blur)
      document.activeElement.blur();
    window.scrollTo(0, 0);
    return true;
  });
  const seq = [];
  const reachedScrollers = {};
  for (let i = 0; i < maxTabs; i++) {
    await drv.pressTab(1);
    const r = await drv.evaluate(TAB_REPORT);
    if (!r) break;
    seq.push(r);
    if (r.xbScroller !== null && r.xbScroller !== undefined && !(r.xbScroller in reachedScrollers)) {
      // it took focus - now can we scroll it from the keyboard?
      const before = await drv.evaluate(function () {
        const a = document.activeElement;
        return { top: a.scrollTop, left: a.scrollLeft };
      });
      await drv.pressKey("ArrowDown", 3);
      await drv.pressKey("ArrowRight", 3);
      // scrolls settle asynchronously; without this the read races the paint
      await new Promise((r) => setTimeout(r, 400));
      const after = await drv.evaluate(function () {
        const a = document.activeElement;
        return { top: a.scrollTop, left: a.scrollLeft, stillFocused: !!a.getAttribute("data-xb-scroller") };
      });
      reachedScrollers[r.xbScroller] = {
        tabStop: i + 1,
        before,
        after,
        scrolledByKeyboard: after.top > before.top + 1 || after.left > before.left + 1,
      };
    }
  }
  return { tabStops: seq.length, sequence: seq, reachedScrollers };
}

/* ----------------------------------------------------------------- runner */
const scheme = DARK ? "dark" : "light";
const results = { engine: ENGINE, width: WIDTH, height: HEIGHT, scheme, base: BASE, routes: {} };

const drv = ENGINE === "safari" ? await makeSafari() : await makeChrome();
try {
  for (const route of ROUTES) {
    const url = BASE + route;
    process.stderr.write(`[${ENGINE} ${WIDTH} ${scheme}] ${route}\n`);
    try {
      await drv.goto(url);
      const data = await drv.evaluate(PROBE);
      if (data?.env?.visibility === "hidden") {
        process.stderr.write(
          `[${ENGINE} ${WIDTH} ${scheme}] ${route}  WARNING: window is occluded ` +
            `(visibilityState=hidden). Streamed routes will sit on their loading ` +
            `fallback and screenshots will be black — see the env.visibility ` +
            `comment in this script. Keep the browser window visible and re-run.\n`,
        );
      }
      // keyboard reach only where there is something to reach
      if ((data.scrollers || []).length > 0) {
        data.keyboard = await keyboardReach(drv, route === "/glossary" ? 60 : 45);
      }
      const slug = route.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "home";
      data.screenshots = {};
      // Safari's WebDriver screenshot is viewport-only, so anchor both engines
      // on the same two scroll positions to get comparable images.
      await drv.evaluate(function () {
        window.scrollTo(0, 0);
        return true;
      });
      await new Promise((r) => setTimeout(r, 350));
      const topShot = path.join(SHOT_DIR, `${ENGINE}-${WIDTH}-${scheme}-${slug}-top.png`);
      await drv.screenshot(topShot);
      data.screenshots.top = topShot;

      // the first chart, scrolled so its annotation labels are on screen
      const hasChart = await drv.evaluate(function () {
        const f = document.querySelector(".viz-root .recharts-wrapper");
        if (!f) return false;
        const fig = f.closest("figure") || f;
        fig.scrollIntoView({ block: "start" });
        window.scrollBy(0, -12);
        return true;
      });
      if (hasChart) {
        await new Promise((r) => setTimeout(r, 450));
        const chartShot = path.join(SHOT_DIR, `${ENGINE}-${WIDTH}-${scheme}-${slug}-chart.png`);
        await drv.screenshot(chartShot);
        data.screenshots.chart = chartShot;
      }
      results.routes[route] = data;
    } catch (e) {
      results.routes[route] = { error: String(e && e.message ? e.message : e) };
      process.stderr.write(`   ERROR ${e}\n`);
    }
  }
} finally {
  await drv.close();
}

const outFile = path.join(OUT_DIR, `xb-${ENGINE}-${WIDTH}-${scheme}.json`);
writeFileSync(outFile, JSON.stringify(results, null, 2));
process.stderr.write(`\nwrote ${outFile}\n`);
