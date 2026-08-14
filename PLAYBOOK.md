# PLAYBOOK — How this project was built, step by step

**What this file is.** A full audit of how the University Endowment Investing Explorer went
from one sentence ("I want to make a tool that gives people information on the history of
university investing") to a live, audited, production site — reconstructed from the git
history (52 commits, 2026-07-23 → 2026-08-13), the `TASKS.md` build log, `SESSION_PROMPTS.md`
(your own prompts from the genesis session), and the adoption records in `conduct/`.

Part I is what actually happened, in order, with what *you* did versus what the model did at
each step. Part II is the same thing distilled into a repeatable sequence for your next
project. Part III explains what every artifact in this repo is for. Part IV is the list of
things that cost real time, so you never pay for them twice.

The companion file **`BOOTSTRAP.md`** is the machine-readable version of Part II: a single
prompt you feed to Claude Code or Codex in an empty repo and it builds this whole operating
system for you.

---

## The one-paragraph summary

You built two things at once: a **product** (the website) and an **operating system for
building products with AI** (the docs, the constitution, the escalation chain, the conductor).
The product took about six working days spread over three weeks. The operating system is why
those days worked: every session started from files instead of memory, every judgment call was
either decided-and-logged or escalated up a model tier, everything irreversible stayed in your
hands, and every claim of "done" had to survive a verification step that was allowed to say
no. The single most important pattern in the whole project: **you spent your attention on
decisions only you could make (scope, identity, money, publishing), and made the models spend
their tokens on everything else — including checking each other.**

---

# Part I — What happened, in order

## Step 0 — The brainstorm, before any code (2026-07-23)

**You did:** opened a session and said *"We are just brainstorming, no action needed until I
let you know."* Stated the problem in one sentence. Then: *"Please ask me questions in
interactive mode 1 by 1 with options and also give me your recommendation and why. Use ELI 22
voice no jargons."*

You answered eight scoping questions one at a time — audience, core feature, data scope,
how personal the tool gets, your goal, data approach, tech shape — and at one point said
*"go back"* and changed your answer on core feature (from one feature to "all three, thin
versions"). That revision became the product's actual shape.

**The pivotal prompt of the entire project** was your answer to "what next?":

> *"I do not have too many tokens, I wanted Fable to do the planning and also be the conductor
> of the build whereas opus does the complex build and sonnet does the rest. what do you think
> about this or are there better ways to go about this?"*

That one message created the **model hierarchy** — a tier ladder driven by economics
(expensive models for judgment, cheap models for volume) that later became the escalation
chain, the routing rubric, and the conductor. You then picked **Option B: the "docs-conduct"
workflow** — no conversation memory between sessions; files are the only memory — and had the
plan written to `plan.html`.

**Meta-habit worth keeping:** you ended the session with *"write down all of my llm prompts of
this session into a markdown file"* → `SESSION_PROMPTS.md`. The project's own origin story is
a citable document. This audit was possible because of it.

**Why it mattered:** every decision above was made *before a single file of code existed*, in
a mode where the model was explicitly forbidden from building. Scope questions cost one
sentence to change during a brainstorm and days to change after Phase 3.

## Step 1 — The four founding documents (2026-07-23)

Commit `1a66a35`: `PRD.md`, `TASKS.md`, `CLAUDE.md`, `plan.html`. No code yet.

- **`PRD.md`** — what v1 is (three thin features), the four non-negotiable rules (education
  not advice; every number sourced; plain English; honesty over narrative), an explicit
  **out-of-scope list**, and a checkbox **definition of done**. ~60 lines. It was touched
  exactly once in the project's life — deliberately (see Step 9).
- **`TASKS.md`** — the entire build as a phased checklist (Phase 0 plumbing → Phase 6 ship),
  where every task carries its own *acceptance check* ("*Check: seed passes validation;
  spot-check 3 random years against sources*"), tasks only you can do are tagged **`[H]`**
  (dashboard clicks, account things), and two **CHECKPOINT** lines mark where the build must
  stop for your review no matter what.
- **`CLAUDE.md`** — the standing instructions every session reads first: the reading order,
  the workflow rules (one task per session; docs are the only memory; keep them true), the
  stack, and the non-negotiables restated.
- **`plan.html`** — the human-readable overview of all of it, for you.

**Why it mattered:** the docs-conduct workflow only works if the docs are complete enough
that a fresh session with zero memory can pick up the first unchecked task and do it
correctly. These four files are that guarantee.

## Step 2 — Plumbing, with the human/machine split (Phase 0, 2026-07-23/24)

**The model did:** git init and remote, Next.js scaffold (App Router/TypeScript/Tailwind),
Drizzle ORM + Neon serverless driver, migration tooling.

**You did the `[H]` tasks:** imported the repo into Vercel, added the Neon integration in the
dashboard, got credentials into `.env.local` (gitignored). The model *cannot* do these and —
by design — *may not* do some of them.

**Real-world friction, all documented in the build log rather than suffered twice:** deploys
didn't trigger (Vercel GitHub App lacked repo access — you fixed in GitHub settings); then
deploys were BLOCKED (no git committer identity on the machine — fixed with repo-local
`user.name`/`user.email`); then the build failed (an empty `schema.ts` isn't a module —
`export {}`). Also learned: the Vercel CLI hides real error reasons; the REST API with the
CLI's cached token shows them.

## Step 3 — The Constitution (2026-07-24, added the day the first hard question appeared)

Task 1.3 (curate Yale) hit a wall: Yale stopped publishing allocation percentages after
FY2020. Fill the gap with derived numbers, or ship an honest hole? This was the project's
first real judgment call — and instead of letting the session stop and wait for you, **you
directed the creation of `CONSTITUTION.md`**, which changed the default from "stop and ask"
to "decide safely without me."

Its architecture (still the heart of the whole system):

- **Part 1 — Articles.** The non-negotiables restated as testable rules, each with explicit
  *"Broken by:"* examples (Article 5: *"Never invent data to close a gap… Broken by:
  interpolating missing years, carrying a prior year forward silently"*). Articles are the
  test an escalated answer must pass.
- **Part 2 — Reserved to the human.** The list no model may approve at any tier, ever:
  money/billing, irreversible or outward-facing actions (later amended to include *any push
  to main*, because it auto-deploys), secrets, legal posture, amending the constitution
  itself, product identity ("what v1 means"), and everything tagged `[H]`.
- **Part 3 — The escalation procedure.** The chain **Haiku → Sonnet → Opus → Fable → human**.
  A session that hits a fork answers the question itself first, then spawns a subagent **one
  model tier up** with a self-contained brief, and if the senior's answer breaks no Article,
  it counts as your answer and work continues. An **escalation floor** stops the protocol
  from firing on trivia. Fable is the ceiling; above it is only you.
- **Part 4 — Logging.** Every proxied decision goes in the build log tagged
  **`[PROXY DECISION]`** (with both tiers' reasoning and the Article check); small calls are
  one-line **`[JUDGMENT CALL]`** entries. Without the log you'd lose the ability to audit
  decisions made on your behalf — which would make the whole protocol a downgrade.

**Why it mattered:** in the following week this procedure resolved four major
data-methodology forks (Yale coverage, Harvard's target-vs-actual basis, negative allocation
weights, Harvard's undated tables) **without interrupting you once** — and each ruling
produced a *generalizable rule* written into `data/README.md` that made every later school
easier. Meanwhile the genuinely-yours questions (what v1 means) were parked on a **Checkpoint
agenda** instead of blocking the build. Escalations were also *checked*: the senior's answer
was independently re-verified against the Articles by the junior, and in two of the four
cases the senior **refuted the junior with primary evidence** — proof the second opinion was
real, not a rubber stamp.

## Step 4 — Data before UI, validator before data (Phase 1, 2026-07-24 → 08-04)

The sequence that made the data trustworthy:

1. **Schema + format docs first** (task 1.1): 7 normalized categories, 1:1
   category↔benchmark↔proxy mapping, everything documented in `data/README.md` so a fresh
   session curates without re-deriving decisions.
2. **The validator before any data** (task 1.2): `npm run seed` parses and validates
   *everything* before writing *anything* — allocations sum to ~100%, every row's citation
   resolves, enums and ranges checked; then upsert + prune in one transaction. "No citation,
   no number" became **mechanically enforced**, not aspirational.
3. **Then a hardening pass** (out-of-band review): ~50 defects found in the validator itself,
   including two genuinely dangerous ones — `npm run seed --dry-run` silently *performed the
   destructive write* (npm eats `--dry-run`), and the write wasn't atomic. Writing became
   opt-in (`--write`), and `seed:verify` was born: a regression suite that asserts every
   validation rule actually fires against deliberately-broken fixtures.
4. **Then curation**, school by school, with the escalation chain handling the forks and each
   school's honest disclosure limit accepted rather than papered over (Yale's mix ends FY2020;
   Harvard has targets-then-actuals with two missing years; MIT has 7 scattered years;
   Stanford has none — each labelled, none invented).

**Also in this step:** two sessions accidentally ran concurrently and collided on shared
files. It resolved by luck; the lesson ("a session must never assume it is alone") was written
into `CLAUDE.md` and later became the conductor's lease/fragment protocol.

## Step 5 — Conduct: the orchestration framework (2026-07-30)

**You said:** effectively, *"build it all out"* — turn the ad-hoc escalation habit into a real
framework. The model designed and built (in `CONDUCT-DESIGN.html`, then as installable
skills):

- **The kernel** (`.claude/skills/escalate/references/kernel.md`) — a *domain-free*
  constitutional core reusable across projects: universal articles **K1–K6** (no fabricated
  evidence; faithful reporting; honest gaps; reversibility discipline; the log is memory;
  scope as written), the reserved-powers list, the **tier table**, and the escalation floor
  (escalate iff ≥2 of: materially different work / expensive to unwind / touches an article).
  Project constitutions add domain rules on top; **the stricter rule wins**.
- **The `escalate` skill** — the chain as a versioned procedure, upgraded to **two-phase
  blind ruling**: the junior's recommendation is *withheld* from the senior in Phase 1
  (judges anchor on hints; sequencing beats "please be independent"), then revealed in
  Phase 2 for attack and reconciliation. Telemetry per ruling; a **storm brake** (third
  escalation in one task = the task spec is the problem, go to the human as a scope question).
- **The `conduct` skill** — a stateless conductor loop over the task ledger: decompose into
  worker-sized units with **disjoint file ownership**, route each unit by *properties* (not
  quotas) per `references/routing.md`, lease before spawning, brief each worker
  self-containedly, **verify outside the worker** ("never trust done"), sample cheap-tier
  output at a tier above, integrate through **one serialized lane**, log everything.

**The governance move that made it legitimate:** the framework was **staged, not applied** —
`conduct/ADOPTION.md` packaged the exact edits, and *you signed it* ("kernel Part 2 §5
reserves amending or adopting any constitution — including this kernel's own birth").
Acceptance evidence before your signature: a **golden replay** (all four past
`[PROXY DECISION]`s reproduce under the new protocol) and a **cold-start test** (a fresh
agent given only the skill files produced a working plan for task 1.6 — and *improved* it).

## Step 6 — The pilot: four parallel workers (task 1.6, 2026-07-30/31)

The conductor decomposed "curate Stanford, MIT, Princeton + Harvard's tail" into four units
(routed Sonnet/Opus/Sonnet/Sonnet by properties — MIT routed *up* because its likely
deliverable was a documented gap, and an empty result passes every machine check silently).
Workers wrote **fragments** outside `data/` so the repo stayed green at every instant; a QC
lane a tier above each producer re-verified against independently re-fetched primary
documents; one integration lane did the only writes.

**Results that shaped everything after:** 4/4 units passed QC; every defect found was in
recorded *reasoning*, never in a number; all four workers blew their token budgets (~1.6×
needed for first-contact research work) and worker self-estimates ran ~50–60% of metered
truth ("self-estimates are not data"); ~17 infrastructure drops cost **zero work** because
the fragment protocol made worker death free.

## Step 7 — Operator docs, and auditing the docs themselves (2026-07-31)

You directed an operator's manual: `MANUAL.html` (what to type, what the machine decides,
what is reserved, recovery procedures) + `conduct/QUICKCARD.md` (one page), written from a
five-way parallel audit where **every command was verified by execution**.

The audit found **the docs were lying in six places** (a Harvard "hole" that had been closed;
category counts of 7 where the code had 8; a wrong number *inside the question you were about
to rule on*). All corrected against verified ground truth. This became a standing principle:
**a false doc is a defect in its own right** (Article 9 / K5), and periodic doc-vs-reality
audits are part of the work.

## Step 8 — The engineering-spec pipeline (2026-08-03/04)

Before the big build, the plan was formalized: a **BRD** reverse-derived from the PRD (atomic,
testable requirements with stable IDs), then **`spec-schema/spec.json`** — 20 spec items with
Given/When/Then acceptance criteria, traceability to BRD requirements, milestones M0–M6, a
risk register, cutover and hypercare plans — validated against a JSON Schema, plus **30
readiness probes** run before building. You approved it (v1.0.0) and answered its open
questions (Q-001: hedge funds/PE get an *explicit labelled gap*, not a fake proxy). The spec
tracked the whole build; items moved `planned → built → qa_passed → deployed → verified`.

## Step 9 — Checkpoint A, then the big build (2026-08-04)

**Checkpoint A** was the human review gate at the end of the data phase. The agenda had been
accumulating for two weeks — the three-part "what does v1 mean" question that every proxy
decision had correctly refused to answer (Part 2 §6: product identity is yours). **You ruled:**
full coverage where disclosed, gaps labelled at the point of display; Harvard's targets stand
as labelled; MIT ships reduced and Stanford market-value-only.

Notably: **`PRD.md` was deliberately left unamended** even though its definition-of-done line
was now inaccurate — three separate sessions declined to touch it, because editing the
product's identity document is yours alone. The ruling lives in `TASKS.md` instead. That
restraint is the constitution working.

Then, on your instruction ("proceed"), one directed session built **Phases 2–6 end to end**:
site shell → data access → five school pages → the backtest engine (pure functions, **every
expected value computed by hand**, never by the code under test) → Translator → Compare →
methodology page rendering all 96 sources *from the database* (so completeness is structural)
→ production checks. The dataviz skill governed all chart work: honest gaps as visible holes,
on-chart coverage annotations, a validated colorblind-safe palette, a table twin for every
chart, and **step 7: render it and look at it** — which caught four real defects reasoning
had missed.

## Step 10 — Ship week: the landmine, and review rounds (2026-08-04)

**The zip landmine.** You flipped Deployment Protection off (`[H]` task 6.4) — and the site
was still dead: platform-level 404 on every URL while every API reported the deployment
healthy. Diagnosis by **binary-search canary deployments** (static hello-world ✓, functions ✓,
minimal Next ✓, full app without one file ✓ …) isolated the cause: **a zip archive committed
to the repo silently blackholes the entire Vercel deployment.** Worse, the flag is durable
per-project, so the site was rehomed to a fresh project (`universityfunds-site`) and the
domain moved. Every deployment since the zip landed had been invisibly dead behind the login
wall. Lessons now encoded in `.vercelignore`, `CLAUDE.md`, and memory: never commit archives;
"deployment READY" is not "site reachable"; verify go-live with a logged-out `curl`.

**Checkpoint B review rounds — your feedback loop as QA.** Round 1: "functions all good,
needs color" → school-color identity system with monogram badges (you were offered real
crests, told the trademark trade-off, and chose badges — the decision recorded so no session
re-opens it). Round 2: floating definition bubbles + a glossary page — followed by an
**adversarial multi-agent review** (six lenses, each finding attacked by a skeptic) that
confirmed and fixed **12 real defects** the build had shipped, including two serious
accessibility bugs invisible to Lighthouse's perfect score.

## Step 11 — Post-launch hardening, in tiers (2026-08-05 → 08-13)

With the site live, work shifted to audits — each one producing *permanent verification
gates*, not just fixes:

- **Tier 1** (data/legal/accessibility): no curated figure found wrong; `verify:figures`
  born (mass-balance reconciliation of every market value against returns — with a **negative
  control**: corrupt one figure, watch it fail); table row-headers; chart a11y-layer fix;
  the Yahoo-Finance licensing question correctly routed to you as reserved.
- **Tier 2** (SEO, load, cross-browser): robots/sitemap/canonicals/JSON-LD from nothing
  (`verify:seo`, 113 assertions, every one observed failing pre-fix); a load test that
  disproved the connection-exhaustion theory; a near-miss where a "query timeout" fix would
  have poisoned all DB access — caught **only by re-measuring after the change**; Safari
  testing that ended in a six-hypothesis rabbit hole (macOS freezes occluded windows) fully
  documented so nobody re-derives it.
- **Tier 3** (operations): the discovery that **an uptime check on the homepage stays green
  through a total database outage** (static pages serve from CDN) → `/api/health` as the only
  honest probe; `conduct/RUNBOOK.md` (monitoring, the annual data refresh, disaster recovery);
  `CORRECTIONS.md` (a public corrections log, framed as an asset); security headers.
- **State machines** (2026-08-11): mapping every state and transition in the app
  (48 agents, everything cited to `file:line`, then adversarially re-verified) found **a live
  soft-404 bug three tiers of testing had missed** — defects live at the *seams between
  subsystems*, which single-component testing cannot reach.
- **Personas** (2026-08-13): six secondary personas and three **anti-personas** (the "just
  tell me what to buy" reader is the reason Article 1 exists) — adopted by you, provenance
  honestly stated ("model-proposed hypotheses, no user research"), and woven through 11 docs
  by a serialized integration lane. The adversarial critic found three false claims *in the
  persona doc written the day before* — the system catching itself.
- **Codex mirror** (2026-08-13): `AGENTS.md` + `.agents/skills/` so a non-Claude harness
  reads the same rules.

**Your rulings log:** along the way you ruled on fonts ("leave as is"), Yahoo licensing
("don't worry about it"), contact info ("no") — each recorded in the build log as
**"do not re-raise"**, so your decisions are load-bearing instead of evaporating.

---

# Part II — The playbook for your next project

The same system as a repeatable sequence. (Or skip the manual work: feed `BOOTSTRAP.md` to a
coding agent and it scaffolds steps 2–5 for you.)

1. **Brainstorm with building forbidden.** Open with "we are just brainstorming, no action."
   State the problem in one sentence. Ask for interactive questions one at a time, each with
   options *and a recommendation with reasons*, in plain language. Change your answers freely
   — this is the only phase where scope changes are free. End by logging your own prompts to
   a file.

2. **Set the model economics up front.** Decide which tier plans/conducts (most capable),
   which builds complex things, which does volume work. Say it in one sentence like you did —
   the whole hierarchy falls out of it.

3. **Write the four founding docs before any code.**
   - `PRD.md`: what v1 is, non-negotiable rules, an explicit out-of-scope list, a checkbox
     definition of done. Keep it short. Then **freeze it** — it's the artifact of the approved
     plan; corrections live elsewhere, and rulings about what it means are yours alone.
   - `TASKS.md`: phases → tasks, each with its own acceptance check, `[H]` tags on everything
     only you can do, and **CHECKPOINT** lines where the build must stop for your review.
   - `CLAUDE.md` (+ `AGENTS.md` mirror for other harnesses): reading order, workflow rules,
     stack, the non-negotiables restated.
   - A build log section in `TASKS.md` from day one. **The docs are the only memory.**

4. **Adopt a constitution** — now you have the template (`CONSTITUTION.md` + the kernel).
   Articles with "broken by" clauses; a reserved list (money, irreversible/outward actions
   *including any push that deploys*, secrets, legal, amendments, product identity, `[H]`);
   the escalation chain with a floor; mandatory decision logging. **You sign it explicitly**
   — and every later amendment too. Staged adoption is the pattern: the model drafts and
   packages, you approve with an explicit reply.

5. **Install the skills** (`escalate`, `conduct`, plus a domain skill like `dataviz` if the
   project has one). They're project files — copy them from this repo and adapt.

6. **Phase 0 with the human/machine split.** The model scaffolds; you do dashboards,
   integrations, and credentials. Expect the first deploy to fail for boring reasons; write
   each one down.

7. **Build the validator before the data** (or the test harness before the feature). Make the
   project's core rule mechanically enforced from day one, make writing opt-in, and build a
   `verify` suite that proves each validation rule actually fires. For correctness-critical
   math: **unit tests with hand-computed expected values**, never values produced by the code
   under test.

8. **Run sessions one task at a time.** Each session: read the docs → pick the first
   unchecked task → do only it → verify the acceptance check → check it off → log surprises.
   Judgment calls get decided-and-logged or escalated one tier up — never "stop and wait."
   Genuinely-yours questions accumulate on the next checkpoint's agenda.

9. **Parallelize only under the conductor.** Disjoint file ownership per worker, fragments
   for shared files, leases in the ledger, QC a tier above the producer, one serialized
   integration lane. Expect research-heavy budgets to run ~1.6× and ignore worker
   self-estimates.

10. **Verify by rendering and looking, with negative controls.** Screenshots at desktop and
    phone width, dark mode, real browsers. Every verification script must be shown to fail on
    a known-bad input — *"a verification tool without a negative control is an assertion, not
    a test."* And re-measure after every fix; two of this project's worst near-misses were
    caught only by measuring again.

11. **At checkpoints, review as the product owner.** Rule on the accumulated agenda
    explicitly (your words get quoted verbatim in the log). Give aesthetic/product feedback in
    plain language — "less footer, more color" is a perfectly good spec. Your rulings get
    recorded as "do not re-raise."

12. **After launch, audit in tiers** — data/legal/a11y, then SEO/load/cross-browser, then
    operations — and turn every audit into a permanent gate (`verify:*` scripts). Audit the
    *docs* against reality on the same schedule; docs that lie are defects. Keep a public
    corrections log. Map the state machines when the system feels done — the seams are where
    the last bugs live.

---

# Part III — The operating system, piece by piece

| Artifact | Job | Born |
|---|---|---|
| `PRD.md` | What v1 is; frozen identity document; only you amend it | Day 0 |
| `TASKS.md` | The ledger: phased checklist + acceptance checks + `[H]` + checkpoints + **build log** (the project's memory and audit trail) | Day 0 |
| `CLAUDE.md` / `AGENTS.md` | Standing instructions every session reads first; reading order; workflow rules | Day 0 |
| `plan.html` | Human-readable overview for you | Day 0 |
| `SESSION_PROMPTS.md` | Your own prompts, logged — the genesis record | Day 0 |
| `CONSTITUTION.md` | Project articles + reserved list + escalation procedure + logging rules | Day 1 (first hard question) |
| `.claude/skills/escalate/` (+ `references/kernel.md`) | The versioned escalation procedure; the domain-free kernel (K1–K6, reserved powers, tier table, floor) | Week 1 |
| `.claude/skills/conduct/` | The conductor loop, routing rubric, brief template | Week 1 |
| `.claude/skills/dataviz/` | Domain discipline for charts (honesty rules, palette, render-and-look) | Build phase |
| `conduct/ADOPTION.md` | Signature record — what you adopted, when, verbatim | Week 1 |
| `conduct/plans/`, `briefs/`, `fragments/`, `audits/` | Conductor working state: plans, worker briefs, fragment staging, audit reports | Pilot onward |
| `conduct/RUNBOOK.md`, `QUICKCARD.md`, `STATE-MACHINES.md` | Operations: monitoring/refresh/DR; one-page card; the full state map | Post-launch |
| `spec-schema/` (BRD, `spec.json`, schema, probes) | The formal spec pipeline: atomic requirements → 20 traced spec items → readiness probes | Pre-build |
| `data/README.md` | Every curation rule and precedent, so no session re-derives them | Phase 1 |
| `MANUAL.html`, `STRUCTURE.md`, `STATUS.html` | Operator manual; repo map snapshot; live status page rendered from the ledger | Week 1+ |
| `CORRECTIONS.md`, `PERSONAS.md` | Public corrections log; audience lenses + anti-personas | Post-launch |
| `scripts/verify-*.mjs`, `seed:verify` | The permanent gates: every audit's findings frozen into re-runnable checks | Continuous |

---

# Part IV — Lessons that cost real time (pay once, never again)

1. **A zip archive in the repo silently kills every Vercel deployment** — platform 404 on all
   URLs while all APIs report healthy, and the flag sticks to the project even after removal.
   Never commit archives. `.vercelignore` does *not* protect git-triggered deploys.
2. **"Deployment READY" ≠ "site reachable."** The only honest go-live check is a logged-out
   `curl -I` from outside. And an uptime check on a static homepage stays green through a
   total database outage — probe the data path (`/api/health`).
3. **`npm run seed --dry-run` performed the write** — npm consumes `--dry-run`. Destructive
   operations must be opt-in (`--write`), never default.
4. **Verification tools lie unless they have negative controls.** ~11 false findings from
   measurement bugs in one audit day; the only harness that never lied was the one with a
   negative control. Prove every checker fails on known-bad input.
5. **Re-measure after every fix.** The "query timeout" one-liner would have poisoned all DB
   access (one shared AbortSignal at module load); caught because `/api/health` was re-checked
   after the change. Its failure mode was invisible: static pages keep serving.
6. **Fix the class, not the instance.** Nearly every defect had a sibling (the scroll-container
   fix was needed in four places). Grep for the pattern before closing the finding.
7. **Docs drift into lies.** Six false statements found in one audit; a wrong number *inside a
   question queued for human ruling*. Schedule doc-vs-reality audits.
8. **Models anchor.** The senior tier ratified less when the junior's recommendation was
   withheld (two-phase blind). "Please be independent" doesn't work; sequencing does.
9. **Worker self-estimates read ~50–60% of metered truth**, and first-contact research blows
   budgets ~1.6×. Meter, don't ask.
10. **Match generated output on stable keys, never on model-written text** — a review
    workflow reported "0 confirmed findings" because skeptics echoed titles with prefixes and
    the string-match silently dropped all 12 real ones.
11. **Perfect scores measure what the tool measures.** Lighthouse 100 coexisted with a bubble
    that swallowed taps, a live region that corrupted table headers, and invisible
    forced-colors borders. Adversarial review found what the score couldn't.
12. **Defects concentrate at seams between subsystems** (render↔data, loading↔status-codes).
    That's why the state-machine mapping found a soft-404 that three tiers of testing missed.
13. **Environment gotchas compound quietly:** capital letters break `create-next-app`; npm
    scripts type-check into the production build; parenthesised negatives flip signs in
    naive extraction; oldstyle-figure PDFs extract as glyph names; Wayback wildcards
    soft-404. Log every one where the next session will read it.

---

# Part V — Your job description (what only the human did)

Everything else in this repo was model work. These were yours, and the system was designed so
they *stayed* yours:

- **Scope and identity:** what v1 means, which features exist, the name, the look. Ruled at
  checkpoints; PRD frozen in between.
- **Adoption and amendment:** the constitution, the kernel, and all five amendments — each by
  explicit signature ("adopt 1A, 2A, 3A, 4B, 5A"), with unsafe drafts refused and redesigned
  first.
- **Publishing:** every push to main after 2026-08-04 (it deploys), and the go-live toggle.
- **Money, accounts, dashboards, secrets:** every `[H]` task.
- **Legal posture:** the licensing question, the no-contact-info ruling, the fonts ruling —
  each answered once, logged, never re-asked.
- **Taste:** "needs more color," "definitions should float," "keep the badges, not the
  crests." The review-round loop turned plain-language reactions into shipped work within
  hours.

The system's health metric was never "did the model do what I said" — it was **ratification
rate**: how often the second opinion merely rubber-stamped the first. It stayed near 25%,
meaning the checks were real. That, more than anything, is what you built here.
