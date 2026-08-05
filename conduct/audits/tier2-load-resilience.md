# Tier 2 audit — Load & resilience

**Target:** https://universityfunds.vercel.app (University Endowment Investing Explorer)
**Date:** 2026-08-05
**Local build audited:** Next.js 16.2.11 (Turbopack), commit-clean `src/`
**Method:** production build legend, live HTTP load from one client in the SF Bay Area,
plus local production-mode fault injection with an unreachable database.

Every claim below is tagged **MEASURED** (I observed it) or **REASONED** (I derived it from
code or from a measured figure). Nothing is presented as measured that was calculated.

---

## Verdict — what breaks first

**Nothing in the request path breaks, and the site degrades rather than explodes — but the
thing that breaks first is not availability, it is the two dynamic routes' unbounded cost and
their ugly failure.** Fourteen of the sixteen build outputs are prerendered and never touch
Neon on a request, so a Hacker News spike lands almost entirely on Vercel's CDN. I drove 100
concurrent requests and 122 sustained requests/second at the two routes that *do* hit Neon
(`/compare`, `/translate`) and got **zero non-200 responses, zero 429s, and no latency cliff** —
TTFB rose smoothly from 225 ms (10 concurrent) to 605 ms (100 concurrent) and came back down to
274 ms once the functions were warm. The premise that a direct (non-pooled) Neon connection
would exhaust the connection ceiling **does not apply to this app at all**: the connection
string is pooled *and* the driver is `neon-http`, which speaks HTTPS to Neon's regional SQL
endpoint and never opens a Postgres connection, so there is no pool to exhaust. What actually
gives way, in order: (1) `/compare` and `/translate` return `no-store` on every response, are
listed in the sitemap and are indexable, and re-render on **every dropdown change** — 9 Neon
queries a piece, forever uncached, which is the only unbounded resource on the site and the
one that converts traffic directly into quota consumption; (2) **there is no timeout on any
database call anywhere** (`src/lib/db/index.ts:5`, and the driver itself has zero
`AbortController`/retry code), so a *slow* Neon — not a dead one — is the scenario that piles
up function invocations, and it is the one failure mode I could not reproduce on this machine;
(3) when the DB is unreachable those two routes return **HTTP 500 with a body whose only
visible text is the `<title>`** — no `<main>` element at all — so a no-JS visitor or a crawler
sees a blank white page, and the friendly `src/app/error.tsx` copy only appears after React
hydrates. Meanwhile the prerendered routes kept serving **HTTP 200 in 2–24 ms with the database
completely unreachable and their ISR window expired**, because Next emits
`stale-while-revalidate=31535995` (≈365 days) — that is genuinely excellent, and it means a Neon
outage during an HN spike stays invisible on every route except those two (how large a share of
visitors that is depends on the traffic mix, which I did not measure).

---

## 1. Render strategy per route — MEASURED

Verbatim legend from `npm run build` (Next.js 16.2.11):

```
Route (app)            Revalidate  Expire
┌ ○ /                          1h      1y
├ ○ /_not-found
├ ƒ /compare
├ ○ /explore                   1h      1y
├ ● /explore/[school]          1h      1y
│ ├ /explore/yale              1h      1y
│ ├ /explore/harvard           1h      1y
│ ├ /explore/stanford          1h      1y
│ └ [+2 more paths]
├ ○ /glossary
├ ○ /icon.svg
├ ○ /methodology               1h      1y
├ ○ /robots.txt
├ ○ /sitemap.xml
└ ƒ /translate

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

| Route | Legend | Revalidate / Expire | Touches Neon on a cold **request**? | Queries per render | Source of query count |
|---|---|---|---|---|---|
| `/` | ○ Static | 1h / 1y | **No** — build & background revalidation only | 6 | `src/app/page.tsx:53,54-66` |
| `/explore` | ○ Static | 1h / 1y | **No** | 6 | `src/app/explore/page.tsx:19,20-27` |
| `/explore/[school]` ×5 | ● SSG | 1h / 1y | **No** — all 5 prerendered via `generateStaticParams` | 5 | `[school]/page.tsx:36,87,90-94` |
| `/methodology` | ○ Static | 1h / 1y | **No** | 2 | `methodology/page.tsx:28` (`getSources`, `getProxyMappings`) |
| `/glossary` | ○ Static | none | **No** — never queries the DB at all | 0 | `glossary/page.tsx` imports `GLOSSARY_ENTRIES` only |
| `/compare` | **ƒ Dynamic** | *none* | **YES — every single request** | **9** | `compare/page.tsx:69-73` (3), `:77-79` (5), `:111` (1) |
| `/translate` | **ƒ Dynamic** | *none* | **YES — every single request** | **8–9** | `translate/page.tsx:78-82` (3), `:84-88` (5), `:229` (1, only when a school+year is selected) |
| `/sitemap.xml`, `/robots.txt`, `/icon.svg`, `/_not-found` | ○ Static | none | **No** | 0 | derive from `src/lib/site.ts` constants |

**Query counts are REASONED** (read directly off the line numbers above); the render strategy
and revalidate values are MEASURED from the build legend.

### Two findings from this table

**`export const revalidate = 3600` is dead code on `/compare` and `/translate`.**
Both files declare it (`compare/page.tsx:27`, `translate/page.tsx:28`), but both `await
searchParams`, which forces dynamic rendering. The build legend proves the declaration is
ignored — those two rows are the only ones with **no** Revalidate/Expire values. Nothing is
broken by this, but the code reads as if those routes are cached for an hour and they are not
cached for one millisecond.

**`/compare` and `/translate` fetch all five schools' allocations to render one school.**
`compare/page.tsx:77-79` and `translate/page.tsx:84-88` both do
`Promise.all(schools.map(s => getAllocations(s.id)))` — five separate queries — but only use
the other four to compute a `fromMin`/`years` list for the picker dropdown. Four of the nine
queries per request are avoidable. REASONED from the code.

---

## 2. Caching headers — MEASURED

| Route | `cache-control` returned to the browser | `x-vercel-cache` observed | Function invoked? |
|---|---|---|---|
| `/` | `public, max-age=0, must-revalidate` | `HIT` (also `PRERENDER` on first regional touch) | No |
| `/explore` | `public, max-age=0, must-revalidate` | `PRERENDER`, then `HIT` | No |
| `/explore/yale` | `public, max-age=0, must-revalidate` | `PRERENDER`, then `HIT` | No |
| `/methodology` | `public, max-age=0, must-revalidate` | `PRERENDER`, then `HIT` | No |
| `/glossary` | `public, max-age=0, must-revalidate` | `HIT` | No |
| `/sitemap.xml` | `public, max-age=0, must-revalidate` | `MISS` | Yes (trivial, no DB) |
| **`/compare`** | **`private, no-cache, no-store, max-age=0, must-revalidate`** | **`MISS` — every request, no exceptions** | **Yes, every time** |
| **`/translate`** | **`private, no-cache, no-store, max-age=0, must-revalidate`** | **`MISS` — every request, no exceptions** | **Yes, every time** |

**Yes, Vercel's CDN is genuinely caching the static routes.** The `max-age=0,
must-revalidate` reads alarming but is Vercel's standard ISR contract: the browser
revalidates, the edge serves from its own cache. I confirmed the underlying directive by
running the same build under `next start` locally, where the framework's un-rewritten header is
visible:

```
/         →  Cache-Control: s-maxage=3600, stale-while-revalidate=31532400   x-nextjs-cache: HIT
/explore  →  Cache-Control: s-maxage=3600, stale-while-revalidate=31532400   x-nextjs-cache: HIT
/compare  →  Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate   (no x-nextjs-cache)
```

`stale-while-revalidate=31532400` is 365 days. That single number is the reason this site is
resilient (see §4).

**Every route also carries no HTTP-level protection on `/compare`.** I verified that a unique
query string is not needed to force a function invocation — the route is `no-store`, so
`?z=1`, `?z=2`, `?z=3` all returned `x-vercel-cache: MISS`, as does the bare URL. There is
therefore no cache to poison and also no cache to help.

### Client-side navigation multiplies this — MEASURED

`ComparePicker` (`src/components/ComparePicker.tsx:35,49,63,77`) and `SchoolYearPicker`
(`src/components/SchoolYearPicker.tsx:41,50,68`) call `router.push()` on every `onChange`.
`/compare` has three dropdowns (school, from-year, to-year). I confirmed the resulting RSC
navigation is a full uncached function invocation:

```
GET /compare?school=mit&from=2008&to=2025   -H 'RSC: 1'
  → 200, content-type: text/x-component, 14 783 bytes, 277 ms
  → cache-control: private, no-cache, no-store   x-vercel-cache: MISS
```

So one curious visitor changing three dropdowns twice each costs **6 function invocations and
~54 Neon queries** on top of their initial page load.

### Good news: `<Link>` prefetch does *not* hit the database — MEASURED

The header nav links to `/compare` and `/translate` on every page, so hover-prefetch was a
plausible amplifier. It is not. Against a deliberately unreachable database locally, a
prefetch request completed **200 in 40 ms with 186 bytes and produced zero `NeonDbError`
entries**, while the same URL as a full RSC navigation returned 10 184 bytes and logged one
`NeonDbError`:

```
PREFETCH /compare  (RSC: 1, Next-Router-Prefetch: 1) → 200, 186 bytes, 40 ms, NeonDbErrors: 0
FULL RSC /compare  (RSC: 1)                          → 200, 10 184 bytes, 293 ms, NeonDbErrors: 1
PREFETCH /translate                                   → 200, 188 bytes,  NeonDbErrors: 0
```

Because there is no `loading.tsx` boundary, Next has nothing to prefetch for a dynamic route
and short-circuits. In production the prefetch still shows `x-vercel-cache: MISS` (so it is
still a billable invocation), but it costs no database work.

---

## 3. Neon specifics

### The connection-exhaustion hypothesis does not apply here — MEASURED

Two independent reasons, both verified:

1. **The connection string is pooled.** `DATABASE_URL` in `.env.local` resolves to host
   `ep-<redacted>-pooler.<region>.aws.neon.tech`. The `-pooler` label is present. (No credential
   is reproduced anywhere in this document or in any command I ran.)
2. **More importantly, the app never opens a Postgres connection at all.**
   `src/lib/db/index.ts:1-6` uses `drizzle-orm/neon-http` with `neon()` from
   `@neondatabase/serverless`. That driver's default endpoint builder, read out of
   `node_modules/@neondatabase/serverless/index.js`, is:

   ```js
   fetchEndpoint: (t, n, i) => {
     let s;
     i?.jwtAuth ? s = t.replace(mi, "apiauth.") : s = t.replace(mi, "api.");
     return "https://" + s + "/sql";
   }
   ```

   It replaces the first hostname label — including `-pooler` — and issues an ordinary HTTPS
   `POST` to `https://api.<region>.aws.neon.tech/sql`. One query = one stateless HTTPS
   request. There is no TCP session, no pool, and therefore **no connection ceiling to hit from
   the serverless functions**. The pooled-vs-direct distinction is, for this app's runtime,
   moot. (Real Postgres connections are only opened by `drizzle-kit` and `scripts/seed.ts`,
   which run from a developer's laptop, not from Vercel.)

This is the single most reassuring finding in the audit. The zero-error result at 100 concurrent
(§4) is MEASURED; attributing it to the absence of a connection pool is REASONED — but it is
strongly supported, because connection exhaustion is the one mechanism that would have produced
errors at that concurrency and there is no mechanism present to produce them.

### There is no timeout and no retry on any database call — MEASURED

Scanned `node_modules/@neondatabase/serverless/index.js` for guard mechanisms:

```
retries          -> 0 occurrences
retry            -> 0 occurrences
AbortController  -> 0 occurrences
AbortSignal      -> 0 occurrences
signal:          -> 0 occurrences
```

And the application never supplies one — `neon()` is called with a single argument
(`src/lib/db/index.ts:5`), so the optional `fetchOptions` is never passed, and a grep of `src/`
for `timeout|AbortSignal|fetchOptions|statement_timeout|maxDuration` returns **nothing**.
Consequence: a query against a *slow* Neon waits as long as the platform allows. There is no
`vercel.json` and no `export const maxDuration`, so the ceiling is Vercel's plan default.

### Cold start after idle — MEASURED, with a control

Neon on free/launch tiers suspends compute when idle, so I measured the resume cost rather than
assuming it. Method: a fresh Node process issues `select count(*) from schools` four times; I
stopped all traffic to the site and the DB for the idle window beforehand. Then — and this is the
part that makes the number meaningful — I ran a **control**: three more fresh processes
back-to-back with the database definitely warm, to separate "fresh process pays DNS + TLS +
HTTPS handshake" from "Neon compute is resuming".

```
CONTROL-A (0s idle, DB warm)   q1 304ms  q2 106ms  q3  78ms
CONTROL-B (0s idle, DB warm)   q1 272ms  q2 159ms  q3  78ms
CONTROL-C (0s idle, DB warm)   q1 295ms  q2  76ms  q3  73ms

AFTER-IDLE-400s                q1 450ms  q2 104ms  q3 158ms  q4  82ms
AFTER-IDLE-820s                q1 479ms  q2  89ms  q3 147ms  q4 143ms
```

| Condition | First query in a fresh process | Steady-state queries |
|---|---|---|
| DB warm (control, n=3) | 272 / 295 / 304 ms — median **295 ms** | 73–159 ms |
| After 400 s idle (n=1) | **450 ms** | 82–158 ms |
| After 820 s idle (n=1) | **479 ms** | 89–147 ms |

**The idle-attributable penalty is ≈160–185 ms** (450–479 ms minus the ~295 ms control), and it
does not grow between 400 s and 820 s of idleness. There is no multi-second Neon cold start on
this project's first request. Steady-state latency is identical warm or post-idle, so the
penalty is paid once and only by the first query.

Honest limits on this measurement: **n=1 per idle level** (each sample costs a ~7-minute wait,
and any extra query resets the idle clock), and I could not read Neon's configured autosuspend
timeout — no Neon API key is present in the environment and it is console-only. If the timeout
is longer than 820 s, the compute never actually suspended and the 160–185 ms delta is noise
rather than a resume cost; either way, the *observed worst case* for a first request after
~14 minutes of total silence was 479 ms, which is the number that matters operationally. One
earlier reading of 1171 ms for a first query is excluded as an outlier — it was the first
network call of that shell session and includes cold DNS.

**REASONED, and it cuts the figure further:** all of the above is measured from a laptop in the
SF Bay Area to Neon in `us-east-1`, so ~70 ms of RTT plus a full transcontinental TLS handshake
is baked into every number. Vercel executes this project's functions in `iad1` — visible in the
two-hop `x-vercel-id: sfo1::iad1::…` present on every `/compare` response and absent from the
static routes — which is the same region as the Neon endpoint. In production the handshake and
RTT components are much smaller, so the real first-request penalty is lower than 479 ms.
**Practically: Neon cold start is not a risk for this site.**

### Query latency from this machine — MEASURED, with a caveat

```
WARM q1 1171ms  q2 172ms  q3  99ms  q4 221ms  q5 179ms  q6 339ms
WARM SUMMARY  first=1171ms  subsequent min=99ms median=179ms
```

**Caveat that matters:** this is a laptop in the SF Bay Area talking to Neon in
`us-east-1`, so ~70 ms of every figure is coast-to-coast RTT plus a TLS handshake on the first
call. Vercel's functions for this project execute in `iad1` (visible in the two-hop
`x-vercel-id: sfo1::iad1::…` on every `/compare` response), which is the *same region* as the
Neon endpoint. The production per-query latency is therefore materially lower than these
numbers; do not use 179 ms as the in-production figure. The useful signal here is the
**1171 ms first call vs ~179 ms steady state** — a ~1 s penalty on the first query of a cold
path, which matches the ~1.15–1.25 s p95 seen in the first burst of the load tests (§4) and
which disappeared once functions were warm.

---

## 4. Concurrency behaviour — MEASURED

### Instrument, and how I checked it

Node 26 `fetch` driver (`scratchpad/load.mjs`), N workers pulling from a shared index. I record
**TTFB** (promise resolution = response headers received) separately from **total** (after the
body is drained), because the two answer different questions.

Instrument validation, in order:
1. **Known-good endpoint**, 3 sequential requests to `/glossary` → 3 × 200, exit 0. ✅
2. **Known-bad endpoint**, 2 requests to `/definitely-not-a-page` → reported `{"404":2}`,
   listed both, and **exited 1**. The exit code is set from the failure count directly in the
   script rather than inferred from a pipeline, so `cmd | tail` cannot mask it. ✅
3. **Client ceiling**, 100 concurrent requests for two tiny CDN-cached assets → 100 × 200,
   205 rps, TTFB p50 284 ms / p95 364 ms. So **~280 ms of the latency at 100 concurrent is my
   own client's queueing**, not the site's. ✅

**A real instrument bug I hit and corrected, disclosed for the record:** my first ramp used
`node load.mjs … $MIX` with `MIX="…"`. This shell is **zsh**, which does not word-split
unquoted variables, so all 250 requests went to a single bogus path and returned 404 from the
edge cache. Those 250 requests produced no usable data and are excluded from every table below.
The ramp was re-run with literal arguments.

### Ramp results — dynamic routes only (the only routes that reach Neon)

All rows: mix of `/compare`, `/translate` and parameterised variants. **TTFB in ms.**

| Run | Concurrency | Requests | TTFB p50 | TTFB p95 | TTFB max | rps | Non-200 | 429/5xx |
|---|---|---|---|---|---|---|---|---|
| sequential baseline | 1 | 6 | 162–178 | 193–240 | 240 | 12 | **0** | **0** |
| `dyn-c10` | 10 | 40 | 225 | 1182 | 1253 | 22.0 | **0** | **0** |
| `dyn-c25` | 25 | 50 | 347 | 846 | 1101 | 37.6 | **0** | **0** |
| `dyn-c50` | 50 | 50 | 383 | 1090 | 1231 | 37.2 | **0** | **0** |
| `dyn-c100` | 100 | 100 | 605 | 854 | 1473 | 60.0 | **0** | **0** |
| `dyn-c50-sustained` (warm) | 50 | 150 | **274** | **652** | 961 | **122.1** | **0** | **0** |

`x-vercel-cache` was `MISS` on **416 of 416** dynamic-route requests my instrument recorded
across every run (10 + 6 + 10 sequential/mixed, plus 40 + 50 + 50 + 100 + 150 in the ramps).
Not one was served from cache.

### Static routes, sequential baseline

| Route | TTFB p50 | TTFB p95 | `x-vercel-cache` |
|---|---|---|---|
| `/` | 28 | 121 | HIT |
| `/explore` | 29 | 78 | HIT |
| `/explore/yale` | 32 | 99 | HIT |
| `/methodology` | 28 | 33 | HIT |
| `/glossary` | 19 | 34 | HIT |
| `/explore/stanford` | 21 | 217 | PRERENDER → HIT |

### Reading the numbers

- **No knee was found.** Latency grew roughly proportionally with concurrency and then
  *improved* under sustained load (274 ms p50 at 122 rps, better than 605 ms at the 100-wide
  cold burst) as Vercel's function instances warmed. That is textbook graceful degradation.
- **The p95 spikes at 10–50 concurrent are almost certainly cold starts rather than
  saturation** (REASONED). The `dyn-c10` p95 of 1182 ms against a p50 of 225 ms is the shape you
  get when a few of ten parallel instances pay a first-invocation penalty, and it matches the
  1171 ms first-query figure in §3. Decisively, the p95 *fell* to 652 ms in the later,
  higher-throughput sustained run — saturation does not improve with more load; warming does.
- **I did not find the site's ceiling, only my own.** At 100 concurrent my client contributes
  ~280 ms of TTFB even for trivially cached assets (validation step 3). **Finding the true
  ceiling would need a distributed load generator, which I do not have on this machine.** I am
  stating that rather than extrapolating a number.
- **The client's own throughput, as reported by the instrument** (MEASURED): 6.7 Mbit/s
  sequential, 8.7 Mbit/s at `dyn-c10`, 13 Mbit/s at c25/c50, 22 Mbit/s at c100, 43.1 Mbit/s on
  the sustained run. Since throughput kept climbing as concurrency rose, the client link was
  not the constraint in the dynamic-route ramps.
- **I stopped ramping at 100 concurrent by design**, per the brief's proportionality
  instruction, not because anything failed.

### Requests actually issued

| Purpose | Requests |
|---|---|
| Cache-header sweep | 8 |
| Instrument sanity checks (known-good + known-404) | 5 |
| Client-ceiling validation (tiny CDN assets) | 100 |
| Sequential baselines (2 runs) | 59 |
| **Discarded — zsh word-splitting bug, all 250 to one bogus 404 path** | **250** |
| Mixed ramp (corrected, c10) | 45 |
| Dynamic ramps: c10 40, c25 50, c50 50, c100 100, sustained 150 | 390 |
| Compressed wire-size sweep | 14 |
| First-visit asset enumeration (3 pages × HTML + subresources) | 47 |
| RSC nav / prefetch / junk-param / sitemap / robots probes | 9 |
| **Total issued against production** | **927** |
| — of which reached a serverless function | **≈431** |
| — of which reached Neon (≈9 queries each; prefetches reach 0) | **≈428 requests ≈ 3 850 queries** |

No sustained flood, no request rate above ~205 rps, total duration of all load activity under
two minutes of wall-clock request time.

---

## 5. Failure modes — what a user actually sees

### Static analysis of the guards that exist

| Guard | Present? | Evidence |
|---|---|---|
| `src/app/error.tsx` | ✅ Yes | Route-level boundary, `"use client"`, friendly copy, `reset()` button, shows `error.digest` |
| `src/app/not-found.tsx` | ✅ Yes | Used by `explore/[school]/page.tsx:86,88` for invalid school slugs |
| `src/app/global-error.tsx` | ❌ **Missing** | `find src -name 'global-error.tsx'` → nothing |
| `src/app/loading.tsx` (any) | ❌ **Missing** | `find src -name 'loading.tsx'` → nothing |
| `try`/`catch` anywhere in `src/` | ❌ **None** | `grep -rn catch src/ --include='*.ts*'` matches exactly one thing: the English word "catch" in prose at `src/lib/blurbs.ts:36` |
| Any query timeout | ❌ **None** | `grep -rnE 'timeout\|AbortSignal\|fetchOptions\|maxDuration' src/` → no matches |
| Retry / circuit breaker | ❌ **None** | driver has zero retry code (§3); app has none |
| Input clamping on user params | ✅ Yes | `compare/page.tsx:99-106` clamps `from`/`to`; `translate/page.tsx:119-127` validates against real years |

### Fault injection — MEASURED, locally, production mode

Method, and what I was careful about: I never touched `.env.local`. I first verified that a
shell-supplied `DATABASE_URL` overrides the file (`@next/env` skips variables already in
`process.env`) by loading the config both ways and printing **only the hostname**:

```
--- no override ---     host = ep-<redacted>-pooler.<region>.aws.neon.tech   (real value, redacted here)
--- shell override ---  host = 127.0.0.1:1
```

Then I ran the **already-built production output** under `next start` with `DATABASE_URL`
pointed at a non-resolving Neon-shaped host. This is the exact production analogue: the static
pages are already on disk, the dynamic routes have to reach the database.

**Result — total Neon outage:**

| Route | Status | Time | Body |
|---|---|---|---|
| `/` | **200** | 12 ms | full prerendered page |
| `/explore` | **200** | 11 ms | full page |
| `/explore/yale` | **200** | 16 ms | full page (64 KB) |
| `/methodology` | **200** | 28 ms | full page (263 KB) |
| `/glossary` | **200** | 22 ms | full page |
| `/compare` | **500** | 83 ms | 14 837 bytes — see below |
| `/translate` | **500** | 149 ms | 14 889 bytes |
| `/compare?school=mit&from=2010&to=2025` | **500** | 84 ms | 14 994 bytes |

**Result — expired ISR cache *and* dead database.** This is the question that actually matters
for an HN spike lasting longer than the revalidate window, so I measured it rather than
reasoning about it: I temporarily set `src/app/page.tsx` `revalidate` to `5`, rebuilt, ran with
the dead DB, and probed across the expiry boundary. (The file was restored immediately
afterwards and its SHA-1 verified back to `ac7554476acb00326659fabab899f1695b552723`; `git
status src/` is clean.)

```
T+0s   (fresh)              x-nextjs-cache: STALE   code=200  24 ms
T+7s   (cache EXPIRED) #1   x-nextjs-cache: STALE   code=200   3 ms
T+7s                   #2   x-nextjs-cache: STALE   code=200   2 ms
T+7s                   #3   x-nextjs-cache: STALE   code=200   2 ms
T+15s                  #4   x-nextjs-cache: STALE   code=200   2 ms
control /explore (1h)       x-nextjs-cache: HIT     code=200  12 ms
control /compare (dynamic)                          code=500 411 ms
```

**The prerendered routes never fail.** They keep serving stale content indefinitely — the
`stale-while-revalidate=31535995` window is 365 days — and the background revalidation failure
is swallowed. It *is* logged (`⨯ Error: Failed query: select "id", "name", "manager_name",
"website" from "schools"`), so it would appear in Vercel's logs, but no user ever sees it.
**This is the correct behaviour and the reason the site does not explode.**

### What the 500 page actually looks like — MEASURED, and it is the real defect

I stripped the scripts out of the `/compare` 500 body and looked at what a browser with no
JavaScript, or a crawler, receives:

```
MAIN BLOCK: NO <main> ELEMENT IN HTML
ALL VISIBLE TEXT (no-JS view): "Head to Head — Compare — Endowment Explorer"
contains 'Something went wrong': False
total html bytes: 14837
```

So: **14.8 KB of HTML whose only human-readable content is the page title.** The layout's
header, nav, footer and the site-wide "Education, not financial advice" disclaimer are present
only inside the serialised RSC payload (`self.__next_f.push([…])`) — they are *not* in the
HTML. The error boundary's copy is not in the HTML either; the payload ends with
`12:E{"digest":"1594281885"}`, and `src/app/error.tsx` renders **only after React hydrates**.

Consequences:
- A JS-enabled visitor sees a blank white page, then the friendly "Something went wrong"
  panel. `error.tsx` does work — just late, and after a flash of nothing.
- **A no-JS visitor or a crawler sees a permanently blank white page with a 500 status.** For
  a site whose footer disclaimer is a stated non-negotiable (`CLAUDE.md:31`, `PRD.md`), a
  failure page that renders none of the layout is a compliance problem as well as a UX one.
- The root cause is the absence of a `loading.tsx`: with no Suspense boundary above the data
  fetch, Next has no shell to flush before the throw, so nothing reaches the HTML.

### Client-side navigation fails *gracefully* — MEASURED

The one bright spot: an in-app navigation to a broken dynamic route does **not** 500.

```
GET /compare  -H 'RSC: 1'   (database unreachable)
  → 200, 10 184 bytes, 293 ms, flight payload ends  f:E{"digest":"1594281885"}
```

A visitor who is already on the site and clicks "Compare" gets a 200 and the styled error
panel inside the intact layout. Only the *initial document load* — i.e. the visitor arriving
from Hacker News on a link straight to `/compare` — gets the blank 500.

### Exact file/line of every missing guard

| Missing guard | File:line | What happens without it |
|---|---|---|
| No timeout on the DB client | `src/lib/db/index.ts:5` | A slow Neon blocks the function to the platform ceiling; no retry either |
| Unguarded awaits (no try/catch) | `src/app/compare/page.tsx:69-73`, `:77-79`, `:111` | Any query error → whole route 500s |
| Unguarded awaits (no try/catch) | `src/app/translate/page.tsx:78-82`, `:84-88`, `:229` | Same |
| Unguarded awaits | `src/app/page.tsx:53-66`; `src/app/explore/page.tsx:19-27`; `src/app/explore/[school]/page.tsx:36,87,90-94`; `src/app/methodology/page.tsx:28` | Low risk — these only run at build/revalidation, and a failed revalidation degrades to stale (measured above). A **build**-time failure fails the deploy, which is the safe direction |
| No `loading.tsx` | absent from `src/app/` | No streamed shell → the 500 body has no `<main>`, no header, no footer |
| No `global-error.tsx` | absent from `src/app/` | An error thrown in `src/app/layout.tsx` itself would show Next's unstyled default. Low probability — the layout makes no DB call — but it is a two-minute file |
| No `maxDuration` / `vercel.json` | absent | A hung request runs to the plan's default ceiling |
| Dead `revalidate` declarations | `src/app/compare/page.tsx:27`, `src/app/translate/page.tsx:28` | Misleading only; `searchParams` already forced dynamic |

### What I could NOT test on this machine — stated plainly

- **A *slow* (rather than dead) Neon.** This is the highest-consequence untested scenario,
  because it is the one that causes functions to pile up rather than fail fast. Simulating it
  requires intercepting the driver's HTTPS call to `api.<region>.aws.neon.tech` on port 443,
  which needs either a code change (`NeonConfig.fetchEndpoint`) or a privileged local DNS/TLS
  interception. I did neither. **The §3 evidence that there is no timeout and no retry anywhere
  in the stack is code-level fact; the resulting behaviour under a slow Neon is REASONED, not
  measured.**
- **The true concurrency ceiling of the deployment.** My client saturates before the site does
  (§4). Would need a distributed generator.
- **The Vercel plan.** No usable Vercel token is present (`.vercel/project.json` has only ids;
  the CLI is unauthenticated), so I cannot read plan or quota. **This matters and there is a
  contradiction in the repo:** `CLAUDE.md:24` states "Vercel (Pro)", while this audit was
  commissioned on the premise of **Hobby**. See fix #10.
- **Neon's autosuspend configuration.** Measured behaviour is reported in §3; the configured
  suspend timeout is only readable from the Neon console.

---

## 6. Fixes, ordered by leverage

### Tier 1 — removes the only unbounded resource on the site

**1. Get Neon off the request path for `/compare` and `/translate`.** These two routes are the
entire load story: 9 uncached queries per view, per dropdown change, per crawler hit, forever.
Three options in descending order of how much they fix:

- **(a) Best — make the data static and filter in the browser.** The whole dataset behind both
  pages is tiny: five schools, ~200 allocation rows, ~150 benchmark rows. Fetch it once at
  build time, embed it, and let `ComparePicker` / `SchoolYearPicker` change local state instead
  of calling `router.push()`. Both routes become `○ Static` with `revalidate = 3600`, the site
  becomes 100 % CDN-served, and the DB is unreachable-proof end to end. Also removes the
  `no-store` header and makes the routes indexable *cheaply* rather than expensively.
- **(b) Good — move the parameters into the path.** `/compare/[school]/[from]/[to]` with
  `generateStaticParams` for the plausible combinations, deep links outside the set falling
  back to a clamped canonical. Restores ISR + `stale-while-revalidate`, which measurement in
  §5 shows is what makes the rest of the site outage-proof.
- **(c) 20-minute mitigation if (a)/(b) must wait — cache the queries, not the page.** Wrap
  each function in `src/lib/queries.ts` in Next's `unstable_cache` / `"use cache"` with a
  long revalidate and a per-argument key. The route stays dynamic (still a function invocation,
  still `no-store` at the CDN), but the 9 Neon round trips collapse to ~0 for almost every
  request. This alone removes the database from the blast radius.

**2. Bound every database call.** `src/lib/db/index.ts:5` currently reads
`neon(process.env.DATABASE_URL!)` with no options. The driver has zero timeout and zero retry
code (§3). Pass one:

```ts
const sql = neon(process.env.DATABASE_URL!, {
  fetchOptions: { signal: AbortSignal.timeout(3000) },
});
```

Without this, the one failure mode I could not test — a *slow* Neon rather than a dead one — is
also the one that converts a traffic spike into piled-up long-running functions. Fast failure is
strictly better here, because §5 proves a failed background revalidation degrades to stale
content that users never notice.

**3. Cut the over-fetch: 9 queries → 5.** `src/app/compare/page.tsx:77-79` and
`src/app/translate/page.tsx:84-88` query all five schools' allocations to render one. Replace
with one aggregate query for the picker (`select school_id, min(fiscal_year), array_agg(distinct
fiscal_year) … group by school_id`) plus `getAllocations(selectedSchool)`. A ~44 % reduction in
per-request DB work for roughly ten lines. Worth doing even after fix #1, because it also cuts
the build/revalidation cost.

### Tier 2 — makes the failure that remains look survivable

**4. Add `src/app/loading.tsx`.** This is the root cause of the blank 500, not `error.tsx`
(which is fine). A Suspense boundary above the data fetch gives Next a shell to flush, so the
header, nav, footer, the mandated disclaimer, *and* the error panel all reach the HTML instead
of living only in a client-side payload. One small file fixes the worst user-visible symptom in
the audit.

**5. Catch the query failure on the two dynamic routes and return 200 with content.** There is
currently no `try`/`catch` anywhere in `src/` (the only `catch` match is the English word in
`src/lib/blurbs.ts:36`). Wrap the fetch blocks at `src/app/compare/page.tsx:69-79,111` and
`src/app/translate/page.tsx:78-88,229` and render an "these figures are temporarily
unavailable — the history pages still work" panel with links to the prerendered routes. A 200
with a working nav beats a 500, especially for crawlers arriving from an HN link. Leave the
prerendered routes' awaits unguarded — a build-time failure *should* fail the deploy, and a
revalidation failure already degrades to stale.

**6. Add `export const maxDuration` to the two dynamic routes** (15 s is generous for 9 queries
whose p50 TTFB is 274 ms). Belt-and-braces with fix #2: bounds the request even if the timeout
is bypassed.

**7. Add `src/app/global-error.tsx`.** `src/app/error.tsx` cannot catch a throw in
`src/app/layout.tsx`. The layout makes no DB call so probability is low, but the file costs two
minutes and prevents Next's unstyled default from ever shipping.

**8. Delete the two dead `revalidate` declarations** at `src/app/compare/page.tsx:27` and
`src/app/translate/page.tsx:28`, or add a comment explaining that `searchParams` overrides them.
Right now the code claims an hour of caching that the build legend proves does not exist.

### Tier 3 — crawl budget and the money question

**9. Until fix #1 ships, stop paying for crawlers on the uncacheable routes.**
`src/app/sitemap.ts:11-12` lists `/translate` and `/compare` at priority 0.8, and
`src/app/robots.ts` allows everything. Every Googlebot, Bingbot and AI-crawler fetch of those
two URLs is 9 Neon queries with no cache. Either land fix #1 (after which they are free and
*should* stay in the sitemap) or temporarily drop them from `sitemap.ts` and add them to the
robots `disallow` list. Do not do both — dropping them permanently costs real SEO on two of the
site's three headline features.

**10. [H] Resolve the plan contradiction — this decides whether the site degrades or vanishes.**
`CLAUDE.md:24` says "Vercel (Pro)"; this audit was commissioned on the premise of **Hobby**.
The distinction is the difference between the two answers to "does it explode":
- On **Pro**, exceeding included usage bills overage. The site stays up. Traffic costs money.
- On **Hobby**, exceeding included usage **pauses the deployment**. The site goes to an error
  page — a total outage, triggered by success, with no warning to a user who is asleep.
  Hobby is also nominally non-commercial, which is a separate question for this project.

I could not read the plan from this machine (no authenticated Vercel token). **Someone must
check the dashboard and correct whichever document is wrong.** If it is Hobby, fix #1 stops
being a performance improvement and becomes the thing standing between an HN front page and an
outage.

**11. [H] Turn on Vercel Spend Management with a hard cap and email alert, and Neon usage
alerts.** Dashboard-only. This is the actual answer to "does it explode": with fix #1 in place
the site is CDN-served and effectively free; without it, the failure arrives as a bill or a
pause rather than a 500, and nobody notices until the site is already down.

### Not a problem — checked and cleared

- **Bandwidth is not the cliff.** MEASURED first-visit wire bytes (gzip/brotli, HTML + every
  referenced JS/CSS/font): `/` = **252 KB**, `/explore/yale` = **392 KB**, `/compare` =
  **379 KB**. REASONED from that: 30 000 HN visitors at ~1.5 pages each ≈ **11 GB**, comfortably
  inside a 100 GB allowance. The heaviest single asset is a 117 KB Recharts chunk on the chart
  pages; no action needed for a load event.
- **Connection pool exhaustion is impossible** for this app's runtime (§3) — the driver never
  opens a Postgres connection. The `-pooler` host is correct anyway.
- **Malicious/odd input does not crash anything.** `compare/page.tsx:99-106` clamps `from`/`to`
  and shows an honest "that link asked for a period outside the available data" notice;
  `translate/page.tsx:119-127` validates the year against real data. `explore/[school]`
  correctly `notFound()`s an unknown slug (`:86,88`). No input path 500s.
- **`<Link>` prefetch does not amplify database load** (§2, measured against a dead DB).
- **Unknown school slugs are cheap and self-limiting.** `/explore/[school]` keeps Next's default
  `dynamicParams: true`, so `/explore/anything-else` is server-rendered on demand. MEASURED:
  first hit `404`, `x-vercel-cache: MISS`, 307–526 ms; the *same* slug repeated returns `404`
  with `x-vercel-cache: HIT` in 159 ms. It costs **one** function invocation per distinct slug
  and **zero** Neon queries, because `isSchoolId()` rejects the slug and calls `notFound()`
  before any query runs (`src/app/explore/[school]/page.tsx:86`, and `generateMetadata` returns
  early at `:36`). A crawler enumerating garbage paths cannot reach the database this way. No
  action needed — but note the contrast with `/compare`, where every distinct query string is
  9 queries *and* is never cached.
- **Static routes survive a total database outage indefinitely** (§5, measured across an expired
  ISR window). This is the single best resilience property the site has, and fix #1 extends it
  to the whole site.
