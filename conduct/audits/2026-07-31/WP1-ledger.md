# WP1 — Correct the ledger (`TASKS.md`) — upstream of every rendering

2 work orders. Part of the [31 July 2026 audit](README.md) — read section 0 there first.

**Why this package exists**

Two findings here are *root* errors: they live in the ledger and were then copied into three renderings. Fixing a rendering before its ledger entry guarantees the error returns the next time anything is regenerated. `TASKS.md` is the declared source of truth (`STRUCTURE.md:163` — "if a document disagrees with it, the document is stale"), so it goes first. The undated-Harvard-tables count is the clearest case: it is wrong at `TASKS.md:143` and `:145`, and from there it reached `data/README.md` twice, `STATUS.html` twice and `conduct/GOLDEN-REPLAY.md` once.

---

| ID | Sev | File | Line | Defect |
|---|---|---|---|---|
| `A-01` | high | `TASKS.md` | 240 | Only ruling made under the adopted protocol omits 2 of 6 mandatory log fields |
| `A-02` | medium | `TASKS.md` | 41 | Live display obligations for 66 curated rows exist only in data/README.md prose; no task spe… |

---

### A-01 · Only ruling made under the adopted protocol omits 2 of 6 mandatory log fields

| | |
|---|---|
| **Severity** | high |
| **Location** | `TASKS.md:240` |
| **Found by** | 2 independent auditors — `framework-coherence`, `cross-dimension` |
| **Status** | **Confirmed** — an independent auditor was asked to refute this and failed |
| **Verifier confidence** | high |

**Current text at `HEAD` = `00a08ec`**

```text
239: - **QC record — 4/4 units passed, and every defect found was in recorded *reasoning*, never in a number.** Princeton: 33 figures re-verified against Actual columns with the Target-column trap disproven per year; the DM+EM→`public_equity` merge forced by Princeton's own disclosure ("formerly Domestic Equity and International Equity-Developed"). MIT: 100% verification — all 24 co …
240: - **`[PROXY DECISION]` Pool-basis percentages under a school's name. Two-phase blind ruling, fresh-context Fable senior; requester Fable (conductor).** Question: may pool-published percentages be curated under the school's name? Options: never / conditional / always-labelled / defer. **Both phases independently chose conditional (B); the senior's conditions govern:** B1 school- …
241: - **`[JUDGMENT CALL]` Stanford's fiscal year ends August 31, not June 30** — falsifies the README's old foundational sentence, now corrected. Rows labelled by Stanford's own FY naming; 2-month offset disclosed at display (3.2/6.1). Below the floor: no materially different work between readings, cheap to relabel, rule application unambiguous.
```

**What is wrong**

The pool-basis `[PROXY DECISION]` entry at /Users/amayb/Projects/dashboardProject/TASKS.md:240 — the only ruling produced under the two-phase protocol adopted on 2026-07-30 (TASKS.md:232 "The two-phase blind-ruling procedure is now the governing escalation protocol"; TASKS.md:243 "Escalations: 1 formal (pool-basis, `modified`)") — omits the Article check that CONSTITUTION.md:139, .claude/skills/escalate/references/brief.md:134 and TASKS.md's own convention line (:131 "with both models' recommendations and the Article check") all make mandatory. The string "Article"/"Articles" appears ZERO times in line 240 (verified: `awk 'NR==240' TASKS.md | grep -o -i "article[s]*"` returns nothing); the only rule citation is incidental ("made the gate mandatory under K1"). The other four rulings each carry an explicit "**Article check.**" bullet (TASKS.md:147, 158, 183, 206) enumerating Articles 1-10 plus the Part 2 boundary. It also omits the labeled "What would justify revisiting" field (present only at :161, :187, :209) and the wall-clock telemetry field required by brief.md:137 and .claude/skills/escalate/SKILL.md:102 ("including telemetry (tokens, wall-clock, outcome enum, phase-delta)") — the entry gives tokens (~89k), outcome (`modified`) and phase-delta, but no duration, unlike the other rulings' protocol notes (:149 "~15 minutes", :162 "~12 minutes", :188 "~2.5 minutes"). Consequently MANUAL.html:600-601 is materially false: "Each records what *would* justify revisiting it" is untrue for two of the five rulings (:142 Harvard undated tables and :240 pool-basis). Nothing in TASKS.md's debt list (:253), MANUAL.html's known-debts table (:762-780), STRUCTURE.md's structural notes (:168-186) or data/README.md acknowledges this as accepted debt, so it is not a documented deliberate exception.

Two parts of the original finding are overstated and should be dropped from it. (1) The claimed impact "without revisit criteria the >=95% endowment-in-pool constant is a permanent unchallengeable rule" is false: data/README.md:148-156 records the revisit condition as a binding rule — "Stanford's allocation/return gap is re-openable without relitigation if primary evidence establishes >=95% of the endowment's investments held through the Merged Pool ... or if an endowment-specific percentage table surfaces. The named place to look: Stanford's responses to the 2008 Senate Finance and 2016 congressional endowment inquiries" — and TASKS.md:240 cross-references it twice ("upgrade path in README"; "moderate (exact 95 constant — lives in the README where a future instance can test it)"). So the substance exists; what is missing is the labeled field in the log. (2) The Constitution's Step 5 extra care for data-integrity questions (CONSTITUTION.md:124-128) IS satisfied by the entry: "leave the gap" was among the options (never / GAP STANDS, with Stanford's gap standing) and the user-visible caveat location is named (B4 "universe disclosed at every layer incl. […]

**Also reported at this site**

- _cross-dimension_ (high) — Pool-basis ruling: 2 of its 6 binding obligations undischarged; the full ruling lives only in a temp scratchpad

  CHAIN 3 END TO END. The only ruling made under the adopted two-phase protocol issued a numbered, self-described **binding** checklist of six integration obligations and five revisit triggers. I found and read the ruling artifact itself — it is NOT in the repo, it is at `/private/tmp/claude-501/-Users-amayb-Projects-dashboardProject/966d54ff-a3d5-4b0c-92ab-7e64dc5ee9c6/scratchpad/ruling-pool-basis.md` (17,582 bytes, mtime 2026-07-30 23:17), a session-scoped temp directory that will be garbage-collected. […]


**Evidence as filed**

```text
CONSTITUTION.md:134-141: 'Every proxied decision goes in the TASKS.md build log ... Record: - the question; - the options considered; - the child's recommendation and the parent's recommendation, and which tier answered; - the Article check result; - what was implemented; - what would justify revisiting it.' brief.md:135-139: '- Article check: <both tiers, results> ... - What would justify revisiting: ... - telemetry: tokens~<n>k . wall-clock~<n>m'. TASKS.md:240 ends: 'Telemetry: outcome `modified`; ~89k tokens Phase 1 + Phase 2; confidence high (option), moderate (exact 95 constant ...)' -- no article-by-article check anywhere in the entry (only an incidental 'mandatory under K1'), no revisit criteria, no wall-clock. Verified by grep: 'justify revisiting' appears at TASKS.md:161,187,209 only; 'Article check.' appears at :147,158,183,206 only -- both absent from the :240 block. MANUAL.html:585: 'Each ruling must carry the question, the options, both tiers' recommendations, the article check, what was implemented, and what would justify revisiting it. If one is missing any of those, the protocol failed even if the decision was right.'
```

**Independent reproduction by the refuting auditor**

```text
1) CONSTITUTION.md:134-141 — "Every proxied decision goes in the `TASKS.md` build log ... Record: - the question; - the options considered; - the child's recommendation and the parent's recommendation, and which tier answered; - the Article check result; - what was implemented; - what would justify revisiting it."
2) .claude/skills/escalate/references/brief.md:134-139 — "- Article check: <both tiers, results> / - Implemented: … / - What would justify revisiting: … / - telemetry: tokens≈<n>k · wall-clock≈<n>m · outcome: ratified | modified | overturned …"
3) .claude/skills/escalate/SKILL.md:99-102 — "## Logging — not optional (K5) / Every ruling → `[PROXY DECISION]` entry per the format in `references/brief.md`, including telemetry (tokens, wall-clock, outcome enum, phase-delta)."
4) kernel.md:39-41 — "K5 — The log is memory. Every proxied decision is logged where the project keeps memory."
5) `awk 'NR==240' TASKS.md | grep -o -i "article[s]*" | sort | uniq -c` → NO OUTPUT (zero occurrences of "Article" in the entry). The only rule citation in the entry: "Phase 2's observation that no second session had ever loaded the source made the gate mandatory under K1".
6) `grep -n "justify revisiting|Article check|revisit" TASKS.md` → "Article check." only at :147, :158, :183, :206; "What would justify revisiting:" only at :161, :187, :209. Neither at :240. […]
```

**Why it matters** — The framework's core promise -- that proxied decisions stay auditable and reversible -- is unenforced on the first ruling made under the new protocol. Without a recorded article check the human cannot see which rules were tested against a ruling that now governs which MIT years are published; without revisit criteria the >=95% endowment-in-pool constant is a permanent unchallengeable rule. Two of the five rulings (this one and TASKS.md:142) lack revisit criteria.

**Fix**

Add to the TASKS.md:240 entry an explicit article-by-article check for both phases, a 'What would justify revisiting' line (the obvious candidate: per-year endowment-in-pool evidence surfacing for MIT, or Stanford's congressional responses passing B2), and the wall-clock figure; or, if wall-clock was never metered, write 'wall-clock: not metered' per K1 rather than dropping the field.

**Verify**

```bash
grep -n "Ruling file" TASKS.md   # must point into conduct/rulings/, not a session scratchpad
test -f conduct/rulings/pool-basis.md && echo "ruling preserved"
```

---

### A-02 · Live display obligations for 66 curated rows exist only in data/README.md prose; no task spec or Check carries them

| | |
|---|---|
| **Severity** | medium |
| **Location** | `TASKS.md:41` |
| **Found by** | 1 independent auditor — `cross-dimension` |
| **Status** | **Synthesis pass** — filed by the completeness / cross-dimension auditors, which run last and are not themselves refuted |

**Current text at `HEAD` = `00a08ec`**

```text
40: - [ ] 3.1 School picker + school page: story blurb, headline stats (latest market value, 10/25-yr annualized return). Write the 5 blurbs (plain English, sourced facts only). *Check: all 5 school pages render from DB data.*
41: - [ ] 3.2 Allocation-over-time chart (stacked area) per school, spanning **that school's disclosed allocation coverage** (Yale: FY2000–FY2020 — see the coverage rule in `data/README.md`). Read the dataviz skill first. **Required by the task-1.3 proxy decision:** annotate the coverage end *on the chart itself* (e.g. a boundary marker at the last disclosed year labelled "Yale las …
42: - [ ] 3.3 Annual returns chart (bar, with S&P 500 overlay toggle). *Check: values match DB; tooltip shows year + values.*
```

**What is wrong**

CHAIN 2 END TO END, and the answer to the SSOT question. The project's own enforcement pattern for a ruling's display obligation is to write it into the task line **and** its `*Check:*` gate — TASKS.md:41 does exactly that for the task-1.3 coverage-end annotation ('**Required by the task-1.3 proxy decision:** annotate the coverage end *on the chart itself*... *Check: ...coverage-end annotation present*'). That pattern was applied to 1 of the 4 rulings. Two rulings emitted display obligations that are live right now — 42 Harvard + 6 MIT target-basis rows and 18 MIT pool-basis rows, 66 rows counted directly from data/schools/*.json — and neither obligation appears in any task line or Check. They exist only as prose in data/README.md. The MIT one is obligation 5 of the pool-basis ruling, which the ruling itself lists under '**Obligations that must land at integration (checklist, binding)**'. TASKS.md:253's debts list records only the *two* obligations that are mis-pointed (Stanford's Aug-31 offset, Harvard's mixed market-value basis); it does not record that three live obligations correctly pointed at 3.2/4.2/4.3/6.1 never reached those task specs. (I checked and am *excluding* the negative-weights obligations: TASKS.md:206 declares them contingent on a negative being stored, and I counted 0 negative `pct` rows, so that chain is correctly dormant, not broken.)

**Evidence as filed**

```text
TASKS.md:41 (task 3.2, complete text of its gate): "*Check: chart matches seeded data; coverage-end annotation present; legible on phone.*" — no basis-break, no target-basis, no pool-basis clause.
TASKS.md:56 (task 6.1 gate): "*Check: every source_id in DB appears on the page; coverage story present for every school whose allocations end before FY2025.*"
TASKS.md:47 (task 4.2): "The year picker offers only years with disclosed allocations (Yale: FY2000-FY2020), with one plain sentence in place of the missing years." — no '(target mix)' marker.
data/README.md:485: "Target years get visually distinct treatment plus a boundary annotation on the chart, a \"(target mix)\" marker in the Translator year picker, the basis in any copycat vintage label, and the full explanation on the Methodology page..." — `grep -rn "target mix"` over the entire repo returns exactly one hit: this line.
data/README.md:254-256: "**Display obligation (tasks 3.2/6.1):** the FY2001-FY2004 points are pool-basis while FY2008/FY2013-FY2015 are from endowment-titled congressional tables - annotate the basis break on the chart itself, and define \"investment pool\" in plain English at first use."
Ruling file §3 obligation 5: "Display obligations carried to tasks 3.2/6.1: visible pool-basis caveat at point of display; basis-break annotation on the MIT allocation chart; plain-English definitions of 'investment pool' / 'unitized' / 'measurement universe' at first use (Article 3); dataviz skill before the annotatio […]
```

**Why it matters** — A session that picks up task 3.2, builds the Yale coverage-end annotation, and satisfies the printed Check will have shipped a chart that renders Harvard's 42 target rows and MIT's 18 pool-basis rows with no basis-break annotation — and the task will report as passing. That is precisely the failure CONSTITUTION.md:21 Article 4 names ('Never present data from two different measurement bases as one continuous series without a visible caveat at the point of display'). It also directly answers the source-of-truth question: TASKS.md is genuinely the SSOT for state and decisions (all its counts reconcile against the files — see cleanBill), but data/README.md has become the de facto sole home of forward-binding display requirements. […]

**Fix**

Amend TASKS.md:41 (3.2), :47 (4.2), :48 (4.3) and :56 (6.1) to carry the Harvard target-basis and MIT pool-basis obligations with testable Check clauses, exactly as the task-1.3 coverage-end obligation is carried at :41 — e.g. append to 3.2's Check: 'basis-break annotation present where target-basis or pool-basis years abut actual endowment-basis years'. Alternatively add one 'Display obligations ledger' block to TASKS.md that every Phase 3-6 task line points at, and record the current shortfall in the TASKS.md:253 debts list.

**Verify**

```bash
grep -n "Check:" TASKS.md | sed -n "1,12p"   # display obligations must appear in a Check clause
```

---
