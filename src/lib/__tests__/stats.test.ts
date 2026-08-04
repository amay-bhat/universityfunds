import { describe, expect, it } from "vitest";
import {
  annualizedReturnPct,
  bestWorstYear,
  growthSeries,
  trailingAnnualizedPct,
} from "../stats";

// Financial-math rule (CLAUDE.md non-negotiable 6): expected values below are
// computed BY HAND, not by the code under test.
//
// Toy series 10%, −10%, +20%:
//   growth factor = 1.10 × 0.90 × 1.20 = 1.188
//   annualized    = 1.188^(1/3) − 1 = 0.059105 → 5.9105%
//   growth of $10,000 = 11,000 → 9,900 → 11,880

describe("annualizedReturnPct", () => {
  it("matches the hand-computed 3-year toy case", () => {
    expect(annualizedReturnPct([10, -10, 20])).toBeCloseTo(5.9105, 3);
  });

  it("single year annualizes to itself", () => {
    expect(annualizedReturnPct([20])).toBeCloseTo(20, 10);
  });

  it("empty input is null, never 0", () => {
    expect(annualizedReturnPct([])).toBeNull();
  });

  it("total wipeout has no geometric mean", () => {
    expect(annualizedReturnPct([-100])).toBeNull();
  });
});

describe("growthSeries", () => {
  it("matches the hand-computed toy case to the cent", () => {
    const g = growthSeries(10000, [10, -10, 20]);
    expect(g).toHaveLength(3);
    expect(g[0]).toBeCloseTo(11000, 2);
    expect(g[1]).toBeCloseTo(9900, 2);
    expect(g[2]).toBeCloseTo(11880, 2);
  });
});

describe("bestWorstYear", () => {
  it("finds best and worst including negatives", () => {
    const bw = bestWorstYear([
      { fiscalYear: 2001, returnPct: 10 },
      { fiscalYear: 2002, returnPct: -10 },
      { fiscalYear: 2003, returnPct: 20 },
    ]);
    expect(bw).toEqual({
      best: { fiscalYear: 2003, returnPct: 20 },
      worst: { fiscalYear: 2002, returnPct: -10 },
    });
  });

  it("empty input is null", () => {
    expect(bestWorstYear([])).toBeNull();
  });
});

describe("trailingAnnualizedPct", () => {
  const rows = [
    { fiscalYear: 2001, returnPct: 10 },
    { fiscalYear: 2002, returnPct: -10 },
    { fiscalYear: 2003, returnPct: 20 },
  ];

  it("full contiguous window matches the toy annualized value", () => {
    expect(trailingAnnualizedPct(rows, 3)).toBeCloseTo(5.9105, 3);
  });

  it("window of 1 is the latest year's return", () => {
    expect(trailingAnnualizedPct(rows, 1)).toBeCloseTo(20, 10);
  });

  it("a gap inside the window means not computable — never bridged", () => {
    const gappy = [
      { fiscalYear: 2001, returnPct: 10 },
      { fiscalYear: 2002, returnPct: null },
      { fiscalYear: 2003, returnPct: 20 },
    ];
    expect(trailingAnnualizedPct(gappy, 3)).toBeNull();
  });

  it("window longer than history is not computable", () => {
    expect(trailingAnnualizedPct(rows, 5)).toBeNull();
  });

  it("no returns at all (Stanford) is null", () => {
    expect(trailingAnnualizedPct([{ fiscalYear: 2020, returnPct: null }], 1)).toBeNull();
  });
});
