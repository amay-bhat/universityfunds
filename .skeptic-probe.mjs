import puppeteer from "puppeteer-core";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = "http://localhost:3000";

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: true,
  args: ["--no-sandbox", "--force-device-scale-factor=1"],
});

const helpers = `
  window.__termByText = (txt) => [...document.querySelectorAll('button[aria-expanded]')]
    .find(b => b.textContent.replace(/\\s+/g,' ').trim().replace(/°$/,'').trim() === txt);
  window.__bubble = () => [...document.body.children]
    .find(el => el.tagName === 'SPAN' && getComputedStyle(el).position === 'fixed');
  window.__r = (el) => { if (!el) return null; const r = el.getBoundingClientRect();
    return { left: Math.round(r.left), right: Math.round(r.right), top: Math.round(r.top), bottom: Math.round(r.bottom), w: Math.round(r.width), h: Math.round(r.height) }; };
`;

async function page(url, w, h) {
  const p = await browser.newPage();
  await p.setViewport({ width: w, height: h });
  await p.goto(BASE + url, { waitUntil: "networkidle0" });
  await p.evaluate(helpers);
  return p;
}

const out = {};

// ---------- CLAIM 1 ----------
{
  const cases = [
    ["/methodology", "policy portfolio", 320, 200],
    ["/methodology", "policy portfolio", 320, 240],
    ["/methodology", "fiscal year", 320, 200],
    ["/methodology", "Merged Pool", 360, 220],
    ["/compare", "Annualized return", 320, 200],
    ["/compare", "60/40", 320, 200],
    ["/methodology", "policy portfolio", 375, 667],
    ["/compare", "60/40", 1280, 800],
  ];
  out.claim1 = [];
  for (const [url, term, w, h] of cases) {
    const p = await page(url, w, h);
    const res = await p.evaluate(async (term) => {
      const btn = window.__termByText(term);
      if (!btn) return { error: "term not found" };
      btn.scrollIntoView({ block: "center" });
      await new Promise((r) => setTimeout(r, 150));
      btn.click();
      await new Promise((r) => setTimeout(r, 200));
      const b = window.__bubble();
      const trig = window.__r(btn);
      const bub = window.__r(b);
      if (!bub) return { trig, bub: null, open: btn.getAttribute("aria-expanded") };
      const overlapV = Math.min(trig.bottom, bub.bottom) - Math.max(trig.top, bub.top);
      const overlapH = Math.min(trig.right, bub.right) - Math.max(trig.left, bub.left);
      const cx = (trig.left + trig.right) / 2, cy = (trig.top + trig.bottom) / 2;
      const hit = document.elementFromPoint(cx, cy);
      return {
        trig, bub,
        overlaps: overlapV > 0 && overlapH > 0,
        wordFullyInsideBubbleBox: bub.top <= trig.top && bub.bottom >= trig.bottom && bub.left <= trig.left && bub.right >= trig.right,
        wordCentreHitsBubble: !!(b && hit && b.contains(hit)),
        bubbleTallerThanViewport: bub.h > innerHeight,
      };
    }, term);
    out.claim1.push({ url, term, viewport: `${w}x${h}`, ...res });
    await p.close();
  }
}

// ---------- CLAIM 2 ----------
{
  const p = await page("/compare", 1280, 800);
  out.claim2 = await p.evaluate(async () => {
    const btn = window.__termByText("Annualized return");
    if (!btn) return { error: "term not found" };
    btn.scrollIntoView({ block: "center" });
    await new Promise((r) => setTimeout(r, 250));
    btn.click();
    await new Promise((r) => setTimeout(r, 250));
    const before = { trig: window.__r(btn), bub: window.__r(window.__bubble()), scrollY: Math.round(scrollY) };
    const sum = [...document.querySelectorAll("summary")].find((s) =>
      s.textContent.includes("View this chart as a table"),
    );
    if (!sum) return { before, error: "summary not found" };
    sum.click();
    await new Promise((r) => setTimeout(r, 500));
    const after = {
      trig: window.__r(btn),
      bub: window.__r(window.__bubble()),
      ariaExpanded: btn.getAttribute("aria-expanded"),
      scrollY: Math.round(scrollY),
    };
    return {
      before, after,
      triggerMovedPx: after.trig.top - before.trig.top,
      bubbleMovedPx: after.bub ? after.bub.top - before.bub.top : null,
      bubbleTopMinusWordTop: after.bub ? after.bub.top - after.trig.top : null,
    };
  });
  await p.close();
}

// ---------- CLAIM 3 ----------
{
  const p = await page("/compare", 1280, 800);
  out.claim3 = await p.evaluate(async () => {
    const btn = window.__termByText("60/40");
    if (!btn) return { error: "term not found" };
    scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 150));
    btn.click();
    await new Promise((r) => setTimeout(r, 250));
    const bubble = window.__bubble();
    const bub = window.__r(bubble);
    const selects = [...document.querySelectorAll("select")].map((s, i) => {
      const r = window.__r(s);
      const cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2;
      const hit = document.elementFromPoint(cx, cy);
      let reachable = 0, total = 0;
      for (let x = r.left + 2; x < r.right - 2; x += 5) {
        for (let y = r.top + 2; y < r.bottom - 2; y += 3) {
          total++;
          const h = document.elementFromPoint(x, y);
          if (h === s || s.contains(h)) reachable++;
        }
      }
      return {
        idx: i, rect: r,
        centreHitTag: hit ? hit.tagName : null,
        centreHitIsBubble: !!(bubble && hit && bubble.contains(hit)),
        reachablePctByPointer: Math.round((100 * reachable) / Math.max(1, total)),
      };
    });
    const pe = bubble ? getComputedStyle(bubble).pointerEvents : null;
    const bcx = (bub.left + bub.right) / 2, bcy = (bub.top + bub.bottom) / 2;
    const inner = document.elementFromPoint(bcx, bcy);
    inner.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, composed: true }));
    inner.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
    inner.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    return {
      bub, pointerEventsComputed: pe, selects,
      afterClickingBubble: { ariaExpanded: btn.getAttribute("aria-expanded"), bubblePresent: !!window.__bubble() },
    };
  });

  // ---------- CLAIM 4 ----------
  out.claim4 = await p.evaluate(async () => {
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((r) => setTimeout(r, 150));
    const btn = window.__termByText("60/40");
    scrollTo(0, 0);
    btn.focus();
    btn.click();
    await new Promise((r) => setTimeout(r, 250));
    const bubble = window.__bubble();
    const bub = window.__r(bubble);
    const focusables = [...document.querySelectorAll(
      'a[href], button, select, input, textarea, summary, [tabindex]:not([tabindex="-1"])',
    )].filter((el) => el.getClientRects().length > 0);
    const i = focusables.indexOf(btn);
    const next = focusables[i + 1] ?? null;
    const nr = window.__r(next);
    let visible = 0, total = 0;
    if (nr) {
      for (let x = nr.left + 1; x < nr.right - 1; x += 3) {
        for (let y = nr.top + 1; y < nr.bottom - 1; y += 2) {
          total++;
          const h = document.elementFromPoint(x, y);
          if (!(bubble && h && bubble.contains(h))) visible++;
        }
      }
    }
    const entirelyHidden = nr
      ? bub.left <= nr.left && bub.right >= nr.right && bub.top <= nr.top && bub.bottom >= nr.bottom
      : null;
    if (next) next.focus();
    const stillOpen = !!window.__bubble();
    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    await new Promise((r) => setTimeout(r, 200));
    return {
      bub,
      nextFocusable: next ? { tag: next.tagName, text: next.textContent.replace(/\s+/g, " ").trim().slice(0, 40), rect: nr } : null,
      nextFocusableVisiblePct: total ? Math.round((100 * visible) / total) : null,
      nextFocusableEntirelyHiddenByBubble: entirelyHidden,
      bubbleStillOpenAfterFocusMovedAway: stillOpen,
      afterEscapeWhileFocusElsewhere: {
        bubblePresent: !!window.__bubble(),
        activeElementTag: document.activeElement ? document.activeElement.tagName : null,
        activeElementIsTermButton: document.activeElement === btn,
      },
    };
  });
  await p.close();
}

console.log(JSON.stringify(out, null, 2));
await browser.close();
