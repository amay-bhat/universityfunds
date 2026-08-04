import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
      <h1 className="text-2xl font-semibold">That page doesn&rsquo;t exist</h1>
      <p className="text-zinc-600 dark:text-zinc-400">
        Maybe the address changed, or maybe it never was. The five schools live under{" "}
        <Link href="/explore" className="underline underline-offset-4">
          Explore
        </Link>
        .
      </p>
      <p>
        <Link href="/" className="text-sky-700 underline underline-offset-4 dark:text-sky-400">
          Back to the start
        </Link>
      </p>
    </div>
  );
}
