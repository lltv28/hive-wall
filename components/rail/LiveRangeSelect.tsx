import { TYPE, W } from '@/lib/adStage';
import { RAIL } from './railTheme';

export function LiveRangeSelect() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: RAIL.panel,
        border: `1px solid ${RAIL.border}`,
        borderRadius: RAIL.radiusSm,
        padding: '8px 14px',
        boxShadow: RAIL.shadow,
        fontFamily: 'inherit',
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: RAIL.green,
          display: 'inline-block',
        }}
      />
      <span style={{ fontSize: `${TYPE.xs}px`, fontWeight: W.semibold, color: RAIL.ink }}>LIVE</span>
      <span style={{ fontSize: `${TYPE.xs}px`, fontWeight: W.medium, color: RAIL.muted }}>TODAY</span>
    </div>
  );
}
