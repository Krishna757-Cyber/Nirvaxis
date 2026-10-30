"use client";

import { Activity, Cpu, Gauge, Layers, Radio, ShieldCheck, Sparkles, User2, Building2, Zap } from 'lucide-react';
import type { Mode } from '../lib/types';
import { MODEL_BADGES } from '../lib/resolver';
import { buildHash } from '../lib/letterMaps';
import { useCopied } from '../lib/hooks';

interface Props {
  mode: Mode;
  onMode: (m: Mode) => void;
  live: boolean;
  onToggleLive: (v: boolean) => void;
  phase: 'idle' | 'running' | 'done';
  elapsedMs: number;
  scenarioTag: string;
  scenarioId: string;
}

function fmtClock(ms: number) {
  const s = ms / 1000;
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = (s % 60).toFixed(2).padStart(5, '0');
  return `${mm}:${ss}`;
}

export default function TelemetryBar({ mode, onMode, live, onToggleLive, phase, elapsedMs, scenarioTag, scenarioId }: Props) {
  const [copied, copy] = useCopied(1400);
  const build = buildHash(scenarioId + scenarioTag);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-800/70 bg-[#05070d]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-[52px] max-w-[1760px] items-center gap-3 px-3 md:px-5">
        {/* Brand */}
        <a href="#/" className="flex shrink-0 items-center gap-2.5">
          <img src="/pentagon-emblem.png" alt="NIRVAXIS" className="h-7 w-7 object-contain drop-shadow-[0_0_10px_rgba(163,230,53,0.4)]" />
          <div className="leading-none">
            <div className="font-display text-[11.5px] font-extrabold tracking-[0.16em] text-slate-100">NIR<span className="text-lime-400">VAX</span><span className="text-cyan-400">IS</span></div>
            <div className="mt-[3px] font-mono-t text-[7.5px] uppercase tracking-[0.22em] text-slate-500">Bilateral Friction → Resolution</div>
          </div>
        </a>

        <div className="hidden h-5 w-px bg-slate-800 lg:block" />

        {/* Live telemetry cluster */}
        <div className="hidden min-w-0 flex-1 items-center gap-4 overflow-hidden font-mono-t text-[10px] text-slate-400 lg:flex">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <span className={`h-1.5 w-1.5 rounded-full ${phase === 'running' ? 'animate-ping bg-cyan-400' : 'pulse-dot bg-lime-400'}`} />
            <span className="text-slate-500">TOKEN FACTORY</span>
            <span className="text-slate-200">{phase === 'running' ? 'STREAMING' : 'NOMINAL'}</span>
          </span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap xl:flex">
            <Gauge size={11} className="text-cyan-400" />
            <span className="text-slate-200">{fmtClock(elapsedMs)}</span>
          </span>
          <span className="hidden items-center gap-1.5 whitespace-nowrap 2xl:flex">
            <Zap size={11} className="text-lime-400" />
            <span className="text-slate-500">p95</span><span className="text-slate-200">2.14s</span>
          </span>
          {/* Model badges */}
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            {MODEL_BADGES.map((m) => (
              <button
                key={m.id}
                title={`${m.slug} — $${m.rate}/M tok`}
                onClick={() => copy(m.slug)}
                className="group flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-900/60 py-1 pl-1.5 pr-2 transition-colors hover:border-lime-400/40"
              >
                <Cpu size={10} style={{ color: m.color }} />
                <span className="text-[8.5px] font-bold tracking-wider" style={{ color: m.color }}>{m.tier}</span>
                <Activity size={9} className="text-slate-600 transition-colors group-hover:text-lime-400" />
              </button>
            ))}
            <button
              title="Tavily Search API — .gov/.org allowlist"
              className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-1"
            >
              <ShieldCheck size={10} className="text-emerald-400" />
              <span className="text-[8.5px] font-bold tracking-wider text-emerald-400">TAVILY</span>
            </button>
          </div>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          {/* Cached replay toggle */}
          <button
            onClick={() => onToggleLive(!live)}
            title={live ? 'Live mode: real Nebius/Tavily keys from env detected — click to force cached replay' : 'Cached replay mode — deterministic demo trace. Add VITE_NEBIUS_API_KEY + VITE_TAVILY_API_KEY to go live.'}
            className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 py-1.5 pl-2 pr-2.5 transition-all hover:border-amber-400/40"
          >
            {live ? <Radio size={11} className="text-rose-400" /> : <Layers size={11} className="text-amber-400" />}
            <span className="font-mono-t text-[8.5px] font-bold tracking-widest text-slate-300">{live ? 'LIVE TRACE' : 'CACHED REPLAY'}</span>
            <span className={`relative h-3.5 w-6 rounded-full transition-colors ${live ? 'bg-rose-500/70' : 'bg-slate-700'}`}>
              <span className={`absolute top-[2px] h-2.5 w-2.5 rounded-full bg-white transition-all ${live ? 'left-[11px]' : 'left-[2px]'}`} />
            </span>
          </button>

          {/* Build tag */}
          <button onClick={() => copy(build)} className="hidden items-center gap-1.5 rounded-md border border-slate-800 px-2 py-1.5 font-mono-t text-[8.5px] text-slate-500 transition-colors hover:text-lime-400 md:flex" title="Deterministic run hash — click to copy">
            <Sparkles size={9} />
            {copied ? 'COPIED' : `BUILD ${build}`}
          </button>

          {/* Mode switch */}
          <div className="relative flex items-center rounded-xl border border-slate-800 bg-slate-950/80 p-1">
            {([['citizen', User2, 'CITIZEN'], ['owner', Building2, 'OWNER']] as const).map(([m, Icon, label]) => {
              const active = mode === m;
              return (
                <button
                  key={m}
                  onClick={() => onMode(m as Mode)}
                  className={`relative flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono-t text-[9px] font-bold tracking-[0.18em] transition-colors md:px-3.5 ${active ? 'text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
                >
                  {active && (
                    <span
                      className="absolute inset-0 rounded-lg bg-gradient-to-r from-lime-400 to-cyan-400 shadow-[0_0_18px_rgba(163,230,53,0.35)]"
                      style={{ transition: 'all .3s' }}
                    />
                  )}
                  <Icon size={11} className="relative z-10" />
                  <span className="relative z-10">{label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
      {/* Hairline telemetry sweep */}
      <div className="pointer-events-none absolute bottom-0 left-0 h-px w-full overflow-hidden">
        <div className="h-full w-40 bg-gradient-to-r from-transparent via-lime-400/80 to-transparent" style={{ animation: 'sweepBar 3.2s linear infinite' }} />
      </div>
      <style>{`@keyframes sweepBar { 0% { transform: translateX(-30%);} 100% { transform: translateX(180vw);} }`}</style>
    </header>
  );
}
