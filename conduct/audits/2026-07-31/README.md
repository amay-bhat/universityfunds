# Full audit — Conduct framework and the task-1.6 pilot

**Scope:** everything built, moved or updated on 30–31 July 2026 — commits `a2eb063..00a08ec`, 50 files, +9,958 / −80 lines.

| | |
|---|---|
| Audit run | 31 July 2026, 13:16–14:16 PDT |
| Repo state audited | `HEAD` = `00a08ec`, working tree clean, 76 tracked files |
| Baseline moved since | `449aeca` added `sofar.txt` + a work-bundle zip and was pushed. **No audited file changed** — `git diff --stat 00a08ec..449aeca` lists those two paths only — so every finding and every line number below still holds. |
| Method | 10 read-only dimension auditors → per-finding adversarial refutation → 2 synthesis passes |
| Agents | 65 — 0 errors, 0 empty results · 4.1 M tokens · 1,725 tool calls |
| Raw findings | 100 |
| Refuted and discarded | 24 → `REFUTED.md` — **do not re-open** |
| Actionable, deduplicated | **74 sites** — 37 here, 37 in `BACKLOG.md` |
| Verified correct | `VERIFIED-CLEAN.md` — **do not re-audit** |

---

## 0. How to use this document

**If you are a Claude Code session picking this up cold, read this section and section 2, then open one work-package file. You do not need the rest.**

1. **Work the packages in order, `WP1` → `WP6`.** That order is a real dependency chain, not a preference. Three of the errors below were copied *from* the ledger *into* the renderings; correcting a rendering first means correcting it twice.
2. **Each finding is a self-contained work order** carrying the verbatim current text at `HEAD`, what is wrong, the evidence that proves it, the fix, and a command that verifies the fix. You should not need the original transcripts.
3. **Do not re-litigate `REFUTED.md`.** Those 24 claims were filed by an auditor and then killed by an independent verifier — mostly miscounts, or debt this repo has already deliberately accepted and recorded. Re-finding them spends a session for nothing.
4. **Do not re-audit `VERIFIED-CLEAN.md`.** Those facts were established by running commands. They include the entire citation rail and the fragment → `data/` merge.
5. **Every count stated in these files was recomputed against the live repo on 31 July 2026** before being written here — not copied from the auditor that filed it. If you find one wrong, the repo wins, and that is itself worth logging.
6. **Run `./verify.sh` before you start and again when you finish.** Before: it reproduces the failures. After: every line should read `OK`.

> **Scope discipline.** This audit found no defect in any stored figure, in the validator's actual behaviour, or in the build. Every finding is a document, a log entry, or a test's discriminating power. **Do not change data while working this list.**

---

## 1. Verdict

**The code and the data are sound. Everything that survived verification is documentation drift.**

Established by execution, not by reading claims:

- `tsc --noEmit`, `npm run lint`, `npm run build`, `npm run seed:dry`, `npm run seed:verify` all exit 0. Zero lint warnings across 12 files. Working tree clean before and after. `skipLibCheck` is not hiding anything — forced off, all 74 surfaced errors are in `node_modules` or Next's generated types, none in `src/` or `scripts/`.
- **"No citation, no number" holds without a single exception.** All 349 allocation rows, 128 endowment-return rows (*both* citation columns) and 130 benchmark rows carry a citation resolving into `sources.json`. Zero dangling ids, zero uncited figures.
- **The fragment → `data/` merge is byte-exact** — and nobody had ever verified it. MIT 24/24 rows identical; Princeton 104 allocations + 24 returns identical. Every divergence traces to a logged decision.
- All 60 school-year allocation sums fall inside the declared tolerance, and every out-of-round year is documented.
- The 18 MIT Pool A rows — the highest-risk figures in the change set, because no worker fragment carries them — trace end to end and are correct.
- Secret hygiene is clean across all 76 tracked files. `STRUCTURE.pdf` is genuinely uncorrupted: the repo's own pdfminer check reports 0 clipped lines.

What is broken is the layer that *describes* that work:

| Severity | Sites | Where |
|---|---|---|
| high | 8 | `STATUS.html` ×3, `CONDUCT-DESIGN.html` ×2, `TASKS.md`, `data/README.md`, `MANUAL.html` |
| medium | 29 | spread across 16 files |
| low | 37 | `BACKLOG.md` |

One structural pattern explains nearly all of it: **`TASKS.md` earns its source-of-truth status — its own counts reconcile against the files — and the renderings drifted away from it.** Most of the drift entered in commit `722e0c6`, the one titled *"Add operator manual and quick card; correct four docs against verified state."*

### The three findings that are more than a stale number

| | |
|---|---|
| `A-01` | The only ruling ever made under the adopted two-phase protocol issued six self-described **binding** obligations — and the ruling itself lives in a session temp directory that gets garbage collected. It was still on disk when this audit ran. Two of its six obligations are undischarged. |
| `A-17` `A-18` | `CONDUCT-DESIGN.html` still renders the framework as an **unsigned draft with Phase A not started**, five commits after the kernel was signed and Phases A–D accepted. |
| `A-15` `A-19` | Four documents claim `npm run seed:verify` "asserts each rule fires." A mutation study shows **31 of the validator's 53 diagnostic sites can be silenced with the suite still printing 30/30**, and 14 whole rule blocks can be deleted while it stays green. The tests are real; the claim about their coverage is not. |

---

## 2. Execution plan

### WP0 — already done during the audit: the ruling was rescued

The pool-basis ruling — the **only** ruling ever produced under the adopted two-phase protocol, and the thing that decides which MIT years are publishable — was not in the repo. It was in a session-scoped temp directory (`/private/tmp/claude-501/…/scratchpad/ruling-pool-basis.md`, 17,582 bytes, written 30 July 2026 23:17) that is garbage-collected without warning. `TASKS.md:240` described it as *"quoted here as the permanent record"* while pointing at that path.

It was still on disk when this audit ran, and has been **copied to [`evidence/ruling-pool-basis.md`](evidence/ruling-pool-basis.md)** so it cannot be lost. That copy is audit evidence, not a home. `WP1 / A-01` still has to give it a permanent home under `conduct/rulings/` and repoint the ledger:

```bash
mkdir -p conduct/rulings
cp conduct/audits/2026-07-31/evidence/ruling-pool-basis.md conduct/rulings/pool-basis.md
# then edit TASKS.md:240 — replace the scratchpad pointer with conduct/rulings/pool-basis.md
```

The ruling issues six numbered obligations it calls **binding**, and five revisit triggers. Four obligations are discharged; **#5 (display obligations carried to tasks 3.2 / 6.1) and #6 (the revisit triggers reaching the log) are not** — that is `A-01` and `A-02`.

```text
WP1  ledger (TASKS.md)             ─┐
WP2  governance (kernel, rules)     ├─  correct the sources first
WP3  data methodology (README)     ─┘
                  │
WP4  re-render the 3 HTML docs     ←  depends on WP1-WP3 being true
WP5  validator test coverage           (independent — may run in parallel)
                  │
WP6  regenerate STRUCTURE.*        ←  last: this audit adds files to the tree
```

### WP1 — Correct the ledger (`TASKS.md`) — upstream of every rendering

Two findings here are *root* errors: they live in the ledger and were then copied into three renderings. Fixing a rendering before its ledger entry guarantees the error returns the next time anything is regenerated. `TASKS.md` is the declared source of truth (`STRUCTURE.md:163` — "if a document disagrees with it, the document is stale"), so it goes first. The undated-Harvard-tables count is the clearest case: it is wrong at `TASKS.md:143` and `:145`, and from there it reached `data/README.md` twice, `STATUS.html` twice and `conduct/GOLDEN-REPLAY.md` once.

**File:** [`WP1-ledger.md`](WP1-ledger.md) · **2 work orders** · backlog: `B-01`, `B-02`, `B-03`

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-01` | high | `TASKS.md` | 240 | Only ruling made under the adopted protocol omits 2 of 6 mandatory log fields |
| `A-02` | medium | `TASKS.md` | 41 | Live display obligations for 66 curated rows exist only in data/README.md prose; no task spe… |

### WP2 — Correct the governance layer — constitution, kernel, skills, quick card

The kernel, the constitution and the skills are what every future session reads *before acting*. A stale rule here is executed, not merely displayed. `A-10` is the sharp one: the constitution still mandates a field name the validator now rejects on 227 figures, so a session following Article 2 literally would write data that fails `npm run seed:dry`.

**File:** [`WP2-governance.md`](WP2-governance.md) · **11 work orders** · backlog: `B-04`, `B-05`, `B-06`, `B-07`, `B-08`, `B-09`, `B-10`

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-03` | medium | `.claude/skills/conduct/SKILL.md` | 8 | Conductor is defined as Opus-only but ran as Fable and is launched with no model check |
| `A-04` | medium | `.claude/skills/conduct/references/routing.md` | 15 | routing.md both routes ledger-editing units up to Opus and calls them never routable |
| `A-05` | medium | `.claude/skills/conduct/references/routing.md` | 25 | routing rubric and design doc claim four escalations on the first school; replay says max tw… |
| `A-06` | medium | `.claude/skills/escalate/SKILL.md` | 57 | Phase-2 reveal requires SendMessage to a live agent no document explains how to create |
| `A-07` | medium | `.claude/skills/escalate/SKILL.md` | 105 | The ratification-rate health metric is stated over four different denominators |
| `A-08` | medium | `.claude/skills/escalate/references/brief.md` | 91 | No tie-break when the top tier's same-tier refuter disagrees and both views are constitution… |
| `A-09` | medium | `CLAUDE.md` | 15 | CLAUDE.md caps a session at one task while conduct run and until modes span many |
| `A-10` | medium | `CONSTITUTION.md` | 17 | CONSTITUTION.md Article 2 still mandates a `sourceId` field the validator now rejects on 227… |
| `A-11` | medium | `conduct/GOLDEN-REPLAY.md` | 10 | GOLDEN-REPLAY claims "Zero regressions" / "fire at the right floor" but never tested the one… |
| `A-12` | medium | `conduct/QUICKCARD.md` | 70 | The gates-are-not-escalatable rule is absent from every file a session is told to read first |
| `A-13` | medium | `conduct/QUICKCARD.md` | 74 | QUICKCARD's reserved list drops third-party messaging and data-licensing clauses |

### WP3 — Correct the data-methodology record — `data/README.md` and friends

`data/README.md` is the provenance record behind every curated figure, and every curation session is instructed to read it in full. These errors are narrative rather than numeric — no figure is wrong — but they send a reader hunting for source documents that the build log proves were never archived.

**File:** [`WP3-data-methodology.md`](WP3-data-methodology.md) · **3 work orders** · backlog: `B-11`, `B-12`, `B-13`, `B-14`, `B-15`, `B-16`, `B-17`, `B-18`, `B-19`, `B-20`

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-14` | high | `data/README.md` | 90 | README's Harvard-tail provenance claim is false for FY2000/FY2001 and contradicted by source… |
| `A-15` | high | `data/README.md` | 627 | Four docs claim seed:verify "asserts each rule fires"; 31 of 53 diagnostic sites go undetect… |
| `A-16` | medium | `data/README.md` | 220 | MIT's as-of dating section was not updated when the 18 Pool A rows merged; FY2001 is dated b… |

### WP4 — Re-render the three HTML documents from the corrected ledger

All three HTML files are renderings, by the repo's own definition. Once WP1–WP3 land they can be corrected against a ledger that is actually true. This is the largest package (17 orders) and the least subtle: most are counts that drifted from the ledger, plus one document that still describes the framework as an unsigned draft.

**Files:** [`WP4a-conduct-design.md`](WP4a-conduct-design.md) (5) · [`WP4b-status.md`](WP4b-status.md) (8) · [`WP4c-manual.md`](WP4c-manual.md) (4) — **17 work orders total** · backlog: `B-21`, `B-22`, `B-23`, `B-24`, `B-25`, `B-26`, `B-27`

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-17` | high | `CONDUCT-DESIGN.html` | 281 | CONDUCT-DESIGN.html still says the kernel is unsigned and Phase A un-started; it was adopted… |
| `A-18` | high | `CONDUCT-DESIGN.html` | 627 | CONDUCT-DESIGN.html still presents the framework as an unsigned draft with Phase A not start… |
| `A-19` | high | `MANUAL.html` | 437 | MANUAL.html presents seed:verify as the detector of unauthorised validator edits; it detects… |
| `A-20` | high | `STATUS.html` | 453 | STATUS.html "Waiting on you: 2" contradicts its own tile note, its own lede, and MANUAL.html… |
| `A-21` | high | `STATUS.html` | 534 | STATUS.html turns the pilot's QC sample into a census: "each row re-verified" |
| `A-22` | medium | `CONDUCT-DESIGN.html` | 487 | CONDUCT-DESIGN attributes "four escalations" to curating Yale; only two of the four came fro… |
| `A-23` | medium | `CONDUCT-DESIGN.html` | 599 | CONDUCT-DESIGN says four escalations / three-of-four modified; MANUAL says five rulings — ac… |
| `A-24` | medium | `CONDUCT-DESIGN.html` | 604 | CONDUCT-DESIGN.html says the first school was curated "with four escalations", contradicting… |
| `A-25` | medium | `MANUAL.html` | 395 | MANUAL.html states npm audit reports 16 findings (4 moderate, 12 high); actual is 8 (4 moder… |
| `A-26` | medium | `MANUAL.html` | 507 | MANUAL.html says three commits unpushed; git reports seven (and four when the manual landed) |
| `A-27` | medium | `MANUAL.html` | 579 | MANUAL says the JUDGMENT CALL grep finds four entries; it finds seven hits, six real |
| `A-28` | medium | `STATUS.html` | 531 | STATUS.html says Yale is "25 years of allocations and returns"; the data has 21 and 26 |
| `A-29` | medium | `STATUS.html` | 635 | STATUS.html claims every figure cites "a specific document and page"; 253 of 607 cite a sour… |
| `A-30` | medium | `STATUS.html` | 686 | STATUS.html: Princeton "FY2005–FY2023, 2 gaps" — there is exactly one gap in that span |
| `A-31` | medium | `STATUS.html` | 723 | STATUS.html says five escalated decisions, renders six, two of which were not escalated up |
| `A-32` | medium | `STATUS.html` | 755 | "Six Harvard tables carry no date" — only five undated tables are curated |
| `A-33` | medium | `STATUS.html` | 767 | STATUS.html implies negative allocation weights are stored; zero exist in any school file |

### WP5 — Close the validator coverage gap — code, not prose

The only findings that touch executable code. Neither changes validator *behaviour*: one makes an existing test discriminating, the other adds the negative cases whose absence four documents currently misdescribe. The validator itself is correct — it is the claim about its test coverage that is false.

**File:** [`WP5-validator.md`](WP5-validator.md) · **1 work order** · backlog: `B-28`, `B-29`, `B-30`, `B-31`, `B-32`, `B-33`, `B-34`, `B-35`, `B-36`

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-34` | medium | `scripts/verify-seed-validator.ts` | 166 | verify case 13 is vacuous — it passes with the rule it names deleted |

### WP6 — Regenerate the structure snapshot, last

`STRUCTURE.md` is a snapshot of the file tree. This audit adds `conduct/audits/` (and WP1 adds `conduct/rulings/`), so regenerating before the other packages land produces a snapshot that is stale on arrival. The regeneration recipe is in `STRUCTURE.md:189-225`.

**File:** [`WP6-structure.md`](WP6-structure.md) · **3 work orders** · backlog: `B-37`

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-35` | medium | `STRUCTURE.md` | 123 | STRUCTURE.md calls all 5 public/ SVGs unreferenced; two are referenced by src/app/page.tsx |
| `A-36` | medium | `STRUCTURE.md` | 152 | STRUCTURE.md "Three groupings" App row is 19; actual is 20, and the rows do not sum to the s… |
| `A-37` | medium | `STRUCTURE.txt` | 183 | STRUCTURE.txt and STRUCTURE.pdf corrupt the tsconfig glob: **/*.ts rendered as /*.ts** |

---

## 3. What this audit did not cover

Stated plainly so the next session knows the edges:

- **No live database was touched.** The schema was audited by reading it against the JSON shapes; no seed was run with `--write`, and no connection was opened.
- **No external URL was fetched to re-verify a citation's content**, with one exception: the Harvard FY2002 University Financial Report was re-fetched and its five-year table re-extracted while establishing `A-13`. Citation *resolution* was checked exhaustively; citation *truthfulness* was spot-checked on ~8 sources.
- **The 37 backlog items were not refutation-tested.** Two dimensions produced 18 and 19 findings; only their top 7 each went through a verifier, so their tails are over-represented in `BACKLOG.md`. Treat those as leads, not established defects.
- **Phases 2–6 of the product do not exist yet**, so there was nothing to audit there. Two routes exist, both scaffold.

---

## 4. When the fix pass is done

```bash
./conduct/audits/2026-07-31/verify.sh    # every count these documents assert
npx tsc --noEmit
npm run lint
npm run build
npm run seed:dry
npm run seed:verify
git status --porcelain
```

Then log the pass in the `TASKS.md` build log the way the ledger already logs integrations, and regenerate `STRUCTURE.md` / `.txt` / `.pdf` (WP6) so the snapshot includes `conduct/audits/` and `conduct/rulings/`.

**Do not push.** `CONSTITUTION.md` Part 2 §2 reserves outward-facing actions to the human, and both operator documents treat `git push` as human-only. At audit time the branch was 7 commits ahead of `origin/main`; the human has since pushed, so `origin/main` == `HEAD` == `449aeca` and the remediation commits will again accumulate locally. Re-derive the count, never quote one — that is `A-26`, and it drifted twice during the audit itself.

---

## 5. Files in this audit

| File | What it holds |
|---|---|
| `README.md` | this document — verdict, plan, index |
| `WP1-ledger.md` | 2 orders — the root errors in the source of truth |
| `WP2-governance.md` | 11 orders — constitution, kernel, skills, quick card |
| `WP3-data-methodology.md` | 3 orders — `data/README.md` provenance narrative |
| `WP4a-conduct-design.md` | 5 orders — the design doc still reads as an unsigned draft |
| `WP4b-status.md` | 8 orders — the most drifted document in the repo |
| `WP4c-manual.md` | 4 orders — counts embedded in operator procedure |
| `WP5-validator.md` | 1 order — make a vacuous test discriminating |
| `WP6-structure.md` | 3 orders — regenerate the snapshot last |
| `BACKLOG.md` | 37 low-severity sites, not refutation-tested |
| `REFUTED.md` | 24 claims that failed verification — do not re-open |
| `VERIFIED-CLEAN.md` | what was checked and found correct — do not re-audit |
| `verify.sh` | recomputes every count these documents assert |
| `evidence/ruling-pool-basis.md` | the rescued pool-basis ruling — see WP0 |

**Reproduce this audit:** the workflow script is preserved at
`~/.claude/projects/-Users-amayb-Projects-dashboardProject/04f0b17e-7c31-4c52-ab47-87c69f81f6d8/workflows/scripts/audit-dashboard-project-30-31jul-wf_edeb2a06-5c5.js`, and the 65 agent transcripts plus `journal.jsonl` at `~/.claude/projects/-Users-amayb/04f0b17e-7c31-4c52-ab47-87c69f81f6d8/subagents/workflows/wf_edeb2a06-5c5/`. Both are session-scoped and outside git — treat them as expiring.
