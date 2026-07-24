# PRD — University Endowment Investing Explorer (v1)

**Repo:** github.com/amaybhat-creator/universityfunds · **Hosting:** Vercel (Pro) · **DB:** Neon Postgres
**Status:** Approved plan, pre-build · **Last updated:** 2026-07-23

## Problem

Everyday DIY investors hear that universities like Yale grew their endowments with a famous investing strategy, but the information is buried in annual-report PDFs and finance jargon. There is no simple place to (a) see how these endowments actually invested over the decades, (b) understand what that strategy would look like rebuilt with ordinary funds anyone can buy, and (c) judge honestly whether it beat simple index investing.

## Audience

Everyday DIY investors managing their own retirement/brokerage accounts. Curious, not professional. All copy must be plain-English — no unexplained finance jargon.

## What v1 is

A free, public, no-login website with three thin features:

### 1. History Explorer
- Pick a school (Yale, Harvard, Stanford, MIT, Princeton — 5 schools in v1).
- See its asset allocation over time (stacked area or similar, by fiscal year) and its annual returns.
- Each school gets a short plain-English story blurb (2–3 paragraphs) about its investing approach.
- Every data point is traceable to a cited source (shown on a methodology page, not cluttering the charts).

### 2. "Copy the Pros" Translator
- For a chosen school + fiscal year, show the endowment's allocation translated into a portfolio of ordinary, widely available ETFs (the proxy mapping lives in the database and is shown transparently).
- Show how that copycat portfolio would have performed historically, computed from **stored annual asset-class/index returns** (no live market APIs in v1), with annual rebalancing.
- Must include honest fine print: what a copycat cannot replicate (access to top private funds, no taxes, infinite time horizon, professional staff).

### 3. Head-to-Head Comparisons
- Compare, over a user-chosen period: any school's actual endowment returns vs. the copycat proxy vs. simple benchmarks (S&P 500, 60/40, 70/30).
- Growth-of-$10,000 chart plus a small stats table (annualized return, best/worst year).
- Tell the truth even when it's unflattering to endowments.

## Data (foundation of everything)

- **Source of truth:** hand-curated seed files in `data/` in the repo. Every number carries a citation (source document + page/URL). A seed script loads them into Neon.
- **Contents:** per school per fiscal year: asset allocation percentages (normalized category set), annual return, endowment market value. Plus: annual returns for benchmark indexes/asset-class proxies, and the ETF proxy-mapping table.
- **Coverage target:** FY2000–FY2025 for all 5 schools (deeper for Yale if easy). Fiscal years end June 30.
- **Update cadence:** yearly, by hand.

## Non-negotiable rules

1. **Education, not advice.** Never tell a user what to do with their money. No personalization. Site-wide disclaimer + fine print near the translator.
2. **Every number is sourced.** No data enters a seed file without a citation.
3. **Plain English.** Define any term a smart 22-year-old outside finance wouldn't know.
4. **Honesty over narrative.** If simple indexing beat the endowments in a period, the tool says so plainly.

## Out of scope for v1

Accounts/login · personalization of any kind · brokerage connections · live market data APIs · more than 5 schools · PDF scraping/automation · mobile app · monetization · comments/social features.

## Definition of done (v1 ships when…)

- [ ] All 5 schools browsable in the History Explorer with allocation + returns charts, FY2000–FY2025.
- [ ] Translator works for every school/year with data, with visible proxy mapping and fine print.
- [ ] Comparisons render for any school vs. proxy vs. all 3 benchmarks over any sub-period.
- [ ] Methodology page lists every source; disclaimer visible site-wide.
- [ ] Deployed on Vercel from the GitHub repo, database seeded on Neon, loads fast, works on phone screens.

## Tech constraints

Next.js (App Router) on Vercel, Vercel-native components/integrations preferred. Neon Postgres via Vercel's native integration. Charts: a well-maintained React chart library (builder's choice; Recharts is the default suggestion). No backend beyond Next.js server components/route handlers. Follow the dataviz skill when building any chart.
