"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, ArrowRight, Check, CircleHelp, Database, FileClock, Fingerprint, Info, KeyRound, LoaderCircle, ShieldCheck, X, Zap } from "lucide-react";

type Run = { id: string; region: string; mode: string; outputMode: string; proofScore: number; latencyMs: number; createdAt: string; costUSD: number };
type Status = { nebiusConfigured: boolean; tavilyConfigured: boolean; timeoutMs: number };
export default function OperationsOverlay({ view, onClose, onLaunch }: { view: "activity" | "help" | null; onClose: () => void; onLaunch: () => void }) {
  const [runs, setRuns] = useState<Run[]>([]);
  const [available, setAvailable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!view) return;
    const controller = new AbortController();
    const previous = document.body.style.overflow;
    const active = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden"; closeRef.current?.focus();
    queueMicrotask(() => { if (!controller.signal.aborted) setLoading(true); });
    Promise.all([
      fetch("/api/runs", { signal: controller.signal }).then((response) => response.json()).then((data) => { setRuns(Array.isArray(data.runs) ? data.runs : []); setAvailable(Boolean(data.available)); }),
      fetch("/api/status", { signal: controller.signal }).then((response) => response.json()).then(setStatus),
    ]).catch(() => setAvailable(false)).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const elements = modalRef.current?.querySelectorAll<HTMLElement>('button, a[href], [tabindex="0"]');
        if (!elements?.length) return;
        if (event.shiftKey && document.activeElement === elements[0]) { event.preventDefault(); elements[elements.length - 1].focus(); }
        else if (!event.shiftKey && document.activeElement === elements[elements.length - 1]) { event.preventDefault(); elements[0].focus(); }
      }
    };
    window.addEventListener("keydown", handler);
    return () => { controller.abort(); document.body.style.overflow = previous; window.removeEventListener("keydown", handler); active?.focus(); };
  }, [view, onClose]);
  if (!view) return null;
  return <div className="operations-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="operations-modal panel" role="dialog" aria-modal="true" aria-labelledby="operations-title" ref={modalRef}><header><span className="operations-modal-icon">{view === "activity" ? <Activity size={23} /> : <CircleHelp size={23} />}</span><div><span className="eyebrow">NIRVAXIS / MISSION CONTROL</span><h2 id="operations-title">{view === "activity" ? "Resolution activity" : "Built for proof. Designed for privacy."}</h2></div><button className="icon-button" ref={closeRef} onClick={onClose} aria-label="Close operations dialog"><X size={20} /></button></header><div className="operations-modal-content">{view === "activity" ? <><div className="history-privacy"><ShieldCheck size={17} /><p>Only anonymous run metadata is stored in PostgreSQL. No notices, vent text, names, identifiers, letters or PII vaults are persisted.</p></div>{loading ? <div className="history-empty"><LoaderCircle size={26} className="spin" /><p>Retrieving anonymous run history…</p></div> : runs.length ? <div className="run-list">{runs.map((run) => <article key={run.id}><span className="run-icon"><FileClock size={19} /></span><div><strong>{run.region} <small>{run.id.slice(0, 8).toUpperCase()}</small></strong><span>{run.outputMode === "owner" ? "SYSTEM OWNER PATCH" : "CITIZEN APPEAL"} · {new Date(run.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span></div><div className="run-score">{run.proofScore}<small>% PROOF</small></div><span className={`runtime-pill ${run.mode === "LIVE" ? "live" : "replay"}`}>{run.mode === "LIVE" ? "LIVE" : "REPLAY"}</span></article>)}</div> : <div className="history-empty"><Database size={34} /><h3>{available ? "Your first resolution starts here." : "History is temporarily unavailable."}</h3><p>{available ? "Run a case to create an anonymous audit trail. Reference replays are labeled separately from live analysis." : "You can still use the workbench. A database interruption never blocks case resolution."}</p><button className="primary-button" onClick={() => { onClose(); onLaunch(); }}>OPEN CASE WORKBENCH <ArrowRight size={14} /></button></div>}</> : <><div className="help-intro">An evidence-first bridge between people facing an official “no” and teams fixing the systems behind it.</div><div className="help-steps">{[
    { icon: Fingerprint, title: "01 / SHIELD YOUR IDENTITY", text: "Select a reference case or paste your notice. Add names to protect. Inspect the deterministic token preview before sending; unlabelled or unusual personal data may need manual redaction." },
    { icon: ShieldCheck, title: "02 / FOLLOW THE EVIDENCE", text: "Nano extracts facts. Tavily searches region-specific official domains. A quote gets verified only after a contiguous normalized match against raw source text. Applicability always needs your review." },
    { icon: Zap, title: "03 / STRENGTHEN BOTH SIDES", text: "Ultra simulates 3 officer objections. Citizen mode restores your details locally into a review template. System owner mode provides an anonymized diagnosis and accessible React patch." },
  ].map(({ icon: Icon, title, text }) => <div key={title}><Icon size={19} /><span><h3>{title}</h3><p>{text}</p></span></div>)}</div><div className="service-status"><span className="eyebrow"><KeyRound size={12} /> SERVER-SIDE INTEGRATIONS</span><div><span>NEBIUS TOKEN FACTORY</span><strong className={status?.nebiusConfigured ? "green-text" : "amber-text"}>{status?.nebiusConfigured ? "KEY CONFIGURED" : loading ? "CHECKING" : "REPLAY SAFEGUARD"}</strong></div><div><span>TAVILY OFFICIAL SEARCH</span><strong className={status?.tavilyConfigured ? "green-text" : "amber-text"}>{status?.tavilyConfigured ? "KEY CONFIGURED" : loading ? "CHECKING" : "REPLAY SAFEGUARD"}</strong></div><p>Live mode reads NEBIUS_API_KEY and TAVILY_API_KEY on the server. A configured key is not a service health guarantee. Missing keys, invalid responses, rate limits and 8-second external request timeouts fall back to a clearly labeled reference replay.</p></div><div className="help-note"><Info size={15} /><p>Dashboard totals are an illustrative global reference dataset. Replay latency is a reference benchmark, not a live measurement. Calendar exports are workflow reminders; confirm actual legal deadlines. Model preference affects drafting; Nano extraction and Ultra review remain part of the pipeline.</p></div></>}</div><footer><span><ShieldCheck size={12} /> YOUR DATA. YOUR DEVICE. YOUR NEXT MOVE.</span><button onClick={onClose}>UNDERSTOOD <Check size={12} /></button></footer></div></div>;
}
