# WP4b — Re-render `STATUS.html` from the corrected ledger

8 work orders. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

The live build-status page, and the most drifted document in the repo: 8 of the 37 high/medium sites are here. Its failure mode is uniform — a count in prose that no longer matches the elements rendered beneath it, or a ledger figure that moved after the page was written.

All three HTML files are renderings, by the repo's own definition. Once WP1–WP3 land they can be corrected against a ledger that is actually true. This is the largest package (17 orders) and the least subtle: most are counts that drifted from the ledger, plus one document that still describes the framework as an unsigned draft.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-20` | high | `STATUS.html` | 453 | STATUS.html "Waiting on you: 2" contradicts its own tile note, its own lede, and MANUAL.html… |
| `A-21` | high | `STATUS.html` | 534 | STATUS.html turns the pilot's QC sample into a census: "each row re-verified" |
| `A-28` | medium | `STATUS.html` | 531 | STATUS.html says Yale is "25 years of allocations and returns"; the data has 21 and 26 |
| `A-29` | medium | `STATUS.html` | 635 | STATUS.html claims every figure cites "a specific document and page"; 253 of 607 cite a sour… |
| `A-30` | medium | `STATUS.html` | 686 | STATUS.html: Princeton "FY2005–FY2023, 2 gaps" — there is exactly one gap in that span |
| `A-31` | medium | `STATUS.html` | 723 | STATUS.html says five escalated decisions, renders six, two of which were not escalated up |
| `A-32` | medium | `STATUS.html` | 755 | "Six Harvard tables carry no date" — only five undated tables are curated |
| `A-33` | medium | `STATUS.html` | 767 | STATUS.html implies negative allocation weights are stored; zero exist in any school file |

---

### A-20 · STATUS.html "Waiting on you: 2" contradicts its own tile note, its own lede, and MANUAL.html's three

| | |
|---|---|
| **Severity** | high |
| **Location** | `STATUS.html:453` |
| **Found by** | 2 independent auditors — `docs-vs-reality`, `html-artifacts` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
452:       <div class="tile-label">Waiting on you</div>
453:       <div class="tile-value attn">2</div>
454:       <div class="tile-note">A toggle, a review gate, a push</div>
```

**What is wrong**

STATUS.html's "Waiting on you" block contains two independently verifiable defects, one of which is a rendering asserting something materially false about repo state:

(1) STALE LEDE — materially false. STATUS.html:461-462 tells the operator that "a constitutional signature" is still "reserved to you." The kernel was signed and adopted 2026-07-30: `.claude/skills/escalate/references/kernel.md:5-7` reads `status: ADOPTED / signed-by: Amay Bhatnagar (explicit in-session approval) / signed-date: 2026-07-30`; `conduct/ADOPTION.md:86-99` records "**Applied 2026-07-30** by the Fable build session, same day, verbatim. The kernel stamp is now `1.0.0 / ADOPTED`"; and the source of truth records it at TASKS.md:231 "**2026-07-30 — [HITL] Kernel v1.0.0 signed and adopted... All four decisions answered explicitly by the human in-session.**" Git proves the lede is an unedited survivor: at a2eb063 the tile read `value 3` / note "A toggle, a review gate, a signature" and the lede matched; 5de914f changed the tile to `2` / "A toggle, a review gate"; 722e0c6 changed the note to "A toggle, a review gate, a push"; the lede byte-string at lines 460-463 is identical in all four of a2eb063, 5de914f, 722e0c6 and 00a08ec. The tile was corrected twice, the sentence beneath it never. Per STRUCTURE.md:163-164 ("All four are **renderings**. `TASKS.md` is the source of truth; if a document disagrees with it, the document is stale") this is by the project's own rule a wrong rendering.

(2) SELF-CONTRADICTING TILE. STATUS.html:453-454 puts `2` immediately above a note that enumerates three items ("A toggle, a review gate, a push"). Two action cards exist and neither is the push (`grep -c 'class="action"' STATUS.html` → 2; cards at :465 idx "6.4" and :479 idx "A"; `grep -i push STATUS.html` returns only :454, :514, :527, the last two unrelated prose about auto-deploying).

WEAKEST SUB-CLAIM, partially discounted: the original framing of "three different counts across two documents" overstates the MANUAL divergence. STATUS's `2` is defensible on its own terms — TASKS.md carries exactly one `[H]` task (TASKS.md:59, task 6.4) plus the Checkpoint A agenda item (TASKS.md:31), and the push is not a ledger task. MANUAL.html:445 "Three are open right now" simply also counts the push as a stage (MANUAL.html:509-517, "Push / 3 commits local"). That is a difference in what gets counted, not necessarily an error in either count. The defect is not that STATUS says 2, it is that STATUS's own note and lede each enumerate three while the value says two, and that the third item the lede names was completed a day before the render date (STATUS.html:430 "31 July 2026").

Adjacent, separately reportable: MANUAL.html:513 says "3 commits local", but `git rev-list --count @{u}..HEAD` = 7 (upstream `origin/main` = 813a0fb, behind even a2eb063). Both documents are wrong about the push, in different directions.

**Also reported at this site**

- _html-artifacts_ (high) — STATUS.html 'Waiting on you' tile says 2, names three items, and lists only two — the third was already done

  STATUS.html's "Waiting on you" block is internally inconsistent in two independently-introduced ways, and one of them asserts something materially false about the repo.

(1) Tile arithmetic (introduced 722e0c6). STATUS.html:453 `<div class="tile-value attn">2</div>` against STATUS.html:454 `<div class="tile-note">A toggle, a review gate, a push</div>` — three nouns, value 2. The section below renders exactly two action blocks (`grep -c 'class="action"' STATUS.html` -> 2; `action-idx` at lines 466 = "6.4" and 480 = "A"). […]


**Evidence as filed**

```text
STATUS.html:452-454
      <div class="tile-label">Waiting on you</div>
      <div class="tile-value attn">2</div>
      <div class="tile-note">A toggle, a review gate, a push</div>

STATUS.html:461-462
      None of these can be done by a build session — a dashboard setting, a judgement about
      what version one means, and a constitutional signature are all reserved to you.

$ grep -c 'class="action"' STATUS.html
2
(the two cards are STATUS.html:466 '6.4' and STATUS.html:480 'A' — no push card)

The 'constitutional signature' is complete:
.claude/skills/escalate/references/kernel.md:5-7   status: ADOPTED / signed-by: Amay Bhatnagar / signed-date: 2026-07-30
conduct/ADOPTION.md:86-87                          signed-by ... all four edits + kernel / signed-date: 2026-07-30

MANUAL.html §5 (raw line 445 region, rendered): "05 Decisions only you can make — Three are open right now." with stages: Deployment Protection (task 6.4), Checkpoint A, Push.
```

**Independent reproduction by the refuting auditor**

```text
$ sed -n '451,491p' STATUS.html  (line numbers verified)
451      <div class="tile">
452        <div class="tile-label">Waiting on you</div>
453        <div class="tile-value attn">2</div>
454        <div class="tile-note">A toggle, a review gate, a push</div>
455      </div>
...
460      <p class="lede">
461        None of these can be done by a build session — a dashboard setting, a judgement about
462        what version one means, and a constitutional signature are all reserved to you.
463      </p>
465      <div class="action">
466        <div class="action-idx">6.4</div>
479          <div class="action">
480        <div class="action-idx">A</div>
491    </section>

$ grep -c 'class="action"' STATUS.html
2

$ grep -n -i 'push|signature|sign' STATUS.html
454:      <div class="tile-note">A toggle, a review gate, a push</div>
462:      what version one means, and a constitutional signature are all reserved to you.
514:  ...all wired and auto-deploying on push        (unrelated)
527:  ...schema and seed-file format designed        (unrelated)
-> no Push action card exists.

$ for c in a2eb063 5de914f 722e0c6 00a08ec; do git show $c:STATUS.html | grep -A3 'tile-label">Waiting on you'; git show $c:STATUS.html | grep -A3 'class="lede"' | head -8; done
a2eb063:  453 value attn">3   454 note "A toggle, a review gate, a signature"   461-462 lede "...and a constitutional signature are all reserved to you."
5de914f:  453 value attn">2   454 note "A toggle, a review gate" […]
```

**Why it matters** — Three different counts of the human's open queue appear across two documents that STRUCTURE.md:163 says are both renderings of one ledger: 2 (STATUS tile and card count), 3 (STATUS tile note and lede), 3 (MANUAL). The lede additionally tells the operator a constitutional signature is outstanding when it was given a day earlier, and the push — the item MANUAL treats as Stage 0 — has no card at all in the state document.

**Fix**

Set the tile to 3, add a third action card for the unpushed commits (with the re-derived count), and replace 'a constitutional signature' in the lede with 'a push that deploys', so STATUS and MANUAL agree on the same three reserved items.

**Verify**

```bash
grep -c 'class="action"' STATUS.html   # rendered blocks must equal the tile value
```

---

### A-21 · STATUS.html turns the pilot's QC sample into a census: "each row re-verified"

| | |
|---|---|
| **Severity** | high |
| **Location** | `STATUS.html:534` |
| **Found by** | 1 independent auditor — `completeness-critic` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
533:           <li class="task is-done"><span class="task-id">1.5</span><span class="glyph g-done">&#10003;</span><span class="task-text">Harvard complete &mdash; 77 allocation rows, and the returns series now runs unbroken FY2000&ndash;FY2025</span></li>
534:           <li class="task is-done"><span class="task-id">1.6</span><span class="glyph g-done">&#10003;</span><span class="task-text">Stanford, MIT and Princeton curated &mdash; four parallel workers, each row re-verified against independently fetched documents before landing</span>
535:             <span class="task-note">MIT&rsquo;s only published allocation tables turned out to live in its answers to Congress; Stanford&rsquo;s allocations are an honest, documented gap.</span>
```

**What is wrong**

STATUS.html:534 renders task 1.6 as "Stanford, MIT and Princeton curated &mdash; four parallel workers, each row re-verified against independently fetched documents before landing". The ledger records that only two of the four units were verified row-by-row; the other two were sampled, by design. TASKS.md:239 is explicit: "Princeton: 33 figures re-verified against Actual columns" and "Stanford: FY2010 exact incl. cross-note corroboration" — against "MIT: 100% verification" and the Harvard tail's 8-of-8. Princeton landed 128 rows (104 allocations + 24 returns, 149 individual figures); 33 figures is at most 22% of them. Stanford landed 26 market-value rows; one fiscal year was re-verified. So of the 222 rows task 1.6 landed, 154 (Princeton's 128 + Stanford's 26) were not each re-verified. Sampling was the deliberate design, not a shortfall: conduct/plans/1.6-plan.md:63-76 titles the section "Sampling plan (1.6.QC) — sample where the machine is blind" and prescribes "One random year per school, drawn by the conductor after delivery"; .claude/skills/conduct/SKILL.md:74 states the doctrine — "Full re-review of everything would erase the economics; sampling is the compromise". The sentence was introduced inside the audit window: `git show a2eb063:STATUS.html | grep -c 'each row re-verified'` → 0, `git show 5de914f:STATUS.html | grep -c` → 1. No other document makes this claim — MANUAL.html and the QUICKCARD both describe sampling correctly, and repo-wide grep for 'each row'/'every row' finds this line and nothing comparable. It is not recorded as accepted debt in STRUCTURE.md:168-190, MANUAL.html:767-778 or TASKS.md:253.

**Evidence as filed**

```text
STATUS.html:534: `<span class="task-text">Stanford, MIT and Princeton curated &mdash; four parallel workers, each row re-verified against independently fetched documents before landing</span>`
TASKS.md:239: `**QC record — 4/4 units passed...** Princeton: 33 figures re-verified against Actual columns with the Target-column trap disproven per year; ... MIT: 100% verification — all 24 congressional-table rows digit-perfect ... Stanford: FY2010 exact incl. cross-note corroboration`
conduct/plans/1.6-plan.md:65-67: `2. One random year per school, drawn by the conductor after delivery, **excluding the worker's own spot-check years** ...; primary document re-fetched, every figure compared.`
.claude/skills/conduct/SKILL.md:74: `Full re-review of everything would erase the economics; sampling is the compromise, and a failed sample re-routes the unit up a tier.`
Row counts recomputed from the JSON: princeton.json 104 allocations + 24 returns = 128 rows; stanford.json 0 allocations + 26 returns = 26 rows.
```

**Why it matters** — The single strongest assurance sentence on the project's public-facing status page overstates the evidence behind 154 of the 222 rows that task 1.6 landed. The human reads this page at Checkpoint A to decide whether the data is trustworthy enough to build an interface on; it tells him a census was performed where the ledger records a 22%-and-one-year sample. It also silently contradicts the framework's own published economics (sampling is the compromise that makes Sonnet-tier routing legitimate), so a reader who believed the line would conclude the pilot's cost model is unnecessary.

**Fix**

Change the task-1.6 text to match TASKS.md:239 — e.g. "four parallel workers, then per-unit QC at a tier above the producer against independently re-fetched documents: MIT and the Harvard tail verified in full, Princeton and Stanford sampled (random year + every regime boundary)".

**Verify**

```bash
grep -n "re-verified" STATUS.html   # must not claim a census where TASKS.md:239 records a sample
```

---

### A-28 · STATUS.html says Yale is "25 years of allocations and returns"; the data has 21 and 26

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STATUS.html:531` |
| **Found by** | 2 independent auditors — `data-consistency`, `docs-vs-reality` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
530:           </li>
531:           <li class="task is-done"><span class="task-id">1.3</span><span class="glyph g-done">&#10003;</span><span class="task-text">Yale curated &mdash; 25 years of allocations and returns from the annual reports</span></li>
532:           <li class="task is-done"><span class="task-id">1.4</span><span class="glyph g-done">&#10003;</span><span class="task-text">Benchmark series curated &mdash; what the S&amp;P 500, bonds, international equity, REITs and cash actually returned each fiscal year</span></li>
```

**What is wrong**

STATUS.html:531 (rendering TASKS.md task 1.3) reads "Yale curated &mdash; 25 years of allocations and returns from the annual reports". Yale's allocations cover 21 fiscal years, FY2000-FY2020 (126 rows, verified from data/schools/yale.json, no gaps), so "25 years of allocations" overstates coverage by 4-5 years and collapses the FY2020 allocation-disclosure stop that TASKS.md:23, data/README.md:679, MANUAL.html:482 ("Yale — 21 allocation years"), and STATUS.html's own coverage table (lines 651-657: "FY2000-FY2020") all state correctly. The finding's secondary claim — that the line also understates return coverage by one year — should be dropped: returns do run FY2000-FY2025 (26 rows), and "25 years" is this repo's standing phrase for that span (STATUS.html:425, data/README.md:23, TASKS.md:85), so only the allocations half is an error. Not acknowledged anywhere as accepted debt: STRUCTURE.md's structural notes (lines 168-186) list four known debts and this is not among them, while STRUCTURE.md:163-164 states that a rendering disagreeing with TASKS.md is stale.

**Also reported at this site**

- _docs-vs-reality_ (medium) — STATUS.html: "Yale curated — 25 years of allocations and returns" — 21 allocation years, 26 return years

  The task 1.3 line reads 'Yale curated — 25 years of allocations and returns from the annual reports'. Yale has 126 allocation rows spanning 21 fiscal years (FY2000-FY2020) and 26 return rows (FY2000-FY2025). Neither series is 25 years, and the document's own table two sections later gives the allocation span as FY2000-FY2020.


**Evidence as filed**

```text
STATUS.html:531  "<span class=\"task-text\">Yale curated &mdash; 25 years of allocations and returns from the annual reports</span>"
TASKS.md:23  "Returns + market values curated FY2000–FY2025 (26 rows). **Allocations curated FY2000–FY2020 only (126 rows), not FY2025**"
$ python3 (yale.json)  126 alloc rows, 21 years FY2000..FY2020; 26 return rows FY2000..FY2025
$ awk data/README.md:679  "| `schools/yale.json` | 126 allocation rows (FY2000–FY2020, actual) + 26 return/market-value rows (FY2000–FY2025). |"
```

**Independent reproduction by the refuting auditor**

```text
$ grep -n "25 years of allocations" STATUS.html
531:          <li class="task is-done"><span class="task-id">1.3</span>...<span class="task-text">Yale curated &mdash; 25 years of allocations and returns from the annual reports</span></li>

$ python3 -c "... data/schools/yale.json ..."
alloc years: 21 2000 2020
[2000, 2001, ..., 2020]
return years: 26 2000 2025
[2000, 2001, ..., 2025]
missing in alloc range: []
missing in return range: []
(allocations len 126, endowmentReturns len 26)

$ awk 'NR==23' TASKS.md
- [x] 1.3 Curate Yale: FY2000-FY2025 allocations ... — Returns + market values curated FY2000–FY2025 (26 rows). **Allocations curated FY2000–FY2020 only (126 rows), not FY2025**

$ awk 'NR==679' data/README.md
| `schools/yale.json` | 126 allocation rows (FY2000–FY2020, actual) + 26 return/market-value rows (FY2000–FY2025). |

$ grep -n "21 allocation years" MANUAL.html
482:        <li><strong>Yale</strong> &mdash; 21 allocation years; stopped publishing after FY2020.</li>

$ sed -n '651,657p' STATUS.html   (same page, coverage table)
<td class="row-name">Yale</td> <td class="num">126</td> <td class="span">FY2000&ndash;FY2020</td> <td class="num">26</td> <td class="span">FY2000&ndash;FY2025</td>

$ sed -n '484p' STATUS.html
... <strong>Yale</strong> stopped disclosing its allocation mix after FY2020. ...

$ sed -n '160,186p' STRUCTURE.md
"All four are **renderings**. […]
```

**Why it matters** — The status page overstates Yale's allocation coverage by 4 years and understates its return coverage by 1, and collapses the coverage-end gap that the rest of the repo goes to considerable trouble to document (the very next STATUS.html item correctly says "Yale stopped publishing its mix after FY2020"). Per project rule 2 a rendering that disagrees with TASKS.md is wrong.

**Fix**

Change STATUS.html:531 to "Yale curated — allocations FY2000–FY2020 (21 years, 126 rows), returns and market values FY2000–FY2025 (26 years)", matching TASKS.md:23.

**Verify**

```bash
python3 -c "import json;y=json.load(open('data/schools/yale.json'));print(len({r['fiscalYear'] for r in y['allocations']}),'alloc years,',len(y['endowmentReturns']),'return rows')"
```

---

### A-29 · STATUS.html claims every figure cites "a specific document and page"; 253 of 607 cite a source with no page

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STATUS.html:635` |
| **Found by** | 1 independent auditor — `completeness-critic` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
634:       Every figure below is loaded from hand-curated files and carries a citation to a specific
635:       document and page. Gaps are real gaps &mdash; nothing is estimated, interpolated, or carried
636:       forward from a neighbouring year to make a series look complete.
```

**What is wrong**

STATUS.html:634-636 introduces the coverage table with "Every figure below is loaded from hand-curated files and carries a citation to a specific document and page." Counting data/sources.json, 28 of the 95 sources carry no `page` field at all, and 253 of the 607 curated data points (41.7%) cite one of them: all 130 benchmark rows (bench-sp500tr, bench-vbmfx, bench-vgtsx, bench-vgsix, bench-tb3ms), all 77 Harvard allocation rows (hmc-annual-report-2011 … -2025, hmc-john-harvard-letter-2007/2008, hmc-endowment-report-2009), and 46 return/market-value figures (the four yale-news-fy20XX-return releases and princo-press-release-2019). The project's actual rule is a disjunction everywhere else it is stated: PRD.md:36 "source document + page/URL"; data/README.md:650 "**A source carries a `url` or a `page`.**"; scripts/lib/seed-validate.ts:618-621 implements exactly that (`if (url === null && page === null)`). STATUS.html is the only place the rule is rendered as a conjunction. Every one of the 95 sources does carry a URL (verified: 0 sources without `url`), so no citation is unlocatable — the defect is the overstatement, not a missing citation.

**Evidence as filed**

```text
STATUS.html:634-636: `Every figure below is loaded from hand-curated files and carries a citation to a specific\n      document and page. Gaps are real gaps &mdash; nothing is estimated, interpolated, or carried\n      forward from a neighbouring year to make a series look complete.`
data/README.md:650: `- **A source carries a \`url\` or a \`page\`.** PRD rule 2 asks for "source document + page/URL": a title-only citation resolves but nobody can re-check it...`
scripts/lib/seed-validate.ts:618-621: `if (url === null && page === null) { ... \`source \`${id}\` needs a \`url\` or a \`page\``
python3 count over data/sources.json: `total 95 no page 28 no url 0`; figures citing a page-less source: `Counter({'bench': 130, 'alloc': 77, 'ret': 23, 'mv': 23})` = 253.
```

**Why it matters** — The project's non-negotiable rule is "no citation, no number", and STATUS.html is where a reader checks whether it held. Stating a stricter standard than the repo enforces means a reader who spot-checks the claim — opening any Harvard allocation row or any benchmark row — finds it false on the first try, which discredits the 606 other citations that are in fact sound. It also misdescribes the standard for future curators, who read this page before data/README.md.

**Fix**

Change "a citation to a specific document and page" to "a citation to a specific document, with a page or a direct URL" — matching PRD.md:36, data/README.md:650 and what the validator enforces.

**Verify**

```bash
python3 -c "import json;s=json.load(open('data/sources.json'));print(len([x for x in s if not x.get('page')]),'of',len(s),'sources carry no page')"
```

---

### A-30 · STATUS.html: Princeton "FY2005–FY2023, 2 gaps" — there is exactly one gap in that span

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STATUS.html:686` |
| **Found by** | 4 independent auditors — `completeness-critic`, `cross-dimension`, `docs-vs-reality`, `html-artifacts` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
685:             <td class="num">104</td>
686:             <td class="span">FY2005&ndash;FY2023, 2 gaps</td>
687:             <td class="num">24</td>
```

**What is wrong**

The database table gives Princeton's allocation coverage as 'FY2005–FY2023, 2 gaps'. Princeton has 104 allocation rows across 18 distinct fiscal years; subtracting them from the stated span FY2005-FY2023 (19 years) leaves exactly one missing year, FY2019. TASKS.md describes the same coverage as two contiguous runs with one break.

**Also reported at this site**

- _cross-dimension_ (low) — STATUS.html says Princeton's allocations have 2 gaps in FY2005–FY2023; there is exactly 1 (FY2019)

  STATUS.html's 'What is actually in the database' table gives Princeton's allocation coverage as 'FY2005–FY2023, 2 gaps'. Princeton's 104 allocation rows cover 18 fiscal years: FY2005–FY2018 (14) plus FY2020–FY2023 (4). The span FY2005–FY2023 is 19 year-slots, so exactly one year inside it is missing — FY2019. Every other document in the repo agrees on one: TASKS.md:26 enumerates 'FY2005–FY2018, FY2020–FY2023'; data/README.md's Princeton coverage table (lines 376-381) lists FY2019 as the only 'no allocation' row inside the span, with FY2000–FY2004 and FY2024–FY2025 as separate out-of-span rows; […]

- _docs-vs-reality_ (medium) — STATUS.html: Princeton "FY2005–FY2023, 2 gaps" — there is exactly one gap in that span
- _html-artifacts_ (low) — STATUS.html says Princeton's allocations have '2 gaps' inside a span that contains one

  The cell reads "FY2005-FY2023, 2 gaps". Within FY2005-FY2023 exactly one year is missing (FY2019). The second documented gap is FY2024-FY2025, which lies outside the range printed in the same cell. MANUAL.html states the same fact unambiguously.


**Fix**

Change the cell to 'FY2005–FY2023, 1 gap (FY2019)', matching TASKS.md:26, and if the FY2024-25 tail matters put it in the row's state pill rather than in the span.

**Verify**

```bash
python3 -c "import json;p=json.load(open('data/schools/princeton.json'));a={r['fiscalYear'] for r in p['allocations']};print('gaps:',[y for y in range(2005,2024) if y not in a])"
```

---

### A-31 · STATUS.html says five escalated decisions, renders six, two of which were not escalated up

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STATUS.html:723` |
| **Found by** | 3 independent auditors — `framework-coherence`, `docs-vs-reality`, `html-artifacts` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
722:     <p class="lede">
723:       Five questions were too consequential to answer casually and too specific to guess at.
724:       Each was escalated to a stronger model for an independent answer, and each is recorded in
```

**What is wrong**

STATUS.html:722-726 opens the "Judgement calls made along the way" section with "Five questions were too consequential to answer casually ... Each was escalated to a stronger model for an independent answer, and each is recorded in full -- the question, the options, both recommendations ...", and the section then renders SIX decision cards (STATUS.html:729-800, all inside the single <div class="decisions"> opened at 728 and closed at 801). Two distinct defects, both reproduced:

(a) Stale count introduced inside the audit range. `git show a2eb063:STATUS.html` has 5 cards and the "Five questions" lede; `git show 5de914f:STATUS.html` has 6 cards (the pool-basis card added) and the SAME unchanged lede. The later 722e0c6 "correct four docs against verified state" pass did touch STATUS.html (3 insertions / 3 deletions) but per TASKS.md:251 only fixed "27->30 validator rules" and "two scope questions"->three, missing this.

(b) The blanket "escalated to a stronger model" is false for two of the six. Card 5 (STATUS.html:776-787, the empty hedge-fund/PE benchmark series) is not a logged `[PROXY DECISION]`: the five tagged rulings are TASKS.md:142, 151, 176, 198, 240; MANUAL.html:598-600 enumerates exactly those five ("Yale's post-FY2020 coverage, Harvard's granularity and target basis, Harvard's undated tables, negative allocation weights, and the pool-basis rule"); the empty-series call is logged at TASKS.md:171 as a unilateral Article 5 call with no senior recommendation, and conduct/GOLDEN-REPLAY.md:10 replays "4/4". Card 6 (pool-basis) is logged at TASKS.md:240 as "Two-phase blind ruling, fresh-context Fable senior; requester Fable (conductor)", and the kernel's own tier table at .claude/skills/escalate/references/kernel.md:81-82 reads "Fable  (any Claude Fable)     -- no senior. Fresh-context same-tier refuter for the second check" -- i.e. explicitly not a hop to a stronger model. The four earlier rulings do satisfy the claim ("Answered by Fable; implemented by Opus").

WHERE THE ORIGINAL FINDING OVERSTATES (why medium, not high): card 5 does NOT "present a deferred, unruled question as a settled escalated decision" -- its own body says the choice "is bundled into the ETF choice in task 1.7 rather than filled", so the deferral is disclosed on the card, the section heading is "Judgement calls made along the way" rather than "escalated decisions", and the decision to leave the two series empty was itself made and documented (TASKS.md:24, 171); only the instrument choice is open. Card 6's body is likewise honest on its own terms ("only merged after a second session independently re-fetched the source and matched every digit") -- it never claims a stronger model. The defect is confined to one lede sentence: a count that contradicts the six cards immediately below it, and a blanket provenance claim that two of those six do not meet. […]

**Also reported at this site**

- _docs-vs-reality_ (medium) — STATUS.html says "Five questions" then renders six decision cards, one of which was never escalated

  STATUS.html:723 opens the "Judgement calls made along the way" section with "Five questions were too consequential to answer casually ... Each was escalated to a stronger model ... and each is recorded in full — the question, the options, both recommendations, and what would justify revisiting it", then renders six decision cards (STATUS.html:731, 743, 755, 767, 778, 790; `grep -c '<div class="decision">' STATUS.html` → 6). […]

- _html-artifacts_ (medium) — STATUS.html says five judgement calls were each escalated; six are rendered and one was never escalated

  STATUS.html:723-724 states "Five questions were too consequential to answer casually and too specific to guess at. / Each was escalated to a stronger model for an independent answer, and each is recorded in full — the question, the options, both recommendations, and what would justify revisiting it." The section renders SIX `.decision` cards (div openings at STATUS.html:729, 741, 753, 765, 776, 788). Five of the six correspond to the five `[PROXY DECISION]` rulings in TASKS.md (lines 176, 151, 142, 198, 240). […]


**Evidence as filed**

```text
STATUS.html:723-726: 'Five questions were too consequential to answer casually ... Each was escalated to a stronger model for an independent answer, and each is recorded in full -- the question, the options, both recommendations, and what would justify revisiting it.' grep -c 'class="decision"' STATUS.html = 6; the six decision-q lines are at STATUS.html:731,743,755,767,778,790. Card 5 (STATUS.html:778) is 'Two hedge-fund and private-equity benchmark series have no honest source' whose own text says it 'is bundled into the ETF choice in task 1.7 rather than filled' -- task 1.7 is unchecked in TASKS.md and there is no [PROXY DECISION] for it (the five rulings are TASKS.md:142,151,176,198,240). Card 6 (STATUS.html:790) is the pool-basis ruling, logged at TASKS.md:240 as 'Two-phase blind ruling, fresh-context Fable senior; requester Fable (conductor)' -- same tier, per kernel.md:81-83: 'Fable (any Claude Fable) -- no senior. Fresh-context same-tier refuter for the second check'.
```

**Independent reproduction by the refuting auditor**

```text
1) `grep -c 'class="decision"' STATUS.html` -> `6`. Line-numbered occurrences of decision-q: 731, 743, 755, 767, 778, 790 (all six inside <div class="decisions"> at 728, closed at 801, verified by awk on lines 795-802).

2) `awk 'NR>=720 && NR<=730' STATUS.html`:
720 <section>
721   <h2>Judgement calls made along the way</h2>
722   <p class="lede">
723     Five questions were too consequential to answer casually and too specific to guess at.
724     Each was escalated to a stronger model for an independent answer, and each is recorded in
725     full &mdash; the question, the options, both recommendations, and what would justify
726     revisiting it.
727   </p>
728   <div class="decisions">

3) Git provenance. `git log --oneline -- STATUS.html` -> 722e0c6, 5de914f, a2eb063 (created in a2eb063, `A STATUS.html`, 821 insertions). Per-commit card count + lede:
  a2eb063 -> 5 cards, "Five questions"
  5de914f -> 6 cards, "Five questions"
  722e0c6 -> 6 cards, "Five questions"
The decision-q list at a2eb063 lacks only "A school publishes percentages for its investment pool, not the endowment itself. Usable?" -- so the pool-basis card is the sixth, added in 5de914f. `git show --stat 722e0c6 -- STATUS.html` -> "1 file changed, 3 insertions(+), 3 deletions(-)".

4) `grep -n 'PROXY DECISION' TASKS.md` -> rule statement at 131, and rulings at 142 (Harvard undated tables), 151 (Harvard granularity/basis), 176 (Yale FY2021-25 coverage), 198 (negative weights), 240 (pool-basis). […]
```

**Why it matters** — The page the operator reads to see what was decided for him overstates both the count and the independence of the decision record: it presents a deferred, unruled question as a settled escalated decision, and presents a same-family same-tier refutation as a stronger-model ruling -- the exact correlation risk CONDUCT-DESIGN.html section 2 identifies as the framework's residual danger.

**Fix**

Change the lede to 'Six questions', drop or relabel the benchmark-series card as 'open, deferred to task 1.7', and label the pool-basis card as ruled by a fresh-context same-tier refuter (no senior exists above Fable) rather than 'escalated to a stronger model'.

**Verify**

```bash
grep -c '<div class="decision">' STATUS.html   # expect 6; lede must say six
```

---

### A-32 · "Six Harvard tables carry no date" — only five undated tables are curated

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STATUS.html:755` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
754:         <div class="decision-head">
755:           <span class="decision-q">Six Harvard tables carry no date. Which fiscal year do they belong to?</span>
756:           <span class="decision-by">Settled with evidence</span>
```

**What is wrong**

The count of undated HMC allocation tables is five, not six, and the error originates in TASKS.md (the source of truth) and propagates into every rendering. Root: TASKS.md:143 ("six HMC reports (FY2019-FY2024) print an allocation table with no as-of date anywhere in the document") and TASKS.md:145 ("All six undated tables are fiscal-year end"); data/README.md:94 ("shift six years of the series by one") and data/README.md:100 ("The six undated tables were assigned to fiscal-year end"); rendered at STATUS.html:755 ("Six Harvard tables carry no date") and STATUS.html:762 ("shifted six years of the series by one"); repeated at conduct/GOLDEN-REPLAY.md:54 ("gap the six undated"). The repo records five undated tables in three independent places: (1) data/sources.json contains exactly 5 sources whose notes read "no as-of date printed anywhere" - hmc-annual-report-2019, -2020, -2021, -2023, -2024; (2) data/schools/harvard.json has 77 allocation rows across 14 fiscal years, of which 7 are basis "actual" (FY2017, 2019, 2020, 2021, 2023, 2024, 2025), and only 5 fiscal years are sourced to an undated table - FY2017 comes from hmc-annual-report-2018, dated "Asset Class July 1, 2017 Allocation", and FY2025 from hmc-annual-report-2025, dated "As of June 30, 2025"; (3) the reconciliation table at data/README.md:102-108, which the "six undated tables" sentence directly introduces, has exactly 5 data rows (FY2019, FY2020, FY2021, FY2023, FY2024). The stated FY2019-FY2024 window reaches six reports only by counting FY2022, which the repo states three times has no allocation table at all (data/README.md:87, TASKS.md:137, and the hmc-annual-report-2022 note in data/sources.json: "This letter contains NO allocation table at all"). So TASKS.md:143 and TASKS.md:137 contradict each other directly. Note also that "six years of the series" fails under every reading: five tables were dated by reconciliation, and a start-of-year misreading would have disturbed seven year-slots, not six. Scope of the defect: narrative/methodology prose only. No curated percentage is wrong, no citation is missing, every dating assignment is correctly evidenced, and nothing affects the build - which is why this is medium, not high. Fix is a one-word change in five locations (six -> five, and "FY2019-FY2024 reports" -> "the FY2019-FY2021 and FY2023-FY2024 reports"), plus the STRUCTURE.md/STATUS.html renderings regenerated. Two corrections to the original filing: its jq evidence block silently omits 7 of the 14 fiscal-year groups the command prints (the basis "target" years FY2005/2008/2010/2012/2013/2015/2016) while annotating as if the list were complete; and the anchor should be TASKS.md:143 plus data/README.md:100 as the root, with STATUS.html:755 as the published rendering, since under project rule 2 STATUS.html faithfully renders what TASKS.md says.

**Evidence as filed**

```text
STATUS.html:755  Six Harvard tables carry no date. Which fiscal year do they belong to?
STATUS.html:762  would have shifted six years of the series by one, invisibly.

$ jq -r '.allocations|group_by(.fiscalYear)|map({fy:.[0].fiscalYear,src:([.[].sourceId]|unique|join(","))})|.[]|"FY\(.fy)  \(.src)"' data/schools/harvard.json
FY2017  hmc-annual-report-2018      <- dated "July 1, 2017"
FY2019  hmc-annual-report-2019      <- undated
FY2020  hmc-annual-report-2020      <- undated
FY2021  hmc-annual-report-2021      <- undated
FY2023  hmc-annual-report-2023      <- undated
FY2024  hmc-annual-report-2024      <- undated
FY2025  hmc-annual-report-2025      <- dated "As of June 30, 2025"
(FY2018 and FY2022 absent from the file entirely)

TASKS.md:137  ... FY2022 (that letter contains no allocation table at all, and the financial report reprints the same letter).
TASKS.md:143  **Question:** six HMC reports (FY2019–FY2024) print an allocation table with no as-of date anywhere in the document
data/README.md:100  The six undated tables were assigned to **fiscal-year end** by reconciling each against Harvard's own audited financial statements
```

**Independent reproduction by the refuting auditor**

```text
$ grep -n "Six Harvard\|six years of the series" STATUS.html
755:          <span class="decision-q">Six Harvard tables carry no date. Which fiscal year do they belong to?</span>
762:          would have shifted six years of the series by one, invisibly.

$ jq -r '.allocations|group_by(.fiscalYear)|map({fy:.[0].fiscalYear,basis:([.[].basis]|unique|join(",")),src:([.[].sourceId]|unique|join(","))})|.[]|"FY\(.fy) basis=\(.basis) \(.src)"' data/schools/harvard.json
FY2005 basis=target hmc-endowment-report-2009
FY2008 basis=target hmc-annual-report-2014
FY2010 basis=target hmc-endowment-report-2009
FY2012 basis=target hmc-annual-report-2011
FY2013 basis=target hmc-annual-report-2014
FY2015 basis=target hmc-annual-report-2014
FY2016 basis=target hmc-annual-report-2016
FY2017 basis=actual hmc-annual-report-2018
FY2019 basis=actual hmc-annual-report-2019
FY2020 basis=actual hmc-annual-report-2020
FY2021 basis=actual hmc-annual-report-2021
FY2023 basis=actual hmc-annual-report-2023
FY2024 basis=actual hmc-annual-report-2024
FY2025 basis=actual hmc-annual-report-2025
(14 fiscal-year groups, not the 7 the filing showed; FY2018 and FY2022 genuinely absent)

$ jq '.allocations|length' data/schools/harvard.json
77

$ jq -r '.[]|select((.notes//"")|test("no as-of date printed anywhere"))|.id' data/sources.json
hmc-annual-report-2019
hmc-annual-report-2020
hmc-annual-report-2021
hmc-annual-report-2023
hmc-annual-report-2024
$ jq -r '[.[]|select((.notes//"")|test("no as-of date printed anywhe […]
```

**Why it matters** — The published figure overstates by one the number of years the dating ruling actually governs, and it is internally contradicted inside TASKS.md (six reports FY2019-FY2024 with tables vs. FY2022 having no table). Anyone re-auditing the dating decision will look for a sixth undated table that does not exist and cannot reconcile the count against harvard.json.

**Fix**

Change 'Six' to 'Five' in STATUS.html:755 and 762, and correct the same count in TASKS.md:143/145 and data/README.md:94/100 — or, if a sixth undated table genuinely exists in a report that was not curated, name it explicitly so the count reconciles against the five curated years.

**Verify**

```bash
python3 -c "import json;s=json.load(open('data/sources.json'));print([x['id'] for x in s if 'no as-of date' in json.dumps(x)])"
```

---

### A-33 · STATUS.html implies negative allocation weights are stored; zero exist in any school file

| | |
|---|---|
| **Severity** | medium |
| **Location** | `STATUS.html:767` |
| **Found by** | 1 independent auditor — `docs-vs-reality` |
| **Status** | **Reported, not refutation-tested** — fell below the per-dimension verification cut |

**Current text at `HEAD` = `00a08ec`**

```text
766:         <div class="decision-head">
767:           <span class="decision-q">Yale reports a negative cash weight in some years. Is that a typo to clean up?</span>
768:           <span class="decision-by">Real, so keep it</span>
```

**What is wrong**

The decision card 'Yale reports a negative cash weight in some years. Is that a typo to clean up? — Real, so keep it' states 'Clamping it to zero or folding it into another category would misstate both.' No negative pct value exists anywhere in data/. Yale's published negative Cash lines are netted inside the merged fixed_income_cash category, which data/README.md documents explicitly and STATUS omits.

**Fix**

Add the qualifier from data/README.md:58 to the card: 'Yale's published negative Cash lines (−3.9% FY2008, −1.9% FY2009, −1.1% FY2011) net positive inside the merged fixed_income_cash category, so no stored weight is negative today; the validator accepts, warns on, and requires a sourceLabel for a negative if a future school-year has a combined negative.'

**Verify**

```bash
sed -n "764,770p" STATUS.html
```

---
