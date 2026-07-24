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

`schools.json` is filled in (real, non-financial metadata) and seeded into Neon. Every other file (`sources.json`, `schools/*.json`, `benchmark_returns.json`, `proxy_mappings.json`) is still an empty template — populating them with real, cited numbers is tasks 1.3–1.7.
