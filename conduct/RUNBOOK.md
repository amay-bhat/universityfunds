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
| `/compare` | 200 (streaming shell, then the error boundary) |
| `/translate` | 200 (streaming shell, then the error boundary) |
| `/api/health` | **503** |

**Seven of eight routes return 200 during a total database outage.** Five are
static or ISR and keep serving the last good build from the CDN; `/compare` and
`/translate` joined them once `loading.tsx` was added (see the correction at the
end of this section), because streaming flushes the shell before the page can
fail. Only `/api/health` reports the outage. An uptime checker pointed at any
page — including the two that are genuinely broken — reads green throughout.

Note the stale-serving is not merely "cached until the window expires": Next
emits `stale-while-revalidate` of ~365 days, so the five cached routes keep
serving *across* the revalidate boundary indefinitely while the background
regeneration throws into stderr, unseen. That is simultaneously this site's best
resilience property and its worst observability property.

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
- **There is NO query timeout or retry, anywhere in the stack.** This is a known
  open risk, and a *slow* Neon is worse than a dead one: dead fails in ~10ms, slow
  holds the function open until Vercel's own timeout ends it. **A slow-but-alive
  Neon is the untested scenario**, and simulating it needs driver-level or
  privileged network interception.

  A fix was attempted on 2026-08-05 and **reverted**, because the obvious form of
  it is a trap worth knowing about:
  `neon(url, { fetchOptions: { signal: AbortSignal.timeout(3000) } })` puts ONE
  signal in a static object merged into every fetch, so it aborts 3s after module
  load and then poisons every query for the life of the process. Measured:
  `/api/health` reported `db: "unreachable"` within seconds of boot while the
  static routes kept serving 200 — page-level monitoring would never have caught
  it. The correct shape is `neonConfig.fetchFunction` returning a fresh signal per
  call; it is recorded in `src/lib/db/index.ts` and left unapplied until its abort
  path can actually be observed firing.
- Client-side errors are logged to the browser console only and are **not**
  transmitted. That is deliberate: there is no privacy policy on the site yet, so
  adding beaconing would widen a known gap to buy telemetry. Revisit once a
  privacy policy exists.

**Graceful degradation, as measured — and this section was wrong when first
written on 2026-08-05.** The original claim was that dynamic routes "render the
friendly error boundary with a 500 status. Nobody sees a raw stack. That is
acceptable behaviour, not a bug to fix." Only the status code had been checked,
never the response body. When the load-resilience audit looked at the body, it
found `/compare` returned **500 whose only visible text was the `<title>`** — no
`<main>`, no navigation, no footer, and **not the site-wide disclaimer**. The
`error.tsx` boundary is a client component, so it renders only after hydration:
a no-JS visitor or a crawler got a blank white page. Blessing that as acceptable
was the same premature-completion error this audit exists to catch.

Root cause was a missing `loading.tsx`, not `error.tsx`. Without a loading
boundary Next buffers the whole response, so a throw means the shell never
reaches the client. With `src/app/loading.tsx` added, the same outage now yields
**200 with the full layout** — skip link, navigation, `<main>`, `<footer>`, and
the disclaimer — followed by the error boundary once JS runs. Re-measured after
the fix.

**Note the consequence for monitoring:** those two routes now return **200**
during a database outage rather than 500, because streaming flushes the shell
before the page can fail. That makes page-level uptime checks even less
informative than the table above already showed, and is another reason the probe
must be `/api/health`.

---

## 2. Annual data refresh

Schools publish fiscal-year results in the autumn. The methodology page promises
readers the data is updated once a year, so this is a commitment, not a chore.

Do it in **October–November**, not "sometime after autumn". That is when the
fiscal-year reports land *and* when the personal-finance write-ups that link
here get made (`PERSONAS.md` §4) — the site's only distribution channel is
someone else citing it, so a refresh that slips past that window misses the
one period the site is most read and leaves the most recent disclosed year
looking a full year staler than it is.

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
6. **`npm run verify:prose`** — the guard for the step that used to get
   forgotten. It fails on three things: a school's disclosed coverage moving
   away from `conduct/coverage-snapshot.json`; any numeric literal in
   `src/lib/blurbs.ts` that no longer reproduces from `data/`; and the specific
   coverage sentences ("the last year it disclosed a mix", "the returns run to
   FY…") going false. **A failure here is a work order, not a puzzle** — it
   names the school, what moved, and which files to re-read.

   Then **update the prose it names.** Several user-facing strings hard-code the
   coverage end or a headline figure — `src/lib/blurbs.ts`,
   `src/app/methodology/page.tsx`, and the PRD's FY range. The sitemap's
   `lastModified` and the JSON-LD `temporalCoverage` derive from the data
   automatically via `src/lib/site.ts` and need no edit; the prose does not.

   **Only once the prose is true again**, re-baseline the snapshot with
   `npm run verify:prose -- --update-snapshot` and re-run the guard clean.
   Updating the snapshot first turns the gate off, which is the one way to
   misuse it. The guard covers `blurbs.ts` literally; for
   `methodology/page.tsx` it tells you to re-read, because that page's coverage
   story is prose rather than figures.
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
