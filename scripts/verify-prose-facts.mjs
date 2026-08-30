#!/usr/bin/env node
/**
 * verify:prose — the guard for RUNBOOK §2 step 6, "update the prose that quotes
 * coverage", which the runbook itself flags as the step that gets forgotten.
 *
 * Why this exists. Every other refresh step has a gate behind it: `seed:dry`
 * checks shape and citations, `verify:figures` reconciles market values against
 * returns, `verify:alloc-annotations` checks the chart chrome. Step 6 had
 * nothing. So a data refresh can land a new fiscal year, pass every gate, and
 * ship prose that still says Yale's mix ends at FY2020 and the returns run to
 * FY2025 — every number in `data/` correct, and the sentence beside the chart
 * false. Article 4 is broken by wording as easily as by a figure.
 *
 * Three checks, in increasing specificity:
 *
 *   A. COVERAGE SNAPSHOT. `conduct/coverage-snapshot.json` records what each
 *      school disclosed, as of the last time someone looked. If the seed files
 *      now say something different, this fails and prints exactly what moved
 *      and which prose to re-read. This is the disclosure-flip detector: it
 *      fires on the refresh that adds FY2026, and on the rarer, nastier case of
 *      a school RESUMING disclosure after a gap, which silently changes which
 *      on-chart annotations apply.
 *
 *   B. FACT RECONCILIATION. `blurbs.ts` opens by claiming "every number here is
 *      computable from the seeded database". Nothing checked that. Now every
 *      numeric literal in every blurb must be reproducible from `data/`, or
 *      this fails naming the literal. Hedged numbers ("about 73%") get a wider
 *      tolerance than bare ones, because that is what the hedge means.
 *
 *   C. COVERAGE SENTENCES. The specific sentences that go false when coverage
 *      moves — "the last year it disclosed a mix", "the returns run to FY2025",
 *      "just seven scattered allocation years". Each is pinned to a derived
 *      value rather than a hard-coded one.
 *
 * This reads `data/` only. It never touches the database, and it writes nothing
 * unless `--update-snapshot` is passed deliberately.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DATA = join(ROOT, "data");
const SNAPSHOT_PATH = join(ROOT, "conduct", "coverage-snapshot.json");
const UPDATE = process.argv.includes("--update-snapshot");

const SCHOOL_IDS = ["yale", "harvard", "stanford", "mit", "princeton"];

// Categories that are not ordinary stocks and bonds. Used only to reproduce the
// aggregate the blurbs quote ("about 73% in the alternative categories"); the
// site never stores this as a figure.
const ALTERNATIVE_CATEGORIES = ["absolute_return", "private_equity_vc", "real_assets"];

let failures = 0;
let checks = 0;
const fail = (msg) => { failures++; console.log(`  \x1b[31mFAIL\x1b[0m  ${msg}`); };
const ok = (msg) => { checks++; console.log(`  \x1b[32mOK\x1b[0m    ${msg}`); };
const info = (msg) => console.log(`  ----  ${msg}`);
const head = (msg) => console.log(`\n\x1b[1m${msg}\x1b[0m`);

// ---------------------------------------------------------------- derive facts

function loadSchool(id) {
  return JSON.parse(readFileSync(join(DATA, "schools", `${id}.json`), "utf8"));
}

function annualized(returns) {
  if (returns.length === 0) return null;
  const growth = returns.reduce((acc, r) => acc * (1 + r.returnPct / 100), 1);
  return (Math.pow(growth, 1 / returns.length) - 1) * 100;
}

function coverageOf(id) {
  const d = loadSchool(id);
  const allocYears = [...new Set(d.allocations.map((a) => a.fiscalYear))].sort((a, b) => a - b);
  const returns = d.endowmentReturns
    .filter((r) => r.returnPct != null)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
  const mv = d.endowmentReturns
    .filter((r) => r.marketValueUsdMillions != null)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);

  // Bases actually used, so a school switching from target to actual disclosure
  // (or back) trips the snapshot even when the year range is unchanged.
  const bases = {};
  for (const a of d.allocations) {
    const b = a.basis ?? "actual";
    (bases[b] ??= []).push(a.fiscalYear);
  }
  const basisYears = Object.fromEntries(
    Object.entries(bases).map(([b, ys]) => [b, [...new Set(ys)].sort((x, y) => x - y)]),
  );

  const span = allocYears.length
    ? Array.from({ length: allocYears.at(-1) - allocYears[0] + 1 }, (_, i) => allocYears[0] + i)
    : [];

  return {
    allocationYears: allocYears,
    allocationGaps: span.filter((y) => !allocYears.includes(y)),
    allocationBasisYears: basisYears,
    returnYears: returns.map((r) => r.fiscalYear),
    marketValueYears: mv.map((r) => r.fiscalYear),
  };
}

function factsOf(id, sp500ByYear) {
  const d = loadSchool(id);
  const returns = d.endowmentReturns
    .filter((r) => r.returnPct != null)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
  const mv = d.endowmentReturns
    .filter((r) => r.marketValueUsdMillions != null)
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
  const allocYears = [...new Set(d.allocations.map((a) => a.fiscalYear))].sort((a, b) => a - b);

  const numbers = new Set();
  const add = (v) => { if (v != null && Number.isFinite(v)) numbers.add(Number(v.toFixed(1))); };

  for (const r of returns) add(r.returnPct);
  for (const r of mv) add(r.marketValueUsdMillions / 1000); // $ billions
  for (const a of d.allocations) add(a.pct);

  // Aggregates the prose legitimately quotes.
  for (const fy of allocYears) {
    const rows = d.allocations.filter((a) => a.fiscalYear === fy);
    const alt = rows
      .filter((a) => ALTERNATIVE_CATEGORIES.includes(a.category))
      .reduce((s, a) => s + a.pct, 0);
    add(alt);
    // pairwise sums, so "private equity and venture capital alone were 39.9%"
    // and similar two-line quotations reconcile without hand-listing them.
    for (let i = 0; i < rows.length; i++) {
      for (let j = i + 1; j < rows.length; j++) add(rows[i].pct + rows[j].pct);
    }
  }

  add(annualized(returns));
  // The S&P comparison each blurb draws, over that school's own return window.
  const window = returns.map((r) => r.fiscalYear);
  const sp = window.map((fy) => sp500ByYear.get(fy)).filter((v) => v != null);
  if (sp.length === window.length && sp.length > 0) {
    add(annualized(sp.map((v) => ({ returnPct: v }))));
  }

  const counts = new Set([returns.length, allocYears.length, mv.length]);
  const fiscalYears = new Set([
    ...returns.map((r) => r.fiscalYear),
    ...mv.map((r) => r.fiscalYear),
    ...allocYears,
  ]);

  return { numbers, counts, fiscalYears, allocYears, returns, mv };
}

// The project's overall fiscal-year window, derived rather than hard-coded, so
// a refresh widens it automatically.
function globalFiscalWindow() {
  let min = Infinity, max = -Infinity;
  for (const file of readdirSync(join(DATA, "schools")).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(DATA, "schools", file), "utf8"));
    for (const r of [...(d.endowmentReturns ?? []), ...(d.allocations ?? [])]) {
      if (r.fiscalYear < min) min = r.fiscalYear;
      if (r.fiscalYear > max) max = r.fiscalYear;
    }
  }
  return { min, max };
}
const GLOBAL_FY = globalFiscalWindow();

function sp500Map() {
  const rows = JSON.parse(readFileSync(join(DATA, "benchmark_returns.json"), "utf8"));
  return new Map(rows.filter((r) => r.series === "sp500").map((r) => [r.fiscalYear, r.returnPct]));
}

// ------------------------------------------------------- A. coverage snapshot

function checkSnapshot() {
  head("A. COVERAGE SNAPSHOT — what each school discloses, versus what the prose was written against");

  const derived = Object.fromEntries(SCHOOL_IDS.map((id) => [id, coverageOf(id)]));

  if (UPDATE) {
    writeFileSync(
      SNAPSHOT_PATH,
      JSON.stringify(
        {
          _comment:
            "Derived from data/schools/*.json by scripts/verify-prose-facts.mjs. NOT a source of " +
            "truth — the seed files are. This records what coverage looked like when the prose was " +
            "last checked against it, so a refresh that changes coverage fails the guard loudly " +
            "instead of silently leaving the copy wrong. Regenerate with `npm run verify:prose -- " +
            "--update-snapshot` ONLY after re-reading the prose the failure names.",
          updated: new Date().toISOString().slice(0, 10),
          schools: derived,
        },
        null,
        2,
      ) + "\n",
    );
    info(`snapshot written to ${SNAPSHOT_PATH.replace(ROOT + "/", "")}`);
    return;
  }

  let snapshot;
  try {
    snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, "utf8"));
  } catch {
    fail(
      `no coverage snapshot at conduct/coverage-snapshot.json — create it with ` +
        `\`npm run verify:prose -- --update-snapshot\` after checking the prose is currently true`,
    );
    return;
  }

  // What to re-read when a given school's coverage moves. Named per school so a
  // failure is a work order, not a puzzle.
  const PROSE_HOMES = [
    "src/lib/blurbs.ts (the school's own story paragraphs)",
    "src/app/methodology/page.tsx (the coverage story per school)",
    "src/lib/chart-data.ts + src/components/charts/AllocationChart.tsx (on-chart coverage and basis annotations)",
    "PRD.md definition of done, and TASKS.md if a ruling depended on the old coverage",
  ];

  for (const id of SCHOOL_IDS) {
    const was = snapshot.schools?.[id];
    const now = derived[id];
    if (!was) { fail(`${id}: absent from the snapshot — regenerate it`); continue; }

    const diffs = [];
    for (const key of ["allocationYears", "allocationGaps", "returnYears", "marketValueYears"]) {
      const a = JSON.stringify(was[key] ?? []);
      const b = JSON.stringify(now[key] ?? []);
      if (a !== b) {
        const wasArr = was[key] ?? [], nowArr = now[key] ?? [];
        const added = nowArr.filter((y) => !wasArr.includes(y));
        const removed = wasArr.filter((y) => !nowArr.includes(y));
        diffs.push(
          `${key}: ${added.length ? `+${added.join(",")} ` : ""}${removed.length ? `-${removed.join(",")}` : ""}`.trim(),
        );
      }
    }
    const wasB = JSON.stringify(was.allocationBasisYears ?? {});
    const nowB = JSON.stringify(now.allocationBasisYears ?? {});
    if (wasB !== nowB) diffs.push("allocationBasisYears changed (a target/actual or pool basis moved)");

    if (diffs.length === 0) {
      ok(`${id}: coverage unchanged (${now.allocationYears.length} allocation years, ${now.returnYears.length} return years)`);
    } else {
      fail(`${id}: COVERAGE MOVED — ${diffs.join(" · ")}`);
      console.log(`        Re-read and update, then re-run with --update-snapshot:`);
      for (const h of PROSE_HOMES) console.log(`          - ${h}`);
    }
  }
}

// --------------------------------------------------- B. numeric reconciliation

const HEDGES = /(about|roughly|approximately|around|nearly|almost|some|over|under|more than|less than)\s*$/i;

function extractNumbers(text) {
  const out = [];
  const push = (raw, value, kind, index) => {
    const before = text.slice(Math.max(0, index - 24), index);
    const n = { raw, value, kind, hedged: HEDGES.test(before) };
    out.push(n);
    return n;
  };
  for (const m of text.matchAll(/\$(\d+(?:\.\d+)?)\s*billion/g)) push(m[0], Number(m[1]), "usd_billions", m.index);
  // Unicode minus and hyphen-minus both appear in this copy. The sign is kept,
  // because it decides how strictly the literal is matched below: a signed
  // literal must match a signed fact, so a flipped sign in prose is caught,
  // while an unsigned one may match a magnitude, because "the portfolio lost
  // 24.6%" carries its sign in the verb rather than the digits.
  for (const m of text.matchAll(/([−+-]?)(\d+(?:\.\d+)?)\s*%/g)) {
    const signed = m[1] === "−" || m[1] === "-";
    const n = push(m[0], Number(m[2]), "percent", m.index);
    n.signed = signed;
    if (signed) n.value = -n.value;
  }
  for (const m of text.matchAll(/\bFY(\d{4})\b/g)) push(m[0], Number(m[1]), "fiscal_year", m.index);
  for (const m of text.matchAll(/\b(\d+)\s+years\b/g)) push(m[0], Number(m[1]), "count", m.index);
  return out;
}

function checkBlurbFacts() {
  head("B. FACT RECONCILIATION — every number in blurbs.ts must be reproducible from data/");

  const src = readFileSync(join(ROOT, "src", "lib", "blurbs.ts"), "utf8");
  const sp = sp500Map();

  for (const id of SCHOOL_IDS) {
    // Pull this school's blurb array plus its hook line out of the module source.
    const blurb = src.match(new RegExp(`\\n  ${id}: \\[([\\s\\S]*?)\\n  \\],`));
    const hook = src.match(new RegExp(`\\n  ${id}: "([^"]*)"`));
    if (!blurb) { fail(`${id}: could not locate its blurb in src/lib/blurbs.ts — has the file been restructured?`); continue; }
    const text = blurb[1] + (hook ? " " + hook[1] : "");

    const f = factsOf(id, sp);
    const unmatched = [];
    for (const n of extractNumbers(text)) {
      const tol = n.hedged ? 1.0 : 0.05;
      let matched;
      if (n.kind === "fiscal_year") {
        // A blurb legitimately names a year that is ABSENT — that is how it
        // says a year was never published ("Princeton never reported FY2000").
        // So the real check is that the year is inside the project's window; a
        // typo like FY1999 or FY2030 still fails.
        matched = n.value >= GLOBAL_FY.min && n.value <= GLOBAL_FY.max;
      } else if (n.kind === "count") {
        matched = f.counts.has(n.value);
      } else if (n.kind === "percent" && !n.signed) {
        matched = [...f.numbers].some(
          (v) => Math.abs(v - n.value) <= tol || Math.abs(Math.abs(v) - n.value) <= tol,
        );
      } else {
        matched = [...f.numbers].some((v) => Math.abs(v - n.value) <= tol);
      }
      if (!matched) unmatched.push(`${n.raw}${n.hedged ? " (hedged)" : ""}`);
    }

    if (unmatched.length === 0) {
      ok(`${id}: every numeric literal reproduces from the seed files`);
    } else {
      fail(`${id}: ${unmatched.length} literal(s) not reproducible from data/ — ${unmatched.join(", ")}`);
      console.log(`        Either the figure is stale, or it is derived in a way this guard does not model.`);
      console.log(`        Check it against data/schools/${id}.json before changing anything.`);
    }
  }
}

// ------------------------------------------------------- C. coverage sentences

function checkCoverageSentences() {
  head("C. COVERAGE SENTENCES — the wording that goes false when coverage moves");

  const src = readFileSync(join(ROOT, "src", "lib", "blurbs.ts"), "utf8");
  const cov = Object.fromEntries(SCHOOL_IDS.map((id) => [id, coverageOf(id)]));

  const rules = [
    {
      what: "Yale names its last disclosed mix year",
      expect: () => `by FY${cov.yale.allocationYears.at(-1)}, the last year it disclosed a mix`,
    },
    {
      what: "Yale's mix-ends / returns-run-to sentence carries both real boundaries",
      expect: () =>
        `ends at FY${cov.yale.allocationYears.at(-1)} while the returns run to FY${cov.yale.returnYears.at(-1)}`,
    },
    {
      what: "Harvard names its target/actual changeover",
      expect: () => `Before FY${Math.min(...cov.harvard.allocationBasisYears.actual)} Harvard published only its target mix`,
    },
    {
      // Deliberately the gaps inside the ACTUAL-basis era, not every gap in the
      // span. Harvard's earlier holes are a different animal: HMC published its
      // policy portfolio as occasional spot-year "evolution" tables and never as
      // an annual series, so those years were never promised. FY2018 and FY2022
      // are the two where an annual table was expected and simply not printed —
      // which is what the copy claims, and all it claims.
      what: "Harvard names the allocation years genuinely skipped in its actual-basis era",
      expect: () => {
        const years = cov.harvard.allocationBasisYears.actual ?? [];
        const gaps = [];
        for (let y = Math.min(...years); y <= Math.max(...years); y++) {
          if (!years.includes(y)) gaps.push(`FY${y}`);
        }
        return `(${gaps.join(" and ")}) were never published`;
      },
    },
    {
      what: "MIT's count of disclosed allocation years",
      expect: () => `just ${numberWord(cov.mit.allocationYears.length)} scattered allocation years`,
    },
    {
      what: "Princeton names its most recent disclosed mix year",
      expect: () => `most recent disclosed mix (FY${cov.princeton.allocationYears.at(-1)})`,
    },
    {
      what: "Princeton's two missing return years",
      expect: () => {
        const missing = [];
        for (let y = 2000; y <= Math.max(...cov.princeton.returnYears); y++) {
          if (!cov.princeton.returnYears.includes(y)) missing.push(`FY${y}`);
        }
        return `never reported ${missing.join(" or ")}`;
      },
    },
  ];

  for (const r of rules) {
    let expected;
    try { expected = r.expect(); } catch (e) { fail(`${r.what}: could not derive the expected wording (${e.message})`); continue; }
    if (src.includes(expected)) ok(`${r.what} — "${expected}"`);
    else fail(`${r.what}: expected the copy to contain "${expected}" and it does not`);
  }
}

function numberWord(n) {
  return ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve"][n] ?? String(n);
}

// --------------------------------------------------------------------- run it

console.log("\x1b[1mverify:prose — coverage and fact drift in user-facing copy\x1b[0m");
checkSnapshot();
if (!UPDATE) {
  checkBlurbFacts();
  checkCoverageSentences();
  head("RESULT");
  if (failures === 0) console.log(`  \x1b[32m${checks} checks passed, 0 failed\x1b[0m\n`);
  else console.log(`  \x1b[31m${checks} passed, ${failures} failed\x1b[0m\n`);
  process.exit(failures === 0 ? 0 : 1);
}
