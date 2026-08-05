"use client";

import { useEffect } from "react";

// Route error boundary. Renders inside the root layout, so the site-wide
// disclaimer in the footer stays visible even on an error page.
export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Surface the error in the browser console. Deliberately NOT beaconed to a
  // collection endpoint: there is no privacy policy on this site yet (Tier 1
  // finding), so adding client-side transmission would widen a known gap to buy
  // telemetry. Server-side errors already reach Vercel's logs automatically, and
  // the digest shown below is the correlation key — a reader quoting it lets the
  // exact stack be found. Revisit once a privacy policy exists.
  useEffect(() => {
    console.error("[route-error]", { digest: error.digest, message: error.message });
  }, [error]);

  return (
    <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        The page hit an error while loading its data. Nothing you did caused it, and no data was
        changed — this site only ever reads.
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded bg-sky-700 px-4 py-2 text-white hover:bg-sky-800"
      >
        Try again
      </button>
      {error.digest && (
        <p className="text-xs text-zinc-400">Error reference: {error.digest}</p>
      )}
    </div>
  );
}
