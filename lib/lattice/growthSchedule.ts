import type { WheelGraph, WheelLink, WheelNode } from "./types";

export interface GrowthBatch {
  fireAtSeconds: number;
  nodes: WheelNode[];
  links: WheelLink[];
}

export function buildGrowthSchedule(
  graph: WheelGraph,
  input: { nodesPerBatch: number; intervalSeconds: number },
): GrowthBatch[] {
  const nodesPerBatch = Math.max(1, Math.round(input.nodesPerBatch));
  const revealed = new Set<string>();
  const assignedLinkIds = new Set<string>();
  const batches: GrowthBatch[] = [];

  let batchIndex = 0;
  for (let start = 0; start < graph.nodes.length; start += nodesPerBatch, batchIndex += 1) {
    const nodesForBatch = graph.nodes.slice(start, start + nodesPerBatch);

    for (const node of nodesForBatch) revealed.add(node.id);

    const linksForBatch: WheelLink[] = [];
    for (const link of graph.links) {
      if (assignedLinkIds.has(link.id)) continue;
      if (revealed.has(link.sourceId) && revealed.has(link.targetId)) {
        linksForBatch.push(link);
        assignedLinkIds.add(link.id);
      }
    }

    batches.push({
      fireAtSeconds: batchIndex * input.intervalSeconds,
      nodes: nodesForBatch,
      links: linksForBatch,
    });
  }

  return batches;
}
