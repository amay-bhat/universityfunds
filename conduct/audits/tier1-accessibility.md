# Tier-1 Accessibility Audit — University Endowment Investing Explorer

**Audited:** 2026-08-05
**Subject:** `https://universityfunds.vercel.app` (live production), source at
`/Users/amayb/Projects/dashboardProject`
**Method:** `puppeteer-core` driving installed Chrome 150.0.7871.187 against the live production build. Every
claim below was measured in a rendered document — Chrome-computed accessible names via CDP
`Accessibility.getFullAXTree` (never a hand-rolled `accName`), focus indicators from screenshot
pixel diffs, contrast from `getComputedStyle` with real alpha compositing and `lab()` colours
resolved through a canvas, reflow from real 320 px and 320×256 viewports.
**Reusable harness:** `scripts/verify-a11y.mjs` (`npm run verify:a11y`), exits non-zero on failure.
**Checks run:** **391 automated assertions** across 13 routes in the final harness run, plus ~35
targeted probe measurements written to distinguish real defects from harness artefacts (four
first-pass "failures" turned out to be measurement bugs and were discarded — see *Discarded* at the
end). Final harness output: **85 failing assertions and 31 warnings**, which triage to **12 distinct
confirmed defects** (the same defect repeats across 5 school pages and 11 chart instances) plus 2
items recorded as suspected. The harness gates on the 12; the browser-dependent and arguably-exempt
items are emitted as non-gating warnings.

**Baseline:** Lighthouse scores 100/100 on accessibility for all five representative routes. Nothing
below is something Lighthouse or axe-core's default rule set reports.

---

## Verdict

The hand-written HTML on this site is unusually good: heading hierarchy is unbroken on all 13
routes, landmarks are unique and named, the skip link works, `<Term>` is a correctly built
toggletip, every chart really does ship a `<caption>`-bearing table twin, reflow is clean at 320 px
and at 400 % zoom, there is no motion to suppress, and no meaning rides on colour alone. Almost
every real defect is concentrated in one place: **the Recharts SVG and its generated ARIA**. Because
`recharts@3.10.1` turns `accessibilityLayer` on by default, all 11 chart instances put an unnamed
`role="application"` node into the accessibility tree — a role that switches screen readers out of
browse mode — and then fill it with 22–31 loose `StaticText` nodes reading `'00 '01 '02 … 0% 25% 50%
75% 100%`, while the legend swatches announce raw database identifiers like
`"absolute_return legend icon"`. The claimed relief mechanism, the table twin, is real and present
on every chart, but it is only half-marked-up: not one of the eight data tables on the site gives
its rows a `<th scope="row">`, so a screen-reader user who reaches the twin gets a percentage with a
column header and no idea which fiscal year it belongs to. Beyond the charts there are two genuine
colour defects (light-mode axis labels at 3.50:1; the reference-line colour that carries
"last disclosed: FY2020" at 1.75:1) and one focus/announcement gap on `/translate`. Fixing findings
1–5 would remove roughly 90 % of the measured harm and needs edits in only three files.

---

# CONFIRMED findings

Ordered most severe first. Every one was reproduced against the live site.

---

## 1. All 11 charts expose an unnamed `role="application"` node, which turns off the screen-reader virtual cursor

**What is wrong.** `recharts@3.10.1` defaults `accessibilityLayer: true`
(`node_modules/recharts/es6/chart/CartesianChart.js:24`), which makes the plot `<svg>` render as
`role="application" tabindex="0"` with **no accessible name**
(`node_modules/recharts/es6/chart/Sankey.js:874` — `role = accessibilityLayer ? 'application' : undefined`).
Measured on the live site:

```
.recharts-wrapper > svg.recharts-surface
  role="application"  tabindex="0"  aria-label=null  aria-roledescription=null
  aria-activedescendant=null  aria-hidden=null
```

`role="application"` is an instruction to assistive technology to stop intercepting keys and hand
everything to the widget — NVDA and JAWS leave browse mode, so the virtual cursor, heading
navigation and table navigation all stop working inside it. It is only appropriate for a widget that
implements its own full keyboard model and names itself. This one does neither: the accessible name
is the empty string, so a screen reader announces "application" and nothing else.

It is also in the tab order on every route, so every keyboard user must Tab through 1–2 of these per
page (verified: the harness tab walk lands on it, and it does paint a focus ring — `outline: rgb(0,
95, 204) auto 5px`, pixel-diff confirmed, so 2.4.7 is fine).

**Where.** `src/components/charts/AllocationChart.tsx:130`,
`src/components/charts/ReturnsChart.tsx:69`, `src/components/charts/GrowthChart.tsx:68`,
`src/components/charts/MarketValueChart.tsx:42` — every `<ResponsiveContainer>`. Reproduced on
`/explore/yale` (2), `/explore/harvard` (2), `/explore/stanford` (1), `/explore/mit` (2),
`/explore/princeton` (2), `/compare` (1), `/translate?school=yale&year=2020` (1) = 11 instances.

**Fails.** WCAG 4.1.2 Name, Role, Value (A) — a role is exposed that misdescribes the element and
carries no accessible name. Also 1.3.1 Info and Relationships (A), because the role destroys the
structure the rest of the page provides.

**Fix.** Pass `accessibilityLayer={false}` to every chart root (`<BarChart>`, `<ComposedChart>`,
`<LineChart>`), then hide the decorative plot from AT and let the table twin be the accessible path.
In `viz-shared.tsx`'s `ChartFrame`, wrap `{children}` so the visual chart is `aria-hidden`:

```tsx
<div className="mt-3" aria-hidden="true">{children}</div>
```

This is consistent with the design intent already documented in `viz-shared.tsx:5-11` ("every chart
ships a table-view twin (values reachable without hover)"). If you would rather keep the SVG
exposed, give it `role="img"` plus an `aria-label` that states the takeaway, but do not leave
`role="application"`.

---

## 2. Chart axis labels leak into the accessibility tree as an unstructured stream of numbers

**What is wrong.** Inside that unnamed `application` node, the Recharts `<text>` elements are fully
exposed. Dumped from the live tree on `/explore/yale`, the children of the first `application` node
are exactly:

```
"'00" "'01" "'02" "'03" "'04" "'05" "'06" "'07" "'08" "'09" "'10" "'11" "'12"
"'13" "'14" "'15" "'16" "'17" "'18" "'19" "'20" "0%" "25%" "50%" "75%" "100%"
"last disclosed: FY2020"
```

That is what a screen-reader user hears where the chart should be: 27 orphaned strings with no
indication that they are axis ticks, no association to any value, and no way to tell that `'00` is a
fiscal year and `25%` is a scale mark. Counts measured per chart: 27 (allocation), 31 (returns), 31
(market value), 31 (compare growth), 11 (translate growth), 22 (MIT allocation), 25 (Princeton
allocation) — **~250 loose `StaticText` nodes across the seven chart routes.**

**Where.** Same four `ResponsiveContainer` call sites as finding 1. The `<text>` nodes come from
`XAxis`/`YAxis`/`Label` (e.g. `AllocationChart.tsx:133-155`, `:218-226`, `:241-252`, `:257-265`).

**Fails.** WCAG 1.3.1 Info and Relationships (A) — presentational scaffolding is presented to AT as
content with no relationships. Arguably also 1.1.1 Non-text Content (A): the chart is a non-text
graphic whose text alternative is the table twin, so the decorative internals should be hidden.

**Fix.** Same as finding 1 — `aria-hidden="true"` on the chart wrapper removes all of it in one
edit. (Setting `aria-hidden` on the individual `<text>` nodes is not possible through Recharts'
axis API, so hide the container.)

---

## 3. Not one of the eight data tables gives its rows a row header — the "table twin" relief is only half built

**What is wrong.** Every table on the site marks its column headers correctly (`<th scope="col">`,
verified on all 8) and every one has a real `<caption>`. But **every body row's first cell is a
`<td>`**, including the cell that identifies the row. Measured (`rowHeaders / bodyRows`, first-column
tag):

| Table | Rows | Row headers | First column is |
|---|---|---|---|
| Yale allocation twin | 21 | 0 | `<td>` "FY2000" |
| Yale returns twin | 26 | 0 | `<td>` "FY2000" |
| Harvard allocation twin | 14 | 0 | `<td>` |
| Harvard returns twin | 26 | 0 | `<td>` |
| Stanford market-value twin | 26 | 0 | `<td>` |
| MIT allocation twin | 7 | 0 | `<td>` |
| MIT returns twin | 26 | 0 | `<td>` |
| Princeton allocation twin | 18 | 0 | `<td>` |
| Princeton returns twin | 25 | 0 | `<td>` |
| `/compare` growth twin | 26 | 0 | `<td>` |
| `/compare` "The numbers" | 5 | 0 | `<td>` "Yale University (actual)" |
| `/translate` ETF table | 6 | 0 | `<td>` "US Public Equity" |
| `/methodology` proxy table | 7 | 0 | `<td>` "US Public Equity" |

The consequence is concrete: on Yale's allocation twin, a screen-reader user landing on the cell
`14.2%` in an 8-column × 21-row grid is told the column ("US Public Equity") and nothing about the
row, so the fiscal year — the entire point of the table — is unrecoverable without counting cells.
This is the single defect that most undermines the project's own accessibility claim, because the
table twin is documented as the relief mechanism for the charts (`viz-shared.tsx:8-10`).

**Where.**
- `src/components/charts/viz-shared.tsx:86-97` — the `ChartFrame` twin body renders every cell as
  `<td>`; it should special-case `j === 0`. This one edit fixes all 10 chart twins.
- `src/app/compare/page.tsx:243-250` — the portfolio-name cell.
- `src/app/translate/page.tsx:307` — the category-name cell.
- `src/app/methodology/page.tsx:221` — the category-name cell.

**Fails.** WCAG 1.3.1 Info and Relationships (A). Techniques H51 / H63.

**Fix.** In `viz-shared.tsx`, render the first column as a row header:

```tsx
{row.map((cell, j) =>
  j === 0 ? (
    <th key={j} scope="row" className="border-b border-zinc-200 px-2 py-1 text-left font-normal dark:border-zinc-800">
      {cell}
    </th>
  ) : (
    <td key={j} className="border-b border-zinc-200 px-2 py-1 tabular-nums dark:border-zinc-800">{cell}</td>
  ),
)}
```

and apply the same change to the three hand-written tables.

---

## 4. Legend swatches announce raw database column names

**What is wrong.** `recharts@3.10.1` puts `aria-label="{entry.value} legend icon"` on each legend
swatch `<svg>` (`node_modules/recharts/es6/component/DefaultLegendContent.js`), and `entry.value`
falls back to the `dataKey` when a series has no `name` prop. `AllocationChart` does not set `name`,
so the live accessibility tree on `/explore/yale` contains six `image` nodes named:

```
"absolute_return legend icon"      "fixed_income_cash legend icon"
"intl_public_equity legend icon"   "private_equity_vc legend icon"
"real_assets legend icon"          "us_public_equity legend icon"
```

Each is immediately followed by the correct human label as static text, so a screen reader reads
*"absolute_return legend icon, Absolute Return / Hedge Funds"* — internal snake_case identifiers
spoken aloud, doubled. Reproduced on all four school pages that have allocation data (6–8 swatches
each). `ReturnsChart`, `GrowthChart` and `/compare` pass `name`, so their swatches are merely
redundant rather than leaky ("S&P 500 legend icon", "60/40 legend icon").

**Where.** `src/components/charts/AllocationChart.tsx:186-207` — the `<Legend>` at `:186` and the
`<Bar dataKey={c}>` at `:193-201` with no `name` prop (unlike `ReturnsChart.tsx:122` and
`GrowthChart.tsx:115`, which do set it).

**Fails.** WCAG 1.1.1 Non-text Content (A) — a purely decorative colour swatch is given a text
alternative. Also 4.1.2, since the name is a machine identifier rather than the label the sighted
user sees.

**Fix.** The `aria-hidden` wrapper from finding 1 removes these too, since the legend lives inside
the chart container. If the legend must stay exposed, add `name={categoryLabel(c)}` to each `<Bar>`
in `AllocationChart.tsx:194` so at least no raw `dataKey` is spoken.

---

## 5. Arrowing through the chart with a keyboard produces a value that is never announced

**What is wrong.** Because `accessibilityLayer` is on, the plot `<svg>` is focusable and arrow keys
step through data points. Verified live on `/explore/yale`: focusing the plot and pressing
`ArrowRight` three times raises a tooltip reading
`"FY2003 20.9% Real Assets (Real Estate, Natural Resources) 14.9% Private Equity & Venture Capital …"`.
But the mechanism that would announce it does not exist:

```
aria-activedescendant : null      (nothing points at the active point)
tooltip in live region: false     (.recharts-tooltip-wrapper has no aria-live / role=status)
```

So the interaction is exactly wrong for the users it was meant for: it is *only* available by
keyboard, it *only* produces a visual tooltip, and the screen reader — already forced out of browse
mode by `role="application"` — is told nothing. The tooltip markup is not `aria-hidden`, so the
numbers do exist somewhere in the tree, but nothing directs assistive technology to them at the
moment they change.

**Where.** All 11 chart instances; the tooltip is rendered by
`src/components/charts/viz-shared.tsx:20-40` (`VizTooltipBox`) via the `<Tooltip content={…}>` props
at `AllocationChart.tsx:156`, `ReturnsChart.tsx:88`, `GrowthChart.tsx:89`, `MarketValueChart.tsx:60`.

**Fails.** WCAG 4.1.2 Name, Role, Value (A) — a value changes without any programmatic notification.
Also 4.1.3 Status Messages (AA).

**Fix.** Turn the half-implemented interaction off (`accessibilityLayer={false}`) rather than
finishing it; the table twin already delivers every value with full structure, which is the stronger
mechanism. If you keep it, the tooltip wrapper needs `role="status"` and the plot needs
`aria-activedescendant` pointing at a named, `id`-bearing node per data point.

---

## 6. Light-mode chart axis labels fail 1.4.3 at 3.50:1

**What is wrong.** Axis tick labels are painted with `--viz-muted` on `--viz-surface`. Measured on
the live site (alpha-composited, `lab()` resolved through canvas):

| Theme | Token | Colour | Surface | Size | Ratio | Required |
|---|---|---|---|---|---|---|
| **light** | `--viz-muted` | `#898781` | `#fcfcfb` | 11 px / 400 | **3.50:1** | 4.5:1 |
| dark | `--viz-muted` | `#898781` | `#1a1a19` | 11 px / 400 | 4.85:1 | 4.5:1 ✓ |

11 px at weight 400 is not large text under any reading of 1.4.3, so the threshold is 4.5:1. Every
year label and every percentage/dollar gridline label on every chart is affected. Reproduced on
`/explore/yale`, `/explore/harvard`, `/explore/stanford`, `/explore/mit`, `/explore/princeton`,
`/compare`, `/translate?school=yale&year=2020` — 292 text runs were measured per theme and this was
the **only** text failure in either theme.

**Where.** `src/app/globals.css:36` (`--viz-muted: #898781` in `.viz-root`). Consumed as
`tick={{ fill: "var(--viz-muted)" }}` at `AllocationChart.tsx:135` and `:144`,
`ReturnsChart.tsx:74` and `:81`, `GrowthChart.tsx:73` and `:80`, `MarketValueChart.tsx:47` and `:53`.

**Fix.** Either darken the light-mode token to at least `#6d6b66` (4.55:1 on `#fcfcfb`) — the dark
value already passes and needs no change — or point the ticks at `--viz-text-2` (`#52514e`, 7.73:1),
which is what the footnotes already use. Darkening `--viz-muted` is the smaller change and touches
one line.

---

## 7. The reference lines that carry "last disclosed: FY2020" and the zero baseline are drawn at 1.48–1.75:1

**What is wrong.** `--viz-axis` is not only the axis rule; it is also the stroke of every
`ReferenceLine` that carries real information on the chart, and of the zero line that separates gains
from losses. Measured against the chart surface:

| Theme | Token | Colour | Ratio | Required |
|---|---|---|---|---|
| light | `--viz-axis` | `#c3c2b7` | **1.75:1** | 3:1 |
| dark | `--viz-axis` | `#383835` | **1.48:1** | 3:1 |

The lines drawn in this colour are information-bearing, not decoration:

- `AllocationChart.tsx:256` — the coverage-end boundary whose label reads "last disclosed: FY2020"
  (Yale/MIT/Princeton/Harvard).
- `AllocationChart.tsx:213-216` — the target→actual boundary ("targets through FY2016 →", Harvard).
- `AllocationChart.tsx:234-239` — the investment-pool boundary (dashed).
- `ReturnsChart.tsx:87` — `<ReferenceLine y={0}>`, the line that tells you which bars are losses.

At 1.48:1 in dark mode the zero baseline of the returns chart is effectively invisible, which is a
real reading problem, not a theoretical one: the whole point of that chart is negative years
(`ReturnsChart.tsx:22-24` says so explicitly).

Gridlines (`--viz-grid`, 1.29:1 light / 1.24:1 dark) are recorded as warnings rather than failures —
WCAG's understanding of 1.4.11 accepts that gridlines a reader does not need are exempt, and here the
labelled ticks and the table twin carry the values.

**Where.** `src/app/globals.css:38` (light `--viz-axis: #c3c2b7`) and `:56` (dark `#383835`).

**Fails.** WCAG 1.4.11 Non-text Contrast (AA) — "graphical objects required to understand the
content" need 3:1.

**Fix.** Split the token. Keep `--viz-axis` for the plain axis rule and add a `--viz-annotation`
that clears 3:1 in both themes (e.g. `#8a8880` → 3.45:1 on `#fcfcfb`; `#6f6e69` → 3.36:1 on
`#1a1a19`), and use it for the four `ReferenceLine` strokes above. The label text on those lines
already uses `--viz-text-2`/`--viz-text`, which pass.

---

## 8. Three of the five lines on `/compare` fail 1.4.11 in light mode

**What is wrong.** Series colours are used as 2 px line strokes, where the colour is the series'
only identity and the line's position is the data. Measured against `--viz-surface` on the live site:

| Slot | Series on `/compare` | Light | Dark |
|---|---|---|---|
| 1 | Yale University (actual) | 4.30:1 ✓ | 4.79:1 ✓ |
| 2 | ETF copycat | 3.12:1 ✓ | 4.48:1 ✓ |
| 3 | S&P 500 | **2.74:1** | 5.11:1 ✓ |
| 4 | 60/40 | **2.11:1** | 5.67:1 ✓ |
| 5 | 70/30 | **2.62:1** | 4.41:1 ✓ |

The same three slots are used as large stacked-bar fills on the allocation charts
(`public_equity` = 3, `fixed_income_cash` = 4, `absolute_return` = 5 —
`src/lib/chart-theme.ts:8-17`), so all four school allocation charts carry the same shortfall in
light mode. Dark mode passes on every one of the eight slots.

Note in fairness: the project is aware of this and treats the table twin as the relief
(`viz-shared.tsx:10` — "also the 'relief' the palette validator requires for the light-mode
low-contrast slots"). That is a real mitigation for a user who can find the twin, but 1.4.11 has no
"an alternative exists" exception the way 1.4.5 does, so I am recording it as a failure rather than
as satisfied.

**Where.** `src/app/globals.css:41` (`--series-3: #1baf7a`), `:42` (`--series-4: #eda100`),
`:43` (`--series-5: #e87ba4`). Rendered at `GrowthChart.tsx:117` (`stroke={slotColor(s.slot)}`) and
`AllocationChart.tsx:198` (`fill={categoryColor(c)}`).

**Fails.** WCAG 1.4.11 Non-text Contrast (AA).

**Fix.** Darken the three light-mode slots until each clears 3:1 on `#fcfcfb` while preserving the
adjacent-pair separation the palette was built for — `--series-3: #128a60` (3.85:1),
`--series-4: #b87e00` (3.05:1), `--series-5: #d1477b` (3.98:1) are candidate values to re-run
through the palette validator. Do not change the dark values; they all pass.

---

## 9. Choosing a school on `/translate` injects the entire result with no announcement

**What is wrong.** `SchoolYearPicker` navigates with `router.push()` on `change`, which is a
client-side navigation: the DOM gains two `<h2>` sections, a 6-row ETF table, a fine-print `<aside>`
and a chart, all without a page load. Measured live:

```
before: 0 h2 in <main>          after: 2 h2 in <main>
activeElement before: SELECT    activeElement after: SELECT   (focus survives — good)
live region contents after: ""  (nothing announced)
```

Focus is *not* lost — that part is done correctly and worth keeping. But a screen-reader user gets
no signal that the page they asked for has arrived; the only feedback is visual, below the fold. The
document title also does not change (`translate/page.tsx:30-34` sets static metadata), so the usual
SPA fallback of a title change is unavailable too.

**Where.** `src/components/SchoolYearPicker.tsx:34-42` (`go()` → `router.push`), driven from the
`onChange` handlers at `:50` and `:68`. The injected content is
`src/app/translate/page.tsx:175-184`.

**Fails.** WCAG 4.1.3 Status Messages (AA). (Honest caveat: 4.1.3 is written about status messages
rather than route changes, and there is no SC that squarely covers SPA navigation, so a strict
auditor could argue this is a best-practice gap rather than a violation. The user-facing harm is
real either way.)

**Fix.** The site already has exactly the right machinery — the always-mounted `role="status"` region
from `src/components/TermAnnouncer.tsx`, driven by `src/lib/term-announce.ts`. Announce the arrival
through it after the push, e.g. `announce(\`Showing ${schoolName}'s FY${fy} mix\`)`, or add a
dedicated `aria-live="polite"` region beside the result heading in `translate/page.tsx:175`.

---

## 10. The invalid-deep-link correction on `/translate` is not associated with the picker

**What is wrong.** `/translate?school=yale&year=1066` renders the message *"That link didn't point
at a school and year with a disclosed mix — pick one below."* as a plain `<p>`:

```
role: null   aria-live: null   inside a live region: false   tabindex: null
select's aria-describedby: null
```

The copy is good and it precedes the form in DOM order, so a user reading linearly will meet it.
But nothing connects it to the control it is about, so a screen-reader user who jumps straight to
the form fields (Tab, or the forms rotor — the normal way to fill a form) reaches a `School` combobox
with no indication that their link was rejected or why.

**Where.** `src/app/translate/page.tsx:162-166` (the `<p>`), and
`src/components/SchoolYearPicker.tsx:48` (the `<select>` that has no `aria-describedby`). The same
pattern appears at `src/app/compare/page.tsx:196-201` for the clamped-period notice.

**Fails.** WCAG 1.3.1 Info and Relationships (A); 3.3.1 Error Identification (A) is arguable, since
this is a rejected URL rather than a user input error.

**Fix.** Give the `<p>` an `id` and thread it through to the select as `aria-describedby`, e.g.
`<p id="deep-link-note">` in `translate/page.tsx:163` plus a `noteId?: string` prop on
`SchoolYearPicker` applied to the school `<select>`.

---

## 11. The 404 page reuses the site's default title

**What is wrong.** `https://universityfunds.vercel.app/this-route-does-not-exist` returns HTTP 404
with `<title>University Endowment Investing Explorer</title>` — byte-identical to the home page's
title. A screen-reader user, or anyone with several tabs open, is given no signal that the page they
asked for does not exist. Every other route is titled correctly (verified on all 12).

**Where.** `src/app/not-found.tsx` — the file exports only the component, with no `metadata` export,
so it inherits the `title.default` from `src/app/layout.tsx:19-22`. The `<h1>` says "That page
doesn't exist", so only the title is wrong.

**Fails.** WCAG 2.4.2 Page Titled (A) — the title does not describe the topic or purpose.

**Fix.** Add to `src/app/not-found.tsx`:

```tsx
export const metadata = { title: "Page not found" };
```

which the layout's `template` renders as "Page not found — Endowment Explorer".

---

## 12. Chart `<figure>` elements have an empty accessible name

**What is wrong.** All 11 `<figure>` elements appear in Chrome's accessibility tree with
`name: ""`, so they announce as an unnamed figure. `ChartFrame` does supply a `<figcaption>`
(`viz-shared.tsx:57-60`) containing the chart title.

I ran a control experiment to establish the cause rather than guess — three hand-built figures
injected into a live page:

| Probe | Result |
|---|---|
| `<figure><figcaption>plain text caption</figcaption>…` | name `""` |
| `<figure><figcaption><div>caption wrapped in a div</div></figcaption>…` (the site's markup) | name `""` |
| `<figure aria-label="explicit name">…` | name `"explicit name"` ✓ |

So this is **Chrome not implementing HTML-AAM's figure→figcaption naming**, not a markup error in
this codebase — the site's `<figcaption>` is written correctly. Impact is therefore limited: the
title still reaches the user, because the figcaption text follows immediately as content and is
read. What is lost is the name in an element/rotor listing, and the figure title is not a heading
either, so a user scanning by heading on `/explore/yale` finds only "Asset allocation over time"
and never the chart's own caption naming the school and basis.

**Where.** `src/components/charts/viz-shared.tsx:56-60`.

**Fails.** WCAG 4.1.2 / 1.3.1 (A) — marginal, and the browser is the proximate cause. Severity: low.

**Fix.** Belt-and-braces: give the caption an `id` and label the figure from it, which the control
shows Chrome honours.

```tsx
const capId = useId();
<figure aria-labelledby={capId} className="viz-root …">
  <figcaption id={capId}>…</figcaption>
```

---

# SUSPECTED findings

Not reproduced as a defect in the browser available here; recorded so they are not lost.

## S1. Six scroll containers rely on a Chrome-only behaviour for keyboard operability

Six regions scroll but carry no `tabindex` and contain no focusable element:

| Route | Region | Hidden content |
|---|---|---|
| `/explore/yale` @1280 & @320 | 2 chart-twin scrollers (`max-h-80 overflow-auto`) | 246 px of 21 and 26 rows |
| `/compare` @1280 & @320 | growth-twin scroller | 26 rows |
| `/methodology` @320 | `.overflow-x-auto` around the proxy table | **354 px — the entire "Why — and the honest caveat" column** |
| `/translate…` @320 | ETF table + growth twin | full third and fourth columns |

This is axe-core's `scrollable-region-focusable` rule, which Lighthouse does not run. I could **not**
reproduce it as a defect in Chrome 150: Chrome ≥ 127 ships keyboard-focusable scrollers, and I
verified live that Tab lands on the container (`outline: rgb(0, 95, 204) auto 1px`,
`:focus-visible` true) and that arrow keys then scroll it — the Yale twin moved `scrollTop` 0 → 240,
and the `/methodology` scroller moved `scrollLeft` 0 → 80. **Firefox and Safari do not implement
focusable scrollers**, so on those engines a keyboard-only user cannot reach the hidden columns at
all. I could not test them: no Firefox is installed on this machine and Safari is not drivable by
this harness. Marked suspected because the failure is real in principle and cannot be reproduced
here.

**Where.** `src/components/charts/viz-shared.tsx:69` (`max-h-80 overflow-auto`),
`src/app/compare/page.tsx:220`, `src/app/methodology/page.tsx:208`,
`src/app/translate/page.tsx:284`.

**Would fail.** WCAG 2.1.1 Keyboard (A) on non-Chromium engines.

**Fix.** One attribute per container, which also makes the intent explicit rather than
browser-dependent:

```tsx
<div className="mt-2 max-h-80 overflow-auto" tabIndex={0} role="region" aria-label={table.caption}>
```

## S2. The `title="What does this mean?"` tooltip on every `<Term>` trigger

`src/components/Term.tsx:184` sets a `title` on the trigger. Browser-rendered `title` tooltips are
not dismissible without moving the pointer and are not reachable by keyboard at all. WCAG 1.4.13
Content on Hover or Focus is generally read as applying to author-generated content rather than the
UA's own `title` rendering, so I am not calling this a failure — but if `title` were ever replaced
with a custom tooltip, 1.4.13 would apply. No action recommended.

---

# Categories with nothing to report

Each was tested and is clean; one line each, as requested.

- **Heading hierarchy** — no skipped levels and exactly one `<h1>` on all 13 routes (levels
  measured from the AX tree, including the `aria-level` of any `role="heading"`).
- **Landmarks** — exactly one `banner`, one `main`, one `contentinfo` per route; `/methodology`'s two
  `navigation` landmarks are distinguishable ("Main", "On this page").
- **Keyboard traps** — none: on all six routes driven, focus either left the document or cycled back
  to the first control within the expected number of Tab presses.
- **Tab order** — follows visual order on all six routes driven; zero document-position inversions.
- **Focus visibility** — clean. Every tabbable control changes pixels when keyboard-focused,
  including the two that first appeared to fail and were then verified by dedicated probe: the skip
  link (sr-only → a visible `#0069a8` box at 8,8 on `/`, `/methodology`, `/translate`) and the plot
  `<svg>` (`outline: rgb(0, 95, 204) auto 5px`).
- **Reflow** — clean. `documentElement.scrollWidth` is exactly 320 on all 13 routes at 320 px and at
  320×256 (1280×1024 at 400 % zoom); nothing spills past the viewport apart from data tables inside
  their own scrollers, which 1.4.10 exempts. At 400 % the table twin still renders and the chart is
  254 px wide, unclipped.
- **Motion / `prefers-reduced-motion`** — clean, and `isAnimationActive={false}` is in fact
  consistent: zero CSS transitions, zero CSS animations, zero Web Animations and zero SMIL
  (`<animate>`) elements inside any chart, in both `no-preference` and `reduce`, measured after
  hovering the plot to raise a tooltip. Nothing to suppress, so no media query is needed.
- **Colour as the only channel** — clean. Every legend series has a matching named column in the
  table twin, and the target-vs-actual distinction (drawn as `fillOpacity` 0.65 vs 1,
  `AllocationChart.tsx:204`) is also spelled out in the subtitle, the footnote, the tooltip and the
  twin's first column ("FY2016 (target)"). The `SchoolMark` monogram is `aria-hidden` with the school
  name always beside it (`SchoolMark.tsx:22`).
- **Table captions and column headers** — all 8 tables have a real `<caption>` and 100 % of their
  `<th>` elements carry `scope="col"`. (Only the row headers are missing — finding 3.)
- **Form labels** — clean, and better than it looks in source. Wrapping a `<select>` inside a
  `<label>` that also contains the options *could* have produced a name like
  "Fiscal year of the mix FY2020 FY2019 …"; Chrome's real computation correctly substitutes the
  embedded control's value, giving `"School"` and `"Fiscal year of the mix"`. Verified from the AX
  tree, not from source.
- **Disabled options** — clean: Stanford's disabled option carries its reason in the option text
  ("Stanford University — no disclosed mix to translate (see its Explore page)"), and the disabled
  year picker's placeholder explains itself ("Pick a school first").
- **`<Term>` toggletip** — clean: `aria-expanded` flips true/false in the AX tree, Escape closes and
  leaves focus on the trigger, the definition reaches the single body-level `role="status"` region,
  and that region is cleared on close (no stale definition left behind).
- **`details`/`summary` twins** — clean: present on all 11 charts, `expanded=true` reaches the tree
  as a `DisclosureTriangle`, focus stays on the summary when opened, and the table renders.
- **`aria-pressed`** — clean: the S&P 500 overlay toggle reports `pressed=false` → `pressed=true` in
  the AX tree and its label changes with it (`ReturnsChart.tsx:62-67`).
- **Decorative graphics** — clean: the two gradient rules in the layout are `aria-hidden`
  (`layout.tsx:53`, `:80`), as is the `SchoolMark` monogram and the tooltip colour chip
  (`viz-shared.tsx:28-32`).
- **Skip link** — clean: becomes visible on focus and `#main` exists (`layout.tsx:46-51`, `:74`).
- **`html lang`** — clean (`en`).
- **Dark-mode text contrast** — clean: 292 text runs measured per route set, zero failures.
- **Gradient headline text** — clean, and worth stating because a naive contrast checker reports it
  as 1:1. `bg-clip-text text-transparent` means computed `color` is transparent, so contrast must be
  measured against the gradient stops; resolved through canvas they are 5.86 / 5.36 / 5.03:1 in light
  and 9.09 / 10.21 / 11.49:1 in dark, at 36 px / 600 weight (needs 3:1).

---

# Discarded: things that looked like defects and were not

Recorded because a reader re-running an earlier version of the harness will see them, and because
each cost real measurement to rule out. None of these is a defect.

- **"No visible focus indicator" on 30+ controls** (inline links, `<Term>` triggers, glossary index
  links, `<summary>`, the plot `<svg>`). Cause: `page.screenshot({ clip })` in puppeteer takes
  **document** coordinates, not viewport ones, so every clip for an element below the fold sampled
  unchanging content near the top of the page. Verified by a control: the same element compared with
  a viewport-coordinate clip reported "unchanged", with a document-coordinate clip reported
  "changed". After the fix, zero controls fail on any of the six routes driven.
- **"Keyboard trap" on `/explore/yale`, `/compare`, `/glossary`.** Cause: the harness was blurring
  and re-focusing by list index during the tab walk, which desynchronised the sequence. After
  separating the walk from the focus-ring measurement, all six routes reach 100 % of their tabbables
  (16/16, 16/16, 16/16, 18/18, 115/115, 30/30) and focus leaves the document cleanly.
- **"Tab order inversion: sources & methodology → Skip to content"** on every route. That is the tab
  cycle wrapping from the footer back to the top, not an inversion.
- **Headline `"do-it-yourself version"` at 1:1 contrast** on `/`. Cause: `bg-clip-text
  text-transparent` means computed `color` is `rgba(0,0,0,0)`; a naive checker composites transparent
  over the background and gets 1:1. The glyphs are actually painted by the gradient. Resolved through
  canvas, the stops are 5.86 / 5.36 / 5.03:1 in light and 9.09 / 10.21 / 11.49:1 in dark. Clean. The
  harness now measures gradient stops explicitly so this cannot recur as a false alarm.
- **`/translate?school=yale&year=2024` renders no result.** Not a bug — Yale's disclosed mixes end at
  FY2020, so FY2024 is correctly rejected and the page falls back to the picker with a plain-English
  notice, exactly as `translate/page.tsx:118-126` intends. (The notice's *association* with the
  control is a real finding — see 10 — but the fallback behaviour is correct.)
- **`<select>` accessible name polluted by its own `<option>` list.** The selects are nested inside
  their `<label>`, which a hand-rolled `accName` (`label.textContent`) reports as
  `"Fiscal year of the mixFY2020FY2019…FY2000"`. Chrome's real computation substitutes the embedded
  control's value and returns `"Fiscal year of the mix"`. This is the reason every name in this audit
  comes from `Accessibility.getFullAXTree` rather than from a DOM walk.
- **`<figcaption>` markup wrong.** It is not — see finding 12; the control experiment isolates the
  cause to Chrome's naming implementation.

---

# Fix order

| # | Finding | Files | Effort |
|---|---|---|---|
| 1 | `accessibilityLayer={false}` + `aria-hidden` chart wrapper — kills findings 1, 2, 4, 5 at once | `viz-shared.tsx`, 4 chart components | small |
| 2 | `<th scope="row">` on the first column — finding 3 | `viz-shared.tsx` + 3 pages | small |
| 3 | Darken `--viz-muted` (light) — finding 6 | `globals.css:36` | one line |
| 4 | New `--viz-annotation` token for reference lines — finding 7 | `globals.css`, `AllocationChart.tsx`, `ReturnsChart.tsx` | small |
| 5 | Re-tune light `--series-3/4/5` — finding 8 | `globals.css:41-43` | small, needs palette re-validation |
| 6 | Announce the `/translate` result; `aria-describedby` the rejection note — findings 9, 10 | `SchoolYearPicker.tsx`, `translate/page.tsx` | small |
| 7 | `tabIndex={0}` + `role="region"` on the four scrollers — S1 | `viz-shared.tsx` + 3 pages | one attribute each |
| 8 | 404 `metadata`; `aria-labelledby` on `<figure>` — findings 11, 12 | `not-found.tsx`, `viz-shared.tsx` | trivial |

`npm run verify:a11y` gates findings 1–6 and 8–12 (85 failing assertions today, exit code 1). S1 and
the gridline contrast question are emitted as `WARN` lines and do not fail the build, so decide them
deliberately rather than having the harness decide for you.
