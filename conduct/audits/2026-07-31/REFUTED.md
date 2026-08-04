# Refuted findings — do not re-open

Part of the [31 July 2026 audit](README.md).

24 claims were filed by a dimension auditor and then **killed by an independent verifier** whose standing instruction was to refute rather than confirm, and to default to refuted when uncertain. They are recorded here so a later session does not spend itself re-finding them.

A finding was refuted when one of these held:

- the numbers actually reconcile and the original auditor miscounted;
- the behaviour is **already documented as a deliberate decision** — in `STRUCTURE.md`'s "structural notes worth carrying", a `TASKS.md` ruling, or a `data/README.md` methodology note;
- the claim was style preference rather than defect;
- the verifier could not reproduce the evidence offered.

> Several of these are *interesting but intended*. Two worth naming, because they look like defects and are not: the retained `conduct/fragments/1.6/` directory (the conductor skill says fragments are deleted after a merge; keeping them is recorded as open debt at `STRUCTURE.md:176-179`), and `STRUCTURE.md`'s header pinning itself to `722e0c6` with 4 unpushed commits rather than to `HEAD` with 7 — the file declares itself a snapshot at that commit, so it is correct on its own terms.

---

### R-01 · Harvard as-of dating rests on 15 audited-NAV percentages that cite no document anywhere in the repo

**Filed by** `citations` · **against** `data/README.md`

**Why it was refuted**

The finding fails on four independent grounds, three of them factual.

(1) OUT OF THE AUDITED WINDOW — the flagged text is not part of the 30–31 July work. `git log -S"The six undated tables were assigned" -- data/README.md` returns a single commit, 90b156d, dated 2026-07-25 ("Curate Harvard allocations and FY2011-FY2025 returns (task 1.5, partial)"); `git merge-base --is-ancestor 90b156d a2eb063~1` succeeds, so it precedes the audit baseline. I extracted `git show a2eb063~1:data/README.md` and diffed the 22-line "Harvard as-of dating" block against HEAD in python: "OLD 'six undated tables' at [100] / NEW ... at [100]", "OLD '| FY2021: 34' at [106] / NEW ... at [106]", "BLOCK IDENTICAL: True". The TASKS.md:145 restatement is likewise from 90b156d. Nothing in a2eb063..HEAD touched a character of it.

(2) THE CENTRAL CLAIM IS FALSE — "the audited financial statements those percentages come from are named nowhere" does not survive contact with sources.json. Exactly five entries name the reconciliation counterparty document, one per dated year, and point at the README section: `jq '.[] | select(.notes|test("reconciliation against Harvard.s audited FY[0-9]{4} financial report")) | .id'` returns hmc-annual-report-2019, -2020, -2021, -2023, -2024. E.g. hmc-annual-report-2019 notes: "Assigned to June 30, 2019 by reconciliation against Harvard's audited FY2019 financial report (private equity / real estate / natural resources fair-value shares match the year-end figure and not the start-of-year alternative); see data/README.md → Harvard as-of dating." The document series is additionally registered with live archive URLs for six other years (hmc-university-financial-report-{2002..2006,2010}), so the family and its URL pattern are in the repo.

(3) NO PROJECT RULE IS BROKEN. CLAUDE.md:32 — "Every data point in `data/` has a citation (source_id → `sources`)" — and CONSTITUTION.md:17 — "Every figure in `data/` carries a `sourceId` resolving to `sources.json`" — are scoped to figures in the data files, not to methodology prose. […]

---

### R-02 · MIT FY2006 Pool A coverage figures are uncited and appear in no cited document, yet gate 18 published rows

**Filed by** `citations` · **against** `data/README.md`

**Why it was refuted**

The finding collapses on four independently checked points.

1. NO UNCITED PUBLISHED FIGURE. The 18 rows are real (6 categories x FY2001/2003/2004, counted from data/schools/mit.json: 42 allocation rows total, 6 each for 2001/2003/2004/2008/2013/2014/2015), but every one of the 18 carries sourceId "mitimco-fnl-bufferd-2004", which resolves in sources.json. The project's rule as written (CONSTITUTION.md:17 "Every figure in `data/` carries a `sourceId`"; data/README.md:5 "Every fact row carries a citation pointing at an entry in `sources.json`") governs fact rows, and it is satisfied. The disputed magnitudes are narrative gating evidence in prose, not data points — README prose is full of quoted primary-document figures attributed by naming the document, none of which carry sourceIds.

2. THE AUDITOR'S ENUMERATION IS WRONG. There are 19 MIT source records in sources.json, not "five". The auditor checked 5 of 19 and reported the check as exhaustive.

3. THE FIGURES ARE RE-CHECKABLE AND CORRECT. I fetched MIT's Report of the Treasurer 2007 from the Wayback capture and extracted its text. It states verbatim: "The total market value of Pool A was $10,161.5 million and $8,550.1 million at June 30, 2007 and 2006, respectively. The total value of Pool A includes Pool C investment of $358.5 million and $318.0 million at June 30, 2007 and 2006, respectively." That is $8,550.1M confirmed digit-for-digit, and README's "~3.7% (FY2006)" non-endowment content reproduces exactly: 318.0/8550.1 = 3.719%. $8,232.0M is not printed in any document I fetched, but it reconciles exactly with MIT's own sentence structure — the FY2007 report's analogue reads "$9,980.4 million at June 30, 2007 ... includes $9,803.0 million invested in Pool A ... and $177.4 million held in separately invested funds" (9,803.0 + 177.4 = 9,980.4), and 8,232.0 + 136.1 = 8,368.1 exactly. So "two numbers no one can re-check" is false: one is directly quotable from an MIT primary document that data/README.md:210 already names as examined, the other is corroborated to $0.1M by MIT's own published complementary series.

4. THE GATE IS NOT FRAGILE. […]

---

### R-03 · TASKS.md claims the "7 categories" doc defect was fixed; README's category table still omits public_equity

**Filed by** `data-consistency` · **against** `data/README.md`

**Why it was refuted**

The finding's core assertion is that TASKS.md:249 records a correction that did not land, and that the consequence it names ("a curator working from the category table would not have known `public_equity` exists") is still live. Both are false.

1. THE FIX LANDED, IN EXACTLY THE FOUR PLACES TASKS.md CLAIMS. TASKS.md says: `"7 categories"/"7 series" in four places where the code has 8`. I enumerated the pre-range file and the correcting commit. Pre-range (git show a2eb063~1:data/README.md) contained exactly these wrong-count places: line 14 ("the 7 benchmark/index series"), line 23 ("one of 7 categories"), line 35 ("these 7 categories"), and the Series-ids line that listed only 7 ids. `git show 722e0c6 -- data/README.md` fixed all four:
   - `-| ... Annual returns for the 7 benchmark/index series (see below). |` → `+| ... the 8 benchmark/index series (see below); 5 are populated, 3 await task 1.7. |`
   - `-... one of 7 categories ...` → `+... one of **8** categories ... The 8th, \`public_equity\`, was added by the task-1.5 ruling for schools that publish public equity as a single unsplit line (Harvard FY2017+, Princeton FY2020+) — see the granularity rule below; a school-year uses it **or** the two split equity categories, never both:`
   - `-these 7 categories` → `+these 8 categories`
   - `+Series ids: sp500, intl_equity, us_aggregate_bond, hedge_fund_index, public_pe_index, reit, cash, global_equity ... hedge_fund_index, public_pe_index and global_equity are deliberately empty pending task 1.7.`
   TASKS.md never claims a table ROW was added; it claims four count strings were corrected, and four were.

2. THE NAMED FAILURE MODE IS THE ONE THING THE FIX SPECIFICALLY CURED. The sentence that introduces the table — data/README.md:23, the line immediately above the header the auditor cites as :25 — names `public_equity`, says which schools use it (Harvard FY2017+, Princeton FY2020+), states the OR rule, and cross-references the granularity rule. A curator reading down to the table reads that sentence first. […]

---

### R-04 · MIT README section still describes a two-document world after 18 Pool A rows merged from a third document

**Filed by** `data-consistency` · **against** `data/README.md`

**Why it was refuted**

The finding's three load-bearing claims do not survive contact with the file.

1. "18 rows come from a document the section says does not exist" / "the file contradicts itself about how many MIT allocation sources exist" — FALSE. `grep -c "Bufferd" data/README.md` = 8, seven of them inside the MIT section (lines 202, 203, 204, 205, 206, 207, 225, 240), including a dedicated subsection at 236-267 headed "MIT Pool A years (FY2001/FY2003/FY2004) — pool-basis ruling". The line-176 sentence says "the two MIT documents that do print **endowment** allocation percentages"; the file states three separate times that the Bufferd tables are NOT endowment-basis — line 203 "it is labelled '**Pool A** Asset Allocation', not the endowment", line 205 "Pool A, not the endowment", lines 241-244 quoting MIT: "Pool A is neither the complete Endowment nor is it comprised only of Endowment assets". Under the file's own (relentlessly maintained) universe distinction, line 176 is still literally true, not stale. Same for its first half — Bufferd is a Faculty Newsletter, not a Report of the Treasurer.

2. The auditor's self-declared "worst" item — that the `Real Assets + Real Estate` merge "which produced the stored 11.0 / 15.8 / 12.7 figures — is nowhere in the mapping table" — is flatly contradicted by line 188: `| Real Assets **+** Real Estate | both | real_assets (merged) |`, plus a dedicated explanatory bullet at line 194. The stored `sourceLabel` for those rows is verbatim `"Real Assets + Real Estate"`, i.e. exactly the mapping-table row. And the arithmetic reproduces from Bufferd Table II as transcribed in conduct/fragments/1.6/mit-buildlog.md (2001: 0.0+11.0=11.0; 2003: 1.0+14.8=15.8; 2004: 2.6+10.1=12.7).

3. "Their normalization is nowhere a future curator reads" — the rule at README line 35 is "put the school's own original wording in `sourceLabel` so the normalization decision stays auditable". All 18 rows carry a `sourceLabel`, and each is MIT's own Table II wording per the build-log transcription. […]

---

### R-05 · MIT FY2001's fiscal-year assignment has no dating evidence recorded in data/README.md

**Filed by** `data-consistency` · **against** `data/README.md`

**Why it was refuted**

I fetched the primary source and the finding does not survive contact with it.

WHAT IS TRUE IN THE FINDING (line cites all check out): data/README.md:203's FY2001 row does say only "Bufferd Table II, 2001 column" with no as-of quote; the "#### MIT as-of dating" subsection at lines 218-223 does cover only Table 6C and Table 1.2 and never names Bufferd; sources.json's `mitimco-fnl-bufferd-2004` does not reproduce Table II's header; and the six FY2001 rows in data/schools/mit.json do exist and sum to 100.0. So the auditor's file-reading is accurate.

WHY THE FINDING STILL FAILS — three independent reasons:

(1) The claimed mechanism of harm is backwards. The finding asserts "'the 2001 column' alone does not establish which base year the column offsets from." I pulled the source (curl -> 824,064 bytes, byte-for-byte the size sources.json records) and extracted it: Table II's columns carry ABSOLUTE year labels — `2004 / 2003 / 2001 / 1999 / 1994` (extracted text lines 4090/4100/4110/4120/4130) — not offsets. There is no base year to resolve. data/README.md itself prints those absolute labels three times (lines 202, 204, 225). The header's "Past One, Three, Five and Ten Years" phrasing is corroborative, not constitutive; the finding elevates it into the load-bearing evidence and then complains it is missing.

(2) data/README.md DOES record rule-(a) dating evidence for this table, five lines below the row the finding flags. Line 206 quotes Figure 1 as "Pool A Asset Allocation on June 30, 2004"; line 205 quotes Figure 2 as "as of June 30, 2003"; and line 225 records that "Figure 1's finer lines sum to Table II's 2004 column in every category (Fixed Income 6.8 + Cash 2.3 = 9.1; ...)". I verified both captions at source (Figure 1 at extracted line 3970: "Pool A Asset Allocation on June 30, 2004"; Figure 2 at 4257-4259: "Comparative Asset Allocation of MIT Pool A to Cambridge Associates Mean as of June 30, 2003"). […]

---

### R-06 · README and the Harvard buildlog give mutually exclusive accounts of the FY2010 $27.4B vs $27.6B figure

**Filed by** `data-consistency` · **against** `data/README.md`

**Why it was refuted**

The finding's textual observation reproduces: data/README.md:459-461 and conduct/fragments/1.6/harvard-returns-buildlog.md:46-53 do give opposite accounts of what the $27.4B figure is. But the finding is built on an explicit claim that I verified to be FALSE: "nothing in the repo says the README supersedes it." The repo says exactly that, in four independent places.

(1) TASKS.md:239 — the single source of truth per project rule #2 — records this precise correction as a QC catch, quoting the winning wording verbatim: "QC catches worth keeping: Harvard FY2010 rationale rewritten (press $27.4B is the HMC-basis endowment figure, not a broader pool)". The line's framing sentence is "every defect found was in recorded *reasoning*, never in a number" — the buildlog's scope explanation is one of the named instances of exactly that.

(2) data/sources.json:940 — the citation record attached to the actual data point, i.e. what a curator reads under rule #1 — carries the corrected rationale AND an explicit supersession stamp: "(the press-reported $27.4B for FY2010 is the HMC-basis equivalent, NOT a broader pool) ... QC-verified 2026-07-30: figures confirmed, original rationale corrected."

(3) TASKS.md:25 routes future readers to the README, not the buildlog: "Market values mix two published bases (University-audited vs HMC), disclosed in data/README.md's Harvard basis note." Critically, the worker's own proposed wording at buildlog:74-81 asked the conductor to point readers at "the task 1.6.D build log for the FY2010 $27.6bn-vs-$27.4bn scope note" — and that pointer was deliberately NOT applied. grep for "27.6bn" and "build log for the FY2010" in TASKS.md returns nothing, and grep for "harvard-returns-buildlog" / "fragments/1.6" across TASKS.md, data/README.md, CONSTITUTION.md and CLAUDE.md returns nothing at all. No canonical document cites the buildlog.

(4) buildlog:74 self-labels its own downstream wording as "**Proposed** TASKS.md wording (conductor to apply — not touched here)" — the file identifies itself as a worker proposal, not a record of record.

Two further points dissolve the residual concern. […]

---

### R-07 · Retained Harvard fragment still asserts the FY2010 rationale QC ruled factually wrong

**Filed by** `fragment-merge` · **against** `conduct/fragments/1.6/harvard-returns-buildlog.md`

**Why it was refuted**

The literal text quoted from the buildlog fragment is real, and the substance of the QC catch is real (27,557.4 > 27,400, so a "broader pool including pension/working-capital" that is SMALLER than the endowment is arithmetically impossible). But the finding's load-bearing claims are all false, and the underlying condition is a documented, deliberately-deferred debt.

(1) "The only place under conduct/ that records the reasoning behind Harvard's FY2010 row" is false. conduct/fragments/1.6/harvard-returns-sources.json:60 — the sibling fragment in the SAME directory — carries the corrected note verbatim, ending "QC-verified 2026-07-30: figures confirmed, original rationale corrected." That is the fragment that becomes data/sources.json, i.e. the one that actually carries the row's recorded rationale.

(2) "Nothing in the fragment marks it superseded ... grep returns zero hits" is a glob artifact, not evidence. The auditor grepped `conduct/fragments/1.6/*.md`, which by construction excludes the .json fragments where the correction marker lives. I reproduced both: the `*.md` glob exits 1 (zero hits); `grep -rlE -i 'supersede|stale|obsolete|corrected|QC-verified' conduct/fragments/1.6/` returns harvard-returns-sources.json.

(3) A second place under conduct/ records it explicitly: conduct/plans/1.6-plan.md:141-146 — "Worker's FY2010 source-note rationale was factually wrong (press qualifier transplanted; directionally impossible pool claim) — corrected in the fragment by the conductor, logged as the pilot's first sampler catch." The plan's phrase "source-note rationale" is precise and true as written: the source note is in the sources fragment, and that fragment is corrected.

(4) No published or authoritative artifact carries the falsified rationale. data/sources.json (hmc-university-financial-report-2010 notes), data/README.md:460-461 and TASKS.md:239 all state the corrected version. […]

---

### R-08 · mit-school.json is a stale duplicate missing 18 curated rows, with no supersession marker

**Filed by** `fragment-merge` · **against** `conduct/fragments/1.6/mit-school.json`

**Why it was refuted**

The finding's arithmetic reproduces exactly, but its load-bearing claims ("no supersession marker", "silently drops three fiscal years") are factually false, and the underlying item is an explicitly recorded, deliberately-deferred debt.

WHAT REPRODUCED (I re-ran it with a corrected key — the auditor's rows key on `category`, not `assetClass`/`poolName`): allocations frag=24 data=42, only-in-data=18, only-in-frag=0, valdiffs=0; all 18 carry sourceId `mitimco-fnl-bufferd-2004` for FY2001/2003/2004; frag years [2008,2013,2014,2015] vs data years [2001,2003,2004,2008,2013,2014,2015]. So 3 of 7 years and 18/42=43% are right. endowmentReturns are identical (26/26, 0 diffs). Princeton and Stanford are byte-identical to data/ (25891==25891, 3245==3245). STRUCTURE.md:174-177, CLAUDE.md:26 and CONSTITUTION.md:29 (Article 8) are all quoted accurately, and SKILL.md:49 does say "the conductor deletes them after the merge lands", so STRUCTURE.md's characterization is fair.

WHY IT IS REFUTED ANYWAY:

1. "with no supersession marker" / "nothing marks the fragment as superseded" is FALSE. `conduct/fragments/1.6/mit-buildlog.md`, in the same directory, states at line 2 "**Delivered:** 24 allocation rows — FY2008 (6 rows, `target`) and FY2013–FY2015 (18 rows, `actual`)" and at line 5 fires "**TRIPWIRE 6 FIRED — a real allocation table exists for FY2001, FY2003 and FY2004 and was NOT curated, pending a ruling that is not a worker's to make.**" It then transcribes the withheld Bufferd Table II inline. The fragment set names its own row count and itemizes, by fiscal year, exactly the three years the finding says are unmarked.

2. The claimed impact cannot occur. `conduct/fragments/1.6/mit-sources.json` contains 18 sources and does NOT contain `mitimco-fnl-bufferd-2004` at all (grep -c = 0; data/sources.json = 1; data/ has 19 mitimco- sources vs the fragment's 18). The fragment set is therefore an internally coherent pre-ruling snapshot — 24 rows, 18 sources, no Bufferd source and no Bufferd rows — matching its buildlog's stated delivery precisely. […]

---

### R-09 · Princeton fragments still claim market values for FY2001/2002/2004 that do not exist in data/

**Filed by** `fragment-merge` · **against** `conduct/fragments/1.6/princeton-readme-section.md`

**Why it was refuted**

The auditor's raw facts reproduce exactly, but the finding does not survive as a defect. Three independent grounds.

(1) ALREADY DOCUMENTED AS A DELIBERATELY-DEFERRED DECISION, including the exact claimed impact. STRUCTURE.md:174-177 states: "`conduct/fragments/1.6/` should arguably be gone. The conductor skill says fragments are deleted after a merge lands. These 15 were kept, and they contain duplicate copies of curated school JSON — an ambiguity about which copy wins. Decide deliberately: delete them, or amend the skill to say they're archived." TASKS.md:253 records the same debt in the surfaced-debts list: "the 15 task-1.6 fragments were never deleted though the conductor skill says they are." The finding's claimed impact ("two divergent copies ... with no stated winner") is verbatim the ambiguity STRUCTURE.md already names and assigns a decision path to. The finding tries to escape this by narrowing to "no stated winner for prose" (STRUCTURE.md says "school JSON"), but the retained-fragment class, the ambiguity, and the remedy are identical; the retention itself is the recorded debt.

(2) THE FRAMEWORK NEVER CLAIMS FRAGMENTS ARE MAINTAINED OR AUTHORITATIVE, so no rule is claimed-but-unenforced. .claude/skills/conduct/SKILL.md:48-49: "Fragments live under `conduct/fragments/<task-id>/`, outside `data/` or any validated tree, and the conductor deletes them after the merge lands." A fragment is a pre-merge staging snapshot with a lifecycle that ends at merge — it is not a document that gets corrected when the canonical copy is corrected. The doc-truthfulness obligation the 2026-07-31 audit discharged runs to `data/` and the four renderings, not to a directory the skill says should not exist post-merge. Correcting the fragment would actually falsify the record of what worker 1.6.C delivered.

(3) ZERO BLAST RADIUS AND THE CANONICAL COPY IS CORRECT. `grep -rn "conduct/fragments" scripts/ src/ data/` returns nothing — no code, validator, seed script, or rendering reads fragments. […]

---

### R-10 · Seven worker-declared [JUDGMENT CALL] tags were dropped from the ledger during fold-in

**Filed by** `fragment-merge` · **against** `TASKS.md`

**Why it was refuted**

The raw counts reproduce, but every load-bearing part of the finding's characterization fails.

1) The rule it invokes does not say what it claims. The finding leans on TASKS.md:131 plus the kernel to make TASKS.md the mandatory home of worker-level small calls. Actual texts: kernel K5 (.claude/skills/escalate/references/kernel.md:39-41) obliges "Every **proxied** decision is logged where the project keeps memory" — proxied, not below-floor. Kernel Part 4 says only "Everything below the floor: decide it, log one line as `[JUDGMENT CALL]`, keep moving" — no location. CONSTITUTION.md:143 similarly binds the itemized-record requirement to `[PROXY DECISION]` entries in TASKS.md and adds that unescalated calls "are marked `[JUDGMENT CALL]` and can be recorded in a sentence." The place the workers were actually told to put them is their own fragment: conduct/briefs/1.6/COMMON.md:103 ("`<unit>-buildlog.md` — build-log prose ... `[JUDGMENT CALL]` lines") and :156 ("every `[JUDGMENT CALL]` with one line"). All four workers complied. And conduct/plans/1.6-plan.md:68 specifies the integration lane produce a "build-log entry merged from fragments + integration/sampling notes" — a synthesis, not a verbatim tag transfer. So there is no rule the framework "claims to enforce but does not."

2) One of the counted 7 is not a judgment call at all. stanford-buildlog.md:6 reads "**`[JUDGMENT CALL]`/finding to report, not resolved unilaterally**" and goes on to refuse the decision and hand options A/B/C up. It was escalated and is logged in TASKS.md:240 as the pilot's formal `[PROXY DECISION]` ("Stanford GAP STANDS all years"). Counting it as a dropped below-floor call inverts what happened.

3) Two more are grep-findable as tagged `[JUDGMENT CALL]` items inside project memory. harvard-returns-buildlog.md:28 (parenthesised negatives) is the same call already tagged at TASKS.md:138, with its 1.6 re-confirmation at TASKS.md:239. […]

---

### R-11 · README Stanford section contradicts itself because the QC correction was appended, not reconciled

**Filed by** `fragment-merge` · **against** `data/README.md`

**Why it was refuted**

The mechanical half of the finding reproduces exactly; the interpretive half — the part that makes it a defect — does not.

WHAT I CONFIRMED. My own difflib run shows conduct/fragments/1.6/stanford-readme-section.md lines 1-29 are byte-identical to data/README.md lines 116-144 (`frag==rd[115:144]` -> True), and README lines 145-171 are a single 27-line pure insert with zero edits to the earlier text. Line 126 and lines 158-164 are quoted correctly. So the append-only fold-in is real and the two texts do sit in one section.

WHY THE FINDING FAILS ANYWAY — three independent refutations.

1. "Neither is marked as superseding the other" is factually false. README.md:146 is literally headed `#### Stanford upgrade path and record corrections (QC + pool-basis ruling)` and README.md:158 opens `**Two corrections from QC, so no future session inherits them:**`. "record corrections" plus "so no future session inherits them" is an explicit supersession marker aimed precisely at the future curator the finding worries about. The auditor's central assertion is contradicted by the heading twelve lines above its own second quote.

2. There is no self-contradiction, because the correction reconciles itself in its own text. Line 126's load-bearing claims are "SMC has never published an Endowment-specific allocation table in any document found" and "No table for any year describes the Endowment's own composition." The QC note overturns neither: it says the pre-2016 editions *label* their tables "Endowment Asset Allocation" but "each document's own text states the universe is the Merged (Endowment) Pool — the headline label is not the universe." A table whose stated universe is the Merged Pool is not an Endowment-specific table. The coverage table at README.md:136 already uses the broader still-correct wording "no Endowment-specific allocation table exists in any year checked." TASKS.md:240 records this as the formal ruling: "Stanford GAP STANDS all years (modern era fails B2+B3; early era fails B1 — headline contradicted by stated universe — and has only wrong-ratio evidence)."

3. The claimed impact ("the two readings imply different next actions — go find the documents vs. […]

---

### R-12 · data/README.md tells curators the fiscal-year gate covers all five schools; TASKS.md records that it does not

**Filed by** `validator` · **against** `data/README.md`

**Why it was refuted**

The finding's underlying mechanism is real, but it is a known, documented, deliberately-accepted debt — and the "curator is misled" impact claim does not survive reading the file the auditor calls stale.

WHAT I CONFIRMED (the mechanism is real):
- data/README.md:652 is quoted correctly, verbatim, including the universal clause "no school can have reported it".
- scripts/lib/seed-validate.ts:46-48 does hard-code the June-30 assumption. I reproduced the arithmetic directly in node rather than trusting the auditor's probe: 2026-07-01 -> 2026, 2026-07-31 -> 2026, 2026-08-31 -> 2026. So today a Stanford FY2026 row would clear the fiscalYear bound. seed-validate.ts:420's error text repeats the June-30 gloss. There is no per-school override anywhere: maxFiscalYear is computed once at line 1239 and threaded to every requiredFiscalYear call.

WHY IT IS REFUTED ANYWAY:
1. It is documented as accepted debt, in both designated places, with the same window, same cause and same fix. MANUAL.html:768 sits inside `<section id="debts"> <h2>10 Known debts and open holes</h2>` and reads "The validator assumes every fiscal year ends 30 June ... between July and August the validator will accept a Stanford year that has not closed. The documentation is the guard here, not the code. Fix: a per-school fiscal-year-end map, with a regression case." TASKS.md:252 records the identical item in the 2026-07-31 build log. The auditor cites both of these as *proof of the defect*; they are in fact the project's explicit acknowledgement of it.

2. The "documentation is the guard" that TASKS.md relies on is present, and it is in the very file the finding calls stale. data/README.md:19 — the foundational fiscal-year sentence, rewritten in 5de914f on 2026-07-31 — reads "Four of the five schools' fiscal years end **June 30**. **Stanford's ends August 31**". data/README.md:142-144 is a dedicated subsection, "Stanford as-of dating (fiscal-year-end offset, not table dating)", stating "**Stanford's own fiscal year ends August 31**, not June 30 like the other four schools". CLAUDE.md:40 carries it too. […]

---

### R-13 · CONSTITUTION.md Part 5 still publishes a Haiku-first chain the kernel forbids

**Filed by** `framework-coherence` · **against** `CONSTITUTION.md`

**Why it was refuted**

I reproduced every quoted string, then found the finding's two load-bearing inferences are both wrong. The killer is the adoption note's own wording: it supersedes "the text below", not "the rest of Part 3". Part 3's heading is at :53, the note at :55-58, Part 4 at :132, Part 5 at :147, and :159 is the file's last line — every one of those is "below" the note, so the skill's Sonnet-first chain already governs :159 by the constitution's own terms. The auditor also cites conduct/ADOPTION.md-style Part-3 scoping language nowhere in the live file; ADOPTION.md:16-18 does say "superseding CONSTITUTION.md Part 3 where they differ", which is the likely source of the misreading, but the applied live text is broader than the plan's summary, not narrower. Second, the impact story requires a Haiku session to read Part 5 in isolation while skipping :7's read-the-whole-file instruction, the note at :55, the kernel (mandated by escalate/SKILL.md:11-12 and by STRUCTURE.md's reading order item 2), and the session-open incantation printed in both operator docs. The kernel is explicitly self-defending against exactly this class of drift (kernel.md:14, :92-93, :124). Third, this is documented deliberate debt: the human-signed adoption package specified "one line added, nothing removed", STRUCTURE.md:35 then re-labels the whole file as carrying the "historical v1 procedure", and Part 2 §5 in both the constitution and the kernel reserves any removal to the human. A known, signed, deliberately-accepted retention that no model was allowed to change is refuted as a high finding. The residual — no local staleness marker on the one-screen quick reference — is real but cosmetic, low severity, and human-owned.

---

### R-14 · conduct init is offered as a normal mode although both operator docs class it as reserved

**Filed by** `framework-coherence` · **against** `.claude/skills/conduct/SKILL.md`

**Why it was refuted**

The finding's quoted strings are real, but every load-bearing inference it draws from them is false.

1. THERE IS NO init IMPLEMENTATION TO GUARD. `grep -rn "init|scaffold|Scaffold" .claude/skills/` returns exactly two init-as-mode hits in the entire framework tree: SKILL.md:3 (frontmatter description) and SKILL.md:32 (the table row). `ls -R .claude/skills/` shows conduct/references contains only routing.md and task-brief.md -- no init procedure, no scaffold template, no reference file anywhere. The claimed impact ("the two files the reserved list exists to protect are one mode-string away from being overwritten") describes a capability that does not exist in this repo. There is nothing to attach an "existing-file guard" to.

2. THE SKILL DOES FORCE THE RESERVED CHECK -- via prerequisites, not via the loop's frontier sweep. SKILL.md:13-15: "Prerequisites: read `../escalate/references/kernel.md` (adopted?), the project's `CONSTITUTION.md` if present, the ledger (`TASKS.md` or `LEDGER.md`)". That is mode-independent and applies to `conduct init` as much as to `conduct`. It forces a session to read the kernel plus the exact two files the finding says are unprotected before doing anything. And kernel.md:48-52 is unconditional -- "No model at any tier may approve these... and **this check runs first -- before the escalation floor, at every tier**" -- it is not scoped to the ledger frontier, so the finding's "the sweep only sweeps the frontier" objection does not establish an unguarded path.

3. "PROTECTION ONLY IN OPERATOR PROSE THAT NO SESSION READS" IS FACTUALLY FALSE. CLAUDE.md:7 puts CONSTITUTION.md first in the auto-loaded reading order; CLAUDE.md:16 routes reserved matters "straight to the human"; CONSTITUTION.md:39 repeats "No model at any tier may approve these, no matter how sound the reasoning. Stop and ask." and CONSTITUTION.md:45 reserves amending it. Three session-facing layers, all auto-loaded or prerequisite-mandated.

4. "IT WOULD AUTHOR PROJECT ARTICLES AUTONOMOUSLY -- A RESERVED ACT" MISREADS THE RESERVED ACT. […]

---

### R-15 · ADOPTION.md enumerates what the signature adopts and omits the escalation-floor change

**Filed by** `adoption-replay` · **against** `conduct/ADOPTION.md`

**Why it was refuted**

The finding's central assertion — ADOPTION.md "never names the change to the escalation floor itself" — is contradicted by the file, including by a line inside the auditor's own quoted grep output.

1) ADOPTION.md:11-14, item 1 of "What signing adopts", enumerates the escalation floor by name as one of four kernel components placed under signature, with the file path: "**Kernel v1.0.0** (`.claude/skills/escalate/references/kernel.md`) — the universal articles K1–K6, the reserved list, the tier table, the escalation floor." I re-ran `grep -niE 'floor' conduct/ADOPTION.md` and got exactly the auditor's three hits (13, 39, 76) — but hit 13 IS the disclosure the auditor says does not exist. The auditor grepped for the right word, got the right line, and mischaracterized it.

2) The old→new supersession is disclosed by document part, not by rule name, which is why a 'floor' grep misses it. ADOPTION.md:15-18 (item 2) states the v2 procedure "superseding `CONSTITUTION.md` Part 3 where they differ. This is an amendment to the project constitution and therefore needs the same signature." Edit 1 (ADOPTION.md:20-27) is the verbatim banner to be inserted at the TOP of Part 3 — i.e. immediately above Step 0 — reading "Where that skill and the text below differ, the skill governs. The text below is retained as the historical v1 procedure." The old conjunctive floor is CONSTITUTION.md:62, inside Part 3 (heading at :53), directly under that banner. So the signer is told the floor is adopted from the kernel, that Part 3 is superseded wherever it differs, and that Part 3's text is now historical. That is supersession-by-reference, not silence.

3) The alleged misleading reassurance is explicitly scoped and does not cover the floor. ADOPTION.md:75-76 says "No change to the project articles (CONSTITUTION.md **Part 1**) or reserved list (**Part 2**)" — Part 3 is deliberately absent from that sentence, having been declared superseded three paragraphs earlier. The word "floor" in that same line is a different sense entirely (precedence floor, cf. kernel.md:119 "a floor nothing overrides"), not the escalation trigger. […]

---

### R-16 · The ratification-rate check validates 25% against a threshold written from that same 25%, and no "band" is defined anywhere

**Filed by** `adoption-replay` · **against** `conduct/GOLDEN-REPLAY.md`

**Why it was refuted**

The finding's two load-bearing claims are both false, and it points at the wrong section.

1) "No 'band' is defined anywhere" is wrong. Exactly one section in the entire repo is titled with the word "telemetry", and it is CONDUCT-DESIGN.html §8 "Observability & telemetry" (line 515). That section — the natural referent of GOLDEN-REPLAY's "the telemetry section" — defines BOTH ends of the band at line 519: "Near 100% → the check is decorative (floor too low, or anchoring). Near 0% → briefs are starving the senior, or the floor is too high. The pilot repo's observed rate ... sits where a healthy system sits." I confirmed by grep that no other <h2>/<h3>/markdown heading anywhere in the repo contains "telemetry" (escalate/SKILL.md's headings are Step 0-4, "The storm brake", "Triage note", "Logging — not optional (K5)"; kernel.md has Parts 1-5 and no telemetry section at all). The auditor grepped brief.md (correctly: zero hits) and quoted SKILL.md's *logging* section, but never checked the one section actually named telemetry. The finding also contradicts itself: its own "claimed impact" paragraph quotes CONDUCT-DESIGN.html:519's "Near 0% → briefs are starving the senior" — i.e. the lower end of the band it says does not exist.

2) "Circular / cannot fail / passes by construction" is wrong. The failure regions are a-priori (derived from what the metric means), not from the observation: 100% would mean the check is decorative, 0% would mean starved briefs. 25% is neither. And the ≈100% end is a pre-declared kill criterion — CONDUCT-DESIGN.html:564 "Ratification rate ≈ 100% → the check is decorative", under the heading "Kill criteria — declared before the pilot, so they can't be negotiated after" (562), closing with 569 "A pilot that can't fail is theater." Had the golden set come out 4/4 ratified, the check would have failed. So it is falsifiable.

3) The measured number is not self-referential. […]

---

### R-17 · CONDUCT-DESIGN.html and GOLDEN-REPLAY.md disagree on which rulings the senior materially changed

**Filed by** `adoption-replay` · **against** `CONDUCT-DESIGN.html`

**Why it was refuted**

Both quoted strings reproduce verbatim, and the auditor's mapping of "the forward-run allowance" to Case 1 is correct (grep proves the phrase exists in only three places, all Case 1). But every load-bearing claim the finding builds on top of that mapping is false.

1. "Two documents classify the same four rulings incompatibly" — refuted. CONDUCT-DESIGN.html never classifies any ruling; it states a count (three of four changed) plus three illustrative examples. GOLDEN-REPLAY.md:32 does not say Case 1 was unchanged — it says `ratified` **"(same option, material additions)"**. So GOLDEN-REPLAY itself asserts material additions in Case 1. `ratified` in this framework's enum means *same option chosen*, not *nothing added*; the two statements are compatible, not contradictory.

2. TASKS.md — the declared source of truth — independently backs CONDUCT-DESIGN's wording. TASKS.md:180: "plus two additions — and **materially strengthened the reasoning**"; TASKS.md:188: "the parent reached a *better* answer **rather than merely ratifying**". So "the senior materially [added] the forward-run allowance" is a true statement about Case 1 per the source of truth. CONDUCT-DESIGN is not asserting anything false about the repo.

3. "The 25% figure survives only by coincidence" — refuted. It is not coincidence; it is the same tally stated three times. GOLDEN-REPLAY.md:96 "1 of 4 ratified (25%)"; CONDUCT-DESIGN.html:519 and :599 both "three of four" / "≈ 25%". MANUAL.html:592-594, written a commit later and explicitly "corrected against verified state," restates the identical taxonomy scaled to five rulings: "one ratified with additions, two where the senior refuted the junior's premise ..., and two modified" — one ratified, four changed. The 5th ruling's own telemetry line confirms it (`Telemetry: outcome \`modified\``, TASKS.md:240). Every document agrees on both the tally and the taxonomy.

4. "An ambiguous label on the only ratified case makes the 25% figure unauditable" — refuted outright. […]

---

### R-18 · STRUCTURE.md header is stale at HEAD: 73/4/722e0c6 vs actual 76/7/00a08ec

**Filed by** `docs-vs-reality` · **against** `STRUCTURE.md`

**Why it was refuted**

I re-ran every command myself rather than trusting the offered evidence, and the numbers the finding calls wrong are right for the commit the file pins.

1. Header accuracy against its declared pin. `git ls-tree -r --name-only 722e0c6 | wc -l` → 73, matching "Tracked files 73". `git rev-list --count origin/main..722e0c6` → 4, matching "Unpushed commits 4". The auditor compared both against HEAD (76 / 7, which I also reproduced) but line 8 reads "At commit `722e0c6`" — the table is scoped to that commit, so 73/4 are correct statements, not stale ones.

2. Explicitly documented as accepted drift. Lines 13-14, immediately below the table, are precisely the acknowledgement the verifier brief says to look for: snapshot, not live view, repo wins on disagreement, here are the regeneration commands. Per my instructions a known, documented, deliberately-accepted condition is REFUTED.

3. The pin is the only coherent choice. `git show --stat df3f299` confirms that commit added STRUCTURE.md, .txt and .pdf; 722e0c6 is its parent. A self-describing snapshot cannot cite the hash of the commit that will contain it, so pinning to the immediately-preceding commit is correct practice, not an oversight.

4. The "edited twice after its pin" argument collapses on inspection. `git show ae6322c -- STRUCTURE.md` and `git show 00a08ec -- STRUCTURE.md` show both diffs confined to the "Re-rendering the PDF" section (adding the cupsfilter recipe and verification script; replacing literal box-drawing glyphs with U+251C/2502/2514/2500 names). Neither added nor moved any file, so neither met STRUCTURE.md:161's own regeneration trigger.

5. The claimed impact is false, and self-contradicting. The finding says a reader "will not know STRUCTURE.txt/.pdf exist or that they must be re-rendered", while its own evidence cites the very section that documents them. Lines 201-225 name both, justify both, and give the regeneration plus clipping-verification commands.

6. The tree-omission claim is overstated. My scripted coverage check over the tree block (lines 31-140) found only two tracked files at HEAD not named there: STRUCTURE.pdf and STRUCTURE.txt. […]

---

### R-19 · None of the three pages sets a viewport meta, so their own narrow-window CSS cannot fire on a phone

**Filed by** `html-artifacts` · **against** `MANUAL.html`

**Why it was refuted**

The auditor's raw facts reproduce exactly, but the finding fails on three independent grounds: it is explicitly documented as deliberate in all three files, the omission is *required* by the publishing medium rather than a debt, and the finding's only bridge to real-world impact is a misreading of its own citation.

1) DOCUMENTED AS DELIBERATE — IN ALL THREE FILES. My instructions say a documented, deliberately-accepted decision is REFUTED. Each file states the reason in its own header comment: MANUAL.html:12 "Published as a claude.ai Artifact, which supplies the doctype/head/body."; STATUS.html:8-9 "...supplies the doctype/head/body wrapper — hence no <!DOCTYPE>/<html>/<body> tags here."; CONDUCT-DESIGN.html:9-10 "...the artifact runtime supplies the doctype/head/body wrapper, so this file starts at <title>." STRUCTURE.md:42 independently labels the group "Documents (each an artifact; ...)". The auditor found this text and dismissed it; it is dispositive.

2) NOT A DEBT — IT IS COMPLIANCE WITH THE PUBLISHING CONTRACT. The claude.ai Artifact spec wraps the file in a doctype/head/body skeleton at publish time and instructs authors to write page content directly with no DOCTYPE/html/head/body tags of their own. Adding a head would be the violation. In the medium these files are published to, the wrapper supplies the viewport and charset and the breakpoints fire normally — which the finding itself concedes ("Read as Artifacts ... this is harmless there").

3) THE REPO APPLIES BOTH CONVENTIONS CORRECTLY. plan.html — the one HTML file CLAUDE.md:10 puts in the *local* reading order — carries the full head: line 1 `<!DOCTYPE html>`, line 4 `<meta charset="UTF-8">`, line 5 `<meta name="viewport" content="width=device-width, initial-scale=1.0">`. The authors demonstrably know how to write a locally-openable page and did so where it was appropriate. The three artifact files are a different, correctly-applied convention, not an oversight.

4) THE IMPACT CLAIM MISREADS ITS OWN SOURCE. […]

---

### R-20 · STATUS.html marks Princeton's return series complete over FY2001-FY2025 and drops the documented FY2003 gap

**Filed by** `html-artifacts` · **against** `STATUS.html`

**Why it was refuted**

The raw observation reproduces, but every load-bearing claim built on top of it fails verification, and the rule violation it alleges does not exist.

WHAT REPRODUCES: STATUS.html:684-690 is quoted accurately, and Princeton's returns really do have 24 rows spanning FY2001-FY2025 with FY2003 missing. That much I confirmed.

WHY IT IS NOT A DEFECT AT THE CLAIMED SEVERITY:

1. The "one cell on the page" uniqueness claim is FALSE. Harvard's allocation cell (STATUS.html:661-663) reads 77 rows / "FY2005-FY2025" with no gap annotation at all, yet Harvard's allocation years are [2005, 2008, 2010, 2012, 2013, 2015, 2016, 2017, 2019, 2020, 2021, 2023, 2024, 2025] - 14 of 21 years, i.e. SEVEN unannotated missing years, more than Princeton's one. The table simply does not have the uniform annotate-every-gap convention the finding asserts, so the Princeton cell is not an anomaly.

2. The cell the auditor holds up as the correct model is itself imprecise. Princeton's allocation cell says "FY2005-FY2023, 2 gaps", but Princeton's allocation years are contiguous 2005-2018 plus 2020-2023 - exactly ONE internal gap (FY2019), matching data/README.md:683 ("FY2005-FY2018, FY2020-FY2023"). The auditor cited a cell that overstates its own gap count as evidence of a convention the Princeton return cell violates.

3. The "complete" pill demonstrably does not assert contiguity in this table. MIT carries "complete" with 7 of 15 allocation years present; Harvard carries "complete" with 14 of 21. Stanford gets "disclosure limit" and benchmarks "3 deferred". The State column tracks curation state (everything obtainable has been captured), not series contiguity - and Princeton's curation IS complete: data/README.md:386-392 records that FY2003's Report of the Treasurer is a scanned-image PDF with no text layer and no OCR available, and FY2000 prints no endowment-specific return. So the pill is correct as used.

4. The alleged rule violations do not hold. […]

---

### R-21 · endowment_returns has no column for Stanford's Aug-31 basis; 26 of 128 rows silently differ

**Filed by** `schema-seed` · **against** `src/lib/db/schema.ts`

**Why it was refuted**

REFUTED on three independent grounds. The schema observation is true but the two load-bearing claims built on it are false, and the decision is an explicitly recorded judgment call.

1) TRUE PART: I read /Users/amayb/Projects/dashboardProject/src/lib/db/schema.ts:55-79 myself. endowmentReturns does have exactly seven columns (id, schoolId, fiscalYear, returnPct, marketValueUsdMillions, returnSourceId, marketValueSourceId) and no basis/as-of/note column. The counts also reproduce: 128 total endowmentReturns rows across data/schools/*.json (yale 26, harvard 26, mit 26, princeton 24, stanford 26), and all 26 Stanford rows are market-value-only (nullReturnPct = 26, keys across all Stanford rows = exactly ["fiscalYear","marketValueSourceId","marketValueUsdMillions"]).

2) THE CENTRAL CLAIM IS FACTUALLY WRONG. The finding asserts the Aug-31 qualification "has nowhere to land on seed" and "survives only as prose in data/README.md, which never reaches the database." It does reach the database. I joined every Stanford market-value row to data/sources.json via marketValueSourceId: 26 of 26 rows resolve to a source whose seeded `title` and/or `notes` field explicitly states "August 31" (e.g. sources.json:454 title "Stanford University Annual Financial Report (Fiscal Years Ended August 31, 2025 and 2024)"; sources.json:340 notes "...as of August 31 (Stanford's own fiscal year end – see the Stanford as-of dating section in data/README.md)"). `sources.title` and `sources.notes` are real seeded columns (schema.ts:22, schema.ts:28) and scripts/seed.ts:139-145 writes both. So the basis IS machine-reachable per row through the citation the project's own no-number-without-a-citation rule already guarantees exists.

3) IT IS A DOCUMENTED, DELIBERATE DECISION. TASKS.md:241 records it as a formal ruling: "**`[JUDGMENT CALL]` Stanford's fiscal year ends August 31, not June 30** — ... Rows labelled by Stanford's own FY naming; 2-month offset disclosed at display (3.2/6.1). […]

---

### R-22 · latestClosedFiscalYear applies the June-30 rule to Stanford, admitting a fiscal year that has not closed

**Filed by** `schema-seed` · **against** `scripts/lib/seed-validate.ts`

**Why it was refuted**

The mechanics of the finding are 100% reproducible — I confirmed every element independently: `latestClosedFiscalYear()` at scripts/lib/seed-validate.ts:46-48 takes no school parameter and hardcodes `getUTCMonth() >= 6`; running it via `npx tsx` gives 2026-06-30 -> 2025, 2026-07-01 -> 2026, 2026-07-31 -> 2026, 2026-08-31 -> 2026, real clock -> 2026; the error string at line 420 does assert "fiscal years end June 30" universally; the sole regression case is scripts/verify-seed-validator.ts:259 ("fiscal year that cannot have closed yet"), which drives it through Yale only; and data/README.md:19 plus CLAUDE.md:40 both state Stanford's FY ends August 31.

The finding is nevertheless REFUTED because it is an explicitly recorded, deliberately-not-fixed debt in the project's single source of truth, and in the same words. TASKS.md:252 reads: "**Latent bug recorded, not fixed (rail change, needs its own regression case):** `latestClosedFiscalYear()` in `scripts/lib/seed-validate.ts` hard-codes the June-30 assumption, so between 1 July and 31 August it will accept a Stanford fiscal year that has not closed. The documentation is currently the only guard. Fix is a per-school fiscal-year-end map plus a `seed:verify` case." MANUAL.html:768 renders it as the FIRST row of section 10, "Known debts and open holes" (a section prefaced "Recorded here so none of them is discovered the hard way"): "The validator assumes every fiscal year ends 30 June | Stanford's ends 31 August, so between July and August the validator will accept a Stanford year that has not closed. The documentation is the guard here, not the code. Fix: a per-school fiscal-year-end map, with a regression case."

The documentation matches the auditor's diagnosis on every axis — the same function, the same two-month window (1 July–31 August), the same observation that documentation rather than code is the guard, the same prescribed fix (per-school fiscal-year-end map plus a regression case), and the same acknowledgement that it needs its own seed:verify case. […]

---

### R-23 · Per-figure citation pairing is enforced only by the seed script, not by any DB constraint

**Filed by** `schema-seed` · **against** `src/lib/db/schema.ts`

**Why it was refuted**

The finding's raw mechanical facts are reproducible, but its framing as a defect does not survive. Four independent grounds refute it.

(1) THE RULE IS FILE-SCOPED, NOT DB-SCOPED. The finding calls this "the project's second non-negotiable rule ... enforced at one layer only." But the rule as actually written governs seed files, not storage. PRD.md:44: "**Every number is sourced.** No data enters a seed file without a citation." CLAUDE.md rule 2: "Every data point in `data/` has a citation (source_id → `sources`). No citation, no number." Neither text asserts a database constraint. The framework therefore does not "claim to enforce" something it fails to enforce — it enforces the rule at exactly the layer where it states it, and the finding's own investigation confirmed the validator covers all four pairing directions (I re-verified: seed-validate.ts:887, 899, 906, 913, 920).

(2) IT IS EXPLICITLY DOCUMENTED AS A DELIBERATE, HUMAN-APPROVED DECISION — in three places, one of which the finding quotes against itself. schema.ts:72-74 states the rationale and provenance ("human-approved rail change, 2026-07-30 — see the build log"). TASKS.md:233 is that build log entry: "**Rail change (human-approved, pre-fan-out)** ... Validator now enforces exact pairing both directions." data/README.md:661 affirmatively states the chosen enforcement layer *and its rationale*: "enforced mechanically, **from the files, so it holds under `seed:dry` with no database**." That is a design reason to put the rule in the validator rather than the DB — the validator runs where no DB exists. Per the audit rules, a documented, deliberately-accepted arrangement is refuted as a finding.

(3) TWO SUPPORTING FACTUAL CLAIMS ARE WRONG OR IMPRECISE.
  (a) "Every other fact table does carry the rule in the schema." Not so — schema.ts:101 `sourceId: text("source_id").references(() => sources.id)` on proxy_mappings is nullable with no .notNull(), and the validator treats it as optional too (seed-validate.ts:1060 `optionalString`). The claimed universal pattern has an exception the auditor missed.
  (b) "package.json ships two write paths that bypass it — `db:studio` ... […]

---

### R-24 · scripts/seed.ts runs main() unconditionally at module scope while exporting parseArgs — importing it seeds

**Filed by** `build-health` · **against** `scripts/seed.ts`

**Why it was refuted**

The mechanism is real and I reproduced it — but it is a KNOWN, EXPLICITLY DOCUMENTED, deliberately-accepted debt, recorded in the single source of truth AND in its rendering, both written by the very commits under audit. That is the stated refutation condition.

1) DOCUMENTED IN TASKS.md (source of truth), line 253, in the audited range (commit 722e0c6): "**Other debts surfaced and recorded in the manual, none owned by a task:** ... `numeric` columns return JS strings from the driver, a silent-concatenation landmine for 2.2; **`scripts/seed.ts` has no main-module guard, so importing it executes it (with `--write` in argv that is a pruning write)**; the 15 task-1.6 fragments were never deleted ...". That is the finding, verbatim, including the --write-argv-means-pruning-write consequence.

2) DOCUMENTED IN MANUAL.html, line 773, same commit, in the "Debt / Consequence" table: "<strong>Importing the seed script runs it</strong> | There is no main-module guard, so importing <code>scripts/seed.ts</code> executes it &mdash; with <code>--write</code> in argv, that means a pruning write. **Import only the validator module.**" The doc even prescribes the mitigation. The rendering agrees with TASKS.md, so project rule 2 is satisfied, and rule 3 ("documented gaps must be documented, not silently dropped") is satisfied — it was not dropped.

3) OUT OF THE AUDITED SCOPE. `git diff a2eb063~1 HEAD -- scripts/seed.ts` is 6 lines, entirely the sourceId -> returnSourceId/marketValueSourceId split at lines 187-200. `git show a2eb063~1:scripts/seed.ts | grep -n` gives "305:export function parseArgs(...)" and "395:main().catch((err) => {" — both already present before the range. `git log -S` dates them: the top-level `main().catch` came in f9fd299 (task 1.2) and the `export` in cbc9082 (24 July), both pre-range.

4) THE "TESTABILITY BLOCKER" IMPACT IS FACTUALLY WRONG. The auditor asserts "the file already exports a function specifically so it can be exercised in isolation." Unsupported: `grep -rn parseArgs` over the whole repo (excluding node_modules) returns exactly TWO hits, both inside seed.ts — the definition at 307 and its own call at 351. […]

---
