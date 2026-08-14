# Engineering Spec — University Endowment Investing Explorer (v1)

**Version 1.0.0** · status: approved · generated 2026-08-03 · approvers: Amay Bhatnagar

> Rendered view of `spec.json` (the source of truth), maintained **by hand** — this repo has no renderer script, so a change to `spec.json` is not reflected here until someone mirrors it. Edit `spec.json` first, then this file, in the same commit; never the reverse. This view is partial: it omits `in_scope`, `out_of_scope`, `constraints`, `environments`, `risk_register`, `glossary`, and most per-item technical and UX fields. Audience detail beyond the personas below lives in `PERSONAS.md` (adopted 2026-08-13; the PRD wins on conflicts) — that document is not part of the approved spec.

## Problem

Everyday DIY investors hear that universities like Yale grew their endowments with a famous investing strategy, but the information is buried in annual-report PDFs and finance jargon. There is no simple place to see how these endowments actually invested, what that strategy looks like rebuilt with ordinary ETFs, and whether it honestly beat simple index investing.

## Target users

- **DIY investor** — Manages own retirement/brokerage accounts; curious, not professional; needs plain English with every finance term defined.
- **Smart 22-year-old outside finance** — Not a separate audience but the reading-level bar every sentence must clear (BRD-004); needs any unfamiliar finance term defined where it appears, without leaving the page.

These two are the spec's `target_users` — the field that licenses a user story to name a persona. The six secondary personas and three anti-personas the owner adopted on 2026-08-13 are deliberately absent: they are design lenses, not sources of requirements, and they live in `PERSONAS.md`.

## Success metrics

- All 5 schools browsable in the History Explorer with allocation + returns charts over their disclosed coverage (Stanford: market-value-only per BRD OI-1). Measured by phone-width walkthrough at ship.
- Translator works for every school/fiscal-year with disclosed allocation data, with visible proxy mapping and fine print. Measured by rendering every school/year in the DB.
- Comparisons render for any school vs. proxy vs. all 3 benchmarks over any sub-period. Measured by exercising period-picker extremes.
- Methodology page lists every source_id in the DB; disclaimer visible on every page. Measured by automated check + walkthrough.
- Production URL publicly reachable (unauthenticated curl -I returns 200), Lighthouse performance and accessibility pass, works on phone screens.

## Architecture decisions

- **App-wide performance default: LCP < 2.5s on a mid-range phone over 4G; Lighthouse performance ≥ 90 and accessibility ≥ 95 on every route** — BRD-032 says 'loads fast' without numbers; one quantified default keeps every spec item testable (referenced as 'app perf default').
- **Runtime DB access is read-only; all writes go through seed files + npm run seed** — BRD-020: seed files are the single source of truth; anything else forks the truth.
- **Stanford presentation: market value over time only, with plain-English explanation; allocation/returns charts marked unavailable linking to methodology** — BRD OI-1, resolved by human 2026-08-03. Merged Pool is ~25% non-endowment with confirmed 2.9pp FY2024 return divergence — showing it as 'Stanford's endowment' would violate BRD-005 honesty.
- **Copycat forward runs use snapshot vintages: a school's last-disclosed mix may be carried forward through full benchmark coverage, labelled e.g. 'Yale's FY2020 mix, held unchanged by this copycat through FY2025' — never 'held since'** — TASKS 4.3 / task-1.3 proxy decision: gives users recent years without inventing allocation data; divergence from the school's actual returns is an honest, interesting result.
- **Charts render allocation coverage ends on the chart itself (boundary marker), not in captions** — TASKS 3.2: the returns chart beside it runs to FY2025; the reader notices the mismatch at the chart and needs the explanation there.
- **Proposed (Q-001, default per TASKS 1.7): hedge funds and private equity get no pretend proxy — the copycat covers only the publicly-replicable sleeve, with the remainder shown as an explicit labelled gap** — Those categories are ~half of Yale's portfolio; a fake proxy would be less honest than a visible gap (BRD-005). Final call sits with SPEC-005 curation.

## Milestones

- **M0 Foundation (verified)** — Already-built substrate: repo, hosting, schema, seed pipeline, curated dataset (SPEC-001, SPEC-002, SPEC-003, SPEC-004)
- **M1 Data complete** — Proxy mappings + final three benchmark series decided and seeded — unblocks all copycat math (SPEC-005)
- **M2 Skeleton** — Walking skeleton: shell + data access + glossary component, deployed on preview (SPEC-006, SPEC-007, SPEC-008)
- **M3 History Explorer** — All five school pages complete including Stanford's OI-1 variant (SPEC-009, SPEC-010, SPEC-011, SPEC-012)
- **M4 Translator** — Backtest engine + translator page + vintage-labelled performance (SPEC-013, SPEC-014, SPEC-015)
- **M5 Comparisons** — Compare page complete (SPEC-016)
- **M6 Ship** — Methodology, editorial pass, production readiness, public access (SPEC-017, SPEC-018, SPEC-019, SPEC-020)

---

## Spec items

### SPEC-001 — Database schema and data model (6 tables)

*data_model · data · priority must · status **verified** · M0 Foundation (verified) · owner claude*

Drizzle schema for schools, allocations, endowment_returns, benchmark_returns, proxy_mappings, sources, pushed to Neon. Already built and verified live (TASKS 1.1).

Normalized relational model where every fact row carries a source_id foreign key into sources. Category and series identifiers constrained to the constants in src/lib/constants.ts (8 normalized allocation categories; benchmark series sp500, us_aggregate_bond, intl_equity, reit, cash, plus hedge_fund_index, public_pe_index, global_equity pending SPEC-005).

**Traces to:** BRD-023, BRD-027, BRD-028 · **Depends on:** nothing

**Acceptance criteria:**
- Given the live Neon database, When drizzle-kit push runs against src/lib/db/schema.ts, Then it reports no changes (schema and code in sync).
- Given any fact row in allocations/endowment_returns/benchmark_returns, When its source_id is looked up, Then a sources row exists (FK enforced or seed-validated).

**QA sign-off:**
- Already met: tables live, push idempotent (TASKS 1.1 build log).

**Rollback:** Schema is additive-only so far; a rollback is drizzle-kit push of the prior schema.ts from git history. Data restores via re-seed from git-versioned seed files.

### SPEC-002 — Seed script with validation (npm run seed)

*infra · data · priority must · status **verified** · M0 Foundation (verified) · owner claude*

Reads data/, validates everything before opening a connection, upserts on natural keys, prunes rows deleted from seed files. Already built and verified both ways (TASKS 1.2).

**Traces to:** BRD-020, BRD-021, BRD-022, BRD-029 · **Depends on:** SPEC-001

**Business rules:**
- Allocations per school-year must sum to ~100% (±0.1 tolerance per DATA-README).
- Every row's source_id must exist in sources — no citation, no number (BRD-021).
- Nothing is written if any validation check fails (all-or-nothing).

**Acceptance criteria:**
- Given valid seed files, When npm run seed runs twice, Then the second run is idempotent (no changes).
- Given a seed file with an uncited or non-summing row, When npm run seed runs, Then it exits 1 with the specific errors and the DB is untouched.
- Given a row deleted from a seed file, When npm run seed runs, Then the corresponding DB row is pruned.

**QA sign-off:**
- Already met (TASKS 1.2 build log).

**Rollback:** Seed files are git-versioned; rollback = git revert the seed-file change and re-run npm run seed (the script prunes rows removed from files).

### SPEC-003 — Curated dataset: 5 schools + benchmark series, FY2000–FY2025

*data_model · data · priority must · status **verified** · M0 Foundation (verified) · owner claude*

Hand-curated, cited, QC-verified seed data for Yale, Harvard, MIT, Princeton, Stanford plus 5 complete benchmark series, seeded to Neon. Already done (TASKS 1.3–1.6) with documented per-school coverage limits.

Coverage as verified: Yale returns/market values FY2000–FY2025, allocations FY2000–FY2020 (Yale stopped publishing the table after 2020). Harvard allocations 77 rows FY2005–FY2025 (FY2018/FY2022 never published), returns/market values complete FY2000–FY2025. Princeton 104 allocation rows + 24 return rows. MIT 42 allocation rows (sparse — pool-basis and congressional-response years) + complete 26-year returns. Stanford market values only FY2000–FY2025 (Aug-31 FY), allocations/returns a documented structural gap (Merged Pool ≠ Endowment; BRD OI-1). Benchmarks: sp500, us_aggregate_bond, intl_equity, reit, cash complete FY2000–FY2025; hedge_fund_index, public_pe_index, global_equity deliberately empty pending SPEC-005.

**Traces to:** BRD-010, BRD-017, BRD-020, BRD-021, BRD-023, BRD-024, BRD-025, BRD-026, BRD-027, BRD-028 · **Depends on:** SPEC-001, SPEC-002

**Acceptance criteria:**
- Given the seeded database, When any allocation school-year is summed, Then it totals 100 ±0.1.
- Given any curated number, When traced via source_id, Then a primary-document citation exists.
- Given the 60/40 composite, When compared to Vanguard's balanced index fund FY2000–FY2025, Then all 26 years agree within ~1pp (verified in TASKS 1.4).

**QA sign-off:**
- Already met (TASKS 1.3–1.6 build logs and DATA-README).

**Rollback:** Seed files are git-versioned; any data correction is a seed-file edit + re-seed.

### SPEC-004 — Hosting and database plumbing (Vercel + Neon)

*infra · platform · priority must · status **verified** · M0 Foundation (verified) · owner claude_with_human_gate*

GitHub repo wired to Vercel Pro with auto-deploy on main; Neon integration injecting DATABASE_URL; .env.local gitignored. Already done (TASKS 0.1–0.5, human tasks 0.3/0.4).

**Traces to:** BRD-031, BRD-034 · **Depends on:** ext: Vercel project import (human, done), ext: Neon integration linked (human, done)

**Acceptance criteria:**
- Given a push to main, When Vercel builds, Then the deployment goes live automatically (verified: starter page deployed).
- Given a server component, When it queries via the data access layer, Then Neon responds using the injected DATABASE_URL.

**QA sign-off:**
- Already met (TASKS Phase 0 build log).

**Rollback:** Vercel instant rollback to any previous deployment from the dashboard; no data implications (runtime is read-only).

### SPEC-005 — ETF proxy-mapping curation + final three benchmark series (task 1.7)

*data_model · data · priority must · status **approved** · M1 Data complete · owner claude*

Curate proxy_mappings (each allocation category → ETF ticker + plain-English rationale + honesty note where weak) and decide/seed the three deliberately-empty benchmark series (hedge_fund_index, public_pe_index, global_equity). The benchmark series and the ETF proxy for a category must be the same instrument or the copycat comparison is incoherent.

Every category used in any school's allocations gets a mapping or a documented reason it has none. Front-runner for global_equity: Vanguard Total World (VT/VTWSX), first full fiscal year FY2009, which covers every year currently needed. For hedge funds and private equity (~half of Yale's portfolio in many years) no freely-citable investable series reaches back to FY2000; the proposed default (Q-001) is the explicit-gap sleeve: the copycat covers only the publicly-replicable sleeve and shows the remainder as a labelled gap. Carry forward the honesty note that reit is listed real estate only.

**Traces to:** BRD-011, BRD-012, BRD-024 · **Depends on:** SPEC-003

**Business rules:**
- Proxy instrument and benchmark series for a category must be the identical instrument.
- Every ETF chosen must be ordinary and widely available (standard US brokerage, no accreditation/minimums — BRD assumption 4).
- Every mapping row: ticker + one-sentence plain-English rationale + honesty note where the proxy is weak.
- No number enters seed files without a citation (BRD-021).

**Edge cases:**
- Category present in one school's allocations but no others
- Category with no honest proxy (hedge funds, PE, venture) — explicit-gap marker, never a pretend proxy
- ETF inception later than FY2000 — document first covered fiscal year per series

**Acceptance criteria:**
- Given every category used in any school's allocations, When proxy_mappings is queried, Then each has an ETF mapping or a documented no-proxy reason.
- Given each mapped category, When its benchmark series is compared to its ETF proxy, Then they are the same instrument.
- Given the seeded series, When npm run seed re-runs, Then it is idempotent and all validations pass.

**QA sign-off:**
- All acceptance criteria green
- DATA-README updated with instruments, coverage windows, and the sleeve decision
- TASKS 1.7 checked off with build-log note

**Rollback:** git revert the seed-file commit and re-seed (script prunes removed rows).

### SPEC-006 — Site shell: header/nav, footer with disclaimer, responsive, dark-mode friendly

*ui · shell · priority must · status **approved** · M2 Skeleton · owner claude*

App-wide layout with nav (Explore, Compare, Methodology), a footer disclaimer visible on every page, responsive from phone width up, dark-mode friendly, plain-English tone.

**Traces to:** BRD-001, BRD-003, BRD-033 · **Depends on:** nothing

**Business rules:**
- Disclaimer text must state the site is educational, not financial advice, and is never hidden or collapsed (BRD-003).

**Edge cases:**
- Very narrow screens (320px)
- Long school names in nav context
- No-JS render (server components should still produce full HTML)

**Acceptance criteria:**
- Given any route in the app, When it renders, Then header nav and footer disclaimer are present.
- Given a 320px-wide viewport, When any route renders, Then there is no horizontal scroll and nav remains usable.
- Given OS dark mode, When the site renders, Then colors adapt with readable contrast in both themes.

**E2E scenarios:**
- Visit every top-level route; assert nav + disclaimer present and no horizontal overflow at 320px.

**QA sign-off:**
- All routes render inside shell
- Disclaimer on every page
- Dark/light both legible

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-007 — Data access layer: typed server-side query functions

*api · data-access · priority must · status **approved** · M2 Skeleton · owner claude*

One module of typed query functions — schools list, allocations by school, returns by school, market values, benchmarks by series, proxy mappings, sources — as the only DB touchpoint for pages.

**Traces to:** (technical enabler) · **Depends on:** SPEC-001, SPEC-004

**Business rules:**
- Queries never filter out coverage gaps silently — missing years are returned as missing so charts can annotate them (BRD-005).

**Edge cases:**
- School with no allocation rows (Stanford)
- Fiscal years present in returns but not allocations (Yale FY2021+)
- Series with partial coverage (global_equity from FY2009)

**Acceptance criteria:**
- Given the seeded DB, When each query function runs (exercised by tests or a debug page), Then real seeded rows return with correct types.
- Given Stanford, When getAllocations runs, Then it returns an empty set (not an error) so the UI can render the OI-1 explanation.

**Integration tests:**
- getSchools returns 5 schools
- getAllocations('yale') years span FY2000–FY2020 and each year sums ~100
- getAllocations('stanford') returns empty
- getBenchmarks(['sp500']) has 26 rows

**QA sign-off:**
- All integration tests green against seeded dev DB.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-008 — Plain-English term definitions (first-use glossary component)

*ui · shell · priority must · status **approved** · M2 Skeleton · owner claude*

A reusable component + copy convention so every finance term is defined on first use per page — inline expandable definition or styled tooltip-equivalent that also works on touch and keyboard.

**Traces to:** BRD-004 · **Depends on:** SPEC-006

**Business rules:**
- Definition copy comes from one shared glossary source (aligned with the BRD §10 glossary) so a term is defined identically everywhere.
- First use per page gets the affordance; later uses may repeat it but must not omit a definition that page never gave.

**Edge cases:**
- Term inside a chart tooltip (define in adjacent prose instead)
- Touch devices (tap to toggle, not hover-only)
- Screen readers (definition exposed via accessible description, not title attribute)

**Acceptance criteria:**
- Given a page using the term 'annualized return', When it first appears, Then a reader can reveal its plain-English definition without leaving the page, by mouse, touch, or keyboard.
- Given a screen reader, When it encounters a defined term, Then the definition is announced via an accessible relationship.

**Unit tests:**
- Toggle by click, Enter, and Space; aria-expanded flips; definition text sourced from glossary module

**QA sign-off:**
- Component accessible per criteria; glossary module covers all BRD §10 terms.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-009 — School picker and school page (story blurb + headline stats)

*feature · history-explorer · priority must · status **approved** · M3 History Explorer · owner claude*

Explore entry: pick one of the five schools; each school page shows its plain-English story blurb (2–3 paragraphs, sourced facts only) and headline stats (latest market value, 10-yr and 25-yr annualized return where computable).

**Traces to:** BRD-002, BRD-006, BRD-009 · **Depends on:** SPEC-006, SPEC-007, SPEC-008

**Business rules:**
- Blurbs contain sourced facts only, written fresh in plain English (2–3 paragraphs) — every factual claim traceable to a source on the methodology page.
- Annualized returns computed by geometric compounding of fiscal-year returns; windows shown only where the full window of data exists (Stanford: return stats omitted per OI-1, market value shown instead).
- No copy suggests the reader should invest like the school (BRD-002).

**Edge cases:**
- Stanford: no returns → headline stats show latest market value + 'returns unavailable' with OI-1 explanation link
- 10-yr window spans a school's missing return year (Princeton gaps) → omit the stat rather than bridge the gap
- Unknown school slug in URL → 404 page

**Acceptance criteria:**
- Given the five schools, When each school page loads, Then blurb and headline stats render from DB data (TASKS 3.1 check).
- Given Stanford's page, When it loads, Then latest market value shows, return stats are absent, and a plain-English note explains why with a methodology link.
- Given a 25-yr annualized figure, When recomputed by hand from the seeded fiscal-year returns, Then it matches to 0.1pp.

**Unit tests:**
- Geometric annualization matches hand-computed 3-year toy case
- Window with a missing year returns 'not computable'

**E2E scenarios:**
- Load all 5 school pages; assert blurb present, stats present (or Stanford variant), no unexplained jargon markers

**QA sign-off:**
- All 5 pages render from DB; stats hand-verified for one school; Stanford variant correct.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-010 — Allocation-over-time chart with on-chart coverage-end annotation

*ui · history-explorer · priority must · status **approved** · M3 History Explorer · owner claude*

Stacked-area allocation chart per school spanning that school's disclosed coverage, with the coverage end annotated on the chart itself (e.g. boundary marker: 'Yale last disclosed its allocation mix in FY2020'). Read the dataviz skill before writing any chart code.

**Traces to:** BRD-005, BRD-007, BRD-027, BRD-028 · **Depends on:** SPEC-009

**Business rules:**
- Chart spans only the school's disclosed allocation coverage — never interpolate or extend (BRD-005).
- Coverage end annotated on the chart itself, not a caption: the returns chart beside it runs to FY2025 and the reader needs the explanation at the moment they notice the mismatch (TASKS 3.2).
- Categories use the normalized set with consistent colors across all schools (BRD-028).

**Edge cases:**
- Harvard's unpublished FY2018/FY2022 → visible gap or break, not interpolation
- MIT's sparse years → chart must not imply continuity between distant points; consider discrete columns
- Stanford → this chart does not render (SPEC-012 variant)
- A school-year summing to 99.9/100.1 (tolerance) → normalize display to 100% stack with underlying values in tooltip

**Acceptance criteria:**
- Given Yale, When its allocation chart renders, Then it spans FY2000–FY2020 with a boundary marker labelled about FY2020 being the last disclosed mix (TASKS 3.2 check).
- Given seeded data for any school-year, When compared to the chart tooltip, Then values match the DB exactly.
- Given a 375px-wide phone, When the chart renders, Then labels and legend are legible and the chart scrolls or reflows without clipping.

**Unit tests:**
- Yale transform ends at FY2020 and flags coverage end
- Harvard transform emits explicit gaps at FY2018/FY2022

**E2E scenarios:**
- Yale chart shows boundary annotation; tooltip matches a spot-checked seeded value

**QA sign-off:**
- Chart matches seeded data; coverage-end annotation on-chart; legible on phone (TASKS 3.2 checks).

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-011 — Annual returns chart (bar, with S&P 500 overlay toggle)

*ui · history-explorer · priority must · status **approved** · M3 History Explorer · owner claude*

Per-school fiscal-year returns as a bar chart with a toggleable S&P 500 overlay; tooltip shows year + values.

**Traces to:** BRD-008, BRD-027 · **Depends on:** SPEC-009, SPEC-010

**Business rules:**
- Negative years render plainly (below axis) — honesty over narrative (BRD-005).
- Overlay compares identical fiscal-year windows (benchmarks are FY-aligned, BRD-027).

**Edge cases:**
- Princeton's missing return years → visible gap, annotated like SPEC-010
- Stanford → chart replaced by the SPEC-012 unavailable-state
- Overlay toggled on for a school whose coverage is shorter than the S&P series → overlay clipped to the school's window

**Acceptance criteria:**
- Given any school with returns, When the chart renders, Then bar values match the DB (TASKS 3.3 check) and tooltips show year + value(s).
- Given the overlay toggle, When enabled, Then S&P 500 fiscal-year returns appear for exactly the school's covered years.
- Given a negative return year, When rendered, Then it displays below the axis with the same prominence as positive years.

**Unit tests:**
- Princeton transform emits gaps, not zeros
- Overlay series clipped to school coverage window

**QA sign-off:**
- Values match DB; toggle works; phone-legible.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-012 — Stanford market-value-only presentation (OI-1)

*feature · history-explorer · priority must · status **approved** · M3 History Explorer · owner claude*

Stanford's school page shows endowment market value over time (FY2000–FY2025, Aug-31 fiscal year with the ~2-month offset disclosed at point of display) instead of allocation/returns charts, each marked 'unavailable' with a plain-English explanation and methodology link.

**Traces to:** BRD-007, BRD-008, BRD-025, BRD-027 · **Depends on:** SPEC-009, SPEC-010

**Business rules:**
- Never present Merged Pool figures as 'Stanford's endowment' (OI-1; confirmed 2.9pp FY2024 divergence).
- The unavailable-state explanation must be plain-English and specific: Stanford only publishes allocation/returns for a bigger shared pool that isn't the endowment; the full story lives on the methodology page.
- Market-value chart labels Stanford's own fiscal-year naming (FY2025 = Sep 2024–Aug 2025) and discloses the ~2-month offset at the point of display (BRD-027).

**Edge cases:**
- Comparisons/Translator entry points on Stanford's page: hidden or clearly disabled with the same explanation, depending on SPEC-005's outcome (no allocation data → no copycat for Stanford)

**Acceptance criteria:**
- Given Stanford's school page, When it renders, Then a market-value-over-time chart shows FY2000–FY2025 with Aug-31 fiscal-year labeling and offset disclosure.
- Given the allocation and returns sections, When rendered for Stanford, Then each shows an 'unavailable' explanation with a methodology link — never Merged Pool numbers.
- Given the seeded market values, When spot-checked against the chart, Then values match.

**E2E scenarios:**
- Load /explore/stanford; assert market-value chart, two explanation blocks, zero allocation/returns series elements

**QA sign-off:**
- OI-1 presentation verified; offset disclosure present; methodology link works.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-013 — Backtest engine (pure functions + hand-computed unit tests)

*feature · backtest · priority must · status **approved** · M4 Translator · owner claude*

The most correctness-critical code in the app: given {category, pct} weights, map to proxy series via proxy_mappings and compute year-by-year portfolio returns FY-to-FY with annual rebalancing, growth of $10k, annualized return, best/worst year. Pure functions, no I/O.

Annual rebalancing means each fiscal year the portfolio return is the weight-dot-product of that year's proxy-series returns (weights reset every year). Growth of $10k compounds those yearly returns. Annualized return is the geometric mean. Where SPEC-005 decided a category has no proxy (explicit-gap sleeve), the engine computes on the replicable sleeve renormalized to 100% and reports the uncovered fraction so the UI can label the gap — it must never silently renormalize without reporting.

**Traces to:** BRD-013, BRD-014 · **Depends on:** SPEC-005, SPEC-007

**Business rules:**
- Annual rebalancing only; no taxes or fees modeled — and the fine print says so (BRD-014).
- Computed strictly from stored annual series (BRD-013); the engine takes series as inputs and performs no I/O.
- Uncovered (no-proxy) allocation fraction is always returned alongside results, never swallowed.
- A requested window containing a year with a missing proxy-series value fails loudly (returns an explicit 'not computable for FYxxxx') rather than skipping the year.

**Edge cases:**
- Weights not summing to exactly 100 (seed tolerance ±0.1) → normalize and record the adjustment
- Single-year window (annualized = that year's return)
- Negative-return years in best/worst detection
- Category with zero weight
- Window entirely before a proxy series' first covered year

**Acceptance criteria:**
- Given the 60/40 weights and seeded sp500/us_aggregate_bond series, When the engine runs FY2000–FY2025, Then yearly returns match hand-computed values exactly and the growth-of-$10k endpoint matches to the cent (TASKS 4.1 check).
- Given a 3-year toy dataset computed by hand, When the engine runs, Then yearly portfolio returns, growth series, annualized return, and best/worst year all match the hand computation.
- Given a portfolio with an uncovered category, When the engine runs, Then results carry the uncovered fraction and the sleeve-renormalization is explicit in the output.

**Unit tests:**
- Hand-computed 3-year toy portfolio: yearly returns, growth series, annualized, best/worst
- 60/40 FY case matching TASKS 1.4's Vanguard cross-check window
- Uncovered-sleeve renormalization reports the gap fraction
- Missing series year → explicit not-computable, not silent skip
- Weights summing to 99.9 → normalized with adjustment recorded

**QA sign-off:**
- All unit tests green; a reviewer re-derives the toy case by hand and matches.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-014 — Translator page: school + year → copycat ETF portfolio with fine print

*feature · translator · priority must · status **approved** · M4 Translator · owner claude*

Pick school + fiscal year → endowment allocation beside the copycat ETF portfolio (table: category, endowment %, ETF, why this ETF), with the fine-print box on what a copycat cannot replicate. Year picker offers only years with disclosed allocations.

**Traces to:** BRD-002, BRD-011, BRD-012, BRD-014, BRD-015 · **Depends on:** SPEC-005, SPEC-007, SPEC-008, SPEC-006

**Business rules:**
- Proxy mapping shown transparently from the DB — the mapping is data, not prose (BRD-012).
- Missing years get one plain sentence explaining why they're absent, not silent omission (TASKS 4.2).
- Stanford is not offered (no allocation years exist) — its entry explains why, consistent with SPEC-012.
- Nothing on the page phrases the portfolio as a recommendation (BRD-002): descriptive voice only.

**Edge cases:**
- School-year where a category maps to the explicit gap (hedge funds/PE)
- Year picker for MIT's sparse non-contiguous years
- Deep link to an invalid school/year combination → friendly redirect to valid picker state

**Acceptance criteria:**
- Given every school/year with allocation data in the DB, When the translator renders, Then the copycat table renders completely (TASKS 4.2 check).
- Given a category with an honesty note, When the table renders, Then the note is visible without interaction at desktop and reachable within one tap on phone.
- Given any translator view, When rendered, Then the fine-print box is present with all four cannot-replicate items plus the rebalancing/no-taxes-fees statement.
- Given the year picker for Yale, When opened, Then it offers exactly FY2000–FY2020 and a sentence explains the missing recent years.

**Unit tests:**
- Year eligibility: only years with allocation rows; Stanford excluded with reason

**E2E scenarios:**
- Render every valid school/year; assert table completeness and fine-print presence

**QA sign-off:**
- Renders for every school/year in DB; fine print verified against BRD-015's four items.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-015 — Copycat performance section (growth-of-$10k vs actual, vintage-labelled forward runs)

*feature · translator · priority must · status **approved** · M4 Translator · owner claude*

On the translator result: growth-of-$10k chart of the copycat portfolio vs the school's actual returns over the available period, using the SPEC-013 engine. Snapshot vintages may run forward through full benchmark coverage with unambiguous labeling ('Yale's FY2020 mix, held unchanged by this copycat through FY2025' — never 'held since').

**Traces to:** BRD-005, BRD-013, BRD-016, BRD-018 · **Depends on:** SPEC-013, SPEC-014, SPEC-010

**Business rules:**
- The vintage label must make the holding unmistakably the copycat's and not the school's (exact phrasing pattern from TASKS 4.3).
- Divergence between copycat and the school's actual returns after the snapshot year is shown plainly, never smoothed (BRD-005).
- Uncovered-sleeve gaps from SPEC-013 are labelled on the chart (e.g. 'copycat covers X% of the mix').

**Edge cases:**
- School's actual returns end before benchmark coverage (chart windows differ) → clip to honest common windows with labels
- Snapshot year = most recent allocation year (no forward divergence to show)
- Very short windows (1–2 years)

**Acceptance criteria:**
- Given a school/year with data, When the section renders, Then chart numbers match SPEC-013 engine output exactly (TASKS 4.3 check).
- Given a forward run, When the vintage label renders, Then it names the mix's fiscal year and says the copycat holds it unchanged — phrasing that cannot be read as the school's own holding.
- Given a period where the copycat diverges from actual returns, When rendered, Then both lines are equally prominent and the divergence is visible.

**Unit tests:**
- Vintage forward-run assembles snapshot weights + full benchmark window
- Common-window clipping logic

**E2E scenarios:**
- Yale FY2020 vintage run through FY2025 renders with the exact label pattern and visible divergence

**QA sign-off:**
- Numbers match engine; vintage label unambiguous; honest divergence visible (TASKS 4.3 checks).

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-016 — Compare page: school vs copycat vs benchmarks over a chosen period

*feature · comparisons · priority must · status **approved** · M5 Comparisons · owner claude*

Pick school(s) + period → growth-of-$10k lines for actual endowment, copycat proxy, S&P 500, 60/40, 70/30, plus a stats table (annualized return, best/worst year). Truth even when unflattering.

**Traces to:** BRD-005, BRD-016, BRD-017, BRD-018, BRD-019 · **Depends on:** SPEC-013, SPEC-015, SPEC-007, SPEC-006

**Business rules:**
- Benchmark set is exactly S&P 500, 60/40, 70/30 (BRD-017); composites computed by the SPEC-013 engine from stored series.
- All series share the identical fiscal-year window; period picker bounds derive from the intersection of available coverage per series, with exclusions labelled.
- If a benchmark beat the endowment over the chosen period, the numbers say so with no softening copy (BRD-005).
- Stanford: no actual-returns or copycat series exist — offer benchmarks-only comparison with the OI-1 explanation, or exclude with explanation (builder picks the cleaner UX, consistent with SPEC-012).

**Edge cases:**
- Sub-period of 1 year (annualized = that year)
- Period where copycat has sleeve gaps → label as in SPEC-015
- School with return gaps inside the chosen period (Princeton) → window bounds exclude un-bridgeable gaps with an explanation
- All five series at phone width (legend/eyeline crowding)

**Acceptance criteria:**
- Given any school and any valid sub-period, When the page renders, Then all applicable series render and stats match SPEC-013 engine output (TASKS 5.1 check).
- Given the FY2009–FY2025 period for a school the S&P beat, When rendered, Then the stats table shows it plainly with no qualifying copy.
- Given the period picker, When opened for each school, Then bounds match that school's actual coverage intersected with benchmark coverage.

**Unit tests:**
- Period bounds: Yale, Princeton (gaps), Stanford (variant)
- Composite 60/40 and 70/30 assembled from stored series via engine

**E2E scenarios:**
- Any-school full-period render; 1-year window; unflattering period shows plainly

**QA sign-off:**
- Any combination renders; stats match engine (TASKS 5.1 checks).

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-017 — Methodology page: every source, coverage story, proxy rationale, caveats

*feature · methodology · priority must · status **approved** · M6 Ship · owner claude*

Lists every source in the sources table; tells the full allocation-coverage story per school (what each stopped publishing and when, why NAV-basis figures were rejected rather than footnoted); proxy-mapping rationale; data caveats; update cadence.

**Traces to:** BRD-010, BRD-021, BRD-027, BRD-028, BRD-030 · **Depends on:** SPEC-007, SPEC-006, SPEC-005

**Business rules:**
- Every source_id present anywhere in the DB appears on this page — enforced by an automated check, not eyeballing (TASKS 6.1 check).
- The coverage story appears for every school whose allocations end before FY2025, including the plain-English definition of 'different measurement basis' and why NAV-basis substitutes were rejected.
- Stanford's Merged Pool story gets its full plain-English treatment here (SPEC-012 links to it).
- Fiscal-year conventions (June 30 four schools; Stanford Aug 31 offset) documented (BRD-027).

**Edge cases:**
- Sources cited only by benchmark rows (must still appear)
- A source used by hundreds of rows (grouped presentation, one entry)

**Acceptance criteria:**
- Given every source_id in the database, When the methodology page renders, Then each appears exactly once with title and document/URL (automated check green).
- Given each school with truncated allocation coverage, When the page renders, Then its coverage story is present, including the measurement-basis explanation.
- Given the proxy table from SPEC-005, When rendered here, Then each mapping's rationale and honesty notes appear.

**Integration tests:**
- source-coverage completeness check (DB vs rendered page)

**QA sign-off:**
- Automated source check green; coverage story present for every truncated school (TASKS 6.1 checks).

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-018 — Disclaimer and plain-English editorial pass (site-wide)

*feature · content · priority must · status **approved** · M6 Ship · owner claude*

Site-wide review: footer disclaimer + translator fine print verified against PRD rule 1; every page swept for unexplained jargon and advice-flavored copy; tone consistent.

**Traces to:** BRD-002, BRD-003, BRD-004, BRD-005 · **Depends on:** SPEC-009, SPEC-014, SPEC-015, SPEC-016, SPEC-017

**Business rules:**
- Zero instances of copy telling a user what to do with their money — including implicit forms ('consider adding…', 'a smart investor would…').
- Every finance term on every page is defined on first use or is in everyday vocabulary (BRD-004 bar: smart 22-year-old outside finance).
- No page lacks the disclaimer (BRD-003).

**Edge cases:**
- Jargon inside chart annotations and tooltips (easy to miss in a copy sweep)
- Error/404 pages (still need the disclaimer via layout)

**Acceptance criteria:**
- Given every route, When rendered, Then the disclaimer is present (automated route sweep).
- Given a full-copy export of every page, When reviewed against the jargon bar, Then every flagged term has a first-use definition (TASKS 6.2 check: no unexplained jargon).
- Given the translator fine print, When compared to BRD-015, Then all required elements are present verbatim-or-stronger.

**E2E scenarios:**
- Disclaimer present on every route including error and 404 pages

**QA sign-off:**
- Route sweep green; editorial checklist completed and logged (TASKS 6.2).

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-019 — Production readiness: metadata, Lighthouse, phone walkthrough

*ops · platform · priority must · status **approved** · M6 Ship · owner claude*

Replace the create-next-app metadata and scaffold favicon (no other task owns page metadata); Lighthouse performance + accessibility pass on every route; phone-width walkthrough of every page; Vercel deploy green with production Neon seeded.

**Traces to:** BRD-031, BRD-032, BRD-033, BRD-034 · **Depends on:** SPEC-006, SPEC-009, SPEC-010, SPEC-011, SPEC-012, SPEC-014, SPEC-015, SPEC-016, SPEC-017, SPEC-018

**Business rules:**
- Tab title and description must describe this site (currently 'Create Next App' — TASKS 6.3).
- App perf default is the bar: Lighthouse perf ≥ 90, a11y ≥ 95, every route.

**Edge cases:**
- Chart-heavy pages are the perf risk (client bundle size) — measure /explore/[school] and /compare specifically
- OpenGraph/social preview metadata (title/description at minimum)

**Acceptance criteria:**
- Given the production deployment, When curl -I runs unauthenticated, Then it returns 200 — not a 302 to vercel.com/sso-api (depends on SPEC-020).
- Given every route, When Lighthouse runs, Then performance ≥ 90 and accessibility ≥ 95.
- Given a phone-width walkthrough of every page, When completed, Then no clipped charts, no horizontal scroll, all interactions reachable (TASKS 6.3 checks).
- Given the deployed page metadata, When inspected, Then title/description describe the University Endowment Investing Explorer.

**E2E scenarios:**
- Full route sweep at 375px width
- Production curl -I 200 check

**QA sign-off:**
- All TASKS 6.3 checks green; PRD definition-of-done boxes all satisfiable.

**Rollback:** Redeploy previous release (no db_changes).

### SPEC-020 — [HUMAN] Disable Vercel Deployment Protection for production

*ops · platform · priority must · status **approved** · M6 Ship · owner human*

In the Vercel dashboard: Settings → Deployment Protection → Vercel Authentication → Disabled for Production. Currently every logged-out visitor is 302-redirected to a Vercel login with x-robots-tag: noindex, contradicting the free/public/no-login requirement. Reserved to the human (CONSTITUTION.md Part 2 §7); a builder session must not flip it.

**Traces to:** BRD-001, BRD-031 · **Depends on:** nothing

**Acceptance criteria:**
- Given a logged-out client, When curl -I hits the production URL, Then it returns 200 with no x-robots-tag: noindex header.

**QA sign-off:**
- curl -I returns 200 unauthenticated.

**Rollback:** Re-enable Deployment Protection in the same dashboard screen (instant, no data implications).

---

## Open questions

- **Q-001** (non-blocking): Final call on the hedge-fund / private-equity sleeve: explicit-gap (copycat covers only the publicly-replicable sleeve, remainder shown as a labelled gap) vs. any liquid-alt stand-in? **Resolved 2026-08-04 by owner: explicit-gap sleeve confirmed — the copycat covers only the publicly-replicable sleeve; hedge funds / private equity render as a labelled gap, never a stand-in proxy.**
- **Q-002** (non-blocking): Confirm Recharts as the chart library (PRD default suggestion), or pick another well-maintained React chart library at build time? *Proposed default: Recharts, unless the dataviz-skill review at M3 surfaces a concrete blocker (e.g. accessible-table alternative friction).*
- **Q-003** (non-blocking): Add lightweight observability (Vercel Analytics / Speed Insights, both Pro-included) and a test step in CI, or keep hypercare monitoring manual via Vercel logs? *Proposed default: Enable Vercel Analytics + Speed Insights at M6 (human toggles, one-line code add); keep CI as local pre-push tests for v1.*

## Cutover runbook

- [claude] 1. Verify M6 exit criteria: Lighthouse ≥ 90/95 every route, phone walkthrough clean, methodology source-check green — verify: Checklist in TASKS.md build log
- [claude] 2. Re-run production seed dry-run; confirm no pending changes — verify: seed:dry reports clean
- [claude] 3. Confirm latest main deploy is green on Vercel — verify: Vercel dashboard/CLI deployment state
- [human] 4. Disable Deployment Protection for production (Settings → Deployment Protection → Vercel Authentication → Disabled) — verify: Human confirms in dashboard
- [claude] 5. Verify public access: unauthenticated curl -I returns 200, no x-robots-tag: noindex — verify: curl output logged
- [claude] 6. Full production walkthrough: all routes, phone width, disclaimer presence — verify: Walkthrough checklist logged
- [claude] 7. Enter hypercare (see hypercare_plan) — verify: Hypercare start noted in TASKS.md

## Hypercare

14 days post-cutover (through ~2 weekly usage cycles), extendable by owner. Exit: 14 days elapsed with zero open SEV-1/SEV-2 · All monitoring signals within thresholds for the final 7 consecutive days · Success review recorded; owner signs off in TASKS.md

## Traceability (BRD → spec items)

| BRD | Requirement | Covered by |
|---|---|---|
| BRD-001 | Free, public website requiring no account or login. | SPEC-006, SPEC-020 |
| BRD-002 | No copy tells a user what to do with their money; no personalization. | SPEC-018, SPEC-014, SPEC-009 |
| BRD-003 | Education-not-advice disclaimer visible site-wide. | SPEC-006, SPEC-018 |
| BRD-004 | Plain English; unfamiliar terms defined on first use. | SPEC-008, SPEC-018 |
| BRD-005 | Honest reporting even when unflattering to endowments. | SPEC-015, SPEC-016, SPEC-018, SPEC-010 |
| BRD-006 | Pick one of exactly five schools. | SPEC-009 |
| BRD-007 | Asset allocation over time chart by fiscal year (Stanford: market value instead, per OI-1). | SPEC-010, SPEC-012 |
| BRD-008 | Annual returns by fiscal year (Stanford: unavailable-state per OI-1). | SPEC-011, SPEC-012 |
| BRD-009 | Plain-English story blurb per school (2–3 paragraphs). | SPEC-009 |
| BRD-010 | Every data point traceable to a cited source via methodology page. | SPEC-017, SPEC-003 |
| BRD-011 | Allocation translated into ordinary, widely available ETFs. | SPEC-005, SPEC-014 |
| BRD-012 | ETF proxy mapping lives in DB, shown transparently. | SPEC-005, SPEC-014 |
| BRD-013 | Copycat performance from stored annual returns only, no live APIs. | SPEC-013, SPEC-015 |
| BRD-014 | Annual rebalancing; no taxes/fees modeled; stated in fine print. | SPEC-013, SPEC-014 |
| BRD-015 | Fine print: what a copycat cannot replicate (four items). | SPEC-014 |
| BRD-016 | Compare over user-chosen sub-period: actual vs copycat vs benchmarks. | SPEC-016, SPEC-015 |
| BRD-017 | Benchmarks exactly: S&P 500, 60/40, 70/30. | SPEC-016, SPEC-003 |
| BRD-018 | Growth-of-$10,000 chart. | SPEC-015, SPEC-016 |
| BRD-019 | Stats table: annualized return, best year, worst year. | SPEC-016 |
| BRD-020 | Seed files in data/ are the single source of truth. | SPEC-002, SPEC-003 |
| BRD-021 | No number without a citation. | SPEC-002, SPEC-003, SPEC-017 |
| BRD-022 | Seed script loads files into Neon. | SPEC-002 |
| BRD-023 | Per school per FY: allocations (normalized), return, market value (where soundly published). | SPEC-001, SPEC-003 |
| BRD-024 | Benchmark/asset-class returns and ETF proxy-mapping table stored. | SPEC-003, SPEC-005 |
| BRD-025 | Coverage FY2000–FY2025 subject to documented per-school limits. | SPEC-003, SPEC-012 |
| BRD-026 | Yale coverage may extend deeper than FY2000 (could). | SPEC-003 |
| BRD-027 | Fiscal-year alignment; Stanford Aug-31 offset disclosed at display. | SPEC-001, SPEC-003, SPEC-010, SPEC-011, SPEC-012, SPEC-017 |
| BRD-028 | Normalized allocation categories, auditable mapping. | SPEC-001, SPEC-003, SPEC-010, SPEC-017 |
| BRD-029 | Yearly by-hand update cadence (seed edit + re-seed, no code change). | SPEC-002 |
| BRD-030 | Methodology page lists every source. | SPEC-017 |
| BRD-031 | Deployed on Vercel from GitHub repo, auto-deploy on main. | SPEC-004, SPEC-019, SPEC-020 |
| BRD-032 | Loads fast (quantified by spec: app perf default). | SPEC-019 |
| BRD-033 | Works well on phone screens. | SPEC-006, SPEC-019 |
| BRD-034 | Neon Postgres production DB, seeded before launch. | SPEC-004, SPEC-019 |

## Change log

- **2026-08-03 (v1.0.0)** — Initial full spec generated from BRD 1.0 + PRD + data/README.md + TASKS.md. Deliberate protocol deviation: SPEC-001..004 emitted with status 'verified' (not 'draft') because TASKS.md Phase 0–1 build logs record that work as built, QC'd, and live — re-marking it draft would instruct build sessions to redo finished work.
- **2026-08-04 (v1.0.0)** — Owner approved spec v1.0.0: spec_meta.status -> approved; 16 draft items flipped to approved (SPEC-005..SPEC-020). Q-001 resolved (explicit-gap sleeve confirmed). No requirement content changed; version unchanged.
