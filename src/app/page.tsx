import Link from "next/link";
import { getEndowmentReturns, getSchools } from "@/lib/queries";
import { formatUsdMillions } from "@/lib/format";
import { FEATURE_ACCENT, SCHOOL_THEME } from "@/lib/school-theme";
import { SchoolMark } from "@/components/SchoolMark";
import type { Metadata } from "next";

// Title and description come from the root layout; this exists only to declare the
// homepage's canonical so it does not compete with its deployment aliases.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

const FEATURES = [
  {
    href: "/explore",
    title: "History Explorer",
    accent: FEATURE_ACCENT.explore,
    body: "Pick a school and see how its investment mix and returns actually moved across 25 years — with every gap in the public record labelled, not papered over.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
        <path d="M3 16V9M8 16V4M13 16v-5M18 16V7" />
      </svg>
    ),
  },
  {
    href: "/translate",
    title: "Copy the Pros",
    accent: FEATURE_ACCENT.translate,
    body: "See a school's mix translated into ordinary ETFs anyone can buy, what that copycat would have returned — and, honestly, the part no copycat can replicate.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
        <path d="M4 6h9m0 0-3-3m3 3-3 3M16 14H7m0 0 3-3m-3 3 3 3" />
      </svg>
    ),
  },
  {
    href: "/compare",
    title: "Head to Head",
    accent: FEATURE_ACCENT.compare,
    body: "The endowment vs. its ETF copycat vs. the S&P 500, 60/40 and 70/30 — growth of $10,000 over any period you choose, even when the fancy strategy loses.",
    icon: (
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
        <path d="M3 17 8 9l4 4 5-9" />
      </svg>
    ),
  },
] as const;

export default async function HomePage() {
  const schoolList = await getSchools();
  const latest = await Promise.all(
    schoolList.map(async (s) => {
      const rows = await getEndowmentReturns(s.id);
      const withValue = rows.filter((r) => r.marketValueUsdMillions !== null);
      const last = withValue[withValue.length - 1];
      return {
        id: s.id,
        name: s.name,
        fiscalYear: last?.fiscalYear ?? null,
        marketValue: last?.marketValueUsdMillions ?? null,
      };
    }),
  );

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
          How the famous university endowments really invested — and what a{" "}
          <span className="bg-gradient-to-r from-sky-700 via-emerald-700 to-amber-700 bg-clip-text text-transparent dark:from-sky-400 dark:via-emerald-400 dark:to-amber-400">
            do-it-yourself version
          </span>{" "}
          looks like
        </h1>
        <p className="max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Yale, Harvard, Stanford, MIT and Princeton, 25 years of public records, translated into
          plain English and ordinary ETFs. Free, no login, no advice — just the numbers, including
          the ones where a simple index fund wins.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className={`group rounded-lg border border-zinc-200 p-5 transition-colors dark:border-zinc-800 ${f.accent.border}`}
          >
            <span
              className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-white ${f.accent.chip}`}
              aria-hidden="true"
            >
              {f.icon}
            </span>
            <h2 className="mt-3 font-semibold">
              {f.title}{" "}
              <span aria-hidden="true" className={`${f.accent.text} transition-transform group-hover:translate-x-0.5 inline-block`}>
                →
              </span>
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{f.body}</p>
          </Link>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">The five endowments</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {latest.map((s) => (
            <li key={s.id}>
              <Link
                href={`/explore/${s.id}`}
                className="block h-full rounded-lg border border-zinc-200 border-t-4 p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                style={{ borderTopColor: SCHOOL_THEME[s.id].color }}
              >
                <div className="flex items-center gap-2.5">
                  <SchoolMark school={s.id} size="sm" />
                  <span className="font-medium leading-tight">{s.name}</span>
                </div>
                <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {s.marketValue !== null && s.fiscalYear !== null ? (
                    <>
                      {formatUsdMillions(s.marketValue)}{" "}
                      <span className="text-zinc-500">at end of FY{s.fiscalYear}</span>
                    </>
                  ) : (
                    "—"
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Endowment sizes as each school last reported them. Data runs FY2000–FY2025 and is
          updated by hand once a year.
        </p>
      </section>
    </div>
  );
}
