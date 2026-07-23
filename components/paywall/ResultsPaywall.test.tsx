import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import ResultsPaywall from './ResultsPaywall';

describe('ResultsPaywall', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('reveals the purchase CTA after 2 minutes', async () => {
    render(<ResultsPaywall onUnlock={() => {}} />);

    expect(screen.queryByRole('button', { name: /unlock full report/i })).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    expect(screen.getByRole('button', { name: /unlock full report/i })).toBeInTheDocument();
  });

  it('shows the purchase CTA immediately when timer skip is enabled', () => {
    render(<ResultsPaywall onUnlock={() => {}} skipTimer />);
    expect(screen.getByRole('button', { name: /unlock full report/i })).toBeInTheDocument();
  });

  it('unlocks results after demo checkout completes', async () => {
    const unlockSpy = vi.fn();
    render(<ResultsPaywall onUnlock={unlockSpy} />);

    await act(async () => {
      vi.advanceTimersByTime(120_000);
    });

    fireEvent.click(screen.getByRole('button', { name: /unlock full report/i }));
    fireEvent.click(screen.getByRole('button', { name: /complete demo purchase/i }));

    expect(unlockSpy).toHaveBeenCalledTimes(1);
  });
});
