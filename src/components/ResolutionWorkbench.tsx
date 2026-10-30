"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowDown, ArrowRight, BadgeCheck, BookOpen, Braces, CalendarClock, Check, CheckCheck, ChevronRight, CircleHelp, Clipboard, Code2, Download, ExternalLink, Eye, EyeOff, FileCheck2, FileText, Fingerprint, GitBranch, Globe2, Info, Languages, LoaderCircle, LockKeyhole, MessageSquareText, Play, ScanLine, ShieldCheck, ShieldX, Sparkles, Swords, Terminal, X, Zap } from "lucide-react";
import { emptyVault, redactPII, rehydratePII } from "@/lib/piiShield";
import { downloadFile, downloadICS } from "@/lib/icsGenerator";
import type { EvidenceItem, EvidenceStatus, Language, ModelTier, OutputMode, ResolveResponse, Scenario, TelemetryMetrics } from "@/types/resolve";

const tabs = [
  { id: "input", label: "INPUT & PII VAULT", short: "INPUT", icon: Fingerprint },
  { id: "actions", label: "ACTION GRAPH & PROOF", short: "ACTION GRAPH", icon: GitBranch },
  { id: "redteam", label: "RED-TEAM ARENA", short: "RED TEAM", icon: Swords },
  { id: "output", label: "BILATERAL OUTPUT KIT", short: "OUTPUT KIT", icon: FileCheck2 },
] as const;
type Tab = (typeof tabs)[number]["id"];
const languageNames: Record<Language, string> = {
  en: "English",
  hi: "हिन्दी",
  de: "Deutsch",
  es: "Español",
  fr: "Français",
  it: "Italiano",
  pt: "Português",
  ar: "العربية",
  ja: "日本語",
  zh: "中文",
};

export function EvidenceBadge({ status, children }: { status: EvidenceStatus; children?: ReactNode }) {
  const Icon = status === "VERIFIED" ? ShieldCheck : status === "NEEDS_CONFIRMATION" ? AlertTriangle : CircleHelp;
  return <span className={`evidence-badge ${status.toLowerCase()}`}><Icon size={11} />{children ?? (status === "VERIFIED" ? "VERIFIED OFFICIAL" : status === "NEEDS_CONFIRMATION" ? "NEEDS CONFIRMATION" : "UNKNOWN · EXCLUDED")}</span>;
}

function SourceCard({ item }: { item: EvidenceItem }) {
  return <div className={`source-card ${item.status.toLowerCase()}`}>
    <div className="source-top"><EvidenceBadge status={item.status} /><span className="mono muted">{item.provenance === "LIVE_TAVILY" ? "LIVE TAVILY" : "REFERENCE SNAPSHOT"}</span></div>
    {item.quote && <blockquote>“{item.quote}”</blockquote>}
    {item.condition && <p className="source-condition">{item.condition}</p>}
    {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="source-link"><Globe2 size={12} />{item.domain}<ExternalLink size={11} /><span>{item.status === "UNKNOWN" ? "QUOTE NOT VERIFIED" : `EXACT MATCH · ${Math.round(item.matchScore * 100)}%`}</span></a> : <p className="muted small">No official source. Not included in the appeal letter.</p>}
  </div>;
}

function highlightCode(line: string) {
  const parts = line.split(/("[^"\n]*"|'[^'\n]*'|\b(?:import|export|const|return|async|await|try|catch|finally|if|from|function|true|false)\b)/g);
  return parts.map((part, index) => <span key={index} className={/^["']/.test(part) ? "code-string" : /^(import|export|const|return|async|await|try|catch|finally|if|from|function|true|false)$/.test(part) ? "code-keyword" : undefined}>{part}</span>);
}

interface Props {
  scenario: Scenario;
  mode: OutputMode;
  language: Language;
  modelTier: ModelTier;
  telemetry: TelemetryMetrics;
  open: boolean;
  initialTab?: Tab;
  onClose: () => void;
  onModeChange: (mode: OutputMode) => void;
  onResolved: (result: ResolveResponse) => void;
  onNotify: (message: string) => void;
}

export default function ResolutionWorkbench({ scenario, mode, language, modelTier, telemetry, open, initialTab = "input", onClose, onModeChange, onResolved, onNotify }: Props) {
  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState<Tab>(initialTab);
  const [notice, setNotice] = useState(scenario.rawNotice);
  const [vent, setVent] = useState(scenario.ventText);
  const [names, setNames] = useState(scenario.demoName);
  const [reveal, setReveal] = useState(false);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState(0);
  const [pendingMode, setPendingMode] = useState<string | null>(null);
  const [assessment, setAssessment] = useState("");
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [inputError, setInputError] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const caseId = useRef(scenario.id);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => { if (!cancelled) setMounted(true); });
    return () => { cancelled = true; controllerRef.current?.abort(); };
  }, []);
  useEffect(() => {
    let cancelled = false;
    if (open) queueMicrotask(() => { if (!cancelled) setTab(initialTab); });
    return () => { cancelled = true; };
  }, [open, initialTab]);
  useEffect(() => {
    if (!open || !mounted) return;
    const activeElement = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab") return;
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex="0"]');
      if (!focusables?.length) return;
      const first = focusables[0]; const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    window.addEventListener("keydown", handler);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener("keydown", handler); activeElement?.focus(); };
  }, [open, mounted, onClose]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => setStage((current) => Math.min(3, current + 1)), 650);
    return () => clearInterval(timer);
  }, [running]);

  const shield = useMemo(() => {
    if (!mounted) return { text: "", vault: emptyVault(), count: 0 };
    return redactPII(`${notice}\n<<<VENT>>>\n${vent}`, names.split(",").map((name) => name.trim()));
  }, [notice, vent, names, mounted]);
  const [safeNotice, safeVent = ""] = shield.text.split("\n<<<VENT>>>\n");
  const hydratedLetter = mounted ? rehydratePII(scenario.appealLetter, shield.vault) : scenario.appealLetter;

  const copy = useCallback(async (value: string) => {
    try { await navigator.clipboard.writeText(value); setCopied(true); onNotify("Copied securely on your device."); window.setTimeout(() => setCopied(false), 2000); }
    catch { downloadFile(value, "nirvaxis-output.txt"); onNotify("Clipboard unavailable. Your output was downloaded instead."); }
  }, [onNotify]);

  async function runPipeline() {
    if (!notice.trim() || notice.trim().length < 20) { setInputError("Add at least 20 characters from your rejection notice or portal issue."); return; }
    if (notice.length > 16000 || vent.length > 6000) { setInputError("Keep the notice under 16,000 characters and the vent under 6,000."); return; }
    setInputError(""); setRunning(true); setStage(0); setPendingMode(null);
    const controller = new AbortController(); controllerRef.current = controller;
    const timeout = setTimeout(() => controller.abort(), 32000);
    const started = performance.now();
    try {
      const response = await fetch("/api/resolve", { method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal, body: JSON.stringify({ region: scenario.region, notice: safeNotice, vent: safeVent, language, modelTier, outputMode: mode }) });
      if (!response.ok) throw new Error("The connection was interrupted. Your inputs remain on this device. Please retry.");
      const result = await response.json() as ResolveResponse;
      if (!result.scenario?.evidence || !result.telemetry?.mode) throw new Error("The response could not be validated. Please retry.");
      setPendingMode(result.telemetry.mode);
      const remaining = Math.max(0, 2200 - (performance.now() - started));
      if (remaining) await new Promise((resolve) => setTimeout(resolve, remaining));
      if (controller.signal.aborted) return;
      setStage(4); setAssessment(result.inputAssessment); onResolved(result); setTab("actions");
      onNotify(result.telemetry.mode === "LIVE" ? "Live evidence analysis complete. Review your action graph." : "Reference replay ready. Live services were not used.");
    } catch (error) {
      if (!controller.signal.aborted || caseId.current === scenario.id) setInputError(error instanceof Error && error.name !== "AbortError" ? error.message : "The request timed out. Your inputs are preserved; please retry.");
    } finally { clearTimeout(timeout); if (controllerRef.current === controller) { setRunning(false); setPendingMode(null); } }
  }

  function downloadPacket() {
    const sourceList = scenario.evidence.map((item) => `- ${item.status}: ${item.title}\n  ${item.url || "No verified source"}\n  ${item.quote}`).join("\n");
    const critiques = scenario.critiques.map((item) => `### ${item.title}\nOfficer: ${item.objection}\nPatch: ${item.patch}`).join("\n\n");
    const output = mode === "citizen" ? `## Formal review template\n\n${hydratedLetter}` : `## Anonymized diagnosis\n\n${scenario.frictionReport}\n\n## Proposed accessible code\n\n\`\`\`tsx\n${scenario.codePatch.after}\n\`\`\``;
    downloadFile(`# NIRVAXIS\nCase: ${scenario.id}\nRuntime: ${telemetry.mode}\n\n${assessment || "Precomputed reference case; not a live legal analysis."}\n\n## Action guide\n${(scenario.guide[language] ?? scenario.guide.en).map((item) => `- ${item}`).join("\n")}\n\n## Official-source evidence\n${sourceList}\n\n## Officer review\n${critiques}\n\n${output}\n\n---\nInformational workflow, not legal representation. Confirm all facts, conditions and actual deadlines. Calendar dates are workflow reminders only.`, `nirvaxis-${scenario.region.toLowerCase().replace(/\s/g, "-")}-case.md`, "text/markdown;charset=utf-8");
    onNotify(mode === "citizen" ? "Case packet downloaded locally. It may contain your restored personal details." : "Zero-PII developer packet downloaded.");
  }

  if (!mounted || !open) return null;
  const pipelineStages = ["NANO 30B · FACT EXTRACTION", "TAVILY · OFFICIAL SOURCES", "DETERMINISTIC QUOTE CHECK", "ULTRA 550B · OFFICER REVIEW"];

  return createPortal(<AnimatePresence><motion.div className="workbench-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <motion.div ref={dialogRef} className="workbench-modal" role="dialog" aria-modal="true" aria-labelledby="workbench-title" initial={{ opacity: 0, y: 20, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.2 }}>
      <header className="workbench-header"><div className="workbench-title-icon"><ScanLine size={23} /></div><div><div className="eyebrow">CASE RESOLUTION WORKBENCH <span>/{scenario.region}</span></div><h2 id="workbench-title">{scenario.shortTitle}<span className="case-id">{scenario.id}</span></h2></div><div className="workbench-header-actions"><span className={`runtime-pill ${telemetry.mode === "LIVE" ? "live" : "replay"}`}><i />{telemetry.mode === "LIVE" ? "LIVE VERIFIED SOURCES" : "REFERENCE REPLAY"}</span><button ref={closeRef} className="icon-button" onClick={onClose} aria-label="Close case workbench"><X size={20} /></button></div></header>
      <div className="workbench-tabs" role="tablist" aria-label="Case workflow stages">{tabs.map(({ id, label, short, icon: Icon }, index) => <button key={id} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={tab === id} className={tab === id ? "active" : ""} onClick={() => setTab(id)}><span className="tab-number">0{index + 1}</span><Icon size={15} /><span className="tab-full">{label}</span><span className="tab-short">{short}</span>{id === "redteam" && <small>3</small>}</button>)}</div>
      <div className="workbench-scroll" id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab !== "input" && <div className={`assessment-banner ${telemetry.mode === "LIVE" ? "live" : ""}`}><Info size={15} /><span>{assessment || "REFERENCE REPLAY — precomputed case, not analysis of your submitted notice. Confirm all facts and actual deadlines before using this template."}</span></div>}
        {tab === "input" && <div className="input-layout">
          <div className="input-column"><div className="section-kicker"><FileText size={15} /> THE NOTICE. THE FACTS. YOUR WORDS.<span>01 / INGEST</span></div><label className="field-label" htmlFor="notice">Rejection notice / broken portal details <span>REQUIRED</span></label><textarea id="notice" className="notice-input" value={notice} onChange={(event) => setNotice(event.target.value)} maxLength={16000} spellCheck={false} placeholder="Paste the notice, rejection email or broken portal details…" /><div className="field-caption"><span>Reference example loaded. Replace it with your own notice.</span><span>{notice.length.toLocaleString("en-US")} / 16,000</span></div>
            <label className="field-label vent-label" htmlFor="vent"><MessageSquareText size={14} /> Vent mode <span>OPTIONAL · MULTILINGUAL</span></label><textarea id="vent" className="vent-input" value={vent} onChange={(event) => setVent(event.target.value)} maxLength={6000} placeholder="Write in Hindi, Hinglish, Spanish or English. Let it out. We keep the verifiable facts." /><p className="input-hint"><Sparkles size={12} /> Nano separates the emotion from the evidence. Your voice still matters.</p>
            <label className="field-label" htmlFor="private-names"><LockKeyhole size={12} /> Names to protect <span>STAYS ON THIS DEVICE</span></label><input id="private-names" className="text-input" value={names} onChange={(event) => setNames(event.target.value)} placeholder="Full name, other name (comma-separated)" /><p className="small muted">Pattern-based protection is not infallible. Add names and inspect the preview before sending.</p>
          </div>
          <div className="vault-column"><div className="vault-heading"><span className="vault-shield"><ShieldCheck size={25} /></span><div><h3>YOUR IDENTITY STAYS HERE.</h3><p>Reversible PII vault · browser memory only</p></div><span className="local-badge"><i /> LOCAL</span></div>
            <div className="vault-counts"><div><strong>{shield.count.toString().padStart(2, "0")}</strong><span>VALUES MASKED</span></div><div><strong>0</strong><span>IDENTITIES STORED SERVER-SIDE</span></div><LockKeyhole size={24} /></div>
            <div className="preview-heading"><span><Terminal size={12} /> {reveal ? "ORIGINAL · ON DEVICE ONLY" : "TOKENIZED · SENT TO API"}</span><button onClick={() => setReveal(!reveal)}>{reveal ? <EyeOff size={12} /> : <Eye size={12} />}{reveal ? "HIDE ORIGINAL" : "REVEAL LOCALLY"}</button></div><pre className={`shield-preview ${reveal ? "raw-preview" : ""}`}>{reveal ? `${notice}\n\n${vent}` : shield.text.replace("<<<VENT>>>", "— VENT FACTS —")}</pre>
            <div className="token-chips">{Object.keys(shield.vault.entries).map((token) => <span key={token}><LockKeyhole size={9} />{token}</span>)}</div><div className="vault-promise"><CheckCheck size={15} /><p>The token map never leaves this browser. Real values are restored locally in your appeal letter. Nothing is saved to localStorage.</p></div>
            {inputError && <div role="alert" className="input-error"><AlertTriangle size={14} />{inputError}</div>}
            <button className="primary-button run-button" disabled={running || !notice.trim()} onClick={runPipeline}>{running ? <LoaderCircle className="spin" size={17} /> : <Zap size={17} />} {running ? "PREPARING YOUR RESOLUTION" : "RUN NEBIUS + TAVILY ENGINE"}<ArrowRight size={16} /></button><p className="engine-footnote">Smart routing · 8s per-service timeout · automatic replay safeguard</p>
          </div>
          {running && <motion.div className="pipeline-progress" initial={{ opacity: 0 }} animate={{ opacity: 1 }} role="status" aria-live="polite"><div className="pipeline-progress-heading"><LoaderCircle className="spin" size={15} />{pendingMode === "CACHED_REPLAY_SAFEGUARD" ? "LIVE SERVICES UNAVAILABLE · PREPARING REFERENCE REPLAY" : "RESOLUTION PIPELINE · PREPARING RESULTS"}<span>YOUR PII IS SHIELDED</span></div><div className="pipeline-stage-row">{pipelineStages.map((label, index) => <div key={label} className={`${index < stage ? "complete" : ""} ${index === stage ? "current" : ""}`}><span>{index < stage ? <Check size={12} /> : `0${index + 1}`}</span>{label}{index < 3 && <ChevronRight size={13} />}</div>)}</div><p>Stage visualization; actual services and measured usage are reported in the final runtime telemetry.</p></motion.div>}
        </div>}
        {tab === "actions" && <div className="actions-content"><div className="workbench-section-heading"><div><span className="eyebrow">FROM FRICTION TO FORWARD MOTION</span><h3>Your next move, backed by proof.</h3></div><button className="secondary-button" onClick={() => { downloadICS(`Review ${scenario.shortTitle}`, scenario.nextDeadline, "Check your original notice and the actual statutory deadline before taking action."); onNotify("Workflow reminder downloaded. Confirm the actual legal deadline separately."); }}><CalendarClock size={14} /> EXPORT REMINDER</button></div><div className="action-dependency">{scenario.actions.map((action, index) => <div key={action.id}><span className={`dependency-number ${action.status.toLowerCase()}`}>0{index + 1}</span><span>{action.title}</span>{index < scenario.actions.length - 1 && <ArrowRight size={17} />}</div>)}</div><div className="action-grid">{scenario.actions.map((action, index) => <article className={`action-card ${action.status.toLowerCase()}`} key={action.id}><div className="action-card-top"><span className="action-step">STEP 0{index + 1}</span><span className={`priority ${action.priority.toLowerCase()}`}>{action.priority} PRIORITY</span><button className="icon-button" aria-label={`Export reminder for ${action.title}`} onClick={() => { downloadICS(action.title, action.deadline, action.instruction); onNotify("Calendar reminder downloaded. This is not a verified legal deadline."); }}><CalendarClock size={14} /></button></div><h4>{action.title}</h4><p className="action-instruction">{action.instruction}</p><div className="action-why"><span>WHY THIS TASK EXISTS</span><p>{action.explanation}</p></div>{action.evidenceIds.map((id) => scenario.evidence.find((item) => item.id === id)).filter((item): item is EvidenceItem => Boolean(item)).map((item) => <SourceCard item={item} key={item.id} />)}{action.status === "NEEDS_CONFIRMATION" && <label className="confirmation-check"><input type="checkbox" checked={confirmed.has(action.id)} onChange={(event) => setConfirmed((current) => { const next = new Set(current); if (event.target.checked) next.add(action.id); else next.delete(action.id); return next; })} />I checked these facts against my original records.<span>{confirmed.has(action.id) ? "USER CONFIRMED" : "YOUR CHECK NEEDED"}</span></label>}<div className="action-deadline"><CalendarClock size={12} /><span>{action.deadlineType === "CONFIRM_STATUTORY_DATE" ? "VERIFY ACTUAL STATUTORY DATE" : `WORKFLOW REMINDER · ${action.deadline}`}</span>{action.dependsOn.length > 0 && <small>AFTER {action.dependsOn.join(", ").toUpperCase()}</small>}</div></article>)}</div></div>}
        {tab === "redteam" && <div className="redteam-content"><div className="workbench-section-heading"><div><span className="eyebrow red-text">ADVERSARIAL REVIEW · NEMOTRON 3 ULTRA 550B</span><h3>Meet the objections. Before the officer does.</h3></div><span className="patched-badge"><ShieldCheck size={15} /> 3 / 3 ADDRESSED</span></div><p className="redteam-intro">A strict reviewing-officer simulation tests the weak points in a naive appeal. These are suggested improvements, not a prediction of the authority&apos;s decision.{telemetry.mode !== "LIVE" && " This is a precomputed reference review."}</p><div className="arena-column-labels"><span><ShieldX size={13} /> THE STRICT REVIEWING OFFICER</span><span><ShieldCheck size={13} /> THE HARDENED RESPONSE</span></div>{scenario.critiques.map((critique, index) => <article className="critique-row" key={critique.id}><div className="officer-objection"><div><span className="critique-number">0{index + 1}</span><h4>{critique.title}</h4><span className={`priority ${critique.severity.toLowerCase()}`}>{critique.severity}</span></div><p>“{critique.objection}”</p></div><span className="critique-arrow"><ArrowRight size={17} /></span><div className="critique-patch"><span className="mono"><Check size={12} /> RESPONSE PATCH</span><p>{critique.patch}</p></div></article>)}<div className="arena-footer"><LockKeyhole size={15} /><span>No fabricated rules. No guaranteed outcomes. No unverified claim gets a free pass.</span><button className="primary-button" onClick={() => setTab("output")}>VIEW HARDENED OUTPUT <ArrowRight size={14} /></button></div></div>}
        {tab === "output" && <div className="output-content"><div className="workbench-section-heading"><div><span className="eyebrow">ONE ENGINE. BOTH SIDES OF THE FRICTION.</span><h3>{mode === "citizen" ? "Your voice. A stronger case." : "Don't just resolve the case. Fix the system."}</h3></div><div className="output-mode-toggle"><button className={mode === "citizen" ? "active" : ""} onClick={() => onModeChange("citizen")}><ShieldCheck size={13} /> CITIZEN</button><button className={mode === "owner" ? "active" : ""} onClick={() => onModeChange("owner")}><Code2 size={13} /> SYSTEM OWNER</button></div></div>
          {mode === "citizen" ? <div className="citizen-output-grid"><div className="plain-guide"><div className="output-card-heading"><Languages size={16} /><h4>PLAIN-LANGUAGE ACTION GUIDE</h4><span>EN {language !== "en" ? `+ ${language.toUpperCase()}` : ""}</span></div><div className="guide-language"><span className="language-tag">ENGLISH</span>{scenario.guide.en.map((item, index) => <div className="guide-step" key={item}><span>0{index + 1}</span><p>{item}</p></div>)}</div>{language !== "en" && <div className="guide-language native"><span className="language-tag">{languageNames[language]}{language === "hi" && <small>ULTRA · HINDI</small>}</span>{(scenario.guide[language] ?? scenario.guide.en).map((item, index) => <div className="guide-step" key={item}><span>0{index + 1}</span><p lang={language}>{item}</p></div>)}</div>}<div className="guide-warning"><AlertTriangle size={15} /><p>Verify the actual deadline on the notice. The calendar export is a workflow reminder, not a legal deadline calculation.</p></div></div><div className="letter-output"><div className="output-card-heading"><FileText size={15} /><h4>{telemetry.mode === "LIVE" ? "FORMAL APPEAL DRAFT" : "REFERENCE APPEAL TEMPLATE"}</h4><span><LockKeyhole size={10} /> REHYDRATED LOCALLY</span></div><textarea className="appeal-letter" readOnly aria-label="Locally restored formal appeal letter" value={hydratedLetter} /><div className="letter-footer"><span><ShieldCheck size={12} /> PERSONAL VALUES RESTORED ON DEVICE</span><button className="secondary-button" onClick={() => copy(hydratedLetter)}>{copied ? <CheckCheck size={13} /> : <Clipboard size={13} />}{copied ? "COPIED" : "COPY LETTER"}</button></div></div></div> : <div className="owner-output-grid"><div className="friction-report"><div className="output-card-heading"><ScanLine size={15} /><h4>ROOT-CAUSE FRICTION REPORT</h4><span>ZERO PII</span></div><pre>{scenario.frictionReport}</pre><div className="wcag-tags">{scenario.codePatch.wcag.map((item) => <span key={item}><BadgeCheck size={11} />{item}</span>)}</div><p className="patch-review-note"><Info size={13} /> Proposed integration patch. Review and test with the institution&apos;s real API before deployment.</p></div><div className="code-output"><div className="code-file-heading"><Braces size={14} /><span>{scenario.codePatch.fileName}</span><span className="diff-stats">−{scenario.codePatch.before.split("\n").length} +{scenario.codePatch.after.split("\n").length}</span><button className="icon-button" onClick={() => copy(scenario.codePatch.after)} aria-label="Copy accessible code patch"><Clipboard size={13} /></button></div><div className="code-diff"><div className="diff-label">BEFORE · INACCESSIBLE CONTROL</div>{scenario.codePatch.before.split("\n").map((line, index) => <div key={`before-${index}`} className="diff-line removed"><span className="line-number">{index + 1}</span><span className="line-sign">−</span><code>{highlightCode(line)}</code></div>)}<div className="diff-label added-label">AFTER · SEMANTIC, RECOVERABLE, ACCESSIBLE</div>{scenario.codePatch.after.split("\n").map((line, index) => <div key={`after-${index}`} className="diff-line added"><span className="line-number">{index + 1}</span><span className="line-sign">+</span><code>{highlightCode(line)}</code></div>)}</div><div className="code-footer"><span><ShieldCheck size={12} /> NO PERSONAL DATA IN PATCH</span><button className="secondary-button" onClick={() => { downloadFile(scenario.codePatch.after, scenario.codePatch.fileName.split("/").pop() ?? "accessible-review.tsx", "text/typescript;charset=utf-8"); onNotify("Accessible React patch downloaded for review and integration."); }}><Download size={13} /> DOWNLOAD .TSX</button></div></div></div>}
          <div className="packet-download"><span><BookOpen size={17} /><span><strong>Take the complete evidence trail with you.</strong><small>Action guide, citations, officer review and {mode === "citizen" ? "your locally restored letter" : "the zero-PII developer patch"}.</small></span></span><button className="primary-button" onClick={downloadPacket}><Download size={15} /> DOWNLOAD CASE PACKET .MD</button></div>
        </div>}
      </div>
      <footer className="workbench-footer"><span><LockKeyhole size={11} /> BROWSER-ONLY PII VAULT <i /> {telemetry.databasePersisted ? "ANONYMOUS RUN SAVED" : "PERSONAL INPUT NEVER PERSISTED"}</span><span>Evidence-backed information. Not formal legal representation.</span>{tab !== "input" ? <button onClick={() => setTab(tabs[Math.max(0, tabs.findIndex((item) => item.id === tab) - 1)].id)}>← PREVIOUS STEP</button> : <button onClick={() => setTab("actions")}>EXPLORE REFERENCE CASE <ArrowRight size={11} /></button>}</footer>
    </motion.div>
  </motion.div></AnimatePresence>, document.body);
}
