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

Returns and market values are curated for **FY2001, FY2002, FY2004–FY2025**
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
