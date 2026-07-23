import { TYPE, W, type FeedEvent } from '@/lib/adStage';
import { RAIL } from './railTheme';

export function Ticker({ feed }: { feed: FeedEvent[] }) {
  return (
    <div
      style={{
        background: RAIL.panel,
        border: `1px solid ${RAIL.border}`,
        borderRadius: RAIL.radius,
        padding: '18px 20px',
        boxShadow: RAIL.shadow,
        flex: 1,
        overflow: 'hidden',
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
          marginBottom: '12px',
        }}
      >
        Latest Conversions
      </div>
      {feed.map((event) => (
        <div
          key={event.key}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '9px 0',
            fontSize: `${TYPE.base}px`,
            fontWeight: W.medium,
          }}
        >
          <span style={{ color: RAIL.ink }}>{`Lead ${event.leadNo}`}</span>
          <span style={{ color: event.outcome === 'buy' ? RAIL.green : RAIL.slate }}>
            {event.outcome === 'buy' ? `bought · $${event.valueUsd}` : 'booked a call'}
          </span>
        </div>
      ))}
    </div>
  );
}
