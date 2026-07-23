# Hive Variants (6 New Ad Stages) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build six new ad recording stages under a new `/hive/*` route group (orbit, global, throttle, mission-control, assembly, switchboard) per the approved spec at `docs/superpowers/specs/2026-06-10-hive-variants-design.md`.

**Architecture:** Each stage is a self-contained `'use client'` Next.js page that reuses the shared engine in `lib/adStage.tsx` (fixed-stage scale-to-fit, recording chrome, simulated tally + feed, auto-playing funnel iframes). A new `HiveNav` (default-hidden) + `/hive` launcher index keep the group separate from the existing `/ad/*` pages, which must not change.

**Tech Stack:** Next.js 16 (app router, static export), React 19, inline styles + `<style>` keyframes (repo convention — no Tailwind classes in ad stages), TypeScript.

**Repo working copy:** `C:\Users\lucas\AppData\Local\Temp\ads-demos-6-6-2026` on branch `hive-variants`.

**Read these before any task** (the patterns every page copies):
- `app/ad/hive/page.tsx` — stage scaffold, SVG wires, pulse-on-event, core orb
- `app/live-wall/page.tsx` — real-outcome handling (`valueUsd` from postMessage)
- `lib/adStage.tsx` — every shared helper and the `C` design tokens
- The spec: `docs/superpowers/specs/2026-06-10-hive-variants-design.md`

**Conventions that apply to every task (from the spec):**
- No `setState` called synchronously in an effect body (timers/rAF/message callbacks are fine), no ref writes during render, no `any`. `npm run lint` must add **zero new errors** (5 pre-existing errors in old files are expected and out of scope).
- Stage scaffold is always: `position:fixed` letterboxed `<main>` → fixed-size stage `div` scaled by `useFitStage()`, plus `useRecordingChrome(LETTERBOX)`.
- Every stage must read correctly at any random moment ≥10s in (long-take recording).
- These pages have no unit tests (repo convention for ad stages); verification is lint + build + headless screenshots (Task 8).

---

## File structure

```
lib/adStage.tsx                      (Task 1, additive only: useRealTileOutcomes)
components/HiveNav.tsx               (Task 1) nav for the 6 variants, default-hidden
app/hive/layout.tsx                  (Task 1) wraps children with <HiveNav />
app/hive/page.tsx                    (Task 1) launcher index w/ aspect labels
app/hive/orbit/page.tsx              (Task 2) 1920×1080, 8 live + 42 orbiting minis
app/hive/global/page.tsx             (Task 3) 1920×1080, dotted world map + arcs
app/hive/throttle/page.tsx           (Task 4) 1920×1080, scripted 1→50 dial
app/hive/mission-control/page.tsx    (Task 5) 1920×1080, big board + desk rows
app/hive/assembly/page.tsx           (Task 6) 1920×1080, conveyor leads→customers
app/hive/switchboard/page.tsx        (Task 7) 1080×1920 vertical, lead rain
scripts/shoot-hive.mjs               (Task 8) screenshot sweep (not shipped to prod)
```

---

### Task 1: Shared plumbing — `useRealTileOutcomes`, `HiveNav`, layout, index

**Files:**
- Modify: `lib/adStage.tsx` (append one hook at end of file)
- Create: `components/HiveNav.tsx`
- Create: `app/hive/layout.tsx`
- Create: `app/hive/page.tsx`

- [ ] **Step 1: Append `useRealTileOutcomes` to `lib/adStage.tsx`**

Append at the end of the file (do not modify anything existing). Unlike the old `useTileOutcomes` (which substitutes `randomSalePrice()`), this keeps the funnel's real `valueUsd` so a badge never contradicts the tile's own screen — the spec's "badge honesty" rule:

```tsx
// ── Per-tile outcomes keeping the funnel's REAL sale value (postMessage). ──
// Used by the /hive/* stages: a badge on a tile must match what that tile's
// own screen shows (same rule as /live-wall). useTileOutcomes (above) instead
// substitutes randomSalePrice() and is kept as-is for the older /ad/* stages.
export function useRealTileOutcomes(): Record<number, Outcome | undefined> {
  const [outcomes, setOutcomes] = useState<Record<number, Outcome | undefined>>({});
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const data = event.data;
      if (!data || data.source !== 'kdr-demo') return;
      const leadId = Number(data.leadId);
      if (!Number.isInteger(leadId) || leadId < 0) return;
      const outcome: 'buy' | 'book' = data.outcome === 'book' ? 'book' : 'buy';
      const valueUsd = outcome === 'buy' ? Number(data.valueUsd) || PRICE_USD : 0;
      setOutcomes((prev) => ({ ...prev, [leadId]: { outcome, valueUsd } }));
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);
  return outcomes;
}
```

- [ ] **Step 2: Create `components/HiveNav.tsx`**

Copy the structure of `components/AdNav.tsx` with three deliberate differences: (1) `pinned` starts **false** so nothing is ever on camera by default, (2) the variant list is the six new routes, (3) jump keys are `1–6`. Complete file:

```tsx
'use client';

// Left-side switcher for the /hive/* recording stages. UNLIKE AdNav, this
// starts hidden: it only appears while the cursor is at the very left edge of
// the screen (or over the revealed menu), so it can never end up in a
// recording by accident. Keys: 1–6 jump to a variant, M pins/unpins.

import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { BASE_PATH } from '@/lib/basePath';

const REVEAL_PX = 24;

const VARIANTS = [
  { slug: 'orbit', key: '1', name: 'The Orbit · all 50' },
  { slug: 'global', key: '2', name: 'Global Takeover' },
  { slug: 'throttle', key: '3', name: 'The Throttle' },
  { slug: 'mission-control', key: '4', name: 'Mission Control' },
  { slug: 'assembly', key: '5', name: 'Assembly Line' },
  { slug: 'switchboard', key: '6', name: 'Switchboard · 9:16' },
];

export default function HiveNav() {
  const pathname = usePathname() || '';
  const [pinned, setPinned] = useState(false); // hidden by default — recording-safe
  const [hovering, setHovering] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const visible = pinned || hovering;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'm') { setPinned((v) => !v); setHovering(false); return; }
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= VARIANTS.length) {
        window.location.href = `${BASE_PATH}/hive/${VARIANTS[n - 1].slug}/`;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (pinned) return;
    const onMove = (e: PointerEvent) => {
      if (e.clientX <= REVEAL_PX) { setHovering(true); return; }
      const r = navRef.current?.getBoundingClientRect();
      const over = !!r && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      setHovering(over);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [pinned]);

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed', left: 18, top: '50%', width: 236,
        transform: visible ? 'translate(0, -50%)' : 'translate(calc(-100% - 18px), -50%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
        zIndex: 2147483000,
        background: 'rgba(15,23,42,0.94)',
        border: '1px solid rgba(148,163,184,0.18)',
        borderRadius: 16, boxShadow: '0 18px 48px rgba(0,0,0,0.45)',
        backdropFilter: 'blur(8px)', padding: 12,
        fontFamily: 'system-ui, -apple-system, sans-serif', color: '#e2e8f0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 10px 8px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: '#34D399' }} />
          <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#94a3b8' }}>
            Hive Stages
          </span>
        </span>
        <button
          type="button"
          onClick={() => { setPinned(false); setHovering(false); }}
          title="Hide menu (M) — reappears on left-edge hover"
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', color: '#64748b', fontSize: 12, fontWeight: 700, padding: '2px 4px' }}
        >
          Hide ‹
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {VARIANTS.map((v) => {
          const active = pathname.replace(/\/$/, '') === `/hive/${v.slug}`;
          return (
            <a
              key={v.slug}
              href={`${BASE_PATH}/hive/${v.slug}/`}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none',
                borderRadius: 10, padding: '9px 10px',
                background: active ? 'rgba(52,211,153,0.16)' : 'transparent',
                border: `1px solid ${active ? 'rgba(52,211,153,0.45)' : 'transparent'}`,
                color: active ? '#a7f3d0' : '#cbd5e1',
              }}
            >
              <span
                style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800,
                  background: active ? '#34D399' : 'rgba(148,163,184,0.18)',
                  color: active ? '#06281c' : '#e2e8f0',
                }}
              >
                {v.key}
              </span>
              <span style={{ fontSize: 14, fontWeight: 600 }}>{v.name}</span>
            </a>
          );
        })}
      </div>

      <a href={`${BASE_PATH}/hive/`} style={{ display: 'block', marginTop: 8, padding: '7px 10px', fontSize: 12, color: '#64748b', textDecoration: 'none' }}>
        ← All hive stages
      </a>
      <div style={{ padding: '2px 10px 4px', fontSize: 11, color: '#475569', fontFamily: 'ui-monospace, Menlo, monospace' }}>
        1–6 jump · M pin · edge-hover to reveal
      </div>
    </nav>
  );
}
```

- [ ] **Step 3: Create `app/hive/layout.tsx`**

```tsx
import type { ReactNode } from 'react';
import HiveNav from '@/components/HiveNav';

// Wraps every /hive/* route with the variant switcher. HiveNav starts hidden
// (left-edge hover to reveal), so by default nothing overlays the stage.
export default function HiveLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <HiveNav />
    </>
  );
}
```

- [ ] **Step 4: Create `app/hive/page.tsx`**

Same style as `app/ad/page.tsx`, with explicit per-variant aspect labels (only Switchboard is vertical):

```tsx
'use client';

// Launcher index for the /hive/* recording stages — the six variants spun off
// the winning "Hive" ad. Not an ad itself; a menu for opening each one.

import { useEffect } from 'react';
import { BASE_PATH } from '@/lib/basePath';

const VARIANTS = [
  { slug: 'orbit', name: '1 · The Orbit', aspect: '16:9 · record at 1920×1080', hook: 'All 50 agents in a slow orbit around the brain — 8 up close, live.' },
  { slug: 'global', name: '2 · Global Takeover', aspect: '16:9 · record at 1920×1080', hook: 'It’s 3am somewhere. Arcs fire from the brain to cities as sales land.' },
  { slug: 'throttle', name: '3 · The Throttle', aspect: '16:9 · record at 1920×1080', hook: 'A dial drags 1 → 50 agents and revenue/hr surges with it.' },
  { slug: 'mission-control', name: '4 · Mission Control', aspect: '16:9 · record at 1920×1080', hook: 'Ops room: brain on the big board, agent desks closing below.' },
  { slug: 'assembly', name: '5 · Assembly Line', aspect: '16:9 · record at 1920×1080', hook: 'Gray leads ride the belt into the brain; paying customers come out.' },
  { slug: 'switchboard', name: '6 · Switchboard', aspect: '9:16 · record at 1080×1920', hook: 'Leads rain into the orb; the conversations it’s holding scroll below.' },
];

export default function HiveIndex() {
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.background = '#0b1220';
  }, []);

  return (
    <main style={{ minHeight: '100vh', background: '#0b1220', color: '#e2e8f0', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '48px 24px', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#34D399' }}>Lucas AI · Hive Stages</div>
        <h1 style={{ fontSize: 30, fontWeight: 700, margin: '8px 0 4px' }}>Six spins on the winning Hive ad</h1>
        <p style={{ color: '#94a3b8', margin: '0 0 28px' }}>
          One brain, many AI salespeople — each stage frames it differently. Record at the viewport listed on each card.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {VARIANTS.map((v) => (
            <a
              key={v.slug}
              href={`${BASE_PATH}/hive/${v.slug}/`}
              style={{ display: 'block', textDecoration: 'none', color: 'inherit', background: '#111c30', border: '1px solid #1e2b45', borderRadius: 14, padding: '18px 20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{v.name}</div>
                <div style={{ color: '#34D399', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>{v.aspect}</div>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 15, marginTop: 4 }}>{v.hook}</div>
              <div style={{ color: '#475569', fontSize: 13, marginTop: 8, fontFamily: 'ui-monospace, Menlo, monospace' }}>/hive/{v.slug}/</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 5: Lint and commit**

Run: `npm run lint` — expect exactly the 5 pre-existing errors (in `app/ad/*` and `app/talk/*`), none in the new files.

```bash
git add lib/adStage.tsx components/HiveNav.tsx app/hive/layout.tsx app/hive/page.tsx
git commit -m "feat(hive): HiveNav (default-hidden), /hive index + layout, useRealTileOutcomes"
```

---

### Task 2: `/hive/orbit` — Hive at Scale

**Files:**
- Create: `app/hive/orbit/page.tsx`

Brain core center; **8 live tiles** on an inner circle (r=420, every 45°); **42 mini skeleton tiles** traveling a slow elliptical orbit via `offset-path` (180s/rev, distributed by negative `animation-delay`); radial SVG wires with a bright pulse to a random live tile on each feed event; random outer minis occasionally flash a `SOLD` chip.

- [ ] **Step 1: Create the page**

```tsx
'use client';

// HIVE VARIANT 1 · "The Orbit" — all 50 agents around the brain.
// 8 live funnel tiles on an inner ring; 42 mini skeleton agents drift along an
// outer elliptical orbit (offset-path). Pulses fire core→tile on every event.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  STAGE_W, STAGE_H, C,
  createLeads, buildFunnelSrc, makeAgentStats, money,
  useFitStage, useRecordingChrome, useLiveTally, useRealTileOutcomes, useCountUp,
  type Outcome,
} from '@/lib/adStage';
import { createSeededRandom as seeded } from '@/lib/demoAuto';

const BG = '#0f172a';
const CX = STAGE_W / 2;
const CY = STAGE_H / 2;
const CORE_R = 170;

// Inner ring: 8 live tiles, every 45°, radius from centre.
const LIVE = 8;
const RING_R = 420;
const TILE_W = 300;
const TILE_H = 210;
const TILE_LABEL_H = 36;

// Outer orbit: 42 minis on an ellipse (8 + 42 = 50 agents on screen).
const MINIS = 42;
const ORBIT_RX = 850;
const ORBIT_RY = 460;
const ORBIT_S = 180; // seconds per revolution

const STATS = makeAgentStats(LIVE, 6011);

const ringPos = (i: number) => {
  const a = (i / LIVE) * Math.PI * 2 - Math.PI / 2;
  return { x: CX + Math.cos(a) * RING_R, y: CY + Math.sin(a) * RING_R };
};

export default function OrbitAd() {
  const fit = useFitStage();
  useRecordingChrome(BG);
  const leads = useMemo(() => createLeads(LIVE), []);
  const outcomes = useRealTileOutcomes();
  const { tally, feed } = useLiveTally();
  const revenue = useCountUp(tally.revenue);

  // Inbound pulse to a random live tile on each new feed event.
  const [pulse, setPulse] = useState({ key: 0, idx: 0 });
  const lastKey = useRef<number | null>(null);
  useEffect(() => {
    const top = feed[0];
    if (!top || lastKey.current === top.key) return;
    lastKey.current = top.key;
    setPulse({ key: top.key + 1, idx: top.leadNo % LIVE });
  }, [feed]);

  // Random outer mini flashes a SOLD/BOOKED chip every ~3.5s.
  const [flash, setFlash] = useState({ key: 0, idx: 0, label: '' });
  useEffect(() => {
    const id = setInterval(() => {
      setFlash((f) => ({
        key: f.key + 1,
        idx: Math.floor(Math.random() * MINIS),
        label: Math.random() < 0.65 ? `SOLD $${Math.random() < 0.5 ? 17 : 97}` : 'BOOKED',
      }));
    }, 3500);
    return () => clearInterval(id);
  }, []);

  const miniSeeds = useMemo(() => {
    const rnd = seeded(7331);
    return Array.from({ length: MINIS }, () => 0.4 + rnd() * 0.6);
  }, []);

  return (
    <main style={{ position: 'fixed', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{
          width: STAGE_W, height: STAGE_H, flexShrink: 0,
          transform: `scale(${fit})`, transformOrigin: 'center center',
          position: 'relative', overflow: 'hidden',
          background: `radial-gradient(circle at 50% 50%, #1e293b 0%, ${BG} 100%)`,
          fontFamily: 'inherit',
        }}
      >
        <header style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, display: 'flex', alignItems: 'center', gap: 16, padding: '0 48px', zIndex: 40 }}>
          <span style={{ width: 16, height: 16, borderRadius: 999, background: C.green, boxShadow: '0 0 12px rgba(46,125,82,0.8)' }} className="pulse-glow" />
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#fff' }}>LUCAS AI · 50 AGENTS IN ORBIT</span>
        </header>

        {/* Wires + inbound pulse */}
        <svg width={STAGE_W} height={STAGE_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
          {Array.from({ length: LIVE }, (_, i) => {
            const p = ringPos(i);
            const a = Math.atan2(p.y - CY, p.x - CX);
            const sx = CX + Math.cos(a) * (CORE_R + 6);
            const sy = CY + Math.sin(a) * (CORE_R + 6);
            return (
              <g key={i}>
                <path d={`M ${sx} ${sy} L ${p.x} ${p.y}`} stroke="rgba(255,255,255,0.05)" strokeWidth={6} fill="none" />
                <path d={`M ${sx} ${sy} L ${p.x} ${p.y}`} stroke="rgba(46,125,82,0.35)" strokeWidth={2} fill="none" />
              </g>
            );
          })}
          {(() => {
            const p = ringPos(pulse.idx);
            const a = Math.atan2(p.y - CY, p.x - CX);
            const sx = CX + Math.cos(a) * (CORE_R + 6);
            const sy = CY + Math.sin(a) * (CORE_R + 6);
            return (
              <path key={pulse.key} d={`M ${sx} ${sy} L ${p.x} ${p.y}`} stroke="#4ade80" strokeWidth={12}
                fill="none" strokeLinecap="round" strokeDasharray="40 2000" className="orbit-inbound"
                style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.8))' }} />
            );
          })()}
        </svg>

        {/* Outer orbit of 42 minis */}
        {miniSeeds.map((s, i) => {
          const isFlash = flash.idx === i;
          return (
            <div
              key={i}
              style={{
                position: 'absolute', left: CX, top: CY, width: 120, height: 84, marginLeft: -60, marginTop: -42,
                offsetPath: `ellipse(${ORBIT_RX}px ${ORBIT_RY}px at 0px 0px)`, offsetRotate: '0deg',
                animation: `orbit-travel ${ORBIT_S}s linear infinite`,
                animationDelay: `${-(i / MINIS) * ORBIT_S}s`,
                zIndex: 5,
              }}
            >
              <div style={{ width: '100%', height: '100%', background: '#101b31', border: '1px solid #283455', borderRadius: 10, padding: 8, boxSizing: 'border-box', opacity: 0.92 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="pulse-glow" style={{ width: 6, height: 6, borderRadius: 999, background: C.green, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', whiteSpace: 'nowrap' }}>Lucas AI #{String(i + 9).padStart(2, '0')}</span>
                </div>
                {isFlash ? (
                  <div key={flash.key} style={{ marginTop: 10, textAlign: 'center', fontSize: 12, fontWeight: 800, color: '#fff', background: C.green, borderRadius: 6, padding: '4px 0', animation: 'orbit-pop 0.4s ease' }}>
                    {flash.label}
                  </div>
                ) : (
                  <>
                    <div style={{ marginTop: 8, width: `${55 + s * 30}%`, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.25)' }} />
                    <div style={{ marginTop: 6, width: `${35 + s * 40}%`, height: 6, borderRadius: 3, background: 'rgba(46,125,82,0.4)', marginLeft: 'auto' }} />
                    <div style={{ marginTop: 6, width: `${45 + s * 25}%`, height: 6, borderRadius: 3, background: 'rgba(148,163,184,0.25)' }} />
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Inner ring: 8 live tiles */}
        {leads.map((lead, i) => {
          const p = ringPos(i);
          const resolved = outcomes[lead.id];
          const isBuy = resolved?.outcome === 'buy';
          return (
            <article key={lead.id} style={{
                position: 'absolute', left: p.x - TILE_W / 2, top: p.y - TILE_H / 2, width: TILE_W, height: TILE_H,
                borderRadius: 14, overflow: 'hidden', zIndex: 20,
                border: isBuy ? `3px solid ${C.green}` : '2px solid #334155',
                background: '#0f172a', boxShadow: isBuy ? '0 0 28px rgba(46,125,82,0.5)' : '0 8px 16px rgba(0,0,0,0.3)',
                transition: 'all 0.3s ease',
              }}>
              <header style={{ height: TILE_LABEL_H, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: isBuy ? C.green : '#1e293b', color: '#fff', transition: 'background 0.3s ease' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Lucas AI #{String(i + 1).padStart(2, '0')}</span>
                <StatusPill resolved={resolved} />
              </header>
              <div style={{ width: '100%', height: TILE_H - TILE_LABEL_H, background: '#fff' }}>
                <iframe
                  title={`orbit-${i + 1}`}
                  src={buildFunnelSrc(lead, i, { count: LIVE, demoScale: 0.5, speed: 0.5 })}
                  allow="autoplay"
                  style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }}
                />
              </div>
            </article>
          );
        })}

        {/* Core */}
        <div key={`core-${pulse.key}`} style={{
            position: 'absolute', left: CX - CORE_R, top: CY - CORE_R,
            width: CORE_R * 2, height: CORE_R * 2, borderRadius: '50%', zIndex: 30,
            background: 'radial-gradient(circle at 30% 30%, #4ade80 0%, #166534 60%, #064e3b 100%)',
            boxShadow: '0 0 64px rgba(74,222,128,0.4), inset 0 4px 16px rgba(255,255,255,0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'orbit-bump 0.8s ease-out',
          }}
        >
          <div style={{ fontSize: 17, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Revenue Today</div>
          <div style={{ fontSize: 64, fontWeight: 700, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.3)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
            ${Math.round(revenue).toLocaleString()}
          </div>
          <div style={{ marginTop: 12, background: 'rgba(0,0,0,0.3)', padding: '7px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            50 agents · 1 mind
          </div>
        </div>

        {/* Per-live-agent stat chips along the bottom */}
        <footer style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 10, zIndex: 40 }}>
          {STATS.slice(0, 4).map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8, background: 'rgba(15,23,42,0.85)', border: '1px solid #334155', borderRadius: 10, padding: '8px 14px' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>#{String(i + 1).padStart(2, '0')}</span>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#fff' }}>{s.sales}<span style={{ fontSize: 11, color: '#94a3b8' }}> sales</span></span>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#4ade80' }}>{money(s.revenue)}</span>
            </div>
          ))}
        </footer>

        <style>{`
          @keyframes orbit-travel { from { offset-distance: 0%; } to { offset-distance: 100%; } }
          @keyframes orbit-inbound-k { from { stroke-dashoffset: 2000; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
          .orbit-inbound { animation: orbit-inbound-k 0.8s cubic-bezier(0.1, 0.9, 0.2, 1) forwards; }
          @keyframes orbit-bump { 0% { transform: scale(1); filter: brightness(1); } 15% { transform: scale(1.08); filter: brightness(1.3); } 100% { transform: scale(1); filter: brightness(1); } }
          @keyframes orbit-pop { 0% { opacity: 0; transform: scale(0.85); } 100% { opacity: 1; transform: scale(1); } }
        `}</style>
      </div>
    </main>
  );
}

function StatusPill({ resolved }: { resolved?: Outcome }) {
  if (resolved?.outcome === 'buy') return <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>SOLD ${resolved.valueUsd}</span>;
  if (resolved?.outcome === 'book') return <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>BOOKED</span>;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: '#94a3b8' }} className="pulse-glow" /> Selling…
    </span>
  );
}
```

- [ ] **Step 2: Visual smoke-check**

Run `npm run dev`, open `http://localhost:3000/hive/orbit`, verify: minis drift along the ellipse and stay upright (`offset-rotate: 0deg`), no mini overlaps the inner tiles for more than a moment, pulses fire core→tile, core counts up. Stop the dev server.

- [ ] **Step 3: Lint and commit**

Run: `npm run lint` — no new errors.

```bash
git add app/hive/orbit/page.tsx
git commit -m "feat(hive): /hive/orbit — all 50 agents orbiting the brain"
```

---

### Task 3: `/hive/global` — Global Takeover

**Files:**
- Create: `app/hive/global/page.tsx`

Dotted world map from a 48×24 ASCII landmask, brain core center, arcs core→city on each feed event (night cities weighted 2×), toast stack with real local times, 2 live tiles in the bottom corners.

- [ ] **Step 1: Create the page**

```tsx
'use client';

// HIVE VARIANT 2 · "Global Takeover" — it's 3am somewhere; the brain is closing
// there. Dotted world map, arc pulses core→city on each sale, toasts with the
// city's real current local time. Night-time cities are weighted 2×.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  STAGE_W, STAGE_H, C,
  createLeads, buildFunnelSrc, saleLabel,
  useFitStage, useRecordingChrome, useLiveTally, useRealTileOutcomes, useCountUp,
  type Outcome,
} from '@/lib/adStage';

const BG = '#0f172a';
const CX = STAGE_W / 2;
const CY = 470; // core sits slightly above centre; toasts + tiles live below
const CORE_R = 150;

// ── 48×24 landmask ('#' = land), equirectangular: lon -180..180 → col 0..47,
// lat 90..-90 → row 0..23. Coarse but reads as Earth at a glance. ──
const MASK = [
  '................................................',
  '................####............................',
  '......########..#####.......###################.',
  '.....##########.####.....######################.',
  '.....###########.......#.######################.',
  '......##########.......########################.',
  '.......#########.......#######################..',
  '........#######........######################...',
  '.........####.........###########.##########....',
  '..........###.........########....#########.....',
  '...........###........#########...##.#####......',
  '.............###......#########.....########....',
  '.............#####.....########.....#########...',
  '.............######.....#######.......#######...',
  '.............######.....######..................',
  '..............#####......#####...........#####..',
  '..............####.......####...........#######.',
  '..............####.......###............#######.',
  '..............###........................#####..',
  '..............##................................',
  '..............##................................',
  '..............#.................................',
  '................................................',
  '................................................',
];
const MAP_W = 1760, MAP_H = 880, MAP_X = (STAGE_W - MAP_W) / 2, MAP_Y = 90;
const DX = MAP_W / 48, DY = MAP_H / 24;
const lonLatToXY = (lon: number, lat: number) => ({
  x: MAP_X + ((lon + 180) / 360) * MAP_W,
  y: MAP_Y + ((90 - lat) / 180) * MAP_H,
});

type City = { name: string; lon: number; lat: number; utc: number };
const CITIES: City[] = [
  { name: 'Sydney', lon: 151.2, lat: -33.9, utc: 10 },
  { name: 'Tokyo', lon: 139.7, lat: 35.7, utc: 9 },
  { name: 'Singapore', lon: 103.8, lat: 1.35, utc: 8 },
  { name: 'Dubai', lon: 55.3, lat: 25.2, utc: 4 },
  { name: 'London', lon: -0.1, lat: 51.5, utc: 0 },
  { name: 'São Paulo', lon: -46.6, lat: -23.55, utc: -3 },
  { name: 'New York', lon: -74.0, lat: 40.7, utc: -5 },
  { name: 'Austin', lon: -97.7, lat: 30.3, utc: -6 },
  { name: 'Denver', lon: -105.0, lat: 39.7, utc: -7 },
  { name: 'Los Angeles', lon: -118.2, lat: 34.05, utc: -8 },
];

function cityLocal(c: City): { label: string; night: boolean } {
  const now = new Date();
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes() + c.utc * 60;
  const m = ((mins % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const label = `${h12}:${String(m % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`;
  return { label, night: h24 >= 22 || h24 < 7 };
}

// Weighted pick: cities currently in night-time count twice (sells the 24/7 story).
function pickCity(): City {
  const pool: City[] = [];
  for (const c of CITIES) {
    pool.push(c);
    if (cityLocal(c).night) pool.push(c);
  }
  return pool[Math.floor(Math.random() * pool.length)];
}

type Toast = { key: number; city: string; time: string; label: string };

export default function GlobalAd() {
  const fit = useFitStage();
  useRecordingChrome(BG);
  const leads = useMemo(() => createLeads(2), []);
  const outcomes = useRealTileOutcomes();
  const { tally, feed } = useLiveTally({ minMs: 4000, maxMs: 6500 });
  const revenue = useCountUp(tally.revenue);

  const [arc, setArc] = useState<{ key: number; city: City }>({ key: 0, city: CITIES[0] });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastKey = useRef<number | null>(null);
  useEffect(() => {
    const top = feed[0];
    if (!top || lastKey.current === top.key) return;
    lastKey.current = top.key;
    const city = pickCity();
    const { label: time } = cityLocal(city);
    setArc({ key: top.key + 1, city });
    setToasts((prev) => [
      { key: top.key, city: city.name, time, label: top.outcome === 'buy' ? saleLabel(top.valueUsd) : 'Call booked' },
      ...prev,
    ].slice(0, 3));
  }, [feed]);

  const arcPath = (c: City) => {
    const p = lonLatToXY(c.lon, c.lat);
    const mx = (CX + p.x) / 2;
    const my = Math.min(CY, p.y) - 160;
    return `M ${CX} ${CY} Q ${mx} ${my} ${p.x} ${p.y}`;
  };

  return (
    <main style={{ position: 'fixed', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{
          width: STAGE_W, height: STAGE_H, flexShrink: 0,
          transform: `scale(${fit})`, transformOrigin: 'center center',
          position: 'relative', overflow: 'hidden',
          background: `radial-gradient(circle at 50% 42%, #16243c 0%, ${BG} 75%)`,
          fontFamily: 'inherit',
        }}
      >
        <header style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 72, display: 'flex', alignItems: 'center', gap: 16, padding: '0 48px', zIndex: 40 }}>
          <span style={{ width: 16, height: 16, borderRadius: 999, background: C.green, boxShadow: '0 0 12px rgba(46,125,82,0.8)' }} className="pulse-glow" />
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: '#fff' }}>LUCAS AI · SELLING IN 10 TIME ZONES</span>
        </header>

        {/* Dot-matrix map + cities + arcs */}
        <svg width={STAGE_W} height={STAGE_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 5 }}>
          {MASK.flatMap((row, r) =>
            row.split('').map((ch, col) =>
              ch === '#' ? (
                <circle key={`${r}-${col}`} cx={MAP_X + col * DX + DX / 2} cy={MAP_Y + r * DY + DY / 2} r={5}
                  fill="rgba(74,222,128,0.13)" />
              ) : null,
            ),
          )}
          {CITIES.map((c) => {
            const p = lonLatToXY(c.lon, c.lat);
            const night = cityLocal(c).night;
            return (
              <g key={c.name}>
                <circle cx={p.x} cy={p.y} r={9} fill={night ? '#4ade80' : 'rgba(74,222,128,0.55)'}
                  style={night ? { filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.9))' } : undefined} />
                <text x={p.x} y={p.y - 16} textAnchor="middle" fill="#94a3b8" fontSize={15} fontWeight={700}>{c.name}</text>
              </g>
            );
          })}
          <path key={arc.key} d={arcPath(arc.city)} stroke="#4ade80" strokeWidth={5} fill="none"
            strokeLinecap="round" strokeDasharray="60 3000" className="glb-arc"
            style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.8))' }} />
        </svg>

        {/* Core */}
        <div key={`core-${arc.key}`} style={{
            position: 'absolute', left: CX - CORE_R, top: CY - CORE_R,
            width: CORE_R * 2, height: CORE_R * 2, borderRadius: '50%', zIndex: 30,
            background: 'radial-gradient(circle at 30% 30%, #4ade80 0%, #166534 60%, #064e3b 100%)',
            boxShadow: '0 0 64px rgba(74,222,128,0.4), inset 0 4px 16px rgba(255,255,255,0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'glb-bump 0.8s ease-out',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Revenue Today</div>
          <div style={{ fontSize: 56, fontWeight: 700, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,0.3)', marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>
            ${Math.round(revenue).toLocaleString()}
          </div>
          <div style={{ marginTop: 10, background: 'rgba(0,0,0,0.3)', padding: '6px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
            24/7 · every time zone
          </div>
        </div>

        {/* Toast stack */}
        <div style={{ position: 'absolute', top: 100, right: 48, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 40, width: 380 }}>
          {toasts.map((t) => (
            <div key={t.key} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(15,23,42,0.92)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: 12, padding: '12px 16px', animation: 'glb-toast 0.35s ease' }}>
              <span style={{ fontSize: 24 }}>{t.label === 'Call booked' ? '📅' : '💰'}</span>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: t.label === 'Call booked' ? '#fff' : '#4ade80' }}>
                  {t.label === 'Call booked' ? 'Call booked' : `Sale · ${t.label}`}
                </div>
                <div style={{ fontSize: 14, color: '#94a3b8', fontVariantNumeric: 'tabular-nums' }}>{t.time} · {t.city}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Two live proof tiles, bottom corners */}
        {leads.map((lead, i) => {
          const resolved = outcomes[lead.id];
          const isBuy = resolved?.outcome === 'buy';
          const left = i === 0 ? 48 : STAGE_W - 48 - 340;
          return (
            <article key={lead.id} style={{
                position: 'absolute', left, bottom: 40, width: 340, height: 420,
                borderRadius: 14, overflow: 'hidden', zIndex: 35,
                border: isBuy ? `3px solid ${C.green}` : '2px solid #334155',
                background: '#0f172a', boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              }}>
              <header style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 12px', background: isBuy ? C.green : '#1e293b', color: '#fff' }}>
                <span style={{ fontSize: 13, fontWeight: 700 }}>Live conversation #{i + 1}</span>
                <StatusPill resolved={resolved} />
              </header>
              <div style={{ width: '100%', height: 382, background: '#fff' }}>
                <iframe title={`global-${i}`} src={buildFunnelSrc(lead, i, { count: 2, demoScale: 0.55, speed: 0.5 })} allow="autoplay"
                  style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} />
              </div>
            </article>
          );
        })}

        <style>{`
          @keyframes glb-arc-k { from { stroke-dashoffset: 3000; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
          .glb-arc { animation: glb-arc-k 1.1s cubic-bezier(0.2, 0.8, 0.3, 1) forwards; }
          @keyframes glb-bump { 0% { transform: scale(1); filter: brightness(1); } 15% { transform: scale(1.07); filter: brightness(1.3); } 100% { transform: scale(1); filter: brightness(1); } }
          @keyframes glb-toast { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
        `}</style>
      </div>
    </main>
  );
}

function StatusPill({ resolved }: { resolved?: Outcome }) {
  if (resolved?.outcome === 'buy') return <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>SOLD ${resolved.valueUsd}</span>;
  if (resolved?.outcome === 'book') return <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>BOOKED</span>;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>
      <span style={{ width: 6, height: 6, borderRadius: 3, background: '#94a3b8' }} className="pulse-glow" /> Selling…
    </span>
  );
}
```

- [ ] **Step 2: Visual smoke-check**

`npm run dev` → `http://localhost:3000/hive/global`. Verify: the dot map reads as Earth, every city node sits on (or adjacent to) dots, arcs land on city nodes, toast local times are plausible (Sydney ≈ UTC+10), night cities glow. Stop the server.

- [ ] **Step 3: Lint and commit**

Run: `npm run lint` — no new errors.

```bash
git add app/hive/global/page.tsx
git commit -m "feat(hive): /hive/global — world-map takeover with night-weighted sale arcs"
```

---

### Task 4: `/hive/throttle` — The Throttle

**Files:**
- Create: `app/hive/throttle/page.tsx`

Scripted dial 1→5→15→50 on a rAF timeline (23.5s loop), 10×5 tile field where slots reveal as N passes them (first 6 are always-mounted live iframes, hidden until revealed — never remounted), and a local tally cadence whose interval shrinks as N grows.

- [ ] **Step 1: Create the page**

```tsx
'use client';

// HIVE VARIANT 3 · "The Throttle" — what if sales headcount was a setting?
// A scripted dial drags 1 → 5 → 15 → 50; the agent grid fills as it climbs and
// the revenue cadence accelerates with N. Loops every ~23.5s.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  STAGE_W, STAGE_H, C, R,
  createLeads, buildFunnelSrc, randomSalePrice,
  useFitStage, useRecordingChrome, useCountUp,
} from '@/lib/adStage';
import { createSeededRandom as seeded } from '@/lib/demoAuto';

const LETTERBOX = '#e5e7eb';

// ── Scripted timeline: [target N at end of segment, duration ms] ──
const SEGMENTS: Array<{ to: number; ms: number }> = [
  { to: 1, ms: 3000 },   // hold 1
  { to: 5, ms: 2000 },   // ramp → 5
  { to: 5, ms: 3000 },   // hold
  { to: 15, ms: 2000 },  // ramp → 15
  { to: 15, ms: 3000 },  // hold
  { to: 50, ms: 2500 },  // ramp → 50
  { to: 50, ms: 8000 },  // hold at full
];
const LOOP_MS = SEGMENTS.reduce((a, s) => a + s.ms, 0); // 23500
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function valueAt(tMs: number): number {
  let t = tMs % LOOP_MS;
  let from = 1;
  for (const seg of SEGMENTS) {
    if (t <= seg.ms) {
      if (seg.to === from) return from;
      return from + (seg.to - from) * easeInOut(t / seg.ms);
    }
    t -= seg.ms;
    from = seg.to;
  }
  return 50;
}

// ── Tile field: 10 × 5 grid ──
const COLS = 10, ROWS = 5, SLOTS = 50;
const TILE_W = 160, TILE_H = 128, GAP = 12;
const FIELD_W = COLS * TILE_W + (COLS - 1) * GAP;
const FIELD_X = (STAGE_W - FIELD_W) / 2;
const FIELD_Y = 110;
const LIVE = 6;

export default function ThrottleAd() {
  const fit = useFitStage();
  useRecordingChrome(LETTERBOX);
  const leads = useMemo(() => createLeads(LIVE), []);

  // Dial value driven by a rAF timeline (setState in rAF callback, not effect body).
  const [n, setN] = useState(1);
  const nRef = useRef(1);
  useEffect(() => {
    let raf = 0;
    let t0: number | null = null;
    const tick = (now: number) => {
      if (t0 === null) t0 = now;
      const v = Math.round(valueAt(now - t0));
      if (v !== nRef.current) { nRef.current = v; setN(v); }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Local tally cadence: interval shrinks as N grows → revenue visibly accelerates.
  const [tally, setTally] = useState({ revenue: 4200, perHour: 90 });
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const emit = () => {
      setTally((p) => ({ revenue: p.revenue + (Math.random() < 0.6 ? randomSalePrice() : 0), perHour: nRef.current * 90 }));
      const interval = Math.min(9000, Math.max(700, 9000 / nRef.current));
      timer = setTimeout(emit, interval * (0.75 + Math.random() * 0.5));
    };
    timer = setTimeout(emit, 1500);
    return () => clearTimeout(timer);
  }, []);
  const revenue = useCountUp(tally.revenue);
  const perHour = useCountUp(tally.perHour, 900);

  const fills = useMemo(() => {
    const rnd = seeded(8181);
    return Array.from({ length: SLOTS }, () => 0.4 + rnd() * 0.6);
  }, []);

  // Dial geometry
  const DIAL_W = 900, DIAL_X = (STAGE_W - DIAL_W) / 2, DIAL_Y = 905;
  const frac = (n - 1) / 49;
  const knobX = DIAL_X + frac * DIAL_W;

  return (
    <main style={{ position: 'fixed', inset: 0, background: LETTERBOX, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{
          width: STAGE_W, height: STAGE_H, flexShrink: 0,
          transform: `scale(${fit})`, transformOrigin: 'center center',
          position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(120% 90% at 50% 0%, #ffffff 0%, #F6F6F7 70%)',
          fontFamily: 'inherit',
        }}
      >
        <header style={{ position: 'absolute', top: 28, left: 0, right: 0, textAlign: 'center', zIndex: 40 }}>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: C.ink }}>
            What if sales headcount was a setting?
          </span>
        </header>

        {/* Tile field */}
        {Array.from({ length: SLOTS }, (_, i) => {
          const col = i % COLS, row = Math.floor(i / COLS);
          const revealed = i < n;
          const isLive = i < LIVE;
          return (
            <div key={i} style={{
                position: 'absolute', left: FIELD_X + col * (TILE_W + GAP), top: FIELD_Y + row * (TILE_H + GAP),
                width: TILE_W, height: TILE_H, borderRadius: 10, overflow: 'hidden',
                background: '#fff', border: `1px solid ${C.border}`, boxShadow: C.cardShadow,
                opacity: revealed ? 1 : 0, transform: revealed ? 'scale(1)' : 'scale(0.7)',
                transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
              <div style={{ height: 24, display: 'flex', alignItems: 'center', gap: 5, padding: '0 8px', background: C.subtle, borderBottom: `1px solid ${C.border}` }}>
                <span className="pulse-glow" style={{ width: 5, height: 5, borderRadius: 999, background: C.green, flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 700, color: C.muted, whiteSpace: 'nowrap' }}>#{String(i + 1).padStart(2, '0')}</span>
              </div>
              {isLive ? (
                // Always mounted (so playback never resets); revealed via the wrapper's opacity.
                <iframe title={`throttle-${i}`} src={buildFunnelSrc(leads[i], i, { count: LIVE, demoScale: 0.4, speed: 0.5 })} allow="autoplay"
                  style={{ width: '100%', height: TILE_H - 24, border: 'none', pointerEvents: 'none', display: 'block' }} />
              ) : (
                <div style={{ padding: 8 }}>
                  <div style={{ width: `${50 + fills[i] * 40}%`, height: 7, borderRadius: 4, background: '#eef0ee' }} />
                  <div style={{ marginTop: 6, width: `${30 + fills[i] * 35}%`, height: 7, borderRadius: 4, background: 'rgba(46,125,82,0.18)', marginLeft: 'auto' }} />
                  <div style={{ marginTop: 6, width: `${42 + fills[i] * 30}%`, height: 7, borderRadius: 4, background: '#eef0ee' }} />
                  <div style={{ marginTop: 10, width: '100%', height: 16, borderRadius: 6, background: 'rgba(46,125,82,0.12)' }} />
                </div>
              )}
            </div>
          );
        })}

        {/* Gauges */}
        <div style={{ position: 'absolute', left: 48, top: FIELD_Y + ROWS * (TILE_H + GAP) + 16, right: 48, display: 'flex', gap: 24, zIndex: 30 }}>
          <Gauge label="AI Agents Active" value={String(n)} />
          <Gauge label="Revenue / Hour" value={`$${Math.round(perHour).toLocaleString()}`} highlight />
          <Gauge label="Revenue Today" value={`$${Math.round(revenue).toLocaleString()}`} />
        </div>

        {/* Slider */}
        <div style={{ position: 'absolute', left: DIAL_X, top: DIAL_Y, width: DIAL_W, zIndex: 40 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: C.muted }}>AI Agents</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: C.muted, fontVariantNumeric: 'tabular-nums' }}>1 — 50</span>
          </div>
          <div style={{ position: 'relative', height: 18, borderRadius: 999, background: '#e2e2e6' }}>
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${frac * 100}%`, borderRadius: 999, background: C.ctaGradient }} />
            <div style={{ position: 'absolute', left: `${frac * 100}%`, top: '50%', transform: 'translate(-50%, -50%)', width: 44, height: 44, borderRadius: 999, background: '#fff', border: `4px solid ${C.green}`, boxShadow: '0 4px 14px rgba(0,0,0,0.2)' }} />
          </div>
        </div>
        <div style={{ position: 'absolute', left: knobX - 70, top: DIAL_Y + 4, transform: 'translateX(140px)', zIndex: 41, pointerEvents: 'none' }}>
          {/* fake cursor riding the knob */}
          <svg width="28" height="28" viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 2px 3px rgba(0,0,0,0.35))' }}>
            <path d="M5 3l14 8-6.5 1.5L16 19l-3 1.5-3.5-6.5L5 17V3z" fill="#111827" stroke="#fff" strokeWidth="1.4" />
          </svg>
        </div>
        <div key={n === 50 ? 'full' : 'not'} style={{ position: 'absolute', left: 0, right: 0, top: DIAL_Y + 56, textAlign: 'center', zIndex: 40 }}>
          <span style={{ fontSize: 64, fontWeight: 800, color: C.green, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{n}</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: C.muted }}> agents selling right now</span>
        </div>
      </div>
    </main>
  );
}

function Gauge({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ flex: 1, background: highlight ? C.green : '#fff', border: highlight ? 'none' : `1px solid ${C.border}`, borderRadius: R.lg, padding: '14px 22px', boxShadow: highlight ? '0 12px 24px rgba(46,125,82,0.3)' : C.cardShadow, color: highlight ? '#fff' : C.ink }}>
      <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, opacity: highlight ? 0.9 : 0.55 }}>{label}</div>
      <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}
```

Note on the cursor positioning: the cursor `div` is anchored at `knobX` and nudged right via `translateX(140px)` minus its `left: knobX - 70` offset — net effect: tip sits just right of the knob. If it looks off by a few px in the smoke-check, adjust the `-70`/`140` pair; exact pixel polish is allowed here.

- [ ] **Step 2: Visual smoke-check**

`npm run dev` → `/hive/throttle`. Verify over one full ~24s loop: dial holds at 1/5/15/50, tile field fills in step, the 6 live iframes keep playing across reveals AND across the loop reset (they must never remount — confirm playback does not restart when N snaps 50→1), revenue/hr gauge tracks `N × 90`. Stop the server.

- [ ] **Step 3: Lint and commit**

Run: `npm run lint` — no new errors.

```bash
git add app/hive/throttle/page.tsx
git commit -m "feat(hive): /hive/throttle — scripted 1→50 dial with accelerating revenue"
```

---

### Task 5: `/hive/mission-control` — Mission Control

**Files:**
- Create: `app/hive/mission-control/page.tsx`

Big board (top 45%): panel with the brain core, revenue, status strip. Bottom: back row (9 small desks, scaled 0.82) + front row (7 large desks); 5 desks run live funnels (front 1/3/5, back 2/6). On each feed event a desk flares green with a value chip and an SVG beam fires desk→board.

- [ ] **Step 1: Create the page**

```tsx
'use client';

// HIVE VARIANT 4 · "Mission Control" — dark ops room. The brain lives on the
// big board; rows of agent desks below run real funnels on their monitors. On
// every event a desk flares and a beam shoots up to the board.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  STAGE_W, STAGE_H, C,
  createLeads, buildFunnelSrc, makeAgentStats, saleLabel, money,
  useFitStage, useRecordingChrome, useLiveTally, useRealTileOutcomes, useCountUp,
} from '@/lib/adStage';

const BG = '#0b1220';

// ── Big board ──
const BOARD_X = 140, BOARD_Y = 48, BOARD_W = STAGE_W - 280, BOARD_H = 430;
const CORE_R = 110;
const CORE_CX = BOARD_X + 290, CORE_CY = BOARD_Y + BOARD_H / 2;

// ── Desks ──
// Back row: 9 desks, smaller. Front row: 7 desks, larger. Light perspective by
// scale + overlap. Live monitors: front indexes 1,3,5 / back indexes 2,6.
const FRONT = 7, BACK = 9;
const FW = 236, FH = 250, FGAP = 18;
const BW = 178, BH = 190, BGAP = 14;
const FRONT_W = FRONT * FW + (FRONT - 1) * FGAP;
const BACK_W = BACK * BW + (BACK - 1) * BGAP;
const FRONT_X = (STAGE_W - FRONT_W) / 2, FRONT_Y = 770;
const BACK_X = (STAGE_W - BACK_W) / 2, BACK_Y = 540;
const LIVE_FRONT = [1, 3, 5];
const LIVE_BACK = [2, 6];
const LIVE = LIVE_FRONT.length + LIVE_BACK.length; // 5

const STATS = makeAgentStats(FRONT, 4711);

type Desk = { x: number; y: number; w: number; h: number; row: 'front' | 'back'; liveIdx: number | null; label: string };

function buildDesks(): Desk[] {
  const desks: Desk[] = [];
  let live = 0;
  for (let i = 0; i < BACK; i++) {
    const isLive = LIVE_BACK.includes(i);
    desks.push({ x: BACK_X + i * (BW + BGAP), y: BACK_Y, w: BW, h: BH, row: 'back', liveIdx: isLive ? live++ : null, label: `AI Agent #${String(FRONT + i + 1).padStart(2, '0')}` });
  }
  for (let i = 0; i < FRONT; i++) {
    const isLive = LIVE_FRONT.includes(i);
    desks.push({ x: FRONT_X + i * (FW + FGAP), y: FRONT_Y, w: FW, h: FH, row: 'front', liveIdx: isLive ? live++ : null, label: `AI Agent #${String(i + 1).padStart(2, '0')}` });
  }
  return desks;
}

export default function MissionControlAd() {
  const fit = useFitStage();
  useRecordingChrome(BG);
  const desks = useMemo(buildDesks, []);
  const leads = useMemo(() => createLeads(LIVE), []);
  const outcomes = useRealTileOutcomes();
  const { tally, feed } = useLiveTally();
  const revenue = useCountUp(tally.revenue);

  // Beam + flare target on each feed event.
  const [beam, setBeam] = useState<{ key: number; deskIdx: number; label: string }>({ key: 0, deskIdx: 0, label: '' });
  const lastKey = useRef<number | null>(null);
  useEffect(() => {
    const top = feed[0];
    if (!top || lastKey.current === top.key) return;
    lastKey.current = top.key;
    setBeam({
      key: top.key + 1,
      deskIdx: top.leadNo % desks.length,
      label: top.outcome === 'buy' ? `+${saleLabel(top.valueUsd)}` : 'CALL BOOKED',
    });
  }, [feed, desks.length]);

  const beamDesk = desks[beam.deskIdx];

  return (
    <main style={{ position: 'fixed', inset: 0, background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{
          width: STAGE_W, height: STAGE_H, flexShrink: 0,
          transform: `scale(${fit})`, transformOrigin: 'center center',
          position: 'relative', overflow: 'hidden',
          background: `linear-gradient(180deg, #0e1729 0%, ${BG} 55%, #080d18 100%)`,
          fontFamily: 'inherit',
        }}
      >
        {/* Big board */}
        <section style={{ position: 'absolute', left: BOARD_X, top: BOARD_Y, width: BOARD_W, height: BOARD_H, background: '#0a1322', border: '2px solid #22314e', borderRadius: 18, boxShadow: '0 0 60px rgba(13,34,66,0.8), inset 0 0 80px rgba(20,40,75,0.35)', zIndex: 20, overflow: 'hidden' }}>
          <div key={`core-${beam.key}`} style={{
              position: 'absolute', left: CORE_CX - BOARD_X - CORE_R, top: CORE_CY - BOARD_Y - CORE_R,
              width: CORE_R * 2, height: CORE_R * 2, borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #4ade80 0%, #166534 60%, #064e3b 100%)',
              boxShadow: '0 0 48px rgba(74,222,128,0.45), inset 0 4px 12px rgba(255,255,255,0.4)',
              animation: 'mc-bump 0.8s ease-out',
            }} />
          <div style={{ position: 'absolute', left: 560, top: 90, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#7d8db0' }}>Revenue Generated Today</span>
            <span key={tally.revenue} style={{ fontSize: 96, fontWeight: 800, color: '#fff', lineHeight: 1, fontVariantNumeric: 'tabular-nums', textShadow: '0 0 24px rgba(74,222,128,0.35)' }}>
              ${Math.round(revenue).toLocaleString()}
            </span>
            <span style={{ marginTop: 10, fontSize: 19, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: '#4ade80' }}>
              50 agents · 10 time zones · 24/7
            </span>
          </div>
          <header style={{ position: 'absolute', top: 18, left: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 12, height: 12, borderRadius: 999, background: '#ef4444' }} className="pulse-glow" />
            <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', color: '#aab8d4' }}>Lucas AI · Mission Control</span>
          </header>
        </section>

        {/* Beam desk→board */}
        <svg width={STAGE_W} height={STAGE_H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25 }}>
          <path key={beam.key} d={`M ${beamDesk.x + beamDesk.w / 2} ${beamDesk.y + 10} L ${CORE_CX} ${BOARD_Y + BOARD_H - 8}`}
            stroke="#4ade80" strokeWidth={8} fill="none" strokeLinecap="round" strokeDasharray="36 2000"
            className="mc-beam" style={{ filter: 'drop-shadow(0 0 8px rgba(74,222,128,0.8))' }} />
        </svg>

        {/* Desks (back row first so front overlaps) */}
        {desks.map((d, idx) => {
          const isEvt = beam.deskIdx === idx;
          const lead = d.liveIdx !== null ? leads[d.liveIdx] : null;
          const resolved = lead ? outcomes[lead.id] : undefined;
          const front = d.row === 'front';
          return (
            <article key={idx} style={{
                position: 'absolute', left: d.x, top: d.y, width: d.w, height: d.h, zIndex: front ? 30 : 28,
                display: 'flex', flexDirection: 'column',
              }}>
              {/* monitor */}
              <div style={{
                  flex: 1, borderRadius: 10, overflow: 'hidden', background: '#0d1830',
                  border: isEvt ? '3px solid #4ade80' : '2px solid #25324f',
                  boxShadow: isEvt ? '0 0 28px rgba(74,222,128,0.55)' : '0 10px 22px rgba(0,0,0,0.5)',
                  transition: 'border 0.25s ease, box-shadow 0.25s ease', position: 'relative',
                }}>
                {lead ? (
                  <iframe title={`desk-${idx}`} src={buildFunnelSrc(lead, d.liveIdx ?? 0, { count: LIVE, demoScale: front ? 0.42 : 0.34, speed: 0.5 })} allow="autoplay"
                    style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none', display: 'block', background: '#fff' }} />
                ) : (
                  <div style={{ padding: 10 }}>
                    <div style={{ width: '70%', height: 6, borderRadius: 3, background: 'rgba(125,141,176,0.3)' }} />
                    <div style={{ marginTop: 6, width: '50%', height: 6, borderRadius: 3, background: 'rgba(74,222,128,0.3)', marginLeft: 'auto' }} />
                    <div style={{ marginTop: 6, width: '62%', height: 6, borderRadius: 3, background: 'rgba(125,141,176,0.3)' }} />
                    <span className="pulse-glow" style={{ position: 'absolute', bottom: 10, left: 10, width: 8, height: 8, borderRadius: 999, background: '#4ade80' }} />
                  </div>
                )}
                {isEvt && (
                  <div key={beam.key} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(6,40,28,0.45)' }}>
                    <span style={{ background: C.green, color: '#fff', fontSize: front ? 22 : 16, fontWeight: 900, padding: '6px 14px', borderRadius: 8, transform: 'rotate(-4deg)', animation: 'mc-pop 0.35s ease' }}>{beam.label}</span>
                  </div>
                )}
              </div>
              {/* name plate */}
              <div style={{ height: front ? 44 : 32, marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', background: '#101b31', border: '1px solid #22314e', borderRadius: 8 }}>
                <span style={{ fontSize: front ? 14 : 11, fontWeight: 700, color: '#c3cde4', whiteSpace: 'nowrap' }}>{d.label}</span>
                {front && (
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#4ade80', fontVariantNumeric: 'tabular-nums' }}>
                    {STATS[idx - BACK] ? `${STATS[idx - BACK].sales} sales · ${money(STATS[idx - BACK].revenue)}` : ''}
                  </span>
                )}
              </div>
            </article>
          );
        })}

        <style>{`
          @keyframes mc-beam-k { from { stroke-dashoffset: 2000; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
          .mc-beam { animation: mc-beam-k 0.9s cubic-bezier(0.15, 0.85, 0.25, 1) forwards; }
          @keyframes mc-bump { 0% { transform: scale(1); filter: brightness(1); } 15% { transform: scale(1.08); filter: brightness(1.35); } 100% { transform: scale(1); filter: brightness(1); } }
          @keyframes mc-pop { 0% { opacity: 0; transform: rotate(-4deg) scale(0.8); } 100% { opacity: 1; transform: rotate(-4deg) scale(1); } }
        `}</style>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Visual smoke-check**

`npm run dev` → `/hive/mission-control`. Verify: board reads as a wall screen, 5 desks show live funnels (3 front / 2 back), beams land on the board, desk flare chip matches the event type, front row overlaps back row cleanly. Stop the server.

- [ ] **Step 3: Lint and commit**

Run: `npm run lint` — no new errors.

```bash
git add app/hive/mission-control/page.tsx
git commit -m "feat(hive): /hive/mission-control — ops room with desk beams to the big board"
```

---

### Task 6: `/hive/assembly` — Assembly Line

**Files:**
- Create: `app/hive/assembly/page.tsx`

Light stage. Conveyor strip across the lower third (animated stripes); each feed event spawns a gray lead card entering left→core (3.2s) and, 3.4s later, a green value/`CALL BOOKED` card exiting core→right (3.2s) into a TODAY bin. 4 live tiles above.

- [ ] **Step 1: Create the page**

```tsx
'use client';

// HIVE VARIANT 5 · "Assembly Line" — leads in, customers out. Gray lead cards
// ride the belt into the brain; green value cards come out the other side and
// drop into the day's revenue bin. Live funnels above show the work.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  STAGE_W, STAGE_H, C, R,
  createLeads, buildFunnelSrc, saleLabel,
  useFitStage, useRecordingChrome, useLiveTally, useRealTileOutcomes, useCountUp,
  type Outcome,
} from '@/lib/adStage';

const LETTERBOX = '#e5e7eb';

const BELT_Y = 800, BELT_H = 88;
const CORE_R = 150;
const CORE_CX = STAGE_W / 2, CORE_CY = BELT_Y - 30;

// ── Live tiles above the line ──
const LIVE = 4;
const TILE_W = 330, TILE_H = 380, TILE_GAP = 36;
const TILES_W = LIVE * TILE_W + (LIVE - 1) * TILE_GAP;
const TILES_X = (STAGE_W - TILES_W) / 2, TILES_Y = 120;

// ── Belt cards ──
// Enter: from off-left to the core (3.2s). Exit: core to the bin (3.2s, starts 3.4s
// after the event so the core visibly "had it" for a beat).
type Card = { key: number; kind: 'in' | 'out'; label: string; buy: boolean };
const ENTER_MS = 3200, EXIT_DELAY_MS = 3400, EXIT_MS = 3200;
const NAMES = ['M. Torres', 'D. Reed', 'P. Shah', 'J. Cole', 'S. Kim', 'L. Ortiz', 'A. Brooks', 'N. Vance'];

export default function AssemblyAd() {
  const fit = useFitStage();
  useRecordingChrome(LETTERBOX);
  const leads = useMemo(() => createLeads(LIVE), []);
  const outcomes = useRealTileOutcomes();
  const { tally, feed } = useLiveTally({ minMs: 4500, maxMs: 7000 });
  const revenue = useCountUp(tally.revenue);

  const [cards, setCards] = useState<Card[]>([]);
  const lastKey = useRef<number | null>(null);
  useEffect(() => {
    const top = feed[0];
    if (!top || lastKey.current === top.key) return;
    lastKey.current = top.key;
    const name = NAMES[top.leadNo % NAMES.length];
    const buy = top.outcome === 'buy';
    const inCard: Card = { key: top.key * 2, kind: 'in', label: name, buy };
    setCards((prev) => [...prev.slice(-7), inCard]);
    const outTimer = setTimeout(() => {
      setCards((prev) => [...prev.slice(-7), { key: top.key * 2 + 1, kind: 'out', label: buy ? saleLabel(top.valueUsd) : 'CALL BOOKED', buy }]);
    }, EXIT_DELAY_MS);
    const pruneTimer = setTimeout(() => {
      setCards((prev) => prev.filter((c) => c.key !== top.key * 2 && c.key !== top.key * 2 + 1));
    }, EXIT_DELAY_MS + EXIT_MS + 400);
    return () => { clearTimeout(outTimer); clearTimeout(pruneTimer); };
  }, [feed]);

  return (
    <main style={{ position: 'fixed', inset: 0, background: LETTERBOX, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{
          width: STAGE_W, height: STAGE_H, flexShrink: 0,
          transform: `scale(${fit})`, transformOrigin: 'center center',
          position: 'relative', overflow: 'hidden',
          background: 'radial-gradient(120% 90% at 50% 0%, #ffffff 0%, #F6F6F7 70%)',
          fontFamily: 'inherit',
        }}
      >
        <header style={{ position: 'absolute', top: 30, left: 0, right: 0, display: 'flex', justifyContent: 'space-between', padding: '0 56px', zIndex: 40 }}>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: C.muted }}>Leads in</span>
          <span style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: C.ink }}>Lucas AI · The Line Never Stops</span>
          <span style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1.5, textTransform: 'uppercase', color: C.green }}>Customers out</span>
        </header>

        {/* Live tiles above the line */}
        {leads.map((lead, i) => {
          const resolved = outcomes[lead.id];
          const isBuy = resolved?.outcome === 'buy';
          return (
            <article key={lead.id} style={{
                position: 'absolute', left: TILES_X + i * (TILE_W + TILE_GAP), top: TILES_Y, width: TILE_W, height: TILE_H,
                borderRadius: R.card, overflow: 'hidden', zIndex: 20,
                border: isBuy ? `3px solid ${C.green}` : `1px solid ${C.border}`,
                background: '#fff', boxShadow: isBuy ? '0 0 28px rgba(46,125,82,0.35)' : C.cardShadow,
                transition: 'all 0.3s ease',
              }}>
              <header style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 14px', background: isBuy ? C.green : C.subtle, color: isBuy ? '#fff' : C.ink, borderBottom: `1px solid ${C.border}`, transition: 'background 0.3s ease' }}>
                <span style={{ fontSize: 14, fontWeight: 700 }}>Lucas AI #{String(i + 1).padStart(2, '0')}</span>
                <StatusPill resolved={resolved} />
              </header>
              <iframe title={`assembly-${i}`} src={buildFunnelSrc(lead, i, { count: LIVE, demoScale: 0.6, speed: 0.5 })} allow="autoplay"
                style={{ width: '100%', height: TILE_H - 40, border: 'none', pointerEvents: 'none', display: 'block' }} />
            </article>
          );
        })}

        {/* Belt */}
        <div className="belt" style={{ position: 'absolute', left: 0, right: 0, top: BELT_Y, height: BELT_H, zIndex: 10, borderTop: `2px solid ${C.border}`, borderBottom: `2px solid ${C.border}` }} />

        {/* Belt cards (enter under the core; exit from it) */}
        {cards.map((c) => (
          <div key={c.key} className={c.kind === 'in' ? 'card-in' : 'card-out'} style={{
              position: 'absolute', top: BELT_Y + 10, width: 150, height: 66, zIndex: 12,
              borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              background: c.kind === 'in' ? '#9ca3af' : c.buy ? C.green : C.slate,
              color: '#fff', boxShadow: '0 6px 14px rgba(0,0,0,0.18)',
            }}>
            <span style={{ fontSize: c.kind === 'in' ? 16 : 20, fontWeight: 800 }}>{c.label}</span>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, opacity: 0.85 }}>
              {c.kind === 'in' ? 'New lead' : c.buy ? 'Sale closed' : 'Qualified'}
            </span>
          </div>
        ))}

        {/* Core (sits ON the line) */}
        <div style={{
            position: 'absolute', left: CORE_CX - CORE_R, top: CORE_CY - CORE_R,
            width: CORE_R * 2, height: CORE_R * 2, borderRadius: '50%', zIndex: 30,
            background: 'radial-gradient(circle at 30% 30%, #4ade80 0%, #166534 60%, #064e3b 100%)',
            boxShadow: '0 0 54px rgba(74,222,128,0.4), inset 0 4px 14px rgba(255,255,255,0.4)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 800, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Lucas AI</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.75)' }}>working every lead</span>
        </div>

        {/* Revenue bin (right edge) */}
        <div style={{ position: 'absolute', right: 40, top: BELT_Y - 76, zIndex: 35, background: '#fff', border: `1px solid ${C.border}`, borderRadius: R.lg, boxShadow: C.cardShadow, padding: '16px 24px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.6, color: C.muted }}>Today</div>
          <div style={{ fontSize: 46, fontWeight: 800, color: C.green, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1 }}>
            ${Math.round(revenue).toLocaleString()}
          </div>
        </div>

        <style>{`
          .belt {
            background: repeating-linear-gradient(90deg, #ececef 0 26px, #e3e3e7 26px 52px);
            animation: belt-run 1.1s linear infinite;
          }
          @keyframes belt-run { from { background-position: 0 0; } to { background-position: 52px 0; } }
          .card-in { animation: card-in-k ${ENTER_MS}ms linear forwards; }
          @keyframes card-in-k {
            from { left: -160px; opacity: 1; }
            92% { opacity: 1; }
            to { left: ${CORE_CX - 75}px; opacity: 0; }
          }
          .card-out { animation: card-out-k ${EXIT_MS}ms linear forwards; }
          @keyframes card-out-k {
            from { left: ${CORE_CX - 75}px; opacity: 0; }
            10% { opacity: 1; }
            92% { opacity: 1; }
            to { left: ${STAGE_W - 230}px; opacity: 0; }
          }
        `}</style>
      </div>
    </main>
  );
}

function StatusPill({ resolved }: { resolved?: Outcome }) {
  if (resolved?.outcome === 'buy') return <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>SOLD ${resolved.valueUsd}</span>;
  if (resolved?.outcome === 'book') return <span style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>BOOKED</span>;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: C.muted }}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: C.slate }} className="pulse-glow" /> Working…
    </span>
  );
}
```

Note: the effect that spawns belt cards returns a cleanup that clears its two timers — when a NEW feed event arrives before the old card finished, React runs the cleanup for the previous render's effect first. That cancels the previous event's pending exit card. With the tally cadence at 4.5–7s and `EXIT_DELAY_MS` 3.4s this collision is rare; if the smoke-check shows missing exit cards, move the timers out of the effect into a `useRef<Map>` keyed by event so they aren't cancelled by re-runs. Document whichever variant ships with a one-line comment.

- [ ] **Step 2: Visual smoke-check**

`npm run dev` → `/hive/assembly`. Watch ≥3 events end-to-end: gray card rides in and fades under the core, green card emerges ~3.4s later and rides off to the bin, bin total climbs, belt stripes move continuously. Stop the server.

- [ ] **Step 3: Lint and commit**

Run: `npm run lint` — no new errors.

```bash
git add app/hive/assembly/page.tsx
git commit -m "feat(hive): /hive/assembly — conveyor of leads in, customers out"
```

---

### Task 7: `/hive/switchboard` — Switchboard (vertical 9:16)

**Files:**
- Create: `app/hive/switchboard/page.tsx`

1080×1920 stage (`useFitStage(1080, 1920)`), warm-cream d4a palette (copy the token object from `app/talk/ask-the-floor/page.tsx`). Lead chips rain down 3 lanes into the orb (~1 per 1.2s); orb flares per tally event; KPI strip; two stacked live funnel tiles at the bottom.

- [ ] **Step 1: Create the page**

```tsx
'use client';

// HIVE VARIANT 6 · "Switchboard" (9:16 vertical, 1080×1920) — leads rain into
// the orb from the top; the conversations it's holding right now run live
// below. Warm d4a palette (matches /talk/ask-the-floor).

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createLeads, buildFunnelSrc,
  useFitStage, useRecordingChrome, useLiveTally, useRealTileOutcomes, useCountUp,
  type Outcome,
} from '@/lib/adStage';

const VW = 1080, VH = 1920;
const LETTERBOX = '#E9E3D8';

// d4a tokens (same direction as ask-the-floor)
const T = {
  bg: '#FFFDFB', surface: '#F6F3EC',
  ink: '#2E2B26', ink3: 'rgba(46,43,38,.70)', ink4: 'rgba(46,43,38,.50)',
  line: 'rgba(46,43,38,.10)',
  accent: '#16A46C', accentInk: '#106844', accentSoft: 'rgba(22,164,108,.10)', accentLine: 'rgba(22,164,108,.22)', mint: '#5BC998',
  shadowSm: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
};
const ORB_GRADIENT = `radial-gradient(circle at 35% 28%, #d6f5e6 0%, ${T.mint} 26%, ${T.accent} 64%, ${T.accentInk} 100%)`;

const ORB_R = 180;
const ORB_CY = 640;
const LANES = [200, 540, 880];
const POOL = ['Maria · IG ad', 'Devon · FB ad', 'Priya · YouTube', 'Jake · IG ad', 'Sofia · FB ad', 'Liam · TikTok', 'Ava · IG ad', 'Noah · FB ad'];
const DROP_MS = 2600;

type Drop = { key: number; lane: number; label: string };

export default function SwitchboardAd() {
  const fit = useFitStage(VW, VH);
  useRecordingChrome(LETTERBOX);
  const leads = useMemo(() => createLeads(2), []);
  const outcomes = useRealTileOutcomes();
  const { tally, feed } = useLiveTally({ basePurchases: 58, baseCalls: 24, minMs: 4000, maxMs: 6500 });
  const sales = useCountUp(tally.purchases);
  const calls = useCountUp(tally.calls);
  const revenue = useCountUp(tally.revenue);

  // Lead rain: spawn a chip every ~1.2s, prune when its fall completes.
  const [drops, setDrops] = useState<Drop[]>([]);
  const dropKey = useRef(0);
  useEffect(() => {
    const spawn = setInterval(() => {
      const key = dropKey.current++;
      setDrops((prev) => [...prev.slice(-5), { key, lane: key % LANES.length, label: POOL[key % POOL.length] }]);
    }, 1200);
    return () => clearInterval(spawn);
  }, []);
  useEffect(() => {
    if (drops.length === 0) return;
    const oldest = drops[0];
    const t = setTimeout(() => setDrops((prev) => prev.filter((d) => d.key !== oldest.key)), DROP_MS + 200);
    return () => clearTimeout(t);
  }, [drops]);

  // Orb flare per tally event.
  const [flare, setFlare] = useState(0);
  const lastKey = useRef<number | null>(null);
  useEffect(() => {
    const top = feed[0];
    if (!top || lastKey.current === top.key) return;
    lastKey.current = top.key;
    setFlare((f) => f + 1);
  }, [feed]);

  return (
    <main style={{ position: 'fixed', inset: 0, background: LETTERBOX, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      <div style={{
          width: VW, height: VH, flexShrink: 0,
          transform: `scale(${fit})`, transformOrigin: 'center center',
          position: 'relative', overflow: 'hidden',
          background: `radial-gradient(110% 50% at 50% 4%, ${T.surface} 0%, ${T.bg} 60%)`,
          color: T.ink, fontFamily: 'inherit',
        }}
      >
        {/* Top bar */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 48px', zIndex: 40 }}>
          <span style={{ fontSize: 31, fontWeight: 600, letterSpacing: '-0.01em' }}>Lucas&nbsp;AI</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 11, fontSize: 20, fontWeight: 600, color: T.accentInk, background: T.accentSoft, border: `1px solid ${T.accentLine}`, borderRadius: 100, padding: '10px 20px 10px 16px' }}>
            <span className="pulse-glow" style={{ width: 14, height: 14, borderRadius: 999, background: T.accent }} /> Live · 24/7
          </span>
        </div>

        {/* Lead rain */}
        {drops.map((d) => (
          <div key={d.key} className="sb-drop" style={{
              position: 'absolute', left: LANES[d.lane] - 110, top: -60, width: 220, zIndex: 20,
              background: T.bg, border: `1px solid ${T.line}`, borderRadius: 14, padding: '10px 16px',
              boxShadow: T.shadowSm, fontSize: 19, fontWeight: 600, color: T.ink3, textAlign: 'center', whiteSpace: 'nowrap',
            }}>
            {d.label}
          </div>
        ))}

        {/* Orb */}
        <div key={`orb-${flare}`} style={{
            position: 'absolute', left: VW / 2 - ORB_R, top: ORB_CY - ORB_R, width: ORB_R * 2, height: ORB_R * 2,
            borderRadius: '50%', zIndex: 30, background: ORB_GRADIENT,
            boxShadow: '0 24px 60px rgba(22,164,108,0.22), inset 0 10px 34px rgba(255,255,255,0.5)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            animation: 'sb-bump 0.8s ease-out',
          }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: 'rgba(255,255,255,0.92)', textTransform: 'uppercase', letterSpacing: 1.2 }}>Revenue today</span>
          <span style={{ fontSize: 62, fontWeight: 700, color: '#fff', fontVariantNumeric: 'tabular-nums', textShadow: '0 4px 12px rgba(0,0,0,0.2)' }}>
            ${Math.round(revenue).toLocaleString()}
          </span>
        </div>
        <div style={{ position: 'absolute', top: ORB_CY + ORB_R + 26, left: 0, right: 0, textAlign: 'center', zIndex: 30, fontSize: 26, fontWeight: 600, color: T.ink3 }}>
          50 conversations · one mind
        </div>

        {/* KPI strip */}
        <div style={{ position: 'absolute', top: 950, left: 48, right: 48, display: 'flex', gap: 24, zIndex: 30 }}>
          <Kpi label="Sales today" value={Math.round(sales).toLocaleString()} />
          <Kpi label="Calls booked" value={Math.round(calls).toLocaleString()} accent />
        </div>

        {/* Two live conversations */}
        {leads.map((lead, i) => {
          const resolved = outcomes[lead.id];
          const isBuy = resolved?.outcome === 'buy';
          return (
            <article key={lead.id} style={{
                position: 'absolute', left: 48, right: 48, top: 1170 + i * 360, height: 330,
                borderRadius: 18, overflow: 'hidden', zIndex: 30,
                border: isBuy ? `3px solid ${T.accent}` : `1px solid ${T.line}`,
                background: T.bg, boxShadow: T.shadowSm,
              }}>
              <header style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 18px', background: isBuy ? T.accent : T.surface, color: isBuy ? '#fff' : T.ink, borderBottom: `1px solid ${T.line}` }}>
                <span style={{ fontSize: 18, fontWeight: 700 }}>Conversation #{String(i + 1).padStart(2, '0')}</span>
                <StatusPill resolved={resolved} light={!isBuy} />
              </header>
              <iframe title={`switchboard-${i}`} src={buildFunnelSrc(lead, i, { count: 2, demoScale: 0.62, speed: 0.5 })} allow="autoplay"
                style={{ width: '100%', height: 282, border: 'none', pointerEvents: 'none', display: 'block', background: '#fff' }} />
            </article>
          );
        })}

        <style>{`
          @keyframes sb-drop-k {
            from { transform: translateY(0) scale(1); opacity: 0; }
            8% { opacity: 1; }
            78% { opacity: 1; }
            to { transform: translateY(${ORB_CY - 40}px) scale(0.5); opacity: 0; }
          }
          .sb-drop { animation: sb-drop-k ${DROP_MS}ms cubic-bezier(0.45, 0.05, 0.55, 0.95) forwards; }
          @keyframes sb-bump { 0% { transform: scale(1); filter: brightness(1); } 15% { transform: scale(1.06); filter: brightness(1.18); } 100% { transform: scale(1); filter: brightness(1); } }
        `}</style>
      </div>
    </main>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ flex: 1, background: accent ? T.surface : T.bg, border: `1px solid ${accent ? T.accentLine : T.line}`, borderRadius: 16, padding: '20px 28px', boxShadow: T.shadowSm }}>
      <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: accent ? T.accentInk : T.ink3 }}>{label}</div>
      <div style={{ fontSize: 72, fontWeight: 700, color: accent ? T.accentInk : T.ink, lineHeight: 1.05, marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function StatusPill({ resolved, light }: { resolved?: Outcome; light?: boolean }) {
  if (resolved?.outcome === 'buy') return <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase' }}>SOLD ${resolved.valueUsd}</span>;
  if (resolved?.outcome === 'book') return <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: light ? T.accentInk : '#fff' }}>BOOKED</span>;
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: T.ink4 }}>
      <span className="pulse-glow" style={{ width: 7, height: 7, borderRadius: 4, background: T.accent }} /> Working…
    </span>
  );
}
```

- [ ] **Step 2: Visual smoke-check**

`npm run dev` → `/hive/switchboard` with the browser window sized tall (or DevTools responsive 1080×1920). Verify: chips fall lane-by-lane and shrink into the orb, orb flares on tally events, two funnels run at the bottom, nothing overlaps the KPI strip. Stop the server.

- [ ] **Step 3: Lint and commit**

Run: `npm run lint` — no new errors.

```bash
git add app/hive/switchboard/page.tsx
git commit -m "feat(hive): /hive/switchboard — vertical lead-rain stage"
```

---

### Task 8: Full verification — build, tests, lint, screenshot sweep

**Files:**
- Create: `scripts/shoot-hive.mjs`

- [ ] **Step 1: Run the full gate**

```bash
npm run build   # must list /hive + all 6 /hive/* routes as static
npm test        # 39 tests, all pass (no funnel code was touched)
npm run lint    # exactly the 5 pre-existing errors, none in app/hive/* or components/HiveNav.tsx
```

- [ ] **Step 2: Create `scripts/shoot-hive.mjs`**

Playwright import path below matches the machine's global install (`expect-cli`'s bundled Playwright); it is a dev-only script and is fine to commit:

```js
// Screenshot sweep of the /hive/* stages for review. Run with the dev server up:
//   npm run dev   (separate terminal)
//   node scripts/shoot-hive.mjs
import { chromium } from 'file:///C:/Users/lucas/AppData/Roaming/npm/node_modules/expect-cli/node_modules/playwright/index.mjs';

const OUT = 'C:/tmp/hive-review';
const BASE = 'http://localhost:3000';
const shots = [
  { name: 'hive-index', url: '/hive', w: 1280, h: 800, wait: 2000 },
  { name: 'orbit', url: '/hive/orbit', w: 1920, h: 1080, wait: 14000 },
  { name: 'global', url: '/hive/global', w: 1920, h: 1080, wait: 14000 },
  { name: 'throttle-early', url: '/hive/throttle', w: 1920, h: 1080, wait: 4000 },
  { name: 'mission-control', url: '/hive/mission-control', w: 1920, h: 1080, wait: 14000 },
  { name: 'assembly', url: '/hive/assembly', w: 1920, h: 1080, wait: 14000 },
  { name: 'switchboard', url: '/hive/switchboard', w: 1080, h: 1920, wait: 14000 },
];

const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
for (const s of shots) {
  const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto(BASE + s.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(s.wait);
  await page.screenshot({ path: `${OUT}/${s.name}.png` });
  console.log(`OK ${s.name}${errors.length ? ` — ERRORS: ${[...new Set(errors)].slice(0, 3).join(' | ').slice(0, 400)}` : ''}`);
  // Throttle gets a second shot ≥10s later to prove the dial moved and tiles grew.
  if (s.name === 'throttle-early') {
    await page.waitForTimeout(11000);
    await page.screenshot({ path: `${OUT}/throttle-late.png` });
    console.log('OK throttle-late');
  }
  await page.close();
}
await browser.close();
console.log('done');
```

- [ ] **Step 3: Run the sweep and inspect**

```bash
mkdir -p C:/tmp/hive-review
# terminal 1: npm run dev
node scripts/shoot-hive.mjs
```

Expected: 8 PNGs, every line `OK` with no `ERRORS:`. Open each screenshot and verify against the spec's per-variant description (stage fills frame, animation mid-flight, correct aspect). `throttle-early.png` must show a near-empty field at N≈1–5; `throttle-late.png` must show a fuller field at N≈15–50.

- [ ] **Step 4: Commit and wrap up**

```bash
git add scripts/shoot-hive.mjs
git commit -m "chore(hive): screenshot sweep script for the six hive stages"
git log --oneline main..hive-variants   # 8 commits: spec + 7 implementation commits
```

Do not push or merge — Lucas reviews the screenshots first (deploying to main triggers the GitHub Pages workflow).
