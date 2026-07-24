# Data — Seed Files (Source of Truth)

Everything in this folder is hand-curated and versioned in git. It is the **source of truth** for the app — `npm run seed` (task 1.2) reads these files and loads them into Neon. Never edit the database directly; edit these files and re-seed.

**Rule (from PRD/CLAUDE.md): no number enters these files without a citation.** Every fact row carries a `sourceId` pointing at an entry in `sources.json`.

## File layout

| File | Contents |
|---|---|
| `schools.json` | The 5 schools (id, name, endowment manager name, website). Non-financial, stable. |
| `sources.json` | Every citation: annual reports, NACUBO studies, financial statements. |
| `schools/<id>.json` | Per school: `allocations[]` and `endowmentReturns[]`. One file per school keeps curation tasks (1.3–1.6) independent and diffable. |
| `benchmark_returns.json` | Annual returns for the 7 benchmark/index series (see below). |
| `proxy_mappings.json` | The ETF each allocation category maps to, with rationale + honesty note (task 1.7). |

## Fiscal years

Every school's fiscal year ends **June 30**. `fiscalYear` is always **the year the fiscal year ends** — FY2025 means July 2024–June 2025. All benchmark series are aligned to the same July–June year, not calendar years, so a school's return and its benchmark comparison for "FY2025" cover the identical 12 months.

## Allocation categories (normalized)

Schools don't report allocations the same way, and a given school's own categories shift over 25 years. Every allocation row is normalized into one of 7 categories (`src/lib/constants.ts` → `ALLOCATION_CATEGORIES`), chosen so each has exactly one benchmark series and one ETF proxy:

| Category id | Label | Benchmark series | Notes |
|---|---|---|---|
| `us_public_equity` | US Public Equity | `sp500` | |
| `intl_public_equity` | International Public Equity | `intl_equity` | Developed + emerging markets combined — most schools don't split these consistently across 25 years. |
| `fixed_income_cash` | Fixed Income & Cash | `us_aggregate_bond` | |
| `absolute_return` | Absolute Return / Hedge Funds | `hedge_fund_index` | |
| `private_equity_vc` | Private Equity & Venture Capital | `public_pe_index` | Includes buyouts and VC — schools rarely split these the same way. |
| `real_assets` | Real Assets | `reit` | Real estate, natural resources, timber, commodities. |
| `other` | Other / Unclassified | `cash` | Keep this bucket small — it's a catch-all for whatever doesn't cleanly fit above. |

**When curating a school-year (tasks 1.3–1.6):** map every line item the school actually reported into one of these 7 categories, and put the school's own original wording in `sourceLabel` so the normalization decision stays auditable. `pct` values for a given school + fiscal year should sum to ~100 (the seed script validates this, task 1.2).

### Yale label mapping (task 1.3)

Yale's own reporting categories changed three times over the period, which is exactly why the normalized set exists. Every Yale line item maps as follows:

| Yale's published label | Years used | → category |
|---|---|---|
| Domestic Equity | FY2000–FY2020 | `us_public_equity` |
| Foreign Equity | FY2000–FY2020 | `intl_public_equity` |
| Fixed Income | FY2000–FY2015 | `fixed_income_cash` |
| Cash | FY2000–FY2015 | `fixed_income_cash` |
| Cash & Fixed Income | FY2016–FY2020 | `fixed_income_cash` |
| Absolute Return | FY2000–FY2020 | `absolute_return` |
| Private Equity | FY2000–FY2014 | `private_equity_vc` |
| Leveraged Buyouts | FY2015–FY2020 | `private_equity_vc` |
| Venture Capital | FY2015–FY2020 | `private_equity_vc` |
| Real Assets | FY2000–FY2009 | `real_assets` |
| Natural Resources | FY2010–FY2020 | `real_assets` |
| Real Estate | FY2010–FY2020 | `real_assets` |

Three things this mapping gets right, each verified against an overlapping report:

- **Yale reports a *negative* Cash weight in some years** (-3.9% in FY2008, -1.9% in FY2009, -1.1% in FY2011) because the portfolio was effectively levered. Fixed Income and Cash are summed into one category, which keeps every stored `pct` non-negative. If a future school-year has a *combined* negative, the seed validator will reject it and the decision needs revisiting — don't silently clamp it to zero.
- Summing Fixed Income + Cash is not our invention: Yale itself merged the two into a single "Cash & Fixed Income" line from FY2016, and for the overlapping years the split figures sum to exactly Yale's own merged figure (FY2016: 4.9 + 2.3 = 7.2 ✓; FY2017: 4.6 + 1.2 = 5.8 ✓; FY2018: 4.2 + 0.5 = 4.7 ✓).
- Likewise Natural Resources + Real Estate sums to the older single "Real Assets" figure (FY2010: 8.8 + 18.7 = 27.5 ✓), and Leveraged Buyouts + Venture Capital sums to the older single "Private Equity" figure (FY2014: 19.3 + 13.7 = 33.0 ✓).

**Coverage caveat:** Yale allocations are curated for **FY2000–FY2020 only**. The 2020 edition was the last Yale endowment report to publish an asset-allocation percentage table — the 2021 edition dropped it, and Yale has published no endowment report since, only a return/market-value press release. Returns and market values *are* curated for the full FY2000–FY2025. See the `TASKS.md` build log for the open decision on how to handle FY2021–FY2025 allocations.

One Yale footnote that does **not** affect us: the 2002 report notes "Prior to 1999, Real Assets included only real estate. Oil and gas and timber were classified as Private Equity." Our series starts at FY2000, after that reclassification.

## `schools/<id>.json` shape

```json
{
  "allocations": [
    {
      "fiscalYear": 2023,
      "category": "us_public_equity",
      "pct": 15.5,
      "sourceLabel": "U.S. Equity",
      "sourceId": "yale-annual-report-fy2023"
    }
  ],
  "endowmentReturns": [
    {
      "fiscalYear": 2023,
      "returnPct": 1.8,
      "marketValueUsdMillions": 40700,
      "sourceId": "yale-annual-report-fy2023"
    }
  ]
}
```

`marketValueUsdMillions` is always in **millions of USD** (so Yale at ~$40.7B is `40700`).

## `sources.json` shape

```json
[
  {
    "id": "yale-annual-report-fy2023",
    "title": "The Yale Endowment 2023",
    "publisher": "Yale Investments Office",
    "url": "https://investments.yale.edu/endowment-reports",
    "documentType": "annual_report",
    "page": null,
    "accessedDate": "2026-07-24",
    "notes": null
  }
]
```

`documentType` is one of: `annual_report`, `financial_statement`, `nacubo_study`, `academic_paper`, `other`.

## `benchmark_returns.json` shape

```json
[
  { "series": "sp500", "fiscalYear": 2023, "returnPct": 19.6, "sourceId": "..." }
]
```

Series ids: `sp500`, `intl_equity`, `us_aggregate_bond`, `hedge_fund_index`, `public_pe_index`, `reit`, `cash` (`src/lib/constants.ts` → `BENCHMARK_SERIES`).

**Composite benchmarks (S&P 500 alone, 60/40, 70/30) shown in the Comparisons feature are NOT stored here** — they're computed at query time by the backtest engine (task 4.1) from `sp500` + `us_aggregate_bond`, so there's one source of truth per underlying series instead of duplicated composite figures that could drift out of sync.

## `proxy_mappings.json` shape

```json
[
  {
    "category": "us_public_equity",
    "etfTicker": "VTI",
    "etfName": "Vanguard Total Stock Market ETF",
    "rationale": "Plain-English reason a normal investor would pick this ETF for this category.",
    "honestyNote": "Plain-English note on what this proxy can't actually replicate.",
    "sourceId": null
  }
]
```

Exactly one row per category (7 total) — this is populated in task 1.7.

## Seeding (`npm run seed`)

`scripts/seed.ts` reads this folder and loads it into Neon.

| Command | What it does |
|---|---|
| `npm run seed` | Validate, then write to Neon. |
| `npx tsx scripts/seed.ts --dry-run` | Validate only — no database connection needed. Use this while curating. |
| `npx tsx scripts/seed.ts --dry-run --data-dir <path>` | Validate a different folder (used to test the validator against deliberately bad fixtures). |

Two behaviours worth knowing:

- **Nothing is written unless every check passes.** All files are validated up front and the script exits non-zero with a list of errors before opening a connection, so a bad edit can never half-update the database.
- **Re-seeding is idempotent, and deletions propagate.** Rows are upserted on their natural key (so ids stay stable), and any row in the database whose natural key is no longer in these files is pruned. Deleting a row here really does remove it from the database — which is what "these files are the source of truth" has to mean.

### What gets validated

Errors (block the write):

- Each file parses as JSON and has the documented shape; every required field is present and the right type.
- `schools.json` ids are unique and match `SCHOOL_IDS` in `src/lib/constants.ts` exactly, in both directions — the data and the app's typed `SchoolId` union can't drift apart.
- `sources.json` ids are unique; `documentType` is one of the five allowed values.
- `category` is one of the 7 `ALLOCATION_CATEGORIES`; `series` is one of the 7 `BENCHMARK_SERIES`.
- `fiscalYear` is a whole year between 1970 and next year.
- `pct` is between 0 and 100; `returnPct` is within `(-100, 200]` (you can't lose more than everything, and the upper bound catches a decimal-point slip like `400` for `40.0`); `marketValueUsdMillions` is not negative.
- No duplicate rows on the keys the database enforces: (school, fiscal year, category), (school, fiscal year), (series, fiscal year), (category).
- **Every `sourceId` resolves to an entry in `sources.json`** — this is PRD rule 2 ("no citation, no number") enforced mechanically.
- **Allocations for a school-year sum to 100% ± 1.0 percentage point.** Published tables are rounded, so exact 100 is rare; anything further out is a curation error. The tolerance is `ALLOCATION_SUM_TOLERANCE_PCT` at the top of `scripts/seed.ts` — if a real, correctly-transcribed report legitimately sums outside it, widen the constant and say why in the `TASKS.md` build log rather than nudging a number to fit.

Warnings (printed, don't block):

- A category is used in allocations but has no ETF proxy mapping yet (expected until task 1.7).
- A source is in `sources.json` but nothing cites it (it would show up on the Methodology page in task 6.1 as dead weight).

## Everything currently in this folder

| File | State |
|---|---|
| `schools.json` | Filled (real, non-financial metadata), seeded. |
| `sources.json` | 10 Yale citations (task 1.3). Grows with each curation task. |
| `schools/yale.json` | Filled: 126 allocation rows (FY2000–FY2020) + 26 return/market-value rows (FY2000–FY2025). |
| `schools/{harvard,stanford,mit,princeton}.json` | Empty templates — tasks 1.5–1.6. |
| `benchmark_returns.json` | Empty template — task 1.4. |
| `proxy_mappings.json` | Empty template — task 1.7. |
