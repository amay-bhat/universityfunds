# BRD — University Endowment Investing Explorer (v1)

| | |
|---|---|
| **doc_id** | `BRD` |
| **Version** | 1.0 |
| **Date** | 2026-08-03 |
| **Authority** | binding |
| **Derived from** | `PRD.md` (2026-07-23, approved) — see Provenance |
| **Companion docs** | `data/README.md` (binding for data-domain facts), `CLAUDE.md`, `plan.html` (informative) |

## Provenance

This BRD was reverse-derived from the approved PRD, because this project began at the product level. Requirement wording therefore restates the PRD's intent in atomic, testable form; nothing here introduces new scope. Where the verified state of the curated data contradicts the PRD, this BRD records the verified fact and flags the conflict in **§9 Known conflicts and open items** instead of silently repeating the PRD. On any conflict between this BRD and the PRD, the conflict must be raised, not resolved unilaterally.

Requirement IDs (`BRD-xxx`) are stable: never renumber, never reuse. Priorities use MoSCoW.

---

## 1. Business context

Everyday DIY investors hear that universities like Yale grew their endowments with a famous investing strategy, but the information is buried in annual-report PDFs and finance jargon. There is no simple place to (a) see how these endowments actually invested over the decades, (b) understand what that strategy would look like rebuilt with ordinary funds anyone can buy, and (c) judge honestly whether it beat simple index investing. *(PRD §Problem)*

## 2. Business objectives

1. Make the investing history of five famous university endowments (Yale, Harvard, Stanford, MIT, Princeton) browsable and understandable by non-professionals.
2. Show what a "buy it yourself" version of each endowment's allocation looks like using ordinary ETFs, and how it would have performed.
3. Provide an honest comparison against simple index investing, even when the endowments look bad.
4. Do all of this as free public education — never as financial advice.

## 3. Target users and stakeholders

- **Primary users:** everyday DIY investors managing their own retirement/brokerage accounts; curious, not professional. *(PRD §Audience)*
- **Stakeholders:** project owner (content and go-live decisions); no paying customers, advertisers, or institutional partners in v1.

## 4. Scope

**In scope (v1):** the three features in §5 groups B–D, the data foundation in group E, and the compliance posture in group A.

**Out of scope (v1)** *(PRD §Out of scope — each exclusion is deliberate)*: accounts/login · personalization of any kind · brokerage connections · live market data APIs · more than 5 schools · PDF scraping/automation · mobile app · monetization · comments/social features.

---

## 5. Business requirements

### Group A — Product posture and compliance

| ID | Priority | Requirement | Source |
|---|---|---|---|
| BRD-001 | must | The product shall be a free, public website requiring no account or login. | PRD §What v1 is |
| BRD-002 | must | No copy anywhere in the product shall tell a user what to do with their money, and the product shall include no personalization of any kind. Education, not advice. | PRD §Rules 1 |
| BRD-003 | must | A disclaimer stating the education-not-advice posture shall be visible site-wide (every page). | PRD §Rules 1, §DoD |
| BRD-004 | must | All copy shall be plain English; any term a smart 22-year-old outside finance wouldn't know shall be defined on first use. | PRD §Rules 3 |
| BRD-005 | must | Results shall be reported honestly even when unflattering to endowments: if simple indexing beat an endowment over a period, the product says so plainly. | PRD §Rules 4 |

### Group B — History Explorer

| ID | Priority | Requirement | Source |
|---|---|---|---|
| BRD-006 | must | The user shall be able to pick one of exactly five schools in v1: Yale, Harvard, Stanford, MIT, Princeton. | PRD §Feature 1 |
| BRD-007 | must | For a chosen school, the product shall show its asset allocation over time by fiscal year as a stacked-area chart or comparable time-composition visualization. **For Stanford: market value over time is shown instead; allocation chart is marked 'unavailable' with a link to the methodology explanation.** | PRD §Feature 1; OI-1 |
| BRD-008 | must | For a chosen school, the product shall show its annual returns by fiscal year. **For Stanford: this chart is marked 'unavailable' with a link to the methodology explanation (see OI-1).** | PRD §Feature 1; OI-1 |
| BRD-009 | must | Each school shall have a plain-English story blurb (2–3 paragraphs) describing its investing approach. | PRD §Feature 1 |
| BRD-010 | must | Every displayed data point shall be traceable to a cited source; citations are presented on a methodology page rather than cluttering the charts. | PRD §Feature 1, §Rules 2 |

### Group C — "Copy the Pros" Translator

| ID | Priority | Requirement | Source |
|---|---|---|---|
| BRD-011 | must | For a chosen school + fiscal year, the product shall show the endowment's allocation translated into a portfolio of ordinary, widely available ETFs. | PRD §Feature 2 |
| BRD-012 | must | The ETF proxy mapping shall live in the database and be shown transparently to the user. | PRD §Feature 2 |
| BRD-013 | must | The copycat portfolio's historical performance shall be computed from stored annual asset-class/index returns only — no live market data APIs in v1. | PRD §Feature 2 |
| BRD-014 | must | The copycat backtest shall assume annual rebalancing, with no taxes or fees modeled, and shall say so in the fine print. | PRD §Feature 2; CLAUDE.md §Domain notes |
| BRD-015 | must | Honest fine print shall accompany the translator stating what a copycat cannot replicate: access to top private funds, tax-free status, effectively infinite time horizon, professional staff. | PRD §Feature 2 |

### Group D — Head-to-Head Comparisons

| ID | Priority | Requirement | Source |
|---|---|---|---|
| BRD-016 | must | The user shall be able to compare, over a user-chosen sub-period, a school's actual endowment returns vs. its copycat proxy vs. simple benchmarks. | PRD §Feature 3 |
| BRD-017 | must | The benchmark set in v1 shall be exactly: S&P 500, 60/40 portfolio, 70/30 portfolio. | PRD §Feature 3 |
| BRD-018 | must | Comparisons shall render a growth-of-$10,000 chart for the selected series and period. | PRD §Feature 3 |
| BRD-019 | must | Comparisons shall include a small stats table showing at least: annualized return, best year, worst year. | PRD §Feature 3 |

### Group E — Data foundation

| ID | Priority | Requirement | Source |
|---|---|---|---|
| BRD-020 | must | Hand-curated seed files in `data/` in the repo shall be the single source of truth; the database is never edited directly — seed files are edited and re-seeded. | PRD §Data; CLAUDE.md §Stack |
| BRD-021 | must | No number shall enter a seed file without a citation (source document + page/URL). No citation, no number. | PRD §Data, §Rules 2 |
| BRD-022 | must | A seed script shall load the seed files into the Neon Postgres database. | PRD §Data |
| BRD-023 | must | The dataset shall contain, per school per fiscal year: asset allocation percentages (normalized category set), annual return, and endowment market value — where the school publishes that figure on a sound single-entity basis (see BRD-025 / OI-1 for the Stanford exception). | PRD §Data |
| BRD-024 | must | The dataset shall also contain annual returns for the benchmark indexes and asset-class proxies, and the ETF proxy-mapping table. | PRD §Data |
| BRD-025 | must | Data coverage shall target FY2000–FY2025 for all five schools, subject to the documented per-school availability limits in `data/README.md`. **For Stanford: market values are curated; allocations and returns are not (verified structural gap per OI-1 — Merged Pool mismatch — not a curation backlog).** | PRD §Data; data/README.md; OI-1 |
| BRD-026 | could | Yale coverage may extend deeper than FY2000 where sources are easy to obtain. | PRD §Data |
| BRD-027 | must | All series shall align to fiscal years, not calendar years. Four schools' fiscal years end June 30 (FY2025 = July 2024–June 2025); **Stanford's ends August 31**, and this ~2-month offset shall be disclosed at the point of display. | data/README.md §Fiscal years (corrects PRD §Data — see OI-2) |
| BRD-028 | must | Allocation categories shall be normalized to one category set across schools, with each school's original label preserved so the mapping stays auditable. | PRD §Data; data/README.md §Allocation categories |
| BRD-029 | should | The data pipeline shall support a yearly, by-hand update cadence (adding a new fiscal year is a seed-file edit + re-seed, not a code change). | PRD §Data |

### Group F — Methodology and transparency

| ID | Priority | Requirement | Source |
|---|---|---|---|
| BRD-030 | must | A methodology page shall list every source used anywhere in the product. | PRD §DoD |

### Group G — Platform and delivery

| ID | Priority | Requirement | Source |
|---|---|---|---|
| BRD-031 | must | The product shall be deployed on Vercel from the GitHub repo (`amaybhat-creator/universityfunds`), with pushes to main auto-deploying. | PRD header; CLAUDE.md §Stack |
| BRD-032 | must | The product shall load fast. (Business-level statement; the engineering spec shall quantify concrete page-load/latency targets.) | PRD §DoD |
| BRD-033 | must | The product shall work well on phone screens. | PRD §DoD |
| BRD-034 | must | The production database shall be Neon Postgres, seeded via the seed script before launch. | PRD §DoD, §Tech constraints |

## 6. Success criteria (business definition of done)

v1 ships when all of the following hold *(PRD §Definition of done)*:

1. All 5 schools are browsable in the History Explorer with allocation + returns charts, FY2000–FY2025 — **as qualified by OI-1 for Stanford**.
2. The Translator works for every school/year that has allocation data, with visible proxy mapping and fine print.
3. Comparisons render for any school vs. proxy vs. all 3 benchmarks over any sub-period.
4. The methodology page lists every source; the disclaimer is visible site-wide.
5. Deployed on Vercel from the GitHub repo, database seeded on Neon, loads fast, works on phones.

## 7. Constraints

*(Binding on the engineering spec; not user-facing requirements.)*

- Next.js (App Router, TypeScript, Tailwind) on Vercel; prefer Vercel-native components/integrations. No backend beyond Next.js server components/route handlers. *(PRD §Tech constraints)*
- Neon Postgres via Vercel's native integration; connection string via `vercel env pull` into gitignored `.env.local`. *(CLAUDE.md §Stack)*
- Charts: a well-maintained React chart library, builder's choice; Recharts is the default suggestion. The dataviz skill must be read before writing any chart code. *(PRD §Tech constraints; CLAUDE.md §Rules)*
- Financial math (the backtest engine) requires unit tests with hand-computed expected values. *(CLAUDE.md §Rules)*
- No live market-data APIs, no PDF scraping/automation (reinforces §4 exclusions). *(PRD §Out of scope)*

## 8. Assumptions

1. The five schools' annual reports and audited financial statements remain publicly available for citation.
2. Yearly manual curation effort is acceptable to the owner; no automation is expected in any future scope discussed so far.
3. Free public access implies no rate-limiting/quota business requirement in v1 beyond ordinary abuse protection.
4. "Ordinary, widely available ETFs" means funds purchasable in a standard US brokerage account without accreditation or minimums beyond a share price.

## 9. Known conflicts and open items

| ID | Item | Detail | Status |
|---|---|---|---|
| OI-1 | **Stanford: market-value-only presentation (DECIDED)** | The PRD's DoD asks for allocation + returns charts for all 5 schools. Verified curation finding (`data/README.md` §Stanford): Stanford's investment office publishes allocation and return figures only for the **Merged Pool**, which is ~73–75% endowment and ~25% other money — using it would misrepresent "Stanford's endowment" (confirmed ~2.9pp return divergence in FY2024). Only endowment **market values** are curated for Stanford. **Decision: Stanford's History Explorer shows endowment market value (total size) over time, with a plain-English explanation of why allocation and returns are unavailable (Merged Pool mismatch, detailed on methodology page).** Translator and Comparisons features remain available for Stanford where proxy mappings exist. | **Resolved 2026-08-03.** Does not block any slice. |
| OI-2 | Fiscal-year statement in PRD is oversimplified | PRD §Data says "Fiscal years end June 30"; verified state is June 30 for four schools, **August 31 for Stanford**. This BRD records the verified fact (BRD-027). | **Resolved in this BRD** — `data/README.md` wins on data-domain facts; PRD text should be corrected at next PRD revision. |

## 10. Glossary

| Term | Definition |
|---|---|
| Endowment | A university's long-term investment fund, built from donations, that pays out a slice each year to support the school. |
| Asset allocation | How a portfolio is divided among investment types (stocks, bonds, real estate, etc.), usually shown as percentages summing to 100. |
| Fiscal year (FY) | A school's 12-month accounting year. Here, FY2025 = July 2024–June 2025 for four schools; Sep 2024–Aug 2025 for Stanford. |
| ETF | Exchange-traded fund — a fund that holds a basket of investments and trades on a stock exchange like a single share. |
| Benchmark | A simple reference portfolio (like the S&P 500) used as a yardstick for comparing performance. |
| 60/40, 70/30 | Classic simple portfolios: 60% (or 70%) stocks, 40% (or 30%) bonds. |
| Annualized return | The single per-year growth rate that would produce the same overall result as the actual year-by-year returns. |
| Rebalancing | Periodically trading back to the target allocation after market moves push it off target; this project models it once per year. |
| Copycat / proxy portfolio | The DIY version of an endowment's allocation built from ordinary ETFs standing in for each asset class. |
| Market value | The total dollar size of the endowment at fiscal-year end. |
| Merged Pool | Stanford's commingled investment vehicle; larger than and distinct from the endowment itself (see OI-1). |
