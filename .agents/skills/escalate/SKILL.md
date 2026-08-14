---
name: escalate
description: Run a judgment call through the Conduct escalation chain — junior answers first, senior one tier up rules via two-phase blind protocol, junior verifies and executes. Use when a fork in autonomous work clears the escalation floor, or when the user says "escalate this".
---

# escalate — the Conduct chain

You have hit a fork in autonomous work, or the user asked for a ruling on
record. This skill runs the question through the escalation chain defined by
the Conduct kernel. Read `references/kernel.md` now if you haven't this
session — the reserved list and the floor live there, and both are checked
**before** anything else in this file applies.

The chain: **Sonnet → Opus → Fable → human.** One hop per question. You cannot
change your own model; escalation is a **subagent spawned one tier up** (per
the kernel's tier table, resolved from your declared model *now*, at
escalation time). Never use a fork/inherited-model agent for this — it cannot
escalate a tier. This skill is standing authorization to spawn that agent.

## Step 0 — Two gates, in order

1. **Reserved?** If the question falls under kernel Part 2 → stop. It goes to
   the human in the ELI25-SE format (`references/brief.md`), with
   *"If no answer: I stop here."* No tier may rule on it, including you.
2. **Floor.** Escalate iff ≥2 of: materially different work / expensive to
   unwind / touches an article. Below the floor → decide it yourself, log one
   line as `[JUDGMENT CALL]`, continue. Half the value of this protocol is
   the escalations that never happen.

## Step 1 — Answer it yourself first

Write out, before spawning anything:

- the question, in one sentence;
- 2–4 real options (no strawmen);
- your recommendation and reasoning, **including what you'd have to believe
  for a different option to win** — the kill condition for your own
  preference;
- an article-by-article check of your recommendation (kernel K1–K6 + project
  articles);
- **Verified** (each item: how) and **Couldn't verify** (each item: why it
  matters) lists;
- what you'd do if the answer never came.

If this exercise resolves the question, you're done — log it, proceed. Half
of escalations die here, which is the point.

## Step 2 — Two-phase blind ruling

Spawn the senior per the tier table with the **Phase-1 blind brief** from
`references/brief.md`: question, facts with citations, verified/couldn't-verify
lists, options stated neutrally. **Your recommendation is withheld — by
design.** Judges anchor on provided hints, stronger models anchor more, and
"please be independent" measurably doesn't work; sequencing does.

When the senior returns its preliminary ruling, send the **Phase-2 reveal**
(SendMessage to the same agent): your recommendation and full reasoning,
explicitly labelled as not-a-conclusion. The senior attacks your
couldn't-verify list first — facts are certified by documents, never by
agreement between models — then reconciles and issues the final ruling,
stating whether the reveal changed its mind.

**If the reveal cannot be delivered.** Record the ruling agent's raw id at spawn
so the reveal can address it directly; a name resumes a completed agent from its
transcript, so the ordinary case — Phase 1 finished and the agent exited — is not
a failure. If delivery still fails, retry twice. If it fails three times, **stop
and put the question to the human**, attaching the Phase-1 preliminary and your
withheld recommendation, both labelled as not-a-conclusion. Log it with
`outcome: sent-to-HITL` and record that phase-delta was not observed. Do not
re-run the protocol on the same question, and never deliver Phase-1 material and
the reveal into one context: you have already read the preliminary, so any brief
you write afterwards is no longer blind, and a second run would launder that
contamination rather than remove it.

The senior decides; you build. It must not implement.

**If you are the top tier (Fable):** there is no senior. Substitute a
fresh-context same-tier refuter — same two-phase shape, Phase-2 stance
"try to refute this" — which kills context-contamination even though it
cannot kill family bias; that is what the evidence rules are for. Reserved or
article-breaking at top tier → human, always.

## Step 3 — Check the ruling, then execute

Independently re-check the final ruling against all articles — your check is
what protects the human; the senior's self-check does not substitute for it.
Outcomes table in `references/brief.md`: clears → execute and log; breaks an
article → refuse and escalate again with both positions; constitutional
disagreement → senior governs, dissent logged; top tier deadlocked with its
own refuter → human, both positions at equal weight; senior fails → next tier
or human.

## Step 4 — Stay productive while waiting

Work on everything that doesn't depend on the answer, without baking in
assumptions expensive to unwind. If unblocked work runs out, wait. Guessing
to stay busy is worse than idling.

## The storm brake

Third escalation inside one task → the task spec is the problem. The next
interrupt goes to the human as a **scope** question in ELI25-SE format, not
into the chain a fourth time.

## Triage note (when running under a conductor)

Two different "up"s — do not conflate them:
- Question about *this task's spec or scope* → the **conductor** amends the
  brief or the ledger. Not this skill.
- Question about *a rule or consequence* → this skill.

## Logging — not optional (K5)

Every ruling → `[PROXY DECISION]` entry per the format in
`references/brief.md`, including telemetry (tokens, wall-clock, outcome enum,
phase-delta). The system's health metric is the **ratification rate** across
these entries: near 100% means the check is decorative; the pilot baseline is
~25%. Data-integrity questions additionally log full reasoning and the named
location of any user-visible caveat.
