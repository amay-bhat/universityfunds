# Task Checklist — University Endowment Investing Explorer

**How to use this file (builder sessions):** pick the first unchecked task, do only that task, verify its acceptance check, then check it off and note anything surprising under "Build log" at the bottom. One task per session unless tasks are trivially small. If blocked, write the blocker in the Build log and stop — don't improvise around it.

**Legend:** `[H]` = human does this (dashboard clicks, account stuff). Everything else is a builder-session task.

---

## Phase 0 — Plumbing

- [ ] 0.1 Initialize git in this folder, set remote to `https://github.com/amaybhat-creator/universityfunds`, pull/merge if the remote has anything, first push. *Check: `git remote -v` shows the repo; push succeeds.*
- [ ] 0.2 Scaffold a Next.js app (App Router, TypeScript, Tailwind) at the repo root. Keep `plan.html`, `PRD.md`, `TASKS.md`, `CLAUDE.md` at root. *Check: `npm run dev` serves the starter page.*
- [ ] 0.3 [H] In Vercel dashboard: import the GitHub repo as a new project (Pro team), confirm auto-deploy on push to main works. *Check: starter page live on a vercel.app URL.*
- [ ] 0.4 [H] In Vercel dashboard: add the Neon integration (Storage → Create Database → Neon), link it to the project so env vars (`DATABASE_URL` etc.) are injected. Then run `vercel env pull .env.local` locally (or copy env vars by hand). *Check: `.env.local` contains the Neon connection string; `.env.local` is gitignored.*
- [ ] 0.5 Add a DB client + schema migration setup (suggestion: Drizzle ORM with drizzle-kit; plain SQL migrations also fine). Create empty schema per task 1.1's design. *Check: migration runs against Neon without error.*

## Phase 1 — Data foundation

- [ ] 1.1 Design the schema + seed-file format. Tables (guide, adjust as needed): `schools`, `allocations` (school, fiscal_year, category, pct, source_id), `endowment_returns` (school, fiscal_year, return_pct, market_value, source_id), `benchmark_returns` (series e.g. sp500/us_bonds/intl_equity/reit/etc., fiscal_year, return_pct, source_id), `proxy_mappings` (category → ETF ticker, rationale), `sources` (id, title, url/document, page). Seed files are JSON or CSV in `data/`, one per table or per school. Document the format in `data/README.md`. *Check: schema migrated; format documented.*
- [ ] 1.2 Write the seed script (`npm run seed`): reads `data/`, validates (allocations per school-year sum to ~100%, every row has a source_id that exists), upserts into Neon. *Check: runs clean on empty data files; validation actually rejects a bad row.*
- [ ] 1.3 Curate Yale: FY2000–FY2025 allocations (normalized to our category set), annual returns, market values, with citations (Yale Investments Office annual reports / financial reports). Use WebFetch/WebSearch to find figures; every number cited. *Check: seed passes validation; spot-check 3 random years against sources.*
- [ ] 1.4 Curate benchmark/asset-class annual return series FY2000–FY2025 (fiscal years ending June 30): S&P 500 total return, US total bond, international equity, REITs, plus series needed for proxy backtests and the 60/40 & 70/30 composites. Cite sources. *Check: seed passes; 60/40 FY returns sanity-check against known values for 2–3 years.*
- [ ] 1.5 Curate Harvard (same shape as 1.3). *Check: same as 1.3.*
- [ ] 1.6 Curate Stanford, MIT, Princeton (same shape; one task, three schools — split if any school's data is hard to find, note it in Build log). *Check: same as 1.3.*
- [ ] 1.7 Curate the ETF proxy-mapping table: each allocation category → ETF ticker + one-sentence plain-English rationale + honesty note where the proxy is weak (e.g., private equity, venture). *Check: every category used in any school's allocations has a mapping.*

**CHECKPOINT A — switch to Fable:** review schema, data quality, and proxy mappings before building UI on top of them.

## Phase 2 — App skeleton

- [ ] 2.1 Layout: site shell with header/nav (Explore, Compare, Methodology), footer with disclaimer, responsive, dark-mode friendly. Plain-English tone per PRD. *Check: all routes render with placeholder content.*
- [ ] 2.2 Data access layer: typed query functions (server-side) for schools list, allocations by school, returns by school, benchmarks, proxy mappings. *Check: a debug page (or tests) prints real seeded data.*

## Phase 3 — History Explorer

- [ ] 3.1 School picker + school page: story blurb, headline stats (latest market value, 10/25-yr annualized return). Write the 5 blurbs (plain English, sourced facts only). *Check: all 5 school pages render from DB data.*
- [ ] 3.2 Allocation-over-time chart (stacked area, FY2000–FY2025) per school. Read the dataviz skill first. *Check: chart matches seeded data; legible on phone.*
- [ ] 3.3 Annual returns chart (bar, with S&P 500 overlay toggle). *Check: values match DB; tooltip shows year + values.*

## Phase 4 — Translator

- [ ] 4.1 Backtest engine (pure functions + unit tests): given a set of {category, pct} weights, map to proxy series via proxy_mappings, compute year-by-year portfolio returns FY-to-FY with annual rebalancing, growth of $10k, annualized return, best/worst year. **This is the most correctness-critical code in the app — write tests with hand-computed expected values.** *Check: unit tests pass incl. a hand-verified 60/40 case.*
- [ ] 4.2 Translator page: pick school + fiscal year → show endowment allocation beside the copycat ETF portfolio (table: category, endowment %, ETF, why this ETF), plus the fine-print box (what a copycat can't replicate). *Check: renders for every school/year in DB.*
- [ ] 4.3 Copycat performance section: growth-of-$10k chart of the proxy portfolio vs. the school's actual returns over the available period, using the 4.1 engine. *Check: numbers match engine output; honest divergence visible.*

## Phase 5 — Comparisons

- [ ] 5.1 Compare page: pick school(s) + period → growth-of-$10k lines for actual endowment, copycat proxy, S&P 500, 60/40, 70/30; stats table (annualized return, best/worst year). *Check: any combination renders; stats match engine.*

## Phase 6 — Polish & ship

- [ ] 6.1 Methodology page: every source listed (from `sources` table), data caveats, proxy-mapping rationale, update cadence. *Check: every source_id in DB appears on the page.*
- [ ] 6.2 Disclaimer pass: site-wide footer + translator fine print reviewed against PRD rule 1; plain-English pass over all copy. *Check: no page lacks the disclaimer; no unexplained jargon.*
- [ ] 6.3 Production checks: Vercel deploy green, seeded Neon in production, Lighthouse pass (perf + accessibility), phone-width walkthrough of every page. *Check: PRD "definition of done" boxes all satisfiable.*

**CHECKPOINT B — switch to Fable:** final review against PRD definition of done.

---

## Build log

(Builder sessions: append dated notes here — surprises, blockers, decisions made, data quirks.)
