import { C, R, TYPE, W } from '@/lib/adStage';

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: R.card,
        padding: '14px 16px',
        boxShadow: C.cardShadow,
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: `${TYPE.xs}px`,
          fontWeight: W.medium,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: C.muted,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: `${TYPE.display}px`, fontWeight: W.semibold, color: C.ink }}>
        {value}
      </div>
    </div>
  );
}
