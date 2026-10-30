import "server-only";

export interface TavilySource {
  title: string;
  url: string;
  content: string;
  raw_content: string;
}

export function normalizeQuote(value: string) {
  return value.normalize("NFKC").toLocaleLowerCase("en-US").replace(/<[^>]*>/g, " ").replace(/&(?:nbsp|amp|quot|apos|#\d+);/g, " ").replace(/[^\p{L}\p{N}]+/gu, " ").trim().replace(/\s+/g, " ");
}

/** Token overlap is diagnostic ONLY; a VERIFIED quote requires a contiguous normalized match. */
export function verifyQuoteInSource(quote: string, rawSource: string) {
  const normalizedQuote = normalizeQuote(quote);
  const normalizedSource = normalizeQuote(rawSource);
  const tokens = normalizedQuote.split(" ").filter(Boolean);
  if (tokens.length < 5 || normalizedQuote.length < 24 || !normalizedSource) {
    return { verified: false, score: 0, method: "NONE" as const };
  }
  const sourceTokens = new Set(normalizedSource.split(" "));
  const overlap = tokens.filter((token) => sourceTokens.has(token)).length / tokens.length;
  const exact = ` ${normalizedSource} `.includes(` ${normalizedQuote} `);
  return { verified: exact, score: exact ? 1 : Number(overlap.toFixed(3)), method: exact ? "NORMALIZED_EXACT" as const : "TOKEN_OVERLAP_ONLY" as const };
}

export function isOfficialSource(url: string, allowedDomains: string[]) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    return allowedDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch { return false; }
}

export async function searchOfficialSources(query: string, domains: string[]): Promise<TavilySource[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) throw new Error("Tavily is not configured");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST", cache: "no-store", signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ query: query.slice(0, 400), search_depth: "advanced", include_raw_content: "text", include_answer: false, max_results: 4, include_domains: domains, include_domains_mode: "restrict", topic: "general" }),
    });
    if (!response.ok) throw new Error(`Tavily unavailable (${response.status})`);
    const data: unknown = await response.json();
    if (!data || typeof data !== "object" || !("results" in data) || !Array.isArray(data.results)) throw new Error("Invalid Tavily response");
    return data.results.flatMap((result: unknown) => {
      if (!result || typeof result !== "object") return [];
      const row = result as Record<string, unknown>;
      if (typeof row.url !== "string" || !isOfficialSource(row.url, domains) || typeof row.raw_content !== "string" || row.raw_content.length < 80) return [];
      return [{ title: typeof row.title === "string" ? row.title : new URL(row.url).hostname, url: row.url, content: typeof row.content === "string" ? row.content : "", raw_content: row.raw_content.slice(0, 40000) }];
    });
  } finally { clearTimeout(timer); }
}
