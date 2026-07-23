import { describe, expect, it } from "vitest";
import type { WheelNode } from "./types";
import {
  DRILLS_PER_CYCLE,
  DRILL_MS,
  PULLBACK_MS,
  WIDE_MS,
  buildTourCycle,
  selectDrillNodes,
} from "./tour";

function leadFixture(): WheelNode[] {
  return Array.from({ length: 96 }, (_, index) => ({
    id: `avatar-${index}`,
    ring: "avatar" as const,
    zoneIndex: index % 6,
    angle: 0,
    radiusFraction: 0.86,
    radius: 6,
    color: "#000000",
    leadId: index,
    closed: false,
  }));
}

describe("selectDrillNodes", () => {
  it("picks one lead from each of three different zones", () => {
    const picked = selectDrillNodes(leadFixture(), 42);
    expect(picked).toHaveLength(DRILLS_PER_CYCLE);
    expect(new Set(picked.map((node) => node.zoneIndex)).size).toBe(DRILLS_PER_CYCLE);
  });

  it("is deterministic for a given seed", () => {
    const leads = leadFixture();
    expect(selectDrillNodes(leads, 7).map((n) => n.id)).toEqual(
      selectDrillNodes(leads, 7).map((n) => n.id),
    );
  });

  it("gives different picks for different seeds", () => {
    const leads = leadFixture();
    const a = selectDrillNodes(leads, 1).map((n) => n.id).join();
    const b = selectDrillNodes(leads, 2).map((n) => n.id).join();
    expect(a).not.toBe(b);
  });
});

describe("buildTourCycle", () => {
  it("opens wide, then alternates drill and pullback", () => {
    const picked = selectDrillNodes(leadFixture(), 42);
    const steps = buildTourCycle(picked);

    expect(steps.map((step) => step.phase)).toEqual([
      "wide",
      "drill", "pullback",
      "drill", "pullback",
      "drill", "pullback",
    ]);
    expect(steps[0]!.durationMs).toBe(WIDE_MS);
    expect(steps[1]!.durationMs).toBe(DRILL_MS);
    expect(steps[2]!.durationMs).toBe(PULLBACK_MS);
  });

  it("attaches a node id to every drill and to no other phase", () => {
    const picked = selectDrillNodes(leadFixture(), 42);
    const steps = buildTourCycle(picked);
    for (const step of steps) {
      if (step.phase === "drill") expect(step.nodeId).toBeTypeOf("string");
      else expect(step.nodeId).toBeUndefined();
    }
    expect(steps.filter((s) => s.phase === "drill").map((s) => s.nodeId)).toEqual(
      picked.map((node) => node.id),
    );
  });

  it("runs about 70 seconds", () => {
    const total = buildTourCycle(selectDrillNodes(leadFixture(), 42))
      .reduce((sum, step) => sum + step.durationMs, 0);
    expect(total).toBeGreaterThan(65_000);
    expect(total).toBeLessThan(75_000);
  });
});
