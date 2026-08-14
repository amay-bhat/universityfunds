# PERSONAS.md — who this site is for, and who it is not

**Adopted by the human 2026-08-13.** This document expands `PRD.md § Audience`; it does not
replace it. On any conflict, the PRD wins. These personas are informed hypotheses proposed
by a model session from general knowledge and adopted by the human — **no user research sits
behind them**. Treat them as design lenses, not facts about real visitors. Be precise about
what can revise them: the site collects nothing — no accounts, no analytics package in
`package.json`, and no cookie, `localStorage` or beacon write anywhere in `src/` — so "real
usage" will never arrive as data. These personas change when the human observes something
(a link someone shared, a question someone asked), or they do not change at all.

Two things this document is **not**:

- **Not a license to personalize.** Serving a persona means writing and structuring for them
  in the one public site everyone sees (Article 1, BRD-002). Nothing here justifies
  questionnaires, tailoring, accounts, or "content for you."
- **Not a scope change.** `PRD.md § Out of scope` stands untouched. A persona may *want*
  something out of scope; that is recorded here precisely so future sessions stop
  re-deriving it.

**Authority: informative.** `BRD.md` is binding for requirements and `spec-schema/spec.json`
is the approved spec; this doc carries no `BRD-xxx` id and introduces no requirement. Where a
line below reads like a "must," it is describing something the build already does or a habit
worth keeping — it does not bind until it lands in the BRD or the spec at a human-gated
revision.

Machine-readable note: `spec-schema/spec.json → product_overview.target_users` lists the DIY
investor and, since 2026-08-13, the literacy floor — the second added to resolve the SPEC-008
mismatch below, using BRD-004's own wording. The secondary and anti-personas stay **out** of
that field on purpose: none traces to a BRD requirement, and `target_users` is what licenses
`user_stories`, so listing them there would invite features the primary persona doesn't need.
This file is their only home. The spec stays at **approved v1.0.0** — no item added, no scope
change — with the edit recorded in its `change_log`.

---

## 1. Primary persona — the DIY investor (authoritative)

The one persona the product is *for*. From `PRD.md § Audience` and `spec.json`:

- **Who:** Everyday investor managing their own retirement/brokerage accounts. Curious,
  not professional.
- **Comes for:** Heard that Yale-style endowment investing beat the market; the details are
  buried in annual-report PDFs and jargon. Wants to see how the endowments actually
  invested, what a buy-it-yourself ETF version looks like, and whether it honestly beat
  simple index investing.
- **Needs:** Plain English, every finance term defined on first use, honest numbers, honest
  gaps.
- **Must never get:** Advice or personalization of any kind (Article 1).

Every feature ships for this person. When a secondary persona's need conflicts with the DIY
investor's, the DIY investor wins without discussion.

## 2. The literacy floor — the smart 22-year-old outside finance

Lives in one user story (SPEC-008, the glossary): *"As a smart 22-year-old outside finance,
I want unfamiliar terms explained where they appear, so that I never have to leave the page
to understand it."*

- **Role:** Not a separate audience — the **reading-level floor**. The DIY investor sets
  what the product does; this persona sets how every sentence must read. If the
  22-year-old can't follow a page, Article 3 is broken regardless of who else can.
- **Defect, and why it survived so long.** `engineering-spec.schema.json:256` states the rule
  in prose — "Personas must exist in `product_overview.target_users`" — but it states it
  inside a `description`, so **nothing validated it**. JSON Schema cannot express a
  cross-field constraint, so SPEC-008 naming a persona `target_users` did not list passed
  generation, owner approval, and a `READY` probe run without a murmur.
- **Resolved 2026-08-13 by promotion**, using BRD-004's own wording — the story was doing
  real work as written, so rewording it to "DIY investor" would have thrown away the
  stricter bar. The spec stays at approved v1.0.0 (no item added, no scope change) with the
  edit in its `change_log`. `PRB-026` in `spec-schema/readiness-probes.json` now checks the
  rule deterministically, which is what makes the *next* one catchable — the lesson here is
  that a rule living only in a description string is a convention, not a gate.

---

## Secondary personas (adopted 2026-08-13)

Real expected audiences, served **as a side effect** of building well for the primary
persona. They justify care in things the product already does (citations, stable URLs,
honest methodology); they never justify features the primary persona doesn't need. Format:
who / comes for / already served by / we will not.

### 3. The finance student / CFA candidate

- **Who:** Studying portfolio theory; knows "Yale Model" as a flashcard term, has never
  seen the actual allocations year by year.
- **Comes for:** Primary-source-grade study material — every number cited, normalized
  across schools, more legible than any textbook.
- **Already served by:** The methodology page — the coverage story school by school, the
  ETF proxy table with each mapping's rationale and honesty note, and every source in the
  dataset (`src/app/methodology/page.tsx:94`, `:181`, `:257`).
- **Not served yet, and worth saying so:** the normalized category mapping is *not* visible
  to them. It lives in `data/README.md`, which sits in a **private** repo (`TASKS.md:80`),
  and each school's original label is curated into `allocations.source_label`
  (`src/lib/db/schema.ts:47`) but rendered by no component. BRD-028 preserves that label
  "so the mapping stays auditable" — it is auditable in the data and not on the site.
  Surfacing it is a candidate for a future methodology pass, not a new feature for them.
- **We will not:** Add jargon-dense "pro mode," CSV export, or API access for them. They
  can read the page like everyone else; the glossary won't hurt them.

### 4. The finance content creator / personal-finance blogger

- **Who:** Writes the "Can you copy Yale's portfolio?" article or video that gets made
  every year around endowment-report season (Oct–Nov, after the June 30 fiscal years
  close).
- **Comes for:** The Compare page as a screenshot, and a citable methodology to link.
- **Why they matter most:** The only persona who *distributes* — they send everyone else
  here. Serving them is how the primary persona finds the site.
- **Already served by:** Compare/translate state living in the URL (a shared link
  reproduces the exact view — keep it that way), charts designed to read at a glance,
  quotable methodology.
- **We will not:** Add embed widgets, watermarks, or "share" chrome. A clean URL and an
  honest chart are the whole offer.

### 5. The Bogleheads skeptic

- **Who:** Index-fund true believer arriving with a conclusion: fancy endowment investing
  doesn't beat a 60/40 over most periods. Wants honest numbers as ammunition.
- **Comes for:** The Compare page at period-picker extremes, the "No taxes or fees are
  modeled anywhere" footnote under the growth chart, the unflattering years shown at full
  size.
- **Known limit to be honest about:** the extremes are narrower than the data. The picker's
  earliest year is each school's first *allocation* year, not its first *return* year
  (`src/app/compare/page.tsx:90`), so Harvard and Princeton cannot be compared before FY2005
  and MIT before FY2001 — even though endowment returns and all three benchmarks exist from
  FY2000. SPEC-016's own business rule says bounds come from the per-series intersection
  "with exclusions labelled"; here the copycat's coverage silently bounds the
  actual-vs-benchmark comparison too. A motivated skeptic will find this.
- **Why they matter:** They keep Article 4 load-bearing. A site that survives a motivated
  skeptic's reading is a site the curious admirer can trust too. If this persona ever
  catches the site cherry-picking, the whole educational claim collapses.
- **Already served by:** Articles 4 and 5 — honest numbers, honest gaps, no silent
  splicing.
- **We will not:** Editorialize toward their conclusion either. The site doesn't argue
  endowments won *or* lost; it shows the series and lets the period picker do the talking.

### 6. The financial advisor / planner

- **Who:** A professional — but not here for themselves. When a client asks "why aren't we
  invested like Harvard?", they want a neutral third-party page to walk the client through.
- **Comes for:** An explainer with no advice, no affiliation and no monetization — the kind
  of neutral page that is easy to put in front of a client.
- **Why they matter:** They lean harder than anyone on Article 1 discipline and on the
  absence of recommendations. That discipline is what makes the page usable in their world.
- **What this doc must not claim:** that the site is *compliance-safe*. Whether it is — and
  how the not-advice framing is worded at the site level — is reserved to the human
  (`CONSTITUTION.md` Part 2 §4), and the project's own Tier-1 legal review still has the
  question open: F2 (the only site-wide disclaimer is a 12px footer strip a reader can miss
  entirely while reading a growth-of-$10,000 chart) and F4 (no terms, no liability limit, no
  warranty disclaimer; `/terms`, `/privacy` and `/disclaimer` all 404) are **un-exercised**
  reserved decisions, not settled ones —
  `conduct/audits/tier1-legal-review.md:112`, `:318`.
- **We will not:** Court them — no "for advisors" section, no white-labeling, no CE
  credit framing. Their use case works *because* the site ignores them.

### 7. The university-affiliated curious — alum, student, employee

- **Who:** Cares about *their* school specifically ("how did MIT actually do?"), usually
  arriving via a news story about the endowment.
- **Comes for:** One school page, read deeply — the story blurb, the long allocation
  history, maybe a comparison against a rival.
- **Already served by:** Per-school story blurbs (SPEC-009), per-school URLs, and a coverage
  story for **all five** schools written where the gap shows — `src/app/methodology/page.tsx:94`,
  plus each school's blurb and the on-chart coverage-end label. Yale's mix ends at FY2020;
  Harvard is targets-then-actuals; Stanford is market-value-only; MIT is seven scattered
  years; Princeton never published FY2000 or FY2003 returns.
- **Do not repeat the "MIT abandoned targets" shorthand.** The site does not say that
  anywhere, and one of MIT's seven curated years (FY2008) *is* a published target. The real
  reason — MITIMCo dropped asset-class targets for a manager-centric framework in 2011 and
  has printed no allocation table since — lives only in `data/README.md:174`, which no
  visitor can reach. It is a curation fact, not a served explanation.
- **We will not:** Add school-vs-school ranking framing or "which endowment is best"
  editorial. Rivalry brings them; Article 4 keeps what they find honest.

### 8. The econ/finance teacher

- **Who:** High-school or intro-college instructor building a lesson.
- **Comes for:** The rare combination that makes a site classroom-safe: free, no login, no
  ads, no data collection, plain English, honest about uncertainty. Would assign the
  Translator ("rebuild Princeton 2010 with ETFs, then explain what didn't translate").
- **Already served by:** The first-use glossary (SPEC-008 doing double duty), the
  no-account/no-analytics posture (verifiable: no analytics dependency in `package.json`,
  and no cookie, `localStorage` or beacon write anywhere in `src/`), and the visible
  proxy-mapping gaps — the *gaps are the lesson*. The Princeton example works as written:
  its mix is curated FY2005–FY2018 and FY2020–FY2023, so FY2010 renders.
- **One caveat on "no data collection":** it is true of the application and undocumented to
  the visitor — there is no privacy policy and no `/privacy` route (Tier-1 F4,
  `conduct/audits/tier1-legal-review.md:318`). A teacher vetting the site for a classroom
  has to take it on trust. Whether to publish one is Part 2 §4, not a build decision.
- **We will not:** Build worksheets, teacher dashboards, or classroom modes. The site is
  the material; the lesson plan is the teacher's job.

**Considered and not adopted (2026-08-13):** the journalist/researcher-on-deadline persona.
They will still be served incidentally by the methodology page and citations; the human
chose not to design for them. Do not re-propose without new evidence.

---

## Anti-personas (adopted 2026-08-13)

People the site will attract and must deliberately not serve. Named so future copy and
feature decisions get tested against them instead of drifting toward them.

### A. The active trader looking for an edge

Annual-rebalance history is not a trading signal, and the site must never imply otherwise.
**Refuse by:** never adding timeliness framing ("latest moves"), momentum language, or
anything that reads as current positioning. The data is deliberately historical and
fiscal-year-grained; that is a feature.

### B. The "just tell me what to buy" visitor

**The most dangerous reader the site has.** They will read the Translator page as a
recommendation no matter how it is worded — BRD-002 and Article 1 exist because of this
person. **Refuse by:** running every new sentence of Translator and Compare copy through
their eyes before shipping — if it can be *read* as "so I should buy this," rewrite it.
**One boundary on that instruction:** the disclaimer and the not-advice framing are worded
at the site level and reserved to the human (`CONSTITUTION.md` Part 2 §4). A session rewrites
descriptive copy freely and **escalates rather than edits** that framing. The disclaimer and
fine print are aimed at this reader; they are load-bearing, not boilerplate.

### C. The institutional / professional allocator

They have Cambridge Associates, NACUBO, and Bloomberg; this dataset is too coarse for them
by design. **Refuse by:** never chasing pro-grade granularity (quarterly data, factor
decompositions, benchmark customization) — pursuing it would distort the plain-English
voice that serves everyone else, for an audience that will never rely on this site anyway.

---

## The pattern worth keeping in mind

Personas 3–6 and 8 are **secondhand audiences** — they use the site to teach, persuade, or
inform *someone else*. The design consequence is **shareability**: a specific view should be
reproducible from its URL, charts should survive being screenshotted out of context, and the
methodology should stay quotable. What is actually true today, stated precisely so no future
session re-derives it or overstates it:

- **Compare and Translate keep their whole view in `searchParams`** — school/from/to and
  school/year — and clamp invalid deep links with a visible notice
  (`src/app/compare/page.tsx:69`, `src/app/translate/page.tsx:78`). Keep it that way. But it
  is an implementation habit, not a requirement: no `BRD-xxx` line and no SPEC-014/016
  acceptance criterion asks for it, so nothing fails if a future session drops it.
- **Not every view is in the URL.** The returns chart's S&P 500 overlay is local React state
  (`src/components/charts/ReturnsChart.tsx:32`), so a shared Explore link does not reproduce
  it.
- **Only the allocation chart carries an on-chart annotation** — the coverage-end label
  (`src/components/charts/AllocationChart.tsx:43`). **No chart carries the disclaimer.** It
  lives once, in the footer, so a screenshot travels without it. Changing that is Part 2 §4
  and belongs to the human — the project's own legal review already has it open as F2
  (`conduct/audits/tier1-legal-review.md:112`).
- **A shared link renders as a bare text card.** `src/app/layout.tsx:43` declares
  `twitter: { card: "summary_large_image" }` while `openGraph.images` is unset and no
  `opengraph-image` file exists anywhere. For the one persona who *distributes*, this is the
  largest live gap in the doc's own theory of growth.

And shareability is **not** the only distribution. The site is deliberately built to be
found: `robots.ts` allows everything, `sitemap.ts` lists 11 URLs, every route carries a
canonical, and the layout emits schema.org `Dataset` JSON-LD — a whole workstream
(`TASKS.md:405`). Search is the second channel, and it is the one this project has actually
invested in.
