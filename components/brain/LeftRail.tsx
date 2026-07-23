'use client';

import type { BrainModel } from '@/lib/brain/types';

type Group = { key: string; label: string; items: { id: string; label: string; color?: string }[] };
type Props = { model: BrainModel; onSelect: (id: string) => void; selectedId: string | null };

export default function LeftRail({ model, onSelect, selectedId }: Props) {
  const groups: Group[] = [
    { key: 'agents', label: 'Agents', items: model.agents.map((a) => ({ id: a.id, label: a.name })) },
    { key: 'sub', label: 'Sub-agents', items: model.subAgents.map((s) => ({ id: s.id, label: s.name })) },
    { key: 'leads', label: 'Leads', items: model.leads.map((l) => ({ id: l.id, label: l.name })) },
    { key: 'tools', label: 'Tools', items: model.tools.map((t) => ({ id: `node:${t.id}`, label: t.name })) },
    { key: 'offers', label: 'Offers', items: model.offers.map((o) => ({ id: `node:${o.id}`, label: o.name })) },
  ];
  return (
    <aside style={{ width: 248, flexShrink: 0, background: '#fff', borderRight: '1px solid #e5e7eb', overflow: 'auto', padding: '12px 0' }}>
      <div style={{ padding: '6px 18px 10px', fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#9ca3af' }}>Sales Floor</div>
      {groups.map((g) => (
        <div key={g.key} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 18px', fontSize: 13, fontWeight: 800, color: '#374151' }}>
            <span>{g.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', background: '#f3f4f6', borderRadius: 999, padding: '1px 8px' }}>{g.items.length}</span>
          </div>
          {g.items.slice(0, 6).map((it) => (
            <button key={it.id} type="button" onClick={() => onSelect(it.id)} style={{ display: 'block', width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', background: it.id === selectedId ? '#f1f5f9' : 'transparent', padding: '7px 18px 7px 26px', fontSize: 13, color: '#4b5563' }}>{it.label}</button>
          ))}
          {g.items.length > 6 && <div style={{ padding: '4px 18px 4px 26px', fontSize: 12, color: '#9ca3af' }}>+{g.items.length - 6} more</div>}
        </div>
      ))}
    </aside>
  );
}
