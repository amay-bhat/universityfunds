import type { Metadata } from "next";
import Link from "next/link";
import { GLOSSARY_ENTRIES } from "@/lib/glossary";
import { FEATURE_ACCENT } from "@/lib/school-theme";

export const metadata: Metadata = {
  alternates: { canonical: "/glossary" },
  title: "Glossary",
  description:
    "Every finance term this site uses, defined in plain English — from asset allocation to REITs.",
};

// Renders from GLOSSARY_ENTRIES, the same object <Term> reads, so this page
// cannot list a different definition than the one that floats beside the word —
// and a term added to the glossary appears here without touching this file.
export default function GlossaryPage() {
  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p
          className={`text-xs font-semibold uppercase tracking-widest ${FEATURE_ACCENT.glossary.text}`}
        >
          Plain English
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">Glossary</h1>
        <p className="max-w-2xl text-zinc-600 dark:text-zinc-400">
          Finance has a lot of jargon, and none of it is hard once someone says what it means. These
          are the finance words this site uses, in plain English. Many of them carry a small{" "}
          <span className="text-sky-700 dark:text-sky-400">°</span> mark where they appear in the
          site&rsquo;s own writing — click the word and its definition floats up beside it. This page
          is the full list either way.
        </p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {GLOSSARY_ENTRIES.length} terms, alphabetically.
        </p>
      </header>

      <dl className="grid gap-x-8 gap-y-6 sm:grid-cols-2">
        {GLOSSARY_ENTRIES.map(({ term, slug, definition }) => (
          <div key={slug} id={slug} className="scroll-mt-20 space-y-1">
            <dt className="font-semibold">
              <a
                href={`#${slug}`}
                className="underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
              >
                {term}
              </a>
            </dt>
            <dd className="text-sm text-zinc-600 dark:text-zinc-400">{definition}</dd>
          </div>
        ))}
      </dl>

      <p className="border-t border-zinc-200 pt-6 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
        These are explanations of words, not recommendations about them. How every number on this
        site was gathered, and every gap in the record, is on the{" "}
        <Link href="/methodology" className="underline underline-offset-4">
          methodology page
        </Link>
        .
      </p>
    </div>
  );
}
