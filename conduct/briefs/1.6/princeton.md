BRIEF 1.6.C — Curate Princeton (task 1.6)
tier: sonnet (re-routes to opus on tripwire 3)
lease: unassigned (plan mode) — written to TASKS.md at spawn
budget: 200k tokens — highest document count and per-document work: if the
policy portfolio is a web page, a 25-year series means many archive captures
plus per-capture dating evidence rather than a few multi-year tables.

**Read `conduct/briefs/1.6/COMMON.md` first and in full.** This brief adds
only what is Princeton-specific.

## OBJECTIVE

Curate Princeton's endowment data into this project's seed format: normalized
allocation percentages for every fiscal year Princeton published them on a
consistent basis and on a **documented as-of date**, plus annual returns and
market values FY2000–FY2025, all cited to primary PRINCO or Princeton
documents. Done means your fragments validate clean and three years you did
not curate from reconcile digit-for-digit against independent documents.
Coverage ending before FY2025, or a series with holes, is expected output
where that is what Princeton disclosed.

## YOU OWN (write access)

- Your own scratch directory
- `conduct/fragments/1.6/princeton-school.json`
- `conduct/fragments/1.6/princeton-sources.json`
- `conduct/fragments/1.6/princeton-readme-section.md`
- `conduct/fragments/1.6/princeton-buildlog.md`

Source-id prefix: **`princo-`**. Your README fragment **must** include an
`#### Princeton as-of dating` subsection unless every single curated table
carried explicit as-of wording (see risk 1).

## MUST-READ-FIRST ADDITION

`data/README.md` → `#### Harvard as-of dating (why these years and not
others)` — the full worked example of assigning fiscal years by evidence:
the reconciliation table, why only overlay-free asset classes (private
equity, real estate, natural resources) are admissible, why the method was
validated against a dated disclosure first, and the standard that audited NAV
figures are *dating evidence, never data*. The single most likely-to-bind
precedent in your unit.

## ANTICIPATED DOMAIN RISK — Princeton (HYPOTHESIS; verify, do not assume)

1. **Headline risk: the dating problem in its sharpest form.** If PRINCO
   publishes its allocation as a periodically-updated **web page** rather
   than a dated table, an archived capture gives you a *publication* date —
   which the dating rule forbids outright as an as-of date. Timestamp-based
   attribution would shift the whole Princeton series by an unknown offset,
   invisibly — exactly the failure the Harvard decision exists to prevent.
   So: (a) look **first** for explicit as-of wording in a companion primary
   document — Princeton's **Report of the Treasurer** or audited financial
   statements often print the pool's allocation with a June 30 date; an
   explicitly dated table beats an undated capture every time. (b) If you
   must date undated tables, the only sanctioned method is the Harvard
   reconciliation. (c) Neither available for a year → **that year is a gap.**
   (d) A dating approach not covered above → **STOP AND REPORT** (tripwire 3);
   the Harvard version of this question cost a Fable escalation — it is not a
   call to improvise mid-unit.
2. **Princeton's allocations are likely target/policy basis.** Set
   `basis: "target"`; one basis per school-year. If a document publishes both
   target and actual for one year, note that `allocations` is uniquely
   constrained on (school, year, category) **without** `basis` — one
   school-year cannot hold both. Curate one, record the other's existence in
   `notes`, and report it (the build log flags this constraint as untested).
3. **PRINCO's labels won't match ours; one mapping is a real judgment.**
   Expect labels around independent/absolute return, real assets, and a
   possible three-way equity split (domestic / international developed /
   emerging). Developed+EM maps to the single `intl_public_equity` — that is
   the documented category definition, not a coarsening — but every merge
   must be arithmetic on cited figures with component wording preserved in
   `sourceLabel` (Harvard style: `"Foreign Equities + Emerging Markets"`). A
   label with no honest home goes to `other`, kept small; if it is *large* →
   **STOP AND REPORT** (tripwire 1) — a big sleeve in `other` erases a
   school's real strategy.
4. **Do not coarsen.** If Princeton splits public equity by geography, use
   the split categories; `public_equity` exists only for schools that
   published no split (validator-enforced XOR).
5. **A published table may sum off 100.** Harvard's own tables sum to 101%
   in three years and are stored as published, passing at the ±1.0pp
   boundary. A correctly-transcribed table **outside** ±1.0pp → **STOP AND
   REPORT** (tripwire 2). Never widen the tolerance (a rail you don't own);
   never nudge a figure — the sum-error message was rewritten precisely
   because a curator's likely next move was "an invented figure with a real
   citation."
6. **Early years may have no percentage table.** Honest gap; document each
   with the document checked.
7. **Split provenance:** cite the return's document, name the market-value
   document in `notes`, count and report.

## TOOLING ADDITION

If the primary artifact is a web page, the CDX API is your index of *when the
page changed*, and a diff between consecutive captures finds the year a
table's numbers moved. But per risk 1: a capture timestamp is a publication
date — never an as-of date.

## ACCEPTANCE CHECK — run yourself before reporting done

1–2. Sandbox validation + shape checks per COMMON.md — including the equity
   XOR and one-basis-per-year rules, both of which your unit is most likely
   to trip.
3. **Spot-check three fiscal years against documents you did NOT curate
   from.** Where a year's allocation came from an undated source, the
   spot-check must independently confirm **the dating, not just the digits**
   — a correctly transcribed table on the wrong year is still wrong, and it
   is the error your unit is most exposed to.
4. **Dating audit.** For every allocation year, state the evidence class:
   (a) explicit as-of wording — quote it; (b) reconciliation — show the
   comparison table in the Harvard format and name the dated disclosure the
   method was validated against; or (c) gap. **No year may be class (d)
   "assumed."** If any is, report it as unchecked rather than curating it.
5. If two documents overlap on a year, reconcile and report.

## REPORT

Standard items 1–9 from COMMON.md, plus:
10. The dating audit in full, per year — written to be lifted directly into
    the `#### Princeton as-of dating` README subsection.
11. Every category-mapping decision where PRINCO's label did not map
    obviously, with wording preserved and one line of reasoning.
