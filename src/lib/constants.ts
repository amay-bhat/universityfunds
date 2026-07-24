// Normalized allocation categories every school's own reporting is mapped into.
// One-to-one with proxy_mappings.category and benchmark_returns.series, so a
// school's allocation weight in a category can be backtested directly against
// that category's benchmark series / ETF proxy.
export const ALLOCATION_CATEGORIES = [
  "us_public_equity",
  "intl_public_equity",
  "fixed_income_cash",
  "absolute_return",
  "private_equity_vc",
  "real_assets",
  "other",
] as const;

export type AllocationCategory = (typeof ALLOCATION_CATEGORIES)[number];

export const ALLOCATION_CATEGORY_LABELS: Record<AllocationCategory, string> = {
  us_public_equity: "US Public Equity",
  intl_public_equity: "International Public Equity",
  fixed_income_cash: "Fixed Income & Cash",
  absolute_return: "Absolute Return / Hedge Funds",
  private_equity_vc: "Private Equity & Venture Capital",
  real_assets: "Real Assets (Real Estate, Natural Resources)",
  other: "Other / Unclassified",
};

// Benchmark/index return series, stored per fiscal year. Composite benchmarks
// shown in the Comparisons feature (60/40, 70/30, S&P 500 alone) are NOT
// stored separately — they're computed at query time from `sp500` and
// `us_aggregate_bond` by the backtest engine (task 4.1), so there is one
// source of truth for each underlying series.
export const BENCHMARK_SERIES = [
  "sp500",
  "intl_equity",
  "us_aggregate_bond",
  "hedge_fund_index",
  "public_pe_index",
  "reit",
  "cash",
] as const;

export type BenchmarkSeries = (typeof BENCHMARK_SERIES)[number];

// Which allocation category each benchmark series backtests as the proxy for.
export const CATEGORY_TO_BENCHMARK_SERIES: Record<
  AllocationCategory,
  BenchmarkSeries | null
> = {
  us_public_equity: "sp500",
  intl_public_equity: "intl_equity",
  fixed_income_cash: "us_aggregate_bond",
  absolute_return: "hedge_fund_index",
  private_equity_vc: "public_pe_index",
  real_assets: "reit",
  other: "cash",
};

export const SCHOOL_IDS = ["yale", "harvard", "stanford", "mit", "princeton"] as const;
export type SchoolId = (typeof SCHOOL_IDS)[number];
