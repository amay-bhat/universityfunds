"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MarketValuePoint } from "@/lib/chart-data";
import { ENTITY_SLOT, slotColor } from "@/lib/chart-theme";
import { formatUsdMillions } from "@/lib/format";
import { ChartFrame, VizTooltipBox } from "./viz-shared";

// Endowment market value over time. Single series: line + 10%-opacity wash,
// no legend (the title names it — dataviz skill). Used by Stanford's page
// (the one series Stanford publishes for the endowment itself, OI-1) and any
// other school section that wants size-over-time.
export function MarketValueChart({
  schoolName,
  points,
  fyNote,
}: {
  schoolName: string;
  points: MarketValuePoint[];
  fyNote?: string; // e.g. Stanford's Aug-31 fiscal-year disclosure
}) {
  const color = slotColor(ENTITY_SLOT.endowment);
  return (
    <ChartFrame
      title={`Endowment market value — ${schoolName}`}
      subtitle="Total size of the endowment at each fiscal year end."
      footnote={fyNote}
      table={{
        caption: `Endowment market value for ${schoolName} by fiscal year`,
        headers: ["Fiscal year", "Market value"],
        rows: points.map((p) => [`FY${p.fiscalYear}`, formatUsdMillions(p.marketValueUsdMillions)]),
      }}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            tickFormatter={(v: number) => `$${Math.round(v / 1000)}B`}
            width={48}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) return null;
              return (
                <VizTooltipBox
                  title={`FY${label}`}
                  rows={[
                    {
                      key: "mv",
                      label: "market value",
                      color,
                      value: formatUsdMillions(payload[0].value as number),
                    },
                  ]}
                />
              );
            }}
          />
          <Area
            dataKey="marketValueUsdMillions"
            stroke={color}
            strokeWidth={2}
            strokeLinejoin="round"
            fill={color}
            fillOpacity={0.1}
            dot={false}
            activeDot={{ r: 4.5, stroke: "var(--viz-surface)", strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
