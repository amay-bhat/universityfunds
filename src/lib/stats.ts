// Pure return-series math shared by the school pages and the backtest engine.
// Financial math rule (CLAUDE.md non-negotiable 6): everything here is covered
// by unit tests with hand-computed expected values in src/lib/__tests__/.

// Geometric annualized return from a list of yearly percentage returns.
// Returns null when the list is empty — never 0, which would look like a
// real result.
export function annualizedReturnPct(yearlyPcts: readonly number[]): number | null {
  if (yearlyPcts.length === 0) return null;
  let growth = 1;
  for (const pct of yearlyPcts) growth *= 1 + pct / 100;
  if (growth <= 0) return null; // total wipeout has no real geometric mean
  return (Math.pow(growth, 1 / yearlyPcts.length) - 1) * 100;
}

// Cumulative growth of a starting amount through a series of yearly returns.
// Returns the value AFTER each year, in order (length matches input).
export function growthSeries(startValue: number, yearlyPcts: readonly number[]): number[] {
  const out: number[] = [];
  let value = startValue;
  for (const pct of yearlyPcts) {
    value *= 1 + pct / 100;
    out.push(value);
  }
  return out;
}

export type BestWorst = {
  best: { fiscalYear: number; returnPct: number };
  worst: { fiscalYear: number; returnPct: number };
};

export function bestWorstYear(
  rows: readonly { fiscalYear: number; returnPct: number }[],
): BestWorst | null {
  if (rows.length === 0) return null;
  let best = rows[0];
  let worst = rows[0];
  for (const r of rows) {
    if (r.returnPct > best.returnPct) best = r;
    if (r.returnPct < worst.returnPct) worst = r;
  }
  return {
    best: { fiscalYear: best.fiscalYear, returnPct: best.returnPct },
    worst: { fiscalYear: worst.fiscalYear, returnPct: worst.returnPct },
  };
}

// Trailing-window annualized return ending at the latest available year.
// The window must be complete and contiguous — a school with a missing year
// inside the window gets null, not a bridged number (no gap is ever smoothed;
// Checkpoint A ruling).
export function trailingAnnualizedPct(
  rows: readonly { fiscalYear: number; returnPct: number | null }[],
  windowYears: number,
): number | null {
  const withReturns = rows.filter((r) => r.returnPct !== null);
  if (withReturns.length === 0) return null;
  const lastYear = Math.max(...withReturns.map((r) => r.fiscalYear));
  const wanted: number[] = [];
  for (let y = lastYear - windowYears + 1; y <= lastYear; y++) wanted.push(y);
  const byYear = new Map(withReturns.map((r) => [r.fiscalYear, r.returnPct as number]));
  const pcts: number[] = [];
  for (const y of wanted) {
    const pct = byYear.get(y);
    if (pct === undefined) return null; // gap inside the window — not computable
    pcts.push(pct);
  }
  return annualizedReturnPct(pcts);
}
