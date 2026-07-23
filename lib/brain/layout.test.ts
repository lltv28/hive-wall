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
