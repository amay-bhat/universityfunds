# Escalation templates — verbatim formats

Three templates: the two-phase senior brief (Phases 1 and 2), the human
interrupt block, and the log entry. Copy the structure exactly; the structure
is doing anti-anchoring work that instructions alone demonstrably don't.

---

## Phase 1 — the blind brief (first message to the senior)

The senior is a freshly-spawned agent one tier up with **no conversation
history**. This brief must stand alone, and it must NOT contain the junior's
recommendation, reasoning, or any hint of a preferred option. Options are
stated neutrally, in an order that does not signal preference (alphabetical or
chronological).

```
You are the SENIOR tier in a Conduct escalation. Read, in order:
.claude/skills/escalate/references/kernel.md, the project's CONSTITUTION.md
(if present), and every file listed under "Files this decision touches" below.
Verify the stated facts yourself where feasible — do not trust this brief's
premises.

RESERVED CHECK FIRST: if this question falls under kernel Part 2, say so and
stop — it belongs to the human, not to you.

THE QUESTION (one sentence):
<question>

SURROUNDING FACTS:
<what is true, with file/line citations. No opinions.>

VERIFIED by the junior: <list — each item with how it was verified>
COULD NOT VERIFY: <list — each item with why it matters>

FILES THIS DECISION TOUCHES: <paths>

THE OPTIONS (stated neutrally — no recommendation is included at this stage
by design):
(A) <option> — <mechanical description of what it entails>
(B) <option> — ...
(C) <option> — ...

YOUR TASK, PHASE 1: form your own view before you see the junior's. Return:
1. Your preliminary ruling and reasoning.
2. An article-by-article check of that ruling (kernel K1–K6 + project
   articles).
3. Which premises above you re-verified yourself, and what you found.
4. What evidence would change your mind.
Do NOT implement anything. A second message will follow.
```

## Phase 2 — the reveal (second message, same agent)

```
PHASE 2. Below is the junior tier's own answer to this question. It is the
view of a more junior model and is NOT a conclusion to ratify — your
preliminary ruling from Phase 1 stands unless something below genuinely moves
you.

JUNIOR'S RECOMMENDATION: <option + one-line why>
JUNIOR'S FULL REASONING: <including "what would have to be true for another
option to win">
JUNIOR'S ARTICLE SELF-CHECK: <as written>

YOUR TASK, PHASE 2:
1. Attack the COULD-NOT-VERIFY list first — premises before conclusions.
   Where a factual premise is load-bearing and checkable against primary
   sources, check it. Agreement between models never certifies a fact;
   documents do.
2. Reconcile with your Phase-1 ruling. State explicitly whether Phase 2
   changed your mind, and why or why not.
3. Issue the FINAL RULING: the decision, its reasoning, a fresh
   article-by-article check, your confidence, and what would justify
   revisiting.
4. If the junior's reasoning contains an error worth correcting for the
   record (wrong article cited, overstated premise), correct it explicitly —
   future sessions search this log for precedent.
Do NOT implement anything — the junior builds.
```

## The junior's Step-3 check (before executing)

The junior independently re-checks the final ruling against kernel + project
articles. Outcomes:

| Result | Action |
|---|---|
| Clears all articles | It is the human's answer. Execute, log, continue. |
| Breaks an article | Do NOT implement. Escalate to the next tier with both positions and the specific objection. At the top tier → human. |
| Both constitutional, tiers disagree | The senior's ruling governs. Record the dissent — a losing argument that turns out right is worth having on the record. |
| Senior errors / times out / tier unavailable | Next tier up; if none, human. |

## The human interrupt — ELI25-SE block

Register: assume a software engineer (FK, idempotency, migration, race
condition all land unexplained). Translate the *domain*. The "Rule in play"
line is mandatory because engineering framing can launder stakes — "should
this column be nullable?" reads as preference when the real question is "can
we publish a citation that doesn't contain the number?"

```
DECISION NEEDED — <one line, plain>
Blocks: <what work is stopped> · Reversible: <cheap | expensive, why>
Rule in play: <which article, and what breaks if we get this wrong>

<2–3 sentences of context, domain translated, no jargon>

A) <label> — what happens. Cost: … Risk: …
B) <label> — …

RECOMMEND <X> — <one sentence>
Verified: <what was actually checked> · Couldn't verify: <and why it matters>
If no answer: <see rule>
```

**The "if no answer" rule:** for reserved or constitutional interrupts the
line is always **"I stop here (unblocked work continues / nothing remains)"**.
Timeout defaults are legal only for courtesy asks below the floor.

## The log entry

Goes in the project's decision log (its build log, or `DECISIONS.md`),
tagged so it can be found in one pass:

```
**<date> — [PROXY DECISION] <topic>. Ruled by <senior tier>; implemented by
<junior tier>.**
- Question: …
- Options weighed: …
- Junior recommended: …  Senior's Phase-1 (blind) ruling: …
- Phase-2 reconciliation: <changed / unchanged, and why>
- FINAL RULING: …
- Article check: <both tiers, results>
- Implemented: …
- What would justify revisiting: …
- telemetry: tokens≈<n>k · wall-clock≈<n>m ·
  outcome: ratified | modified | overturned | premise-refuted | sent-to-HITL ·
  phase-delta: <did the reveal change the ruling? one line>
```

Below-floor decisions: one line, `[JUDGMENT CALL] <what was decided and why>`.
Recorded dissents: `[DISSENT]`. Human interrupts and their answers: `[HITL]`.

**Data-integrity questions (anything touching honesty of numbers, sourcing,
or coverage) get extra care:** the full reasoning goes in the log even when
approved; the ruling must name where any user-visible caveat will live; and
"leave the gap" must have been among the options.
