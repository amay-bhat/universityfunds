/**
 * npm run seed:verify — proves the seed validator actually rejects bad data.
 *
 * Why this exists: `src/lib/db/schema.ts` deliberately does not enforce the
 * closed vocabularies, the unit conventions or the sum-to-100 rule, so
 * `scripts/lib/seed-validate.ts` is the ONLY thing preventing a mistyped or
 * mis-scaled figure from reaching a published chart. Task 1.2's acceptance check
 * ("validation actually rejects a bad row") was originally demonstrated with
 * fixtures outside the repo, which means the evidence didn't survive the
 * session. This does the same job reproducibly, and doubles as the regression
 * test for that file.
 *
 * How it works: copies the real `data/` to a temp directory, applies one
 * deliberate defect, and asserts the validator reports it. Nothing touches the
 * database or the real seed files.
 */

import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync, unlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { loadSeedData, latestClosedFiscalYear } from "./lib/seed-validate";

const REAL_DATA_DIR = path.join(process.cwd(), "data");

type Json = Record<string, unknown>;

type Case = {
  name: string;
  /** Mutate the copied data directory in place. */
  break: (dir: string) => void;
  /** Substring that must appear in an error message. */
  expectError?: string;
  /** Substring that must appear in a warning message. */
  expectWarning?: string;
  /** Substring that must NOT appear anywhere. */
  expectNoError?: string;
};

function readJson(file: string): Json {
  return JSON.parse(readFileSync(file, "utf8")) as Json;
}

function readJsonArray(file: string): Json[] {
  return JSON.parse(readFileSync(file, "utf8")) as Json[];
}

function writeJson(file: string, value: unknown) {
  writeFileSync(file, JSON.stringify(value, null, 2));
}

function editYale(dir: string, mutate: (yale: Json) => void) {
  const file = path.join(dir, "schools", "yale.json");
  const yale = readJson(file);
  mutate(yale);
  writeJson(file, yale);
}

function editSources(dir: string, mutate: (sources: Json[]) => void) {
  const file = path.join(dir, "sources.json");
  const sources = readJsonArray(file);
  mutate(sources);
  writeJson(file, sources);
}

const allocationsOf = (yale: Json) => yale.allocations as Json[];
const returnsOf = (yale: Json) => yale.endowmentReturns as Json[];

const CASES: Case[] = [
  {
    name: "happy path — the real seed files validate clean",
    break: () => {},
    expectNoError: "",
  },
  {
    name: "category typo (private_equity for private_equity_vc)",
    break: (dir) => editYale(dir, (y) => void (allocationsOf(y)[0].category = "private_equity")),
    expectError: "`category` must be one of",
  },
  {
    // The coarse category exists for schools that publish public equity as one
    // line. Using it *alongside* the split ones counts equity twice, and the
    // sum-to-100 check can't catch that on its own.
    name: "coarse public_equity mixed with the split equity categories in one year",
    break: (dir) =>
      editYale(dir, (y) => {
        const rows = allocationsOf(y);
        const us = rows.find((r) => r.category === "us_public_equity")!;
        rows.push({ ...us, category: "public_equity" });
      }),
    expectError: "never both",
  },
  {
    name: "target and actual allocation rows mixed inside one school-year",
    break: (dir) =>
      editYale(dir, (y) => void (allocationsOf(y)[0].basis = "target")),
    expectError: "must share one basis",
  },
  {
    name: "unknown allocation basis",
    break: (dir) =>
      editYale(dir, (y) => void (allocationsOf(y)[0].basis = "policy")),
    expectError: "`basis` must be one of",
  },
  {
    name: "snake_case field name silently NULLing a curated number",
    break: (dir) =>
      editYale(dir, (y) => {
        const row = returnsOf(y)[0];
        row.return_pct = row.returnPct;
        delete row.returnPct;
      }),
    expectError: "unknown field `return_pct` — did you mean `returnPct`?",
  },
  {
    name: "sourceLabel misspelled (destroys the normalization audit trail)",
    break: (dir) =>
      editYale(dir, (y) => {
        const row = allocationsOf(y)[0];
        row.sourceLable = row.sourceLabel;
        delete row.sourceLabel;
      }),
    expectError: "unknown field `sourceLable` — did you mean `sourceLabel`?",
  },
  {
    name: "market value in billions instead of millions (40.7 for $40.7B)",
    break: (dir) =>
      editYale(dir, (y) => void (returnsOf(y)[0].marketValueUsdMillions = 40.7)),
    expectError: "this field is in MILLIONS of USD",
  },
  {
    name: "market value in dollars instead of millions (overflows numeric(12,2))",
    break: (dir) =>
      editYale(dir, (y) => void (returnsOf(y)[0].marketValueUsdMillions = 40_700_000_000)),
    expectError: "outside the plausible range",
  },
  {
    name: "returns entered as fractions (0.196 for 19.6%)",
    break: (dir) =>
      editYale(dir, (y) => {
        for (const row of returnsOf(y)) {
          // Rounded because a curator types 0.196, they don't compute 19.6/100 —
          // and the raw division would trip the decimal-scale check instead.
          if (typeof row.returnPct === "number") {
            row.returnPct = Number((row.returnPct / 100).toFixed(3));
          }
        }
      }),
    expectWarning: "looks like fractions",
  },
  {
    name: "citation that resolves to nothing",
    break: (dir) => editYale(dir, (y) => void (allocationsOf(y)[0].sourceId = "no-such-source")),
    expectError: "is not in sources.json",
  },
  {
    name: "source with neither url nor page (a citation nobody can locate)",
    break: (dir) =>
      editSources(dir, (sources) => {
        delete sources[0].url;
        delete sources[0].page;
      }),
    expectError: "a citation nobody can locate is not a citation",
  },
  {
    name: "endowment return row with a citation and no number",
    break: (dir) =>
      editYale(dir, (y) => {
        const row = returnsOf(y)[0];
        delete row.returnPct;
        delete row.marketValueUsdMillions;
      }),
    expectError: "a citation with no number",
  },
  {
    name: "duplicate (fiscalYear, category) row",
    break: (dir) =>
      editYale(dir, (y) => {
        const rows = allocationsOf(y);
        rows.push({ ...rows[0] });
      }),
    expectError: "duplicate row for FY",
  },
  {
    name: "allocations that no longer sum to 100",
    break: (dir) => editYale(dir, (y) => void allocationsOf(y).splice(0, 1)),
    expectError: "allocations sum to",
  },
  {
    name: "sum diagnostic flags itself as incomplete when a row was rejected",
    break: (dir) => editYale(dir, (y) => void (allocationsOf(y)[0].category = "bogus_category")),
    expectError: "at least one row in this year was rejected above",
  },
  {
    name: "school file that no school points at is never silently ignored",
    break: (dir) =>
      writeJson(path.join(dir, "schools", "columbia.json"), {
        allocations: [],
        endowmentReturns: [],
      }),
    expectError: "there is no school with id `columbia`",
  },
  {
    name: "school file renamed with a trailing space",
    break: (dir) => {
      const from = path.join(dir, "schools", "princeton.json");
      cpSync(from, path.join(dir, "schools", "princeton .json"));
      unlinkSync(from);
    },
    expectError: "there is no school with id `princeton `",
  },
  {
    name: "negative allocation weight without the school's own wording",
    break: (dir) =>
      editYale(dir, (y) => {
        const row = allocationsOf(y)[0];
        row.pct = -3.9;
        delete row.sourceLabel;
      }),
    expectError: "so `sourceLabel` is required",
  },
  {
    name: "negative allocation weight WITH sourceLabel is allowed, but warns",
    break: (dir) =>
      editYale(dir, (y) => {
        const rows = allocationsOf(y);
        const target = rows[0];
        // Move weight out of one line into another so the year still sums to
        // 100 — the point is to isolate the negative, not to break the sum.
        const donor = rows.find((r) => r.fiscalYear === target.fiscalYear && r !== target);
        const moved = (target.pct as number) - -3.9;
        target.pct = -3.9;
        target.sourceLabel = "Cash (levered)";
        if (donor) donor.pct = Number(((donor.pct as number) + moved).toFixed(3));
      }),
    expectWarning: "stored as published levered exposure",
  },
  {
    name: "allocation weight above the ceiling",
    break: (dir) => editYale(dir, (y) => void (allocationsOf(y)[0].pct = 140)),
    expectError: "`pct` must be between -25 and 100",
  },
  {
    name: "more decimal places than the column can store",
    break: (dir) => editYale(dir, (y) => void (allocationsOf(y)[0].pct = 10.123456)),
    expectError: "decimal places but the column stores",
  },
  {
    name: "accessedDate that is not an ISO date",
    break: (dir) => editSources(dir, (s) => void (s[0].accessedDate = "next tuesday")),
    expectError: "must be an ISO date",
  },
  {
    name: "url that is not a URL",
    break: (dir) => editSources(dir, (s) => void (s[0].url = "not-a-url")),
    expectError: "must be an http(s) URL",
  },
  {
    name: "fiscal year that cannot have closed yet",
    break: (dir) =>
      editYale(dir, (y) => void (returnsOf(y)[0].fiscalYear = latestClosedFiscalYear() + 1)),
    expectError: "has not closed yet",
  },
  {
    name: "malformed JSON",
    break: (dir) => writeFileSync(path.join(dir, "sources.json"), "[{,}]"),
    expectError: "invalid JSON",
  },
  {
    name: "error indices survive a malformed entry earlier in the file",
    break: (dir) =>
      editSources(dir, (s) => {
        s.unshift("not an object" as unknown as Json);
        s[2].documentType = "WRONG";
      }),
    // The bad documentType is at index 2 after the unshift; a naive
    // implementation re-indexes the filtered array and reports it as [1].
    expectError: "sources.json[2]: `documentType` must be one of",
  },
  {
    name: "a return figure without its own citation",
    break: (dir) => editYale(dir, (y) => void delete returnsOf(y)[0].returnSourceId),
    expectError: "`returnPct` is present but `returnSourceId` is missing",
  },
  {
    name: "a market-value citation whose figure was removed",
    break: (dir) => editYale(dir, (y) => void delete returnsOf(y)[0].marketValueUsdMillions),
    expectError: "`marketValueSourceId` is present but `marketValueUsdMillions` is missing",
  },
  {
    name: "pre-split `sourceId` key on a return row is rejected, not silently ignored",
    break: (dir) =>
      editYale(dir, (y) => {
        const row = returnsOf(y)[0];
        row.sourceId = row.returnSourceId;
        delete row.returnSourceId;
        delete row.marketValueSourceId;
        delete row.marketValueUsdMillions;
      }),
    expectError: "unknown field `sourceId`",
  },
];

function run(): number {
  const root = mkdtempSync(path.join(tmpdir(), "seed-verify-"));
  let failures = 0;

  try {
    for (const [i, testCase] of CASES.entries()) {
      const dir = path.join(root, `case-${i}`);
      cpSync(REAL_DATA_DIR, dir, { recursive: true });
      testCase.break(dir);

      const { report } = loadSeedData(dir);
      const errors = report.errors.map((e) => `${e.where}: ${e.message}`);
      const warnings = report.warnings.map((w) => `${w.where}: ${w.message}`);

      const problems: string[] = [];
      if (testCase.expectError !== undefined) {
        if (!errors.some((line) => line.includes(testCase.expectError!))) {
          problems.push(
            `expected an error containing ${JSON.stringify(testCase.expectError)}; got ${
              errors.length === 0 ? "no errors at all" : `:\n      ${errors.join("\n      ")}`
            }`,
          );
        }
      }
      if (testCase.expectWarning !== undefined) {
        if (!warnings.some((line) => line.includes(testCase.expectWarning!))) {
          problems.push(
            `expected a warning containing ${JSON.stringify(testCase.expectWarning)}; got ${
              warnings.length === 0 ? "no warnings at all" : `:\n      ${warnings.join("\n      ")}`
            }`,
          );
        }
        if (errors.length > 0) {
          problems.push(`expected no errors, got:\n      ${errors.join("\n      ")}`);
        }
      }
      if (testCase.expectNoError !== undefined && errors.length > 0) {
        problems.push(`expected zero errors, got:\n      ${errors.join("\n      ")}`);
      }

      if (problems.length === 0) {
        console.log(`  ok    ${testCase.name}`);
      } else {
        failures++;
        console.log(`  FAIL  ${testCase.name}`);
        for (const problem of problems) console.log(`        ${problem}`);
      }
    }
  } finally {
    rmSync(root, { recursive: true, force: true });
  }

  console.log(
    `\n${CASES.length - failures}/${CASES.length} validator checks passed${failures > 0 ? ` — ${failures} FAILED` : ""}.`,
  );
  return failures;
}

process.exitCode = run() > 0 ? 1 : 0;
