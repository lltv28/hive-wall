import { TYPE, W } from '@/lib/adStage';
import { RAIL } from './railTheme';

export function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: RAIL.panel,
        border: `1px solid ${RAIL.border}`,
        borderRadius: RAIL.radiusSm,
        padding: '14px 16px',
        boxShadow: RAIL.shadow,
        fontFamily: 'inherit',
      }}
    >
      <div
        style={{
          fontSize: `${TYPE.xs}px`,
          fontWeight: W.medium,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          color: RAIL.muted,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: `${TYPE.display}px`, fontWeight: W.semibold, color: RAIL.ink }}>
        {value}
      </div>
    </div>
  );
}
