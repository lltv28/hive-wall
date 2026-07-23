import { describe, expect, it } from "vitest";
import { buildGrowthSchedule } from "./growthSchedule";
import type { WheelGraph } from "./types";

function makeGrowableGraph(nodeCount: number): WheelGraph {
  const nodes = Array.from({ length: nodeCount }, (_, i) => ({
    id: `gray-${i}`,
    ring: "gray" as const,
    angle: 0,
    radiusFraction: 0.42,
    radius: 3,
    color: "#8fa098",
  }));
  const links = [];
  for (let i = 1; i < nodeCount; i += 1) {
    links.push({ id: `link-${i}`, sourceId: `gray-${i - 1}`, targetId: `gray-${i}` });
  }
  return { nodes, links };
}

describe("buildGrowthSchedule", () => {
  it("reveals every node and link exactly once, in order", () => {
    const graph = makeGrowableGraph(85);
    const schedule = buildGrowthSchedule(graph, { nodesPerBatch: 1, intervalSeconds: 2 });

    const revealedNodeIds = schedule.flatMap((batch) => batch.nodes.map((node) => node.id));
    const revealedLinkIds = schedule.flatMap((batch) => batch.links.map((link) => link.id));

    expect(revealedNodeIds).toHaveLength(graph.nodes.length);
    expect(new Set(revealedNodeIds).size).toBe(graph.nodes.length);
    expect(revealedLinkIds).toHaveLength(graph.links.length);
    expect(new Set(revealedLinkIds).size).toBe(graph.links.length);
  });

  it("reveals one node per batch, evenly spaced by the interval", () => {
    const graph = makeGrowableGraph(150);
    const schedule = buildGrowthSchedule(graph, { nodesPerBatch: 1, intervalSeconds: 2 });

    expect(schedule).toHaveLength(150);
    expect(schedule[0]?.fireAtSeconds).toBe(0);
    expect(schedule[0]?.nodes.length).toBe(1);
    expect(schedule[1]?.fireAtSeconds).toBe(2);
    expect(schedule[149]?.fireAtSeconds).toBe(298);
  });

  it("only reveals a link once both of its endpoints have been revealed", () => {
    const graph = makeGrowableGraph(150);
    const schedule = buildGrowthSchedule(graph, { nodesPerBatch: 1, intervalSeconds: 2 });

    const revealedByBatchIndex = new Map<string, number>();
    schedule.forEach((batch, index) => {
      for (const node of batch.nodes) revealedByBatchIndex.set(node.id, index);
    });

    schedule.forEach((batch, index) => {
      for (const link of batch.links) {
        expect(revealedByBatchIndex.get(link.sourceId)).toBeLessThanOrEqual(index);
        expect(revealedByBatchIndex.get(link.targetId)).toBeLessThanOrEqual(index);
      }
    });
  });
});
