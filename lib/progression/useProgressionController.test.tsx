import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useProgressionController } from './useProgressionController';
import type { FlowNode } from './types';

const nodes: FlowNode[] = [
  { id: 'a', kind: 'message', waitMode: 'none', payload: { content: 'Hello' } },
  { id: 'b', kind: 'message', waitMode: 'userAction', payload: { content: 'Pick one' } },
];

describe('useProgressionController', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('starts and reaches waitingInput for a userAction node', () => {
    const { result } = renderHook(() =>
      useProgressionController({ nodes, scrollMode: 'top' }),
    );

    act(() => {
      result.current.dispatch({ type: 'START' });
    });

    expect(result.current.phase).toBe('typing');
    expect(result.current.activeNodeId).toBe('a');

    act(() => {
      result.current.dispatch({ type: 'TYPE_DONE' });
      result.current.dispatch({ type: 'REVEAL_DONE' });
      result.current.dispatch({ type: 'AUTO_ADVANCE' });
      result.current.dispatch({ type: 'TYPE_DONE' });
      result.current.dispatch({ type: 'REVEAL_DONE' });
    });

    expect(result.current.phase).toBe('waitingInput');
    expect(result.current.activeNodeId).toBe('b');
    expect(result.current.waitingNodeId).toBe('b');
    expect(result.current.visibleNodes.map((node) => node.id)).toEqual(['a', 'b']);
    expect([...result.current.answeredIds]).toEqual([]);
  });

  it('updates container scroll when an active element is bound', () => {
    const { result } = renderHook(() =>
      useProgressionController({ nodes, scrollMode: 'top' }),
    );

    const container = document.createElement('div');
    const activeElement = document.createElement('div');

    Object.defineProperty(container, 'clientHeight', { configurable: true, value: 400 });
    Object.defineProperty(container, 'scrollHeight', { configurable: true, value: 1000 });
    container.scrollTop = 0;
    container.getBoundingClientRect = () =>
      ({
        top: 100,
        height: 400,
      } as DOMRect);

    activeElement.getBoundingClientRect = () =>
      ({
        top: 500,
        height: 200,
      } as DOMRect);

    act(() => {
      result.current.bindings.setScrollContainer(container);
      result.current.bindings.setActiveElement(activeElement);
      result.current.dispatch({ type: 'START' });
    });

    expect(container.scrollTop).toBe(384);
  });

  it('cleans timers on RESET', () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      useProgressionController({ nodes, scrollMode: 'top' }),
    );

    act(() => {
      result.current.dispatch({ type: 'START' });
    });

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    act(() => {
      result.current.dispatch({ type: 'RESET' });
    });

    expect(result.current.phase).toBe('idle');
    expect(vi.getTimerCount()).toBe(0);

    act(() => {
      vi.runAllTimers();
    });

    expect(result.current.phase).toBe('idle');
  });

  it('cleans timers on unmount', () => {
    vi.useFakeTimers();

    const { result, unmount } = renderHook(() =>
      useProgressionController({ nodes, scrollMode: 'top' }),
    );

    act(() => {
      result.current.dispatch({ type: 'START' });
    });

    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});
