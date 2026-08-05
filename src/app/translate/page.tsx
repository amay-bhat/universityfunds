import type { Metadata } from "next";
import Link from "next/link";
import { NO_PROXY_TICKER, isPoolUniverseSource } from "@/lib/constants";
import {
  getAllocations,
  getBenchmarkReturns,
  getEndowmentReturns,
  getProxyMappings,
  getSchools,
  isSchoolId,
  type AllocationRow,
  type ProxyMapping,
} from "@/lib/queries";
import {
  backtestAllocation,
  computableWindow,
  toSeriesData,
  uncoveredCategories,
} from "@/lib/backtest/engine";
import { CATEGORY_STACK_ORDER, ENTITY_SLOT, categoryLabel } from "@/lib/chart-theme";
import { annualizedReturnPct } from "@/lib/stats";
import { formatPct } from "@/lib/format";
import { Term } from "@/components/Term";
import { SchoolYearPicker, type PickerSchool } from "@/components/SchoolYearPicker";
import { FEATURE_ACCENT } from "@/lib/school-theme";
import { GrowthChart, type GrowthSeries } from "@/components/charts/GrowthChart";

// NOTE: no `revalidate` here on purpose. This route awaits `searchParams`,
// which makes it fully dynamic (build legend: f Dynamic, no revalidate
// value). An `export const revalidate` line was present until 2026-08-05
// and was dead code implying caching that never happened.

export const metadata: Metadata = {
  alternates: { canonical: "/translate" },
  title: "Copy the Pros — the Translator",
  description:
    "A school's endowment mix translated into ordinary ETFs, what the copycat would have returned, and — honestly — the part no copycat can replicate.",
};

function FinePrint() {
  return (
    <aside
      aria-label="What a copycat cannot replicate"
      className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <h3 className="font-semibold">The fine print — what a copycat cannot replicate</h3>
      <ul className="mt-2 list-disc space-y-1 pl-5">
        <li>
          <strong>Access.</strong> Endowments invest in top private funds that are closed to
          individuals; the ETFs here stand in for whole markets, not star managers.
        </li>
        <li>
          <strong>Taxes.</strong> Endowments pay essentially none; your account probably does. No
          taxes (or fees) are modeled in these numbers.
        </li>
        <li>
          <strong>Time horizon.</strong>{" "}
          An endowment plans in centuries and can sit through
          crashes; a person usually can&rsquo;t.
        </li>
        <li>
          <strong>Staff.</strong> These schools employ large professional investment offices; the
          copycat is a set-and-rebalance portfolio.
        </li>
      </ul>
      <p className="mt-2">
        The copycat math assumes <Term t="rebalancing">rebalancing</Term> once a year and nothing
        else — no taxes, no fees, no trading costs. All of this is education about how these
        portfolios behaved, not a suggestion about yours.
      </p>
    </aside>
  );
}

export default async function TranslatePage({
  searchParams,
}: {
  searchParams: Promise<{ school?: string; year?: string }>;
}) {
  const params = await searchParams;
  const [schools, proxies, benchRows] = await Promise.all([
    getSchools(),
    getProxyMappings(),
    getBenchmarkReturns(),
  ]);

  const allocationsBySchool = new Map(
    await Promise.all(
      schools.map(async (s) => [s.id, await getAllocations(s.id)] as const),
    ),
  );

  const pickerSchools: PickerSchool[] = schools.map((s) => {
    const rows = allocationsBySchool.get(s.id) ?? [];
    const byYear = new Map<number, "actual" | "target">();
    for (const r of rows) byYear.set(r.fiscalYear, r.basis);
    // A year is pool-universe only if EVERY one of its rows cites a
    // pool-universe document (same rule as the allocation chart).
    const poolByYear = new Map<number, boolean>();
    for (const r of rows) {
      const prev = poolByYear.get(r.fiscalYear);
      const isPool = isPoolUniverseSource(r.sourceId);
      poolByYear.set(r.fiscalYear, prev === undefined ? isPool : prev && isPool);
    }
    return {
      id: s.id,
      name: s.name,
      years: [...byYear.entries()]
        .map(([fiscalYear, basis]) => ({
          fiscalYear,
          basis,
          poolUniverse: poolByYear.get(fiscalYear) ?? false,
        }))
        .sort((a, b) => b.fiscalYear - a.fiscalYear),
      disabledReason:
        rows.length === 0 ? "no disclosed mix to translate (see its Explore page)" : undefined,
    };
  });

  // Validate the deep link; anything invalid falls back to the picker with a
  // plain message rather than an error page.
  const school = params.school && isSchoolId(params.school) ? params.school : undefined;
  const schoolRows = school ? (allocationsBySchool.get(school) ?? []) : [];
  const validYears = new Set(schoolRows.map((r) => r.fiscalYear));
  const yearNum = params.year ? Number(params.year) : undefined;
  const year = yearNum !== undefined && validYears.has(yearNum) ? yearNum : undefined;
  const invalidDeepLink =
    (params.school !== undefined && school === undefined) ||
    (school !== undefined && params.year !== undefined && year === undefined) ||
    (school !== undefined && schoolRows.length === 0);

  const chosen = school && year !== undefined ? { school, year } : null;
  const schoolName = school ? (schools.find((s) => s.id === school)?.name ?? school) : null;

  const coverageNote = (() => {
    if (!school || schoolRows.length === 0) return undefined;
    const years = [...validYears].sort((a, b) => a - b);
    const first = years[0];
    const last = years[years.length - 1];
    const missing = [];
    for (let fy = first; fy <= last; fy++) if (!validYears.has(fy)) missing.push(fy);
    const parts: string[] = [];
    if (last < 2025)
      parts.push(`${schoolName} has not published a mix since FY${last}, so later years cannot be offered`);
    if (missing.length > 0)
      parts.push(
        `${missing.map((y) => `FY${y}`).join(", ")} ${missing.length === 1 ? "was" : "were"} never published and ${missing.length === 1 ? "is" : "are"} skipped`,
      );
    return parts.length ? parts.join("; ") + "." : undefined;
  })();

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-widest ${FEATURE_ACCENT.translate.text}`}>
          The Translator
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Copy the Pros</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Pick a school and a fiscal year, and see its endowment mix translated into ordinary{" "}
          <Term t="ETF">ETFs</Term> — with a plain reason for each stand-in, an honest note where
          the stand-in is weak, and a labelled gap where none exists at all.
        </p>
      </header>

      {invalidDeepLink && (
        <p className="rounded border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
          That link didn&rsquo;t point at a school and year with a disclosed mix — pick one below.
        </p>
      )}

      <SchoolYearPicker
        schools={pickerSchools}
        school={school}
        year={year}
        missingYearsNote={coverageNote}
      />

      {chosen && schoolName && (
        <TranslationResult
          schoolId={chosen.school}
          schoolName={schoolName}
          year={chosen.year}
          rows={schoolRows.filter((r) => r.fiscalYear === chosen.year)}
          proxies={proxies}
          benchRows={benchRows}
        />
      )}

      {!chosen && (
        <p className="text-sm text-zinc-500">
          Nothing selected yet — the table and the copycat&rsquo;s performance appear here once you
          pick a school and year.
        </p>
      )}
    </div>
  );
}

async function TranslationResult({
  schoolId,
  schoolName,
  year,
  rows,
  proxies,
  benchRows,
}: {
  schoolId: string;
  schoolName: string;
  year: number;
  rows: AllocationRow[];
  proxies: ProxyMapping[];
  benchRows: Awaited<ReturnType<typeof getBenchmarkReturns>>;
}) {
  const basis = rows[0]?.basis;
  const isPoolUniverse = rows.length > 0 && rows.every((r) => isPoolUniverseSource(r.sourceId));
  const proxyByCategory = new Map(proxies.map((p) => [p.category, p]));
  const ordered = CATEGORY_STACK_ORDER.filter((c) => rows.some((r) => r.category === c));

  const gaps = uncoveredCategories(proxies);
  const weights = rows.map((r) => ({ category: r.category, pct: r.pct }));
  const series = toSeriesData(benchRows);
  const window = computableWindow(weights, gaps, series);
  const startFY = window ? Math.max(year + 1, window.startFY) : null;
  const endFY = window ? Math.min(window.endFY, 2025) : null;
  const runnable = startFY !== null && endFY !== null && startFY <= endFY;

  const result = runnable
    ? backtestAllocation(weights, gaps, series, startFY, endFY)
    : null;

  const returns = isSchoolId(schoolId) ? await getEndowmentReturns(schoolId) : [];
  const returnByYear = new Map(
    returns.filter((r) => r.returnPct !== null).map((r) => [r.fiscalYear, r.returnPct as number]),
  );

  let actualSeries: GrowthSeries | null = null;
  let actualAnnualized: number | null = null;
  let actualTruncatedAt: number | null = null;
  if (result?.computable && startFY !== null && endFY !== null) {
    const points: { fiscalYear: number; value: number | null }[] = [
      { fiscalYear: startFY - 1, value: 10_000 },
    ];
    let value = 10_000;
    const pcts: number[] = [];
    for (let fy = startFY; fy <= endFY; fy++) {
      const pct = returnByYear.get(fy);
      if (pct === undefined) {
        actualTruncatedAt = fy;
        break;
      }
      value *= 1 + pct / 100;
      pcts.push(pct);
      points.push({ fiscalYear: fy, value });
    }
    if (pcts.length > 0) {
      actualSeries = {
        key: "actual",
        label: `${schoolName} (actual endowment)`,
        slot: ENTITY_SLOT.endowment,
        points,
      };
      if (actualTruncatedAt === null) actualAnnualized = annualizedReturnPct(pcts);
    }
  }

  const uncoveredList = result?.uncovered.map((u) => categoryLabel(u.category)).join(" and ");

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">
          {schoolName}&rsquo;s FY{year} mix, in ETFs
        </h2>
        {basis === "target" && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            FY{year} is a <Term t="target allocation">published target</Term> — the mix{" "}
            {schoolName} said it was aiming for, not necessarily what it held.
          </p>
        )}
        {isPoolUniverse && (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            FY{year} describes {schoolName}&rsquo;s{" "}
            <Term t="investment pool">investment pool</Term> &mdash; a wider pot of money than the
            endowment itself &mdash; because that is the only mix it published for this year.
          </p>
        )}
        {/* tabIndex: a scroll container with no focusable descendants is not
            keyboard-operable (WCAG 2.1.1). Chrome >=127 focuses scrollers
            implicitly, which is why this was invisible in Chrome-only testing;
            Firefox and Safari do not. Cross-browser audit 2026-08-05 found this
            container an orphan below ~700px - every phone, and desktop at 400%
            zoom. Labelled by the table's own caption so the tab stop announces
            what it is. */}
        <div
          className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800"
          tabIndex={0}
          role="group"
          aria-labelledby="translate-etf-table-caption"
        >
          <table className="w-full min-w-[42rem] border-collapse text-sm">
            <caption id="translate-etf-table-caption" className="sr-only">
              {schoolName}&rsquo;s FY{year} allocation translated into ETFs
            </caption>
            <thead>
              <tr className="bg-zinc-50 text-left dark:bg-zinc-900">
                <th scope="col" className="px-4 py-2 font-medium">Category</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">Endowment %</th>
                <th scope="col" className="px-4 py-2 font-medium">ETF stand-in</th>
                <th scope="col" className="px-4 py-2 font-medium">Why this ETF — and what it misses</th>
              </tr>
            </thead>
            <tbody>
              {ordered.map((c) => {
                const row = rows.find((r) => r.category === c)!;
                const proxy = proxyByCategory.get(c);
                const isGap = proxy?.etfTicker === NO_PROXY_TICKER;
                return (
                  <tr
                    key={c}
                    className={`border-t border-zinc-200 align-top dark:border-zinc-800 ${isGap ? "bg-zinc-50/60 dark:bg-zinc-900/40" : ""}`}
                  >
                    <td className="px-4 py-3 font-medium">{categoryLabel(c)}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{formatPct(row.pct)}</td>
                    <td className="px-4 py-3">
                      {isGap || !proxy ? (
                        <span className="italic text-zinc-500">none — an honest gap</span>
                      ) : (
                        <>
                          <span className="font-mono font-semibold">{proxy.etfTicker}</span>
                          <span className="block text-xs text-zinc-500">{proxy.etfName}</span>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {proxy && (
                        <>
                          <span>{proxy.rationale}</span>
                          <span className="mt-1 block text-xs text-zinc-500">
                            {proxy.honestyNote}
                          </span>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <FinePrint />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">How the copycat would have done</h2>
        {!runnable || !result ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {year >= 2025
              ? `FY${year} is the most recent mix and benchmark data ends FY2025, so there are no later fiscal years to run it through yet.`
              : `Benchmark coverage doesn't extend past this mix's categories for the years after FY${year}, so there is nothing honest to run it through.`}
          </p>
        ) : !result.computable ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            This mix can&rsquo;t be backtested: {formatPct(result.uncoveredWeightPct)} of it (
            {uncoveredList}) has no honest ETF stand-in, and nothing coverable remains.
          </p>
        ) : (
          <>
            {result.uncoveredWeightPct > 0.05 && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                <strong>The copycat covers {formatPct(result.coveredWeightPct)} of this mix.</strong>{" "}
                The remaining {formatPct(result.uncoveredWeightPct)} — {uncoveredList} — has no
                honest ETF stand-in and is left out, with the covered portion scaled up to a full
                portfolio. That gap is real: it is the part of the strategy you cannot buy.
              </p>
            )}
            <GrowthChart
              title={`Growth of $10,000 from FY${startFY! - 1}`}
              subtitle={`${schoolName}'s FY${year} mix, held unchanged by this copycat through FY${endFY} and rebalanced annually — versus what the endowment actually did.`}
              footnote={
                <>
                  {year < endFY! &&
                    `${schoolName} did not hold this mix after FY${year} — the copycat does, which is exactly why the lines diverge; the school kept changing its portfolio. `}
                  {actualTruncatedAt !== null &&
                    `The actual-endowment line stops at FY${actualTruncatedAt - 1} because ${schoolName} did not publish a return for FY${actualTruncatedAt}. `}
                  No taxes or fees are modeled.
                </>
              }
              series={[
                {
                  key: "copycat",
                  label: "ETF copycat",
                  slot: ENTITY_SLOT.copycat,
                  points: result.growthOf10k!.map((g) => ({
                    fiscalYear: g.fiscalYear,
                    value: g.value,
                  })),
                },
                ...(actualSeries ? [actualSeries] : []),
              ]}
            />
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Over FY{startFY}–FY{endFY}, the copycat&rsquo;s{" "}
              <Term t="annualized return">annualized return</Term> is{" "}
              <strong>{formatPct(result.annualizedPct!)}</strong>
              {actualAnnualized !== null && (
                <>
                  {" "}
                  versus <strong>{formatPct(actualAnnualized)}</strong> for the endowment itself
                </>
              )}
              . Best copycat year: {formatPct(result.bestWorst!.best.returnPct)} (FY
              {result.bestWorst!.best.fiscalYear}); worst:{" "}
              {formatPct(result.bestWorst!.worst.returnPct)} (FY
              {result.bestWorst!.worst.fiscalYear}).
            </p>
          </>
        )}
        <p className="text-xs text-zinc-500">
          Proxy mapping and every return series are in the database with citations —{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            methodology
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
