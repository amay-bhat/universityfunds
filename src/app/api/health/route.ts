import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

// Uptime/health probe. Added 2026-08-05 during the Tier 3 operational pass, when
// the audit found no monitoring of any kind: an uptime checker had nothing to
// point at except page routes, which are statically rendered and therefore return
// 200 even while the database is unreachable. This endpoint is the only surface
// that actually proves the data path works end to end.
//
// Deliberately minimal about what it reveals. On failure it returns a generic
// string and logs the real error server-side (Vercel captures stderr), because
// a driver error can carry the connection host and must never reach a response
// body on a public endpoint.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const started = Date.now();
  try {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(schools);
    const ms = Date.now() - started;
    // A reachable database with zero schools means the seed never ran — up, but
    // not serving. Worth distinguishing from healthy.
    const seeded = (row?.n ?? 0) > 0;
    return NextResponse.json(
      { ok: seeded, db: "reachable", seeded, schools: row?.n ?? 0, latencyMs: ms },
      { status: seeded ? 200 : 503, headers: { "cache-control": "no-store" } },
    );
  } catch (err) {
    console.error("[health] database unreachable", err);
    return NextResponse.json(
      { ok: false, db: "unreachable", latencyMs: Date.now() - started },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
