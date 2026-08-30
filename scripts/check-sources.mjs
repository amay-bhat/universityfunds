#!/usr/bin/env node
/**
 * check:sources — citation-rot detection over every source in `data/sources.json`.
 *
 * Why this exists. The methodology page publishes all 96 citations to readers,
 * and the site's entire claim on their trust is that each number traces to a
 * document they can go and read. **31 of those 96 are already Internet Archive
 * captures**, and Harvard's are archival in their entirety — `hmc.harvard.edu`
 * dropped the originals. A citation that 404s is not a small cosmetic problem
 * here; it is the claim failing in the one place the reader can check it.
 * Nothing was watching for it.
 *
 * How it avoids the trap this project already fell into. Yale's report URLs
 * return **HTTP 200 with an identical 34,550-byte HTML page for every year** —
 * a soft-404. A checker that trusts status codes reports all of them healthy.
 * So this fingerprints CONTENT, not status: content type, length, and a hash of
 * the first bytes. Two sources whose URLs differ but whose fingerprints are
 * identical are flagged as a probable soft-404, which is precisely the signal a
 * status check cannot see.
 *
 * Severity, deliberately three-way, because the network is not the site:
 *   DEAD      — 4xx/5xx, DNS failure, or a probable soft-404. A real problem.
 *   CHANGED   — resolves, but the fingerprint moved since the baseline. Usually
 *               a site rebuild; occasionally the document being replaced under
 *               the same URL, which matters much more.
 *   UNREACHED — timeout or transport error. Reported, never failed on: that is
 *               far more often this machine's network than the publisher's.
 *
 * Baseline lives at `conduct/source-fingerprints.json`. It is an operations
 * artifact, not curation — `data/` stays source of truth and is never written.
 *
 *   npm run check:sources                     check every source
 *   npm run check:sources -- --update         re-baseline after reviewing
 *   npm run check:sources -- --only archive   only URLs matching a substring
 *   npm run check:sources -- --limit 10       stop after N (a quick smoke test)
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const ROOT = process.cwd();
// `--sources <path>` points at a fixture instead of the real citations, which
// is what makes the dead-link and soft-404 paths testable without editing
// `data/`. Same reasoning as `seed.ts --data-dir`: a negative control that
// requires touching the source of truth will not get run.
const SOURCES = (() => {
  const i = process.argv.indexOf("--sources");
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : join(ROOT, "data", "sources.json");
})();
const BASELINE = join(ROOT, "conduct", "source-fingerprints.json");

const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);
const value = (name, dflt) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : dflt;
};

const UPDATE = flag("--update");
const ONLY = value("--only", null);
const LIMIT = Number(value("--limit", "0")) || 0;
const TIMEOUT_MS = Number(value("--timeout", "25000"));
const CONCURRENCY = Number(value("--concurrency", "4"));
const SAMPLE_BYTES = 64 * 1024;

/**
 * Hosts that serve a generic error page to every non-interactive client,
 * whatever it claims to be. These are reported as BLOCKED rather than DEAD:
 * the document is still there for a person with a browser, so failing on them
 * would turn this into a gate that is always red and therefore always ignored —
 * the exact failure this project spent a day removing from `verify.sh`.
 *
 * BLOCKED is not a pass. It means "this tool cannot check this one", and the
 * summary says so. Every entry must carry the evidence for its claim; do not
 * add a host here to quiet a failure you have not diagnosed.
 */
const AUTOMATION_BLOCKED = {
  "finance.yahoo.com": {
    reason:
      "301s to a trailing-slash URL which then returns 500/503 to any non-interactive client. " +
      "Verified identical for our honest user agent, a current Chrome user agent, and no user " +
      "agent at all, so it is anti-automation behaviour and not a removed document — " +
      "finance.yahoo.com itself still returns 200. A reader with a browser still gets the page.",
    verified: "2026-08-29",
  },
};

const sources = JSON.parse(readFileSync(SOURCES, "utf8"));
let targets = sources.filter((s) => s.url);
if (ONLY) targets = targets.filter((s) => s.url.includes(ONLY) || s.id.includes(ONLY));
if (LIMIT) targets = targets.slice(0, LIMIT);

/** Fetch at most SAMPLE_BYTES and fingerprint what came back. */
async function probe(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: {
        // Identify honestly. Archive.org and university sites both serve
        // differently to an unlabelled client, and pretending to be a browser
        // to get better treatment is not something this project does.
        "user-agent":
          "universityfunds-citation-check/1.0 (+https://universityfunds.vercel.app/methodology)",
        accept: "*/*",
      },
    });

    const type = (res.headers.get("content-type") ?? "").split(";")[0].trim();
    const declared = Number(res.headers.get("content-length") ?? "0") || null;

    let read = 0;
    const hash = createHash("sha256");
    if (res.body) {
      for await (const chunk of res.body) {
        hash.update(chunk);
        read += chunk.length;
        if (read >= SAMPLE_BYTES) break;
      }
    }
    try { await res.body?.cancel(); } catch { /* already drained */ }

    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url,
      type,
      bytes: declared ?? read,
      sampled: read,
      hash: hash.digest("hex").slice(0, 16),
    };
  } catch (e) {
    return { ok: false, status: 0, error: e.name === "AbortError" ? "timeout" : String(e.message ?? e) };
  } finally {
    clearTimeout(timer);
  }
}

async function pooled(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, async () => {
      while (true) {
        const i = next++;
        if (i >= items.length) return;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

console.log(`\x1b[1mcheck:sources — citation rot across ${targets.length} cited document(s)\x1b[0m`);
console.log(`  concurrency ${CONCURRENCY}, timeout ${TIMEOUT_MS}ms, sampling first ${SAMPLE_BYTES / 1024}KB\n`);

let done = 0;
const results = await pooled(targets, CONCURRENCY, async (s) => {
  const r = await probe(s.url);
  done++;
  process.stdout.write(`\r  probed ${done}/${targets.length}   `);
  return { id: s.id, title: s.title, publisher: s.publisher, url: s.url, ...r };
});
process.stdout.write("\r" + " ".repeat(40) + "\r");

// ---- soft-404 detection: distinct URLs that return byte-identical content ----
const byFingerprint = new Map();
for (const r of results) {
  if (!r.ok || !r.hash) continue;
  const key = `${r.type}:${r.bytes}:${r.hash}`;
  if (!byFingerprint.has(key)) byFingerprint.set(key, []);
  byFingerprint.get(key).push(r);
}
// Only DISTINCT urls returning identical content indicate a soft-404. Several
// sources legitimately cite the same document at different pages, and those
// share a url and a fingerprint by design — flagging them would be a false
// positive on exactly the careful citation practice this project insists on.
const softGroups = [...byFingerprint.values()].filter(
  (g) => new Set(g.map((r) => r.url)).size > 1,
);
const soft404 = new Set(softGroups.flat().map((r) => r.id));

// ------------------------------------------------------------------ classify
const dead = [], changed = [], unreached = [], healthy = [], blocked = [];
const hostOf = (u) => { try { return new URL(u).hostname; } catch { return ""; } };
let baseline = {};
try { baseline = JSON.parse(readFileSync(BASELINE, "utf8")).sources ?? {}; } catch { /* first run */ }

for (const r of results) {
  if (r.status === 0) { unreached.push(r); continue; }
  if (!r.ok && AUTOMATION_BLOCKED[hostOf(r.url)]) { blocked.push(r); continue; }
  if (!r.ok || soft404.has(r.id)) { dead.push(r); continue; }
  const was = baseline[r.id];
  if (was && (was.hash !== r.hash || was.type !== r.type)) { changed.push(r); continue; }
  healthy.push(r);
}

const line = (r, extra = "") =>
  `    ${r.id}\n      ${r.url}\n      ${extra}`;

if (dead.length) {
  console.log(`\x1b[31m  DEAD — ${dead.length}\x1b[0m  (a reader following this citation does not get the document)`);
  for (const r of dead) {
    const why = soft404.has(r.id)
      ? `probable SOFT-404: HTTP ${r.status} but byte-identical to another source (${r.type}, ${r.bytes}B)`
      : `HTTP ${r.status}`;
    console.log(line(r, why));
  }
  if (softGroups.length) {
    console.log(`\n    Soft-404 groups (identical content behind different URLs):`);
    for (const g of softGroups) console.log(`      ${g.map((r) => r.id).join(" = ")}`);
  }
  console.log();
}

if (changed.length) {
  console.log(`\x1b[33m  CHANGED — ${changed.length}\x1b[0m  (still resolves; the bytes moved since the baseline)`);
  for (const r of changed) {
    const was = baseline[r.id];
    console.log(line(r, `${was.type} ${was.bytes}B ${was.hash} → ${r.type} ${r.bytes}B ${r.hash}`));
  }
  console.log(`    A site rebuild is the usual cause. But check at least one by hand: the same URL\n    now serving a DIFFERENT document is the case that silently breaks a citation.\n`);
}

if (blocked.length) {
  console.log(`\x1b[36m  BLOCKED — ${blocked.length}\x1b[0m  (host refuses automated clients; NOT verified healthy — check these by hand)`);
  const hosts = [...new Set(blocked.map((r) => hostOf(r.url)))];
  for (const r of blocked) console.log(line(r, `HTTP ${r.status} — ${hostOf(r.url)} blocks automation`));
  for (const h of hosts) {
    console.log(`\n    ${h}: ${AUTOMATION_BLOCKED[h].reason}`);
    console.log(`      (diagnosed ${AUTOMATION_BLOCKED[h].verified})`);
  }
  console.log();
}

if (unreached.length) {
  console.log(`\x1b[90m  UNREACHED — ${unreached.length}\x1b[0m  (transport failure — usually this machine, not the publisher; not a failure)`);
  for (const r of unreached) console.log(line(r, r.error));
  console.log();
}

console.log(
  `\x1b[32m  HEALTHY — ${healthy.length}\x1b[0m of ${results.length} probed` +
    (blocked.length ? `; ${blocked.length} unverifiable by this tool` : ""),
);

if (UPDATE) {
  const record = {};
  for (const r of [...healthy, ...changed]) {
    record[r.id] = { url: r.url, type: r.type, bytes: r.bytes, hash: r.hash, checked: new Date().toISOString().slice(0, 10) };
  }
  writeFileSync(
    BASELINE,
    JSON.stringify(
      {
        _comment:
          "Content fingerprints for the cited documents, written by scripts/check-sources.mjs. " +
          "An operations baseline, NOT curation — data/sources.json is the source of truth and is " +
          "never written by this script. Re-baseline with `npm run check:sources -- --update` only " +
          "after reviewing what CHANGED and why.",
        updated: new Date().toISOString().slice(0, 10),
        note: `${Object.keys(record).length} of ${results.length} probed sources fingerprinted; dead and unreachable ones are omitted rather than recorded as good.`,
        sources: record,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(`\n  baseline written to conduct/source-fingerprints.json (${Object.keys(record).length} entries)`);
}

console.log();
// Only genuine rot fails. Transport failures do not, or a flaky café network
// would turn this into a gate nobody trusts.
process.exit(dead.length > 0 ? 1 : 0);
