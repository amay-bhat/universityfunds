BRIEF 1.6.A — Curate Stanford (task 1.6)
tier: sonnet        lease: unassigned (plan mode) — written to TASKS.md at spawn
budget: 180k tokens — expects a real percentage table + returns/MV: ~6–10
archived PDFs with text extraction; anchored between Yale's 5-document win and
Harvard's ~15-document slog.

**Read `conduct/briefs/1.6/COMMON.md` first and in full.** It carries your
DO-NOT-TOUCH list, context reading order, the precedent index, tooling,
fragment shapes, the validation sandbox, tripwires, escalation triage, and the
standard report items. This brief adds only what is Stanford-specific.

## OBJECTIVE

Produce Stanford's endowment data in this project's seed format: normalized
allocation percentages for every fiscal year Stanford itself published them on
a consistent measurement basis, plus annual returns and endowment market
values FY2000–FY2025, every row citing a primary Stanford document. Done means
your fragments validate clean under the seed validator and three fiscal years
you did not curate from reconcile digit-for-digit against independent Stanford
documents. **Stanford's allocation coverage ending before FY2025 is expected
output, not failure** — your deliverable is what Stanford actually disclosed,
not a complete-looking table.

## YOU OWN (write access)

- Your own scratch directory (private copy of `data/`, extraction scripts,
  PDFs, venvs)
- `conduct/fragments/1.6/stanford-school.json`
- `conduct/fragments/1.6/stanford-sources.json`
- `conduct/fragments/1.6/stanford-readme-section.md`
- `conduct/fragments/1.6/stanford-buildlog.md`

Source-id prefix: **`smc-`** on every id, no exceptions.

## ANTICIPATED DOMAIN RISK — Stanford (HYPOTHESIS; verify before relying)

1. **The Merged Pool is not the endowment.** Stanford invests through a
   pooled vehicle larger than the endowment itself. If allocation percentages
   describe the pool while market values describe the endowment, you have
   silently mixed two measurement universes — the same class of error as
   Yale's rejected NAV subtotal. Establish from Stanford's own words which
   pool each table describes; record it in source `notes` and your README
   section. If percentages exist only for a pool that isn't the endowment →
   **STOP AND REPORT** (tripwire 6).
2. **Target and actual may both appear**, possibly in one document. `basis`
   handles it; one basis per school-year; label the choice in `notes`.
3. **Some or all years may have no percentage table.** Honest-gap finding per
   the coverage rule: curate returns/market values to their full coverage,
   leave those `allocations` empty, document each gap with the document
   checked and what it contained instead. An empty array is an acceptable
   answer; an invented one is not.
4. **Split provenance** (return and market value in different documents):
   cite the return's document, name the other in `notes`, count and report.

## ACCEPTANCE CHECK — run yourself before reporting done

1. Sandbox validation per COMMON.md — exit 0, full output quoted, every
   warning explained.
2. Shape checks: no school-year mixes `public_equity` with split equity; no
   mixed bases in a year; every negative `pct` has a `sourceLabel`;
   `marketValueUsdMillions` is in **millions** (a ~$40B endowment is `40000`).
3. **Spot-check three fiscal years against documents you did NOT curate
   from** — the task's own acceptance standard (task 1.3 matched every figure
   to the last decimal this way). Report each year, document, and every
   figure compared. If no independent document exists for a year, say so.
4. If two documents overlap on a year, reconcile and report (overlap
   agreement is what confirmed Yale's merges).

## REPORT

Standard items 1–9 from COMMON.md, plus the Merged-Pool determination (risk
1) stated explicitly with the Stanford wording that establishes it.
