import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

// Canonical origin. The site is reachable at the production domain AND at
// per-deployment and git-branch aliases, all of which are indexable duplicates
// unless every page declares one canonical. Override via env when the domain
// changes rather than editing this in five places.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://universityfunds.vercel.app"
).replace(/\/$/, "");

export const SITE_NAME = "University Endowment Investing Explorer";

// Read at build time from the seed files, which are the source of truth. Deriving
// these rather than hard-coding them means a data refresh cannot leave the
// sitemap or the structured data asserting a stale year — the defect class this
// project's fact-registry rules exist to prevent.
function readData() {
  const dir = join(process.cwd(), "data", "schools");
  let maxFy = 0;
  const schools: string[] = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
    schools.push(f.replace(/\.json$/, ""));
    for (const r of d.endowmentReturns ?? []) {
      if (typeof r.fiscalYear === "number" && r.fiscalYear > maxFy) maxFy = r.fiscalYear;
    }
    for (const a of d.allocations ?? []) {
      if (typeof a.fiscalYear === "number" && a.fiscalYear > maxFy) maxFy = a.fiscalYear;
    }
  }
  let minFy = maxFy;
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
    const d = JSON.parse(readFileSync(join(dir, f), "utf8"));
    for (const r of [...(d.endowmentReturns ?? []), ...(d.allocations ?? [])]) {
      if (typeof r.fiscalYear === "number" && r.fiscalYear < minFy) minFy = r.fiscalYear;
    }
  }
  return { schools: schools.sort(), minFy, maxFy };
}

export const DATA = readData();

export function sourceCount(): number {
  const p = join(process.cwd(), "data", "sources.json");
  return JSON.parse(readFileSync(p, "utf8")).length;
}

// The coverage end, as a date, for sitemap `lastModified`. Four of the five
// schools close their fiscal year on 30 June; Stanford's ends 31 August. The
// earlier date is used deliberately — a sitemap timestamp is a crawl hint, not a
// data claim, and overstating it would be the one thing this project will not do.
export const COVERAGE_END_DATE = new Date(Date.UTC(DATA.maxFy, 5, 30));
