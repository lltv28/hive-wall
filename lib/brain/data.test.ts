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
