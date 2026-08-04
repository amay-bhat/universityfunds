"use client";

import type { ReactNode } from "react";

// Shared chart chrome. Specs from the dataviz skill:
//   - tooltips list every series at the hovered X; values lead, labels follow;
//     series keyed by a short line of the series color, never colored text
//   - every chart ships a table-view twin (values reachable without hover —
//     also the "relief" the palette validator requires for the light-mode
//     low-contrast slots)
//   - names/labels are rendered via JSX text (React escapes — never innerHTML)

export type TooltipRow = {
  key: string;
  label: string;
  color: string; // css color (series var)
  value: string; // preformatted
};

export function VizTooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  if (rows.length === 0) return null;
  return (
    <div className="rounded border border-zinc-300 bg-white/95 px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-900/95">
      <div className="mb-1 font-medium">{title}</div>
      <ul className="space-y-0.5">
        {rows.map((r) => (
          <li key={r.key} className="flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block h-0.5 w-4 shrink-0"
              style={{ backgroundColor: r.color }}
            />
            <span className="font-semibold tabular-nums">{r.value}</span>
            <span className="text-zinc-500 dark:text-zinc-400">{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartFrame({
  title,
  subtitle,
  children,
  footnote,
  table,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footnote?: ReactNode;
  table: { caption: string; headers: string[]; rows: string[][] };
}) {
  return (
    <figure className="viz-root rounded-lg border border-zinc-200 bg-[var(--viz-surface)] p-4 dark:border-zinc-800">
      <figcaption>
        <div className="font-medium text-[var(--viz-text)]">{title}</div>
        {subtitle && <div className="text-sm text-[var(--viz-text-2)]">{subtitle}</div>}
      </figcaption>
      <div className="mt-3">{children}</div>
      {footnote && (
        <div className="mt-2 text-xs text-[var(--viz-text-2)]">{footnote}</div>
      )}
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-[var(--viz-text-2)] underline-offset-4 hover:underline">
          View this chart as a table
        </summary>
        <div className="mt-2 max-h-80 overflow-auto">
          <table className="w-full min-w-[24rem] border-collapse text-xs">
            <caption className="sr-only">{table.caption}</caption>
            <thead>
              <tr>
                {table.headers.map((h) => (
                  <th
                    key={h}
                    scope="col"
                    className="sticky top-0 border-b border-zinc-300 bg-[var(--viz-surface)] px-2 py-1 text-left font-medium dark:border-zinc-700"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      className={`border-b border-zinc-200 px-2 py-1 dark:border-zinc-800 ${j > 0 ? "tabular-nums" : ""}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

// Rounded 4px data-end, square at the baseline (dataviz mark spec) — the
// rounded corners sit at the value end for positive AND negative bars.
export function RoundedBar(props: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  value?: number | [number, number];
  fillOpacity?: number;
}) {
  const { x = 0, y = 0, width = 0, height = 0, fill, fillOpacity } = props;
  if (width <= 0 || height === 0) return null;
  const raw = Array.isArray(props.value)
    ? props.value[1] - props.value[0]
    : (props.value ?? height);
  const negative = raw < 0;
  const top = height >= 0 ? y : y + height;
  const h = Math.abs(height);
  const r = Math.min(4, width / 2, h);
  const d = negative
    ? // square top (baseline), rounded bottom (data end)
      `M ${x},${top} H ${x + width} V ${top + h - r} Q ${x + width},${top + h} ${x + width - r},${top + h} H ${x + r} Q ${x},${top + h} ${x},${top + h - r} Z`
    : // rounded top (data end), square bottom (baseline)
      `M ${x},${top + h} V ${top + r} Q ${x},${top} ${x + r},${top} H ${x + width - r} Q ${x + width},${top} ${x + width},${top + r} V ${top + h} Z`;
  return <path d={d} fill={fill} fillOpacity={fillOpacity} />;
}
