# WP4c — Re-render `MANUAL.html` from the corrected ledger

4 work orders. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

The operator manual — procedure, not state. Its defects are the numbers embedded in that procedure: what a grep will return, how many commits are unpushed, what `npm audit` reports. Each is a promise the operator will check against reality the first time they run the command.

All three HTML files are renderings, by the repo's own definition. Once WP1–WP3 land they can be corrected against a ledger that is actually true. This is the largest package (17 orders) and the least subtle: most are counts that drifted from the ledger, plus one document that still describes the framework as an unsigned draft.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-19` | high | `MANUAL.html` | 437 | MANUAL.html presents seed:verify as the detector of unauthorised validator edits; it detects… |
| `A-25` | medium | `MANUAL.html` | 395 | MANUAL.html states npm audit reports 16 findings (4 moderate, 12 high); actual is 8 (4 moder… |
| `A-26` | medium | `MANUAL.html` | 507 | MANUAL.html says three commits unpushed; git reports seven (and four when the manual landed) |
| `A-27` | medium | `MANUAL.html` | 579 | MANUAL says the JUDGMENT CALL grep finds four entries; it finds seven hits, six real |

---

### A-19 · MANUAL.html presents seed:verify as the detector of unauthorised validator edits; it detects 9 of 23

| | |
|---|---|
| **Severity** | high |
| **Location** | `MANUAL.html:437` |
| **Found by** | 1 independent auditor — `validator` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
436:   <p>
437:     Two supporting rules worth internalising: <code>seed:verify</code> must stay at full count
438:     <em>because that is how an unauthorised edit to a validator file gets detected</em>, and
```

**What is wrong**

Three documents claim seed:verify has exhaustive coverage of the validator's rules; it covers well under half. The falsifiable claims are MANUAL.html:338 ("Run the validator against 30 deliberately-broken copies of data/ and assert each rule fires"), data/README.md:627 ("check every rule still fires"), and TASKS.md:192 ("asserts every rule fires"). MANUAL.html:437-438 ("seed:verify must stay at full count because that is how an unauthorised edit to a validator file gets detected") is a secondary, weaker instance — on its own it is a defensible description of a regression test and should not be the anchor.

Reproducible measure (mutation study over scripts/lib/seed-validate.ts, baseline "30/30 validator checks passed."): of the 53 report.error/report.warn call sites, neutralizing any one of 31 leaves the suite reporting 30/30. Whole rule blocks can also be deleted outright with the suite still green:
  - delete lines 927-933 (returnPct plausible-range check) -> 30/30 validator checks passed.
  - delete lines 948-950 (marketValueUsdMillions decimal-scale check) -> 30/30 validator checks passed.
  - delete lines 953-956 (duplicate-fiscal-year check in endowmentReturns) -> 30/30 validator checks passed.
Undetected call-site lines: 310, 315, 329, 337, 350, 366, 476, 498, 503, 532, 540, 556, 572, 607, 678, 719, 729, 858, 868, 904, 911, 928, 954, 996, 1006, 1046, 1133, 1147, 1171, 1183, 1223.

Do NOT include the original finding's "9 of 23 / 14 of 23" figures — that segmentation is not reproducible. Do NOT include the "no automation" element: no document claims seed:verify runs automatically (MANUAL.html:404 presents it as one of "Five commands"; conduct/QUICKCARD.md:25 lists it as a command to run), so the absence of a hook or CI contradicts nothing.

No published figure is wrong and the citation rule is still genuinely enforced at seed time — the real validator contains all 53 checks. The defect is the false completeness claim plus the resulting blind spot: a session that degrades the validator, runs seed:verify, and sees 30/30 will wrongly conclude nothing was harmed. Accurate wording would be "asserts 30 specific rules fire; coverage is partial."

**Evidence as filed**

```text
MANUAL.html:437-438 —
    Two supporting rules worth internalising: <code>seed:verify</code> must stay at full count
    <em>because that is how an unauthorised edit to a validator file gets detected</em>, and

Counter-evidence (same runs as the finding above): 14 separate deletions inside scripts/lib/seed-validate.ts each leave the suite at "30/30 validator checks passed." — e.g. deleting lines 927-933 (the entire `returnPct` plausible-range check) or lines 948-950 (the market-value decimal-scale check).

No automation: `ls -la .claude` -> only `skills/`; `cat .claude/settings.json` -> "(no .claude/settings.json)"; `find . -maxdepth 3 -name "*.yml" -o -name "*.yaml" | grep -v node_modules` -> no output.
```

**Independent reproduction by the refuting auditor**

```text
1) MANUAL.html:437-438 quoted text confirmed verbatim via sed -n '425,455p' MANUAL.html:
    "Two supporting rules worth internalising: <code>seed:verify</code> must stay at full count
     <em>because that is how an unauthorised edit to a validator file gets detected</em>, and"

2) seed:verify is a mutation harness, not a checksum. package.json:16 -> "seed:verify": "tsx scripts/verify-seed-validator.ts". Counted its cases myself with python3 regex over the CASES array: name: occurrences = 30, expectError = 27, expectWarning = 2, expectNoError = 1. Line 357 prints `${CASES.length - failures}/${CASES.length} validator checks passed`.

3) Baseline in my scratchpad copy: "30/30 validator checks passed." (1.8s/run).

4) My own mutation study (53 report call sites, one neutralized per run) — final summary output:
   total report call sites mutated: 53
   UNDETECTED (suite still 30/30): 31
   undetected lines: [310, 315, 329, 337, 350, 366, 476, 498, 503, 532, 540, 556, 572, 607, 678, 719, 729, 858, 868, 904, 911, 928, 954, 996, 1006, 1046, 1133, 1147, 1171, 1183, 1223]
   Harness sensitivity confirmed by the caught cases, e.g. "caught line 293 error 27/30 validator checks passed — 3 FAILED." and "caught line 942 error 28/30 ... […]
```

**Why it matters** — A session that edits or degrades the validator, runs seed:verify, sees 30/30 and concludes nothing was harmed. MANUAL.html is the operating manual a fresh session is pointed at, so this is the claim most likely to be relied on. Combined with the absence of a hook or CI, the control described here is neither complete nor automatic.

**Fix**

Rewrite the sentence to state what the suite actually guarantees ("a drop below full count proves a validator rule broke; full count does not prove none did — see the coverage gaps"), and if tamper-detection is genuinely wanted, either add the missing negative cases or add a checksum/hook so seed:verify runs automatically.

**Verify**

```bash
npm run seed:verify   # passes either way; the claim about coverage is what must change
```

---

### A-25 · MANUAL.html states npm audit reports 16 findings (4 moderate, 12 high); actual is 8 (4 moderate, 4 high)

| | |
|---|---|
| **Severity** | medium |
| **Location** | `MANUAL.html:395` |
| **Found by** | 1 independent auditor — `build-health` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
394:     <p>
395:       <code>npm audit</code> reports 16 findings (4 moderate, 12 high), all build-time only.
396:       <code>npm audit fix --force</code> installs Next.js&nbsp;9 and destroys the app. The
```

**What is wrong**

TASKS.md:219 — the single source of truth — records the npm audit state as "today it is **12 high / 4 moderate**", and commit 722e0c6 propagated that figure into two new published renderings: MANUAL.html:395 ("`npm audit` reports 16 findings (4 moderate, 12 high), all build-time only.") and conduct/QUICKCARD.md:102-103 ("The 16 findings are build-time only and deliberately left alone."). The actual figure against the same tracked, unmodified lockfile is 8 vulnerabilities (4 moderate, 4 high) — reproduced identically by `npm audit`, `npm audit --package-lock-only`, and `npm audit --json` (metadata.vulnerabilities = {moderate:4, high:4, total:8}; 8 vulnerability keys, 8 nodes, 11 via entries, 6 distinct advisories). The moderate count is correct; the high count is wrong by 3x, and "16" is merely 4+12. This is not dependency drift: package-lock.json was last modified in cbc9082 (2026-07-24), an ancestor of the audited range, and the working tree is clean — so the same lockfile that produces 8/4/4 today produced the docs' 16/4/12 claim on 2026-07-31. No document in the repo acknowledges the count as approximate or stale (the documented-deliberate decision covers only "leave it alone", which remains correct). Fix belongs in TASKS.md:219 first, then both renderings.

**Evidence as filed**

```text
MANUAL.html:395 — "<code>npm audit</code> reports 16 findings (4 moderate, 12 high), all build-time only."

Literal `npm audit` tail:
  "8 vulnerabilities (4 moderate, 4 high)"

Literal `npm audit --json` metadata:
  metadata.vulnerabilities: {"info": 0, "low": 0, "moderate": 4, "high": 4, "critical": 0, "total": 8}
  len(vulnerabilities keys): 8
    @esbuild-kit/core-utils | sev moderate ... @esbuild-kit/esm-loader | sev moderate ... brace-expansion | sev high ... drizzle-kit | sev moderate ... esbuild | sev moderate ... next | sev high ... postcss | sev high ... sharp | sev high

`git ls-files | grep -iE 'package-lock'` → package-lock.json (tracked, so the dependency tree is pinned; this is not dependency drift).
```

**Independent reproduction by the refuting auditor**

```text
MANUAL.html:392-399 (read directly):
  392	  <div class="box care">
  393	    <span class="tag">Also true</span>
  394	    <p>
  395	      <code>npm audit</code> reports 16 findings (4 moderate, 12 high), all build-time only.
  396	      <code>npm audit fix --force</code> installs Next.js&nbsp;9 and destroys the app. The
  397	      leave-it-alone decision is deliberate and logged.

TASKS.md:219 — "The `npm audit` note above is stale: it says 3 high / 1 moderate, today it is **12 high / 4 moderate**, including an `eslint → brace-expansion` chain the note's reasoning never covered."
conduct/QUICKCARD.md:102-103 — "Also: `npm audit fix --force` installs Next.js 9 and destroys the app. The 16 / findings are build-time only and deliberately left alone."

`npm audit` (npm 11.12.1, node v26.0.0) tail:
  "8 vulnerabilities (4 moderate, 4 high)"
`npm audit --package-lock-only`:
  "8 vulnerabilities (4 moderate, 4 high)"
`npm audit --package-lock-only --json` → metadata.vulnerabilities:
  {'info': 0, 'low': 0, 'moderate': 4, 'high': 4, 'critical': 0, 'total': 8}
  keys: ['@esbuild-kit/core-utils', '@esbuild-kit/esm-loader', 'brace-expansion', 'drizzle-kit', 'esbuild', 'next', 'postcss', 'sharp']
`npm audit --omit=dev` → "3 high severity vulnerabilities"

Exhaustive count of every countable primitive in npm audit --json (python3 over the JSON):
  8 vulnerability keys | total via entries: 11 | advisory objects: 6 | total nodes: 8
  severity by package: {moderate: 4, high: 4}; severity b […]
```

**Why it matters** — MANUAL.html is a published rendering whose stated purpose is to be the operator's reference. A reader who runs `npm audit` sees 8/4/4 and cannot reconcile it with the document, which undermines trust in the surrounding (and correct) advice not to run `npm audit fix --force`. It also makes the number useless as a drift tripwire: a future real increase from 8 to, say, 12 high would still read as "better than documented."

**Fix**

Update MANUAL.html:395 to "8 vulnerabilities (4 moderate, 4 high)", and state the counting basis and the date the count was taken (npm audit is registry-live, so the number legitimately moves even with a frozen lockfile). Secondary: "all build-time only" is defensible today but not structurally guaranteed — `sharp` is an optionalDependency of `next` used by the production image optimizer (`npm ls sharp` → next@16.2.11 → sharp@0.34.5), and src/app/page.tsx:1 imports `next/image`; it only stays build-time because the two images used (page.tsx:9 "/next.svg", :46 "/vercel.svg") are SVGs, which bypass sharp. Worth wording as "not currently reachable at runtime" rather than "build-time only".

**Verify**

```bash
npm audit --json | python3 -c "import json,sys;print(json.load(sys.stdin)['metadata']['vulnerabilities'])"
```

---

### A-26 · MANUAL.html says three commits unpushed; git reports seven (and four when the manual landed)

| | |
|---|---|
| **Severity** | medium |
| **Location** | `MANUAL.html:507` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
506:   <div class="stage">
507:     <div class="stage-head"><span class="who human">Yours</span><span class="stage-title">Push</span><span class="stage-num">3 commits local</span></div>
508:     <div class="stage-body">
```

**What is wrong**

MANUAL.html states an unpushed-commit count of 3 in two places — line 507 (§05 "Decisions only you can make", not §9 as filed: `<span class="stage-num">3 commits local</span>`) and line 776 (§10 "Known debts": `<strong>Three commits unpushed</strong>`) — and conduct/QUICKCARD.md:56-57 repeats it ("Commits are local by design — pushing is outward-facing. Three are pending"). The true count is 7 at HEAD, confirmed against the live remote (`git ls-remote origin refs/heads/main` = 813a0fb = local `origin/main`, so this is not a stale tracking ref). It was also already off by one when it shipped: MANUAL.html was added in 722e0c6, at which point `git rev-list --count origin/main..722e0c6` = 4 — the figure STRUCTURE.md:10 records for that same commit. "3" was true only for the working tree immediately before the manual's own commit.

Severity is medium, not high, for reasons I verified: (a) the qualitative substance of the debt is accurate and still true — all four commits added since authorship are documentation-only (722e0c6 = MANUAL.html/QUICKCARD.md + prose edits to CLAUDE.md/STATUS.html/TASKS.md/data/README.md; df3f299, ae6322c, 00a08ec = STRUCTURE.md/.txt/.pdf only, per `git show --stat`), so no data, rulings, or code beyond what §05 already enumerates ("the kernel adoption, the citation-split schema change, and all of the task 1.5/1.6 curation — five recorded rulings and 607 cited data points") sits unreplicated; (b) the condition itself is documented as a deliberately accepted debt (it is a row in the "Known debts" table, pushing is a reserved human power per CONSTITUTION.md:42, and QUICKCARD.md:56 says commits are local "by design"); (c) MANUAL.html:823 carries a drift caveat ("Counts and warning baselines drift — re-derive them ... rather than trusting this page"), though it points at `npm run seed:dry`, which cannot produce a git commit count, so it only partially covers this figure; (d) no operator decision turns on the integer — `git push` pushes all 7 either way. The filed impact claim ("no basis to decide whether four extra commits are legitimate") is overstated: `git log origin/main..HEAD` names them and they are the manual/quickcard and STRUCTURE-snapshot commits from the same session. What remains is a real defect: a number that was false at ship time, duplicated across two of the three operator-facing docs, and contradicted by the repo's own snapshot (STRUCTURE.md:10 = 4) — against a project rule requiring honest numbers even when unflattering, where the error understates the debt.

**Evidence as filed**

```text
MANUAL.html:507
<div class="stage-head"><span class="who human">Yours</span><span class="stage-title">Push</span><span class="stage-num">3 commits local</span></div>
MANUAL.html:776
<tr><td><strong>Three commits unpushed</strong></td><td>One machine holds five rulings and 607 cited data points.</td></tr>

$ git rev-list --count origin/main..HEAD
7
$ git rev-list --oneline origin/main..HEAD
00a08ec Fix self-referential mangling in STRUCTURE conversion
ae6322c Fix STRUCTURE.pdf clipping: render landscape, record the recipe
df3f299 Add STRUCTURE reference snapshot in markdown, text and PDF
722e0c6 Add operator manual and quick card; correct four docs against verified state
5de914f Curate Stanford, MIT, Princeton + Harvard returns tail (tasks 1.5, 1.6)
d1920ec Adopt Conduct kernel v1.0.0; split endowment_returns citations per figure
a2eb063 Build Conduct framework Phases A-B: skills, kernel (staged), replay, pilot plan

STRUCTURE.md:10 (snapshot of 722e0c6)  | Unpushed commits | 4 |
```

**Independent reproduction by the refuting auditor**

```text
$ git rev-list --count origin/main..HEAD
7
$ git log --oneline origin/main..HEAD
00a08ec Fix self-referential mangling in STRUCTURE conversion
ae6322c Fix STRUCTURE.pdf clipping: render landscape, record the recipe
df3f299 Add STRUCTURE reference snapshot in markdown, text and PDF
722e0c6 Add operator manual and quick card; correct four docs against verified state
5de914f Curate Stanford, MIT, Princeton + Harvard returns tail (tasks 1.5, 1.6)
d1920ec Adopt Conduct kernel v1.0.0; split endowment_returns citations per figure
a2eb063 Build Conduct framework Phases A-B: skills, kernel (staged), replay, pilot plan
$ git status -sb | head -1
## main...origin/main [ahead 7]

Remote is NOT stale (this was my main refutation attempt):
$ git ls-remote origin refs/heads/main
813a0fb1461d5db61cd6375df8210592482e0a18	refs/heads/main
$ git rev-parse origin/main
813a0fb1461d5db61cd6375df8210592482e0a18

$ grep -n "commits local|commits unpushed|unpushed" MANUAL.html
507:    <div class="stage-head"><span class="who human">Yours</span><span class="stage-title">Push</span><span class="stage-num">3 commits local</span></div>
776:      <tr><td><strong>Three commits unpushed</strong></td><td>One machine holds five rulings and 607 cited data points.</td></tr>

MANUAL.html:511-514 (body of the same stage, substance is accurate):
"Pushing auto-deploys, so it stays your call. […]
```

**Why it matters** — The manual is the operator's instruction sheet for a reserved action (pushing auto-deploys, so it is the human's call). It understates by more than half how much unreplicated work sits on one machine — the whole framework build, the kernel adoption, the citation-split schema change and the entire 1.5/1.6 curation. An operator reconciling '3' against git's '7' has no basis to decide whether four extra commits are legitimate.

**Fix**

Replace the hard-coded count in both places with a re-derived figure, or state it as 'run git rev-list --count origin/main..HEAD' the way §4 already tells the operator to re-derive the row counts with npm run seed:dry. If a fixed number is kept, it must be 7.

**Verify**

```bash
git rev-list --count origin/main..HEAD
```

---

### A-27 · MANUAL says the JUDGMENT CALL grep finds four entries; it finds seven hits, six real

| | |
|---|---|
| **Severity** | medium |
| **Location** | `MANUAL.html:579` |
| **Found by** | 3 independent auditors — `framework-coherence`, `docs-vs-reality`, `html-artifacts` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
578:       <tr><td class="cmd">grep -n "\[PROXY DECISION\]" TASKS.md</td><td>Eight hits, of which <strong>five are actual rulings</strong> &mdash; the others are the tag&rsquo;s own definition, a task-line mention, and a replay reference.</td></tr>
579:       <tr><td class="cmd">grep -n "\[JUDGMENT CALL\]" TASKS.md</td><td>Four small calls made without escalation, each with its reasoning.</td></tr>
580:       <tr><td class="cmd">grep -n "\[HITL\]" TASKS.md</td><td>Your own recorded answers. One so far.</td></tr>
```

**What is wrong**

MANUAL.html:579 tells the operator that `grep -n "\[JUDGMENT CALL\]" TASKS.md` finds "Four small calls made without escalation, each with its reasoning." The command as printed returns SEVEN hits in TASKS.md at HEAD (00a08ec): line 131 is the tag's own definition, and lines 138, 166, 191, 241, 242, 254 are six recorded judgment calls (five bullets led by the tag, plus :191 where the tag appears mid-bullet — "Sequencing was a [JUDGMENT CALL]" — with its own escalation reasoning). So "four" matches neither the real-entry count (6) nor the hit count (7) under any reading.

Stronger than the original finding: "four" was never correct for real calls at any point in the audited range, and was already stale at the moment MANUAL.html was written. Counting hits per commit — a2eb063: 4, d1920ec: 4, 5de914f: 6, 722e0c6: 7, HEAD: 7. Four is the raw HIT count as of d1920ec, where only three were real calls (:136/:138 sign error, :164/:166 instrument selection, :189/:191 sequencing). MANUAL.html was ADDED in 722e0c6 (`git show --stat 722e0c6` shows `MANUAL.html | 829 +++++`), the same commit that raised TASKS.md to 7 hits — so the number was inherited from a two-commits-earlier state and was wrong on arrival, not degraded afterward.

Severity is medium, not high. The manual's own convention proves the row is a lapse rather than a convention (the adjacent [PROXY DECISION] row is meticulous: "Eight hits, of which five are actual rulings — the others are the tag's own definition, a task-line mention, and a replay reference," which I confirmed exactly: 8 hits at :26, :131, :142, :151, :176, :198, :225, :240, of which :142/:151/:176/:198/:240 are the five rulings). But blast radius is one table cell: the command the manual hands the operator returns the complete, truthful list, and every entry is self-documenting with its own reasoning inline, so the operator cannot be misled about WHAT was decided — only about how many, a discrepancy that resolves in seconds by reading the output he was told to produce. No published figure, citation, data series, or build is affected. The original finding's "corrodes exactly the trust the audit section exists to establish" overstates it. Correct fix: "Seven hits, of which six are actual calls — the seventh is the tag's own definition."

Not documented as accepted debt: STRUCTURE.md's "Structural notes worth carrying" (lines 168-184) lists PRD.md's deliberate staleness, conduct/fragments/1.6/, data/README.md's size, root README.md, and tsconfig's **/*.ts — nothing about MANUAL.html's counts. MANUAL.html carries no as-of/snapshot/approximate disclaimer (the only "generated" hit is line 740, about sources). STRUCTURE.md:163-164 in fact rules against it: "All four are renderings. TASKS.md is the source of truth; if a document disagrees with it, the document is stale."

**Also reported at this site**

- _docs-vs-reality_ (medium) — MANUAL.html's [JUDGMENT CALL] grep count is wrong: claims four, actual is six

  MANUAL.html:579 says of `grep -n "\[JUDGMENT CALL\]" TASKS.md`: "Four small calls made without escalation, each with its reasoning." The grep returns 7 lines; TASKS.md:131 is the tag's own definition, leaving SIX real logged judgment calls (TASKS.md:138, 166, 191, 241, 242, 254). No reading yields four. This is stale-at-birth, not post-publication drift: MANUAL.html was introduced in commit 722e0c6, the same commit that last touched TASKS.md, and at that commit the count was already 7 hits / 6 calls. […]

- _html-artifacts_ (medium) — MANUAL.html §7 states a grep finds four judgment calls; it finds six (five when written)

  MANUAL.html:579 states that `grep -n "\[JUDGMENT CALL\]" TASKS.md` finds "Four small calls made without escalation, each with its reasoning." It finds seven lines: TASKS.md:131 (the tag's own definition) plus six substantive calls at lines 138, 166, 191, 241, 242 and 254 — so the row is wrong under either reading (7 hits, 6 calls). Unlike the adjacent PROXY DECISION row, which correctly nets out its non-ruling hits, this row neither excludes the definition line nor matches the real count. […]


**Evidence as filed**

```text
MANUAL.html:579: '<tr><td class="cmd">grep -n "[JUDGMENT CALL]" TASKS.md</td><td>Four small calls made without escalation, each with its reasoning.</td></tr>'. Literal output of grep -n -o '[JUDGMENT CALL]' TASKS.md: 131 (tag definition), 138, 166, 191, 241, 242, 254 -- seven hits. The six real entries: :138 'A sign error caught in transcription', :166 'Instrument selection -- prefer longest continuous history', :191 'Sequencing was a [JUDGMENT CALL]', :241 'Stanford''s fiscal year ends August 31', :242 'Single data commit instead of per-school commits', :254 'Corrected the docs rather than only reporting them'.
```

**Independent reproduction by the refuting auditor**

```text
1) grep -n 'JUDGMENT CALL' MANUAL.html -> single hit:
579:      <tr><td class="cmd">grep -n "\[JUDGMENT CALL\]" TASKS.md</td><td>Four small calls made without escalation, each with its reasoning.</td></tr>

2) Ran the documented command verbatim: grep -n "\[JUDGMENT CALL\]" TASKS.md -> lines 131, 138, 166, 191, 241, 242, 254. grep -c -> 7.
  :131 "...unescalated small calls are tagged `[JUDGMENT CALL]`" (definition)
  :138 "**`[JUDGMENT CALL]` A sign error caught in transcription.**"
  :166 "**`[JUDGMENT CALL]` Instrument selection — prefer longest continuous history over most familiar ticker.**"
  :191 "...Sequencing was a **`[JUDGMENT CALL]`**: task 1.5 (curate Harvard) was next, but the validator..."
  :241 "**`[JUDGMENT CALL]` Stanford's fiscal year ends August 31, not June 30**"
  :242 "**`[JUDGMENT CALL]` Single data commit instead of per-school commits.**"
  :254 "**`[JUDGMENT CALL]` Corrected the docs rather than only reporting them.**"

3) sed -n '555,600p' MANUAL.html — read the full audit table. Section 07 "Auditing what was decided for you", intro "The whole point of proxied decisions is that they stay reversible. Four greps:". Confirmed the other three rows are exactly right:
  [PROXY DECISION] -> grep -c = 8; hits at :26 (task line), :131 (definition), :142, :151, :176, :198, :225 (golden-replay reference), :240 -> five actual rulings. […]
```

**Why it matters** — The operator audits unsupervised autonomous decisions by this table. Told to expect four, he finds seven and cannot tell whether three are undocumented additions or a stale count -- which corrodes exactly the trust the audit section exists to establish. Two of the uncounted three (:241 Stanford fiscal year, :254 doc corrections) are substantive.

**Fix**

Change the row to 'Seven hits; six are real calls, the seventh is the tag''s own definition' -- matching the shape already used correctly in the [PROXY DECISION] row.

**Verify**

```bash
grep -c "\[JUDGMENT CALL\]" TASKS.md   # 7 hits; 6 are real calls, line 131 is the tag definition
```

---
