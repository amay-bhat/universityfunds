# WP3 — Correct the data-methodology record — `data/README.md` and friends

3 work orders. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

`data/README.md` is the provenance record behind every curated figure, and every curation session is instructed to read it in full. These errors are narrative rather than numeric — no figure is wrong — but they send a reader hunting for source documents that the build log proves were never archived.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-14` | high | `data/README.md` | 90 | README's Harvard-tail provenance claim is false for FY2000/FY2001 and contradicted by source… |
| `A-15` | high | `data/README.md` | 627 | Four docs claim seed:verify "asserts each rule fires"; 31 of 53 diagnostic sites go undetect… |
| `A-16` | medium | `data/README.md` | 220 | MIT's as-of dating section was not updated when the 18 Pool A rows merged; FY2001 is dated b… |

---

### A-14 · README's Harvard-tail provenance claim is false for FY2000/FY2001 and contradicted by sources.json's own note

| | |
|---|---|
| **Severity** | high |
| **Location** | `data/README.md:90` |
| **Found by** | 1 independent auditor — `citations` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
89: 
90: Returns and market values are curated for the **complete FY2000–FY2025 range (26 rows, no holes)**. The FY2000–FY2006 and FY2010 tail was closed by pilot unit 1.6.D: HMC's older reports carry no multi-year returns table the way Yale's did, so each of those years came from its own primary document — Harvard's **University Financial Report** for that year (no HMC document exists  …
91:
```

**What is wrong**

`/Users/amayb/Projects/dashboardProject/data/README.md:90` makes two provenance assertions about Harvard's eight-year returns tail (FY2000–FY2006 + FY2010), and both are contradicted by the repo's own records:

(1) "each of those years came from its own primary document — Harvard's **University Financial Report** for that year". False for FY2000 and FY2001. `data/schools/harvard.json:622-641` cites `hmc-university-financial-report-2002` for the return AND market value of all three of FY2000, FY2001 and FY2002. The eight tail years are sourced from **six** documents (2002, 2003, 2004, 2005, 2006, 2010), not eight. `data/sources.json`'s note on that id says the opposite of README and gives the reason: "no standalone FY2000 or FY2001 report was ever captured by the Wayback Machine … confirmed via CDX search."

(2) The reason given — "HMC's older reports carry no multi-year returns table the way Yale's did, so each of those years came from its own primary document" — is a non-sequitur built on a falsified premise. The substitute documents actually used *all* carry rolling five-year tables: `data/sources.json` records column headers "1998 1999 2000 2001 2002", "1999 2000 2001 2002 2003", "2000 2001 2002 2003 2004", "2005 2004 2003 2002 2001", "2006 2005 2004 2003 2002" for the 2002/03/04/05/06 editions respectively, each with a "Total return on general investments" row; and the 1.6.D build log at `conduct/fragments/1.6/harvard-returns-buildlog.md:19-26` states flatly that the report "**over-delivers**: each year's 'Analysis of Financial Results' section prints a rolling 5-year 'Summary of Financial Results' table … Five of these tables (FY2002/03/04/05/06 editions) overlap enough to cross-confirm every one of FY2000-2006 two-to-four times over." (Narrow defense, for fairness: HMC-proper documents genuinely do not exist for these years, so that clause is vacuously true in isolation — but README deploys it as the *reason* for a per-year method that was not used for 2 of the 8 years and that the actual documents' content contradicts.)

Root cause, and why it lands inside the audit window: `git show 722e0c6 -- data/README.md` shows this sentence was a pre-curation *plan* statement ("each of those years **needs** its own primary document — the John Harvard Letter for that year, or Harvard's University Financial Report") that commit 722e0c6 edited to past tense ("**came from** its own primary document") while retaining the premise that 1.6.D had already falsified. So the commit titled "correct four docs against verified state" converted a stale prediction into a false factual claim.

Scope limit that argues against critical: no published figure is wrong or unsourced. All 8 tail rows carry both a `returnSourceId` and a `marketValueSourceId`, all 16 resolve into `sources.json`, and the FY2000/01/02 values (32.2 / −2.7 / −0.5 and 19148.3 / 18259.2 / 17518.0) match the table rows quoted in the `hmc-university-financial-report-2002` note digit-for-digit. […]

**Evidence as filed**

```text
data/README.md:90 — "HMC's older reports carry no multi-year returns table the way Yale's did, so each of those years came from its own primary document — Harvard's **University Financial Report** for that year (no HMC document exists for them at all…)". But data/schools/harvard.json cites all three of FY2000, FY2001, FY2002 (return and market value) to `hmc-university-financial-report-2002`; the eight tail years use six documents, not eight. data/sources.json's own note for that id says the opposite of README: "Only Harvard University Financial Report of any fiscal year found archived that covers FY2000 and FY2001 (no standalone FY2000 or FY2001 report was ever captured by the Wayback Machine … confirmed via CDX search). Its Summary of Financial Results table is explicitly column-headed '1998 1999 2000 2001 2002'". I re-fetched the PDF (833,967 bytes) and extracted: "SUMMARY OF FINANCIAL RESULTS … 1998 $1,679.3 … 19991 $1,771.9 … 2000 $2,022.6 … 19,148.3 32.2% … 2001 … 18,259.2 2002 … 17,518.0 (2.7%) (0.5%)" — a five-year table, present.
```

**Independent reproduction by the refuting auditor**

```text
COMMAND: grep -n "came from its own primary document" data/README.md
data/README.md:90 → "Returns and market values are curated for the **complete FY2000–FY2025 range (26 rows, no holes)**. The FY2000–FY2006 and FY2010 tail was closed by pilot unit 1.6.D: HMC's older reports carry no multi-year returns table the way Yale's did, so each of those years came from its own primary document — Harvard's **University Financial Report** for that year (no HMC document exists for them at all, established by archive enumeration). Those eight years are QC-verified digit-for-digit…"

COMMAND: grep -n "hmc-university-financial-report" data/schools/harvard.json
624: "returnSourceId": "hmc-university-financial-report-2002"   (FY2000)
626: "marketValueSourceId": "hmc-university-financial-report-2002"
631: "returnSourceId": "hmc-university-financial-report-2002"   (FY2001)
633: "marketValueSourceId": "hmc-university-financial-report-2002"
638: "returnSourceId": "hmc-university-financial-report-2002"   (FY2002)
640: "marketValueSourceId": "hmc-university-financial-report-2002"
645/647: …-2003   652/654: …-2004   659/661: …-2005   666/668: …-2006   694/696: …-2010

COMMAND: python3 (my own count, over data/sources.json + data/schools/harvard.json)
tail rows: 8
distinct docs across 8 tail years: 6
['hmc-university-financial-report-2002','...-2003','...-2004','...-2005','...-2006','...-2010']
all resolve: True      ← every returnSourceId and marketValueSourceId asserted present in sources.json ids; […]
```

**Why it matters** — An auditor following README would go looking for cited FY2000 and FY2001 Harvard reports that do not exist and are not cited, and would conclude the citation chain is broken when it is not. The two documents that are meant to be the project's provenance record disagree with each other about how three of the 26 Harvard return rows and three of the 26 market-value rows are sourced — precisely the class of drift rule 2 ("renderings must not disagree with the repo") exists to prevent.

**Fix**

Rewrite data/README.md:90 to match the repo: the FY2000–FY2006 + FY2010 tail comes from six University Financial Reports, with the FY2002 edition supplying FY2000–FY2002 from its own five-year Summary of Financial Results table (no standalone FY2000/FY2001 report survives), and drop the "no multi-year returns table" rationale.

**Verify**

```bash
python3 -c "import json;h=json.load(open('data/schools/harvard.json'));ids={r.get('returnSourceId') for r in h['endowmentReturns'] if r['fiscalYear']<=2006 or r['fiscalYear']==2010};print(len(ids),'distinct documents for the 8 tail years')"
```

---

### A-15 · Four docs claim seed:verify "asserts each rule fires"; 31 of 53 diagnostic sites go undetected

| | |
|---|---|
| **Severity** | high |
| **Location** | `data/README.md:627` |
| **Found by** | 1 independent auditor — `validator` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
626: | `npm run seed` | Validate, then write to Neon. |
627: | `npm run seed:verify` | Run the validator against deliberately-broken copies of this folder and check every rule still fires. Run it after changing `scripts/lib/seed-validate.ts`. |
628: | `npx tsx scripts/seed.ts --dry-run --data-dir <path>` | Validate a different folder. |
```

**What is wrong**

Five documents overstate what `npm run seed:verify` proves. The suite has 30 cases and prints "30/30", but it does not assert that every validator rule fires — 31 of the validator's 53 `report.error`/`report.warn` sites can be individually silenced with the suite still printing 30/30 (verified: total sites=53, detected=22, undetected=31, crash=0; undetected error sites 310, 329, 350, 366, 476, 498, 503, 532, 540, 556, 572, 607, 678, 719, 729, 858, 868, 904, 911, 928, 954, 996, 1006, 1046, 1133 and undetected warn sites 315, 337, 1147, 1171, 1183, 1223). Fourteen whole rule blocks can be commented out with the suite still green, each independently reproduced at 30/30: 531-534, 539-544, 554-558, 606-610, 718-721, 884-890, 927-933, 934, 948-950, 953-957, 995-1001, 1004-1009, 1045-1049, 1130-1138. Controls confirm the harness detects real coverage (muting 937-951 -> 28/30; muting 1102-1106 -> 29/30).

The false statements: data/README.md:627 "check every rule still fires"; scripts/lib/seed-validate.ts:6 "asserts each rule actually fires"; MANUAL.html:338 "assert each rule fires"; TASKS.md:192 "asserts every rule fires"; and most directly MANUAL.html:437, "`seed:verify` must stay at full count because that is how an unauthorised edit to a validator file gets detected" — 14 rule blocks can be deleted from seed-validate.ts without the count moving. STRUCTURE.md:107's "30-case regression suite proving the validator works" is the same overstatement in weaker form.

Unbacked by any other evidence in the repo are the endowment `returnPct` plausible-range check (927-933), the benchmark `returnPct` plausible-range check (995-1001), and both decimal-scale call sites for returns figures (934, 948-950) — the latter guarding the failure documented at seed-validate.ts:388-392, where "Postgres rounds a value that exceeds the column's scale instead of erroring" leaves the seed files and the database disagreeing about a figure nobody re-checked. (The generic checkScale reporter at line 402 is pinned, but only through the allocations `pct` case.)

Scope limits, stated honestly: the validator does still enforce all of these rules at `seed:dry` time, so no currently published figure is wrong and nothing breaks the build; the defect is a false all-clear for any future session that refactors the validator and trusts 30/30. Two amendments to the original filing: there are six undetected warn sites, not four (315 and 337 are also unasserted), and the "14 of 23 rule blocks" denominator is an auditor-invented taxonomy — the reproducible figures are 31 of 53 diagnostic sites and the 14 named blocks above. No document in the repo acknowledges this gap, and CONDUCT-DESIGN.html:373 (kernel rule K3) explicitly requires gaps in "test coverage" to be documented rather than left implied.

**Evidence as filed**

```text
data/README.md:627 — "| `npm run seed:verify` | Run the validator against deliberately-broken copies of this folder and check every rule still fires. Run it after changing `scripts/lib/seed-validate.ts`. |"

Literal output of the block-mutation study (each name = that block commented out in a COPY of seed-validate.ts, then `tsx verify-mut.ts`):
  M1_endowment_neither_figure_check           muted 884-890  -> 30/30 validator checks passed.
  M2b_returnPct_range_endowment_only          muted 927-933  -> 30/30 validator checks passed.
  M3_returnPct_range_benchmark                muted 995-1001 -> 30/30 validator checks passed.
  M4_marketValue_scale_check                  muted 948-950  -> 30/30 validator checks passed.
  M5_schoolid_vs_SCHOOL_IDS_both_ways         muted 539-544  -> 30/30 validator checks passed.
  M5b_SCHOOL_IDS_missing_from_schoolsjson     muted 554-558  -> 30/30 validator checks passed.
  M5c2_duplicate_school_id_only               muted 531-534  -> 30/30 validator checks passed.
  M6_duplicate_source_id                      muted 606-610  -> 30/30 validator checks passed.
  M7_benchmark_duplicate_series_year           muted 1004-1009 -> 30/30 validator checks passed.
  M8_all_rows_rejected_no_sum_possible         muted 1130-1138 -> 30/30 validator checks passed.
  M9_duplicate_endowment_fiscal_year            muted 953-957  -> 30/30 validator checks passed.
  M10_proxy_duplicate_category                 muted 1045-1049 -> 30/30 validator checks passed.
  M11 […]
```

**Independent reproduction by the refuting auditor**

```text
A. Doc claims (grep -rn over repo, node_modules excluded):
  MANUAL.html:338 "Run the validator against 30 deliberately-broken copies of <code>data/</code> and assert each rule fires."
  TASKS.md:192 "...drives the validator against deliberately-broken copies of `data/` and asserts every rule fires."
  scripts/lib/seed-validate.ts:6 " * deliberately-broken copies of `data/` and asserts each rule actually fires."
  data/README.md:627 "| `npm run seed:verify` | Run the validator against deliberately-broken copies of this folder and check every rule still fires. ... |"
  MANUAL.html:437 (stronger, missed by the filing): "Two supporting rules worth internalising: <code>seed:verify</code> must stay at full count <em>because that is how an unauthorised edit to a validator file gets detected</em>"
  STRUCTURE.md:107 "verify-seed-validator.ts     * 30-case regression suite proving the validator works"

B. Counts I ran myself:
  $ grep -c "report\.error(\|report\.warn(" scripts/lib/seed-validate.ts  -> 53   (report.error 45, report.warn 8; warn lines: 315 337 786 1147 1171 1183 1208 1223)
  $ npx tsx scripts/verify-seed-validator.ts | tail -1                    -> "30/30 validator checks passed."  EXIT=0

C. […]
```

**Why it matters** — The suite is the project's only evidence that the validator works, and "30/30" is treated as proof of that. In fact whole rules can vanish from seed-validate.ts with the suite still green — including two rules nothing else backs up: the `returnPct` plausible-range check (seed-validate.ts:927-933 and 995-1001) and the two decimal-scale checks (934, 948-950), whose entire stated purpose is that "Postgres rounds a value that exceeds the column's scale instead of erroring" (seed-validate.ts:388-392). A future session refactoring the validator gets a false all-clear.

**Fix**

Either (a) soften the four claims to what is true — e.g. "regression-tests 22 of the validator's 53 diagnostics; see the coverage list" — or (b) add the missing negative cases. The highest-value additions, in order: returnPct out of range on an endowment row and on a benchmark row; returnPct and marketValueUsdMillions with too many decimals; `allocations` present but not an array; duplicate endowmentReturns fiscalYear; duplicate benchmark (series, fiscalYear); duplicate source id; duplicate school id; a schools.json id absent from SCHOOL_IDS and vice versa.

**Verify**

```bash
sed -n "624,630p" data/README.md
```

---

### A-16 · MIT's as-of dating section was not updated when the 18 Pool A rows merged; FY2001 is dated by default

| | |
|---|---|
| **Severity** | medium |
| **Location** | `data/README.md:220` |
| **Found by** | 1 independent auditor — `completeness-critic` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
219: 
220: One of the two allocation tables is explicitly dated and one is not, so the second needed evidence.
221:
```

**What is wrong**

data/README.md:220 opens the MIT dating subsection with "One of the two allocation tables is explicitly dated and one is not, so the second needed evidence." Three source tables now feed MIT's 42 curated allocation rows, not two: the 2008 Senate Table 6C (dated), the 2016 congressional Table 1.2 (undated, evidenced at :221), and Bufferd Table II, whose columns are headed only `2004 / 2003 / 2001` and which supplied the 18 Pool A rows merged at integration. The subsection was never extended to cover them. That matters because of the project's own standing rule, which the same file states at :500 and which TASKS.md:148 records as "binding on task 1.6": "An undated disclosure may be assigned to a fiscal year only on documented evidence, never by default... If neither exists, the year is a gap." For FY2004 and FY2003 the evidence exists in the coverage table (:206 cites Figure 1, "Pool A Asset Allocation on June 30, 2004"; :205 cites Figure 2, "MIT Pool A ... as of June 30, 2003"), but for FY2001's six rows there is no as-of evidence anywhere in data/ — not in the coverage table, not in the dating subsection, and not in the `mitimco-fnl-bufferd-2004` source note, which discusses measurement universe and the fetch gate but says nothing about dating. The evidence that would satisfy the rule does exist one directory away — conduct/fragments/1.6/mit-buildlog.md transcribes Table II's title, "Pool A Asset Allocation for Past One, Three, Five and Ten Years", which anchors the 2003/2001/1999/1994 columns to June-30 anniversaries of the June 30 2004 pie — but it was never carried into data/README.md at integration. This is an integration-lane omission: the fragment (conduct/fragments/1.6/mit-readme-section.md:47ff) was correct when written, because at that point no Pool A year was curated; diffing it against the merged section shows the coverage table and the Pool A paragraph were both rewritten for the ruling while the dating subsection was left untouched.

**Evidence as filed**

```text
data/README.md:220: `One of the two allocation tables is explicitly dated and one is not, so the second needed evidence.`
data/README.md:500: `- **An undated disclosure may be assigned to a fiscal year only on documented evidence, never by default.** ... If neither exists, the year is a gap.`
data/README.md:203 (FY2001 coverage row, integration-edited): `| FY2001 | **Pool A (curated)** | A percentage table for this year *does* exist — Bufferd Table II, 2001 column — but it is labelled "**Pool A** Asset Allocation", not the endowment. Referred up as a measurement-universe question (tripwire 6); see "MIT's Pool A tables" below. |` — no as-of evidence.
data/sources.json, id `mitimco-fnl-bufferd-2004`, notes field: universe, coverage ratios and the fetch gate only; the string "as of"/"June 30" appears solely in the FY2006/FY2011 magnitudes, never about the table's columns.
conduct/fragments/1.6/mit-buildlog.md: `Table II ("Pool A Asset Allocation for Past One, Three, Five and Ten Years" — columns 2004 / 2003 / 2001 / 1999 / 1994, **each summing to exactly 100.0**)` — the unused dating evidence.
```

**Why it matters** — Six published FY2001 allocation rows are assigned to a fiscal year with no documented evidence in the file that the standing rule binds, which is precisely the failure mode the Harvard dating decision created the rule to prevent (a whole year of a series silently shifted). The section's opening sentence also miscounts the tables it governs, so a future curator auditing MIT's dating reads "two tables" and never looks for the third.

**Fix**

Extend the MIT as-of dating subsection to three tables and record Table II's dating evidence there: its title, "Pool A Asset Allocation for Past One, Three, Five and Ten Years", anchored on Figure 1's explicit "June 30, 2004", makes the 2003 and 2001 columns June-30 anniversaries; cite Figure 2 ("as of June 30, 2003") for FY2003. Fix the opening count to "one of the three allocation tables is explicitly dated".

**Verify**

```bash
sed -n "217,223p" data/README.md
```

---
