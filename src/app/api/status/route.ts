import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ nebiusConfigured: Boolean(process.env.NEBIUS_API_KEY), tavilyConfigured: Boolean(process.env.TAVILY_API_KEY), timeoutMs: 8000, piiStorage: "BROWSER_MEMORY_ONLY", persistence: "ANONYMOUS_TELEMETRY_ONLY" }, { headers: { "Cache-Control": "no-store" } });
}
