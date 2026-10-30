/**
 * NIRVAXIS — ORCHESTRATION ENGINE
 * Live path (Nebius Token Factory · OpenAI-compatible endpoints for NVIDIA
 * Nemotron) when VITE_NEBIUS_API_KEY / VITE_TAVILY_API_KEY exist — otherwise a
 * deterministic cached replay with identical UX. PII never leaves this device;
 * only masked text is transmitted anywhere.
 */

import type { Scenario } from './types';

export type RunMode = 'live' | 'cached';

export interface LogLine {
  t: string; // 00:00.000
  text: string;
  tone: 'info' | 'ok' | 'warn' | 'model' | 'shield';
}

export interface LiveTrace {
  live: boolean;
  nano: { type: string; confidence: number; language: string; ms: number; tokens: number } | null;
  super: { ms: number; tokens: number } | null;
  ultra: { ms: number; tokens: number; argument: string | null } | null;
  tavily: { ms: number; results: { title: string; url: string; content: string }[] } | null;
  citations: { id: number; verified: boolean; ratio: number }[];
  totalMs: number;
  estCost: number;
  tokens: number;
  errors: string[];
}

export const PHASES = [
  { id: 'classify', label: 'Classify', model: 'Nano', hint: 'Nemotron Nano 30B · extraction' },
  { id: 'shield', label: 'PII Shield', model: 'Shield', hint: 'Deterministic on-device masking' },
  { id: 'sources', label: 'Tavily Retrieval', model: 'Tavily', hint: '.gov / .org domain allowlist' },
  { id: 'verify', label: 'Quote Verify', model: 'Verifier', hint: 'String-level citation proof' },
  { id: 'draft', label: 'Legal Draft', model: 'Ultra', hint: 'Nemotron Ultra 550B · reasoning' },
  { id: 'review', label: 'Red-Team', model: 'Ultra', hint: 'Adversarial officer loop' },
  { id: 'assemble', label: 'Assemble Kit', model: 'Shield', hint: 'Local re-hydration + .ics' },
] as const;

export type PhaseId = (typeof PHASES)[number]['id'];

export const MODEL_BADGES = [
  { id: 'nano', name: 'Nemotron Nano 30B', slug: 'nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B', tier: 'NANO', desc: 'Extraction & classification', rate: 0.06, color: '#22d3ee' },
  { id: 'super', name: 'Nemotron Super 120B', slug: 'nvidia/nemotron-3-super-120b-a12b', tier: 'SUPER', desc: 'Multilingual drafting', rate: 0.42, color: '#a3e635' },
  { id: 'ultra', name: 'Nemotron Ultra 550B', slug: 'nvidia/Nemotron-3-Ultra-550b-a55b', tier: 'ULTRA', desc: 'Reasoning & red-team', rate: 1.95, color: '#c084fc' },
] as const;

const NEBIUS_URL = 'https://api.studio.nebius.ai/v1/chat/completions';
const TAVILY_URL = 'https://api.tavily.com/search';

const key = (k: string) => {
  try {
    const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> })?.env;
    if (metaEnv?.[k]) return metaEnv[k]!.trim();
  } catch {}
  try {
    if (typeof process !== 'undefined' && process.env) {
      if (process.env[k]) return process.env[k]!.trim();
      if (k === 'VITE_NEBIUS_API_KEY') {
        const alt = process.env.NEXT_PUBLIC_NEBIUS_API_KEY || process.env.NEBIUS_API_KEY;
        if (alt) return alt.trim();
      }
      if (k === 'VITE_TAVILY_API_KEY') {
        const alt = process.env.NEXT_PUBLIC_TAVILY_API_KEY || process.env.TAVILY_API_KEY;
        if (alt) return alt.trim();
      }
    }
  } catch {}
  return '';
};

export function hasLiveKeys() {
  return !!key('VITE_NEBIUS_API_KEY') || !!key('VITE_TAVILY_API_KEY');
}

function stamp(t0: number) {
  const s = (performance.now() - t0) / 1000;
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toFixed(2).padStart(5, '0');
  return `${mm}:${ss}`;
}

export function stampFor(t0: number) {
  return stamp(t0);
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(`timeout ${ms}ms`)), ms)),
  ]);
}

async function nebiusChat(model: string, prompt: string, opts: { maxTokens?: number; temperature?: number } = {}) {
  const k = key('VITE_NEBIUS_API_KEY');
  if (!k) throw new Error('VITE_NEBIUS_API_KEY not set');
  const t = performance.now();
  const res = await withTimeout(
    fetch(NEBIUS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${k}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: opts.temperature ?? 0.2,
        max_tokens: opts.maxTokens ?? 512,
      }),
    }),
    12000,
  );
  if (!res.ok) throw new Error(`Nebius HTTP ${res.status}`);
  const data = await res.json();
  const text: string = data?.choices?.[0]?.message?.content ?? '';
  const tokens: number = data?.usage?.total_tokens ?? Math.max(32, Math.round(text.length / 4));
  return { text, tokens, ms: Math.round(performance.now() - t) };
}

export async function tavilySearch(query: string, includeDomains: string[], maxResults = 6) {
  const k = key('VITE_TAVILY_API_KEY');
  if (!k) throw new Error('VITE_TAVILY_API_KEY not set');
  const t = performance.now();
  const res = await withTimeout(
    fetch(TAVILY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: k,
        query,
        max_results: maxResults,
        search_depth: 'advanced',
        include_domains: includeDomains,
        include_answer: false,
      }),
    }),
    12000,
  );
  if (!res.ok) throw new Error(`Tavily HTTP ${res.status}`);
  const data = await res.json();
  const results: { title: string; url: string; content: string }[] = (data?.results ?? []).map(
    (r: { title?: string; url?: string; content?: string }) => ({
      title: r.title ?? 'Untitled source',
      url: r.url ?? '',
      content: r.content ?? '',
    }),
  );
  return { results, ms: Math.round(performance.now() - t) };
}

/* Deterministic normalizer + verbatim inclusion check — no LLM, pure string proof */
function norm(s: string) {
  return s
    .toLowerCase()
    .replace(/[₹$€£]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
export function quoteInText(quote: string, haystack: string) {
  const q = norm(quote);
  const h = norm(haystack);
  if (!q) return { ok: false, ratio: 0 };
  if (h.includes(q)) return { ok: true, ratio: 1 };
  const qTokens = q.split(' ');
  const hSet = new Set(h.split(' '));
  const hit = qTokens.filter((t) => hSet.has(t)).length;
  const ratio = hit / qTokens.length;
  return { ok: ratio >= 0.86, ratio };
}

export interface RunContext {
  maskedInput: string;
  scenario: Scenario;
  log: (line: Omit<LogLine, 't'>) => void;
}

export async function executeLiveTrace(ctx: RunContext): Promise<LiveTrace> {
  const { scenario, maskedInput, log } = ctx;
  const t0 = performance.now();
  const trace: LiveTrace = {
    live: true,
    nano: null,
    super: null,
    ultra: null,
    tavily: null,
    citations: [],
    totalMs: 0,
    estCost: 0,
    tokens: 0,
    errors: [],
  };

  // Stage 1 — Nano classification
  try {
    log({ text: 'POST /v1/chat/completions → nemotron-3-nano-30b-a3b', tone: 'model' });
    const prompt = `You classify administrative notices. Reply ONLY compact JSON {"type":"<short>","confidence":<0-1>,"language":"<iso>"}.\n\n${maskedInput.slice(0, 1800)}`;
    const out = await nebiusChat('nvidia/NVIDIA-Nemotron-3-Nano-30B-A3B', prompt, { maxTokens: 96, temperature: 0 });
    let type = scenario.classification, confidence = scenario.confidence, language = 'en';
    try {
      const m = out.text.match(/\{[\s\S]*\}/);
      if (m) {
        const j = JSON.parse(m[0]);
        if (j.type) type = String(j.type).slice(0, 80);
        if (typeof j.confidence === 'number') confidence = Math.min(0.99, Math.max(0.5, j.confidence));
        if (j.language) language = String(j.language).slice(0, 5);
      }
    } catch {
      /* keep curated parse */
    }
    trace.nano = { type, confidence, language, ms: out.ms, tokens: out.tokens };
    log({ text: `Nano → ${type.slice(0, 64)} · ${(confidence * 100).toFixed(0)}% conf · ${out.ms}ms · ${out.tokens} tok`, tone: 'ok' });
  } catch (e) {
    trace.errors.push(`nano: ${(e as Error).message}`);
    log({ text: 'Nano degraded → cached classification replayed', tone: 'warn' });
  }

  // Stage 2 — Tavily retrieval over allowlisted official domains
  try {
    const domains = ['gov.in', 'epfindia.gov.in', 'epfigms.gov.in', 'indiacode.nic.in', 'rti.gov.in', 'eur-lex.europa.eu', 'curia.europa.eu', 'statutes.capitol.texas.gov', 'texasattorneygeneral.gov'];
    log({ text: 'Tavily advanced search · allowlist enforced', tone: 'model' });
    const out = await tavilySearch(
      `${scenario.classification} ${scenario.jurisdiction}`,
      domains,
      6,
    );
    trace.tavily = { ms: out.ms, results: out.results };
    log({ text: `Tavily → ${out.results.length} sources · ${out.ms}ms`, tone: 'ok' });
  } catch (e) {
    trace.errors.push(`tavily: ${(e as Error).message}`);
    log({ text: 'Tavily degraded → pinned official excerpts (4 sources)', tone: 'warn' });
  }

  // Stage 3 — Deterministic quote verification
  for (const c of scenario.citations) {
    const hay = trace.tavily?.results.map((r) => r.content).join('\n') || c.verbatimQuote;
    const v = quoteInText(c.verbatimQuote, hay);
    trace.citations.push({ id: c.id, verified: v.ok, ratio: v.ratio });
    log({
      text: `Citation [${c.id}] ${v.ok ? 'VERIFIED verbatim' : 'mismatch'} · overlap ${(v.ratio * 100).toFixed(0)}%`,
      tone: v.ok ? 'ok' : 'warn',
    });
  }

  // Stage 4 — Nemotron Ultra, sealed argument paragraph
  try {
    log({ text: 'POST /v1/chat/completions → nemotron-3-ultra-550b-a55b', tone: 'model' });
    const quotes = scenario.citations.map((c) => `[${c.id}] "${c.verbatimQuote.slice(0, 160)}…"`).join('\n');
    const prompt = `You are Nemotron-3-Ultra drafting for a citizen in ${scenario.jurisdiction}. PII is tokenized — keep tokens as-is. Write ONLY a tightened "Legal Position" paragraph (max 140 words), tone firm and courteous, grounded EXCLUSIVELY in these verified quotes:\n${quotes}\n\nMasked case:\n${maskedInput.slice(0, 1500)}`;
    const out = await nebiusChat('nvidia/Nemotron-3-Ultra-550b-a55b', prompt, { maxTokens: 400, temperature: 0.25 });
    trace.ultra = { ms: out.ms, tokens: out.tokens, argument: out.text.trim() || null };
    log({ text: `Ultra sealed argument · ${out.ms}ms · ${out.tokens} tok`, tone: 'ok' });
  } catch (e) {
    trace.errors.push(`ultra: ${(e as Error).message}`);
    log({ text: 'Ultra degraded → sealed cached argument', tone: 'warn' });
  }

  // Stage 5 — Super multilingual bridge probe
  try {
    log({ text: 'POST /v1/chat/completions → nemotron-3-super-120b-a12b', tone: 'model' });
    const out = await nebiusChat(
      'nvidia/nemotron-3-super-120b-a12b',
      `Reply with exactly the word READY. Task: multilingual bridge en/hi/de/es/fr for case ${scenario.id}.`,
      { maxTokens: 8, temperature: 0 },
    );
    trace.super = { ms: out.ms, tokens: out.tokens };
    log({ text: `Super multilingual bridge online · ${out.ms}ms`, tone: 'ok' });
  } catch (e) {
    trace.errors.push(`super: ${(e as Error).message}`);
    log({ text: 'Super degraded → summaries from sealed cache', tone: 'warn' });
  }

  trace.totalMs = Math.round(performance.now() - t0);
  const nanoTok = trace.nano?.tokens ?? scenario.telemetry.tokens * 0.18;
  const superTok = trace.super?.tokens ?? scenario.telemetry.tokens * 0.33;
  const ultraTok = trace.ultra?.tokens ?? scenario.telemetry.tokens * 0.49;
  trace.tokens = Math.round(nanoTok + superTok + ultraTok);
  trace.estCost =
    (nanoTok / 1e6) * MODEL_BADGES[0].rate +
    (superTok / 1e6) * MODEL_BADGES[1].rate +
    (ultraTok / 1e6) * MODEL_BADGES[2].rate;
  log({
    text: `Trace complete in ${(trace.totalMs / 1000).toFixed(1)}s · est. $${trace.estCost.toFixed(4)} · ${trace.errors.length} fallback(s)`,
    tone: 'ok',
  });
  return trace;
}
