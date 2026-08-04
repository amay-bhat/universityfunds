# WP2 — Correct the governance layer — constitution, kernel, skills, quick card

11 work orders. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

The kernel, the constitution and the skills are what every future session reads *before acting*. A stale rule here is executed, not merely displayed. `A-10` is the sharp one: the constitution still mandates a field name the validator now rejects on 227 figures, so a session following Article 2 literally would write data that fails `npm run seed:dry`.

---

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

---

### A-03 · Conductor is defined as Opus-only but ran as Fable and is launched with no model check

| | |
|---|---|
| **Severity** | medium |
| **Location** | `.claude/skills/conduct/SKILL.md:8` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
7: 
8: You are the **conductor**: a stateless Opus scheduler over the project's work
9: ledger. You decompose, route, verify, integrate, and log. **You never
```

**What is wrong**

The conduct skill hard-codes the conductor's tier in its self-definition. The pilot's conductor was Fable, no document authorizes that, and the operator docs give a daily loop with no model precondition at all -- while the kernel bars sub-Sonnet sessions from autonomous mode. A Fable conductor also silently changes its escalation path (same-tier refuter instead of a senior), which no operator doc mentions.

**Fix**

Reword conduct/SKILL.md:8 to 'a stateless scheduler at Opus tier or above' and add a first-line precondition: resolve the declared model against the kernel tier table and refuse to run below Sonnet; add 'confirm the session model' to the pre-flight blocks in QUICKCARD.md:8-11 and MANUAL.html section 02.

**Verify**

```bash
sed -n "5,11p" .claude/skills/conduct/SKILL.md
```

---

### A-04 · routing.md both routes ledger-editing units up to Opus and calls them never routable

| | |
|---|---|
| **Severity** | medium |
| **Location** | `.claude/skills/conduct/references/routing.md:15` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
14: | Novel algorithms; performance-critical paths | Scoped research with a defined output schema |
15: | Anything that edits the ledger, plan, briefs, or rails themselves | Nth-of-its-kind, rails already built |
16:
```

**What is wrong**

The routing table's last row tells the conductor to route any unit that edits the ledger, plan, briefs or rails up to an Opus worker. Twenty-five lines later the same file says units that edit the ledger are structurally conductor-only and never routable at all.

**Fix**

Change routing.md:15 to name the properties without the ledger, e.g. 'Anything that edits rails (validators, templates) or defines precedent', and add a pointer to the conductor-lanes section for ledger/brief/plan edits.

**Verify**

```bash
sed -n "12,18p" .claude/skills/conduct/references/routing.md
```

---

### A-05 · routing rubric and design doc claim four escalations on the first school; replay says max two

| | |
|---|---|
| **Severity** | medium |
| **Location** | `.claude/skills/conduct/references/routing.md:25` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
24: schools became Sonnet-shaped because the intervening work built a hardened
25: validator, documented label mappings, and precedent rulings for every known
26: fork. **Route every unit on its own properties anyway** — an Nth-of-kind unit
```

**What is wrong**

Three doc locations attribute all four of the repo's pre-adoption escalations to the curation of ONE school (Yale, task 1.3), when the ledger shows Yale's curation produced one directly (at most two). The ledger's four `[PROXY DECISION]` escalations distribute as: task 1.3/1.4 -> 1 (Yale FY2021-FY2025 coverage, TASKS.md:176 "Closes the open decision from task 1.3"); task 1.5 -> 2 (Harvard granularity/basis, TASKS.md:151 "Unblocks task 1.5"; Harvard undated tables, TASKS.md:142, labelled "Third escalation" at :149); and one out-of-band during seed-validator hardening (negative allocation weights, TASKS.md:198, which TASKS.md:190 explicitly calls "out-of-band: a code scan of the whole repo, not a numbered task", though it "Settles the open question flagged in task 1.3"). GOLDEN-REPLAY.md's per-case attributions agree exactly (Case 1 "Logged under task 1.3/1.4", Case 2 "Task 1.5 groundwork", Case 3 "Task 1.5", Case 4 validator hardening), so GOLDEN-REPLAY.md:93's "max observed was two escalations in one task (1.5)" is the CORRECT number and the four-on-Yale claim is the wrong one.

The conflation is visible inside CONDUCT-DESIGN.html itself: line 599 correctly states the unattributed total ("Four formal escalations logged in full; the senior materially changed three"), and line 604 then re-attributes that same total to a single school ("first school curated with four escalations"). Line 487 does the same and then, in its very next clause, assigns two of those four to a different bucket: "curating the first school (Yale) was Opus-grade -- novel sourcing, category normalization, four escalations. Curating the last three is now largely Sonnet-grade because the intervening work built the rails: ... precedent rulings for every known fork (negative weights, undated tables ...)" -- negative weights and undated tables ARE escalations 4 and 3, credited to "intervening work" in the same sentence that counts them under Yale. No reading rescues the number: TASKS.md:131 defines "escalation" precisely as a logged `[PROXY DECISION]` and explicitly excludes "unescalated small calls" tagged `[JUDGMENT CALL]`, and `grep -c "PROXY DECISION" TASKS.md` returns 8 hits = 5 real entries (4 pre-adoption + 1 pilot pool-basis) plus 3 prose mentions.

Corrections to the original finding: (1) the citation is routing.md:22-23, not routing.md:25 -- the quoted text sits two lines above where the auditor placed it; (2) the impact is overstated. "The single empirical claim that justifies the routing rubric's up/down split" is not accurate -- the split is carried by the properties table at routing.md:8-15 ("First-of-its-kind work", "An exemplar exists in the repo -- the strongest single predictor"), and routing.md:22 expressly frames the pilot sentence as an "illustration of the *mechanism* (not a verdict on any live unit)". A conductor's up-route heuristic is "first-of-its-kind", not the escalation count, so no routing decision changes. […]

**Evidence as filed**

```text
routing.md:25-26: 'curating the first school was Opus-grade (novel sourcing, four escalations)'. CONDUCT-DESIGN.html:487: 'Proof from the pilot repo: curating the first school (Yale) was Opus-grade -- novel sourcing, category normalization, four escalations.' CONDUCT-DESIGN.html:604: 'first school curated with four escalations'. GOLDEN-REPLAY.md:93-95: '**Storm brake:** max observed was two escalations in one task (1.5) -- the >=3 brake would not have fired on any historical task. Correctly calibrated against known-good behavior.' Ledger attribution of the four pre-adoption rulings: TASKS.md:176 'Yale FY2021-FY2025 allocation coverage ... Closes the open decision from task 1.3'; TASKS.md:198 'Negative allocation weights ... Settles the open question flagged in task 1.3'; TASKS.md:151 'Harvard discloses at a different granularity ... Unblocks task 1.5'; TASKS.md:142 'Harvard's undated allocation tables' (task 1.5). escalate/SKILL.md:88: 'Third escalation inside one task -> the task spec is the problem.'
```

**Independent reproduction by the refuting auditor**

```text
Commands run and literal output (all paths absolute under /Users/amayb/Projects/dashboardProject):

$ git log --oneline a2eb063~1..HEAD
00a08ec, ae6322c, df3f299, 722e0c6, 5de914f, d1920ec, a2eb063

.claude/skills/conduct/references/routing.md lines 19-30 (read via `grep -n ""`):
  19: The conductor's highest-leverage activity is spending Opus tokens on **rails**
  21: convert the next N units into Sonnet work. Pilot-repo illustration of the
  22: *mechanism* (not a verdict on any live unit): curating the first school was
  23: Opus-grade (novel sourcing, four escalations); the *routine parts* of later
  24: schools became Sonnet-shaped because the intervening work built a hardened
  25: validator, documented label mappings, and precedent rulings for every known
  (NB: the auditor cited :25 -- the claim is actually on :22-23.)
routing.md:8-15 is the up/down properties table ("First-of-its-kind work" / "An exemplar exists in the repo -- the strongest single predictor").

CONDUCT-DESIGN.html:487: "Proof from the pilot repo: curating the first school (Yale) was Opus-grade — novel sourcing, category normalization, four escalations. […]
```

**Why it matters** — The single empirical claim that justifies the routing rubric's up/down split is inconsistent with the acceptance artifact that certified the storm brake. Either the rubric is calibrated on a miscounted history, or the storm-brake calibration is wrong -- and a conductor reading routing.md will apply an up-route heuristic backed by a number the ledger does not support.

**Fix**

Correct routing.md:25 and CONDUCT-DESIGN.html:487,604 to the ledger's actual attribution (two rulings arising from task 1.3/1.4, two from task 1.5), or state 'four escalations across the first-school phase' if that is what was meant, and reconcile with GOLDEN-REPLAY.md:93.

**Verify**

```bash
sed -n "22,28p" .claude/skills/conduct/references/routing.md
```

---

### A-06 · Phase-2 reveal requires SendMessage to a live agent no document explains how to create

| | |
|---|---|
| **Severity** | medium |
| **Location** | `.claude/skills/escalate/SKILL.md:57` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
56: When the senior returns its preliminary ruling, send the **Phase-2 reveal**
57: (SendMessage to the same agent): your recommendation and full reasoning,
58: explicitly labelled as not-a-conclusion. The senior attacks your
```

**What is wrong**

The two-phase protocol's anti-anchoring mechanism depends on sending a second message to the same senior agent. No governance document names the tool or agent type that produces an addressable, still-running agent; the framework's only spawn recipe is a one-shot Agent() call, and it sits inside the section CONSTITUTION.md itself declares superseded.

**Fix**

Name the mechanism in escalate/SKILL.md Step 2: the exact tool that creates a persistent addressable agent, the tool that messages it, and a documented fallback (e.g. re-spawn with Phase-1 transcript attached, logged as phase-delta unmeasurable) for when persistence is unavailable.

**Verify**

```bash
sed -n "54,60p" .claude/skills/escalate/SKILL.md
```

---

### A-07 · The ratification-rate health metric is stated over four different denominators

| | |
|---|---|
| **Severity** | medium |
| **Location** | `.claude/skills/escalate/SKILL.md:105` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
104: these entries: near 100% means the check is decorative; the pilot baseline is
105: ~25%. Data-integrity questions additionally log full reasoning and the named
106: location of any user-visible caveat.
```

**What is wrong**

Ratification rate is declared the system's single health metric, but its baseline is quoted with four different values across four governance documents, and the skill attributes the golden replay's retro-scored figure to the pilot -- which logged one formal escalation, outcome modified, i.e. 0%.

**Fix**

State the denominator with the figure everywhere: 'golden-replay baseline 1/4 = 25% (pre-adoption, paper); live baseline 1/5 = 20% across logged rulings; pilot proper 0/1' -- and have MANUAL and CONDUCT-DESIGN cite the same three.

**Verify**

```bash
sed -n "102,108p" .claude/skills/escalate/SKILL.md
```

---

### A-08 · No tie-break when the top tier's same-tier refuter disagrees and both views are constitutional

| | |
|---|---|
| **Severity** | medium |
| **Location** | `.claude/skills/escalate/references/brief.md:91` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
90: | Breaks an article | Do NOT implement. Escalate to the next tier with both positions and the specific objection. At the top tier → human. |
91: | Both constitutional, tiers disagree | The senior's ruling governs. Record the dissent — a losing argument that turns out right is worth having on the record. |
92: | Senior errors / times out / tier unavailable | Next tier up; if none, human. |
```

**What is wrong**

The outcomes table resolves a constitutional disagreement by giving the senior's ruling precedence. At the top tier the kernel replaces the senior with a fresh-context same-tier refuter, which by definition is not a senior -- so a disagreement between a Fable requester and its Fable refuter, both constitutional, has no defined resolution. Every other no-answer path is defined.

**Fix**

Add a top-tier row to the brief.md outcomes table: at top tier, a refuter that disagrees on a non-article matter escalates to the human as a scope/judgment interrupt, with both positions attached -- or state explicitly that the requester's position governs with a mandatory [DISSENT] entry.

**Verify**

```bash
sed -n "88,94p" .claude/skills/escalate/references/brief.md
```

---

### A-09 · CLAUDE.md caps a session at one task while conduct run and until modes span many

| | |
|---|---|
| **Severity** | medium |
| **Location** | `CLAUDE.md:15` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
14: - This project uses a **docs-conduct workflow**: no conversation history carries between sessions. These files are the only memory. Keep them true: check off finished tasks, append to the Build log in `TASKS.md`.
15: - One task per session (unless trivially small).
16: - **Don't stop to ask a question — escalate it.** Reserved matters (kernel Part 2) go straight to the human. Everything else that clears the escalation floor runs through the `escalate` skill (`.claude/skills/escalate/` — two-phase blind ruling one tier up); log every proxied decision per `CONSTITUTION.md` Part 4. Work under a conductor routes spec questions to the conductor an …
```

**What is wrong**

CLAUDE.md limits a session to one task and its parallel-work carve-out covers only fan-out, not sequential multi-task runs. The conduct skill's default mode and its until-gate mode both run task after task until a gate or budget exhaustion, and MANUAL advertises exactly that.

**Fix**

Extend the CLAUDE.md:17 carve-out: 'One task per session stands for solo sessions; a conductor session may run multiple tasks sequentially until a gate, a reserved interrupt, or budget exhaustion.'

**Verify**

```bash
sed -n "12,18p" CLAUDE.md
```

---

### A-10 · CONSTITUTION.md Article 2 still mandates a `sourceId` field the validator now rejects on 227 of the repo's figures

| | |
|---|---|
| **Severity** | medium |
| **Location** | `CONSTITUTION.md:17` |
| **Found by** | 1 independent auditor — `cross-dimension` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
16: 
17: **Article 2 — No number without a citation.** Every figure in `data/` carries a `sourceId` resolving to `sources.json`. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from.
18:
```

**What is wrong**

The citation-split rail change landed in commit d1920ec: `endowment_returns` rows now carry `returnSourceId` and `marketValueSourceId`, and a bare `sourceId` on such a row is a hard validation error. That change propagated to the schema (`src/lib/db/schema.ts:66-75`), the validator (`ENDOWMENT_RETURN_KEYS`, seed-validate.ts:190-196), all five school files, data/README.md:7, and TASKS.md — but not to CONSTITUTION.md Article 2, which still states the rule in terms of the obsolete field name. The same commit d1920ec *did* edit CONSTITUTION.md (it inserted the Part 3 adoption note at lines 55-58), and `git diff a2eb063~1 HEAD -- CONSTITUTION.md | grep -c 'Article 2'` returns 0, so Article 2 was left untouched across the whole window. conduct/ADOPTION.md's staged edit list covers CONSTITUTION Part 3, CLAUDE.md x2 and TASKS.md — not Article 2.

**Evidence as filed**

```text
CONSTITUTION.md:17: "**Article 2 - No number without a citation.** Every figure in `data/` carries a `sourceId` resolving to `sources.json`."
scripts/lib/seed-validate.ts:190-196: `const ENDOWMENT_RETURN_KEYS = ["fiscalYear", "returnPct", "returnSourceId", "marketValueUsdMillions", "marketValueSourceId"] as const;` — no `sourceId`.
Empirical probe (temp copy of data/, one `sourceId` added to yale.json endowmentReturns[0]): `npx tsx scripts/seed.ts --dry-run --data-dir <copy>` -> "1 validation error(s) - nothing was written: schools/yale.json endowmentReturns[0]: unknown field `sourceId` (allowed: fiscalYear, returnPct, returnSourceId, marketValueUsdMillions, marketValueSourceId)"
Count of affected figures (python over data/schools/*.json): 102 `returnPct` + 125 `marketValueUsdMillions` = 227 figures carrying no field named `sourceId`.
data/README.md:7: "**`returnSourceId` and `marketValueSourceId`** on endowment-return rows, one per figure (a bare `sourceId` on a return row is a hard validation error)."
```

**Why it matters** — The constitutional article that the project treats as the non-negotiable citation rail describes a data shape that the validator now refuses. 227 of the repo's ~706 curated figures (32%) satisfy the rule's substance while contradicting its letter. Every `[PROXY DECISION]` article check tests against this text — the pool-basis ruling's own check reads 'A2 clears - every row cited; evidence cited' — so a future ruling that reads Article 2 literally would either mis-certify or wrongly flag the return rows. It also cuts the other way: a curator following Article 2 literally on a new school's return rows produces a file that fails `seed:dry`. Not caught by the 722e0c6 'correct four docs against verified state' pass (which touched CLAUDE.md but not CONSTITUTION.md) and not listed in STRUCTURE.md:168-185 or TASKS.md:253.

**Fix**

Amend CONSTITUTION.md:17 to the post-split shape: 'Every figure in `data/` carries its own citation resolving to `sources.json` — `sourceId` on allocations, benchmark returns and proxy mappings; `returnSourceId` and `marketValueSourceId` one per figure on endowment-return rows.' Same one-line treatment applied to CLAUDE.md:32's `source_id` shorthand if precision is wanted there.

**Verify**

```bash
grep -n "sourceId" CONSTITUTION.md   # must describe the split citation columns
```

---

### A-11 · GOLDEN-REPLAY claims "Zero regressions" / "fire at the right floor" but never tested the one direction the floor changed

| | |
|---|---|
| **Severity** | medium |
| **Location** | `conduct/GOLDEN-REPLAY.md:10` |
| **Found by** | 1 independent auditor — `adoption-replay` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
9: 
10: **Verdict up front: 4/4 reproduce. Zero regressions. Two mechanical
11: improvements and one honestly-documented residual risk.**
```

**What is wrong**

GOLDEN-REPLAY.md's acceptance verdict is one-sided and does not name its own coverage gap. The same commit (a2eb063) that shipped the replay also shipped a floor whose logical form differs from the one in force during the four replayed decisions: CONSTITUTION.md:62 is a conjunction ("different readings would lead to materially different work **and** the choice would be expensive to unwind"), while kernel.md:102-105 is "Escalate iff at least two of: (a)... (b)... (c) the question touches a kernel or project article" — i.e. (a)&(b) plus two new triggering combinations, (a)&(c) and (b)&(c). The replay exercises only the four decisions that already escalated, where the floor cannot fail in either form. Three pre-existing below-floor `[JUDGMENT CALL]` entries sat in the same log (a2eb063:TASKS.md lines 136, 164, 189) and are not replayed, not mentioned, and not named as out of scope; one of them (line 164, now TASKS.md:166) records its non-escalation rationale as solely the absence of property (b) — "Reversible by re-seeding, so decided rather than escalated (Constitution Part 3 Step 0)" — which was dispositive under the conjunction and is not dispositive under 2-of-3. The file nonetheless states "Zero regressions" (:10) and "fire at the right floor" (:126-127), and its "Residual risk (documented, not resolved)" section (:111-121) names only the senior-preliminary anchor. Repo-wide grep finds no document — GOLDEN-REPLAY.md, ADOPTION.md, CONSTITUTION.md, CONDUCT-DESIGN.html — that identifies the floor's change in logical form or the untested direction. The kernel's own K3 (kernel.md:34-35, "No silent interpolation, carry-forward, or plausible filler — in data, docs, or test coverage") and its own named failure mode (kernel.md:113, "A protocol that fires on trivia is slower and costlier than just asking") are exactly what went unexercised.

Two parts of the original finding I could not sustain and dropped:
1. "the kernel as written now fires where history did not" is asserted as fact but is an interpretive inference, not something I can verify. Whether a ticker choice satisfies (a) "materially different work" and (c) "touches an article" is a judgment; the honest statement is that TASKS.md:166 is *plausibly* pushed above the floor and was never tested, not that it demonstrably misfires.
2. "Zero regressions" is not materially false as written. The file scopes itself in its opening paragraph (:3-8, "replayed against the four escalations already logged in TASKS.md"), and CONDUCT-DESIGN.html:552 pre-specified the acceptance test as exactly that — "the four historically-logged escalations re-run through the new protocol on paper". […]

**Evidence as filed**

```text
Old floor, CONSTITUTION.md:62 — "Escalate only when **different readings would lead to materially different work** and the choice would be expensive to unwind."  New floor, kernel.md:102-105 — "**Escalate iff at least two of:** **(a)** different answers produce materially different work; **(b)** the wrong answer is expensive to unwind; **(c)** the question touches a kernel or project article."  GOLDEN-REPLAY.md:10-11 — "**Verdict up front: 4/4 reproduce. Zero regressions.**"  GOLDEN-REPLAY.md:126 — "...reproduce all four historical outcomes, strengthen two of them structurally, **fire at the right floor**..."  Excluded case, TASKS.md:166 — "**`[JUDGMENT CALL]` Instrument selection...** `VBMFX` not BND (BND starts 2007)... Used `^SP500TR` rather than `^GSPC` because ... price-only would understate by roughly 2pp/year, which would have quietly flattered every copycat comparison." and its stated reason for not escalating: "**Reversible by re-seeding, so decided rather than escalated (Constitution Part 3 Step 0).**"  `grep -niE 'judgment|below the floor|floor chang|2 of 3' conduct/GOLDEN-REPLAY.md` returns no hit on any below-floor case or on the floor's redefinition. `git show a2eb063:TASKS.md | grep -c 'JUDGMENT CALL'` = 4 (3 real entries at lines 136/164/189 plus one definitional mention).
```

**Independent reproduction by the refuting auditor**

```text
1) conduct/GOLDEN-REPLAY.md read in full (128 lines). :10-11 "**Verdict up front: 4/4 reproduce. Zero regressions. Two mechanical improvements and one honestly-documented residual risk.**"  :3-8 "replayed against the four escalations already logged in `TASKS.md`, which serve as golden test cases: for each, would the new protocol have (1) fired at the right time..."  :20-22 Case 1 "**Floor:** clears all three properties — materially different product (gapped vs. derived series), expensive to unwind ..., touches Articles 2/4/5."  :58 "**Floor:** clears all three. ✓"  :91-100 Cross-cutting checks = storm brake, ratification rate, registers only.  :111-121 "## Residual risk (documented, not resolved)" = senior-preliminary anchor only.  :125-128 "**Phase A acceptance: PASS.** Kernel 1.0.0-rc1 and the escalate skill reproduce all four historical outcomes, strengthen two of them structurally, fire at the right floor, route reserved matters identically..."

2) `grep -niE 'judgment|below the floor|floor chang|2 of 3|two of|widen|false positive|conjunct' conduct/GOLDEN-REPLAY.md` →
108:2. **Anchors removed at the moment of first judgment.** Case 4's numeric
126:reproduce all four historical outcomes, strengthen two of them structurally,
(no hit on any below-floor case or on the floor's redefinition)

3) `grep -n 'Escalate' CONSTITUTION.md` → 62: "Escalate only when **different readings would lead to materially different work** and the choice would be expensive to unwind. […]
```

**Why it matters** — The acceptance test that justified adopting the kernel validated the floor only on inputs that cannot fail it. On TASKS.md:166's own recorded properties — materially different work present (BND would truncate 7 fiscal years of the benchmark series; ^GSPC would shift 26 years by ~2pp/yr), cheap to unwind absent by its own words, and Article-4 honesty engaged by its own reasoning — the kernel as written now fires where history did not, and kernel Part 4's "obvious from the docs" carve-out does not cover it (nothing in the docs specified instruments). "Zero regressions" is therefore unsupported as stated, and the framework's own warning that "a protocol that fires on trivia is slower and costlier than just asking" (kernel.md:111-114) is exactly the failure mode left untested.

**Fix**

Add a no-fire arm to the replay: for each of the three historical `[JUDGMENT CALL]`s (TASKS.md:138, 166, 191), state (a)/(b)/(c) explicitly and whether the 2-of-3 floor fires; adjudicate each new firing as bug or improvement as the design doc requires. Either restate the verdict as "4/4 reproduce among escalations; N of 3 below-floor calls would now fire", or drop the unqualified "Zero regressions" and "fire at the right floor" claims.

**Verify**

```bash
sed -n "7,13p" conduct/GOLDEN-REPLAY.md
```

---

### A-12 · The gates-are-not-escalatable rule is absent from every file a session is told to read first

| | |
|---|---|
| **Severity** | medium |
| **Location** | `conduct/QUICKCARD.md:70` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
69: | You want to know what was decided for you | `grep -n "\[PROXY DECISION\]" TASKS.md` — 8 hits, 5 are real rulings (the rest are the tag definition, a task line, a replay note). Also `\[JUDGMENT CALL\]`, `\[HITL\]`, `\[DISSENT\]`. |
70: | A session's instructions look thin | Its auto-loaded context can be a cached pre-adoption copy with no governance in it. Open every session with: *read `CONSTITUTION.md` and `.claude/skills/escalate/references/kernel.md` first*. |
71:
```

**What is wrong**

Checkpoints being non-escalatable review gates is stated only in CLAUDE.md and the conduct skill. It appears nowhere in CONSTITUTION.md, kernel.md, escalate/SKILL.md or brief.md -- and QUICKCARD instructs every session to open by reading precisely the two files that lack it, specifically because CLAUDE.md may be a stale cached copy.

**Fix**

Add one line to kernel Part 4 (or escalate/SKILL.md Step 0) alongside the reserved gate: 'A checkpoint or gate in the ledger is a human review point, not a question; it never enters the chain.'

**Verify**

```bash
sed -n "67,73p" conduct/QUICKCARD.md
```

---

### A-13 · QUICKCARD's reserved list drops third-party messaging and data-licensing clauses

| | |
|---|---|
| **Severity** | medium |
| **Location** | `conduct/QUICKCARD.md:74` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
73: 
74: Money (incl. licensing a paywalled index — relevant to 1.7) · `git push --force`
75: or history rewrite · deleting branches, repos, or production data · making
```

**What is wrong**

The quick card presents itself as the closed reserved list for the operator, but its condensation of kernel item 2 omits sending email or messages to third parties and posting to external services, and its condensation of item 4 narrows 'legal and compliance posture' to disclaimer wording, dropping data licensing and redistribution rights.

**Fix**

Restore both clauses to QUICKCARD.md:74-79: add 'sending email or messaging third parties / posting to external services' to the outward-facing item, and widen 'legal/disclaimer wording' to 'legal posture: disclaimers, terms, data licensing and redistribution'.

**Verify**

```bash
sed -n "71,77p" conduct/QUICKCARD.md
```

---
