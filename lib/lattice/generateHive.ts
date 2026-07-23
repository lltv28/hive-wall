import { buildLeadIdentities } from "./leads";
import type { WheelGraph, WheelLink, WheelNode } from "./types";

export const HIVE_ORB_COUNT = 6;
export const HIVE_ZONE_COUNT = 6;
// 160, not larger: the brain's radius doubles as its click hit-target, and the
// renderer test's 300x150 jsdom canvas needs at least one point outside every
// node (a >162px brain centred there would cover the whole canvas). 160 still
// reads as a large, prominent hub on the real 1440px canvas.
export const BRAIN_RADIUS_PX = 160;
export const ORB_RADIUS_PX = 18;

const ORB_COLOR = "#1e293b";
const BRAIN_COLOR = "#0b3b28";

// All six orbs fan on the RIGHT side only, ±ARC_HALF_SPAN around angle 0 (the
// left half stays clear for the brain, which the wide camera pans left-of-
// centre). 60° spreads the orbs top-to-bottom on the right while keeping every
// one well clear of ±90°, so its cos() stays positive and focusSideFor (pixel x
// vs centre) always reads it as "right".
const ARC_HALF_SPAN = (60 * Math.PI) / 180;
// Two depths give the arc some body instead of a single thin curve.
const RADIUS_NEAR = 0.62;
const RADIUS_FAR = 0.9;

export function generateHive(): WheelGraph {
  const identities = buildLeadIdentities(HIVE_ORB_COUNT);
  const nodes: WheelNode[] = [];
  const links: WheelLink[] = [];

  const center: WheelNode = {
    id: "center",
    ring: "center",
    angle: 0,
    radiusFraction: 0,
    radius: BRAIN_RADIUS_PX,
    color: BRAIN_COLOR,
    label: "LUCAS AI CORE",
  };
  nodes.push(center);

  for (let i = 0; i < HIVE_ORB_COUNT; i += 1) {
    // t in [0,1] across the arc (HIVE_ORB_COUNT is fixed at 6, so no /0 guard).
    const t = i / (HIVE_ORB_COUNT - 1);
    const angle = -ARC_HALF_SPAN + t * (2 * ARC_HALF_SPAN);
    const identity = identities[i]!;
    const orb: WheelNode = {
      id: `orb-${i}`,
      ring: "avatar",
      // One orb per zone (0..5) so the reused selectDrillNodes buckets them into
      // distinct zones and can still pick 3 different drills per cycle.
      zoneIndex: i % HIVE_ZONE_COUNT,
      angle,
      radiusFraction: i % 2 === 0 ? RADIUS_NEAR : RADIUS_FAR,
      radius: ORB_RADIUS_PX,
      color: ORB_COLOR,
      initials: identity.initials,
      label: `Lead ${identity.leadNo}`,
      leadId: identity.id,
      closed: false,
    };
    nodes.push(orb);
    links.push({ id: `link-${i}`, sourceId: "center", targetId: orb.id });
  }

  return { nodes, links };
}
