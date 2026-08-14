# BOOTSTRAP — one prompt that builds this whole architecture in a new repo

**How to use this file (you, the human):**

1. Create an empty folder / repo for the new project.
2. Fill in the two fields in the **INPUTS** block below (one sentence about the product is
   enough — the agent will interview you for the rest).
3. Paste everything from `=== PROMPT STARTS HERE ===` down into a fresh Claude Code or Codex
   session in that folder (or save this file there and say *"read BOOTSTRAP.md and execute
   it"*).
4. Answer its interview questions, review the drafts, and **sign the constitution when asked**
   — that's the one thing it must not do for you.

What you get: the full operating system this playbook describes — founding docs, constitution
+ kernel, escalation and conductor skills, ledger with checkpoints, verification conventions —
ready for the first build session. Product code comes after, one task at a time.

---

=== PROMPT STARTS HERE ===

# Mission: scaffold a docs-conduct project operating system

You are setting up the **architecture for an AI-built software project** — the documents,
rules, and skills that let stateless agent sessions build it safely — NOT the product itself.
You write no product code today. The system you are installing is proven: it shipped a
production data web app (curation → build → launch → hardening) with the human interrupted
only for decisions that were genuinely theirs.

## INPUTS (filled by the human)

```
PRODUCT_IDEA: <one or two sentences: the problem and who it's for>
MODEL_TIERS:  <the model ladder available in this harness, cheapest to most capable;
               e.g. "Haiku → Sonnet → Opus → Fable". If unsure, write "detect">
```

## Operating principles for THIS setup session

- **Interview before writing.** Do not generate documents from the one-line idea alone.
- **Stage, never adopt.** You draft the constitution and kernel; only the human's explicit
  in-session reply adopts them. Same for anything else marked reserved below.
- **Plain language.** All questions and drafts in ELI-25 voice: smart reader, zero tolerance
  for unexplained jargon.
- **Everything you decide goes in a file.** The test for done: a brand-new session with zero
  conversation history could read the repo and correctly start task 0.1.

---

## PHASE 1 — Interview the human (interactive, one question at a time)

Ask **one question per turn**, each with 2–4 concrete options **plus your recommendation and
why**. Use the harness's interactive-question tool if present, otherwise numbered options in
plain text. The human may say "go back" at any time — re-ask cleanly. Log every answer.

Required questions (adapt wording to PRODUCT_IDEA, add follow-ups where an answer opens one):

1. **Audience** — who exactly is this for? (This becomes the PRD audience *and* the
   reading-level bar.)
2. **Core value** — of the plausible features, which one is the point? Then: minimal v1 shape
   (one feature deep vs. several thin)?
3. **Scope of data/content** — how much, from where, at what quality bar?
4. **How personal / interactive** — does it act for users, or inform them? (Look-don't-touch
   is a real option and often the right one.)
5. **The human's goal** — learning project, portfolio piece, real users, revenue? (This sets
   how heavy the apparatus below should be.)
6. **Stack + hosting** — recommend a default (e.g. Next.js + a managed DB + auto-deploy
   hosting) unless they have one. Record the *actual* plan tier (free/hobby/pro) — it changes
   failure modes.
7. **Apparatus weight** — offer explicitly:
   - **Full** (this playbook's system: constitution + kernel + escalate + conduct + spec
     pipeline) — right when data integrity or multi-session autonomy matters;
   - **Standard** (constitution + escalate + ledger; conductor and spec pipeline deferred
     until first needed) — right default for most solo projects;
   - **Light** (founding docs + reserved list + build log only).
8. **Model economics** — confirm MODEL_TIERS and the roles: most capable model = planning,
   conducting, and review gates; middle = complex build and QC; cheapest = volume work.
9. **Non-negotiables** — what must never happen? (Legal exposure, advice-giving, data
   invention, spending money — whatever fits the domain.) These become constitutional
   Articles, so push for testable phrasings.
10. **Reserved matters** — beyond the universal list you'll install, is anything else
    theirs alone?

Close the interview by reading back the decisions in one screen and getting a yes.

## PHASE 2 — Generate the founding documents

Create these files. Where a spec below says *verbatim*, copy exactly; otherwise generate from
the interview. Every generated rule must be **testable** — prefer "Broken by: <concrete
examples>" over abstractions.

### 2.1 `PRD.md` (~60 lines, then frozen)
Problem (from the interview, sharpened) · Audience · What v1 is (features, each 2–4 bullets) ·
Data/content rules · **Non-negotiable rules** (numbered) · **Out of scope for v1** (explicit
list — this line is what prevents scope creep) · **Definition of done** (checkboxes, each
independently verifiable) · Tech constraints. Header carries status + date. Add a footer note:
*"This file is the identity of the product. Only the human amends it; sessions record
corrections and rulings in the ledger instead."*

### 2.2 `TASKS.md` — the ledger
- Header: how to use (pick first unchecked task, do only it, verify its acceptance check,
  check off, log surprises; one task per session; if blocked, write the blocker and stop),
  plus lease conventions (`claimed-by: <model> · <date>`; stale claims reclaimable).
- Legend: **`[H]`** = human-only (dashboard clicks, accounts, credentials).
- **Phases** fitted to the product, in this proven shape: Phase 0 plumbing (repo, scaffold,
  `[H]` hosting + DB integration, env pull) → Phase 1 foundation (schema/format design, then
  **the validator/test harness BEFORE any content**, then content/data) → middle phases per
  feature → final phase polish & ship (methodology/about page, copy pass, production checks
  incl. *"logged-out `curl -I <prod-url>` returns 200"*, `[H]` go-live toggles).
- Every task line ends with *`*Check: <how a session proves it done>*`*.
- **CHECKPOINT lines** between major phases: *"CHECKPOINT — human review: <what to review>.
  Checkpoints are review gates, not questions; nothing routes around them."* Minimum two:
  after the foundation phase, and before public launch.
- A `## Build log` section seeded with entry #1: this bootstrap session — interview answers,
  apparatus weight chosen, anything surprising.

### 2.3 `CLAUDE.md` AND `AGENTS.md` (byte-identical content, both harnesses)
One screen: project one-liner · **reading order** (1. CONSTITUTION.md 2. PRD.md 3. TASKS.md)
· workflow rules verbatim from this list:
- docs-conduct: no conversation memory between sessions; these files are the only memory;
  a session that leaves them untrue has failed regardless of what it built;
- one task per session; don't stop to ask — **escalate** (reserved matters go straight to
  the human); log every proxied decision;
- parallel work only under a conductor with disjoint file ownership; a session must never
  assume it is alone — check for leases first;
- `[H]` tasks are the human's — skip and tell them;
- checkpoints stop the line for the human, always;
- stack facts (incl. the true hosting plan tier) · the non-negotiables restated.

### 2.4 `CONSTITUTION.md`
Structure (adapt Part 1 content to the interview; keep the architecture exactly):
- **Preamble:** *"PRD.md says what to build; TASKS.md says what's next; this says who decides
  and when to stop. A session with a question does not stop and wait — it answers the
  question itself, escalates one tier for an independent second answer, and proceeds if that
  answer is constitutional."*
- **Part 1 — Articles.** The interview's non-negotiables as numbered Articles, each with a
  *"Broken by:"* clause. ALWAYS include these four regardless of domain: honest gaps (never
  invent content/data to close a gap); critical logic is tested with **hand-computed expected
  values**; the single source of truth is edited at its source, never downstream; **the docs
  are the memory** (an untrue doc is a defect).
- **Part 2 — Reserved to the human** (verbatim, plus interview additions): money and
  accounts · irreversible or outward-facing actions, **including any push to a branch that
  publishes or deploys** · secrets · legal and compliance posture · amending this
  constitution (a model may propose; only the human adopts — including this document's own
  adoption) · product identity and what v1 means · anything marked `[H]`.
- **Part 3 — Escalation.** Chain = MODEL_TIERS with the human at top. Procedure: answer it
  yourself first (question, 2–4 real options, recommendation, article-by-article self-check,
  what you'd do if no answer came) → spawn a **subagent one tier up** with a self-contained
  brief (never a fork — forks inherit the caller's model) → the senior rules **blind**
  (junior's recommendation withheld, then revealed for attack — Phase 2) → junior
  independently re-checks the ruling against every Article → constitutional ⇒ it counts as
  the human's answer; article-breaking ⇒ next tier; top tier ⇒ human. **Escalation floor:**
  escalate iff ≥2 of {materially different work / expensive to unwind / touches an Article};
  below the floor, decide it and log one line. **Storm brake:** third escalation in one task
  means the task spec is the problem — go to the human as a scope question.
- **Part 4 — Logging.** Every ruling → `[PROXY DECISION]` (question, options, both tiers'
  recommendations, article check, what was implemented, what would justify revisiting);
  sub-floor calls → one-line `[JUDGMENT CALL]`; human rulings → `[HITL]` with the human's
  words quoted. All in the build log.

### 2.5 Skills — `.claude/skills/` AND `.agents/skills/` (identical mirrors)
- **`escalate/SKILL.md`** — the Part 3 procedure as an invocable skill, +
  `references/kernel.md` (next bullet) and `references/brief.md` (the self-contained
  escalation brief template: read-these-files list, the question, verified/couldn't-verify
  lists, options stated neutrally, required response shape).
- **`escalate/references/kernel.md`** — the domain-free constitutional core, **verbatim**:

  > **K1 — No fabricated evidence.** Never claim a test passed that didn't run, a citation
  > that wasn't read, a number that wasn't sourced, a "works" that wasn't verified.
  > **K2 — Faithful reporting.** Failures reported as failures; skipped steps named as
  > skipped; partial work named as partial.
  > **K3 — Honest gaps.** A gap stays a gap. No silent interpolation, carry-forward, or
  > plausible filler — in data, docs, or test coverage.
  > **K4 — Reversibility discipline.** Distinguish one-way from two-way doors before walking
  > through. When in doubt, treat the door as one-way and check the reserved list.
  > **K5 — The log is memory.** Every proxied decision is logged where the project keeps
  > memory. An unlogged decision is a protocol failure regardless of whether it was right.
  > **K6 — Scope as written.** No silent narrowing, widening, or transformation of a task.

  Plus: the reserved list (from 2.4 Part 2, domain-free wording), the tier table built from
  MODEL_TIERS (with: tier resolved at escalation time from the declared model; unknown model
  = no autonomous authority), the escalation floor, and precedence (human's explicit
  instructions > reserved list > project Articles > K1–K6 > everything else; stricter rule
  wins). Header: `kernel-version: 1.0.0-rc1 · status: STAGED — awaiting human signature`.
- **`conduct/SKILL.md`** — *(Full apparatus only; otherwise create `conduct/README.md` saying
  "installed when first parallel task appears" so the slot is visible.)* The conductor loop:
  stateless scheduler over the ledger; never implements; decompose into worker units with
  **disjoint file ownership** (shared-file changes travel as fragments the conductor merges);
  route by properties per `references/routing.md` (up: first-of-kind, design decisions,
  data-integrity surface, likely-gap deliverables that pass machine checks silently; down: an
  exemplar exists, machine-checkable acceptance, local blast radius); lease before spawn;
  verify outside the worker; **sample cheap-tier output at a tier above** (the misroute to
  fear is confident mediocrity — it looks done); **one serialized integration lane**; budgets
  in the ledger (research work runs ~1.6× estimates; worker self-estimates read ~50–60% of
  metered truth — meter, don't ask).

### 2.6 Verification conventions — write into `CLAUDE.md`/`AGENTS.md` as a short section
1. Destructive operations are **opt-in** (`--write`), never default; a bare invocation
   validates and stops. (npm swallows `--dry-run` — never rely on it.)
2. Every validator/checker ships with a **negative control**: a `verify` script that proves
   each rule fires on known-bad fixtures. *A verification tool without a negative control is
   an assertion, not a test.*
3. UI work is verified by **rendering and looking** — screenshots at desktop + 375px, dark
   mode — not by reading the code. Re-measure after every fix.
4. Go-live truth = a logged-out request from outside returns 200. Deployment-dashboard
   "READY" proves nothing. A static homepage stays green through a data outage — build a
   `/api/health` style probe that exercises the data path.
5. **Never commit archive files** (`.zip` etc.) — they can silently kill entire deployments
   on some hosts. Add `*.zip` to `.gitignore` now.
6. When a defect is found, **grep for its class** and fix the siblings, not just the
   instance. When output of one agent is matched against another's, match on stable keys,
   never on model-written text.

### 2.7 Housekeeping
`SESSION_PROMPTS.md` (log the human's inputs from THIS session, chronological) ·
`decisions/` note in the ledger header pointing at the build log as the decisions record ·
`.gitignore` (env files, `*.zip`, harness junk) · `README.md` stub pointing at `CLAUDE.md`.
*(Full apparatus only:)* `spec-schema/README.md` describing the deferred pipeline: BRD
reverse-derived from PRD → `spec.json` items with Given/When/Then acceptance + traceability →
readiness probes before build. Do not generate the spec itself now.

## PHASE 3 — Stage adoption, then STOP

1. Present an **adoption package** (`conduct/ADOPTION.md` pattern): what signing adopts
   (kernel version stamp, constitution, the escalation procedure), the exact staged edits,
   and *"nothing below is in force until you reply with explicit approval."*
2. Ask the human to reply with an explicit adoption sentence. On receipt: fill the kernel
   stamp (`1.0.0 · ADOPTED · signed-by · date`), record the signature in `ADOPTION.md`, log
   `[HITL]` in the build log.
3. Commit everything with a clear message. **Do not push if the remote deploys — pushing is
   reserved (Part 2 §2).** Say so rather than doing it.
4. Print the handoff: the reading order, the first three tasks (with their `[H]` items
   flagged), which model tier to open the first build session on, and the reminder that
   Checkpoint reviews are where the human rules on accumulated questions.

## Acceptance — you are done when

- [ ] A fresh, memoryless session could read the repo and correctly execute task 0.1.
- [ ] Every non-negotiable from the interview exists as an Article **with a "Broken by:"**.
- [ ] The reserved list includes deploy-pushes, secrets, money, identity, and amendment.
- [ ] `CLAUDE.md` and `AGENTS.md` are byte-identical; both skill trees mirror.
- [ ] Every task in `TASKS.md` has an acceptance check; `[H]` and CHECKPOINTs present.
- [ ] The kernel is STAGED or human-signed — never self-adopted.
- [ ] The build log's first entry records this session, including anything you chose on the
      human's behalf (each as a logged `[JUDGMENT CALL]`).
- [ ] Nothing was pushed to a deploying branch.

=== PROMPT ENDS HERE ===
