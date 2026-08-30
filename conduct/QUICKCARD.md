# Conduct — operator quick card

One page. The full manual is `MANUAL.html` (repo root). `TASKS.md` is always
the truth — if this card disagrees with it, the card is stale.

## Every session, in order

```
cd ~/Projects/dashboardProject && claude
/conduct                 # reads the ledger, claims the next task, runs
```

That's it. The conductor picks the work, routes it, verifies it, integrates it,
logs it, and republishes the status page. It stops at a gate, at a reserved
matter, or when the budget runs out.

## The six commands

| Command | What it does |
|---|---|
| `/conduct` | Run the next unblocked work |
| `/conduct plan` | Decompose only — show me the briefs, spend no worker tokens |
| `/conduct 1.7` | Do exactly that task, then stop |
| `npm run seed:dry` | Validate `data/` — **safe, use this while curating** |
| `npm run seed:verify` | Prove the validator still catches bad data (must be 30/30) |
| `npm run seed` | Validate **then write to Neon** — the only command that writes |

**Never type `npm run seed --dry-run`.** npm eats the flag; the script now
catches it and refuses, but the command you want is `npm run seed:dry`.

## Green means all five

```
npx tsc --noEmit        # silent
npm run lint            # silent
npm run build           # ✓ Compiled successfully
npm run seed:verify     # 30/30 validator checks passed
npm run seed:dry        # Validation passed (2 warning(s))
```

Those 2 warnings are **decided gaps, not defects**: `hedge_fund_index` and
`public_pe_index` are permanently empty because neither `absolute_return` nor
`private_equity_vc` has an honest ETF proxy, so the copycat shows those slices as
a labelled gap instead of backtesting them (task 1.7). A third warning means
someone changed `data/` — read it, don't silence it.

Read the counts line too (`5 school(s), 96 source(s), 349 allocation row(s),
128 endowment return row(s), 147 benchmark return row(s), 7 proxy mapping(s)`) —
a change there means someone edited `data/`. *Baseline re-derived 2026-08-29; the
previous one predated task 1.7 and had been stale since 2026-08-04.*

## Waiting on you right now

*Re-derived 2026-08-29. The three items previously listed here — Deployment
Protection, Checkpoint A, and three pending commits — were all closed by
2026-08-18 and had sat here as false urgency ever since. Keep this list true or
delete it; a stale "waiting on you" is worse than none, because it trains you to
skim the section that exists to be read.*

1. **An external uptime monitor pointed at `/api/health`.** The endpoint is live
   and returns `{ok, db, seeded, schools, latencyMs}`; nothing watches it, so a
   silent outage stays silent. Dashboard work, so it is yours.

Everything else that was reserved has been ruled: Deployment Protection
(2026-08-04), Checkpoint A (2026-08-04), the Yahoo Finance licensing deferral,
the typeface, the footer contact line (twice), Checkpoint B hosting (2026-08-18),
and the PRD's status and coverage wording (2026-08-29). Those are settled — do
not re-raise them without new evidence.

**`git push` remains yours by default.** Commits are local by design because
pushing is outward-facing and auto-deploys; run
`git rev-list --count origin/main..HEAD` for the live count rather than trusting
a number written here.

## When it breaks

| Symptom | Move |
|---|---|
| An agent dies (connection closed / stalled) | **Resume it, don't respawn it.** Its scratch dir and fragments survive; a fresh agent redoes the work. |
| Conductor died mid-task | Just run `/conduct` again. State lives in `TASKS.md` and `conduct/plans/`, not in the session. |
| A worker blew its budget | Once is fine (archival research runs ~1.6× estimates). Twice means the task is mis-scoped — re-decompose, never "try harder". |
| Validation fails after a merge | The fragments are still on disk. Fix and re-merge; `data/` was never half-written. |
| You want to know what was decided for you | `grep -n "\[PROXY DECISION\]" TASKS.md` — 8 hits, 5 are real rulings (the rest are the tag definition, a task line, a replay note). Also `\[JUDGMENT CALL\]`, `\[HITL\]`, `\[DISSENT\]`. |
| A session's instructions look thin | Its auto-loaded context can be a cached pre-adoption copy with no governance in it. Open every session with: *read `CONSTITUTION.md` and `.claude/skills/escalate/references/kernel.md` first*. |

## Never let a session do these

Money (incl. licensing a paywalled index — relevant to 1.7) · `git push --force`
or history rewrite · deleting branches, repos, or production data · making
anything public or publishing under the project's name · touching secrets ·
legal/disclaimer wording · **deciding what v1 means or which schools are in
scope** · editing the kernel or a constitution · anything marked `[H]` ·
`/conduct init` (it would overwrite `CONSTITUTION.md` and `TASKS.md`).

If a session asks you one of these, that's the system working. There is no
timeout that defaults past them.

## Three rules that keep the site honest

- **A gap stays a gap.** Every school is curated to its real disclosure limit.
  Never let a session fill one with a derived, interpolated, or
  wrong-universe number — that's the failure the whole validator exists to
  prevent.
- **Numbers can be right while the reasoning is wrong.** That was every defect
  the pilot's QC caught. When you read a build-log entry, read the *why*, not
  just the figure.
- **One reader decides the copy.** Someone will read the Translator page as "so
  I should buy this" however carefully it is written. Before you bless a new
  Translator or Compare sentence, read it as that person — if it can be read as
  a recommendation, send it back. `PERSONAS.md` names them, and the two other
  readers this site refuses to serve.

## Three commands that bite

- `npm run seed --dry-run` — npm eats the flag; this once did the destructive
  write. Use `seed:dry`.
- `npm run db:migrate` / `db:generate` — dead path, no committed migrations.
  `db:push` or hand DDL only.
- `npm run db:studio` — can edit rows, which Article 8 forbids outright.

Also: `npm audit fix --force` installs Next.js 9 and destroys the app. The 16
findings are build-time only and deliberately left alone.

## Next up

Task **1.7** — pick the ETF standing in for each asset class, and settle the
three deliberately-empty benchmark series (hedge funds, private equity, global
equity). This is the task that decides how much of the copycat comparison can
honestly be shown at all. Then Checkpoint A, then the app (Phases 2–6).
