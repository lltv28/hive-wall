import { C, R, TYPE, W, useCountUp } from '@/lib/adStage';

export function RevenueHero({ amount }: { amount: number }) {
  const shown = useCountUp(amount);
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: R.lg,
        padding: '22px 24px',
        boxShadow: C.cardShadow,
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: `${TYPE.sm}px`,
          fontWeight: W.medium,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: C.muted,
        }}
      >
        Revenue · Today
      </div>
      <div style={{ fontSize: '64px', fontWeight: W.semibold, color: C.green, lineHeight: 1.1 }}>
        {`$${Math.round(shown).toLocaleString()}`}
      </div>
      <div style={{ fontSize: `${TYPE.xs}px`, color: C.muted, fontWeight: W.normal }}>
        Updating live
      </div>
    </div>
  );
}
