import type { Metadata } from "next";
import Link from "next/link";
import { getEndowmentReturns, getSchools } from "@/lib/queries";
import { formatUsdMillions } from "@/lib/format";
import { SCHOOL_HOOK } from "@/lib/blurbs";
import { FEATURE_ACCENT, SCHOOL_THEME } from "@/lib/school-theme";
import { SchoolMark } from "@/components/SchoolMark";

export const revalidate = 3600;

export const metadata: Metadata = {
  alternates: { canonical: "/explore" },
  title: "Explore the endowments",
  description:
    "Pick a school and see how its investment mix and returns actually moved across 25 years of public records.",
};

export default async function ExplorePage() {
  const schools = await getSchools();
  const cards = await Promise.all(
    schools.map(async (s) => {
      const rows = await getEndowmentReturns(s.id);
      const withValue = rows.filter((r) => r.marketValueUsdMillions !== null);
      const last = withValue[withValue.length - 1];
      return { ...s, latest: last ?? null };
    }),
  );

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className={`text-xs font-semibold uppercase tracking-widest ${FEATURE_ACCENT.explore.text}`}>
          History Explorer
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Explore the endowments</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Five schools, twenty-five years of public records. Each page shows the school&rsquo;s
          story, its investment mix over time, and its year-by-year returns — with every gap in
          the record labelled rather than smoothed over.
        </p>
      </header>
      <ul className="grid gap-4 sm:grid-cols-2">
        {cards.map((s) => (
          <li key={s.id}>
            <Link
              href={`/explore/${s.id}`}
              className="block h-full rounded-lg border border-zinc-200 border-l-4 p-5 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
              style={{ borderLeftColor: SCHOOL_THEME[s.id].color }}
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2.5 font-semibold">
                  <SchoolMark school={s.id} size="sm" />
                  {s.name}
                </h2>
                {s.latest && s.latest.marketValueUsdMillions !== null && (
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">
                    {formatUsdMillions(s.latest.marketValueUsdMillions)}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{SCHOOL_HOOK[s.id]}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
