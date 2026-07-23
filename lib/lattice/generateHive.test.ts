import { describe, expect, it } from "vitest";
import { generateHive, HIVE_ORB_COUNT, HIVE_PER_SIDE } from "./generateHive";
import { nodePixelPosition } from "./CanvasRenderer";

describe("generateHive", () => {
  it("has exactly one brain (center) node and HIVE_ORB_COUNT lead orbs", () => {
    const g = generateHive();
    expect(g.nodes.filter((n) => n.ring === "center")).toHaveLength(1);
    expect(g.nodes.filter((n) => n.ring === "avatar")).toHaveLength(HIVE_ORB_COUNT);
  });

  it("links every orb to the brain and nothing else", () => {
    const g = generateHive();
    expect(g.links).toHaveLength(HIVE_ORB_COUNT);
    expect(g.links.every((l) => l.sourceId === "center" || l.targetId === "center")).toBe(true);
  });

  it("gives every orb a distinct leadId and initials", () => {
    const orbs = generateHive().nodes.filter((n) => n.ring === "avatar");
    expect(new Set(orbs.map((o) => o.leadId)).size).toBe(HIVE_ORB_COUNT);
    expect(orbs.every((o) => !!o.initials)).toBe(true);
  });

  it("splits orbs into a left arc and a right arc of equal size", () => {
    const orbs = generateHive().nodes.filter((n) => n.ring === "avatar");
    const w = 1440, h = 1000;
    const right = orbs.filter((o) => nodePixelPosition(o, w, h).x >= w / 2);
    const left = orbs.filter((o) => nodePixelPosition(o, w, h).x < w / 2);
    expect(right).toHaveLength(HIVE_PER_SIDE);
    expect(left).toHaveLength(HIVE_PER_SIDE);
  });

  it("spreads orbs across at least 3 drill zones so selectDrillNodes can pick 3", () => {
    const orbs = generateHive().nodes.filter((n) => n.ring === "avatar");
    expect(new Set(orbs.map((o) => o.zoneIndex)).size).toBeGreaterThanOrEqual(3);
  });
});
