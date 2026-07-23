'use client';

// Condensed AI daily brief shown as a horizontal band under the graph (the
// single-screen layout). KPI tiles + top closers + what-the-floor-needs.
import type { BrainModel } from '@/lib/brain/types';
import { squadColor, squadName } from '@/lib/brain/data';
import { money } from '@/lib/adStage';

export default function ReportBand({ model }: { model: BrainModel }) {
  const totalRev = model.agents.reduce((a, x) => a + x.revenue, 0);
  const totalSales = model.agents.reduce((a, x) => a + x.sales, 0);
  const totalCalls = model.agents.reduce((a, x) => a + x.calls, 0);
  const top = [...model.agents].sort((a, b) => b.revenue - a.revenue).slice(0, 3);
  const owed = model.leads.filter((l) => l.outcome === 'book').length;
  const atRisk = model.leads.filter((l) => l.outcome === 'working').length;

  return (
    <div style={{ height: '100%', overflow: 'auto', background: '#f9fafb', borderTop: '1px solid #e5e7eb', padding: '16px 24px', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase', color: '#16A46C' }}>General · Daily Brief</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#111827' }}>Sales floor — live</span>
      </div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'stretch' }}>
        <div style={{ display: 'flex', gap: 12, flexShrink: 0 }}>
          <Big label="Revenue today" value={`$${totalRev.toLocaleString()}`} accent />
          <Big label="Sales" value={String(totalSales)} />
          <Big label="Calls booked" value={String(totalCalls)} />
        </div>
        <section style={{ flex: 1, minWidth: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '12px 18px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>Top closers</h2>
          {top.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
              <span style={{ width: 22, height: 22, borderRadius: 7, background: squadColor(a.squadId), color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 10, flexShrink: 0 }}>{a.initials}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#111827', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.name} <span style={{ color: '#9ca3af', fontWeight: 500 }}>· {squadName(a.squadId)}</span></span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#16A46C' }}>{money(a.revenue)}</span>
              <span style={{ fontSize: 12, color: '#6b7280', width: 52, textAlign: 'right' }}>{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'} {a.sales}</span>
            </div>
          ))}
        </section>
        <section style={{ flex: 1.3, minWidth: 0, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '12px 18px', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>What the floor needs from you</h2>
          <ul style={{ margin: 0, paddingLeft: 16, color: '#374151', fontSize: 13, lineHeight: 1.7 }}>
            <li><b>Follow-ups owed:</b> {owed} booked calls need confirmation texts before tomorrow.</li>
            <li><b>At-risk:</b> {atRisk} leads still mid-conversation past 24h — Reactivation squad is on them.</li>
            <li><b>Approve:</b> Closing squad wants to A/B a new objection script on the Core Program.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Big({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ background: accent ? '#16A46C' : '#fff', color: accent ? '#fff' : '#111827', border: accent ? 'none' : '1px solid #e5e7eb', borderRadius: 14, padding: '12px 18px', minWidth: 134, boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.4, opacity: accent ? 0.9 : 0.5 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
    </div>
  );
}
