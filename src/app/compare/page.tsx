import type { Metadata } from "next";
import Link from "next/link";
import {
  getAllocations,
  getBenchmarkReturns,
  getEndowmentReturns,
  getProxyMappings,
  getSchools,
  isSchoolId,
} from "@/lib/queries";
import type { SchoolId } from "@/lib/constants";
import {
  COMPOSITES,
  backtestSeriesShares,
  toSeriesData,
  uncoveredCategories,
} from "@/lib/backtest/engine";
import { rollingCopycatYearly } from "@/lib/backtest/copycat";
import { ENTITY_LABEL, ENTITY_SLOT } from "@/lib/chart-theme";
import { annualizedReturnPct, bestWorstYear } from "@/lib/stats";
import { formatPct } from "@/lib/format";
import { Term } from "@/components/Term";
import { ComparePicker, type CompareSchoolOption } from "@/components/ComparePicker";
import { FEATURE_ACCENT } from "@/lib/school-theme";
import { GrowthChart, type GrowthSeries } from "@/components/charts/GrowthChart";

export const revalidate = 3600;
const MAX_YEAR = 2025;

export const metadata: Metadata = {
  alternates: { canonical: "/compare" },
  title: "Head to Head — Compare",
  description:
    "Endowment vs. ETF copycat vs. the S&P 500, 60/40 and 70/30 — growth of $10,000 over any period, even when the fancy strategy loses.",
};

type SeriesStat = {
  key: string;
  label: string;
  slot: number;
  yearly: { fiscalYear: number; returnPct: number }[]; // computable years only
  complete: boolean; // covers every year in the window
};

function growthPoints(
  baselineFY: number,
  yearly: { fiscalYear: number; returnPct: number }[],
): { fiscalYear: number; value: number | null }[] {
  const points: { fiscalYear: number; value: number | null }[] = [
    { fiscalYear: baselineFY, value: 10_000 },
  ];
  let value = 10_000;
  let expected = baselineFY + 1;
  for (const y of yearly) {
    if (y.fiscalYear !== expected) break; // stop at the first gap — never compound across one
    value *= 1 + y.returnPct / 100;
    points.push({ fiscalYear: y.fiscalYear, value });
    expected++;
  }
  return points;
}

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const [schools, proxies, benchRows] = await Promise.all([
    getSchools(),
    getProxyMappings(),
    getBenchmarkReturns(),
  ]);
  const series = toSeriesData(benchRows);
  const gaps = uncoveredCategories(proxies);

  const allocationsBySchool = new Map(
    await Promise.all(schools.map(async (s) => [s.id, await getAllocations(s.id)] as const)),
  );

  const options: CompareSchoolOption[] = schools.map((s) => {
    const alloc = allocationsBySchool.get(s.id) ?? [];
    const firstMixYear = alloc.length ? Math.min(...alloc.map((a) => a.fiscalYear)) : null;
    return {
      id: s.id,
      name: s.name,
      fromMin: firstMixYear ?? 2000,
      note:
        firstMixYear === null
          ? "Stanford publishes neither an endowment mix nor endowment returns, so only the three benchmarks can be shown for it — the why is on its Explore page."
          : undefined,
    };
  });

  // Resolve + clamp params (invalid deep links clamp with a notice).
  const school: SchoolId =
    params.school && isSchoolId(params.school) ? params.school : "yale";
  const opt = options.find((o) => o.id === school)!;
  const rawFrom = params.from ? Number(params.from) : opt.fromMin;
  const rawTo = params.to ? Number(params.to) : MAX_YEAR;
  const from = Math.min(Math.max(Number.isFinite(rawFrom) ? rawFrom : opt.fromMin, opt.fromMin), MAX_YEAR - 1);
  const to = Math.min(Math.max(Number.isFinite(rawTo) ? rawTo : MAX_YEAR, from + 1), MAX_YEAR);
  const clamped =
    (params.school !== undefined && params.school !== school) ||
    (params.from !== undefined && Number(params.from) !== from) ||
    (params.to !== undefined && Number(params.to) !== to);

  const windowYears = to - from;
  const schoolName = schools.find((s) => s.id === school)!.name;
  const alloc = allocationsBySchool.get(school) ?? [];
  const returns = await getEndowmentReturns(school);

  const stats: SeriesStat[] = [];

  // Actual endowment.
  if (returns.some((r) => r.returnPct !== null)) {
    const byYear = new Map(
      returns.filter((r) => r.returnPct !== null).map((r) => [r.fiscalYear, r.returnPct as number]),
    );
    const yearly: { fiscalYear: number; returnPct: number }[] = [];
    for (let fy = from + 1; fy <= to; fy++) {
      const pct = byYear.get(fy);
      if (pct !== undefined) yearly.push({ fiscalYear: fy, returnPct: pct });
    }
    stats.push({
      key: "actual",
      label: `${schoolName} (actual)`,
      slot: ENTITY_SLOT.endowment,
      yearly,
      complete: yearly.length === windowYears,
    });
  }

  // Rolling copycat.
  let copycatNote: string | null = null;
  if (alloc.length > 0) {
    const cc = rollingCopycatYearly(alloc, gaps, series, from + 1, to);
    const yearly = cc.yearly
      .filter((y) => y.returnPct !== null)
      .map((y) => ({ fiscalYear: y.fiscalYear, returnPct: y.returnPct as number }));
    stats.push({
      key: "copycat",
      label: ENTITY_LABEL.copycat,
      slot: ENTITY_SLOT.copycat,
      yearly,
      complete: yearly.length === windowYears,
    });
    const staleFrom = cc.lastMixYear !== null && cc.lastMixYear < to - 1 ? cc.lastMixYear : null;
    copycatNote = [
      `The copycat holds, for each year, the school's most recently disclosed mix at that point`,
      staleFrom !== null
        ? ` — from FY${staleFrom + 1} on, that stays the FY${staleFrom} mix, the last ${schoolName} published`
        : "",
      cc.coverageMinPct !== null && cc.coverageMinPct < 99.9
        ? `. It models only the publicly-replicable sleeve (${formatPct(cc.coverageMinPct, 0)}–${formatPct(cc.coverageMaxPct ?? cc.coverageMinPct, 0)} of the mix across these years); the hedge-fund and private-equity share has no honest ETF stand-in`
        : "",
      ".",
    ].join("");
  }

  // Benchmarks — computed at query time from stored series (one source of truth).
  const benchmarkDefs = [
    { key: "sp500", label: ENTITY_LABEL.sp500, slot: ENTITY_SLOT.sp500, shares: [{ series: "sp500" as const, share: 1 }] },
    { key: "sixty_forty", label: ENTITY_LABEL.sixty_forty, slot: ENTITY_SLOT.sixty_forty, shares: [...COMPOSITES.sixty_forty] },
    { key: "seventy_thirty", label: ENTITY_LABEL.seventy_thirty, slot: ENTITY_SLOT.seventy_thirty, shares: [...COMPOSITES.seventy_thirty] },
  ];
  for (const b of benchmarkDefs) {
    const r = backtestSeriesShares(b.shares, series, from + 1, to);
    const yearly = r.yearly
      .filter((y) => y.returnPct !== null)
      .map((y) => ({ fiscalYear: y.fiscalYear, returnPct: y.returnPct as number }));
    stats.push({ key: b.key, label: b.label, slot: b.slot, yearly, complete: yearly.length === windowYears });
  }

  const chartSeries: GrowthSeries[] = stats.map((s) => ({
    key: s.key,
    label: s.label,
    slot: s.slot,
    points: growthPoints(from, s.yearly),
  }));

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-widest ${FEATURE_ACCENT.compare.text}`}>
          Comparisons
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Head to head</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          The endowment&rsquo;s actual results against its ETF copycat and three simple{" "}
          <Term t="benchmark">benchmarks</Term>: the <Term t="S&P 500">S&amp;P 500</Term> alone,
          and the classic <Term t="60/40">60/40</Term> and 70/30 stock/bond portfolios. The
          numbers say whatever they say — including when the simple option wins.
        </p>
      </header>

      {clamped && (
        <p className="rounded border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          That link asked for a period outside the available data — it&rsquo;s been adjusted to
          the nearest period that exists.
        </p>
      )}

      <ComparePicker schools={options} school={school} from={from} to={to} maxYear={MAX_YEAR} />

      <GrowthChart
        title={`Growth of $10,000, end of FY${from} through FY${to}`}
        subtitle={`$10,000 invested at the end of FY${from}, with each portfolio's fiscal-year returns compounded through FY${to}.`}
        footnote={
          <>
            {copycatNote} No taxes or fees are modeled anywhere.{" "}
            {alloc.length === 0 &&
              "No actual-endowment or copycat line exists for Stanford — see its Explore page for why."}
          </>
        }
        series={chartSeries}
      />

      <section className="viz-root space-y-3">
        <h2 className="text-xl font-semibold">The numbers</h2>
        <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[36rem] border-collapse text-sm">
            <caption className="sr-only">
              Annualized return and best/worst years, FY{from + 1}–FY{to}
            </caption>
            <thead>
              <tr className="bg-zinc-50 text-left dark:bg-zinc-900">
                <th scope="col" className="px-4 py-2 font-medium">Portfolio</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">
                  <Term t="annualized return">Annualized return</Term>
                </th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Best year</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Worst year</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => {
                const ann = s.complete
                  ? annualizedReturnPct(s.yearly.map((y) => y.returnPct))
                  : null;
                const bw = bestWorstYear(s.yearly);
                return (
                  <tr key={s.key} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="px-4 py-2">
                      <span
                        aria-hidden="true"
                        className="mr-2 inline-block h-0.5 w-4 align-middle"
                        style={{ backgroundColor: `var(--series-${s.slot})` }}
                      />
                      {s.label}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {ann !== null ? (
                        formatPct(ann)
                      ) : (
                        <span className="text-zinc-500">not computable across this period&rsquo;s gaps</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {bw ? `${formatPct(bw.best.returnPct)} (FY${bw.best.fiscalYear})` : "—"}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {bw ? `${formatPct(bw.worst.returnPct)} (FY${bw.worst.fiscalYear})` : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500">
          All series cover identical fiscal-year windows. Sources and method:{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
