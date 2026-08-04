# Proposed amendments — for signature

**Status: PROPOSED. Nothing here is in effect.** `kernel.md:63-65` — *"A model may
propose an amendment in the log; only the human adopts it."* Verified: `git diff
--stat HEAD -- CONSTITUTION.md .claude/skills/` is empty.

**Revision 2, 4 August 2026.** Revision 1 was checked by five hostile verifiers;
**two instruments came back unsafe to sign and are redesigned here, not reworded.**
Every change is recorded at the end of its section under *What revision 1 got wrong*.

**Baseline: `4d36283`.** Two further commits landed during verification — tasks
2.1–3.3 and then the full Phases 2–6 app build. **No amendment target was touched
by either** (`git diff --name-only d8ff033..HEAD -- CONSTITUTION.md CLAUDE.md
.claude/skills/ data/README.md` → empty), and all six quoted lines were re-verified
exact at this HEAD.

**How to sign.** Reply with option letters, e.g. *"adopt 1A, 2A, 3A, 4B, 5A"*.
Anything unnamed stays unadopted — the correct default for a reserved matter, since
nothing defaults past one.

| # | Finding | Recommendation | Reserved edits | Blocks |
|---|---|---|---|---|
| 1 | `A-10` | **1A** | `CONSTITUTION.md:17` | A-10 |
| 2 | `A-08` | **2A** | `brief.md` + `escalate/SKILL.md` (2 edits, kept in sync) | A-08 |
| 3 | `B-10` | **3A** | `kernel.md` ×2 + `CONSTITUTION.md` (3 edits) | B-10, `A-20` limb 3 |
| 4 | `A-06` | **4B** | `escalate/SKILL.md` (1 insert) | A-06's reserved half |
| 5 | `A-12` | **5A** | `kernel.md` (1 insert) — **or 5D, which is delegable** | A-12 |

---

## 1 · Article 2 names a citation field the validator rejects (`A-10`)

**Reserved by:** kernel Part 2 §5 / `CONSTITUTION.md:45` §5.

### Current text — `CONSTITUTION.md:17`, verbatim at `4d36283`

```
**Article 2 — No number without a citation.** Every figure in `data/` carries a `sourceId` resolving to `sources.json`. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from.
```

### Why it is false — each claim traced to an enforcing line

| Claim | Enforced at |
|---|---|
| allocation `sourceId` required | `seed-validate.ts:738` `requiredString` |
| benchmark `sourceId` required | `:993` |
| return-row pairing, all four directions | `:897-901`, `:904-909`, `:911-916`, `:918-923` |
| the two return fields exist | `:191-197`, typed `:138-140` |
| every id resolves into `sources.json` | `:1080-1105` |
| `schools.json` carries **no** citation field | `SCHOOL_KEYS:171` + `checkKnownKeys:294` |
| `proxy_mappings.sourceId` **optional** | `:1061` `optionalString` |

**227 of 723 curated figures (31.4%)** are cited per-figure — 102 `returnPct` +
125 `marketValueUsdMillions`. A curator following Article 2 literally on a return
row gets `3 validation error(s) — nothing was written`.

### 1A — replacement (RECOMMENDED)

Replace `CONSTITUTION.md:17` in full with:

```
**Article 2 — No number without a citation.** Every figure in `data/` carries its own citation resolving to `sources.json`: one `sourceId` per allocation row and per benchmark-return row; on an endowment-return row, `returnSourceId` and `marketValueSourceId` — one per figure, because a single shared id forces one figure to cite a document that does not contain it. The rule runs both ways: a figure without its citation is an error, and a citation without its figure is an error. Rows that carry no curated numeric field need no figure-citation (`schools.json`; a `proxy_mappings.json` row may cite a source and should where one exists, but the ticker choice is this project's own editorial judgment, explained on the Methodology page rather than cited). The seed validator enforces the field shape and that every id resolves; that a cited document actually **contains** the figure is not mechanically checkable and remains the curator's obligation — a green `seed:dry` is not an Article 2 clearance. Amending this Article to match a future change in citation shape is itself a Part 2 §5 act, not a code change. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from, a figure whose citation does not contain it, or a citation with no figure attached.
```

### 1B — minimal, identifier-free

```
**Article 2 — No number without a citation.** Every figure in `data/` carries its own citation resolving to `sources.json`, one citation field per figure; the seed validator holds the current field shape and checks that ids resolve, not that a document contains the figure it is cited for. *Broken by:* a plausible number from memory, a number from an uncited secondary blog, a figure "derived" without recording what it was derived from.
```

### 1C — decline; record accepted debt.

**Kill condition:** 1B beats 1A if you hold that an Article must never name
implementation identifiers, because every identifier in a constitution is a
scheduled staleness bug and `A-10` is the proof. I cannot refute that.

**Delegable residue — larger than revision 1 said, and one item is a live hazard.**

- **`data/README.md:5` asserts a requirement that does not exist**: *"`sourceId`
  on allocations, benchmark returns **and proxy mappings**"*. `seed-validate.ts:1061`
  makes it optional and **2 of 7 live rows don't satisfy it** (`absolute_return`,
  `private_equity_vc` — the decided gaps). This is the same false-requirement defect
  I caught in my own first draft, live in the file curators read for data rules.
  **Scope the fix as "remove a false requirement", not "tighten wording"** — a
  curator adding an 8th proxy category under a false must-cite rule has an incentive
  to stretch a citation, which is an Article 5 / K3 risk.
- **`spec-schema/` restates the pre-split shape in six places**, all missed by
  revision 1: `spec.json:269` (`source_id: fk not null` on `endowment_returns`),
  `spec.json:317`, `spec.json:359`, `spec.md:48`, `spec.md:54`, `spec.md:71`. This is
  `A-10` in a machine-readable spec.
- `CLAUDE.md:32`'s one-field shorthand.
- Not conflicting, checked: `PRD.md:44`, `TASKS.md:98`, `BRD.md:90`,
  `src/app/methodology/page.tsx:39` state the rule without naming a field shape.

> **What revision 1 got wrong.** *"The seed validator is the enforcement point"*
> over-claimed — it cannot check that a cited document contains the figure, and a
> future article check could have read it as "green `seed:dry` ⇒ Article 2 clears",
> licensing the exact mis-citation the amendment forbids. Also *"rows that carry no
> figure"* imported an undefined "figure" at row granularity and would have
> classified proxy prose numbers as not-figures; now "no curated numeric field".

---

## 2 · The missing top-tier tie-break (`A-08`)

**Reserved by:** kernel Part 2 §5 + `ADOPTION.md:15-18`.

### Current text — two places, and both must change

`.claude/skills/escalate/references/brief.md:87-92`:

```
| Result | Action |
|---|---|
| Clears all articles | It is the human's answer. Execute, log, continue. |
| Breaks an article | Do NOT implement. Escalate to the next tier with both positions and the specific objection. At the top tier → human. |
| Both constitutional, tiers disagree | The senior's ruling governs. Record the dissent — a losing argument that turns out right is worth having on the record. |
| Senior errors / times out / tier unavailable | Next tier up; if none, human. |
```

`.claude/skills/escalate/SKILL.md:75-78` — **the same table restated inline**:

```
Outcomes table in `references/brief.md`: clears → execute and log; breaks an
article → refuse and escalate again with both positions; constitutional
disagreement → senior governs, dissent logged; senior fails → next tier or
human.
```

### The gap

Row 3 says *"the senior's ruling governs"* — stated in tier terms, drawing its
force from the tier hop. At the top tier there is no senior; the protocol
substitutes a fresh-context **same-tier refuter**, so nothing orders the two
instances. Verified: `grep -ci refuter CONSTITUTION.md` = **0**.

### 2A — the human interrupt (RECOMMENDED). Two edits.

**Edit 1** — `brief.md`, insert as a new row between the current lines 91 and 92:

```
| Both constitutional, **top tier and its same-tier refuter** disagree | No tier hop exists to order them, so neither governs. Put it to the human as an ELI25-SE block with both positions at equal weight; the mandatory `RECOMMEND` line names the deadlock itself, not a side (e.g. *"RECOMMEND — you decide: two independent reads at the same tier reached opposite constitutional answers and I hold neither"*). Log `[HITL]`. |
```

**Edit 2** — `escalate/SKILL.md`, replace lines 75-78 in full with:

```
Outcomes table in `references/brief.md`: clears → execute and log; breaks an
article → refuse and escalate again with both positions; constitutional
disagreement → senior governs, dissent logged; top tier deadlocked with its
own refuter → human, both positions at equal weight; senior fails → next tier
or human.
```

### 2B — the requester governs, with a mandatory dissent

Same two locations; row 3-bis becomes:

```
| Both constitutional, **top tier and its same-tier refuter** disagree | The requester's position governs and execution proceeds. Log the refuter's position verbatim as `[DISSENT]` in the same entry. |
```

**Why 2A:** the *Clears all articles* row says a clearing ruling **"is the human's
answer."** That fiction legitimises autonomous execution and rests on an
independent check having concluded. When the only check dissents, the fiction has
no support — 2B would have a model overrule its sole check and still call the
result yours.

**Kill condition:** 2B wins if top-tier throughput matters more than the fiction
holding, and a `[DISSENT]` log is enough to reverse after the fact.

> **What revision 1 got wrong.** It amended only `brief.md`, leaving
> `escalate/SKILL.md:75-78` — which restates the whole table inline, in the file a
> session actually reads — stating the old rule. And its *"neither labelled
> recommended"* directly contradicted `brief.md:112`, which makes `RECOMMEND <X>`
> mandatory; one line of `brief.md` would have forbidden what another required. The
> fix keeps the `RECOMMEND` line and points it at the deadlock rather than a side.
> **2B's "count as unresolved against the ratification rate" is also dropped** —
> that metric has no such state, and revision 1 invented one.

---

## 3 · Plain `git push` is in neither reserved list (`B-10`)

**Reserved by:** kernel Part 2 §5; subject matter is Part 2 §2.

### The crux

**"Stricter rule wins" makes the prohibition binding. It cannot make the push
*reserved*.** `kernel.md:124` is a *conflict* tiebreak and nothing conflicts: both
reserved lists are **silent**, and silence is not a competing permission. The
operator docs' rule sits at precedence tier 5, below the reserved list. So a plain
push to `main` — which auto-deploys — is today prohibited by convention and
reserved by nothing. **This reverses my earlier "leave it standing"**: I had
conflated prohibited with reserved.

### 3A — adopt (RECOMMENDED). Three edits.

**Edit 1** — `kernel.md:55-58`, insert after `history rewrites,`. **Domain-free
wording, no project gloss:**

```
any push to a branch that publishes or deploys,
```

**Edit 2** — `CONSTITUTION.md:42`, insert after `history rewrites,`. **The
project-specific statement belongs here:**

```
any push to `main` (it auto-deploys to production via Vercel),
```

**Edit 3** — `kernel.md:4-7`, replace the stamp block:

```
kernel-version: 1.1.0
status: ADOPTED
signed-by: Amay Bhatnagar (explicit in-session approval)
signed-date: 2026-08-04
```

and append to `conduct/ADOPTION.md` a signature record naming this amendment, in
the shape ADOPTION.md already uses for the four staged edits.

### 3B — decline, leave the convention standing.

Do **not** take `B-10`'s other option (state in `MANUAL.html` that no rule covers a
push) — that tells every future session nothing bars an auto-deploying push, which
is worse than silence.

**Consequence for `A-20`:** its limb 3 rewrites `STATUS.html`'s lede to name *"a
push that deploys"* as reserved. Under **3A** that becomes true and limb 3
proceeds. Under **3B** limb 3 is dropped and the lede records only that the
signature is done.

**Article check:** adds to Part 2 §2 in both files; loosens nothing. Recursion
noted honestly: adopting this makes explicit a restriction I have been observing
anyway — I have not pushed and will not.

> **What revision 1 got wrong.** Three things, all real. It put
> `(for this project, any push to main)` **into the kernel**, which `kernel.md:12-14`
> declares deliberately domain-free and which Phase F promotes **unchanged** to
> every machine — the gloss would have followed it to unrelated projects. It bumped
> **no version stamp**, so `kernel.md` would have read `1.0.0 / 2026-07-30` while
> carrying text signed 2026-08-04, defeating the stamp's stated drift-detection
> purpose. And its *"unconditional is the stricter reading"* was **backwards** — the
> conditional form is strictly broader. Revision 2 resolves all three at once by
> giving the kernel the broad domain-free rule and `CONSTITUTION.md` the concrete
> project one, so there is no longer a choice for you to make here.

---

## 4 · The Phase-2 reveal fallback (`A-06`) — REDESIGNED

**Reserved by:** kernel Part 2 §5 via `ADOPTION.md:15-18`. **Only the fallback is
reserved**; naming the tool is descriptive and proceeds under 1.8.S regardless.

### Current text — `.claude/skills/escalate/SKILL.md:56-61`, verbatim

```
When the senior returns its preliminary ruling, send the **Phase-2 reveal**
(SendMessage to the same agent): your recommendation and full reasoning,
explicitly labelled as not-a-conclusion. The senior attacks your
couldn't-verify list first — facts are certified by documents, never by
agreement between models — then reconciles and issues the final ruling,
stating whether the reveal changed its mind.
```

### 4A — adopt `A-06`'s own fallback

Re-spawn with the Phase-1 transcript attached; log phase-delta as unmeasurable.

### 4B — bounded retry, then the human (RECOMMENDED)

Insert after line 61 as its own paragraph (lines 56-61 and 63 untouched):

```
**If the reveal cannot be delivered.** Record the ruling agent's raw id at spawn so
the reveal can address it directly; a name resumes a completed agent from its
transcript, so the ordinary case — Phase 1 finished and the agent exited — is not a
failure. If delivery still fails, retry twice. If it fails three times, **stop and
put the question to the human**, attaching the Phase-1 preliminary and your withheld
recommendation, both labelled as not-a-conclusion. Log it with `outcome: sent-to-HITL`
and record that phase-delta was not observed. Do not re-run the protocol on the same
question, and never deliver Phase-1 material and the reveal into one context: you
have already read the preliminary, so any brief you write afterwards is no longer
blind, and a second run would launder that contamination rather than remove it.
```

**Why 4B:** reveal-delivery failure is rare and largely preventable (the real mode
is name collision, mitigated by recording the id). A rare failure does not justify
standing authorization to unblind. Escalating to you preserves both the blinding
and the telemetry, and terminates.

**Kill condition:** 4A wins if reveal failure turns out **common** rather than
rare — then 4B taxes you with an interrupt on ordinary rulings. Watch the first
three; if any needs a retry, revisit.

**Article check:** 4B strengthens K1 and K5 and preserves the signed blinding.
Terminates at the human, matching every other failure class in `brief.md:92`.

> **What revision 1 got wrong — five things, and it was correctly refused.**
> Its void-and-restart loop was **unbounded**: run 2's reveal fails → void → run 3,
> forever, the only rule in the corpus with no terminal escape. It named a **"fresh
> senior"** nine lines above `SKILL.md:65`'s *"If you are the top tier (Fable): there
> is no senior"* — and the repo's one executed ruling is exactly that case. It
> mandated logging a **"void"**, which `brief.md:138`'s enum
> (`ratified | modified | overturned | premise-refuted | sent-to-HITL`) cannot
> express; 4B uses `sent-to-HITL`, which exists. It left the effect on the
> ratification-rate metric unstated. And its re-run **was not blind** — the junior
> has necessarily read the voided preliminary, which defeats the rationale the
> instrument was built on. The storm brake is **not** the missing escape: it fires
> on a *third escalation*, and `SKILL.md:14`'s "one hop per question" means a re-run
> of the same question may never advance the counter.

---

## 5 · Where the gates-are-not-escalatable rule lives (`A-12`) — REDESIGNED

**Reserved by:** kernel Part 2 §5 for 5A; **5D is delegable.**

### What `A-12` is actually about — revision 1 missed this

The finding is filed at **`conduct/QUICKCARD.md:70`**, and that line is not a
statement of the rule at all. Verbatim:

```
| A session's instructions look thin | Its auto-loaded context can be a cached pre-adoption copy with no governance in it. Open every session with: *read `CONSTITUTION.md` and `.claude/skills/escalate/references/kernel.md` first*. |
```

**It directs every session to two files, and neither contains the gates rule.**
That is the defect — not an absence of the rule generally. The rule *is* stated in
five places: `CLAUDE.md:20` (normative, complete, and the session entry point),
`conduct/SKILL.md:38`, `MANUAL.html:250`, `TASKS.md:132`, `CONDUCT-DESIGN.html:510`.

### 5A — put the rule in one of the two files that row points at (RECOMMENDED)

Insert into `kernel.md` Part 4, after the *"Everything below the floor"* line:

```
> A project gate — a checkpoint, a review point — is **not a question** and never
> enters this floor. A gate stops the line for the human; the chain does not route
> around one, and no floor score makes a gate escalatable.
```

### 5B — the same rule in `escalate/SKILL.md` Step 0 as a third gate

```
3. **Gate?** If a project checkpoint or review gate stands between you and the
   work, stop there. A gate is not a question — it never enters the chain and is
   never escalatable, regardless of how the floor scores.
```

### 5D — delegable, no amendment: fix the pointer instead

Replace `conduct/QUICKCARD.md:70`'s instruction so it names a file that has the rule:

```
| A session's instructions look thin | Its auto-loaded context can be a cached pre-adoption copy with no governance in it. Open every session with: *read `CLAUDE.md`, `CONSTITUTION.md` and `.claude/skills/escalate/references/kernel.md` first* — `CLAUDE.md` is where the reading order and the gates rule live. |
```

**Why 5A over 5D:** 5D fixes the pointer, which is the literal defect, and needs no
signature. But `kernel.md:17-19` promotes the kernel **unchanged to user scope on
every machine** at Phase F, and `CLAUDE.md` does not travel with it — so on any
other project the kernel-only reader still cannot learn the rule. **If you intend
Phase F, 5A is the durable fix and 5D alone is not.** Adopting **both** is coherent
and cheap.

**Kill condition:** 5D alone suffices if you do not intend to promote the kernel, or
if you accept that each project states the rule in its own entry point.

**Structural note on 5A vs 5B:** a gate is arguably a different kind of object from
a floor test, which argues for 5B's Step-0 placement. I recommend 5A anyway because
kernel Part 4 is where a *reader* looks for "when do I escalate", and the gates rule
is an answer to exactly that question. If you find that unpersuasive, 5B is the same
rule in the better-typed place.

> **What revision 1 got wrong — six things, and it was correctly refused.**
> It said *"Two edits"* and listed **one**. Its `QUICKCARD.md` edit landed at some
> other line and **left `:70` — the filed location — untouched**, so it did not fix
> the finding. It argued `QUICKCARD.md` reaches sessions, but `QUICKCARD.md:1` is the
> *operator* card, read by you; revision 2 works precisely because `:70` is the line
> that instructs sessions, via you. It proposed **demoting the ask to a "courtesy
> ask"** — a defined term at `1.8-plan.md:615-616` meaning *has a default* — which
> `kernel.md:50-52` forbids for a reserved matter. That demotion also had **no
> option letter**, making it unsignable under this document's own rule. And its kill
> condition pointed at 5A while `1.8-plan.md:265-274` forbids any unit from opening
> `kernel.md` — so 5A can only be applied by you, which is now stated.

---

## What proceeds regardless of your answers

- **33 of the 37 A-orders**, every B-id, the WP4/WP5/WP6 chain and the integration
  lane. Only `A-06`, `A-08`, `A-10`, `A-12` block, each on its own ask.
- Every **delegable half**: the `[PROPOSED AMENDMENT]` ledger entry, `A-06`'s
  tool-naming half, `5D` if you take it, and the `data/README.md:5` /
  `CLAUDE.md:32` / `spec-schema` residue.
- Nothing here changes data, a chart, or a schema column. No figure moves.
