"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ReturnsChartPoint } from "@/lib/chart-data";
import { ENTITY_LABEL, ENTITY_SLOT, slotColor } from "@/lib/chart-theme";
import { formatPct } from "@/lib/format";
import { ChartFrame, RoundedBar, VizTooltipBox } from "./viz-shared";

// Annual returns bar chart with an S&P 500 overlay toggle (task 3.3).
// Negative years render below the axis at full prominence — honesty over
// narrative (PRD rule 4). Missing school years inside the window stay as
// visible holes and read "not published" in the tooltip and table.
export function ReturnsChart({
  schoolName,
  points,
}: {
  schoolName: string;
  points: ReturnsChartPoint[];
}) {
  const [overlay, setOverlay] = useState(false);
  const schoolColor = slotColor(ENTITY_SLOT.endowment);
  const spColor = slotColor(ENTITY_SLOT.sp500);

  const tableRows = points.map((p) => [
    `FY${p.fiscalYear}`,
    p.school !== null ? formatPct(p.school) : "not published",
    p.sp500 !== null ? formatPct(p.sp500) : "—",
  ]);

  return (
    <ChartFrame
      title={`Annual returns by fiscal year — ${schoolName}`}
      subtitle="Investment return the school reported for each fiscal year."
      footnote={
        <span>
          Both series cover identical fiscal-year windows (July–June).{" "}
          {points.some((p) => p.school === null) &&
            "Years with no bar are years the school did not publish a return."}
        </span>
      }
      table={{
        caption: `Annual returns for ${schoolName} and the S&P 500 by fiscal year`,
        headers: ["Fiscal year", `${schoolName} return`, "S&P 500 (total return)"],
        rows: tableRows,
      }}
    >
      <div className="mb-2">
        <button
          type="button"
          aria-pressed={overlay}
          onClick={() => setOverlay((v) => !v)}
          className="rounded border border-zinc-300 px-2.5 py-1 text-xs text-[var(--viz-text-2)] hover:border-zinc-400 aria-pressed:border-transparent aria-pressed:bg-sky-700 aria-pressed:text-white dark:border-zinc-700"
        >
          {overlay ? "Hide S&P 500 overlay" : "Compare with the S&P 500"}
        </button>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
          <ReferenceLine y={0} stroke="var(--viz-axis)" strokeWidth={1} />
          <Tooltip
            cursor={{ fill: "var(--viz-grid)", fillOpacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              const datum = payload[0]?.payload as ReturnsChartPoint | undefined;
              const rows = [];
              if (datum) {
                rows.push({
                  key: "school",
                  label: schoolName,
                  color: schoolColor,
                  value: datum.school !== null ? formatPct(datum.school) : "not published",
                });
                if (overlay && datum.sp500 !== null) {
                  rows.push({
                    key: "sp500",
                    label: ENTITY_LABEL.sp500,
                    color: spColor,
                    value: formatPct(datum.sp500),
                  });
                }
              }
              return <VizTooltipBox title={`FY${label}`} rows={rows} />;
            }}
          />
          {overlay && (
            <Legend
              formatter={(value: string) => (
                <span className="text-xs text-[var(--viz-text-2)]">{value}</span>
              )}
            />
          )}
          <Bar
            dataKey="school"
            name={schoolName}
            fill={schoolColor}
            shape={<RoundedBar />}
            maxBarSize={24}
            isAnimationActive={false}
          />
          {overlay && (
            <Line
              dataKey="sp500"
              name={ENTITY_LABEL.sp500}
              stroke={spColor}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 4.5, stroke: "var(--viz-surface)", strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
