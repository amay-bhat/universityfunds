import type { AllocationCategory } from "./constants";
import { isPoolUniverseSource } from "./constants";
import type { AllocationRow, BenchmarkReturnRow, EndowmentReturnRow } from "./queries";
import { CATEGORY_STACK_ORDER } from "./chart-theme";

// Pure transforms from DB rows to chart-ready shapes. Kept free of React and
// Recharts so they are unit-testable (src/lib/__tests__/chart-data.test.ts).
// Honesty rules encoded here, not in the components:
//   - the year domain is continuous from first to last DISCLOSED year, so a
//     missing year renders as a visible hole, never a bridged shape;
//   - nothing is interpolated or carried forward;
//   - basis (actual vs target) travels with every year so the chart can label
//     Harvard's pre-2017 policy-portfolio years (Checkpoint A ruling).

export type AllocationYear = {
  fiscalYear: number;
  basis: "actual" | "target" | null; // null = not disclosed this year (gap)
  // Which pot of money the year describes, derived from the row's citation.
  // Orthogonal to `basis`. null = not disclosed this year (gap).
  universe: "endowment" | "investment_pool" | null;
  values: Partial<Record<AllocationCategory, number>>;
};

export type AllocationChartData = {
  years: AllocationYear[];
  categoriesUsed: AllocationCategory[]; // in fixed stack order
  coverageStart: number;
  coverageEnd: number;
  gapYears: number[];
  // Every disclosed fiscal year whose rows are published targets, ascending.
  // A SET, never a "through FY n" range: MIT's only target year (FY2008) sits
  // mid-series with actual-basis years on both sides, so treating the maximum
  // as a boundary captioned three of MIT's actuals as targets. That bug shipped.
  targetYears: number[];
  // True only when the target years are a contiguous prefix of the disclosed
  // years (Harvard's shape). Only then may the chart say "through FY n".
  targetsFormPrefix: boolean;
  // Disclosed years measuring a wider pot than the endowment proper, ascending.
  poolYears: number[];
};

export function toAllocationChartData(rows: AllocationRow[]): AllocationChartData | null {
  if (rows.length === 0) return null;
  const byYear = new Map<number, AllocationRow[]>();
  for (const r of rows) {
    const list = byYear.get(r.fiscalYear) ?? [];
    list.push(r);
    byYear.set(r.fiscalYear, list);
  }
  const disclosed = [...byYear.keys()].sort((a, b) => a - b);
  const coverageStart = disclosed[0];
  const coverageEnd = disclosed[disclosed.length - 1];

  const usedSet = new Set<AllocationCategory>(rows.map((r) => r.category));
  const categoriesUsed = CATEGORY_STACK_ORDER.filter((c) => usedSet.has(c));

  const years: AllocationYear[] = [];
  const gapYears: number[] = [];
  const targetYears: number[] = [];
  const poolYears: number[] = [];
  for (let fy = coverageStart; fy <= coverageEnd; fy++) {
    const yearRows = byYear.get(fy);
    if (!yearRows) {
      gapYears.push(fy);
      years.push({ fiscalYear: fy, basis: null, universe: null, values: {} });
      continue;
    }
    const values: Partial<Record<AllocationCategory, number>> = {};
    for (const r of yearRows) values[r.category] = r.pct;
    // A school-year is entirely one basis (the seed validator enforces it).
    const basis = yearRows[0].basis;
    if (basis === "target") targetYears.push(fy);
    // Universe is derived from the citation, not stored. A year counts as
    // pool-basis only if every one of its rows cites a pool-universe document —
    // a mixed year would be a curation error, and defaulting it to "endowment"
    // keeps this from silently asserting the wider pot.
    const universe = yearRows.every((r) => isPoolUniverseSource(r.sourceId))
      ? "investment_pool"
      : "endowment";
    if (universe === "investment_pool") poolYears.push(fy);
    years.push({ fiscalYear: fy, basis, universe, values });
  }
  const disclosedAsc = disclosed;
  const targetsFormPrefix =
    targetYears.length > 0 &&
    targetYears.every((fy, i) => disclosedAsc[i] === fy);
  return {
    years,
    categoriesUsed,
    coverageStart,
    coverageEnd,
    gapYears,
    targetYears,
    targetsFormPrefix,
    poolYears,
  };
}

export type ReturnsChartPoint = {
  fiscalYear: number;
  school: number | null; // null = the school never published this year
  sp500: number | null; // clipped to the school's coverage window
};

// Domain = the school's own return coverage window; the S&P overlay is
// clipped to it (comparing identical fiscal-year windows, BRD-027).
export function toReturnsChartData(
  schoolRows: EndowmentReturnRow[],
  sp500Rows: BenchmarkReturnRow[],
): ReturnsChartPoint[] {
  const withReturns = schoolRows.filter((r) => r.returnPct !== null);
  if (withReturns.length === 0) return [];
  const years = withReturns.map((r) => r.fiscalYear);
  const start = Math.min(...years);
  const end = Math.max(...years);
  const school = new Map(withReturns.map((r) => [r.fiscalYear, r.returnPct as number]));
  const sp = new Map(sp500Rows.map((r) => [r.fiscalYear, r.returnPct]));
  const points: ReturnsChartPoint[] = [];
  for (let fy = start; fy <= end; fy++) {
    points.push({
      fiscalYear: fy,
      school: school.get(fy) ?? null,
      sp500: sp.get(fy) ?? null,
    });
  }
  return points;
}

export type MarketValuePoint = { fiscalYear: number; marketValueUsdMillions: number };

export function toMarketValueData(rows: EndowmentReturnRow[]): MarketValuePoint[] {
  return rows
    .filter((r) => r.marketValueUsdMillions !== null)
    .map((r) => ({
      fiscalYear: r.fiscalYear,
      marketValueUsdMillions: r.marketValueUsdMillions as number,
    }))
    .sort((a, b) => a.fiscalYear - b.fiscalYear);
}
