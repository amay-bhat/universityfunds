// Normalized allocation categories every school's own reporting is mapped into.
// One-to-one with proxy_mappings.category and benchmark_returns.series, so a
// school's allocation weight in a category can be backtested directly against
// that category's benchmark series / ETF proxy.
// `public_equity` is deliberately coarser than the two split equity categories
// and overlaps them conceptually. It exists because some schools publish public
// equity as a single line with no geographic split (Harvard, FY2017 onward),
// and the alternatives were both worse: recording an unsplit figure under a US
// label misstates it (Article 4), and merging the split categories project-wide
// would discard a distinction two schools do disclose *and* leave the merged
// category without an honest benchmark before FY2009, since no cheap global
// equity fund existed earlier. Store what the school disclosed, at the
// granularity it disclosed it — never finer, and never coarsened to suit the
// coarsest discloser. A school-year uses `public_equity` OR the two split
// categories, never both; the seed validator enforces that.
// Decided by the `[PROXY DECISION]` logged under task 1.5 in TASKS.md.
export const ALLOCATION_CATEGORIES = [
  "us_public_equity",
  "intl_public_equity",
  "public_equity",
  "fixed_income_cash",
  "absolute_return",
  "private_equity_vc",
  "real_assets",
  "other",
] as const;

// Whether an allocation row is what the school actually held at fiscal year end
// or the target it published in a policy portfolio. Both are real, citable
// figures, but they measure different things (intention vs. holdings) and must
// never be drawn as one unlabeled series.
export const ALLOCATION_BASES = ["actual", "target"] as const;
export type AllocationBasis = (typeof ALLOCATION_BASES)[number];
export const DEFAULT_ALLOCATION_BASIS: AllocationBasis = "actual";

export type AllocationCategory = (typeof ALLOCATION_CATEGORIES)[number];

export const ALLOCATION_CATEGORY_LABELS: Record<AllocationCategory, string> = {
  us_public_equity: "US Public Equity",
  intl_public_equity: "International Public Equity",
  public_equity: "Public Equity (US & international, not split)",
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
  "global_equity",
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
  // Instrument for `global_equity` is chosen in task 1.7 alongside the ETF
  // proxy, per task 1.4's principle that a category's benchmark series and its
  // proxy must be the same instrument. Front-runner: Vanguard Total World
  // (VT / VTWSX), whose first full fiscal year is FY2009 — which covers every
  // year any school currently needs, since Harvard's unsplit years start FY2017.
  public_equity: "global_equity",
  fixed_income_cash: "us_aggregate_bond",
  absolute_return: "hedge_fund_index",
  private_equity_vc: "public_pe_index",
  real_assets: "reit",
  other: "cash",
};

export const SCHOOL_IDS = ["yale", "harvard", "stanford", "mit", "princeton"] as const;
export type SchoolId = (typeof SCHOOL_IDS)[number];

// The kinds of document a citation can point at. Lives here rather than in the
// seed script so the seed validator, the schema and the Methodology page (task
// 6.1) all read the same list instead of keeping their own copies.
export const SOURCE_DOCUMENT_TYPES = [
  "annual_report",
  "financial_statement",
  "nacubo_study",
  "academic_paper",
  "other",
] as const;

export type SourceDocumentType = (typeof SOURCE_DOCUMENT_TYPES)[number];
