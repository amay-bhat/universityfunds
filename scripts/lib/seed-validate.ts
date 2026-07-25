/**
 * Validation for the hand-curated seed files in `data/`.
 *
 * Split out of `scripts/seed.ts` so it can be exercised without a database and
 * without the write path — `npm run seed:verify` drives this module against
 * deliberately-broken copies of `data/` and asserts each rule actually fires.
 * That matters more here than in most codebases: the schema deliberately does
 * not enforce the closed vocabularies or the arithmetic rules, so this file is
 * the only thing standing between a mistyped figure and a published chart.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";

import {
  ALLOCATION_BASES,
  ALLOCATION_CATEGORIES,
  BENCHMARK_SERIES,
  CATEGORY_TO_BENCHMARK_SERIES,
  DEFAULT_ALLOCATION_BASIS,
  SCHOOL_IDS,
  SOURCE_DOCUMENT_TYPES,
  type AllocationBasis,
  type AllocationCategory,
  type BenchmarkSeries,
  type SourceDocumentType,
} from "../../src/lib/constants";

// A school-year describes one portfolio, so it may be broken down either at the
// split-equity granularity or at the coarse `public_equity` one — mixing them
// double-counts the equity sleeve and makes the sum-to-100 check meaningless.
const SPLIT_EQUITY_CATEGORIES = ["us_public_equity", "intl_public_equity"] as const;
const COARSE_EQUITY_CATEGORY = "public_equity";

// Published allocation tables are rounded, so a school-year rarely sums to
// exactly 100. Anything further out than this is a curation error, not rounding.
export const ALLOCATION_SUM_TOLERANCE_PCT = 1.0;

export const MIN_FISCAL_YEAR = 1970;

/**
 * The most recent fiscal year that can possibly have closed. Endowment fiscal
 * years end June 30, so before July the current calendar year's FY is still
 * running and nobody can have reported it.
 */
export function latestClosedFiscalYear(now: Date = new Date()): number {
  return now.getUTCMonth() >= 6 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
}

/**
 * Allocation weights are whole percentage points, and the range is deliberately
 * ASYMMETRIC.
 *
 * Schools report economic exposure *including leverage*, so once a normalized
 * category nets negative it has to be storable: Yale publishes Cash at -3.9% in
 * FY2008. Merging across risk classes to force it non-negative would misstate
 * both categories, and dropping the year would manufacture a gap in a year the
 * school did disclose — Article 4 forbids both. -25 is roughly 5x the worst
 * plausible real figure, so no future session relitigates this over a real
 * number, while an absurdity still fails.
 *
 * The ceiling stays at 100 because leverage does not push a single category
 * above it — no school in scope exceeds ~45% in any category in any year — so
 * raising it would only stop the validator catching a transcription error. If a
 * school ever legitimately publishes above 100, widen this constant and say why
 * in the build log, the same pattern ALLOCATION_SUM_TOLERANCE_PCT documents.
 *
 * Decided by the `[PROXY DECISION]` logged under task 1.2 in TASKS.md.
 */
export const MIN_ALLOCATION_PCT = -25;
export const MAX_ALLOCATION_PCT = 100;

// Losing more than everything is impossible; the upper bound catches a
// decimal-point slip (e.g. 400 where 40.0 was meant).
export const MIN_RETURN_PCT_EXCLUSIVE = -100;
export const MAX_RETURN_PCT = 200;

/**
 * Market values are in millions of USD. The band exists to catch a unit slip,
 * which is otherwise invisible: the five v1 schools run roughly $10B-$60B, i.e.
 * 10,000-60,000 in millions, so `40.7` (billions) or `40700000` (thousands)
 * are wrong by three orders of magnitude while looking perfectly plausible.
 */
export const MIN_MARKET_VALUE_USD_MILLIONS = 100;
export const MAX_MARKET_VALUE_USD_MILLIONS = 1_000_000;

// Decimal places each numeric column can actually store (src/lib/db/schema.ts).
// Postgres silently rounds past these rather than erroring, which would leave
// `data/` and the database quietly disagreeing.
const PCT_SCALE = 3;
const RETURN_PCT_SCALE = 3;
const MARKET_VALUE_SCALE = 2;

// A multi-year return series never stays inside ±1 percentage point, so a whole
// series that does is almost certainly entered as fractions (0.196 for 19.6%).
// Single years genuinely can — Yale's FY2023 was 1.8% — hence the minimum count.
const FRACTION_SCALE_MIN_SAMPLE = 3;

// ---------------------------------------------------------------------------
// Validated row shapes (numbers stay numbers here so we can do arithmetic on
// them; they're stringified at insert time for Postgres `numeric` columns).
// ---------------------------------------------------------------------------

export type SchoolRow = {
  id: string;
  name: string;
  managerName: string | null;
  website: string | null;
};

export type SourceRow = {
  id: string;
  title: string;
  publisher: string | null;
  url: string | null;
  documentType: SourceDocumentType;
  page: string | null;
  accessedDate: string | null;
  notes: string | null;
};

export type AllocationRow = {
  schoolId: string;
  fiscalYear: number;
  category: AllocationCategory;
  pct: number;
  basis: AllocationBasis;
  sourceLabel: string | null;
  sourceId: string;
};

export type EndowmentReturnRow = {
  schoolId: string;
  fiscalYear: number;
  returnPct: number | null;
  marketValueUsdMillions: number | null;
  sourceId: string;
};

export type BenchmarkReturnRow = {
  series: BenchmarkSeries;
  fiscalYear: number;
  returnPct: number;
  sourceId: string;
};

export type ProxyMappingRow = {
  category: AllocationCategory;
  etfTicker: string;
  etfName: string;
  rationale: string;
  honestyNote: string;
  sourceId: string | null;
};

export type SeedData = {
  schools: SchoolRow[];
  sources: SourceRow[];
  allocations: AllocationRow[];
  endowmentReturns: EndowmentReturnRow[];
  benchmarkReturns: BenchmarkReturnRow[];
  proxyMappings: ProxyMappingRow[];
};

// Allowed key sets. A curated file that carries a key outside these is a typo,
// and a typo on an *optional* field would otherwise pass silently and write a
// NULL over a number that was correctly researched and cited.
const SCHOOL_KEYS = ["id", "name", "managerName", "website"] as const;
const SOURCE_KEYS = [
  "id",
  "title",
  "publisher",
  "url",
  "documentType",
  "page",
  "accessedDate",
  "notes",
] as const;
const SCHOOL_FILE_KEYS = ["allocations", "endowmentReturns"] as const;
const ALLOCATION_KEYS = [
  "fiscalYear",
  "category",
  "pct",
  "basis",
  "sourceLabel",
  "sourceId",
] as const;
const ENDOWMENT_RETURN_KEYS = [
  "fiscalYear",
  "returnPct",
  "marketValueUsdMillions",
  "sourceId",
] as const;
const BENCHMARK_RETURN_KEYS = ["series", "fiscalYear", "returnPct", "sourceId"] as const;
const PROXY_MAPPING_KEYS = [
  "category",
  "etfTicker",
  "etfName",
  "rationale",
  "honestyNote",
  "sourceId",
] as const;

// ---------------------------------------------------------------------------
// Issue collection
// ---------------------------------------------------------------------------

export type Issue = { where: string; message: string };

export class Report {
  readonly errors: Issue[] = [];
  readonly warnings: Issue[] = [];

  error(where: string, message: string) {
    this.errors.push({ where, message });
  }

  warn(where: string, message: string) {
    this.warnings.push({ where, message });
  }
}

// ---------------------------------------------------------------------------
// Field-level helpers. Each returns the coerced value, or null having recorded
// an error — callers skip the row when a required field comes back null.
// ---------------------------------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** `sourceId` vs `source_id` vs `sourceID` all normalize to the same thing. */
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[_-]/g, "");
}

/** Levenshtein distance, used only to suggest a near-miss key. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    previous = current;
  }
  return previous[b.length];
}

const MAX_SUGGESTION_DISTANCE = 2;

/**
 * Rejects keys outside the allowed set, with a did-you-mean for the near-misses
 * that actually happen: snake_case copied from the database column names, casing
 * and plural slips (all caught by normalizing), and transposed or dropped
 * letters (caught by the edit-distance fallback — `sourceLable` for
 * `sourceLabel` normalizes to something different, so normalizing alone misses
 * it).
 */
function checkKnownKeys(
  row: Record<string, unknown>,
  allowed: readonly string[],
  where: string,
  report: Report,
) {
  const allowedSet = new Set<string>(allowed);
  const byNormalized = new Map(allowed.map((key) => [normalizeKey(key), key]));

  for (const key of Object.keys(row)) {
    if (allowedSet.has(key)) continue;

    const normalized = normalizeKey(key);
    let suggestion = byNormalized.get(normalized);
    if (suggestion === undefined) {
      let best = MAX_SUGGESTION_DISTANCE + 1;
      for (const candidate of allowed) {
        const distance = editDistance(normalized, normalizeKey(candidate));
        if (distance < best) {
          best = distance;
          suggestion = candidate;
        }
      }
      if (best > MAX_SUGGESTION_DISTANCE) suggestion = undefined;
    }

    report.error(
      where,
      suggestion !== undefined
        ? `unknown field \`${key}\` — did you mean \`${suggestion}\`? (allowed: ${allowed.join(", ")})`
        : `unknown field \`${key}\` (allowed: ${allowed.join(", ")})`,
    );
  }
}

function requiredString(
  row: Record<string, unknown>,
  key: string,
  where: string,
  report: Report,
): string | null {
  const value = row[key];
  if (typeof value !== "string" || value.trim() === "") {
    report.error(where, `\`${key}\` must be a non-empty string (got ${describe(value)})`);
    return null;
  }
  // Stored trimmed, so a padded id can never half-match its own references.
  if (value !== value.trim()) {
    report.warn(where, `\`${key}\` had surrounding whitespace (${describe(value)}) — trimmed`);
  }
  return value.trim();
}

function optionalString(
  row: Record<string, unknown>,
  key: string,
  where: string,
  report: Report,
): string | null {
  const value = row[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") {
    report.error(where, `\`${key}\` must be a string or null (got ${describe(value)})`);
    return null;
  }
  const trimmed = value.trim();
  // An empty optional string satisfies the validator while satisfying nothing
  // the docs ask for, so treat it as absent rather than storing "".
  if (trimmed === "") return null;
  if (value !== trimmed) {
    report.warn(where, `\`${key}\` had surrounding whitespace (${describe(value)}) — trimmed`);
  }
  return trimmed;
}

function requiredNumber(
  row: Record<string, unknown>,
  key: string,
  where: string,
  report: Report,
): number | null {
  const value = row[key];
  if (typeof value !== "number" || !Number.isFinite(value)) {
    report.error(where, `\`${key}\` must be a finite number (got ${describe(value)})`);
    return null;
  }
  return value;
}

/** Distinguishes "absent/null" (returns undefined) from "present but invalid" (returns null). */
function optionalNumber(
  row: Record<string, unknown>,
  key: string,
  where: string,
  report: Report,
): number | null | undefined {
  const value = row[key];
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "number" || !Number.isFinite(value)) {
    report.error(where, `\`${key}\` must be a finite number or null (got ${describe(value)})`);
    return null;
  }
  return value;
}

/** Decimal places in a number's shortest exact representation, exponents included. */
export function decimalPlaces(value: number): number {
  if (Number.isInteger(value)) return 0;
  const text = String(value);
  const exponentAt = text.indexOf("e");
  if (exponentAt === -1) {
    const dot = text.indexOf(".");
    return dot === -1 ? 0 : text.length - dot - 1;
  }
  const mantissa = text.slice(0, exponentAt);
  const exponent = Number(text.slice(exponentAt + 1));
  const mantissaDot = mantissa.indexOf(".");
  const mantissaDecimals = mantissaDot === -1 ? 0 : mantissa.length - mantissaDot - 1;
  return Math.max(0, mantissaDecimals - exponent);
}

/**
 * Postgres rounds a value that exceeds the column's scale instead of erroring,
 * which would leave the seed files and the database disagreeing about a figure
 * nobody re-checked. Better to make the curator drop the digit deliberately.
 */
function checkScale(
  value: number,
  key: string,
  scale: number,
  where: string,
  report: Report,
): boolean {
  const places = decimalPlaces(value);
  if (places <= scale) return true;
  report.error(
    where,
    `\`${key}\` has ${places} decimal places but the column stores ${scale} (got ${value}) — round it in the seed file so the stored figure is the one you checked`,
  );
  return false;
}

function requiredFiscalYear(
  row: Record<string, unknown>,
  where: string,
  report: Report,
  maxFiscalYear: number,
): number | null {
  const value = requiredNumber(row, "fiscalYear", where, report);
  if (value === null) return null;
  if (!Number.isInteger(value) || value < MIN_FISCAL_YEAR || value > maxFiscalYear) {
    report.error(
      where,
      `\`fiscalYear\` must be a whole year between ${MIN_FISCAL_YEAR} and ${maxFiscalYear} (fiscal years end June 30, so FY${maxFiscalYear + 1} has not closed yet) (got ${value})`,
    );
    return null;
  }
  return value;
}

function requiredEnum<T extends string>(
  row: Record<string, unknown>,
  key: string,
  allowed: readonly T[],
  where: string,
  report: Report,
): T | null {
  const value = row[key];
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    report.error(where, `\`${key}\` must be one of ${allowed.join(", ")} (got ${describe(value)})`);
    return null;
  }
  return value as T;
}

function describe(value: unknown): string {
  if (value === undefined) return "missing";
  if (value === null) return "null";
  if (typeof value === "string") return JSON.stringify(value);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return Array.isArray(value) ? "an array" : typeof value;
}

/** Collapses [2000,2001,2002,2005] to "FY2000-FY2002, FY2005" for readable warnings. */
function summarizeYears(years: number[]): string {
  const sorted = [...new Set(years)].sort((a, b) => a - b);
  const runs: string[] = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (const year of sorted.slice(1)) {
    if (year === previous + 1) {
      previous = year;
      continue;
    }
    runs.push(start === previous ? `FY${start}` : `FY${start}-FY${previous}`);
    start = year;
    previous = year;
  }
  runs.push(start === previous ? `FY${start}` : `FY${start}-FY${previous}`);
  return runs.join(", ");
}

// ---------------------------------------------------------------------------
// File readers
// ---------------------------------------------------------------------------

function readJsonFile(file: string, where: string, report: Report): unknown {
  if (!existsSync(file)) {
    report.error(where, "file is missing");
    return undefined;
  }
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (err) {
    report.error(where, `invalid JSON — ${(err as Error).message}`);
    return undefined;
  }
}

type IndexedRow = { index: number; row: Record<string, unknown> };

/**
 * Reads a file expected to hold a top-level JSON array. Carries each entry's
 * ORIGINAL index, so a malformed entry mid-file doesn't shift every subsequent
 * error message onto the wrong row.
 */
function readArrayFile(file: string, where: string, report: Report): IndexedRow[] {
  const parsed = readJsonFile(file, where, report);
  if (parsed === undefined) return [];
  if (!Array.isArray(parsed)) {
    report.error(where, "expected a top-level JSON array");
    return [];
  }
  return parsed.flatMap((entry, index) => {
    if (!isRecord(entry)) {
      report.error(`${where}[${index}]`, `expected an object (got ${describe(entry)})`);
      return [];
    }
    return [{ index, row: entry }];
  });
}

// ---------------------------------------------------------------------------
// Per-file validation
// ---------------------------------------------------------------------------

function validateSchools(dataDir: string, report: Report): SchoolRow[] {
  const where = "schools.json";
  const rows: SchoolRow[] = [];
  const seen = new Set<string>();

  for (const { index, row: raw } of readArrayFile(
    path.join(dataDir, "schools.json"),
    where,
    report,
  )) {
    const at = `${where}[${index}]`;
    checkKnownKeys(raw, SCHOOL_KEYS, at, report);

    const id = requiredString(raw, "id", at, report);
    const name = requiredString(raw, "name", at, report);
    if (id === null || name === null) continue;

    if (seen.has(id)) {
      report.error(at, `duplicate school id \`${id}\``);
      continue;
    }
    seen.add(id);

    // Keeping schools.json and SCHOOL_IDS in lockstep means the typed SchoolId
    // union in the app can never drift from the data.
    if (!(SCHOOL_IDS as readonly string[]).includes(id)) {
      report.error(
        at,
        `school id \`${id}\` is not in SCHOOL_IDS (src/lib/constants.ts) — add it there too`,
      );
    }

    rows.push({
      id,
      name,
      managerName: optionalString(raw, "managerName", at, report),
      website: optionalString(raw, "website", at, report),
    });
  }

  for (const expected of SCHOOL_IDS) {
    if (!seen.has(expected)) {
      report.error(where, `SCHOOL_IDS lists \`${expected}\` but schools.json has no entry for it`);
    }
  }

  return rows;
}

/**
 * The mirror of the SCHOOL_IDS check above, for *files*. Discovery is driven by
 * `schools.json`, so without this a misnamed or unlisted file is never opened:
 * its contents are never validated, and the prune step then deletes whatever
 * those rows used to be. A filename typo would silently discard a whole school.
 */
function checkSchoolFileInventory(dataDir: string, report: Report) {
  const dir = path.join(dataDir, "schools");
  if (!existsSync(dir)) {
    report.error("schools/", "directory is missing");
    return;
  }

  for (const entry of readdirSync(dir)) {
    if (!entry.endsWith(".json")) continue;
    const id = entry.slice(0, -".json".length);
    if (!(SCHOOL_IDS as readonly string[]).includes(id)) {
      report.error(
        `schools/${entry}`,
        `there is no school with id \`${id}\` — every file in data/schools/ must be named <school-id>.json (SCHOOL_IDS: ${SCHOOL_IDS.join(", ")}); an unlisted file is never read, and its rows would be pruned from the database`,
      );
    }
  }
}

function validateSources(dataDir: string, report: Report): SourceRow[] {
  const where = "sources.json";
  const rows: SourceRow[] = [];
  const seen = new Set<string>();

  for (const { index, row: raw } of readArrayFile(
    path.join(dataDir, "sources.json"),
    where,
    report,
  )) {
    const at = `${where}[${index}]`;
    checkKnownKeys(raw, SOURCE_KEYS, at, report);

    const id = requiredString(raw, "id", at, report);
    const title = requiredString(raw, "title", at, report);
    const documentType = requiredEnum(raw, "documentType", SOURCE_DOCUMENT_TYPES, at, report);
    if (id === null || title === null || documentType === null) continue;

    if (seen.has(id)) {
      report.error(at, `duplicate source id \`${id}\``);
      continue;
    }
    seen.add(id);

    const url = optionalString(raw, "url", at, report);
    const page = optionalString(raw, "page", at, report);

    // PRD rule 2 asks for "source document + page/URL". A title-only citation
    // resolves but cannot be re-checked by anyone, which is the whole point of
    // citing it — the Methodology page (task 6.1) would list a dead end.
    if (url === null && page === null) {
      report.error(
        at,
        `source \`${id}\` needs a \`url\` or a \`page\` — a citation nobody can locate is not a citation`,
      );
    }

    const accessedDate = optionalString(raw, "accessedDate", at, report);
    if (accessedDate !== null && !isIsoDate(accessedDate)) {
      report.error(at, `\`accessedDate\` must be an ISO date, YYYY-MM-DD (got ${describe(accessedDate)})`);
    }
    if (url !== null && !isHttpUrl(url)) {
      report.error(at, `\`url\` must be an http(s) URL (got ${describe(url)})`);
    }

    rows.push({
      id,
      title,
      documentType,
      publisher: optionalString(raw, "publisher", at, report),
      url,
      page,
      accessedDate,
      notes: optionalString(raw, "notes", at, report),
    });
  }

  return rows;
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function validateSchoolFiles(
  dataDir: string,
  schools: SchoolRow[],
  report: Report,
  maxFiscalYear: number,
  rejectedAllocationYears: Set<string>,
): { allocations: AllocationRow[]; endowmentReturns: EndowmentReturnRow[] } {
  const allocations: AllocationRow[] = [];
  const endowmentReturns: EndowmentReturnRow[] = [];

  for (const school of schools) {
    const where = `schools/${school.id}.json`;
    const parsed = readJsonFile(path.join(dataDir, "schools", `${school.id}.json`), where, report);
    if (parsed === undefined) continue;
    if (!isRecord(parsed)) {
      report.error(
        where,
        "expected a top-level JSON object with `allocations` and `endowmentReturns`",
      );
      continue;
    }
    checkKnownKeys(parsed, SCHOOL_FILE_KEYS, where, report);

    allocations.push(
      ...validateAllocations(
        parsed.allocations,
        school.id,
        where,
        report,
        maxFiscalYear,
        rejectedAllocationYears,
      ),
    );
    endowmentReturns.push(
      ...validateEndowmentReturns(
        parsed.endowmentReturns,
        school.id,
        where,
        report,
        maxFiscalYear,
      ),
    );
  }

  return { allocations, endowmentReturns };
}

function validateAllocations(
  raw: unknown,
  schoolId: string,
  where: string,
  report: Report,
  maxFiscalYear: number,
  rejectedAllocationYears: Set<string>,
): AllocationRow[] {
  if (!Array.isArray(raw)) {
    report.error(where, `\`allocations\` must be an array (got ${describe(raw)})`);
    return [];
  }

  const rows: AllocationRow[] = [];
  const seen = new Set<string>();

  for (const [i, entry] of raw.entries()) {
    const at = `${where} allocations[${i}]`;
    if (!isRecord(entry)) {
      report.error(at, `expected an object (got ${describe(entry)})`);
      continue;
    }
    checkKnownKeys(entry, ALLOCATION_KEYS, at, report);

    const fiscalYear = requiredFiscalYear(entry, at, report, maxFiscalYear);
    const category = requiredEnum(entry, "category", ALLOCATION_CATEGORIES, at, report);
    const pct = requiredNumber(entry, "pct", at, report);
    const sourceId = requiredString(entry, "sourceId", at, report);

    // A row dropped here never reaches the sum map, which would make the
    // sum-to-100 check report a total the source document doesn't contain.
    // Remember the year so that message can say so instead of misleading.
    if (fiscalYear !== null && (category === null || pct === null || sourceId === null)) {
      rejectedAllocationYears.add(`${schoolId}|${fiscalYear}`);
    }
    if (fiscalYear === null || category === null || pct === null || sourceId === null) continue;

    if (pct < MIN_ALLOCATION_PCT || pct > MAX_ALLOCATION_PCT) {
      report.error(
        at,
        `\`pct\` must be between ${MIN_ALLOCATION_PCT} and ${MAX_ALLOCATION_PCT} (got ${pct})`,
      );
      rejectedAllocationYears.add(`${schoolId}|${fiscalYear}`);
      continue;
    }
    if (!checkScale(pct, "pct", PCT_SCALE, at, report)) {
      rejectedAllocationYears.add(`${schoolId}|${fiscalYear}`);
      continue;
    }

    // Omitted means "actual", so every row curated before the basis distinction
    // existed stays correct without being touched.
    let basis: AllocationBasis = DEFAULT_ALLOCATION_BASIS;
    if (entry.basis !== undefined && entry.basis !== null) {
      const parsed = requiredEnum(entry, "basis", ALLOCATION_BASES, at, report);
      if (parsed === null) {
        rejectedAllocationYears.add(`${schoolId}|${fiscalYear}`);
        continue;
      }
      basis = parsed;
    }

    const sourceLabel = optionalString(entry, "sourceLabel", at, report);

    // A negative weight is real leverage, not a typo — but it is rare enough
    // that it must never pass unremarked, and the school's own wording for the
    // line is what makes it auditable, so it stops being optional here.
    if (pct < 0) {
      if (sourceLabel === null) {
        report.error(
          at,
          `\`pct\` is negative (${pct}) for FY${fiscalYear} \`${category}\`, so \`sourceLabel\` is required — record the school's own wording for the line the negative came from, because that is what makes a levered weight auditable`,
        );
        rejectedAllocationYears.add(`${schoolId}|${fiscalYear}`);
        continue;
      }
      report.warn(
        at,
        `\`pct\` is negative (${pct}) for ${schoolId} FY${fiscalYear} \`${category}\` (source line: ${JSON.stringify(sourceLabel)}) — stored as published levered exposure, not clamped. Confirm the source really shows a negative weight. This also activates: label the negative band on the chart (task 3.2) and define leverage in plain English where it is displayed (tasks 4.2, 6.1)`,
      );
    }

    // Mirrors the unique(school_id, fiscal_year, category) constraint — catching
    // it here gives a file-and-line error instead of a Postgres conflict.
    const key = `${fiscalYear}|${category}`;
    if (seen.has(key)) {
      report.error(at, `duplicate row for FY${fiscalYear} \`${category}\``);
      continue;
    }
    seen.add(key);

    rows.push({ schoolId, fiscalYear, category, pct, basis, sourceLabel, sourceId });
  }

  return rows;
}

/**
 * Two rules that only make sense across the rows of a single school-year, so
 * they can't live in the per-row loop above.
 *
 * Both exist because a school-year is one portfolio measured one way. Mixing the
 * coarse equity category with the split ones double-counts equity and quietly
 * breaks the sum-to-100 check; mixing target and actual rows inside a year
 * produces a portfolio that was never published in that shape by anyone.
 */
function validateAllocationYearConsistency(rows: AllocationRow[], report: Report) {
  const byYear = new Map<string, AllocationRow[]>();
  for (const row of rows) {
    const key = `${row.schoolId}|${row.fiscalYear}`;
    byYear.set(key, [...(byYear.get(key) ?? []), row]);
  }

  for (const [key, yearRows] of [...byYear].sort()) {
    const [schoolId, fiscalYear] = key.split("|");
    const at = `schools/${schoolId}.json FY${fiscalYear}`;

    const coarse = yearRows.filter((r) => r.category === COARSE_EQUITY_CATEGORY);
    const split = yearRows.filter((r) =>
      (SPLIT_EQUITY_CATEGORIES as readonly string[]).includes(r.category),
    );
    if (coarse.length > 0 && split.length > 0) {
      report.error(
        at,
        `mixes \`${COARSE_EQUITY_CATEGORY}\` with ${split
          .map((r) => `\`${r.category}\``)
          .join(" and ")} — a school-year must use either the coarse equity category or the split ones, never both, or the equity sleeve is counted twice. Use whichever granularity the source document actually published`,
      );
    }

    const bases = [...new Set(yearRows.map((r) => r.basis))].sort();
    if (bases.length > 1) {
      report.error(
        at,
        `mixes allocation bases (${bases.join(", ")}) — every row in one school-year must share one basis, because a year is either the mix the school held or the mix it was targeting, not a blend of the two`,
      );
    }
  }
}

function validateEndowmentReturns(
  raw: unknown,
  schoolId: string,
  where: string,
  report: Report,
  maxFiscalYear: number,
): EndowmentReturnRow[] {
  if (!Array.isArray(raw)) {
    report.error(where, `\`endowmentReturns\` must be an array (got ${describe(raw)})`);
    return [];
  }

  const rows: EndowmentReturnRow[] = [];
  const seen = new Set<number>();

  for (const [i, entry] of raw.entries()) {
    const at = `${where} endowmentReturns[${i}]`;
    if (!isRecord(entry)) {
      report.error(at, `expected an object (got ${describe(entry)})`);
      continue;
    }
    checkKnownKeys(entry, ENDOWMENT_RETURN_KEYS, at, report);

    const fiscalYear = requiredFiscalYear(entry, at, report, maxFiscalYear);
    const sourceId = requiredString(entry, "sourceId", at, report);
    const returnPct = optionalNumber(entry, "returnPct", at, report);
    const marketValue = optionalNumber(entry, "marketValueUsdMillions", at, report);
    if (fiscalYear === null || sourceId === null || returnPct === null || marketValue === null) {
      continue;
    }

    // The inverse of the citation rule: a row carrying a source and no figure
    // looks like coverage to every downstream query while holding nothing.
    if (returnPct === undefined && marketValue === undefined) {
      report.error(
        at,
        "row has neither `returnPct` nor `marketValueUsdMillions` — a citation with no number. Delete the row, or add the figure it cites",
      );
      continue;
    }

    if (returnPct !== undefined) {
      if (returnPct <= MIN_RETURN_PCT_EXCLUSIVE || returnPct > MAX_RETURN_PCT) {
        report.error(
          at,
          `\`returnPct\` of ${returnPct} is outside the plausible range (${MIN_RETURN_PCT_EXCLUSIVE}, ${MAX_RETURN_PCT}]`,
        );
        continue;
      }
      if (!checkScale(returnPct, "returnPct", RETURN_PCT_SCALE, at, report)) continue;
    }

    if (marketValue !== undefined) {
      if (
        marketValue < MIN_MARKET_VALUE_USD_MILLIONS ||
        marketValue > MAX_MARKET_VALUE_USD_MILLIONS
      ) {
        report.error(
          at,
          `\`marketValueUsdMillions\` of ${marketValue} is outside the plausible range [${MIN_MARKET_VALUE_USD_MILLIONS}, ${MAX_MARKET_VALUE_USD_MILLIONS}] — this field is in MILLIONS of USD, so a $40.7B endowment is 40700 (not 40.7, and not 40700000)`,
        );
        continue;
      }
      if (!checkScale(marketValue, "marketValueUsdMillions", MARKET_VALUE_SCALE, at, report)) {
        continue;
      }
    }

    if (seen.has(fiscalYear)) {
      report.error(at, `duplicate row for FY${fiscalYear}`);
      continue;
    }
    seen.add(fiscalYear);

    rows.push({
      schoolId,
      fiscalYear,
      returnPct: returnPct ?? null,
      marketValueUsdMillions: marketValue ?? null,
      sourceId,
    });
  }

  return rows;
}

function validateBenchmarkReturns(
  dataDir: string,
  report: Report,
  maxFiscalYear: number,
): BenchmarkReturnRow[] {
  const where = "benchmark_returns.json";
  const rows: BenchmarkReturnRow[] = [];
  const seen = new Set<string>();

  for (const { index, row: raw } of readArrayFile(
    path.join(dataDir, "benchmark_returns.json"),
    where,
    report,
  )) {
    const at = `${where}[${index}]`;
    checkKnownKeys(raw, BENCHMARK_RETURN_KEYS, at, report);

    const series = requiredEnum(raw, "series", BENCHMARK_SERIES, at, report);
    const fiscalYear = requiredFiscalYear(raw, at, report, maxFiscalYear);
    const returnPct = requiredNumber(raw, "returnPct", at, report);
    const sourceId = requiredString(raw, "sourceId", at, report);
    if (series === null || fiscalYear === null || returnPct === null || sourceId === null) continue;

    if (returnPct <= MIN_RETURN_PCT_EXCLUSIVE || returnPct > MAX_RETURN_PCT) {
      report.error(
        at,
        `\`returnPct\` of ${returnPct} is outside the plausible range (${MIN_RETURN_PCT_EXCLUSIVE}, ${MAX_RETURN_PCT}]`,
      );
      continue;
    }
    if (!checkScale(returnPct, "returnPct", RETURN_PCT_SCALE, at, report)) continue;

    const key = `${series}|${fiscalYear}`;
    if (seen.has(key)) {
      report.error(at, `duplicate row for \`${series}\` FY${fiscalYear}`);
      continue;
    }
    seen.add(key);

    rows.push({ series, fiscalYear, returnPct, sourceId });
  }

  return rows;
}

function validateProxyMappings(dataDir: string, report: Report): ProxyMappingRow[] {
  const where = "proxy_mappings.json";
  const rows: ProxyMappingRow[] = [];
  const seen = new Set<string>();

  for (const { index, row: raw } of readArrayFile(
    path.join(dataDir, "proxy_mappings.json"),
    where,
    report,
  )) {
    const at = `${where}[${index}]`;
    checkKnownKeys(raw, PROXY_MAPPING_KEYS, at, report);

    const category = requiredEnum(raw, "category", ALLOCATION_CATEGORIES, at, report);
    const etfTicker = requiredString(raw, "etfTicker", at, report);
    const etfName = requiredString(raw, "etfName", at, report);
    const rationale = requiredString(raw, "rationale", at, report);
    const honestyNote = requiredString(raw, "honestyNote", at, report);
    if (
      category === null ||
      etfTicker === null ||
      etfName === null ||
      rationale === null ||
      honestyNote === null
    ) {
      continue;
    }

    if (seen.has(category)) {
      report.error(at, `duplicate mapping for category \`${category}\``);
      continue;
    }
    seen.add(category);

    rows.push({
      category,
      etfTicker,
      etfName,
      rationale,
      honestyNote,
      // Deliberately optional: a proxy row carries no sourced *number* — the
      // ticker and the prose are this project's own editorial choice, which
      // task 6.1 explains rather than cites.
      sourceId: optionalString(raw, "sourceId", at, report),
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Cross-file validation — the checks the PRD's citation rule actually turns on
// ---------------------------------------------------------------------------

function validateCrossFile(
  data: SeedData,
  report: Report,
  rejectedAllocationYears: Set<string>,
) {
  const sourceIds = new Set(data.sources.map((s) => s.id));

  // PRD rule 2: no citation, no number.
  const citationChecks: { where: string; sourceId: string | null }[] = [
    ...data.allocations.map((a) => ({
      where: `schools/${a.schoolId}.json allocations FY${a.fiscalYear} ${a.category}`,
      sourceId: a.sourceId,
    })),
    ...data.endowmentReturns.map((r) => ({
      where: `schools/${r.schoolId}.json endowmentReturns FY${r.fiscalYear}`,
      sourceId: r.sourceId,
    })),
    ...data.benchmarkReturns.map((b) => ({
      where: `benchmark_returns.json ${b.series} FY${b.fiscalYear}`,
      sourceId: b.sourceId,
    })),
    ...data.proxyMappings.map((p) => ({
      where: `proxy_mappings.json ${p.category}`,
      sourceId: p.sourceId,
    })),
  ];

  for (const check of citationChecks) {
    if (check.sourceId !== null && !sourceIds.has(check.sourceId)) {
      report.error(check.where, `\`sourceId\` \`${check.sourceId}\` is not in sources.json`);
    }
  }

  // Allocations for one school-year describe a whole portfolio, so they have to
  // add up to it.
  const sums = new Map<string, number>();
  for (const a of data.allocations) {
    const key = `${a.schoolId}|${a.fiscalYear}`;
    sums.set(key, (sums.get(key) ?? 0) + a.pct);
  }
  for (const [key, sum] of [...sums].sort()) {
    const [schoolId, fiscalYear] = key.split("|");
    if (Math.abs(sum - 100) > ALLOCATION_SUM_TOLERANCE_PCT) {
      const incomplete = rejectedAllocationYears.has(key)
        ? " — NOTE: at least one row in this year was rejected above, so this total is missing it; fix that error first, this sum may be fine"
        : "";
      report.error(
        `schools/${schoolId}.json FY${fiscalYear}`,
        `allocations sum to ${sum.toFixed(2)}%, more than ${ALLOCATION_SUM_TOLERANCE_PCT} percentage point away from 100%${incomplete}`,
      );
    }
  }

  // A year whose rows were rejected has no meaningful total at all, so say that
  // rather than letting the year look checked.
  for (const key of [...rejectedAllocationYears].sort()) {
    if (!sums.has(key)) {
      const [schoolId, fiscalYear] = key.split("|");
      report.error(
        `schools/${schoolId}.json FY${fiscalYear}`,
        "every allocation row for this year was rejected above, so the sum-to-100 check could not run",
      );
    }
  }

  warnOnFractionScaleReturns(data, report);

  // Task 1.7 finishes the proxy table; until then a gap is expected, so warn.
  const mapped = new Set(data.proxyMappings.map((p) => p.category));
  const used = new Set(data.allocations.map((a) => a.category));
  for (const category of [...used].sort()) {
    if (!mapped.has(category)) {
      report.warn(
        "proxy_mappings.json",
        `category \`${category}\` is used in allocations but has no ETF proxy mapping yet (task 1.7)`,
      );
    }
  }

  // The backtest (task 4.1) maps each allocation category to a benchmark series;
  // a category-year with no benchmark row silently drops that slice of the
  // portfolio, so the copycat would be built on part of the allocation while
  // the page claims to model all of it. Warning, not error: task 1.4
  // deliberately left `hedge_fund_index` and `public_pe_index` empty for 1.7.
  const benchmarkKeys = new Set(data.benchmarkReturns.map((b) => `${b.series}|${b.fiscalYear}`));
  const missingBySeries = new Map<BenchmarkSeries, number[]>();
  for (const a of data.allocations) {
    const series = CATEGORY_TO_BENCHMARK_SERIES[a.category];
    if (series === null) continue;
    if (benchmarkKeys.has(`${series}|${a.fiscalYear}`)) continue;
    const years = missingBySeries.get(series) ?? [];
    years.push(a.fiscalYear);
    missingBySeries.set(series, years);
  }
  for (const series of [...missingBySeries.keys()].sort()) {
    const years = missingBySeries.get(series) ?? [];
    report.warn(
      "benchmark_returns.json",
      `\`${series}\` has no rows for ${summarizeYears(years)}, but allocations in those years map to it — the copycat backtest (task 4.1) would silently drop that slice`,
    );
  }

  // A source nobody cites is dead weight in the Methodology page (task 6.1).
  const cited = new Set(
    citationChecks.map((c) => c.sourceId).filter((id): id is string => id !== null),
  );
  for (const source of data.sources) {
    if (!cited.has(source.id)) {
      report.warn("sources.json", `source \`${source.id}\` is not cited by any row`);
    }
  }
}

/**
 * `returnPct` is whole percentage points. Entering fractions (0.196 for 19.6%)
 * stays inside every range check, and unlike a mis-scaled `pct` there is no sum
 * rule to catch it — the backtest would just compound near-zero returns and
 * report that indexing went nowhere.
 */
function warnOnFractionScaleReturns(data: SeedData, report: Report) {
  const looksFractional = (values: number[]) =>
    values.length >= FRACTION_SCALE_MIN_SAMPLE && values.every((v) => Math.abs(v) < 1.0);

  const bySchool = new Map<string, number[]>();
  for (const r of data.endowmentReturns) {
    if (r.returnPct === null) continue;
    const values = bySchool.get(r.schoolId) ?? [];
    values.push(r.returnPct);
    bySchool.set(r.schoolId, values);
  }
  for (const schoolId of [...bySchool.keys()].sort()) {
    const values = bySchool.get(schoolId) ?? [];
    if (!looksFractional(values)) continue;
    report.warn(
      `schools/${schoolId}.json`,
      `all ${values.length} \`returnPct\` values are between -1 and 1 — this field is whole percentage points (11.5 means 11.5%, not 0.115), so this looks like fractions`,
    );
  }

  const bySeries = new Map<BenchmarkSeries, number[]>();
  for (const b of data.benchmarkReturns) {
    const values = bySeries.get(b.series) ?? [];
    values.push(b.returnPct);
    bySeries.set(b.series, values);
  }
  for (const series of [...bySeries.keys()].sort()) {
    const values = bySeries.get(series) ?? [];
    if (!looksFractional(values)) continue;
    report.warn(
      "benchmark_returns.json",
      `all ${values.length} \`returnPct\` values for \`${series}\` are between -1 and 1 — this field is whole percentage points (11.5 means 11.5%, not 0.115), so this looks like fractions`,
    );
  }
}

// ---------------------------------------------------------------------------
// Entry point for validation
// ---------------------------------------------------------------------------

export function loadSeedData(
  dataDir: string,
  options: { now?: Date } = {},
): { data: SeedData; report: Report } {
  const report = new Report();
  const maxFiscalYear = latestClosedFiscalYear(options.now);
  const rejectedAllocationYears = new Set<string>();

  const schools = validateSchools(dataDir, report);
  checkSchoolFileInventory(dataDir, report);
  const sources = validateSources(dataDir, report);
  const { allocations, endowmentReturns } = validateSchoolFiles(
    dataDir,
    schools,
    report,
    maxFiscalYear,
    rejectedAllocationYears,
  );
  const benchmarkReturns = validateBenchmarkReturns(dataDir, report, maxFiscalYear);
  const proxyMappings = validateProxyMappings(dataDir, report);

  const data: SeedData = {
    schools,
    sources,
    allocations,
    endowmentReturns,
    benchmarkReturns,
    proxyMappings,
  };

  validateAllocationYearConsistency(allocations, report);
  validateCrossFile(data, report, rejectedAllocationYears);

  return { data, report };
}

export function describeCounts(data: SeedData): string {
  return [
    `${data.schools.length} school(s)`,
    `${data.sources.length} source(s)`,
    `${data.allocations.length} allocation row(s)`,
    `${data.endowmentReturns.length} endowment return row(s)`,
    `${data.benchmarkReturns.length} benchmark return row(s)`,
    `${data.proxyMappings.length} proxy mapping(s)`,
  ].join(", ");
}
