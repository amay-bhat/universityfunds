# Routing rubric — properties, not quotas

The observed split (~20–30% Opus-grade, ~70–80% Sonnet-grade) is an
**outcome**, never a policy. Route each unit on its properties. When
properties conflict, route up — the cost of an up-misroute is tokens; the
cost of a down-misroute is confident mediocrity in the repo.

| Route **up** (Opus) | Route **down** (Sonnet) |
|---|---|
| First-of-its-kind work | **An exemplar exists in the repo** — the strongest single predictor |
| Design decisions with lasting consequences | Clear spec + machine-checkable acceptance |
| Cross-cutting changes; ambiguous spec | Local blast radius |
| Data-integrity or security surface | Mechanical transforms; migrations with a pattern |
| Novel algorithms; performance-critical paths | Scoped research with a defined output schema |
| Anything that edits the ledger, plan, briefs, or rails themselves | Nth-of-its-kind, rails already built |

## The manufactured 80%

The conductor's highest-leverage activity is spending Opus tokens on **rails**
— validators, templates, precedent decisions, documented mappings — that
convert the next N units into Sonnet work. Pilot-repo illustration of the
*mechanism* (not a verdict on any live unit): curating the first school was
Opus-grade (novel sourcing, four escalations); the *routine parts* of later
schools became Sonnet-shaped because the intervening work built a hardened
validator, documented label mappings, and precedent rulings for every known
fork. **Route every unit on its own properties anyway** — an Nth-of-kind unit
can still route up (example: a school whose likely deliverable is a documented
gap routes up, because an empty result passes every machine check silently and
the validator gives zero signal on it). When decomposing, always ask: *what
rail would make the rest of this routine?* Build that first, at Opus tier.

## Confident mediocrity — the misroute that doesn't fail loudly

An Opus-shaped unit given to Sonnet produces plausible work that *looks* done:
row counts right, checks green, quality quietly below the line. Defenses, in
order: (1) machine acceptance checks catch what they can; (2) the conductor
spot-checks a random slice of Sonnet output at full Opus depth — statistical
QC, not full re-review; (3) a failed sample re-routes the unit (and its
siblings, if systematic) up a tier and adds a note to this rubric.

## Routable units vs conductor lanes

This rubric routes **worker units** only. Two unit kinds are structurally
conductor-only and never routable: the **integration lane** (edits the ledger,
docs, and shared files; runs the only `--write`) and the **sampling lane**
(the check must sit a tier above the producer). Where a unit was itself
produced at the conductor's tier, its sample uses the kernel's fresh-context
same-tier refuter pattern with an adversarial stance, not a confirmatory read.

## Budget signals

- Budget blown once → worker reports why; conductor judges.
- Budget blown twice → the unit is mis-scoped. Re-decompose; never "try
  harder".
- A whole phase trending over budget → the routing or the rails are wrong;
  stop and reassess before spawning more workers.
