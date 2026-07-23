import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreboardRail } from './ScoreboardRail';

describe('ScoreboardRail', () => {
  it('leads with the purchases hero, shows the stat tiles, and one row per feed event', async () => {
    render(
      <ScoreboardRail
        purchases={46}
        calls={31}
        upsellPct={35}
        width={360}
        feed={[
          { key: 1, leadNo: 130, outcome: 'book', valueUsd: 0 },
          { key: 2, leadNo: 129, outcome: 'buy', valueUsd: 27 },
        ]}
      />,
    );
    expect(await screen.findByText(/purchases/i)).toBeTruthy(); // hero caption
    expect(screen.getByText('46')).toBeTruthy();  // purchases hero value
    expect(screen.getByText('31')).toBeTruthy();  // calls tile
    expect(screen.getByText('35%')).toBeTruthy(); // upsell tile
    expect(screen.getByText('Lead 130')).toBeTruthy();
    expect(screen.getByText('booked a call')).toBeTruthy();
    expect(screen.getByText('bought · $27')).toBeTruthy();
  });
});
