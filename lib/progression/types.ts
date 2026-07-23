export type ProgressionPhase =
  | 'idle'
  | 'typing'
  | 'revealing'
  | 'waitingInput'
  | 'autoAdvancing'
  | 'completed';

export type WaitMode = 'none' | 'userAction' | 'multiSubmit' | 'phaseChange';

export type FlowNode = {
  id: string;
  kind:
    | 'message'
    | 'fitScore'
    | 'callout'
    | 'resultComponent'
    | 'offer'
    | 'quickTask'
    | 'guidedTask';
  waitMode: WaitMode;
  autoDelayMs?: number;
  payload: unknown;
};

export type ProgressionEvent =
  | { type: 'START' }
  | { type: 'TYPE_DONE' }
  | { type: 'REVEAL_DONE' }
  | { type: 'AUTO_ADVANCE' }
  | { type: 'CONTINUE' }
  | { type: 'SELECT_CHIP'; nodeId: string }
  | { type: 'SUBMIT_MULTI'; nodeId: string }
  | { type: 'BACK' }
  | { type: 'JUMP'; targetIndex: number }
  | { type: 'RESET' };

export type ProgressionSnapshot = {
  activeIndex: number;
  visibleCount: number;
  answeredId: string | null;
};

export type ProgressionState = {
  nodes: FlowNode[];
  phase: ProgressionPhase;
  activeIndex: number;
  visibleCount: number;
  waitingNodeId: string | null;
  answeredIds: Set<string>;
  history: ProgressionSnapshot[];
};
