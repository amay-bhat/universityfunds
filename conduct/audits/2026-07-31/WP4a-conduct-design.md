# WP4a — Re-render `CONDUCT-DESIGN.html` from the corrected ledger

5 work orders. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

The framework design document. Its defects are not stale counts — the page still describes the kernel as an unsigned draft awaiting a signature it received on 30 July 2026, and still names Phase A as the next step after Phases A–D were accepted.

All three HTML files are renderings, by the repo's own definition. Once WP1–WP3 land they can be corrected against a ledger that is actually true. This is the largest package (17 orders) and the least subtle: most are counts that drifted from the ledger, plus one document that still describes the framework as an unsigned draft.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-17` | high | `CONDUCT-DESIGN.html` | 281 | CONDUCT-DESIGN.html still says the kernel is unsigned and Phase A un-started; it was adopted… |
| `A-18` | high | `CONDUCT-DESIGN.html` | 627 | CONDUCT-DESIGN.html still presents the framework as an unsigned draft with Phase A not start… |
| `A-22` | medium | `CONDUCT-DESIGN.html` | 487 | CONDUCT-DESIGN attributes "four escalations" to curating Yale; only two of the four came fro… |
| `A-23` | medium | `CONDUCT-DESIGN.html` | 599 | CONDUCT-DESIGN says four escalations / three-of-four modified; MANUAL says five rulings — ac… |
| `A-24` | medium | `CONDUCT-DESIGN.html` | 604 | CONDUCT-DESIGN.html says the first school was curated "with four escalations", contradicting… |

---

### A-17 · CONDUCT-DESIGN.html still says the kernel is unsigned and Phase A un-started; it was adopted 30 Jul

| | |
|---|---|
| **Severity** | high |
| **Location** | `CONDUCT-DESIGN.html:281` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
280: <header>
281:   <div class="draft-banner">Draft — binds nothing until the human signs the Kernel</div>
282:   <h1>Conduct</h1>
```

**What is wrong**

CONDUCT-DESIGN.html (working tree == HEAD 00a08ec, tree clean) still presents the Conduct framework as an unadopted draft with Phase A not yet started, in five places: line 5-7 (HTML comment "Status: DRAFT — the Kernel binds nothing until the human signs it"), line 281 (`<div class="draft-banner">Draft — binds nothing until the human signs the Kernel</div>`), line 288 (`<span>kernel-version: 0.1-draft</span>`), line 625 (empty `Signed:` / `Date:` signature lines), and line 627 ("Status: draft for review. Next concrete step on the owner's word: Phase A — write the kernel and escalate skill, run the golden replay, present for signature."). All five are false about the repo at HEAD: the kernel is stamped `kernel-version: 1.0.0 / status: ADOPTED / signed-by: Amay Bhatnagar / signed-date: 2026-07-30` (.claude/skills/escalate/references/kernel.md:4-7); conduct/ADOPTION.md:86-91 records the package "Applied 2026-07-30 ... verbatim. The kernel stamp is now 1.0.0 / ADOPTED"; the binding edits actually landed (CONSTITUTION.md:56 now points at ".claude/skills/escalate/ (two-phase blind ruling; kernel v1.0.0)" and CLAUDE.md:16 routes all non-reserved escalations through the skill), so sessions ARE bound; and TASKS.md:231 logs "[HITL] Kernel v1.0.0 signed and adopted". Build-plan Phases A-D (CONDUCT-DESIGN.html:552-558) are all complete: Phase A golden replay 4/4 PASS (TASKS.md:225, conduct/GOLDEN-REPLAY.md:10 "Verdict up front: 4/4 reproduce. Zero regressions."), Phase B cold-start conductor test PASS (TASKS.md:226), Phase C decision plane live — a real escalation ran two-phase with telemetry populated (TASKS.md:240, `[PROXY DECISION]` pool-basis, "Telemetry: outcome modified; ~89k tokens Phase 1 + Phase 2"), Phase D pilot complete with validator green and QC clean (TASKS.md:237 "Task 1.6 + 1.5 tail COMPLETE via the Conduct pilot ... seed:verify 30/30"). Two corroborating facts the original finding did not cite: (1) `git log -- CONDUCT-DESIGN.html` shows the file has exactly ONE commit, a2eb063 ("kernel (staged)"), where the draft banner was accurate, and it was never touched again — commit 722e0c6 "correct four docs against verified state" touched CLAUDE.md, MANUAL.html, STATUS.html, TASKS.md, conduct/QUICKCARD.md, data/README.md and skipped this one; (2) MANUAL.html:205, written in that very commit, kickers "Operator manual · Conduct v1.0.0", so two of the four renderings ship contradictory version stamps (v1.0.0 vs 0.1-draft) in the same repo at the same HEAD. […]

**Evidence as filed**

```text
CONDUCT-DESIGN.html:281  <div class="draft-banner">Draft — binds nothing until the human signs the Kernel</div>
CONDUCT-DESIGN.html:288    <span>kernel-version: 0.1-draft</span>
CONDUCT-DESIGN.html:625    Signed: <span class="sig-line">&nbsp;</span> Date: <span class="sig-line" ...>
CONDUCT-DESIGN.html:627  <p><strong>Status:</strong> draft for review. Next concrete step on the owner's word: Phase A — write the kernel and <code>escalate</code> skill, run the golden replay, present for signature.

Contradicted by:
.claude/skills/escalate/references/kernel.md:4-7
  kernel-version: 1.0.0
  status: ADOPTED
  signed-by: Amay Bhatnagar (explicit in-session approval)
  signed-date: 2026-07-30
conduct/ADOPTION.md:86-87
  signed-by:   Amay Bhatnagar (explicit in-session approval, all four edits + kernel)
  signed-date: 2026-07-30
conduct/GOLDEN-REPLAY.md:10  **Verdict up front: 4/4 reproduce. Zero regressions.
TASKS.md:231  **2026-07-30 — [HITL] Kernel v1.0.0 signed and adopted; ... pilot launched.
```

**Independent reproduction by the refuting auditor**

```text
git status --porcelain --untracked-files=all -> (empty); git rev-parse --short HEAD -> 00a08ec

grep -n 'draft-banner|kernel-version|Signed:|<strong>Status:</strong>|Drafted 30 July' CONDUCT-DESIGN.html ->
  77:  .draft-banner {
  281:  <div class="draft-banner">Draft — binds nothing until the human signs the Kernel</div>
  285:    <span>Drafted 30 July 2026</span>
  288:    <span>kernel-version: 0.1-draft</span>
  625:    Signed: <span class="sig-line">&nbsp;</span> Date: <span class="sig-line" style="min-width:8rem">&nbsp;</span>
  627:  <p><strong>Status:</strong> draft for review. Next concrete step on the owner's word: Phase A — write the kernel and <code>escalate</code> skill, run the golden replay, present for signature.</p>

sed -n '1,12p' CONDUCT-DESIGN.html (lines 3-7) -> "<!-- Design document for the Conduct framework ... […]
```

**Why it matters** — A reader of the design document concludes the framework binds nothing and that no session is yet governed by it — the exact opposite of the repo's state, where every session is bound by an adopted kernel. STRUCTURE.md:160 asserts this document is regenerated 'when the framework changes'; the framework changed (draft -> v1.0.0 adopted, Phases A-D executed) and it was not regenerated.

**Fix**

Regenerate CONDUCT-DESIGN.html from TASKS.md: replace the draft banner with an adopted/signed banner, set kernel-version to 1.0.0, replace the blank signature block with the ADOPTION.md signature record (Amay Bhatnagar, 2026-07-30), and rewrite the closing 'next concrete step' to Phase E/F (Checkpoint review, then the user-scope install) since A-D are done.

**Verify**

```bash
grep -n "0.1-draft\|draft-banner\|draft for review" CONDUCT-DESIGN.html   # expect no hits after the fix
```

---

### A-18 · CONDUCT-DESIGN.html still presents the framework as an unsigned draft with Phase A not started

| | |
|---|---|
| **Severity** | high |
| **Location** | `CONDUCT-DESIGN.html:627` |
| **Found by** | 2 independent auditors — `framework-coherence`, `html-artifacts` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
626:   </div>
627:   <p><strong>Status:</strong> draft for review. Next concrete step on the owner's word: Phase A — write the kernel and <code>escalate</code> skill, run the golden replay, present for signature.</p>
628:   <p>Sources:</p>
```

**What is wrong**

CONDUCT-DESIGN.html carries four present-tense assertions that the Conduct kernel is an unsigned, non-binding draft and that Phase A has not been started. All four are false as of the audited HEAD (00a08ec):

- CONDUCT-DESIGN.html:281 — `<div class="draft-banner">Draft — binds nothing until the human signs the Kernel</div>`
- CONDUCT-DESIGN.html:288 — `<span>kernel-version: 0.1-draft</span>`
- CONDUCT-DESIGN.html:624-625 — `Kernel v1.0 binds only on human adoption (Part 2 §5 — including its birth).<br><br>` / `Signed: <span class="sig-line">&nbsp;</span> Date: <span class="sig-line" style="min-width:8rem">&nbsp;</span>` (empty signature block)
- CONDUCT-DESIGN.html:627 — `<p><strong>Status:</strong> draft for review. Next concrete step on the owner's word: Phase A — write the kernel and <code>escalate</code> skill, run the golden replay, present for signature.</p>`

Ground truth in the same commit range: `.claude/skills/escalate/references/kernel.md:4-7` reads `kernel-version: 1.0.0` / `status: ADOPTED` / `signed-by: Amay Bhatnagar (explicit in-session approval)` / `signed-date: 2026-07-30`; `conduct/ADOPTION.md:90-91` reads `**Applied 2026-07-30** by the Fable build session, same day, verbatim. The kernel stamp is now \`1.0.0 / ADOPTED\`.`; `TASKS.md:231` reads `**2026-07-30 — [HITL] Kernel v1.0.0 signed and adopted; citation-split rail change landed; pilot launched.**`; `conduct/GOLDEN-REPLAY.md:10` reads `**Verdict up front: 4/4 reproduce. Zero regressions.**`; `TASKS.md:237` reads `**2026-07-31 — Task 1.6 + 1.5 tail COMPLETE via the Conduct pilot.**`. Phases A (golden replay, TASKS.md:225), B (cold-start conductor test, TASKS.md:226), C (two-phase ruling live with telemetry, TASKS.md:240) and D (4-worker pilot with telemetry, TASKS.md:238/243) are all recorded complete.

The staleness is a plain omission, not an accepted debt. `git log --follow -- CONDUCT-DESIGN.html` returns exactly one commit (a2eb063); the 2026-07-31 correction pass (722e0c6) touched CLAUDE.md, MANUAL.html, STATUS.html, TASKS.md, conduct/QUICKCARD.md, data/README.md and named PRD.md as the one deliberate exception — CONDUCT-DESIGN.html is not mentioned. It is absent from STRUCTURE.md's "Structural notes worth carrying" (lines 168-185), from MANUAL.html's "Known debts and open holes" table (lines 768-777), and from the debt list at TASKS.md:253. conduct/ADOPTION.md stages four edits (CONSTITUTION.md, CLAUDE.md ×2, TASKS.md) plus the kernel stamp; none updates the design doc's banner or version stamp.

The project's own rule makes this a defect rather than a preference: STRUCTURE.md:160 says regenerate `CONDUCT-DESIGN.html` on "Framework changes", STRUCTURE.md:163-164 says "All four are **renderings**. […]

**Also reported at this site**

- _html-artifacts_ (high) — CONDUCT-DESIGN.html still renders as an unbuilt, unsigned draft five commits after the kernel shipped

  CONDUCT-DESIGN.html is stale in three places and, by the project's own stated rule, is therefore wrong. Verified verbatim:

- CONDUCT-DESIGN.html:281 `<div class="draft-banner">Draft — binds nothing until the human signs the Kernel</div>`
- CONDUCT-DESIGN.html:288 `<span>kernel-version: 0.1-draft</span>`
- CONDUCT-DESIGN.html:627 `<p><strong>Status:</strong> draft for review. Next concrete step on the owner's word: Phase A — write the kernel and <code>escalate</code> skill, run the golden replay, present for signature.</p>`

All three are false about the repo. […]


**Evidence as filed**

```text
CONDUCT-DESIGN.html:623-627: 'Kernel v1.0 binds only on human adoption (Part 2 sec 5 -- including its birth).<br><br> Signed: <span class="sig-line">&nbsp;</span> Date: ...' then '**Status:** draft for review. Next concrete step on the owner''s word: Phase A -- write the kernel and <code>escalate</code> skill, run the golden replay, present for signature.' Contradicted by kernel.md:4-8: 'kernel-version: 1.0.0 / status: ADOPTED / signed-by: Amay Bhatnagar (explicit in-session approval) / signed-date: 2026-07-30'; TASKS.md:231: '**2026-07-30 -- [HITL] Kernel v1.0.0 signed and adopted ... pilot launched.**'; GOLDEN-REPLAY.md:10 'Verdict up front: 4/4 reproduce.'; TASKS.md:237 'Task 1.6 + 1.5 tail COMPLETE via the Conduct pilot.' STRUCTURE.md:158-160 and MANUAL.html section 01 both declare the design doc a rendering: 'All four are **renderings**. `TASKS.md` is the source of truth; if a document disagrees with it, the document is stale.'
```

**Independent reproduction by the refuting auditor**

```text
$ git log --oneline a2eb063~1..HEAD
00a08ec Fix self-referential mangling in STRUCTURE conversion
ae6322c Fix STRUCTURE.pdf clipping: render landscape, record the recipe
df3f299 Add STRUCTURE reference snapshot in markdown, text and PDF
722e0c6 Add operator manual and quick card; correct four docs against verified state
5de914f Curate Stanford, MIT, Princeton + Harvard returns tail (tasks 1.5, 1.6)
d1920ec Adopt Conduct kernel v1.0.0; split endowment_returns citations per figure
a2eb063 Build Conduct framework Phases A-B: skills, kernel (staged), replay, pilot plan

$ git log --oneline --follow -- CONDUCT-DESIGN.html
a2eb063 Build Conduct framework Phases A-B: skills, kernel (staged), replay, pilot plan
  -> single commit; file never modified after creation. Its mtime is Jul 30 17:26.

$ git show --stat 722e0c6   (the "correct four docs against verified state" commit)
 CLAUDE.md | 2 +-  | MANUAL.html | 829 + | STATUS.html | 6 +- | TASKS.md | 11 +-
 conduct/QUICKCARD.md | 110 + | data/README.md | 43 +-
 commit body: "PRD.md deliberately untouched: its coverage promise disagrees with
 reality on purpose". […]
```

**Why it matters** — A reader of the design document concludes the kernel is unadopted and non-binding -- the exact opposite of the repo's state -- and the unsigned signature block invites a second signing of something already signed. Its Phase D description ('3 Sonnet workers ... 1 Opus sampler') also disagrees with the pilot actually run (TASKS.md:235: four workers, 1.6.B MIT routed to Opus).

**Fix**

Update the footer to 'Status: adopted; kernel v1.0.0 signed 2026-07-30 (see TASKS.md:231)', remove or fill the signature block, and mark Phases A-D complete with the pilot's actual worker roster.

**Verify**

```bash
grep -n "Phase A" CONDUCT-DESIGN.html
```

---

### A-22 · CONDUCT-DESIGN attributes "four escalations" to curating Yale; only two of the four came from Yale

| | |
|---|---|
| **Severity** | medium |
| **Location** | `CONDUCT-DESIGN.html:487` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
486:   <p class="pull">The Sonnet-shaped 80% is manufactured, not found. The conductor's highest-leverage activity is spending Opus tokens building rails — validators, templates, precedent decisions — that convert the next N tasks into Sonnet work.</p>
487:   <p>Proof from the pilot repo: curating the first school (Yale) was Opus-grade — novel sourcing, category normalization, four escalations. Curating the last three is now largely Sonnet-grade <em>because</em> the intervening work built the rails: a hardened validator that mechanically catches unit slips and typos, documented label mappings, and precedent rulings for every known …
488:
```

**What is wrong**

CONDUCT-DESIGN.html twice makes the rails argument by asserting the first school (Yale) was curated with four escalations. Of the four pre-pilot rulings in TASKS.md, two arose from Yale (the FY2021-FY2025 coverage question and negative allocation weights, both flagged under task 1.3) and two arose from Harvard under task 1.5 (granularity/target basis, and the undated-table dating).

**Fix**

Rewrite both sentences as 'the first two schools were curated with four escalations between them (two from Yale, two from Harvard)', which still supports the rails argument and matches the TASKS.md attributions.

**Verify**

```bash
sed -n "484,490p" CONDUCT-DESIGN.html
```

---

### A-23 · CONDUCT-DESIGN says four escalations / three-of-four modified; MANUAL says five rulings — actual is five

| | |
|---|---|
| **Severity** | medium |
| **Location** | `CONDUCT-DESIGN.html:599` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
598:   <ul>
599:     <li>Four formal escalations logged in full; the senior materially changed three (modified bounds; overturned an option on primary evidence; added the forward-run allowance). Ratification ≈ 25% — the mechanism earns its cost.</li>
600:     <li>The most valuable ruling (dating Harvard's undated tables) was won by <em>documents</em> — reconciliation against audited financials — not by seniority. Institutionalized as the evidence-diversity rule.</li>
```

**What is wrong**

CONDUCT-DESIGN.html's evidence base states 'Four formal escalations logged in full; the senior materially changed three ... Ratification ~= 25%' and its telemetry section states 'the senior materially changed three of four escalations'. MANUAL.html states 'Across the five rulings so far: one ratified with additions, two where the senior refuted the junior's premise ... and two modified' and 'Five rulings are settled'. TASKS.md contains five escalated rulings. The two documents publish the same health metric on different denominators, and CONDUCT-DESIGN's is one short.

**Fix**

Update CONDUCT-DESIGN.html:599 and :519 to five escalations with four materially changed (~20% ratification), folding in the 2026-07-31 pool-basis ruling recorded at TASKS.md:240, so it matches MANUAL.html §7.

**Verify**

```bash
sed -n "596,602p" CONDUCT-DESIGN.html
```

---

### A-24 · CONDUCT-DESIGN.html says the first school was curated "with four escalations", contradicting the storm-brake calibration

| | |
|---|---|
| **Severity** | medium |
| **Location** | `CONDUCT-DESIGN.html:604` |
| **Found by** | 1 independent auditor — `adoption-replay` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
603:     <li>A prose ledger carried a multi-week build across memory-less sessions and three model switches — the statelessness proof.</li>
604:     <li>Rails converted Opus-work into Sonnet-work: first school curated with four escalations; last three now routine because the validator, mappings, and precedents exist.</li>
605:   </ul>
```

**What is wrong**

CONDUCT-DESIGN.html attributes all four of the project's pre-pilot escalations to the curation of the first school in TWO places, and the repo's own log attributes at most one of them to that task.

Instance 1 — CONDUCT-DESIGN.html:487 (§9): "Proof from the pilot repo: curating the first school (Yale) was Opus-grade — novel sourcing, category normalization, four escalations. Curating the last three is now largely Sonnet-grade *because* the intervening work built the rails: … precedent rulings for every known fork (negative weights, undated tables, target-vs-actual bases)." This self-contradicts inside one sentence: the three rulings it names as "intervening work" after Yale are three of the same four escalations it just charged to Yale.

Instance 2 — CONDUCT-DESIGN.html:604 (§12, under the heading "From the pilot repo (observed, not hypothesized)" at line 603): "Rails converted Opus-work into Sonnet-work: first school curated with four escalations; last three now routine because the validator, mappings, and precedents exist."

Ground truth from the ledger: TASKS.md contains exactly four pre-pilot [PROXY DECISION] entries (lines 142, 151, 176, 198) spread across three work items, which conduct/GOLDEN-REPLAY.md attributes itself — line 17 "(Logged under task 1.3/1.4…)" = Yale coverage; line 37 "(Task 1.5 groundwork…)" = Harvard granularity; line 54 "(Task 1.5;…)" = Harvard undated tables; line 71 "(Validator hardening;…)" = negative weights. Task 1.3 (curate Yale — the first school, and a one-school task) carries one escalation directly; a second (negative weights, TASKS.md:198) settles a question flagged in 1.3 but is logged under the out-of-band validator-hardening entry. Maximum in any single task is two, in task 1.5 (Harvard).

Consequence: the statement contradicts GOLDEN-REPLAY.md:93-95, one of Phase A's three cross-cutting acceptance checks — "Storm brake: max observed was two escalations in one task (1.5) — the ≥3 brake would not have fired on any historical task. Correctly calibrated against known-good behavior. ✓" — against .claude/skills/escalate/SKILL.md:88, "Third escalation inside one task → the task spec is the problem." Read together the two documents give opposite answers to whether the brake would have fired on the first school's task.

Not a documented debt: CONDUCT-DESIGN.html was created in-range (git log -- CONDUCT-DESIGN.html shows only a2eb063), commit 722e0c6 ("correct four docs against verified state") did not touch it, and STRUCTURE.md's "Structural notes worth carrying" (lines 168-185) does not mention it. Severity medium rather than high: the correct total and the correct per-task attributions both exist elsewhere in the repo, no data row or published figure is affected, and no code or rendering consumes this bullet.

**Evidence as filed**

```text
CONDUCT-DESIGN.html:604 — "Rails converted Opus-work into Sonnet-work: **first school curated with four escalations**; last three now routine..."  The log's own attributions: TASKS.md:176 (Yale coverage) "Closes the open decision from task 1.3"; TASKS.md:151 (Harvard granularity) "Unblocks task 1.5 and pre-empts 1.6"; TASKS.md:142 (Harvard undated tables) "Task 1.5"; TASKS.md:198 (negative weights) "Settles the open question flagged in task 1.3", logged under the out-of-band validator-hardening entry. Maximum per task = 2. GOLDEN-REPLAY.md:93-95 — "**Storm brake:** max observed was two escalations in one task (1.5) — the ≥3 brake would not have fired on any historical task. Correctly calibrated against known-good behavior. ✓"  SKILL.md:88 — "Third escalation inside one task → the task spec is the problem."
```

**Independent reproduction by the refuting auditor**

```text
$ grep -cE '^\*\*[0-9]{4}-[0-9]{2}-[0-9]{2} — `\[PROXY DECISION\]`' TASKS.md
4

$ grep -nE '^\*\*[0-9]{4}-[0-9]{2}-[0-9]{2} — `\[PROXY DECISION\]`' TASKS.md
142:**2026-07-25 — `[PROXY DECISION]` Harvard's undated allocation tables. Answered by Fable; implemented by Opus. Resolved empiri…
151:**2026-07-24 — `[PROXY DECISION]` Harvard discloses at a different granularity and on a different basis. Answered by Fable; im…
176:**2026-07-24 — `[PROXY DECISION]` Yale FY2021–FY2025 allocation coverage. Answered by Fable; implemented by Opus. Closes the o…
198:**2026-07-24 — `[PROXY DECISION]` Negative allocation weights. Answered by Fable; implemented by Opus. Settles the open questi…

$ grep -n "1\.3\|1\.5\|1\.6\|task" conduct/GOLDEN-REPLAY.md
17:*(Logged under task 1.3/1.4; Opus → Fable; outcome: option A, leave the gap,
37:*(Task 1.5 groundwork; child leaned option C; Fable refuted C on primary
54:*(Task 1.5; child leaned "curate the two dated years, gap the six undated";
93:- **Storm brake:** max observed was two escalations in one task (1.5) — the
94:  ≥3 brake would not have fired on any historical task. […]
```

**Why it matters** — The §12 evidence base is explicitly headed "From the pilot repo (observed, not hypothesized)" (CONDUCT-DESIGN.html:546), so a false count sits in the section that carries the most evidentiary weight — and it is the same count that the storm brake was calibrated against. Read together, the two documents give contradictory answers to "would the brake have fired?", which is one of three cross-cutting acceptance checks.

**Fix**

Correct to the log: "Four formal escalations across the first two schools plus one out-of-band validator task; the first school (Yale, task 1.3) accounted for one to two of them."

**Verify**

```bash
sed -n "601,607p" CONDUCT-DESIGN.html
```

---
