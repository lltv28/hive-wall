# Sales Brain App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the **Sales Brain** — an interactive, light-themed org-graph demo app of the Lucas AI sales floor (concentric-ring node graph → drill-down agent profiles → sub-agent chat + AI daily report), with an auto-playing attract mode for hands-free recording, per `docs/superpowers/specs/2026-06-10-sales-brain-design.md`.

**Architecture:** One client-rendered Next.js page at `/brain` driven by React view-state (graph | entity | chat) — no per-entity routes, so it static-exports and the attract mode can choreograph view changes without navigation. A seeded, deterministic data model (no backend). **No d3 dependency:** node positions are computed by analytic concentric-ring math (deterministic — identical every recording), pan/zoom reuses the repo's existing `app/ad/clone-army/page.tsx` wheel/drag pattern, and "alive" motion (drift, sale pulses) is CSS/rAF. The SVG sim writes nothing to React state per frame.

**Tech Stack:** Next.js 16 (app router, static export), React 19, TypeScript, inline styles + `<style>` keyframes, vitest for the pure data/layout units. Reuses `lib/adStage.tsx` (`makeAgentStats`, `buildFunnelSrc`, `money`). No new dependencies.

**Repo working copy:** `C:\Users\lucas\AppData\Local\Temp\ads-demos-6-6-2026` on branch `sales-brain`.

**Read before starting:** `lib/adStage.tsx` (helpers + the `createSeededRandom` in `lib/demoAuto.ts`), `app/ad/clone-army/page.tsx` (pan/zoom pattern to mirror), `app/hive/orbit/page.tsx` (radial-positioning + recording-chrome idioms), and the spec.

**Conventions (every task):** `'use client'` where browser APIs/hooks are used; inline styles + one `<style>` block per component; no Tailwind in this app's code; no `any`; no unused imports; **no `setState` called synchronously in an effect body** (use timers/rAF/event callbacks, or defer with a cleaned-up `setTimeout(...,0)`); the animation loop writes to refs/DOM, never React state per tick. `npm run lint` baseline is exactly **5 errors / 8 warnings** (all in pre-existing `app/ad/*`, `app/talk/*`, `lib/adStage.tsx`, `components/__tests__/*`) — your code adds **zero**. `npm test` must stay green.

---

## File structure

```
lib/brain/types.ts              shared types (GNode, GEdge, Positioned, Agent, Tool, Offer, Lead, Squad)
lib/brain/data.ts               seeded entity model → nodes[] + edges[] + selectors
lib/brain/data.test.ts          unit tests: counts, edge integrity, determinism
lib/brain/layout.ts             pure: nodes[] → positioned nodes[] (concentric rings)
lib/brain/layout.test.ts        unit tests: every node placed, radii per tier, determinism
app/brain/layout.tsx            recording-chrome + light page background wrapper
app/brain/page.tsx              app shell: view-state router + attract driver
components/brain/TopBar.tsx     brand bar: title, search box, Live toggle
components/brain/Graph.tsx      SVG graph: pan/zoom, hover-highlight, click→select, sale pulses
components/brain/EntityPanel.tsx detail panel: agent (tabs) / tool / offer
components/brain/LeftRail.tsx   entity-type browser with counts (Phase 2)
components/brain/ChatView.tsx   sub-agent rail + channels + AI daily report (Phase 2)
scripts/shoot-brain.mjs         screenshot sweep (Phase 2 / verification)
```

Phase 1 = Tasks 1–6 (filmable slice). Phase 2 = Tasks 7–11.

---

## PHASE 1 — Vertical slice

### Task 1: Types + seeded data model

**Files:**
- Create: `lib/brain/types.ts`
- Create: `lib/brain/data.ts`
- Create: `lib/brain/data.test.ts`

- [ ] **Step 1: Write `lib/brain/types.ts`**

```ts
// Shared types for the Sales Brain graph + entity model.

export type Squad = { id: string; name: string; color: string };

export type Agent = {
  id: string; name: string; initials: string; squadId: string; role: string;
  status: 'working' | 'idle'; currentTask: string;
  sales: number; calls: number; revenue: number;
  playbookId: string; toolIds: string[]; leadIds: string[]; subAgentIds: string[];
  permissions: { label: string; allowed: boolean }[];
};
export type SubAgent = { id: string; name: string; squadId: string | null };
export type Lead = {
  id: string; name: string; source: 'IG ad' | 'FB ad' | 'YouTube' | 'TikTok';
  stage: string; agentId: string; valueUsd: number; outcome: 'working' | 'buy' | 'book';
};
export type Tool = { id: string; name: string };
export type Offer = { id: string; name: string; priceUsd: number; steps: string[] };

export type NodeType = 'core' | 'hub' | 'agent' | 'lead' | 'tool' | 'offer';
// tier drives the ring radius in layout: 0 core, 1 hub, 2 lead, 3 tool/offer, 4 agent
export type GNode = {
  id: string; type: NodeType; tier: number; label: string;
  initials?: string; squadId?: string; color: string;
};
export type GEdge = { source: string; target: string; kind: 'hub' | 'squad' | 'access' | 'working' };
export type Positioned = GNode & { x: number; y: number; tierIndex: number; tierCount: number };

export type BrainModel = {
  squads: Squad[]; agents: Agent[]; subAgents: SubAgent[]; leads: Lead[];
  tools: Tool[]; offers: Offer[]; nodes: GNode[]; edges: GEdge[];
};
```

- [ ] **Step 2: Write the failing test `lib/brain/data.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildModel } from './data';

describe('buildModel', () => {
  it('builds the expected entity counts', () => {
    const m = buildModel();
    expect(m.squads).toHaveLength(6);
    expect(m.agents).toHaveLength(44);
    expect(m.subAgents).toHaveLength(8);
    expect(m.tools).toHaveLength(8);
    expect(m.offers).toHaveLength(5);
    expect(m.leads).toHaveLength(30);
  });

  it('puts exactly one core node and one hub per squad', () => {
    const m = buildModel();
    expect(m.nodes.filter((n) => n.type === 'core')).toHaveLength(1);
    expect(m.nodes.filter((n) => n.type === 'hub')).toHaveLength(6);
    expect(m.nodes.filter((n) => n.type === 'agent')).toHaveLength(44);
  });

  it('every edge references existing node ids', () => {
    const m = buildModel();
    const ids = new Set(m.nodes.map((n) => n.id));
    for (const e of m.edges) {
      expect(ids.has(e.source)).toBe(true);
      expect(ids.has(e.target)).toBe(true);
    }
  });

  it('every agent links to its squad hub', () => {
    const m = buildModel();
    for (const a of m.agents) {
      const hubEdge = m.edges.find((e) => e.kind === 'squad' && e.target === a.id);
      expect(hubEdge?.source).toBe(`hub:${a.squadId}`);
    }
  });

  it('is deterministic across calls', () => {
    expect(JSON.stringify(buildModel())).toEqual(JSON.stringify(buildModel()));
  });
});
```

- [ ] **Step 3: Run it — expect failure**

Run: `npm test -- lib/brain/data.test.ts`
Expected: FAIL (`buildModel` not found / module missing).

- [ ] **Step 4: Write `lib/brain/data.ts`**

```ts
// Seeded, deterministic Sales Brain model — the Lucas AI sales floor as an org
// graph. No backend; everything derives from a fixed seed so the app looks
// identical on every recording. Per-agent stats reuse makeAgentStats.
import { makeAgentStats } from '@/lib/adStage';
import { createSeededRandom } from '@/lib/demoAuto';
import type {
  Agent, BrainModel, GEdge, GNode, Lead, Offer, Squad, SubAgent, Tool,
} from './types';

export const SQUADS: Squad[] = [
  { id: 'acq', name: 'Acquisition', color: '#2563EB' },
  { id: 'qual', name: 'Qualifying', color: '#16A46C' },
  { id: 'close', name: 'Closing', color: '#D97706' },
  { id: 'book', name: 'Booking', color: '#7C3AED' },
  { id: 'follow', name: 'Follow-up', color: '#DB2777' },
  { id: 'react', name: 'Reactivation', color: '#0891B2' },
];

const FIRST = ['Brandon', 'Marcia', 'Andrew', 'Nina', 'Anika', 'Laura', 'Kwame', 'Jessica', 'Robert', 'Benjamin', 'Diego', 'Sofia', 'Tara', 'Hassan', 'Elena', 'Jacob', 'Sora', 'Liam', 'Ava', 'Noah', 'Maya', 'Devon', 'Priya', 'Jake', 'Ruth', 'Cole', 'Tess', 'Gabe', 'Mara', 'Evan', 'Vera', 'Leo', 'Rafa', 'Sana', 'Aria', 'Jonah', 'Mira', 'Caleb', 'Nadia', 'Kira', 'Drew', 'Paloma', 'Sage', 'Lena'];
const LAST = ['Liu', 'Chen', 'Kowalski', 'Patel', 'Gupta', 'Bennett', 'Asante', 'Alvarez', 'Okoye', 'Foster', 'Morales', 'Park', 'Nguyen', 'Vance', 'Cruz', 'Cole', 'Kim', 'Ortiz', 'Brooks', 'Vega', 'Reyes', 'Shah', 'Rao', 'Kerr', 'Webb', 'Mann', 'Frost', 'Dunn', 'Abel', 'Ware', 'Holt', 'Pike', 'Rossi', 'Dey', 'Nash', 'Tran', 'Bauer', 'Cano', 'Ali', 'Wood', 'Reed', 'Glass', 'Romero', 'Marsh'];
const ROLES = ['SDR', 'Closer', 'Setter', 'Account Exec', 'Retention Rep'];
const TASKS = ['Greeting a new lead', 'Asking qualifying questions', 'Presenting the offer', 'Handling an objection', 'Sending the checkout link', 'Booking a strategy call', 'Following up on a no-show'];

const SUB_AGENTS: SubAgent[] = [
  { id: 'sa:qualifier', name: 'Qualifier', squadId: 'qual' },
  { id: 'sa:objection', name: 'Objection-Handler', squadId: 'close' },
  { id: 'sa:closer', name: 'Closer', squadId: 'close' },
  { id: 'sa:booker', name: 'Booker', squadId: 'book' },
  { id: 'sa:followwriter', name: 'Follow-up Writer', squadId: 'follow' },
  { id: 'sa:scorer', name: 'Lead Scorer', squadId: 'acq' },
  { id: 'sa:transcript', name: 'Transcript Analyzer', squadId: null },
  { id: 'sa:offerpicker', name: 'Offer Picker', squadId: null },
];
const TOOLS: Tool[] = [
  { id: 'tool:hyros', name: 'Hyros' }, { id: 'tool:stripe', name: 'Stripe' },
  { id: 'tool:cal', name: 'Google Calendar' }, { id: 'tool:crm', name: 'CRM' },
  { id: 'tool:quiz', name: 'Quiz Funnel' }, { id: 'tool:slack', name: 'Slack' },
  { id: 'tool:gmail', name: 'Gmail' }, { id: 'tool:meta', name: 'Meta Ads' },
];
const OFFERS: Offer[] = [
  { id: 'offer:report', name: 'Low-Ticket Report', priceUsd: 27, steps: ['Quiz', 'Paywall', 'Checkout', 'Order bump'] },
  { id: 'offer:call', name: 'Strategy Call', priceUsd: 0, steps: ['Qualify', 'Book', 'Remind', 'Show'] },
  { id: 'offer:core', name: 'Core Program', priceUsd: 1497, steps: ['Pitch', 'Objections', 'Close'] },
  { id: 'offer:bump', name: 'Order Bump', priceUsd: 47, steps: ['Offer at checkout'] },
  { id: 'offer:upsell', name: 'Upsell', priceUsd: 297, steps: ['Post-purchase offer'] },
];
const SOURCES: Lead['source'][] = ['IG ad', 'FB ad', 'YouTube', 'TikTok'];

function initials(name: string): string {
  const p = name.split(' ');
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase();
}

export function buildModel(): BrainModel {
  const rnd = createSeededRandom(20260610);
  const stats = makeAgentStats(44, 6011);

  const agents: Agent[] = Array.from({ length: 44 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
    const squad = SQUADS[i % SQUADS.length];
    const toolIds = TOOLS.filter(() => rnd() < 0.4).map((t) => t.id).slice(0, 3);
    return {
      id: `agent:${i}`, name, initials: initials(name), squadId: squad.id,
      role: ROLES[i % ROLES.length], status: rnd() < 0.85 ? 'working' : 'idle',
      currentTask: TASKS[Math.floor(rnd() * TASKS.length)],
      sales: stats[i].sales, calls: stats[i].calls, revenue: stats[i].revenue,
      playbookId: OFFERS[i % OFFERS.length].id, toolIds,
      leadIds: [], subAgentIds: [SUB_AGENTS[i % SUB_AGENTS.length].id],
      permissions: [
        { label: 'Read lead conversations', allowed: true },
        { label: 'Charge cards via Stripe', allowed: squad.id === 'close' },
        { label: 'Book on the shared calendar', allowed: squad.id === 'book' || squad.id === 'qual' },
        { label: 'Export raw lead PII', allowed: false },
      ],
    };
  });

  const leads: Lead[] = Array.from({ length: 30 }, (_, i) => {
    const agent = agents[Math.floor(rnd() * agents.length)];
    const r = rnd();
    const outcome: Lead['outcome'] = r < 0.45 ? 'working' : r < 0.8 ? 'buy' : 'book';
    const lead: Lead = {
      id: `lead:${i}`, name: `${FIRST[(i * 7) % FIRST.length]} ${LAST[(i * 5) % LAST.length]}`,
      source: SOURCES[i % SOURCES.length], stage: TASKS[i % TASKS.length],
      agentId: agent.id, valueUsd: outcome === 'buy' ? (rnd() < 0.6 ? 27 : 297) : 0, outcome,
    };
    agent.leadIds.push(lead.id);
    return lead;
  });

  // ── Graph nodes ──
  const nodes: GNode[] = [];
  nodes.push({ id: 'core', type: 'core', tier: 0, label: 'Lucas AI', color: '#111418' });
  for (const s of SQUADS) nodes.push({ id: `hub:${s.id}`, type: 'hub', tier: 1, label: s.name, squadId: s.id, color: s.color });
  for (let i = 0; i < 30; i++) nodes.push({ id: `leaddot:${i}`, type: 'lead', tier: 2, label: leads[i]?.name ?? `Lead ${i}`, color: i % 2 ? '#e0b400' : '#c2c7cf' });
  TOOLS.forEach((t) => nodes.push({ id: `node:${t.id}`, type: 'tool', tier: 3, label: t.name, color: '#64748b' }));
  OFFERS.forEach((o, i) => nodes.push({ id: `node:${o.id}`, type: 'offer', tier: 3, label: o.name, color: SQUADS[i % SQUADS.length].color }));
  for (const a of agents) {
    const color = SQUADS.find((s) => s.id === a.squadId)!.color;
    nodes.push({ id: a.id, type: 'agent', tier: 4, label: a.name, initials: a.initials, squadId: a.squadId, color });
  }

  // ── Graph edges ──
  const edges: GEdge[] = [];
  for (const s of SQUADS) edges.push({ source: 'core', target: `hub:${s.id}`, kind: 'hub' });
  for (const a of agents) edges.push({ source: `hub:${a.squadId}`, target: a.id, kind: 'squad' });
  for (const a of agents) for (const t of a.toolIds) edges.push({ source: a.id, target: `node:${t}`, kind: 'access' });

  return { squads: SQUADS, agents, subAgents: SUB_AGENTS, leads, tools: TOOLS, offers: OFFERS, nodes, edges };
}

export const squadColor = (id: string | undefined) => SQUADS.find((s) => s.id === id)?.color ?? '#64748b';
export const squadName = (id: string | undefined) => SQUADS.find((s) => s.id === id)?.name ?? '';
```

- [ ] **Step 5: Run the test — expect PASS**

Run: `npm test -- lib/brain/data.test.ts`
Expected: PASS (5 tests). If counts mismatch, fix `data.ts` (not the test).

- [ ] **Step 6: Lint + commit**

Run: `npm run lint` → still exactly 5 errors / 8 warnings.
```bash
git add lib/brain/types.ts lib/brain/data.ts lib/brain/data.test.ts
git commit -m "feat(brain): seeded sales-floor entity model + graph nodes/edges"
```

---

### Task 2: Concentric-ring layout (pure)

**Files:**
- Create: `lib/brain/layout.ts`
- Create: `lib/brain/layout.test.ts`

- [ ] **Step 1: Write the failing test `lib/brain/layout.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { buildModel } from './data';
import { layoutNodes, STAGE, TIER_R } from './layout';

describe('layoutNodes', () => {
  const positioned = layoutNodes(buildModel().nodes);

  it('places every node', () => {
    expect(positioned).toHaveLength(buildModel().nodes.length);
    for (const n of positioned) {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    }
  });

  it('puts the core at stage centre', () => {
    const core = positioned.find((n) => n.type === 'core')!;
    expect(core.x).toBeCloseTo(STAGE.cx, 5);
    expect(core.y).toBeCloseTo(STAGE.cy, 5);
  });

  it('places each tier within ~30px of its ring radius', () => {
    for (const n of positioned) {
      if (n.type === 'core') continue;
      const r = Math.hypot(n.x - STAGE.cx, n.y - STAGE.cy);
      expect(Math.abs(r - TIER_R[n.tier])).toBeLessThanOrEqual(30);
    }
  });

  it('is deterministic', () => {
    expect(JSON.stringify(layoutNodes(buildModel().nodes)))
      .toEqual(JSON.stringify(layoutNodes(buildModel().nodes)));
  });
});
```

- [ ] **Step 2: Run it — expect failure**

Run: `npm test -- lib/brain/layout.test.ts`
Expected: FAIL (module missing).

- [ ] **Step 3: Write `lib/brain/layout.ts`**

```ts
// Pure analytic layout: assign each node a position on a concentric ring keyed
// by its tier. Deterministic (seeded jitter) so the graph is identical every
// recording — no physics simulation. Tiers: 0 core, 1 hub, 2 lead, 3 tool/offer,
// 4 agent (rim).
import { createSeededRandom } from '@/lib/demoAuto';
import type { GNode, Positioned } from './types';

export const STAGE = { w: 1600, h: 1000, cx: 800, cy: 500 };
export const TIER_R: Record<number, number> = { 0: 0, 1: 150, 2: 250, 3: 330, 4: 410 };
const TIER_PHASE: Record<number, number> = { 1: -Math.PI / 2, 2: 0.1, 3: 0.0, 4: 0.04 };

export function layoutNodes(nodes: GNode[]): Positioned[] {
  const rnd = createSeededRandom(424242);
  const byTier = new Map<number, GNode[]>();
  for (const n of nodes) {
    const arr = byTier.get(n.tier) ?? [];
    arr.push(n);
    byTier.set(n.tier, arr);
  }
  const out: Positioned[] = [];
  for (const [tier, arr] of byTier) {
    arr.forEach((n, i) => {
      if (tier === 0) {
        out.push({ ...n, x: STAGE.cx, y: STAGE.cy, tierIndex: 0, tierCount: 1 });
        return;
      }
      const phase = TIER_PHASE[tier] ?? 0;
      const a = (i / arr.length) * Math.PI * 2 + phase;
      const jitter = tier >= 2 ? (rnd() - 0.5) * 22 : 0;
      const r = TIER_R[tier] + jitter;
      out.push({
        ...n, x: STAGE.cx + Math.cos(a) * r, y: STAGE.cy + Math.sin(a) * r,
        tierIndex: i, tierCount: arr.length,
      });
    });
  }
  return out;
}

export function positionMap(positioned: Positioned[]): Record<string, Positioned> {
  const m: Record<string, Positioned> = {};
  for (const p of positioned) m[p.id] = p;
  return m;
}
```

- [ ] **Step 4: Run the test — expect PASS**

Run: `npm test -- lib/brain/layout.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/brain/layout.ts lib/brain/layout.test.ts
git commit -m "feat(brain): deterministic concentric-ring layout"
```

---

### Task 3: App shell + recording chrome + TopBar

**Files:**
- Create: `app/brain/layout.tsx`
- Create: `app/brain/page.tsx`
- Create: `components/brain/TopBar.tsx`

- [ ] **Step 1: Write `app/brain/layout.tsx`**

```tsx
import type { ReactNode } from 'react';

// The Sales Brain is its own app surface (not a /hive recording stage), so it
// has no HiveNav — just a light full-bleed canvas.
export default function BrainLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
```

- [ ] **Step 2: Write `components/brain/TopBar.tsx`**

```tsx
'use client';

type Props = {
  query: string;
  onQuery: (q: string) => void;
  live: boolean;
  onToggleLive: () => void;
};

export default function TopBar({ query, onQuery, live, onToggleLive }: Props) {
  return (
    <header style={{
      height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px', background: '#fff', borderBottom: '1px solid #e5e7eb', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: '#111418', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>L</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Lucas AI</span>
        <span style={{ color: '#cbd5e1' }}>·</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>Sales Brain</span>
      </div>
      <div style={{ flex: 1, maxWidth: 420, margin: '0 24px' }}>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search agents, squads, tools…"
          style={{ width: '100%', boxSizing: 'border-box', height: 38, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', padding: '0 14px', fontSize: 14, color: '#111827', outline: 'none' }}
        />
      </div>
      <button
        type="button" onClick={onToggleLive}
        style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 999, cursor: 'pointer',
          border: `1px solid ${live ? 'rgba(22,164,108,0.4)' : '#e5e7eb'}`, background: live ? 'rgba(22,164,108,0.1)' : '#fff', color: live ? '#106844' : '#6b7280', fontWeight: 700, fontSize: 14 }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 999, background: live ? '#16A46C' : '#9ca3af' }} className={live ? 'pulse-glow' : undefined} />
        {live ? 'Live' : 'Paused'}
      </button>
    </header>
  );
}
```

- [ ] **Step 3: Write `app/brain/page.tsx` (shell only — graph mount comes next task)**

```tsx
'use client';

// Sales Brain app shell. One page, client view-state (graph | entity | chat);
// no per-entity routes so it static-exports and attract mode can switch views
// without navigation. Graph/EntityPanel/ChatView are wired in later tasks.
import { useEffect, useMemo, useState } from 'react';
import { buildModel } from '@/lib/brain/data';
import TopBar from '@/components/brain/TopBar';

export default function SalesBrainPage() {
  const model = useMemo(() => buildModel(), []);
  const [query, setQuery] = useState('');
  const [live, setLive] = useState(true);

  // Recording chrome: hide the Next dev overlay + reset body so nothing floats.
  useEffect(() => {
    const prevBody = document.body.style.cssText;
    document.body.style.margin = '0';
    document.body.style.background = '#f4f5f7';
    const style = document.createElement('style');
    style.textContent = `nextjs-portal,[data-nextjs-toast],[data-nextjs-dialog-overlay],nextjs-dev-toolbar{display:none!important}`;
    document.head.appendChild(style);
    return () => { document.body.style.cssText = prevBody; style.remove(); };
  }, []);

  return (
    <main style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', background: '#f4f5f7', fontFamily: 'ui-sans-serif, system-ui, sans-serif', overflow: 'hidden' }}>
      <TopBar query={query} onQuery={setQuery} live={live} onToggleLive={() => setLive((v) => !v)} />
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 15 }}>
        Graph mounts here ({model.agents.length} agents) — Task 4
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Verify it builds + renders**

Run: `npm run build` → succeeds, route list includes `○ /brain`.
Then `npm run dev` (background), open http://localhost:3000/brain — top bar + placeholder render; kill the dev server.

- [ ] **Step 5: Lint + commit**

`npm run lint` → 5 errors / 8 warnings.
```bash
git add app/brain/layout.tsx app/brain/page.tsx components/brain/TopBar.tsx
git commit -m "feat(brain): app shell + recording chrome + top bar"
```

---

### Task 4: Graph component (pan/zoom, hover, click, pulses)

**Files:**
- Create: `components/brain/Graph.tsx`
- Modify: `app/brain/page.tsx` (mount the graph, hold selection state)

- [ ] **Step 1: Write `components/brain/Graph.tsx`**

Pan/zoom mirrors `app/ad/clone-army/page.tsx` (wheel zoom-to-cursor, pointer drag). The settled layout is static; a slow CSS drift on the canvas group + sale pulses keep it alive. Positions come from the pure `layoutNodes`; nothing writes React state per frame.

```tsx
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
      const f = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const nz = Math.max(0.4, Math.min(2.4, z.current * f));
      const k = nz / z.current;
      tx.current = e.clientX - (e.clientX - tx.current) * k;
      ty.current = e.clientY - (e.clientY - ty.current) * k;
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
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#c9ccd1" strokeWidth={e.kind === 'hub' ? 1.6 : 1} opacity={dim ? 0.12 : 0.5} />;
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
            const op = dim && !hl ? 0.18 : 1;
            const sel = n.id === selectedId;
            if (n.type === 'core') {
              return (
                <g key={n.id} opacity={op} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
                  <rect x={n.x - 34} y={n.y - 34} width={68} height={68} rx={16} fill="#111418" />
                  <text x={n.x} y={n.y + 10} textAnchor="middle" fontSize={32} fontWeight={800} fill="#fff">L</text>
                </g>
              );
            }
            if (n.type === 'hub') {
              return (
                <g key={n.id} opacity={op} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
                  <circle cx={n.x} cy={n.y} r={24} fill={n.color} stroke={sel ? '#111418' : 'none'} strokeWidth={3} />
                  <text x={n.x} y={n.y + 5} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">{n.label[0]}</text>
                  <text x={n.x} y={n.y + 42} textAnchor="middle" fontSize={13} fontWeight={700} fill="#374151">{n.label}</text>
                </g>
              );
            }
            if (n.type === 'lead') return <circle key={n.id} cx={n.x} cy={n.y} r={5} fill={n.color} opacity={op} />;
            if (n.type === 'tool' || n.type === 'offer') {
              return <rect key={n.id} x={n.x - 9} y={n.y - 9} width={18} height={18} rx={4} fill={n.color} opacity={op}
                onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }} />;
            }
            // agent monogram
            return (
              <g key={n.id} opacity={op} onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onClick={() => onSelect(n.id)} style={{ cursor: 'pointer' }}>
                <circle cx={n.x} cy={n.y} r={hl || sel ? 16 : 13} fill={n.color} stroke={sel ? '#111418' : (hl ? '#fff' : 'none')} strokeWidth={sel ? 3 : 2} />
                <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={10} fontWeight={700} fill="#fff">{n.initials}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* hover tooltip */}
      {hover && posMap[hover] && (
        <Tooltip model={model} id={hover} />
      )}

      <style>{`
        @keyframes brain-pulse-k { from { stroke-dashoffset: 600; opacity: 1; } to { stroke-dashoffset: 0; opacity: 0; } }
        .brain-pulse { animation: brain-pulse-k 0.9s ease-out forwards; }
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
```

- [ ] **Step 2: Mount the graph in `app/brain/page.tsx`**

Replace the placeholder `<div>` (the "Graph mounts here…" block) with selection state + the graph:

```tsx
// add import at top:
import Graph from '@/components/brain/Graph';
// add state inside the component, after `live`:
  const [selectedId, setSelectedId] = useState<string | null>(null);
// replace the placeholder flex div with:
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Graph model={model} live={live} query={query} selectedId={selectedId} onSelect={setSelectedId} />
      </div>
```

- [ ] **Step 3: Visual smoke-check**

`npm run dev` (background) → http://localhost:3000/brain. Verify with a screenshot (`node C:\tmp\hive-review\shoot-one.mjs /brain brain-graph 1920 1080 4000 0` — script exists from earlier work). Confirm: concentric rings render (core, 6 labeled hubs, lead dots, tool/offer squares, 44 monograms), wheel zooms, drag pans, hovering an agent dims the rest + shows the tooltip, a green pulse fires periodically. Kill the dev server.

- [ ] **Step 4: Lint + commit**

`npm run lint` → 5 errors / 8 warnings (watch for set-state-in-effect: the pulse `setState` is inside a `setTimeout` callback, which is allowed).
```bash
git add components/brain/Graph.tsx app/brain/page.tsx
git commit -m "feat(brain): concentric-ring SVG graph with pan/zoom, hover, pulses"
```

---

### Task 5: Agent EntityPanel + wire selection

**Files:**
- Create: `components/brain/EntityPanel.tsx`
- Modify: `app/brain/page.tsx` (render the panel when an agent is selected)

- [ ] **Step 1: Write `components/brain/EntityPanel.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { BrainModel } from '@/lib/brain/types';
import { squadColor, squadName } from '@/lib/brain/data';
import { money, buildFunnelSrc } from '@/lib/adStage';

type Props = { model: BrainModel; id: string; onClose: () => void };
const TABS = ['Overview', 'Access', 'Activity', 'Compliance'] as const;
type Tab = typeof TABS[number];

export default function EntityPanel({ model, id, onClose }: Props) {
  const [tab, setTab] = useState<Tab>('Overview');
  const agent = model.agents.find((a) => a.id === id);
  if (!agent) {
    // tool / offer / hub: light panel
    const node = model.nodes.find((n) => n.id === id);
    return (
      <Shell title={node?.label ?? 'Node'} subtitle={node?.type ?? ''} color="#64748b" onClose={onClose}>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Used across the Lucas AI sales floor. Select an agent node to see a full profile.</p>
      </Shell>
    );
  }
  const color = squadColor(agent.squadId);
  const leads = model.leads.filter((l) => l.agentId === agent.id);
  const tools = model.tools.filter((t) => agent.toolIds.includes(t.id));
  const playbook = model.offers.find((o) => o.id === agent.playbookId);
  const leadIndex = Number(agent.id.split(':')[1]) || 0;

  return (
    <Shell
      title={agent.name}
      subtitle={`${agent.role} · ${squadName(agent.squadId)}`}
      color={color}
      avatar={agent.initials}
      status={agent.status}
      onClose={onClose}
    >
      <div style={{ display: 'flex', gap: 10, padding: '0 0 14px' }}>
        <Stat label="Sales" value={String(agent.sales)} />
        <Stat label="Calls" value={String(agent.calls)} />
        <Stat label="Revenue" value={money(agent.revenue)} accent />
      </div>
      <nav style={{ display: 'flex', gap: 4, borderBottom: '1px solid #e5e7eb', marginBottom: 14 }}>
        {TABS.map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: '8px 12px', fontSize: 13, fontWeight: 700, color: tab === t ? '#111827' : '#9ca3af', borderBottom: tab === t ? '2px solid #111827' : '2px solid transparent' }}>{t}</button>
        ))}
      </nav>

      {tab === 'Overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Row label="Current task"><span style={{ fontStyle: 'italic', color: '#374151' }}>{agent.currentTask}…</span></Row>
          <Row label="Playbook">{playbook ? `${playbook.name}${playbook.priceUsd ? ` ($${playbook.priceUsd})` : ''}` : '—'}</Row>
          <Row label={`Leads working (${leads.length})`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {leads.slice(0, 6).map((l) => (
                <span key={l.id} style={{ fontSize: 12, fontWeight: 600, color: '#374151', background: '#f3f4f6', borderRadius: 999, padding: '4px 10px' }}>{l.name} · {l.source}</span>
              ))}
              {leads.length === 0 && <span style={{ color: '#9ca3af', fontSize: 13 }}>Idle — waiting for the next lead.</span>}
            </div>
          </Row>
          <Row label="Live conversation">
            <div style={{ width: '100%', height: 280, borderRadius: 12, overflow: 'hidden', border: '1px solid #e5e7eb', background: '#fff' }}>
              <iframe title="live" src={buildFunnelSrc({ id: leadIndex, seed: 7000 + leadIndex * 37 }, leadIndex, { count: 6, demoScale: 0.7, speed: 0.5 })} style={{ width: '100%', height: '100%', border: 'none', pointerEvents: 'none' }} />
            </div>
          </Row>
        </div>
      )}
      {tab === 'Access' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Row label="Tools">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {tools.map((t) => <span key={t.id} style={{ fontSize: 12, fontWeight: 700, color: '#111827', background: '#f3f4f6', borderRadius: 8, padding: '5px 10px' }}>{t.name}</span>)}
            </div>
          </Row>
          <Row label="Permissions">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {agent.permissions.map((p) => (
                <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff', background: p.allowed ? '#16A46C' : '#dc2626' }}>{p.allowed ? '✓' : '✕'}</span>
                  <span style={{ color: '#374151' }}>{p.label}</span>
                </div>
              ))}
            </div>
          </Row>
        </div>
      )}
      {tab === 'Activity' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {leads.map((l) => (
            <div key={l.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#f9fafb', borderRadius: 8, fontSize: 13 }}>
              <span style={{ color: '#374151' }}>{l.name} · {l.source}</span>
              <span style={{ fontWeight: 700, color: l.outcome === 'buy' ? '#16A46C' : l.outcome === 'book' ? '#7C3AED' : '#9ca3af' }}>
                {l.outcome === 'buy' ? `Bought $${l.valueUsd}` : l.outcome === 'book' ? 'Booked a call' : 'Working…'}
              </span>
            </div>
          ))}
          {leads.length === 0 && <span style={{ color: '#9ca3af', fontSize: 13 }}>No recent activity.</span>}
        </div>
      )}
      {tab === 'Compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: '#374151' }}>
          <p>Operates within the {squadName(agent.squadId)} squad guardrails. Cannot export raw lead PII. All actions logged and attributable to this agent.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#16A46C', fontWeight: 700 }}><span>●</span> In compliance · last audit passed</div>
        </div>
      )}
    </Shell>
  );
}

function Shell({ title, subtitle, color, avatar, status, onClose, children }: { title: string; subtitle: string; color: string; avatar?: string; status?: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <aside style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 520, maxWidth: '92vw', background: '#fff', borderLeft: '1px solid #e5e7eb', boxShadow: '-12px 0 40px rgba(0,0,0,0.08)', zIndex: 60, display: 'flex', flexDirection: 'column', animation: 'panel-in 0.28s cubic-bezier(0.2,0.7,0.2,1)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 14 }}>
        <span style={{ width: 48, height: 48, borderRadius: 12, background: color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, flexShrink: 0 }}>{avatar ?? title[0]}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#111827' }}>{title}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280' }}>{subtitle}{status ? ` · ${status}` : ''}</div>
        </div>
        <button type="button" onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: 8, width: 32, height: 32, cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>✕</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '18px 24px' }}>{children}</div>
      <style>{`@keyframes panel-in { from { transform: translateX(28px); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>
    </aside>
  );
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ flex: 1, background: accent ? 'rgba(22,164,108,0.08)' : '#f9fafb', border: '1px solid #eef0f3', borderRadius: 12, padding: '12px 14px' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: '#9ca3af' }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent ? '#106844' : '#111827' }}>{value}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, color: '#9ca3af', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#111827' }}>{children}</div>
    </div>
  );
}
```

Note: `buildFunnelSrc` already returns a `${BASE_PATH}/?…` string, so it's used directly as the iframe `src` (no separate `BASE_PATH` import needed).

- [ ] **Step 2: Render the panel in `app/brain/page.tsx`**

```tsx
// add import:
import EntityPanel from '@/components/brain/EntityPanel';
// after the <Graph/> wrapper div, still inside the flex-1 container, add:
        {selectedId && selectedId !== 'core' && (
          <EntityPanel model={model} id={selectedId} onClose={() => setSelectedId(null)} />
        )}
```

- [ ] **Step 3: Visual smoke-check**

`npm run dev` → /brain. Click an agent monogram → panel slides in with name/role/squad, stat chips, and the four tabs work; the Overview tab shows a live funnel iframe; Access shows the permission ✓/✕ rows. Screenshot it. Kill dev server.

- [ ] **Step 4: Lint + commit**

`npm run lint` → 5 errors / 8 warnings.
```bash
git add components/brain/EntityPanel.tsx app/brain/page.tsx
git commit -m "feat(brain): agent drill-down panel with Overview/Access/Activity/Compliance"
```

---

### Task 6: Minimal attract mode

**Files:**
- Modify: `app/brain/page.tsx` (read `?attract=1`, auto-open an agent on a loop, pass `focusId` to Graph)

- [ ] **Step 1: Add the attract driver to `app/brain/page.tsx`**

```tsx
// add import:
import { useSearchParams } from 'next/navigation';
// inside the component:
  const params = useSearchParams();
  const attract = params.get('attract') === '1';
  const [focusId, setFocusId] = useState<string | null>(null);

  useEffect(() => {
    if (!attract) return;
    const agents = model.agents;
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => {
      const a = agents[i % agents.length];
      setFocusId(a.id);
      setSelectedId(a.id);
      i += 1;
      timer = setTimeout(step, 6000);
    };
    timer = setTimeout(step, 2500);
    return () => clearTimeout(timer);
  }, [attract, model.agents]);
// pass focusId to the graph:
        <Graph model={model} live={live} query={query} selectedId={selectedId} onSelect={setSelectedId} focusId={focusId} />
```

`useSearchParams` requires a Suspense boundary in app router for static export; wrap the page body. Simplest: split the component so the default export wraps `<Suspense fallback={null}><SalesBrainInner/></Suspense>`. Implementer: rename the existing component to `SalesBrainInner` and add:

```tsx
import { Suspense } from 'react';
export default function SalesBrainPage() {
  return <Suspense fallback={null}><SalesBrainInner /></Suspense>;
}
```

- [ ] **Step 2: Verify attract mode (two-shot)**

`npm run dev` → screenshot twice ≥8s apart at `/brain?attract=1`:
`node C:\tmp\hive-review\shoot-one.mjs "/brain?attract=1" brain-attract 1920 1080 4000 8000`
Confirm `brain-attract.png` and `brain-attract-late.png` show the view focused on (and the panel open for) two **different** agents — i.e. it auto-advances. Kill dev server.

- [ ] **Step 3: Build + lint + commit**

`npm run build` (Suspense boundary must keep `/brain` static-exportable), `npm run lint` → 5/8.
```bash
git add app/brain/page.tsx
git commit -m "feat(brain): minimal attract mode (auto-focus agents on a loop)"
```

**END OF PHASE 1 — checkpoint with the user before Phase 2 (the slice is filmable here).**

---

## PHASE 2 — Depth

### Task 7: LeftRail entity browser + search wiring

**Files:**
- Create: `components/brain/LeftRail.tsx`
- Modify: `app/brain/page.tsx` (mount rail; clicking an item selects/focuses its node)

- [ ] **Step 1: Write `components/brain/LeftRail.tsx`**

```tsx
'use client';

import type { BrainModel } from '@/lib/brain/types';

type Group = { key: string; label: string; items: { id: string; label: string; color?: string }[] };
type Props = { model: BrainModel; onSelect: (id: string) => void; selectedId: string | null };

export default function LeftRail({ model, onSelect, selectedId }: Props) {
  const groups: Group[] = [
    { key: 'agents', label: 'Agents', items: model.agents.map((a) => ({ id: a.id, label: a.name })) },
    { key: 'sub', label: 'Sub-agents', items: model.subAgents.map((s) => ({ id: s.id, label: s.name })) },
    { key: 'leads', label: 'Leads', items: model.leads.map((l) => ({ id: l.id, label: l.name })) },
    { key: 'tools', label: 'Tools', items: model.tools.map((t) => ({ id: `node:${t.id}`, label: t.name })) },
    { key: 'offers', label: 'Offers', items: model.offers.map((o) => ({ id: `node:${o.id}`, label: o.name })) },
  ];
  return (
    <aside style={{ width: 248, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', overflow: 'auto', padding: '12px 0' }}>
      <div style={{ padding: '6px 18px 10px', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9ca3af' }}>Sales Floor</div>
      {groups.map((g) => (
        <div key={g.key} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px', fontSize: 13, fontWeight: 800, color: '#374151' }}>
            <span>{g.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', background: '#f3f4f6', borderRadius: 999, padding: '1px 8px' }}>{g.items.length}</span>
          </div>
          {g.items.slice(0, 6).map((it) => (
            <button key={it.id} type="button" onClick={() => onSelect(it.id)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: it.id === selectedId ? '#f1f5f9' : 'transparent', padding: '7px 18px 7px 26px', fontSize: 13, color: '#4b5563' }}>{it.label}</button>
          ))}
          {g.items.length > 6 && <div style={{ padding: '4px 18px 4px 26px', fontSize: 12, color: '#9ca3af' }}>+{g.items.length - 6} more</div>}
        </div>
      ))}
    </aside>
  );
}
```

- [ ] **Step 2: Mount it in `app/brain/page.tsx`**

Wrap the graph area in a horizontal flex with the rail on the left:

```tsx
// add import:
import LeftRail from '@/components/brain/LeftRail';
// change the flex-1 container to a row holding the rail + a relative graph wrapper:
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <LeftRail model={model} onSelect={(id) => { setSelectedId(id); setFocusId(id); }} selectedId={selectedId} />
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          <Graph model={model} live={live} query={query} selectedId={selectedId} onSelect={setSelectedId} focusId={focusId} />
          {selectedId && selectedId !== 'core' && (
            <EntityPanel model={model} id={selectedId} onClose={() => setSelectedId(null)} />
          )}
        </div>
      </div>
```

- [ ] **Step 3: Smoke-check + lint + commit**

`npm run dev` → rail lists groups with counts; clicking a name selects the node, focuses the graph, opens the panel. Screenshot. `npm run lint` → 5/8.
```bash
git add components/brain/LeftRail.tsx app/brain/page.tsx
git commit -m "feat(brain): left-rail entity browser with counts + selection"
```

---

### Task 8: Tool & Offer panels

**Files:**
- Modify: `components/brain/EntityPanel.tsx` (richer tool/offer branch)

- [ ] **Step 1: Replace the non-agent branch in `EntityPanel.tsx`**

Replace the `if (!agent) { … }` block with tool/offer awareness:

```tsx
  if (!agent) {
    const tool = model.tools.find((t) => `node:${t.id}` === id);
    const offer = model.offers.find((o) => `node:${o.id}` === id);
    if (tool) {
      const users = model.agents.filter((a) => a.toolIds.includes(tool.id));
      return (
        <Shell title={tool.name} subtitle="Tool · connected" color="#64748b" onClose={onClose}>
          <Row label={`Agents with access (${users.length})`}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {users.slice(0, 12).map((u) => <span key={u.id} style={{ fontSize: 12, fontWeight: 700, color: '#fff', background: squadColor(u.squadId), borderRadius: 999, padding: '4px 10px' }}>{u.initials}</span>)}
            </div>
          </Row>
        </Shell>
      );
    }
    if (offer) {
      return (
        <Shell title={offer.name} subtitle={offer.priceUsd ? `Offer · $${offer.priceUsd}` : 'Offer · free'} color="#16A46C" onClose={onClose}>
          <Row label="Funnel steps">
            <ol style={{ margin: 0, paddingLeft: 18, color: '#374151', fontSize: 14, lineHeight: 1.8 }}>
              {offer.steps.map((s) => <li key={s}>{s}</li>)}
            </ol>
          </Row>
        </Shell>
      );
    }
    const node = model.nodes.find((n) => n.id === id);
    return (
      <Shell title={node?.label ?? 'Node'} subtitle={node?.type ?? ''} color="#64748b" onClose={onClose}>
        <p style={{ color: '#6b7280', fontSize: 14 }}>Select an agent node to see a full profile.</p>
      </Shell>
    );
  }
```

- [ ] **Step 2: Smoke-check + lint + commit**

Click a tool square and an offer square → correct panels. `npm run lint` → 5/8.
```bash
git add components/brain/EntityPanel.tsx
git commit -m "feat(brain): tool + offer detail panels"
```

---

### Task 9: ChatView (sub-agent rail + channels + AI report)

**Files:**
- Create: `components/brain/ChatView.tsx`
- Modify: `app/brain/page.tsx` (a view toggle: graph ⇄ chat)

- [ ] **Step 1: Write `components/brain/ChatView.tsx`**

```tsx
'use client';

import { useState } from 'react';
import type { BrainModel } from '@/lib/brain/types';
import { squadColor, squadName } from '@/lib/brain/data';
import { money } from '@/lib/adStage';

type Props = { model: BrainModel };

export default function ChatView({ model }: Props) {
  const channels = ['General', ...model.squads.map((s) => `# ${s.name}`), '# Low-Ticket Report', '# Strategy Call'];
  const [channel, setChannel] = useState(channels[0]);
  const totalRev = model.agents.reduce((a, x) => a + x.revenue, 0);
  const totalSales = model.agents.reduce((a, x) => a + x.sales, 0);
  const totalCalls = model.agents.reduce((a, x) => a + x.calls, 0);
  const top = [...model.agents].sort((a, b) => b.revenue - a.revenue).slice(0, 3);

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', background: '#f9fafb' }}>
      {/* sub-agent rail */}
      <aside style={{ width: 240, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', overflow: 'auto', padding: '14px 0' }}>
        <div style={{ padding: '4px 18px 10px', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9ca3af' }}>Sub-agents</div>
        {model.subAgents.map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 18px', fontSize: 14, color: '#374151' }}>
            <span style={{ width: 8, height: 8, borderRadius: 999, background: squadColor(s.squadId ?? undefined) }} className="pulse-glow" />
            {s.name}
          </div>
        ))}
        <div style={{ padding: '14px 18px 6px', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9ca3af' }}>Channels</div>
        {channels.map((c) => (
          <button key={c} type="button" onClick={() => setChannel(c)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: c === channel ? '#f1f5f9' : 'transparent', padding: '8px 18px', fontSize: 14, fontWeight: c === channel ? 700 : 500, color: '#4b5563' }}>{c}</button>
        ))}
      </aside>

      {/* AI daily report */}
      <div style={{ flex: 1, minWidth: 0, overflow: 'auto', padding: '28px 40px' }}>
        <div style={{ fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#16A46C' }}>{channel} · Daily Brief</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '6px 0 18px' }}>Sales floor — end-of-day report</h1>
        <div style={{ display: 'flex', gap: 14, marginBottom: 22 }}>
          <Big label="Revenue today" value={`$${totalRev.toLocaleString()}`} accent />
          <Big label="Sales" value={String(totalSales)} />
          <Big label="Calls booked" value={String(totalCalls)} />
        </div>
        <Section title="Top closers">
          {top.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ width: 26, height: 26, borderRadius: 8, background: squadColor(a.squadId), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11 }}>{a.initials}</span>
              <span style={{ flex: 1, fontSize: 14, color: '#111827', fontWeight: 600 }}>{a.name} <span style={{ color: '#9ca3af', fontWeight: 500 }}>· {squadName(a.squadId)}</span></span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#16A46C' }}>{money(a.revenue)}</span>
              <span style={{ width: 64, textAlign: 'right', fontSize: 13, color: '#6b7280' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {a.sales} sales</span>
            </div>
          ))}
        </Section>
        <Section title="What the floor needs from you">
          <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', fontSize: 14, lineHeight: 1.9 }}>
            <li><b>Follow-ups owed:</b> {model.leads.filter((l) => l.outcome === 'book').length} booked calls need confirmation texts before tomorrow.</li>
            <li><b>At-risk:</b> {model.leads.filter((l) => l.outcome === 'working').length} leads still mid-conversation past 24h — Reactivation squad is on them.</li>
            <li><b>Approve:</b> Closing squad wants to A/B a new objection script on the Core Program.</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
function Big({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ flex: 1, background: accent ? '#16A46C' : '#fff', color: accent ? '#fff' : '#111827', border: accent ? 'none' : '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, opacity: accent ? 0.9 : 0.5 }}>{label}</div>
      <div style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '18px 22px', marginBottom: 18, boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111827', margin: '0 0 8px' }}>{title}</h2>
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Add a graph⇄chat view toggle in `app/brain/page.tsx`**

```tsx
// add import:
import ChatView from '@/components/brain/ChatView';
// add state:
  const [view, setView] = useState<'graph' | 'chat'>('graph');
// in TopBar area, add two small toggle buttons (pass view/setView as props OR render inline).
// Simplest: render a segmented control just under the TopBar:
      <div style={{ display: 'flex', gap: 6, padding: '8px 22px', background: '#fff', borderBottom: '1px solid #f3f4f6' }}>
        {(['graph', 'chat'] as const).map((v) => (
          <button key={v} type="button" onClick={() => setView(v)} style={{ border: 'none', cursor: 'pointer', borderRadius: 8, padding: '6px 14px', fontSize: 13, fontWeight: 700, background: view === v ? '#111418' : '#f3f4f6', color: view === v ? '#fff' : '#6b7280' }}>{v === 'graph' ? 'Graph' : 'Chat & Report'}</button>
        ))}
      </div>
// in the flex-1 row, switch on view:
        <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
          {view === 'graph' ? (
            <>
              <Graph .../>
              {selectedId && selectedId !== 'core' && <EntityPanel .../>}
            </>
          ) : (
            <ChatView model={model} />
          )}
        </div>
```

- [ ] **Step 3: Smoke-check + lint + commit**

Toggle to Chat & Report → sub-agent rail, channels, KPI tiles, top closers, action list. `npm run lint` → 5/8.
```bash
git add components/brain/ChatView.tsx app/brain/page.tsx
git commit -m "feat(brain): chat view — sub-agent rail, channels, AI daily report"
```

---

### Task 10: Full attract choreography

**Files:**
- Modify: `app/brain/page.tsx` (extend the attract loop to cycle graph → agents → chat)

- [ ] **Step 1: Replace the attract effect in `app/brain/page.tsx`**

```tsx
  useEffect(() => {
    if (!attract) return;
    // Choreographed loop: focus 3 agents (panel open), then show chat, repeat.
    const agents = model.agents;
    const seq: Array<() => void> = [];
    for (let k = 0; k < 9; k += 3) {
      seq.push(() => { setView('graph'); setFocusId(agents[k % agents.length].id); setSelectedId(agents[k % agents.length].id); });
      seq.push(() => { setFocusId(agents[(k + 1) % agents.length].id); setSelectedId(agents[(k + 1) % agents.length].id); });
      seq.push(() => { setView('chat'); setSelectedId(null); });
    }
    let i = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = () => { seq[i % seq.length](); i += 1; timer = setTimeout(step, 5500); };
    timer = setTimeout(step, 2200);
    return () => clearTimeout(timer);
  }, [attract, model.agents]);
```

(When `view === 'chat'`, the `focusId`/`selectedId` are ignored by the chat view; switching back to `'graph'` re-runs the Graph focus effect because `focusId` changes.)

- [ ] **Step 2: Verify the full loop (multi-shot)**

`npm run dev` → screenshot `/brain?attract=1` at 4s, 12s, 20s using two runs of shoot-one (or extend the sweep script in Task 11). Confirm it visits an agent panel AND the chat report across the timeline. Kill dev server.

- [ ] **Step 3: Lint + commit**

`npm run lint` → 5/8.
```bash
git add app/brain/page.tsx
git commit -m "feat(brain): full attract choreography (agents → chat → loop)"
```

---

### Task 11: Full verification + screenshot script

**Files:**
- Create: `scripts/shoot-brain.mjs`

- [ ] **Step 1: Run the gate**

```bash
npm run build   # /brain present and static (○); no SSR errors
npm test        # 39 prior + 9 new brain unit tests all pass
npm run lint    # exactly 5 errors / 8 warnings; zero in app/brain, components/brain, lib/brain
```

- [ ] **Step 2: Write `scripts/shoot-brain.mjs`**

```js
// Screenshot sweep of the Sales Brain. Dev server up first: npm run dev
import { chromium } from 'file:///C:/Users/lucas/AppData/Roaming/npm/node_modules/expect-cli/node_modules/playwright/index.mjs';
const OUT = 'C:/tmp/brain-review';
const BASE = 'http://localhost:3000';
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });

async function shot(name, url, wait, clickAgent) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = [];
  page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto(BASE + url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(wait);
  if (clickAgent) { await page.mouse.click(960, 300); await page.waitForTimeout(1200); }
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`OK ${name}${errs.length ? ' — ERRORS: ' + [...new Set(errs)].slice(0, 3).join(' | ') : ''}`);
  await page.close();
}

await shot('graph', '/brain', 4000, false);
await shot('attract-early', '/brain?attract=1', 4000, false);
await shot('attract-late', '/brain?attract=1', 14000, false);
await browser.close();
console.log('done');
```

- [ ] **Step 3: Run the sweep + inspect**

```bash
mkdir -p C:/tmp/brain-review
# terminal: npm run dev
node scripts/shoot-brain.mjs
```
Expect `OK graph`, `OK attract-early`, `OK attract-late`, `done`, no `ERRORS`. Open the PNGs: graph reads like the chosen layout A; attract early vs late differ (different agent/chat). Kill dev server.

- [ ] **Step 4: Commit + summary**

```bash
git add scripts/shoot-brain.mjs
git commit -m "chore(brain): screenshot sweep script"
git log --oneline 1611f5d..HEAD
```

Do not push or merge — checkpoint with Lucas (merging deploys to GitHub Pages).
