'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { BrainModel, Positioned } from '@/lib/brain/types';
import { layoutNodes, positionMap, STAGE } from '@/lib/brain/layout';

type Props = {
  model: BrainModel;
  live: boolean;
  query: string;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  focusId?: string | null; // attract mode pans/zooms here when set
};

export default function Graph({ model, live, query, selectedId, onSelect, focusId }: Props) {
  const positioned = useMemo(() => layoutNodes(model.nodes), [model.nodes]);
  const posMap = useMemo(() => positionMap(positioned), [positioned]);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const z = useRef(0.72), tx = useRef(0), ty = useRef(0);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const apply = () => {
    if (canvasRef.current) canvasRef.current.style.transform = `translate(${tx.current}px, ${ty.current}px) scale(${z.current})`;
  };

  // Fit on mount.
  useEffect(() => {
    const fit = () => {
      const el = stageRef.current; if (!el) return;
      const W = el.clientWidth, H = el.clientHeight;
      z.current = Math.min(W / STAGE.w, H / STAGE.h) * 0.96;
      tx.current = (W - STAGE.w * z.current) / 2;
      ty.current = (H - STAGE.h * z.current) / 2;
      apply();
    };
    fit();
    window.addEventListener('resize', fit);
    const stage = stageRef.current!;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = stage.getBoundingClientRect();
      const px = e.clientX - r.left, py = e.clientY - r.top;
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nz = Math.max(0.4, Math.min(2.4, z.current * f));
      const k = nz / z.current;
      tx.current = px - (px - tx.current) * k;
      ty.current = py - (py - ty.current) * k;
      z.current = nz; apply();
    };
    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => { window.removeEventListener('resize', fit); stage.removeEventListener('wheel', onWheel); };
  }, []);

  // Attract focus: ease the view toward a node.
  useEffect(() => {
    if (!focusId) return;
    const p = posMap[focusId]; const el = stageRef.current; if (!p || !el) return;
    const W = el.clientWidth, H = el.clientHeight, nz = 1.5;
    let raf = 0; const tz0 = z.current, tx0 = tx.current, ty0 = ty.current;
    const tzT = nz, txT = W / 2 - p.x * nz, tyT = H / 2 - p.y * nz;
    let t0: number | null = null;
    const tick = (now: number) => {
      if (t0 === null) t0 = now;
      const k = Math.min(1, (now - t0) / 700); const e = 1 - Math.pow(1 - k, 3);
      z.current = tz0 + (tzT - tz0) * e; tx.current = tx0 + (txT - tx0) * e; ty.current = ty0 + (tyT - ty0) * e;
      apply(); if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [focusId, posMap]);

  const onPointerDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    tx.current += e.clientX - drag.current.x; ty.current += e.clientY - drag.current.y;
    drag.current = { x: e.clientX, y: e.clientY }; apply();
  };
  const onPointerUp = () => { drag.current = null; };

  const q = query.trim().toLowerCase();
  const matches = (n: Positioned) => q.length > 0 && n.label.toLowerCase().includes(q);

  // Neighbour set for hover/selection highlight.
  const activeId = hover ?? selectedId;
  const neighbours = useMemo(() => {
    if (!activeId) return null;
    const set = new Set<string>([activeId]);
    for (const e of model.edges) { if (e.source === activeId) set.add(e.target); if (e.target === activeId) set.add(e.source); }
    return set;
  }, [activeId, model.edges]);

  // Sale pulses: pick random squad→agent edges on a cadence while `live`.
  const [pulseKey, setPulseKey] = useState(0);
  const [pulseEdge, setPulseEdge] = useState<{ s: string; t: string } | null>(null);
  useEffect(() => {
    if (!live) return;
    let timer: ReturnType<typeof setTimeout>;
    const squadEdges = model.edges.filter((e) => e.kind === 'squad');
    const fire = () => {
      const e = squadEdges[Math.floor(Math.random() * squadEdges.length)];
      setPulseEdge({ s: e.source, t: e.target }); setPulseKey((k) => k + 1);
      timer = setTimeout(fire, 1400 + Math.random() * 1800);
    };
    timer = setTimeout(fire, 800);
    return () => clearTimeout(timer);
  }, [live, model.edges]);

  // Spotlight is derived straight from focusId (set only during attract mode) —
  // no state/effect, so it stays lint-clean and recording-deterministic.
  const spotlightId = focusId ?? null;

  return (
    <div
      ref={stageRef}
      onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', cursor: 'grab', touchAction: 'none', userSelect: 'none', background: 'radial-gradient(130% 120% at 50% 42%, #ffffff 0%, #eef0f3 75%)' }}
    >
      <div ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: STAGE.w, height: STAGE.h, transformOrigin: '0 0', willChange: 'transform' }}>
        <svg width={STAGE.w} height={STAGE.h} style={{ position: 'absolute', inset: 0 }}>
          {/* edges */}
          {model.edges.map((e, i) => {
            const a = posMap[e.source], b = posMap[e.target]; if (!a || !b) return null;
            const dim = neighbours && !(neighbours.has(e.source) && neighbours.has(e.target));
            const edgeOp = spotlightId !== null
              ? (e.source === spotlightId || e.target === spotlightId ? 0.6 : 0.18)
              : (dim ? 0.12 : 0.5);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9ccd1" strokeWidth={e.kind === 'hub' ? 1.6 : 1} opacity={edgeOp} style={{ transition: 'opacity 320ms ease' }} />;
          })}
          {/* sale pulse */}
          {live && pulseEdge && posMap[pulseEdge.s] && posMap[pulseEdge.t] && (
            <line key={pulseKey} x1={posMap[pulseEdge.s].x} y1={posMap[pulseEdge.s].y} x2={posMap[pulseEdge.t].x} y2={posMap[pulseEdge.t].y}
              stroke="#16A46C" strokeWidth={4} strokeLinecap="round" strokeDasharray="22 600" className="brain-pulse" style={{ filter: 'drop-shadow(0 0 5px rgba(22,164,108,0.7))' }} />
          )}
          {/* nodes */}
          {positioned.map((n) => {
            const dim = neighbours ? !neighbours.has(n.id) : false;
            const hl = matches(n);
            const op = spotlightId !== null ? (n.id === spotlightId ? 1 : 0.4) : (dim && !hl ? 0.18 : 1);
            const sel = n.id === selectedId;
            if (n.type === 'core') {
              return (
                <g key={n.id} opacity={op} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer', transition: 'opacity 320ms ease' }}>
                  <rect x={n.x - 34} y={n.y - 34} width={68} height={68} rx={16} fill="#111418" />
                  <text x={n.x} y={n.y + 10} textAnchor="middle" fontSize={32} fontWeight={800} fill="#fff">L</text>
                </g>
              );
            }
            if (n.type === 'hub') {
              return (
                <g key={n.id} opacity={op} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer', transition: 'opacity 320ms ease' }}>
                  <circle cx={n.x} cy={n.y} r={24} fill={n.color} stroke={sel ? '#111418' : 'none'} strokeWidth={3} />
                  <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">{n.label[0]}</text>
                  <text x={n.x} y={n.y + 42} textAnchor="middle" fontSize={13} fontWeight={700} fill="#374151">{n.label}</text>
                </g>
              );
            }
            if (n.type === 'lead') return <circle key={n.id} cx={n.x} cy={n.y} r={5} fill={n.color} opacity={op} style={{ transition: 'opacity 320ms ease' }} />;
            if (n.type === 'tool' || n.type === 'offer') {
              return <rect key={n.id} x={n.x - 9} y={n.y - 9} width={18} height={18} rx={4} fill={n.color} opacity={op}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer', transition: 'opacity 320ms ease' }} />;
            }
            // agent monogram
            return (
              <g key={n.id} opacity={op} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer', transition: 'opacity 320ms ease' }}>
                <circle cx={n.x} cy={n.y} r={hl || sel ? 16 : 13} fill={n.color} stroke={sel ? '#111418' : (hl ? '#fff' : 'none')} strokeWidth={sel ? 3 : 2} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">{n.initials}</text>
              </g>
            );
          })}
          {/* attract focus ripple — keyed by focusId so it remounts and replays per agent */}
          {focusId && posMap[focusId] && (
            <circle key={`ripple-${focusId}`} cx={posMap[focusId].x} cy={posMap[focusId].y} r={14} fill="none" stroke={posMap[focusId].color} strokeWidth={3} className="brain-ripple" />
          )}
        </svg>
      </div>

      {/* hover tooltip */}
      {hover && posMap[hover] && (
        <Tooltip model={model} id={hover} />
      )}

      <style>{`
        @keyframes brain-pulse-k { from { stroke-dashoffset: 600; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
        .brain-pulse { animation: brain-pulse-k 0.9s ease-out forwards; }
        @keyframes brain-ripple-k { 0% { r: 14; opacity: 0.85; } 100% { r: 72; opacity: 0; } }
        .brain-ripple { animation: brain-ripple-k 0.85s ease-out forwards; }
      `}</style>
    </div>
  );
}

function Tooltip({ model, id }: { model: BrainModel; id: string }) {
  const agent = model.agents.find((a) => a.id === id);
  const label = agent ? `${agent.name} · ${agent.role}` : model.nodes.find((n) => n.id === id)?.label ?? '';
  const sub = agent ? `${agent.sales} sales · ${agent.calls} calls` : '';
  return (
    <div style={{ position: 'absolute', left: 16, bottom: 16, background: 'rgba(17,20,24,0.92)', color: '#fff', borderRadius: 10, padding: '10px 14px', pointerEvents: 'none', maxWidth: 320 }}>
      <div style={{ fontSize: 14, fontWeight: 700 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: '#9fb4d6', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
