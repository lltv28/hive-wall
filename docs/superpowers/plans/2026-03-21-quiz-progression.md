# Quiz Progression Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persistent progress header to the onboarding quiz with a stepper bar, floating percentage pill, glowing dot, and milestone celebration cards.

**Architecture:** New `OnboardingProgress` component rendered by `OnboardingChat`. Config-driven milestones stored in `quiz-config.json`. Flow index tracked locally in `OnboardingChat` and incremented on each user interaction. No changes to `useChatFlow` hook.

**Tech Stack:** Next.js 16 (App Router), React, TypeScript, Tailwind CSS 4, CSS keyframes

**Spec:** `docs/superpowers/specs/2026-03-21-quiz-progression-design.md`

---

## Chunk 1: Config Schema + Data

### Task 1: Add milestone type and config data

**Files:**
- Modify: `lib/quiz-config.ts:67-73`
- Modify: `data/quiz-config.json`
- Modify: `lib/seed-config.ts:139-147`
- Modify: `app/api/config/route.ts:26`

- [ ] **Step 1: Add QuizMilestone type to quiz-config.ts**

Add after the `FlowItem` type (line 40):

```typescript
export type QuizMilestone = {
  atFlowIndex: number;
  label: string;
  insight?: string;
};
```

Add `milestones` to `QuizConfig`:

```typescript
export type QuizConfig = {
  flow: FlowItem[];
  questions: QuizQuestion[];
  callouts: QuizCallout[];
  fitScores: QuizFitScore[];
  actionPlan: ConfigActionPlanTask[];
  milestones: QuizMilestone[];
};
```

- [ ] **Step 2: Add milestones to quiz-config.json**

Add after the `"actionPlan"` array (before the closing `}`):

```json
"milestones": [
  { "atFlowIndex": 3, "label": "Profile", "insight": "Strong foundation \u2014 you're ahead of 73% of coaches we've assessed" },
  { "atFlowIndex": 7, "label": "Readiness", "insight": "High readiness detected \u2014 your business model is primed for AI products" },
  { "atFlowIndex": 12, "label": "Potential", "insight": "Matched to 3 proven AI product templates for your niche" },
  { "atFlowIndex": 19, "label": "Results" }
]
```

- [ ] **Step 3: Add milestones to seed-config.ts**

In the "Assemble and save" section, add `milestones` to the config object:

```typescript
const config: QuizConfig = {
  flow,
  questions,
  callouts,
  fitScores,
  actionPlan,
  milestones: [
    { atFlowIndex: 3, label: 'Profile', insight: "Strong foundation \u2014 you're ahead of 73% of coaches we've assessed" },
    { atFlowIndex: 7, label: 'Readiness', insight: "High readiness detected \u2014 your business model is primed for AI products" },
    { atFlowIndex: 12, label: 'Potential', insight: 'Matched to 3 proven AI product templates for your niche' },
    { atFlowIndex: 19, label: 'Results' },
  ],
};
```

Also add `QuizMilestone` to the import from `'./quiz-config'` at the top.

- [ ] **Step 4: Add milestones to API route validation**

In `app/api/config/route.ts`, change the `requiredKeys` array to:

```typescript
const requiredKeys = ['flow', 'questions', 'callouts', 'fitScores', 'actionPlan', 'milestones'];
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add lib/quiz-config.ts data/quiz-config.json lib/seed-config.ts app/api/config/route.ts
git commit -m "feat: add QuizMilestone config type and milestone data"
```

---

## Chunk 2: CSS Animation

### Task 2: Add pulse-glow keyframe

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Add pulse-glow keyframe and reduced-motion override**

Add at the end of `globals.css` (after the `.thinking-dot` rules):

```css
@keyframes pulse-glow {
  0%, 100% { opacity: 0.6; box-shadow: 0 0 0 3px rgba(46,125,82,0.2), 0 0 8px rgba(46,125,82,0.15); }
  50% { opacity: 1; box-shadow: 0 0 0 3px rgba(46,125,82,0.3), 0 0 8px rgba(46,125,82,0.3); }
}
.pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
@media (prefers-reduced-motion: reduce) {
  .pulse-glow { animation: none; opacity: 1; }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/globals.css
git commit -m "feat: add pulse-glow CSS keyframe for progress dot"
```

---

## Chunk 3: OnboardingProgress Component

### Task 3: Create the progress header component

**Files:**
- Create: `components/OnboardingProgress.tsx`

This is a pure presentation component. It receives `currentFlowIndex`, `totalFlowItems`, and `milestones`, then renders the stepper bar, fill, floating pill, glowing dot, and milestone insight cards.

- [ ] **Step 1: Create OnboardingProgress.tsx**

```tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizMilestone } from '@/lib/quiz-config';

interface OnboardingProgressProps {
  currentFlowIndex: number;
  totalFlowItems: number;
  milestones: QuizMilestone[];
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function OnboardingProgress({
  currentFlowIndex,
  totalFlowItems,
  milestones,
}: OnboardingProgressProps) {
  const percentage = Math.round(((currentFlowIndex + 1) / totalFlowItems) * 100);
  const [displayedPercentage, setDisplayedPercentage] = useState(percentage);
  const [activeInsight, setActiveInsight] = useState<{ label: string; insight: string } | null>(null);
  const [showPill, setShowPill] = useState(true);
  const prevPercentageRef = useRef(percentage);
  const animFrameRef = useRef<number>(0);
  const insightTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  // Ticking percentage animation
  useEffect(() => {
    const from = prevPercentageRef.current;
    const to = percentage;
    prevPercentageRef.current = to;

    if (from === to) return;

    const startTime = performance.now();
    const duration = 400;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplayedPercentage(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [percentage]);

  // Check for milestone hit
  const checkMilestone = useCallback(() => {
    const hit = milestones.find(
      (m) => m.atFlowIndex === currentFlowIndex && m.insight
    );
    if (hit) {
      setShowPill(false);
      setActiveInsight({ label: hit.label, insight: hit.insight! });

      insightTimeoutRef.current = setTimeout(() => {
        setActiveInsight(null);
        setShowPill(true);
      }, 2400); // 200ms appear + 2000ms hold + 200ms fade handled by CSS
    }
  }, [currentFlowIndex, milestones]);

  useEffect(() => {
    checkMilestone();
    return () => {
      if (insightTimeoutRef.current) clearTimeout(insightTimeoutRef.current);
    };
  }, [checkMilestone]);

  // Compute which milestones are completed
  const completedMilestones = milestones.filter(
    (m) => currentFlowIndex >= m.atFlowIndex
  );

  // Dot positions: evenly spaced but NOT starting at 0%.
  // With 4 milestones: 25%, 50%, 75%, 100%. This leaves room for the fill
  // to advance visually before the first checkpoint.
  const getMilestoneTrackPosition = (index: number) =>
    ((index + 1) / milestones.length) * 100;

  // Fill position: interpolate between milestone positions on the track
  const getFillPosition = () => {
    for (let i = milestones.length - 1; i >= 0; i--) {
      if (currentFlowIndex >= milestones[i].atFlowIndex) {
        const thisPos = getMilestoneTrackPosition(i);
        if (i === milestones.length - 1) return thisPos;
        const nextMilestone = milestones[i + 1];
        const segmentFlowItems = nextMilestone.atFlowIndex - milestones[i].atFlowIndex;
        const progressInSegment = currentFlowIndex - milestones[i].atFlowIndex;
        const nextPos = getMilestoneTrackPosition(i + 1);
        return thisPos + ((nextPos - thisPos) * progressInSegment) / segmentFlowItems;
      }
    }
    // Before first milestone — fill from 0% toward first dot position
    const firstPos = getMilestoneTrackPosition(0); // 25% with 4 milestones
    return (firstPos * (currentFlowIndex + 1)) / (milestones[0].atFlowIndex + 1);
  };

  const fillPos = getFillPosition();

  return (
    <div
      className="flex-shrink-0"
      style={{ padding: '20px 24px 10px', borderBottom: '1px solid #E5E5E8', position: 'relative' }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Quiz progress"
    >
      {/* Stepper track */}
      <div style={{ position: 'relative', height: '22px' }}>
        {/* Track background */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '11px',
            right: '11px',
            height: '3px',
            transform: 'translateY(-50%)',
            background: '#E5E5E8',
            borderRadius: '2px',
          }}
        />
        {/* Fill */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '11px',
            height: '3px',
            transform: 'translateY(-50%)',
            width: `${fillPos}%`,
            background: 'linear-gradient(90deg, #22c55e, #2E7D52)',
            borderRadius: '2px',
            transition: 'width 400ms ease-out',
          }}
        />

        {/* Floating pill + connector + glowing dot */}
        {showPill && (
          <div
            style={{
              position: 'absolute',
              top: '-20px',
              left: `calc(11px + ${fillPos}% - 1px)`,
              transform: 'translateX(-50%)',
              textAlign: 'center',
              transition: 'left 400ms ease-out',
              zIndex: 3,
            }}
          >
            <div
              style={{
                background: '#2E7D52',
                color: 'white',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 12px',
                borderRadius: '99px',
                whiteSpace: 'nowrap',
                letterSpacing: '0.3px',
              }}
            >
              {displayedPercentage}%
            </div>
            {/* Thin connector line */}
            <div
              style={{
                width: '1px',
                height: '8px',
                background: 'rgba(46,125,82,0.4)',
                margin: '0 auto',
              }}
            />
          </div>
        )}

        {/* Glowing dot at fill edge */}
        {showPill && (
          <div
            className="pulse-glow"
            style={{
              position: 'absolute',
              top: '50%',
              left: `calc(11px + ${fillPos}% - 1px)`,
              transform: 'translate(-50%, -50%)',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#2E7D52',
              zIndex: 2,
              transition: 'left 400ms ease-out',
            }}
          />
        )}

        {/* Checkpoint dots — absolutely positioned to match track fill positions */}
        <>
          {milestones.map((milestone, i) => {
            const dotPos = getMilestoneTrackPosition(i);
            const isCompleted = completedMilestones.includes(milestone);
            const isActive =
              !isCompleted &&
              (i === 0 || completedMilestones.includes(milestones[i - 1]));

            return (
              <div
                key={milestone.label}
                className={isCompleted ? 'animate-scale-in' : ''}
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: `${dotPos}%`,
                  transform: 'translate(-50%, -50%)',
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  transition: 'all 300ms ease',
                  ...(isCompleted
                    ? { background: '#22c55e' }
                    : isActive
                      ? {
                          border: '2px solid rgba(46,125,82,0.92)',
                          boxShadow: '0 0 0 3px rgba(46,125,82,0.12)',
                          background: 'white',
                        }
                      : {
                          border: '2px solid #E5E5E8',
                          opacity: 0.5,
                          background: 'white',
                        }),
                }}
              >
                {isCompleted ? (
                  <CheckIcon />
                ) : (
                  <span
                    style={{
                      fontSize: '9px',
                      fontWeight: 700,
                      color: isActive ? 'rgba(46,125,82,0.92)' : '#A1A1AA',
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </div>
            );
          })}
        </>
      </div>

      {/* Phase labels — same positioning system as dots */}
      <div style={{ position: 'relative', height: '14px', marginTop: '2px', marginLeft: '11px', marginRight: '11px' }}>
        {milestones.map((milestone, i) => {
          const isCompleted = completedMilestones.includes(milestone);
          const dotPos = getMilestoneTrackPosition(i);
          return (
            <span
              key={milestone.label}
              style={{
                position: 'absolute',
                left: `${dotPos}%`,
                transform: 'translateX(-50%)',
                fontSize: '8px',
                fontWeight: isCompleted ? 600 : 500,
                color: isCompleted ? '#22c55e' : '#A1A1AA',
                textAlign: 'center',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
              }}
            >
              {milestone.label}
            </span>
          );
        })}
      </div>

      {/* Milestone insight card */}
      {activeInsight && (
        <div
          aria-live="polite"
          className="animate-fade-in-up"
          style={{
            position: 'absolute',
            left: '16px',
            right: '16px',
            top: '100%',
            marginTop: '8px',
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
            border: '1px solid rgba(46,125,82,0.2)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#2E7D52',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'white', fontSize: '14px' }}>&#x2713;</span>
          </div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#166534' }}>
              {activeInsight.label} Complete
            </div>
            <div style={{ fontSize: '11px', color: '#15803d', marginTop: '2px' }}>
              {activeInsight.insight}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. The component isn't rendered yet, but TypeScript should find no errors.

- [ ] **Step 3: Commit**

```bash
git add components/OnboardingProgress.tsx
git commit -m "feat: add OnboardingProgress component with stepper, pill, and milestones"
```

---

## Chunk 4: Wire Into Onboarding Flow

### Task 4: Pass milestones through App and track flow index in OnboardingChat

**Files:**
- Modify: `components/App.tsx:5,23-34,48-53,134-135,217-223`
- Modify: `components/OnboardingChat.tsx:1-26,38-48,50-51`

- [ ] **Step 1: Update App.tsx to pass milestones and flow**

In `App.tsx`:

Update the import at line 5:
```typescript
import { QuizConfig, configToOnboardingMessages, configToActionPlanTasks, QuizMilestone, FlowItem } from '@/lib/quiz-config';
```

Update the full `AppContent` function signature to accept the new props:
```typescript
function AppContent({
  appState,
  onOnboardingComplete,
  onGeneratingComplete,
  onboardingMessages,
  initialTasks,
  milestones,
  flow,
}: {
  appState: AppState;
  onOnboardingComplete: () => void;
  onGeneratingComplete: () => void;
  onboardingMessages: DMessage[];
  initialTasks: ActionTask[];
  milestones: QuizMilestone[];
  flow: FlowItem[];
}) {
```

Pass through to `OnboardingChat` in the onboarding phase render:
```tsx
<OnboardingChat
  onComplete={handleOnboardingComplete}
  messages={onboardingMessages}
  milestones={milestones}
  totalFlowItems={flow.length}
/>
```

In the outer `App` component, pass the new props to `AppContent`:
```tsx
<AppContent
  appState={appState}
  onOnboardingComplete={handleOnboardingComplete}
  onGeneratingComplete={handleGeneratingComplete}
  onboardingMessages={onboardingMessages}
  initialTasks={initialTasks}
  milestones={config.milestones}
  flow={config.flow}
/>
```

- [ ] **Step 2: Update OnboardingChat to track flow index and render progress**

Update `OnboardingChatProps`:
```typescript
interface OnboardingChatProps {
  onComplete: (answers: UserAnswers) => void;
  messages: DMessage[];
  milestones: QuizMilestone[];
  totalFlowItems: number;
}
```

Add imports:
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { QuizMilestone } from '@/lib/quiz-config';
import OnboardingProgress from './OnboardingProgress';
```

Add state for flow index tracking:
```typescript
const [currentFlowIndex, setCurrentFlowIndex] = useState(-1);
```

It starts at `-1` (before any interaction). The progress header is hidden when `currentFlowIndex < 0`.

Wrap the chip/continue handlers to increment the flow index:

```typescript
const onChipSelect = useCallback((messageId: string, chipValue: string) => {
  if (!waitingForInput) return;
  userAnswersRef.current = { ...userAnswersRef.current, [messageId]: chipValue };
  setCurrentFlowIndex(prev => prev + 1);
  handleChipSelect(messageId);
}, [waitingForInput, handleChipSelect]);

const onMultiSubmit = useCallback((messageId: string, values: string[]) => {
  if (!waitingForInput) return;
  userAnswersRef.current = { ...userAnswersRef.current, [messageId]: values.join(',') };
  setCurrentFlowIndex(prev => prev + 1);
  handleMultiSubmit(messageId);
}, [waitingForInput, handleMultiSubmit]);
```

Also wrap `handleContinue` for callouts/fit-scores. Add a new handler that increments then delegates:

```typescript
const onContinue = useCallback(() => {
  setCurrentFlowIndex(prev => prev + 1);
  handleContinue();
}, [handleContinue]);
```

Replace both `handleContinue` references in the JSX with `onContinue`:

```tsx
<FitScore
  percentage={msg.fitScore.percentage}
  message={msg.fitScore.message}
  cta={msg.fitScore.cta}
  onCtaClick={msg.id === activeFitScoreId ? onContinue : () => {}}
/>
```

```tsx
<Callout
  headline={msg.callout.headline}
  body={msg.callout.body}
  stat={msg.callout.stat}
  onContinue={msg.id === activeCalloutId ? onContinue : () => {}}
/>
```

Render `OnboardingProgress` above the scroll container (inside the outer `div`), only when `currentFlowIndex >= 0`:

```tsx
return (
  <div className="flex flex-col h-full">
    {currentFlowIndex >= 0 && (
      <OnboardingProgress
        currentFlowIndex={currentFlowIndex}
        totalFlowItems={totalFlowItems}
        milestones={milestones}
      />
    )}
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
      {/* ... existing chat content ... */}
    </div>
  </div>
);
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 4: Verify in browser**

Run: `npm run dev`
Open `http://localhost:3000`. Complete the welcome callout. The progress header should appear with the floating pill at ~5%, and advance with each answer. Check that:
- Pill percentage ticks up with counting animation
- Glowing dot pulses on the bar
- At flow index 3 (after 4th item), milestone insight card appears for Profile
- After ~2.4s the insight card fades and pill reappears
- Checkpoint dots fill green with check icons at milestones

- [ ] **Step 5: Commit**

```bash
git add components/App.tsx components/OnboardingChat.tsx
git commit -m "feat: wire OnboardingProgress into quiz flow with flow index tracking"
```

---

## Chunk 5: Build Verification

### Task 5: Final verification and cleanup

- [ ] **Step 1: Full build**

Run: `npm run build`
Expected: Build succeeds, no warnings.

- [ ] **Step 2: Test both demo stages**

Open `http://localhost:3000`. Test:
1. **Quiz stage:** Progress header appears after welcome callout, advances per answer, milestones fire, pill + dot animate correctly
2. **Action Plan stage:** Switch via demo controls — progress header should NOT appear in action plan phase
3. **Reset:** Reset demo — progress header resets to hidden

- [ ] **Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: resolve any issues from quiz progression integration"
```
