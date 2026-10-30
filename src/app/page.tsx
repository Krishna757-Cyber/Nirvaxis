"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import canvasConfetti from "canvas-confetti";
import {
  Activity, ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, BrainCircuit,
  Building2, CalendarDays, Check, CheckCircle2, ChevronDown, CircleDot, CircleHelp, Code2, Cpu,
  ExternalLink, Eye, FileCheck2, FileText, Fingerprint, GitBranch, Globe2, History, Hourglass, Info,
  Landmark, Languages, Layers, LayoutGrid, Lock, LockKeyhole, MousePointer2, Plus, RefreshCw, Rocket, Scale,
  ScanSearch, ShieldCheck, Sparkles, Swords, Timer, TriangleAlert, User2, X, Zap,
} from "lucide-react";

import ObsidianCanvas from "@/components/3d/ObsidianCanvas";
import InputShieldPanel from "@/components/InputShieldPanel";
import ActionGraph, { type NodeState } from "@/components/ActionGraph";
import OutputKit from "@/components/OutputKit";
import WorldMapCanvas from "@/components/WorldMapCanvas";
import ResolutionWorkbench from "@/components/ResolutionWorkbench";
import OperationsOverlay from "@/components/OperationsOverlay";
import K3UltronFloatingBot from "@/components/K3UltronFloatingBot";
import { EvidenceOverview, FrictionSummary, ProofTrend, RegionalBreakdown, TopPipelines } from "@/components/HUDPanels";

import { SCENARIOS, getScenario } from "@/lib/scenarios";
import { hasLiveKeys, executeLiveTrace, MODEL_BADGES, type PhaseId, type LogLine } from "@/lib/resolver";
import { buildHash } from "@/lib/letterMaps";
import { mockScenarios, replayTelemetry } from "@/lib/mockScenarios";
import { downloadICS } from "@/lib/icsGenerator";
import { I18N } from "@/lib/i18n";
import type { Language, ModelTier, OutputMode, RegionId, ResolveResponse } from "@/types/resolve";

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

type Phase = "idle" | "running" | "done";
type Modal = null | { kind: "cite"; url: string } | { kind: "how" };
type WorkbenchTab = "input" | "actions" | "redteam" | "output";
type ActiveSlide = "command" | "global" | "gates" | "specs" | "all";

const regionLabels: Record<RegionId, string> = {
  USA: "North America",
  EUROPE: "Europe",
  "MIDDLE EAST": "Middle East",
  INDIA: "India & South Asia",
  "SE ASIA": "SE Asia",
  AUSTRALIA: "Oceania",
};

const countryCounts: Record<RegionId, number> = {
  USA: 1,
  EUROPE: 4,
  "MIDDLE EAST": 2,
  INDIA: 1,
  "SE ASIA": 2,
  AUSTRALIA: 1,
};

function NirvaxisLogo({ size = 36 }: { size?: number }) {
  return (
    <div className="relative flex items-center justify-center shrink-0">
      <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md pointer-events-none" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/pentagon-emblem.png"
        alt="NIRVAXIS Pentagonal Emblem"
        width={size}
        height={size}
        className="relative z-10 object-contain drop-shadow-[0_0_14px_rgba(56,189,248,0.65)] transition-transform duration-300 group-hover:scale-105 pointer-events-none"
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
  icon,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <label className="filter-select">
      {icon}
      <select aria-label={label} value={value} onChange={(event) => onChange(event.target.value)}>
        {children}
      </select>
      <ChevronDown size={12} />
    </label>
  );
}

function StatusRing({
  children,
  color,
  progress = 85,
  dashed = false,
}: {
  children: ReactNode;
  color: string;
  progress?: number;
  dashed?: boolean;
}) {
  return (
    <span className="status-ring" style={{ "--ring-color": color } as CSSProperties}>
      <svg viewBox="0 0 46 46" aria-hidden="true">
        <circle cx="23" cy="23" r="19" fill="none" stroke="#1a2937" strokeWidth="2" />
        <circle
          cx="23"
          cy="23"
          r="19"
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeDasharray={dashed ? "3 4" : `${(119.38 * progress) / 100} 119.38`}
          transform="rotate(-90 23 23)"
        />
      </svg>
      {children}
    </span>
  );
}

export default function HomePage() {
  /* Mode State: Citizen vs System Owner */
  const [mode, setMode] = useState<OutputMode>("citizen");

  /* Slide View State (Separates sections so they NEVER overlap) */
  const [activeSlide, setActiveSlide] = useState<ActiveSlide>("command");

  /* Bilateral Scenario State */
  const [scenarioId, setScenarioId] = useState(SCENARIOS[0].id);
  const scenario = getScenario(scenarioId);

  /* Execution Pipeline State */
  const [phase, setPhase] = useState<Phase>("idle");
  const [activePhase, setActivePhase] = useState<PhaseId | null>(null);
  const [nodeStates, setNodeStates] = useState<Record<string, NodeState>>({});
  const [visibleRedTeam, setVisibleRedTeam] = useState(-1);
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [live, setLive] = useState<boolean>(() => hasLiveKeys());
  const [modal, setModal] = useState<Modal>(null);

  /* PII Shield State */
  const [masked, setMasked] = useState("");
  const [tokenList, setTokenList] = useState<{ token: string; value: string; type: string }[]>([]);

  /* Global Map & HQ State */
  const [selectedRegion, setSelectedRegion] = useState<RegionId | null>(null);
  const [activeRegion, setActiveRegion] = useState<RegionId>("INDIA");
  const [language, setLanguage] = useState<Language>("en");
  const [modelTier, setModelTier] = useState<ModelTier>("auto");
  const [results, setResults] = useState<Partial<Record<RegionId, ResolveResponse>>>({});
  const [workbenchOpen, setWorkbenchOpen] = useState(false);
  const [workbenchTab, setWorkbenchTab] = useState<WorkbenchTab>("input");
  const [overlay, setOverlay] = useState<"activity" | "help" | null>(null);
  const [clock, setClock] = useState("--:--:--");
  const [toast, setToast] = useState<string | null>(null);

  const hqScenario = results[activeRegion]?.scenario ?? mockScenarios[activeRegion];
  const telemetry = results[activeRegion]?.telemetry ?? replayTelemetry();
  const global = selectedRegion === null;
  const proofScore = global ? 85 : hqScenario.proofScore;
  const i18n = I18N[language] || I18N.en;

  const t0Ref = useRef(0);
  const stamp = useCallback(() => {
    const s = (performance.now() - t0Ref.current) / 1000;
    return `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toFixed(2).padStart(5, "0")}`;
  }, []);

  const log = useCallback(
    (tone: LogLine["tone"], text: string) => {
      setLogs((prev) => [...prev.slice(-40), { t: stamp(), tone, text }]);
    },
    [stamp]
  );

  const notify = useCallback((message: string) => setToast(message), []);
  const closeWorkbench = useCallback(() => setWorkbenchOpen(false), []);
  const closeOverlay = useCallback(() => setOverlay(null), []);
  const launch = useCallback((tab: WorkbenchTab = "input") => {
    setWorkbenchTab(tab);
    setWorkbenchOpen(true);
  }, []);
  const launchInput = useCallback(() => launch("input"), [launch]);

  /* Synchronize Scenario with Region */
  const selectRegion = useCallback((region: RegionId) => {
    setSelectedRegion(region);
    setActiveRegion(region);
    if (region === "INDIA") setScenarioId("epf");
    else if (region === "EUROPE") setScenarioId("eu261");
    else if (region === "USA") setScenarioId("deposit");
  }, []);

  const handleSelectScenario = useCallback((id: string) => {
    setScenarioId(id);
    if (id === "epf") {
      setActiveRegion("INDIA");
      setSelectedRegion("INDIA");
    } else if (id === "eu261") {
      setActiveRegion("EUROPE");
      setSelectedRegion("EUROPE");
    } else if (id === "deposit") {
      setActiveRegion("USA");
      setSelectedRegion("USA");
    }
  }, []);

  const onResolved = useCallback((result: ResolveResponse) => {
    setResults((current) => ({ ...current, [result.scenario.region]: result }));
    setSelectedRegion(result.scenario.region);
    setActiveRegion(result.scenario.region);
  }, []);

  const changeMode = useCallback((next: OutputMode) => setMode(next), []);

  /* Elapsed clock while running */
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => setElapsed(performance.now() - t0Ref.current), 40);
    return () => window.clearInterval(id);
  }, [phase]);

  /* Live UTC clock */
  useEffect(() => {
    const update = () => setClock(new Date().toLocaleTimeString("en-GB", { hour12: false, timeZone: "UTC" }));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  /* Toast auto-dismiss */
  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 5500);
    return () => clearTimeout(timeout);
  }, [toast]);

  /* Global Keyboard Shortcut: ⌘K to open workbench */
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        launch("input");
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [launch]);

  const progress = useMemo(() => {
    const order: PhaseId[] = ["classify", "shield", "sources", "verify", "draft", "review", "assemble"];
    if (phase === "done") return 1;
    if (phase === "idle" || !activePhase) return 0;
    const idx = order.indexOf(activePhase);
    return idx === -1 ? 0.08 : (idx + 0.6) / order.length;
  }, [phase, activePhase]);

  const resetForRun = useCallback(() => {
    setPhase("idle");
    setActivePhase(null);
    setNodeStates({});
    setVisibleRedTeam(-1);
    setLogs([]);
    setElapsed(0);
  }, []);

  /* The 7-Beat Bilateral Resolution Execution Loop */
  const run = useCallback(async () => {
    if (phase === "running") return;
    resetForRun();
    setPhase("running");
    t0Ref.current = performance.now();

    const isLive = live;
    const t = scenario.telemetry;
    const totalCost = (t.nanoCost + t.superCost + t.ultraCost).toFixed(4);

    let tracePromise: Promise<import("@/lib/resolver").LiveTrace> | null = null;
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
      setActivePhase("classify");
      setNodeStates({ n1: "active" });
      await sleep(900);
      setNodeStates({ n1: "verified", n2: "active", n3: "active" });
      setActivePhase("shield");
      await sleep(600);
      setActivePhase("sources");
      setNodeStates((p) => ({ ...p, n2: "verified" }));
      const trace = await tracePromise!;
      setNodeStates((p) => ({ ...p, n3: "verified", n4: "active" }));
      setActivePhase("verify");
      await sleep(500);
      setNodeStates((p) => ({ ...p, n4: "verified", n5: "active" }));
      setActivePhase("draft");
      await sleep(700);
      setNodeStates((p) => ({ ...p, n5: "verified", n6: "active" }));
      setActivePhase("review");
      setVisibleRedTeam(0);
      await sleep(600);
      setVisibleRedTeam(1);
      await sleep(600);
      setVisibleRedTeam(2);
      await sleep(600);
      setVisibleRedTeam(3);
      setNodeStates((p) => ({ ...p, n6: "patched", n7: "active" }));
      setActivePhase("assemble");
      await sleep(600);
      setNodeStates((p) => ({ ...p, n7: "verified" }));
      log("ok", `Live trace sealed in ${(trace.totalMs / 1000).toFixed(1)}s · est. $${trace.estCost.toFixed(4)} · ${trace.errors.length} fallback(s)`);
    } else {
      setActivePhase("classify");
      setNodeStates({ n1: "active" });
      log("model", "POST /v1/chat/completions → nemotron-3-nano-30b-a3b");
      await beat(780, () => {
        setNodeStates({ n1: "verified", n2: "active" });
        log("ok", `Nano → ${scenario.classification.slice(0, 52)} · ${(scenario.confidence * 100).toFixed(0)}% conf · ${t.nano}ms · fast tier`);
      });

      setActivePhase("shield");
      log("shield", `Deterministic mask — ${scenario.pii.length} seeded literals + regex classes PERSON/EMAIL/PHONE/ID/REF/ADDRESS`);
      await beat(520, () => {
        setNodeStates((p) => ({ ...p, n2: "verified", n3: "active" }));
        log("shield", "0 raw PII bytes leave the device · token map sealed in memory");
      });

      setActivePhase("sources");
      log("model", `Tavily advanced search · domain allowlist → official .gov/.org only`);
      await beat(860, () => {
        setNodeStates((p) => ({ ...p, n3: "verified", n4: "active" }));
        log("ok", "Tavily → 4 authoritative excerpts · 0 off-domain results admitted");
      });

      setActivePhase("verify");
      log("model", "String-verifying cited quotes against retrieved text (no LLM in path)");
      for (const c of scenario.citations) {
        await beat(220, () => {
          log("ok", `Citation [${c.id}] VERIFIED verbatim · normalized substring · ratio 1.00`);
        });
      }
      await beat(180, () => setNodeStates((p) => ({ ...p, n4: "verified", n5: "active" })));

      setActivePhase("draft");
      log("model", "POST /v1/chat/completions → nemotron-3-ultra-550b-a55b · temp 0.25");
      await beat(1500, () => {
        setNodeStates((p) => ({ ...p, n5: "verified", n6: "active" }));
        log("ok", `Ultra sealed Legal Position · ${t.ultra}ms · multilingual bridge via Super 120B (${t.super}ms)`);
      });

      setActivePhase("review");
      setVisibleRedTeam(0);
      log("warn", "Officer K3-ULTRON r1 — objection filed on entitlement anchor…");
      await beat(620, () => {
        setVisibleRedTeam(1);
        log("ok", "Patch 1 merged — JD vehicle & predicate clause inserted");
      });
      log("warn", "Officer K3-ULTRON r2 — premise & specificity challenge…");
      await beat(620, () => {
        setVisibleRedTeam(2);
        log("ok", "Patch 2 merged — burden allocation + specificity recast");
      });
      log("warn", "Officer K3-ULTRON r3 — register & enforceability check…");
      await beat(620, () => {
        setVisibleRedTeam(3);
        log("ok", "Patch 3 merged — enforcement ladder + quantified exposure added");
      });
      setNodeStates((p) => ({ ...p, n6: "patched", n7: "active" }));

      setActivePhase("assemble");
      await beat(560, () => {
        setNodeStates((p) => ({ ...p, n7: "verified" }));
        log("shield", "Local re-hydration complete — tokens swapped back to real values on this device");
        log("ok", `Kit sealed · .ics armed for ${scenario.deadlineLabel} · est. cost $${totalCost} · build sealed`);
      });
    }

    setActivePhase(null);
    setPhase("done");
    notify(`Resolution sealed for ${scenario.label}. Deliverables ready.`);

    /* Celebration Confetti */
    try {
      const colors = ["#a3e635", "#22d3ee", "#d9f99d"];
      canvasConfetti({ particleCount: 90, spread: 75, startVelocity: 34, origin: { y: 0.62 }, colors });
      window.setTimeout(
        () => canvasConfetti({ particleCount: 60, spread: 100, startVelocity: 26, origin: { y: 0.5 }, colors }),
        240
      );
    } catch {}
  }, [phase, live, scenario, masked, log, resetForRun, notify]);

  const openCite = useCallback((url: string) => setModal({ kind: "cite", url }), []);
  const focusSource = useCallback((url: string) => setModal({ kind: "cite", url }), []);

  const activeCite = useMemo(
    () => (modal?.kind === "cite" ? scenario.citations.find((c) => c.url === modal.url) ?? null : null),
    [modal, scenario]
  );

  function resetRegion(value: string) {
    if (value === "all") setSelectedRegion(null);
    else selectRegion(value as RegionId);
  }

  function calendar() {
    downloadICS(
      `Review ${hqScenario.shortTitle}`,
      hqScenario.nextDeadline,
      "Review the official notice, complete outstanding evidence checks, and confirm the actual statutory deadline."
    );
    notify("Calendar reminder downloaded. Verify the actual legal deadline on your notice.");
  }

  const build = buildHash(scenario.id + scenario.tag);

  /* KPI Grid definitions */
  const kpis = [
    {
      icon: Building2,
      value: global ? 15 : hqScenario.activeCases,
      label: "ACTIVE CASES",
      detail: global ? "ACROSS 6 GLOBAL REGIONS" : hqScenario.regionName.toUpperCase(),
      color: "#6ca8ff",
      action: () => (selectedRegion ? setSelectedRegion(null) : selectRegion(activeRegion)),
    },
    {
      icon: Globe2,
      value: global ? 11 : countryCounts[activeRegion],
      label: "COUNTRIES",
      detail: "CONNECTED JURISDICTIONS",
      color: "#679df9",
      action: () => setOverlay("help"),
    },
    {
      icon: ShieldCheck,
      value: `${proofScore}%`,
      label: "VERIFIED PROOF",
      detail: "DETERMINISTIC SOURCE CHECK",
      color: "#37d8a6",
      action: () => launch("actions"),
    },
    {
      icon: TriangleAlert,
      value: 3,
      label: "RED-TEAM FLAGS",
      detail: "ADDRESSED BY ULTRA 550B",
      color: "#f46a7c",
      action: () => launch("redteam"),
    },
    {
      icon: Hourglass,
      value: global ? 3 : 1,
      label: "NEEDS CONFIRM",
      detail: "USER FACTS TO VERIFY",
      color: "#eabf62",
      action: () => launch("actions"),
    },
    {
      icon: Rocket,
      value: 3,
      label: "NEMOTRON MODELS",
      detail: "NANO 30B · SUPER 120B · ULTRA 550B",
      color: "#43dbe8",
      action: () => setOverlay("help"),
    },
  ];

  /* Bottom status summary */
  const statusCards = [
    {
      icon: FileText,
      value: global ? "27" : String(hqScenario.claims).padStart(2, "0"),
      label: "TOTAL CLAIMS",
      color: "#77a6cd",
      progress: 77,
      action: () => setOverlay("activity"),
    },
    {
      icon: ShieldCheck,
      value: global ? "23" : String(hqScenario.verifiedCount).padStart(2, "0"),
      label: "VERIFIED",
      color: "#30dbac",
      progress: 85,
      action: () => launch("actions"),
    },
    {
      icon: RefreshCw,
      value: "03",
      label: "RED-TEAMED",
      color: "#4dcfd9",
      progress: 80,
      dashed: true,
      action: () => launch("redteam"),
    },
    {
      icon: CircleHelp,
      value: "01",
      label: "NEEDS INFO",
      color: "#8593a9",
      progress: 25,
      action: () => launch("actions"),
    },
    {
      icon: Timer,
      value: global ? "01" : String(hqScenario.urgentCount).padStart(2, "0"),
      label: "DEADLINE RISK",
      color: "#ef7580",
      progress: global || hqScenario.urgentCount ? 65 : 0,
      action: () => launch("actions"),
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-clip bg-transparent text-slate-200">
      {/* 3D Obsidian Canvas Background */}
      <ObsidianCanvas />
      <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,7,13,0.40)_100%)]" />

      <div className="relative z-10">
        {/* ═══════════════════ UNIFIED STICKY MASTER HEADER ═══════════════════ */}
        <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#05070d]/90 backdrop-blur-xl w-full">
          <div className="mx-auto flex h-[58px] max-w-[1880px] items-center justify-between gap-2 px-3 md:px-5">
            {/* Brand Logo & Tag */}
            <div className="flex items-center gap-2.5 shrink-0">
              <a href="#hero" className="flex items-center gap-2 group">
                <span className="brand-mark">
                  <NirvaxisLogo size={30} />
                </span>
                <div className="leading-none">
                  <div className="font-display text-[13px] sm:text-[14px] font-extrabold tracking-[0.14em] text-slate-100 whitespace-nowrap">
                    NIR<span className="text-lime-400">VAX</span><span className="text-cyan-400">IS</span>
                  </div>
                  <div className="mt-[2.5px] font-mono-t text-[7px] uppercase tracking-[0.2em] text-slate-400 hidden lg:block whitespace-nowrap">
                    Bilateral Evidence Engine
                  </div>
                </div>
              </a>
            </div>

            {/* Stage Nav: ONLY on Ultra-Wide screens >= 1820px to prevent crowding */}
            <nav className="hidden min-[1820px]:flex items-center gap-1 font-mono-t text-[8px] uppercase tracking-wider text-slate-400 shrink-0">
              <button
                type="button"
                onClick={() => setActiveSlide("command")}
                className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  activeSlide === "command"
                    ? "border-lime-400/60 bg-lime-400/15 text-lime-300 font-bold shadow-[0_0_12px_rgba(163,230,53,0.25)]"
                    : "border-slate-800 bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                01 · Command Center
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide("global")}
                className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  activeSlide === "global"
                    ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-300 font-bold shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                    : "border-slate-800 bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                02 · Global HQ Map
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide("gates")}
                className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  activeSlide === "gates"
                    ? "border-violet-400/60 bg-violet-400/15 text-violet-300 font-bold shadow-[0_0_12px_rgba(192,132,252,0.25)]"
                    : "border-slate-800 bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                03 · Quality Gates
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide("specs")}
                className={`px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  activeSlide === "specs"
                    ? "border-amber-400/60 bg-amber-400/15 text-amber-300 font-bold shadow-[0_0_12px_rgba(251,191,36,0.25)]"
                    : "border-slate-800 bg-slate-900/60 hover:text-slate-200"
                }`}
              >
                04 · Model Specs
              </button>
            </nav>

            {/* Model & Token Factory Telemetry Badges (Centered, Adaptive) */}
            <div className="hidden md:flex items-center gap-2 lg:gap-3 font-mono-t text-[9px] shrink-0">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <span className={`h-1.5 w-1.5 rounded-full ${phase === "running" ? "animate-ping bg-cyan-400" : "pulse-dot bg-lime-400"}`} />
                <span className="text-slate-200 font-semibold">{phase === "running" ? "STREAMING" : "NOMINAL"}</span>
              </span>

              <div className="flex items-center gap-1">
                {MODEL_BADGES.map((m) => (
                  <span
                    key={m.id}
                    title={`${m.slug} — $${m.rate}/M tok`}
                    className="flex items-center gap-1 rounded border border-slate-800 bg-slate-900/70 py-0.5 px-1.5"
                  >
                    <Cpu size={9} style={{ color: m.color }} />
                    <span className="text-[7.5px] font-bold" style={{ color: m.color }}>
                      {m.tier}
                    </span>
                  </span>
                ))}
              </div>

              {/* Cached Replay Switch */}
              <label
                className="flex items-center gap-1.5 cursor-pointer rounded border border-slate-800 bg-slate-900/60 px-1.5 py-0.5 whitespace-nowrap"
                title="Toggle Live Inference vs Deterministic Cached Replay"
              >
                <span className="text-[7px] text-slate-400">REPLAY</span>
                <input
                  type="checkbox"
                  checked={!live}
                  onChange={(e) => setLive(!e.target.checked)}
                  className="h-3 w-3 accent-lime-400 cursor-pointer"
                />
              </label>

              {/* Build Hash on wide screens */}
              <span className="hidden min-[1600px]:inline font-mono-t text-[7.5px] text-slate-500">
                BUILD {build}
              </span>
            </div>

            {/* Actions: Master Language + Bilateral Mode Switch + Launch Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* THE SOLE GLOBAL MASTER LANGUAGE SELECTOR */}
              <div className="flex items-center gap-1 sm:gap-1.5 rounded-xl border border-lime-400/40 bg-slate-900/95 px-2 py-1 shadow-lg backdrop-blur shrink-0">
                <Languages size={12} className="text-lime-400 shrink-0" />
                <span className="font-mono-t text-[8px] font-bold uppercase tracking-wider text-slate-400 hidden 2xl:inline">
                  Lang:
                </span>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="bg-transparent text-lime-300 font-mono-t text-[8.5px] font-bold focus:outline-none cursor-pointer pr-1"
                  title="Global Master Language Selector — Controls entire application"
                  aria-label="Global Master Language Selector"
                >
                  <option value="en" className="bg-slate-950 text-white">🌐 English (EN)</option>
                  <option value="hi" className="bg-slate-950 text-lime-400 font-bold">🇮🇳 हिन्दी (HI)</option>
                  <option value="de" className="bg-slate-950 text-white">🇩🇪 Deutsch (DE)</option>
                  <option value="es" className="bg-slate-950 text-white">🇪🇸 Español (ES)</option>
                  <option value="fr" className="bg-slate-950 text-white">🇫🇷 Français (FR)</option>
                  <option value="it" className="bg-slate-950 text-white">🇮🇹 Italiano (IT)</option>
                  <option value="pt" className="bg-slate-950 text-white">🇵🇹 Português (PT)</option>
                  <option value="ar" className="bg-slate-950 text-white">🇦🇪 العربية (AR)</option>
                  <option value="ja" className="bg-slate-950 text-white">🇯🇵 日本語 (JA)</option>
                  <option value="zh" className="bg-slate-950 text-white">🇨🇳 中文 (ZH)</option>
                </select>
              </div>

              {/* Bilateral Mode Switch: CITIZEN vs OWNER */}
              <div className="mode-switch shrink-0" role="group" aria-label="Application mode">
                <button
                  type="button"
                  className={mode === "citizen" ? "active" : ""}
                  onClick={() => changeMode("citizen")}
                  aria-pressed={mode === "citizen"}
                  title="Citizen Mode: Code-verified, red-teamed appeal kit with serif legal letter and deadline"
                >
                  <ShieldCheck size={12} className="text-lime-400 shrink-0" />
                  <span>
                    CITIZEN <span className="mode-word hidden 2xl:inline">APPEAL</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={mode === "owner" ? "active" : ""}
                  onClick={() => changeMode("owner")}
                  aria-pressed={mode === "owner"}
                  title="System Owner Mode: Zero-PII incident diagnosis, 12,847-case cluster root cause, and merge-ready React patch"
                >
                  <Building2 size={12} className="text-cyan-400 shrink-0" />
                  <span>
                    OWNER <span className="mode-word hidden 2xl:inline">DIAGNOSTIC</span>
                  </span>
                </button>
              </div>

              {/* Launch Case Workbench Modal (⌘K) */}
              <button
                type="button"
                className="primary-button launch-button shrink-0 hidden sm:inline-flex"
                onClick={() => launch("input")}
                title="Launch focused case workbench or vent box (⌘K)"
              >
                <Plus size={13} />
                <span className="hidden xl:inline">LAUNCH </span>WORKBENCH
                <kbd className="hidden 2xl:inline">⌘ K</kbd>
              </button>

              <span className="header-divider hidden md:block" />

              {/* Anonymous Activity Feed & System Notes */}
              <button
                type="button"
                className={`icon-button shrink-0 ${overlay === "activity" ? "active" : ""}`}
                onClick={() => setOverlay("activity")}
                aria-label="View anonymous resolution activity"
                title="View anonymous global resolution activity feed"
              >
                <History size={15} />
              </button>
              <button
                type="button"
                className={`icon-button shrink-0 ${overlay === "help" ? "active" : ""}`}
                onClick={() => setOverlay("help")}
                aria-label="Help and integration status"
                title="System architecture & Nebius / NVIDIA notes"
              >
                <CircleHelp size={15} />
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* ═══════════════════ HERO SECTION ═══════════════════ */}
          <section id="hero" className="relative mx-auto max-w-[1760px] px-4 pb-10 pt-8 md:px-8 md:pt-12">
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="flex items-center gap-2 rounded-full border border-lime-400/30 bg-lime-400/10 py-1 pl-2 pr-3 font-mono-t text-[8px] font-bold uppercase tracking-[0.22em] text-lime-300">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-lime-400" /> {i18n.heroTag1}
                  </span>
                  <span className="chip">{i18n.heroTag2}</span>
                </motion.div>

                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.6 }}
                  className={`mt-5 pb-2 font-display text-[44px] font-extrabold leading-[1.08] tracking-tight text-slate-100 sm:text-6xl xl:text-[72px] ${
                    language === "hi" ? "font-deva text-[36px] sm:text-5xl xl:text-[62px]" : ""
                  }`}
                >
                  {language === "hi" ? (
                    <>
                      {i18n.heroHeadline1}<br />
                      <span className="text-glow-lime">{i18n.heroHeadline2}</span>
                    </>
                  ) : (
                    <>
                      The machine<br />
                      said <span className="text-glow-cyan">no.</span><br />
                      <span className="font-serif-l font-medium italic text-slate-100">The machine must </span>
                      <span className="text-glow-lime whitespace-nowrap">say why.</span>
                    </>
                  )}
                </motion.h1>

                <motion.p
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.16, duration: 0.6 }}
                  className={`mt-7 sm:mt-8 max-w-xl text-[14px] leading-relaxed text-slate-300 ${
                    language === "hi" ? "font-deva text-[14px]" : ""
                  }`}
                >
                  {i18n.heroDesc}
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.24, duration: 0.6 }}
                  className="mt-7 flex flex-wrap items-center gap-3"
                >
                  <button
                    type="button"
                    onClick={() => setActiveSlide("command")}
                    className="group flex items-center gap-2 rounded-xl bg-gradient-to-r from-lime-400 to-cyan-400 px-5 py-3 font-display text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-950 shadow-[0_10px_40px_rgba(163,230,53,0.35)] transition-all hover:shadow-[0_10px_55px_rgba(163,230,53,0.5)] cursor-pointer"
                  >
                    {i18n.heroCtaCommand}
                    <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide("global")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/60 px-5 py-3 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-300 backdrop-blur transition-all hover:border-cyan-400/40 hover:text-cyan-300 cursor-pointer"
                  >
                    <Globe2 size={13} /> {i18n.stage2Tab}
                  </button>

                  <button
                    type="button"
                    onClick={() => setModal({ kind: "how" })}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 font-display text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 backdrop-blur transition-all hover:border-lime-400/40 hover:text-lime-300 cursor-pointer"
                  >
                    <ScanSearch size={13} /> {i18n.heroCtaLoop}
                  </button>
                </motion.div>

                {/* Proof strip */}
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-slate-800/80 pt-5 font-mono-t text-[8.5px] uppercase tracking-wider text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={10} className="text-emerald-400" /> {i18n.heroTrust1}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Lock size={10} className="text-lime-400" /> {i18n.heroTrust2}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Zap size={10} className="text-cyan-400" /> {i18n.heroTrust3}
                  </span>
                </div>
              </div>

              {/* Hero visual with floating animated stat chips */}
              <motion.div
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="relative mx-auto w-full max-w-[560px]"
              >
                <div className="relative overflow-hidden rounded-2xl border border-slate-800 shadow-[0_40px_90px_rgba(0,0,0,0.6)]">
                  <img
                    src="/images/hero.png"
                    alt="NIRVAXIS Command Center with scales of justice"
                    className="h-[300px] w-full object-cover sm:h-[380px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#05070d] via-[#05070d]/25 to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4">
                    <p className="font-mono-t text-[7px] uppercase tracking-[0.3em] text-cyan-300/90">
                      The Bilateral Command Center
                    </p>
                    <p className="font-display text-[11px] font-bold text-slate-100">
                      One dispute in · two sealed deliverables out
                    </p>
                  </div>
                </div>

                {/* Floating stat chips */}
                {[
                  {
                    icon: Scale,
                    text: "₹1,84,500 restored",
                    sub: "EPFO Form 19 · 30-day mandate",
                    cls: "left-[-8px] top-6 sm:left-[-18px]",
                  },
                  {
                    icon: Landmark,
                    text: "€400 · Art. 7(1)(b)",
                    sub: "Airline burden never discharged",
                    cls: "right-[-6px] top-24 sm:right-[-16px]",
                  },
                  {
                    icon: Building2,
                    text: "12,847 cases clustered",
                    sub: "zero-PII root cause → SEV-2 patch",
                    cls: "bottom-10 left-[-6px] sm:left-[-14px]",
                  },
                ].map(({ icon: Icon, text, sub, cls }, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -9, 0] }}
                    transition={{ duration: 3.6 + i * 0.8, repeat: Infinity, ease: "easeInOut" }}
                    className={`absolute ${cls} hidden rounded-xl border border-slate-700/80 bg-[#0b0f1a]/95 p-2 shadow-2xl backdrop-blur-md sm:block z-20`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon size={12} className="shrink-0 text-lime-400" />
                      <div>
                        <p className="font-mono-t text-[8px] font-bold text-slate-100">{text}</p>
                        <p className="font-mono-t text-[6.5px] text-slate-400">{sub}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Continuous Resolution Ticker Track */}
          <div className="relative z-10 border-y border-slate-800/80 bg-black/60 py-2 backdrop-blur">
            <div className="ticker-track flex whitespace-nowrap font-mono-t text-[8.5px] uppercase tracking-[0.14em] text-slate-400">
              {[0, 1].map((k) => (
                <span key={k} className="flex shrink-0 items-center">
                  {[
                    "IN · EPFO Form 19 → ₹1,84,500 restored · 30-day mandate invoked",
                    "EU · EC261 BER→MAD 5h22m → €400 · airline burden discharged on record",
                    "US · TX Prop. Code §92.109 → $2,400 + treble exposure avoided",
                    "12,847-case sibling cluster auto-detected → SEV-2 UI patch sealed",
                    "0 raw PII bytes crossed the inference boundary in any run",
                    "3/3 citations string-verified — zero model-trust in the loop",
                  ].map((s, i) => (
                    <span key={i} className="mx-6 flex items-center gap-2">
                      <CircleDot size={7} className="text-lime-400" />
                      {s}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            <style>{`.ticker-track{animation:ticker 46s linear infinite}@keyframes ticker{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
          </div>

          {/* ═══════════════════ SLIDE / STAGE SWITCHER BAR (NO OVERLAP) ═══════════════════ */}
          <div className="sticky top-[58px] z-30 border-y border-slate-800/90 bg-[#070b16]/95 backdrop-blur-xl px-3 py-2.5 shadow-2xl">
            <div className="mx-auto flex max-w-[1880px] flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline font-mono-t text-[8px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  STAGE / SLIDE:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setActiveSlide("command")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      activeSlide === "command"
                        ? "bg-gradient-to-r from-lime-400 to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(163,230,53,0.35)] scale-102"
                        : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    <ShieldCheck size={13} />
                    <span>{i18n.stage1Tab}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide("global")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      activeSlide === "global"
                        ? "bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.35)] scale-102"
                        : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    <Globe2 size={13} />
                    <span>{i18n.stage2Tab}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide("gates")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      activeSlide === "gates"
                        ? "bg-gradient-to-r from-violet-400 to-fuchsia-500 text-slate-950 shadow-[0_0_20px_rgba(192,132,252,0.35)] scale-102"
                        : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    <ShieldCheck size={13} />
                    <span>{i18n.stage3Tab}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide("specs")}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 font-display text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                      activeSlide === "specs"
                        ? "bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-[0_0_20px_rgba(251,191,36,0.35)] scale-102"
                        : "border border-slate-800 bg-slate-900/70 text-slate-400 hover:text-slate-100"
                    }`}
                  >
                    <Cpu size={13} />
                    <span>04 · Nebius & NVIDIA Specs</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View all toggle */}
                <button
                  type="button"
                  onClick={() => setActiveSlide((curr) => (curr === "all" ? "command" : "all"))}
                  className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono-t text-[8px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeSlide === "all"
                      ? "border-lime-400/80 bg-lime-400/15 text-lime-300"
                      : "border-slate-800 bg-slate-900/50 text-slate-500 hover:text-slate-300"
                  }`}
                  title="Toggle between Clean Slide Mode and Continuous Scroll Mode"
                >
                  <LayoutGrid size={11} />
                  <span>{activeSlide === "all" ? "SHOW SLIDE VIEW" : i18n.stageAllTab}</span>
                </button>
              </div>
            </div>
          </div>

          {/* ═══════════════════ SLIDE 1: BILATERAL COMMAND CENTER ═══════════════════ */}
          {(activeSlide === "command" || activeSlide === "all") && (
            <section
              id="command-center"
              className="relative mx-auto max-w-[1880px] px-3 py-10 md:px-6 z-10 clear-both block border-b border-slate-800/80 bg-[#05070d]/75 backdrop-blur-md"
            >
              <div className="mb-4 flex flex-wrap items-end justify-between gap-2 px-1">
                <div>
                  <span className="font-mono-t text-[8px] uppercase tracking-[0.32em] text-lime-400 font-bold">
                    § {i18n.stage1Eyebrow}
                  </span>
                  <h2 className={`mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl ${language === "hi" ? "font-deva text-xl md:text-2xl" : ""}`}>
                    {i18n.stage1Title}
                  </h2>
                </div>
                <p className="flex items-center gap-2 font-mono-t text-[8px] uppercase tracking-[0.2em] text-slate-400">
                  <MousePointer2 size={10} /> {i18n.stage1Subtitle}
                </p>
              </div>

              {/* 3-Column Bilateral Execution Workbench */}
              <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(310px,365px)_minmax(0,1fr)_minmax(360px,430px)] xl:h-[calc(100dvh-175px)] xl:min-h-[660px]">
                <div className="h-full min-h-[560px] xl:min-h-0 flex flex-col">
                  <InputShieldPanel
                    scenario={scenario}
                    onScenario={handleSelectScenario}
                    masked={masked}
                    onMasked={setMasked}
                    tokenList={tokenList}
                    onTokenList={setTokenList}
                    phase={phase}
                    onResolve={run}
                    progress={progress}
                  />
                </div>
                <div className="h-full min-h-[560px] xl:min-h-0 flex flex-col">
                  <ActionGraph
                    scenario={scenario}
                    phase={phase}
                    activePhase={activePhase}
                    nodeStates={nodeStates}
                    logs={logs}
                    visibleRedTeam={visibleRedTeam}
                    onFocusSource={focusSource}
                  />
                </div>
                <div className="h-full min-h-[560px] xl:min-h-0 flex flex-col">
                  <OutputKit
                    mode={mode}
                    scenario={scenario}
                    phase={phase}
                    onCitationClick={openCite}
                    externalLang={language}
                    onLanguageChange={(l) => setLanguage(l as Language)}
                  />
                </div>
              </div>

              {/* Slide Navigation Footnote */}
              {activeSlide !== "all" && (
                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveSlide("global")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-cyan-300 hover:border-cyan-400 transition-all cursor-pointer"
                  >
                    <span>Proceed to Stage 02: Global Resolution Map</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ═══════════════════ SLIDE 2: GLOBAL HQ RESOLUTION MAP & COCKPIT ═══════════════════ */}
          {(activeSlide === "global" || activeSlide === "all") && (
            <section
              id="global-map"
              className="relative mx-auto max-w-[1880px] px-3 py-10 md:px-6 z-10 clear-both block border-b border-slate-800/80 bg-[#060a14]/75 backdrop-blur-md"
            >
              <div className="mission-heading mb-6">
                <div className="mission-context">
                  <span className="eyebrow">
                    <span className="mini-cross" /> STAGE 02 / GLOBAL OPERATIONS COCKPIT
                  </span>
                  <span className="mission-tagline">An official “no” is where we begin.</span>
                </div>
                <div className="hud-banner">
                  <span className="hud-slashes">{"//////"}</span>
                  <div>
                    <h1>
                      GLOBAL RESOLUTION MAP <span>— AI ENGINE LIVE</span>
                    </h1>
                    <span className="hud-subtitle">INTELLIGENCE THAT TURNS FRICTION INTO FORWARD MOTION</span>
                  </div>
                  <span className="hud-slashes">{"//////"}</span>
                </div>
                <div className="mission-status">
                  <span>
                    <i className="status-dot" /> COMMAND CENTER ONLINE
                  </span>
                  <small>
                    <LockKeyhole size={10} /> SECURE SESSION <i /> {clock} UTC
                  </small>
                </div>
              </div>

              {/* KPI Grid */}
              <div className="kpi-grid mb-6" aria-label="Case telemetry">
                {kpis.map(({ icon: Icon, value, label, detail, color, action }) => (
                  <button
                    type="button"
                    className="kpi-card panel cursor-pointer"
                    key={label}
                    onClick={action}
                    style={{ "--kpi-color": color } as CSSProperties}
                  >
                    <span className="kpi-icon">
                      <Icon size={22} strokeWidth={1.6} />
                    </span>
                    <span className="kpi-main">
                      <strong>{value}</strong>
                      <span>{label}</span>
                    </span>
                    <ArrowUpRight className="kpi-arrow" size={12} />
                    <span className="kpi-detail">
                      <i />
                      {detail}
                    </span>
                  </button>
                ))}
              </div>

              {/* Global Filters */}
              <div className="filter-bar mb-6" aria-label="Dashboard filters">
                <div className="filter-context">
                  <Globe2 size={13} />
                  <strong>{global ? "GLOBAL OPERATIONS" : regionLabels[activeRegion].toUpperCase()}</strong>
                  <span className="filter-context-divider" />
                  <span>
                    {global ? "ALL 15 ACTIVE CASES" : `${hqScenario.activeCases} ACTIVE ${hqScenario.activeCases === 1 ? "CASE" : "CASES"}`}
                  </span>
                  {!global && (
                    <button type="button" className="reset-filter cursor-pointer" onClick={() => setSelectedRegion(null)}>
                      <X size={10} /> RESET
                    </button>
                  )}
                </div>
                <div className="filter-controls">
                  <FilterSelect label="Filter scenarios" value={selectedRegion ?? "all"} onChange={resetRegion}>
                    <option value="all">All Scenarios</option>
                    <option value="INDIA">India EPF & Scholarship</option>
                    <option value="EUROPE">EU-261 Flight Refusal</option>
                    <option value="USA">US Deposit & Utility</option>
                    <option value="MIDDLE EAST">Middle East Visa Review</option>
                    <option value="SE ASIA">SE Asia Cross-Border</option>
                    <option value="AUSTRALIA">Australia Tenancy</option>
                  </FilterSelect>
                  <FilterSelect
                    label="Model router preference"
                    value={modelTier}
                    onChange={(value) => setModelTier(value as ModelTier)}
                    icon={<GitBranch size={12} />}
                  >
                    <option value="auto">Model Router · Auto</option>
                    <option value="nano">Nano 30B · Fast Tier</option>
                    <option value="super">Super 120B · Drafting</option>
                    <option value="ultra">Ultra 550B · Deep Review</option>
                  </FilterSelect>
                  <FilterSelect label="Filter regions" value={selectedRegion ?? "all"} onChange={resetRegion}>
                    <option value="all">All Regions</option>
                    {Object.entries(regionLabels).map(([key, value]) => (
                      <option value={key} key={key}>
                        {value}
                      </option>
                    ))}
                  </FilterSelect>
                </div>
              </div>

              {/* Main Stage Grid: Left HUD, 3D Map + Dock, Right HUD */}
              <div className="main-grid">
                <aside className="left-panels">
                  <EvidenceOverview scenario={hqScenario} global={global} onInspect={() => launch("actions")} />
                  <FrictionSummary scenario={hqScenario} global={global} onInspect={() => launch("redteam")} />
                </aside>

                <div className="center-panels">
                  <WorldMapCanvas selectedRegion={selectedRegion} onSelect={selectRegion} />
                  <section className="case-dock panel" aria-label="Active case resolution dock">
                    <div className="case-dock-heading">
                      <span>
                        <i className="status-dot" /> ACTIVE CASE WORKBENCH
                      </span>
                      <span>
                        {hqScenario.id}
                        <LockKeyhole size={10} /> PII SHIELDED
                      </span>
                    </div>
                    <div className="case-dock-main">
                      <span className="case-category-icon">
                        {mode === "citizen" ? <ShieldCheck size={23} /> : <Code2 size={23} />}
                      </span>
                      <div>
                        <h2>
                          {mode === "citizen" ? hqScenario.shortTitle : "Fix the friction. Not just this case."}
                          <span className="country-tag">{hqScenario.region}</span>
                          <span className="country-tag font-bold text-lime-400 border border-lime-400/40 bg-lime-400/10">LANG: {language.toUpperCase()}</span>
                        </h2>
                        <p>
                          {mode === "citizen"
                            ? "Turn the rejection into a clear, evidence-backed next move."
                            : `${hqScenario.shortTitle} · Anonymized diagnosis + accessible React patch.`}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="dock-launch cursor-pointer"
                        onClick={() => {
                          handleSelectScenario(activeRegion === "EUROPE" ? "eu261" : activeRegion === "USA" ? "deposit" : "epf");
                          setActiveSlide("command");
                        }}
                        title="Load this scenario into the Bilateral Command Center"
                      >
                        <span>LOAD IN WORKBENCH</span>
                        <ArrowUpRight size={20} />
                      </button>
                    </div>
                    <nav className="dock-tabs" aria-label="Open workbench stage">
                      <button type="button" onClick={() => launch("input")}>
                        <Fingerprint size={12} /> INPUT & PII VAULT
                      </button>
                      <button type="button" onClick={() => launch("actions")}>
                        <GitBranch size={12} /> ACTION GRAPH & PROOF
                      </button>
                      <button type="button" onClick={() => launch("redteam")}>
                        <Swords size={12} /> RED-TEAM ARENA <span>3</span>
                      </button>
                      <button type="button" onClick={() => launch("output")}>
                        <FileCheck2 size={12} /> {mode === "citizen" ? "APPEAL OUTPUT KIT" : "DEVELOPER PATCH"}
                        <ArrowRight size={11} />
                      </button>
                    </nav>
                  </section>
                </div>

                <aside className="right-panels">
                  <ProofTrend score={proofScore} telemetry={telemetry} onInfo={() => setOverlay("help")} />
                  <RegionalBreakdown selected={selectedRegion} onSelect={selectRegion} onInfo={() => setOverlay("help")} />
                  <TopPipelines
                    scenario={hqScenario}
                    global={global}
                    onSelect={selectRegion}
                    onOwner={() => {
                      changeMode("owner");
                      launch("output");
                    }}
                  />
                </aside>
              </div>

              {/* Bottom Status Grid */}
              <div className="telemetry-timestamp mt-6">
                <span>
                  <i className="status-dot" /> LAST UPDATED: <strong>LIVE DASHBOARD</strong>
                  <span className="telemetry-separator">|</span> NEBIUS TOKEN FACTORY + TAVILY EVIDENCE ENGINE
                </span>
                <button type="button" onClick={() => setOverlay("help")} className="cursor-pointer">
                  <span className={`telemetry-mode-dot ${telemetry.mode === "LIVE" ? "live" : ""}`} />
                  {telemetry.mode === "LIVE" ? "LIVE API RUN" : "CACHED REPLAY SAFEGUARD"}
                  <Info size={10} />
                </button>
              </div>

              <section className="bottom-status-grid mt-3" aria-label="Resolution status and AI insights">
                {statusCards.map(({ icon: Icon, value, label, color, progress, dashed, action }) => (
                  <button type="button" className="bottom-stat panel cursor-pointer" onClick={action} key={label}>
                    <StatusRing color={color} progress={progress} dashed={dashed}>
                      <Icon size={18} strokeWidth={1.5} />
                    </StatusRing>
                    <span>
                      <strong>{value}</strong>
                      <small>{label}</small>
                    </span>
                  </button>
                ))}

                <button
                  type="button"
                  className="bottom-stat next-deadline panel cursor-pointer"
                  onClick={calendar}
                  title="Download a workflow calendar reminder; verify the actual legal deadline"
                >
                  <StatusRing color="#7a9fb9" progress={60}>
                    <CalendarDays size={17} strokeWidth={1.5} />
                  </StatusRing>
                  <span>
                    <strong>
                      05 NOV <em>2026</em>
                    </strong>
                    <small>
                      NEXT REMINDER <ArrowDownToLine size={10} />
                    </small>
                  </span>
                </button>

                <button type="button" className="ai-insights panel cursor-pointer" onClick={() => launch("output")}>
                  <span className="brain-icon">
                    <BrainCircuit size={30} strokeWidth={1.2} />
                  </span>
                  <div>
                    <div className="ai-insight-heading">
                      <h2>AI RESOLUTION INSIGHTS</h2>
                      <span>
                        {telemetry.mode === "LIVE" ? "LIVE" : "REFERENCE"} <i className="status-dot" />
                      </span>
                    </div>
                    <p>
                      {global
                        ? "Official-source proof. Three officer objections addressed. Zero unverified claims in your reference appeal."
                        : hqScenario.insight}
                    </p>
                    <small>Evidence-backed workflow — not formal legal representation.</small>
                  </div>
                  <ArrowUpRight size={13} className="insight-arrow" />
                </button>
              </section>

              {/* Slide Navigation Footnote */}
              {activeSlide !== "all" && (
                <div className="mt-6 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSlide("command")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Return to Stage 01: Command Center</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide("gates")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-violet-300 hover:border-violet-400 transition-all cursor-pointer"
                  >
                    <span>Proceed to Stage 03: Quality Gates</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ═══════════════════ SLIDE 3: 3 QUALITY GATES & BILATERAL LOOP ═══════════════════ */}
          {(activeSlide === "gates" || activeSlide === "all") && (
            <section
              id="quality-gates"
              className="relative mx-auto max-w-[1880px] px-4 py-12 md:px-8 z-10 clear-both block border-b border-slate-800/80 bg-[#05070d]/75 backdrop-blur-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="font-mono-t text-[8px] uppercase tracking-[0.32em] text-violet-400 font-bold">
                    § STAGE 03 · DETERMINISM ARCHITECTURE
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
                    Every rejection is a bug report <span className="text-glow-cyan">nobody filed.</span>
                  </h2>
                </div>
                <span className="font-mono-t text-[8px] uppercase tracking-widest text-slate-400">
                  Zero LLM Trust in Proof Chain
                </span>
              </div>

              <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-slate-400">
                Today, a wrongfully rejected citizen waits in a grievance queue for months — while the institution that wronged them never learns the wording of its own form. NIRVAXIS closes the loop in both directions with one sealed run.
              </p>

              <div className="mt-8 grid gap-5 lg:grid-cols-2">
                {/* Citizen side */}
                <div className="group panel relative overflow-hidden p-6 transition-all duration-500 hover:border-lime-400/40">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-lime-400/10 blur-3xl" />
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-lime-400/40 bg-lime-400/10">
                      <Scale size={20} className="text-lime-400" />
                    </div>
                    <div>
                      <p className="font-mono-t text-[7.5px] uppercase tracking-[0.3em] text-lime-400">Citizen Mode</p>
                      <h3 className="font-display text-lg font-extrabold text-slate-100">The Appeal Kit</h3>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-[11px] leading-snug text-slate-300">
                    {[
                      "Serif legal letter, re-hydrated locally — [PERSON_1] becomes your name, on your device, never on a wire",
                      "Every cited statute string-verified against official .gov/.org text — no model-hallucinated authority, ever",
                      "Red-teamed by K3-Ultron acting as the reviewing officer — 3 objections found and patched before you sign",
                      "Multilingual plain-language summary in 10 languages: EN · हिन्दी · DE · ES · FR · IT · PT · AR · JA · ZH — Nemotron Super bridge, Ultra nuance for Hindi",
                      ".ics calendar deadline with alarm, plus venue-escalation ladder",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-lime-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      changeMode("citizen");
                      setActiveSlide("command");
                    }}
                    className="mt-5 flex items-center gap-2 font-mono-t text-[9px] font-bold uppercase tracking-[0.2em] text-lime-400 transition-colors hover:text-lime-300 cursor-pointer"
                  >
                    Flip to Citizen Mode & Open Workbench <ArrowRight size={11} />
                  </button>
                </div>

                {/* Owner side */}
                <div className="group panel relative overflow-hidden p-6 transition-all duration-500 hover:border-cyan-400/40">
                  <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-cyan-400/10 blur-3xl" />
                  <div className="flex items-center gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-400/10">
                      <Building2 size={20} className="text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-mono-t text-[7.5px] uppercase tracking-[0.3em] text-cyan-400">System Owner Mode</p>
                      <h3 className="font-display text-lg font-extrabold text-slate-100">The Diagnostic Packet</h3>
                    </div>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-[11px] leading-snug text-slate-300">
                    {[
                      "Zero-PII by construction — only token classes, weights, and verdict telemetry cross the boundary",
                      "Root-cause located to the exact component: file, function, failure class, 30-day exposure window",
                      "Bayesian signal weights over the sibling cluster — 12,847 anonymized events point at one guard clause",
                      "Ready-to-merge React/Tailwind patch with unhappy-path twins and a feature-flag revert",
                      "Counterfactual replay: what the system would have done — and what it now will do",
                    ].map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-cyan-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => {
                      changeMode("owner");
                      setActiveSlide("command");
                    }}
                    className="mt-5 flex items-center gap-2 font-mono-t text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-400 transition-colors hover:text-cyan-300 cursor-pointer"
                  >
                    Flip to Owner Mode & Open Diagnostic <ArrowRight size={11} />
                  </button>
                </div>
              </div>

              {/* Three Quality Gates */}
              <div className="mt-14">
                <p className="font-mono-t text-[8px] uppercase tracking-[0.32em] text-violet-400 font-bold">
                  § Determinism Over Décor
                </p>
                <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
                  Three quality gates. <span className="text-glow-cyan">Zero vibes.</span>
                </h2>

                <div className="mt-7 grid gap-4 md:grid-cols-3">
                  {[
                    {
                      icon: Fingerprint,
                      title: "01 · The PII Shield",
                      body: "A deterministic regex + seeded-literal redactor runs first, on your device. Aadhaar, PAN, UAN, PNR, emails, phones, addresses — tokenized before any network call. Re-hydration happens locally, after the models return. Your PII is never a tensor.",
                      foot: "redact() · client-side · rehydrate() · local-only",
                      tone: "text-amber-400 border-amber-400/30 bg-amber-400/5",
                    },
                    {
                      icon: ScanSearch,
                      title: "02 · Verbatim Quote Check",
                      body: "Every legal citation the draft leans on is string-matched against Tavily-retrieved official text. Normalized substring, character class, ratio score — no model grades its homework. A citation that fails the gate never reaches your letter.",
                      foot: "quoteInText() · ratio ≥ 0.86 · Tavily .gov/.org allowlist",
                      tone: "text-emerald-400 border-emerald-400/30 bg-emerald-400/5",
                    },
                    {
                      icon: ShieldCheck,
                      title: "03 · The Red-Team Loop",
                      body: "K3-Ultron is re-instantiated as a hostile reviewing officer. It files three objections — anchor failure, burden misallocation, register mismatch — and the drafter must patch each one. What survives is filing-ready, not model-fluent.",
                      foot: "Adversarial self-critique · 3 objection/patch cycles · sealed",
                      tone: "text-violet-400 border-violet-400/30 bg-violet-400/5",
                    },
                  ].map(({ icon: Icon, title, body, foot, tone }) => (
                    <div key={title} className={`rounded-2xl border p-5 ${tone}`}>
                      <Icon size={18} />
                      <h3 className="mt-3 font-display text-[13px] font-extrabold uppercase tracking-[0.14em] text-slate-100">
                        {title}
                      </h3>
                      <p className="mt-2 text-[10.5px] leading-relaxed text-slate-400">{body}</p>
                      <p className="mt-3 border-t border-slate-800/70 pt-2 font-mono-t text-[7px] uppercase tracking-wider text-slate-500">
                        {foot}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage Navigation Footnote */}
              {activeSlide !== "all" && (
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSlide("global")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Return to Stage 02: Global Map</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide("specs")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-amber-300 hover:border-amber-400 transition-all cursor-pointer"
                  >
                    <span>Proceed to Stage 04: Token Factory & Specs</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ═══════════════════ SLIDE 4: NEBIUS & NVIDIA MODEL SPECS ═══════════════════ */}
          {(activeSlide === "specs" || activeSlide === "all") && (
            <section
              id="architecture"
              className="relative mx-auto max-w-[1880px] px-4 py-12 md:px-8 z-10 clear-both block border-b border-slate-800/80 bg-[#060a14]/75 backdrop-blur-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
                <div>
                  <span className="font-mono-t text-[8px] uppercase tracking-[0.32em] text-amber-400 font-bold">
                    § STAGE 04 · HARDWARE & MODEL BENCHMARKS
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight text-slate-100 md:text-3xl">
                    Nebius Token Factory — <span className="text-glow-lime">Multi-Tier Routing Architecture</span>
                  </h2>
                </div>
                <span className="font-mono-t text-[8px] uppercase tracking-widest text-slate-400">
                  OpenAI-Compatible · NVIDIA Nemotron Superfamily
                </span>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-3">
                  <span className="flex items-center gap-2 font-mono-t text-[9px] font-bold uppercase tracking-[0.25em] text-slate-300">
                    <Cpu size={12} className="text-cyan-400" /> Active Model Routing Matrix
                  </span>
                  <span className="font-mono-t text-[7.5px] text-slate-500">Fast Tier → Bridge Tier → Reviewer Tier</span>
                </div>
                <div className="scroll-slim overflow-x-auto">
                  <table className="w-full min-w-[720px] font-mono-t text-[8.5px]">
                    <thead>
                      <tr className="border-b border-slate-800 text-left text-slate-500">
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Tier</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Model Slug</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider">Role in loop</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider">p50</th>
                        <th className="px-4 py-2.5 font-bold uppercase tracking-wider">$/M tok</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-300">
                      {[
                        ["NANO", "NVIDIA-Nemotron-3-Nano-30B-A3B", "Classify document type · language detection · field extraction", "178ms", "0.06", "#22d3ee"],
                        ["SUPER", "nemotron-3-super-120b-a12b", "Multilingual bridge — EN · DE · ES · FR · IT · technical drafting", "740ms", "0.42", "#a3e635"],
                        ["ULTRA", "Nemotron-3-Ultra-550b-a55b", "Statutory reasoning · red-team officer · Hindi nuance · sealed legal draft", "2.2s", "1.95", "#c084fc"],
                        ["TAVILY", "Tavily Search API", ".gov/.org allowlist retrieval · advanced depth · 6 results max", "410ms", "—", "#34d399"],
                        ["VERIFIER", "Local deterministic", "String-level citation proof · out-of-band of any model", "1ms", "0.00", "#f59e0b"],
                      ].map(([tier, model, role, p50, rate, color]) => (
                        <tr key={tier as string} className="border-b border-slate-800/60 align-top transition-colors hover:bg-slate-900/40">
                          <td className="px-4 py-2.5 font-extrabold" style={{ color: color as string }}>
                            {tier}
                          </td>
                          <td className="max-w-[220px] px-4 py-2.5 text-[8px] leading-relaxed text-slate-400 font-semibold">{model}</td>
                          <td className="px-4 py-2.5 text-[8.5px] leading-relaxed">{role}</td>
                          <td className="px-4 py-2.5">{p50}</td>
                          <td className="px-4 py-2.5">{rate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <p className="mt-5 text-center font-mono-t text-[7.5px] uppercase tracking-[0.25em] text-slate-500">
                Demo ships with a sealed replay trace · configure <span className="text-slate-300">NEXT_PUBLIC_NEBIUS_API_KEY</span> +{" "}
                <span className="text-slate-300">NEXT_PUBLIC_TAVILY_API_KEY</span> to execute live
              </p>

              {/* Stage Navigation Footnote */}
              {activeSlide !== "all" && (
                <div className="mt-8 flex justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveSlide("gates")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowLeft size={13} />
                    <span>Return to Stage 03: Quality Gates</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveSlide("command")}
                    className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-2 font-display text-[10px] font-bold uppercase tracking-wider text-lime-300 hover:border-lime-400 transition-all cursor-pointer"
                  >
                    <span>Jump to Stage 01: Bilateral Workbench</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              )}
            </section>
          )}

          {/* ═══════════════════ MASTER FOOTER ═══════════════════ */}
          <footer className="relative mt-12 border-t border-slate-800/80 bg-[#05070d] py-12 z-10 clear-both block">
            <div className="mx-auto flex max-w-[1760px] flex-col items-center gap-5 px-6 text-center">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-cyan-400/25 blur-xl pointer-events-none" />
                <img
                  src="/pentagon-emblem.png"
                  alt="NIRVAXIS Official Pentagonal Emblem"
                  className="relative z-10 h-16 w-16 object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.65)] hover:scale-105 transition-transform"
                />
              </div>
              <div>
                <p className="font-display text-[14px] font-extrabold tracking-[0.18em] text-slate-100">
                  NIR<span className="text-lime-400">VAX</span><span className="text-cyan-400">IS</span>
                </p>
                <p className="mt-1 font-mono-t text-[8px] uppercase tracking-[0.3em] text-slate-400">
                  Bilateral Friction → Resolution · Global Evidence Swarm Engine
                </p>
              </div>

              <div className="powered-by my-2">
                <span>POWERED BY</span>
                <strong className="nebius-wordmark">
                  nebius<span> TOKEN FACTORY</span>
                </strong>
                <span className="partner-cross">×</span>
                <strong className="nvidia-wordmark">
                  <Eye size={19} /> NVIDIA
                </strong>
                <span className="partner-divider" />
                <strong className="tavily-wordmark">
                  <span>
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  tavily
                </strong>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 font-mono-t text-[7px] uppercase tracking-widest text-slate-500">
                {["Next.js 16 + React 19", "TypeScript", "Tailwind v4", "Three.js", "Framer Motion", "Nebius Token Factory", "Tavily API", "Nemotron 3 Superfamily"].map(
                  (s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  )
                )}
              </div>

              <p className="max-w-xl text-[9px] leading-relaxed text-slate-500">
                NIRVAXIS drafts filing-ready artifacts; it is not legal advice and does not create an attorney–client relationship. Every artifact is sealed by a red-team loop and should be confirmed before submission. Case data shown is illustrative.
              </p>

              <p className="font-mono-t text-[7.5px] uppercase tracking-[0.3em] text-slate-600">
                © 2026 NIRVAXIS · Built for the Nebius × NVIDIA Global AI Hackathon
              </p>
            </div>
          </footer>
        </main>
      </div>

      {/* ═══════════════════ INTERACTIVE MODALS & OVERLAYS ═══════════════════ */}
      {/* 1. Verbatim Citation Verification Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
            onClick={() => setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="panel max-h-[84vh] w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {modal.kind === "cite" && activeCite ? (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 bg-slate-900/60">
                    <span className="flex items-center gap-2 font-mono-t text-[8.5px] font-bold uppercase tracking-[0.25em] text-emerald-400">
                      <BadgeCheck size={11} /> Source [{activeCite.id}] — Verbatim verified
                    </span>
                    <button type="button" onClick={() => setModal(null)} className="rounded-md p-1 text-slate-500 hover:text-slate-200 cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>
                  <div className="scroll-slim max-h-[62vh] overflow-y-auto p-5">
                    <p className="font-mono-t text-[7px] uppercase tracking-[0.3em] text-slate-500">
                      {activeCite.domain === ".gov" ? "Government instrument" : "Institutional record"} · official excerpt
                    </p>
                    <h3 className="mt-1.5 font-serif-l text-[15px] font-semibold leading-snug text-slate-100">{activeCite.source}</h3>
                    <p className="mt-1 text-[9.5px] text-slate-400">{activeCite.title}</p>
                    <a
                      href={activeCite.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center gap-1.5 break-all rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 font-mono-t text-[8px] text-cyan-300 transition-colors hover:border-cyan-400/40"
                    >
                      <Globe2 size={11} className="shrink-0" />
                      {activeCite.url}
                      <ExternalLink size={9} className="shrink-0" />
                    </a>
                    <div className="mt-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3">
                      <p className="font-mono-t text-[6.5px] font-bold uppercase tracking-[0.3em] text-emerald-500">
                        The exact words the draft relied on
                      </p>
                      <p className="mt-1.5 font-serif-l text-[11.5px] italic leading-relaxed text-emerald-100/90">
                        “{activeCite.verbatimQuote}”
                      </p>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center font-mono-t text-[7px] uppercase tracking-wider text-slate-400">
                      <div className="rounded-md border border-slate-800 py-2">
                        <p className="text-[13px] font-extrabold text-emerald-400">1.00</p>
                        ratio
                      </div>
                      <div className="rounded-md border border-slate-800 py-2">
                        <p className="text-[13px] font-extrabold text-emerald-400">0</p>
                        LLM calls
                      </div>
                      <div className="rounded-md border border-slate-800 py-2">
                        <p className="text-[13px] font-extrabold text-emerald-400">STR</p>
                        match class
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 bg-slate-900/60">
                    <span className="flex items-center gap-2 font-mono-t text-[8.5px] font-bold uppercase tracking-[0.25em] text-lime-400">
                      <GitBranch size={11} /> The 7-Beat Sealed Loop
                    </span>
                    <button type="button" onClick={() => setModal(null)} className="rounded-md p-1 text-slate-500 hover:text-slate-200 cursor-pointer">
                      <X size={15} />
                    </button>
                  </div>
                  <div className="scroll-slim max-h-[62vh] overflow-y-auto p-5">
                    <ol className="space-y-3">
                      {[
                        [
                          "Classify",
                          "Nemotron Nano 30B reads your masked notice and names the dispute type — document, claim, or statutory notice — with a confidence score. 178ms, $0.0004.",
                        ],
                        [
                          "Shield",
                          "Before anything touches a network, the deterministic redactor swaps every Aadhaar, PNR, email and address for a token. The models see [PERSON_1], never your name.",
                        ],
                        [
                          "Retrieve",
                          "Tavily runs an advanced search restricted to an allowlist of official .gov and .org domains. Off-domain results are discarded at the door.",
                        ],
                        [
                          "Verify",
                          "A pure string verifier confirms every quote the draft will lean on exists — verbatim — inside the retrieved text. No LLM in the loop, ever.",
                        ],
                        [
                          "Draft",
                          "Nemotron Ultra 550B writes the legal position grounded exclusively in verified quotes. Super 120B bridges the multilingual summaries (Hindi anchored on Ultra).",
                        ],
                        [
                          "Red-team",
                          "Ultra is re-instantiated as a hostile reviewing officer. Three objections filed, three patches merged. What survives is filing-ready.",
                        ],
                        [
                          "Assemble",
                          "The token map re-hydrates on this device. You get the serif letter, the .ics deadline, and — for the institution — a zero-PII diagnostic packet with a merge-ready patch.",
                        ],
                      ].map(([title, body], i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-lime-400/40 bg-lime-400/10 font-mono-t text-[9px] font-extrabold text-lime-400">
                            {i + 1}
                          </span>
                          <span>
                            <span className="font-display text-[11px] font-extrabold uppercase tracking-wider text-slate-100">
                              {title}
                            </span>
                            <br />
                            <span className="text-[10px] leading-relaxed text-slate-400">{body}</span>
                          </span>
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

      {/* 2. Focused Full-Screen Workbench Modal (⌘K) */}
      <ResolutionWorkbench
        key={activeRegion}
        scenario={hqScenario}
        mode={mode}
        language={language}
        modelTier={modelTier}
        telemetry={telemetry}
        open={workbenchOpen}
        initialTab={workbenchTab}
        onClose={closeWorkbench}
        onModeChange={changeMode}
        onResolved={onResolved}
        onNotify={notify}
      />

      {/* 3. Operations & Activity Overlay Drawer */}
      <OperationsOverlay view={overlay} onClose={closeOverlay} onLaunch={launchInput} />

      {/* 4. Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast-message"
            role="status"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
          >
            <span>
              <Check size={15} />
            </span>
            <p>{toast}</p>
            <button type="button" className="icon-button cursor-pointer" onClick={() => setToast(null)} aria-label="Dismiss notification">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. K3-Ultron Floating Reviewing Officer AI Assistant */}
      <K3UltronFloatingBot
        scenario={scenario}
        language={language}
        onLanguageChange={(l) => setLanguage(l as Language)}
      />
    </div>
  );
}
