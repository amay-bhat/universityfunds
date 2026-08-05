// Behavioural checks for the floating definition bubble (<Term>) and /glossary.
//
// The geometry is unit-tested (src/lib/__tests__/bubble-position.test.ts), but
// everything that only exists in a live document — the portal escaping a
// clipping ancestor, pointer-events pass-through, focus and dismissal, the
// accessible name of the heading a term sits in — needs a real browser. This
// drives installed Chrome through puppeteer-core rather than adding a DOM
// emulator, matching how the layout checks in this repo are done.
//
//   npm run dev            # in another shell
//   node scripts/verify-term-bubble.mjs [http://localhost:3000]
//
// Exits non-zero on the first failing expectation, so it can gate a release.

import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const failures = [];
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS  " : "FAIL  "}${msg}`);
  if (!cond) failures.push(msg);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// The bubble is the only z-[60] child of <body>.
const BUBBLES = `[...document.body.children].filter((e) => e.className && String(e.className).includes("z-[60]"))`;

const browser = await puppeteer.launch({ executablePath: CHROME });
const page = await browser.newPage();
page.on("pageerror", (e) => ok(false, `page error: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") ok(false, `console error: ${m.text()}`);
});

async function openFirstTerm(selector = "main button[aria-expanded]") {
  await page.evaluate((s) => document.querySelector(s).click(), selector);
  await wait(300);
}

// ---------------------------------------------------------------- opening
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/explore/yale`, { waitUntil: "networkidle0" });

const heading = () =>
  page.evaluate(() =>
    [...document.querySelectorAll("h2")]
      .find((e) => e.textContent.includes("story"))
      .getBoundingClientRect().top,
  );
const before = await heading();
await openFirstTerm();
ok((await heading()) === before, "opening a definition does not reflow the page");
ok(await page.evaluate(`${BUBBLES}.length === 1`), "the bubble is portaled to <body>");
ok(
  await page.evaluate(
    `(() => { const s = getComputedStyle(${BUBBLES}[0]); return s.position === "fixed" && s.visibility === "visible"; })()`,
  ),
  "the bubble is fixed and visible",
);

// The bubble must not intercept pointer events meant for what it covers.
ok(
  await page.evaluate(`getComputedStyle(${BUBBLES}[0]).pointerEvents === "none"`),
  "a bubble that fits is inert (pointer-events: none), so it cannot swallow taps",
);

// -------------------------------------------------- accessible names stay clean
// A live region rendered beside the word would become part of the accessible
// name of the <h2> or <th> containing it.
ok(
  await page.evaluate(() => {
    const h2 = [...document.querySelectorAll("h2")].find((e) =>
      e.textContent.includes("Asset allocation"),
    );
    return h2 && !/long-term investment fund|per-year growth rate/.test(h2.textContent);
  }),
  "an open definition does not leak into the heading's accessible name",
);
ok(
  await page.evaluate(
    () => document.querySelectorAll('body > [role="status"]').length === 1,
  ),
  "exactly one live region, mounted at body level",
);
ok(
  await page.evaluate(
    () => /long-term investment fund/.test(document.querySelector('body > [role="status"]').textContent),
  ),
  "the live region carries the open definition",
);

// ------------------------------------------------------------------ dismissal
await page.keyboard.press("Escape");
await wait(200);
ok(await page.evaluate(`${BUBBLES}.length === 0`), "Escape closes the bubble");

// Keyboard-only path: focus the word as Tab would, then drive it with the keyboard.
await page.evaluate(() => document.querySelector("main button[aria-expanded]").focus());
await page.keyboard.press("Enter");
await wait(250);
ok(await page.evaluate(`${BUBBLES}.length === 1`), "Enter on the focused word opens it");
ok(
  await page.evaluate(
    () => document.activeElement === document.querySelector("main button[aria-expanded]"),
  ),
  "opening does not move focus off the word",
);
await page.keyboard.press("Escape");
await wait(200);
ok(
  await page.evaluate(
    () => document.activeElement === document.querySelector("main button[aria-expanded]"),
  ),
  "Escape leaves focus on the word rather than moving it",
);
await page.keyboard.press("Enter");
await wait(250);
ok(await page.evaluate(`${BUBBLES}.length === 1`), "the word can be reopened from the keyboard");
await page.keyboard.press("Tab");
await wait(250);
ok(
  await page.evaluate(`${BUBBLES}.length === 0`),
  "tabbing away closes it, so it never covers the next control",
);

await openFirstTerm();
await page.mouse.click(1200, 850);
await wait(250);
ok(await page.evaluate(`${BUBBLES}.length === 0`), "clicking away closes it");

// ------------------------------------------------------------- one at a time
await page.evaluate(() => {
  const bs = [...document.querySelectorAll("main button[aria-expanded]")];
  bs[0].click();
  bs[1]?.click();
});
await wait(300);
ok(await page.evaluate(`${BUBBLES}.length <= 1`), "only one bubble is open at a time");
ok(
  await page.evaluate(
    () => document.querySelectorAll('button[aria-expanded="true"]').length <= 1,
  ),
  "only one trigger reports aria-expanded=true",
);

// ------------------------------- the case that forced a portal: a clipping table
await page.goto(`${BASE}/compare`, { waitUntil: "networkidle0" });
ok(
  await page.evaluate(
    () => !!document.querySelector("th button[aria-expanded]")?.closest(".overflow-x-auto"),
  ),
  "the Compare table's term really does sit inside an overflow-x-auto scroller",
);
await page.evaluate(() =>
  document.querySelector("th button[aria-expanded]").scrollIntoView({ block: "center" }),
);
await wait(300);
await openFirstTerm("th button[aria-expanded]");
ok(
  await page.evaluate(
    `(() => { const el = ${BUBBLES}[0]; if (!el) return false; const r = el.getBoundingClientRect();
       return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight; })()`,
  ),
  "the bubble in the scrolling table stays fully inside the viewport",
);
ok(
  await page.evaluate(
    `(() => { const el = ${BUBBLES}[0]; const r = el.getBoundingClientRect();
       const hit = document.elementFromPoint(r.left + r.width / 2, r.top + 6);
       return !!hit && !el.contains(hit); })()`,
  ),
  "the inert bubble lets a click reach the element underneath it",
);
ok(
  await page.evaluate(
    () => !/single per-year growth rate/.test(document.querySelector("th").textContent),
  ),
  "an open definition does not leak into the column header's accessible name",
);

// scrolling the word away closes it rather than orphaning the bubble
await page.evaluate(() => window.scrollTo(0, 0));
await wait(500);
ok(await page.evaluate(`${BUBBLES}.length === 0`), "scrolling the word out of sight closes it");

// ------------------------------------------------------------------ phone
await page.setViewport({ width: 375, height: 667 });
await page.goto(`${BASE}/compare`, { waitUntil: "networkidle0" });
await openFirstTerm();
ok(
  await page.evaluate(
    `(() => { const r = ${BUBBLES}[0].getBoundingClientRect();
       return r.left >= 0 && r.right <= innerWidth; })()`,
  ),
  "the bubble fits a 375px viewport",
);
ok(
  await page.evaluate(() => document.documentElement.scrollWidth <= 376),
  "an open bubble causes no horizontal page overflow",
);
// A neighbouring term covered by the bubble must still be reachable.
ok(
  await page.evaluate(`(() => {
     const el = ${BUBBLES}[0]; const r = el.getBoundingClientRect();
     const covered = [...document.querySelectorAll("main button[aria-expanded]")].filter((b) => {
       const t = b.getBoundingClientRect();
       const cx = t.left + t.width / 2, cy = t.top + t.height / 2;
       return cx > r.left && cx < r.right && cy > r.top && cy < r.bottom;
     });
     if (covered.length === 0) return true; // nothing covered on this layout
     return covered.every((b) => {
       const t = b.getBoundingClientRect();
       const hit = document.elementFromPoint(t.left + t.width / 2, t.top + t.height / 2);
       return b.contains(hit) || b === hit;
     });
   })()`),
  "terms underneath the bubble are still hit-testable (not dead until dismissed)",
);

// ------------------------------------------------------- forced colours / print
// Chrome cannot be asked to emulate forced-colors here, so this checks that the
// rules the bubble needs were actually generated: in High Contrast mode
// box-shadow is stripped, and ring/shadow are both box-shadow, so without a real
// border the bubble would have no edge at all over the text it covers.
await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/explore/yale`, { waitUntil: "networkidle0" });
await openFirstTerm();
// Read the stylesheet text rather than walking the CSSOM: Tailwind v4 nests the
// at-rule inside the utility, producing CSSNestedDeclarations nodes that have
// neither selectorText nor cssRules, so a naive rule walk finds nothing.
const cssCheck = await page.evaluate(`(async () => {
  const el = ${BUBBLES}[0];
  const wanted = [...el.classList].filter(
    (c) => c.startsWith("forced-colors:") || c === "print:hidden",
  );
  const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map((l) => l.href);
  const inline = [...document.querySelectorAll("style")].map((s) => s.textContent).join("\\n");
  const fetched = await Promise.all(
    hrefs.map((h) => fetch(h).then((r) => r.text()).catch(() => "")),
  );
  const css = inline + "\\n" + fetched.join("\\n");
  return {
    wanted,
    forcedBorder: /@media\\s*\\(forced-colors:\\s*active\\)[\\s\\S]{0,400}?border-width/.test(css),
    forcedColor: /border-color:\\s*canvastext/i.test(css),
    printHidden: /@media\\s*print[\\s\\S]{0,200}?print\\\\:hidden[\\s\\S]{0,120}?display:\\s*none/.test(css),
  };
})()`);
ok(
  cssCheck.wanted.some((c) => c.startsWith("forced-colors:")),
  `the bubble asks for a forced-colors border (${cssCheck.wanted.join(" ")})`,
);
ok(
  cssCheck.forcedBorder && cssCheck.forcedColor,
  "a forced-colors border rule reaching CanvasText was generated (ring/shadow are stripped there)",
);
ok(cssCheck.printHidden, "an open bubble is hidden when printing");

// ----------------------------------------------------------------- glossary
for (const [width, height, tag] of [
  [1280, 1000, "desktop"],
  [375, 900, "phone"],
  [320, 900, "320px"],
]) {
  await page.setViewport({ width, height });
  await page.goto(`${BASE}/glossary`, { waitUntil: "networkidle0" });
  const g = await page.evaluate(() => {
    const stated = document.body.textContent.match(/(\d+)\s+terms, alphabetically/);
    return {
      dt: document.querySelectorAll("dl dt").length,
      dd: document.querySelectorAll("dl dd").length,
      ids: document.querySelectorAll("dl [id]").length,
      stated: stated ? Number(stated[1]) : -1,
      overflow: document.documentElement.scrollWidth,
      nav: document.querySelectorAll('nav[aria-label="Main"] a').length,
      disclaimer: document.body.textContent.includes("Education, not financial advice"),
    };
  });
  ok(g.dt === g.dd && g.dt > 0, `[${tag}] every term has a definition (${g.dt}/${g.dd})`);
  ok(g.dt === g.stated, `[${tag}] the stated count matches what is rendered (${g.stated})`);
  ok(g.ids === g.dt, `[${tag}] every term has its own anchor id`);
  ok(g.overflow <= width + 1, `[${tag}] no horizontal overflow (${g.overflow})`);
  ok(g.nav === 5, `[${tag}] nav carries all five sections`);
  ok(g.disclaimer, `[${tag}] the disclaimer is present`);
}

await page.setViewport({ width: 1280, height: 900 });
await page.goto(`${BASE}/glossary#fiscal-year`, { waitUntil: "networkidle0" });
ok(
  await page.evaluate(() => {
    const e = document.getElementById("fiscal-year");
    return !!e && e.getBoundingClientRect().top < 400;
  }),
  "a per-term deep link scrolls to that term",
);

await browser.close();
console.log(
  failures.length ? `\n${failures.length} FAILURE(S)` : "\nall term-bubble checks passed",
);
process.exit(failures.length ? 1 : 0);
