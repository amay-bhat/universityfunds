# Proposed amendments — for signature

**Status: PROPOSED. Nothing here is in effect.** `kernel.md:63-65` — *"A model may
propose an amendment in the log; only the human adopts it."* No file named below
has been touched: verified `git diff --stat HEAD -- CONSTITUTION.md .claude/skills/`
is empty.

**Baseline: `d8ff033`.** Every "current text" block below was read from the live
file today, not from the audit's `00a08ec` snapshot — two commits (task 1.7 and the
spec-schema pipeline) have landed since the audit, and three of these five targets
sit in files 1.7 edited.

**How to sign.** Reply with the option letters, e.g. *"adopt 1A, 2A, 3A
unconditional, 4B, 5C"*. Anything you don't name stays unadopted, which is the
correct default for a reserved matter — there is no timeout that defaults past one.
Two asks (**3** and **5**) have a "no amendment needed" option and I recommend it
for one of them.

| # | Finding | Recommendation | Blocks |
|---|---|---|---|
| 1 | `A-10` | **1A** — full replacement | A-10 only |
| 2 | `A-08` | **2A** — human interrupt | A-08 only |
| 3 | `B-10` | **3A** — adopt, unconditional wording | B-10, and `A-20` limb 3 |
| 4 | `A-06` | **4B** — keep strictly blind, bounded retry | A-06's reserved half only |
| 5 | `A-12` | **5C** — no amendment; propagate instead | A-12 only |

---

## 1 · Article 2 names a citation field the validator rejects (`A-10`)

**Reserved by:** kernel Part 2 §5 / `CONSTITUTION.md:45` §5 — amending Part 1.

### Current text — `CONSTITUTION.md:17`, verbatim

```
**Article 2 — No number without a citation.** Every figure in `data/` carries a `sourceId` resolving to `sources.json`. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from.
```

### Why it is false, verified today

- `endowment_returns` rows carry **two** per-figure columns, not one:
  `seed-validate.ts:897-907` errors on `returnPct` present without
  `returnSourceId`, **and** on `returnSourceId` present without `returnPct`.
- **227 of 723 curated figures (31.4%)** are cited this way — 102 `returnPct` +
  125 `marketValueUsdMillions`. (Counted today: 349 allocations + 102 + 125 + 147
  benchmark = 723. The audit's "706" predates 1.7's +17 benchmark rows.)
- **`proxy_mappings.sourceId` is OPTIONAL** — `seed-validate.ts:1061` uses
  `optionalString`. Live: 7 rows, **5 carry a source, 2 do not**
  (`absolute_return`, `private_equity_vc` — the decided gaps). **This refutes the
  sentence my own plan drafted**, which asserted `sourceId` on proxy mappings; it
  would have replaced today's false statement with a mirror-image one.
- A curator following Article 2 literally on a return row gets
  `3 validation error(s) — nothing was written`.

### 1A — full replacement (RECOMMENDED)

Replace line 17 in full with:

```
**Article 2 — No number without a citation.** Every figure in `data/` carries its own citation resolving to `sources.json`: one `sourceId` per allocation row and per benchmark-return row; on an endowment-return row, `returnSourceId` and `marketValueSourceId` — one per figure, because a single shared id forces one figure to cite a document that does not contain it. The rule runs both ways: a figure without its citation is an error, and a citation without its figure is an error. Rows that carry no figure need no figure-citation (`schools.json`; a `proxy_mappings.json` row may cite a source and should where one exists, but the ticker choice is this project's own editorial judgment, explained on the Methodology page rather than cited). The seed validator is the enforcement point; amending this Article to match a future change in citation shape is itself a Part 2 §5 act, not a code change. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from, a figure whose citation does not contain it, or a citation with no figure attached.
```

### 1B — minimal, identifier-free (clean fallback)

Replace only the false clause. Line 17 becomes:

```
**Article 2 — No number without a citation.** Every figure in `data/` carries its own citation resolving to `sources.json`, one citation field per figure; the seed validator holds the current field shape. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from.
```

### 1C — decline

Article 2 stays as written; the divergence is recorded as accepted debt. The
delegable residue proceeds either way (the `[PROPOSED AMENDMENT]` ledger entry,
and the `CLAUDE.md:32` / `data/README.md` shorthand corrections, neither reserved).

**Kill condition for my own preference:** 1B beats 1A if you hold that an Article
must never name implementation identifiers — because every identifier in a
constitution is a scheduled staleness bug, and `A-10` is the proof. I cannot
refute that; I prefer 1A only because its field list is paired with an explicit
re-amendment obligation. 1A also hard-codes no file path (that was a defect in the
first draft, removed here).

**Article check:** strengthens Articles 2, 4 and 5; touches no other Article; does
not loosen the kernel (kernel Part 5 — stricter wins). No user-visible surface
changes; no chart, number or column moves.

**Revisit if:** the citation shape changes again (a third per-figure column, or
proxy sources become mandatory — which would need `optionalString`→`requiredString`
at `seed-validate.ts:1061` and is its own decision, not a wording fix).

---

## 2 · The missing top-tier tie-break (`A-08`)

**Reserved by:** kernel Part 2 §5, and `ADOPTION.md:15-18` which declares
`.claude/skills/escalate/` constitutional text needing the same signature.

### Current text — `.claude/skills/escalate/references/brief.md:87-92`, verbatim

```
| Result | Action |
|---|---|
| Clears all articles | It is the human's answer. Execute, log, continue. |
| Breaks an article | Do NOT implement. Escalate to the next tier with both positions and the specific objection. At the top tier → human. |
| Both constitutional, tiers disagree | The senior's ruling governs. Record the dissent — a losing argument that turns out right is worth having on the record. |
| Senior errors / times out / tier unavailable | Next tier up; if none, human. |
```

### The gap

At the top tier there is no senior — the protocol substitutes a fresh-context
**same-tier refuter**. Row 3 says *"the senior's ruling governs"*, which is stated
in tier terms and draws its whole force from the tier hop. Remove the hop and
nothing orders the two instances. Verified: `grep -ci refuter CONSTITUTION.md` = 0
— the v1 procedure has no refuter actor at all, and closes with *"Fable is the
ceiling. There is no proxy above it."*

### 2A — the human interrupt (RECOMMENDED)

Insert as a new row immediately after the `Both constitutional, tiers disagree`
row (i.e. between current lines 91 and 92):

```
| Both constitutional, **top tier and its same-tier refuter** disagree | No tier hop exists to order them, so neither governs. Stop and put it to the human as an ELI25-SE interrupt with both positions stated at equal weight and neither labelled recommended. *If no answer: I stop here.* Log `[HITL]`. |
```

### 2B — the requester governs, with a mandatory dissent

Same position, this row instead:

```
| Both constitutional, **top tier and its same-tier refuter** disagree | The requester's position governs and execution proceeds. Log the refuter's position verbatim as `[DISSENT]` in the same entry, and count the entry against the ratification-rate metric as *unresolved*. |
```

**Why 2A:** the *Clears all articles* row says a clearing ruling **"is the human's
answer."** That fiction is what legitimises autonomous execution, and it rests on
an independent check having concluded. When the only check dissents, the fiction
has no support — so 2B would have a model overrule its own sole check and still
call the result the human's answer.

**Kill condition:** 2B wins if you judge that top-tier throughput matters more
than the fiction holding, and that a `[DISSENT]` log gives you enough to reverse
after the fact. That is a coherent position; it costs you the property that
"executed" implies "an independent check agreed."

**Article check:** 2A strengthens K5 (more logged) and K4 (treats the ambiguous
door as one-way). Neither option touches Articles 1-10. 2A slows the top tier by
design.

**Revisit if:** a real top-tier dissent occurs and 2A proves to interrupt you on
questions you did not want (the pilot has had zero such events; `TASKS.md` records
one top-tier ruling, `modified`, no dissent).

---

## 3 · Plain `git push` is in neither reserved list (`B-10`)

**Reserved by:** kernel Part 2 §5 (amending) — and the subject matter is Part 2 §2.

### Current text — two files

`.claude/skills/escalate/references/kernel.md:55-58`:

```
2. **Irreversible or outward-facing actions** — `git push --force`, history
   rewrites, deleting repos/branches/production data, making anything public,
   publishing under the project's name, sending email or messages to third
   parties, posting to external services.
```

`CONSTITUTION.md:42`:

```
2. **Irreversible or outward-facing actions.** `git push --force`, history rewrites, branch or repo deletion, dropping or truncating production data, making the repo public, publishing anything under the project's name, sending email, posting to third-party services.
```

### The crux you asked me to settle

**"Stricter rule wins" makes the prohibition binding. It cannot make the push
reserved — and those are different things.** `kernel.md:124` is a *conflict*
tiebreak, and nothing here conflicts: both reserved lists are **silent**, and
silence is not a competing permission. The operator docs' rule sits at precedence
tier 5 (*"everything else in the project's docs"*), below the reserved list. So a
plain push to `main` — which auto-deploys to production — is today prohibited by
convention and reserved by nothing.

**This reverses my own earlier recommendation** ("leave it standing and amend
later"). I had conflated prohibited with reserved.

### 3A — adopt (RECOMMENDED). One drafting choice is yours.

**Unconditional** (recommended — `kernel.md:124` prefers the stricter reading):

- In `kernel.md:55-58`, insert after `history rewrites,`:
  ```
  any push to a branch that publishes or deploys (for this project, any push to `main`),
  ```
- In `CONSTITUTION.md:42`, insert after `history rewrites,`:
  ```
  any push to `main` (it auto-deploys to production via Vercel),
  ```

**Conditional** — say *"3A conditional"* and both inserts become
`any push to a branch that auto-deploys,` with no project-specific clause. This
goes dormant if you rewire deployment; unconditional does not.

### 3B — decline, leave the convention standing

No amendment. **Do not take `B-10`'s other option** (state plainly in `MANUAL.html`
that no rule covers a push) — that would tell every future session nothing bars an
auto-deploying push, which is strictly worse than silence.

**Consequence for `A-20`:** its limb 3 rewrites `STATUS.html`'s lede to name *"a
push that deploys"* as one of three reserved items. Under **3A** that becomes true
and limb 3 proceeds. Under **3B** it asserts a reservation no authority records —
so limb 3 is dropped and the lede simply records the signature as done.

**Article check:** adds to Part 2 §2 in both files, kept in sync; loosens nothing.
Note the recursion honestly: adopting this makes explicit a restriction I have been
observing anyway — I have not pushed, and will not.

**Revisit if:** deployment moves off push-to-main, or you want a narrower rule
(e.g. tags only).

---

## 4 · The Phase-2 reveal fallback (`A-06`)

**Reserved by:** kernel Part 2 §5 via `ADOPTION.md:15-18`. **Only the fallback is
reserved** — naming the tool is descriptive and proceeds under 1.8.S regardless.

### Current text — `.claude/skills/escalate/SKILL.md:56-61`, verbatim

```
When the senior returns its preliminary ruling, send the **Phase-2 reveal**
(SendMessage to the same agent): your recommendation and full reasoning,
explicitly labelled as not-a-conclusion. The senior attacks your
couldn't-verify list first — facts are certified by documents, never by
agreement between models — then reconciles and issues the final ruling,
stating whether the reveal changed its mind.
```

### The premise is narrower than `A-06` states

`SendMessage` does **not** require a live agent — a name keeps working after an
agent completes, resuming it from its transcript. So the ordinary case (senior
finishes Phase 1 and exits) is exactly what the tool handles. The real failure mode
is **name collision**, which is preventable by recording the raw agent id at spawn.
Reveal-delivery failure is therefore rare and largely preventable, not routine.

### 4A — adopt `A-06`'s fallback

Re-spawn with the Phase-1 transcript attached and log phase-delta as unmeasurable.

### 4B — keep it strictly blind, with a bounded retry (RECOMMENDED)

Insert after line 61, as its own paragraph (lines 56-61 and 63 untouched):

```
**If the reveal cannot be delivered.** Record the senior's raw agent id at spawn so
the reveal can address it directly. If delivery still fails, retry twice. If it
fails three times, the ruling is **void** — discard the Phase-1 preliminary,
re-run the whole two-phase sequence with a fresh senior, and log the void with its
cause. Never deliver Phase 1's material and the reveal to the same context in one
pass, and never log a ruling whose phase-delta was not observed: the blinding is
the mechanism, and an unobserved phase-delta cannot support the ratification-rate
metric that tells you whether the check is real.
```

**Why 4B:** a rare, preventable failure does not justify standing authorization to
unblind. `phase-delta` is the health metric that distinguishes a real check from a
decorative one; a fallback that logs it as unmeasurable makes the metric optional
exactly when it would be most informative.

**Kill condition:** 4A wins if reveal failure turns out to be *common* rather than
rare — then 4B's void-and-restart is a token tax on every ruling. Watch the first
three rulings; if any needs a retry, revisit.

**Article check:** 4B strengthens K1 and K5 and preserves the blinding you signed.
4A knowingly relaxes both. Neither touches Articles 1-10.

---

## 5 · Where the gates-are-not-escalatable rule lives (`A-12`)

**Reserved by:** kernel Part 2 §5 — both of `A-12`'s stated fix targets (kernel
Part 4, `escalate/SKILL.md` Step 0) are constitutional text.

### `A-12`'s premise is substantially false — verified

It claims the rule is *"absent from every file a session is told to read first."*
It is stated in **five** places, and the first of them is first in the reading order:

| Where | Force |
|---|---|
| **`CLAUDE.md:20`** | normative, complete — *"Checkpoints are **not** escalatable — they are human review gates, not questions, so the escalation procedure doesn't route around them."* **`CLAUDE.md` is the session entry point.** |
| `.claude/skills/conduct/SKILL.md:38` | normative — *"gates are review points, not questions, and are never escalatable"* |
| `MANUAL.html:250` | operator-facing |
| `TASKS.md:132` | *"Checkpoints stay human. They're review gates, not questions, so escalation doesn't route around them."* |
| `CONDUCT-DESIGN.html:510` | rationale |

The audit's own body is more honest than the digest built on it. The real gap is
narrow: **a session that reads only `kernel.md` and `escalate/SKILL.md` cannot
learn the rule** — which is a live case, because those two are what the `escalate`
skill tells you to read.

### 5C — no amendment; propagate through non-constitutional files (RECOMMENDED)

Two edits, **neither reserved**, both revertible:

- **`conduct/QUICKCARD.md`** — add to the reserved/gates section:
  ```
  A gate is not a question. Checkpoints stop the line for human review; the escalation chain never routes around one, and a gate is never escalatable.
  ```
That is the whole of 5C. The `escalate/SKILL.md` route **is** reserved text, so it
is offered separately as **5B** below and is not bundled into 5C — 5C contains no
reserved edit at all, which is the point of it. You may adopt **5C and 5B
together** if you want both the operator-doc fix and the kernel-reader fix.

### 5A — adopt into kernel Part 4

Append to kernel Part 4, after the *"Everything below the floor"* line:

```
> A project gate (a checkpoint, a review point) is **not a question** and never
> enters this floor. Gates stop the line for the human; the chain does not route
> around one.
```

### 5B — adopt into `escalate/SKILL.md` Step 0 as a third gate

Add after Step 0's floor item:

```
3. **Gate?** If a project checkpoint or review gate stands between you and the
   work, stop there. A gate is not a question — it does not enter the chain and is
   never escalatable, regardless of how the floor scores.
```

**Why 5C:** the rule already exists normatively in the file every session reads
first. Adopting 5A or 5B buys reaching the narrow "kernel-only reader" case at the
cost of a Part 1/constitutional amendment. 5C closes the operator-doc gap for free
and leaves the amendment available at any later date for one word.

**Recommendation on status: demote Ask 5 from blocking to a courtesy ask.** It
carries *"If no answer: I stop here"* today, which overstates it — nothing in task
1.8 depends on this answer, and the rule is not actually missing.

**Kill condition:** 5A wins if you judge the kernel must be self-sufficient — a
defensible principle, since the kernel is explicitly the portable
domain-free core and Phase F promotes it to user scope on every machine, where
`CLAUDE.md` will not travel with it. **If you intend that promotion, adopt 5A.**

**Article check:** 5C touches no Article and no kernel text. 5A/5B add a
restriction, loosening nothing.

---

## What proceeds regardless of your answers

- **33 of the 37 A-orders**, every B-id, the whole WP4/WP5/WP6 chain, and the
  integration lane. Only `A-06`, `A-08`, `A-10`, `A-12` block, each on its own ask.
- Every **delegable half**: the `[PROPOSED AMENDMENT]` ledger entry, the tool-naming
  half of `A-06`, the `QUICKCARD.md` propagation, and the `CLAUDE.md`/`data/README.md`
  shorthand corrections.
- Nothing here is a data, chart or schema change. No figure moves.
