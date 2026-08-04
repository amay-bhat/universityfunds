import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { AllocationCategory, BenchmarkSeries } from "../../constants";
import {
  BacktestInputError,
  COMPOSITES,
  backtestAllocation,
  backtestSeriesShares,
  computableWindow,
  toSeriesData,
  uncoveredCategories,
} from "../engine";

// All expected values below are computed BY HAND (CLAUDE.md non-negotiable 6).
//
// Toy series:
//   sp500:             FY2001 +10%, FY2002 −10%
//   us_aggregate_bond: FY2001 +5%,  FY2002 +5%
//
// 60/40 mix hand-computation:
//   FY2001: 0.6×10 + 0.4×5   = 8.0%
//   FY2002: 0.6×(−10) + 0.4×5 = −4.0%
//   growth of $10,000: 10,000 → 10,800 → 10,368
//   annualized: √(1.08 × 0.96) − 1 = √1.0368 − 1 = 1.8234%

const toy = toSeriesData([
  { series: "sp500", fiscalYear: 2001, returnPct: 10 },
  { series: "sp500", fiscalYear: 2002, returnPct: -10 },
  { series: "us_aggregate_bond", fiscalYear: 2001, returnPct: 5 },
  { series: "us_aggregate_bond", fiscalYear: 2002, returnPct: 5 },
]);

const NO_GAPS = new Set<AllocationCategory>();
const GAPS = new Set<AllocationCategory>(["absolute_return", "private_equity_vc"]);

const w = (category: AllocationCategory, pct: number) => ({ category, pct });

describe("backtestAllocation — hand-computed toy cases", () => {
  it("60/40 mix matches the hand computation exactly", () => {
    const r = backtestAllocation(
      [w("us_public_equity", 60), w("fixed_income_cash", 40)],
      NO_GAPS,
      toy,
      2001,
      2002,
    );
    expect(r.computable).toBe(true);
    expect(r.yearly.map((y) => y.returnPct)).toEqual([8, -4]);
    expect(r.growthOf10k).not.toBeNull();
    const g = r.growthOf10k!;
    expect(g[0]).toEqual({ fiscalYear: 2000, value: 10000 }); // the start point
    expect(g[1].value).toBeCloseTo(10800, 2);
    expect(g[2].value).toBeCloseTo(10368, 2);
    expect(r.annualizedPct).toBeCloseTo(1.8234, 3);
    expect(r.bestWorst).toEqual({
      best: { fiscalYear: 2001, returnPct: 8 },
      worst: { fiscalYear: 2002, returnPct: -4 },
    });
    expect(r.coveredWeightPct).toBe(100);
    expect(r.uncoveredWeightPct).toBe(0);
  });

  it("uncovered sleeve is renormalized AND reported, never hidden", () => {
    const r = backtestAllocation(
      [w("us_public_equity", 50), w("private_equity_vc", 50)],
      GAPS,
      toy,
      2001,
      2001,
    );
    expect(r.coveredWeightPct).toBe(50);
    expect(r.uncoveredWeightPct).toBe(50);
    expect(r.uncovered).toEqual([w("private_equity_vc", 50)]);
    // covered sleeve renormalized → 100% sp500 → FY2001 = +10%
    expect(r.yearly[0].returnPct).toBeCloseTo(10, 10);
  });

  it("a year with a missing series value is not computable — never skipped", () => {
    const r = backtestAllocation(
      [w("us_public_equity", 60), w("fixed_income_cash", 40)],
      NO_GAPS,
      toy,
      2001,
      2003, // FY2003 has no data in either series
    );
    expect(r.computable).toBe(false);
    expect(r.yearly[2].returnPct).toBeNull();
    expect(r.yearly[2].missingSeries).toContain("sp500");
    expect(r.annualizedPct).toBeNull();
    expect(r.growthOf10k).toBeNull();
    // the computable years are still reported individually
    expect(r.yearly[0].returnPct).toBe(8);
  });

  it("weights summing to 99.9 (seed tolerance) renormalize with the sum recorded", () => {
    // Hand: shares 59.9/99.9 and 40/99.9 → FY2001 = 5.99600 + 2.00200 = 7.99800
    const r = backtestAllocation(
      [w("us_public_equity", 59.9), w("fixed_income_cash", 40)],
      NO_GAPS,
      toy,
      2001,
      2001,
    );
    expect(r.inputSumPct).toBeCloseTo(99.9, 10);
    expect(r.yearly[0].returnPct).toBeCloseTo(7.998, 3);
  });

  it("a levered (negative) weight computes as published — Yale's negative cash", () => {
    // Hand: 1.05×10 + (−0.05)×5 = 10.5 − 0.25 = 10.25
    const r = backtestAllocation(
      [w("us_public_equity", 105), w("fixed_income_cash", -5)],
      NO_GAPS,
      toy,
      2001,
      2001,
    );
    expect(r.yearly[0].returnPct).toBeCloseTo(10.25, 10);
  });

  it("rejects weights outside the ±1pp tolerance", () => {
    expect(() =>
      backtestAllocation([w("us_public_equity", 60), w("fixed_income_cash", 30)], NO_GAPS, toy, 2001, 2001),
    ).toThrow(BacktestInputError);
  });

  it("rejects a reversed window", () => {
    expect(() =>
      backtestAllocation([w("us_public_equity", 100)], NO_GAPS, toy, 2002, 2001),
    ).toThrow(BacktestInputError);
  });

  it("an entirely-uncovered mix is not computable", () => {
    const r = backtestAllocation(
      [w("private_equity_vc", 60), w("absolute_return", 40)],
      GAPS,
      toy,
      2001,
      2001,
    );
    expect(r.computable).toBe(false);
    expect(r.coveredWeightPct).toBe(0);
    expect(r.uncoveredWeightPct).toBe(100);
  });
});

describe("computableWindow", () => {
  it("intersects the covered series' coverage", () => {
    const series = toSeriesData([
      { series: "sp500", fiscalYear: 2001, returnPct: 1 },
      { series: "sp500", fiscalYear: 2002, returnPct: 1 },
      { series: "us_aggregate_bond", fiscalYear: 2002, returnPct: 1 },
      { series: "us_aggregate_bond", fiscalYear: 2003, returnPct: 1 },
    ]);
    expect(
      computableWindow(
        [w("us_public_equity", 60), w("fixed_income_cash", 40)],
        NO_GAPS,
        series,
      ),
    ).toEqual({ startFY: 2002, endFY: 2002 });
  });

  it("gap categories don't constrain the window", () => {
    const series = toSeriesData([{ series: "sp500", fiscalYear: 2001, returnPct: 1 }]);
    expect(
      computableWindow([w("us_public_equity", 50), w("absolute_return", 50)], GAPS, series),
    ).toEqual({ startFY: 2001, endFY: 2001 });
  });

  it("null when nothing is covered", () => {
    expect(computableWindow([w("absolute_return", 100)], GAPS, toy)).toBeNull();
  });
});

describe("uncoveredCategories", () => {
  it("reads the NONE sentinel from the proxy table", () => {
    expect(
      uncoveredCategories([
        { category: "us_public_equity", etfTicker: "VOO" },
        { category: "absolute_return", etfTicker: "NONE" },
      ]),
    ).toEqual(new Set(["absolute_return"]));
  });
});

describe("real seeded data — the task-1.4-verified 60/40 case", () => {
  const raw = JSON.parse(
    readFileSync(path.resolve(__dirname, "../../../../data/benchmark_returns.json"), "utf8"),
  ) as { series: BenchmarkSeries; fiscalYear: number; returnPct: number }[];
  const real = toSeriesData(raw);

  it("60/40 FY2001 matches the hand computation from the seeded values", () => {
    // Seeded: sp500 FY2001 = −14.83, us_aggregate_bond FY2001 = 11.594
    // Hand: 0.6×(−14.83) + 0.4×11.594 = −8.898 + 4.6376 = −4.2604
    const r = backtestSeriesShares([...COMPOSITES.sixty_forty], real, 2001, 2001);
    expect(r.yearly[0].returnPct).toBeCloseTo(-4.2604, 4);
  });

  it("60/40 and 70/30 are computable across the full FY2000–FY2025 window", () => {
    for (const shares of [COMPOSITES.sixty_forty, COMPOSITES.seventy_thirty]) {
      const r = backtestSeriesShares([...shares], real, 2000, 2025);
      expect(r.computable).toBe(true);
      expect(r.yearly).toHaveLength(26);
    }
  });
});
