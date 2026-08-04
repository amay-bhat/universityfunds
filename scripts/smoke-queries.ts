/**
 * Task 2.2 check: the data access layer returns real seeded data.
 * Run: npx tsx scripts/smoke-queries.ts
 *
 * Exercises every query function against the live database, including the
 * shape-critical edge cases: Stanford's empty allocations (OI-1) and Yale's
 * allocation coverage ending at FY2020.
 */
import { config } from "dotenv";
import path from "node:path";

config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const q = await import("../src/lib/queries");

  const schools = await q.getSchools();
  console.log(
    "schools:",
    schools.map((s) => s.id).join(", "),
  );
  if (schools.length !== 5) throw new Error(`expected 5 schools, got ${schools.length}`);

  const yaleAlloc = await q.getAllocations("yale");
  const yaleYears = [...new Set(yaleAlloc.map((a) => a.fiscalYear))];
  console.log(
    `yale allocations: ${yaleAlloc.length} rows, FY${Math.min(...yaleYears)}–FY${Math.max(...yaleYears)}`,
  );
  if (Math.max(...yaleYears) !== 2020) throw new Error("yale allocation coverage should end FY2020");
  const fy2010 = yaleAlloc.filter((a) => a.fiscalYear === 2010);
  const sum = fy2010.reduce((s, a) => s + a.pct, 0);
  console.log(`yale FY2010 sums to ${sum.toFixed(2)} across ${fy2010.length} categories`);
  if (Math.abs(sum - 100) > 1) throw new Error("yale FY2010 does not sum to ~100");

  const stanfordAlloc = await q.getAllocations("stanford");
  console.log(`stanford allocations: ${stanfordAlloc.length} rows (expected 0 — OI-1 gap)`);
  if (stanfordAlloc.length !== 0) throw new Error("stanford should have no allocation rows");

  const stanfordReturns = await q.getEndowmentReturns("stanford");
  const stanfordMv = stanfordReturns.filter((r) => r.marketValueUsdMillions !== null);
  const stanfordRet = stanfordReturns.filter((r) => r.returnPct !== null);
  console.log(
    `stanford returns rows: ${stanfordReturns.length}, with market value: ${stanfordMv.length}, with returnPct: ${stanfordRet.length} (expected 0)`,
  );
  if (stanfordRet.length !== 0) throw new Error("stanford should have no returnPct values");

  const sp500 = await q.getBenchmarkReturns(["sp500"]);
  console.log(`sp500: ${sp500.length} rows (expected 26)`);
  if (sp500.length !== 26) throw new Error("sp500 should have 26 rows");

  const globalEq = await q.getBenchmarkReturns(["global_equity"]);
  console.log(
    `global_equity: ${globalEq.length} rows, FY${globalEq[0]?.fiscalYear}–FY${globalEq[globalEq.length - 1]?.fiscalYear} (expected 17, FY2009–FY2025)`,
  );
  if (globalEq.length !== 17) throw new Error("global_equity should have 17 rows");

  const proxies = await q.getProxyMappings();
  console.log(
    "proxy mappings:",
    proxies.map((p) => `${p.category}→${p.etfTicker}`).join(", "),
  );
  if (proxies.length !== 7) throw new Error("expected 7 proxy mappings");

  const sources = await q.getSources();
  console.log(`sources: ${sources.length}`);
  if (sources.length < 96) throw new Error("expected at least 96 sources");

  // Task 6.1 check: the methodology page renders every row of `sources`
  // directly, so page completeness follows from citation completeness here —
  // every source_id cited by any fact row resolves, and no source is dead
  // weight (uncited).
  const cited = new Set<string>();
  for (const s of schools) {
    for (const a of await q.getAllocations(s.id)) cited.add(a.sourceId);
    for (const r of await q.getEndowmentReturns(s.id)) {
      if (r.returnSourceId) cited.add(r.returnSourceId);
      if (r.marketValueSourceId) cited.add(r.marketValueSourceId);
    }
  }
  for (const b of await q.getBenchmarkReturns()) cited.add(b.sourceId);
  for (const p of proxies) if (p.sourceId) cited.add(p.sourceId);
  const known = new Set(sources.map((s) => s.id));
  const unresolved = [...cited].filter((id) => !known.has(id));
  const dead = [...known].filter((id) => !cited.has(id));
  console.log(`cited source ids: ${cited.size}; unresolved: ${unresolved.length}; uncited: ${dead.length}`);
  if (unresolved.length) throw new Error(`cited ids missing from sources: ${unresolved.join(", ")}`);
  if (dead.length) throw new Error(`uncited sources (dead weight on methodology page): ${dead.join(", ")}`);

  console.log("\nAll data-access smoke checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
