# Results Chat Flow Design Spec

**Date:** 2026-03-25
**Status:** Draft
**Replaces:** Static scrollable `ResultsPage` component and `'results'` app state

## Overview

Convert the results page from a static scrollable report into a chat-style conversational flow. After the generating checklist completes, results are delivered as sequential chat messages in the same conversation as the quiz. Each section renders directly in the chat, with typing indicators between them. The user taps "Continue" after every section to advance.

## Goals

- Results feel like a continuation of the quiz conversation, not a separate page
- Each section gets its own moment of attention (no scroll-past)
- Reuse existing rich components (ResultsHero, ProfileCard, etc.) inside the chat flow
- Eliminate the `'results'` app state — everything stays in the onboarding chat

## Architecture Change

### Before (current)
```
Quiz (OnboardingChat) -> generating checklist -> onComplete(answers)
  -> App switches to 'results' state
    -> ResultsPage renders all sections as static scroll
```

### After
```
Quiz (OnboardingChat) -> generating checklist completes
  -> buildResultsMessages(answers) generates 12 DMessage objects
  -> appendMessages() adds them to useChatFlow's message array
  -> isGenerating set to false (removes checklist, restores opacity)
  -> revealMessage starts from first results message index
  -> Each section revealed one at a time, user taps Continue to advance
```

The key change: instead of `onComplete` triggering a phase switch to a separate `ResultsPage`, the generating checklist completion appends results messages to the existing chat flow and continues revealing.

## Message Sequence

After the generating checklist completes, these messages are appended and revealed in order. Every message has `waitForInput: true` — the user must tap to advance.

Each message uses a new `resultComponent` field on `DMessage` to specify which React component to render.

The `resultComponent` value is a string union key that maps to a specific component:

| # | ID | `resultComponent` key | Component | Description |
|---|-----|----------------------|-----------|-------------|
| 1 | `result-hero` | `hero` | `ResultsHero` | Score + headline + recommendation pill |
| 2 | `result-profile` | `profile` | `ProfileCard` | Profile tags + summary |
| 3 | `result-video` | `video` | `VideoPlaceholder` | Square video placeholder |
| 4 | `result-rec` | `recommendation` | `RecommendationCard` | Product match + feature tiles |
| 5 | `result-plan` | `actionPlan` | `ActionPlanCard` | Interactive 30-day checklist |
| 6 | `result-cta1` | `cta` | `CtaBlock` | "Book Your Strategy Call" |
| 7 | `result-testimonial` | `testimonial` | `TestimonialCard` | Client quote |
| 8 | `result-process` | `process` | `ProcessCard` | 3-step how it works |
| 9 | `result-demos` | `demos` | `DemoSection` | 4 demo video placeholders |
| 10 | `result-faq` | `faq` | `FaqSection` | 6 accordion Q&As |
| 11 | `result-social` | `socialProof` | `SocialProofStrip` | Avatar stack + stat |
| 12 | `result-cta2` | `cta` | `CtaBlock` | "Book Your Strategy Call" (repeated) |

## DMessage Type Extension

Add a new optional field to `DMessage` in `lib/types.ts`:

```typescript
export type DMessage = {
  // ...existing fields...
  resultComponent?: 'hero' | 'profile' | 'video' | 'recommendation' | 'actionPlan' | 'cta' | 'testimonial' | 'process' | 'demos' | 'faq' | 'socialProof';
};
```

## Results Message Builder

A new function `buildResultsMessages(answers: UserAnswers): { messages: DMessage[]; config: ResultsConfig }` in `lib/buildResults.ts` that:

1. Calls existing `buildResultsFromAnswers(answers)` to get `ResultsConfig`
2. Returns both the config AND an array of 12 `DMessage` objects, each with:
   - Unique `id` (e.g. `result-hero`)
   - `sender: 'ai'`
   - `waitForInput: true`
   - `resultComponent` key
   - No `content` (the component provides the visual)

Returning both allows `OnboardingChat` to store the config for rendering while feeding the messages to the chat flow.

## useChatFlow Changes

Add a new `appendMessages` function to the hook's return value:

```typescript
const appendMessages = useCallback((newMsgs: DMessage[]) => {
  const startIndex = currentMessagesRef.current.length;
  currentMessagesRef.current = [...currentMessagesRef.current, ...newMsgs];
  revealMessage(startIndex, currentMessagesRef.current);
}, [revealMessage]);
```

This extends the existing message array and starts revealing from the first new message. The existing `goBack`, `skipTo`, and `historyRef` continue to work because the array is only appended to, never replaced. Going back across the quiz/results boundary works naturally.

**This is the only change to `useChatFlow`.** All other hook behavior (typing indicator, waitForInput, scroll, opacity) works as-is.

## Rendering in OnboardingChat

### ResultsConfig data flow

When `handleGeneratingComplete` fires:
1. Call `buildResultsMessages(userAnswersRef.current)` — returns `{ messages, config }`
2. Store `config` in a `useRef<ResultsConfig | null>(null)` — `resultsConfigRef.current = config`
3. Set `isGenerating = false` (removes generating checklist, restores normal opacity)
4. Call `appendMessages(messages)` to inject results into the chat flow

The `resultsConfigRef` is accessed during rendering by `ResultComponentRenderer`.

### Message rendering

Add `resultComponent` handling to the message render loop, following the same pattern as `fitScore` and `callout`:

```tsx
{msg.resultComponent && resultsConfigRef.current && (
  <ResultComponentRenderer
    componentKey={msg.resultComponent}
    config={resultsConfigRef.current}
    onContinue={msg.id === activeResultId ? onContinue : () => {}}
  />
)}
```

This renders **without** a `MessageBubble` wrapper, matching how `FitScore` and `Callout` render as full-width cards.

The full rendering condition becomes:
```
if msg.fitScore -> FitScore component
if msg.callout -> Callout component
if msg.resultComponent -> ResultComponentRenderer (no bubble)
else -> MessageBubble (standard text/chips)
```

### Active result tracking

Add `activeResultId` to `useChatFlow` return, following the same pattern as `activeFitScoreId` and `activeCalloutId`:

```typescript
const activeResultId = waitingForInput
  ? visibleMessages.findLast(m => m.resultComponent && m.waitForInput)?.id ?? null
  : null;
```

Only the most recent results message shows its "Continue" button.

## Continue Button

The "Continue" button is rendered by `ResultComponentRenderer` below the component, not inside each individual results component. This keeps the button consistent and avoids modifying every results component.

```tsx
// Inside ResultComponentRenderer
<>
  {renderComponent(componentKey, config)}
  {onContinue && (
    <button onClick={onContinue} ...>Continue</button>
  )}
</>
```

Button style: matches existing chat continue buttons (muted, not the green gradient CTA). When `onContinue` is a no-op (not the active message), the button is hidden.

## OnboardingChat Changes (detailed)

1. **Remove `onComplete` prop** — no longer needed. Remove from `OnboardingChatProps` interface.
2. **Add `resultsConfigRef`** — `useRef<ResultsConfig | null>(null)` for storing config during results phase.
3. **Change `handleGeneratingComplete`:**
   ```typescript
   const handleGeneratingComplete = useCallback(() => {
     const { messages: resultMsgs, config } = buildResultsMessages(userAnswersRef.current);
     resultsConfigRef.current = config;
     setIsGenerating(false);
     appendMessages(resultMsgs);
   }, [appendMessages]);
   ```
4. **Add result component rendering** in the message map (see rendering section above).
5. **Hide progress bar** during results phase: hide `OnboardingProgress` when `resultsConfigRef.current` is not null.

## App.tsx Changes

1. **Remove `'results'` state** — `AppState` becomes just `'onboarding'` (or remove the type entirely since there's only one state).
2. **Remove `ResultsPage` import** and its rendering block in `AppContent`.
3. **Remove `onComplete` / `onOnboardingComplete`** — `OnboardingChat` no longer calls a completion callback.
4. **Remove the "Results" demo button** from the stage switcher. The demo controls keep "Quiz" + "Reset Demo" only.
5. **Remove `userAnswers` state** from `AppContent` — it's no longer needed at this level (answers stay inside `OnboardingChat`).

## New Files

- **`components/results/ResultComponentRenderer.tsx`** — maps `resultComponent` keys to React components. Receives `ResultsConfig` + `onContinue` as props. Renders the component + continue button. Simple switch/map, no logic.

## Modified Files

- **`lib/types.ts`** — add `resultComponent` union type field to `DMessage`
- **`lib/buildResults.ts`** — add `buildResultsMessages()` function returning `{ messages, config }`
- **`lib/useChatFlow.ts`** — add `appendMessages` function and `activeResultId` to return value
- **`components/OnboardingChat.tsx`** — remove `onComplete`, add results injection in `handleGeneratingComplete`, add `ResultComponentRenderer` rendering, add `resultsConfigRef`, hide progress bar during results
- **`components/App.tsx`** — simplify to single state, remove `ResultsPage`, remove completion callback wiring

## Opacity Behavior During Results

The existing opacity fade (distance-from-end based) applies to results messages the same way it applies to quiz messages. This is acceptable — it keeps focus on the current section and lets previous sections recede. The quiz messages above will be at 0.2 opacity which is fine since they're "done."

**Important:** `isGenerating` must be set to `false` before results messages start appearing. Otherwise all messages stay at 0.15 opacity. The `handleGeneratingComplete` function sets `setIsGenerating(false)` before calling `appendMessages`.

## Split-Sync Behavior

Split-sync during the results phase is **out of scope for v1**. The follower pane will see continue events broadcast but may not have matching `resultsConfig` data since it mirrors actions without accumulating real answers. This can be addressed in a future iteration.

## Out of Scope (v1)

- Auto-advancing certain results messages (all require tap)
- Streaming text within results components
- Customizing continue button text per section
- Persisting results state across page reloads
- Admin editing of results message order
- Split-sync support during results phase
- "Jump to results" demo button (removed — users complete quiz or reset)
