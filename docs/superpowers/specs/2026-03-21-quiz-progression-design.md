# Quiz Progression & Gamification — Design Spec

## Overview

Add a persistent progress header to the onboarding quiz phase that shows a stepper with 4 labeled checkpoints, a continuous fill bar, and a floating percentage pill with a glowing dot. Milestone celebrations with personalized insight cards fire at each checkpoint. The goal is to reduce drop-off, build anticipation, make the quiz feel shorter, and differentiate from typical quizzes.

## Progress Header Component

A new `OnboardingProgress.tsx` component pinned (sticky) to the top of the onboarding chat area. Approximate height: ~60px including labels. The existing `pt-16` padding in OnboardingChat provides clearance below it.

`OnboardingProgress` is a new component rather than an extension of the existing `StepperBar` (used by PlanFlow). StepperBar uses discrete step dots; this component needs a continuous fill bar, floating pill, glowing dot, and milestone celebrations — a fundamentally different visual model.

### Visual Elements

- **4 checkpoint dots** connected by a horizontal track line
- **Phase labels** below each dot: "Profile", "Readiness", "Potential", "Results"
- **Continuous fill** — a green gradient bar that advances with each answer
- **Floating pill** — solid green pill showing current percentage (e.g. "37%"), positioned above the bar at the fill's leading edge
- **Glowing dot** — a small dot on the bar at the fill edge, connected to the pill by a thin vertical line. Pulses subtly with a slow opacity animation. Respects `prefers-reduced-motion` (disables pulse).
- **Green gradient fill** — `linear-gradient(90deg, #22c55e, #2E7D52)`

### Accessibility

- Progress region: `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="100"`, `aria-label="Quiz progress"`
- Insight cards: announced via `aria-live="polite"`
- Glowing dot pulse: disabled when `prefers-reduced-motion: reduce` is set

### Checkpoint Mapping

Progress percentage = `((currentFlowIndex + 1) / totalFlowItems) * 100`. The 20 flow items are not evenly distributed across the 4 checkpoints — this is intentional. The first two phases are shorter (keeping early momentum high), while the later phases are longer (by then the user is invested). Checkpoints occur at these flow indices:

| Checkpoint | Label     | After Flow Index | Percentage | Insight |
|-----------|-----------|-----------------|------------|---------|
| 1         | Profile   | 3               | 20%        | "Strong foundation — you're ahead of 73% of coaches we've assessed" |
| 2         | Readiness | 7               | 40%        | "High readiness detected — your business model is primed for AI products" |
| 3         | Potential | 12              | 65%        | "Matched to 3 proven AI product templates for your niche" |
| 4         | Results   | 19              | 100%       | None — triggers generating phase transition |

### Visibility

- **Hidden** before the user interacts with the first flow item (welcome callout)
- **Visible** from first interaction through end of onboarding
- **Stays at 100%** momentarily when generating phase starts, then fades out

## Milestone Celebrations

Milestone celebrations are **non-blocking** — the chat flow continues underneath. The insight card overlays the top of the chat area (absolutely positioned below the stepper) and does not prevent user interaction. This keeps the quiz feeling fast.

When the fill reaches a checkpoint, a brief sequence plays:

1. **Dot merges into checkpoint** (300ms) — the glowing dot slides into the checkpoint circle, which fills green with a check icon using the existing `animate-scale-in` animation
2. **Insight card appears** (200ms) — the pill expands/transforms into a small insight card that slides down below the stepper using existing `animate-fade-in-up`
3. **Insight card holds** (2000ms) — card stays visible with the personalized insight text
4. **Insight card fades out** (200ms)
5. **Next phase label activates** — changes from gray (#A1A1AA) to green (#2E7D52)
6. **Pill reappears** (300ms) — fades back in at current percentage, positioned between the completed checkpoint and the next one

The insight card design:
- Green gradient background (`linear-gradient(135deg, #f0fdf4, #dcfce7)`)
- Green border (`rgba(46,125,82,0.2)`)
- Green check circle on the left
- Phase label + insight text on the right
- Rounded corners (10px), compact padding

## Animation Details

### Per-Answer Fill

- Fill bar, pill, and dot slide to new position: **400ms** ease-out
- Percentage number in pill counts up (e.g. 35 → 40) over the same 400ms — use `requestAnimationFrame` to interpolate the displayed integer from old to new percentage

### Glowing Dot Pulse

New CSS keyframe `pulse-glow`:
```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; box-shadow: 0 0 0 3px rgba(46,125,82,0.2), 0 0 8px rgba(46,125,82,0.15); }
  50% { opacity: 1; box-shadow: 0 0 0 3px rgba(46,125,82,0.3), 0 0 8px rgba(46,125,82,0.3); }
}

@media (prefers-reduced-motion: reduce) {
  .pulse-glow { animation: none; opacity: 1; }
}
```
Applied to the dot with a 2s cycle.

## Config Schema

Add `milestones` to `QuizConfig`:

```typescript
export type QuizMilestone = {
  atFlowIndex: number;
  label: string;
  insight?: string;
};
```

`QuizConfig` gains:
```typescript
milestones: QuizMilestone[];
```

Stored in `quiz-config.json`:
```json
"milestones": [
  { "atFlowIndex": 3, "label": "Profile", "insight": "Strong foundation \u2014 you're ahead of 73% of coaches we've assessed" },
  { "atFlowIndex": 7, "label": "Readiness", "insight": "High readiness detected \u2014 your business model is primed for AI products" },
  { "atFlowIndex": 12, "label": "Potential", "insight": "Matched to 3 proven AI product templates for your niche" },
  { "atFlowIndex": 19, "label": "Results" }
]
```

## File Changes

### New Files
- `components/OnboardingProgress.tsx` — the progress header component

### Modified Files
- `lib/quiz-config.ts` — add `QuizMilestone` type, add `milestones` to `QuizConfig`
- `components/OnboardingChat.tsx` — track `currentFlowIndex`, render `OnboardingProgress` above the chat area, show it only after first interaction
- `components/App.tsx` — pass `milestones` and `flow` from config to `OnboardingChat` (via `AppContent`)
- `app/globals.css` — add `pulse-glow` keyframe and reduced-motion override
- `data/quiz-config.json` — add `milestones` array
- `lib/seed-config.ts` — add hard-coded `milestones` array (the 4 checkpoints from this spec) to the assembled config object
- `app/api/config/route.ts` — add `'milestones'` to the `requiredKeys` validation array

### Unchanged Files
- `PlanFlow.tsx` — not affected
- `useChatFlow.ts` — no changes
- Admin editors — milestone editing is out of scope for v1

## Deriving Current Flow Index

OnboardingChat needs to track which flow item the user is currently on. The `flow` array and `milestones` array are passed as props from `App.tsx` (via `AppContent`).

The flow index increments each time the user completes an interaction:
- Answering a question (chip select or multi-submit)
- Tapping "Next" on a callout or fit score

To track this, OnboardingChat maintains a `currentFlowIndex` counter (local `useState`) that increments in the chip/continue handlers. This is separate from the hook's internal message index — it counts flow items, not messages.

The derivation:
- `currentFlowIndex` starts at 0
- Each time `handleChipSelect`, `handleMultiSubmit`, or `handleContinue` fires, increment `currentFlowIndex`
- `percentage = ((currentFlowIndex + 1) / flow.length) * 100`
- Pass `currentFlowIndex`, `flow.length`, and `milestones` to `OnboardingProgress`

Note: questions with preambles generate 2 messages but count as 1 flow item. The flow index tracks flow items, not messages.

## Out of Scope

- **Progress persistence** — if the user refreshes, the quiz restarts from zero. No localStorage or session persistence.
- **Admin editing of milestones** — milestone config is editable in the JSON but no admin UI editor for v1.
