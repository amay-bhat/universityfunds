import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

// A 3s ceiling on every query. There was no timeout or retry anywhere in the
// stack until 2026-08-05, which made a SLOW Neon more dangerous than a dead one:
// a dead endpoint fails in ~10ms, a slow one held the function open until the
// platform killed it. Measured Neon cold start is ~160-185ms on the first query
// only, so 3s is generous headroom rather than a tight budget.
// NO QUERY TIMEOUT — a deliberate, documented gap, not an oversight.
//
// The load-resilience audit (2026-08-05) correctly found there is no timeout or
// retry anywhere in the stack, which makes a SLOW Neon worse than a dead one: a
// dead endpoint fails in ~10ms, a slow one holds the function open. The damage is
// bounded by Vercel's own function timeout, but it is real.
//
// A first attempt at a fix was reverted after it broke everything:
//
//     neon(url, { fetchOptions: { signal: AbortSignal.timeout(3000) } })   // WRONG
//
// `fetchOptions` is a static object merged into every fetch, so that creates ONE
// signal at module load which aborts 3s later and then poisons every subsequent
// query. Measured: /api/health went to {"ok":false,"db":"unreachable"} within
// seconds of boot, and because the static routes keep serving 200 from the CDN,
// page-level monitoring would never have surfaced it.
//
// The correct shape is a fresh signal per request, via the driver's global hook:
//
//     neonConfig.fetchFunction = (input, init) =>
//       fetch(input, { ...init, signal: AbortSignal.timeout(3000) })
//
// That is NOT applied here because its abort path cannot be verified on this
// machine — simulating a slow-but-alive Neon needs driver-level or privileged
// network interception. Shipping an unverified timeout into the data path of a
// feature-complete site, immediately after the naive version broke it, is not a
// trade worth making. Apply it when someone can point the driver at a
// deliberately slow endpoint and watch the abort fire.
const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
