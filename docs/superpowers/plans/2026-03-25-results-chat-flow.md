# Results Chat Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the static results page into a chat-style conversational flow where each results section is revealed as a message in the same chat as the quiz.

**Architecture:** Add `appendMessages` to `useChatFlow` so results messages can be injected after the generating checklist completes. A new `ResultComponentRenderer` maps `resultComponent` keys on `DMessage` to existing results components. `OnboardingChat` handles the injection and rendering. `App.tsx` simplifies to a single state.

**Tech Stack:** Next.js 16, React 19, Tailwind 4, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-25-results-chat-flow-design.md`

---

## File Structure

### New files
- `components/results/ResultComponentRenderer.tsx` — maps result component keys to React components, renders continue button

### Modified files
- `lib/types.ts` — add `resultComponent` field to `DMessage`
- `lib/buildResults.ts` — add `buildResultsMessages()` function
- `lib/useChatFlow.ts` — add `appendMessages` function and `activeResultId`
- `components/OnboardingChat.tsx` — remove `onComplete`, inject results, render result components
- `components/App.tsx` — simplify to single state, remove ResultsPage

---

### Task 1: Extend DMessage Type

**Files:**
- Modify: `lib/types.ts`

Add the `resultComponent` union type field to `DMessage`.

- [ ] **Step 1: Add `resultComponent` field to `DMessage` in `lib/types.ts`**

Add after the `triggersPhaseChange` field (line 30):

```typescript
  resultComponent?: 'hero' | 'profile' | 'video' | 'recommendation' | 'actionPlan' | 'cta' | 'testimonial' | 'process' | 'demos' | 'faq' | 'socialProof';
```

The full type becomes:
```typescript
export type DMessage = {
  id: string;
  sender: 'ai' | 'user';
  content?: string;
  subtitle?: string;
  video?: { src: string; title: string; duration: string };
  visualCard?: { icon: string; title: string; items: { label: string; value: string }[] };
  chips?: { label: string; value: string; emoji?: string; description?: string }[];
  multiSelect?: boolean;
  offerCard?: { title: string; description: string; cta: string; price?: string };
  fitScore?: { percentage: number; message: string; cta: string };
  callout?: { headline: string; body: string; stat?: string; video?: { src: string; title: string } };
  waitForInput?: boolean;
  triggersPhaseChange?: boolean;
  resultComponent?: 'hero' | 'profile' | 'video' | 'recommendation' | 'actionPlan' | 'cta' | 'testimonial' | 'process' | 'demos' | 'faq' | 'socialProof';
};
```

- [ ] **Step 2: Verify compilation**

Run: `cd ai-quiz-funnel-v1 && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/types.ts
git commit -m "feat(results-chat): add resultComponent field to DMessage type"
```

---

### Task 2: Add buildResultsMessages Function

**Files:**
- Modify: `lib/buildResults.ts`

Add a function that generates 12 `DMessage` objects for the results chat flow, plus returns the `ResultsConfig`.

- [ ] **Step 1: Add `buildResultsMessages` to `lib/buildResults.ts`**

Add at the end of the file, after the existing `buildResultsFromAnswers` function:

```typescript
import { UserAnswers, DMessage } from './types';

// (keep existing import — just add DMessage to it)

export function buildResultsMessages(answers: UserAnswers): { messages: DMessage[]; config: ResultsConfig } {
  const config = buildResultsFromAnswers(answers);

  const messages: DMessage[] = [
    { id: 'result-hero', sender: 'ai', resultComponent: 'hero', waitForInput: true },
    { id: 'result-profile', sender: 'ai', resultComponent: 'profile', waitForInput: true },
    { id: 'result-video', sender: 'ai', resultComponent: 'video', waitForInput: true },
    { id: 'result-rec', sender: 'ai', resultComponent: 'recommendation', waitForInput: true },
    { id: 'result-plan', sender: 'ai', resultComponent: 'actionPlan', waitForInput: true },
    { id: 'result-cta1', sender: 'ai', resultComponent: 'cta', waitForInput: true },
    { id: 'result-testimonial', sender: 'ai', resultComponent: 'testimonial', waitForInput: true },
    { id: 'result-process', sender: 'ai', resultComponent: 'process', waitForInput: true },
    { id: 'result-demos', sender: 'ai', resultComponent: 'demos', waitForInput: true },
    { id: 'result-faq', sender: 'ai', resultComponent: 'faq', waitForInput: true },
    { id: 'result-social', sender: 'ai', resultComponent: 'socialProof', waitForInput: true },
    { id: 'result-cta2', sender: 'ai', resultComponent: 'cta', waitForInput: true },
  ];

  return { messages, config };
}
```

Note: Update the existing import line at the top from `import { UserAnswers } from './types';` to `import { UserAnswers, DMessage } from './types';`.

- [ ] **Step 2: Verify compilation**

Run: `cd ai-quiz-funnel-v1 && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/buildResults.ts
git commit -m "feat(results-chat): add buildResultsMessages function"
```

---

### Task 3: Add appendMessages and activeResultId to useChatFlow

**Files:**
- Modify: `lib/useChatFlow.ts`

Add two things: (1) `appendMessages` function that extends the message array and starts revealing, (2) `activeResultId` computed value.

- [ ] **Step 1: Add `appendMessages` function to `useChatFlow`**

Add before the `return` statement (around line 305 of `lib/useChatFlow.ts`):

```typescript
  const appendMessages = useCallback((newMsgs: DMessage[]) => {
    const startIndex = currentMessagesRef.current.length;
    currentMessagesRef.current = [...currentMessagesRef.current, ...newMsgs];
    revealMessage(startIndex, currentMessagesRef.current);
  }, [revealMessage]);
```

- [ ] **Step 2: Add `activeResultId` computed value**

Add after the existing `activeCalloutId` (around line 243):

```typescript
  const activeResultId = waitingForInput
    ? visibleMessages.findLast(m => m.resultComponent && m.waitForInput)?.id ?? null
    : null;
```

- [ ] **Step 3: Add both to the return object**

Update the return statement to include the new values:

```typescript
  return {
    visibleMessages,
    isThinking,
    thinkingVisible,
    waitingForInput,
    showCta,
    answeredMessages,
    lastItemRef,
    thinkingRef,
    scrollContainerRef,
    hasAnimated,
    revealMessage,
    handleChipSelect,
    handleMultiSubmit,
    handleContinue,
    clearTimeouts,
    addTimeout,
    scrollLatestToTop,
    activeChipMessageId,
    activeFitScoreId,
    activeCalloutId,
    activeResultId,
    goBack,
    skipTo,
    appendMessages,
  };
```

- [ ] **Step 4: Verify compilation**

Run: `cd ai-quiz-funnel-v1 && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add lib/useChatFlow.ts
git commit -m "feat(results-chat): add appendMessages and activeResultId to useChatFlow"
```

---

### Task 4: Create ResultComponentRenderer

**Files:**
- Create: `components/results/ResultComponentRenderer.tsx`

Maps `resultComponent` keys to React components. Renders the component plus a "Continue" button.

- [ ] **Step 1: Create `components/results/ResultComponentRenderer.tsx`**

```tsx
'use client';

import { ResultsConfig } from '@/lib/buildResults';
import ResultsHero from './ResultsHero';
import ProfileCard from './ProfileCard';
import VideoPlaceholder from './PainCard';
import RecommendationCard from './RecommendationCard';
import ActionPlanCard from './ActionPlanCard';
import CtaBlock from './CtaBlock';
import TestimonialCard from './TestimonialCard';
import ProcessCard from './ProcessCard';
import DemoSection from './DemoSection';
import FaqSection from './FaqSection';
import SocialProofStrip from './SocialProofStrip';

interface ResultComponentRendererProps {
  componentKey: string;
  config: ResultsConfig;
  isActive: boolean;
  onContinue: () => void;
}

export default function ResultComponentRenderer({ componentKey, config, isActive, onContinue }: ResultComponentRendererProps) {
  let component: React.ReactNode = null;

  switch (componentKey) {
    case 'hero':
      component = (
        <ResultsHero
          score={config.score}
          headline={config.headline}
          description={config.description}
          recommendation={config.recommendation}
        />
      );
      break;
    case 'profile':
      component = <ProfileCard tags={config.profileTags} summary={config.description} />;
      break;
    case 'video':
      component = <VideoPlaceholder />;
      break;
    case 'recommendation':
      component = (
        <RecommendationCard
          name={config.recommendation.name}
          description={config.recommendation.description}
          features={config.recommendation.features}
        />
      );
      break;
    case 'actionPlan':
      component = <ActionPlanCard productName={config.recommendation.name} />;
      break;
    case 'cta':
      component = <CtaBlock href={config.ctaUrl} />;
      break;
    case 'testimonial':
      component = (
        <TestimonialCard
          quote={config.testimonial.quote}
          name={config.testimonial.name}
          detail={config.testimonial.detail}
        />
      );
      break;
    case 'process':
      component = <ProcessCard />;
      break;
    case 'demos':
      component = <DemoSection />;
      break;
    case 'faq':
      component = <FaqSection />;
      break;
    case 'socialProof':
      component = <SocialProofStrip />;
      break;
  }

  return (
    <>
      {component}
      {isActive && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={onContinue}
            className="cursor-pointer transition-all duration-200"
            style={{
              background: 'none',
              border: '1px solid #E5E5E8',
              borderRadius: '10px',
              padding: '10px 24px',
              fontSize: 'var(--text-xs)',
              fontWeight: 'var(--font-medium)',
              color: '#71717A',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#2E7D52'; e.currentTarget.style.color = '#2E7D52'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E5E5E8'; e.currentTarget.style.color = '#71717A'; }}
          >
            Continue
          </button>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Verify compilation**

Run: `cd ai-quiz-funnel-v1 && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add components/results/ResultComponentRenderer.tsx
git commit -m "feat(results-chat): add ResultComponentRenderer with continue button"
```

---

### Task 5: Update OnboardingChat to Inject and Render Results

**Files:**
- Modify: `components/OnboardingChat.tsx`

This is the most complex task. Changes:
1. Remove `onComplete` prop
2. Add `resultsConfigRef`
3. Change `handleGeneratingComplete` to inject results
4. Add `resultComponent` rendering in message loop
5. Hide progress bar during results
6. Destructure `appendMessages` and `activeResultId` from `useChatFlow`

- [ ] **Step 1: Update imports**

At the top of `components/OnboardingChat.tsx`, add:

```tsx
import { buildResultsMessages, ResultsConfig } from '@/lib/buildResults';
import ResultComponentRenderer from './results/ResultComponentRenderer';
```

- [ ] **Step 2: Remove `onComplete` from props interface**

Change the `OnboardingChatProps` interface (around line 36-41):

From:
```tsx
interface OnboardingChatProps {
  onComplete: (answers: UserAnswers) => void;
  messages: DMessage[];
  milestones: QuizMilestone[];
  totalFlowItems: number;
}
```

To:
```tsx
interface OnboardingChatProps {
  messages: DMessage[];
  milestones: QuizMilestone[];
  totalFlowItems: number;
}
```

And update the component signature (line 43):

From: `export default function OnboardingChat({ onComplete, messages, milestones, totalFlowItems }: OnboardingChatProps) {`
To: `export default function OnboardingChat({ messages, milestones, totalFlowItems }: OnboardingChatProps) {`

- [ ] **Step 3: Add `appendMessages` and `activeResultId` to useChatFlow destructuring**

Update the destructuring (around line 47-52) to include the new values:

```tsx
  const {
    visibleMessages, thinkingVisible, showCta, answeredMessages, waitingForInput,
    lastItemRef, thinkingRef, scrollContainerRef, hasAnimated,
    revealMessage, handleChipSelect, handleMultiSubmit, handleContinue, clearTimeouts,
    scrollLatestToTop, activeChipMessageId, activeFitScoreId, activeCalloutId, activeResultId,
    goBack, skipTo, appendMessages,
  } = useChatFlow({
```

- [ ] **Step 4: Add resultsConfigRef**

Add after the existing refs (around line 68):

```tsx
  const resultsConfigRef = useRef<ResultsConfig | null>(null);
```

- [ ] **Step 5: Remove onCompleteRef, change handleGeneratingComplete**

Remove these lines:
```tsx
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
```

Replace `handleGeneratingComplete` (around line 256-258):

From:
```tsx
  const handleGeneratingComplete = useCallback(() => {
    onCompleteRef.current(userAnswersRef.current);
  }, []);
```

To:
```tsx
  const handleGeneratingComplete = useCallback(() => {
    const { messages: resultMsgs, config } = buildResultsMessages(userAnswersRef.current);
    // Set ref BEFORE state updates — the re-render from appendMessages will read this ref
    resultsConfigRef.current = config;
    setIsGenerating(false);
    appendMessages(resultMsgs);
  }, [appendMessages]);
```

- [ ] **Step 6: Hide progress bar during results phase**

Change the progress bar conditional (around line 262):

From:
```tsx
      {totalFlowItems > 0 && (
        <OnboardingProgress
```

To:
```tsx
      {totalFlowItems > 0 && !resultsConfigRef.current && (
        <OnboardingProgress
```

- [ ] **Step 7: Add resultComponent rendering in the message loop**

In the message rendering section (around line 279-345), add a new condition for `resultComponent` messages. Insert after the `msg.callout` block (after line 295) and before the `!msg.fitScore && !msg.callout` block:

```tsx
                {msg.resultComponent && resultsConfigRef.current && (
                  <ResultComponentRenderer
                    componentKey={msg.resultComponent}
                    config={resultsConfigRef.current}
                    isActive={msg.id === activeResultId}
                    onContinue={onContinue}
                  />
                )}
```

And update the else condition from:
```tsx
                {!msg.fitScore && !msg.callout && (
```
To:
```tsx
                {!msg.fitScore && !msg.callout && !msg.resultComponent && (
```

- [ ] **Step 8: Verify compilation**

Run: `cd ai-quiz-funnel-v1 && npx tsc --noEmit`
Expected: No errors

- [ ] **Step 9: Commit**

```bash
git add components/OnboardingChat.tsx
git commit -m "feat(results-chat): inject results as chat messages in OnboardingChat"
```

---

### Task 6: Simplify App.tsx

**Files:**
- Modify: `components/App.tsx`

Remove `'results'` state, `ResultsPage`, completion callback, `userAnswers` state, and the Results demo button.

- [ ] **Step 1: Simplify App.tsx**

The full replacement for `components/App.tsx`:

```tsx
'use client';

import { useState, useEffect } from 'react';
import { DMessage } from '@/lib/types';
import { QuizConfig, configToOnboardingMessages, QuizMilestone, FlowItem } from '@/lib/quiz-config';
import OnboardingChat from './OnboardingChat';

/* ------------------------------------------------------------------ */
/*  Inner component — resets when key changes                          */
/* ------------------------------------------------------------------ */

function AppContent({
  onboardingMessages,
  milestones,
  flow,
}: {
  onboardingMessages: DMessage[];
  milestones: QuizMilestone[];
  flow: FlowItem[];
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <OnboardingChat messages={onboardingMessages} milestones={milestones} totalFlowItems={flow.length} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Outer component — top-level + demo controls                        */
/* ------------------------------------------------------------------ */

export default function App() {
  const [key, setKey] = useState(0);
  const [controlsHidden, setControlsHidden] = useState(false);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isSplit, setIsSplit] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('role') === 'leader' || params.get('role') === 'follower') {
      setIsSplit(true);
      setControlsHidden(true);
    }
  }, []);

  useEffect(() => {
    fetch('/api/config')
      .then((r) => {
        if (!r.ok) throw new Error(`Config fetch failed: ${r.status}`);
        return r.json();
      })
      .then(setConfig)
      .catch(() => setLoadError(true));
  }, []);

  const handleReset = () => {
    setKey((k) => k + 1);
  };

  if (!config) {
    return (
      <div className="flex flex-col" style={{ width: '100vw', height: '100vh', background: '#F6F6F7' }}>
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: loadError ? '#dc2626' : '#A1A1AA', fontSize: '14px' }}>
            {loadError ? 'Failed to load quiz config.' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const onboardingMessages = configToOnboardingMessages(config);

  return (
    <div
      className="flex flex-col mx-auto"
      style={{ width: '100%', maxWidth: isSplit ? 'none' : '430px', height: '100vh', background: '#F6F6F7' }}
    >
      {/* Demo Controls */}
      {!isSplit && <button
        onClick={() => setControlsHidden((h) => !h)}
        className="absolute top-2 right-2 z-[300] w-7 h-7 rounded-md flex items-center justify-center bg-white/80 backdrop-blur-[4px] border border-[rgba(26,26,26,0.09)] hover:bg-white transition-colors duration-150 cursor-pointer"
        title={controlsHidden ? 'Show controls' : 'Hide controls'}
      >
        <svg className="w-3.5 h-3.5 text-[rgba(26,26,26,0.48)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {controlsHidden ? (
            <path d="M2 5l6 6 6-6" />
          ) : (
            <path d="M2 11l6-6 6 6" />
          )}
        </svg>
      </button>}

      {!controlsHidden && (
        <div className="flex-shrink-0 bg-white border-b border-[rgba(26,26,26,0.09)] px-5 py-2 flex items-center justify-between z-[200] relative">
          <span
            className="text-xs font-semibold uppercase tracking-wider text-[rgba(26,26,26,0.36)]"
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            Demo Controls
          </span>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[rgba(26,26,26,0.6)] border border-[rgba(26,26,26,0.09)] hover:bg-[rgba(26,26,26,0.04)] transition-colors duration-150 cursor-pointer"
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            Reset Demo
          </button>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden" key={key}>
        <AppContent
          onboardingMessages={onboardingMessages}
          milestones={config.milestones}
          flow={config.flow}
        />
      </div>
    </div>
  );
}
```

Key changes from current:
- Removed `AppState` type, `appState` state, `handleOnboardingComplete`
- Removed `ResultsPage` import and rendering
- Removed `userAnswers` state from `AppContent`
- Removed `onComplete`/`onOnboardingComplete` prop passing
- Removed "Results" stage switcher button and the state indicator
- Simplified demo controls to just "Demo Controls" label + "Reset Demo" button
- `AppContent` is simplified to just render `OnboardingChat`

- [ ] **Step 2: Verify it builds**

Run: `cd ai-quiz-funnel-v1 && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add components/App.tsx
git commit -m "feat(results-chat): simplify App.tsx to single-state, remove ResultsPage"
```

---

### Task 7: Build Verification and Visual QA

- [ ] **Step 1: Full build check**

Run: `cd ai-quiz-funnel-v1 && npm run build`
Expected: Build completes successfully

- [ ] **Step 2: Lint check on changed files**

Run: `cd ai-quiz-funnel-v1 && npx eslint lib/types.ts lib/buildResults.ts lib/useChatFlow.ts components/results/ResultComponentRenderer.tsx components/OnboardingChat.tsx components/App.tsx`
Expected: No errors

- [ ] **Step 3: Visual QA**

Run: `cd ai-quiz-funnel-v1 && npm run dev`

Open http://localhost:3000 and verify:
- [ ] Quiz flows normally through all questions
- [ ] Generating checklist appears after final quiz answer
- [ ] After checklist completes, results messages start appearing one at a time
- [ ] Each results section shows a "Continue" button
- [ ] Tapping Continue reveals next section with typing indicator
- [ ] ResultsHero shows animated score count-up
- [ ] ProfileCard shows answer-derived tags
- [ ] RecommendationCard shows correct product match
- [ ] ActionPlanCard accordion works (Week 1 expanded, rest collapsed/locked)
- [ ] CtaBlock renders green gradient button
- [ ] All sections render without MessageBubble wrappers (full-width cards)
- [ ] Progress bar disappears when results start
- [ ] Previous messages fade with opacity as new ones appear
- [ ] Reset Demo button resets everything back to quiz start

- [ ] **Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix(results-chat): final polish and fixes"
```
