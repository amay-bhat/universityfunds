BRIEF 1.6.B — Curate MIT (task 1.6)
tier: opus          lease: unassigned (plan mode) — written to TASKS.md at spawn
budget: 150k tokens — transcription-light, research-heavy: a negative-existence
proof across four document families and their archived captures.

**Read `conduct/briefs/1.6/COMMON.md` first and in full.** This brief adds
only what is MIT-specific.

## OBJECTIVE

Establish, from primary MIT documents, exactly what MIT has and has not
disclosed about its investment pool's asset allocation, and curate everything
it did: allocation percentages for every year MIT published them on a
consistent basis, plus annual returns and market values FY2000–FY2025, all
cited. **This unit's most likely correct outcome is a large documented gap,
and the gap is the deliverable** — but a gap is only a finding if it rests on
an enumerated search. Your document trail is as load-bearing as your rows.

**Why you are Opus:** an empty `allocations` array passes every machine check
silently — the sum rule cannot fire on rows that don't exist; the citation
rule has nothing to resolve. On this unit the validator gives **zero signal**,
so the only thing between an honest gap and a fabricated one is your evidence.
A fresh-context adversarial refuter will be pointed at your trail and asked to
find the table you say does not exist. Write the trail for that reader.

## YOU OWN (write access)

- Your own scratch directory
- `conduct/fragments/1.6/mit-school.json`
- `conduct/fragments/1.6/mit-sources.json`
- `conduct/fragments/1.6/mit-readme-section.md`
- `conduct/fragments/1.6/mit-buildlog.md`

Source-id prefix: **`mitimco-`**. If `allocations` is empty, `mit-school.json`
is still delivered (`{"allocations": [], "endowmentReturns": [...]}`) and your
README fragment still carries a full coverage table — every row **no
allocation**, each with its Why and the document checked.

## ANTICIPATED DOMAIN RISK — MIT (HYPOTHESIS; verify, do not assume)

1. **MIT may publish no allocation percentage table at all, for any year.**
   Zero coverage is the limiting case of the coverage rule — expected output,
   not failure. Do not manufacture rows to avoid it. What the project needs is
   the proof: which documents exist, which you opened, what each contains
   instead.
2. **The trap, named.** MIT's audited financial statements very likely *do*
   carry an asset-class fair-value table in dollars. Deriving percentages
   from it is already decided and rejected (see COMMON.md precedent index):
   NAV subtotals exclude cash and direct fixed income, and the
   endowment-report basis is economic exposure including leverage while NAV
   is an accounting value. Cite that table as evidence of what MIT *does*
   disclose; never as a source of a percentage. The one legitimate use of
   audited NAV figures is as dating evidence, never data.
3. **Search sufficiency is a judgment you must argue, not assert.** Minimum,
   each in its own archived years: MITIMCo's site and any annual letter;
   MIT's **Report of the Treasurer** (traditional home of investment-pool
   figures); MIT's audited consolidated financial statements; Internet
   Archive captures of all three. Enumerate what you checked; name any avenue
   judged not worth pursuing and why — a named unpursued avenue is honest, an
   unnamed one is a hole in the claim. Confirm every fetch returned a real
   document (soft-404 trap); record byte sizes or first lines where a fetch
   was ambiguous.
4. **Returns and market values are the part most likely to exist in full.**
   Curate them to their own coverage — a school with no allocation table can
   still have a complete 26-year return series, and that is a real
   deliverable, not a consolation prize.
5. **Pool identity.** MIT's unitized investment pool may not equal "the
   endowment" (it typically includes non-endowment funds). Establish which
   figure is which from MIT's own words; record in `notes`. If the only
   market value available is for a pool that isn't the endowment → **STOP AND
   REPORT** (tripwire 6).
6. **If MIT's allocations are empty, the consequence is NOT yours to
   decide.** `PRD.md`'s definition of done says all 5 schools get allocation
   + returns charts; a school with no allocation data makes that
   unsatisfiable for one of five. **What v1 means is reserved to the human**
   (Part 2 §6) — not proxy-eligible at any tier, including yours. Report the
   finding and its consequence for the human digest. Do not amend `PRD.md`,
   do not soften the finding to fit it, do not propose a workaround as though
   it were a decision.

## ACCEPTANCE CHECK — run yourself before reporting done

1–2. Sandbox validation + shape checks per COMMON.md. With an empty
   `allocations` array the validator is nearly silent — **passing it is not
   evidence of anything on this unit.**
3. **Spot-check three fiscal years of returns/market values against documents
   you did not curate from.** If returns come from one multi-year source,
   find an independent one (a later report restating prior years, or the
   financial statements) and reconcile. Report each comparison.
4. **Gap evidence check — this unit's real acceptance gate.** For every
   fiscal year with no allocation row, name the specific document(s) examined
   for that year and what they contain instead. A year with no examined
   document is not a documented gap — it is an **unchecked year**, and you
   report it as unchecked (K2), not as a gap.
5. State in one sentence, in your own words, why you did not derive
   percentages from any dollar table — on the record that the option was seen
   and rejected, not never considered.

## ESCALATION NOTE

Your tier is Opus, so your chain senior is **Fable**. Risk 6 above is
reserved — it goes to the conductor for the human digest, not into the chain.

## REPORT

Standard items 1–9 from COMMON.md, with item 4 expanded into the primary
deliverable (the exhaustive trail, structured for the adversarial refuter),
plus: a one-paragraph coverage conclusion suitable for the Methodology page,
and — if allocations are empty — the Part 2 §6 consequence stated plainly for
the human digest.
