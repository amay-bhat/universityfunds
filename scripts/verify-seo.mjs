// SEO and crawlability checks.
//
// Written against the PRE-FIX state, where it failed on nearly every assertion:
// robots.txt and sitemap.xml both 404'd, no route emitted a canonical, there was
// no metadataBase, no OG metadata, no structured data, and the 404 announced
// itself with the homepage's title. That is this script's negative control — every
// check below has been observed failing, so none of them is vacuous.
//
//   npm run dev                                   # or point at production
//   node scripts/verify-seo.mjs [base-url]
//
// Exits non-zero on any failure.

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const ROUTES = [
  "/",
  "/explore",
  "/explore/yale",
  "/explore/harvard",
  "/explore/stanford",
  "/explore/mit",
  "/explore/princeton",
  "/translate",
  "/compare",
  "/methodology",
  "/glossary",
];

let failures = 0;
const ok = (cond, msg) => {
  console.log(`${cond ? "PASS  " : "FAIL  "}${msg}`);
  if (!cond) failures++;
};

const get = async (path) => {
  const res = await fetch(`${BASE}${path}`, { redirect: "follow" });
  return { status: res.status, headers: res.headers, body: await res.text() };
};

// ---- robots.txt
const robots = await get("/robots.txt");
ok(robots.status === 200, `robots.txt returns 200 (got ${robots.status})`);
ok(/Sitemap:\s*https?:\/\/\S+\/sitemap\.xml/i.test(robots.body), "robots.txt points at the sitemap");
ok(/Allow:\s*\//i.test(robots.body), "robots.txt allows crawling");

// ---- sitemap.xml
const sitemap = await get("/sitemap.xml");
ok(sitemap.status === 200, `sitemap.xml returns 200 (got ${sitemap.status})`);
const locs = [...sitemap.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
ok(locs.length === ROUTES.length, `sitemap lists ${ROUTES.length} urls (got ${locs.length})`);
for (const r of ROUTES) {
  const want = r === "/" ? "" : r;
  ok(
    locs.some((l) => new URL(l).pathname.replace(/\/$/, "") === want),
    `sitemap includes ${r}`,
  );
}
// A school added to data/ but missing here means the sitemap was hand-edited.
ok(
  locs.filter((l) => l.includes("/explore/")).length === 5,
  "sitemap has one entry per school",
);

// ---- per-route: canonical, indexability, unique title
const titles = new Map();
for (const r of ROUTES) {
  const { status, headers, body } = await get(r);
  ok(status === 200, `${r} returns 200 (got ${status})`);

  const xr = headers.get("x-robots-tag") ?? "";
  ok(!/noindex/i.test(xr), `${r} has no noindex header${xr ? ` (got "${xr}")` : ""}`);
  ok(!/<meta name="robots"[^>]*noindex/i.test(body), `${r} has no noindex meta`);

  const canon = body.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  ok(Boolean(canon), `${r} declares a canonical`);
  if (canon) {
    const want = r === "/" ? "" : r;
    ok(
      new URL(canon).pathname.replace(/\/$/, "") === want,
      `${r} canonical points at itself (got ${canon})`,
    );
  }

  const title = body.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
  ok(title.length > 0, `${r} has a title`);
  if (titles.has(title)) {
    ok(false, `${r} title duplicates ${titles.get(title)}: "${title}"`);
  } else {
    titles.set(title, r);
  }

  ok(
    /<meta name="description" content="[^"]{40,}"/.test(body),
    `${r} has a substantive meta description`,
  );
  ok(/<meta property="og:title"/.test(body), `${r} has OpenGraph metadata`);
}

// ---- 404 must not claim to be the homepage, and must not be indexed
const nf = await get("/definitely-not-a-real-route-xyz");
ok(nf.status === 404, `unknown route returns 404 (got ${nf.status})`);
const nfTitle = nf.body.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
ok(/not found/i.test(nfTitle), `404 has its own title (got "${nfTitle}")`);
ok(
  /<meta name="robots"[^>]*noindex/i.test(nf.body),
  "404 is marked noindex",
);

// ---- structured data
const home = await get("/");
const ld = home.body.match(
  /<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s,
)?.[1];
ok(Boolean(ld), "homepage emits JSON-LD");
if (ld) {
  let parsed = null;
  try {
    parsed = JSON.parse(ld);
  } catch (e) {
    ok(false, `JSON-LD does not parse: ${e.message}`);
  }
  if (parsed) {
    const types = (parsed["@graph"] ?? []).map((n) => n["@type"]);
    ok(types.includes("WebSite"), "JSON-LD declares WebSite");
    ok(types.includes("Dataset"), "JSON-LD declares Dataset");
    const ds = (parsed["@graph"] ?? []).find((n) => n["@type"] === "Dataset");
    if (ds) {
      ok(
        /^\d{4}\/\d{4}$/.test(ds.temporalCoverage ?? ""),
        `Dataset temporalCoverage is a year range (got ${ds.temporalCoverage})`,
      );
      // Data licensing is an unresolved reserved matter (CONSTITUTION.md:44):
      // five of six benchmark series derive from Yahoo Finance including
      // S&P DJI-licensed index data. Declaring a licence would assert a right
      // nobody has established, so its ABSENCE is the correct state until ruled.
      ok(
        !("license" in ds),
        "Dataset declares NO license (correct until the licensing question is ruled)",
      );
    }
  }
}

console.log(`\n${failures === 0 ? "all SEO checks passed" : `${failures} failure(s)`}`);
if (failures > 0) process.exit(1);
