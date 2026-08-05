"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Label,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AllocationChartData } from "@/lib/chart-data";
import { categoryColor, categoryLabel } from "@/lib/chart-theme";
import { formatPct } from "@/lib/format";
import { ChartFrame, VizTooltipBox } from "./viz-shared";

// Time-composition chart (task 3.2). Stacked columns rather than a stacked
// area, deliberately: three of the four schools with allocation data have
// missing years (Harvard FY2018/FY2022; MIT is seven scattered years), and an
// area would draw continuity that was never disclosed. A column per disclosed
// year over a continuous year axis makes every gap a visible hole.
// Coverage-end and target→actual boundaries are annotated ON the chart
// (task-1.3 proxy decision; Checkpoint A ruling).
export function AllocationChart({
  schoolName,
  data,
}: {
  schoolName: string;
  data: AllocationChartData;
}) {
  const rows = data.years.map((y) => ({
    fiscalYear: y.fiscalYear,
    basis: y.basis,
    universe: y.universe,
    ...y.values,
  }));

  const lastDisclosed = data.coverageEnd;
  const coverageNote =
    lastDisclosed < 2025
      ? `${schoolName} last disclosed its allocation mix in FY${lastDisclosed}`
      : null;

  const tableRows = data.years
    .filter((y) => y.basis !== null)
    .map((y) => [
      `FY${y.fiscalYear}${y.basis === "target" ? " (target)" : ""}${
        y.universe === "investment_pool" ? " (investment pool)" : ""
      }`,
      ...data.categoriesUsed.map((c) =>
        y.values[c] !== undefined ? formatPct(y.values[c] as number) : "—",
      ),
    ]);

  // Never phrase a subset as a range unless it IS one. MIT's single target year
  // sits mid-series, so "through FY2008" would caption three actual-basis years
  // as targets — a claim that shipped and was publicly wrong.
  const fyList = (ys: number[]) => {
    const parts = ys.map((y) => `FY${y}`);
    return parts.length <= 1
      ? (parts[0] ?? "")
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  };

  const basisSentence =
    data.targetYears.length === 0
      ? "What the school reported holding, as a share of the endowment."
      : data.targetsFormPrefix
        ? `Through FY${data.targetYears[data.targetYears.length - 1]} these are the school's published target mixes (its policy portfolio); later years are what it actually held.`
        : `${fyList(data.targetYears)} ${data.targetYears.length === 1 ? "shows the mix the school said it was targeting" : "show the mixes the school said it was targeting"} (its policy portfolio); every other year is what it actually held.`;

  // The pool-universe break is annotated ON the chart (pool-basis [PROXY
  // DECISION], obligation 5 limb 2; Article 4). Channel choice: `fillOpacity` is
  // already spent on target-vs-actual, and the dataviz skill's "one distinction,
  // one channel" rule sends a second distinction to position / a reference line
  // / a marker. A reference line is also the mechanism class the ruling pinned
  // ("the Harvard mixed-basis treatment"), and it needs no new colour — which
  // matters while `scripts/validate_palette.js` is missing and no new hue can be
  // certified.
  //
  // A boundary line asserts "everything before this is the other universe", so
  // it may only be drawn for a prefix. Otherwise each pool year is marked at its
  // own tick, which claims nothing about the years between.
  const poolBoundaryYear =
    data.poolYears.length > 0 && data.poolYearsFormPrefix
      ? data.poolYears[data.poolYears.length - 1]
      : null;
  const poolTickYears = new Set(poolBoundaryYear === null ? data.poolYears : []);

  // Article 4: a different measurement universe drawn in the same series needs a
  // caveat where the reader sees the chart, not in fine print.
  const poolSentence =
    data.poolYears.length > 0
      ? ` ${fyList(data.poolYears)} ${data.poolYears.length === 1 ? "describes" : "describe"} the school's investment pool — a wider pot of money than the endowment itself — because that is the only mix it published for ${data.poolYears.length === 1 ? "that year" : "those years"}.`
      : "";

  return (
    <ChartFrame
      title={`Asset allocation by fiscal year — ${schoolName}`}
      subtitle={`${basisSentence}${poolSentence}`}
      footnote={
        <>
          {coverageNote && <span>{coverageNote}. </span>}
          {data.gapYears.length > 0 && (
            <span>
              Empty columns (
              {data.gapYears.map((y) => `FY${y}`).join(", ")}) are years the school did not
              publish a mix — nothing is estimated or filled in.{" "}
            </span>
          )}
          {poolTickYears.size > 0 && (
            <span>
              Years marked &dagger; describe the school&rsquo;s investment pool rather than the
              endowment itself.{" "}
            </span>
          )}
          <span>Percentages are the school&rsquo;s own reported figures.</span>
        </>
      }
      table={{
        caption: `Asset allocation percentages for ${schoolName} by fiscal year`,
        headers: ["Fiscal year", ...data.categoriesUsed.map((c) => categoryLabel(c))],
        rows: tableRows,
      }}
    >
      <ResponsiveContainer width="100%" height={360}>
        <BarChart data={rows} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}
          // recharts@3 defaults accessibilityLayer to true, which injects an
          // UNNAMED role="application" wrapper. That role drops NVDA and JAWS out
          // of browse mode, and recharts then fills it with loose text nodes (the
          // bare axis ticks) while its arrow-key tooltip has no live region and no
          // aria-activedescendant — so it is keyboard-only and silent. One good
          // access path beats two broken ones: the table twin below every chart is
          // the documented relief mechanism and now carries proper row headers.
          accessibilityLayer={false}
        >
          <CartesianGrid stroke="var(--viz-grid)" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="fiscalYear"
            tick={{ fontSize: 11, fill: "var(--viz-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--viz-axis)" }}
            tickFormatter={(v: number) =>
              `'${String(v).slice(2)}${poolTickYears.has(v) ? "\u2020" : ""}`
            }
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--viz-muted)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            width={44}
            // Stacks sum to ~100 (±rounding); cap the axis there instead of
            // letting it auto-pad to 120. Negative floors appear only for
            // levered (negative-cash) years.
            domain={[(dataMin: number) => Math.min(0, dataMin), 100]}
            allowDataOverflow
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip
            cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const point = payload[0]?.payload as {
                basis?: string | null;
                universe?: string | null;
              };
              // Both distinctions surface here, since the tooltip is where a
              // reader interrogates one specific year.
              const marks = [
                point?.basis === "target" ? "published target" : null,
                point?.universe === "investment_pool" ? "investment pool" : null,
              ].filter(Boolean);
              return (
                <VizTooltipBox
                  title={`FY${label}${marks.length > 0 ? ` — ${marks.join(", ")}` : ""}`}
                  rows={[...payload]
                    .reverse()
                    .filter((p) => typeof p.value === "number")
                    .map((p) => ({
                      key: String(p.dataKey),
                      label: categoryLabel(p.dataKey as never),
                      color: String(p.color),
                      value: formatPct(p.value as number),
                    }))}
                />
              );
            }}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-[var(--viz-text-2)]">
                {categoryLabel(value as never)}
              </span>
            )}
          />
          {data.categoriesUsed.map((c) => (
            <Bar
              key={c}
              dataKey={c}
              stackId="mix"
              fill={categoryColor(c)}
              stroke="var(--viz-surface)"
              strokeWidth={1}
              isAnimationActive={false}
            >
              {rows.map((r) => (
                <Cell key={r.fiscalYear} fillOpacity={r.basis === "target" ? 0.65 : 1} />
              ))}
            </Bar>
          ))}
          {/* A boundary line asserts "everything left of here is a target", so it
              may only be drawn when the target years really are a prefix. Where
              they are not (MIT), the per-column opacity plus the subtitle carry
              the distinction and no boundary is drawn. */}
          {data.targetsFormPrefix && (
            <ReferenceLine
              x={data.targetYears[data.targetYears.length - 1]}
              stroke="var(--viz-axis)"
              strokeWidth={1}
            >
              <Label
                value={`targets through FY${data.targetYears[data.targetYears.length - 1]} →`}
                position="top"
                stroke="var(--viz-surface)"
                strokeWidth={3}
                paintOrder="stroke"
                fill="var(--viz-text-2)"
                fontSize={11}
              />
            </ReferenceLine>
          )}
          {/* On-chart labels carry a surface-coloured halo (paintOrder=stroke):
              they sit over columns whenever a stack reaches the top of the plot.
              Step 7 caught MIT's coverage-end label rendered unreadably over its
              100%-tall FY2013–FY2015 columns — Yale's was legible only because
              its stacks top out near 87%, so the defect is data-dependent. */}
          {poolBoundaryYear !== null && (
            <ReferenceLine
              x={poolBoundaryYear}
              stroke="var(--viz-axis)"
              strokeWidth={1}
              strokeDasharray="4 3"
            >
              <Label
                value={`investment pool through FY${poolBoundaryYear} \u2192`}
                position="top"
                stroke="var(--viz-surface)"
                strokeWidth={3}
                paintOrder="stroke"
                // Offset so this never collides with the targets boundary label
                // if a school ever carries both distinctions as prefixes.
                dy={data.targetsFormPrefix ? -14 : 0}
                fill="var(--viz-text-2)"
                fontSize={11}
              />
            </ReferenceLine>
          )}
          {coverageNote && (
            <ReferenceLine x={lastDisclosed} stroke="var(--viz-axis)" strokeWidth={1}>
              <Label
                value={`last disclosed: FY${lastDisclosed}`}
                position="insideTopRight"
                stroke="var(--viz-surface)"
                strokeWidth={3}
                paintOrder="stroke"
                fill="var(--viz-text)"
                fontSize={11}
              />
            </ReferenceLine>
          )}
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
