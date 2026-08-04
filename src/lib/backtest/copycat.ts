// The rolling copycat used by the Compare page (task 5.1): for each fiscal
// year, hold the school's MOST RECENTLY DISCLOSED mix as of that year's start
// (i.e. the latest mix from a fiscal year strictly before it), rebalanced
// annually. Where the school stopped disclosing, the copycat keeps holding the
// last known mix — the same snapshot-vintage principle as task 4.3, applied
// year by year, and disclosed in the UI footnote.

import type { AllocationCategory } from "../constants";
import type { AllocationRow } from "../queries";
import {
  backtestAllocation,
  type SeriesData,
  type YearResult,
} from "./engine";

export type RollingCopycatResult = {
  yearly: (YearResult & { mixYear: number | null })[];
  computable: boolean; // every year in the window computed
  // Range of the ORIGINAL mix the covered sleeve represented, across years:
  coverageMinPct: number | null;
  coverageMaxPct: number | null;
  lastMixYear: number | null; // latest disclosed mix used anywhere in the window
};

export function rollingCopycatYearly(
  allocRows: readonly AllocationRow[],
  gapCategories: ReadonlySet<AllocationCategory>,
  series: SeriesData,
  startFY: number,
  endFY: number,
): RollingCopycatResult {
  const byYear = new Map<number, AllocationRow[]>();
  for (const r of allocRows) {
    const list = byYear.get(r.fiscalYear) ?? [];
    list.push(r);
    byYear.set(r.fiscalYear, list);
  }
  const mixYears = [...byYear.keys()].sort((a, b) => a - b);

  const yearly: (YearResult & { mixYear: number | null })[] = [];
  let coverageMin: number | null = null;
  let coverageMax: number | null = null;
  let lastMixYear: number | null = null;

  for (let fy = startFY; fy <= endFY; fy++) {
    // Latest disclosed mix strictly before this fiscal year begins.
    const candidates = mixYears.filter((y) => y < fy);
    const mixYear = candidates.length ? candidates[candidates.length - 1] : null;
    if (mixYear === null) {
      yearly.push({ fiscalYear: fy, returnPct: null, missingSeries: [], mixYear: null });
      continue;
    }
    lastMixYear = Math.max(lastMixYear ?? -Infinity, mixYear);
    const weights = (byYear.get(mixYear) ?? []).map((r) => ({
      category: r.category,
      pct: r.pct,
    }));
    const r = backtestAllocation(weights, gapCategories, series, fy, fy);
    const y = r.yearly[0];
    yearly.push({ ...y, mixYear });
    if (y.returnPct !== null) {
      coverageMin = Math.min(coverageMin ?? Infinity, r.coveredWeightPct);
      coverageMax = Math.max(coverageMax ?? -Infinity, r.coveredWeightPct);
    }
  }

  return {
    yearly,
    computable: yearly.every((y) => y.returnPct !== null),
    coverageMinPct: coverageMin,
    coverageMaxPct: coverageMax,
    lastMixYear,
  };
}
