import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DRILL_MS, PULLBACK_MS, WIDE_MS } from '@/lib/lattice/tour';
import { useTourDriver } from './useTourDriver';
import type { WheelNode } from '@/lib/lattice/types';

function fakeApp() {
  const leads: WheelNode[] = Array.from({ length: 96 }, (_, index) => ({
    id: `avatar-${index}`,
    ring: 'avatar' as const,
    zoneIndex: index % 6,
    angle: 0,
    radiusFraction: 0.86,
    radius: 6,
    color: '#000',
    leadId: index,
    closed: false,
  }));
  return {
    destroy: vi.fn(),
    focusNode: vi.fn(),
    getFocusScreenPosition: vi.fn(() => ({ x: 100, y: 100 })),
    getFocusSide: vi.fn(() => undefined),
    getFocusedLeadId: vi.fn(() => undefined),
    getLeadNodes: () => leads,
    markClosed: vi.fn(),
  };
}

describe('useTourDriver', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('opens wide with no focus, then drills into a lead', () => {
    const app = fakeApp();
    const { result } = renderHook(() => useTourDriver(app));

    expect(result.current.phase).toBe('wide');
    expect(result.current.nodeId).toBeUndefined();

    act(() => void vi.advanceTimersByTime(WIDE_MS + 10));

    expect(result.current.phase).toBe('drill');
    expect(result.current.nodeId).toBeTypeOf('string');
    expect(app.focusNode).toHaveBeenCalledWith(result.current.nodeId);
  });

  it('clears focus on pullback', () => {
    const app = fakeApp();
    const { result } = renderHook(() => useTourDriver(app));

    act(() => void vi.advanceTimersByTime(WIDE_MS + DRILL_MS + 10));

    expect(result.current.phase).toBe('pullback');
    expect(app.focusNode).toHaveBeenLastCalledWith(undefined);
  });

  it('loops back to wide after the last pullback', () => {
    const app = fakeApp();
    const { result } = renderHook(() => useTourDriver(app));
    const cycleMs = WIDE_MS + 3 * (DRILL_MS + PULLBACK_MS);

    act(() => void vi.advanceTimersByTime(cycleMs + 10));

    expect(result.current.phase).toBe('wide');
  });

  it('exposes nextLeadId while wide, but hides it once drilling', () => {
    const app = fakeApp();
    const { result } = renderHook(() => useTourDriver(app));

    expect(result.current.phase).toBe('wide');
    expect(result.current.nextLeadId).toBeTypeOf('number');

    act(() => void vi.advanceTimersByTime(WIDE_MS + 10));

    expect(result.current.phase).toBe('drill');
    expect(result.current.nextLeadId).toBeUndefined();
  });

  it('exposes nextLeadId again during pullback', () => {
    const app = fakeApp();
    const { result } = renderHook(() => useTourDriver(app));

    act(() => void vi.advanceTimersByTime(WIDE_MS + DRILL_MS + 10));

    expect(result.current.phase).toBe('pullback');
    expect(result.current.nextLeadId).toBeTypeOf('number');
  });

  it('still names the next cycle\'s first drill lead on the final pullback', () => {
    const app = fakeApp();
    const { result } = renderHook(() => useTourDriver(app));
    const finalPullbackAt = WIDE_MS + 3 * DRILL_MS + 2 * PULLBACK_MS + 10;

    act(() => void vi.advanceTimersByTime(finalPullbackAt));

    expect(result.current.phase).toBe('pullback');
    expect(result.current.nextLeadId).toBeTypeOf('number');
  });
});
