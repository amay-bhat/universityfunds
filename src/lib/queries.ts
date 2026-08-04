import { asc } from "drizzle-orm";
import { eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  allocations,
  benchmarkReturns,
  endowmentReturns,
  proxyMappings,
  schools,
  sources,
} from "./db/schema";
import {
  SCHOOL_IDS,
  type AllocationBasis,
  type AllocationCategory,
  type BenchmarkSeries,
  type SchoolId,
} from "./constants";

// The only database touchpoint for pages. Every function returns plain typed
// rows with numerics converted to number (drizzle returns Postgres numeric as
// string to avoid precision loss; our columns are scale ≤ 3 so number is safe).
// Coverage gaps are returned as missing rows, never silently filled — the
// charts annotate them (Checkpoint A ruling: gaps labelled at point of display).

export type School = {
  id: SchoolId;
  name: string;
  managerName: string | null;
  website: string | null;
};

export type AllocationRow = {
  fiscalYear: number;
  category: AllocationCategory;
  pct: number;
  basis: AllocationBasis;
  sourceLabel: string | null;
  sourceId: string;
};

export type EndowmentReturnRow = {
  fiscalYear: number;
  returnPct: number | null;
  marketValueUsdMillions: number | null;
  returnSourceId: string | null;
  marketValueSourceId: string | null;
};

export type BenchmarkReturnRow = {
  series: BenchmarkSeries;
  fiscalYear: number;
  returnPct: number;
  sourceId: string;
};

export type ProxyMapping = {
  category: AllocationCategory;
  etfTicker: string;
  etfName: string;
  rationale: string;
  honestyNote: string;
  sourceId: string | null;
};

export type Source = {
  id: string;
  title: string;
  publisher: string | null;
  url: string | null;
  documentType: string;
  page: string | null;
  accessedDate: string | null;
  notes: string | null;
};

export function isSchoolId(value: string): value is SchoolId {
  return (SCHOOL_IDS as readonly string[]).includes(value);
}

export async function getSchools(): Promise<School[]> {
  const rows = await db.select().from(schools);
  // Present in the project's canonical order, not alphabetical.
  const order = new Map(SCHOOL_IDS.map((id, i) => [id, i]));
  return rows
    .map((r) => ({ ...r, id: r.id as SchoolId }))
    .sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));
}

export async function getSchool(id: SchoolId): Promise<School | null> {
  const rows = await db.select().from(schools).where(eq(schools.id, id));
  const r = rows[0];
  return r ? { ...r, id: r.id as SchoolId } : null;
}

export async function getAllocations(schoolId: SchoolId): Promise<AllocationRow[]> {
  const rows = await db
    .select()
    .from(allocations)
    .where(eq(allocations.schoolId, schoolId))
    .orderBy(asc(allocations.fiscalYear), asc(allocations.category));
  return rows.map((r) => ({
    fiscalYear: r.fiscalYear,
    category: r.category as AllocationCategory,
    pct: Number(r.pct),
    basis: r.basis as AllocationBasis,
    sourceLabel: r.sourceLabel,
    sourceId: r.sourceId,
  }));
}

export async function getEndowmentReturns(schoolId: SchoolId): Promise<EndowmentReturnRow[]> {
  const rows = await db
    .select()
    .from(endowmentReturns)
    .where(eq(endowmentReturns.schoolId, schoolId))
    .orderBy(asc(endowmentReturns.fiscalYear));
  return rows.map((r) => ({
    fiscalYear: r.fiscalYear,
    returnPct: r.returnPct === null ? null : Number(r.returnPct),
    marketValueUsdMillions:
      r.marketValueUsdMillions === null ? null : Number(r.marketValueUsdMillions),
    returnSourceId: r.returnSourceId,
    marketValueSourceId: r.marketValueSourceId,
  }));
}

export async function getBenchmarkReturns(
  seriesFilter?: readonly BenchmarkSeries[],
): Promise<BenchmarkReturnRow[]> {
  const rows = seriesFilter
    ? await db
        .select()
        .from(benchmarkReturns)
        .where(inArray(benchmarkReturns.series, [...seriesFilter]))
        .orderBy(asc(benchmarkReturns.series), asc(benchmarkReturns.fiscalYear))
    : await db
        .select()
        .from(benchmarkReturns)
        .orderBy(asc(benchmarkReturns.series), asc(benchmarkReturns.fiscalYear));
  return rows.map((r) => ({
    series: r.series as BenchmarkSeries,
    fiscalYear: r.fiscalYear,
    returnPct: Number(r.returnPct),
    sourceId: r.sourceId,
  }));
}

export async function getProxyMappings(): Promise<ProxyMapping[]> {
  const rows = await db.select().from(proxyMappings).orderBy(asc(proxyMappings.category));
  return rows.map((r) => ({
    category: r.category as AllocationCategory,
    etfTicker: r.etfTicker,
    etfName: r.etfName,
    rationale: r.rationale,
    honestyNote: r.honestyNote,
    sourceId: r.sourceId,
  }));
}

export async function getSources(): Promise<Source[]> {
  return db.select().from(sources).orderBy(asc(sources.id));
}
