import { db } from "@/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbOk = false;
  try {
    await db.execute(sql`select 1`);
    dbOk = true;
  } catch {
    dbOk = false;
  }
  return Response.json({
    ok: true,
    status: "healthy",
    engine: "NIRVAXIS",
    database: dbOk ? "connected" : "standalone",
    timestamp: new Date().toISOString(),
  });
}
