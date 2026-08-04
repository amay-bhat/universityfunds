// The backtest engine (task 4.1) — the most correctness-critical code in the
// app. Pure functions, no I/O: series data and mappings come in as arguments,
// results go out as values. Unit tests with hand-computed expected values live
// in ./__tests__/engine.test.ts (CLAUDE.md non-negotiable 6).
//
// Model (stated in the fine print wherever results render): ANNUAL REBALANCING
// — each fiscal year's portfolio return is the weight-dot-product of that
// year's proxy-series returns, weights reset every year. No taxes, no fees.
//
// The explicit-gap sleeve (task 1.7 / spec Q-001): a category whose proxy
// mapping carries NO_PROXY_TICKER is an UNCOVERED slice. The engine computes
// on the covered sleeve renormalized to 100% and always reports the uncovered
// fraction — it never renormalizes silently. A fiscal year missing a needed
// series value is reported "not computable", never skipped.

import {
  CATEGORY_TO_BENCHMARK_SERIES,
  NO_PROXY_TICKER,
  type AllocationCategory,
  type BenchmarkSeries,
} from "../constants";
import { annualizedReturnPct, bestWorstYear, type BestWorst } from "../stats";

export type SeriesData = Partial<Record<BenchmarkSeries, Map<number, number>>>;

export type Weight = { category: AllocationCategory; pct: number };

export type YearResult = {
  fiscalYear: number;
  returnPct: number | null;
  missingSeries: BenchmarkSeries[]; // why null, when null
};

export type BacktestResult = {
  startFY: number;
  endFY: number;
  // Shares of the ORIGINAL mix (before renormalization), in percentage points:
  coveredWeightPct: number;
  uncoveredWeightPct: number;
  uncovered: Weight[]; // the explicit-gap slices, for labelling
  inputSumPct: number; // what the input weights actually summed to
  yearly: YearResult[];
  computable: boolean; // true iff every year in the window computed
  annualizedPct: number | null;
  growthOf10k: { fiscalYear: number; value: number }[] | null; // includes the $10,000 start point at startFY-1
  bestWorst: BestWorst | null;
};

const SUM_TOLERANCE = 1.0; // matches the seed validator's allocation tolerance

export class BacktestInputError extends Error {}

// Which categories are uncovered, per the proxy table's sentinel rows.
export function uncoveredCategories(
  mappings: readonly { category: AllocationCategory; etfTicker: string }[],
): Set<AllocationCategory> {
  return new Set(
    mappings.filter((m) => m.etfTicker === NO_PROXY_TICKER).map((m) => m.category),
  );
}

// Backtest a category-weight mix (a school-year allocation).
export function backtestAllocation(
  weights: readonly Weight[],
  gapCategories: ReadonlySet<AllocationCategory>,
  series: SeriesData,
  startFY: number,
  endFY: number,
): BacktestResult {
  if (weights.length === 0) throw new BacktestInputError("empty weights");
  if (endFY < startFY) throw new BacktestInputError(`window reversed: FY${startFY}–FY${endFY}`);

  const inputSumPct = weights.reduce((s, w) => s + w.pct, 0);
  if (Math.abs(inputSumPct - 100) > SUM_TOLERANCE) {
    throw new BacktestInputError(
      `weights sum to ${inputSumPct.toFixed(2)}%, outside the ±${SUM_TOLERANCE}pp tolerance`,
    );
  }

  const covered = weights.filter((w) => !gapCategories.has(w.category));
  const uncovered = weights.filter((w) => gapCategories.has(w.category));
  const coveredWeightPct = covered.reduce((s, w) => s + w.pct, 0);
  const uncoveredWeightPct = uncovered.reduce((s, w) => s + w.pct, 0);

  // Renormalize the covered sleeve to 100% — explicitly reported via
  // coveredWeightPct/uncoveredWeightPct above, never hidden.
  if (coveredWeightPct <= 0) {
    return {
      startFY,
      endFY,
      coveredWeightPct,
      uncoveredWeightPct,
      uncovered: [...uncovered],
      inputSumPct,
      yearly: [],
      computable: false,
      annualizedPct: null,
      growthOf10k: null,
      bestWorst: null,
    };
  }

  const seriesWeights: { series: BenchmarkSeries; share: number }[] = covered.map((w) => {
    const s = CATEGORY_TO_BENCHMARK_SERIES[w.category];
    if (s === null) {
      throw new BacktestInputError(`category ${w.category} maps to no benchmark series`);
    }
    return { series: s, share: w.pct / coveredWeightPct };
  });

  const base = backtestSeriesShares(seriesWeights, series, startFY, endFY);
  return {
    ...base,
    coveredWeightPct,
    uncoveredWeightPct,
    uncovered: [...uncovered],
    inputSumPct,
  };
}

// Backtest explicit series shares (shares sum to 1). Used directly for the
// composite benchmarks — 60/40 and 70/30 are computed here at query time from
// sp500 + us_aggregate_bond, never stored (one source of truth per series).
export function backtestSeriesShares(
  shares: readonly { series: BenchmarkSeries; share: number }[],
  series: SeriesData,
  startFY: number,
  endFY: number,
): BacktestResult {
  if (endFY < startFY) throw new BacktestInputError(`window reversed: FY${startFY}–FY${endFY}`);
  const yearly: YearResult[] = [];
  for (let fy = startFY; fy <= endFY; fy++) {
    const missing: BenchmarkSeries[] = [];
    let ret = 0;
    for (const { series: s, share } of shares) {
      const value = series[s]?.get(fy);
      if (value === undefined) {
        if (!missing.includes(s)) missing.push(s);
        continue;
      }
      ret += share * value;
    }
    yearly.push({
      fiscalYear: fy,
      returnPct: missing.length === 0 ? ret : null,
      missingSeries: missing,
    });
  }

  const computable = yearly.every((y) => y.returnPct !== null);
  let annualizedPct: number | null = null;
  let growthOf10k: { fiscalYear: number; value: number }[] | null = null;
  let bw: BestWorst | null = null;
  if (computable) {
    const pcts = yearly.map((y) => y.returnPct as number);
    annualizedPct = annualizedReturnPct(pcts);
    let value = 10_000;
    growthOf10k = [{ fiscalYear: startFY - 1, value }];
    for (const y of yearly) {
      value *= 1 + (y.returnPct as number) / 100;
      growthOf10k.push({ fiscalYear: y.fiscalYear, value });
    }
    bw = bestWorstYear(
      yearly.map((y) => ({ fiscalYear: y.fiscalYear, returnPct: y.returnPct as number })),
    );
  }

  return {
    startFY,
    endFY,
    coveredWeightPct: 100,
    uncoveredWeightPct: 0,
    uncovered: [],
    inputSumPct: 100,
    yearly,
    computable,
    annualizedPct,
    growthOf10k,
    bestWorst: bw,
  };
}

export const COMPOSITES = {
  sixty_forty: [
    { series: "sp500" as BenchmarkSeries, share: 0.6 },
    { series: "us_aggregate_bond" as BenchmarkSeries, share: 0.4 },
  ],
  seventy_thirty: [
    { series: "sp500" as BenchmarkSeries, share: 0.7 },
    { series: "us_aggregate_bond" as BenchmarkSeries, share: 0.3 },
  ],
} as const;

// The window over which a given mix is backtestable: the intersection of the
// covered categories' series coverage. Returns null when no window exists.
export function computableWindow(
  weights: readonly Weight[],
  gapCategories: ReadonlySet<AllocationCategory>,
  series: SeriesData,
): { startFY: number; endFY: number } | null {
  let start = -Infinity;
  let end = Infinity;
  const covered = weights.filter((w) => !gapCategories.has(w.category) && w.pct !== 0);
  if (covered.length === 0) return null;
  for (const w of covered) {
    const s = CATEGORY_TO_BENCHMARK_SERIES[w.category];
    if (s === null) return null;
    const years = series[s];
    if (!years || years.size === 0) return null;
    const ys = [...years.keys()];
    start = Math.max(start, Math.min(...ys));
    end = Math.min(end, Math.max(...ys));
  }
  return start <= end ? { startFY: start, endFY: end } : null;
}

// Convenience: benchmark rows → SeriesData.
export function toSeriesData(
  rows: readonly { series: BenchmarkSeries; fiscalYear: number; returnPct: number }[],
): SeriesData {
  const out: SeriesData = {};
  for (const r of rows) {
    (out[r.series] ??= new Map()).set(r.fiscalYear, r.returnPct);
  }
  return out;
}
