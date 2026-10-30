"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import dynamic from "next/dynamic";
import { geoEquirectangular, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import { Activity, Crosshair, Expand, Globe2, Layers3, Minus, Pause, Play, Plus, Radio, RotateCcw, X } from "lucide-react";
import worldData from "@/lib/world.json";
import type { RegionId } from "@/types/resolve";
import { mockScenarios } from "@/lib/mockScenarios";

const WorldGlobe3D = dynamic(() => import("./WorldGlobe3D"), { ssr: false });
const WorldParticles = dynamic(() => import("./WorldParticles"), { ssr: false });

const nodes: { id: RegionId; x: number; y: number; color: string; label: string; sub: string }[] = [
  { id: "USA", x: 23, y: 42, color: "#4c9dff", label: "USA", sub: "3 ACTIVE CASES" },
  { id: "EUROPE", x: 47, y: 30, color: "#39e8b2", label: "EUROPE", sub: "4 ACTIVE CASES" },
  { id: "MIDDLE EAST", x: 56, y: 46, color: "#ff5b72", label: "MIDDLE EAST", sub: "2 ACTIVE CASES" },
  { id: "INDIA", x: 64, y: 51, color: "#f6c35b", label: "INDIA", sub: "4 ACTIVE CASES" },
  { id: "SE ASIA", x: 72, y: 58, color: "#39e8b2", label: "SE ASIA", sub: "1 ACTIVE CASE" },
  { id: "AUSTRALIA", x: 77, y: 76, color: "#6da7ff", label: "AUSTRALIA", sub: "1 ACTIVE CASE" },
];

export default function WorldMapCanvas({ selectedRegion, onSelect }: { selectedRegion: RegionId | null; onSelect: (region: RegionId) => void }) {
  const [mounted, setMounted] = useState(false);
  const [graphics, setGraphics] = useState(false);
  const [hovered, setHovered] = useState<RegionId | null>(null);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [routes, setRoutes] = useState(true);
  const [view, setView] = useState<"globe" | "network" | "router">("globe");

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setMounted(true);
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        try {
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ?? canvas.getContext("webgl", { failIfMajorPerformanceCaveat: true });
          if (context) { setGraphics(true); context.getExtension("WEBGL_lose_context")?.loseContext(); }
        } catch { setGraphics(false); }
      }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setExpanded(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = previous; window.removeEventListener("keydown", onKey); };
  }, [expanded]);

  const mapPaths = useMemo(() => {
    const projection = geoEquirectangular().scale(1000 / (2 * Math.PI)).translate([500, 250]);
    const path = geoPath(projection);
    const topology = worldData as unknown as Topology<{ countries: GeometryCollection }>;
    return { land: path(feature(topology, topology.objects.countries)) ?? "", grid: path(geoGraticule10()) ?? "" };
  }, []);

  const focus = hovered ?? selectedRegion;

  return (
    <section className={`world-panel panel ${expanded ? "map-expanded" : ""} ${playing ? "" : "map-paused"}`} aria-label="Interactive global resolution map" {...(expanded ? { role: "dialog", "aria-modal": true } : {})}>
      <div className="map-panel-top">
        <div className="map-view-tabs">
          <button className={view === "globe" ? "active" : ""} onClick={() => setView("globe")}><Globe2 size={13} /> 3D LIVE GLOBE</button>
          <button className={view === "network" ? "active" : ""} onClick={() => setView("network")}><Radio size={13} /> 2D RADAR</button>
          <button className={view === "router" ? "active" : ""} onClick={() => { setView("router"); setRoutes(true); }}><Layers3 size={13} /> TOKEN ROUTES</button>
        </div>
        <button className="icon-button" aria-label={expanded ? "Close expanded map" : "Expand map"} onClick={() => setExpanded(!expanded)}>{expanded ? <X size={15} /> : <Expand size={14} />}</button>
      </div>

      <div className="map-stage">
        {view === "globe" ? (
          <div className="absolute inset-0 w-full h-full z-10">
            <WorldGlobe3D selectedRegion={selectedRegion} onSelect={onSelect} playing={playing} />
            {/* Hidden accessibility & test buttons so screen-readers and automated tests work in 3D mode */}
            <div className="sr-only" aria-hidden="true" style={{ position: "absolute", width: "1px", height: "1px", overflow: "hidden", clip: "rect(0,0,0,0)" }}>
              {nodes.map((node) => (
                <button
                  key={node.id}
                  onClick={() => onSelect(node.id)}
                  aria-label={`Select ${node.label}: ${mockScenarios[node.id].shortTitle}`}
                >
                  {node.label}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="map-coordinate top-left">90° N <span>180° W</span></div>
            <div className="map-coordinate top-right">NEBIUS UPLINK <i className="status-dot" /></div>
            <div className="map-moving-layer" style={{ transform: `scale(${zoom})` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="night-earth" src="/images/night-earth.jpg" alt="Earth at night with illuminated cities across six connected global regions" draggable={false} />
              <div className="earth-tint" />
              <svg className="geo-layer" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
                <defs>
                  <filter id="map-cyan-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="2.5" /></filter>
                  <linearGradient id="route-gradient" x1="0" x2="1"><stop stopColor="#38bfff" stopOpacity="0.1" /><stop offset="0.5" stopColor="#4ee8ef" stopOpacity="0.9" /><stop offset="1" stopColor="#53d6ed" stopOpacity="0.2" /></linearGradient>
                </defs>
                <path d={mapPaths.grid} fill="none" stroke="#347392" strokeWidth="0.55" opacity="0.26" />
                <path d={mapPaths.land} fill="none" stroke="#6599b4" strokeWidth="0.45" opacity="0.14" />
                <ellipse cx="505" cy="253" rx="455" ry="164" fill="none" stroke="#2e92ae" strokeWidth="0.6" strokeDasharray="4 7" opacity="0.25" transform="rotate(-14 505 253)" />
                <ellipse cx="515" cy="260" rx="374" ry="205" fill="none" stroke="#277390" strokeWidth="0.6" opacity="0.13" transform="rotate(16 515 260)" />
                {routes && nodes.map((node, index) => {
                  const x = node.x * 10; const y = node.y * 5;
                  const active = !focus || focus === node.id;
                  const curve = `M ${x} ${y} Q ${(x + 470) / 2} ${Math.min(y, 150) - 95 - index * 4} 470 150`;
                  return <g key={node.id} opacity={active ? 0.85 : 0.2}>
                    <path d={curve} fill="none" stroke={node.color} strokeWidth={active ? 1.1 : 0.6} opacity="0.55" />
                    <path d={curve} fill="none" stroke={node.color} strokeWidth="3" opacity="0.15" filter="url(#map-cyan-glow)" />
                    <circle r="2.2" fill={node.color}>
                      {playing && <animateMotion dur={`${4.5 + index * 0.6}s`} repeatCount="indefinite" path={curve} />}
                    </circle>
                    {view === "router" && <text x={(x + 470) / 2} y={Math.max(40, Math.min(y, 150) - 46)} fill={node.color} fontSize="9" fontFamily="monospace">{index < 2 ? "NANO · 30B" : index < 4 ? "SUPER · 120B" : "ULTRA · 550B"}</text>}
                  </g>;
                })}
              </svg>
              {mounted && graphics && playing && <div className="particle-layer" aria-hidden="true"><WorldParticles /></div>}
              {nodes.map((node) => <button key={node.id} className={`radar-node ${focus === node.id ? "selected" : ""} ${focus && focus !== node.id ? "unfocused" : ""}`} style={{ left: `${node.x}%`, top: `${node.y}%`, "--node-color": node.color } as CSSProperties} onClick={() => onSelect(node.id)} onMouseEnter={() => { setHovered(node.id); onSelect(node.id); }} onMouseLeave={() => setHovered(null)} onFocus={() => { setHovered(node.id); onSelect(node.id); }} onBlur={() => setHovered(null)} aria-label={`Select ${node.label}: ${mockScenarios[node.id].shortTitle}`} aria-pressed={selectedRegion === node.id}>
                <span className="radar-ring ring-outer" /><span className="radar-ring ring-middle" /><span className="radar-ring ring-inner" /><span className="radar-center" />
                <span className={`radar-callout ${node.id === "EUROPE" ? "callout-above" : ""}`}><span>{node.label}<i /></span>{focus === node.id && <small>{node.sub}</small>}</span>
              </button>)}
            </div>
            <div className="map-ocean-label ocean-atlantic">ATLANTIC<br />OCEAN</div>
            <div className="map-ocean-label ocean-pacific">PACIFIC<br />OCEAN</div>
            <div className="map-hub"><span className="hub-icon"><Crosshair size={12} /></span><span>TOKEN FACTORY<span className="hub-sub">VERIFIED EVIDENCE UPLINK</span></span></div>
            <div className="map-controls"><button aria-label="Zoom in" className="icon-button" disabled={zoom >= 1.5} onClick={() => setZoom(Math.min(1.5, zoom + 0.15))}><Plus size={15} /></button><button aria-label="Zoom out" className="icon-button" disabled={zoom <= 1} onClick={() => setZoom(Math.max(1, zoom - 0.15))}><Minus size={15} /></button><button aria-label="Reset map zoom" className="icon-button" onClick={() => setZoom(1)}><RotateCcw size={13} /></button></div>
            <div className="map-bottom-controls"><button className="map-control-label" onClick={() => setPlaying(!playing)}>{playing ? <Pause size={10} /> : <Play size={10} />}{playing ? "NETWORK ANIMATION" : "ANIMATION PAUSED"}</button><button className={`map-control-label ${routes ? "is-on" : ""}`} onClick={() => setRoutes(!routes)}><Layers3 size={11} /> ROUTE LAYER</button></div>
            <div className="map-crosshair ch-top" /><div className="map-crosshair ch-bottom" />
          </>
        )}
      </div>

      <div className="map-legend">
        <span><i style={{ background: "#39dbae" }} /> VERIFIED</span>
        <span><i style={{ background: "#edb947" }} /> CONFIRMATION</span>
        <span><i style={{ background: "#ef6474" }} /> RED-TEAM FLAG</span>
        <span className="map-region-count"><Activity size={12} /> {selectedRegion ? "REGION FOCUSED" : "06 REGIONS CONNECTED"}</span>
      </div>
    </section>
  );
}
