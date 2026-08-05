# Operations runbook

Written 2026-08-05 during the Tier 3 operational pass, which found none of this
recorded anywhere. Three procedures: the annual data refresh, disaster recovery,
and what to actually monitor.

---

## 1. What to monitor

**Measured 2026-08-05 with the database made unreachable.** This is the single
most important fact in this file:

| Route | Status with DB down |
|---|---|
| `/` | **200** |
| `/explore` | **200** |
| `/explore/{school}` | **200** |
| `/methodology` | **200** |
| `/glossary` | **200** |
| `/compare` | 500 |
| `/translate` | 500 |
| `/api/health` | **503** |

**Five of eight routes return 200 during a total database outage**, because they
are statically rendered or ISR and keep serving the last good build from the CDN.
An uptime checker pointed at the homepage would report the site healthy while two
features were hard-failing.

- **Point any uptime check at `/api/health`, not at a page.** It is the only
  surface that proves the data path works. It returns `200` when the database is
  reachable *and* seeded, `503` when either is false, and deliberately reveals
  nothing about the connection on failure. Response shape:
  `{ ok, db, seeded, schools, latencyMs }`.
- `latencyMs` in that response is a useful early warning: Neon scales compute to
  zero when idle, so a cold start shows up here as a spike before it shows up as
  a user complaint.
- **There is no error-tracking service.** Server errors reach Vercel's runtime
  logs automatically. The `error.tsx` boundary shows the user an
  `Error reference:` digest, and **that digest is the correlation key** — a reader
  quoting it lets you find the exact stack in Vercel logs. This is the whole
  reporting loop; treat the digest as load-bearing, not decoration.
- Client-side errors are logged to the browser console only and are **not**
  transmitted. That is deliberate: there is no privacy policy on the site yet, so
  adding beaconing would widen a known gap to buy telemetry. Revisit once a
  privacy policy exists.

**Graceful degradation, as measured:** static routes keep serving stale-but-true
data, dynamic routes render the friendly error boundary with a 500 status. Nobody
sees a raw stack. That is acceptable behaviour, not a bug to fix.

---

## 2. Annual data refresh

Schools publish fiscal-year results in the autumn. The methodology page promises
readers the data is updated once a year, so this is a commitment, not a chore.

**Order matters — the gates only work if run in this sequence.**

1. **Curate.** Add rows to `data/schools/<school>.json` and the corresponding
   source records to `data/sources.json`. Every figure needs a citation that
   resolves; every allocation row needs `basis`; endowment-return rows need
   `returnSourceId` and `marketValueSourceId` per CONSTITUTION Article 2.
2. **`npm run seed:dry`** — validates field shape, citation resolution and that
   allocations sum to ~100. Must pass before anything else.
3. **`npm run seed:verify`** — 30 validator cases, proving the validator itself
   still catches what it claims to.
4. **`npm run verify:figures`** — the reconciliation gate. Checks
   `MV[t] ≈ MV[t-1] × (1 + return)` against the plausible spending/gift band.
   **This is the check that catches a transcription error**, because `seed:dry`
   verifies citation *shape* and never that the cited document contains the
   figure. A transposed digit lands outside the band immediately. If it flags a
   year, re-read the source before assuming the band is wrong. Genuine
   exceptions go in that script's `ACCEPTED` map **with a citation to where the
   cause is documented** — never as a bare silencing.
5. **`npm run seed`** to write to Neon, then re-run `seed:dry` to confirm.
6. **Update the prose that quotes coverage.** This is the step that gets
   forgotten. Several user-facing strings hard-code the coverage end or a
   headline figure — `src/lib/blurbs.ts`, `src/app/methodology/page.tsx`, and the
   PRD's FY range. The sitemap's `lastModified` and the JSON-LD
   `temporalCoverage` derive from the data automatically via `src/lib/site.ts`
   and need no edit; the prose does not.
7. **Re-run the display gates**, because a new year can change which annotations
   apply: `node scripts/verify-allocation-annotations.mjs`,
   `npm run verify:palette`, and with a server running, `npm run verify:seo`.
8. **Check the basis annotations still tell the truth.** If a school publishes a
   mix on a new measurement basis, or resumes after a gap, the target/pool prefix
   logic in `src/lib/chart-data.ts` changes behaviour. The unit tests cover the
   shapes; the render check covers what a reader sees.
9. Log the refresh in `TASKS.md` and note any new `[JUDGMENT CALL]`.

---

## 3. Disaster recovery

**The database is derived, not primary.** `data/` in git is the source of truth,
which puts this project in a better position than most. Losing Neon entirely
loses no data.

**Restore path:**

1. Create a new Neon database and set `DATABASE_URL`.
2. `npm run db:migrate` to apply `drizzle/0000_conscious_menace.sql`.
3. `npm run seed` to load the curated files.
4. `npm run seed:dry` and `npm run verify:figures` to confirm.
5. `curl /api/health` — expect `{ ok: true, seeded: true, schools: 5 }`.

**Two honest caveats.**

- **This path has never been rehearsed.** Every step is individually sound and
  the seed is idempotent, but nobody has run empty-database → working-site end to
  end. Until someone does, treat step 2 as the unknown.
- **The migration baseline was generated on 2026-08-05 from `schema.ts`, after
  the live schema had already been built by repeated `drizzle-kit push`.** So it
  represents the *intended* schema, and **drift from the live database is
  unverified.** `drizzle-kit push` reports "no changes" when a schema is in sync,
  which is the way to check — but it *applies* differences when it finds them, so
  do not run it against production casually. Before trusting the baseline, apply
  it to a scratch database and compare.

**Backups:** Neon provides point-in-time restore on paid tiers. The team is on
the **Hobby plan** (recorded at `TASKS.md:306`), so do not assume PITR exists.
The re-seed path above is the real backup, and it is better than a snapshot
because it is reproducible and version-controlled.
