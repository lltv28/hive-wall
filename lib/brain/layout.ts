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
