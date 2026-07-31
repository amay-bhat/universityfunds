# Repository structure — reference snapshot

**University Endowment Investing Explorer** · governed by the Conduct framework

| | |
|---|---|
| Snapshot taken | 31 July 2026 |
| At commit | `722e0c6` — "Add operator manual and quick card" |
| Tracked files | 73 (nothing untracked) |
| Unpushed commits | 4 |
| Root | `/Users/amayb/Projects/dashboardProject/` |

This is a **snapshot**, not a live view. If it disagrees with the repo, the repo
is right — regenerate by re-running the commands in the last section.

---

## Read in this order if you are new (or a fresh session)

1. `CONSTITUTION.md` — the Articles, the reserved powers, how decisions get made
2. `.claude/skills/escalate/references/kernel.md` — the signed kernel these sit on
3. `PRD.md` — what we are building
4. `TASKS.md` — the ledger: what is done, what is next, and every decision ever made
5. `MANUAL.html` — how to actually drive it (or `conduct/QUICKCARD.md` for one page)
6. `data/README.md` — the data methodology, before touching any figure

---

## Full tree

```
/Users/amayb/Projects/dashboardProject/
│
├── CLAUDE.md                        session entry point: reading order, workflow, stack
├── CONSTITUTION.md                  Articles 1–10, reserved powers, historical v1 procedure
├── PRD.md                           what we're building (deliberately unamended — see note)
├── TASKS.md                         ★ THE LEDGER — tasks, leases, build log, all decisions
├── plan.html                        original planning narrative (historical context only)
├── README.md                        untouched scaffold — known debt, owned by nobody
├── SESSION_PROMPTS.md               early planning transcript
│
│   ─── Documents (each an artifact; all rendered FROM the ledger, never beside it)
├── MANUAL.html                      ★ operator manual — procedure
├── STATUS.html                      ★ live build status — state
├── CONDUCT-DESIGN.html              ★ framework design doc — rationale
├── STRUCTURE.md                     ★ this file
│
│   ─── The framework: executable rules
├── .claude/
│   └── skills/
│       ├── conduct/
│       │   ├── SKILL.md             ★ conductor loop; modes: run · plan · <task> · until · init
│       │   └── references/
│       │       ├── routing.md       ★ tier routing rubric (properties, never quotas)
│       │       └── task-brief.md    ★ worker brief template
│       └── escalate/
│           ├── SKILL.md             ★ two-phase blind escalation protocol
│           └── references/
│               ├── kernel.md        ★ KERNEL v1.0.0 (signed 30 Jul 2026) — K1–K6,
│               │                      reserved list, tier table, escalation floor
│               └── brief.md         ★ Phase-1 / Phase-2 / HITL / log templates
│
│   ─── The framework: audit trail
├── conduct/
│   ├── ADOPTION.md                  ★ the four staged edits + signature record
│   ├── GOLDEN-REPLAY.md             ★ Phase-A acceptance: 4 historical rulings replayed, 4/4
│   ├── QUICKCARD.md                 ★ one-page operator card
│   ├── plans/
│   │   └── 1.6-plan.md              ★ pilot plan + live per-unit state machine
│   ├── briefs/
│   │   └── 1.6/
│   │       ├── COMMON.md            ★ shared block: precedents, tooling, tripwires, triage
│   │       ├── stanford.md          ★ worker brief
│   │       ├── mit.md               ★ worker brief
│   │       ├── princeton.md         ★ worker brief
│   │       └── harvard-returns.md   ★ worker brief (the 1.5 tail fold-in)
│   └── fragments/
│       └── 1.6/                     ★ 15 worker outputs — merged; cleanup undecided (debt)
│           ├── stanford-school.json          stanford-sources.json
│           ├── stanford-readme-section.md    stanford-buildlog.md
│           ├── mit-school.json               mit-sources.json
│           ├── mit-readme-section.md         mit-buildlog.md
│           ├── princeton-school.json         princeton-sources.json
│           ├── princeton-readme-section.md   princeton-buildlog.md
│           ├── harvard-returns-rows.json     harvard-returns-sources.json
│           └── harvard-returns-buildlog.md
│
│   ─── The data layer: source of truth for every figure
├── data/
│   ├── README.md                    the data methodology spec (~73 KB; split is overdue)
│   ├── schools.json                 the 5 schools, non-financial metadata
│   ├── sources.json                 95 citations
│   ├── benchmark_returns.json       130 rows — 5 of 8 series (3 await task 1.7)
│   ├── proxy_mappings.json          empty → task 1.7
│   └── schools/
│       ├── yale.json                126 allocations + 26 returns
│       ├── harvard.json              77 allocations + 26 returns
│       ├── mit.json                 ★ 42 allocations + 26 returns  (18 Pool A rows)
│       ├── princeton.json           ★ 104 allocations + 24 returns
│       └── stanford.json            ★  0 allocations + 26 market values (documented gap)
│
│   ─── The guard rails
├── scripts/
│   ├── seed.ts                      args + atomic batched write; --write is opt-in
│   ├── lib/
│   │   └── seed-validate.ts         ★ THE VALIDATOR — sole enforcement point for data rules
│   └── verify-seed-validator.ts     ★ 30-case regression suite proving the validator works
│
│   ─── The app (Phases 2–6 unstarted: 2 routes exist)
├── src/
│   ├── app/
│   │   ├── layout.tsx               scaffold metadata still (task 6.3)
│   │   ├── page.tsx                 scaffold starter page (task 2.1 replaces)
│   │   ├── globals.css
│   │   └── favicon.ico              scaffold (task 6.3)
│   └── lib/
│       ├── constants.ts             8 categories · 8 series · bases · school ids
│       └── db/
│           ├── index.ts             Neon HTTP driver
│           └── schema.ts            ★ 6 tables; per-figure citation columns
│
├── public/                          file · globe · next · vercel · window .svg
│                                      (5 scaffold SVGs, unreferenced — known debt)
│
│   ─── Config
├── package.json                     scripts: dev · build · lint · db:* · seed · seed:dry · seed:verify
├── package-lock.json
├── tsconfig.json                    includes **/*.ts — so scripts/ errors break the deploy
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── drizzle.config.ts
├── .gitignore
│
└── ─── Present locally, gitignored (never committed)
    ├── .env.local                   Neon connection string
    ├── .vercel/                     project link
    ├── .next/                       build output
    └── node_modules/
```

★ = built or substantially rewritten in the framework/pilot work of 30–31 July 2026.

---

## Three groupings

| Group | Paths | Files | What it is |
|---|---|---|---|
| **Framework** | `.claude/skills/` + `conduct/` | 30 | The executable rules (6), plus the audit trail of every decision made under them (24) |
| **Data layer** | `data/` + `scripts/` | 13 | The figures, and the validator guarding them |
| **App** | `src/` + `public/` + config | 19 | Next.js app — 2 routes so far; Phases 2–6 build the rest |

## The four documents, and why they don't overlap

| File | Answers | Regenerate when |
|---|---|---|
| `MANUAL.html` | *How do I run this?* | Procedure changes |
| `STATUS.html` | *Where are we?* | Every integration |
| `CONDUCT-DESIGN.html` | *Why is it built this way?* | Framework changes |
| `STRUCTURE.md` | *Where is everything?* | Files are added or moved |

All four are **renderings**. `TASKS.md` is the source of truth; if a document
disagrees with it, the document is stale.

---

## Structural notes worth carrying

- **`PRD.md` is deliberately out of date.** It promises FY2000–FY2025 coverage for
  all five schools; no school discloses that much. That disagreement *is* the
  Checkpoint A question, which is reserved to the human — so editing the file to
  match reality would itself be a violation.
- **`conduct/fragments/1.6/` should arguably be gone.** The conductor skill says
  fragments are deleted after a merge lands. These 15 were kept, and they contain
  duplicate copies of curated school JSON — an ambiguity about which copy wins.
  Decide deliberately: delete them, or amend the skill to say they're archived.
- **`data/README.md` at ~73 KB is over its own split threshold.** The plan
  scheduled a split into `data/mappings/<school>.md` after task 1.6; it is overdue,
  and every curation session is told to read this file in full.
- **`README.md` at the root is untouched scaffold** and points at `app/page.tsx`.
  The real path is `src/app/page.tsx` — and if anyone ever created a root `app/`,
  it would silently shadow the entire `src/app/` tree.
- **`tsconfig.json` includes `**/*.ts`**, so a type error anywhere — including in
  `scripts/` or a future test file — fails the Vercel deploy, not just the local build.

---

## Regenerate this snapshot

```bash
cd ~/Projects/dashboardProject
git ls-files                                    # every tracked file
git status --porcelain --untracked-files=all     # anything untracked
find conduct .claude data scripts src -type f | sort
git rev-parse --short HEAD
git rev-list --count origin/main..HEAD           # unpushed
npm run seed:dry                                 # live row counts
```

### Re-rendering the PDF

`STRUCTURE.txt` is an ASCII rendering of this file (the PDF renderer's Courier
font has no box-drawing glyphs, so U+251C/2502/2514/2500 become plain
`+ | \ -` — named by codepoint here so the converter can't rewrite this very
sentence, which it did once), and
`STRUCTURE.pdf` is rendered from the text. Landscape is deliberate: the tree's
annotation column pushes lines past the ~92 characters that fit in portrait, and
13 lines were silently clipped before the switch.

```bash
cupsfilter -o landscape -o cpi=12 -o lpi=7 \
  -o page-left=30 -o page-right=30 -o page-top=30 -o page-bottom=30 \
  STRUCTURE.txt > STRUCTURE.pdf
```

Verify nothing clipped — every non-blank source line must appear intact:

```bash
python3 -c "
from pdfminer.high_level import extract_text
pdf = extract_text('STRUCTURE.pdf').replace(chr(12),'')
src = [l.rstrip() for l in open('STRUCTURE.txt') if l.strip()]
print('clipped:', len([s for s in src if s not in pdf]))"
```
