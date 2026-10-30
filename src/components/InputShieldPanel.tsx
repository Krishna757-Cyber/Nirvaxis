"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  UploadCloud, FileText, Flame, GraduationCap, Plane, Home, ShieldCheck,
  ChevronDown, ChevronUp, Eye, Fingerprint, Loader2, Wand2, Stamp, Languages,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { Scenario } from '../lib/types';
import { SCENARIOS } from '../lib/scenarios';
import { redact, tokenColor, type TokenType } from '../lib/piiShield';

/* ---------- Seed literal → deterministic TOKEN type map (for curation-driven masking) ---------- */
function seedTypeFor(s: Scenario): TokenType[] {
  const m: Record<string, TokenType> = {
    NAME: 'PERSON', EMAIL: 'EMAIL', PHONE: 'PHONE', ADDR: 'ADDRESS',
    AADHAAR: 'ID', PAN: 'ID', ACCT: 'ID', PNR: 'REF', ID: 'REF', AMOUNT: 'REF',
  };
  return s.pii.map((p) => m[p.type] ?? 'REF');
}

interface Props {
  scenario: Scenario;
  onScenario: (id: string) => void;
  masked: string;
  onMasked: (m: string) => void;
  tokenList: { token: string; value: string; type: string }[];
  onTokenList: (t: { token: string; value: string; type: string }[]) => void;
  phase: 'idle' | 'running' | 'done';
  onResolve: () => void;
  progress: number; // 0..1
}

const SCENARIO_ICONS = [GraduationCap, Plane, Home] as const;
const SEED_CACHE: Record<string, string[]> = {};

export default function InputShieldPanel({
  scenario, onScenario, masked, onMasked, tokenList, onTokenList, phase, onResolve, progress,
}: Props) {
  const [rawText, setRawText] = useState(scenario.rawNotice);
  const [vent, setVent] = useState(scenario.ventText);
  const [dragOver, setDragOver] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [showVent, setShowVent] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [maskTimeMs, setMaskTimeMs] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const seeds = useMemo(() => scenario.pii.map((p) => p.value), [scenario]);

  const runMask = useCallback((text: string) => {
    const t0 = performance.now();
    const result = redact(text, seeds, seedTypeFor(scenario));
    setMaskTimeMs(Math.max(1, Math.round(performance.now() - t0)));
    onMasked(result.masked);
    onTokenList(result.tokens.map((t) => ({ token: t.token, value: t.value, type: t.type })));
  }, [scenario, seeds, onMasked, onTokenList]);

  // Re-seed whenever scenario changes
  useEffect(() => {
    setRawText(scenario.rawNotice);
    setVent(scenario.ventText);
    setHydrated(false);
    setShowRaw(false);
  }, [scenario.id, scenario]);

  // Initial + live masking of the working text
  useEffect(() => {
    runMask(rawText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawText]);

  const handleFile = useCallback((file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? '');
      setRawText(`${text}\n\n— Local file: ${file.name} (processed on-device)`);
    };
    reader.readAsText(file);
  }, []);

  const total = tokenList.length;

  const hydratedText = useMemo(() => {
    let out = masked;
    for (const t of tokenList) out = out.split(t.token).join(t.value);
    return out;
  }, [masked, tokenList]);

  return (
    <section className="panel flex h-full min-h-0 flex-col overflow-hidden">
      {/* Panel header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Fingerprint size={13} className="text-cyan-400" />
          <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200">Input · Privacy Shield</h2>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-lime-400/30 bg-lime-400/10 px-2 py-1">
          <ShieldCheck size={10} className="text-lime-400" />
          <span className="font-mono-t text-[8px] font-bold tracking-widest text-lime-300">ON-DEVICE · ZERO PII LEAVES</span>
        </div>
      </div>

      <div className="scroll-slim min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {/* Scenario picker */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono-t text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-500">01 · Load a case file</span>
            <span className="font-mono-t text-[8px] text-slate-600">3 PRE-SEED FILES</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {SCENARIOS.map((s, i) => {
              const Icon = SCENARIO_ICONS[i];
              const active = s.id === scenario.id;
              return (
                <button
                  key={s.id}
                  onClick={() => onScenario(s.id)}
                  className={`group relative flex flex-col items-start gap-1 rounded-xl border p-2 text-left transition-all duration-200 ${
                    active
                      ? 'border-lime-400/50 bg-gradient-to-br from-lime-400/15 via-cyan-400/10 to-transparent shadow-[0_0_20px_rgba(163,230,53,0.12)]'
                      : 'border-slate-800 bg-slate-900/50 hover:border-slate-700'
                  }`}
                >
                  <Icon size={14} className={active ? 'text-lime-400' : 'text-slate-500 group-hover:text-slate-300'} />
                  <span className={`font-display text-[9px] font-bold leading-tight ${active ? 'text-slate-100' : 'text-slate-400'}`}>{s.label.split('—')[0].trim()}</span>
                  <span className="font-mono-t text-[7px] uppercase tracking-wider text-slate-600">{s.tag.split('·')[0].trim()}</span>
                  {active && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-lime-400 shadow-[0_0_6px_rgba(163,230,53,0.8)]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files?.[0]); }}
          className={`panel-inset group relative overflow-hidden transition-all ${dragOver ? 'border-cyan-400/60 bg-cyan-400/5' : ''}`}
        >
          <div className="flex items-center gap-2.5 p-2.5">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-slate-700/80 bg-slate-900">
              {dragOver ? <UploadCloud size={16} className="text-cyan-400" /> : <FileText size={16} className="text-slate-500" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold text-slate-300">Drop the rejection letter / PDF / HTML</p>
              <p className="font-mono-t text-[7.5px] uppercase tracking-wider text-slate-600">Parsed locally · never uploaded raw</p>
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="shrink-0 rounded-md border border-slate-700 px-2 py-1.5 font-mono-t text-[8px] font-bold tracking-widest text-slate-400 transition-colors hover:border-cyan-400/50 hover:text-cyan-300"
            >
              BROWSE
            </button>
            <input ref={fileRef} type="file" accept=".pdf,.txt,.html,.eml,.png,.jpg" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
          </div>
          {/* Raw notice viewer */}
          <div className="border-t border-slate-800/70">
            <button onClick={() => setShowRaw((v) => !v)} className="flex w-full items-center justify-between px-2.5 py-1.5 font-mono-t text-[8px] font-bold uppercase tracking-[0.18em] text-slate-500 transition-colors hover:text-slate-300">
              <span>{showRaw ? 'Hide' : 'View'} raw case text ({rawText.length} chars)</span>
              {showRaw ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {showRaw && (
              <textarea
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                spellCheck={false}
                className="scroll-slim max-h-44 min-h-28 w-full resize-y border-t border-slate-800/70 bg-black/40 px-3 py-2 font-mono-t text-[9px] leading-relaxed text-slate-400 outline-none focus:text-slate-200"
              />
            )}
          </div>
        </div>

        {/* Vent box */}
        <div className="panel-inset overflow-hidden">
          <button onClick={() => setShowVent((v) => !v)} className="flex w-full items-center gap-2 px-2.5 py-2 text-left">
            <Flame size={12} className="shrink-0 text-orange-400" />
            <span className="flex-1 truncate text-[10px] font-semibold text-orange-200/90">Vent box — say it raw, we&apos;ll translate the rage into law</span>
            {showVent ? <ChevronUp size={11} className="text-slate-500" /> : <ChevronDown size={11} className="text-slate-500" />}
          </button>
          {showVent && (
            <div className="border-t border-slate-800/70 p-2">
              <textarea
                value={vent}
                onChange={(e) => setVent(e.target.value)}
                rows={3}
                spellCheck={false}
                className="scroll-slim w-full resize-none rounded-lg border border-orange-400/20 bg-orange-950/10 p-2 text-[10.5px] leading-relaxed text-orange-100/90 outline-none focus:border-orange-400/40"
              />
              <p className="mt-1 font-mono-t text-[7.5px] uppercase tracking-wider text-orange-300/50">Distilled into objective facts before drafting · emotional register never reaches the officer</p>
            </div>
          )}
        </div>

        {/* WHAT THE AI SAW — the masked view */}
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye size={12} className="text-amber-400" />
              <span className="font-mono-t text-[8.5px] font-bold uppercase tracking-[0.2em] text-amber-400/90">What the AI actually saw</span>
            </div>
            <button
              onClick={() => setHydrated((v) => !v)}
              className="flex items-center gap-1.5 rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 font-mono-t text-[7.5px] font-bold tracking-widest text-amber-300 transition-all hover:bg-amber-400/20"
              title="Re-hydration happens HERE, on this device, after inference"
            >
              <Languages size={9} />
              {hydrated ? 'SHOW MASKED' : 'RE-HYDRATE LOCALLY'}
            </button>
          </div>
          <div className="panel-inset relative max-h-36 overflow-hidden">
            <AnimatePresence>{phase === 'running' && <div className="scanline-bar z-10" />}</AnimatePresence>
            <pre className="scroll-slim max-h-36 overflow-y-auto whitespace-pre-wrap p-2.5 font-mono-t text-[8.5px] leading-[1.7] text-slate-300">
              {hydrated ? hydratedText : masked}
            </pre>
          </div>
          <div className="mt-1 flex items-center justify-between font-mono-t text-[7px] uppercase tracking-wider text-slate-600">
            <span>Masked in {maskTimeMs}ms · deterministic regex + seed map</span>
            <span className="text-amber-500">{total} tokens · 6 classes</span>
          </div>
        </div>

        {/* Token inventory */}
        <div className="flex flex-wrap gap-1">
          {tokenList.slice(0, 12).map((t) => (
            <span
              key={t.token + t.value}
              className={`rounded border px-1.5 py-0.5 font-mono-t text-[7.5px] ${tokenColor(t.type)}`}
              title={`Re-hydrates locally to: ${t.value}`}
            >
              {t.token}
            </span>
          ))}
          {total > 12 && <span className="chip">+{total - 12} more</span>}
        </div>

        {/* THE RESOLVE BUTTON */}
        <div className="pt-1">
          <button
            onClick={onResolve}
            disabled={phase === 'running'}
            className={`cta-frame group relative flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl font-display text-[12px] font-extrabold uppercase tracking-[0.28em] transition-all duration-300 ${
              phase === 'running'
                ? 'cursor-wait bg-slate-900 text-lime-300'
                : 'bg-gradient-to-r from-lime-400 via-emerald-400 to-cyan-400 text-slate-950 hover:shadow-[0_0_40px_rgba(163,230,53,0.4)] active:scale-[0.99]'
            }`}
          >
            {phase === 'running' ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                <span>Orchestrating {Math.round(progress * 100)}%</span>
                <div className="absolute bottom-0 left-0 h-[3px] bg-lime-400/80 transition-all duration-200" style={{ width: `${progress * 100}%` }} />
              </>
            ) : phase === 'done' ? (
              <>
                <Stamp size={15} />
                <span>Run Complete — Re-resolve</span>
                <Wand2 size={13} className="opacity-70" />
              </>
            ) : (
              <>
                <Stamp size={15} />
                <span>Resolve This Dispute</span>
                <Wand2 size={13} className="opacity-70 transition-transform duration-300 group-hover:rotate-12" />
              </>
            )}
          </button>
          <p className="mt-1.5 text-center font-mono-t text-[7px] uppercase tracking-[0.2em] text-slate-600">
            Nano classify · Super draft · Ultra red-team · Tavily verify · determinism &gt; vibes
          </p>
        </div>
      </div>
    </section>
  );
}
