# Tier-1 Legal & Compliance Gap Review — University Endowment Investing Explorer

> ## THIS IS NOT LEGAL ADVICE
>
> **I am not a lawyer and this document gives no legal advice, no legal opinion, and no
> assurance about any outcome.** It is a *gap-identification briefing* whose only purpose is to
> save a real lawyer's billable time: it locates specific shipped copy and code, explains why a
> lawyer might care, and frames the question for them to answer. Every "why it matters" below
> describes a *risk to investigate*, not a conclusion that a law has been broken. Where I am
> uncertain about a legal standard I say so in the text rather than guessing. Nothing here should
> be relied on as a basis for action beyond the low-cost interim mitigations, each of which is a
> copy or configuration change the owner can make without counsel and none of which is a
> substitute for advice.

**Reviewed:** 2026-08-05
**Subject:** `https://universityfunds.vercel.app` (live, public, no login, free), source at
`/Users/amayb/Projects/dashboardProject`
**Scope:** `PRD.md`, `CONSTITUTION.md`, `CLAUDE.md`, all of `src/app/**` (10 user-facing routes),
`src/lib/blurbs.ts`, `src/lib/glossary.ts`, `src/lib/school-theme.ts`, `src/components/**`,
`data/README.md`, `data/sources.json`, `data/proxy_mappings.json`, plus live fetches of `/`,
`/compare`, `/methodology`, `/glossary`, `/translate?school=yale&year=2020`, and probes of ten
candidate legal-page URLs.
**Owner facts assumed:** individual builder, US-based, Vercel Hobby plan (`TASKS.md:306`), no
monetization of any kind (`PRD.md:50` places monetization out of scope), GitHub repo not publicly
reachable (`https://github.com/amaybhat-creator/universityfunds` returns 404 to an unauthenticated
request).

### Routes that exist

`/`, `/explore`, `/explore/[school]` (5), `/translate`, `/compare`, `/glossary`, `/methodology`,
plus `not-found` and `error`. **No `/privacy`, `/privacy-policy`, `/terms`, `/terms-of-use`,
`/legal`, `/about`, `/contact`, or `/disclaimer` — all ten probed URLs return 404.** No
`robots.txt` and no `sitemap.xml` (both 404), so the content routes are crawlable by default; the
404 page carries Next.js's automatic `<meta name="robots" content="noindex">` but no content route
does.

---

## Findings, highest exposure first

---

## F1 — Five universities are named, colour-coded and monogrammed site-wide, and there is no "not affiliated / not endorsed" statement anywhere

**The gap.** The site uses each university's name, its *official* brand colour by name, and a
letter monogram badge, as the site's own visual identity — and carries no disclaimer of
affiliation, sponsorship or endorsement on any route. I searched the entire `src/` tree for
`not affiliated`, `endorse`, and `trademark`: **zero matches in any user-facing file.** The only
place the trademark reasoning exists at all is engineering comments and the build log, which no
visitor reads.

**Exactly where.**

- `src/lib/school-theme.ts:14-23` — `SCHOOL_THEME` stores each school's official colour *and its
  brand name*: `yale: { color: "#00356B", … colorName: "Yale Blue" }`, then
  `"Harvard Crimson"`, `"Cardinal Red"`, `"MIT Cardinal"`, `"Princeton Orange"`.
- `src/lib/school-theme.ts:37-40` — the five school colours combined into one gradient, described
  in its own comment as **"the site's quiet signature, used on the header and footer rules."**
  Rendered on *every* route: `src/app/layout.tsx:53` (header hairline) and
  `src/app/layout.tsx:80` (footer hairline).
- `src/components/SchoolMark.tsx:20-28` — a filled badge in the school colour bearing the school's
  initial (`Y`, `H`, `S`, `M`, `P`), used at `src/app/page.tsx:113`, `src/app/explore/page.tsx:52`
  and `src/app/explore/[school]/page.tsx:112` (at `size="lg"`, 48px, beside the school name as the
  page's masthead).
- `src/app/layout.tsx:20` — site title `"University Endowment Investing Explorer"`;
  `src/app/layout.tsx:23-24` — the site-wide meta description names all five schools. This
  description is what appears in search results; verified live in the served HTML of `/`.
- `src/app/layout.tsx:21` — every subpage title is templated `"%s — Endowment Explorer"`, so e.g.
  the Harvard page's browser title is `"Harvard University — Endowment Explorer"`.
- Deliberate good choices, for the record: no logos or seals are used
  (`src/lib/school-theme.ts:3-6` explains why), and the human explicitly chose colour+monogram over
  real crests when offered the trade-off (`TASKS.md:353`).

**Why it matters.** Referential use of another party's marks to talk about that party is generally
analysed as nominative fair use. My non-lawyer understanding of the Ninth Circuit's
*New Kids on the Block v. News America Publishing* framing is a three-part test, of which the third
part is that the user must do **nothing that would suggest sponsorship or endorsement**. The first
two parts look comfortable here: you cannot discuss Yale's endowment without saying "Yale", and the
site uses names and initials rather than logos. The third part is where the exposure sits, and two
facts push against it in combination: (a) there is no disclaimer of any kind, anywhere; and (b) the
five schools' official colours are not merely used to *label* each school's data — they are
composited into a gradient that serves as the site's *own* brand mark on every page, including the
404 page. Colour is weak as a trademark but not nothing, and a mark holder's complaint would not
have to win to be expensive: all five of these universities run active trademark licensing and
enforcement programmes, and the standard opening move is a letter, not a suit. **Compounding
factor:** there is no contact route on the site (see F7), so a university's trademark officer who
wanted an informal fix has no informal channel and would have to escalate.

**The question for the lawyer.**
1. Does the current use — names + official colours + letter monograms, with the five colours
   composited as the site's own signature gradient, and no disclaimer — stay inside nominative
   fair use, or does the combination create a likelihood-of-confusion or false-endorsement
   problem (Lanham Act §43(a)) that a disclaimer would cure?
2. What exact disclaimer wording and placement do you want, and does it need to appear on every
   route or only where school names cluster?
3. Are any of the five single-letter monograms themselves registered or claimed marks in a form
   this badge could infringe (I did not search USPTO records and am not competent to)? Please check
   at least Stanford's block "S", Harvard's "H", and Princeton's "P".
4. Should the signature gradient be retired in favour of a project-native palette, keeping the
   school colours only as per-school data labels?

**Interim mitigation, today, without counsel.** Add one sentence to the footer strip in
`src/app/layout.tsx:81-96`, which already renders on every route including 404 and the error
boundary: *"Independent and unaffiliated: this site is not affiliated with, sponsored by, endorsed
by, or connected to Yale, Harvard, Stanford, MIT or Princeton, or any of their investment offices.
University names and colours are used only to identify whose published figures are shown."* Repeat
it near the top of `/methodology`. Note that `CONSTITUTION.md:44` reserves site-level legal framing
to the human, so the owner adopts this personally rather than a session doing it.

---

## F2 — Hypothetical, hindsight-constructed portfolio results are published with no hypothetical-performance or past-performance disclosure, and the only site-wide disclaimer is a 12px footer strip

**The gap, part A — content.** The site's disclaimer never mentions that the copycat results are
hypothetical, simulated, or not the results of any actual account, and never says anything about
past performance and future results. I searched all of `src/app` and `src/lib` for
`past performance`, `hypothetical`, `simulat`, `no guarantee`, and `future results`: **zero matches
in user-facing copy.** The word `backtest` reaches a visitor exactly once, and only in a
failure message — `src/app/translate/page.tsx:349`: *"This mix can't be backtested…"*.

What the disclosures *do* cover (genuinely well) versus what they omit:

| Conventional backtest disclosure element | Covered? | Where |
|---|---|---|
| No fees modelled | **Yes** | `src/app/translate/page.tsx:50-51`, `:64-65`, `:372`; `src/app/compare/page.tsx:210`; `src/app/methodology/page.tsx:196-197` |
| No taxes modelled | **Yes** | same lines; plus `src/app/translate/page.tsx:49-51` explains *why* it matters ("Endowments pay essentially none; your account probably does") |
| No trading costs modelled | **Yes** | `src/app/translate/page.tsx:64-65` |
| Rebalancing assumption stated | **Yes** | `src/app/translate/page.tsx:63-64`; `src/app/methodology/page.tsx:194-196` |
| What the model *cannot* replicate | **Yes, unusually well** | `src/app/translate/page.tsx:36-68` (access / taxes / horizon / staff) |
| Uncovered share of the portfolio quantified | **Yes** | `src/app/translate/page.tsx:354-361` |
| **Results are hypothetical / not an actual account** | **No** | nowhere |
| **Past performance does not indicate future results** | **No** | nowhere |
| **Hindsight / selection bias in constructing the model** | **No** | nowhere |

The hindsight point is the sharpest omission because it is structurally true of this specific
product, not a boilerplate ritual. The copycat's ETF mapping was chosen in 2026 — and chosen
explicitly for *longest continuous history*, i.e. because of what happened after
(`data/README.md:611`: *"prefer the longest continuous history over the most familiar ticker"*).
The mapping is then applied retroactively to FY2000. Two ETFs shown as the buyable instrument
(`VOO`, `VNQ`, `VXUS`) did not exist for much of the backtest window, which the data files
acknowledge internally (`data/README.md:603-607`, `data/proxy_mappings.json:15`, `:31`, `:38`) but
which no user-facing sentence states as a limitation of the *result*. Meanwhile the headline result
is presented as a hard number in bold: `src/app/translate/page.tsx:387-401` — *"Over FY{startFY}–FY{endFY},
the copycat's annualized return is **{x}%** versus **{y}%** for the endowment itself."*

**The gap, part B — placement.** The site-wide disclaimer is present on **every** route, which is
correct and verified: `src/app/layout.tsx:79-97` puts it in the root layout, so it renders on `/`,
`/explore`, `/explore/[school]`, `/translate`, `/compare`, `/glossary`, `/methodology`, the 404
(`src/app/not-found.tsx` — confirmed in the live 404's served HTML) and the error boundary
(`src/app/error.tsx`, with a comment at `:3-4` recording that this was intentional). I fetched
`/compare`, `/methodology`, `/glossary` and `/translate?school=yale&year=2020` live and found the
string *"Education, not financial advice"* in each. **This part is done right and the lawyer should
not spend time on it.**

The placement problem is visibility, not presence. The disclaimer is a single wrapped strip of
`text-xs` (12px) type at the very bottom of the document (`src/app/layout.tsx:81`), reading in
full:

> *"Education, not financial advice."* — `src/app/layout.tsx:83`
> *"This site knows nothing about you and can't tell you what to do with your money."* — `:86-88`
> *"Every number is from a cited public document — sources & methodology."* — `:89-95`

Because `main` is `flex-1` (`src/app/layout.tsx:74`), the footer sits at the viewport bottom on
short pages (404, error) but is **below the fold on every route that actually shows numbers** —
`/explore/[school]`, `/translate`, `/compare`, `/methodology`, `/glossary`. On `/compare` a visitor
can read a growth-of-$10,000 chart and an annualized-return table without the disclaimer ever
entering the viewport. I am *not* alleging a contrast failure — `text-zinc-700`/`text-zinc-500` on
white clears 4.5:1 and the build log records Lighthouse a11y 100 (`TASKS.md:285`). The issue is
size and position only. Note also this was a deliberate aesthetic trade: the human asked for "less
footer bulk" and the footer was compacted to a single strip (`TASKS.md:338`).

**Asymmetry worth flagging.** `/translate` has an excellent amber-bordered fine-print panel
(`src/app/translate/page.tsx:36-68`) placed *above* the performance chart. `/compare` has **no
equivalent panel at all** — it publishes the same class of hypothetical result with only a
one-clause chart footnote, `src/app/compare/page.tsx:210`: *"No taxes or fees are modeled
anywhere."*

**Why it matters.** The formal SEC hypothetical-performance rules I am aware of (the Marketing
Rule, Advisers Act Rule 206(4)-1) bind *registered or required-to-register investment advisers*,
and on the analysis in F3 this owner is probably not one — **so I do not think those rules apply of
their own force, and a lawyer should confirm or reject that.** The exposure is a different and
more general one: publishing a bolded annualized-return figure for a portfolio that never existed,
built with knowledge of the outcome, without saying it is hypothetical, is the fact pattern that
supports a deception theory under FTC Act §5 or a state UDAP statute, and it is the fact pattern
that makes a "the site told me X would have returned Y" complaint from a retail visitor harder to
answer. The audience is explicitly retail and non-professional (`PRD.md:10-12`: *"Everyday DIY
investors managing their own retirement/brokerage accounts. Curious, not professional."*), which
raises rather than lowers what a reader is entitled to be told.

**The question for the lawyer.**
1. Given no compensation and no adviser status, what hypothetical-performance disclosure do you
   want as a matter of prudence rather than obligation — and do you want the SEC Marketing Rule's
   substance borrowed voluntarily as the safe template?
2. Must "past performance is not indicative of future results" appear site-wide, or only adjacent
   to each performance display?
3. Does the hindsight/selection-bias point need its own sentence given that instrument choice was
   admittedly driven by history length (`data/README.md:611`)?
4. Should the site-wide footer disclaimer be promoted out of 12px footer type — e.g. a persistent
   banner, or a first-visit interstitial — or is footer placement plus per-feature fine print
   sufficient?

**Interim mitigation, today.**
1. Add to the `FinePrint` panel (`src/app/translate/page.tsx:62-66`): *"These results are
   hypothetical. No one held this portfolio; it is arithmetic applied backwards to published
   figures, using funds selected today partly because their price history is long enough to run.
   Past performance — real or hypothetical — does not indicate future results."*
2. Render the same `FinePrint` panel (or a trimmed version) on `/compare`, which today has none.
3. Add `"Past performance does not indicate future results. Copycat figures are hypothetical."`
   to the footer strip at `src/app/layout.tsx:83-88`, next to the existing sentence.

---

## F3 — The Translator emits a specific ticker-and-weight portfolio with per-ETF "why you'd pick this" copy; the protection currently rests on the no-compensation prong, not on the disclaimer

**The gap.** The project's own rule is `CONSTITUTION.md:15` (Article 1): *"Never produce copy that
tells a user what to do with their money… **Broken by:** 'you should', 'we recommend',
risk-tolerance questionnaires, anything that reads as a suggestion to buy or sell."* Tested against
shipped copy, the literal tripwires are clean — I searched all of `src/` and `data/*.json` for
`you should`, `we recommend`, `recommend`, `advis`, `your portfolio`, `better off`: the only hit is
`src/app/glossary/page.tsx:54`, which is a *disclaimer* (*"These are explanations of words, not
recommendations about them"*). There is no personalization anywhere, no questionnaire, no account,
no input about the user.

But the Translator does something the rule's tripwire list does not catch: it **constructs a
concrete portfolio of five named, currently-purchasable tickers with percentage weights**, and
attaches to each ticker a sentence whose own schema documentation describes it as the reason to buy
it. The riskiest copy, in descending order:

- `data/README.md:629` — the `rationale` field is defined in the project's own data spec as:
  **"Plain-English reason a normal investor would pick this ETF for this category."** This is the
  single most quotable artefact in the repo, because it states the *authorial intent* of copy that
  is rendered verbatim to users at `src/app/translate/page.tsx:322` and
  `src/app/methodology/page.tsx:233`.
- `data/proxy_mappings.json:6` (live-verified rendering in the `/translate` HTML) — **"The S&P 500
  — the 500 largest US companies — is the standard way to own the broad US stock market in one
  fund, and VOO tracks it for a 0.03% yearly fee."** A named ticker, a fee figure, and "the
  standard way to" — the closest thing on the site to a product endorsement.
- `data/proxy_mappings.json:30` — **"One fund holding the broad US investment-grade bond market —
  the plain-vanilla core of a fixed income sleeve."**
- `data/proxy_mappings.json:38` — **"Real estate a regular investor can actually buy: a fund of
  listed US property companies (REITs)…"**
- `data/proxy_mappings.json:22` — **"…the honest one-fund stand-in is the whole world stock market
  at market weights."**
- The table column these sit under is headed *"Why this ETF — and what it misses"*
  (`src/app/translate/page.tsx:294`), and the table's own caption is
  *"{school}'s FY{year} allocation translated into ETFs"* (`:287`).
- `src/app/methodology/page.tsx:188-191` — **"each ETF shown in the Translator is the buyable
  version of the *same instrument* behind the benchmark series, so the copycat's math and the thing
  you could actually buy are one and the same."** This sentence closes the loop between the model
  and a purchase.
- `src/app/translate/page.tsx:359` — **"That gap is real: it is the part of the strategy you cannot
  buy."** Second person, framed around the reader's own purchasing.
- Framing copy: the feature is named with an imperative — **"Copy the Pros"**
  (`src/app/page.tsx:24`, `src/app/translate/page.tsx:31`, `src/app/translate/page.tsx:154`), and
  `src/app/methodology/page.tsx:206` closes with *"…about copying the pros."*
- Performance-flavoured characterizations of specific strategies in `src/lib/blurbs.ts`:
  `:14` *"The quiet outperformer that discloses the least along the way"*; `:35` *"by the numbers
  it is the quiet star of this data"*; `:11` *"The pioneer of the famous endowment model"*;
  `:15` *"The heaviest private-equity tilt in this data, per student the richest of the five."*
- One mitigating sentence, well placed: `src/app/translate/page.tsx:65` — *"All of this is
  education about how these portfolios behaved, not a suggestion about yours."*

**Why it matters — and what is actually protecting the site.** The brief asked me to test the copy
against the *Lowe v. SEC*, 472 U.S. 181 (1985) publisher's exclusion. That exclusion
(Advisers Act §202(a)(11)(D)) shelters a *bona fide* publication of *general and regular*
circulation offering impersonal advice. On the facts, the impersonality prong looks strong: output
is a pure function of a URL (`/translate?school=yale&year=2020` — `src/app/translate/page.tsx:74`),
identical for every visitor, with no user input of any kind. The prong I would flag as genuinely
untested is *regularity*: the site is updated by hand once a year
(`src/app/methodology/page.tsx:74`, `src/app/page.tsx:131-132`, `PRD.md:39`), and I do not know
whether an annually-refreshed website satisfies a doctrine written for periodicals. **I am
uncertain here and am flagging it rather than guessing.**

More importantly, I think *Lowe* is not what is doing the work. §202(a)(11) defines an investment
adviser as one who, **for compensation**, engages in the business of advising others. This site
takes no compensation in any form: no ads, no affiliate links, no donations, no paid tier, no
sponsorship — and `PRD.md:50` places monetization out of scope for v1. So the definitional
threshold appears not to be met at all, which makes the publisher's exclusion a fallback rather
than the primary defence. **The practical consequence is the finding:** the site's protection is
currently structural (no compensation) rather than editorial (careful copy), and it would change
character the moment a single Amazon affiliate link, a "buy me a coffee" button, a sponsor logo, or
a paid tier appears — at which point the copy quoted above, unchanged, sits in a materially
different legal posture. Broker-dealer and state-level analyses (most state adviser statutes have
their own compensation and publisher provisions, which I have not reviewed) would need the same
re-run.

**The question for the lawyer.**
1. With no compensation of any kind, does the Advisers Act definition in §202(a)(11) reach this
   site at all — and if not, is the *Lowe* publisher's exclusion even needed?
2. If it is needed: does an annually-hand-updated website satisfy the "general and regular
   circulation" and "bona fide" prongs, given *Lowe*'s periodical framing? Does the reasoning
   change under the state adviser statute of the owner's home state?
3. Do the per-ETF `rationale` sentences (quoted above), naming five specific purchasable tickers
   with weights and one with an expense ratio, cross from description into recommendation — and
   does it matter that the project's own schema defines the field as *"reason a normal investor
   would pick this ETF"* (`data/README.md:629`)?
4. **The one I would ask first:** what is the precise trigger at which monetization changes this
   analysis, so the owner knows the line before crossing it accidentally?
5. Does the imperative feature name "Copy the Pros" need to change?

**Interim mitigation, today.**
1. Do not monetize in any form until Q4 is answered. This is the cheapest and most valuable single
   action in this document.
2. Reword the `rationale` field's *purpose*, and the five sentences that follow from it, from
   second-person purchase-reason into third-person mapping-rationale: e.g. `data/proxy_mappings.json:6`
   becomes *"This project maps a US public-equity sleeve to the S&P 500 total-return index; VOO is
   the retail share class of that index, which is why it is named here."* Same information, no
   implied selection for the reader. Edit `data/README.md:629` to match, so the intent recorded in
   the spec matches the intent in the copy.
3. Add to the `FinePrint` panel: *"Naming an ETF here is not a suggestion to buy it. These tickers
   were selected to make arithmetic possible over a 25-year window, not because they suit anyone's
   circumstances."*
4. Leave `src/app/translate/page.tsx:65` exactly as it is — it is the best sentence on the site
   for this purpose.

---

## F4 — No terms of use, no limitation of liability, no warranty disclaimer, no governing law, and no notice about the site's own content

**The gap.** There are no terms of any kind. `/terms`, `/terms-of-use` and `/legal` all return 404,
no route links to any such page, and no file in `src/` contains terms language. The complete set of
liability-adjacent language shipped to a user is the three footer sentences at
`src/app/layout.tsx:83-95` plus the per-feature fine print, and none of it does the work terms
normally do:

- No disclaimer of warranties (no "as is", no accuracy/fitness disclaimer).
- No limitation or cap of liability.
- No "no reliance" clause — which is the specific one that matters for a site whose whole output is
  numbers a reader might act on.
- No governing law or venue.
- No statement of what the owner claims in the site's own content, and no licence terms for
  reusers. The site publishes a 624-row hand-built compilation (477 school rows + 147 benchmark
  rows) with no copyright notice and no licence, so a scraper has nothing to violate and the owner
  has nothing recorded to point at.
- No acceptable-use or anti-scraping terms.
- No indemnity.

**Why it matters.** Terms are how a free publisher converts an open-ended duty into a bounded one.
Without a warranty disclaimer and a no-reliance clause, the site's strong accuracy claims (F7) run
unbounded: the site tells a retail reader *"Every number is from a cited public document"*
(`src/app/layout.tsx:90-94`) and *"Nothing is estimated, interpolated, or carried forward"*
(`src/app/methodology/page.tsx:72-73`), and offers no countervailing "we don't warrant accuracy;
don't rely on this" text anywhere. Whether such terms would be enforceable against a visitor who
never clicked anything is itself a question I am not competent to answer — browsewrap
enforceability turns on notice and assent and varies by circuit — but their **absence** removes the
argument entirely rather than weakening it.

**The question for the lawyer.**
1. For a free, no-login, non-commercial informational site by an individual, do you recommend terms
   of use at all, or is a well-drafted expanded disclaimer sufficient and less likely to create
   obligations than it disclaims?
2. If terms: what is the minimum viable set — warranty disclaimer, liability cap, no-reliance,
   governing law — and how should they be presented for a browsewrap notice argument (footer link
   on every page? banner on first visit?).
3. Should the owner assert copyright in the compilation and publish a licence, or is silence
   preferable?
4. Does the absence of a liability cap change your answer on F2's hypothetical-performance
   disclosure — i.e. does more disclosure substitute for a cap here?

**Interim mitigation, today.** Create `/terms` with a short, plainly-worded page — warranty
disclaimer ("provided as is, without warranties of any kind, express or implied, including accuracy
and fitness for a particular purpose"), no-reliance ("do not rely on anything here for an
investment decision"), liability limitation to the extent permitted by law, and a copyright notice
for the compilation with an explicit permission for non-commercial reuse with attribution if that
is the owner's intent. Link it from the footer strip in `src/app/layout.tsx:81-96` so it appears on
every route including 404. **Caveat the owner should hold in mind:** self-drafted terms can create
exposure as well as limit it, this is expressly a reserved matter under `CONSTITUTION.md:44`, and
this page should be treated as a placeholder for counsel to replace, not a finished instrument.

---

## F5 — Third-party market-data licensing was never resolved, and it is a reserved matter the project's own constitution flags

**The gap.** Five of the six populated benchmark series — every return figure that drives every
copycat and benchmark line on the site — are computed by the owner from **Yahoo Finance** price
history and republished as derived annual returns. The sixth is from FRED. The project's own
governance explicitly reserves this decision to the human, and I found no record that it was ever
made.

**Exactly where.**

- `data/sources.json:105-106` — `bench-sp500tr`: *publisher* **"Yahoo Finance"**, url
  `finance.yahoo.com/quote/^SP500TR/history`. This is the **S&P 500 Total Return Index**.
- `data/sources.json:115-116` — `bench-vbmfx` (VBMFX), Yahoo Finance.
- `data/sources.json:125-126` — `bench-vgtsx` (VGTSX), Yahoo Finance.
- `data/sources.json:135-136` — `bench-vgsix` (VGSIX), Yahoo Finance.
- `data/sources.json:955-956` — `bench-vt` (VT), Yahoo Finance, accessed 2026-08-04.
- `data/sources.json:120` and `data/README.md:603` — the sixth is FRED (`TB3MS`), which is US
  government data; that one looks clean.
- `TASKS.md:175` records the collection method: *"curl reaches both FRED and the Yahoo chart API
  fine — so fetch with curl, parse locally. Yahoo's v8/finance/chart endpoint needs a browser
  User-Agent."* Setting a browser User-Agent to reach a JSON endpoint is a detail a data provider's
  counsel would notice.
- `CONSTITUTION.md:44` reserves to the human: *"**Legal and compliance posture.** How the
  not-financial-advice framing is worded at the site level, terms of use, **data licensing and
  redistribution rights for anything scraped or archived.**"*
- I searched `TASKS.md`, `PRD.md`, `README.md`, `data/README.md` and all of `conduct/` for
  `licens`, `terms of service`, `redistribut`, `copyright`, `fair use`, `scrap`. **No decision
  exists.** The only related hits are the *opposite* judgment being made correctly for paid
  sources (`data/README.md:613`: HFRI and Cambridge Associates rejected as *"paywalled and
  non-redistributable"*; `data/README.md:603`: Bloomberg US Aggregate rejected because it *"isn't
  freely redistributable"*) — the team reasoned carefully about redistribution for the sources it
  declined and never applied the same reasoning to the source it used. A separate governance audit
  even found that the operator quick-card had *dropped* the data-licensing clause from its
  condensed reserved list (`conduct/audits/2026-07-31/WP2-governance.md:448`), which plausibly
  explains how this slipped.

**Why it matters.** Two distinct issues, and neither is really copyright:

1. **Contract / terms of service.** Yahoo's terms restrict automated collection and
   redistribution of its data, and restrict commercial use. I have not read the current version and
   cannot characterise its scope; a lawyer must. A ToS breach is a contract question (and, in some
   framings, a CFAA-adjacent one, though post-*Van Buren* scraping of publicly accessible data is a
   much weaker CFAA theory than it once was — flagging my uncertainty).
2. **Index licensing, which is the sharper one.** `^SP500TR` is the S&P 500 **Total Return** Index,
   a licensed product of S&P Dow Jones Indices. Yahoo displays it as a licensee; a licensee
   generally cannot sublicense. So the derived FY2000–FY2025 total-return series republished at
   `/compare` and `/translate` — and the "S&P 500" name used as a headline benchmark label
   throughout (`src/app/compare/page.tsx:190`, `src/lib/chart-theme.ts` entity labels,
   `src/components/charts/ReturnsChart.tsx:55,66`) — may implicate both S&P DJI's asserted rights in
   the index data and the "S&P 500" trademark. Twenty-six annual percentages are far from the whole
   index, and *Feist* means the figures themselves are facts, so a copyright theory looks weak; a
   licensing/contract or hot-news-style misappropriation theory is the one to check. Index providers
   are known to be assertive about exactly this.

**The question for the lawyer.**
1. Does republishing 26 derived annual total-return figures for `^SP500TR`, computed from Yahoo
   Finance data, breach Yahoo's terms of service, S&P DJI's rights, or both? Does non-commercial,
   free, no-ad use change the answer?
2. Does using "S&P 500" as a benchmark series name and chart label require a licence, or is it
   nominative/descriptive use?
3. Would switching the equity benchmark to a freely-licensed alternative — a Vanguard or iShares
   fund's own published total returns, or a public-domain/CC-licensed index — remove the issue
   entirely? (This would be a data-layer change plus one re-seed, and the project's own instrument-
   selection note at `data/README.md:611` says the choice is `[JUDGMENT CALL]`, i.e. reversible.)
4. Same question for the four Vanguard fund price histories — is the underlying issue Yahoo as the
   *conduit*, such that sourcing the identical returns from Vanguard's own published performance
   pages resolves it?

**Interim mitigation, today.** Two things, both cheap. First, add a line to `/methodology` stating
where the benchmark series came from and that they are derived figures, not redistributed data:
*"Benchmark returns are computed by this project from publicly displayed daily price history; the
underlying index and fund data belong to their respective providers, and no provider endorses or is
affiliated with this site."* Second, re-source the equity series from each fund provider's own
published total-return figures where they exist — the arithmetic and the cited figures need not
change, only which document is cited. Then put the licensing question in front of counsel before
any monetization, since commercial use is where these terms typically bite hardest.

---

## F6 — No privacy policy anywhere (confirmed), and the live telemetry state is not what the build log records

**The gap — confirmed, as the brief suspected.** There is no privacy policy on the site, in any
form, anywhere. `/privacy`, `/privacy-policy`, `/legal` and `/about` all 404. No route links to
one. No file in `src/` contains the word `privacy`, `GDPR`, `CCPA` or `cookie` — I searched the
whole tree. The footer (`src/app/layout.tsx:79-97`) has three sentences and no privacy link.

**What is actually collected — and a correction to the project's own record.** `TASKS.md:306`
states: *"Web Analytics + Speed Insights were enabled in the dashboard (Q-003's default — the app
needs no code change for basic analytics)."* **The live site contradicts the second half of that.**
I verified:

- `package.json` contains **neither** `@vercel/analytics` **nor** `@vercel/speed-insights`.
- No file in `src/` references `Analytics`, `SpeedInsights` or `va.vercel-scripts`. In particular
  `src/app/layout.tsx` mounts no analytics component.
- The served HTML of `/`, `/compare`, `/methodology`, `/glossary` and
  `/translate?school=yale&year=2020` contains **no** insights or analytics script tag (I enumerated
  every `<script src>`; all are Next.js chunks).
- `https://universityfunds.vercel.app/_vercel/insights/script.js` → **404** (Web Analytics not
  serving).
- `https://universityfunds.vercel.app/_vercel/speed-insights/script.js` → **200** (Speed Insights
  *is* enabled at the project level) — **but nothing on any page loads it.**

So: Speed Insights is switched on in the dashboard, the delivery endpoint is live, and no page
requests it. **Today, no client-side telemetry is being collected.** What *is* collected regardless
is Vercel's own platform-level request logging — IP address, User-Agent, requested path (including
the `?school=`/`?year=`/`?from=`/`?to=` query parameters that `/translate` and `/compare` put in the
URL) — and whatever Neon logs for database connections. That is server-side processing the owner
cannot switch off while hosting on Vercel. **Both facts belong in the briefing:** the current
collection footprint is smaller than the owner believes, *and* it will silently become larger the
moment someone adds the package or Vercel changes auto-injection behaviour — with no privacy policy
in place to describe it.

**Why it matters.** The site is publicly indexable (no `robots.txt`, no `noindex` on content
routes — both verified live), names five internationally famous universities, and is reachable
worldwide, so EU/UK visitors are entirely plausible. My non-lawyer understanding:

- **GDPR / UK GDPR.** An IP address is generally treated as personal data, and Articles 13/14
  impose transparency duties on a controller regardless of how minimal the processing is. Whether
  Article 3(2) reaches a US hobby site that merely *is reachable* from the EU turns on whether the
  owner "offers services to" or "monitors" EU data subjects, which for a free non-commercial site
  with no EU targeting is genuinely arguable. **I do not know the answer and a lawyer should
  resolve it rather than assume either way.**
- **Cookieless analytics.** Vercel's Web Analytics and Speed Insights are cookieless. Under
  ePrivacy/PECR, the consent requirement attaches to *storing or accessing information on the
  user's device*, so cookieless collection plausibly avoids the cookie-banner obligation — but it
  does **not** avoid GDPR transparency for the IP-based processing. In other words, cookieless
  removes the banner question, not the policy question. This distinction is the one thing I would
  most want confirmed.
- **California.** CCPA/CPRA applies to a "business" meeting revenue or volume thresholds (roughly
  $26.6M annual revenue, 100,000 consumers, or 50% of revenue from selling personal information).
  A free non-commercial site by an individual almost certainly meets none, so **I think CCPA
  probably does not apply** — flagged as my reading, not a conclusion.

**The question for the lawyer.**
1. Does GDPR Article 3(2) reach this site as configured — publicly indexed, no EU targeting, no
   monetization — and if so, does a short transparency notice discharge Articles 13/14?
2. Confirm or correct my understanding that cookieless analytics removes the ePrivacy/PECR consent
   obligation but not the GDPR transparency obligation.
3. Given that Vercel's platform request logs capture IPs whether or not analytics is enabled, is a
   privacy notice needed even in the current zero-client-telemetry state?
4. Is a Vercel data processing addendum needed, and does the Hobby plan (`TASKS.md:306`) offer one?
5. Confirm CCPA/CPRA inapplicability.

**Interim mitigation, today.** This is the cheapest complete fix in the document, and it is worth
doing before counsel because a short honest notice is strictly better than none. Create `/privacy`
with: who runs the site (a named individual) and how to reach them; that there are no accounts, no
logins and no cookies set by the site; that the hosting provider (Vercel) processes IP addresses,
User-Agents and requested URLs for delivery, security and performance measurement; that Vercel
Speed Insights is enabled at the project level and is cookieless; that nothing is sold or shared
for advertising; how long data is retained (state Vercel's retention, or say the owner does not
control it); and a contact address for access/deletion requests. Link it from the footer. Then, as
a decision the owner should make consciously: either turn Speed Insights *off* in the Vercel
dashboard (it is collecting nothing today anyway, so the cost is zero) or leave it on and describe
it — but do not leave the recorded state (`TASKS.md:306`) diverging from the live state. Note the
dashboard toggle is a `[H]` reserved item under `CONSTITUTION.md:47`.

---

## F7 — Absolute accuracy claims, no corrections mechanism, and no contact method of any kind

**The gap.** The site makes unqualified accuracy and completeness claims, and provides no way for
anyone to report an error, request a correction, or contact the owner. I searched all of `src/` for
`mailto`, `contact`, `github`, `correction` and any email address: **zero matches.** There is no
email, no form, no social handle, no repository link (and the repo is not publicly reachable
anyway), no `/about`, no `/contact`. A visitor who spots a wrong number, a university's trademark
officer, a data provider, or a GDPR data-subject request has **no channel to the owner at all**
other than the `vercel.app` subdomain, whose WHOIS resolves to Vercel rather than the owner.

**The claims, exactly.**

- `src/app/layout.tsx:90-94` (every route) — *"Every number is from a cited public document."*
- `src/app/methodology/page.tsx:44` — *"The rule behind everything here: **no citation, no
  number**."*
- `src/app/methodology/page.tsx:63-70` — *"Every figure is hand-copied from a public document…
  A loading script validates the files… and refuses to write anything if a single check fails."*
- `src/app/methodology/page.tsx:72-73` — *"**Nothing is estimated, interpolated, or carried forward
  to fill a hole.**"*
- `src/app/methodology/page.tsx:246-248` — *"This list is generated from the same database the
  charts read, so **it cannot drift out of sync with them**."*
- `src/app/page.tsx:73-74` — *"Free, no login, no advice — just the numbers, including the ones
  where a simple index fund wins."*

**Why it matters.** Three separate reasons, and the third is the one I would put in front of
counsel:

1. **Absolutes are a higher bar to defend than qualified claims.** "Nothing is estimated" and "it
   cannot drift out of sync" are engineering statements offered to consumers as guarantees. If any
   single figure turns out to be mis-transcribed — which is a live possibility for a hand-curated
   624-row dataset, and which the project itself concedes is not mechanically checkable
   (`CONSTITUTION.md:17`: *"that a cited document actually **contains** the figure is not
   mechanically checkable and remains the curator's obligation — a green `seed:dry` is not an
   Article 2 clearance"*) — the error is measured against an absolute rather than a
   reasonable-efforts standard.
2. **One claim is already in tension with disclosed reality.** The narrative blurbs state
   growth figures flatly across documented measurement-basis seams. `src/lib/blurbs.ts:25` says
   Harvard's endowment was *"$19.1 billion in FY2000, $56.9 billion by FY2025"* — but
   `src/app/methodology/page.tsx:130-139` and `data/README.md:474-484` disclose that FY2000–FY2006
   and FY2010 are the University's audited net-asset figures while FY2007–FY2009 and FY2011+ are
   HMC's endowment values, running 0.4–0.8% lower. Similarly `src/lib/blurbs.ts:35` gives MIT's
   *"growing from $6.5 billion to $27.4 billion"* across the FY2006/FY2007 restatement seam noted
   at `data/README.md:290-293`. Both seams are honestly disclosed *elsewhere*; neither is
   qualified at the point the blurb states the number. This is arguably the project's own
   Article 4 (`CONSTITUTION.md:21`: *"Never present data from two different measurement bases as
   one continuous series without a visible caveat at the point of display"*) — I flag it here
   because "we said nothing is estimated and every number is exact" plus "these two figures are on
   different bases" is precisely the pairing a complainant would put side by side.
3. **No contact route converts every other finding into a formal one.** A university that wanted a
   disclaimer added, a data provider that wanted a citation changed, a reader who found a typo, and
   a data subject exercising GDPR rights all have the same options today: do nothing, or escalate
   formally. A published email address is the single highest-leverage risk reducer in this
   document, because it turns letters into emails.

**The question for the lawyer.**
1. Do the absolute accuracy claims create meaningful exposure (negligent misstatement, state UDAP)
   for a free informational site, or does the absence of compensation and reliance make this
   largely theoretical?
2. What qualifying language would you want — e.g. "believed accurate; errors are possible; report
   one here" — and does adding it undercut the site's honesty positioning in a way you'd advise
   against?
3. Should the owner publish a personal name and email, or is a role address behind a domain
   preferable for privacy reasons? (The owner is an individual; publishing a personal email has its
   own privacy cost that should be weighed.)
4. Does a published corrections policy help or hurt?

**Interim mitigation, today.**
1. Publish a contact address. Even a forwarding alias in the footer strip
   (`src/app/layout.tsx:81-96`) beats nothing, and it should be reachable for corrections,
   trademark, licensing and privacy requests alike.
2. Soften the two absolutes: `src/app/methodology/page.tsx:72-73` becomes *"Nothing is estimated,
   interpolated, or carried forward to fill a hole — that is the rule, and hand transcription can
   still go wrong. If you find a number that doesn't match its cited source, tell us and it will be
   corrected or removed."* Same for the "cannot drift out of sync" claim at `:247`.
3. Add the basis caveat at the point of display in the two blurbs — `src/lib/blurbs.ts:25` and
   `:35` — e.g. "(the FY2000 and FY2025 figures come from two slightly different published bases;
   see methodology)". This closes the Article 4 tension *and* the accuracy-claim tension in one
   edit.
4. Add a short "Corrections" section to `/methodology` saying how errors are reported and that
   corrections are made by re-curating the source data.

---

## F8 — Copyright: mostly clean, with three specific residuals

**Assessment.** The brief asked how much is reproduced and whether any verbatim text or table
*structure* is copied rather than data points. Having read the data layer, my non-lawyer read is
that **this is the best-defended area of the site**, and I would not have a lawyer spend much time
here beyond the three items below.

What was measured: 349 allocation rows + 128 endowment-return rows + 147 benchmark rows = **624
curated figures** across 96 cited sources. That is a substantial extraction. But:

- **No source table structure is reproduced.** Every figure is re-expressed into this project's own
  8-category normalized scheme (`data/README.md:21-35`), which required substantive editorial
  judgment documented at length — Yale's three label regimes (`:37-62`), Harvard's two disclosure
  regimes (`:64-115`), Princeton's equity-taxonomy change and the overlap-verified merge
  (`:354-390`), MIT's forced merges (`:190-196`). The output is the project's arrangement, not the
  schools'.
- **The presentation is independent.** Charts and tables are the project's own
  (`src/components/charts/**`); source documents are linked, not embedded or mirrored
  (`src/app/methodology/page.tsx:253-259`).
- Under *Feist Publications v. Rural Telephone Service*, 499 U.S. 340 (1991) — as I understand it,
  as a non-lawyer — the individual percentages and returns are unprotectable facts, and the
  schools' own selection/arrangement is what would carry thin protection. This project did not copy
  that arrangement; it built its own and documented why.

**Three residuals worth a sentence from counsel:**

1. **Short verbatim quotations are rendered publicly.** `src/app/methodology/page.tsx:266` renders
   each source's `notes` field to users, and 17 of the 73 populated notes contain verbatim
   quotations from the source documents — e.g. `data/sources.json` `hmc-annual-report-2025`:
   *"As of June 30, 2025, the portfolio composition was as follows"*; `hmc-annual-report-2018`:
   *"Asset Class July 1, 2017 Allocation HMC Return"*; `smc-annual-financial-report-2001`:
   *"Endowment, end of year"*. Each is a phrase to a single sentence, quoted to establish the
   as-of dating evidence. This looks like textbook de minimis quotation for a factual purpose, but
   it is the only place verbatim source *text* reaches a user.
2. **`sourceLabel` preserves the schools' own line-item wording** (`data/README.md:35`) — e.g.
   *"Independent Return"*, *"Marketable Alternatives"*. Short phrases, and I verified via `grep`
   that `sourceLabel` is **never rendered to a user** (it appears only in
   `src/lib/queries.ts:38,107`, `src/lib/db/schema.ts:47` and test fixtures). Non-issue, recorded
   so nobody re-opens it.
3. **`bench-vt`'s cross-check cites two third-party sites** (`data/sources.json:960`:
   financecharts.com, portfolioslab.com) as verification, not as data. Fine as attribution;
   mentioned only for completeness.

**The question for the lawyer.** Do the 17 short verbatim quotations rendered at
`src/app/methodology/page.tsx:266` stay within fair use / de minimis, given they are single phrases
quoted to evidence a dating decision? Is 624 extracted figures from 96 documents a volume that
raises any concern beyond *Feist*, e.g. under a European database right if the site is treated as
addressing EU users?

**Interim mitigation, today.** None needed. Optionally add a line to `/methodology` noting that
figures are facts extracted from cited public documents, that the categorisation and presentation
are the project's own, and that source documents remain the property of their publishers.

---

## Already handled well — please do not spend time here

Listed so the lawyer can skip past them. Each is verified, not asserted.

1. **The site-wide disclaimer really is site-wide, including 404 and the error boundary.** It lives
   in the root layout (`src/app/layout.tsx:79-97`) rather than per-page, so it cannot be missed on
   a new route. I fetched `/`, `/compare`, `/methodology`, `/glossary` and
   `/translate?school=yale&year=2020` live and found the disclaimer string in every one, and the
   live 404's HTML carries it too. `src/app/error.tsx:3-4` documents that this was deliberate. The
   gap in F2 is *content and prominence*, not presence.
2. **No personalization exists, at all.** No accounts, no login, no cookies set by the site, no
   user input beyond URL query parameters, no risk questionnaire, no stored preferences. Output is
   a pure function of the URL (`src/app/translate/page.tsx:74`,
   `src/app/compare/page.tsx:65`), identical for every visitor. This is the strongest single fact
   supporting the impersonality prong in F3, and it is architectural rather than a matter of copy.
3. **No monetization of any kind.** No ads, affiliate links, donations, sponsorship or paid tier;
   `PRD.md:50` excludes monetization from scope. This, not the disclaimer, is what most likely
   keeps the Advisers Act's definitional threshold out of reach — see F3, including the warning
   about how fragile it is.
4. **Logos and seals were deliberately avoided, and the decision is on the record.**
   `src/lib/school-theme.ts:3-6`; `TASKS.md:338`; and `TASKS.md:353` records that the human was
   offered the real crests, understood the trade-off, and declined. F1 is about the *missing
   disclaimer* and the gradient-as-brand-signature, not about logo misuse.
5. **The no-fees/no-taxes/rebalancing assumptions are disclosed clearly and repeatedly**, in plain
   English, and in a well-placed amber panel that sits *above* the performance chart rather than
   below it (`src/app/translate/page.tsx:36-68`, and again at `:372`,
   `src/app/compare/page.tsx:210`, `src/app/methodology/page.tsx:196-197`). The "what a copycat
   cannot replicate" list (access to closed private funds, tax status, time horizon, professional
   staff) is more candid than most commercial equivalents.
6. **The unreplicable share of each portfolio is quantified rather than hidden.** Hedge funds and
   private equity have no ETF stand-in and the site says so, states the exact percentage left out,
   and volunteers that it is *"roughly half the endowment"* for a Yale-style portfolio
   (`src/app/methodology/page.tsx:199-207`, `src/app/translate/page.tsx:354-361`,
   `data/proxy_mappings.json:46,54`). Refusing to substitute a lookalike index and saying so is a
   meaningful anti-deception posture.
7. **Gaps in the underlying data are labelled at the point of display, not buried.** Stanford's
   missing allocation and return series get a full explanatory block on its own page
   (`src/app/explore/[school]/page.tsx:189-202`, `:212-225`) plus a methodology section
   (`src/app/methodology/page.tsx:141-157`); target-vs-actual and pool-vs-endowment basis breaks
   are annotated on the charts themselves (`src/components/charts/AllocationChart.tsx:71-104`,
   `:219-258`) and in the Translator (`src/app/translate/page.tsx:271-283`); Princeton's missing
   return years render as *"not computable"* rather than being bridged
   (`src/app/compare/page.tsx:255`).
8. **Every finance term is defined in one place and surfaced inline.** `src/lib/glossary.ts` (20
   terms) feeds both the `<Term>` inline bubble and `/glossary`, so a definition cannot drift
   between them. `/glossary` closes with *"These are explanations of words, not recommendations
   about them"* (`src/app/glossary/page.tsx:53-55`) — a nice touch.
9. **Full source transparency.** All 96 sources are listed with publisher, page and access date,
   generated from the same database the charts read
   (`src/app/methodology/page.tsx:244-269`). External source links carry
   `rel="noopener noreferrer"` (`:254`).
10. **The project's own governance already identifies most of this as reserved.**
    `CONSTITUTION.md:44` reserves site-level advice framing, terms of use, and data licensing to
    the human; `:47` reserves Vercel dashboard settings. The gaps in this briefing are
    *un-exercised* reserved decisions, not decisions made badly — which should make them
    straightforward for counsel to close.

---

## Suggested sequence for the owner

Not legal advice; a practical ordering of the interim mitigations above.

| # | Action | Addresses | Cost |
|---|---|---|---|
| 1 | Publish a contact email in the footer | F7, and de-escalates F1/F5/F6 | minutes |
| 2 | Add the not-affiliated sentence to the footer + `/methodology` | F1 | minutes |
| 3 | Add "hypothetical / past performance" language to the footer and the fine print; render the fine-print panel on `/compare` too | F2 | ~1 hour |
| 4 | Publish `/privacy`; decide consciously whether Speed Insights stays on; reconcile `TASKS.md:306` with the live state | F6 | ~1 hour |
| 5 | Soften the two absolute accuracy claims; add the basis caveat to the Harvard and MIT blurbs; add a Corrections section | F7 | ~1 hour |
| 6 | Reword the five `rationale` sentences and `data/README.md:629` out of purchase-reason framing | F3 | ~1 hour |
| 7 | Publish a placeholder `/terms` for counsel to replace | F4 | ~1 hour |
| 8 | Re-source the benchmark series to each provider's own published returns; add the data-provenance line to `/methodology` | F5 | ~half a day + one re-seed |
| 9 | **Do not monetize until F3 Q4 and F5 Q1 are answered.** | F3, F5 | free |

Items 2, 3, 4, 5, 7 touch site-level legal framing, which `CONSTITUTION.md:44` reserves to the
human — the owner should make these edits or explicitly authorize them, rather than a session
adopting them on its own initiative.
