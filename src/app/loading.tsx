// Streaming fallback. Its real job is not the loading state — it is that without
// a loading boundary Next buffers the whole response, so when a dynamic page
// throws (e.g. the database is unreachable) the client never receives the layout
// shell and a no-JS visitor or crawler gets a blank page with only a <title>.
// Measured 2026-08-05: /compare during a database outage returned 500 with no
// <main>, no header, no footer and no visible text at all. With this boundary the
// shell flushes first, so the site chrome and the error boundary are both seen.
export default function Loading() {
  return (
    <div className="py-16 text-center text-zinc-500 dark:text-zinc-400" role="status">
      <p>Loading…</p>
    </div>
  );
}
