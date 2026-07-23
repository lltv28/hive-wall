import { describe, expect, it, vi } from 'vitest';
import { computeTypingDelayMs, createTransitionScheduler } from './scheduler';

describe('computeTypingDelayMs', () => {
  it('returns a deterministic delay for the same input', () => {
    const pace = { min: 700, max: 1100, charsPerSecond: 60, settleMs: 400 };

    expect(computeTypingDelayMs('abc', pace)).toBe(computeTypingDelayMs('abc', pace));
  });

  it('clamps short text to the minimum delay', () => {
    expect(computeTypingDelayMs('abc', { min: 700, max: 1100, charsPerSecond: 60, settleMs: 400 })).toBe(700);
  });

  it('clamps long text to the maximum delay', () => {
    expect(computeTypingDelayMs('x'.repeat(500), { min: 700, max: 1100, charsPerSecond: 60, settleMs: 400 })).toBe(1100);
  });
});

describe('createTransitionScheduler', () => {
  it('cancels the previous timer for the same key', () => {
    const clearTimer = vi.fn();
    const scheduler = createTransitionScheduler(clearTimer);

    scheduler.schedule('typing', () => {}, 1000);
    scheduler.schedule('typing', () => {}, 1000);

    expect(clearTimer).toHaveBeenCalledTimes(1);
  });

  it('runs scheduled work and removes the timer entry', () => {
    vi.useFakeTimers();
    const clearTimer = vi.fn();
    const scheduler = createTransitionScheduler(clearTimer);
    const fn = vi.fn();

    scheduler.schedule('typing', fn, 1000);
    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(clearTimer).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('cancels all scheduled timers', () => {
    const clearTimer = vi.fn();
    const scheduler = createTransitionScheduler(clearTimer);

    scheduler.schedule('typing', () => {}, 1000);
    scheduler.schedule('reveal', () => {}, 1200);
    scheduler.cancelAll();

    expect(clearTimer).toHaveBeenCalledTimes(2);
  });
});
