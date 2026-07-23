import { C, R, TYPE, W, type FeedEvent } from '@/lib/adStage';

export function Ticker({ feed }: { feed: FeedEvent[] }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: R.lg,
        padding: '18px 20px',
        boxShadow: C.cardShadow,
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
          color: C.muted,
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
          <span style={{ color: C.ink }}>{`Lead ${event.leadNo}`}</span>
          <span style={{ color: event.outcome === 'buy' ? C.green : C.slate }}>
            {event.outcome === 'buy' ? `bought · $${event.valueUsd}` : 'booked a call'}
          </span>
        </div>
      ))}
    </div>
  );
}
