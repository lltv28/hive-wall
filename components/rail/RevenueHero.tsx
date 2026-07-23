import { TYPE, W } from '@/lib/adStage';
import { RAIL } from './railTheme';

export function RevenueHero({ caption, value }: { caption: string; value: string }) {
  return (
    <div
      style={{
        background: RAIL.panel,
        border: `1px solid ${RAIL.border}`,
        borderRadius: RAIL.radius,
        padding: '22px 24px',
        boxShadow: RAIL.shadow,
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: `${TYPE.sm}px`,
          fontWeight: W.medium,
          letterSpacing: '2px',
          textTransform: 'uppercase',
          color: RAIL.muted,
        }}
      >
        {caption}
      </div>
      <div style={{ fontSize: '64px', fontWeight: W.semibold, color: RAIL.green, lineHeight: 1.1 }}>
        {value}
      </div>
      <div style={{ fontSize: `${TYPE.xs}px`, color: RAIL.muted, fontWeight: W.normal }}>
        Updating live
      </div>
    </div>
  );
}
