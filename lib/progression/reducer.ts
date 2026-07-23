import type {
  FlowNode,
  ProgressionEvent,
  ProgressionSnapshot,
  ProgressionState,
  WaitMode,
} from './types';

function isWaitModeThatRequiresInput(waitMode: WaitMode) {
  return waitMode === 'userAction' || waitMode === 'multiSubmit' || waitMode === 'phaseChange';
}

function cloneAnsweredIds(answeredIds: Set<string>) {
  return new Set(answeredIds);
}

function snapshotCurrent(state: ProgressionState, answeredId: string | null): ProgressionSnapshot {
  return {
    activeIndex: state.activeIndex,
    visibleCount: state.visibleCount,
    answeredId,
  };
}

function nextIndex(state: ProgressionState) {
  return state.activeIndex + 1;
}

export function createInitialProgressionState(nodes: FlowNode[]): ProgressionState {
  return {
    nodes,
    phase: 'idle',
    activeIndex: 0,
    visibleCount: 0,
    waitingNodeId: null,
    answeredIds: new Set<string>(),
    history: [],
  };
}

export function progressionReducer(
  state: ProgressionState,
  event: ProgressionEvent,
): ProgressionState {
  switch (event.type) {
    case 'START': {
      if (state.nodes.length === 0) {
        return {
          ...state,
          phase: 'completed',
          activeIndex: 0,
          visibleCount: 0,
          waitingNodeId: null,
        };
      }

      return {
        ...state,
        phase: 'typing',
        activeIndex: 0,
        visibleCount: 0,
        waitingNodeId: null,
        answeredIds: new Set<string>(),
        history: [],
      };
    }

    case 'TYPE_DONE':
      if (state.phase !== 'typing') return state;
      return { ...state, phase: 'revealing' };

    case 'REVEAL_DONE': {
      if (state.phase !== 'revealing') return state;

      const node = state.nodes[state.activeIndex];
      const visibleCount = Math.max(state.visibleCount, state.activeIndex + 1);

      if (!node) {
        return {
          ...state,
          phase: 'completed',
          visibleCount,
        };
      }

      if (isWaitModeThatRequiresInput(node.waitMode)) {
        return {
          ...state,
          phase: 'waitingInput',
          waitingNodeId: node.id,
          visibleCount,
        };
      }

      return {
        ...state,
        phase: 'autoAdvancing',
        waitingNodeId: null,
        visibleCount,
      };
    }

    case 'AUTO_ADVANCE': {
      if (state.phase !== 'autoAdvancing') return state;

      const index = nextIndex(state);
      if (index >= state.nodes.length) {
        return {
          ...state,
          phase: 'completed',
          activeIndex: state.nodes.length,
        };
      }

      return {
        ...state,
        phase: 'typing',
        activeIndex: index,
        waitingNodeId: null,
      };
    }

    case 'CONTINUE':
    case 'SELECT_CHIP':
    case 'SUBMIT_MULTI': {
      if (state.phase !== 'waitingInput') return state;

      const answeredId =
        event.type === 'CONTINUE'
          ? state.waitingNodeId
          : event.nodeId;

      const answeredIds = cloneAnsweredIds(state.answeredIds);
      if (answeredId) answeredIds.add(answeredId);

      const history = [...state.history, snapshotCurrent(state, answeredId ?? null)];
      const index = nextIndex(state);

      if (index >= state.nodes.length) {
        return {
          ...state,
          phase: 'completed',
          answeredIds,
          history,
          waitingNodeId: null,
          activeIndex: state.nodes.length,
          visibleCount: Math.max(state.visibleCount, state.activeIndex + 1),
        };
      }

      return {
        ...state,
        phase: 'typing',
        activeIndex: index,
        waitingNodeId: null,
        answeredIds,
        history,
      };
    }

    case 'BACK': {
      if (state.history.length === 0) return state;

      const last = state.history[state.history.length - 1];
      const answeredIds = cloneAnsweredIds(state.answeredIds);
      if (last.answeredId) answeredIds.delete(last.answeredId);

      return {
        ...state,
        phase: 'waitingInput',
        activeIndex: last.activeIndex,
        visibleCount: last.visibleCount,
        waitingNodeId: state.nodes[last.activeIndex]?.id ?? null,
        answeredIds,
        history: state.history.slice(0, -1),
      };
    }

    case 'JUMP': {
      const target = Math.max(0, Math.min(event.targetIndex, state.nodes.length));

      if (target >= state.nodes.length) {
        return {
          ...state,
          phase: 'completed',
          activeIndex: state.nodes.length,
          visibleCount: state.nodes.length,
          waitingNodeId: null,
          answeredIds: new Set<string>(),
          history: [],
        };
      }

      return {
        ...state,
        phase: 'typing',
        activeIndex: target,
        visibleCount: target,
        waitingNodeId: null,
        answeredIds: new Set<string>(),
        history: [],
      };
    }

    case 'RESET':
      return createInitialProgressionState(state.nodes);

    default:
      return state;
  }
}
