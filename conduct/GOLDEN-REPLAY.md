# Golden replay — Phase A acceptance check

**What this is.** The Conduct kernel and escalate skill (v1.0.0-rc1) replayed
against the four escalations already logged in `TASKS.md`, which serve as
golden test cases: for each, would the new protocol have (1) fired at the
right time, (2) routed reserved matters correctly, (3) reproduced or improved
the outcome? Every divergence is adjudicated as bug or improvement. Run
2026-07-30 by Fable against kernel 1.0.0-rc1.

**Verdict up front: 4/4 reproduce. Zero regressions. Two mechanical
improvements and one honestly-documented residual risk.**

---

## Case 1 — Yale FY2021–FY2025 allocation coverage

*(Logged under task 1.3/1.4; Opus → Fable; outcome: option A, leave the gap,
plus forward-run allowance and documented upgrade path.)*

- **Floor:** clears all three properties — materially different product
  (gapped vs. derived series), expensive to unwind (curation + UI built on
  it), touches Articles 2/4/5. Correctly above the floor. ✓
- **Reserved:** the decision correctly left `PRD.md` unamended and pushed
  "what v1 means" to Checkpoint A. Kernel Part 2 §6 produces identical
  routing. ✓
- **Two-phase replay:** both tiers independently chose A in the historical
  run, so blinding changes nothing about the option. Fable's additions (the
  vintage-labelled forward-run, option C's named pass/fail test) came from
  its own reasoning about the *evidence*, available in Phase 1. The child's
  reasoning — delivered in Phase 2 under the new protocol — is not lost, only
  sequenced.
- **Retro-telemetry:** outcome `ratified` (same option, material additions).
- **Reproduces: YES.**

## Case 2 — Harvard granularity and basis

*(Task 1.5 groundwork; child leaned option C; Fable refuted C on primary
documents — no year exists where Harvard published an actual allocation split
by geography — and ruled D′: `public_equity` category + `basis` column.)*

- **Floor:** clears all three. ✓  **Reserved:** schema design is explicitly
  chain-eligible; product identity untouched. ✓
- **Two-phase replay:** this is the case the new protocol *strengthens*. The
  decisive move was evidence-gathering that refuted the child's premise. In
  the historical run that was the senior's initiative; under v1.0 it is
  **mandatory** — Phase 2's first instruction is to attack the
  couldn't-verify list, and "which basis were the split years published on?"
  sat squarely on it. The refutation happens by construction, not by luck.
- **Retro-telemetry:** outcome `premise-refuted`.
- **Reproduces: YES — and the winning move is now structural.**

## Case 3 — Harvard's undated allocation tables

*(Task 1.5; child leaned "curate the two dated years, gap the six undated";
Fable resolved empirically by reconciling each table against audited
financial statements, FY2021 dispositive.)*

- **Floor:** clears all three. ✓  **Reserved:** none. ✓
- **Two-phase replay:** the child's premise — "assigning undated tables would
  be a guess" — was itself the thing refuted: the senior found a
  *verification method*, validated it against both dated tables first. This
  is the evidence-diversity rule working before it was written down. Under
  v1.0, the brief's couldn't-verify list would have carried "which fiscal
  year each undated table describes", and Phase 2 directs the senior at
  exactly that item. The kernel also inherits the standing rule this case
  produced (undated disclosures assigned only on documented evidence).
- **Retro-telemetry:** outcome `premise-refuted`.
- **Reproduces: YES.**

## Case 4 — Negative allocation weights

*(Validator hardening; child recommended symmetric [-25, 125]; Fable ruled
asymmetric [-25, 100], added the mandatory `sourceLabel`, corrected the
child's Article-5 tagging to Article 4.)*

- **Floor:** clears all three. ✓  **Reserved:** tolerance thresholds
  explicitly chain-eligible. ✓
- **Two-phase replay:** the historical brief handed Fable the child's
  [-25, 125] up front — a textbook numeric anchor, and the senior *still*
  moved off it, which is the strongest evidence in the set that the tier gap
  is real. Under v1.0, Phase 1 asks the senior for bounds with no anchor
  present; on the historical reasoning ("no category exceeds ~45% in any
  year"), a blind Phase 1 plausibly lands at 100 directly. Outcome equal or
  reached earlier. The Article-tagging correction happens in Phase 2 by
  instruction ("correct errors worth correcting for the record").
- **Retro-telemetry:** outcome `modified`.
- **Reproduces: YES.**

---

## Cross-cutting checks

- **Storm brake:** max observed was two escalations in one task (1.5) — the
  ≥3 brake would not have fired on any historical task. Correctly calibrated
  against known-good behavior. ✓
- **Ratification rate over the golden set:** 1 of 4 ratified (25%) — inside
  the healthy band the telemetry section defines. ✓
- **Registers:** all four historical logs already carried full-fidelity
  reasoning; the ELI25-SE block adds structure for the human-facing side
  only. No divergence. ✓

## Improvements the replay surfaces (adjudicated: improvements, not bugs)

1. **The winning move is now mandatory.** In cases 2 and 3 the outcome hinged
   on the senior independently verifying premises. v1.0 makes
   attack-the-couldn't-verify-list a required Phase-2 step rather than senior
   initiative.
2. **Anchors removed at the moment of first judgment.** Case 4's numeric
   anchor ([-25, 125]) is exactly what Phase-1 blinding withholds.

## Residual risk (documented, not resolved)

Two-phase creates a new anchor: **the senior's own preliminary.** The Phase-2
instruction ("your preliminary stands unless something genuinely moves you")
deliberately biases against sycophantic capitulation, at the cost of a sticky
preliminary — if the junior's Phase-2 reasoning is genuinely better, a
self-anchored senior might under-update. None of the four golden cases would
have flipped on this (in all four, the final ruling was not the junior's
position, or was reached independently). Monitored via the `phase-delta`
telemetry field; if deltas are *always* zero across live runs, this risk is
live and the Phase-2 instruction needs rebalancing.

## Result

**Phase A acceptance: PASS.** Kernel 1.0.0-rc1 and the escalate skill
reproduce all four historical outcomes, strengthen two of them structurally,
fire at the right floor, route reserved matters identically, and carry one
named, instrumented residual risk.
