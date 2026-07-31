# Task 1.6 — common block for all worker briefs

Read this in full before your own brief's specifics. Everything here binds
every 1.6 unit identically. (Plan authored by the Opus conductor 2026-07-30,
audited by Fable; fragment paths normalized to `conduct/fragments/1.6/`.)

## DO NOT TOUCH (standard block)

Everything outside your brief's YOU-OWN list. Specifically: **nothing under
`/Users/amayb/Projects/dashboardProject/data/`** — not even your own school's
file; it is delivered as a fragment. Not `TASKS.md`, `STATUS.html`,
`data/README.md`, `CONSTITUTION.md`, `PRD.md`, `CLAUDE.md`. Not the rails:
`src/lib/constants.ts`, `src/lib/db/schema.ts`, `scripts/seed.ts`,
`scripts/lib/seed-validate.ts` — if your school seems to need a rail change,
that is a tripwire, not an edit. Sibling workers are live concurrently; a
write outside your list can destroy their work. **Never run `npm run seed`,
never pass `--write`** — the write prunes, so a partial write would delete
Yale's and Harvard's curated rows.

## CONTEXT — read before starting

1. `CONSTITUTION.md` Part 1 — Articles 2 (no number without a citation), 4
   (honest numbers *and* honest gaps), 5 (never invent data to close a gap),
   10 (deliver scope as written). Your output is judged against these.
2. `data/README.md` in full. Load-bearing: the **coverage rule** (when
   disclosure stops, the series stops; NAV derivation **rejected, not
   caveated**); the **granularity rule** (curate at the school's own
   granularity; `public_equity` XOR the split equity categories); **target vs
   actual** (`basis` field, one basis per school-year); the category table;
   the JSON shapes; **"What gets validated"** — read it before curating, not
   after a failure.
3. `data/schools/yale.json` — exemplar for a long actual-basis series.
   `data/schools/harvard.json` — exemplar for target basis, real gaps, and
   `sourceLabel` on merged categories.
4. `data/sources.json` — citation style, `notes` depth, archival URL practice.
5. `src/lib/constants.ts` — authoritative categories/bases/school ids.
   Read-only.
6. `TASKS.md` build log — the precedent index below is why.

## PRECEDENT INDEX — settled. Do not re-litigate, do not escalate these.

- **Negative `pct`** → store as published. Bounds `[-25, 100]`; a negative
  **requires** `sourceLabel`; always warns. Never clamp, never merge across
  risk classes to force non-negativity, never drop the year.
- **Undated table** → assign a fiscal year **only** on documented evidence:
  explicit as-of wording, or reconciliation against an independent audited
  series validated against a dated disclosure first (overlay-free asset
  classes only). Otherwise it is a **gap**. Never attribute by publication
  year — "a hypothesis to test, not a finding."
- **Target vs actual** → both curatable; set `basis`; one basis per
  school-year (validator-enforced).
- **Coverage end** → when disclosure stops, the series stops. Returns and
  market values run independently to their own, usually longer, coverage.
- **NAV / dollar tables** → rejected as a percentage source, full stop. Their
  one legitimate use is as *dating evidence, never data*.
- **Parenthesised negatives** → `(2.0)%` means **−2.0%**. A naive regex
  silently flips the sign and nothing downstream catches it (returns aren't
  summed). Read the surrounding prose.

## TOOLING — inherited, saves hours

- School sites drop their own archives; watch for **soft-404s** (HTTP 200
  returning the same-sized HTML page for every year). Verify each fetch
  returned the document you think it did.
- `WebFetch` is blocked from `web.archive.org`; plain `curl` is not:
  `curl -sL "https://web.archive.org/web/{timestamp}id_/{original_url}"`.
  Real timestamps from the CDX API
  (`https://web.archive.org/cdx/search/cdx?url=...&output=text&fl=timestamp,statuscode,mimetype`);
  the `/web/<year>id_/` wildcard silently fails on redirect-only captures.
- The `Read` tool lacks poppler here; do not install it. Extract PDF text
  with `pypdf` in a throwaway venv in your scratch dir (`cryptography`
  package needed for AES-encrypted PDFs). **Oldstyle figures** extract as
  glyph names (`/two.oldstyle/one.oldstyle` = `21`).
- **Look for multi-year tables first** (Yale's page-2 highlights table cut 21
  documents to 5).
- **Assemble merged categories arithmetically** — a small generator script,
  every year's sum printed for inspection.
- `curl` reaches hosts that block `urllib`; Stooq is bot-blocked.

## FRAGMENT SHAPES

- `<unit>-school.json` — exactly `{"allocations":[…],"endowmentReturns":[…]}`
  per `data/README.md`. Allocation rows carry `fiscalYear`, `category`,
  `pct`, `basis`, `sourceLabel` (the school's own printed wording — the audit
  trail), `sourceId`.
- `<unit>-sources.json` — a JSON **array** of source objects. **Ids must
  carry your unit's prefix** (see your brief) so sibling ids cannot collide.
  Every source has a `url` or a `page`. Use `notes` for method detail and —
  where a year's return and market value come from different documents —
  name the other document there (Yale FY2022–FY2025 precedent). **Count
  these split-provenance years and report the count.**
- `<unit>-readme-section.md` — one `### <School> label mapping (task 1.6)`
  section modelled on the Harvard section: mapping table with years, coverage
  table with a State column (`actual` / `target` / **no allocation**) and a
  Why per gap, negative/rounding notes, and an `#### <School> as-of dating`
  subsection iff any table was undated.
- `<unit>-buildlog.md` — build-log prose in the house style: what landed,
  counts, gaps with reasons, `[JUDGMENT CALL]` lines, gotchas worth carrying
  forward.

## VALIDATION SANDBOX (how you satisfy "seed passes" without touching data/)

```
cp -R /Users/amayb/Projects/dashboardProject/data <scratch>/data
# place your school fragment at <scratch>/data/schools/<id>.json
# splice your sources array into <scratch>/data/sources.json
npx tsx /Users/amayb/Projects/dashboardProject/scripts/seed.ts --dry-run --data-dir <scratch>/data
```

Must exit 0; quote the full output including warnings and explain every
warning. Never `npm run seed --dry-run` (npm swallows the flag).

## TRIPWIRES — STOP AND REPORT, no improvisation

1. The school needs a normalized category that doesn't exist.
2. A correctly-transcribed school-year sums materially outside ±1.0pp — never
   widen the tolerance, never nudge a figure.
3. An allocation table with no as-of date and no audited series to reconcile
   against.
4. Any temptation to derive percentages from a dollar/NAV table.
5. A third basis beyond `actual`/`target`.
6. A measurement-universe mismatch (percentages describing a pool that isn't
   the endowment).

## ESCALATION TRIAGE

- Question about **YOUR BRIEF** (spec, scope, boundaries, fragment shape) →
  report back to the conductor; do not improvise around it.
- Question about **A RULE or consequence** → the escalate skill
  (`.claude/skills/escalate/`) from your own tier. Answer it yourself first;
  check the floor before firing.
- Any **tripwire**, or anything **reserved** (kernel Part 2 /
  `CONSTITUTION.md` Part 2 — notably §6, product identity and what v1 means)
  → stop; report for the human digest. No timeout defaults past a reserved
  matter.
- **Three rule escalations inside your unit** → stop; the spec is the
  problem, not you.

## REPORT FORMAT (standard items)

1. Outcome against each numbered acceptance check, with literal validator
   output.
2. Row counts: allocations, distinct fiscal years, per-basis breakdown,
   returns/market values, sources added.
3. Coverage statement: first/last allocation year, every gap with reason and
   the specific document checked.
4. Document trail: every document opened — title, URL (archival if
   applicable), what you took from it or what it contained instead. **For any
   negative claim: the enumerated search that establishes it.**
5. The three spot-check years in full, with the independent documents.
6. Surprises for the build log; every `[JUDGMENT CALL]` with one line.
7. Split-provenance year count.
8. Budget spent.
9. Anything left undone and why (K6). Partial is fine and reported as
   partial; a "done" that doesn't reproduce outside you is a protocol breach
   (K1/K2).
