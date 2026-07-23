'use client';

type Props = {
  query: string;
  onQuery: (q: string) => void;
  live: boolean;
  onToggleLive: () => void;
};

export default function TopBar({ query, onQuery, live, onToggleLive }: Props) {
  return (
    <header style={{
      height: 60, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px', background: '#fff', borderBottom: '1px solid #e5e7eb', zIndex: 50,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ width: 34, height: 34, borderRadius: 9, background: '#111418', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18 }}>L</span>
        <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>Lucas AI</span>
        <span style={{ color: '#cbd5e1' }}>·</span>
        <span style={{ fontSize: 16, fontWeight: 600, color: '#6b7280' }}>Sales Brain</span>
      </div>
      <div style={{ flex: 1, maxWidth: 420, margin: '0 24px' }}>
        <input
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search agents, squads, tools…"
          style={{ width: '100%', boxSizing: 'border-box', height: 38, borderRadius: 10, border: '1px solid #e5e7eb', background: '#f9fafb', padding: '0 14px', fontSize: 14, color: '#111827', outline: 'none' }}
        />
      </div>
      <button
        type="button" onClick={onToggleLive}
        style={{ display: 'flex', alignItems: 'center', gap: 8, height: 38, padding: '0 16px', borderRadius: 999, cursor: 'pointer',
          border: `1px solid ${live ? 'rgba(22,164,108,0.4)' : '#e5e7eb'}`, background: live ? 'rgba(22,164,108,0.1)' : '#fff', color: live ? '#106844' : '#6b7280', fontWeight: 700, fontSize: 14 }}
      >
        <span style={{ width: 9, height: 9, borderRadius: 999, background: live ? '#16A46C' : '#9ca3af' }} className={live ? 'pulse-glow' : undefined} />
        {live ? 'Live' : 'Paused'}
      </button>
    </header>
  );
}
