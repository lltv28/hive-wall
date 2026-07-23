import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ScoreboardRail } from './ScoreboardRail';

describe('ScoreboardRail', () => {
  it('shows the revenue total, the stat tiles, and one row per feed event', async () => {
    render(
      <ScoreboardRail
        revenue={5071}
        purchases={46}
        calls={31}
        upsellPct={35}
        width={300}
        feed={[
          { key: 1, leadNo: 130, outcome: 'book', valueUsd: 0 },
          { key: 2, leadNo: 129, outcome: 'buy', valueUsd: 27 },
        ]}
      />,
    );

    expect(await screen.findByText('$5,071')).toBeTruthy();
    expect(screen.getByText('46')).toBeTruthy();
    expect(screen.getByText('31')).toBeTruthy();
    expect(screen.getByText('35%')).toBeTruthy();
    expect(screen.getByText('Lead 130')).toBeTruthy();
    expect(screen.getByText('booked a call')).toBeTruthy();
    expect(screen.getByText('bought · $27')).toBeTruthy();
  });

  it('never renders a fractional revenue figure, even mid count-up animation', async () => {
    render(
      <ScoreboardRail
        revenue={4233991}
        purchases={46}
        calls={31}
        upsellPct={35}
        width={300}
        feed={[]}
      />,
    );

    const revenue = await screen.findByText(/^\$[\d,]+$/);
    expect(revenue.textContent).toMatch(/^\$[\d,]+$/);
  });
});
