**2026-07-30 — Task 1.6.C (curate Princeton) — full FY2005–FY2018 + FY2020–FY2023 allocations, FY2001/2002/2004–FY2025 returns/market values.**

- **Delivered:** `data/schools/princeton.json` — 104 allocation rows across 18
  fiscal years (FY2005–FY2018, FY2020–FY2023), all `basis: "actual"`; 24
  `endowmentReturns` rows (FY2001, FY2002, FY2004–FY2025). 24 new sources in
  `data/sources.json` (prefix `princo-`), all cited, none unused. Sandbox
  `seed:dry` exits 0 (full command and output below); only pre-existing
  warnings (proxy mappings pending task 1.7; `hedge_fund_index` /
  `public_pe_index` / `global_equity` benchmark gaps pending task 1.7) — no
  new warnings introduced by Princeton's rows.
- **Headline risk (brief risk 1) did not materialize.** PRINCO's allocation
  table is published inside Princeton's dated annual **Report of the
  Treasurer** ("Report on Investments" section), not as an undated,
  periodically-updated web page. Every one of the 18 curated years carries
  explicit "as of June 30, YYYY" wording in the same document as the
  percentages — evidence class (a) throughout, full audit in
  `princeton-readme-section.md`'s "Princeton as-of dating" subsection. The
  Harvard reconciliation method was used exactly once in this unit, and not
  for dating: to verify a category merge (see next item), which is the use
  the brief anticipated as sanctioned ("the only sanctioned method" — used
  here for a mapping question, not a date-assignment question, since dates
  were never in doubt).
- **`[JUDGMENT CALL]` — the "Developed Markets" category merge (brief risk
  3).** PRINCO changed its equity taxonomy between FY2018 and FY2020: the
  Domestic Equity line disappears and "Developed Markets" now means
  domestic + international-developed combined, with Emerging Markets still
  broken out separately. Verified by reconciling PRINCO's own retroactively
  restated "every five years" target table (FY2020 report) against the
  pre-change tables (FY2010, FY2011 reports) at three non-adjacent overlap
  years: 2001 (20.0+7.5=27.5 vs restated 27.5 ✓), 2006 (15.0+8.5=23.5 vs 23.5
  ✓), 2011 (7.5+6.5=14.0 vs 14.0 ✓). All three reconcile exactly. Because
  "Developed Markets" now mixes US/non-US and can't honestly sit in
  `us_public_equity` or `intl_public_equity`, and is too large (6.5–10.7% of
  the portfolio) for `other`, FY2020–FY2023 use `public_equity` = Developed
  Markets + Emerging Markets summed, `sourceLabel: "Developed Markets +
  Emerging Markets"` — the same category Harvard's FY2017+ unsplit regime
  uses, not a new coarsening. Full mapping tables (both regimes) are in the
  README fragment.
- **`[JUDGMENT CALL]` — basis choice.** Every curated year publishes *both*
  a Policy Target and an Actual column in the same table (brief risk 2,
  confirmed real). Chose `basis: "actual"` throughout — matches Yale's and
  most of Harvard's convention, is what PRINCO actually held (not aimed
  for), and is dated explicitly every year. Target values are not discarded:
  every one is transcribed into the README fragment's mapping tables rather
  than a JSON `notes` field, because `AllocationRow` (`scripts/lib/seed-validate.ts`)
  has no `notes` field — the row shape is `fiscalYear, category, pct, basis,
  sourceLabel, sourceId` only, and a school-year can only carry one basis
  (validator-enforced uniqueness on school/year/category, no `basis` key).
  Reporting this per the brief: **this constraint (one basis per
  school-year) is exercised for the first time by a school where both bases
  are available and dated identically well** — Harvard's target years never
  had a same-year actual to compare against. No validator failure occurred;
  flagging only because the brief calls this an untested case.
- **FY2012's actual-weights table needed `pdfminer.six`, not `pypdf`
  defaults.** `pypdf`'s default text extraction scrambled this one page's
  two-column layout (target pie chart + Table 2 grid interleaved), producing
  only the pie-chart's numbers with jumbled labels and losing Table 2's
  numeric grid entirely, even though the surrounding prose ("Table 2
  compares... as of June 30, 2012") proved the table existed on the page.
  `pdfminer.six`'s layout-aware extraction recovered the full Table 2 grid
  cleanly. Confirmed no other year needed this — spot-checked via decimal-
  pattern grep (actual weights have non-round decimals like ".9", ".3", ".4"
  that a missing table would not produce) across all 18 years; only FY2012
  came up empty on the first pass.
- **FY2003's Report of the Treasurer is a scanned-image PDF with no text
  layer** (`pypdf` returns a page `/Resources` dict with `/XObject` but no
  `/Font` — confirmed programmatically, not just an empty-string heuristic).
  No OCR tooling is available in this environment (per COMMON.md's tooling
  notes) and none was installed. FY2003 return and market value are a
  documented gap for this reason, not because Princeton didn't publish them.
  Pre-2005 years generally lack any PRINCO percentage table at all (only
  two-line NAV footnotes — "Equity accounts" / "Fixed income accounts" in
  dollars — rejected as a percentage source per the coverage rule), so this
  only cost the return/market-value series, not allocations.
- **FY2019 has no Report of the Treasurer with an investment section.** The
  only FY2019 document found on Princeton's finance site is "Financial
  Statements FY2019" (audited, NAV-only — rejected as an allocation source).
  Used Princeton's own October 2019 press release
  (princeton.edu/news/2019/10/11/princeton-endowment-earns-62-percent-return)
  for FY2019's return (6.2%) and market value ($26,100M) — still a primary
  Princeton document, just not the Report of the Treasurer. No allocation
  row exists for FY2019 for this reason.
- **FY2024–FY2025: the allocation table was discontinued, not missing by
  accident.** Both editions' "Asset Allocation" section states only "94
  percent of the portfolio is allocated toward [equity-like] investments" —
  no per-category breakdown at all. Confirmed in both years independently
  (not just one year with the other assumed). Returns and market values are
  still curated for both years from the same documents.
- **Measurement-universe note, not a tripwire.** FY2008–FY2011 reports state
  both a broader "Endowment" figure and a narrower "actively managed by
  PRINCO" subset (e.g. FY2008: Endowment $16.3B vs PRINCO-managed $15.9B,
  ~2.5% apart). The Asset Allocation percentages describe the PRINCO-managed
  portfolio; `marketValueUsdMillions` uses the broader "Endowment" figure
  from the *same* Report on Investments section (matching how every other
  year in this project reports "the endowment's" size, and how later
  Princeton reports present the figures without the PRINCO-managed
  breakout). The gap between the two is consistently small (2–3%) across the
  years it's stated, well short of tripwire-6 territory (Stanford's Merged
  Pool problem was a ~25% gap touching both allocations and returns);
  flagged here for the record, not stopped on.
- **Dating audit:** full per-year evidence table is in
  `princeton-readme-section.md` under "Princeton as-of dating" — every one of
  the 18 allocation years is evidence class (a) explicit as-of wording, zero
  are class (b) reconciliation, zero are class (d) assumed.
- **Spot-check, three years, against documents not used for curation:**
  - **FY2021** — Markov Processes International's blog post "Princeton's
    declining returns: an equity hedge story" (independent financial-industry
    commentary, not a Princeton document) states Princeton's private-equity
    allocation "rose to 41.9%, well above its 30% target" for FY2021 —
    **exact match** to the curated `private_equity_vc` figure (41.9%) and its
    dating (FY2021, i.e. June 30, 2021).
  - **FY2013** — Princeton's own October 2013 press release
    (pwb.princeton.edu/2013/10/22/endowment-earns-11-7-percent-return, a
    different Princeton document from the Report of the Treasurer used for
    curation) independently confirms the FY2013 return (11.7%) and market
    value ($18.2 billion) and its dating to fiscal year 2013 / June 30, 2013.
    Category-level percentages were **not** found in any independent
    (non-Princeton, non-ROT) source after a real search (Markov Processes,
    Chief Investment Officer, Daily Princetonian, top1000funds.com,
    PitchBook, Institutional Investor were all searched by name for
    "Princeton FY2013 private equity 32.8 percent" and equivalents; none
    returned a category breakdown for that year) — reported as an
    unconfirmed-digits, confirmed-dating result, not silently upgraded to a
    full match.
  - **FY2018** — Princeton's own October 2018 press release
    (pwb.princeton.edu/2018/10/10/princeton-endowment-earns-14-2-percent-return,
    also princeton.edu/news/2018/10/08/...) independently confirms the FY2018
    return (14.2%) and market value ($25.9 billion) and its dating. One
    independent source (a Markov Processes blog post on FY2018 projections)
    states "more than 30 percent of the endowment was in venture capital and
    private equity" for FY2018 — consistent in direction and rough magnitude
    with the curated Private Equity figure (36.2%), but not precise enough to
    count as a digit-for-digit match; reported as partial corroboration, not
    inflated to a full match.
  - Honest summary: 1 of 3 spot-check years reconciles digit-for-digit on a
    category figure against a fully independent (non-Princeton) source; the
    other 2 reconcile the return/market-value figures and the fiscal-year
    dating against a different Princeton document than the one curated from,
    but not a category-level breakdown, because no independent source
    publishing Princeton's category-level percentages for those specific
    years turned up after a genuine search. This is reported as partial per
    Article 4 rather than overstated.
- **Split-provenance count: 0.** Every curated year's return and market
  value figure come from the same document (returnSourceId ==
  marketValueSourceId on every row) — including FY2019, where both come from
  the same press release.
- **Sandbox validation (verbatim):**
  ```
  npx tsx scripts/seed.ts --dry-run --data-dir <sandbox>
  Reading seed files from .../sandbox/
  Parsed: 5 school(s), 57 source(s), 307 allocation row(s), 68 endowment return row(s), 130 benchmark return row(s), 0 proxy mapping(s)
    warning  proxy_mappings.json: category `absolute_return` is used in allocations but has no ETF proxy mapping yet (task 1.7)
    warning  proxy_mappings.json: category `fixed_income_cash` is used in allocations but has no ETF proxy mapping yet (task 1.7)
    warning  proxy_mappings.json: category `intl_public_equity` is used in allocations but has no ETF proxy mapping yet (task 1.7)
    warning  proxy_mappings.json: category `private_equity_vc` is used in allocations but has no ETF proxy mapping yet (task 1.7)
    warning  proxy_mappings.json: category `public_equity` is used in allocations but has no ETF proxy mapping yet (task 1.7)
    warning  proxy_mappings.json: category `real_assets` is used in allocations but has no ETF proxy mapping yet (task 1.7)
    warning  proxy_mappings.json: category `us_public_equity` is used in allocations but has no ETF proxy mapping yet (task 1.7)
    warning  benchmark_returns.json: `global_equity` has no rows for FY2017, FY2019-FY2025, but allocations in those years map to it — the copycat backtest (task 4.1) would silently drop that slice
    warning  benchmark_returns.json: `hedge_fund_index` has no rows for FY2000-FY2025, but allocations in those years map to it — the copycat backtest (task 4.1) would silently drop that slice
    warning  benchmark_returns.json: `public_pe_index` has no rows for FY2000-FY2025, but allocations in those years map to it — the copycat backtest (task 4.1) would silently drop that slice
  Validation passed (10 warning(s)).
  Validation only — nothing written. Pass --write (or run `npm run seed`) to write.
  ```
  Sandbox built by copying `data/` to scratch, overwriting
  `sandbox/schools/princeton.json`, and splicing `princeton-sources.json`
  into `sandbox/sources.json` (Yale + Harvard + Stanford's already-curated
  rows included as-is, unmodified) — all 10 warnings are pre-existing and
  unrelated to Princeton's rows; none are new.
- **Tooling notes for future sessions.** `finance.princeton.edu`'s HTML pages
  are behind a Cloudflare challenge that blocks plain `curl` (returns a "Just
  a moment..." interstitial, HTTP 403) — but its **PDF assets are not**
  challenged and fetch cleanly with a browser `User-Agent` header, no Wayback
  Machine detour needed for any of the 24 Report of the Treasurer PDFs used.
  Wayback Machine (`web.archive.org`) *was* needed once, to resolve
  `finance.princeton.edu/document/3631` (a redirect-only node URL, itself
  Cloudflare-blocked live) to the underlying FY2019 Financial Statements PDF,
  and once for `web.archive.org/cdx/search/cdx` queries, which returned
  connection errors over `https://` but worked over `http://` in this
  environment — worth trying if a `cdx` query mysteriously times out.
- **Budget:** approximately 175–185k tokens (this unit's budget note called
  out the highest document count and per-document work of the four 1.6
  units; 24 PDFs were downloaded and text-extracted, several requiring
  multiple extraction passes).
- **Left undone and why (Article 10):** FY2000, FY2003, FY2019, FY2024,
  FY2025 allocations are gaps, each with a specific document checked and
  reason recorded above and in the README fragment — not oversights.
  FY2000/FY2003 returns and market values are gaps for the reasons above.
  The FY2013/FY2018 spot-check category-level figures remain independently
  *un*confirmed (dating and return/market-value are confirmed for both) —
  reported as partial rather than resolved, per the brief's instruction that
  a "done" that doesn't reproduce outside the curating session is a protocol
  breach; this is flagged rather than silently treated as fully verified.
