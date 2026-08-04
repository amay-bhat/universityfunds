import Link from "next/link";
import { getEndowmentReturns, getSchools } from "@/lib/queries";
import { formatUsdMillions } from "@/lib/format";

export const revalidate = 3600;

const FEATURES = [
  {
    href: "/explore",
    title: "History Explorer",
    body: "Pick a school and see how its investment mix and returns actually moved across 25 years — with every gap in the public record labelled, not papered over.",
  },
  {
    href: "/translate",
    title: "Copy the Pros",
    body: "See a school's mix translated into ordinary ETFs anyone can buy, what that copycat would have returned — and, honestly, the part no copycat can replicate.",
  },
  {
    href: "/compare",
    title: "Head to Head",
    body: "The endowment vs. its ETF copycat vs. the S&P 500, 60/40 and 70/30 — growth of $10,000 over any period you choose, even when the fancy strategy loses.",
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
          How the famous university endowments really invested — and what a
          do-it-yourself version looks like
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
            className="group rounded-lg border border-zinc-200 p-5 transition-colors hover:border-sky-400 hover:bg-sky-50/50 dark:border-zinc-800 dark:hover:border-sky-600 dark:hover:bg-sky-950/30"
          >
            <h2 className="font-semibold group-hover:text-sky-900 dark:group-hover:text-sky-200">
              {f.title} <span aria-hidden="true">→</span>
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
                className="block rounded-lg border border-zinc-200 p-4 hover:border-sky-400 dark:border-zinc-800 dark:hover:border-sky-600"
              >
                <div className="font-medium">{s.name}</div>
                <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
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
        <p className="text-sm text-zinc-500 dark:text-zinc-500">
          Endowment sizes as each school last reported them. Data runs FY2000–FY2025 and is
          updated by hand once a year.
        </p>
      </section>
    </div>
  );
}
