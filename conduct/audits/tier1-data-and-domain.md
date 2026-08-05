# Tier 1 — data accuracy and domain review

**Date:** 2026-08-05 · **Reviewer:** Opus 5 (model), applying domain knowledge
of institutional endowment reporting and benchmark construction.

> **Scope limit, stated up front.** I did not fetch and read the source PDFs.
> Everything below is (a) a comparison of the curated figures against my own
> knowledge of these endowments' publicly reported results, (b) internal
> arithmetic consistency, and (c) a practitioner-style review of the proxy and
> benchmark design. A sampling audit against the actual documents is still
> owed — see *What is still owed* at the end. Nothing here substitutes for it.

## Verdict

**The curated figures are in good shape and I found no wrong number.** All 128
return and market-value rows read as correct against known reported results, and
95 independent arithmetic reconciliations produce only two breaches, both of
which trace to causes the project already documents.

**The defects I did find are disclosure and methodology defects, not data
defects** — and two of them are in the same class the project's own Articles
exist to prevent, which is why they are worth taking seriously.

## Method

1. **Figure spot-check.** Read every return and market value for all five
   schools and compared against reported results I know independently. Checks
   that landed: Yale FY2000 +41.0%, Yale FY2009 −24.6%, Harvard FY2009 −27.3% /
   $26.0B, Harvard FY2025 +11.9% / $56.9B, MIT FY2021 +55.5% / $27.4B, MIT
   FY2009 −17.1%, Princeton FY2021 +46.9%, Princeton FY2009 −23.5% / $12.6B,
   Stanford FY2021 $37.8B, Stanford FY2024 $37.6B. No mismatches.

2. **Reconciliation.** `MV[t] ≈ MV[t−1] × (1 + return[t]) + gifts − spending`.
   Endowment spending runs 4–5.5% with gifts adding 1–2%, so the implied net flow
   must sit in a narrow negative band every year. A transposed digit or a
   wrong-year row cannot stay inside it. **95 checks; the band held at −7.5% to
   +1.0% throughout.** This catches a class of error that citation-checking
   structurally cannot, because `seed-validate` verifies citation *shape*, never
   that the cited document contains the figure (Article 2 makes that a curator
   obligation, not a validated one).

   Now a permanent gate: `npm run verify:figures`
   (`scripts/verify-figure-reconciliation.mjs`). **Negative-controlled** — with
   Yale FY2014 corrupted from 20.2% to 2.02%, a plausible decimal slip, it
   reports an implied flow of +12.71% and exits 1. Clean data exits 0.

3. **Domain review** of `data/proxy_mappings.json`, `BENCHMARK_SERIES` and
   `CATEGORY_TO_BENCHMARK_SERIES` against how institutional portfolios are
   actually benchmarked.

---

## F1 — MIT's return series is Pool A basis, and the UI never says so

**Severity: high.** This is an Article 4 issue of exactly the class the
pool-basis ruling was written to close, in a surface the ruling did not reach.

`data/README.md:233` records the project's own finding:

> MIT states its annual return as its *pooled investments (Pool A)* return […]
> The market values are unambiguously the endowment's: MIT's "investments in
> endowment funds, **excluding pledges**".

So on MIT's page the **return series measures Pool A** while the **market value
measures the endowment** — two different pots, presented together. The
allocation chart now annotates its pool years correctly (task 3.2), but:

- `src/components/charts/ReturnsChart.tsx:45` subtitle reads only *"Investment
  return the school reported for each fiscal year."* No basis, for any school.
- MIT's blurb (`src/lib/blurbs.ts:36`) caveats the pool basis for the
  **allocation** years only, and says "MIT publishes an annual return every year"
  with no basis note.
- The methodology page's MIT section discusses the pool only for allocations.

The sharp version of the problem is that the project **applied the opposite
standard to Stanford**, and says so on the methodology page: Merged Pool returns
were refused because *"presenting Merged Pool figures as 'Stanford's endowment'
would silently swap one portfolio for another — the exact error this site exists
to avoid."* MIT's pool returns are shown as MIT's returns with no caveat.

**There is a real defence, and it should become the disclosure rather than
replace it.** Pool A is *unitized* and roughly 98% of MIT's endowment is invested
through it, so the unit return genuinely is the endowment's return — materially
unlike Stanford's Merged Pool, which is ~73% endowment and whose audited
endowment result differs by several percentage points. That distinction is sound.
It is also invisible to every reader.

**Fix:** give `ReturnsChart` an optional basis note in the same shape as
`MarketValueChart`'s existing `fyNote` prop, and pass MIT's. One sentence:
Pool A, unitized, ~98% of the endowment, which is why it is treated as the
endowment's return. Add the same to the methodology MIT section.

## F2 — "No fees are modeled" is false for four of the five sleeves, and the treatment is inconsistent between them

**Severity: high for a project whose identity is methodological honesty.**

The site states this in five places, unconditionally:

| Location | Claim |
|---|---|
| `src/app/methodology/page.tsx:196` | "No taxes, fees, or trading costs are modeled." |
| `src/app/translate/page.tsx:64` | "no taxes, no fees, no trading costs" |
| `src/app/translate/page.tsx:371` | "No taxes or fees are modeled." |
| `src/app/compare/page.tsx:210` | "No taxes or fees are modeled anywhere." |
| `CLAUDE.md:42` | project rule stating the same |

But the benchmark series behind four of the five investable sleeves are **actual
mutual-fund NAV histories, which are irreducibly net of each fund's expense
ratio**:

| Category | Series source | Fee treatment |
|---|---|---|
| `us_public_equity` | `bench-sp500tr` — S&P 500 Total Return **Index** | **gross** — no fee |
| `intl_public_equity` | `bench-vgtsx` — Vanguard VGTSX **fund** | net (~0.17–0.20% historically) |
| `fixed_income_cash` | `bench-vbmfx` — Vanguard VBMFX **fund** | net (~0.15–0.20%) |
| `real_assets` | `bench-vgsix` — Vanguard VGSIX **fund** | net (~0.22–0.26%) |
| `public_equity` | `bench-vt` — Vanguard VT **ETF** | net (~0.07–0.10%) |

Two distinct defects follow.

**(a) The disclosure is inaccurate**, and unusually it *understates* the project's
own rigour: fees are modelled for most of the portfolio, and cannot be removed
from a fund's NAV history. The honest sentence is roughly "returns come from
actual fund histories and are therefore net of those funds' fees; the US equity
sleeve and the index comparisons use gross index returns; no taxes or trading
costs are modelled."

**(b) The asymmetry is systematic, not noise.** The US sleeve enjoys roughly
15–25 bp/yr of unearned relative advantage over its sibling sleeves. It also
propagates into the comparison composites: `sp500` is a gross index while
`us_aggregate_bond` is VBMFX net of fees, so **60/40 and 70/30 are internally
mixed too** — a gross equity leg and a net bond leg.

Net direction is worth stating plainly, because it is the opposite of what a
critic would assume: the copycat is measured net-of-fee on most sleeves while the
S&P 500 comparison line is gross, so **the current treatment is mildly unfair to
the endowment copycat and mildly flattering to the index.** Magnitude is
single-digit basis points per year, but it compounds across a 25-year window and
the whole product is a copycat-versus-index comparison.

**Fix (choose one, and say which):** either use gross index returns for every
sleeve, or use investable fund returns for every sleeve including US equity
(VFINX ~0.18% was the actual retail option for most of this window, not VOO's
modern 0.03%). Then correct the fine print to describe what was done.

## F3 — `other` maps to a benchmark but has no proxy row

**Severity: low now, latent trap.** `ALLOCATION_CATEGORIES` includes `other`, and
`CATEGORY_TO_BENCHMARK_SERIES` maps `other → "cash"` (`src/lib/constants.ts`).
But `data/proxy_mappings.json` has **no row for `other`** — seven rows for eight
categories.

No school currently allocates to `other`, so this is not live. The trap is that
if a future curation year uses it, the backtest would silently assign T-bill
returns with no honesty note and no `NONE` gap treatment — the exact silent
substitution the project forbids, arriving by omission rather than by decision.

**Fix:** a seed-validator rule that every `ALLOCATION_CATEGORY` must have a
`proxy_mappings` row, so the omission fails the seed rather than surfacing as a
number.

---

## What passed, with numbers

- **128 return and market-value rows**: no figure I can identify as wrong.
- **95 reconciliations**: two breaches, both traced to documented causes
  (MIT FY2006 = the recorded FY2006/FY2007 market-value basis break plus the
  Pool-A-versus-endowment mismatch; Princeton FY2009 = crash-year flow timing,
  +1.05%, marginal).
- **Princeton's FY2000 and FY2003 return gaps are legitimate and documented**
  (`data/README.md:112-116`) — FY2000's report states no comparable return and
  FY2003's is on a measurement universe the project declines to substitute. I
  went looking for a curation miss and found a deliberate, explained gap.
- **Refusing to proxy `absolute_return` and `private_equity_vc` is the single
  best call in the data design.** Most retail-facing endowment-replication
  content substitutes an HFRI-tracking product or listed-PE like PSP and produces
  a meaningless series. The honesty notes name PSP specifically and explain that
  it holds the public shares of buyout firms rather than fund returns — that is
  the correct sophisticated objection, not a hand-wave.
- **Using each fund's older share class for history** (VXUS/VGTSX, BND/VBMFX,
  VNQ/VGSIX) is methodologically right: proxy and benchmark are the same
  portfolio, rather than an index the ETF only approximates.
- **`real_assets → VNQ` is self-labelled "the weakest honest proxy in this
  table"** and that assessment is correct. Endowment real assets are direct
  property, timber and energy partnerships; listed REITs have very different
  drawdown behaviour (VGSIX fell roughly 45% in FY2009 while directly-held
  property was marked down far less and later). Knowing and saying this is the
  right posture.

## What is still owed

1. **The sampling audit against source documents.** My spot-check used my own
   knowledge, which is good for headline figures (returns, market values of
   well-covered years) and weak for the long tail — the individual allocation
   percentages, of which there are hundreds. Those are where a transcription
   error would hide, and reconciliation does not touch them. Sample them and
   re-derive from the PDFs.
2. **Allocation-row arithmetic.** I did not independently verify that every
   school-year's percentages sum within tolerance; `seed-validate` claims to, and
   `seed:dry` is green, but that is the validator checking itself.
3. **Quantifying the REIT proxy's directional bias.** F2's fee asymmetry is small.
   The `real_assets → VNQ` substitution is not: for a school with a large real
   assets sleeve, FY2009 copycat performance will diverge from the endowment by a
   large, *directional* margin. The honesty note describes this qualitatively; a
   number would be stronger, and the project already has the data to compute it.
