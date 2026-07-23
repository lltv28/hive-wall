# Unified Progression FSM Design

Date: 2026-03-26
Project: `ai-quiz-funnel-v1`
Status: Draft approved for spec write-up

## Goal

Unify progression behavior across all conversational flows so card/slide progression and scroll positioning are deterministic and reliable while preserving the existing UX pacing/animation feel.

Targeted flows:
- Onboarding + results chat (`OnboardingChat`)
- Guided/quick/offer task chat (`FlowChat`)
- Plan progression flow (`PlanFlow`)
- Split-sync replay path (leader/follower events)

## Non-Goals

- Redesigning visual style, copy, or pacing personality
- Changing public end-user flow semantics (same content order, same interaction points)
- Backend/data-model redesign beyond progression contracts

## User Decisions Captured

- Approach: shared FSM engine (single architecture across all flows)
- UX behavior: preserve current pacing feel
- Scroll policy: center active card/step
- Refactor scope: internal API changes allowed

## Architecture

Create a shared progression engine with a reducer-driven finite state machine and a single scheduler.

New modules:
- `lib/progression/types.ts`
- `lib/progression/reducer.ts`
- `lib/progression/scheduler.ts`
- `lib/progression/scroll.ts`
- `lib/progression/useProgressionController.ts`

### Core FSM Phases

- `idle`: controller created, no progression started
- `typing`: typing indicator active for current node
- `revealing`: message/card becomes visible
- `waitingInput`: progression paused for user action
- `autoAdvancing`: deterministic timed transition to next node
- `completed`: no more nodes in this sequence

### Event Model

System events:
- `START`
- `TYPE_DONE`
- `REVEAL_DONE`
- `AUTO_ADVANCE`
- `COMPLETE`
- `RESET`

User events:
- `SELECT_CHIP`
- `SUBMIT_MULTI`
- `CONTINUE`
- `BACK`
- `JUMP`
- `SEE_RESULTS`

Sync events:
- `REMOTE_EVENT_APPLIED` (transport-level replay mapped into the same event surface)

Invalid transitions are ignored (dev-only warning), never thrown.

## Shared Node Model

Normalize all flow content into a shared node contract:

```ts
type WaitMode = 'none' | 'userAction' | 'multiSubmit' | 'phaseChange';

type FlowNode = {
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
```

Adapters in each flow map existing message/task structures to `FlowNode[]`.

## Shared Controller API

Introduce `useProgressionController`:

```ts
useProgressionController({
  nodes,
  paceConfig,
  scrollMode: 'center',
  onComplete,
});
```

Returns:
- `visibleNodes`
- `phase`
- `activeNodeId`
- `waitingNodeId`
- `answeredIds`
- `dispatch(event)`
- `bindings`:
  - scroll container ref
  - active item ref binder
  - optional phase flags for render helpers

This replaces ad hoc recursion and nested timers in per-flow components.

## Scroll & Alignment Behavior

Single policy for all flows:
- When active node changes, align active element to vertical center.
- During short post-reveal layout shifts (chips/media/subtitles), apply temporary center pinning via `ResizeObserver`.
- Pinning expires automatically and must never block user-initiated scrolling after settle.
- Missing refs/detached nodes are safe no-ops.

## Deterministic Pacing

Preserve current feel without random phase drift:
- Typing/reveal delays computed from content length + fixed coefficients.
- Same node + config => same timing result.
- Scheduler centrally owns timer lifecycle; all pending timers canceled on:
  - reset
  - unmount
  - back
  - jump
  - branch/phase change

## Migration Plan

### Step 1: Build shared progression internals
- Implement types, reducer, scheduler, scroll orchestrator, and controller hook.
- Add reducer and scheduler unit tests first.

### Step 2: Migrate `OnboardingChat`
- Replace `useChatFlow`-driven reveal logic with `useProgressionController`.
- Keep existing rendering components and pacing profile.
- Keep split-sync transport; map incoming sync actions to controller events.

### Step 3: Migrate `FlowChat`
- Convert guided/quick/offer progression to same controller events and selectors.
- Remove local progression-specific timer/state logic.

### Step 4: Migrate `PlanFlow`
- Use controller for step message progression and task advancement consistency.
- Keep stepper visuals; derive active/completed state from controller.

### Step 5: Decommission legacy progression paths
- Remove or shim `useChatFlow` only as needed for backward compatibility.
- Delete dead paths once parity checks pass.

## Error Handling

- Reducer transition table is authoritative.
- Unexpected event in current phase:
  - ignored
  - dev warning logged with phase/event
- Scheduler rejects duplicate active timers for same transition key.
- Split-sync replay is idempotent against current active node and answered state.

## Testing Plan

### Unit
- Reducer transition matrix (all phases/events)
- Back/jump/reset correctness
- Deterministic delay calculations
- Scheduler cleanup semantics

### Hook-level
- `useProgressionController` lifecycle:
  - start/reveal/wait/advance sequencing
  - timer cleanup on unmount/reset/jump
  - active node selector correctness

### Integration
- `OnboardingChat`: progression parity, results transition, center alignment
- `FlowChat`: guided + quick + offer consistency
- `PlanFlow`: step progression lockstep with rendered messages
- Split-sync: leader event stream reproduces follower state deterministically

## Risks & Mitigations

- Risk: migration introduces subtle parity regressions
  - Mitigation: per-flow migration with parity assertions and feature flag fallback during transition
- Risk: center pinning fights user scroll
  - Mitigation: short TTL pinning + disable pin during explicit user scroll interaction windows
- Risk: sync replay races with local timer transitions
  - Mitigation: route all transitions through single reducer/scheduler event queue

## Acceptance Criteria

- All three flows use shared progression controller.
- Active card/slide remains centered and stable through reveal and resize transitions.
- No random transition drift (deterministic timing).
- Split-sync follower progression matches leader actions.
- `npm run lint` and `npm run build` pass.
