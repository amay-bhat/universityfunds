BRIEF 1.6.D — Harvard returns tail (closes task 1.5)
tier: sonnet        lease: assigned at spawn (see TASKS.md)
budget: 120k tokens — ~8 fiscal years, each likely needing its own archived
primary document; no allocation work at all.

**Read `conduct/briefs/1.6/COMMON.md` first and in full.** This brief adds
only what is specific to this unit. Approved by the human 2026-07-30 as a
fourth pilot unit so 1.5's tail never runs as an unrelated concurrent session.

## OBJECTIVE

Complete Harvard's return/market-value series: **FY2000–FY2006 and FY2010**
are missing (the other 18 years are curated and seeded — do not touch them).
Each missing year needs Harvard's own primary documents — the John Harvard
Letter and/or the Harvard University Financial Report for that year; HMC's
older reports carry no multi-year returns table, which is why these years are
open. FY2010 sits inside the curated range, so the returns chart currently
has a hole in the middle; closing it is the headline win. A year you cannot
source is reported as a documented gap, never estimated (Article 5).

## YOU OWN (write access)

- Your own scratch directory
- `conduct/fragments/1.6/harvard-returns-rows.json`
- `conduct/fragments/1.6/harvard-returns-sources.json`
- `conduct/fragments/1.6/harvard-returns-buildlog.md`

No README fragment — Harvard's mapping section exists; if a coverage note
needs amending, propose the exact wording in your build-log fragment.

## FRAGMENT SHAPES (this unit differs from the school units)

- `harvard-returns-rows.json` — a JSON **array of endowmentReturns rows
  only** (not a whole school file): `fiscalYear`, `returnPct` +
  `returnSourceId`, `marketValueUsdMillions` + `marketValueSourceId` per
  COMMON.md's per-figure citation rule. The conductor splices these into
  `data/schools/harvard.json`. Years must be within {2000–2006, 2010} — any
  other year is off-brief.
- `harvard-returns-sources.json` — new sources only. Prefix `hmc-`, and ids
  **must not collide with the existing `hmc-*` ids** in `data/sources.json`
  (read it first; suffix with the document year, e.g.
  `hmc-john-harvard-letter-2003`).

## SANDBOX VALIDATION (adapted)

Copy `data/` to scratch, splice your rows into the copy's
`schools/harvard.json` `endowmentReturns` array and your sources into
`sources.json`, then run the dry-run per COMMON.md. Must exit 0.

## DOMAIN NOTES

- `finance.harvard.edu` 403s automated fetches — go through the Internet
  Archive per COMMON.md tooling.
- **Parenthesised negatives:** FY2001 and FY2009-adjacent years plausibly
  contain negative returns printed as `(x.x)%` — the sign-flip trap in
  COMMON.md's precedent index was found on exactly this school. Read the
  prose around every figure.
- These are the years spanning the dot-com bust; a negative return is
  plausible and honest. The band is (−100, 200]; store what Harvard printed.
- **Fiscal-year attribution:** a letter published in autumn 2003 describes
  FY2003 (ended June 30, 2003). Confirm from the document's own wording, not
  the publication date.
- Split provenance is likely here (return in the letter, market value in the
  financial report) — that is exactly what the per-figure citation fields
  are for.

## ACCEPTANCE CHECK

1. Sandbox validation exit 0, output quoted, warnings explained.
2. Every delivered year in {2000–2006, 2010}; no existing year touched.
3. **Spot-check two of your years against documents you did not curate
   from** (e.g. a later report restating the prior year, or the university
   financial report vs. the letter). Report every figure compared.
4. For any year left ungapped, the enumerated search that establishes the
   gap (COMMON.md report item 4).

## ESCALATION TRIAGE

Per COMMON.md. Your tier is Sonnet; your chain senior is Opus.

## REPORT

Standard items 1–9 from COMMON.md (item 3's coverage statement covers just
these 8 years), plus the proposed TASKS.md wording to close task 1.5 if all
eight years land — the conductor applies it; you never touch TASKS.md.
