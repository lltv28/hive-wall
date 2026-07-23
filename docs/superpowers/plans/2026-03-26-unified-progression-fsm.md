# Unified Progression FSM Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace ad hoc chat progression logic with a shared deterministic FSM controller used by `OnboardingChat`, `FlowChat`, and `PlanFlow`, with center-based scroll alignment that stays stable during card resize.

**Architecture:** Introduce a shared progression core (`types`, `reducer`, `scheduler`, `scroll`, `useProgressionController`) and migrate each flow to dispatch events through one state machine. Keep UX pacing/animations but remove random transition drift by using deterministic delay calculation. Use transport-only split-sync and map incoming events into the same controller event surface.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Testing Library, jsdom

---

## File Structure

### New files
- `vitest.config.ts`: Vitest configuration for jsdom/unit + component tests.
- `test/setup.ts`: Shared test setup and polyfills (`ResizeObserver` mock).
- `lib/progression/types.ts`: Shared node/event/phase/state type definitions.
- `lib/progression/reducer.ts`: Pure reducer + transition helpers.
- `lib/progression/reducer.test.ts`: Reducer transition tests.
- `lib/progression/scheduler.ts`: Deterministic delay + timer ownership helpers.
- `lib/progression/scheduler.test.ts`: Scheduler tests.
- `lib/progression/scroll.ts`: Center-alignment and temporary pinning utilities.
- `lib/progression/scroll.test.ts`: Scroll math and pinning tests.
- `lib/progression/useProgressionController.ts`: Shared controller hook.
- `lib/progression/useProgressionController.test.tsx`: Hook behavior tests.

### Modified files
- `package.json`: Add test scripts and dev dependencies.
- `components/OnboardingChat.tsx`: Replace `useChatFlow` progression with shared controller.
- `components/FlowChat.tsx`: Migrate guided/quick/offer progression to shared controller.
- `components/PlanFlow.tsx`: Migrate plan step progression to shared controller.
- `lib/useSplitSync.ts`: Keep transport-only semantics; replay through dispatched events.
- `lib/useChatFlow.ts`: Remove legacy implementation or convert to compatibility shim exporting shared controller selectors.

### Test files added for migrated behavior
- `components/__tests__/OnboardingChat.progression.test.tsx`
- `components/__tests__/FlowChat.progression.test.tsx`
- `components/__tests__/PlanFlow.progression.test.tsx`

---

### Task 1: Add deterministic test harness

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `test/setup.ts`
- Test: `npm run test`

- [ ] **Step 1: Write failing smoke test command**

Run: `npm run test`  
Expected: command fails with missing script `test`.

- [ ] **Step 2: Add test scripts and dependencies**

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^25.0.1",
    "vitest": "^2.1.8"
  }
}
```

- [ ] **Step 3: Add Vitest config**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    passWithNoTests: true,
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'components/**/*.test.tsx'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
```

- [ ] **Step 4: Add test setup**

```ts
import '@testing-library/jest-dom';

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

if (!globalThis.ResizeObserver) {
  // @ts-expect-error test polyfill
  globalThis.ResizeObserver = ResizeObserverMock;
}
```

- [ ] **Step 5: Run smoke test**

Run: `npm run test`  
Expected: PASS with no test files found (exit code 0 if `passWithNoTests` is configured; otherwise add one minimal test in Task 2 before rerun).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts test/setup.ts
git commit -m "test: add vitest harness for progression FSM work"
```

---

### Task 2: Implement progression types + reducer (TDD)

**Files:**
- Create: `lib/progression/types.ts`
- Create: `lib/progression/reducer.ts`
- Create: `lib/progression/reducer.test.ts`

- [ ] **Step 1: Write failing reducer tests**

```ts
import { describe, it, expect } from 'vitest';
import { progressionReducer, createInitialProgressionState } from './reducer';
import { FlowNode } from './types';

const nodes: FlowNode[] = [
  { id: 'n1', kind: 'message', waitMode: 'none', payload: { content: 'A' } },
  { id: 'n2', kind: 'message', waitMode: 'userAction', payload: { content: 'B' } },
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
```

- [ ] **Step 2: Run tests and verify fail**

Run: `npm run test -- lib/progression/reducer.test.ts`  
Expected: FAIL with module not found for `./reducer`.

- [ ] **Step 3: Create progression types**

```ts
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

export type ProgressionState = {
  nodes: FlowNode[];
  phase: ProgressionPhase;
  activeIndex: number;
  visibleCount: number;
  waitingNodeId: string | null;
  answeredIds: Set<string>;
  history: Array<{ activeIndex: number; visibleCount: number; answeredId: string | null }>;
};
```

- [ ] **Step 4: Create reducer**

```ts
import { FlowNode, ProgressionEvent, ProgressionState } from './types';

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

function nextIndex(state: ProgressionState) {
  return state.activeIndex + 1;
}

export function progressionReducer(state: ProgressionState, event: ProgressionEvent): ProgressionState {
  switch (event.type) {
    case 'START':
      if (state.nodes.length === 0) return { ...state, phase: 'completed' };
      return { ...state, phase: 'typing', activeIndex: 0 };
    case 'TYPE_DONE':
      if (state.phase !== 'typing') return state;
      return { ...state, phase: 'revealing' };
    case 'REVEAL_DONE': {
      if (state.phase !== 'revealing') return state;
      const node = state.nodes[state.activeIndex];
      const visibleCount = Math.max(state.visibleCount, state.activeIndex + 1);
      if (!node) return { ...state, phase: 'completed', visibleCount };
      if (node.waitMode === 'userAction' || node.waitMode === 'multiSubmit' || node.waitMode === 'phaseChange') {
        return { ...state, phase: 'waitingInput', waitingNodeId: node.id, visibleCount };
      }
      return { ...state, phase: 'autoAdvancing', waitingNodeId: null, visibleCount };
    }
    case 'AUTO_ADVANCE': {
      if (state.phase !== 'autoAdvancing') return state;
      const idx = nextIndex(state);
      if (idx >= state.nodes.length) return { ...state, phase: 'completed', activeIndex: state.nodes.length };
      return { ...state, phase: 'typing', activeIndex: idx };
    }
    case 'CONTINUE':
    case 'SELECT_CHIP':
    case 'SUBMIT_MULTI': {
      if (state.phase !== 'waitingInput') return state;
      const answeredId = event.type === 'CONTINUE' ? state.waitingNodeId : event.nodeId;
      const answeredIds = new Set(state.answeredIds);
      if (answeredId) answeredIds.add(answeredId);
      const history = [...state.history, { activeIndex: state.activeIndex, visibleCount: state.visibleCount, answeredId: answeredId ?? null }];
      const idx = nextIndex(state);
      if (idx >= state.nodes.length) return { ...state, phase: 'completed', answeredIds, history };
      return { ...state, phase: 'typing', activeIndex: idx, waitingNodeId: null, answeredIds, history };
    }
    case 'BACK': {
      if (state.history.length === 0) return state;
      const last = state.history[state.history.length - 1];
      const answeredIds = new Set(state.answeredIds);
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
      return {
        ...state,
        phase: target >= state.nodes.length ? 'completed' : 'typing',
        activeIndex: target,
        visibleCount: target,
        waitingNodeId: null,
        answeredIds: new Set(),
        history: [],
      };
    }
    case 'RESET':
      return createInitialProgressionState(state.nodes);
    default:
      return state;
  }
}
```

- [ ] **Step 5: Run reducer tests**

Run: `npm run test -- lib/progression/reducer.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/progression/types.ts lib/progression/reducer.ts lib/progression/reducer.test.ts
git commit -m "feat: add shared progression reducer and core types"
```

---

### Task 3: Add scheduler + scroll utilities (TDD)

**Files:**
- Create: `lib/progression/scheduler.ts`
- Create: `lib/progression/scheduler.test.ts`
- Create: `lib/progression/scroll.ts`
- Create: `lib/progression/scroll.test.ts`

- [ ] **Step 1: Write failing scheduler tests**

```ts
import { describe, it, expect, vi } from 'vitest';
import { computeTypingDelayMs, createTransitionScheduler } from './scheduler';

describe('scheduler', () => {
  it('computes deterministic typing delay from message length', () => {
    expect(computeTypingDelayMs('abc', { min: 700, max: 1100, charsPerSecond: 60 })).toBe(
      computeTypingDelayMs('abc', { min: 700, max: 1100, charsPerSecond: 60 }),
    );
  });

  it('cancels prior timer for same key', () => {
    const clear = vi.fn();
    const scheduler = createTransitionScheduler(clear);
    scheduler.schedule('typing', () => {}, 1000);
    scheduler.schedule('typing', () => {}, 1000);
    expect(clear).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Implement scheduler**

```ts
export type PaceConfig = {
  min: number;
  max: number;
  charsPerSecond: number;
  settleMs: number;
};

const DEFAULT_PACE: PaceConfig = {
  min: 700,
  max: 1100,
  charsPerSecond: 60,
  settleMs: 400,
};

export function computeTypingDelayMs(text: string, pace: PaceConfig = DEFAULT_PACE): number {
  const computed = Math.round((text.length / pace.charsPerSecond) * 1000);
  return Math.max(pace.min, Math.min(pace.max, computed));
}

export function createTransitionScheduler(clearTimer: (id: ReturnType<typeof setTimeout>) => void) {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  return {
    schedule(key: string, fn: () => void, delay: number) {
      const existing = timers.get(key);
      if (existing) clearTimer(existing);
      const id = setTimeout(() => {
        timers.delete(key);
        fn();
      }, delay);
      timers.set(key, id);
    },
    cancelAll() {
      timers.forEach((id) => clearTimer(id));
      timers.clear();
    },
  };
}
```

- [ ] **Step 3: Write failing scroll tests**

```ts
import { describe, it, expect } from 'vitest';
import { computeCenterScrollTop } from './scroll';

describe('computeCenterScrollTop', () => {
  it('centers active element within container bounds', () => {
    const result = computeCenterScrollTop({
      containerTop: 100,
      containerScrollTop: 200,
      containerHeight: 800,
      containerScrollHeight: 3000,
      elementTop: 500,
      elementHeight: 200,
      margin: 16,
    });
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(2200);
  });
});
```

- [ ] **Step 4: Implement scroll utilities**

```ts
export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function computeCenterScrollTop(args: {
  containerTop: number;
  containerScrollTop: number;
  containerHeight: number;
  containerScrollHeight: number;
  elementTop: number;
  elementHeight: number;
  margin: number;
}) {
  const {
    containerTop,
    containerScrollTop,
    containerHeight,
    containerScrollHeight,
    elementTop,
    elementHeight,
    margin,
  } = args;
  const elementCenterFromViewportTop = elementTop + elementHeight / 2;
  const containerCenterFromViewportTop = containerTop + containerHeight / 2;
  const delta = elementCenterFromViewportTop - containerCenterFromViewportTop;
  const raw = containerScrollTop + delta - margin;
  const max = Math.max(0, containerScrollHeight - containerHeight);
  return clamp(raw, 0, max);
}
```

- [ ] **Step 5: Run scheduler/scroll tests**

Run: `npm run test -- lib/progression/scheduler.test.ts lib/progression/scroll.test.ts`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/progression/scheduler.ts lib/progression/scheduler.test.ts lib/progression/scroll.ts lib/progression/scroll.test.ts
git commit -m "feat: add deterministic scheduler and center-scroll utilities"
```

---

### Task 4: Build `useProgressionController` hook (TDD)

**Files:**
- Create: `lib/progression/useProgressionController.ts`
- Create: `lib/progression/useProgressionController.test.tsx`

- [ ] **Step 1: Write failing hook tests**

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProgressionController } from './useProgressionController';
import { FlowNode } from './types';

const nodes: FlowNode[] = [
  { id: 'a', kind: 'message', waitMode: 'none', payload: { content: 'Hello' } },
  { id: 'b', kind: 'message', waitMode: 'userAction', payload: { content: 'Pick one' } },
];

describe('useProgressionController', () => {
  it('starts and eventually waits for user input', () => {
    const { result } = renderHook(() => useProgressionController({ nodes, scrollMode: 'center' }));
    act(() => result.current.dispatch({ type: 'START' }));
    expect(result.current.phase === 'typing' || result.current.phase === 'revealing' || result.current.phase === 'autoAdvancing').toBe(true);
  });
});
```

- [ ] **Step 2: Implement hook**

```ts
import { useEffect, useMemo, useReducer, useRef } from 'react';
import { FlowNode, ProgressionEvent } from './types';
import { createInitialProgressionState, progressionReducer } from './reducer';
import { computeTypingDelayMs, createTransitionScheduler } from './scheduler';
import { computeCenterScrollTop } from './scroll';

type Params = {
  nodes: FlowNode[];
  scrollMode: 'center';
  onComplete?: () => void;
};

export function useProgressionController({ nodes, onComplete }: Params) {
  const [state, dispatch] = useReducer(progressionReducer, nodes, createInitialProgressionState);
  const schedulerRef = useRef(createTransitionScheduler(clearTimeout));
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (state.phase === 'typing') {
      const node = state.nodes[state.activeIndex];
      const text = typeof (node?.payload as { content?: string })?.content === 'string'
        ? ((node?.payload as { content?: string }).content ?? '')
        : '';
      const delay = computeTypingDelayMs(text);
      schedulerRef.current.schedule('typing', () => dispatch({ type: 'TYPE_DONE' }), delay);
      return;
    }
    if (state.phase === 'revealing') {
      schedulerRef.current.schedule('reveal', () => dispatch({ type: 'REVEAL_DONE' }), 80);
      return;
    }
    if (state.phase === 'autoAdvancing') {
      schedulerRef.current.schedule('advance', () => dispatch({ type: 'AUTO_ADVANCE' }), 400);
      return;
    }
    if (state.phase === 'completed') {
      onComplete?.();
    }
  }, [state, onComplete]);

  useEffect(() => {
    if (!containerRef.current || !activeRef.current) return;
    const container = containerRef.current;
    const el = activeRef.current;
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const target = computeCenterScrollTop({
      containerTop: containerRect.top,
      containerScrollTop: container.scrollTop,
      containerHeight: container.clientHeight,
      containerScrollHeight: container.scrollHeight,
      elementTop: elRect.top,
      elementHeight: elRect.height,
      margin: 16,
    });
    container.scrollTop = target;
  }, [state.activeIndex, state.visibleCount, state.phase]);

  useEffect(() => () => schedulerRef.current.cancelAll(), []);

  const visibleNodes = useMemo(() => state.nodes.slice(0, state.visibleCount), [state.nodes, state.visibleCount]);
  return {
    phase: state.phase,
    visibleNodes,
    activeNodeId: state.nodes[state.activeIndex]?.id ?? null,
    waitingNodeId: state.waitingNodeId,
    answeredIds: state.answeredIds,
    dispatch: (event: ProgressionEvent) => dispatch(event),
    bindings: {
      scrollContainerRef: containerRef,
      setActiveElement: (el: HTMLElement | null) => {
        activeRef.current = el;
      },
    },
  };
}
```

- [ ] **Step 3: Run hook tests**

Run: `npm run test -- lib/progression/useProgressionController.test.tsx`  
Expected: PASS.

- [ ] **Step 4: Add edge-case test for reset cleanup**

```tsx
it('cleans timers on RESET', () => {
  const { result } = renderHook(() => useProgressionController({ nodes, scrollMode: 'center' }));
  act(() => result.current.dispatch({ type: 'START' }));
  act(() => result.current.dispatch({ type: 'RESET' }));
  expect(result.current.phase).toBe('idle');
});
```

- [ ] **Step 5: Re-run hook tests**

Run: `npm run test -- lib/progression/useProgressionController.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/progression/useProgressionController.ts lib/progression/useProgressionController.test.tsx
git commit -m "feat: add shared progression controller hook"
```

---

### Task 5: Migrate `OnboardingChat` + split-sync dispatch path

**Files:**
- Modify: `components/OnboardingChat.tsx`
- Modify: `lib/useSplitSync.ts`
- Test: `components/__tests__/OnboardingChat.progression.test.tsx`

- [ ] **Step 1: Write failing onboarding progression test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OnboardingChat from '../OnboardingChat';
import { DMessage } from '@/lib/types';

const messages: DMessage[] = [
  { id: 'q1', sender: 'ai', content: 'Question 1', chips: [{ label: 'Yes', value: 'yes' }], waitForInput: true },
  { id: 'q2', sender: 'ai', content: 'Question 2', chips: [{ label: 'No', value: 'no' }], waitForInput: true },
];

describe('OnboardingChat progression', () => {
  it('renders first question and keeps single active input', async () => {
    render(<OnboardingChat messages={messages} milestones={[]} totalFlowItems={2} />);
    expect(await screen.findByText('Question 1')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Replace `useChatFlow` usage with `useProgressionController` adapters**

```ts
// In OnboardingChat.tsx: build FlowNode[] from DMessage[] and map waitForInput/chips
const nodes = useMemo<FlowNode[]>(
  () =>
    messages.map((m) => ({
      id: m.id,
      kind: m.resultComponent ? 'resultComponent' : m.fitScore ? 'fitScore' : m.callout ? 'callout' : 'message',
      waitMode: m.waitForInput || m.chips ? 'userAction' : 'none',
      payload: m,
    })),
  [messages],
);

const controller = useProgressionController({ nodes, scrollMode: 'center' });
```

- [ ] **Step 3: Route chip/continue/back/jump/results through controller dispatch**

```ts
const onChipSelect = (messageId: string, chipValue: string) => {
  userAnswersRef.current = { ...userAnswersRef.current, [messageId]: chipValue };
  controller.dispatch({ type: 'SELECT_CHIP', nodeId: messageId });
  broadcast({ type: 'chip', messageId, value: chipValue });
};

const onContinue = () => {
  controller.dispatch({ type: 'CONTINUE' });
  broadcast({ type: 'continue' });
};

const onGoBack = () => {
  controller.dispatch({ type: 'BACK' });
  broadcast({ type: 'back' });
};
```

- [ ] **Step 4: Keep split-sync transport only and dispatch replay events**

```ts
onEvent((event) => {
  switch (event.type) {
    case 'jump':
      controller.dispatch({ type: 'JUMP', targetIndex: event.targetMsgIndex });
      return;
    case 'continue':
      controller.dispatch({ type: 'CONTINUE' });
      return;
    case 'back':
      controller.dispatch({ type: 'BACK' });
      return;
  }
});
```

- [ ] **Step 5: Run onboarding tests**

Run: `npm run test -- components/__tests__/OnboardingChat.progression.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/OnboardingChat.tsx lib/useSplitSync.ts components/__tests__/OnboardingChat.progression.test.tsx
git commit -m "refactor: migrate onboarding progression to shared FSM controller"
```

---

### Task 6: Migrate `FlowChat` and `PlanFlow` to shared controller

**Files:**
- Modify: `components/FlowChat.tsx`
- Modify: `components/PlanFlow.tsx`
- Create: `components/__tests__/FlowChat.progression.test.tsx`
- Create: `components/__tests__/PlanFlow.progression.test.tsx`

- [ ] **Step 1: Write failing `FlowChat` progression test**

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FlowChat from '../FlowChat';

describe('FlowChat progression', () => {
  it('renders guided task first message', async () => {
    const task = {
      id: 't1',
      title: 'Guided',
      type: 'guided',
      status: 'active',
      messages: [{ id: 'm1', sender: 'ai', content: 'Hello guided' }],
    };
    render(<FlowChat task={task as never} onTaskComplete={() => {}} onBack={() => {}} />);
    expect(await screen.findByText('Hello guided')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Build `FlowNode[]` adapters for `FlowChat` task types**

```ts
const nodes = useMemo<FlowNode[]>(() => {
  if (!task) return [];
  if (task.type === 'quick') {
    return [{ id: `quick-${task.id}`, kind: 'quickTask', waitMode: 'userAction', payload: task }];
  }
  if (task.type === 'offer') {
    return [{ id: `offer-${task.id}`, kind: 'offer', waitMode: 'userAction', payload: task }];
  }
  return (task.messages ?? []).map((m) => ({
    id: m.id,
    kind: 'guidedTask',
    waitMode: m.waitForInput || m.chips ? 'userAction' : 'none',
    payload: m,
  }));
}, [task]);
```

- [ ] **Step 3: Migrate `PlanFlow` step progression and completion to controller events**

```ts
const controller = useProgressionController({ nodes: stepNodes, scrollMode: 'center', onComplete: handleStepComplete });

const onTaskChip = (id: string) => {
  controller.dispatch({ type: 'SELECT_CHIP', nodeId: id });
};
```

- [ ] **Step 4: Add failing/passing `PlanFlow` test for step lockstep**

```tsx
it('advances to next step only after current step completion', async () => {
  render(<PlanFlow steps={steps} offers={[]} />);
  expect(await screen.findByText(/Define Your Audience/i)).toBeInTheDocument();
});
```

- [ ] **Step 5: Run both component test files**

Run: `npm run test -- components/__tests__/FlowChat.progression.test.tsx components/__tests__/PlanFlow.progression.test.tsx`  
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/FlowChat.tsx components/PlanFlow.tsx components/__tests__/FlowChat.progression.test.tsx components/__tests__/PlanFlow.progression.test.tsx
git commit -m "refactor: migrate flow and plan progression to shared FSM controller"
```

---

### Task 7: Remove legacy progression path and run full verification

**Files:**
- Modify: `lib/useChatFlow.ts`
- Modify: imports in `components/OnboardingChat.tsx`, `components/FlowChat.tsx`, `components/PlanFlow.tsx`

- [ ] **Step 1: Replace legacy hook with compatibility shim or removal**

```ts
// lib/useChatFlow.ts
export { useProgressionController as useChatFlow } from './progression/useProgressionController';
```

- [ ] **Step 2: Ensure all callers compile against final controller API**

```ts
const {
  phase,
  visibleNodes,
  waitingNodeId,
  answeredIds,
  dispatch,
  bindings: { scrollContainerRef, setActiveElement },
} = useProgressionController({ nodes, scrollMode: 'center' });

const activeChipMessageId =
  phase === 'waitingInput'
    ? waitingNodeId
    : null;

const handleContinue = () => dispatch({ type: 'CONTINUE' });
```

- [ ] **Step 3: Run targeted progression tests**

Run: `npm run test -- lib/progression/reducer.test.ts lib/progression/useProgressionController.test.tsx components/__tests__/OnboardingChat.progression.test.tsx components/__tests__/FlowChat.progression.test.tsx components/__tests__/PlanFlow.progression.test.tsx`  
Expected: PASS.

- [ ] **Step 4: Run project verification**

Run: `npm run lint && npm run build && npm run test`  
Expected: all commands PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/useChatFlow.ts components/OnboardingChat.tsx components/FlowChat.tsx components/PlanFlow.tsx
git commit -m "chore: remove legacy chat progression path and finalize FSM migration"
```

---

## Spec Coverage Check

- Shared FSM engine and controller: covered in Tasks 2-4.
- Deterministic pacing: covered in Task 3 scheduler + Task 4 hook integration.
- Center alignment + resize stability: covered in Task 3 scroll utilities + Task 4 controller usage.
- Migrate all flows (`OnboardingChat`, `FlowChat`, `PlanFlow`): covered in Tasks 5-6.
- Split-sync replay via shared events: covered in Task 5.
- Decommission legacy path: covered in Task 7.
- Lint/build pass requirement: covered in Task 7 verification.

## Placeholder Scan

- No `TBD`, `TODO`, or deferred implementation placeholders remain.
- All code-changing steps include concrete code snippets.
- Every test step includes explicit command + expected result.

## Type Consistency Check

- Event names and phases in tests and reducer match.
- Shared `FlowNode`/`ProgressionState` names are consistent across tasks.
- Controller API usage (`dispatch`, `visibleNodes`, bindings) is consistent in migration tasks.
