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
      `FY${y.fiscalYear}${y.basis === "target" ? " (target)" : ""}`,
      ...data.categoriesUsed.map((c) =>
        y.values[c] !== undefined ? formatPct(y.values[c] as number) : "—",
      ),
    ]);

  return (
    <ChartFrame
      title={`Asset allocation by fiscal year — ${schoolName}`}
      subtitle={
        data.lastTargetYear !== null
          ? `Through FY${data.lastTargetYear} these are the school's published target mixes (its policy portfolio); later years are what it actually held.`
          : "What the school reported holding, as a share of the endowment."
      }
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
        <BarChart data={rows} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="var(--viz-grid)" strokeWidth={1} vertical={false} />
          <XAxis
            dataKey="fiscalYear"
            tick={{ fontSize: 11, fill: "var(--viz-muted)" }}
            tickLine={false}
            axisLine={{ stroke: "var(--viz-axis)" }}
            tickFormatter={(v: number) => `'${String(v).slice(2)}`}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--viz-muted)" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}%`}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              const basis = (payload[0]?.payload as { basis?: string | null })?.basis;
              return (
                <VizTooltipBox
                  title={`FY${label}${basis === "target" ? " — published target" : ""}`}
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
          {data.lastTargetYear !== null && (
            <ReferenceLine x={data.lastTargetYear} stroke="var(--viz-axis)" strokeWidth={1}>
              <Label
                value={`targets through FY${data.lastTargetYear} →`}
                position="top"
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
