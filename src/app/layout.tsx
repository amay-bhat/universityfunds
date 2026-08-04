import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "University Endowment Investing Explorer",
    template: "%s — Endowment Explorer",
  },
  description:
    "How Yale, Harvard, Stanford, MIT and Princeton actually invested over 25 years, what a buy-it-yourself ETF version looks like, and how it compares with simple index investing. Education, not financial advice.",
};

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/translate", label: "Translate" },
  { href: "/compare", label: "Compare" },
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
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-sky-700 focus:px-3 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <header className="border-b border-zinc-200 dark:border-zinc-800">
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
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto max-w-5xl space-y-2 px-4 py-6 text-sm text-zinc-600 sm:px-6 dark:text-zinc-400">
            <p className="font-medium text-zinc-800 dark:text-zinc-200">
              Education, not financial advice.
            </p>
            <p>
              This site explains how five university endowments invested. It knows nothing about
              you and never will — it cannot and does not tell you what to do with your money.
            </p>
            <p>
              Every number here comes from a cited public document; the{" "}
              <Link href="/methodology" className="underline underline-offset-4">
                methodology page
              </Link>{" "}
              lists every source and every known gap.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
