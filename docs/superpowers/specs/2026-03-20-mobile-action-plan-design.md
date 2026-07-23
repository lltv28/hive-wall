# Mobile Action Plan Layout — Design Spec

## Overview

Replace the current side-by-side ActionPlanSidebar + FlowChat layout with a single continuous chat flow that has a horizontal stepper bar at the top and a pinned offer CTA at the bottom. The action plan becomes a seamless extension of the onboarding chat experience — no separate task list screen.

## Current State

- `App.tsx` Phase 2 renders `ActionPlanSidebar` (320px fixed) + `FlowChat` (flex-1) side-by-side
- The app viewport is constrained to `maxWidth: 430px` — a 320px sidebar leaves only 110px for content
- The `action-plan` and `guided-flow` app states manage navigation between the task list and individual task flows

## Design

### Layout Structure

The Phase 2 layout becomes a single full-width column:

```
┌──────────────────────────────┐
│  ● ── ● ── ○ ── ○ ── ○      │  ← Stepper bar (fixed top)
├──────────────────────────────┤
│                              │
│  [AI message]                │
│  [Video embed]               │  ← Scrollable chat flow
│  [AI question + chips]       │     (same components as onboarding)
│  [Interstitial card]         │
│  ...                         │
│                              │
├──────────────────────────────┤
│  ★ Get an Expert Review  ›   │  ← Pinned offer CTA (fixed bottom)
└──────────────────────────────┘
```

### Stepper Bar

- Horizontal dot-and-line stepper pinned at the top, below demo controls
- Each dot represents a non-offer task from `actionPlan`
- Dot states:
  - **Completed**: solid green circle (#22c55e) with white checkmark
  - **Active**: outlined blue circle (rgba(59,130,246,0.92)) with step number, blue glow ring (box-shadow)
  - **Locked**: outlined gray circle (#E5E5E8) with step number, 50% opacity
- Connecting lines:
  - **Between completed dots or completed→active**: filled blue
  - **After active dot**: gray (#E5E5E8)
- Tapping a completed dot scrolls the chat to that step's messages (stretch goal — not required for v1)
- Padding: `14px 24px 12px`, border-bottom: `1px solid #E5E5E8`

### Chat Flow

- Reuses the same chat pattern as `OnboardingChat`: AI messages via `MessageBubble`, `VideoEmbed`, `VisualCard`, `ChipPicker`, `Interstitial`, `FitScore`
- Each task's `messages` array plays sequentially, with typing indicators between messages
- When a guided task's messages complete, the stepper dot fills green and the next task's messages begin automatically — no "Complete Task" button, no navigation
- Quick tasks render as a single AI message (the task subtitle) followed by a "Got it" confirmation chip. Selecting the chip marks the step complete and auto-advances to the next step. This is the only user interaction required for quick tasks.
- The progressive opacity fade and smooth scrolling from `OnboardingChat` carry over
- `answeredMessages` pattern (chips stay visible after selection, disabled) carries over

### Step Transitions

When a step completes:
1. The active stepper dot animates to green checkmark (reuse `animate-scale-in` from `globals.css`)
2. The connecting line to the next dot fills blue
3. The next dot gains the active blue border + glow
4. A brief pause (~600ms), then the next step's first message begins with typing indicator
5. Chat scroll continues downward — no view reset

### Pinned Offer CTA

- Fixed at the bottom of the viewport, above any scroll content
- Amber background (#fffbeb), top border `1px solid #E5E5E8`
- Shows the first active offer task: star icon, title, subtitle, chevron right
- Tapping navigates to a full-screen offer view (same `OfferCard` component centered on screen, with a "← Back" button to return to the chat flow). This matches the existing offer rendering pattern in `FlowChat.tsx`.
- If multiple offer tasks exist, show the first one; the second appears after the first is dismissed or acted on
- Padding: `12px 16px`

### State Machine Changes

The current 4-state machine (`onboarding → generating → action-plan → guided-flow`) simplifies to 3 states:

- Keep `action-plan` as the single Phase 2 state
- Remove `guided-flow` — there is no separate task-level navigation; the flow IS the action plan
- After `generating` completes, transition to `action-plan` which renders the stepper + continuous chat + pinned offer
- `AppState` becomes: `'onboarding' | 'generating' | 'action-plan'`
- Remove `activeTaskId` state — step progression is managed internally by the new `PlanFlow` component via `currentStepIndex`

### Components Affected

| Component | Change |
|-----------|--------|
| `App.tsx` | Remove `guided-flow` state. `action-plan` renders the new layout instead of sidebar + FlowChat |
| `ActionPlanSidebar` | Remove or keep for desktop breakpoint (future) |
| `FlowChat` | Merge logic into a new `PlanFlow` component or refactor to accept all tasks |
| `FlowHeader` | Remove — replaced by stepper bar |
| New: `StepperBar` | Horizontal dot stepper component |
| New: `PinnedOffer` | Fixed bottom offer CTA component |

### Data Flow

- `configToActionPlanTasks()` returns all tasks as before
- Separate tasks into two lists: `steps` (non-offer tasks) and `offers` (offer tasks)
- `steps` drive the stepper dots and sequential chat flow
- `offers` drive the pinned bottom CTA
- Track `currentStepIndex` to know which step is active
- Each step's `messages` array feeds into the chat reveal logic (same as `OnboardingChat.revealMessage`)

### All Steps Complete

When the final step completes, the stepper fills entirely green. The chat ends with a final AI message congratulating the user. The pinned offer CTA remains as the terminal call-to-action.

### Design System Alignment

- Stepper dots: 20px diameter, `border: 2px solid`, consistent with generating screen stepper
- Active glow: `box-shadow: 0 0 0 3px rgba(59,130,246,0.12)`
- Connecting lines: 2px height
- Chat messages: 14px/15px font, `#3F3F46` color, 1.7 line-height (per design system AI message body)
- Interstitial cards: white background, `#E5E5E8` border, 12px radius, `var(--shadow-card)` (already updated)
- Offer CTA: amber palette per existing `TaskItem` offer styling
- All buttons: `var(--btn-primary)`, pill shape, 14px/600 weight
