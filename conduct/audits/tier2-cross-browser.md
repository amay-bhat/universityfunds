# Tier-2 Cross-Browser Audit — University Endowment Investing Explorer

**Audited:** 2026-08-05
**Subject:** `https://universityfunds.vercel.app` (live production), source at
`/Users/amayb/Projects/dashboardProject`
**Reusable harness:** `scripts/verify-cross-browser.mjs` (dual-engine by design; only the Chrome
adapter could be exercised — see coverage). Control experiment: `scripts/xb-debug.mjs`.
Raw measurements: `conduct/audits/data/xb-chrome-*.json`. Screenshots: `conduct/audits/screens/`.

> ## ⚠️ READ THIS FIRST: ONLY CHROMIUM WAS TESTED
>
> This audit set out to compare three engines. **It tested one.** Every measurement below comes
> from Blink (Chrome 150). **Gecko was not tested. WebKit was not tested.** Nothing in this
> document is evidence about Firefox or Safari behaviour.
>
> That is a real and material gap, because the defect this audit was commissioned to hunt — a
> scroll container that only Chrome makes keyboard-reachable — is by definition invisible in the
> only engine available. Findings 1 and 2 below are therefore **Chrome-side evidence of a
> Chrome-only dependency**, which is strong (a control experiment isolates the mechanism), but it
> is not the same as watching the failure happen in Firefox or Safari.

---

## Coverage: what was actually tested

| Engine | Version | Tested? | How / why not |
|---|---|---|---|
| **Blink** (Chrome) | 150.0 headless | **YES — fully** | `puppeteer-core` + CDP. 13 routes × 4 configurations (1280 px light, 1280 px dark, 375 px, 320 px) = 52 route-loads, plus a 10-width threshold sweep and a 4-condition control experiment. Needs no system permissions. |
| **Gecko** (Firefox) | — | **NO — not installed** | `/Applications/Firefox.app` does not exist. `puppeteer-core` cannot drive Gecko without the `firefox` product download; `playwright` is not in `node_modules` and is not a dependency. Testing Gecko requires installing either Firefox (~90 MB) or a Playwright browser bundle (~300 MB+ for the full set). **Not installed — flagged as a blocker rather than incurred silently.** |
| **WebKit** (Safari) | Safari 26.5.2 present | **NO — blocked by system permissions the user declined** | Three separate automation paths were attempted and all three failed on a permission gate. See below. |

### Why WebKit could not be driven (all three paths attempted, all failed)

| Path | Result |
|---|---|
| `safaridriver` W3C WebDriver | Driver starts and reports `{"ready":true}` on `/status`, but `POST /session` fails: `session not created: You must enable 'Allow remote automation' in the Developer section of Safari Settings`. |
| `safaridriver --enable` (to clear the above) | Prompts for the user's admin password; `Password is not valid`, exit 1. Not bypassable without the user. |
| `osascript` → `do JavaScript` | `You must enable 'Allow JavaScript from Apple Events' in the Developer section of Safari Settings.` |
| `screencapture` (screenshots only, no JS) | `could not create image from display` / `could not create image from window` — Screen Recording permission not granted. |

**On the record:** these attempts raised macOS Automation / Screen Recording permission dialogs on
the user's machine before the coordinator retracted the instruction to try them. The user declined
the prompts. Safari automation was then stopped and not retried; a Safari window opened during the
attempt was closed. **No Safari measurement of any kind exists in this audit.** Enabling those two
Safari Developer settings is a ~30-second user action that would make the entire harness run
against WebKit — `scripts/verify-cross-browser.mjs --engine safari` is written, complete, and
already handles WebDriver session setup, viewport compensation, key actions and screenshots.

### What "dark mode" coverage means here

Dark mode was tested **in Chrome only**, via CDP `Emulation.setEmulatedMedia`. The machine's system
appearance is Light (`AppleInterfaceStyle` unset), so even a permitted Safari run would have needed
a system-appearance change to cover dark mode.

---

## Verdict

The Chrome baseline is clean: **no page-level horizontal overflow at any width down to 320 px on
any of 13 routes**, `details`/`summary` behaves correctly on all 11 instances, all 11 sticky table
headers pin and paint opaquely, `paint-order: stroke` is honoured on all 5 annotation-label halos,
every `var(--series-N)` in an SVG presentation attribute resolves to a real colour, and the dark
scheme flips every token.

**The recent `tabIndex={0}` fix works — and is incomplete.** In `viz-shared.tsx` it is correct: all
11 chart table twins take a tab stop and scroll from the arrow keys, in both schemes and at every
width. But the fix was applied only to the chart twins. **Three page-level table wrappers on
`/translate`, `/methodology` and `/compare` were missed**, and two of them are keyboard-reachable in
Chrome *only* because of Chrome ≥127's implicit focusable scrollers — the exact mechanism whose
absence in Gecko and WebKit caused the bug found this week. A control experiment isolates the
mechanism conclusively. This is the same defect, in the same codebase, one file over.

The remaining Chrome-verified issue is a legibility one that is **worse**, not better, in any engine
that mishandles SVG text stroke: three schools' `last disclosed:` labels are drawn directly on top
of 3–4 full-height dark columns, and the *only* thing keeping them readable is the `paint-order`
halo.

Several risks named in the audit brief turned out, on inspection of the served CSS, to be
**non-issues** — `bg-clip-text` already ships the `-webkit-` prefix, and there are no viewport-height
units anywhere on the site. Those are recorded as cleared, with evidence, rather than repeated as
generic advice.

---

# CONFIRMED findings

All measured in Chrome against the live site. Severity reflects impact **if** the named engine
divergence holds — which for findings 1 and 2 is asserted, not observed.

---

## 1. `/translate` and `/methodology` table wrappers are keyboard-unreachable except in Chrome — HIGH

**Engine:** Chrome-verified dependency on a Chrome-only feature. Predicted failure in Gecko + WebKit.
**Routes:** `/translate?school=…&year=…` (any school/year), `/methodology`
**Source:** `src/app/translate/page.tsx:285`, `src/app/methodology/page.tsx:209`
**Screenshots:** `conduct/audits/screens/chrome-375-light-translate_school_yale_year_2020-top.png`,
`chrome-375-light-methodology-top.png`

Both wrappers are `<div className="overflow-x-auto rounded-lg border …">` with **no `tabIndex`**, and
they contain **no focusable descendant** — measured, not inferred:

| | `/translate` | `/methodology` |
|---|---|---|
| `tabindex` attribute | `null` | `null` |
| `el.tabIndex` property | `-1` | `-1` |
| focusable descendants | `0` | `0` |
| horizontal overflow @375 px | 331 px | 299 px |
| horizontal overflow @320 px | 386 px | 354 px |
| reached by sequential Tab in Chrome | **YES, stop 11** | **YES, stop 19** |
| arrow keys scroll it in Chrome | **YES, 0 → 80 px** | **YES, 0 → 80 px** |
| focus ring painted by Chrome | `outline: auto 1px rgb(0,95,204)` | same |

An element whose `tabIndex` property is `-1` receiving a sequential tab stop is the signature of
Chrome ≥127's *keyboard-focusable scrollers*. The control experiment
(`node scripts/xb-debug.mjs <url> 375`) isolates it — three conditions, identical results on both
routes, **no `tabindex` attribute touched in any condition**:

| Condition | Still a scroll container? | Container reached by Tab? |
|---|---|---|
| **A** — as shipped | yes | **YES** (stop 11 / stop 19) |
| **B** — `overflow-x` forced to `visible` | no | **NO** |
| **C** — one `<button>` injected as a descendant | yes | **NO** (the button takes that stop instead) |

B removes the tab stop by removing only the scrollability. C removes it by adding only a focusable
descendant. Together they pin the reachability to precisely the rule Chrome implements — *a scroll
container becomes focusable if and only if it has no keyboard-focusable descendant* — and to nothing
in the site's own markup. Gecko and WebKit do not implement that rule, so in those engines these
containers have no tab stop, no focus, and no way to be scrolled from the keyboard. The content
scrolled out of view is not decorative: on `/translate` the clipped columns are *"ETF stand-in"* and
*"Why this ETF — and what it misses"*, i.e. the entire point of the page.

**Threshold — who is affected** (measured, 10-width sweep):

| Route | Table `min-width` | Scrolls below viewport |
|---|---|---|
| `/translate` | `672px` (`min-w-[42rem]`) | **≈722 px** (no scroll at 768 px, scrolls at 700 px) |
| `/methodology` | `640px` (`min-w-[40rem]`) | **≈690 px** (no scroll at 700 px, scrolls at 675 px) |

So: every phone, tablets in portrait, split-screen and narrowed desktop windows — **and desktop
keyboard users at 400 % zoom**, since WCAG 1.4.10 reflow puts a 1280 px viewport at an effective
320 px, where the overflow is 386 px / 354 px.

**Fix.** Apply the treatment `viz-shared.tsx:81-86` already uses, to all three wrappers. The
`<caption className="sr-only">` on each table is already written and supplies the name:

```jsx
// src/app/methodology/page.tsx:209
<div
  className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
  tabIndex={0}
  role="group"
  aria-label="ETF proxy for each allocation category"
>
```

`/translate` (`:285`) → `aria-label={`${schoolName}'s FY${year} allocation translated into ETFs`}`;
`/compare` (`:221`) → `aria-label={`Annualized return and best/worst years, FY${from + 1}–FY${to}`}`.
An explicit `tabIndex` is engine-independent, which is the whole point: it does not rely on any
engine's implicit behaviour.

---

## 2. `/compare`'s table wrapper is the same defect, rescued only by accident — MEDIUM

**Engine:** Chrome-verified. Behaviour here is standard and should hold in Gecko/WebKit, but the
margin is one line of markup wide.
**Route:** `/compare` · **Source:** `src/app/compare/page.tsx:221`

Same shape — `overflow-x-auto`, no `tabIndex` (`tabIndex` property `-1`), 235 px of horizontal
overflow at 375 px, table `min-w-[36rem]`. But it contains **one** focusable descendant: the
`<Term t="annualized return">` button in the *"Annualized return"* column header
(`src/components/Term.tsx:175` renders a real `<button>`).

That single button changes everything, and measurement confirms both halves:

- Chrome gives the container **no** implicit tab stop (`reachedByTab=NO`) — consistent with the
  "no focusable descendant" condition proven in finding 1's condition C.
- Tabbing lands **inside** the container on that button at stop 15, and arrow keys then scroll the
  container **0 → 120 px**, because keyboard scrolling targets the focused element's nearest
  scrollable ancestor. That is standard behaviour, not a Chrome extension.

So `/compare` is currently operable in all three engines — **by coincidence**. Delete that `Term`,
move it out of the table, or wrap it in something non-focusable, and `/compare` silently becomes
finding 1. It also reads worse for a screen-reader user: the only way in is a tab stop that
announces itself as a glossary toggle, not as a scrollable table.

**Fix.** Same explicit `tabIndex={0}` + `role="group"` + `aria-label` as finding 1. Cheap, and it
stops the page's keyboard operability from depending on where a glossary term happens to sit.

---

## 3. Chart annotation labels are drawn over full-height dark columns and rely entirely on the `paint-order` halo — MEDIUM

**Engine:** Chrome-verified as marginal *even where `paint-order` works*. Degrades sharply in any
engine that does not honour it.
**Routes:** `/explore/yale`, `/explore/mit`, `/explore/princeton`
**Source:** `src/components/charts/AllocationChart.tsx:264-276`
**Screenshot:** `conduct/audits/screens/chrome-1280-light-explore_mit-chart.png`

`paint-order` works in Chrome — `CSS.supports('paint-order','stroke')` is `true`, the attribute
serialises as `paint-order="stroke"` and computes to `stroke` on all 5 halo labels. But the
measurement that matters is how many columns each label sits on:

| Route | Label | `fill` | Columns overlapped |
|---|---|---|---|
| `/explore/yale` | `last disclosed: FY2020` | `rgb(11,11,11)` (`--viz-text`) | **4** |
| `/explore/mit` | `last disclosed: FY2015` | `rgb(11,11,11)` | **3** |
| `/explore/princeton` | `last disclosed: FY2023` | `rgb(11,11,11)` | **3** |
| `/explore/harvard` | `targets through FY2016 →` | `rgb(82,81,78)` | 0 |
| `/explore/mit` | `investment pool through FY2004 →` | `rgb(82,81,78)` | 0 |

The three `last disclosed:` labels use `position="insideTopRight"`, which puts near-black text
directly on top of the tallest stack segments — dark blue `--series-1` and dark violet
`--series-7`. The only separation is a 3 px `--viz-surface` (`#fcfcfb`) stroke painted *behind* the
glyphs. The MIT screenshot shows this is already cramped in Chrome. The two `→` boundary labels sit
above the plot area (`position="top"`) and overlap nothing — the defect is confined to
`insideTopRight`, and is data-dependent exactly as the source comment at
`AllocationChart.tsx:238-242` warns.

Why this is a cross-engine item rather than pure visual polish: the default `paint-order` is
`fill, stroke, markers`, i.e. **stroke on top of fill**. In an engine that ignores `paint-order`,
that 3 px near-white stroke paints *over* the glyph, hollowing out near-black text into a pale
outline on a dark column — substantially less readable than no halo at all. The blast radius is a
3 px stroke on 11 px text, so the failure is dramatic rather than subtle.

**Fix (removes the engine dependency instead of trusting it).** Do not rely on a halo to separate
text from unrelated marks. Move the coverage-end label out of the plot area to sit beside its
reference line above the columns, as the two `→` labels already do (`position="top"`, which measures
0 overlaps on every school). If it must stay inside, give it a real painted `<rect>` backdrop rather
than a text stroke — a filled rect has no paint-order semantics to get wrong in any engine.

---

## 4. Sticky `<th>` uses the one combination WebKit is known to diverge on — LOW in Chrome, unverified elsewhere

**Engine:** Chrome-verified working. Named as a risk for WebKit under finding R2.
**Source:** `src/components/charts/viz-shared.tsx:95`
**Screenshot:** `conduct/audits/screens/chrome-1280-light-yale-sticky-midscroll.png`

All 11 sticky headers behave correctly in Chrome, in both schemes. Measured mid-scroll (container
scrolled 123 px of 246 px on `/explore/yale`): header offset from container top `0 px`, background
`rgb(252,252,251)` fully opaque, rows do not bleed through, `border-bottom: 1px solid` visible. The
screenshot confirms the header reads *"Fiscal year / US Public Equity / …"* while the body starts at
FY2005.

Recorded here because of *how* it is built, which is the part that travels badly:

- `position: sticky` on `<th>`, inside `table { border-collapse: collapse }` (measured:
  `borderCollapse: "collapse"`)
- `z-index: auto` (measured — the element has no stacking order of its own)
- the separator is `border-b` on the `<th>`, i.e. a **collapsed** border, which in the collapsed
  border model belongs to the *table*, not the cell

Chrome resolves all three favourably. The combination is the classic WebKit divergence (see R2).

**Fix (pre-emptive, no visual change in Chrome).** Give the sticky header its own stacking context
and a border that cannot be owned by the table:

```jsx
className="sticky top-0 z-10 bg-[var(--viz-surface)] px-2 py-1 text-left font-medium
           shadow-[inset_0_-1px_0_theme(colors.zinc.300)] dark:shadow-[inset_0_-1px_0_theme(colors.zinc.700)]"
```

An `inset` box-shadow renders identically under both border models and cannot be collapsed away.

---

## 5. Cleared, with evidence — items from the brief that are *not* problems

Recorded so they are not re-audited. Each was checked against the rendered page or the served CSS,
not the source.

| Brief item | Status | Evidence |
|---|---|---|
| `bg-clip-text` needs `-webkit-` prefix | **Cleared** | The served bundle (`/_next/static/chunks/0pz10nk3x8_kh.css`) emits **both** `-webkit-background-clip:text` and `background-clip:text`. Tailwind v4 / Lightning CSS handles this. Computed on the rendered `/` headline: `backgroundClip=text`, `webkitBackgroundClip=text`, `color=rgba(0,0,0,0)` — correct in both schemes. |
| Brief said the gradient is used in the header/footer signature | **Brief was wrong** | `SCHOOL_GRADIENT` (`school-theme.ts:39`) is a plain `background` on a 2 px `<div>` (`layout.tsx:120,147`) — no `background-clip` involved, so no prefix question. The only `bg-clip-text` on the site is the `/` headline span (`page.tsx:73`), 1 node total. |
| iOS `100vh` viewport behaviour | **Not applicable** | Zero viewport-height units on the site: `grep` for `h-screen`, `min-h-screen`, `100vh`, `100dvh`, `100svh`, `vh]` across `src/` returns nothing. There is no `100vh` layout to break. |
| `-webkit-text-size-adjust` | **Present** | Bundle emits `-webkit-text-size-adjust:100%` (Tailwind preflight); computed `100%` on `<html>`. iOS will not auto-inflate text. (This interacts with tap-target sizing — see R7.) |
| CSS custom properties as SVG presentation attribute values | **Works in Chrome** | `fill="var(--series-1)"` → computed `rgb(42,120,214)`; `stroke="var(--viz-surface)"` → `rgb(252,252,251)`. Resolves on all 42 bar paths. Dark scheme flips to `rgb(57,135,229)`. Still listed as R3 because this is the divergence area named in the brief and Chrome is not evidence for the others. |
| `details`/`summary` | **Works in Chrome** | 11/11 instances: `display: list-item`, `cursor: pointer`, `list-style-type: disclosure-closed`, and opening reveals the body (measured height change, e.g. 20 px → 348 px). |
| Layout at 375 px and 320 px | **No overflow** | `documentElement.scrollWidth <= clientWidth` on **all 13 routes at both widths**, and at 1280 px in both schemes. The only horizontal scrolling is inside declared `overflow-x-auto` containers, which is intended. |
| Dark mode / `color-scheme` | **Works in Chrome** | `.viz-root` computes `color-scheme: dark`; all 8 `--series-*` and all 5 `--viz-*` tokens flip; `body` background `rgb(10,10,10)`. |

---

# REASONED RISKS — UNVERIFIED

**Everything in this section is an argument, not a measurement.** No Gecko or WebKit was run. Each
item names the specific feature, the engine, and the Chrome observation it is extrapolating from.
Ordered by expected value of checking it.

---

### R1. Implicit focusable scrollers — Gecko, WebKit — *confidence: very high*

**Feature:** Chrome ≥127 "keyboard-focusable scrollers".
**Grounded in:** findings 1 and 2, and specifically the A/B/C control experiment, which shows two
shipped containers taking a tab stop while their `tabIndex` property reads `-1`, and losing it the
moment scrollability or descendant-focusability changes.
**Expected in Gecko/WebKit:** no tab stop, no focus, no keyboard scrolling on
`/translate` and `/methodology` below ~720 px / ~690 px. **WCAG 2.1.1 (A) failure.**
**Check:** load `/methodology` at 375 px, press Tab ~19 times, confirm nothing focuses the ETF
table, confirm arrow keys do not scroll it. This is the audit's highest-value unverified item and
the same class as the bug already found this week.

### R2. `position: sticky` on `<th>` with `border-collapse: collapse` and `z-index: auto` — WebKit — *confidence: medium*

**Grounded in:** finding 4's measurements — `position: sticky` on `<th>`, `borderCollapse:
"collapse"`, `zIndex: "auto"`, separator supplied by a collapsed `border-b`.
**Two distinct failure modes to look for, not one:**
1. **Sticky ignored.** WebKit did not support `position: sticky` on `<th>`/`<thead>` under the
   collapsed border model until relatively recently. Symptom: the header scrolls away with the body.
2. **Sticky works, border does not.** Under `border-collapse: collapse` the border belongs to the
   table, so a pinned cell can travel without its `border-bottom`, and with `z-index: auto` the
   header may not paint above the scrolling rows. Symptom: header text over row text, no separator.
**Check:** open any chart's *"View this chart as a table"*, scroll the inner container half way,
compare against `conduct/audits/screens/chrome-1280-light-yale-sticky-midscroll.png`. Applies to all
11 table twins. Finding 4's `inset` box-shadow fix pre-empts both modes.

### R3. `var()` in SVG presentation attributes — Gecko, WebKit — *confidence: low probability, high severity*

**Grounded in:** every chart colour is delivered this way. `chart-theme.ts:39` returns the string
`var(--series-N)`, which recharts writes as the SVG **attribute** `fill="var(--series-1)"` (not a
CSS declaration) on 42 bar paths per allocation chart, plus `stroke="var(--viz-surface)"` for the
1 px column separators and `stroke="var(--viz-axis)"` on the reference lines.
**Why it is on the list:** the brief names this as a known divergence area, and Chrome cannot speak
for the others. All three engines are expected to resolve `var()` in presentation attributes per
spec.
**Failure mode if not:** an unresolvable `fill` attribute falls back to the initial value, **black**.
Every chart on the site renders as solid black columns — total loss, immediately obvious.
**Check:** load `/explore/yale` and confirm the columns are coloured. Ten seconds, and it is
cheap insurance against a catastrophic mode.

### R4. `paint-order: stroke` on SVG `<text>` — Gecko, WebKit — *confidence: low probability, high severity where it lands*

**Grounded in:** finding 3 — 5 labels carry a 3 px stroke halo, and 3 of them sit on 3–4 dark
columns with near-black `fill`.
`paint-order` is long-supported in both Gecko and WebKit, so this most likely just works; the
residual exposure is old WebKit (iOS ≤10). Listed because the *consequence* is disproportionate: the
default order paints stroke over fill, hollowing out the three `last disclosed:` labels precisely
where they overlap columns. Finding 3's fix removes the dependency rather than betting on it.
**Check:** `/explore/mit` and `/explore/yale`, top-right of the allocation chart.

### R5. SVG text metrics and legend wrapping — Gecko, WebKit — *confidence: medium for cosmetic drift, low for breakage*

**Grounded in:** measured glyph advances in Chrome — `"last disclosed: FY2015"` is exactly
110.7 px at `font-size: 11px`, `"investment pool through FY2004 →"` is 173 px. `globals.css:25` sets
`font-family: Arial, Helvetica, sans-serif` on `body` (this **overrides** the `--font-geist-sans`
`@theme` token for chart text), and recharts measures text in JS to lay out the wrapping legend.
**Why engines differ:** advance widths depend on the font actually resolved (Arial vs Helvetica vs
Liberation Sans) and on each engine's subpixel advance rounding. The Chrome run shows the legend
already wrapping to 2 lines at 1280 px on `/explore/mit` and the annotation labels reaching
`x=899` of a 942 px surface — 43 px of headroom. Modest metric drift could push a label past the
right edge or add a legend line that changes the chart's height.
**Check:** compare legend line count and confirm no annotation label is clipped at the SVG's right
edge, at 1280 px and 375 px. Probe field `clippedRight` in the JSON automates the assertion —
currently `false` everywhere in Chrome.

### R6. Tailwind v4's `lab()` palette, `color-mix()`, and its engine-targeted `@supports` fallback — Gecko, WebKit — *confidence: low, cosmetic*

**Grounded in:** the served CSS, inspected directly. The entire default palette is emitted inside
`@supports (color: lab(0% 0 0))` (e.g. `--color-sky-700: lab(41.6013 -9.10804 -42.5647)`), the
translucent surfaces are emitted inside `@supports (color: color-mix(in lab, red, red))` — and this
includes **meaning-adjacent** styling: the chart tooltip (`bg-white/95`, `dark:bg-zinc-900/95`,
`ring-zinc-900/10`) and `/translate`'s *"honest gap"* row tint (`bg-zinc-50/60`,
`dark:bg-zinc-900/40`). The bundle also carries Tailwind's explicit old-Safari/old-Firefox hack,
`@supports (((-webkit-hyphens:none)) and (not (margin-trim:inline))) or ((-moz-orient:inline) and
(not (color:rgb(from red r g b))))`, which back-fills `--tw-*` custom-property defaults for engines
without `@property`.
**Expected:** current Firefox and Safari take the modern branch and match Chrome. Older ones take
the fallback: opaque instead of translucent surfaces and slightly different hues. Cosmetic, except
that the `/translate` gap-row tint is a meaning channel — though the row also says *"none — an
honest gap"* in text, so no information is lost.
**Check:** `/translate` gap rows and a chart tooltip. Low priority.

### R7. iOS Safari specifics — *reasoned from Chrome measurements, no device tested*

- **Tap targets.** Measured in Chrome: header nav links are **20 px tall** (`Explore` 47×20,
  `Methodology` 80×20), the footer `sources & methodology` link is 125×**14**, and `Term` buttons
  are ~78×21. All are below the 44×44 iOS guidance and below WCAG 2.5.8's 24×24. This is *not* an
  engine divergence — Chrome measures the same — but it is amplified on iOS because
  `-webkit-text-size-adjust: 100%` (confirmed in the bundle) tells iOS **not** to inflate text, so
  these stay physically small on a phone. Fix: vertical padding on nav/footer links.
- **Scroll chaining in the table containers.** Measured `overscroll-behavior: auto` (never set) and
  `-webkit-overflow-scrolling` unset on all scrollers. Modern iOS gives `overflow: auto` momentum
  scrolling by default, so no `-webkit-overflow-scrolling: touch` is needed. But with up to
  **11 nested scrollers** on a school page, a horizontal swipe that reaches the end of a table
  chains to the page. `overscroll-behavior-x: contain` on the wrappers would stop that. Cosmetic.
- **`100vh`** — not applicable, see finding 5. No viewport-height units exist on the site.

---

## Method notes and discarded measurements

Recorded so the numbers above can be trusted, and so two harness bugs are not mistaken for findings.

1. **Discarded: "focused scrollers do not respond to arrow keys in Chrome."** The first sweep
   reported `keyboardScrolled=false` on every table twin. This was a harness race — the probe read
   `scrollTop` immediately after the synthetic key events, before the scroll was applied. A 400 ms
   settle (`verify-cross-browser.mjs`) fixed it, and a direct test confirmed real values
   (`ArrowDown` → 40 px, `PageDown` → 246/280 px, `End` → 246/355 px). **The `tabIndex={0}` fix is
   not defective.**
2. **Discarded: "`/methodology`'s wrapper is not tab-reachable."** The control experiment's first
   version reused one page across conditions. Blurring an element leaves Chrome's *sequential focus
   navigation starting point* on it, so subsequent Tabs resume **after** it rather than from the top
   — which made a reachable element look unreachable and silently invalidated conditions B and C.
   Rewritten to load a fresh page per condition; both routes then agreed with the sweep. Anyone
   extending `xb-debug.mjs` should keep the fresh-load-per-condition structure.
3. **Fixed mid-audit: SVG selector.** `.recharts-surface` also matches the 14×14 legend swatch SVGs.
   The first run measured six empty icons per page and reported `bars=0, halos=0`. Narrowed to
   `.viz-root .recharts-wrapper > svg.recharts-surface`.
4. **Screenshots are viewport-anchored, not full-page**, at two fixed scroll positions (`-top`,
   `-chart`) — chosen for parity with Safari's WebDriver screenshot endpoint, which is viewport-only.
   That parity is now moot but the images are consistent.
5. `--force-device-scale-factor=1`, `deviceScaleFactor: 1`; dark mode via
   `page.emulateMediaFeatures([{name:'prefers-color-scheme', value:'dark'}])`.
6. Overflow offender detection deliberately ignores elements inside an ancestor with
   `overflow-x: auto|scroll|hidden`, so intended table scrolling is not reported as page overflow.

### Reproducing

```bash
node scripts/verify-cross-browser.mjs --engine chrome --width 1280            # baseline
node scripts/verify-cross-browser.mjs --engine chrome --width 1280 --dark
node scripts/verify-cross-browser.mjs --engine chrome --width 375
node scripts/verify-cross-browser.mjs --engine chrome --width 320
node scripts/xb-summarize.mjs conduct/audits/data/xb-chrome-375-light.json    # human-readable
node scripts/xb-debug.mjs https://universityfunds.vercel.app/methodology 375  # A/B/C control

# Blocked: needs Safari > Settings > Developer > "Allow Remote Automation"
# node scripts/verify-cross-browser.mjs --engine safari --width 1280
```

---

## Recommended order of work

1. **Finding 1** — `tabIndex={0}` + `role="group"` + `aria-label` on the three page-level table
   wrappers (`translate/page.tsx:285`, `methodology/page.tsx:209`, `compare/page.tsx:221`).
   Three lines each, no visual change, closes a WCAG 2.1.1 failure on two routes and removes
   `/compare`'s accidental dependency (finding 2). **Do this without waiting for Gecko/WebKit
   access** — an explicit `tabIndex` is correct regardless of which engine is right.
2. **Finding 3** — move the `last disclosed:` label out of the columns (`position="top"`, matching
   the two boundary labels that already measure 0 overlaps). Fixes a legibility problem that is
   already marginal in Chrome and removes the `paint-order` dependency (R4).
3. **Finding 4** — swap the sticky header's collapsed `border-b` for an `inset` box-shadow and add
   `z-10`. Pre-empts both WebKit sticky modes (R2) at zero visual cost in Chrome.
4. **Then get an engine.** Enabling Safari's two Developer settings turns the existing
   `--engine safari` adapter on and would convert R1–R5 from arguments into measurements in one
   run. Failing that, installing Firefox is the cheaper of the two Gecko options. **Until one of
   those happens this site has no verified cross-browser coverage at all** — this audit narrows
   *where* to look, but it cannot substitute for looking.
