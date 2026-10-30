"use client";

import type { CSSProperties, ReactNode } from "react";
import { Activity, ArrowUpRight, BarChart3, Building2, ChevronRight, CircleHelp, Code2, FileCheck2, GraduationCap, House, Info, Network, Plane, ShieldCheck, TriangleAlert } from "lucide-react";
import type { RegionId, Scenario, TelemetryMetrics } from "@/types/resolve";

export function PanelHeading({ icon, title, onInfo }: { icon: ReactNode; title: string; onInfo?: () => void }) {
  return <div className="panel-heading"><span>{icon}<h2>{title}</h2></span>{onInfo && <button className="panel-info" aria-label={`About ${title.toLowerCase()}`} onClick={onInfo}><Info size={12} /></button>}</div>;
}

export function Donut({ segments, score, label, size = 158, small = false }: { segments: { value: number; color: string; dim?: boolean }[]; score: number | string; label: string; size?: number; small?: boolean }) {
  const circumference = 2 * Math.PI * 55;
  const sum = segments.reduce((total, item) => total + item.value, 0) || 1;
  return <svg width={size} height={size} viewBox="0 0 160 160" className={`donut-chart ${small ? "small-donut" : ""}`} role="img" aria-label={`${score} ${label}`}>
    <circle cx="80" cy="80" r="72" fill="none" stroke="#193044" strokeWidth="0.7" strokeDasharray="1 5" />
    <circle cx="80" cy="80" r="64" fill="none" stroke="#142532" strokeWidth="1" />
    <circle cx="80" cy="80" r="55" fill="none" stroke="#13202e" strokeWidth="9" />
    {segments.map((segment, index) => { const dash = (segment.value / sum) * circumference; const currentOffset = segments.slice(0, index).reduce((total, item) => total + item.value / sum * circumference, 0); return <circle key={index} cx="80" cy="80" r="55" fill="none" stroke={segment.color} strokeWidth="9" strokeDasharray={`${Math.max(0, dash - 4)} ${circumference}`} strokeDashoffset={-currentOffset} transform="rotate(-90 80 80)" opacity={segment.dim ? 0.17 : 1} className="donut-segment" />; })}
    <circle cx="80" cy="80" r="45" fill="#07111c" stroke="#17344a" strokeWidth="0.7" />
    <text x="80" y={small ? "84" : "82"} textAnchor="middle" className="donut-value">{score}{!small && <tspan className="donut-percent">%</tspan>}</text>
    {label.split("|").map((line, index) => <text key={line} x="80" y={small ? 102 + index * 8 : 101 + index * 9} textAnchor="middle" className="donut-label">{line}</text>)}
  </svg>;
}

const proofRows = [
  { label: "VERIFIED OFFICIAL", color: "#32d5a2", count: 7, pct: 47 },
  { label: "NEEDS CONFIRM", color: "#efd05b", count: 4, pct: 27 },
  { label: "RED-TEAM RISK", color: "#f4a351", count: 2, pct: 13 },
  { label: "CRITICAL BARRIER", color: "#f06378", count: 1, pct: 7 },
  { label: "UNVERIFIED / EXCL.", color: "#738697", count: 1, pct: 6 },
];

export function EvidenceOverview({ scenario, global, onInspect }: { scenario: Scenario; global: boolean; onInspect: () => void }) {
  const rows = global ? proofRows : proofRows.map((row, index) => ({ ...row, count: index === 0 ? scenario.evidence.filter((item) => item.status === "VERIFIED").length : index === 1 ? 1 : index === 2 ? 3 : index === 3 ? scenario.urgentCount : scenario.evidence.filter((item) => item.status === "UNKNOWN").length, pct: [scenario.proofScore, 100 - scenario.proofScore, 0, 0, 0][index] }));
  const score = global ? 85 : scenario.proofScore;
  return <section className="panel evidence-overview"><PanelHeading icon={<ShieldCheck size={14} />} title="EVIDENCE & CASE OVERVIEW" onInfo={onInspect} /><div className="main-donut-wrap"><Donut segments={proofRows.map((row) => ({ value: row.pct, color: row.color }))} score={score} label={global ? "AVG PROOF SCORE" : "CASE PROOF SCORE"} /><span className="donut-side-label">EVIDENCE INTEGRITY</span><span className="donut-scan-marker" /></div><div className="proof-breakdown">{rows.map((row, index) => <button className="proof-row" key={row.label} onClick={onInspect}><i style={{ background: row.color }} /><span>{row.label}</span><strong>{row.count}</strong><small>{global ? `${row.pct}%` : index === 0 ? "MATCHED" : index === 1 ? "PENDING" : index === 2 ? "PATCHED" : index === 3 ? "URGENT" : "EXCLUDED"}</small><ChevronRight size={10} /></button>)}</div><div className="panel-bottom-note"><span className="status-dot" /> QUOTE-VERIFIED. NEVER ASSUMED.</div></section>;
}

export function FrictionSummary({ scenario, global, onInspect }: { scenario: Scenario; global: boolean; onInspect: () => void }) {
  return <section className="panel friction-summary"><PanelHeading icon={<TriangleAlert size={14} />} title="FRICTION & ACTION SUMMARY" onInfo={onInspect} /><div className="summary-columns"><div className="incident-column"><h3>INCIDENT SUMMARY</h3>{[
    { label: "RED-TEAM OBJECTIONS", value: 3, color: "#f26b7c" }, { label: "PENDING USER CHECKS", value: global ? 3 : 1, color: "#ecad56" }, { label: "URGENT DEADLINES", value: global ? 1 : scenario.urgentCount, color: "#f26b7c" }, { label: "VERIFIED ACTION STEPS", value: global ? 24 : scenario.actions.filter((item) => item.status === "VERIFIED").length, color: "#5eacff" },
  ].map((item) => <button key={item.label} onClick={onInspect}><i style={{ background: item.color }} /><span>{item.label}</span><strong style={{ color: item.color }}>{item.value}</strong></button>)}</div><div className="readiness-column"><h3>READINESS TIERS</h3>{[
    { label: "VERIFIED READY", range: "80 – 100", color: "#32d5a2" }, { label: "STRONG CASE", range: "60 – 79", color: "#e2cc66" }, { label: "NEEDS EVIDENCE", range: "40 – 59", color: "#e9a956" }, { label: "HIGH RISK", range: "20 – 39", color: "#ef6d7e" }, { label: "UNVERIFIED", range: "0 – 19", color: "#7c899b" },
  ].map((item) => <div key={item.label}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{item.range}</strong></div>)}</div></div><div className="summary-footer"><FileCheck2 size={12} /><span>EVERY ACTION HAS AN EVIDENCE TRAIL</span><ArrowUpRight size={12} /></div></section>;
}

export function ProofTrend({ score, telemetry, onInfo }: { score: number; telemetry: TelemetryMetrics; onInfo: () => void }) {
  const values = [11, 26, 39, 65, Math.max(70, score - 8), score];
  const points = values.map((value, index) => `${30 + index * 41},${103 - value * 0.8}`);
  const replay = telemetry.mode !== "LIVE";
  return <section className="panel proof-trend"><PanelHeading icon={<Activity size={14} />} title="NEBIUS ROUTER & PROOF TREND" onInfo={onInfo} /><div className="trend-summary"><span className="trend-value">{score}<small>%</small><span>PROOF READINESS</span></span><span className="trend-badge"><ArrowUpRight size={12} /> {replay ? "REFERENCE TRACE" : "LIVE SOURCES"}</span></div><svg className="line-chart" viewBox="0 0 256 130" role="img" aria-label={`Proof readiness rises across the reference pipeline to ${score} percent`}><defs><linearGradient id="chart-area" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#26dff1" stopOpacity="0.25" /><stop offset="1" stopColor="#26dff1" stopOpacity="0" /></linearGradient><filter id="chart-line-glow"><feGaussianBlur stdDeviation="1.8" /></filter></defs>{[0, 25, 50, 75, 100].map((value) => <g key={value}><line x1="28" x2="244" y1={103 - value * 0.8} y2={103 - value * 0.8} stroke="#172c3e" strokeWidth="0.6" strokeDasharray="2 3" /><text x="18" y={106 - value * 0.8} textAnchor="end" className="chart-axis">{value}</text></g>)}<path d={`M ${points[0]} L ${points.slice(1).join(" L ")} L 235,105 L 30,105 Z`} fill="url(#chart-area)" /><polyline points={points.join(" ")} fill="none" stroke="#38e4ee" strokeWidth="3" opacity="0.25" filter="url(#chart-line-glow)" /><polyline points={points.join(" ")} fill="none" stroke="#46deed" strokeWidth="1.8" strokeLinejoin="round" />{points.map((point, index) => <circle key={point} cx={Number(point.split(",")[0])} cy={Number(point.split(",")[1])} r={index === 5 ? 3 : 2} fill="#78f2f3" stroke="#142b36" strokeWidth="1" />)}{["INGEST", "SHIELD", "NANO", "TAVILY", "ULTRA", "DONE"].map((label, index) => <text key={label} x={30 + index * 41} y="123" textAnchor="middle" className="chart-axis chart-stage">{label}</text>)}</svg><div className="trend-telemetry"><span><i /> NANO <strong>{telemetry.nanoLatencyMs}ms</strong></span><span>{replay ? "BENCHMARK · REPLAY" : <>COST <strong>${telemetry.costUSD.toFixed(5)}</strong></>}</span></div></section>;
}

const regions = [
  { label: "N. AMERICA", value: 20, color: "#448fff", region: "USA" }, { label: "EUROPE", value: 26, color: "#36d8a5", region: "EUROPE" }, { label: "MIDDLE EAST", value: 20, color: "#f0657a", region: "MIDDLE EAST" }, { label: "INDIA & APAC", value: 27, color: "#f5c251", region: "INDIA" }, { label: "LATAM & OTHERS", value: 7, color: "#7a8da2", region: "AUSTRALIA" },
];
export function RegionalBreakdown({ selected, onSelect, onInfo }: { selected: RegionId | null; onSelect: (region: RegionId) => void; onInfo: () => void }) {
  const match = selected === "SE ASIA" ? "INDIA" : selected;
  return <section className="panel regional-breakdown"><PanelHeading icon={<GlobeIcon />} title="REGIONAL & MODEL BREAKDOWN" onInfo={onInfo} /><div className="regional-chart-content"><Donut size={116} small score={selected ? "01" : "06"} label="REGIONS" segments={regions.map((item) => ({ value: item.value, color: item.color, dim: Boolean(match && match !== item.region) }))} /><div className="regional-legend">{regions.map((item) => <button onClick={() => onSelect(item.region as RegionId)} key={item.label} className={match === item.region ? "active" : ""}><i style={{ background: item.color }} /><span>{item.label}</span><strong>{selected ? match === item.region ? "100%" : "—" : `${item.value}%`}</strong></button>)}</div></div></section>;
}
function GlobeIcon() { return <Network size={14} />; }

const pipelines = [
  { icon: Building2, label: "Public Benefits & EPF Appeals", value: 92, color: "#36d8a5", region: "INDIA" },
  { icon: Plane, label: "EU-261 & Aviation Claims", value: 88, color: "#31d3b1", region: "EUROPE" },
  { icon: House, label: "Tenancy & Utility Disputes", value: 76, color: "#e8cd5a", region: "USA" },
  { icon: GraduationCap, label: "Scholarship & Visa Reviews", value: 65, color: "#eeb051", region: "MIDDLE EAST" },
  { icon: Code2, label: "Portal WCAG Auto-Patches", value: 45, color: "#ed8060", region: "SE ASIA" },
];
export function TopPipelines({ scenario, global, onSelect, onOwner }: { scenario: Scenario; global: boolean; onSelect: (region: RegionId) => void; onOwner: () => void }) {
  return <section className="panel top-pipelines"><PanelHeading icon={<BarChart3 size={14} />} title="TOP RESOLUTION PIPELINES" /><div className="pipeline-metrics">{pipelines.map(({ icon: Icon, label, value, color, region }, index) => { const metric = global ? value : Math.max(25, Math.min(99, scenario.proofScore - index * 7)); return <button key={label} onClick={() => index === 4 ? onOwner() : onSelect(region as RegionId)} style={{ "--pipeline-color": color } as CSSProperties}><Icon size={13} /><span><span className="pipeline-name">{label}<strong>{metric}<small>%</small></strong></span><span className="pipeline-bar"><i style={{ width: `${metric}%` }} /></span></span></button>; })}</div></section>;
}
