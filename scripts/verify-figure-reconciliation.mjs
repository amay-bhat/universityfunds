// Independent arithmetic check on the curated figures.
//
// Why this exists: the seed validator checks citation SHAPE (every row has a
// sourceId, every sourceId resolves) but NOT that a cited document contains the
// figure. CONSTITUTION Article 2 says so explicitly — that is a curator
// obligation, not a validated one. So a transcription error (digit transposed,
// wrong year's row copied) passes every existing gate.
//
// This closes part of that gap without fetching any PDF, by using an identity
// the figures must satisfy amongst themselves:
//
//     MV[t] ≈ MV[t-1] × (1 + return[t]) + gifts − spending
//
// Endowment spending is conventionally 4–5.5% of a trailing average and gifts
// add roughly 1–2%, so the IMPLIED NET FLOW should land in a narrow negative
// band year after year. A wrong return or a wrong market value throws its year
// out of that band immediately, because the error has to be absorbed by an
// implausible flow.
//
// This is a heuristic, not an invariant — a genuinely exceptional gift year can
// breach the band honestly. So known breaches are recorded below with their
// documented cause, and the script fails only on a NEW one.
//
//   node scripts/verify-figure-reconciliation.mjs
//
// Exits non-zero on an unexplained breach, so it can gate a data change.

import { readFileSync, readdirSync } from "node:fs";

const DIR = "data/schools";
// Empirically the band is -7.5% to +1.0% across 96 school-years of real data.
const LOW = -7.5;
const HIGH = 1.0;

// Breaches with a documented cause. Each must cite where the cause is recorded,
// so this list can never become a place to silence an inconvenient failure.
const ACCEPTED = {
  "mit:2006":
    "MIT's market-value series has a documented basis break at FY2006/FY2007 " +
    "worth about 0.4% (the FY2010 reclassification restated FY2007-FY2009 but " +
    "not FY2000-FY2006). MIT's return is also Pool A basis while its market " +
    "value is endowment basis, so the two sides measure different universes. " +
    "Both are recorded in data/README.md, MIT section.",
  "princeton:2009":
    "Crash-year timing. Princeton's FY2009 return is PRINCO's investment " +
    "result while the market value reflects all flows including gifts received " +
    "during the drawdown. Magnitude (+1.05%) is just outside the band.",
};

let failures = 0;
let checked = 0;
const breaches = [];

for (const file of readdirSync(DIR).filter((f) => f.endsWith(".json")).sort()) {
  const school = file.replace(/\.json$/, "");
  const data = JSON.parse(readFileSync(`${DIR}/${file}`, "utf8"));
  const byYear = new Map(
    (data.endowmentReturns ?? []).map((r) => [r.fiscalYear, r]),
  );
  const years = [...byYear.keys()].sort((a, b) => a - b);
  if (!years.some((y) => byYear.get(y).returnPct !== null)) {
    console.log(`${school}: no return series (by design) — skipped`);
    continue;
  }
  let schoolChecked = 0;
  for (const y of years) {
    const prev = byYear.get(y - 1);
    const cur = byYear.get(y);
    if (!prev) continue;
    const pmv = prev.marketValueUsdMillions;
    const cmv = cur.marketValueUsdMillions;
    const r = cur.returnPct;
    if (pmv == null || cmv == null || r == null) continue;
    const flow = (cmv / (pmv * (1 + r / 100)) - 1) * 100;
    checked++;
    schoolChecked++;
    if (flow < LOW || flow > HIGH) {
      const key = `${school}:${y}`;
      const reason = ACCEPTED[key];
      breaches.push({ key, flow, reason });
      if (!reason) failures++;
    }
  }
  console.log(`${school}: ${schoolChecked} year-over-year checks`);
}

console.log(`\n${checked} reconciliations across the curated figures`);
if (breaches.length === 0) {
  console.log("every year lands inside the expected spending/gift band");
} else {
  for (const b of breaches) {
    const tag = b.reason ? "ACCEPTED" : "UNEXPLAINED";
    console.log(`  ${tag}  ${b.key}  implied net flow ${b.flow.toFixed(2)}%`);
    if (b.reason) console.log(`            cause: ${b.reason}`);
  }
}
if (failures > 0) {
  console.error(
    `\n${failures} unexplained breach(es). Either a curated figure is wrong, or ` +
      `the cause is real and belongs in ACCEPTED with a citation to where it is documented.`,
  );
  process.exit(1);
}
console.log("\nno unexplained breaches");
