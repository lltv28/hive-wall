import { TYPE, W, type FeedEvent } from '@/lib/adStage';
import { RAIL } from './railTheme';
import { LiveRangeSelect } from './LiveRangeSelect';
import { MiniStat } from './MiniStat';
import { RevenueHero } from './RevenueHero';
import { Ticker } from './Ticker';

export function ScoreboardRail({
  purchases,
  calls,
  upsellPct,
  feed,
  width,
}: {
  purchases: number;
  calls: number;
  upsellPct: number;
  feed: FeedEvent[];
  width: number;
}) {
  return (
    <aside
      style={{
        width: `${width}px`,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '18px',
        height: '100%',
        fontFamily: 'inherit',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <LiveRangeSelect />
        <span
          style={{
            color: RAIL.green,
            fontSize: `${TYPE.sm}px`,
            fontWeight: W.semibold,
            letterSpacing: '2px',
            textTransform: 'uppercase',
          }}
        >
          Low Ticket v1.2
        </span>
      </div>

      <RevenueHero caption="Purchases · Today" value={purchases.toLocaleString()} />

      <div style={{ display: 'flex', gap: '12px' }}>
        <MiniStat label="Calls" value={calls.toLocaleString()} />
        <MiniStat label="Upsell %" value={`${upsellPct}%`} />
      </div>

      <Ticker feed={feed} />
    </aside>
  );
}
