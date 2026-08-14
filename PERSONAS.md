# PERSONAS.md — who this site is for, and who it is not

**Adopted by the human 2026-08-13.** This document expands `PRD.md § Audience`; it does not
replace it. On any conflict, the PRD wins. These personas are informed hypotheses proposed
by a model session from general knowledge and adopted by the human — **no user research sits
behind them**. Treat them as design lenses, not facts about real visitors; revise when real
usage says otherwise.

Two things this document is **not**:

- **Not a license to personalize.** Serving a persona means writing and structuring for them
  in the one public site everyone sees (Article 1, BRD-002). Nothing here justifies
  questionnaires, tailoring, accounts, or "content for you."
- **Not a scope change.** `PRD.md § Out of scope` stands untouched. A persona may *want*
  something out of scope; that is recorded here precisely so future sessions stop
  re-deriving it.

Machine-readable note: `spec-schema/spec.json → product_overview.target_users` still lists
only the DIY investor. That file is the source of truth for an **approved spec v1.0.0** and
is deliberately unamended here — folding secondary personas in (and resolving the SPEC-008
persona mismatch below) is queued for the next spec revision, a human review-gate item.

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
- **Known defect:** `engineering-spec.schema.json:256` requires every user-story persona to
  exist in `product_overview.target_users`, and this one doesn't. Resolve at the next spec
  revision: either promote it to `target_users` or reword SPEC-008's story to "DIY
  investor." (Promotion is the honest option — the story is doing real work as written.)

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
- **Already served by:** The methodology page, the per-figure citations (Article 2), the
  normalized category mapping in `data/README.md`.
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
- **Comes for:** The Compare page at period-picker extremes, the fee/tax fine print, the
  unflattering years shown at full size.
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
- **Comes for:** A no-advice, no-affiliation, no-monetization explainer that is safe to
  show a client in a compliance-sensitive context.
- **Why they matter:** They quietly depend on the site-wide disclaimer and the absence of
  recommendations more than anyone. Article 1 discipline is precisely what makes the site
  usable in their world.
- **We will not:** Court them — no "for advisors" section, no white-labeling, no CE
  credit framing. Their use case works *because* the site ignores them.

### 7. The university-affiliated curious — alum, student, employee

- **Who:** Cares about *their* school specifically ("how did MIT actually do?"), usually
  arriving via a news story about the endowment.
- **Comes for:** One school page, read deeply — the story blurb, the long allocation
  history, maybe a comparison against a rival.
- **Already served by:** Per-school story blurbs (SPEC-009), per-school URLs, honest
  per-school gaps (Stanford's market-value-only presentation, Yale's post-FY2020
  allocation stop, MIT's abandoned targets — each explained where it appears).
- **We will not:** Add school-vs-school ranking framing or "which endowment is best"
  editorial. Rivalry brings them; Article 4 keeps what they find honest.

### 8. The econ/finance teacher

- **Who:** High-school or intro-college instructor building a lesson.
- **Comes for:** The rare combination that makes a site classroom-safe: free, no login, no
  ads, no data collection, plain English, honest about uncertainty. Would assign the
  Translator ("rebuild Princeton 2010 with ETFs, then explain what didn't translate").
- **Already served by:** The first-use glossary (SPEC-008 doing double duty), the
  no-account/no-tracking posture, the visible proxy-mapping gaps — the *gaps are the
  lesson*.
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
The disclaimer and fine print are aimed at this reader; they are load-bearing, not
boilerplate.

### C. The institutional / professional allocator

They have Cambridge Associates, NACUBO, and Bloomberg; this dataset is too coarse for them
by design. **Refuse by:** never chasing pro-grade granularity (quarterly data, factor
decompositions, benchmark customization) — pursuing it would distort the plain-English
voice that serves everyone else, for an audience that will never rely on this site anyway.

---

## The pattern worth keeping in mind

Personas 3–6 and 8 are **secondhand audiences** — they use the site to teach, persuade, or
inform *someone else*. The design consequence is **shareability**: a specific view must be
reproducible from its URL (already true — keep compare/translate state in `searchParams`),
charts must survive being screenshotted out of context (the on-chart coverage annotations
and disclaimers matter here), and the methodology must be quotable. Shareability is this
site's entire growth loop; there is no other distribution.
