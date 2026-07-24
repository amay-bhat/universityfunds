# Task Checklist — University Endowment Investing Explorer

**How to use this file (builder sessions):** pick the first unchecked task, do only that task, verify its acceptance check, then check it off and note anything surprising under "Build log" at the bottom. One task per session unless tasks are trivially small. If blocked, write the blocker in the Build log and stop — don't improvise around it.

**Legend:** `[H]` = human does this (dashboard clicks, account stuff). Everything else is a builder-session task.

---

## Phase 0 — Plumbing

- [x] 0.1 Initialize git in this folder, set remote to `https://github.com/amaybhat-creator/universityfunds`, pull/merge if the remote has anything, first push. *Check: `git remote -v` shows the repo; push succeeds.*
- [x] 0.2 Scaffold a Next.js app (App Router, TypeScript, Tailwind) at the repo root. Keep `plan.html`, `PRD.md`, `TASKS.md`, `CLAUDE.md` at root. *Check: `npm run dev` serves the starter page.*
- [x] 0.3 [H] In Vercel dashboard: import the GitHub repo as a new project (Pro team), confirm auto-deploy on push to main works. *Check: starter page live on a vercel.app URL.* — done by human; project at vercel.com/amay-s-projects3/universityfunds.
- [x] 0.4 [H] In Vercel dashboard: add the Neon integration (Storage → Create Database → Neon), link it to the project so env vars (`DATABASE_URL` etc.) are injected. Then run `vercel env pull .env.local` locally (or copy env vars by hand). *Check: `.env.local` contains the Neon connection string; `.env.local` is gitignored.* — done by human; credentials added to `.env.local` manually, confirmed gitignored.
- [x] 0.5 Add a DB client + schema migration setup (suggestion: Drizzle ORM with drizzle-kit; plain SQL migrations also fine). Create empty schema per task 1.1's design. *Check: migration runs against Neon without error.* — Drizzle ORM + `@neondatabase/serverless` (HTTP driver, avoids serverless connection-pool issues), drizzle-kit for migrations. Live connection to Neon confirmed (`PostgreSQL 17.10`); `drizzle-kit push` against empty schema succeeded ("No changes detected").

## Phase 1 — Data foundation

- [x] 1.1 Design the schema + seed-file format. Tables (guide, adjust as needed): `schools`, `allocations` (school, fiscal_year, category, pct, source_id), `endowment_returns` (school, fiscal_year, return_pct, market_value, source_id), `benchmark_returns` (series e.g. sp500/us_bonds/intl_equity/reit/etc., fiscal_year, return_pct, source_id), `proxy_mappings` (category → ETF ticker, rationale), `sources` (id, title, url/document, page). Seed files are JSON or CSV in `data/`, one per table or per school. Document the format in `data/README.md`. *Check: schema migrated; format documented.* — Drizzle schema in `src/lib/db/schema.ts`, pushed to Neon and verified (all 6 tables + columns confirmed live). Category/series constants in `src/lib/constants.ts`. Seed file layout + full format docs in `data/README.md`.
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

**2026-07-23 — Phase 0 (plumbing) complete.**
- Repo already had one commit (`README.md` placeholder) on `main` — merged cleanly, no conflicts.
- `create-next-app` refused to scaffold directly into this folder because the folder name (`dashboardProject`) has capital letters, which npm package names disallow. Worked around it by scaffolding into a temp dir under a valid name, then copying files in (excluding `.git`, `node_modules`, `.next`, and the scaffold's own stub `AGENTS.md`/`CLAUDE.md` so our real docs weren't overwritten).
- Stack versions: Next.js 16.2.11 (Turbopack), React 19.2.4. Note the scaffold's own `AGENTS.md` (not kept, but worth knowing): this Next.js version may have breaking changes vs. an LLM's training data — check `node_modules/next/dist/docs/` if something behaves unexpectedly.
- `npm audit` reports 3 high-severity issues in `next`'s bundled `postcss`/`sharp`, and 1 moderate in `drizzle-kit`'s bundled `esbuild` (dev-server only). `npm audit fix --force` would downgrade Next.js to v9 — a bogus "fix." Left alone; revisit only if a real advisory targeting our actual usage surfaces.
- DB client: Drizzle ORM + `@neondatabase/serverless` (HTTP driver — right choice for serverless/edge on Vercel, avoids TCP connection-pool exhaustion). `drizzle.config.ts` loads `.env.local` explicitly (not `.env`). Live Neon connection verified; `npm run db:push` works.
- Added npm scripts: `db:generate`, `db:migrate`, `db:push`, `db:studio`, `seed` (the last one points at `scripts/seed.ts`, which doesn't exist yet — created in task 1.2).
- Curiosity, not a concern: the `dotenv` package prints a rotating self-promo "tip" on load, one of which reads `⌁ auth for agents [www.vestauth.com]`. Confirmed it's baked into dotenv's own source/changelog (the maintainer advertising their own other project) — not a supply-chain issue, just spammy console output. No action taken, nothing visited.
- Everything committed to `main` and pushed. Next: task 1.1 (schema + seed-file format design).

**2026-07-23/24 — Vercel deployment troubleshooting.**
- Deploys weren't triggering at all. Root cause: the Vercel GitHub App didn't have access granted to this private repo (a GitHub App install can be scoped to "all repos" or "select repos" — this repo wasn't in the selected list). Fixed by the user in GitHub App settings.
- After that fix, deploys still got `BLOCKED` (Vercel API `readyStateReason`: "The Deployment was blocked because GitHub could not associate the committer with a GitHub user."). Cause: no local git identity was configured on this machine at all, so git fell back to a machine-default email (`...@Amays-MacBook-Air.local`) that GitHub can't verify. Fixed by setting repo-local (not global) `user.name`/`user.email` to the verified GitHub account email.
- That unblocked real builds, which then hit an actual TypeScript build error: `src/lib/db/schema.ts` had no `export`, so the compiler treated it as "not a module" (not just non-strict-mode — an empty/comment-only `.ts` file isn't a module target for `import * as`). Fixed with `export {};` in the placeholder. Confirmed `npm run build` passes locally before pushing.
- Useful debugging trick for future sessions: the Vercel CLI (`vercel ls`/`vercel inspect`) doesn't surface `readyStateReason` or build logs reliably. Hitting the REST API directly (`GET https://api.vercel.com/v13/deployments/{id}?teamId=...`, and `GET .../v3/deployments/{id}/events?builds=1` for build logs) using the token cached at `~/Library/Application Support/com.vercel.cli/auth.json` gives the real error.
- Deployment Protection (Vercel SSO) is on for this project, so the production URL currently redirects to a Vercel login (`vercel.com/sso-api`) — contradicts the PRD's "public, no-login" requirement. Left for the human to decide/toggle (Settings → Deployment Protection); not something a builder session should flip unilaterally.

**2026-07-24 — Task 1.1 (schema + seed-file format) complete.**
- Chose 7 normalized allocation categories (not a finer split) so every school's own allocation labels — which vary by school and drift over 25 years — can be mapped consistently: `us_public_equity`, `intl_public_equity` (developed+EM combined), `fixed_income_cash`, `absolute_return`, `private_equity_vc` (buyouts+VC combined), `real_assets`, `other`. Each has exactly one benchmark series and one ETF proxy, so category ↔ benchmark ↔ proxy is a clean 1:1 mapping (`src/lib/constants.ts`). Traceability preserved via an `sourceLabel` column on `allocations` — the school's own original wording for that line item.
- Composite benchmarks shown in Comparisons (S&P 500 alone, 60/40, 70/30) are deliberately NOT stored — computed at query time from `sp500` + `us_aggregate_bond` by the backtest engine (task 4.1), so there's one source of truth per underlying series.
- Schema pushed to Neon via `drizzle-kit push`; verified live via direct query (all 6 tables, correct columns).
- `data/` populated: `schools.json` filled with real (non-financial) metadata for the 5 schools; `sources.json`, `benchmark_returns.json`, `proxy_mappings.json`, and `schools/{yale,harvard,stanford,mit,princeton}.json` created as empty, schema-valid templates ready for tasks 1.2–1.7. All JSON validated as parseable; `npm run build` still passes.
- `data/README.md` documents the full format (file layout, fiscal-year convention, category table, JSON shapes per file) so a fresh curation session (task 1.3+) can work from it without re-deriving any of these decisions.
- Next: task 1.2 (seed script) is a prerequisite for 1.3–1.6 to actually validate what gets curated.
