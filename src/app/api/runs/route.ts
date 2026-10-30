import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { resolutionRuns } from "@/db/schema";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const runs = await db.select().from(resolutionRuns).orderBy(desc(resolutionRuns.createdAt)).limit(12);
    return NextResponse.json({ runs, available: true }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ runs: [], available: false }, { headers: { "Cache-Control": "no-store" } }); }
}
