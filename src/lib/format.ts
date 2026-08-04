import type { SchoolId } from "./constants";

// Percent for display: one decimal, explicit sign on negatives only.
// Data is stored to 3 decimals; display rounds to 1.
export function formatPct(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Market values are stored in USD millions. Display in billions above 1000.
export function formatUsdMillions(millions: number): string {
  if (millions >= 1000) {
    const billions = millions / 1000;
    return `$${billions.toFixed(billions >= 100 ? 0 : 1)}B`;
  }
  return `$${millions.toFixed(0)}M`;
}

export function formatDollars(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

// Fiscal-year label. Four schools' fiscal years end June 30; Stanford's ends
// August 31 — the ~2-month offset must be disclosed at the point of display
// (data/README.md, BRD-027), which is why this helper exists at all.
export function fyLabel(fiscalYear: number): string {
  return `FY${fiscalYear}`;
}

export function fyWindow(schoolId: SchoolId, fiscalYear: number): string {
  if (schoolId === "stanford") {
    return `Sep ${fiscalYear - 1}–Aug ${fiscalYear}`;
  }
  return `Jul ${fiscalYear - 1}–Jun ${fiscalYear}`;
}
