---
name: dataviz
description: Chart design discipline for this project — palette roles, slot assignments, honesty rules for gaps and mixed bases, chart chrome contract, and the render-and-look verification pass. Read before writing or changing any chart code (CLAUDE.md rule 5, CONSTITUTION Article 6).
---

# dataviz — chart discipline

`CLAUDE.md` rule 5 and `CONSTITUTION.md` Article 6 make reading this a
**precondition** for writing chart code: any chart, table-with-bars, stat tile,
or colour choice.

> ## Provenance — read this first
>
> **This file is a reconstruction, not the original.** The dataviz skill this
> project was built against is not present on this machine (not in
> `.claude/skills/`, not in `~/.claude/skills/`), and neither is
> `scripts/validate_palette.js`, which `src/app/globals.css:28-29` names as the
> tool that certified the palette. Both were available during the Phases 2–6
> build (`TASKS.md:284` cites "dataviz skill step 7") and are gone now.
>
> Everything below was recovered from the artifacts the original produced: the
> `dataviz skill:` comments in `src/lib/chart-theme.ts`,
> `src/components/charts/viz-shared.tsx`, `src/components/charts/AllocationChart.tsx`,
> `src/components/charts/MarketValueChart.tsx` and `src/app/globals.css`, plus
> the recorded decisions and defect list in the `TASKS.md` build log
> (`:281`, `:284`). It documents conventions that **already shipped**; it does
> not invent new ones. That matters constitutionally: Part 2 §6 reserves the
> visual identity to the human, so this file transcribes decisions already made
> and blessed rather than making them.
>
> Treat any rule here as reliable where it is traceable to shipped code, and as
> a best reconstruction where it is not. **The step numbering is inferred** —
> only "step 7" is attested by name. Where this file and the shipped components
> disagree, the components win and this file is wrong; fix it.

## The order of work

1. **Read the data first, not the chart type.** How many series, what
   granularity, where the gaps are, whether more than one measurement basis is
   present. The honesty rules below follow from the data's shape, and choosing a
   chart type before knowing the gaps is how you draw continuity that was never
   disclosed.
2. **Pick the encoding from the question the reader has**, not from what looks
   richest.
3. **Assign colour by role, never by hex** (see *Palette*).
4. **Write the honesty affordances into the data layer**, not the component
   (see *Honesty rules*).
5. **Use the shared chrome** — `ChartFrame` + `VizTooltipBox` (see *Chrome*).
6. **Check accessibility and responsiveness** (see *A11y* and *Responsive*).
7. **Render it and look at it.** Attested by name in the build log, and it
   caught real defects that review-by-reading did not (see *Step 7*).

## Palette

The reference palette lives in `src/app/globals.css` as **role tokens**:
`--viz-surface`, `--viz-text`, `--viz-text-2`, `--viz-muted`, `--viz-grid`,
`--viz-axis`, and eight categorical series slots `--series-1` … `--series-8`,
each defined for light **and** dark.

- **Components reference roles, never raw hex.** No exceptions. If you need a
  colour that has no role, add the role.
- **Colour follows the entity, never its rank.** A school that lacks a category
  must not repaint the survivors, and the same category wears the same hue on
  every school's chart. Comparison entities keep one hue everywhere they appear
  — the S&P 500 is the same colour on the returns overlay and on the compare
  chart. Enforced by `CATEGORY_SLOT` and `ENTITY_SLOT` in
  `src/lib/chart-theme.ts`.
- **Stack order = slot order**, so vertically adjacent stack segments are
  adjacent palette slots. This is not cosmetic: the original validator certified
  an *adjacent pairlist*, i.e. that neighbouring slots are distinguishable. Any
  reordering invalidates that certification.
- **Three light-mode slots are low-contrast** against the surface. The original
  validator required "relief" for them, and the relief is the mandatory
  table-view twin (below). If you add a series, you owe it the same relief.

**The validator is `npm run verify:palette`** (`scripts/validate_palette.mjs`,
restored 2026-08-05 after the original was found missing). Run it before and after
any colour change; it exits non-zero on a meaning-bearing colour below threshold,
and checks text roles at 4.5:1, meaning-bearing graphics at 3:1, adjacent-stack-pair
separation, and colour-vision-deficiency simulation for deuteranopia, protanopia
and tritanopia.

**"Meaning-bearing" includes reference lines.** The audit found `--viz-axis` at
1.75:1 light and 1.48:1 dark while drawing the coverage-end and basis-break
annotations a reader cannot understand the chart without. Both were darkened to
clear 3:1. `--viz-grid` stays exempt as purely decorative — that exemption is
about the grid specifically, not a licence to reclassify anything inconvenient.

**The three low-contrast light-mode slots are ACCEPTED, not passing.** The original
validator never required them to clear 3:1; it required *relief*, which is the
table twin. If you add a series, you owe it the same.

**Do not trust a charting library's built-in accessibility layer without reading
what it emits.** `recharts@3` defaults `accessibilityLayer: true`, injecting an
**unnamed `role="application"`** wrapper — a role that drops NVDA and JAWS out of
browse mode — then filling it with loose text nodes (bare axis ticks), while its
arrow-key tooltip has no live region and no `aria-activedescendant`. Keyboard-only
and silent, which is worse than absent because it looks handled. All four chart
components set `accessibilityLayer={false}` and rely on the table twin instead.

**Chrome does not compute an accessible name from `<figcaption>`.** `ChartFrame`
sets `aria-label` on the `<figure>`. Verify names from the accessibility tree;
never assume markup implies a name.

## Honesty rules

These are the project's Articles expressed as chart rules. They are not style
preferences and they outrank aesthetics.

- **A gap is a hole, never a bridge.** Allocation history is stacked *columns*
  on a continuous year axis, deliberately not a stacked area: three of the four
  schools with allocation data have missing years, and an area would draw
  continuity that was never disclosed. The year domain runs continuously from
  first to last **disclosed** year so a missing year renders as visible empty
  space.
- **Nothing is interpolated or carried forward** in a history chart. If a
  transform does carry a value forward (the compare page's rolling-mix
  semantics), that is a documented decision and it is stated on the chart.
- **Two measurement bases must never render as one unlabeled series**
  (Article 4). The basis travels with every year through the data layer so the
  component can label it. **A caveat in a caption or footnote does not
  discharge this** — Article 4 names fine-print-only disclosure as the way to
  break it. The break gets annotated **on the chart itself**.
- **One distinction, one channel.** If a chart already encodes a distinction in
  a channel — allocation charts use `fillOpacity` for target-vs-actual basis —
  a *second* distinction must use a **different** channel: position, a
  reference line, a marker, hatching, or an explicit annotation. Overloading one
  channel with two meanings makes both unreadable and is how a chart starts
  lying. Where a school carries two distinctions at once, verify at step 7 that
  both remain legible together.
- **Never assume a subset forms a prefix.** Derive membership as a **set** from
  the data. Writing "through FY*n*" where *n* is `max(matching years)` asserts
  that every earlier year matches, which is false the moment a school's
  matching years are non-contiguous. This exact bug shipped: it captioned three
  of MIT's actual-basis years as published targets.
- **Annotate the coverage end on the chart**, not in a caption, when a series
  stops before the axis does — the reader will notice the difference and needs
  the explanation at that moment.
- **Percentages are the school's own reported figures**; say so, and never
  rescale to make a stack reach 100.
- **Never frame a figure as current positioning.** Titles, subtitles,
  footnotes, annotations and tooltip labels describe a *fiscal year*, never
  "now": no "latest moves", no "currently holds", no momentum or trend-arrow
  framing, no present-tense verb attached to a year the school stopped
  disclosing. The most recent disclosed year is the most recent *disclosed*
  year, not today's portfolio — Yale's allocations end at FY2020, and a chart
  whose chrome reads otherwise is lying by tense even when every number in it
  is right. This is the active-trader anti-persona (`PERSONAS.md` §A) and
  BRD-035 expressed as a chart rule. It constrains chart chrome only: the
  site-wide disclaimer and fine print are worded by the human
  (`CONSTITUTION.md` Part 2 §4) and nothing here licenses rewording them.

## Chrome

Use `ChartFrame` and `VizTooltipBox` from `src/components/charts/viz-shared.tsx`.

- `ChartFrame` takes `title`, optional `subtitle`, `footnote`, and a
  **required** `table`. The subtitle carries the reading instruction; the
  footnote carries provenance and gap notes.
- **Every chart ships a table-view twin.** Values must be reachable without
  hover — this serves keyboard and screen-reader users and is the palette relief
  for the three low-contrast light-mode slots.
- **The twin needs a `<caption>`, `scope="col"` on every column header, AND
  `<th scope="row">` on the first cell of every body row.** All three, or the
  relief does not work. This file previously stated the requirement as though
  column headers were enough; the 2026-08-05 audit found all eight tables shipping
  with every body cell as `<td>`, so a screen reader read a bare percentage out of
  an 8x21 grid with no way to recover its fiscal year. The relief was documented as
  complete for months while being half-built.
- **Tooltips** list every series at the hovered X. **Values lead, labels
  follow.** Series are keyed by a short line of the series colour, never by
  colouring the text. Numbers are `tabular-nums`.
- **No legend when the title already names the single series** — a one-series
  chart with a legend is noise.
- **Render names and labels as JSX text.** React escapes it. Never `innerHTML`.

## Axes

- **Share-of-whole axes cap at 100** with explicit ticks `[0, 25, 50, 75, 100]`.
  Do not let the axis auto-pad — it padded to 120% and shipped that way until
  step 7 caught it.
- A negative floor appears **only** where the data is genuinely levered
  (negative cash). Use `Math.min(0, dataMin)`, not a hard zero, so a real
  negative is never clipped out of sight.
- Year ticks abbreviate (`'04`) with `interval="preserveStartEnd"`.

## A11y

- Target **Lighthouse accessibility 100**. It was measured at 100 on all five
  representative routes; that is the bar, not an aspiration.
- Decorative colour swatches carry `aria-hidden="true"`.
- The chart is a `<figure>` with a `<figcaption>`; the table twin has a real
  `<caption>`.
- Never encode meaning in colour alone — the table twin plus on-chart
  annotation is what makes that true here.

## Responsive

- Verify at **375px** width. A scripted overflow sweep across all routes is the
  standard; the translate-page `<select>` forced a 519px page and only a sweep
  caught it.
- Charts sit in `ResponsiveContainer` with an explicit pixel height.

## Dark mode

Every role token has a dark value. **Verify dark mode by screenshot**, not by
reading the CSS — the two palettes have different contrast behaviour and the
low-contrast slots differ between them.

## Step 7 — render it and look at it

Non-negotiable, and the highest-yield step in this file. Reading the source is
not a substitute: every defect below passed code review and was caught only by
looking.

- allocation y-axis auto-padded to 120% (fixed: capped at 100);
- **four inter-word spaces silently stripped by the JSX/Turbopack transform**
  despite correct source (`could be` → `couldbe` class) — fixed with explicit
  `{" "}`, then a scripted seam-scan across all routes confirmed zero
  remaining;
- translate-page school `<select>` forcing a 519px page at 375px.

**Toolkit present in the repo:** `puppeteer-core` (dev-only, drives installed
Chrome) and `npm test` (vitest). Use them to screenshot each affected route
light and dark, sweep 375px for overflow, and scan for the missing-space seam
class after any JSX copy edit.

**A chart is not done when it compiles. It is done when you have looked at it,
in both themes, at phone width.**
