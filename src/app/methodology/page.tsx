import type { Metadata } from "next";
import Link from "next/link";
import { NO_PROXY_TICKER } from "@/lib/constants";
import { getProxyMappings, getSources } from "@/lib/queries";
import { categoryLabel } from "@/lib/chart-theme";
import { Term } from "@/components/Term";
import { FEATURE_ACCENT } from "@/lib/school-theme";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/methodology" },
  title: "Methodology and sources",
  description:
    "Every source behind every number on this site, every known gap in the record, and exactly how the copycat math works.",
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-20 border-b border-zinc-200 pb-2 text-xl font-semibold dark:border-zinc-800">
      {children}
    </h2>
  );
}

export default async function MethodologyPage() {
  const [sources, proxies] = await Promise.all([getSources(), getProxyMappings()]);

  const sections = [
    { id: "how", label: "How this site works" },
    { id: "fiscal-years", label: "Fiscal years" },
    { id: "coverage", label: "The coverage story, school by school" },
    { id: "copycat", label: "Benchmarks and the copycat math" },
    { id: "sources", label: `Every source (${sources.length})` },
  ];

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-widest ${FEATURE_ACCENT.methodology.text}`}>
          The receipts
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Methodology and sources</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          The rule behind everything here: <strong>no citation, no number</strong>. This page
          lists every source, explains every known gap in plain English, and spells out the math.
          Any finance word on this site is defined in the{" "}
          <Link href="/glossary" className="underline underline-offset-4">
            glossary
          </Link>
          .
        </p>
        <nav aria-label="On this page" className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-sm">
          {sections.map((s) => (
            <a key={s.id} href={`#${s.id}`} className="text-sky-700 underline-offset-4 hover:underline dark:text-sky-400">
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      <section className="max-w-3xl space-y-4">
        <H2 id="how">How this site works</H2>
        <p>
          Every figure is hand-copied from a public document — annual reports, audited financial
          statements, and in two cases universities&rsquo; written answers to congressional
          inquiries — into version-controlled data files, each row carrying a reference to its
          source document and page. A loading script validates the files (allocations must sum to
          ~100%, every row must cite a source that exists) and refuses to write anything if a
          single check fails. The database is never edited directly.
        </p>
        <p>
          Nothing is estimated, interpolated, or carried forward to fill a hole. Where a school
          didn&rsquo;t publish something, you see a labelled gap. Data is updated by hand once a
          year, after the schools publish their fiscal-year results in the autumn.
        </p>
      </section>

      <section className="max-w-3xl space-y-4">
        <H2 id="fiscal-years">Fiscal years</H2>
        <p>
          Everything on this site is organized by <Term t="fiscal year">fiscal year</Term>, not
          calendar year. For Yale, Harvard, MIT and Princeton the fiscal year ends June 30 —
          FY2025 means July 2024 through June 2025 — and every benchmark series is computed over
          those same July–June windows, so a school&rsquo;s return and its benchmark always cover
          identical months. <strong>Stanford is the exception:</strong>{" "}
          its fiscal year ends
          August 31, so its market values sit about two months offset from every other series
          here. That offset is disclosed wherever Stanford&rsquo;s numbers appear.
        </p>
      </section>

      <section className="max-w-3xl space-y-5">
        <H2 id="coverage">The coverage story, school by school</H2>
        <p>
          The project&rsquo;s goal was FY2000–FY2025 for all five schools. No school actually
          publishes that much. The rule adopted (and human-approved) for version one:{" "}
          <strong>full coverage where disclosed, labelled gaps everywhere else.</strong> A recurring
          idea below is <em>measurement basis</em> — the question &ldquo;what exactly is this
          percentage a percentage <em>of</em>?&rdquo; Two numbers can both be true and still not
          belong on the same chart, because they measure different pools of money or different
          things (a target vs. a holding, a shared pool vs. the endowment). When a school&rsquo;s
          only available figures are on a different measurement basis, this site shows a gap
          rather than a lookalike number.
        </p>

        <h3 className="font-semibold">Yale — allocations end at FY2020</h3>
        <p className="text-zinc-700 dark:text-zinc-300">
          The 2020 edition of <em>The Yale Endowment</em> was the last to publish an asset
          allocation table; no endowment report has appeared since, only return/market-value
          press releases. Percentages <em>could</em>{" "}
          be derived from Yale&rsquo;s audited
          financial statements, but that table reports asset classes in dollars at net asset
          value, excludes cash and directly-held bonds, and doesn&rsquo;t reconcile to the
          endowment&rsquo;s total value — a derived mix would show a Yale with almost no bonds,
          for a school that held roughly 30% in fixed income and cash in FY2020. That&rsquo;s a
          different measurement basis, and a footnote can&rsquo;t fix a number that points the
          wrong way. So the chart ends at FY2020, and says so on the chart itself.
        </p>

        <h3 className="font-semibold">Harvard — targets, then actuals, with two missing years</h3>
        <p className="text-zinc-700 dark:text-zinc-300">
          Before FY2017 Harvard published only its <Term t="target allocation">policy portfolio</Term>{" "}
          — the mix it was aiming for — not what it held. From FY2017 it reports actual holdings,
          but folds US and international stocks into one &ldquo;public equity&rdquo; line (which
          is why that combined category exists on this site). FY2018 and FY2022 were never
          published at all. Six of Harvard&rsquo;s published tables carried no date; each was
          assigned to its fiscal year by reconciling it against Harvard&rsquo;s audited financial
          statements rather than by guessing from publication dates.
        </p>
        <p className="text-zinc-700 dark:text-zinc-300">
          Harvard&rsquo;s endowment <em>size</em> figures come from two different published
          sources, and the difference is small but real. FY2000&ndash;FY2006 and FY2010 are the
          University&rsquo;s own audited net-asset figures, because no Harvard Management Company
          document exists for those years. FY2007&ndash;FY2009 and FY2011 onward are HMC&rsquo;s
          published endowment values, which run roughly 0.4&ndash;0.8% below the University line
          for the same year. Nothing here is restated to hide the seam: each number is the one
          its own document published, and the FY2010 point consequently sits about half a percent
          above where its neighbours&rsquo; basis would put it.
        </p>

        <h3 id="stanford" className="scroll-mt-20 font-semibold">
          Stanford — the Merged Pool is not the endowment
        </h3>
        <p className="text-zinc-700 dark:text-zinc-300">
          Stanford Management Company publishes an asset mix and returns only for the{" "}
          <Term t="Merged Pool">Merged Pool</Term> — a combined investment vehicle that Stanford&rsquo;s
          own reports describe as roughly 73–75% endowment, with the rest belonging to Stanford&rsquo;s
          hospitals and other university funds. No endowment-specific allocation or return has
          ever been found in any Stanford publication. And the difference is real, not a labeling
          nicety: part of the endowment sits outside the Merged Pool entirely, and in FY2024 the
          endowment&rsquo;s audited investment result works out several percentage points below
          the Merged Pool&rsquo;s reported 8.4% return. Presenting Merged Pool figures as
          &ldquo;Stanford&rsquo;s endowment&rdquo; would silently swap one portfolio for another —
          the exact error this site exists to avoid. What Stanford does publish cleanly for the
          endowment itself is its year-end market value, from its audited financial statements,
          and that is what you&rsquo;ll find here.
        </p>

        <h3 className="font-semibold">MIT — seven scattered years</h3>
        <p className="text-zinc-700 dark:text-zinc-300">
          MIT publishes a return every year but almost never a full mix. This data holds seven
          allocation years: three early ones (FY2001/FY2003/FY2004) on the basis of MIT&rsquo;s
          investment pool — used because MIT itself presented the pool as its endowment proxy and
          over 95% of the endowment sat inside it, and labelled as pool-basis wherever they appear on this site — one
          published target (FY2008), and three actuals (FY2013–FY2015) that exist only in
          MIT&rsquo;s written answers to congressional inquiries. The chart shows exactly those
          snapshots, with real gaps between them.
        </p>

        <h3 className="font-semibold">Princeton — two return-years never published</h3>
        <p className="text-zinc-700 dark:text-zinc-300">
          Princeton&rsquo;s allocations run FY2005–FY2018 and FY2020–FY2023, all actual holdings
          and all explicitly dated. Its returns run FY2001–FY2025, but FY2000 and FY2003 were
          never published — so any statistic whose window crosses those years is shown as
          &ldquo;not computable&rdquo; rather than bridged.
        </p>
      </section>

      <section className="max-w-3xl space-y-5">
        <H2 id="copycat">Benchmarks and the copycat math</H2>
        <p>
          Every benchmark series is a real, buyable instrument (or the total-return index a
          cheap fund tracks), computed over the same July–June fiscal years as the schools&rsquo;
          returns: the fiscal-year <Term t="total return">total return</Term> is the instrument&rsquo;s
          value on the last trading day on or before June 30, divided by the same a year earlier,
          minus one, with dividends reinvested. The instruments were chosen for the longest
          continuous history on one consistent basis, not the trendiest ticker — and each ETF
          shown in the Translator is the buyable version of the <em>same instrument</em>{" "}
          behind
          the benchmark series, so the copycat&rsquo;s math and the thing you could actually buy
          are one and the same.
        </p>
        <p>
          The copycat assumes <Term t="rebalancing">rebalancing</Term> once a year: each fiscal
          year&rsquo;s portfolio return is the mix-weighted average of that year&rsquo;s
          instrument returns. No taxes, fees, or trading costs are modeled. The 60/40 and 70/30
          benchmarks are computed the same way from the stock and bond series.
        </p>
        <p>
          <strong>The explicit gap.</strong> Two categories — hedge funds and private
          equity/venture capital — have no honest stand-in: no freely-citable, actually-investable
          series reaches back to FY2000, and the lookalike ETFs hold something genuinely different.
          Rather than pretend, the copycat models only the publicly-replicable part of a mix and
          always states what share it left out. For a Yale-style portfolio that gap is roughly
          half the endowment — which is itself one of the most honest facts this site can show
          you about copying the pros.
        </p>
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
          aria-labelledby="methodology-proxy-table-caption"
        >
          <table className="w-full min-w-[40rem] border-collapse text-sm">
            <caption id="methodology-proxy-table-caption" className="sr-only">ETF proxy for each allocation category</caption>
            <thead>
              <tr className="bg-zinc-50 text-left dark:bg-zinc-900">
                <th scope="col" className="px-4 py-2 font-medium">Category</th>
                <th scope="col" className="px-4 py-2 font-medium">ETF stand-in</th>
                <th scope="col" className="px-4 py-2 font-medium">Why — and the honest caveat</th>
              </tr>
            </thead>
            <tbody>
              {proxies.map((p) => (
                <tr key={p.category} className="border-t border-zinc-200 align-top dark:border-zinc-800">
                  <td className="px-4 py-3 font-medium">{categoryLabel(p.category)}</td>
                  <td className="px-4 py-3">
                    {p.etfTicker === NO_PROXY_TICKER ? (
                      <span className="italic text-zinc-500">none — explicit gap</span>
                    ) : (
                      <>
                        <span className="font-mono font-semibold">{p.etfTicker}</span>
                        <span className="block text-xs text-zinc-500">{p.etfName}</span>
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.rationale}
                    <span className="mt-1 block text-xs text-zinc-500">{p.honestyNote}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4">
        <H2 id="sources">Every source ({sources.length})</H2>
        <p className="max-w-3xl text-zinc-600 dark:text-zinc-400">
          Every row in the database points at one of these documents. This list is generated from
          the same database the charts read, so it cannot drift out of sync with them.
        </p>
        <ul className="space-y-3">
          {sources.map((s) => (
            <li key={s.id} className="rounded border border-zinc-200 p-3 text-sm [overflow-wrap:anywhere] dark:border-zinc-800">
              <div className="font-medium">
                {s.url ? (
                  <a href={s.url} className="underline underline-offset-4" rel="noopener noreferrer">
                    {s.title}
                  </a>
                ) : (
                  s.title
                )}
              </div>
              <div className="mt-0.5 text-xs text-zinc-500">
                {[s.publisher, s.page ? `p. ${s.page}` : null, s.accessedDate ? `accessed ${s.accessedDate}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </div>
              {s.notes && <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{s.notes}</p>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
