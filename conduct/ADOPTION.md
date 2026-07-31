# Adoption package — kernel v1.0.0

**Why this file exists.** Kernel Part 2 §5 reserves amending *or adopting* any
constitution to the human — including this kernel's own birth. Everything
below is therefore staged, not applied. One explicit human approval flips it
live; a builder session then applies these edits verbatim and logs the
adoption in the build log.

## What signing adopts

1. **Kernel v1.0.0** (`.claude/skills/escalate/references/kernel.md`) — the
   universal articles K1–K6, the reserved list, the tier table, the
   escalation floor. On signature the version stamp moves `1.0.0-rc1 → 1.0.0`
   and the `signed-by` / `signed-date` fields are filled.
2. **The v2 escalation procedure** (two-phase blind ruling, telemetry,
   storm brake) as defined in `.claude/skills/escalate/SKILL.md`, superseding
   `CONSTITUTION.md` Part 3 where they differ. This is an amendment to the
   project constitution and therefore needs the same signature.

## Edit 1 — `CONSTITUTION.md`, top of Part 3 (one line added, nothing removed)

```
> **Adopted <date>:** the escalation procedure is now versioned in
> `.claude/skills/escalate/` (two-phase blind ruling; kernel v1.0.0). Where
> that skill and the text below differ, the skill governs. The text below is
> retained as the historical v1 procedure.
```

## Edit 2 — `CLAUDE.md`, Workflow section (replace the escalation bullet)

Current text ends: *"Full procedure in `CONSTITUTION.md` Part 3; log every
proxied decision per Part 4."*

Replacement bullet:

```
- **Don't stop to ask a question — escalate it.** Reserved matters
  (kernel Part 2) go straight to the human. Everything else that clears the
  escalation floor runs through the `escalate` skill
  (`.claude/skills/escalate/` — two-phase blind ruling one tier up); log
  every proxied decision per CONSTITUTION.md Part 4. Work under a conductor
  routes spec questions to the conductor and rule questions to the chain.
```

## Edit 3 — `TASKS.md` header (ledger conventions, additive)

Appended to the "How to use this file" block:

```
**Ledger conventions (Conduct):** a session claims a task by adding
`claimed-by: <model/session> · <date>` to its line and removes the claim when
done or blocked (a claim with no build-log progress from a past date is stale
and reclaimable — note the reclaim). Multi-worker tasks get per-unit briefs
under `conduct/briefs/` with disjoint file ownership; shared-file changes
travel as fragments merged by the conductor. Tier and budget, when routed,
are recorded on the task line.
```

## Edit 4 — `CLAUDE.md`, Workflow section (parallel sessions — additive)

The build log records two sessions colliding on shared files; the workflow
assumes one session at a time and says so. New bullet:

```
- **Parallel work runs only under a conductor.** One task per session stands
  for solo sessions. Fan-out (multiple workers on one task) happens only via
  the `conduct` skill's fragment protocol: disjoint file ownership per brief,
  no worker writes inside `data/` or shared docs, one serialized integration
  lane. A session must never assume it is alone — check for active leases in
  `TASKS.md` and briefs under `conduct/briefs/` before touching shared files.
```

## What signing does NOT adopt

- No change to the project articles (CONSTITUTION.md Part 1) or reserved list
  (Part 2) — identical content, now with the kernel as a floor beneath them.
- No user-scope install (that is Phase F, gated on the pilot's kill criteria).
- No pilot launch (separately gated on your review of the three briefs).

## Signature

Approval is recorded by the human's explicit reply in-session; the applying
session then fills the kernel stamp and logs:

```
signed-by:   Amay Bhatnagar (explicit in-session approval, all four edits + kernel)
signed-date: 2026-07-30
```

**Applied 2026-07-30** by the Fable build session, same day, verbatim. The
kernel stamp is now `1.0.0 / ADOPTED`.
