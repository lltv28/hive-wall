import { C, R, TYPE, W } from '@/lib/adStage';

export function LiveRangeSelect() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: R.sm,
        padding: '8px 14px',
        boxShadow: C.cardShadow,
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: C.green,
          display: 'inline-block',
        }}
      />
      <span style={{ fontSize: `${TYPE.xs}px`, fontWeight: W.semibold, color: C.ink }}>LIVE</span>
      <span style={{ fontSize: `${TYPE.xs}px`, fontWeight: W.medium, color: C.muted }}>TODAY</span>
    </div>
  );
}
