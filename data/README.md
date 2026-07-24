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

## Everything currently in this folder

`schools.json` is filled in (real, non-financial metadata). Every other file (`sources.json`, `schools/*.json`, `benchmark_returns.json`, `proxy_mappings.json`) is an empty template — populating them with real, cited numbers is tasks 1.2–1.7.
