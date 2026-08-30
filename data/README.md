# Data — Seed Files (Source of Truth)

Everything in this folder is hand-curated and versioned in git. It is the **source of truth** for the app — `npm run seed` (task 1.2) reads these files and loads them into Neon. Never edit the database directly; edit these files and re-seed.

**Rule (from PRD/CLAUDE.md): no number enters these files without a citation.** Every fact row carries a citation pointing at an entry in `sources.json`: `sourceId` on allocations, benchmark returns and proxy mappings; **`returnSourceId` and `marketValueSourceId`** on endowment-return rows, one per figure (a bare `sourceId` on a return row is a hard validation error).

## File layout

| File | Contents |
|---|---|
| `schools.json` | The 5 schools (id, name, endowment manager name, website). Non-financial, stable. |
| `sources.json` | Every citation: annual reports, NACUBO studies, financial statements. |
| `schools/<id>.json` | Per school: `allocations[]` and `endowmentReturns[]`. One file per school keeps curation tasks (1.3–1.6) independent and diffable. |
| `benchmark_returns.json` | Annual returns for the 8 benchmark/index series (see below); 5 are populated, 3 await task 1.7. |
| `proxy_mappings.json` | The ETF each allocation category maps to, with rationale + honesty note (task 1.7). |

## Fiscal years

Four of the five schools' fiscal years end **June 30**. **Stanford's ends August 31** — its endowment market values are as of that date, ~2 months offset from the July–June year every other series uses (Stanford's investment *returns* are reported as of June 30, but none are curated — see the Stanford section). The offset is disclosed at the point of display (tasks 3.2/6.1); Stanford rows are labelled with Stanford's own fiscal-year naming (`fiscalYear` 2025 = Sep 2024–Aug 2025). For the other four schools: `fiscalYear` is always **the year the fiscal year ends** — FY2025 means July 2024–June 2025. All benchmark series are aligned to the same July–June year, not calendar years, so a school's return and its benchmark comparison for "FY2025" cover the identical 12 months.

## Allocation categories (normalized)

Schools don't report allocations the same way, and a given school's own categories shift over 25 years. Every allocation row is normalized into one of **8** categories (`src/lib/constants.ts` → `ALLOCATION_CATEGORIES`), chosen so each has exactly one benchmark series and one ETF proxy. The 8th, `public_equity`, was added by the task-1.5 ruling for schools that publish public equity as a single unsplit line (Harvard FY2017+, Princeton FY2020+) — see the granularity rule below; a school-year uses it **or** the two split equity categories, never both:

| Category id | Label | Benchmark series | Notes |
|---|---|---|---|
| `us_public_equity` | US Public Equity | `sp500` | |
| `intl_public_equity` | International Public Equity | `intl_equity` | Developed + emerging markets combined — most schools don't split these consistently across 25 years. |
| `fixed_income_cash` | Fixed Income & Cash | `us_aggregate_bond` | |
| `absolute_return` | Absolute Return / Hedge Funds | `hedge_fund_index` | |
| `private_equity_vc` | Private Equity & Venture Capital | `public_pe_index` | Includes buyouts and VC — schools rarely split these the same way. |
| `real_assets` | Real Assets | `reit` | Real estate, natural resources, timber, commodities. |
| `other` | Other / Unclassified | `cash` | Keep this bucket small — it's a catch-all for whatever doesn't cleanly fit above. |

**When curating a school-year (tasks 1.3–1.6):** map every line item the school actually reported into one of these 8 categories, and put the school's own original wording in `sourceLabel` so the normalization decision stays auditable. `pct` values for a given school + fiscal year should sum to ~100 (the seed script validates this, task 1.2).

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

Returns and market values are curated for the **complete FY2000–FY2025 range (26 rows, no holes)**. The FY2000–FY2006 and FY2010 tail was closed by pilot unit 1.6.D: HMC's older reports carry no multi-year returns table the way Yale's did, so each of those years came from its own primary document — Harvard's **University Financial Report** for that year (no HMC document exists for them at all, established by archive enumeration). Those eight years are QC-verified digit-for-digit, including arithmetic proof of the parenthesised negatives. **Market values mix two published bases** — see the Harvard market-value basis note further down.

#### Harvard as-of dating (why these years and not others)

HMC printed an as-of date on exactly two of its allocation tables and none of the rest, so the dating had to be established by evidence. Getting it wrong would shift five years of the series by one year, invisibly.

- **FY2018 report** — explicit: "Asset Class **July 1, 2017** Allocation". Start-of-year, and the only such table. Curated as FY2017.
- **FY2025 report** — explicit: "**As of June 30, 2025**, the portfolio composition was as follows". Year-end.
- **FY2019–FY2024 reports** — no as-of wording anywhere in the document.

The five undated tables — the FY2019, FY2020, FY2021, FY2023 and FY2024 reports; the FY2022 report prints no allocation table at all — were assigned to **fiscal-year end** by reconciling each against Harvard's own audited financial statements, comparing only the overlay-free asset classes (private equity, real estate, natural resources) where fair value ≈ exposure. Public equity and hedge funds are *excluded* from the test because HMC's percentages are exposure-based and include index hedges, so NAV cannot check them.

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

### Stanford label mapping (task 1.6)

**No allocation rows are curated for Stanford. This is a deliberate, documented gap, not an oversight — see the Merged Pool finding below, which is why there is no label-mapping table here the way there is for Yale and Harvard.**

#### The Merged Pool is not the Endowment (why allocations and returns are both empty)

Stanford's own investment office, Stanford Management Company (SMC), does not manage or report on "the Endowment" as a standalone portfolio. Every percentage SMC publishes — its asset-allocation table and its annualized-return table — describes **the Merged Pool**, a larger, structurally distinct commingled investment vehicle. Stanford's own words, quoted verbatim from its annual investment-report brochures (e.g. the 2016 report, page 5): *"MERGED POOL COMPOSITION (as of August 31, 2016) — Hospitals 8%, Endowment 73%, Non-Endowment 19%."* The Endowment is the largest single participant in the Merged Pool, but never all of it: across the seven years checked (FY2016–FY2022) the Endowment's share of the Merged Pool ranges from 73–75%, with the remainder held by Stanford Health Care / Stanford Medicine Children's Health ("Hospitals") and by "Non-Endowment" funds (expendable funds, donor-advised funds, life-income gifts, pending funds).

This is the same class of error the Yale NAV-subtotal derivation was rejected for (see the coverage rule above) — using Merged Pool data to describe "Stanford's endowment" would silently substitute one measurement universe for another — except here the mismatch is larger (Merged Pool includes ~25% non-endowment money, versus Yale's ~7.5% NAV exclusion) and it touches **both allocations and returns**, not just allocations:

- **Allocations.** SMC has never published an Endowment-specific allocation table in any document found. Every allocation table located (SMC investment reports 2016–2022, all archived) is headed "MERGED POOL POLICY ASSET ALLOCATION" and is explicitly a **target** ("Policy Asset Allocation... exposure targets"), never an actual holding. No table for any year describes the Endowment's own composition.
- **Returns.** SMC's "Trailing Annualized Returns" table is headed "Stanford's Merged Pool" in every year checked; no Endowment-specific percentage return is ever published. This is not a labeling nicety: the Endowment's own audited investment experience genuinely differs from the Merged Pool's reported return, because (a) part of the Endowment (~12–15% in FY2016–2019 per Stanford's audited financial statements) is invested directly in real estate on Stanford's lands, **outside the Merged Pool entirely**, and (b) the Endowment's cash-flow timing (gifts in, payout distributions out) differs from the Merged Pool's blended flows from Hospitals and Non-Endowment funds. Quantitative check: Stanford's audited FY2024 Consolidated Financial Statements report the University endowment's "Total investment returns, net" as $2,020,189 thousand against a beginning balance of $36,494,893 thousand — a simple-return-equivalent of roughly 5.5%, materially below the Merged Pool's own reported FY2024 return of **8.4%** (Chief Investment Officer, Oct 2024, citing SMC). A ~2.9 percentage-point gap in one year is not rounding noise; it confirms the two series are genuinely different performance experiences, not merely differently labeled.
- **Market values are the one figure Stanford discloses for the Endowment itself**, distinctly from the Merged Pool, in its audited Consolidated Financial Statements (the "Endowments" note, "University endowment" line) — but at a **different as-of date** than the Merged Pool figure and than every other school in this project (see the as-of dating subsection below).

Per this task's domain-risk guidance (percentages that exist only for a pool that isn't the endowment are a stop-and-report condition, not a judgment call for the curating session to resolve unilaterally), this session did not curate Stanford allocations or returns from Merged Pool data, and did not derive an Endowment return from the audited dollar figures (that would repeat the NAV-derivation error this project has already rejected once). **This is flagged for the conductor/human as the primary finding of this unit** — see the curation report for the options considered. What Stanford **does** publish, on a clean single-entity basis with no measurement-universe mixing, is the Endowment's own year-end market value, and that is what is curated here.

#### Coverage

| Fiscal years | State | Why |
|---|---|---|
| FY2000–FY2025 | **no allocation** | SMC publishes only Merged Pool policy targets (see above); no Endowment-specific allocation table exists in any year checked. |
| FY2000–FY2025 | **no return** | SMC publishes only the Merged Pool's percentage return; no Endowment-specific percentage return exists, and deriving one from audited dollar figures would repeat the NAV-derivation error this project already rejects (see the coverage rule above). Quantitatively confirmed to differ from the Merged Pool return by ~2.9pp in FY2024 (see above) — not a labeling-only gap. |
| FY2000–FY2025 | **market value: full coverage** | Stanford's audited Consolidated Financial Statements report the "University endowment" year-end balance every year, distinctly from the Merged Pool, from 13 financial-report documents (some giving two years each, several confirmed by overlapping reports to the dollar). |

Every `endowmentReturns` row for Stanford therefore carries `marketValueUsdMillions` + `marketValueSourceId` only; `returnPct`/`returnSourceId` are absent for all 26 years. This is a valid row shape per the schema (a row needs at least one of the two figures) and is the honest representation of what Stanford discloses about the Endowment specifically, as opposed to the Merged Pool.

#### Stanford as-of dating (fiscal-year-end offset, not table dating)

No allocation table was curated, so there is no undated-table question of the kind Harvard's dating section resolves. There is a related but distinct wrinkle worth recording: **Stanford's own fiscal year ends August 31**, not June 30 like the other four schools in this project. Stanford's press releases state this explicitly: *"Stanford University reported returns on its investment portfolio as of June 30, 2025, and the value of its endowment as of the close of its fiscal year, August 31, 2025."* The Merged Pool's return and market value are reported as of June 30 (aligning with this project's July–June fiscal-year convention), but the **Endowment's own market value is reported as of August 31** — about two months later than every other figure in this project labeled with the same fiscal year. The `marketValueUsdMillions` figures curated here for "FY2000"–"FY2025" are Stanford's own August 31 fiscal-year-end values for that label (e.g. "FY2025" = August 31, 2025), not June-30 values. This offset is small relative to typical year-over-year moves but is a real, if minor, basis wrinkle worth surfacing wherever Stanford's market-value series is displayed next to the other four schools' June-30 figures (carried forward to tasks 3.2/6.1, alongside the coverage-end and target/actual display obligations already established for Yale and Harvard).

#### Stanford upgrade path and record corrections (QC + pool-basis ruling)

**Upgrade path (binding rule, from the pool-basis ruling):** Stanford's
allocation/return gap is re-openable without relitigation if primary evidence
establishes **≥95% of the endowment's investments held through the Merged
Pool** (endowment-in-pool — the pool's *composition* percentages are the wrong
ratio) with a non-concentrated residual for named years, or if an
endowment-specific percentage table surfaces. The named place to look:
**Stanford's responses to the 2008 Senate Finance and 2016 congressional
endowment inquiries** — MIT's responses to the same inquiries contained
exactly such tables.

**Two corrections from QC, so no future session inherits them:** (1) the
pre-2016 "Report from SMC" editions (FY2000–FY2012) *label* their tables
"Endowment Asset Allocation"/"Nominal Endowment Return", but each document's
own text states the universe is the Merged (Endowment) Pool — the headline
label is not the universe, and in FY2000 the pool was ~97% endowment *by pool
composition*, which is the wrong ratio for admissibility. (2) The Endowments
note layout differs by era: in modern reports (e.g. FY2024) "TOTAL ENDOWMENT
FUNDS" is a combined University+Hospitals line sitting *below* the "University
endowment" line; in older reports (e.g. FY2012) the same words inside the
University's note *are* the University-only figure, with Hospitals in a
separate note. Anyone re-deriving the series must identify the line by its
context, not its label. FY2008–FY2012 values are whole-million precision as
their cited table prints them.

### MIT label mapping (task 1.6)

MIT is the project's hardest discloser, and the reason is a stated change in how MIT invests, not merely in what it prints. MITIMCo's own 10-Year Letter (February 2017) says it: "Ten years ago, our process started with a top-down assessment of asset class risk and return characteristics and the establishment of asset class target allocations... In 2011, we formalized our shift in thinking and adopted a new manager-centric capital allocation framework." A school that has stopped managing to asset-class targets has stopped producing the table this project wants, and MIT has published none since.

MIT has never published an asset-allocation percentage table in its **Report of the Treasurer** — not in any of the 20 editions examined (FY2006–FY2025). The two MIT documents that do print endowment allocation percentages are both **answers to congressional inquiries**, eight years apart:

| MIT's published label | Years used | → category |
|---|---|---|
| Domestic Equity | FY2008 (target) | `us_public_equity` |
| U.S. Public Equity | FY2013–FY2015 (actual) | `us_public_equity` |
| International Equity **+** Emerging Markets Equity | FY2008 (target) | `intl_public_equity` (merged) |
| International Public Equity | FY2013–FY2015 (actual) | `intl_public_equity` |
| Fixed Income | FY2008 (target) | `fixed_income_cash` |
| Fixed Income **+** Cash | FY2013–FY2015 (actual) | `fixed_income_cash` (merged) |
| Marketable Alternatives | both | `absolute_return` |
| Private Equity | both | `private_equity_vc` |
| Real Assets **+** Real Estate | both | `real_assets` (merged) |

Three merges, all forced by our 7-category set rather than chosen, and all inside a risk class:

- **International + Emerging Markets** — `intl_public_equity` is defined in this file as developed + emerging combined, so MIT's FY2008 split collapses into it (the same treatment Yale's Foreign Equity gets). MIT's FY2013–FY2015 label is already a single "International Public Equity" line.
- **Fixed Income + Cash** — the Yale precedent exactly; MIT's own FY2008 disclosure prints one combined "Fixed Income" line, which is what the merged FY2013–FY2015 figure reproduces.
- **Real Estate + Real Assets** — one `real_assets` bucket exists, so MIT's two lines sum into it (Yale's Natural Resources + Real Estate precedent). MIT defines its Real Assets line as "commodity-related assets located primarily in North America" and its Real Estate line as "office, retail, multifamily, land, and industrial assets in and around major global cities" — both inside the category's stated scope ("Real estate, natural resources, timber, commodities").

MIT's own definitions confirm the two riskiest mappings: **Private Equity** is "leveraged buyouts, growth equity, and venture capital" (so `private_equity_vc`, not split), and **Marketable Alternatives** is "credit long-short, equity long-short, distressed, various arbitrage, and other related strategies" (so `absolute_return`).

**Coverage — 7 allocation years out of 26, and the 19 gaps are documented year by year.** FY2001/FY2003/FY2004 were curated from MIT's Pool A tables after the pool-basis ruling settled the measurement-universe question — the rows below marked *Pool A (curated)* are those years; see the Pool A section further down for the ruling and its evidence:

| Fiscal year | State | Why — and the specific document(s) examined for that year |
|---|---|---|
| FY2000 | **no allocation** | MIT Faculty Newsletter Sept/Oct 2004 (Bufferd) Table II prints columns 1994 / 1999 / 2001 / 2003 / 2004 and skips 2000; MIT's 2008 Senate Finance response prints an allocation table for FY2008 only. No Report of the Treasurer for FY2000 is served by vpf.mit.edu (HTTP 404) or captured in the Internet Archive. |
| FY2001 | **Pool A (curated)** | A percentage table for this year *does* exist — Bufferd Table II, 2001 column — but it is labelled "**Pool A** Asset Allocation", not the endowment. Referred up as a measurement-universe question (tripwire 6); see "MIT's Pool A tables" below. |
| FY2002 | **no allocation** | Not printed: Bufferd Table II skips 2002. No FY2002 Treasurer's Report retrievable (as FY2000). |
| FY2003 | **Pool A (curated)** | Pool A figures exist (Bufferd Table II 2003 column; Bufferd Figure 2, "MIT Pool A ... as of June 30, 2003") — Pool A, not the endowment. Tripwire 6, see below. |
| FY2004 | **Pool A (curated)** | Pool A figures exist, and both bases: Bufferd Figure 1 ("Pool A Asset Allocation on June 30, 2004"), Table II 2004 column, and Table III ("Fiscal 2004 Pool A Target Allocation and Acceptable Ranges"). Tripwire 6, see below. |
| FY2005 | **no allocation** | Bufferd (2004) predates it; the 2008 Senate response prints FY2008 only; Report of the Treasurer 2006, which carries FY2005 comparatives, prints no allocation table — only the aggregate sentence quoted below. |
| FY2006 | **no allocation** | Report of the Treasurer 2006 examined in full. It quantifies allocation only as coarse aggregates over three different denominators: "Equity and real estate investments at market value were **86.7 percent of the general investments** at June 30, 2006", and "alternative investment, marketable and non-marketable, plus real estate assets, represented slightly more than **56 percent of the assets in Pool A**, and **51 percent of total investments**." None of the three is the endowment, and each spans several of our categories. Splitting them would be inventing data (Article 5). |
| FY2007 | **no allocation** | Report of the Treasurer 2007 examined: no allocation table, and not even the aggregate sentence. The 2008 Senate response's Table 6C is the FY2008 target, not FY2007. |
| **FY2008** | **target** | MIT's 2008 Senate Finance response, Table 6C, headed "**2008 Target Allocations for Endowment**". |
| FY2009 | **no allocation** | Report of the Treasurer 2009 examined: aggregate sentence only ("real estate investments at market value were 84.5 percent..."). |
| FY2010 | **no allocation** | Report of the Treasurer 2010 examined: aggregate sentence only (83.7 percent). |
| FY2011 | **no allocation** | Report of the Treasurer 2011 examined: aggregate sentence only ("Equity, marketable alternatives, and real estate investments at market value were 81.1 percent of investments as of June 30, 2011, as compared to 83.7 percent at June 30, 2010"). **This is the last MIT annual report to quantify allocation in any form.** |
| FY2012 | **no allocation** | Report of the Treasurer 2012 examined: the aggregate sentence is gone; the investment-policy paragraph is purely qualitative ("favors equity investments over fixed income instruments and is heavily weighted towards less efficient markets"). |
| **FY2013–FY2015** | **actual** | MIT's 2016 congressional response, Table 1.2, headed "**Endowment Asset Allocation**" with the column heading "Asset Allocation as a Percentage of the Endowment" and columns 2015 / 2014 / 2013. |
| FY2016–FY2025 | **no allocation** | Ten Reports of the Treasurer (2016–2025) each examined: investments appear only at fair value **in dollars** (Note B, Table 5/6). MIT News's annual "financials and endowment figures" release examined for each year: return and endowment value, no percentages. mitimco.org (live, plus Internet Archive captures back to the 2006 mitimco.mit.edu site) publishes no allocation figures at all. MITIMCo's 10-Year Letter (2017), 15-Year Letter (2022), 2013 and 2025 brochures and ESG Framework examined: no allocation table. MITIMCo's own explanation for the absence is quoted at the top of this section. |

#### MIT as-of dating (why these years and not others)

One of the two allocation tables is explicitly dated and one is not, so the second needed evidence.

- **2008 Senate response, Table 6C** — explicit in its own sentence: "the allocation targets for investments in each asset class **for the fiscal (academic) year ending June 30, 2008**". Curated as FY2008, `basis: "target"`. MIT prints its own caveat beneath the table — "Actual investment in the above asset classes may vary from the target allocations at any given point in time" — which is exactly what the `basis` field records.
- **2016 congressional response, Table 1.2** — columns headed only `2015 2014 2013`, with no "as of June 30" wording anywhere in the document. Assigned to **fiscal-year end** by reconciling against MIT's own endowment values printed in Tables 2.1 and 3.1 of the *same document* under the *same year labels*: $13,474.7M / $12,425.1M / $10,858.0M. Those three figures equal, to the $0.1M, the June 30 endowment values in MIT's Reports of the Treasurer for FY2015 / FY2014 / FY2013. A start-of-year reading would put the 2015 column against MIT's June 30 2014 value of $12,425.1M, which the document itself labels 2014. This is the same evidentiary move as the Harvard dating decision, applied within one document rather than across two.

**MIT's Pool A tables — curated under the pool-basis ruling (originally referred up as tripwire 6).** The MIT Faculty Newsletter of September/October 2004 carries "The Management of the MIT Endowment" by **Allan S. Bufferd, then MIT's Treasurer**, and it prints three allocation tables: Figure 1 (a pie for June 30 2004), Table II (a five-column actual series: 2004 / 2003 / 2001 / 1999 / 1994, every column summing to exactly 100.0), and Table III (an FY2004 target allocation with acceptable ranges). The figures are internally cross-validated — Figure 1's finer lines sum to Table II's 2004 column in every category (Fixed Income 6.8 + Cash 2.3 = 9.1; Cambridge Real Estate 7.9 + R.E. Pools 2.2 = 10.1; Private Capital 7.7 + Int'l Private Capital 3.6 + Venture Capital 7.0 = 18.3 against 18.4) — so this is not a transcription risk. **They were initially withheld because every one of them is labelled "Pool A", and MIT states in the same article that "Pool A is neither the complete Endowment nor is it comprised only of Endowment assets"** — a measurement-universe question that tripwire 6 reserves rather than lets a worker settle. The relevant magnitudes, from MIT's own reports: at June 30 2006 the endowment was $8,368.1M of which $8,232.0M (98.4%) sat in Pool A, while Pool A totalled $8,550.1M; at June 30 2011 Pool A was $10,041.1M including $754.5M of operating and life-income funds. FY2004 also carries a second unsettled question — an actual *and* a target table for the same year, which the database's unique key on (school, fiscal year, category) cannot both hold. **The ruling came back yes, under four conditions, so all three in-window years (FY2001, FY2003, FY2004) are curated** — see the Pool A section below for the conditions, the coverage evidence, and the independent-fetch gate that was satisfied before they merged.

**Why no percentage was derived from MIT's dollar tables — and why the case is even stronger here than for Yale.** MIT's audited Note B "Investments" table is rich (Cash and short-term, US Treasury, US government agency, Domestic bonds, Foreign bonds, Common equity domestic/foreign, Equity: absolute return / domestic / foreign / private, Real estate, Real assets, Split-interest agreements, Other, Derivatives) and would yield a complete FY2006–FY2025 series in about ten minutes. It is rejected for the reason already settled in this file, plus one MIT-specific reason: **the table's universe is all of MIT's investments, not the endowment.** At June 30 2025 it totals $35,790.3M against an endowment of $27,366.2M — MIT's own 2016 congressional response itemises the difference (Pool C, bond proceeds, life income funds). A percentage derived from it would not be a percentage of MIT's endowment at all, so no caveat could repair it. The circulating third-party figures have the same defect: top1000funds.com publishes a June 30 2025 MIT allocation (Equities 67 / Marketable Alternatives 14 / Fixed Income 8 / Real Estate 6 / Cash 4 / Real Assets 1) sourced only to "the most recent annual report or other publicly available data", and it does not reproduce from MIT's audited table under any normalisation tested (that table gives equities 57.7%, absolute return 15.9%, real estate 12.3%, fixed income 12.3%, cash 0.8% of total investment assets). No number in `data/` comes from it.

**Rounding and sums.** MIT's own FY2013 column sums to **100.2** and FY2015 to **100.1**; FY2014 to 99.9. Stored as published, nothing nudged — all three pass the ±1.0pp validator. No MIT year carries a negative weight.

**Returns and market values run far past the allocations: FY2000–FY2025 complete, 26 of 26 years.** Two structural notes:

- **What the return figure is.** MIT states its annual return as its *pooled investments (Pool A)* return, inside the Endowment section of the Report of the Treasurer ("This year, MIT's pooled investments (Pool A) produced a return of 14.8 percent"), and MIT News says the same in different words ("MIT's unitized pool of endowment and other MIT funds generated an investment return of..."). Because Pool A is unitized, every dollar in it earns that same unit return, and about 98% of the endowment is invested through it (MIT's 2016 congressional response). MIT's two congressional responses label the identical series "Investment Return to the Endowment" (2008) and "Net Investment Return" for "MIT's internal unitized investment pool" (2016). The market values are unambiguously the endowment's: MIT's "investments in endowment funds, **excluding pledges** for endowed purposes". Where MIT News gives a value "including pledges" (FY2012: $10.3 billion), it is not used.
- **One restatement, handled explicitly.** MIT reclassified certain funds out of the endowment in FY2010 ("certain funds previously classified as endowment have been reclassified to other invested funds"), which restated three years: FY2007 $9,980.4M → $9,943.1M, FY2008 $10,068.8M → $9,947.6M, FY2009 $7,982.0M → $7,880.3M. The **restated** figures are curated, because MIT's own later documents use them uniformly — the FY2011 Five-Year Trend Analysis, the FY2010 report, and the 2016 congressional response all print the restated values, and MIT News's FY2018 release describes the decade as growth "from $7.9 billion to $16.4 billion". FY2000–FY2006 exist only on the pre-reclassification basis, so the single basis break in MIT's market-value series sits at FY2006/FY2007 and is worth about 0.4%.

#### MIT Pool A years (FY2001/FY2003/FY2004) — pool-basis ruling

Three additional MIT allocation years are curated from **Table II of "The
Management of the MIT Endowment"** (MIT Faculty Newsletter, Sept/Oct 2004, by
Treasurer Allan S. Bufferd; `mitimco-fnl-bufferd-2004`). The measurement
universe is MIT's unitized investment **Pool A**, per the article's own words:
*"Pool A is neither the complete Endowment nor is it comprised only of
Endowment assets, it is for this discussion a good proxy to discuss the
management of the Endowment."* Curated under the pool-basis ruling
(`[PROXY DECISION]` 2026-07-31, TASKS.md): school-as-proxy attestation +
documented endowment-in-pool coverage ≥95% + no divergence evidence + universe
disclosed at every layer. The coverage evidence is **era-bracketing, not
per-year** (the FY2000–FY2005 Reports of the Treasurer are unrecoverable):
98.4% endowment-in-pool measured at FY2006; non-endowment content of the pool
~3.7% (FY2006) and ~7.5% (FY2011); MIT's 2008 Senate response titles this same
era's Pool A return series "Investment Return to the Endowment". The
independent-fetch gate was satisfied 2026-07-31 (byline, disclaimer, and all
three in-window Table II columns verified digit-for-digit from a fresh fetch by
a session other than the curating worker). **Display obligation (tasks
3.2/6.1):** the FY2001–FY2004 points are pool-basis while FY2008/FY2013–FY2015
are from endowment-titled congressional tables — annotate the basis break on
the chart itself, and define "investment pool" in plain English at first use.

**How the universe distinction is carried (ruled 2026-08-04, `[PROXY DECISION]`
in the `TASKS.md` build log).** No column. Every pool-universe row cites
`mitimco-fnl-bufferd-2004`, whose `sources.json` notes state the universe
verbatim, so the fact is already certified at source granularity; the display
layer derives it from `sourceId` via `POOL_UNIVERSE_SOURCE_IDS` in
`src/lib/constants.ts`. A year counts as pool-basis only if **every** one of its
rows cites a pool-universe document — a mixed year would be a curation error,
and the derivation defaults to `endowment` rather than silently claiming the
wider pot. This is self-healing: if these rows ever revert to a gap, the
annotation disappears with them instead of orphaning a hard-coded year list.

**Named upgrade path.** Add a `measurementUniverse` column to the allocations
table (values `endowment` | `investment_pool`, default `endowment`), orthogonal
to `basis` — the two dimensions are independent, since a pool-basis year can
itself be a target. Costs one migration plus one re-seed, in the same shape as
the FY2004 target transcription. **Triggers:** a second school's universe split
becoming curated (Stanford's congressional upgrade path clearing B1–B3, or the
open question about the universe of Harvard's FY2017+ actuals coming back
positive), or the human electing it. Until a trigger fires, a column serving
24 rows of one school would be a rail built ahead of its second instance.

**FY2004 target table (preserved here, not in the database):** the same
article's Table III gives the fiscal-2004 Pool A *target* allocation — Fixed
Income 10% (range 5–15), Real Assets 5% (0–10), U.S. Equity 21% (16–26),
International Equity 14% (9–19), Private Equity 20% (15–25), Marketable
Alternatives 20% (15–25), Real Estate 10% (5–15). Only the *actual* (Table II)
is stored, because one basis per school-year is the rule and actuals are the
product's primary question — same treatment as Princeton's targets. A future
basis-aware schema could store both; the transcription here is what makes that
flip cost one re-seed.

**MIT market-value basis note:** the stored series is as-first-reported
through FY2006 and restated from FY2007 onward (MIT's FY2010 reclassification;
boundary verified at FY2006/FY2007, ~0.4%). No alternative basis exists for
FY2006 and earlier.

### Princeton label mapping (task 1.6)

Princeton's endowment is managed by the Princeton University Investment Company
("PRINCO"), a University office. PRINCO's own asset-allocation table is
published inside Princeton's **Report of the Treasurer** (specifically its
"Report on Investments" section, authored by PRINCO), not as a standalone,
periodically-updated web page — so the headline dating risk anticipated for
this unit (an archive-capture timestamp standing in for an as-of date) never
actually arose. Every curated year's table carries **explicit "as of June 30,
YYYY" wording inside the same dated annual document**, so no reconciliation
dating (the Harvard method) was needed anywhere in this series. See the
dating subsection below for the full per-year evidence.

Every curated table publishes **both a Policy Target and an Actual** column
(e.g. FY2005: "Policy Target / Actual") for every allocation year. This
project stores **`basis: "actual"`** throughout — the mix PRINCO actually
held at each fiscal year end — because it is directly comparable to Yale's
and (mostly) Harvard's actual-basis years, and because Princeton discloses it
explicitly and dated every single year, unlike Harvard where target years
were curated specifically because actual wasn't available. **The Policy
Target column exists for every curated year and was not discarded — it is
recorded here, not in the JSON** (allocation rows have no `notes` field; see
`scripts/lib/seed-validate.ts`'s `AllocationRow` shape), because a
school-year can only hold one basis (validator-enforced uniqueness on
school/year/category). Target values are listed in the two tables below
alongside the curated Actual values.

#### Two label regimes, an overlap-verified merge, and why

PRINCO changed its own equity taxonomy once, between FY2018 and FY2020 (FY2019
has no table at all — see Coverage). The two regimes are **not** compatible
line-for-line, and the second one needed a real judgment call.

**Regime 1 — FY2005–FY2018 ("split" regime).** PRINCO reports a clean
three-way equity split: Domestic Equity, International Equity–Developed
Markets, International Equity–Emerging Markets (wording varies slightly
year to year — "International Equity: Developed Markets", "International
Equity – Developed", etc. — always the same two sub-lines). Fixed Income and
Cash are reported as two lines through FY2012 and as one combined line
"Fixed Income and Cash" from FY2013 on.

| PRINCO's published label | Years used | → category |
|---|---|---|
| Domestic Equity | FY2005–FY2018 | `us_public_equity` |
| International Equity – Developed Markets | FY2005–FY2018 | `intl_public_equity` |
| International Equity – Emerging Markets | FY2005–FY2018 | `intl_public_equity` |
| Independent Return | FY2005–FY2018, FY2020–FY2023 | `absolute_return` |
| Private Equity | FY2005–FY2018, FY2020–FY2023 | `private_equity_vc` |
| Real Assets | FY2005–FY2018, FY2020–FY2023 | `real_assets` |
| Fixed Income + Cash (two lines through FY2012) | FY2005–FY2012 | `fixed_income_cash` (summed) |
| Fixed Income and Cash (one line) | FY2013–FY2018, FY2020–FY2023 | `fixed_income_cash` |

International Equity–Developed and International Equity–Emerging are summed
into `intl_public_equity` the same way Harvard's "Foreign Equities + Emerging
Markets" were — Domestic Equity remains reported and curated separately, so
this is a true international-only merge, not a coarsening. `sourceLabel`
preserves both component names (Harvard style), e.g.
`"International Equity – Developed Markets + International Equity – Emerging Markets"`.

**Regime 2 — FY2020–FY2023 ("developed/EM" regime). `[JUDGMENT CALL]`**
Starting with the FY2020 report, PRINCO stopped publishing Domestic Equity as
a separate line. The equity sleeve is now split only into "Developed
Markets" and "Emerging Markets" — and **"Developed Markets" is not the old
"International Equity–Developed" relabeled; it now includes Domestic Equity
merged in.** This is confirmed by an overlap-verified arithmetic check
against Princeton's own historical target tables, the same evidentiary
standard as Yale's category merges and Harvard's Foreign+EM merge:

| Historical year | Old regime: Domestic Equity + Intl.–Developed (target) | New regime: "Developed Markets" (target, restated) |
|---|---|---|
| 2001 | 20.0% + 7.5% = **27.5%** (FY2011 report, Table 1) | **27.5%** (FY2020 report, Table 1) ✓ |
| 2006 | 15.0% + 8.5% = **23.5%** (FY2011 report, Table 1) | **23.5%** (FY2020 report, Table 1) ✓ |
| 2011 | 7.5% + 6.5% = **14.0%** (FY2010 report, Table 1) | **14.0%** (FY2020 report, Table 1) ✓ |

All three overlap years reconcile exactly, so "Developed Markets" = Domestic
Equity + International Equity–Developed is treated as settled, not assumed.

Because "Developed Markets" mixes US and non-US equity and we no longer have
the split, it cannot honestly go into `us_public_equity` or
`intl_public_equity` individually — both would misstate it (Article 4). It
does not belong in `other` either: at 6.5–10.7% of the portfolio in every
affected year it is not a small, catch-all residual (tripwire 1 territory if
forced there). The correct home is **`public_equity`** — the category this
project defines specifically for "no US/international split published" — by
summing Developed Markets + Emerging Markets, since together the two lines
are Princeton's *entire* public-equity sleeve with no US/international
distinction left in either one. This mirrors Harvard's FY2017+ regime
exactly (one undifferentiated `public_equity` line replacing a prior
US/international split), which is the documented precedent for this
category, not a coarsening invented for Princeton.

| PRINCO's published label | Years used | → category |
|---|---|---|
| Developed Markets + Emerging Markets (summed) | FY2020–FY2023 | `public_equity` |

`sourceLabel` on these rows is `"Developed Markets + Emerging Markets"`.

No `other` rows are used anywhere in the Princeton series.

#### Coverage

| Fiscal years | State | Why |
|---|---|---|
| FY2000–FY2004 | **no allocation** | Pre-2005 Reports of the Treasurer contain no PRINCO asset-class percentage table at all — only two-line NAV footnotes ("Equity accounts" / "Fixed income accounts" in dollars), which is exactly the kind of NAV/dollar table this project already rejects as a percentage source. Confirmed absent in FY2000, FY2001, FY2002, FY2004 (FY2003's report is a scanned-image PDF with no text layer at all — see build log). |
| FY2005–FY2018 | actual | Regime 1 (split equity), `basis: "actual"`, every year explicitly dated. |
| FY2019 | **no allocation** | No PRINCO Report on Investments section exists for FY2019 anywhere found on Princeton's finance site — only audited Financial Statements FY2019 (a NAV/dollar disclosure, rejected as a percentage source per the coverage rule). Returns and market value for FY2019 are still curated, from a Princeton press release (see below). |
| FY2020–FY2023 | actual | Regime 2 (developed/EM), `basis: "actual"`, every year explicitly dated. |
| FY2024–FY2025 | **no allocation** | The Report of the Treasurer dropped the percentage table entirely starting with the FY2024 edition — the "Asset Allocation" section now states only an aggregate ("94 percent of the portfolio is allocated toward [equity-like] investments") with no per-category breakdown. Confirmed in both the FY2024 and FY2025 editions. |

Returns are curated for **FY2001, FY2002, FY2004–FY2025** (24 years); **market values only for FY2005–FY2025 (21 rows)** — the FY2001, FY2002 and FY2004 rows carry a return with no market value, because the Reports of the Treasurer for those years print the return without an endowment value on the same basis
(24 of 26 years) — a longer, differently-shaped coverage than allocations,
per the coverage rule (returns/market values run independently). FY2000 and
FY2003 are gaps for returns/market value too: FY2000's report states no
headline return percentage or endowment-specific dollar figure anywhere in
the document (only total University net assets, a different, broader
measurement universe that this project does not substitute in); FY2003's
report is a scanned-image PDF with no extractable text and no OCR tooling is
available in this environment (see build log).

#### Princeton as-of dating

Every one of the 18 curated allocation years (FY2005–FY2018, FY2020–FY2023)
carries **explicit "as of June 30, YYYY" wording inside the same primary
document the percentages come from** — evidence class (a) in every case.
Unlike Harvard, no year required reconciliation-based dating (evidence class
(b)); the reconciliation method was used here only to validate the
**Developed-Markets category merge** across regimes (see above), never to
assign a fiscal year to an undated table. No year in this series is dated by
assumption or by publication year.

Each year's Report of the Treasurer prints the comparison table as "Table 2"
(or "Figure 2" in the earliest editions) headed **"Asset Allocation, June 30,
YYYY"**, immediately following prose that reads, verbatim in every year
(wording stable since FY2005): *"[Table/Figure] 2 compares Princo's
long-term Policy Portfolio asset allocation targets with the actual weights
as of June 30, YYYY."* From FY2016 on, the table heading itself appends the
*next* fiscal year's label to the Policy Target column only (e.g. "June 30,
2016 / FY 2017") — confirmed by checking that the Policy Target figures in
that column match the "every five years" historical target table's forward
year, not the Actual column, which stays dated to the report's own June 30.
This does not affect the curated data: only the Actual column (always dated
to the report's own fiscal year end) is used.

| Fiscal year | Evidence class | Quote |
|---|---|---|
| FY2005 | (a) explicit | "compares Princeton's long-term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2005" (Table/Figure 2 heading: "Asset Allocation, June 30, 2005") |
| FY2006 | (a) explicit | "the endowment's long-term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2006" |
| FY2007 | (a) explicit | "term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2007" |
| FY2008 | (a) explicit | "PRINCO's long-term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2008" (Figure 2 heading: "Asset Allocation, June 30, 2008") |
| FY2009 | (a) explicit | "Table 2 compares Princo's long-term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2009" (Table 2 heading: "Asset Allocation, June 30, 2009") |
| FY2010 | (a) explicit | Table 2 heading: "Asset Allocation, June 30, 2010"; same boilerplate prose |
| FY2011 | (a) explicit | Table 2 heading: "ASSET ALLOCATION, June 30, 2011" |
| FY2012 | (a) explicit | "Table 2 compares Princo's long-term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2012" (Table 2 heading: "ASSET ALLOCATION, June 30, 2012") — numeric grid recovered via `pdfminer.six` layout mode after `pypdf`'s default extraction scrambled this page's two-column layout; see build log |
| FY2013 | (a) explicit | Table 2 heading: "ASSET ALLOCATION, June 30, 2013" |
| FY2014 | (a) explicit | "Table 2 compares Princo's long-term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2014" (Table 2 heading: "ASSET ALLOCATION, June 30, 2014 / FY 2015") |
| FY2015 | (a) explicit | Table 2 heading: "ASSET ALLOCATION, June 30, 2015 / FY 2016" |
| FY2016 | (a) explicit | Table 2 heading: "ASSET ALLOCATION, June 30, 2016 / FY 2017" |
| FY2017 | (a) explicit | Table 2 heading: "ASSET ALLOCATION, June 30, 2017 / FY18" |
| FY2018 | (a) explicit | Table 2 heading: "ASSET ALLOCATION, June 30, 2018 / FY19" |
| FY2019 | (c) gap | No allocation table exists in any FY2019 Princeton document found (see Coverage) |
| FY2020 | (a) explicit | "Table 2 compares Princo's long-term Policy Portfolio asset allocation targets with the actual weights as of June 30, 2020" (heading: "ASSET ALLOCATION, June 30, 2020 / FY20") |
| FY2021 | (a) explicit | "...actual weights as of June 30, 2021" (heading: "ASSET ALLOCATION, June 30, 2021 / FY22") |
| FY2022 | (a) explicit | heading: "ASSET ALLOCATION, June 30, 2022 / FY22" |
| FY2023 | (a) explicit | heading: "ASSET ALLOCATION, June 30, 2023 / FY24"; footnote: "Policy targets represent those adopted as of May 2023, which went into effect for benchmarking purposes on July 1, 2023" (target-column note only — does not affect the dated Actual column used here) |
| FY2024, FY2025 | (c) gap | Table dropped from the report entirely; only an aggregate equity percentage remains (see Coverage) |

No year in this table is class (d) "assumed." The `[JUDGMENT CALL]` items
in this unit are the category-mapping decisions above, not the dating.

#### Notes on rounding and precision

- FY2007 sums to 99.9%, FY2016 to 100.1%, FY2018 to 99.9%, FY2022 to 100.1% —
  all within the validator's ±1.0pp tolerance, stored as published, nothing
  nudged (Harvard precedent).
- No negative `pct` values occur anywhere in the curated Princeton series
  (unlike Yale/Harvard's levered Cash years).
- Every allocation row uses `basis: "actual"`; no row uses `"target"`.


#### Harvard market-value basis note (integration QC, 2026-07-30)

Harvard's market values mix two published bases: FY2000–FY2006 and FY2010 are
the University's audited net-assets figures (no HMC document exists for those
years — established by CDX enumeration), while FY2007–FY2009 and FY2011+ are
HMC's published endowment values, which run ~0.4–0.8% below the University
line for the same years. The FY2010 point therefore sits ~0.57% above where
its neighbours' basis would place it (the press-reported $27.4B for FY2010 is
the HMC-basis equivalent — not a broader pool). Per the never-splice-silently
rule this is disclosed here and must be annotated at the point of display
(tasks 3.2/6.1).

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
      "returnSourceId": "yale-annual-report-fy2023",
      "marketValueUsdMillions": 40700,
      "marketValueSourceId": "yale-annual-report-fy2023"
    }
  ]
}
```

`marketValueUsdMillions` is always in **millions of USD** (so Yale at ~$40.7B is `40700`). `basis` is optional and defaults to `"actual"` — see the target-vs-actual section above.

**Each return-row figure carries its own citation** (`returnSourceId` for the
return, `marketValueSourceId` for the market value; often the same document —
then the same id appears twice). A school-year's return frequently comes from
an investment-office release while its market value comes from the financial
report, and one shared source id used to force a figure to cite a document
that doesn't contain it. Include a source field exactly when its figure is
present — the validator rejects a figure without its citation and a citation
without its figure. (Human-approved schema change, 2026-07-30; the old
single-`sourceId` shape is rejected with an unknown-field error.)

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

Series ids: `sp500`, `intl_equity`, `us_aggregate_bond`, `hedge_fund_index`, `public_pe_index`, `reit`, `cash`, `global_equity` (`src/lib/constants.ts` → `BENCHMARK_SERIES`). `global_equity` is curated FY2009–FY2025 (task 1.7); `hedge_fund_index` and `public_pe_index` are **permanently empty by decision** — the explicit-gap sleeve, see below.

### Instruments behind each series (task 1.4)

Fiscal-year total return = last observation on or before June 30 ÷ same for the prior June 30, − 1. Dividends reinvested. Full citations and per-series method notes are in `sources.json`.

| Series | Instrument | Covered | Why this one |
|---|---|---|---|
| `sp500` | S&P 500 **Total Return** Index (`^SP500TR`) | FY2000–FY2025 | The index level already includes reinvested dividends; price-only `^GSPC` would understate returns by roughly 2pp a year. |
| `us_aggregate_bond` | Vanguard Total Bond Market Index, Investor (`VBMFX`) | FY2000–FY2025 | Stands in for the Bloomberg US Aggregate, which isn't freely redistributable. Chosen over the BND ETF (2007) for full-window coverage. |
| `intl_equity` | Vanguard Total International Stock Index, Investor (`VGTSX`) | FY2000–FY2025 | Developed + emerging combined, matching how `intl_public_equity` is defined. Chosen over VXUS (2011) and EFA (2001). |
| `reit` | Vanguard Real Estate Index, Investor (`VGSIX`) | FY2000–FY2025 | Chosen over VNQ (2004) for coverage. **Listed REITs only** — see the honesty note below. |
| `cash` | 3-Month T-Bill rate, `TB3MS` via FRED | FY2000–FY2025 | FRED gives an annualized monthly *rate*, so the FY return compounds the twelve monthly rates: `prod(1 + rate/1200) − 1`. The only derived series here. |
| `global_equity` | Vanguard Total World Stock ETF (`VT`) | FY2009–FY2025 | Whole world market at market weights, for `public_equity` (schools that report public equity unsplit). VT's first full fiscal year is FY2009, which covers every year any school currently needs (Harvard's unsplit years start FY2017). VT is itself the ETF a copycat would buy, so series and proxy are literally the same instrument. Method cross-checked against published calendar-year returns to ±0.01pp (see `bench-vt` in `sources.json`). *(task 1.7)* |
| `hedge_fund_index` | **none — decided gap** | — | See below. |
| `public_pe_index` | **none — decided gap** | — | See below. |

**Instrument-selection principle** (`[JUDGMENT CALL]`, reversible by re-seeding): prefer the longest continuous history over the most familiar ticker, because one consistent basis across FY2000–FY2025 matters more than using today's popular ETF. Every instrument chosen is a low-cost index fund a DIY investor could actually have held — which keeps the benchmark series and the copycat's returns the same thing rather than two different things.

**Two series are permanently empty — the explicit-gap sleeve (task 1.7, decided).** No freely-citable, retail-investable series exists for `absolute_return` (hedge funds) or `private_equity_vc` back to FY2000: HFRI and Cambridge Associates are paywalled and non-redistributable, and the investable substitutes start far too late (PSP 2006, QAI 2009). Task 1.7 resolved this (spec question Q-001, owner-confirmed 2026-08-04): **the copycat covers only the publicly-replicable sleeve and shows these two categories as an explicit labelled gap** — a more honest answer than a fake hedge-fund proxy, and the one Article 4 prefers. The decision lives in the data, not just here: both categories have `proxy_mappings` rows carrying the `NO_PROXY_TICKER` sentinel (`"NONE"`, `src/lib/constants.ts`) whose `rationale` and `honestyNote` the Translator renders directly. The backtest engine (task 4.1) must treat a sentinel-mapped category as an uncovered slice and **report its weight, never silently renormalize** — those two categories are roughly half of Yale's portfolio in every year, so the gap's size is itself one of the honest results this site shows.

**Honesty note carried into the proxy table (task 1.7, done):** `reit` is *listed* real estate. It does not represent the direct real estate, timber, and energy holdings that make up much of an endowment's real-assets sleeve. Real, but a weak proxy — flagged as such in the `real_assets` mapping's `honestyNote`.

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

Exactly one row per category in `ALLOCATION_CATEGORIES` that any school actually uses — populated in task 1.7 (7 rows; `other` is defined but unused by any school, so it has no row). Two kinds of row exist:

- **Real proxies** (`VOO`, `VXUS`, `VT`, `BND`, `VNQ`): the ETF is the buyable share class of (or tracker of) the *same instrument* behind the category's benchmark series, so the copycat's returns and the benchmark series are one thing, not two. Each row's `sourceId` points at the series' instrument citation.
- **Decided gaps** (`absolute_return`, `private_equity_vc`): `etfTicker` is the `NO_PROXY_TICKER` sentinel (`"NONE"`) — see the explicit-gap sleeve note under the instruments table. The row exists so the decision and its plain-English reasoning live in the database and render transparently in the Translator.

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
- **Each return-row figure is paired with its own citation**: `returnPct` ⇔ `returnSourceId` and `marketValueUsdMillions` ⇔ `marketValueSourceId`, each required exactly when its figure is present. A figure without its source and a source without its figure are both errors.
- No duplicate rows on the keys the database enforces: (school, fiscal year, category), (school, fiscal year), (series, fiscal year), (category).
- **Every source id resolves to an entry in `sources.json`** (`sourceId` on allocations/benchmarks/proxies; `returnSourceId`/`marketValueSourceId` on return rows) — this is PRD rule 2 ("no citation, no number") enforced mechanically, from the files, so it holds under `seed:dry` with no database.
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
| `sources.json` | 95 citations across all five schools + benchmarks. Grows with each curation task. |
| `schools/yale.json` | 126 allocation rows (FY2000–FY2020, actual) + 26 return/market-value rows (FY2000–FY2025). |
| `schools/harvard.json` | 77 allocation rows (FY2005–FY2016 target, FY2017–FY2025 actual; FY2018/FY2022 never published) + 26 return/market-value rows (FY2000–FY2025, complete). |
| `schools/stanford.json` | 26 market-value rows (FY2000–FY2025, Aug-31 fiscal year). No allocations or returns — Merged Pool gap, see the Stanford section. |
| `schools/mit.json` | 42 allocation rows (FY2001/03/04 Pool A actual; FY2008 target; FY2013–15 actual) + 26 return/market-value rows (FY2000–FY2025, complete). |
| `schools/princeton.json` | 104 allocation rows (FY2005–FY2018, FY2020–FY2023, actual) + 24 return/market-value rows (FY2001–FY2025 with FY2000/FY2003 gaps). |
| `benchmark_returns.json` | 147 rows: 5 series complete FY2000–FY2025, `global_equity` FY2009–FY2025; `hedge_fund_index`/`public_pe_index` permanently empty by decision (explicit-gap sleeve, task 1.7). |
| `proxy_mappings.json` | 7 rows: 5 real proxies (VOO, VXUS, VT, BND, VNQ) + 2 decided gaps (`NONE` sentinel) — task 1.7. |
