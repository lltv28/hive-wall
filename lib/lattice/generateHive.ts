import { buildLeadIdentities } from "./leads";
import type { WheelGraph, WheelLink, WheelNode } from "./types";

export const HIVE_ORB_COUNT = 28;
export const HIVE_PER_SIDE = HIVE_ORB_COUNT / 2; // 14
export const HIVE_ZONE_COUNT = 6;
export const BRAIN_RADIUS_PX = 150;
export const ORB_RADIUS_PX = 16;

const ORB_COLOR = "#1e293b";
const BRAIN_COLOR = "#0b3b28";

// Each side fans ±ARC_HALF_SPAN around its axis (0 rad right, π rad left).
// 48° gives two distinct left/right arcs with clear open space top and bottom
// (rather than a near-full ring), and keeps every orb well clear of ±90° so its
// cos() sign stays unambiguous — focusSideFor (pixel x vs center) never
// mis-assigns a near-vertical orb.
const ARC_HALF_SPAN = (48 * Math.PI) / 180;
// Two depths per arc give the cluster body instead of a single thin curve.
const RADIUS_NEAR = 0.6;
const RADIUS_FAR = 0.86;

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

  const axes = [0, Math.PI]; // right arc, left arc
  axes.forEach((axis, side) => {
    for (let i = 0; i < HIVE_PER_SIDE; i += 1) {
      const t = HIVE_PER_SIDE === 1 ? 0.5 : i / (HIVE_PER_SIDE - 1);
      const angle = axis - ARC_HALF_SPAN + t * (2 * ARC_HALF_SPAN);
      const globalIndex = side * HIVE_PER_SIDE + i;
      const identity = identities[globalIndex]!;
      const orb: WheelNode = {
        id: `orb-${globalIndex}`,
        ring: "avatar",
        zoneIndex: globalIndex % HIVE_ZONE_COUNT,
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
      links.push({ id: `link-${globalIndex}`, sourceId: "center", targetId: orb.id });
    }
  });

  return { nodes, links };
}
