# CONSTITUTION.md — University Endowment Investing Explorer

This file governs **how decisions get made** when the human isn't in the room. `PRD.md` says what to build; `TASKS.md` says what's next; this says who decides and when to stop.

The point is to spend the human's attention on constitutional violations rather than on judgment calls. A session that has a question does not stop and wait. It answers the question itself, escalates one model tier for an independent second answer, and proceeds if that answer is constitutional. The human is interrupted only when the right answer would break a rule in Part 1, or when the decision is one of the reserved kinds in Part 2.

**Read this file before starting any task.** It is listed first in `CLAUDE.md` for that reason.

---

## Part 1 — Articles

These are the test. An escalated answer is usable if and only if it violates none of them. Cite them by number when logging a decision (e.g. "clears Articles 1–10").

**Article 1 — No advice, no personalization.** Never produce copy that tells a user what to do with their money. Describe what endowments did and what the mechanics are; never recommend, never tailor to an individual's situation. *Broken by:* "you should", "we recommend", risk-tolerance questionnaires, anything that reads as a suggestion to buy or sell.

**Article 2 — No number without a citation.** Every figure in `data/` carries a `sourceId` resolving to `sources.json`. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from.

**Article 3 — Plain English.** Define every finance term on first use. *Broken by:* unexplained jargon in user-facing copy (basis points, alpha, vintage year, absolute return).

**Article 4 — Honest numbers, including honest gaps.** Report figures even when unflattering to endowments. Never present data from two different measurement bases as one continuous series without a visible caveat at the point of display. *Broken by:* a chart that silently splices a derived series onto a reported one; quietly dropping a bad year; a fine-print-only disclosure of something that changes how a chart should be read.

**Article 5 — Never invent data to close a gap.** If a figure can't be sourced, the gap stays, gets documented, and the UI says so. A short honest series beats a complete-looking invented one. *Broken by:* interpolating missing years, carrying a prior year forward silently, estimating from a peer school.

**Article 6 — Read the dataviz skill before writing chart code.** Applies to any chart, table-with-bars, stat tile, or color choice.

**Article 7 — Financial math is tested.** The backtest engine and anything computing returns, growth, or annualized figures needs unit tests with hand-computed expected values. *Broken by:* shipping a return calculation whose expected values were produced by the same code under test.

**Article 8 — Seed files are the source of truth.** Data changes are edits to `data/` followed by `npm run seed`. Never write to Neon directly. Never hand-edit a generated artifact and call it curation.

**Article 9 — The docs are the memory.** Finished tasks get checked off; decisions and surprises go in the `TASKS.md` build log. A session that leaves the docs untrue has failed regardless of what code it wrote.

**Article 10 — Deliver the scope as written.** Don't silently narrow, widen, or transform a task. If the task can't be delivered as specified, deliver everything that can be, and state plainly in the build log what was left out and why.

---

## Part 2 — Reserved for the human

No model at any tier may approve these, no matter how sound the reasoning. Stop and ask.

1. **Money and accounts.** Spending, plan changes, paid data subscriptions, anything touching billing.
2. **Irreversible or outward-facing actions.** `git push --force`, history rewrites, branch or repo deletion, dropping or truncating production data, making the repo public, publishing anything under the project's name, sending email, posting to third-party services.
3. **Secrets.** Rotating, moving, or committing credentials; changing what lives in `.env.local` vs the Vercel dashboard.
4. **Legal and compliance posture.** How the not-financial-advice framing is worded at the site level, terms of use, data licensing and redistribution rights for anything scraped or archived.
5. **Amending this constitution.** Including adding to, softening, or reinterpreting Part 1 or Part 2. A model may *propose* an amendment in the build log; only the human adopts it.
6. **Product identity.** Which schools are in scope, what the three features are, what v1 means, the name, the visual identity.
7. **Vercel dashboard settings**, including Deployment Protection — tasks marked `[H]` remain the human's.

Everything else is fair game for the escalation procedure below, including data-methodology calls, schema design, tolerance thresholds, library choices, copy drafting, and how to handle a sourcing gap.

---

## Part 3 — The escalation procedure

### Step 0 — Is this actually a question?

Escalate only when **different readings would lead to materially different work** and the choice would be expensive to unwind. Everything else: decide it yourself, note it in the build log, keep moving. A protocol that fires on every small choice is slower and costlier than just asking, which defeats the purpose.

Do not escalate to avoid work, to get permission for something already obvious from the docs, or to settle a preference with no downstream consequence.

### Step 1 — Answer it yourself first

Before escalating, write out:

- the question, in one sentence;
- 2–4 real options (no strawmen);
- your recommendation;
- your reasoning, including what you'd have to believe for a different option to win;
- an Article-by-Article check of your recommendation;
- what you'd do if the answer never came.

If this exercise resolves the question, you're done — log it and proceed. Half of escalations die here, which is the point.

### Step 2 — Escalate one tier

The chain is **Haiku → Sonnet → Opus → Fable → human**. One hop per question.

You cannot change your own model — `/model` belongs to the human. Escalation is a **subagent spawn one tier up**, and this constitution is the standing authorization to make it (it is the exception to the usual "don't spawn agents unless asked"):

```
Agent(
  model: "<one tier up>",          // "opus" from a Sonnet session, "fable" from Opus
  description: "escalation: <topic>",
  prompt: <the brief below>
)
```

Do **not** use `subagent_type: "fork"` for this — a fork always runs on your own model, so it cannot escalate a tier.

The parent starts with **no conversation history**, so the brief must stand alone. It must:

1. Tell it to read `CONSTITUTION.md`, `PRD.md`, `TASKS.md`, and any file the decision touches.
2. State the question and the surrounding facts, including what you already verified and what you couldn't.
3. Include your own options, recommendation, and reasoning from Step 1 — labelled as the child's view, explicitly not as a conclusion to ratify.
4. Instruct it to reason independently and to say so if it thinks the framing itself is wrong.
5. Require it to return: its own options, its recommendation, its reasoning, an Article-by-Article check, its confidence, and what evidence would change its mind.
6. Tell it not to implement anything — it decides, the child builds.

### Step 3 — Check the answer against Part 1

The child checks the parent's recommendation independently; the parent's own self-check does not substitute for it. Two checks, because this is the step that protects the human.

- **Clears all Articles** → it is the HITL answer. Implement it, log it, continue.
- **Breaks an Article** → do not implement. Escalate to the next tier up with both prior answers and your specific objection. If that tier is Fable and its answer also breaks an Article, stop and ask the human.
- **Parent and child disagree but both answers are constitutional** → the parent's recommendation governs. Record the disagreement in the log; a losing argument that turns out to be right is worth having on the record.
- **Parent errors, times out, or the tier is unavailable** → escalate to the next tier. If none is left, ask the human.

Fable is the ceiling. There is no proxy above it.

### Step 4 — Stay productive while waiting

Keep working on everything that doesn't depend on the answer. Two limits:

- Don't bake in an assumption that would be expensive to unwind if the answer goes the other way.
- If the unblocked work runs out, wait. Guessing to stay busy is worse than idling.

### Step 5 — Special care on data-integrity questions

Articles 2, 4, and 5 are where a model proxy is weakest, because the tempting answer — fill the gap, ship the complete-looking chart — is the one that quietly breaks them. On any question touching sourcing, derivation, or coverage:

- the full reasoning goes in the build log even when the answer is approved, not just the conclusion;
- the answer must name where the caveat will be visible to the user, not merely that one exists;
- "leave the gap" must be one of the options considered.

---

## Part 4 — Logging

Every proxied decision goes in the `TASKS.md` build log under the task it belongs to. Without this the human loses the ability to audit and reverse decisions made on their behalf, which would make the whole protocol a downgrade. Record:

- the question;
- the options considered;
- the child's recommendation and the parent's recommendation, and which tier answered;
- the Article check result;
- what was implemented;
- what would justify revisiting it.

Mark these entries **`[PROXY DECISION]`** so they can be found in one pass. Decisions made under Step 0 without escalation are marked **`[JUDGMENT CALL]`** and can be recorded in a sentence.

---

## Part 5 — Quick reference

| Situation | Action |
|---|---|
| Small choice, cheap to reverse | Decide, log as `[JUDGMENT CALL]`, continue |
| Real fork in the road | Answer it yourself → escalate one tier → check → implement |
| Parent's answer is constitutional | Treat as the human's answer |
| Parent's answer breaks an Article | Escalate again; at Fable, ask the human |
| Anything in Part 2 | Ask the human, regardless of model consensus |
| Fable says no and you disagree | Ask the human |
| Blocked with nothing else to do | Wait; don't guess |

Model chain: **Haiku → Sonnet → Opus → Fable → human.**
