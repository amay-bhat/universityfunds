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

- **Yale reports a *negative* Cash weight in some years** (-3.9% in FY2008, -1.9% in FY2009, -1.1% in FY2011) because the portfolio was effectively levered. Fixed Income and Cash are summed into one category, which happens to keep every stored Yale `pct` non-negative (FY2008 stores 0.1). If a future school-year has a *combined* negative, **store it as published** — the validator accepts `pct` down to -25, warns on every negative, and requires a `sourceLabel` on it. Do not clamp to zero, and do not merge across risk classes to make it non-negative: both misstate the categories involved, which is what Article 4 forbids. Settled by the `[PROXY DECISION]` logged under task 1.2.
- Summing Fixed Income + Cash is not our invention: Yale itself merged the two into a single "Cash & Fixed Income" line from FY2016, and for the overlapping years the split figures sum to exactly Yale's own merged figure (FY2016: 4.9 + 2.3 = 7.2 ✓; FY2017: 4.6 + 1.2 = 5.8 ✓; FY2018: 4.2 + 0.5 = 4.7 ✓).
- Likewise Natural Resources + Real Estate sums to the older single "Real Assets" figure (FY2010: 8.8 + 18.7 = 27.5 ✓), and Leveraged Buyouts + Venture Capital sums to the older single "Private Equity" figure (FY2014: 19.3 + 13.7 = 33.0 ✓).

**Coverage caveat:** Yale allocations are curated for **FY2000–FY2020 only**. The 2020 edition was the last Yale endowment report to publish an asset-allocation percentage table — the 2021 edition dropped it, and Yale has published no endowment report since, only a return/market-value press release. Returns and market values *are* curated for the full FY2000–FY2025. This is settled, not open: see the `[PROXY DECISION]` entry under task 1.3 in the `TASKS.md` build log.

### Harvard label mapping (task 1.5)

Harvard changed *what* it disclosed, not just how it labelled it. Two distinct regimes:

| Harvard's published label | Years | → category |
|---|---|---|
| Domestic Equity / Domestic Equities | FY2005–FY2016 (target) | `us_public_equity` |
| Foreign Equity/Equities + Emerging Markets / Emerging Market(s) Equity | FY2005–FY2016 (target) | `intl_public_equity` |
| **Public Equity / Public equities** | FY2017–FY2025 (actual) | **`public_equity`** — no geography split published |
| Private Equity / Equities | both | `private_equity_vc` |
| Absolute Return (targets) / Hedge Funds (actuals) | both | `absolute_return` |
| Commodities, Public Commodities, Natural Resources, Real Estate, Other Real Assets (& Private Debt) | both | `real_assets` |
| Domestic/Foreign Bonds, High Yield, Inflation-Indexed/Linked Bonds, Fixed Income, Bonds/TIPS, Cash, Cash & Other | both | `fixed_income_cash` |

Harvard's target years carry **negative Cash** (−5% in FY2005 and FY2008), the same published leverage Yale shows. Netted within `fixed_income_cash` it stays positive in every year.

**Coverage — four distinct gaps, all real:**

| Years | State | Why |
|---|---|---|
| FY2000–FY2004, FY2006, FY2007, FY2009, FY2011, FY2014 | **no allocation** | HMC published policy portfolios as "evolution" tables with *spot* years, never an annual series. Only the printed columns are curated. |
| FY2005, FY2008, FY2010, FY2012, FY2013, FY2015, FY2016 | target | Policy Portfolio / Strategic Asset Allocation, `basis: "target"` |
| FY2018 | **no allocation** | Never published: the FY2018 letter's table describes July 1 2017, and the FY2019 letter's describes June 30 2019. FY2018's year-end was skipped. |
| FY2022 | **no allocation** | The FY2022 letter contains no allocation table at all, and the FY2022 financial report reprints that same letter. |
| FY2017, FY2019–FY2021, FY2023–FY2025 | actual | `basis: "actual"` |

Returns and market values are curated for **FY2007–FY2009 and FY2011–FY2025** (18 years). Two holes remain, both outstanding work rather than decided gaps: **FY2000–FY2006**, and **FY2010**. HMC's older reports carry no multi-year returns table the way Yale's did, so each of those years needs its own primary document — the John Harvard Letter for that year, or Harvard's University Financial Report. FY2010 is the awkward one: it sits *inside* the curated range, so the returns chart will show a hole until it is sourced.

#### Harvard as-of dating (why these years and not others)

HMC printed an as-of date on exactly two of its allocation tables and none of the rest, so the dating had to be established by evidence. Getting it wrong would shift six years of the series by one year, invisibly.

- **FY2018 report** — explicit: "Asset Class **July 1, 2017** Allocation". Start-of-year, and the only such table. Curated as FY2017.
- **FY2025 report** — explicit: "**As of June 30, 2025**, the portfolio composition was as follows". Year-end.
- **FY2019–FY2024 reports** — no as-of wording anywhere in the document.

The six undated tables were assigned to **fiscal-year end** by reconciling each against Harvard's own audited financial statements, comparing only the overlay-free asset classes (private equity, real estate, natural resources) where fair value ≈ exposure. Public equity and hedge funds are *excluded* from the test because HMC's percentages are exposure-based and include index hedges, so NAV cannot check them.

| HMC table (PE / RE / NR) | vs its own June 30 | vs prior July 1 |
|---|---|---|
| FY2019: 20 / 8 / 4 | 21.9 / 7.9 / 4.2 ✓ | 19.0 / 8.9 / 5.0 |
| FY2020: 23.0 / 7.1 / 2.6 | 23.3 / 6.8 / 2.8 ✓ | 21.9 / 7.9 / 4.2 ✗ |
| FY2021: 34 / 5 / 1 | 34.1 / 4.8 / 0.8 ✓ | **23.3** / 6.8 / 2.8 ✗✗ |
| FY2023: 39 / 5 / 1 | 39.5 / 5.1 / 0.73 ✓ | 37.4 / 5.6 / 0.74 |
| FY2024: 39 / 5 / <1 | 38.8 / 5.0 / 0.72 ✓ | 39.5 / 5.1 / 0.73 |

FY2021 settles it alone: 34% private equity **did not exist** at July 1 2020 (23.3%) and did at June 30 2021 (34.1%), after private equity returned 77% during FY2021. The method was validated against both explicitly dated tables before being trusted. HMC's own present-tense prose agrees in each year, and Harvard Magazine's October 2019 write-up reads the FY19 table the same way — corroboration only; no figure is sourced to it.

**The audited NAV figures are dating evidence, never data.** No percentage is derived from them — that derivation is rejected elsewhere in this file for good reason. This is the same evidentiary move as Yale's overlap-verified category merges.

**Rounding:** FY2019, FY2024 and FY2025 sum to 101% in HMC's own tables. Stored as published; nothing nudged. They sit exactly at the validator's ±1.0pp boundary and pass.

## Granularity rule (all schools)

Decided during task 1.5 (see the `[PROXY DECISION]` in the `TASKS.md` build log). Schools don't just stop disclosing at different times — they disclose at different *levels of detail*, and in both directions.

**Curate at the granularity the school published. Never finer, never coarser.**

- Splitting a combined figure into finer categories is inventing data (Article 5) — even a school's own split from a neighbouring year doesn't license it.
- Coarsening everyone to match the least detailed discloser destroys real information, which is a quiet cousin of dishonesty.

So when a school publishes public equity as a single line with no US/international split, use the coarse `public_equity` category. **A school-year uses `public_equity` OR (`us_public_equity` + `intl_public_equity`) — never both**, or the equity sleeve is counted twice; the seed validator rejects the mix.

`public_equity` maps to its own benchmark series, `global_equity`, so the one-category-one-benchmark-one-ETF invariant still holds. That instrument is chosen in **task 1.7** alongside the ETF proxy, per task 1.4's principle that the two must be the same instrument. Front-runner is Vanguard Total World (`VT`/`VTWSX`), whose first full fiscal year is FY2009 — enough for every year currently needed, since Harvard's unsplit years begin FY2017. If a school turns out to need unsplit public equity before FY2009, that stretch is a documented gap, not a blend.

## Target vs actual: the `basis` field

Allocation rows carry `basis`: `"actual"` (what the school held at fiscal year end) or `"target"` (a policy-portfolio weight it published as an aim). Omit the field and it defaults to `"actual"`.

Both are real, citable figures, but they measure different things — intention versus holdings — so:

- **Every row in one school-year must share one basis** (validator-enforced). A year is either the mix held or the mix targeted, never a blend.
- **The two must never render as one unlabeled series.** Target years get visually distinct treatment plus a boundary annotation on the chart, a "(target mix)" marker in the Translator year picker, the basis in any copycat vintage label, and the full explanation on the Methodology page — where "policy portfolio" and "target allocation" also get their plain-English definitions (Article 3).
- A copycat backtest **may** start from a target year — "what if you held the mix Harvard said it was aiming for" is a coherent question — as long as every label says *target*.

Dropping target years instead would have discarded 17 years of published, citable Harvard figures over a difference that a flag and an annotation disclose completely. Article 4 forbids splicing bases silently, not labelling them.

## Coverage rule (all schools)

Decided during task 1.3 and binding on tasks 1.5–1.6. Each school discloses differently, so **each school's allocation coverage will end in a different year. That is expected output, not a failure.**

- Seed allocation rows **only for fiscal years the school itself published allocation data on a consistent measurement basis**, cited.
- **When disclosure stops, the series stops.** Do not extend it by deriving percentages from a different basis (e.g. dollar/NAV tables in a university financial report), by interpolating, or by carrying a year forward.
- **When the basis breaks mid-series** (a school renames or re-splits its categories), reconcile it only via an **overlap-verified mapping** — the way Yale's category merges were accepted in task 1.3, where the school's own later combined line equalled the earlier split figures exactly. Without that verification, annotate the break visibly; never splice silently.
- **Returns and market values run independently** to their own coverage, which is usually longer, because schools keep reporting returns after they stop reporting allocations.
- **Label the coverage end at every point of display** — on the allocation chart itself, in the Translator's year picker, and in full on the Methodology page. Not caption-only: when the returns chart next to it runs five years longer, the reader notices and deserves the explanation at that moment.
- Record each school's coverage end and the reason in this file and in the build log.
- **An undated disclosure may be assigned to a fiscal year only on documented evidence, never by default.** Acceptable evidence, in order of preference: (a) explicit as-of wording in the same or a companion primary document; (b) reconciliation against an independent audited primary series (financial-statement fair values), tested on overlay-free asset classes only, and validated against at least one explicitly dated disclosure from the same publisher before being trusted. If neither exists, the year is a gap. Never attribute by publication year alone, and never place a convention changeover by narrative inference. Publication-year attribution is a *hypothesis to test*, not a finding. (Established by the Harvard as-of dating decision in task 1.5.)

**Why derivation from NAV tables is rejected, not merely caveated.** For Yale the excluded categories are cash and directly-held fixed income (~7.5% of the FY2024 endowment: $41.3B total vs. a $38.2B NAV subtotal). Normalizing to the subtotal pushes `fixed_income_cash` toward zero and inflates every risk-asset category by roughly 8% relative — producing a "copycat" portfolio with almost no bonds, for a school whose own policy holds roughly 30% in market-insensitive assets. That is a number pointing the wrong way, not a number needing a footnote, and no amount of disclosure fixes it. There is also a basis mismatch that reconciliation may not cure at all: the endowment-report percentages are **economic exposure including leverage** (which is why Yale reports *negative* Cash weights in FY2008/09/11), whereas NAV tables are accounting values.

**Documented upgrade path (post-v1, not v1).** If a complete series is ever wanted, the only acceptable form is a *reconciled* derivation, not a normalized one: map the financial-report NAV classes to our categories, assign the excluded residual to `fixed_income_cash`, normalize to **total** net endowment investments, and then **test the method on the overlap years where both documents exist** (Yale: FY2015–FY2020). It earns the right to extend the series only if the derived percentages reproduce the school's own published percentages within ~1–2pp across every category, with all inputs cited — and even then it renders as a visually distinct "estimated" segment, never the same fill as reported years. It may well fail that test; the test is the point.

One Yale footnote that does **not** affect us: the 2002 report notes "Prior to 1999, Real Assets included only real estate. Oil and gas and timber were classified as Private Equity." Our series starts at FY2000, after that reclassification.

## `schools/<id>.json` shape

```json
{
  "allocations": [
    {
      "fiscalYear": 2023,
      "category": "us_public_equity",
      "pct": 15.5,
      "basis": "actual",
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

`marketValueUsdMillions` is always in **millions of USD** (so Yale at ~$40.7B is `40700`). `basis` is optional and defaults to `"actual"` — see the target-vs-actual section above.

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

### Instruments behind each series (task 1.4)

Fiscal-year total return = last observation on or before June 30 ÷ same for the prior June 30, − 1. Dividends reinvested. Full citations and per-series method notes are in `sources.json`.

| Series | Instrument | Covered | Why this one |
|---|---|---|---|
| `sp500` | S&P 500 **Total Return** Index (`^SP500TR`) | FY2000–FY2025 | The index level already includes reinvested dividends; price-only `^GSPC` would understate returns by roughly 2pp a year. |
| `us_aggregate_bond` | Vanguard Total Bond Market Index, Investor (`VBMFX`) | FY2000–FY2025 | Stands in for the Bloomberg US Aggregate, which isn't freely redistributable. Chosen over the BND ETF (2007) for full-window coverage. |
| `intl_equity` | Vanguard Total International Stock Index, Investor (`VGTSX`) | FY2000–FY2025 | Developed + emerging combined, matching how `intl_public_equity` is defined. Chosen over VXUS (2011) and EFA (2001). |
| `reit` | Vanguard Real Estate Index, Investor (`VGSIX`) | FY2000–FY2025 | Chosen over VNQ (2004) for coverage. **Listed REITs only** — see the honesty note below. |
| `cash` | 3-Month T-Bill rate, `TB3MS` via FRED | FY2000–FY2025 | FRED gives an annualized monthly *rate*, so the FY return compounds the twelve monthly rates: `prod(1 + rate/1200) − 1`. The only derived series here. |
| `hedge_fund_index` | **none — gap** | — | See below. |
| `public_pe_index` | **none — gap** | — | See below. |

**Instrument-selection principle** (`[JUDGMENT CALL]`, reversible by re-seeding): prefer the longest continuous history over the most familiar ticker, because one consistent basis across FY2000–FY2025 matters more than using today's popular ETF. Every instrument chosen is a low-cost index fund a DIY investor could actually have held — which keeps the benchmark series and the copycat's returns the same thing rather than two different things.

**Two series are deliberately empty.** No freely-citable, retail-investable series exists for `absolute_return` (hedge funds) or `private_equity_vc` back to FY2000: HFRI and Cambridge Associates are paywalled and non-redistributable, and the investable substitutes start far too late (PSP 2006, QAI 2009). Per Article 5 the gap stays rather than being filled with something invented.

This is consequential and belongs to **task 1.7**, not 1.4, because the benchmark series and the ETF proxy for a category must be the *same instrument* or the copycat comparison is incoherent. Task 1.7 therefore decides both at once, and it inherits a real constraint: those two categories are roughly **half of Yale's portfolio in every year**, so whatever it picks (or declines to pick) determines how much of the copycat can honestly be shown. A defensible outcome is that the copycat covers only the publicly-replicable sleeve and shows the rest as an explicit gap — which is a more honest answer than a fake hedge-fund proxy, and one Article 4 would prefer.

**Honesty note carried forward to task 1.7:** `reit` is *listed* real estate. It does not represent the direct real estate, timber, and energy holdings that make up much of an endowment's real-assets sleeve. Real, but a weak proxy — flag it as such.

**FY2026 is available but not curated.** The benchmark instruments already have complete FY2026 data (fiscal year ended 30 June 2026), but no school has reported FY2026 yet — Yale's release lands each October — so task 1.4's scope stops at FY2025 to avoid a benchmark series running ahead of every school's returns.

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

Exactly one row per category in `ALLOCATION_CATEGORIES` that any school actually uses — this is populated in task 1.7.

## Seeding (`npm run seed`)

`scripts/seed.ts` reads this folder and loads it into Neon; the validation lives in
`scripts/lib/seed-validate.ts`.

| Command | What it does |
|---|---|
| `npm run seed:dry` | Validate only — no database connection needed. **Use this while curating.** |
| `npm run seed` | Validate, then write to Neon. |
| `npm run seed:verify` | Run the validator against deliberately-broken copies of this folder and check every rule still fires. Run it after changing `scripts/lib/seed-validate.ts`. |
| `npx tsx scripts/seed.ts --dry-run --data-dir <path>` | Validate a different folder. |

**Do not type `npm run seed --dry-run`.** npm treats `--dry-run` as its own flag and
never passes it through, so the script would see only `--write` and would write.
The script now detects that exact mistake and refuses to write, but the command to
reach for is `npm run seed:dry`.

Three behaviours worth knowing:

- **Nothing is written unless every check passes.** All files are validated up front and the script exits non-zero with a list of errors before the database module is even imported, so a failed check can never touch Neon.
- **The write itself is one transaction.** Every insert and delete goes into a single `db.batch(...)`, so a failure partway through rolls back instead of leaving the tables half-updated. Writing is also opt-in: a bare `npx tsx scripts/seed.ts` validates and stops, because the write prunes (below) and must never happen by accident.
- **Re-seeding is idempotent, and deletions propagate.** Rows are upserted on their natural key (so ids stay stable), and any row in the database whose natural key is no longer in these files is pruned. Deleting a row here really does remove it from the database — which is what "these files are the source of truth" has to mean.

### What gets validated

Errors (block the write):

- Each file parses as JSON and has the documented shape; every required field is present and the right type.
- **No unknown fields.** A key outside the documented set is an error, with a did-you-mean. This matters most for *optional* fields: `"return_pct"` (snake_case, as the database column is named) or `"sourceLable"` would otherwise pass silently and store NULL over a figure you had already researched and cited.
- Every file in `data/schools/` is named `<school-id>.json` for a school in `SCHOOL_IDS`. A file nobody points at is never read, so without this a filename typo would silently discard a whole school's curation — and the prune step would then delete its rows.
- `schools.json` ids are unique and match `SCHOOL_IDS` in `src/lib/constants.ts` exactly, in both directions — the data and the app's typed `SchoolId` union can't drift apart.
- `sources.json` ids are unique; `documentType` is one of the five allowed values.
- **A source carries a `url` or a `page`.** PRD rule 2 asks for "source document + page/URL": a title-only citation resolves but nobody can re-check it, which is the whole point of citing it.
- `category` is one of the `ALLOCATION_CATEGORIES`; `series` is one of the `BENCHMARK_SERIES`; `basis` is `actual` or `target` (defaults to `actual` when the key is absent).
- `fiscalYear` is a whole year between 1970 and the most recent **closed** fiscal year. Fiscal years end June 30, so before July the current calendar year's FY has not closed and no school can have reported it.
- `pct` is between -25 and 100. The floor is negative on purpose — see the levered-weight note above and the `[PROXY DECISION]` under task 1.2. A negative `pct` additionally **requires** a `sourceLabel`, and always prints a warning.
- `returnPct` is within `(-100, 200]` — you can't lose more than everything, and the upper bound catches a decimal-point slip like `400` for `40.0`.
- `marketValueUsdMillions` is between 100 and 1,000,000. This field is in **millions**, and the band is what catches a unit slip: `40.7` (billions) and `40700000` (thousands) are both wrong by three orders of magnitude while looking entirely plausible, and neither would be caught by anything else.
- No number carries more decimal places than its column stores (`pct` and `returnPct` 3, `marketValueUsdMillions` 2). Postgres silently rounds past the scale rather than erroring, which would leave these files and the database quietly disagreeing about a figure nobody re-checked.
- `accessedDate` is an ISO `YYYY-MM-DD` date; a `url` is an http(s) URL.
- An `endowmentReturns` row has at least one of `returnPct` / `marketValueUsdMillions`. A row with a citation and no number looks like coverage to every downstream query while holding nothing — the exact inverse of "no citation, no number".
- No duplicate rows on the keys the database enforces: (school, fiscal year, category), (school, fiscal year), (series, fiscal year), (category).
- **Every `sourceId` resolves to an entry in `sources.json`** — this is PRD rule 2 ("no citation, no number") enforced mechanically, from the files, so it holds under `seed:dry` with no database.
- **Allocations for a school-year sum to 100% ± 1.0 percentage point.** Published tables are rounded, so exact 100 is rare; anything further out is a curation error. The tolerance is `ALLOCATION_SUM_TOLERANCE_PCT` in `scripts/lib/seed-validate.ts` — if a real, correctly-transcribed report legitimately sums outside it, widen the constant and say why in the `TASKS.md` build log rather than nudging a number to fit. If another check already rejected a row in that year, the sum message says so, because the total it printed is missing that row.

Warnings (printed, don't block):

- **A negative `pct`** — read as levered exposure, stored as published. Confirm the source really shows a negative, and note that it activates the display obligations in tasks 3.2, 4.2 and 6.1.
- **A whole return series inside ±1** — almost certainly entered as fractions (`0.196` for 19.6%). A single sub-1% year is real (Yale's FY2023 was 1.8%), so this only fires on three or more values that are all fractional. Nothing else catches this: unlike a mis-scaled `pct`, there is no sum rule to back it up, and the backtest would just compound near-zero returns and report that indexing went nowhere.
- **A category-year with no benchmark row for its mapped series** — the copycat backtest (task 4.1) would silently drop that slice of the portfolio while the page claims to model the whole allocation. Expected for `hedge_fund_index` and `public_pe_index` until task 1.7 settles them.
- A category is used in allocations but has no ETF proxy mapping yet (expected until task 1.7).
- A source is in `sources.json` but nothing cites it (it would show up on the Methodology page in task 6.1 as dead weight).
- An id or name had surrounding whitespace and was trimmed (a padded id would otherwise half-match its own references, with the difference invisible in an editor).

## Everything currently in this folder

| File | State |
|---|---|
| `schools.json` | Filled (real, non-financial metadata), seeded. |
| `sources.json` | 10 Yale citations (task 1.3). Grows with each curation task. |
| `schools/yale.json` | Filled: 126 allocation rows (FY2000–FY2020) + 26 return/market-value rows (FY2000–FY2025). |
| `schools/{harvard,stanford,mit,princeton}.json` | Empty templates — tasks 1.5–1.6. |
| `benchmark_returns.json` | Empty template — task 1.4. |
| `proxy_mappings.json` | Empty template — task 1.7. |
