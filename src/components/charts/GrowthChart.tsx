"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { slotColor } from "@/lib/chart-theme";
import { formatDollars } from "@/lib/format";
import { ChartFrame, VizTooltipBox } from "./viz-shared";

export type GrowthSeries = {
  key: string;
  label: string;
  slot: number; // fixed palette slot — color follows the entity everywhere
  points: { fiscalYear: number; value: number | null }[];
};

// Growth-of-$10,000 chart (tasks 4.3 and 5.1). 2px lines, no dots except on
// hover (surface-ringed), legend always (≥2 series), tooltip lists every
// series at the hovered year, table twin carries every value.
export function GrowthChart({
  title,
  subtitle,
  footnote,
  series,
}: {
  title: string;
  subtitle?: string;
  footnote?: React.ReactNode;
  series: GrowthSeries[];
}) {
  const years = [...new Set(series.flatMap((s) => s.points.map((p) => p.fiscalYear)))].sort(
    (a, b) => a - b,
  );
  const rows = years.map((fy) => {
    const row: Record<string, number | null> & { fiscalYear: number } = { fiscalYear: fy };
    for (const s of series) {
      row[s.key] = s.points.find((p) => p.fiscalYear === fy)?.value ?? null;
    }
    return row;
  });

  const tableRows = rows.map((r) => [
    `FY${r.fiscalYear}`,
    ...series.map((s) => {
      const v = r[s.key];
      return typeof v === "number" ? formatDollars(v) : "—";
    }),
  ]);

  return (
    <ChartFrame
      title={title}
      subtitle={subtitle}
      footnote={footnote}
      table={{
        caption: title,
        headers: ["Fiscal year", ...series.map((s) => s.label)],
        rows: tableRows,
      }}
    >
      <ResponsiveContainer width="100%" height={340}>
        <LineChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
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
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `$${(v / 1_000_000).toFixed(1)}M` : `$${Math.round(v / 1000)}k`
            }
            width={56}
            domain={["auto", "auto"]}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload) return null;
              return (
                <VizTooltipBox
                  title={`FY${label}`}
                  rows={payload
                    .filter((p) => typeof p.value === "number")
                    .map((p) => ({
                      key: String(p.dataKey),
                      label: String(p.name),
                      color: String(p.stroke ?? p.color),
                      value: formatDollars(p.value as number),
                    }))}
                />
              );
            }}
          />
          <Legend
            formatter={(value: string) => (
              <span className="text-xs text-[var(--viz-text-2)]">{value}</span>
            )}
          />
          {series.map((s) => (
            <Line
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stroke={slotColor(s.slot)}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              dot={false}
              activeDot={{ r: 4.5, stroke: "var(--viz-surface)", strokeWidth: 2 }}
              connectNulls={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
