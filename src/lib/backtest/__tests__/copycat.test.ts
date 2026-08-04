import { describe, expect, it } from "vitest";
import type { AllocationCategory } from "../../constants";
import type { AllocationRow } from "../../queries";
import { toSeriesData } from "../engine";
import { rollingCopycatYearly } from "../copycat";

// Hand-computed case:
//   Disclosed mixes: FY2001 = 100% US equity; FY2003 = 50% US equity / 50% bonds
//   Series: sp500 FY2002 +10, FY2003 +20, FY2004 +10; bonds FY2002–04 +5 each
//   FY2002 uses the FY2001 mix (latest before 2002): 100% sp500 → +10
//   FY2003 uses the FY2001 mix (latest before 2003 is still 2001): → +20
//   FY2004 uses the FY2003 mix: 0.5×10 + 0.5×5 = 7.5

const alloc = (
  fiscalYear: number,
  category: AllocationCategory,
  pct: number,
): AllocationRow => ({ fiscalYear, category, pct, basis: "actual", sourceLabel: null, sourceId: "s" });

const series = toSeriesData([
  { series: "sp500", fiscalYear: 2002, returnPct: 10 },
  { series: "sp500", fiscalYear: 2003, returnPct: 20 },
  { series: "sp500", fiscalYear: 2004, returnPct: 10 },
  { series: "us_aggregate_bond", fiscalYear: 2002, returnPct: 5 },
  { series: "us_aggregate_bond", fiscalYear: 2003, returnPct: 5 },
  { series: "us_aggregate_bond", fiscalYear: 2004, returnPct: 5 },
]);

const rows = [
  alloc(2001, "us_public_equity", 100),
  alloc(2003, "us_public_equity", 50),
  alloc(2003, "fixed_income_cash", 50),
];

const NO_GAPS = new Set<AllocationCategory>();

describe("rollingCopycatYearly", () => {
  it("uses the latest mix disclosed BEFORE each fiscal year, holding through gaps", () => {
    const r = rollingCopycatYearly(rows, NO_GAPS, series, 2002, 2004);
    expect(r.yearly.map((y) => [y.fiscalYear, y.mixYear, y.returnPct])).toEqual([
      [2002, 2001, 10],
      [2003, 2001, 20], // FY2002 disclosed nothing — FY2001's mix is held
      [2004, 2003, 7.5],
    ]);
    expect(r.computable).toBe(true);
    expect(r.lastMixYear).toBe(2003);
  });

  it("years before the first disclosed mix are not computable", () => {
    const r = rollingCopycatYearly(rows, NO_GAPS, series, 2001, 2002);
    expect(r.yearly[0]).toMatchObject({ fiscalYear: 2001, mixYear: null, returnPct: null });
    expect(r.yearly[1].returnPct).toBe(10);
    expect(r.computable).toBe(false);
  });

  it("tracks the covered-sleeve coverage range across years", () => {
    const gaps = new Set<AllocationCategory>(["fixed_income_cash"]);
    const r = rollingCopycatYearly(rows, gaps, series, 2002, 2004);
    // FY2002/03: mix is 100% us_public_equity → coverage 100.
    // FY2004: 50/50 mix with bonds uncovered → coverage 50, renormalized → +10.
    expect(r.yearly[2].returnPct).toBeCloseTo(10, 10);
    expect(r.coverageMinPct).toBe(50);
    expect(r.coverageMaxPct).toBe(100);
  });
});
