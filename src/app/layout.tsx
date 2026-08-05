import type { Metadata } from "next";
import { SITE_URL, SITE_NAME, DATA, sourceCount } from "@/lib/site";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { SCHOOL_GRADIENT } from "@/lib/school-theme";
import { TermAnnouncer } from "@/components/TermAnnouncer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const DESCRIPTION =
  "How Yale, Harvard, Stanford, MIT and Princeton actually invested over 25 years, what a buy-it-yourself ETF version looks like, and how it compares with simple index investing. Education, not financial advice.";

export const metadata: Metadata = {
  // metadataBase makes every relative canonical and OG url resolve to ONE origin.
  // Without it the site is indexable at the production domain and at every
  // per-deployment and git-branch alias, which are duplicates competing with each
  // other. Added 2026-08-05; there was no canonical of any kind before.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: "%s — Endowment Explorer",
  },
  description: DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: DESCRIPTION,
    url: "/",
    locale: "en_US",
  },
  twitter: { card: "summary_large_image", title: SITE_NAME, description: DESCRIPTION },
};

// Structured data. This site genuinely IS a dataset — hand-curated figures, every
// one carrying a citation, with a declared temporal coverage — so Dataset is an
// honest description rather than markup fishing for a rich result.
//
// NOTE: `license` is deliberately ABSENT. Five of the six benchmark series are
// derived from Yahoo Finance including S&P DJI-licensed index data, and
// CONSTITUTION.md:44 reserves data licensing and redistribution to the human. That
// decision has not been made, so declaring any licence here would assert a right
// nobody has established. Add it only after that ruling.
function structuredData() {
  const graph = [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      inLanguage: "en-US",
    },
    {
      "@type": "Dataset",
      "@id": `${SITE_URL}/#dataset`,
      name: "US university endowment allocations and returns, FY2000-FY2025",
      description:
        `Hand-curated asset allocations, annual returns and year-end market values for five US ` +
        `university endowments (Yale, Harvard, Stanford, MIT, Princeton), transcribed from ` +
        `${sourceCount()} public documents — annual reports, audited financial statements and ` +
        `universities' written answers to congressional inquiries. Every figure carries a citation ` +
        `to its source document. Gaps are labelled rather than estimated.`,
      temporalCoverage: `${DATA.minFy}/${DATA.maxFy}`,
      isAccessibleForFree: true,
      inLanguage: "en-US",
      url: `${SITE_URL}/methodology`,
      variableMeasured: [
        "asset allocation by category",
        "annual investment return",
        "endowment market value",
      ],
    },
  ];
  return { "@context": "https://schema.org", "@graph": graph };
}

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/translate", label: "Translate" },
  { href: "/compare", label: "Compare" },
  { href: "/glossary", label: "Glossary" },
  { href: "/methodology", label: "Methodology" },
] as const;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
        <script
          type="application/ld+json"
          // Static, build-time JSON from our own data — no user input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData()) }}
        />
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-sky-700 focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <div aria-hidden="true" className="h-0.5" style={{ background: SCHOOL_GRADIENT }} />
          <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-6 gap-y-2 px-4 py-4 sm:px-6">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight hover:text-sky-800 dark:hover:text-sky-300"
            >
              Endowment&nbsp;Explorer
            </Link>
            <nav aria-label="Main" className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-zinc-600 underline-offset-4 hover:text-zinc-950 hover:underline dark:text-zinc-400 dark:hover:text-zinc-50"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
          {children}
        </main>
        {/* One always-mounted live region that speaks <Term> definitions. */}
        <TermAnnouncer />
        <footer>
          <div aria-hidden="true" className="h-0.5" style={{ background: SCHOOL_GRADIENT }} />
          <div className="mx-auto flex max-w-5xl flex-wrap items-baseline gap-x-2 gap-y-1 px-4 py-3.5 text-xs text-zinc-500 sm:px-6 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wide text-zinc-700 dark:text-zinc-300">
              Education, not financial advice.
            </span>
            <span>
              This site knows nothing about you and can&rsquo;t tell you what to do with your
              money.
            </span>
            <span>
              Every number is from a cited public document —{" "}
              <Link href="/methodology" className="underline underline-offset-4 hover:text-zinc-800 dark:hover:text-zinc-200">
                sources &amp; methodology
              </Link>
              .
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
