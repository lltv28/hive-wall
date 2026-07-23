import { describe, expect, it } from 'vitest';

import { createInitialProgressionState, progressionReducer } from './reducer';
import type { FlowNode } from './types';

const nodes: FlowNode[] = [
  {
    id: 'n1',
    kind: 'message',
    waitMode: 'none',
    payload: { content: 'A' },
  },
  {
    id: 'n2',
    kind: 'message',
    waitMode: 'userAction',
    payload: { content: 'B' },
  },
];

describe('progressionReducer', () => {
  it('enters typing on START', () => {
    const state = createInitialProgressionState(nodes);
    const next = progressionReducer(state, { type: 'START' });

    expect(next.phase).toBe('typing');
    expect(next.activeIndex).toBe(0);
  });

  it('enters waitingInput when revealed node requires input', () => {
    let state = createInitialProgressionState(nodes);
    state = progressionReducer(state, { type: 'START' });
    state = progressionReducer(state, { type: 'TYPE_DONE' });
    state = progressionReducer(state, { type: 'REVEAL_DONE' });
    state = progressionReducer(state, { type: 'AUTO_ADVANCE' });
    state = progressionReducer(state, { type: 'TYPE_DONE' });
    state = progressionReducer(state, { type: 'REVEAL_DONE' });

    expect(state.phase).toBe('waitingInput');
    expect(state.waitingNodeId).toBe('n2');
  });
});
