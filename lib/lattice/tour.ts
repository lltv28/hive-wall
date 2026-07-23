import type { WheelNode } from "./types";

export type TourPhase = "wide" | "drill" | "pullback";

export interface TourStep {
  phase: TourPhase;
  durationMs: number;
  nodeId?: string;
}

export const WIDE_MS = 8_000;
// 18s. The card's idle slot now preloads its next lead only during wide and
// pullback (a short, watchable head start), and QuizCard's FUNNEL_OPTS speed
// is tuned so a full run lands inside that preload plus this drill window —
// see FUNNEL_OPTS's comment for the arithmetic. A longer DRILL_MS let the
// funnel finish (and loop back to its intro) unseen, which is what produced
// a "Potential Complete" banner sitting on a restarted intro screen on camera.
export const DRILL_MS = 18_000;
export const PULLBACK_MS = 2_500;
export const DRILLS_PER_CYCLE = 3;

// Small deterministic hash so a seed maps to a stable pick without pulling in
// a stateful RNG. Recording runs must be reproducible.
function hash(seed: number, salt: number): number {
  const x = Math.sin(seed * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Pick one lead from each of `count` distinct rep zones, so consecutive
 * drills visibly move around the wheel instead of staying in one fan.
 */
export function selectDrillNodes(
  leads: WheelNode[],
  seed: number,
  count: number = DRILLS_PER_CYCLE,
): WheelNode[] {
  const byZone = new Map<number, WheelNode[]>();
  for (const lead of leads) {
    const zone = lead.zoneIndex ?? 0;
    const bucket = byZone.get(zone);
    if (bucket) bucket.push(lead);
    else byZone.set(zone, [lead]);
  }

  const zones = [...byZone.keys()].sort((a, b) => a - b);
  const rotated = zones
    .map((zone, index) => ({ zone, rank: hash(seed, index) }))
    .sort((a, b) => a.rank - b.rank)
    .slice(0, count)
    .map((entry) => entry.zone);

  return rotated.map((zone, index) => {
    const bucket = byZone.get(zone)!;
    return bucket[Math.floor(hash(seed, 100 + index) * bucket.length)]!;
  });
}

/**
 * One full loop: open on the whole wheel, then drill into each chosen lead
 * and pull back out. Wide-to-tight, roughly 70 seconds.
 */
export function buildTourCycle(drillNodes: WheelNode[]): TourStep[] {
  const steps: TourStep[] = [{ phase: "wide", durationMs: WIDE_MS }];
  for (const node of drillNodes) {
    steps.push({ phase: "drill", durationMs: DRILL_MS, nodeId: node.id });
    steps.push({ phase: "pullback", durationMs: PULLBACK_MS });
  }
  return steps;
}
