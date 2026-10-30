"use client";

import { CheckCircle2, Circle, Loader2, ShieldCheck, Terminal, GitBranch, AlertTriangle, Wrench, ShieldQuestion, ScanSearch } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Scenario } from '../lib/types';
import { PHASES, type PhaseId, type LogLine } from '../lib/resolver';
import { useEffect, useRef } from 'react';

export type NodeState = 'pending' | 'active' | 'verified' | 'patched' | 'flagged';

export interface GraphNodeView {
  id: string;
  label: string;
  status: NodeState;
}

interface Props {
  scenario: Scenario;
  phase: 'idle' | 'running' | 'done';
  activePhase: PhaseId | null;
  nodeStates: Record<string, NodeState>;
  logs: LogLine[];
  visibleRedTeam: number; // -1 idle, 0..2 reveal index, 3 = all revealed + sealed
  onFocusSource: (url: string) => void;
}

const PHASE_TONE: Record<string, string> = {
  info: 'text-slate-400',
  ok: 'text-emerald-400',
  warn: 'text-amber-400',
  model: 'text-cyan-300',
  shield: 'text-lime-300',
};

export default function ActionGraph({ scenario, phase, activePhase, nodeStates, logs, visibleRedTeam, onFocusSource }: Props) {
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs.length]);

  const done = phase === 'done';

  // Action graph nodes per scenario (7 stages)
  const nodes: GraphNodeView[] = [
    { id: 'n1', label: 'Classify document', status: nodeStates.n1 ?? 'pending' },
    { id: 'n2', label: 'Mask PII on-device', status: nodeStates.n2 ?? 'pending' },
    { id: 'n3', label: 'Retrieve official sources', status: nodeStates.n3 ?? 'pending' },
    { id: 'n4', label: 'Verify quotes verbatim', status: nodeStates.n4 ?? 'pending' },
    { id: 'n5', label: 'Draft legal position', status: nodeStates.n5 ?? 'pending' },
    { id: 'n6', label: 'Red-team the draft', status: nodeStates.n6 ?? 'pending' },
    { id: 'n7', label: 'Assemble & re-hydrate', status: nodeStates.n7 ?? 'pending' },
  ];

  return (
    <section className="panel flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <GitBranch size={13} className="text-lime-400" />
          <h2 className="font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-200">Action Graph · Red-Team Arena</h2>
        </div>
        <div className="flex items-center gap-2 font-mono-t text-[8px] uppercase tracking-widest text-slate-500">
          <span className={done ? 'text-lime-400' : 'text-slate-500'}>{done ? '7/7 STAGES SEALED' : phase === 'running' ? 'EXECUTING' : 'AWAITING RUN'}</span>
        </div>
      </div>

      <div className="scroll-slim min-h-0 flex-1 overflow-y-auto p-3">
        {/* ── ORCHESTRATION TRACE (console) ─────────────────────────── */}
        <div className="panel-inset overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800/70 px-2.5 py-1.5">
            <div className="flex items-center gap-1.5">
              <Terminal size={10} className="text-slate-500" />
              <span className="font-mono-t text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500">orchestrator · nemotron routing trace</span>
            </div>
            <div className="flex gap-1">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              <span className="h-2 w-2 rounded-full bg-lime-500/70" />
            </div>
          </div>
          {/* Phase pills */}
          <div className="scroll-slim flex gap-1 overflow-x-auto border-b border-slate-800/70 px-2 py-1.5">
            {PHASES.map((p) => {
              const state = activePhase === p.id ? 'active' : done ? 'verified' : 'pending';
              return (
                <span
                  key={p.id}
                  title={p.hint}
                  className={`flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 font-mono-t text-[7px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    state === 'active'
                      ? 'border-cyan-400/50 bg-cyan-400/15 text-cyan-300'
                      : state === 'verified'
                        ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-500/80'
                        : 'border-slate-800 text-slate-600'
                  }`}
                >
                  {state === 'active' && <Loader2 size={8} className="animate-spin" />}
                  {p.label}
                </span>
              );
            })}
          </div>
          <div ref={logRef} className="scroll-slim h-[104px] overflow-y-auto bg-black/45 px-2.5 py-2 font-mono-t text-[8.5px] leading-[1.75]">
            {logs.length === 0 ? (
              <div className="text-slate-600">
                <span className="text-slate-700">$</span> nirvaxis — bilateral friction engine v1.0.0{'\n'}
                <span className="text-slate-700">$</span> awaiting case file… press <span className="rounded border border-lime-400/40 bg-lime-400/10 px-1 text-lime-400">RESOLVE THIS DISPUTE</span>
                <span className="caret text-lime-400"> ▊</span>
              </div>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <span className="shrink-0 text-slate-700">{l.t}</span>
                  <span className={PHASE_TONE[l.tone]}>{l.text}</span>
                </div>
              ))
            )}
            {phase === 'running' && <span className="caret text-lime-400">▊</span>}
          </div>
        </div>

        {/* ── ACTION GRAPH (vertical dependency nodes) ──────────────── */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <span className="font-mono-t text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-500">02 · Resolution dependency graph</span>
            <span className="font-mono-t text-[7px] text-slate-600">evidence-badged</span>
          </div>
          <ol className="relative ml-[7px] space-y-[3px] border-l border-slate-800 pl-4">
            {nodes.map((n) => {
              const s = n.status;
              const isErr = s === 'flagged';
              const isPatched = s === 'patched';
              const isActive = s === 'active';
              const isDone = s === 'verified' || isPatched;
              return (
                <li key={n.id} className="relative flex items-center gap-2 py-[2px]">
                  {/* Node bead */}
                  <span
                    className={`absolute -left-[21.5px] grid h-3.5 w-3.5 place-items-center rounded-full border transition-all duration-300 ${
                      isDone
                        ? 'border-emerald-400 bg-emerald-400/20'
                        : isActive
                          ? 'node-pulse border-cyan-400 bg-cyan-400/25'
                          : isErr
                            ? 'border-rose-400 bg-rose-400/25'
                            : 'border-slate-700 bg-slate-900'
                    }`}
                  >
                    {isDone && <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />}
                    {isActive && <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />}
                    {isErr && <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />}
                  </span>
                  <span className={`flex-1 text-[9.5px] leading-tight transition-colors duration-300 ${isDone ? 'text-slate-300' : isActive ? 'text-cyan-200' : 'text-slate-600'}`}>
                    {n.label}
                  </span>
                  {isDone && (
                    <span className={`flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.5 font-mono-t text-[6.5px] font-bold uppercase tracking-wider ${
                      isPatched ? 'border-amber-400/40 bg-amber-400/10 text-amber-400' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {isPatched ? 'patched' : <ShieldCheck size={8} />}
                      {isPatched ? '' : 'verified'}
                    </span>
                  )}
                  {isActive && <Loader2 size={11} className="shrink-0 animate-spin text-cyan-400" />}
                </li>
              );
            })}
          </ol>
        </div>

        {/* ── EVIDENCE LEDGER (Tavily sources) ──────────────────────── */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <span className="font-mono-t text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-500">03 · Deterministic evidence ledger</span>
            <span className="flex items-center gap-1 font-mono-t text-[7px] font-bold text-emerald-500"><ScanSearch size={8} /> TAVILY · .GOV/.ORG ONLY</span>
          </div>
          <div className="space-y-1">
            {scenario.citations.map((c) => (
              <button
                key={c.id}
                onClick={() => onFocusSource(c.url)}
                className="group flex w-full items-start gap-2 rounded-lg border border-slate-800/80 bg-slate-900/40 p-1.5 text-left transition-all hover:border-emerald-500/40 hover:bg-emerald-500/5"
              >
                <span className="mt-0.5 grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full bg-emerald-500/15 font-mono-t text-[7px] font-bold text-emerald-400 ring-1 ring-emerald-500/40">
                  {c.id}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[8.5px] font-semibold leading-tight text-slate-300 group-hover:text-slate-100">{c.source}</span>
                  <span className="mt-0.5 line-clamp-1 block font-serif-l text-[8px] italic leading-snug text-slate-500">“{c.verbatimQuote.slice(0, 110)}…”</span>
                </span>
                <span className="flex shrink-0 items-center gap-0.5 rounded border border-emerald-500/30 bg-emerald-500/10 px-1 py-0.5 font-mono-t text-[6px] font-bold text-emerald-400">
                  <CheckCircle2 size={7} /> VERBATIM
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── RED-TEAM ARENA ────────────────────────────────────────── */}
        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between px-0.5">
            <span className="font-mono-t text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-500">04 · Red-team officer — auto-patch loop</span>
            <span className="font-mono-t text-[7px] text-violet-400/80">NEMOTRON-3-ULTRA · ADVERSARIAL</span>
          </div>

          {/* Officer card */}
          <div className="overflow-hidden rounded-xl border border-violet-500/35 bg-gradient-to-br from-violet-950/50 via-slate-900/70 to-slate-950/80 shadow-[0_0_20px_rgba(192,132,252,0.15)]">
            <div className="flex items-center gap-2.5 border-b border-violet-500/20 p-2.5">
              <img src="/images/officer.png" alt="K3-ULTRON adjudication officer" className="h-12 w-12 shrink-0 rounded-lg border border-violet-400/50 object-cover object-[50%_18%] shadow-[0_0_18px_rgba(192,132,252,0.4)]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-display text-[11px] font-extrabold tracking-widest text-violet-300">K3-ULTRON</span>
                  <span className="rounded border border-violet-400/40 bg-violet-400/15 px-1 py-0.5 font-mono-t text-[6.5px] font-bold text-violet-300">STRICT REVIEWING OFFICER</span>
                  <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-emerald-400 ml-auto" title="K3-Ultron Online" />
                </div>
                <p className="mt-0.5 truncate text-[8px] text-slate-400">Three objections filed · three auto-patches merged into the final draft</p>
              </div>
            </div>

            <div className="space-y-1.5 p-2">
              {scenario.redTeam.map((r, i) => {
                const revealed = visibleRedTeam === 3 || visibleRedTeam > i;
                const current = visibleRedTeam === i && phase === 'running';
                return (
                  <div
                    key={r.id}
                    className={`overflow-hidden rounded-lg border transition-all duration-500 ${
                      revealed
                        ? 'border-violet-500/25 bg-slate-950/60'
                        : current
                          ? 'border-cyan-400/40 bg-cyan-400/5'
                          : 'border-slate-800/60 bg-transparent opacity-40'
                    }`}
                  >
                    <div className="flex items-center gap-2 px-2 pt-1.5">
                      <span className={`grid h-4 w-4 shrink-0 place-items-center rounded-full font-mono-t text-[7px] font-bold ${revealed ? 'bg-violet-500/30 text-violet-300' : 'bg-slate-800 text-slate-600'}`}>{r.id}</span>
                      {revealed ? (
                        <span className="flex items-center gap-1 font-mono-t text-[6.5px] font-bold uppercase tracking-widest text-rose-400/90"><AlertTriangle size={7} /> Objection sustained</span>
                      ) : current ? (
                        <span className="flex items-center gap-1 font-mono-t text-[6.5px] font-bold uppercase tracking-widest text-cyan-300"><Loader2 size={7} className="animate-spin" /> Officer reviewing…</span>
                      ) : (
                        <span className="flex items-center gap-1 font-mono-t text-[6.5px] font-bold uppercase tracking-widest text-slate-600"><Circle size={7} /> Round {r.id} — sealed</span>
                      )}
                    </div>
                    {revealed && (
                      <div className="space-y-1 px-2 pb-2 pt-1">
                        <p className="font-serif-l text-[9px] leading-snug text-slate-400"><span className="font-mono-t text-[7px] font-bold not-italic text-rose-400/80">OBJECTION&nbsp;·&nbsp;</span>{r.objection}</p>
                        <p className="flex items-start gap-1 font-serif-l text-[9px] leading-snug text-emerald-100/85"><Wrench size={8} className="mt-0.5 shrink-0 text-emerald-400" /><span><span className="font-mono-t text-[7px] font-bold not-italic text-emerald-500">PATCH&nbsp;·&nbsp;</span>{r.patch}</span></p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Seal strip */}
          <AnimatePresence>
            {done && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-lime-400/35 bg-lime-400/10 px-3 py-1.5"
              >
                <ShieldCheck size={12} className="text-lime-400" />
                <span className="font-mono-t text-[8.5px] font-bold uppercase tracking-[0.22em] text-lime-300">Red-teamed · 3 objections patched · draft sealed for filing</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Dead-man's question — human-in-the-loop guard */}
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-slate-800/70 bg-slate-950/50 p-2">
          <ShieldQuestion size={11} className="mt-0.5 shrink-0 text-slate-500" />
          <p className="text-[7.5px] leading-snug text-slate-500"><span className="font-bold text-slate-400">HUMAN-IN-THE-LOOP GUARD —</span> the sealed draft is a filing-ready artifact, not legal advice. A licensed advocate reviews before submission in production. NIRVAXIS is a drafting instrument; the signature remains yours.</p>
        </div>
      </div>
    </section>
  );
}
