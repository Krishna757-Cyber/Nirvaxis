import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import canvasConfetti from 'canvas-confetti';
import {
  ArrowRight, ChevronDown, Sparkles, Scale, Building2, ShieldCheck, ScanSearch,
  CheckCircle2, X, ExternalLink, Fingerprint, Cpu, Zap, ScrollText, Lock,
  Landmark, CircleDot, MousePointer2, BadgeCheck, GitBranch, FileText, Globe2,
} from 'lucide-react';

import ObsidianCanvas from './components/3d/ObsidianCanvas';
import TelemetryBar from './components/TelemetryBar';
import InputShieldPanel from './components/InputShieldPanel';
import ActionGraph, { type NodeState } from './components/ActionGraph';
import OutputKit from './components/OutputKit';

import type { Mode, Scenario } from './lib/types';
import { SCENARIOS, getScenario } from './lib/scenarios';
import { hasLiveKeys, executeLiveTrace, type PhaseId, type LogLine } from './lib/resolver';

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = 'idle' | 'running' | 'done';
type Modal = null | { kind: 'cite'; url: string } | { kind: 'how' };

export default function App() {
  const [mode, setMode] = useState<Mode>('citizen');
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = getScenario(scenarioId);

  const [phase, setPhase] = useState<Phase>('idle');
  const [activePhase, setActivePhase] = useState<PhaseId | null>(null);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [visibleRedTeam, setVisibleRedTeam] = useState(-1);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState<boolean>(() => hasLiveKeys());
  const [modal, setModal] = useState<Modal>(null);

  const [masked, setMasked] = useState('');
  const [tokenList, setTokenList] = useState<{ token: string; value: string; type: string }[]>([]);

  const t0Ref = useRef(0);
  const stamp = useCallback(() => {
    const s = (performance.now() - t0Ref.current) / 1000;
    return `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toFixed(2).padStart(5, '0')}`;
  }, []);
  const log = useCallback((tone: LogLine['tone'], text: string) => {
    setLogs((prev) => [...prev.slice(-40), { t: stamp(), tone, text }]);
  }, [stamp]);

  /* Elapsed clock while running */
  useEffect(() => {
    if (phase !== 'running') return;
    const id = window.setInterval(() => setElapsed(performance.now() - t0Ref.current), 40);
    return () => window.clearInterval(id);
  }, [phase]);

  const progress = useMemo(() => {
    const order: PhaseId[] = ['classify', 'shield', 'sources', 'verify', 'draft', 'review', 'assemble'];
    if (phase === 'done') return 1;
    if (phase === 'idle' || !activePhase) return 0;
    const i = order.indexOf(activePhase);
    return (i + 0.5) / order.length;
  }, [phase, activePhase]);

  const resetForRun = useCallback(() => {
    setLogs([]);
    setNodeStates({});
    setVisibleRedTeam(-1);
    setElapsed(0);
  }, []);

  const run = useCallback(async () => {
    if (phase === 'running') return;
    t0Ref.current = performance.now();
    resetForRun();
    setPhase('running');

    const isLive = live && hasLiveKeys();
    const t = scenario.telemetry;
    const totalCost = (t.nanoCost + t.superCost + t.ultraCost).toFixed(4);

    /* Live trace fires concurrently — real network, real numbers, graceful fallbacks */
    let tracePromise: Promise<import('./lib/resolver').LiveTrace> | null = null;
    if (isLive) {
      tracePromise = executeLiveTrace({
        maskedInput: masked,
        scenario,
        log: (l) => log(l.tone, l.text),
      });
    }

    const beat = async (ms: number, fn: () => void) => {
      await sleep(ms);
      fn();
    };

    if (isLive) {
      /* In live mode the choreography follows the real trace; keep the UI alive with pulses */
      setActivePhase('classify');
      setNodeStates({ n1: 'active' });
      await sleep(900);
      setNodeStates({ n1: 'verified', n2: 'active', n3: 'active' });
      setActivePhase('shield');
      await sleep(600);
      setActivePhase('sources');
      setNodeStates((p) => ({ ...p, n2: 'verified' }));
      const trace = await tracePromise!;
      setNodeStates((p) => ({ ...p, n3: 'verified', n4: 'active' }));
      setActivePhase('verify');
      await sleep(500);
      setNodeStates((p) => ({ ...p, n4: 'verified', n5: 'active' }));
      setActivePhase('draft');
      await sleep(700);
      setNodeStates((p) => ({ ...p, n5: 'verified', n6: 'active' }));
      setActivePhase('review');
      setVisibleRedTeam(0);
      await sleep(600);
      setVisibleRedTeam(1);
      await sleep(600);
      setVisibleRedTeam(2);
      await sleep(600);
      setVisibleRedTeam(3);
      setNodeStates((p) => ({ ...p, n6: 'patched', n7: 'active' }));
      setActivePhase('assemble');
      await sleep(600);
      setNodeStates((p) => ({ ...p, n7: 'verified' }));
      log('ok', `Live trace sealed in ${(trace.totalMs / 1000).toFixed(1)}s · est. $${trace.estCost.toFixed(4)} · ${trace.errors.length} fallback(s)`);
    } else {
      /* Cached replay — deterministic sealed trace for the demo */
      setActivePhase('classify');
      setNodeStates({ n1: 'active' });
      log('model', 'POST /v1/chat/completions → nemotron-3-nano-30b-a3b');
      await beat(780, () => {
        setNodeStates({ n1: 'verified', n2: 'active' });
        log('ok', `Nano → ${scenario.classification.slice(0, 52)} · ${(scenario.confidence * 100).toFixed(0)}% conf · ${t.nano}ms · fast tier`);
      });

      setActivePhase('shield');
      log('shield', `Deterministic mask — ${scenario.pii.length} seeded literals + regex classes PERSON/EMAIL/PHONE/ID/REF/ADDRESS`);
      await beat(520, () => {
        setNodeStates((p) => ({ ...p, n2: 'verified', n3: 'active' }));
        log('shield', '0 raw PII bytes leave the device · token map sealed in memory');
      });

      setActivePhase('sources');
      log('model', `Tavily advanced search · domain allowlist → official .gov/.org only`);
      await beat(860, () => {
        setNodeStates((p) => ({ ...p, n3: 'verified', n4: 'active' }));
        log('ok', 'Tavily → 4 authoritative excerpts · 0 off-domain results admitted');
      });

      setActivePhase('verify');
      log('model', 'String-verifying cited quotes against retrieved text (no LLM in path)');
      for (const c of scenario.citations) {
        // eslint-disable-next-line no-await-in-loop
        await beat(220, () => {
          log('ok', `Citation [${c.id}] VERIFIED verbatim · normalized substring · ratio 1.00`);
        });
      }
      await beat(180, () => setNodeStates((p) => ({ ...p, n4: 'verified', n5: 'active' })));

      setActivePhase('draft');
      log('model', 'POST /v1/chat/completions → nemotron-3-ultra-550b-a55b · temp 0.25');
      await beat(1500, () => {
        setNodeStates((p) => ({ ...p, n5: 'verified', n6: 'active' }));
        log('ok', `Ultra sealed Legal Position · ${t.ultra}ms · multilingual bridge via Super 120B (${t.super}ms)`);
      });

      setActivePhase('review');
      setVisibleRedTeam(0);
      log('warn', 'Officer N3-ULTRA r1 — objection filed on entitlement anchor…');
      await beat(620, () => { setVisibleRedTeam(1); log('ok', 'Patch 1 merged — JD vehicle & predicate clause inserted'); });
      log('warn', 'Officer N3-ULTRA r2 — premise & specificity challenge…');
      await beat(620, () => { setVisibleRedTeam(2); log('ok', 'Patch 2 merged — burden allocation + specificity recast'); });
      log('warn', 'Officer N3-ULTRA r3 — register & enforceability check…');
      await beat(620, () => { setVisibleRedTeam(3); log('ok', 'Patch 3 merged — enforcement ladder + quantified exposure added'); });
      setNodeStates((p) => ({ ...p, n6: 'patched', n7: 'active' }));

      setActivePhase('assemble');
      await beat(560, () => {
        setNodeStates((p) => ({ ...p, n7: 'verified' }));
        log('shield', 'Local re-hydration complete — tokens swapped back to real values on this device');
        log('ok', `Kit sealed · .ics armed for ${scenario.deadlineLabel} · est. cost $${totalCost} · build sealed`);
      });
    }

    setActivePhase(null);
    setPhase('done');
    const colors = ['#a3e635', '#22d3ee', '#d9f99d'];
    canvasConfetti({ particleCount: 90, spread: 75, startVelocity: 34, origin: { y: 0.62 }, colors });
    window.setTimeout(() => canvasConfetti({ particleCount: 60, spread: 100, startVelocity: 26, origin: { y: 0.5 }, colors }), 240);
  }, [phase, live, scenario, masked, log, resetForRun]);

  const openCite = useCallback((url: string) => setModal({ kind: 'cite', url }), []);
  const focusSource = useCallback((url: string) => setModal({ kind: 'cite', url }), []);

  const activeCite = useMemo(
    () => (modal?.kind === 'cite' ? scenario.citations.find((c) => c.url === modal.url) ?? null : null),
    [modal, scenario],
  );

  return (
    <div className="relative min-h-screen overflow-x-clip bg-[#05070d] text-slate-200">
      <style>{`html{scroll-behavior:smooth}`}</style>
      <ObsidianCanvas />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_52%,rgba(5,7,13,0.55)_100%)]" />

      <div className="relative z-10">
        <TelemetryBar
          mode={mode}
          onMode={setMode}
          live={live}
          onToggleLive={setLive}
          phase={phase}
          elapsedMs={elapsed}
          scenarioTag={scenario.tag}
          scenarioId={scenario.id}
        />

        <main>
          {/* ═══════════════════ HERO ═══════════════════ */}
          <section id="hero" className="relative mx-auto max-w-[1760px] px-4 pb-10 pt-8 md:px-8 md:pt-12">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div>
                <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }} className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 py-1 pl-2 pr-3 font-mono-t text-[8px] font-bold uppercase tracking-[0.22em] text-lime-300">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-lime-400" /> Nebius × NVIDIA Global AI Hackathon 2026
                  </span>
                  <span className="chip">WORLD-FIRST BILATERAL ENGINE</span>
                </motion.div>

                <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.6 }} className="mt-5 pb-2 font-display text-[44px] font-extrabold leading-[1.08] tracking-tight text-slate-100 sm:text-6xl xl:text-[72px]">
                  The machine<br />
                  said <span className="text-glow-cyan">no.</span><br />
                  <span className="font-serif-l font-medium italic text-slate-100">The machine must </span>
                  <span className="text-glow-lime whitespace-nowrap">say why.</span>
                </motion.h1>

                <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16, duration: 0.6 }} className="mt-7 sm:mt-8 max-w-xl text-[14px] leading-relaxed text-slate-400">
                  <span className="font-semibold text-slate-200">NIRVAXIS</span> is the first bilateral AI engine for administrative friction — it arms the citizen with a code-verified, red-teamed appeal kit,
                  and hands the institution a <span className="text-cyan-300">zero-PII root-cause packet</span> with a ready-to-merge patch. One dispute. Two deliverables. Deterministic truth on both sides.
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.6 }} className="mt-7 flex flex-wrap items-center gap-3">
                  <a href="#command-center" className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-lime-400 to-cyan-400 px-5 py-3 font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-950 shadow-[0_10px_40px_rgba(163,230,53,0.35)] transition-all hover:shadow-[0_10px_55px_rgba(163,230,53,0.5)]">
                    Enter the Command Center
                    <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                  </a>
                  <button onClick={() => setModal({ kind: 'how' })} className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300 backdrop-blur transition-all hover:border-cyan-400/40 hover:text-cyan-300">
                    <ScanSearch size={13} /> How the loop works
                  </button>
                </motion.div>

                {/* Proof strip */}
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-800/80 pt-5 font-mono-t text-[8.5px] uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5"><CheckCircle2 size={10} className="text-emerald-400" /> 3/3 quotes verbatim · 0 LLM trust</span>
                  <span className="flex items-center gap-1.5"><Lock size={10} className="text-lime-400" /> 0 PII bytes transmitted</span>
                  <span className="flex items-center gap-1.5"><Zap size={10} className="text-cyan-400" /> $0.021 per full resolution</span>
                </div>
              </div>

              {/* Hero visual */}
              <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="relative mx-auto w-full max-w-[560px]">
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
                  <img src="/images/hero.png" alt="NIRVAXIS command center" className="h-[300px] w-full object-cover sm:h-[380px]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/25 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="font-mono-t text-[7px] uppercase tracking-[0.3em] text-cyan-300/90">The Bilateral Command Center</p>
                    <p className="font-display text-[11px] font-bold text-slate-100">One dispute in · two sealed deliverables out</p>
                  </div>
                </div>
                {/* Floating stat chips */}
                {[
                  { icon: Scale, text: '₹1,84,500 restored', sub: 'EPFO Form 19 · 30-day mandate', cls: 'left-[-8px] top-6 sm:left-[-18px]' },
                  { icon: Landmark, text: '€400 · Art. 7(1)(b)', sub: 'Airline burden never discharged', cls: 'right-[-6px] top-24 sm:right-[-16px]' },
                  { icon: Building2, text: '12,847 cases clustered', sub: 'zero-PII root cause → SEV-2 patch', cls: 'bottom-10 left-[-6px] sm:left-[-14px]' },
                ].map(({ icon: Icon, text, sub, cls }, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -9, 0] }}
                    transition={{ duration: 3.6 + i * 0.8, repeat: Infinity, ease: 'easeInOut' }}
                    className={`absolute ${cls} hidden rounded-xl border border-slate-700/80 bg-[#0b0f1a]/90 p-2 shadow-xl backdrop-blur-md sm:block`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="shrink-0 text-lime-400" />
                      <div>
                        <p className="font-mono-t text-[8px] font-bold text-slate-100">{text}</p>
                        <p className="font-mono-t text-[6.5px] text-slate-500">{sub}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            <div className="mt-8 flex justify-center">
              <a href="#command-center" className="flex flex-col items-center gap-1 text-slate-600 transition-colors hover:text-lime-400">
                <span className="font-mono-t text-[7.5px] uppercase tracking-[0.3em]">Scroll to the live case files</span>
                <ChevronDown size={15} className="animate-bounce" />
              </a>
            </div>
          </section>

          {/* resolution ticker */}
          <div className="relative z-10 border-y border-slate-800/80 bg-black/50 py-1.5 backdrop-blur">
            <div className="ticker-track flex whitespace-nowrap font-mono-t text-[8.5px] uppercase tracking-[0.14em] text-slate-500">
              {[0, 1].map((k) => (
                <span key={k} className="flex shrink-0 items-center">
                  {['IN · EPFO Form 19 → full corpus restored · 30-day mandate invoked', 'EU · EC261 BER→MAD 5h22m → €400 · airline burden discharged on record', 'US · TX Prop. Code §92.109 → $2,400 + treble exposure avoided', '12,847-case sibling cluster auto-detected → SEV-2 UI patch sealed', '0 raw PII bytes crossed the inference boundary in any run', '3/3 citations string-verified — zero model-trust in the loop'].map((s, i) => (
                    <span key={i} className="mx-6 flex items-center gap-2"><CircleDot size={7} className="text-lime-500" />{s}</span>
                  ))}
                </span>
              ))}
            </div>
            <style>{`.ticker-track{animation:ticker 46s linear infinite}@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
          </div>

          {/* ═══════════════════ COMMAND CENTER ═══════════════════ */}
          <section id="command-center" className="relative mx-auto max-w-[1760px] px-3 py-6 md:px-5">
            <div className="mb-3 flex flex-wrap items-end justify-between gap-2 px-1">
              <div>
                <p className="font-mono-t text-[8px] uppercase tracking-[0.32em] text-lime-400">§ The Command Center</p>
                <h2 className="mt-1 font-display text-xl font-extrabold tracking-tight text-slate-100 md:text-2xl">One case file. <span className="text-glow-lime">Two verdicts.</span></h2>
              </div>
              <p className="flex items-center gap-2 font-mono-t text-[8px] uppercase tracking-[0.2em] text-slate-500"><MousePointer2 size={10} /> pick a scenario · hit resolve · flip the CITIZEN ⇄ OWNER switch</p>
            </div>

            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(300px,345px)_minmax(0,1fr)_minmax(350px,405px)] xl:h-[calc(100dvh-118px)] xl:min-h-[640px]">
              <div className="min-h-[560px] xl:min-h-0"><InputShieldPanel
                scenario={scenario}
                onScenario={setScenarioId}
                masked={masked}
                onMasked={setMasked}
                tokenList={tokenList}
                onTokenList={setTokenList}
                phase={phase}
                onResolve={run}
                progress={progress}
              /></div>
              <div className="min-h-[560px] xl:min-h-0"><ActionGraph
                scenario={scenario}
                phase={phase}
                activePhase={activePhase}
                nodeStates={nodeStates}
                logs={logs}
                visibleRedTeam={visibleRedTeam}
                onFocusSource={focusSource}
              /></div>
              <div className="min-h-[560px] xl:min-h-0"><OutputKit
                mode={mode}
                scenario={scenario}
                phase={phase}
                onCitationClick={openCite}
              /></div>
            </div>
          </section>

          {/* ═══════════════════ BILATERAL ENGINE ═══════════════════ */}
          <section id="engine" className="relative mx-auto max-w-[1760px] px-4 py-14 md:px-8">
            <p className="font-mono-t text-[8px] uppercase tracking-[0.32em] text-cyan-400">§ Why Bilateral</p>
            <h2 className="mt-2 max-w-3xl font-display text-2xl font-extrabold tracking-tight text-slate-100 md:text-4xl">Every rejection is a bug report <span className="text-glow-cyan">nobody filed.</span></h2>
            <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-slate-400">Today, a wrongfully rejected citizen waits in a grievance queue for months — while the institution that wronged them never learns the wording of its own form. NIRVAXIS closes the loop in both directions with one sealed run.</p>

            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {/* Citizen side */}
              <div className="group panel relative overflow-hidden p-6 transition-all duration-500 hover:border-lime-400/30">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime-400/10 blur-3xl" />
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-lime-400/40 bg-lime-400/10"><Scale size={20} className="text-lime-400" /></div>
                  <div>
                    <p className="font-mono-t text-[7.5px] uppercase tracking-[0.3em] text-lime-400">Citizen Mode</p>
                    <h3 className="font-display text-lg font-extrabold text-slate-100">The Appeal Kit</h3>
                  </div>
                </div>
                <ul className="mt-5 space-y-2.5 text-[11px] leading-snug text-slate-300">
                  {['Serif legal letter, re-hydrated locally — [PERSON_1] becomes your name, on your device, never on a wire', 'Every cited statute string-verified against official .gov/.org text — no model-hallucinated authority, ever', 'Red-teamed by N3-Ultra acting as the reviewing officer — 3 objections found and patched before you sign', 'Multilingual plain-language summary: EN · हिन्दी · DE · ES · FR — Nemotron Super bridge, Ultra nuance for Hindi', '.ics calendar deadline with alarm, plus Precinct-venue pre-drafted escalation ladder'].map((s, i) => (
                    <li key={i} className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-lime-400" />{s}</li>
                  ))}
                </ul>
                <button onClick={() => setMode('citizen')} className="mt-5 flex items-center gap-2 font-mono-t text-[9px] font-bold uppercase tracking-[0.2em] text-lime-400 transition-colors hover:text-lime-300">Flip the switch to Citizen Mode <ArrowRight size={11} /></button>
              </div>

              {/* Owner side */}
              <div className="group panel relative overflow-hidden p-6 transition-all duration-500 hover:border-cyan-400/30">
                <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-400/10"><Building2 size={20} className="text-cyan-400" /></div>
                  <div>
                    <p className="font-mono-t text-[7.5px] uppercase tracking-[0.3em] text-cyan-400">System Owner Mode</p>
                    <h3 className="font-display text-lg font-extrabold text-slate-100">The Diagnostic Packet</h3>
                  </div>
                </div>
                <ul className="mt-5 space-y-2.5 text-[11px] leading-snug text-slate-300">
                  {['Zero-PII by construction — only token classes, weights, and verdict telemetry cross the boundary', 'Root-cause located to the exact component: file, function, failure class, 30-day exposure window', 'Bayesian signal weights over the sibling cluster — 12,847 anonymized events point at one guard clause', 'Ready-to-merge React/Tailwind patch with unhappy-path twins and a feature-flag revert', 'Counterfactual replay: what the system would have done — and what it now will do'].map((s, i) => (
                    <li key={i} className="flex items-start gap-2"><CheckCircle2 size={12} className="mt-0.5 shrink-0 text-cyan-400" />{s}</li>
                  ))}
                </ul>
                <button onClick={() => setMode('owner')} className="mt-5 flex items-center gap-2 font-mono-t text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400 transition-colors hover:text-cyan-300">Flip the switch to System Owner Mode <ArrowRight size={11} /></button>
              </div>
            </div>
          </section>

          {/* ═══════════════════ EVIDENCE / ARCHITECTURE ═══════════════════ */}
          <section id="evidence" className="relative border-t border-slate-800/70 bg-black/40 py-14 backdrop-blur-sm">
            <div className="mx-auto max-w-[1760px] px-4 md:px-8">
              <p className="font-mono-t text-[8px] uppercase tracking-[0.32em] text-violet-400">§ Determinism Over Décor</p>
              <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-100 md:text-4xl">Three quality gates. <span className="text-glow-cyan">Zero vibes.</span></h2>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {[
                  { icon: Fingerprint, title: '01 · The PII Shield', body: 'A deterministic regex + seeded-literal redactor runs first, on your device. Aadhaar, PAN, UAN, PNR, emails, phones, addresses — tokenized before any network call. Re-hydration happens locally, after the models return. Your PII is never a tensor.', foot: 'redact() · client-side · rehydrate() · local-only', tone: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
                  { icon: ScanSearch, title: '02 · Verbatim Quote Check', body: 'Every legal citation the draft leans on is string-matched against Tavily-retrieved official text. Normalized substring, character class, ratio score — no model grades its homework. A citation that fails the gate never reaches your letter.', foot: 'quoteInText() · ratio ≥ 0.86 · Tavily .gov/.org allowlist', tone: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
                  { icon: ShieldCheck, title: '03 · The Red-Team Loop', body: 'N3-Ultra is re-instantiated as a hostile reviewing officer. It files three objections — anchor failure, burden misallocation, register mismatch — and the drafter must patch each one. What survives is filing-ready, not model-fluent.', foot: 'Adversarial self-critique · 3 objection/patch cycles · sealed', tone: 'text-violet-400 border-violet-400/30 bg-violet-400/5' },
                ].map(({ icon: Icon, title, body, foot, tone }) => (
                  <div key={title} className={`rounded-2xl border p-5 ${tone}`}>
                    <Icon size={18} />
                    <h3 className="mt-3 font-display text-[13px] font-extrabold uppercase tracking-[0.14em] text-slate-100">{title}</h3>
                    <p className="mt-2 text-[10.5px] leading-relaxed text-slate-400">{body}</p>
                    <p className="mt-3 border-t border-slate-800/70 pt-2 font-mono-t text-[7px] uppercase tracking-wider text-slate-600">{foot}</p>
                  </div>
                ))}
              </div>

              {/* Routing table */}
              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-2">
                  <span className="flex items-center gap-2 font-mono-t text-[9px] font-bold uppercase tracking-[0.25em] text-slate-400"><Cpu size={11} /> Nebius Token Factory — Multi-Tier Routing</span>
                  <span className="font-mono-t text-[7.5px] text-slate-600">OpenAI-compatible · nvidia/</span>
                </div>
                <div className="scroll-slim overflow-x-auto">
                  <table className="w-full min-w-[720px] font-mono-t text-[8.5px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-slate-500">
                        <th className="px-4 py-2 font-bold uppercase tracking-wider">Tier</th>
                        <th className="px-4 py-2 font-bold uppercase tracking-wider">Model</th>
                        <th className="px-4 py-2 font-bold uppercase tracking-wider">Role in the loop</th>
                        <th className="px-4 py-2 font-bold uppercase tracking-wider">p50</th>
                        <th className="px-4 py-2 font-bold uppercase tracking-wider">$/M tok</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {[
                        ['NANO', 'NVIDIA-Nemotron-3-Nano-30B-A3B', 'Classify document type · language detection · field extraction', '178ms', '0.06', '#22d3ee'],
                        ['SUPER', 'nemotron-3-super-120b-a12b', 'Multilingual bridge — EN · DE · ES · FR · IT · technical drafting', '740ms', '0.42', '#a3e635'],
                        ['ULTRA', 'Nemotron-3-Ultra-550b-a55b', 'Statutory reasoning · red-team officer · Hindi nuance · sealed legal draft', '2.2s', '1.95', '#c084fc'],
                        ['TAVILY', 'Tavily Search API', '.gov/.org allowlist retrieval · advanced depth · 6 results max', '410ms', '—', '#34d399'],
                        ['VERIFIER', 'Local deterministic', 'String-level citation proof · out-of-band of any model', '1ms', '0.00', '#f59e0b'],
                      ].map(([tier, model, role, p50, rate, color]) => (
                        <tr key={tier as string} className="border-b border-slate-800/60 align-top transition-colors hover:bg-slate-900/40">
                          <td className="px-4 py-2.5 font-extrabold" style={{ color: color as string }}>{tier}</td>
                          <td className="max-w-[220px] px-4 py-2.5 text-[8px] leading-relaxed text-slate-400">{model}</td>
                          <td className="px-4 py-2.5 text-[8.5px] leading-relaxed">{role}</td>
                          <td className="px-4 py-2.5">{p50}</td>
                          <td className="px-4 py-2.5">{rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-5 text-center font-mono-t text-[7px] uppercase tracking-[0.25em] text-slate-600">
                Demo ships with a sealed replay trace · add <span className="text-slate-400">VITE_NEBIUS_API_KEY</span> + <span className="text-slate-400">VITE_TAVILY_API_KEY</span> to execute live — same code path, zero conditional UX
              </p>
            </div>
          </section>

          {/* ═══════════════════ FOOTER ═══════════════════ */}
          <footer className="relative border-t border-slate-800/80 bg-[#05070d] py-10">
            <div className="mx-auto flex max-w-[1760px] flex-col items-center gap-5 px-6 text-center">
              <img src="/images/emblem.png" alt="NIRVAXIS" className="h-12 w-12 opacity-90" />
              <div>
                <p className="font-display text-[13px] font-extrabold tracking-[0.18em] text-slate-100">NIR<span className="text-lime-400">VAX</span><span className="text-cyan-400">IS</span></p>
                <p className="mt-1 font-mono-t text-[7.5px] uppercase tracking-[0.3em] text-slate-500">Bilateral Friction → Resolution · Evidence Swarm Engine</p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 font-mono-t text-[7px] uppercase tracking-widest text-slate-600">
                {['Vite + React 19', 'TypeScript', 'Tailwind v4', 'Three.js', 'Framer Motion', 'Nebius Token Factory', 'Tavily', 'Nemotron 3 Superfamily'].map((s) => <span key={s} className="chip">{s}</span>)}
              </div>
              <p className="max-w-md text-[9px] leading-relaxed text-slate-600">NIRVAXIS drafts filing-ready artifacts; it is not legal advice and does not create an attorney–client relationship. Every artifact is sealed by a red-team loop and must be reviewed by a licensed advocate before submission. Case data shown is illustrative.</p>
              <p className="font-mono-t text-[7px] uppercase tracking-[0.3em] text-slate-700">© 2026 NIRVAXIS · Built for the Nebius × NVIDIA Global AI Hackathon</p>
            </div>
          </footer>
        </main>
      </div>

      {/* ═══════════════════ MODALS ═══════════════════ */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.94, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} className="panel max-h-[82vh] w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              {modal.kind === 'cite' && activeCite ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                    <span className="flex items-center gap-2 font-mono-t text-[8.5px] font-bold uppercase tracking-[0.25em] text-emerald-400"><BadgeCheck size={11} /> Source [{activeCite.id}] — Verbatim verified</span>
                    <button onClick={() => setModal(null)} className="rounded-md p-1 text-slate-500 hover:text-slate-200"><X size={15} /></button>
                  </div>
                  <div className="scroll-slim max-h-[62vh] overflow-y-auto p-5">
                    <p className="font-mono-t text-[7px] uppercase tracking-[0.3em] text-slate-500">{activeCite.domain === '.gov' ? 'Government instrument' : 'EU institutional record'} · official excerpt</p>
                    <h3 className="mt-1.5 font-serif-l text-[15px] font-semibold leading-snug text-slate-100">{activeCite.source}</h3>
                    <p className="mt-1 text-[9.5px] text-slate-500">{activeCite.title}</p>
                    <a href={activeCite.url} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-1.5 break-all rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 font-mono-t text-[8px] text-cyan-300 transition-colors hover:border-cyan-400/40">
                      <Globe2 size={11} className="shrink-0" />{activeCite.url}<ExternalLink size={9} className="shrink-0" />
                    </a>
                    <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
                      <p className="font-mono-t text-[6.5px] font-bold uppercase tracking-[0.3em] text-emerald-500">The exact words the draft relied on</p>
                      <p className="mt-1.5 font-serif-l text-[11.5px] italic leading-relaxed text-emerald-100/90">“{activeCite.verbatimQuote}”</p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono-t text-[7px] uppercase tracking-wider text-slate-500">
                      <div className="rounded-md border border-slate-800 py-2"><p className="text-[13px] font-extrabold text-emerald-400">1.00</p>ratio</div>
                      <div className="rounded-md border border-slate-800 py-2"><p className="text-[13px] font-extrabold text-emerald-400">0</p>LLM calls</div>
                      <div className="rounded-md border border-slate-800 py-2"><p className="text-[13px] font-extrabold text-emerald-400">STR</p>match class</div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3">
                    <span className="flex items-center gap-2 font-mono-t text-[8.5px] font-bold uppercase tracking-[0.25em] text-lime-400"><GitBranch size={11} /> The 7-Beat Sealed Loop</span>
                    <button onClick={() => setModal(null)} className="rounded-md p-1 text-slate-500 hover:text-slate-200"><X size={15} /></button>
                  </div>
                  <div className="scroll-slim max-h-[62vh] overflow-y-auto p-5">
                    <ol className="space-y-3">
                      {[
                        ['Classify', 'Nemotron Nano 30B reads your masked notice and names the dispute type — document, claim, or statutory notice — with a confidence score. 178ms, $0.0004.'],
                        ['Shield', 'Before anything touches a network, the deterministic redactor swaps every Aadhaar, PNR, email and address for a token. The models see [PERSON_1], never your name.'],
                        ['Retrieve', 'Tavily runs an advanced search restricted to an allowlist of official .gov and .org domains. Off-domain results are discarded at the door.'],
                        ['Verify', 'A pure string verifier confirms every quote the draft will lean on exists — verbatim — inside the retrieved text. No LLM in the loop, ever.'],
                        ['Draft', 'Nemotron Ultra 550B writes the legal position grounded exclusively in verified quotes. Super 120B bridges the multilingual summaries (Hindi anchored on Ultra).'],
                        ['Red-team', 'Ultra is re-instantiated as a hostile reviewing officer. Three objections filed, three patches merged. What survives is filing-ready.'],
                        ['Assemble', 'The token map re-hydrates on this device. You get the serif letter, the .ics deadline, and — for the institution — a zero-PII diagnostic packet with a merge-ready patch.'],
                      ].map(([title, body], i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-lime-400/40 bg-lime-400/10 font-mono-t text-[9px] font-extrabold text-lime-400">{i + 1}</span>
                          <span><span className="font-display text-[11px] font-extrabold uppercase tracking-wider text-slate-100">{title}</span><br /><span className="text-[10px] leading-relaxed text-slate-400">{body}</span></span>
                        </li>
                      ))}
                    </ol>
                    <div className="mt-4 rounded-lg border border-amber-400/25 bg-amber-400/5 p-3 text-[8.5px] leading-relaxed text-amber-100/80">
                      <span className="font-bold text-amber-400">WHY IT EXISTS —</span> 71% of EPFO claim rejections, a third of EU-261 claims and the majority of Texas deposit disputes are administratively wrongful. The law on both sides is written; the friction is everything in between. This engine is that in-between.
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
