// Step-7 verification for the allocation chart's on-chart basis annotations
// (dataviz skill: "a chart is not done when it compiles, it is done when you
// have looked at it, in both themes, at phone width").
//
// The data derivation is unit-tested (src/lib/__tests__/chart-data.test.ts), but
// the annotations only exist in a live document: Recharts renders ReferenceLine
// labels client-side into SVG, so a server-HTML grep cannot see them at all —
// that measurement trap is recorded in the TASKS.md build log. This drives
// installed Chrome through puppeteer-core, matching scripts/verify-term-bubble.mjs.
//
//   npm run dev            # in another shell
//   node scripts/verify-allocation-annotations.mjs [http://localhost:3000]
//
// Writes screenshots next to the checks so a human can look too. Exits non-zero
// on the first failing expectation, so it can gate a release.

import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = process.argv[2] ?? "http://localhost:3000";
const CHROME =
  process.env.CHROME_PATH ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const OUT = process.env.SHOT_DIR ?? "/tmp/alloc-shots";

const failures = [];
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS  " : "FAIL  "}${msg}`);
  if (!cond) failures.push(msg);
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({ executablePath: CHROME });
const page = await browser.newPage();
page.on("pageerror", (e) => ok(false, `page error: ${e.message}`));
page.on("console", (m) => {
  if (m.type() === "error") ok(false, `console error: ${m.text()}`);
});

// All text rendered inside the ALLOCATION chart, which is where the annotations
// live. Two traps, both hit while writing this: a school page holds more than
// one <figure> (allocation, returns, sometimes market value), and Recharts nests
// several <svg> elements per figure — so `figure svg` selects a legend swatch
// with no text in it. Scope by figcaption, then collect every descendant text.
const svgText = () =>
  page.evaluate(() => {
    const fig = [...document.querySelectorAll("figure")].find((f) =>
      /Asset allocation/.test(f.querySelector("figcaption")?.textContent ?? ""),
    );
    if (!fig) return null;
    return [...fig.querySelectorAll("svg text")]
      .map((t) => t.textContent.trim())
      .filter(Boolean)
      .join(" | ");
  });

async function visit(school, { dark = false, width = 1280 } = {}) {
  await page.setViewport({ width, height: 900, deviceScaleFactor: 2 });
  await page.emulateMediaFeatures([
    { name: "prefers-color-scheme", value: dark ? "dark" : "light" },
  ]);
  await page.goto(`${BASE}/explore/${school}`, { waitUntil: "networkidle0" });
  // Recharts paints after hydration.
  await wait(700);
}

async function shoot(name) {
  const handles = await page.$$("figure");
  for (const h of handles) {
    const isAlloc = await h.evaluate((f) =>
      /Asset allocation/.test(f.querySelector("figcaption")?.textContent ?? ""),
    );
    if (isAlloc) {
      await h.screenshot({ path: `${OUT}/${name}.png` });
      return;
    }
  }
}

// ---- MIT: pool years form a prefix, so the boundary line must be drawn.
await visit("mit");
let text = await svgText();
ok(text !== null, "MIT: allocation chart SVG rendered");
ok(
  /investment pool through FY2004/.test(text),
  "MIT: on-chart pool-universe boundary annotation present",
);
ok(
  !/targets through FY/.test(text),
  "MIT: NO targets-through boundary (its only target year sits mid-series)",
);
ok(!/†/.test(text), "MIT: no per-year dagger (boundary treatment is in use instead)");
await shoot("mit-light");

await visit("mit", { dark: true });
text = await svgText();
ok(
  /investment pool through FY2004/.test(text),
  "MIT: boundary annotation also present in dark mode",
);
await shoot("mit-dark");

await visit("mit", { width: 375 });
text = await svgText();
ok(/investment pool through FY2004/.test(text), "MIT: boundary annotation survives 375px");
const overflow = await page.evaluate(
  () => document.documentElement.scrollWidth <= window.innerWidth + 1,
);
ok(overflow, "MIT: no horizontal overflow at 375px");
await shoot("mit-375");

// ---- Harvard: targets form a prefix and there are no pool years.
await visit("harvard");
text = await svgText();
ok(/targets through FY2016/.test(text), "Harvard: targets boundary still drawn");
ok(
  !/investment pool/.test(text),
  "Harvard: no pool annotation (it has no pool-universe years)",
);
await shoot("harvard-light");

// ---- Yale: neither distinction, but the coverage end must still be annotated.
await visit("yale");
text = await svgText();
ok(/last disclosed: FY2020/.test(text), "Yale: coverage-end annotation still drawn");
ok(!/investment pool|targets through/.test(text), "Yale: no basis annotations (none apply)");
await shoot("yale-light");

await browser.close();
console.log(`\nscreenshots: ${OUT}`);
if (failures.length) {
  console.error(`\n${failures.length} failure(s)`);
  process.exit(1);
}
console.log("all annotation checks passed");
