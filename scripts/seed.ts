/**
 * npm run seed — loads the hand-curated seed files in `data/` into Neon.
 *
 * `data/` is the source of truth (see data/README.md); this script only ever
 * writes in that direction.
 *
 * Two guarantees, both load-bearing:
 *   - Validation runs to completion before the database module is even imported,
 *     so a bad edit never reaches Neon. See scripts/lib/seed-validate.ts.
 *   - The write itself is one batched transaction, so a failure partway through
 *     rolls back rather than leaving the tables half-updated.
 *
 * Re-running is idempotent: rows are upserted on their natural keys (ids stay
 * stable) and rows deleted from the seed files are pruned from the database.
 *
 * Flags:
 *   --write             perform the database write (what `npm run seed` passes)
 *   --dry-run           validate only — no database connection needed
 *   --data-dir <path>   read a different data directory
 *
 * With neither --write nor --dry-run this validates and stops. Writing is opt-in
 * because the write prunes: a run against half-finished seed files deletes the
 * rows that aren't in them yet, so it must never be something you get by
 * accident. `npm run seed:dry` is the safe form to use while curating —
 * `npm run seed --dry-run` does NOT work, because npm swallows `--dry-run` as
 * its own flag and the script would never see it (guarded against below).
 */

import { config } from "dotenv";
import path from "node:path";

import { describeCounts, loadSeedData, type SeedData } from "./lib/seed-validate";

config({ path: ".env.local", quiet: true });

// ---------------------------------------------------------------------------
// Write to Neon
// ---------------------------------------------------------------------------

async function writeSeedData(data: SeedData) {
  // Imported lazily so validation works without DATABASE_URL set.
  const { db } = await import("../src/lib/db");
  const t = await import("../src/lib/db/schema");
  const { inArray, sql } = await import("drizzle-orm");

  // Read the current natural keys first. These are read-only, so they sit
  // outside the transaction; only the mutations below are batched.
  const existingAllocations = await db
    .select({
      id: t.allocations.id,
      schoolId: t.allocations.schoolId,
      fiscalYear: t.allocations.fiscalYear,
      category: t.allocations.category,
    })
    .from(t.allocations);
  const existingReturns = await db
    .select({
      id: t.endowmentReturns.id,
      schoolId: t.endowmentReturns.schoolId,
      fiscalYear: t.endowmentReturns.fiscalYear,
    })
    .from(t.endowmentReturns);
  const existingBenchmarks = await db
    .select({
      id: t.benchmarkReturns.id,
      series: t.benchmarkReturns.series,
      fiscalYear: t.benchmarkReturns.fiscalYear,
    })
    .from(t.benchmarkReturns);
  const existingProxies = await db
    .select({ category: t.proxyMappings.category })
    .from(t.proxyMappings);
  const existingSources = await db.select({ id: t.sources.id }).from(t.sources);
  const existingSchools = await db.select({ id: t.schools.id }).from(t.schools);

  const staleIds = <T>(rows: { id: T; key: string }[], keep: Set<string>): T[] =>
    rows.filter((r) => !keep.has(r.key)).map((r) => r.id);

  const staleAllocationIds = staleIds(
    existingAllocations.map((r) => ({
      id: r.id,
      key: `${r.schoolId}|${r.fiscalYear}|${r.category}`,
    })),
    new Set(data.allocations.map((a) => `${a.schoolId}|${a.fiscalYear}|${a.category}`)),
  );
  const staleReturnIds = staleIds(
    existingReturns.map((r) => ({ id: r.id, key: `${r.schoolId}|${r.fiscalYear}` })),
    new Set(data.endowmentReturns.map((r) => `${r.schoolId}|${r.fiscalYear}`)),
  );
  const staleBenchmarkIds = staleIds(
    existingBenchmarks.map((r) => ({ id: r.id, key: `${r.series}|${r.fiscalYear}` })),
    new Set(data.benchmarkReturns.map((b) => `${b.series}|${b.fiscalYear}`)),
  );
  const staleProxyCategories = staleIds(
    existingProxies.map((r) => ({ id: r.category, key: r.category })),
    new Set(data.proxyMappings.map((p) => p.category)),
  );
  const staleSourceIds = staleIds(
    existingSources.map((r) => ({ id: r.id, key: r.id })),
    new Set(data.sources.map((s) => s.id)),
  );
  const staleSchoolIds = staleIds(
    existingSchools.map((r) => ({ id: r.id, key: r.id })),
    new Set(data.schools.map((s) => s.id)),
  );

  type Statement = Parameters<typeof db.batch>[0][number];
  const statements: Statement[] = [];

  // Order inside the transaction keeps foreign keys satisfied at every step, and
  // upserting before pruning means an interrupted run could only ever leave a
  // superset of the correct data, never a gap.
  //
  // --- upsert dimensions ---
  if (data.schools.length > 0) {
    statements.push(
      db
        .insert(t.schools)
        .values(data.schools)
        .onConflictDoUpdate({
          target: t.schools.id,
          set: {
            name: sql`excluded.name`,
            managerName: sql`excluded.manager_name`,
            website: sql`excluded.website`,
          },
        }),
    );
  }

  if (data.sources.length > 0) {
    statements.push(
      db
        .insert(t.sources)
        .values(data.sources)
        .onConflictDoUpdate({
          target: t.sources.id,
          set: {
            title: sql`excluded.title`,
            publisher: sql`excluded.publisher`,
            url: sql`excluded.url`,
            documentType: sql`excluded.document_type`,
            page: sql`excluded.page`,
            accessedDate: sql`excluded.accessed_date`,
            notes: sql`excluded.notes`,
          },
        }),
    );
  }

  // --- upsert facts ---
  if (data.allocations.length > 0) {
    statements.push(
      db
        .insert(t.allocations)
        .values(
          data.allocations.map((a) => ({
            schoolId: a.schoolId,
            fiscalYear: a.fiscalYear,
            category: a.category,
            pct: String(a.pct),
            basis: a.basis,
            sourceLabel: a.sourceLabel,
            sourceId: a.sourceId,
          })),
        )
        .onConflictDoUpdate({
          target: [t.allocations.schoolId, t.allocations.fiscalYear, t.allocations.category],
          set: {
            pct: sql`excluded.pct`,
            basis: sql`excluded.basis`,
            sourceLabel: sql`excluded.source_label`,
            sourceId: sql`excluded.source_id`,
          },
        }),
    );
  }

  if (data.endowmentReturns.length > 0) {
    statements.push(
      db
        .insert(t.endowmentReturns)
        .values(
          data.endowmentReturns.map((r) => ({
            schoolId: r.schoolId,
            fiscalYear: r.fiscalYear,
            returnPct: r.returnPct === null ? null : String(r.returnPct),
            marketValueUsdMillions:
              r.marketValueUsdMillions === null ? null : String(r.marketValueUsdMillions),
            sourceId: r.sourceId,
          })),
        )
        .onConflictDoUpdate({
          target: [t.endowmentReturns.schoolId, t.endowmentReturns.fiscalYear],
          set: {
            returnPct: sql`excluded.return_pct`,
            marketValueUsdMillions: sql`excluded.market_value_usd_millions`,
            sourceId: sql`excluded.source_id`,
          },
        }),
    );
  }

  if (data.benchmarkReturns.length > 0) {
    statements.push(
      db
        .insert(t.benchmarkReturns)
        .values(
          data.benchmarkReturns.map((b) => ({
            series: b.series,
            fiscalYear: b.fiscalYear,
            returnPct: String(b.returnPct),
            sourceId: b.sourceId,
          })),
        )
        .onConflictDoUpdate({
          target: [t.benchmarkReturns.series, t.benchmarkReturns.fiscalYear],
          set: {
            returnPct: sql`excluded.return_pct`,
            sourceId: sql`excluded.source_id`,
          },
        }),
    );
  }

  if (data.proxyMappings.length > 0) {
    statements.push(
      db
        .insert(t.proxyMappings)
        .values(data.proxyMappings)
        .onConflictDoUpdate({
          target: t.proxyMappings.category,
          set: {
            etfTicker: sql`excluded.etf_ticker`,
            etfName: sql`excluded.etf_name`,
            rationale: sql`excluded.rationale`,
            honestyNote: sql`excluded.honesty_note`,
            sourceId: sql`excluded.source_id`,
          },
        }),
    );
  }

  // --- prune facts (rows no longer in the seed files) ---
  if (staleAllocationIds.length > 0) {
    statements.push(db.delete(t.allocations).where(inArray(t.allocations.id, staleAllocationIds)));
  }
  if (staleReturnIds.length > 0) {
    statements.push(
      db.delete(t.endowmentReturns).where(inArray(t.endowmentReturns.id, staleReturnIds)),
    );
  }
  if (staleBenchmarkIds.length > 0) {
    statements.push(
      db.delete(t.benchmarkReturns).where(inArray(t.benchmarkReturns.id, staleBenchmarkIds)),
    );
  }
  if (staleProxyCategories.length > 0) {
    statements.push(
      db.delete(t.proxyMappings).where(inArray(t.proxyMappings.category, staleProxyCategories)),
    );
  }

  // --- prune dimensions last, so nothing still references them ---
  if (staleSourceIds.length > 0) {
    statements.push(db.delete(t.sources).where(inArray(t.sources.id, staleSourceIds)));
  }
  if (staleSchoolIds.length > 0) {
    statements.push(db.delete(t.schools).where(inArray(t.schools.id, staleSchoolIds)));
  }

  const pruneSummary = [
    [staleAllocationIds.length, "allocations"],
    [staleReturnIds.length, "endowment_returns"],
    [staleBenchmarkIds.length, "benchmark_returns"],
    [staleProxyCategories.length, "proxy_mappings"],
    [staleSourceIds.length, "sources"],
    [staleSchoolIds.length, "schools"],
  ]
    .filter(([count]) => (count as number) > 0)
    .map(([count, label]) => `${count} from ${label}`);

  // Destructured rather than cast: db.batch takes a non-empty tuple, and this
  // proves it is non-empty instead of asserting it.
  const [first, ...rest] = statements;
  if (first === undefined) {
    console.log("  nothing to write — the database already matches data/.");
    return;
  }

  if (pruneSummary.length > 0) {
    console.log(`  pruning stale row(s): ${pruneSummary.join(", ")}`);
  }

  await db.batch([first, ...rest]);
  console.log(`  applied ${statements.length} statement(s) in one transaction`);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

type Args = { write: boolean; dataDir: string };

export function parseArgs(argv: string[], env: NodeJS.ProcessEnv = process.env): Args {
  let write = false;
  let explicitDryRun = false;
  let dataDir = path.join(process.cwd(), "data");

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") {
      explicitDryRun = true;
    } else if (arg === "--write") {
      write = true;
    } else if (arg === "--data-dir") {
      const value = argv[++i];
      if (value === undefined || value.startsWith("--")) {
        throw new Error("--data-dir needs a path");
      }
      dataDir = path.resolve(value);
    } else {
      throw new Error(
        `unknown argument \`${arg}\` (expected --write, --dry-run or --data-dir <path>)`,
      );
    }
  }

  if (write && explicitDryRun) {
    throw new Error("--write and --dry-run contradict each other — pass one");
  }

  // `npm run seed --dry-run` doesn't forward the flag: npm consumes it as its
  // own and the script sees only `--write`, so the run would write. npm does
  // export its own flags to the child environment, which lets us catch the
  // mistake instead of silently pruning half a curation session's work.
  if (write && env.npm_config_dry_run === "true") {
    console.warn(
      "npm swallowed `--dry-run` (it is an npm flag), so it never reached this script.\n" +
        "Treating this as a dry run and NOT writing. Use `npm run seed:dry` instead.",
    );
    return { write: false, dataDir };
  }

  return { write, dataDir };
}

async function main() {
  const { write, dataDir } = parseArgs(process.argv.slice(2));

  console.log(`Reading seed files from ${path.relative(process.cwd(), dataDir) || "."}/`);
  const { data, report } = loadSeedData(dataDir);

  console.log(`Parsed: ${describeCounts(data)}`);

  // One buffered write per stream: console.error is async on a pipe, and
  // process.exit() would discard whatever is still buffered — which used to
  // truncate long error reports at 64 KiB with no marker.
  if (report.warnings.length > 0) {
    process.stderr.write(
      report.warnings.map((w) => `  warning  ${w.where}: ${w.message}`).join("\n") + "\n",
    );
  }

  if (report.errors.length > 0) {
    process.stderr.write(
      `\n${report.errors.length} validation error(s) — nothing was written:\n\n` +
        report.errors.map((e) => `  ${e.where}: ${e.message}`).join("\n") +
        "\n\nFix the files in data/ and re-run. The database is untouched.\n",
    );
    process.exitCode = 1;
    return;
  }

  console.log(
    `Validation passed${report.warnings.length > 0 ? ` (${report.warnings.length} warning(s))` : ""}.`,
  );

  if (!write) {
    console.log("Validation only — nothing written. Pass --write (or run `npm run seed`) to write.");
    return;
  }

  if (!process.env.DATABASE_URL) {
    process.stderr.write("DATABASE_URL is not set — run `vercel env pull .env.local` first.\n");
    process.exitCode = 1;
    return;
  }

  console.log("Writing to Neon…");
  await writeSeedData(data);
  console.log("Seed complete.");
}

main().catch((err) => {
  process.stderr.write(`\nSeed failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exitCode = 1;
});
