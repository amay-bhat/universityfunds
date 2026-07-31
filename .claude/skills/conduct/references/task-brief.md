# Task brief — template

One brief per worker. The brief is the worker's entire world: it gets this,
the files pointed to, and nothing else — no conversation history, no vision
documents (the conductor has already translated those). A vague brief is a
conductor failure, caught at `conduct plan` time, before worker tokens burn.

```
BRIEF <ledger-task-id>.<unit> — <title>
tier: sonnet | opus        lease: <agent> · <timestamp> — or: unassigned (plan mode)
budget: <tokens / wall-clock cap>

OBJECTIVE
<What done looks like, in outcome terms. 2–5 sentences. Written against the
acceptance check, not against an implementation.>

YOU OWN (write access)
<explicit file list — disjoint from every sibling worker's list>

DO NOT TOUCH
<shared files and everything else. If your work needs a change to a shared
file, emit a FRAGMENT (see below) and the conductor integrates it.>

FRAGMENTS
<for each shared file this unit affects: the fragment file to write instead,
and its exact expected shape>

CONTEXT — read before starting
<ordered file list with one line each on why. Include the project rules that
bind this unit and the exemplar to imitate, if one exists.>

ACCEPTANCE CHECK — run these yourself before reporting done
<machine-checkable commands first (validators, tests, linters), then any
manual verifications with their expected outcomes. K1/K2 apply: the conductor
re-runs these outside you, and a claim that doesn't reproduce is a protocol
breach, not a misunderstanding.>

ESCALATION TRIAGE
- Question about THIS BRIEF (spec, scope, boundaries) → report back to the
  conductor; do not improvise around it.
- Question about A RULE or consequence (articles, data integrity) → use the
  escalate skill (.claude/skills/escalate/) from your own tier.
- Anything reserved (kernel Part 2) → stop; report to conductor for the
  human digest.

REPORT FORMAT
<what to return: outcomes vs. acceptance check, surprises for the build log,
budget spent, anything left undone and why (K6).>
<for any claim that something does NOT exist: the enumerated search that
establishes it — every document sought, found or not, how fetched, and what
each contains instead. Under K1 a negative claim without a trail is an
unverified claim, however well written.>
```

Notes for the conductor:

- **Boundaries are the collision defense.** Sibling workers' YOU-OWN lists
  must be provably disjoint; shared-file needs become fragments merged in the
  integration lane. If disjoint ownership is impossible, serialize the units
  or use worktrees.
- **The acceptance check is the contract.** If you can't write a checkable
  one, the unit isn't ready to route down — either build the rail that makes
  it checkable or route it up.
- **Context pointers, not context dumps.** Point at files; don't paste them.
  The worker reads what it needs; the brief stays short enough to audit.
