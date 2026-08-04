# Audit backlog — lower-severity findings

37 sites from the same [31 July 2026 audit](README.md).

**These were not put through adversarial refutation.** They were either filed as low severity, or filed higher but fell below the per-dimension verification cut. Two dimensions (`framework-coherence`, `docs-vs-reality`) produced 18 and 19 findings respectively and only their top 7 each were verified, so their tails are over-represented here.

**Treat each as a lead to check, not an established defect.** Verify before fixing — the refutation rate on the tested population was 24 in 63, and there is no reason to think this set is cleaner.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `B-01` | low | `TASKS.md` | 164 | TASKS.md still heads task 1.4 "5 of 7 series" while the codebase and all renderings say 8 |
| `B-02` | low | `TASKS.md` | 224 | TASKS.md calls it "the four staged edits" and then lists five items |
| `B-03` | low | `TASKS.md` | 225 | "4/4 PASS" is propagated into TASKS.md and STRUCTURE.md without the "on paper" qualifier the… |
| `B-04` | low | `.claude/skills/conduct/SKILL.md` | 3 | conduct mode list is inconsistent across skill frontmatter, QUICKCARD and MANUAL |
| `B-05` | low | `.claude/skills/conduct/SKILL.md` | 52 | Fragment-deletion rule unfollowed, and MANUAL's briefs pre-flight check is now a false posit… |
| `B-06` | low | `conduct/ADOPTION.md` | 90 | ADOPTION.md says the edits were applied "verbatim" but the signature string in kernel.md dro… |
| `B-07` | low | `conduct/GOLDEN-REPLAY.md` | 65 | GOLDEN-REPLAY Case 3 asserts the kernel "inherits" a standing rule the kernel does not conta… |
| `B-08` | low | `conduct/GOLDEN-REPLAY.md` | 75 | GOLDEN-REPLAY says Case 4 "clears all three" floor properties; the log contradicts the expen… |
| `B-09` | low | `conduct/QUICKCARD.md` | 42 | QUICKCARD asserts "An 11th is new and real" two lines below a documented 10-warning baseline |
| `B-10` | low | `conduct/QUICKCARD.md` | 56 | Plain git push is treated as human-only by both operator docs but is in neither reserved lis… |
| `B-11` | low | `conduct/fragments/1.6/stanford-buildlog.md` | 7 | Stanford fragment points at the wrong line of the Endowments note (direction reversed by QC) |
| `B-12` | low | `data/README.md` | 25 | data/README's category-to-benchmark table lists 7 of 8 categories, omitting public_equity (1… |
| `B-13` | low | `data/README.md` | 100 | README says six Harvard allocation tables were dated by reconciliation; the repo has five |
| `B-14` | low | `data/README.md` | 383 | Mid-sentence splice left an orphan parenthetical in the Princeton coverage paragraph |
| `B-15` | low | `data/README.md` | 519 | The schools/<id>.json shape example uses a source id that does not exist and a label Yale ne… |
| `B-16` | low | `data/README.md` | 667 | The fraction-scale example cites Yale FY2023 at 1.8%, which is outside the ±1 band the rule … |
| `B-17` | low | `data/README.md` | 683 | README inventory calls Princeton "24 return/market-value rows" when only 21 carry a market v… |
| `B-18` | low | `data/sources.json` | 677 | Identical document genre classified under two different documentTypes across schools |
| `B-19` | low | `data/sources.json` | 883 | Six sources published by Harvard University VPF carry an `hmc-` id prefix, collapsing the ba… |
| `B-20` | low | `src/lib/constants.ts` | 8 | constants.ts comment names only Harvard as an unsplit-equity discloser; Princeton FY2020-FY2… |
| `B-21` | low | `CONDUCT-DESIGN.html` | 634 | CONDUCT-DESIGN.html's Sources list has an entry cited nowhere and omits the one source cited… |
| `B-22` | low | `MANUAL.html` | 249 | MANUAL.html's 'Where it lives' cell gives a kernel path that does not exist as written |
| `B-23` | low | `MANUAL.html` | 425 | MANUAL.html §4 asserts an eleventh validator warning exists, contradicting its own 'All ten … |
| `B-24` | low | `MANUAL.html` | 776 | MANUAL.html states 'Three commits unpushed' in two places; the branch is 7 ahead of origin/m… |
| `B-25` | low | `STATUS.html` | 487 | Both HTML docs narrow Stanford's pool share from "~73–75%" to "~73%" |
| `B-26` | low | `STATUS.html` | 529 | "30 validator rules are regression-tested" and "30 deliberately-broken copies" both overstat… |
| `B-27` | low | `STATUS.html` | 538 | STATUS.html gives a two-series reason for three empty benchmark series |
| `B-28` | low | `drizzle.config.ts` | 7 | No committed DDL artifact for the storage layer; db:migrate remains a dead script |
| `B-29` | low | `scripts/lib/seed-validate.ts` | 76 | MAX_RETURN_PCT=200 misses the 10x slip that is actually plausible in this dataset, and no te… |
| `B-30` | low | `scripts/lib/seed-validate.ts` | 626 | Validator accepts an accessedDate arbitrarily far in the future |
| `B-31` | low | `scripts/lib/seed-validate.ts` | 1157 | Validator comment names 2 empty benchmark series; there are 3, and the third is hit by live … |
| `B-32` | low | `scripts/seed.ts` | 46 | Prune keys are read outside the transaction, so a concurrent insert escapes the prune |
| `B-33` | low | `scripts/verify-seed-validator.ts` | 152 | seed:verify claims it asserts every rule fires, but leaves 3 of 4 citation-resolution paths … |
| `B-34` | low | `scripts/verify-seed-validator.ts` | 280 | seed:verify exercises 2 of the 4 citation-pairing branches and no dangling per-figure source… |
| `B-35` | low | `src/lib/db/schema.ts` | 39 | schema.ts still defines fiscalYear as universally July–June after the Stanford Aug-31 correc… |
| `B-36` | low | `src/lib/db/schema.ts` | 40 | Closed vocabularies (category, basis, series, documentType) are plain text with no enum or C… |
| `B-37` | low | `STRUCTURE.md` | 203 | STRUCTURE.md documents only a box-drawing substitution, but the .txt conversion does far mor… |

---

### B-01 · TASKS.md still heads task 1.4 "5 of 7 series" while the codebase and all renderings say 8

| | |
|---|---|
| **Severity** | low |
| **Location** | `TASKS.md:164` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
163: 
164: **2026-07-24 — Task 1.4 (benchmark return series) complete, 5 of 7 series.**
165: - 130 rows: `sp500`, `us_aggregate_bond`, `intl_equity`, `reit`, `cash`, each complete FY2000–FY2025. Seeded; validator clean.
```

**What is wrong**

The build-log heading for task 1.4 reads '5 of 7 series'. src/lib/constants.ts declares 8 BENCHMARK_SERIES, and TASKS.md's own task 1.7 line refers to 'the three benchmark series left empty'. Here the ledger — which STRUCTURE.md:163 designates the source of truth — is the stale copy; STATUS.html:694 and STRUCTURE.md:93 both correctly say '5 of 8'.

**Fix**

Amend the heading to 'complete, 5 of 8 series (global_equity added later by the task-1.5 proxy decision)' so the ledger no longer contradicts its own task 1.7 line and the two renderings.

**Verify**

```bash
sed -n "161,167p" TASKS.md
```

---

### B-02 · TASKS.md calls it "the four staged edits" and then lists five items

| | |
|---|---|
| **Severity** | low |
| **Location** | `TASKS.md:224` |
| **Found by** | 1 independent auditor — `adoption-replay` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
223: - **What Conduct is:** the governance + orchestration framework designed in `CONDUCT-DESIGN.html` — a user-scope kernel (universal articles K1–K6 + reserved powers), the escalation chain as a versioned skill (two-phase blind ruling, telemetry, storm brake), and a conductor/ledger work plane. Built at project scope for the pilot; user-scope install is Phase F, gated on pilot kil …
224: - **Artifacts:** `.claude/skills/escalate/` (protocol + `references/kernel.md` at 1.0.0-rc1 + verbatim brief/HITL/log templates) and `.claude/skills/conduct/` (conductor loop + routing rubric + task-brief template). Both registered as project skills. Adoption package with the four staged edits (kernel stamp, CONSTITUTION.md Part 3 pointer, CLAUDE.md escalation bullet, CLAUDE.md …
225: - **Phase A acceptance — golden replay: 4/4 PASS** (`conduct/GOLDEN-REPLAY.md`). All four logged `[PROXY DECISION]`s reproduce under the new protocol; two strengthen structurally (the premise-attack that won the Harvard granularity and dating cases by senior initiative is now a mandatory Phase-2 step; the negative-weights case's numeric anchor is exactly what Phase-1 blinding w …
```

**What is wrong**

The build-log entry that records the adoption package enumerates five items inside a parenthetical introduced as "the four staged edits". ADOPTION.md's four numbered edits do not include the kernel stamp — that is listed separately under "What signing adopts" item 1.

**Fix**

Reword to "the four staged edits plus the kernel stamp (kernel stamp; then: CONSTITUTION.md Part 3 pointer, CLAUDE.md escalation bullet, CLAUDE.md parallel-session rule, TASKS.md ledger conventions)".

**Verify**

```bash
sed -n "221,227p" TASKS.md
```

---

### B-03 · "4/4 PASS" is propagated into TASKS.md and STRUCTURE.md without the "on paper" qualifier the design doc pre-declared

| | |
|---|---|
| **Severity** | low |
| **Location** | `TASKS.md:225` |
| **Found by** | 1 independent auditor — `adoption-replay` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
224: - **Artifacts:** `.claude/skills/escalate/` (protocol + `references/kernel.md` at 1.0.0-rc1 + verbatim brief/HITL/log templates) and `.claude/skills/conduct/` (conductor loop + routing rubric + task-brief template). Both registered as project skills. Adoption package with the four staged edits (kernel stamp, CONSTITUTION.md Part 3 pointer, CLAUDE.md escalation bullet, CLAUDE.md …
225: - **Phase A acceptance — golden replay: 4/4 PASS** (`conduct/GOLDEN-REPLAY.md`). All four logged `[PROXY DECISION]`s reproduce under the new protocol; two strengthen structurally (the premise-attack that won the Harvard granularity and dating cases by senior initiative is now a mandatory Phase-2 step; the negative-weights case's numeric anchor is exactly what Phase-1 blinding w …
226: - **Phase B acceptance — cold-start conductor test: PASS** (~78k tokens, 9.3 min). A fresh Opus agent given only the skill files produced the task-1.6 plan (`conduct/plans/1.6-plan.md`, briefs under `conduct/briefs/1.6/`). It *improved* the decomposition — fragment-everything, so workers write nothing inside `data/` and the repo's own `seed:dry` stays green at every instant — a …
```

**What is wrong**

CONDUCT-DESIGN.html pre-declares the Phase-A check as a paper exercise, and GOLDEN-REPLAY delivers exactly that (its per-case reasoning is explicitly counterfactual: "would have carried", "plausibly lands at 100 directly"). But GOLDEN-REPLAY itself, and the ledger and structure renderings downstream of it, report the result as an unqualified acceptance pass with no indication it was not executed. No execution telemetry exists for any of the four replays, while every actually-executed test in the same commit records tokens and wall-clock.

**Fix**

Carry the qualifier into the acceptance record and its renderings: "Phase A acceptance — golden replay (on paper, per CONDUCT-DESIGN §10): 4/4 reproduce analytically; no protocol run executed." Add the same one-line scope note to GOLDEN-REPLAY.md's header alongside "Run 2026-07-30 by Fable".

**Verify**

```bash
sed -n "222,228p" TASKS.md
```

---

### B-04 · conduct mode list is inconsistent across skill frontmatter, QUICKCARD and MANUAL

| | |
|---|---|
| **Severity** | low |
| **Location** | `.claude/skills/conduct/SKILL.md:3` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
2: name: conduct
3: description: Conductor loop for the work ledger — decompose tasks, route by tier, lease, spawn workers, verify acceptance, integrate serially, update ledger and STATUS. Modes - default run; "plan" (decompose only, no execution); a task id; "until <gate>"; "init" (scaffold a fresh repo).
4: ---
```

**What is wrong**

The budget mode appears in the modes table but not in the skill's own description, and has no defined procedure or unit. The two operator documents each publish a different subset of the five modes, and QUICKCARD frames its subset as a closed set of commands.

**Fix**

Add the budget mode to the SKILL.md:3 description with its unit, give it one line of procedure (finish the current unit, persist, stop), and make QUICKCARD's table list all five conduct modes or retitle it 'the commands you will actually type'.

**Verify**

```bash
sed -n "1,6p" .claude/skills/conduct/SKILL.md
```

---

### B-05 · Fragment-deletion rule unfollowed, and MANUAL's briefs pre-flight check is now a false positive

| | |
|---|---|
| **Severity** | low |
| **Location** | `.claude/skills/conduct/SKILL.md:52` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
51:    ledger — routing is a decision, not an implication.
52: 5. **Lease.** Mark the unit claimed in the ledger (`claimed-by: <agent> ·
53:    <timestamp>`) before spawning. Stale lease (no progress recorded, session
```

**What is wrong**

The conductor skill says fragments are deleted once the merge lands; task 1.6 is complete and its 15 fragment files are still committed. STRUCTURE.md honestly flags the ambiguity, but MANUAL's pre-flight collision check reads the surviving briefs directory as evidence of dispatched-but-unmerged units, so it will report a false positive forever.

**Fix**

Either delete the merged fragments per the skill, or amend conduct/SKILL.md:52 to say fragments are archived after merge and add an explicit archived marker; and change the MANUAL pre-flight line to check for briefs of tasks still unchecked in the ledger.

**Verify**

```bash
sed -n "49,55p" .claude/skills/conduct/SKILL.md
```

---

### B-06 · ADOPTION.md says the edits were applied "verbatim" but the signature string in kernel.md drops its scope clause

| | |
|---|---|
| **Severity** | low |
| **Location** | `conduct/ADOPTION.md:90` |
| **Found by** | 1 independent auditor — `adoption-replay` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
89: 
90: **Applied 2026-07-30** by the Fable build session, same day, verbatim. The
91: kernel stamp is now `1.0.0 / ADOPTED`.
```

**What is wrong**

ADOPTION.md records the signature record it says was applied, and then asserts it was applied verbatim. The string that actually landed in the signed artifact is shorter: the clause recording what the signature covered ("all four edits + kernel") is absent from kernel.md.

**Fix**

Either extend kernel.md:6 to `signed-by: Amay Bhatnagar (explicit in-session approval, all four edits + kernel)` so "verbatim" is true, or amend ADOPTION.md:90 to "applied same day; the kernel stamp carries the short form of the signature line."

**Verify**

```bash
sed -n "87,93p" conduct/ADOPTION.md
```

---

### B-07 · GOLDEN-REPLAY Case 3 asserts the kernel "inherits" a standing rule the kernel does not contain

| | |
|---|---|
| **Severity** | low |
| **Location** | `conduct/GOLDEN-REPLAY.md:65` |
| **Found by** | 1 independent auditor — `adoption-replay` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
64:   year each undated table describes", and Phase 2 directs the senior at
65:   exactly that item. The kernel also inherits the standing rule this case
66:   produced (undated disclosures assigned only on documented evidence).
```

**What is wrong**

`conduct/GOLDEN-REPLAY.md:65-66` states "The kernel also inherits the standing rule this case produced (undated disclosures assigned only on documented evidence)." That attribution is wrong: the kernel contains no such rule, in this version or in the rc1 version the replay was actually run against. The rule's only homes are `data/README.md:500` and `TASKS.md:148`, and `TASKS.md:148` itself names the correct location ("New standing rule, **now in `data/README.md`**, binding on task 1.6"). This is a one-clause attribution error, not a governance hole, for three reasons the original finding missed:

1. The clause is additive, not load-bearing. It opens with "also" and sits outside the three replay criteria the document states for itself at lines 5-7 ("(1) fired at the right time, (2) routed reserved matters correctly, (3) reproduced or improved the outcome"). Rule-persistence is not one of them, so Case 3's "Reproduces: YES" does not rest on it — the reproduction argument is the preceding sentence about the couldn't-verify list and the Phase-2 instruction.
2. […]

**Why it matters** — A load-bearing sentence in the acceptance record is false about the artifact being accepted. A reader auditing whether Case 3's outcome is protected going forward would look in the kernel, find nothing, and be unable to reproduce the claim. Kernel Part 5 also places project docs below the kernel in precedence, so asserting kernel-level inheritance overstates the rule's standing.

**Fix**

Replace with the accurate location: "the standing rule this case produced lives in `data/README.md` (project scope, not kernel); the kernel covers it only generically via K3 (honest gaps)." Or promote a domain-free version into the kernel and then the claim becomes true.

**Verify**

```bash
sed -n "62,68p" conduct/GOLDEN-REPLAY.md
```

---

### B-08 · GOLDEN-REPLAY says Case 4 "clears all three" floor properties; the log contradicts the expensive-to-unwind one

| | |
|---|---|
| **Severity** | low |
| **Location** | `conduct/GOLDEN-REPLAY.md:75` |
| **Found by** | 1 independent auditor — `adoption-replay` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
74: child's Article-5 tagging to Article 4.)*
75: 
76: - **Floor:** clears all three. ✓  **Reserved:** tolerance thresholds
```

**What is wrong**

Case 4's floor check asserts all three properties are present. Property (b), expensive to unwind, is contradicted by the historical entry's own revisit clause, which treats the bound as a constant that can simply be moved, and by the sibling entry in the same work session which calls validator changes cheap to reverse.

**Fix**

Change to "clears (a) and (c); (b) is weak — the bound is a movable constant per TASKS.md's revisit clause — which is still ≥2 of 3."

**Verify**

```bash
sed -n "72,78p" conduct/GOLDEN-REPLAY.md
```

---

### B-09 · QUICKCARD asserts "An 11th is new and real" two lines below a documented 10-warning baseline

| | |
|---|---|
| **Severity** | low |
| **Location** | `conduct/QUICKCARD.md:42` |
| **Found by** | 1 independent auditor — `build-health` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
41: Those 10 warnings are expected **until task 1.7** — 7 missing proxy mappings +
42: 3 empty benchmark series. An 11th is new and real. **This baseline expires when
43: 1.7 lands**; whoever integrates it must record the new count in the build log.
```

**What is wrong**

The sentence is written as a bare assertion of fact ("An 11th is new and real") immediately after the expected-output block says `Validation passed (10 warning(s))` and after the baseline is decomposed as 7 + 3 = 10. The intended meaning is almost certainly conditional ("if you see an 11th, it is new and real"), but as written it reads as claiming an 11th warning exists, which contradicts both the adjacent block and the actual output.

**Fix**

Make the conditional explicit at conduct/QUICKCARD.md:42, e.g. "Any 11th warning is new and real — investigate it."

**Verify**

```bash
sed -n "39,45p" conduct/QUICKCARD.md
```

---

### B-10 · Plain git push is treated as human-only by both operator docs but is in neither reserved list

| | |
|---|---|
| **Severity** | low |
| **Location** | `conduct/QUICKCARD.md:56` |
| **Found by** | 1 independent auditor — `framework-coherence` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
55:    v1? Only you can answer; no model tier may.
56: 3. **`git push`** when you want the site to deploy. Commits are local by
57:    design — pushing is outward-facing. Three are pending, and they carry the
```

**What is wrong**

Both operator documents tell the human that pushing is his call and a session must ask, but neither CONSTITUTION.md Part 2 nor kernel Part 2 enumerates a plain push -- only force-push and history rewrites. MANUAL is candid that the rule is a convention rather than a rule.

**Fix**

Add 'deploying: any push to a branch that auto-deploys' to the outward-facing item in kernel Part 2 and CONSTITUTION.md:42 (a human-adopted amendment), or state plainly in MANUAL that no rule covers it.

**Verify**

```bash
sed -n "53,59p" conduct/QUICKCARD.md
```

---

### B-11 · Stanford fragment points at the wrong line of the Endowments note (direction reversed by QC)

| | |
|---|---|
| **Severity** | low |
| **Location** | `conduct/fragments/1.6/stanford-buildlog.md:7` |
| **Found by** | 1 independent auditor — `fragment-merge` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
6: - **`[JUDGMENT CALL]`/finding to report, not resolved unilaterally.** The brief names this exact scenario as tripwire 6 ("a measurement-universe mismatch — percentages describing a pool that isn't the endowment") and instructs STOP AND REPORT rather than improvising a resolution. I did not curate Merged Pool percentages under the Endowment's name (with or without a caveat label …
7: - **What Stanford does disclose cleanly: the Endowment's own year-end market value**, in its audited Consolidated Financial Statements ("Endowments" note, "University endowment" line — distinct from the "TOTAL ENDOWMENT FUNDS" figure a few lines above it in the same note, which adds back Hospital-owned endowment funds and would be a second, smaller measurement-universe error if …
8: - **Stanford's fiscal year ends August 31, not June 30** — stated explicitly in Stanford's own press releases ("Stanford University reported returns on its investment portfolio as of June 30, 2025, and the value of its endowment as of the close of its fiscal year, August 31, 2025"). The Merged Pool's return/value are reported as of June 30 (aligning with this project's conventi …
```

**What is wrong**

The retained Stanford build-log fragment says the 'TOTAL ENDOWMENT FUNDS' figure sits a few lines above the 'University endowment' line. The QC correction folded into data/README.md establishes that in modern reports it sits below the University endowment line, and that in older reports the same words are the University-only figure. The fragment is the only copy still carrying the reversed description, with no marker.

**Fix**

Delete the fragments, or amend stanford-buildlog.md:7 to the era-aware description at data/README.md:163-170.

**Verify**

```bash
sed -n "4,10p" conduct/fragments/1.6/stanford-buildlog.md
```

---

### B-12 · data/README's category-to-benchmark table lists 7 of 8 categories, omitting public_equity (11 live rows)

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/README.md:25` |
| **Found by** | 1 independent auditor — `schema-seed` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
24: 
25: | Category id | Label | Benchmark series | Notes |
26: |---|---|---|---|
```

**What is wrong**

data/README.md:25-33 — the category-to-benchmark table has 7 data rows (`us_public_equity`, `intl_public_equity`, `fixed_income_cash`, `absolute_return`, `private_equity_vc`, `real_assets`, `other`) and no `public_equity` row, even though `constants.ts:17-26` defines 8 categories and 11 curated allocation rows use `public_equity` (Harvard 7: FY2017/2019/2020/2021/2023/2024/2025; Princeton 4: FY2020-2023). Consequently `global_equity` is the only one of the 8 benchmark series that never appears in any table row in the file (it is also absent from the instruments table at 579-587). This is a residual gap in the 722e0c6 remediation recorded at TASKS.md:249, not a live hazard: the paragraph immediately above the table (line 23) names `public_equity` as "the 8th", states which schools and year ranges use it, states the XOR rule, and forward-references the granularity rule at 465-476 where the `public_equity -> global_equity` mapping is given; lines 573 and 684 both list `global_equity` among the deliberately-empty series. […]

**Why it matters** — A curator following the table cannot find the category 11 already-curated rows use, and cannot see that its benchmark series is one of the three still empty. The contradiction is mitigated — the paragraph above the table (README:23) names public_equity as "the 8th" and forward-references "the granularity rule below", and README:476 does state the global_equity mapping — but the table itself, which is the thing a curator consults per-row, is one row short of what the sentence after it claims.

**Fix**

Add the missing row to the table: `| \`public_equity\` | Public Equity (US & international, not split) | \`global_equity\` | Unsplit line as published (Harvard FY2017+, Princeton FY2020+); use this OR the two split categories, never both. Instrument chosen in task 1.7. |`

**Verify**

```bash
sed -n "22,28p" data/README.md
```

---

### B-13 · README says six Harvard allocation tables were dated by reconciliation; the repo has five

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/README.md:100` |
| **Found by** | 1 independent auditor — `citations` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
99: 
100: The six undated tables were assigned to **fiscal-year end** by reconciling each against Harvard's own audited financial statements, comparing only the overlay-free asset classes (private equity, real estate, natural resources) where fair value ≈ exposure. Public equity and hedge funds are *excluded* from the test because HMC's percentages are exposure-based and include index he …
101:
```

**What is wrong**

The off-by-one is real and I reproduced it three independent ways, but the finding's framing, file anchor and severity are all wrong.

PRECISE RESTATEMENT: Exactly five HMC allocation tables were undated and dated by reconciliation, not six. Three documents state "six": data/README.md:94 ("shift six years of the series"), data/README.md:100 ("The six undated tables were assigned to..."), and TASKS.md:145 ("All six undated tables are fiscal-year end"). conduct/GOLDEN-REPLAY.md:54 also carries "gap the six undated", but there it is quoting the historical child recommendation, so it is arguably a faithful quote rather than an assertion. The cause is a reports-vs-tables conflation, not a dropped year: data/README.md:98 says "**FY2019–FY2024 reports** — no as-of wording anywhere in the document", which is six *reports*, but one of those six (FY2022) contains no allocation table at all.

WHAT THE FINDING GETS WRONG:

1. Scope. […]

**Why it matters** — A reader auditing the dating decision looks for a sixth reconciled year that does not exist, and cannot tell whether a year was silently dropped or the count is simply wrong. It also inflates the apparent blast radius of the decision by 20%.

**Fix**

Change "six undated tables" → "five undated tables" at data/README.md:100 and "six years" → "five years" at line 94.

**Verify**

```bash
sed -n "97,103p" data/README.md
```

---

### B-14 · Mid-sentence splice left an orphan parenthetical in the Princeton coverage paragraph

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/README.md:383` |
| **Found by** | 1 independent auditor — `fragment-merge` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
382: 
383: Returns are curated for **FY2001, FY2002, FY2004–FY2025** (24 years); **market values only for FY2005–FY2025 (21 rows)** — the FY2001, FY2002 and FY2004 rows carry a return with no market value, because the Reports of the Treasurer for those years print the return without an endowment value on the same basis
384: (24 of 26 years) — a longer, differently-shaped coverage than allocations,
```

**What is wrong**

The Princeton coverage correction was spliced into the middle of the fragment's sentence, replacing its first line but leaving the fragment's continuation lines attached. The result is an ungrammatical sentence in which '(24 of 26 years)' now dangles after 'on the same basis' and no longer modifies anything.

**Fix**

Delete the orphan '(24 of 26 years) — ' and rejoin: '...without an endowment value on the same basis. That is a longer, differently-shaped coverage than allocations, per the coverage rule.'

**Verify**

```bash
sed -n "380,386p" data/README.md
```

---

### B-15 · The schools/<id>.json shape example uses a source id that does not exist and a label Yale never publishes

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/README.md:519` |
| **Found by** | 1 independent auditor — `data-consistency` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
518:       "sourceLabel": "U.S. Equity",
519:       "sourceId": "yale-annual-report-fy2023"
520:     }
```

**What is wrong**

The canonical shape snippet's allocation row cites `"sourceId": "yale-annual-report-fy2023"`, which is not in sources.json (Yale's ids are yale-endowment-report-* and yale-news-*), carries `"sourceLabel": "U.S. Equity"` (Yale's published label is "Domestic Equity" in all 21 curated years), and is dated fiscalYear 2023 — a year Yale has no allocation for. The endowmentReturns row in the same snippet is real (Yale FY2023: 1.8% / $40,700M).

**Fix**

Change the snippet's allocation row to a row that actually exists, e.g. fiscalYear 2020, sourceLabel "Domestic Equity", sourceId "yale-endowment-report-2020" — or mark the ids as placeholders explicitly.

**Verify**

```bash
sed -n "516,522p" data/README.md
```

---

### B-16 · The fraction-scale example cites Yale FY2023 at 1.8%, which is outside the ±1 band the rule tests

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/README.md:667` |
| **Found by** | 1 independent auditor — `data-consistency` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
666: - **A negative `pct`** — read as levered exposure, stored as published. Confirm the source really shows a negative, and note that it activates the display obligations in tasks 3.2, 4.2 and 6.1.
667: - **A whole return series inside ±1** — almost certainly entered as fractions (`0.196` for 19.6%). A single sub-1% year is real (Yale's FY2023 was 1.8%), so this only fires on three or more values that are all fractional. Nothing else catches this: unlike a mis-scaled `pct`, there is no sum rule to back it up, and the backtest would just compound near-zero returns and report th …
668: - **A category-year with no benchmark row for its mapped series** — the copycat backtest (task 4.1) would silently drop that slice of the portfolio while the page claims to model the whole allocation. Expected for `hedge_fund_index` and `public_pe_index` until task 1.7 settles them.
```

**What is wrong**

The warning is documented (and coded) as firing only when three or more of a series' returnPct values are all inside ±1.0, and the stated justification for the three-value minimum is that a single sub-1% year is real — illustrated with "Yale's FY2023 was 1.8%". 1.8 is not sub-1% and would never enter the band. The genuine sub-1% Yale years in the curated data are FY2002 (0.7) and FY2022 (0.8). The same wrong example appears in the validator source comment.

**Fix**

Replace the example in both places with a real sub-1% year from the data, e.g. "Yale's FY2022 was 0.8%" (or FY2002, 0.7%).

**Verify**

```bash
sed -n "664,670p" data/README.md
```

---

### B-17 · README inventory calls Princeton "24 return/market-value rows" when only 21 carry a market value

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/README.md:683` |
| **Found by** | 1 independent auditor — `data-consistency` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
682: | `schools/mit.json` | 42 allocation rows (FY2001/03/04 Pool A actual; FY2008 target; FY2013–15 actual) + 26 return/market-value rows (FY2000–FY2025, complete). |
683: | `schools/princeton.json` | 104 allocation rows (FY2005–FY2018, FY2020–FY2023, actual) + 24 return/market-value rows (FY2001–FY2025 with FY2000/FY2003 gaps). |
684: | `benchmark_returns.json` | 130 rows: 5 of 8 series complete FY2000–FY2025; `hedge_fund_index`/`public_pe_index`/`global_equity` deliberately empty — task 1.7. |
```

**What is wrong**

Princeton has 24 endowmentReturns rows but market values on only 21 of them — FY2001, FY2002 and FY2004 carry a return with no market value. The inventory row states "24 return/market-value rows", the same phrasing used for the four schools that really do have both figures on every row. This is the overstatement TASKS.md:249 item (2) records as found and corrected; the correction landed in the Princeton coverage section (line 383) but not in the inventory table, which was added in this same diff.

**Fix**

Change line 683 to "24 return rows (FY2001, FY2002, FY2004–FY2025) of which 21 carry a market value (FY2005–FY2025); FY2000/FY2003 are gaps".

**Verify**

```bash
sed -n "680,686p" data/README.md
```

---

### B-18 · Identical document genre classified under two different documentTypes across schools

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/sources.json:677` |
| **Found by** | 1 independent auditor — `citations` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
676:     "url": "https://finance.princeton.edu/sites/g/files/toruqf151/files/2019-09/2004-2005.pdf",
677:     "documentType": "annual_report",
678:     "page": "Report on Investments",
```

**What is wrong**

Princeton's "Report of the Treasurer" is typed `annual_report` (24 entries) while MIT's "Report of the Treasurer" is typed `financial_statement` (16 entries) — the same document genre, containing audited financial statements in both cases, split across two categories.

**Fix**

Pick one type for the "Report of the Treasurer" genre and apply it to all 40 entries (financial_statement is the better fit given both contain audited statements), or add a note in data/README.md explaining the split.

**Verify**

```bash
sed -n "674,680p" data/sources.json
```

---

### B-19 · Six sources published by Harvard University VPF carry an `hmc-` id prefix, collapsing the basis distinction README says matters

| | |
|---|---|
| **Severity** | low |
| **Location** | `data/sources.json:883` |
| **Found by** | 1 independent auditor — `citations` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
882:   {
883:     "id": "hmc-university-financial-report-2002",
884:     "title": "Harvard University Financial Report, Fiscal Year 2002 (Financial Overview / Analysis of Financial Results)",
```

**What is wrong**

The ids `hmc-university-financial-report-{2002,2003,2004,2005,2006,2010}` imply Harvard Management Company authorship, but their own `publisher` field is "Harvard University (Office of the Vice President for Finance)" — and these are exactly the years README singles out as being on the University basis rather than the HMC basis.

**Fix**

Rename the six ids to a `harvard-university-financial-report-YYYY` form and update the 14 references in data/schools/harvard.json in the same commit (a rename with a stale reference would be caught by the resolution rule, so this is safe to do mechanically).

**Verify**

```bash
sed -n "880,886p" data/sources.json
```

---

### B-20 · constants.ts comment names only Harvard as an unsplit-equity discloser; Princeton FY2020-FY2023 now is too

| | |
|---|---|
| **Severity** | low |
| **Location** | `src/lib/constants.ts:8` |
| **Found by** | 1 independent auditor — `data-consistency` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
7: // equity as a single line with no geographic split (Harvard, FY2017 onward),
8: // and the alternatives were both worse: recording an unsplit figure under a US
9: // label misstates it (Article 4), and merging the split categories project-wide
```

**What is wrong**

The comment that justifies the `public_equity` category names one school. Since task 1.6, Princeton FY2020-FY2023 uses it as well (4 rows), which data/README.md:23 records but constants.ts does not. The related comment at line 78 also reasons from "Harvard's unsplit years start FY2017" when picking the future global_equity instrument.

**Fix**

Update the comment at line 8 to "(Harvard FY2017 onward; Princeton FY2020–FY2023)" and line 78 to note that the earliest unsplit year across all schools is Harvard's FY2017.

**Verify**

```bash
sed -n "5,11p" src/lib/constants.ts
```

---

### B-21 · CONDUCT-DESIGN.html's Sources list has an entry cited nowhere and omits the one source cited without a link

| | |
|---|---|
| **Severity** | low |
| **Location** | `CONDUCT-DESIGN.html:634` |
| **Found by** | 1 independent auditor — `html-artifacts` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
633:     <li><a href="https://arxiv.org/pdf/2511.05766">Anchors in the Machine: Anchoring Bias in LLMs</a></li>
634:     <li><a href="https://arxiv.org/pdf/2408.09235">Reference-Guided Verdict: LLMs-as-Judges</a></li>
635:     <li><a href="https://arxiv.org/html/2605.18796">UCCI: Calibrated Uncertainty for Cost-Optimal LLM Cascade Routing</a></li>
```

**What is wrong**

The footer Sources list carries 9 arXiv entries but §12's body links only 8. arxiv.org/pdf/2408.09235 ("Reference-Guided Verdict") appears only in the footer and is referenced by no claim on the page. Conversely, the one §12 bullet that cites "Anthropic's multi-agent research system" carries no link and no Sources entry, while all four other research bullets link theirs.

**Fix**

Either cite 2408.09235 from the claim it supports in §12 or drop it from the footer list, and give the Anthropic multi-agent reference a link plus a Sources entry.

**Verify**

```bash
sed -n "631,637p" CONDUCT-DESIGN.html
```

---

### B-22 · MANUAL.html's 'Where it lives' cell gives a kernel path that does not exist as written

| | |
|---|---|
| **Severity** | low |
| **Location** | `MANUAL.html:249` |
| **Found by** | 1 independent auditor — `html-artifacts` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
248:       <tr><td><strong>Chain</strong></td><td>When a session hits a real fork, it answers the question itself, then a fresh agent one tier up rules on it blind. Sonnet&nbsp;&rarr;&nbsp;Opus&nbsp;&rarr;&nbsp;Fable&nbsp;&rarr;&nbsp;you.</td><td class="cmd">.claude/skills/escalate/</td></tr>
249:       <tr><td><strong>Kernel</strong></td><td>The rules that bind every session: six universal articles, and the list of powers reserved to you. Signed 30 July 2026.</td><td class="cmd">escalate/references/kernel.md</td></tr>
250:       <tr><td><strong>Gates</strong></td><td>Checkpoints A and B. The line stops; you review. Not escalatable &mdash; no model may route around them.</td><td class="cmd">TASKS.md</td></tr>
```

**What is wrong**

The Kernel row of the §1 table gives the location as `escalate/references/kernel.md`. No such path exists from the repo root; the file is at `.claude/skills/escalate/references/kernel.md`, which the same page writes out in full 50 lines later. The two adjacent rows in the same column give full paths (`.claude/skills/conduct/`, `.claude/skills/escalate/`), so the abbreviation is inconsistent within the table.

**Fix**

Write `.claude/skills/escalate/references/kernel.md`, matching the sibling rows and line 299.

**Verify**

```bash
sed -n "246,252p" MANUAL.html
```

---

### B-23 · MANUAL.html §4 asserts an eleventh validator warning exists, contradicting its own 'All ten are expected'

| | |
|---|---|
| **Severity** | low |
| **Location** | `MANUAL.html:425` |
| **Found by** | 1 independent auditor — `html-artifacts` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
424:     (<code>global_equity</code>, <code>hedge_fund_index</code>, <code>public_pe_index</code>).
425:     An eleventh warning is new and real.
426:   </p>
```

**What is wrong**

The paragraph enumerates ten expected warnings (seven proxy-mapping, three empty benchmark series) and then states in the present tense that an eleventh warning "is new and real". seed:dry emits exactly ten. The sentence appears to be a conditional rule ("if an eleventh appears, it is new and real") written as an assertion.

**Fix**

Rewrite as a conditional, e.g. "An eleventh warning would be new and real — investigate it rather than re-baselining."

**Verify**

```bash
sed -n "422,428p" MANUAL.html
```

---

### B-24 · MANUAL.html states 'Three commits unpushed' in two places; the branch is 7 ahead of origin/main

| | |
|---|---|
| **Severity** | low |
| **Location** | `MANUAL.html:776` |
| **Found by** | 1 independent auditor — `html-artifacts` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
775:       <tr><td><strong>Task 0.5 is checked off against an unmet check</strong></td><td>Its check says a migration runs against the database; only a schema push ever happened. Cosmetic, but it is the kind of untruth this project otherwise doesn&rsquo;t tolerate.</td></tr>
776:       <tr><td><strong>Three commits unpushed</strong></td><td>One machine holds five rulings and 607 cited data points.</td></tr>
777:       <tr><td><strong>Do not &ldquo;fix&rdquo; the PRD&rsquo;s FY2000&ndash;FY2025 promise</strong></td><td>It disagrees with reality on purpose &mdash; that disagreement <em>is</em> the Checkpoint A question. Editing it before you rule would violate the reserved list.</td></tr>
```

**What is wrong**

MANUAL.html reports the unpushed backlog as three commits in two places — §5 line 507 (`<span class="stage-num">3 commits local</span>`) and §10 line 776 (`<strong>Three commits unpushed</strong>`) — and `conduct/QUICKCARD.md:57` repeats it a third time ("Three are pending"), which the original finding missed. The repo is 7 ahead of origin/main (`git rev-list --count @{u}..HEAD` -> `7`; origin/main = 813a0fb, 2026-07-25).

Three corrections to the finding as filed:

1. The figure was ACCURATE when written, not fabricated. MANUAL.html was created in 722e0c6; before that commit existed the unpushed set was exactly {a2eb063, d1920ec, 5de914f} = 3. It became wrong the instant it was committed (4) and drifted to 7 within 12 minutes (722e0c6 12:55:06, df3f299 13:06:03, ae6322c 13:06:48, 00a08ec 13:07:29, all 2026-07-31). This is a self-referential snapshot, not a false claim.

2. The claimed impact is wrong. `git push` pushes the entire branch regardless of the count, so no operator decision changes between 3 and 7 — the number is descriptive, not actionable. […]

**Why it matters** — This figure quantifies a single-point-of-failure risk in the one section reserved to the human, and it understates it by more than half. An operator who pushes believing three commits are at stake will not notice that the manual and the STRUCTURE snapshot are also unreplicated.

**Fix**

Replace the literal count in both places with the derivation (`git rev-list --count @{u}..HEAD`) or a dated figure, consistent with the page's own footer rule that "Counts and warning baselines drift — re-derive them".

**Verify**

```bash
git rev-list --count origin/main..HEAD
```

---

### B-25 · Both HTML docs narrow Stanford's pool share from "~73–75%" to "~73%"

| | |
|---|---|
| **Severity** | low |
| **Location** | `STATUS.html:487` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
486:           (its policy portfolio), not what it actually held. Both are curated and labelled as
487:           such. <strong>MIT</strong> has 7 scattered allocation years (three of them pool-basis); <strong>Stanford</strong> has none at all &mdash; its percentages exist only for a pool that is ~73% endowment, with a measured 2.9-point return divergence. Bless that reading of &ldquo;version one&rdquo; or override it &mdash; the data is curated to each school&rsquo;s real disclo …
488:         </p>
```

**What is wrong**

STATUS.html and MANUAL.html both describe Stanford's Merged Pool as '~73% endowment'. TASKS.md and data/README.md record the range as 73-75% measured across FY2016-FY2022, with 73% being the low end (the FY2016 figure).

**Fix**

Use '~73–75%' in both documents, matching TASKS.md:26 and data/README.md:122.

**Verify**

```bash
sed -n "484,490p" STATUS.html
```

---

### B-26 · "30 validator rules are regression-tested" and "30 deliberately-broken copies" both overstate the suite

| | |
|---|---|
| **Severity** | low |
| **Location** | `STATUS.html:529` |
| **Found by** | 1 independent auditor — `validator` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
528:           <li class="task is-done"><span class="task-id">1.2</span><span class="glyph g-done">&#10003;</span><span class="task-text">Seed script with validation &mdash; a number without a citation is rejected outright</span>
529:             <span class="task-note">Later hardened after a code review: writing is now opt-in, the write is one transaction, and 30 validator rules are regression-tested.</span>
530:           </li>
```

**What is wrong**

Only the narrow, literal part survives, and it is cosmetic — low, not medium.

VERIFIED (keep): `scripts/verify-seed-validator.ts` contains exactly 30 entries in `CASES` (I counted them: 30 `name:` fields). Case 1 (lines 70-74) is a clean-data control — `break: () => {}` — and the run loop (lines 309-312) copies `data/` then calls `testCase.break(dir)`, so copy `case-0` is pristine. So MANUAL.html:338's "30 deliberately-broken copies of data/" is off by one: 29 copies are broken, one is a no-false-positive control. And STATUS.html:529's "30 validator rules" counts cases, not rules: three pairs genuinely share one diagnostic site, so the honest figures are "30 cases / 29 deliberate defects / 26 distinct rules". Verified duplicate sites: cases 8 and 9 both match the single message at seed-validate.ts:942-946 (that one string contains both "outside the plausible range" and "this field is in MILLIONS of USD"); cases 17 and 18 both match seed-validate.ts:580-583; cases 6 and 7 both match the suggestion branch at seed-validate.ts:296. […]

**Why it matters** — A reader of STATUS.html (the project's state rendering) or MANUAL.html sizes the safety net at roughly twice its real extent, which is exactly the wrong direction for a project whose stated rule 3 is "honest numbers even when unflattering". It also makes the coverage gaps in the first finding harder to notice, because the count already looks complete.

**Fix**

In STATUS.html:529 say "30 regression cases (29 negative + 1 happy path)" rather than "30 validator rules"; in MANUAL.html:338 say "29 deliberately-broken copies plus one pristine copy", and drop "assert each rule fires" per the first finding. STRUCTURE.md:107's "30-case regression suite" is already correct and can be left alone.

**Verify**

```bash
sed -n "526,532p" STATUS.html
```

---

### B-27 · STATUS.html gives a two-series reason for three empty benchmark series

| | |
|---|---|
| **Severity** | low |
| **Location** | `STATUS.html:538` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
537:           <li class="task"><span class="task-id">1.7</span><span class="glyph g-idle">&#9675;</span><span class="task-text">Choose the ETF standing in for each asset class, and say plainly where the stand-in is weak</span>
538:             <span class="task-note">Also settles the three benchmark series deliberately left empty: no freely-citable, investable hedge-fund or private-equity series reaches back to FY2000.</span>
539:           </li>
```

**What is wrong**

The task 1.7 note reads 'Also settles the three benchmark series deliberately left empty: no freely-citable, investable hedge-fund or private-equity series reaches back to FY2000.' That reason covers only two of the three. The third, global_equity, is empty because its instrument choice was deferred to 1.7 by the task-1.5 proxy decision — its front-runner (Vanguard Total World) exists and covers every year currently needed.

**Fix**

Split the note: 'two (hedge_fund_index, public_pe_index) because no freely-citable investable series reaches FY2000; the third (global_equity) because its instrument was deferred here — front-runner VT/VTWSX, first full fiscal year FY2009.'

**Verify**

```bash
sed -n "535,541p" STATUS.html
```

---

### B-28 · No committed DDL artifact for the storage layer; db:migrate remains a dead script

| | |
|---|---|
| **Severity** | low |
| **Location** | `drizzle.config.ts:7` |
| **Found by** | 1 independent auditor — `schema-seed` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
6: export default defineConfig({
7:   out: "./drizzle",
8:   schema: "./src/lib/db/schema.ts",
```

**What is wrong**

drizzle.config.ts declares `out: "./drizzle"` but no drizzle/ directory or migration journal exists or is tracked, so the repo contains no versioned record of the storage layer's DDL — including the two schema changes made in this window (allocations.basis, and the endowment_returns citation split). The only evidence that the live Neon schema matches schema.ts is a prose line in TASKS.md.

**Fix**

Resolve the path TASKS.md:215 already names. Either run db:generate and commit drizzle/ with a baseline migration marked as applied, or delete db:generate/db:migrate from package.json and state in CLAUDE.md that db:push is the sanctioned mechanism — and in either case record the FY-split DDL somewhere in the repo.

**Verify**

```bash
sed -n "4,10p" drizzle.config.ts
```

---

### B-29 · MAX_RETURN_PCT=200 misses the 10x slip that is actually plausible in this dataset, and no test pins it

| | |
|---|---|
| **Severity** | low |
| **Location** | `scripts/lib/seed-validate.ts:76` |
| **Found by** | 1 independent auditor — `validator` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
75: export const MIN_RETURN_PCT_EXCLUSIVE = -100;
76: export const MAX_RETURN_PCT = 200;
77:
```

**What is wrong**

The comment at seed-validate.ts:73-74 gives the constant's purpose as catching "a decimal-point slip (e.g. 400 where 40.0 was meant)". Every real return in data/ is well under 50%, so the realistic 10x slip lands between 0 and ~450 — and everything from 100 to 200 passes. A return of 150 (from 15.0) validates with zero errors. Separately, no case in the 30-case suite exercises this check at all, on either endowment rows or benchmark rows, so the bound is unpinned in both directions.

**Fix**

Add the two missing negative cases first (returnPct out of range on a school row and on a benchmark row). If tightening is wanted, the widest real annual endowment return in scope is ~45%, so a ceiling nearer 100 with the reasoning recorded inline — the pattern MIN_ALLOCATION_PCT already follows at lines 50-71 — would close the 100-200 window.

**Verify**

```bash
sed -n "73,79p" scripts/lib/seed-validate.ts
```

---

### B-30 · Validator accepts an accessedDate arbitrarily far in the future

| | |
|---|---|
| **Severity** | low |
| **Location** | `scripts/lib/seed-validate.ts:626` |
| **Found by** | 1 independent auditor — `citations` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
625:     const accessedDate = optionalString(raw, "accessedDate", at, report);
626:     if (accessedDate !== null && !isIsoDate(accessedDate)) {
627:       report.error(at, `\`accessedDate\` must be an ISO date, YYYY-MM-DD (got ${describe(accessedDate)})`);
```

**What is wrong**

`accessedDate` is checked for ISO shape only, never for being in the past, so a citation can claim it was accessed in 2030 and pass. All 95 current entries are clean; this is a latent gap in the citation registry's only self-dating field.

**Fix**

In validateSources, error when `accessedDate > now.toISOString().slice(0,10)` (reusing the injected `options.now` that latestClosedFiscalYear already threads through), and add a seed:verify case for it.

**Verify**

```bash
sed -n "623,629p" scripts/lib/seed-validate.ts
```

---

### B-31 · Validator comment names 2 empty benchmark series; there are 3, and the third is hit by live rows

| | |
|---|---|
| **Severity** | low |
| **Location** | `scripts/lib/seed-validate.ts:1157` |
| **Found by** | 1 independent auditor — `schema-seed` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
1156:   // portfolio, so the copycat would be built on part of the allocation while
1157:   // the page claims to model all of it. Warning, not error: task 1.4
1158:   // deliberately left `hedge_fund_index` and `public_pe_index` empty for 1.7.
```

**What is wrong**

The comment explaining why a missing benchmark row is a warning rather than an error names only hedge_fund_index and public_pe_index as deliberately empty. Since the task-1.5 ruling added `public_equity` -> `global_equity`, a third series is empty, and unlike the other two it is exercised by 11 curated allocation rows — so the warning stream this comment describes is wider than the comment says.

**Fix**

Update the comment to name all three: "task 1.4 deliberately left `hedge_fund_index` and `public_pe_index` empty, and task 1.5's `public_equity` ruling added `global_equity`, all three for 1.7."

**Verify**

```bash
sed -n "1154,1160p" scripts/lib/seed-validate.ts
```

---

### B-32 · Prune keys are read outside the transaction, so a concurrent insert escapes the prune

| | |
|---|---|
| **Severity** | low |
| **Location** | `scripts/seed.ts:46` |
| **Found by** | 1 independent auditor — `schema-seed` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
45: 
46:   // Read the current natural keys first. These are read-only, so they sit
47:   // outside the transaction; only the mutations below are batched.
```

**What is wrong**

writeSeedData computes the stale-row id lists from six SELECTs issued before the batch and explicitly outside it, then deletes by those ids inside the transaction. A row inserted between the reads and the batch is invisible to the stale computation and survives, so the post-seed database can be a strict superset of data/ rather than equal to it — which is the state the script's own header promises it prevents.

**Fix**

Either move the SELECTs into the batch is not possible with neon-http (no interactive transactions), so instead replace id-based pruning with key-based pruning inside the transaction — e.g. `DELETE FROM allocations WHERE (school_id, fiscal_year, category) NOT IN (<the seed's keys>)` — which needs no prior read and is correct regardless of what changed in between.

**Verify**

```bash
sed -n "43,49p" scripts/seed.ts
```

---

### B-33 · seed:verify claims it asserts every rule fires, but leaves 3 of 4 citation-resolution paths and the orphan-source rule untested

| | |
|---|---|
| **Severity** | low |
| **Location** | `scripts/verify-seed-validator.ts:152` |
| **Found by** | 1 independent auditor — `citations` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
151:   {
152:     name: "citation that resolves to nothing",
153:     break: (dir) => editYale(dir, (y) => void (allocationsOf(y)[0].sourceId = "no-such-source")),
```

**What is wrong**

Restated precisely: `npm run seed:verify` is a 30-case suite (29 breaking cases + 1 happy path) and it genuinely passes 30/30, so the published figure at MANUAL.html:408 and TASKS.md:233 is accurate. The defect is narrower than filed and is a documentation-vs-coverage mismatch, not a broken rail:

(1) The validator itself is COMPLETE — I probed all six allegedly-uncovered rules against temp copies of data/ and every one fired: `returnSourceId`/`marketValueSourceId`/benchmark `sourceId` set to "no-such-source" each produced "`sourceId` `no-such-source` is not in sources.json" at the correct `where` string; deleting `returnPct` (keeping `returnSourceId`) produced seed-validate.ts:903-907; deleting `marketValueSourceId` (keeping the figure) produced seed-validate.ts:910-914; an added uncited source produced the seed-validate.ts:1183 orphan warning. So TASKS.md:233's assertion that the validator "enforces exact pairing both directions" is TRUE.

(2) The auditor's "3 of 4 citation-resolution paths" mis-describes the code. […]

**Why it matters** — The untested paths are exactly the ones the citation-split rail change introduced. A regression that stopped resolving `returnSourceId`/`marketValueSourceId`/benchmark `sourceId` against sources.json, or that dropped two of the four pairing checks, would leave seed:verify reporting 30/30 green while dangling citations reached published charts. (I verified by probe that all of these rules do currently fire — this is a coverage gap, not a live rule failure.)

**Fix**

Add five cases: unresolvable `returnSourceId`; unresolvable `marketValueSourceId`; unresolvable benchmark `sourceId` (the first case that touches benchmark_returns.json); `returnSourceId` present with `returnPct` absent; `marketValueUsdMillions` present with `marketValueSourceId` absent. Plus one `expectWarning: "is not cited by any row"` case for the orphan-source rule.

**Verify**

```bash
sed -n "149,155p" scripts/verify-seed-validator.ts
```

---

### B-34 · seed:verify exercises 2 of the 4 citation-pairing branches and no dangling per-figure source id

| | |
|---|---|
| **Severity** | low |
| **Location** | `scripts/verify-seed-validator.ts:280` |
| **Found by** | 1 independent auditor — `schema-seed` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
279:   },
280:   {
281:     name: "a return figure without its own citation",
```

**What is wrong**

The rail change that split endowment_returns citations added four error branches to the validator, but only two have a regression case. The untested pair are the market-value figure with a missing citation and the return citation with a missing figure — i.e. one of each direction is covered and the mirror is not. There is also no case in which a returnSourceId or marketValueSourceId points at a source that does not exist; the only dangling-citation case breaks an allocation's sourceId.

**Fix**

Add two cases mirroring 28/29 (delete `marketValueSourceId`; delete `returnPct` while leaving `returnSourceId`) and one setting `returnSourceId = "no-such-source"`, taking the suite to 33.

**Verify**

```bash
sed -n "277,283p" scripts/verify-seed-validator.ts
```

---

### B-35 · schema.ts still defines fiscalYear as universally July–June after the Stanford Aug-31 correction

| | |
|---|---|
| **Severity** | low |
| **Location** | `src/lib/db/schema.ts:39` |
| **Found by** | 1 independent auditor — `completeness-critic` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
38:       .references(() => schools.id),
39:     fiscalYear: integer("fiscal_year").notNull(), // year the fiscal year ENDS (FY2025 = July 2024–June 2025)
40:     category: text("category").notNull(), // one of ALLOCATION_CATEGORIES (src/lib/constants.ts)
```

**What is wrong**

TASKS.md:251 records that the 2026-07-31 correction pass fixed "the universal 'fiscal years end June 30' claim" so that it notes Stanford's August 31, and CLAUDE.md:40 and data/README.md:19 were both duly corrected. src/lib/db/schema.ts:39 still carries the uncorrected universal form as an inline comment, and it is the only place in the schema that defines what `fiscalYear` means — endowmentReturns.fiscalYear (schema.ts:63), the column that actually holds Stanford's 26 rows, carries no comment of its own and inherits its semantics from this one. Stanford's rows are Aug-31 values (data/README.md:144: "The `marketValueUsdMillions` figures curated here for 'FY2000'–'FY2025' are Stanford's own August 31 fiscal-year-end values for that label"), so the comment is false for 26 of the 128 return rows. MANUAL.html:768's known-debt row covers only the validator's closed-year guard ("The validator assumes every fiscal year ends 30 June"), not the schema's column semantics, and scripts/lib/seed-validate.ts:43/:420 are the sites that row does cover.

**Why it matters** — The correction pass claims to have swept the universal fiscal-year claim; one instance survived, in the file a developer reads to learn what the column means. Anyone joining Stanford's market values to the other four schools' figures on `fiscal_year` — which tasks 3.2 and 6.1 will do — reads this comment and assumes a common July–June window, which is the exact ~2-month misalignment the [JUDGMENT CALL] at TASKS.md:241 exists to disclose.

**Fix**

Amend the comment to "year the fiscal year ENDS (FY2025 = July 2024–June 2025 for Yale/Harvard/MIT/Princeton; Stanford's fiscal year ends 31 August — see data/README.md 'Fiscal years')", and add the same one-liner above endowmentReturns.fiscalYear, which is where Stanford's rows actually land.

**Verify**

```bash
sed -n "36,42p" src/lib/db/schema.ts
```

---

### B-36 · Closed vocabularies (category, basis, series, documentType) are plain text with no enum or CHECK

| | |
|---|---|
| **Severity** | low |
| **Location** | `src/lib/db/schema.ts:40` |
| **Found by** | 1 independent auditor — `schema-seed` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
39:     fiscalYear: integer("fiscal_year").notNull(), // year the fiscal year ENDS (FY2025 = July 2024–June 2025)
40:     category: text("category").notNull(), // one of ALLOCATION_CATEGORIES (src/lib/constants.ts)
41:     pct: numeric("pct", { precision: 6, scale: 3 }).notNull(),
```

**What is wrong**

Four columns whose legal values are fixed lists in constants.ts are stored as unconstrained `text`, with the closed vocabulary recorded only in a trailing comment. The database will accept any string in any of them. This is a deliberate, documented choice, but it leaves the seed validator as the single point of enforcement while package.json ships db:studio, an interactive row editor that bypasses it.

**Fix**

Either promote the four to `pgEnum` generated from the constants arrays (drizzle supports this, and it keeps one source of truth), or add CHECK constraints, or — if validator-only really is the intended contract — say so in a comment on each column rather than only in seed-validate.ts's header, so a reader of schema.ts knows the comment is not enforced.

**Verify**

```bash
sed -n "37,43p" src/lib/db/schema.ts
```

---

### B-37 · STRUCTURE.md documents only a box-drawing substitution, but the .txt conversion does far more

| | |
|---|---|
| **Severity** | low |
| **Location** | `STRUCTURE.md:203` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
202: 
203: `STRUCTURE.txt` is an ASCII rendering of this file (the PDF renderer's Courier
204: font has no box-drawing glyphs, so U+251C/2502/2514/2500 become plain
```

**What is wrong**

STRUCTURE.md describes STRUCTURE.txt as 'an ASCII rendering of this file' whose only stated transformation is U+251C/2502/2514/2500 becoming '+ | \ -'. The actual conversion drops 6 lines (225 -> 219), prepends a 5-line banner block that exists in no source line, reflows all three markdown tables into indented columns, deletes code-fence markers, substitutes many other characters, and turns the tree's standalone U+2502 spacer lines into blank lines rather than '|' — inconsistently, since U+2502 does become '|' elsewhere in the same tree.

**Fix**

Extend the 'Re-rendering the PDF' section to list the full substitution set (box-drawing, ★->*, em/en dash->--, ·->-, ->->->, table reflow, fence removal, banner insertion), or commit the converter script so the transformation is reproducible and diffable.

**Verify**

```bash
sed -n "200,206p" STRUCTURE.md
```

---
