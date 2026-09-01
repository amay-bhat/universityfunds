# University Endowment Investing Explorer

A free, public, no-login site showing how five famous university endowments —
Yale, Harvard, Stanford, MIT and Princeton — actually invested their money over
the last 25 years, what a buy-it-yourself ETF version of each strategy looks
like, and how that compares with simply holding an index fund.

**Education, not financial advice.** The site never tells anyone what to do with
their money, and there is no personalization of any kind.

Live at <https://universityfunds.vercel.app>

## What it does

- **History Explorer** — pick a school and see its asset allocation over time and
  its annual returns, with a plain-English story of how it invests.
- **"Copy the Pros" Translator** — pick a school and a fiscal year, and see that
  endowment's mix translated into ordinary ETFs anyone can buy, with honest fine
  print about what a copycat cannot replicate.
- **Head-to-Head Comparisons** — growth of $10,000 for a school's actual returns
  versus the copycat portfolio versus the S&P 500, 60/40 and 70/30.

## The part that makes it unusual

Every number is transcribed by hand from a public document and carries a citation
to it — 624 curated data rows drawn from 96 source documents: annual reports,
audited financial statements, and universities' written answers to congressional
inquiries. The seed files in `data/` are the source of truth; a validator rejects
any figure whose citation does not resolve, and a reconciliation gate checks each
year's market value against the previous year and its reported return, which is
what catches a transposed digit.

Where a school never published something, **the gap stays a gap** and the site
says so at the point you would see it, rather than estimating, interpolating, or
borrowing a neighbouring year:

- **Yale** stopped publishing its allocation mix after FY2020, so the mix chart
  ends there while the returns run to FY2025.
- **Harvard** reported target allocations rather than actual holdings before
  FY2017, and skipped FY2018 and FY2022 outright. Target years are drawn and
  labelled differently; the skipped years are visible holes.
- **MIT** has published a full mix in only seven scattered years out of
  twenty-six, four of them in written answers to Congress.
- **Stanford** has never published its endowment's mix or return separately at
  all — only a larger shared pool the endowment makes up roughly three-quarters
  of — so it ships as market values only, with the reason explained rather than
  papered over. Its fiscal year also ends 31 August rather than 30 June, so its
  values sit about two months offset from every other series.

The same rule applies to results that are unflattering to the endowments: over
FY2001–FY2025 the copycat portfolio returned 6.5% a year against the S&P 500's
8.0%, and the site says so plainly.

## Stack

Next.js (App Router, TypeScript, Tailwind) on Vercel, with Neon Postgres via
Drizzle. Charts are hand-built against a colour palette validated for contrast
and colour-vision deficiency. There are no live market-data APIs — every return
comes from a stored, cited annual figure.

## Running it locally

```bash
npm install
vercel env pull .env.local   # or set DATABASE_URL by hand; .env.local is gitignored
npm run dev                  # http://localhost:3000
```

The pages read from Postgres, so `DATABASE_URL` has to be set before `npm run dev`
will render anything. The one exception is data validation, which deliberately
needs no credentials:

```bash
npm run seed:dry     # validate data/ without touching any database
npm run seed         # validate, then load data/ into Postgres
```

### Gates

Run before committing. Each exists because something once went wrong that it
would have caught.

```bash
npx tsc --noEmit && npm run lint && npm test && npm run build
npm run seed:dry            # field shape, citation resolution, allocations sum to ~100
npm run seed:verify         # 30 cases proving the validator still catches what it claims
npm run verify:figures      # market value reconciles against the prior year and its return
npm run verify:prose        # coverage and headline figures quoted in copy still match data/
npm run verify:palette      # chart colours stay legible and CVD-safe
npm run check:sources       # every published citation still resolves (network)
```

The rest need a site to point at, and each takes the target URL as an argument:

```bash
npm run verify:seo https://universityfunds.vercel.app        # defaults to localhost:3000
node scripts/verify-allocation-annotations.mjs https://universityfunds.vercel.app
node scripts/verify-term-bubble.mjs https://universityfunds.vercel.app
npm run verify:a11y                                          # defaults to production
```

`verify:seo` is plain `fetch` and is happy against a local `npm run start`. The
three browser-driven ones wait for `networkidle0`, which never settles against
localhost here — the Google Fonts request keeps the connection open — so **give
them the production URL**. A timeout from those is almost always this, not a
broken site.

## Rules for anyone working on this

1. **No copy that tells a reader what to do with their money.** No personalization.
2. **No number without a citation.** If it cannot be sourced, the gap stays.
3. **Plain English.** Define any finance term on first use.
4. **Honest numbers, including honest gaps** — never present two measurement
   bases as one continuous series without saying so where the reader sees it.
5. **`data/` is the source of truth. Never write to the database directly** —
   edit the seed files and re-seed.
6. **Read the dataviz skill before writing any chart code**, and financial maths
   needs unit tests with hand-computed expected values.

## Where the real documentation lives

- `PRD.md` — what v1 is, the non-negotiable rules, the definition of done.
- `TASKS.md` — the task ledger and the full build log. **The source of truth for
  project state**; if any other document disagrees with it, it is stale.
- `data/README.md` — the curation rules: fiscal-year conventions, how each
  school's categories are normalized, and how every disclosure gap was decided.
- `conduct/RUNBOOK.md` — the annual data refresh, disaster recovery, monitoring.
- `CONSTITUTION.md` and `CLAUDE.md` — how the project is built and which
  decisions are reserved to a human.
