/**
 * npm run seed — loads the hand-curated seed files in `data/` into Neon.
 *
 * `data/` is the source of truth (see data/README.md); this script only ever
 * writes in that direction. Every file is validated first and nothing is
 * written unless all checks pass, so a bad edit can't leave the database
 * half-updated. Re-running is idempotent: unchanged rows keep their ids, and
 * rows deleted from the seed files are pruned from the database.
 *
 * Flags:
 *   --dry-run           validate only — no database connection needed
 *   --data-dir <path>   read a different data directory (used to exercise the
 *                       validator against deliberately bad fixtures)
 */

import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

import {
  ALLOCATION_CATEGORIES,
  BENCHMARK_SERIES,
  SCHOOL_IDS,
  type AllocationCategory,
  type BenchmarkSeries,
} from "../src/lib/constants";

config({ path: ".env.local" });

// Published allocation tables are rounded, so a school-year rarely sums to
// exactly 100. Anything further out than this is a curation error, not rounding.
const ALLOCATION_SUM_TOLERANCE_PCT = 1.0;

const MIN_FISCAL_YEAR = 1970;
const MAX_FISCAL_YEAR = new Date().getFullYear() + 1;

const SOURCE_DOCUMENT_TYPES = [
  "annual_report",
  "financial_statement",
  "nacubo_study",
  "academic_paper",
  "other",
] as const;

// ---------------------------------------------------------------------------
// Validated row shapes (numbers stay numbers here so we can do arithmetic on
// them; they're stringified at insert time for Postgres `numeric` columns).
// ---------------------------------------------------------------------------

type SchoolRow = {
  id: string;
  name: string;
  managerName: string | null;
  website: string | null;
};

type SourceRow = {
  id: string;
  title: string;
  publisher: string | null;
  url: string | null;
  documentType: string;
  page: string | null;
  accessedDate: string | null;
  notes: string | null;
};

type AllocationRow = {
  schoolId: string;
  fiscalYear: number;
  category: AllocationCategory;
  pct: number;
  sourceLabel: string | null;
  sourceId: string;
};

type EndowmentReturnRow = {
  schoolId: string;
  fiscalYear: number;
  returnPct: number | null;
  marketValueUsdMillions: number | null;
  sourceId: string;
};

type BenchmarkReturnRow = {
  series: BenchmarkSeries;
  fiscalYear: number;
  returnPct: number;
  sourceId: string;
};

type ProxyMappingRow = {
  category: AllocationCategory;
  etfTicker: string;
  etfName: string;
  rationale: string;
  honestyNote: string;
  sourceId: string | null;
};

type SeedData = {
  schools: SchoolRow[];
  sources: SourceRow[];
  allocations: AllocationRow[];
  endowmentReturns: EndowmentReturnRow[];
  benchmarkReturns: BenchmarkReturnRow[];
  proxyMappings: ProxyMappingRow[];
};

// ---------------------------------------------------------------------------
// Issue collection
// ---------------------------------------------------------------------------

type Issue = { where: string; message: string };

class Report {
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
  return value;
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
  return value;
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

function requiredFiscalYear(
  row: Record<string, unknown>,
  where: string,
  report: Report,
): number | null {
  const value = requiredNumber(row, "fiscalYear", where, report);
  if (value === null) return null;
  if (!Number.isInteger(value) || value < MIN_FISCAL_YEAR || value > MAX_FISCAL_YEAR) {
    report.error(
      where,
      `\`fiscalYear\` must be a whole year between ${MIN_FISCAL_YEAR} and ${MAX_FISCAL_YEAR} (got ${value})`,
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
    report.error(
      where,
      `\`${key}\` must be one of ${allowed.join(", ")} (got ${describe(value)})`,
    );
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

/** Reads a file expected to hold a top-level JSON array, entry by entry. */
function readArrayFile(
  file: string,
  where: string,
  report: Report,
): Record<string, unknown>[] {
  const parsed = readJsonFile(file, where, report);
  if (parsed === undefined) return [];
  if (!Array.isArray(parsed)) {
    report.error(where, "expected a top-level JSON array");
    return [];
  }
  return parsed.flatMap((entry, i) => {
    if (!isRecord(entry)) {
      report.error(`${where}[${i}]`, `expected an object (got ${describe(entry)})`);
      return [];
    }
    return [entry];
  });
}

// ---------------------------------------------------------------------------
// Per-file validation
// ---------------------------------------------------------------------------

function validateSchools(dataDir: string, report: Report): SchoolRow[] {
  const where = "schools.json";
  const rows: SchoolRow[] = [];
  const seen = new Set<string>();

  for (const [i, raw] of readArrayFile(path.join(dataDir, "schools.json"), where, report).entries()) {
    const at = `${where}[${i}]`;
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

function validateSources(dataDir: string, report: Report): SourceRow[] {
  const where = "sources.json";
  const rows: SourceRow[] = [];
  const seen = new Set<string>();

  for (const [i, raw] of readArrayFile(path.join(dataDir, "sources.json"), where, report).entries()) {
    const at = `${where}[${i}]`;
    const id = requiredString(raw, "id", at, report);
    const title = requiredString(raw, "title", at, report);
    const documentType = requiredEnum(raw, "documentType", SOURCE_DOCUMENT_TYPES, at, report);
    if (id === null || title === null || documentType === null) continue;

    if (seen.has(id)) {
      report.error(at, `duplicate source id \`${id}\``);
      continue;
    }
    seen.add(id);

    rows.push({
      id,
      title,
      documentType,
      publisher: optionalString(raw, "publisher", at, report),
      url: optionalString(raw, "url", at, report),
      page: optionalString(raw, "page", at, report),
      accessedDate: optionalString(raw, "accessedDate", at, report),
      notes: optionalString(raw, "notes", at, report),
    });
  }

  return rows;
}

function validateSchoolFiles(
  dataDir: string,
  schools: SchoolRow[],
  report: Report,
): { allocations: AllocationRow[]; endowmentReturns: EndowmentReturnRow[] } {
  const allocations: AllocationRow[] = [];
  const endowmentReturns: EndowmentReturnRow[] = [];

  for (const school of schools) {
    const where = `schools/${school.id}.json`;
    const parsed = readJsonFile(path.join(dataDir, "schools", `${school.id}.json`), where, report);
    if (parsed === undefined) continue;
    if (!isRecord(parsed)) {
      report.error(where, "expected a top-level JSON object with `allocations` and `endowmentReturns`");
      continue;
    }

    allocations.push(...validateAllocations(parsed.allocations, school.id, where, report));
    endowmentReturns.push(
      ...validateEndowmentReturns(parsed.endowmentReturns, school.id, where, report),
    );
  }

  return { allocations, endowmentReturns };
}

function validateAllocations(
  raw: unknown,
  schoolId: string,
  where: string,
  report: Report,
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

    const fiscalYear = requiredFiscalYear(entry, at, report);
    const category = requiredEnum(entry, "category", ALLOCATION_CATEGORIES, at, report);
    const pct = requiredNumber(entry, "pct", at, report);
    const sourceId = requiredString(entry, "sourceId", at, report);
    if (fiscalYear === null || category === null || pct === null || sourceId === null) continue;

    if (pct < 0 || pct > 100) {
      report.error(at, `\`pct\` must be between 0 and 100 (got ${pct})`);
      continue;
    }

    // Mirrors the unique(school_id, fiscal_year, category) constraint — catching
    // it here gives a file-and-line error instead of a Postgres conflict.
    const key = `${fiscalYear}|${category}`;
    if (seen.has(key)) {
      report.error(at, `duplicate row for FY${fiscalYear} \`${category}\``);
      continue;
    }
    seen.add(key);

    rows.push({
      schoolId,
      fiscalYear,
      category,
      pct,
      sourceLabel: optionalString(entry, "sourceLabel", at, report),
      sourceId,
    });
  }

  return rows;
}

function validateEndowmentReturns(
  raw: unknown,
  schoolId: string,
  where: string,
  report: Report,
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

    const fiscalYear = requiredFiscalYear(entry, at, report);
    const sourceId = requiredString(entry, "sourceId", at, report);
    const returnPct = optionalNumber(entry, "returnPct", at, report);
    const marketValue = optionalNumber(entry, "marketValueUsdMillions", at, report);
    if (fiscalYear === null || sourceId === null || returnPct === null || marketValue === null) {
      continue;
    }

    // Losing more than everything is impossible; the upper bound just catches a
    // decimal-point slip (e.g. 400 where 40.0 was meant).
    if (returnPct !== undefined && (returnPct <= -100 || returnPct > 200)) {
      report.error(at, `\`returnPct\` of ${returnPct} is outside the plausible range (-100, 200]`);
      continue;
    }
    if (marketValue !== undefined && marketValue < 0) {
      report.error(at, `\`marketValueUsdMillions\` must not be negative (got ${marketValue})`);
      continue;
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

function validateBenchmarkReturns(dataDir: string, report: Report): BenchmarkReturnRow[] {
  const where = "benchmark_returns.json";
  const rows: BenchmarkReturnRow[] = [];
  const seen = new Set<string>();

  for (const [i, raw] of readArrayFile(
    path.join(dataDir, "benchmark_returns.json"),
    where,
    report,
  ).entries()) {
    const at = `${where}[${i}]`;
    const series = requiredEnum(raw, "series", BENCHMARK_SERIES, at, report);
    const fiscalYear = requiredFiscalYear(raw, at, report);
    const returnPct = requiredNumber(raw, "returnPct", at, report);
    const sourceId = requiredString(raw, "sourceId", at, report);
    if (series === null || fiscalYear === null || returnPct === null || sourceId === null) continue;

    if (returnPct <= -100 || returnPct > 200) {
      report.error(at, `\`returnPct\` of ${returnPct} is outside the plausible range (-100, 200]`);
      continue;
    }

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

  for (const [i, raw] of readArrayFile(
    path.join(dataDir, "proxy_mappings.json"),
    where,
    report,
  ).entries()) {
    const at = `${where}[${i}]`;
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
      sourceId: optionalString(raw, "sourceId", at, report),
    });
  }

  return rows;
}

// ---------------------------------------------------------------------------
// Cross-file validation — the checks the PRD's citation rule actually turns on
// ---------------------------------------------------------------------------

function validateCrossFile(data: SeedData, report: Report) {
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
      report.error(
        `schools/${schoolId}.json FY${fiscalYear}`,
        `allocations sum to ${sum.toFixed(2)}%, more than ${ALLOCATION_SUM_TOLERANCE_PCT} percentage point away from 100%`,
      );
    }
  }

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

  // A source nobody cites is dead weight in the Methodology page (task 6.1).
  const cited = new Set(citationChecks.map((c) => c.sourceId).filter((id): id is string => id !== null));
  for (const source of data.sources) {
    if (!cited.has(source.id)) {
      report.warn("sources.json", `source \`${source.id}\` is not cited by any row`);
    }
  }
}

// ---------------------------------------------------------------------------
// Load + validate
// ---------------------------------------------------------------------------

function loadSeedData(dataDir: string): { data: SeedData; report: Report } {
  const report = new Report();

  const schools = validateSchools(dataDir, report);
  const sources = validateSources(dataDir, report);
  const { allocations, endowmentReturns } = validateSchoolFiles(dataDir, schools, report);
  const benchmarkReturns = validateBenchmarkReturns(dataDir, report);
  const proxyMappings = validateProxyMappings(dataDir, report);

  const data: SeedData = {
    schools,
    sources,
    allocations,
    endowmentReturns,
    benchmarkReturns,
    proxyMappings,
  };

  validateCrossFile(data, report);

  return { data, report };
}

// ---------------------------------------------------------------------------
// Write to Neon
// ---------------------------------------------------------------------------

async function writeSeedData(data: SeedData) {
  // Imported lazily so `--dry-run` works without DATABASE_URL set.
  const { db } = await import("../src/lib/db");
  const t = await import("../src/lib/db/schema");
  const { inArray, sql } = await import("drizzle-orm");

  /**
   * Removes rows whose natural key is no longer in the seed files, so deleting
   * a row from `data/` actually removes it from the database. Fact tables are
   * pruned before dimension rows are upserted and dimensions after facts are
   * written, which keeps foreign keys satisfied at every step.
   */
  async function prune(
    label: string,
    rows: { id: number | string; key: string }[],
    keepKeys: Set<string>,
    deleteByIds: (ids: (number | string)[]) => Promise<unknown>,
  ): Promise<number> {
    const stale = rows.filter((r) => !keepKeys.has(r.key)).map((r) => r.id);
    if (stale.length > 0) {
      await deleteByIds(stale);
      console.log(`  pruned ${stale.length} stale row(s) from ${label}`);
    }
    return stale.length;
  }

  // --- prune facts -------------------------------------------------------
  const existingAllocations = await db
    .select({
      id: t.allocations.id,
      schoolId: t.allocations.schoolId,
      fiscalYear: t.allocations.fiscalYear,
      category: t.allocations.category,
    })
    .from(t.allocations);
  await prune(
    "allocations",
    existingAllocations.map((r) => ({
      id: r.id,
      key: `${r.schoolId}|${r.fiscalYear}|${r.category}`,
    })),
    new Set(data.allocations.map((a) => `${a.schoolId}|${a.fiscalYear}|${a.category}`)),
    (ids) => db.delete(t.allocations).where(inArray(t.allocations.id, ids as number[])),
  );

  const existingReturns = await db
    .select({
      id: t.endowmentReturns.id,
      schoolId: t.endowmentReturns.schoolId,
      fiscalYear: t.endowmentReturns.fiscalYear,
    })
    .from(t.endowmentReturns);
  await prune(
    "endowment_returns",
    existingReturns.map((r) => ({ id: r.id, key: `${r.schoolId}|${r.fiscalYear}` })),
    new Set(data.endowmentReturns.map((r) => `${r.schoolId}|${r.fiscalYear}`)),
    (ids) => db.delete(t.endowmentReturns).where(inArray(t.endowmentReturns.id, ids as number[])),
  );

  const existingBenchmarks = await db
    .select({
      id: t.benchmarkReturns.id,
      series: t.benchmarkReturns.series,
      fiscalYear: t.benchmarkReturns.fiscalYear,
    })
    .from(t.benchmarkReturns);
  await prune(
    "benchmark_returns",
    existingBenchmarks.map((r) => ({ id: r.id, key: `${r.series}|${r.fiscalYear}` })),
    new Set(data.benchmarkReturns.map((b) => `${b.series}|${b.fiscalYear}`)),
    (ids) => db.delete(t.benchmarkReturns).where(inArray(t.benchmarkReturns.id, ids as number[])),
  );

  const existingProxies = await db
    .select({ category: t.proxyMappings.category })
    .from(t.proxyMappings);
  await prune(
    "proxy_mappings",
    existingProxies.map((r) => ({ id: r.category, key: r.category })),
    new Set(data.proxyMappings.map((p) => p.category)),
    (ids) => db.delete(t.proxyMappings).where(inArray(t.proxyMappings.category, ids as string[])),
  );

  // --- upsert dimensions -------------------------------------------------
  if (data.schools.length > 0) {
    await db
      .insert(t.schools)
      .values(data.schools)
      .onConflictDoUpdate({
        target: t.schools.id,
        set: {
          name: sql`excluded.name`,
          managerName: sql`excluded.manager_name`,
          website: sql`excluded.website`,
        },
      });
  }

  if (data.sources.length > 0) {
    await db
      .insert(t.sources)
      .values(data.sources)
      .onConflictDoUpdate({
        target: t.sources.id,
        set: {
          title: sql`excluded.title`,
          publisher: sql`excluded.publisher`,
          url: sql`excluded.url`,
          documentType: sql`excluded.document_type`,
          page: sql`excluded.page`,
          accessedDate: sql`excluded.accessed_date`,
          notes: sql`excluded.notes`,
        },
      });
  }

  // --- upsert facts ------------------------------------------------------
  if (data.allocations.length > 0) {
    await db
      .insert(t.allocations)
      .values(
        data.allocations.map((a) => ({
          schoolId: a.schoolId,
          fiscalYear: a.fiscalYear,
          category: a.category,
          pct: String(a.pct),
          sourceLabel: a.sourceLabel,
          sourceId: a.sourceId,
        })),
      )
      .onConflictDoUpdate({
        target: [t.allocations.schoolId, t.allocations.fiscalYear, t.allocations.category],
        set: {
          pct: sql`excluded.pct`,
          sourceLabel: sql`excluded.source_label`,
          sourceId: sql`excluded.source_id`,
        },
      });
  }

  if (data.endowmentReturns.length > 0) {
    await db
      .insert(t.endowmentReturns)
      .values(
        data.endowmentReturns.map((r) => ({
          schoolId: r.schoolId,
          fiscalYear: r.fiscalYear,
          returnPct: r.returnPct === null ? null : String(r.returnPct),
          marketValueUsdMillions:
            r.marketValueUsdMillions === null ? null : String(r.marketValueUsdMillions),
          sourceId: r.sourceId,
        })),
      )
      .onConflictDoUpdate({
        target: [t.endowmentReturns.schoolId, t.endowmentReturns.fiscalYear],
        set: {
          returnPct: sql`excluded.return_pct`,
          marketValueUsdMillions: sql`excluded.market_value_usd_millions`,
          sourceId: sql`excluded.source_id`,
        },
      });
  }

  if (data.benchmarkReturns.length > 0) {
    await db
      .insert(t.benchmarkReturns)
      .values(
        data.benchmarkReturns.map((b) => ({
          series: b.series,
          fiscalYear: b.fiscalYear,
          returnPct: String(b.returnPct),
          sourceId: b.sourceId,
        })),
      )
      .onConflictDoUpdate({
        target: [t.benchmarkReturns.series, t.benchmarkReturns.fiscalYear],
        set: {
          returnPct: sql`excluded.return_pct`,
          sourceId: sql`excluded.source_id`,
        },
      });
  }

  if (data.proxyMappings.length > 0) {
    await db
      .insert(t.proxyMappings)
      .values(data.proxyMappings)
      .onConflictDoUpdate({
        target: t.proxyMappings.category,
        set: {
          etfTicker: sql`excluded.etf_ticker`,
          etfName: sql`excluded.etf_name`,
          rationale: sql`excluded.rationale`,
          honestyNote: sql`excluded.honesty_note`,
          sourceId: sql`excluded.source_id`,
        },
      });
  }

  // --- prune dimensions (after facts, so nothing still references them) --
  const existingSources = await db.select({ id: t.sources.id }).from(t.sources);
  await prune(
    "sources",
    existingSources.map((r) => ({ id: r.id, key: r.id })),
    new Set(data.sources.map((s) => s.id)),
    (ids) => db.delete(t.sources).where(inArray(t.sources.id, ids as string[])),
  );

  const existingSchools = await db.select({ id: t.schools.id }).from(t.schools);
  await prune(
    "schools",
    existingSchools.map((r) => ({ id: r.id, key: r.id })),
    new Set(data.schools.map((s) => s.id)),
    (ids) => db.delete(t.schools).where(inArray(t.schools.id, ids as string[])),
  );
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function parseArgs(argv: string[]): { dryRun: boolean; dataDir: string } {
  let dryRun = false;
  let dataDir = path.join(process.cwd(), "data");

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      dryRun = true;
    } else if (arg === "--data-dir") {
      const value = argv[++i];
      if (value === undefined) throw new Error("--data-dir needs a path");
      dataDir = path.resolve(value);
    } else {
      throw new Error(`unknown argument \`${arg}\` (expected --dry-run or --data-dir <path>)`);
    }
  }

  return { dryRun, dataDir };
}

async function main() {
  const { dryRun, dataDir } = parseArgs(process.argv.slice(2));

  console.log(`Reading seed files from ${path.relative(process.cwd(), dataDir) || "."}/`);
  const { data, report } = loadSeedData(dataDir);

  const counts = [
    `${data.schools.length} school(s)`,
    `${data.sources.length} source(s)`,
    `${data.allocations.length} allocation row(s)`,
    `${data.endowmentReturns.length} endowment return row(s)`,
    `${data.benchmarkReturns.length} benchmark return row(s)`,
    `${data.proxyMappings.length} proxy mapping(s)`,
  ];
  console.log(`Parsed: ${counts.join(", ")}`);

  for (const w of report.warnings) {
    console.warn(`  warning  ${w.where}: ${w.message}`);
  }

  if (report.errors.length > 0) {
    console.error(`\n${report.errors.length} validation error(s) — nothing was written:\n`);
    for (const e of report.errors) {
      console.error(`  ${e.where}: ${e.message}`);
    }
    console.error("\nFix the files in data/ and re-run. The database is untouched.");
    process.exit(1);
  }

  console.log(
    `Validation passed${report.warnings.length > 0 ? ` (${report.warnings.length} warning(s))` : ""}.`,
  );

  if (dryRun) {
    console.log("--dry-run: skipping the database write.");
    return;
  }

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set — run `vercel env pull .env.local` first.");
    process.exit(1);
  }

  console.log("Writing to Neon…");
  await writeSeedData(data);
  console.log("Seed complete.");
}

main().catch((err) => {
  console.error(`\nSeed failed: ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
