// Control experiment for the tier-2 cross-browser audit.
//
// Claim under test: the /methodology and /translate page-level table wrappers
// are keyboard-reachable in Chrome ONLY because of Chrome >=127's implicit
// focusable scrollers (a scroll container with no focusable descendant gets an
// implicit tab stop). If that is the mechanism, reachability must disappear when
// we either (B) take the overflow away or (C) give the container a focusable
// descendant — and neither manipulation touches a tabindex attribute.
//
// Each condition gets a FRESH page load: blurring an element leaves Chrome's
// sequential-focus-navigation starting point on it, so Tab resumes *after* it
// and a reused page silently measures the wrong thing.
//
//   node scripts/xb-debug.mjs [url] [width]
import puppeteer from "puppeteer-core";

const URL = process.argv[2] ?? "https://universityfunds.vercel.app/methodology";
const WIDTH = Number(process.argv[3] ?? 375);
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true });

// Marks the first page-level horizontal scroller and reports its properties.
const MARK = () => {
  const el = [...document.querySelectorAll("div.overflow-x-auto")].find(
    (d) => d.scrollWidth > d.clientWidth + 1,
  );
  if (!el) return null;
  el.id = "xb-target";
  return {
    tabindexAttr: el.getAttribute("tabindex"),
    tabIndexProp: el.tabIndex,
    overflowX: getComputedStyle(el).overflowX,
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    focusableDescendants: el.querySelectorAll(
      'a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])',
    ).length,
  };
};

async function fresh(mutate) {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: 800 });
  await page.goto(URL, { waitUntil: "networkidle2" });
  await new Promise((r) => setTimeout(r, 900));
  const info = await page.evaluate(MARK);
  if (info && mutate) {
    await page.evaluate(mutate);
    await new Promise((r) => setTimeout(r, 250));
  }
  return { page, info };
}

// Tab from a pristine starting point and report the stop at which `id` is hit.
async function tabTo(page, id, maxTabs = 80) {
  for (let i = 1; i <= maxTabs; i++) {
    await page.keyboard.press("Tab");
    const hit = await page.evaluate((x) => document.activeElement?.id === x, id);
    if (hit) return i;
  }
  return null;
}

console.log(`URL=${URL}  width=${WIDTH}\n`);

// ---- A: as shipped
{
  const { page, info } = await fresh(null);
  console.log("A. AS SHIPPED (scrollable, 0 focusable descendants, no tabindex attr)");
  console.log("   props:", JSON.stringify(info));
  const stop = await tabTo(page, "xb-target");
  console.log(`   reached by sequential Tab: ${stop === null ? "NO" : "YES at stop " + stop}`);
  if (stop !== null) {
    const before = await page.evaluate(() => document.getElementById("xb-target").scrollLeft);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await new Promise((r) => setTimeout(r, 300));
    const after = await page.evaluate(() => document.getElementById("xb-target").scrollLeft);
    console.log(`   arrow keys scrolled it: ${before} -> ${after}px`);
    console.log(
      "   focus ring painted:",
      await page.evaluate(() => {
        const cs = getComputedStyle(document.getElementById("xb-target"));
        return `outline=${cs.outlineStyle} ${cs.outlineWidth} ${cs.outlineColor}`;
      }),
    );
  }
  await page.close();
}

// ---- B: not a scroller any more
{
  const { page } = await fresh(() => {
    const el = document.getElementById("xb-target");
    el.style.overflowX = "visible";
    el.querySelector("table").style.minWidth = "0";
  });
  console.log("\nB. OVERFLOW REMOVED (same element, no tabindex change)");
  console.log(
    "   still a scroller:",
    await page.evaluate(() => {
      const el = document.getElementById("xb-target");
      return el.scrollWidth > el.clientWidth + 1;
    }),
  );
  const stop = await tabTo(page, "xb-target");
  console.log(`   reached by sequential Tab: ${stop === null ? "NO" : "YES at stop " + stop}`);
  await page.close();
}

// ---- C: scroller, but with a focusable descendant
{
  const { page } = await fresh(() => {
    const el = document.getElementById("xb-target");
    const b = document.createElement("button");
    b.id = "xb-bait";
    b.textContent = "bait";
    el.querySelector("td,th").appendChild(b);
  });
  console.log("\nC. FOCUSABLE DESCENDANT ADDED (still a scroller, no tabindex change)");
  console.log(
    "   still a scroller:",
    await page.evaluate(() => {
      const el = document.getElementById("xb-target");
      return el.scrollWidth > el.clientWidth + 1;
    }),
  );
  const stop = await tabTo(page, "xb-target");
  console.log(`   container reached by sequential Tab: ${stop === null ? "NO" : "YES at stop " + stop}`);
  await page.close();
}
{
  const { page } = await fresh(() => {
    const el = document.getElementById("xb-target");
    const b = document.createElement("button");
    b.id = "xb-bait";
    b.textContent = "bait";
    el.querySelector("td,th").appendChild(b);
  });
  const baitStop = await tabTo(page, "xb-bait");
  console.log(`   bait button reached by sequential Tab: ${baitStop === null ? "NO" : "YES at stop " + baitStop}`);
  await page.close();
}

await browser.close();
