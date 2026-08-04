import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SCHOOL_IDS } from "@/lib/constants";
import {
  getAllocations,
  getBenchmarkReturns,
  getEndowmentReturns,
  getSchool,
  isSchoolId,
} from "@/lib/queries";
import { toAllocationChartData, toMarketValueData, toReturnsChartData } from "@/lib/chart-data";
import { bestWorstYear, trailingAnnualizedPct } from "@/lib/stats";
import { formatPct, formatUsdMillions, fyWindow } from "@/lib/format";
import { SCHOOL_BLURB } from "@/lib/blurbs";
import { Term } from "@/components/Term";
import { SCHOOL_THEME } from "@/lib/school-theme";
import { SchoolMark } from "@/components/SchoolMark";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { ReturnsChart } from "@/components/charts/ReturnsChart";
import { MarketValueChart } from "@/components/charts/MarketValueChart";

export const revalidate = 3600;

export function generateStaticParams() {
  return SCHOOL_IDS.map((school) => ({ school }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ school: string }>;
}): Promise<Metadata> {
  const { school } = await params;
  if (!isSchoolId(school)) return {};
  const row = await getSchool(school);
  return row
    ? {
        title: row.name,
        description: `How ${row.name}'s endowment invested and performed, from its own published records.`,
      }
    : {};
}

function StatTile({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: string;
  note?: string;
  accent?: string;
}) {
  return (
    <div
      className="rounded-lg border border-zinc-200 border-t-4 p-4 dark:border-zinc-800"
      style={accent ? { borderTopColor: accent } : undefined}
    >
      <div className="text-xs uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {note && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{note}</div>}
    </div>
  );
}

function UnavailableBlock({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-300 p-5 dark:border-zinc-700">
      <h3 className="font-medium">{heading}</h3>
      <div className="mt-2 space-y-2 text-sm text-zinc-600 dark:text-zinc-400">{children}</div>
    </div>
  );
}

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ school: string }>;
}) {
  const { school } = await params;
  if (!isSchoolId(school)) notFound();
  const row = await getSchool(school);
  if (!row) notFound();

  const [allocations, returns, sp500] = await Promise.all([
    getAllocations(school),
    getEndowmentReturns(school),
    getBenchmarkReturns(["sp500"]),
  ]);

  const allocationData = toAllocationChartData(allocations);
  const returnPoints = toReturnsChartData(returns, sp500);
  const marketValues = toMarketValueData(returns);
  const latestValue = marketValues[marketValues.length - 1] ?? null;

  const hasReturns = returns.some((r) => r.returnPct !== null);
  const tenYear = trailingAnnualizedPct(returns, 10);
  const twentyFiveYear = trailingAnnualizedPct(returns, 25);
  const bw = bestWorstYear(
    returns
      .filter((r) => r.returnPct !== null)
      .map((r) => ({ fiscalYear: r.fiscalYear, returnPct: r.returnPct as number })),
  );

  const isStanford = school === "stanford";

  return (
    <div className="space-y-10">
      <header className="flex items-start gap-4">
        <SchoolMark school={school} size="lg" />
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">{row.name}</h1>
          {row.managerName && (
            <p className="text-zinc-500 dark:text-zinc-400">
              <Term t="endowment">Endowment</Term> managed by {row.managerName}
            </p>
          )}
        </div>
      </header>

      <section aria-label="Headline figures" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          accent={SCHOOL_THEME[school].color}
          label="Endowment size"
          value={latestValue ? formatUsdMillions(latestValue.marketValueUsdMillions) : "—"}
          note={
            latestValue
              ? `end of FY${latestValue.fiscalYear} (${fyWindow(school, latestValue.fiscalYear)})`
              : undefined
          }
        />
        <StatTile
          accent={SCHOOL_THEME[school].color}
          label="10-year annualized return"
          value={tenYear !== null ? formatPct(tenYear) : "—"}
          note={
            tenYear !== null
              ? "geometric average of the last 10 fiscal years"
              : isStanford
                ? "Stanford publishes no endowment return — see below"
                : "not computable across this school's reporting gaps"
          }
        />
        <StatTile
          accent={SCHOOL_THEME[school].color}
          label="25-year annualized return"
          value={twentyFiveYear !== null ? formatPct(twentyFiveYear) : "—"}
          note={
            twentyFiveYear !== null
              ? "geometric average of the last 25 fiscal years"
              : isStanford
                ? "Stanford publishes no endowment return — see below"
                : "not computable across this school's reporting gaps"
          }
        />
        <StatTile
          accent={SCHOOL_THEME[school].color}
          label="Worst year"
          value={bw ? formatPct(bw.worst.returnPct) : "—"}
          note={bw ? `FY${bw.worst.fiscalYear}` : undefined}
        />
      </section>

      <section className="max-w-3xl space-y-4">
        <h2 className="text-xl font-semibold">The story</h2>
        {SCHOOL_BLURB[school].map((para, i) => (
          <p key={i} className="text-zinc-700 dark:text-zinc-300">
            {para}
          </p>
        ))}
        <p className="text-sm text-zinc-500">
          Every figure above comes from the school&rsquo;s own published documents —{" "}
          <Link href="/methodology" className="underline underline-offset-4">
            all sources and caveats here
          </Link>
          .
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">
          <Term t="asset allocation">Asset allocation</Term> over time
        </h2>
        {allocationData ? (
          <AllocationChart schoolName={row.name} data={allocationData} />
        ) : (
          <UnavailableBlock heading="Stanford's allocation mix isn't publicly available">
            <p>
              Stanford reports an investment mix only for its <Term t="Merged Pool">Merged Pool</Term>,
              which combines the endowment with hospital and other university money. The
              endowment&rsquo;s own mix has never been published, and showing the pool&rsquo;s
              numbers here would describe a different portfolio.
            </p>
            <p>
              <Link href="/methodology#stanford" className="underline underline-offset-4">
                The full story, with sources
              </Link>
              .
            </p>
          </UnavailableBlock>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Annual returns</h2>
        {hasReturns ? (
          <ReturnsChart schoolName={row.name} points={returnPoints} />
        ) : (
          <>
            <UnavailableBlock heading="Stanford's endowment returns aren't publicly available">
              <p>
                The returns Stanford publishes describe the <Term t="Merged Pool">Merged Pool</Term>,
                not the endowment — and the two measurably differ. Rather than show a number that
                belongs to a different portfolio, this page shows what Stanford does publish
                cleanly for the endowment itself: its size, below.
              </p>
              <p>
                <Link href="/methodology#stanford" className="underline underline-offset-4">
                  Why, with sources
                </Link>
                .
              </p>
            </UnavailableBlock>
            <MarketValueChart
              schoolName={row.name}
              points={marketValues}
              fyNote="Stanford's fiscal year ends August 31 — about two months offset from the July–June fiscal years used by every other series on this site. FY2025 here means September 2024 through August 2025."
            />
          </>
        )}
      </section>
    </div>
  );
}
