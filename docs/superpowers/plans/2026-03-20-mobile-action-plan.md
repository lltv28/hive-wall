# Mobile Action Plan Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken sidebar + FlowChat layout with a stepper bar + continuous chat flow + pinned offer CTA that works at 430px mobile viewport.

**Architecture:** The current `action-plan` / `guided-flow` two-screen pattern collapses into a single `action-plan` state. A new `PlanFlow` component owns all step progression internally, reusing `OnboardingChat`'s message reveal pattern. Two new leaf components (`StepperBar`, `PinnedOffer`) handle the fixed top/bottom chrome.

**Tech Stack:** React 19, Next.js 16, Tailwind 4, TypeScript

**Spec:** `docs/superpowers/specs/2026-03-20-mobile-action-plan-design.md`

---

### Task 1: Create StepperBar component

**Files:**
- Create: `components/StepperBar.tsx`

- [ ] **Step 1: Create the StepperBar component**

```tsx
// components/StepperBar.tsx
'use client';

interface StepperBarProps {
  totalSteps: number;
  currentStepIndex: number; // 0-based index of the active step
  completedCount: number;   // number of steps completed (always a prefix)
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StepperBar({ totalSteps, currentStepIndex, completedCount }: StepperBarProps) {
  return (
    <div
      className="flex-shrink-0"
      style={{ padding: '14px 24px 12px', borderBottom: '1px solid #E5E5E8' }}
    >
      <div className="flex items-center">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < completedCount;
          const isActive = i === currentStepIndex;
          const stepNumber = i + 1;

          // Line BEFORE this dot (except first dot)
          const lineBefore = i > 0 && (
            <div
              key={`line-${i}`}
              style={{
                flex: 1,
                height: '2px',
                background: i <= completedCount && (isCompleted || isActive)
                  ? 'rgba(59,130,246,0.92)'
                  : '#E5E5E8',
                transition: 'background 500ms ease',
              }}
            />
          );

          const dot = (
            <div
              key={`dot-${i}`}
              className={isCompleted ? 'animate-scale-in' : ''}
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 300ms ease',
                ...(isCompleted
                  ? { background: '#22c55e' }
                  : isActive
                    ? {
                        border: '2px solid rgba(59,130,246,0.92)',
                        boxShadow: '0 0 0 3px rgba(59,130,246,0.12)',
                      }
                    : {
                        border: '2px solid #E5E5E8',
                        opacity: 0.5,
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
                    color: isActive ? 'rgba(59,130,246,0.92)' : '#A1A1AA',
                  }}
                >
                  {stepNumber}
                </span>
              )}
            </div>
          );

          return [lineBefore, dot];
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

Open http://localhost:3000, temporarily import `StepperBar` in `App.tsx` and render it with test props `totalSteps={5} currentStepIndex={1} completedCount={1}` to visually verify. Remove test code after.

- [ ] **Step 3: Commit**

```bash
git add components/StepperBar.tsx
git commit -m "feat: add StepperBar component for mobile action plan"
```

---

### Task 2: Create PinnedOffer component

**Files:**
- Create: `components/PinnedOffer.tsx`

- [ ] **Step 1: Create the PinnedOffer component**

```tsx
// components/PinnedOffer.tsx
'use client';

import { ActionTask } from '@/lib/types';

interface PinnedOfferProps {
  offer: ActionTask;
  onTap: () => void;
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b">
      <path d="M7 1.5L8.55 4.95L12.5 5.35L9.5 8.05L10.35 12L7 10.05L3.65 12L4.5 8.05L1.5 5.35L5.45 4.95L7 1.5Z" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#b45309" strokeWidth="1.5">
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

export default function PinnedOffer({ offer, onTap }: PinnedOfferProps) {
  return (
    <button
      type="button"
      onClick={onTap}
      className="flex-shrink-0 w-full text-left cursor-pointer"
      style={{
        padding: '12px 16px',
        borderTop: '1px solid #E5E5E8',
        background: '#fffbeb',
        border: 'none',
        borderTopStyle: 'solid',
        borderTopWidth: '1px',
        borderTopColor: '#E5E5E8',
      }}
    >
      <div className="flex items-center gap-3">
        <StarIcon />
        <div className="flex-1 min-w-0">
          <div
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: '#92400e',
            }}
          >
            {offer.title}
          </div>
          {offer.subtitle && (
            <div
              style={{
                fontSize: '10px',
                color: '#b45309',
              }}
            >
              {offer.subtitle}
            </div>
          )}
        </div>
        <ChevronRight />
      </div>
    </button>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PinnedOffer.tsx
git commit -m "feat: add PinnedOffer component for mobile action plan"
```

---

### Task 3: Create PlanFlow component

This is the main component — it replaces `ActionPlanSidebar` + `FlowChat` with a single continuous chat flow. It reuses the message reveal pattern from `OnboardingChat`.

**Files:**
- Create: `components/PlanFlow.tsx`

**Reference:** Read `components/OnboardingChat.tsx` for the `revealMessage`, `smoothScrollTo`, typing indicator, and chip handling patterns. This component adapts that same logic to play through multiple tasks sequentially.

- [ ] **Step 1: Create PlanFlow component**

The component needs to:
1. Accept `steps` (non-offer tasks) and `offers` (offer tasks) as props
2. Flatten all steps' messages into a single sequential flow, with step boundary markers
3. Track `currentStepIndex` and `completedCount` for the stepper
4. When a guided step's messages finish, auto-advance `currentStepIndex` after 600ms
5. For quick tasks (no messages), inject a synthetic AI message + "Got it" chip
6. Render `StepperBar` at top, scrollable chat in middle, `PinnedOffer` at bottom
7. Handle offer tap → full-screen offer view with back button

```tsx
// components/PlanFlow.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ActionTask, DMessage } from '@/lib/types';
import StepperBar from './StepperBar';
import PinnedOffer from './PinnedOffer';
import OfferCard from './OfferCard';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';
import VideoEmbed from './VideoEmbed';
import VisualCard from './VisualCard';
import ChipPicker from './ChipPicker';
import Interstitial from './Interstitial';
import FitScore from './FitScore';

interface PlanFlowProps {
  steps: ActionTask[];   // non-offer tasks, in order
  offers: ActionTask[];  // offer tasks
}

// Build the message list for a step. Quick tasks get a synthetic message.
function getStepMessages(step: ActionTask): DMessage[] {
  if (step.type === 'guided' && step.messages && step.messages.length > 0) {
    return step.messages;
  }
  // Quick task — synthesize a message with a "Got it" chip
  return [
    {
      id: `quick-${step.id}`,
      sender: 'ai' as const,
      content: step.subtitle || step.title,
      chips: [{ label: 'Got it', value: 'got-it' }],
      waitForInput: true,
    },
  ];
}

export default function PlanFlow({ steps, offers }: PlanFlowProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<DMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingVisible, setThinkingVisible] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [answeredMessages, setAnsweredMessages] = useState<Set<string>>(new Set());
  const [showingOffer, setShowingOffer] = useState(false);
  const [offerConfirmed, setOfferConfirmed] = useState(false);
  const [allComplete, setAllComplete] = useState(false);

  const currentMsgIndexRef = useRef(0);
  const hasAnimated = useRef(new Set<string>());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastItemRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollAnimRef = useRef<number>(0);

  // Track which step's messages are currently being played
  const currentStepMessagesRef = useRef<DMessage[]>([]);

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  // --- Smooth scroll (same as OnboardingChat) ---
  const smoothScrollTo = useCallback((el: HTMLElement, block: ScrollLogicalPosition, duration = 600) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    cancelAnimationFrame(scrollAnimRef.current);
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    let targetScroll: number;
    if (block === 'center') {
      targetScroll = container.scrollTop + (elRect.top - containerRect.top) - (containerRect.height / 2) + (elRect.height / 2);
    } else {
      const elTop = elRect.top - containerRect.top;
      const elBottom = elTop + elRect.height;
      if (elTop >= 0 && elBottom <= containerRect.height) return;
      targetScroll = elTop < 0
        ? container.scrollTop + elTop
        : container.scrollTop + elBottom - containerRect.height;
    }
    targetScroll = Math.max(0, Math.min(targetScroll, container.scrollHeight - containerRect.height));
    const startScroll = container.scrollTop;
    const distance = targetScroll - startScroll;
    if (Math.abs(distance) < 1) return;
    const startTime = performance.now();
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      container.scrollTop = startScroll + distance * ease(progress);
      if (progress < 1) scrollAnimRef.current = requestAnimationFrame(step);
    };
    scrollAnimRef.current = requestAnimationFrame(step);
  }, []);

  // --- Typing indicator visibility delay (same as OnboardingChat) ---
  useEffect(() => {
    if (isThinking) {
      const id = requestAnimationFrame(() => setThinkingVisible(true));
      return () => { cancelAnimationFrame(id); setThinkingVisible(false); };
    } else {
      setThinkingVisible(false);
    }
  }, [isThinking]);

  // --- Scroll on state changes ---
  useEffect(() => {
    if (thinkingVisible) {
      const id = setTimeout(() => {
        if (thinkingRef.current) smoothScrollTo(thinkingRef.current, 'nearest', 400);
      }, 300);
      return () => clearTimeout(id);
    } else if (!isThinking) {
      const id = setTimeout(() => {
        if (lastItemRef.current) smoothScrollTo(lastItemRef.current, 'center', 600);
      }, 150);
      return () => clearTimeout(id);
    }
  }, [visibleMessages, thinkingVisible, isThinking, smoothScrollTo]);

  // --- Reveal a single message ---
  const revealMessage = useCallback(
    (index: number, messages: DMessage[]) => {
      if (index >= messages.length) {
        // Step complete — advance to next step
        addTimeout(() => {
          setCompletedCount((prev) => prev + 1);
          setCurrentStepIndex((prev) => {
            const next = prev + 1;
            if (next >= steps.length) {
              // All steps done — show congrats message
              setAllComplete(true);
              const congratsMsg: DMessage = {
                id: 'plan-complete',
                sender: 'ai',
                content: "You've completed your entire action plan! Your AI product foundation is set. Check out the offer below to accelerate your launch.",
              };
              addTimeout(() => {
                setIsThinking(true);
                addTimeout(() => {
                  setIsThinking(false);
                  hasAnimated.current.add(congratsMsg.id);
                  setVisibleMessages((prev) => [...prev, congratsMsg]);
                }, 800);
              }, 600);
              return prev; // don't go past the end
            }
            // Start next step after a pause
            addTimeout(() => {
              const nextMessages = getStepMessages(steps[next]);
              currentStepMessagesRef.current = nextMessages;
              currentMsgIndexRef.current = 0;
              revealMessage(0, nextMessages);
            }, 600);
            return next;
          });
        }, 600);
        return;
      }

      const msg = messages[index];

      // Interstitials / fit scores — show directly
      if (msg.fitScore || msg.interstitial) {
        addTimeout(() => {
          hasAnimated.current.add(msg.id);
          setVisibleMessages((prev) => [...prev, msg]);
          currentMsgIndexRef.current = index + 1;
          if (msg.waitForInput) {
            setWaitingForInput(true);
            return;
          }
          if (index + 1 < messages.length) {
            addTimeout(() => revealMessage(index + 1, messages), 400);
          } else {
            // End of step messages
            revealMessage(messages.length, messages);
          }
        }, 400);
        return;
      }

      // Normal messages — typing indicator then reveal
      addTimeout(() => {
        setIsThinking(true);
        const typingDuration = 800 + Math.random() * 400;
        addTimeout(() => {
          setIsThinking(false);
          hasAnimated.current.add(msg.id);
          setVisibleMessages((prev) => [...prev, msg]);
          currentMsgIndexRef.current = index + 1;

          if (msg.waitForInput || (msg.chips && msg.chips.length > 0)) {
            setWaitingForInput(true);
            return;
          }

          if (index + 1 < messages.length) {
            addTimeout(() => revealMessage(index + 1, messages), 400);
          } else {
            revealMessage(messages.length, messages);
          }
        }, typingDuration);
      }, 300);
    },
    [addTimeout, steps],
  );

  // --- Start first step on mount ---
  useEffect(() => {
    if (steps.length === 0) return;
    // Skip already-completed steps (e.g. "Complete Your Profile")
    let startIndex = 0;
    let completed = 0;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].status === 'completed') {
        startIndex = i + 1;
        completed = i + 1;
      } else {
        break;
      }
    }
    setCompletedCount(completed);
    setCurrentStepIndex(startIndex);

    if (startIndex < steps.length) {
      const msgs = getStepMessages(steps[startIndex]);
      currentStepMessagesRef.current = msgs;
      currentMsgIndexRef.current = 0;
      revealMessage(0, msgs);
    }

    return () => {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Chip selection handler ---
  const handleChipSelect = useCallback(
    (messageId: string) => {
      if (!waitingForInput) return;
      setAnsweredMessages((prev) => new Set(prev).add(messageId));
      setWaitingForInput(false);

      addTimeout(() => {
        const nextIndex = currentMsgIndexRef.current;
        const msgs = currentStepMessagesRef.current;
        if (nextIndex < msgs.length) {
          revealMessage(nextIndex, msgs);
        } else {
          // End of step
          revealMessage(msgs.length, msgs);
        }
      }, 600);
    },
    [waitingForInput, addTimeout, revealMessage],
  );

  // --- Multi-select handler ---
  const handleMultiSubmit = useCallback(
    (messageId: string) => {
      if (!waitingForInput) return;
      setAnsweredMessages((prev) => new Set(prev).add(messageId));
      setWaitingForInput(false);

      addTimeout(() => {
        const nextIndex = currentMsgIndexRef.current;
        const msgs = currentStepMessagesRef.current;
        if (nextIndex < msgs.length) {
          revealMessage(nextIndex, msgs);
        } else {
          revealMessage(msgs.length, msgs);
        }
      }, 600);
    },
    [waitingForInput, addTimeout, revealMessage],
  );

  // --- Interstitial/FitScore continue handler ---
  const handleContinue = useCallback(() => {
    if (!waitingForInput) return;
    setWaitingForInput(false);
    addTimeout(() => {
      const nextIndex = currentMsgIndexRef.current;
      const msgs = currentStepMessagesRef.current;
      if (nextIndex < msgs.length) {
        revealMessage(nextIndex, msgs);
      } else {
        revealMessage(msgs.length, msgs);
      }
    }, 200);
  }, [waitingForInput, addTimeout, revealMessage]);

  // --- Active message IDs for interactive elements ---
  const activeChipMessageId = waitingForInput
    ? visibleMessages.findLast((m) =>
        m.chips && m.waitForInput && !m.fitScore && !m.interstitial &&
        !answeredMessages.has(m.id)
      )?.id ?? visibleMessages.findLast((m) =>
        m.chips && !m.fitScore && !m.interstitial &&
        !answeredMessages.has(m.id)
      )?.id
    : null;

  const activeFitScoreId = waitingForInput
    ? visibleMessages.findLast((m) => m.fitScore && m.waitForInput)?.id
    : null;

  const activeInterstitialId = waitingForInput
    ? visibleMessages.findLast((m) => m.interstitial && m.waitForInput)?.id
    : null;

  // --- Offer view ---
  if (showingOffer && offers.length > 0) {
    const offer = offers[0];
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div
          className="flex-shrink-0 flex items-center"
          style={{ padding: '12px 20px', borderBottom: '1px solid #E5E5E8' }}
        >
          <button
            type="button"
            onClick={() => setShowingOffer(false)}
            className="text-xs cursor-pointer bg-transparent border-none"
            style={{ color: 'rgba(59,130,246,0.92)' }}
          >
            &larr; Back to Plan
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center px-5">
          {offerConfirmed ? (
            <div className="text-center animate-fade-in-up">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ background: '#22c55e' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M4 10.5L8 14.5L16 6.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold mb-4" style={{ color: 'var(--alpha-light-900)' }}>
                {offer.offerCta?.toLowerCase().includes('book') ? 'Booked!' : 'Purchased!'}
              </p>
              <button
                type="button"
                onClick={() => setShowingOffer(false)}
                className="text-xs cursor-pointer bg-transparent border-none"
                style={{ color: 'rgba(59,130,246,0.92)' }}
              >
                &larr; Back to Plan
              </button>
            </div>
          ) : (
            <OfferCard
              title={offer.title}
              description={offer.subtitle || ''}
              cta={offer.offerCta || 'Get Started'}
              price={offer.offerPrice}
              onCtaClick={() => setOfferConfirmed(true)}
            />
          )}
        </div>
      </div>
    );
  }

  // --- Main layout: stepper + chat + pinned offer ---
  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden animate-fade-in">
      <StepperBar
        totalSteps={steps.length}
        currentStepIndex={currentStepIndex}
        completedCount={completedCount}
      />

      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <div className="max-w-[640px] mx-auto flex flex-col gap-6 pt-5 pb-[50vh] px-4">
          {visibleMessages.map((msg, index) => {
            const distFromEnd = visibleMessages.length - 1 - index;
            const opacity = distFromEnd === 0 ? 1 : distFromEnd === 1 ? 0.5 : distFromEnd === 2 ? 0.3 : 0.2;
            const isLast = index === visibleMessages.length - 1 && !thinkingVisible;
            return (
              <div key={msg.id} ref={isLast ? lastItemRef : undefined} style={{ opacity, transition: 'opacity 0.4s ease' }}>
                {msg.fitScore && (
                  <FitScore
                    percentage={msg.fitScore.percentage}
                    message={msg.fitScore.message}
                    cta={msg.fitScore.cta}
                    onCtaClick={msg.id === activeFitScoreId ? handleContinue : () => {}}
                  />
                )}
                {msg.interstitial && (
                  <Interstitial
                    headline={msg.interstitial.headline}
                    body={msg.interstitial.body}
                    stat={msg.interstitial.stat}
                    onContinue={msg.id === activeInterstitialId ? handleContinue : () => {}}
                  />
                )}
                {!msg.fitScore && !msg.interstitial && (
                  <>
                    <MessageBubble message={msg} isNew={hasAnimated.current.has(msg.id)}>
                      {msg.video && (
                        <VideoEmbed src={msg.video.src} title={msg.video.title} duration={msg.video.duration} />
                      )}
                      {msg.visualCard && (
                        <VisualCard icon={msg.visualCard.icon} title={msg.visualCard.title} items={msg.visualCard.items} />
                      )}
                    </MessageBubble>
                    {msg.chips && (msg.id === activeChipMessageId || answeredMessages.has(msg.id)) && (
                      <div className={`mt-3 ${msg.chips.some((c) => c.emoji) ? '' : 'ml-9'}`}>
                        <ChipPicker
                          chips={msg.chips}
                          multiSelect={msg.multiSelect}
                          disabled={answeredMessages.has(msg.id)}
                          onSelect={() => {
                            if (!msg.multiSelect) handleChipSelect(msg.id);
                          }}
                          onMultiSubmit={() => handleMultiSubmit(msg.id)}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
          {thinkingVisible && <div ref={thinkingRef}><TypingIndicator /></div>}
        </div>
      </div>

      {offers.length > 0 && (
        <PinnedOffer offer={offers[0]} onTap={() => setShowingOffer(true)} />
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/PlanFlow.tsx
git commit -m "feat: add PlanFlow component — continuous chat flow with stepper"
```

---

### Task 4: Wire PlanFlow into App.tsx and simplify state machine

**Files:**
- Modify: `components/App.tsx`

- [ ] **Step 1: Update AppState and simplify App.tsx**

Changes needed in `App.tsx`:

1. Change `AppState` type from `'onboarding' | 'generating' | 'action-plan' | 'guided-flow'` to `'onboarding' | 'generating' | 'action-plan'`
2. Remove `activeTaskId` state
3. Remove `handleTaskSelect`, `handleTaskComplete`, `handleBackToPlan` callbacks
4. Remove those props from `AppContent`
5. In `AppContent`, replace the Phase 2 return (lines 130-143 with `ActionPlanSidebar` + `FlowChat`) with `PlanFlow`
6. Import `PlanFlow` instead of `ActionPlanSidebar` and `FlowChat`
7. Compute `steps` and `offers` from `initialTasks` and pass to `PlanFlow`

The updated `AppContent` props become:
```tsx
{
  appState: AppState;
  onOnboardingComplete: () => void;
  onGeneratingComplete: () => void;
  onboardingMessages: DMessage[];
  initialTasks: ActionTask[];
}
```

The Phase 2 render becomes:
```tsx
// ---------- Phase 2: Action Plan ----------
const steps = tasks.filter((t) => t.type !== 'offer');
const offerTasks = tasks.filter((t) => t.type === 'offer');

return (
  <PlanFlow steps={steps} offers={offerTasks} />
);
```

Remove unused imports: `ActionPlanSidebar`, `FlowChat`.

In the outer `App` component:
- Remove `activeTaskId` state and its setter
- Remove `handleTaskSelect`, `handleTaskComplete`, `handleBackToPlan`
- Remove those props from `<AppContent>`
- The `handleReset` still works (resets `appState` + increments `key`)

- [ ] **Step 2: Verify the full flow works**

Open http://localhost:3000 and run through the complete flow:
1. Complete the onboarding quiz
2. Watch the generating checklist
3. Verify the action plan shows: stepper at top, chat flow in middle, pinned offer at bottom
4. Verify quick tasks show a "Got it" chip and auto-advance
5. Verify guided tasks play their messages with typing indicators
6. Verify tapping the pinned offer opens the full-screen offer view
7. Verify the stepper dots fill green as steps complete
8. Verify "Reset Demo" returns to onboarding

- [ ] **Step 3: Commit**

```bash
git add components/App.tsx
git commit -m "feat: wire PlanFlow into App, simplify to 3-state machine"
```

---

### Task 5: Clean up unused components

**Files:**
- Modify: `components/App.tsx` (remove dead imports if any remain)

- [ ] **Step 1: Verify no remaining references to removed components**

Check that `ActionPlanSidebar`, `FlowChat`, and `FlowHeader` are no longer imported anywhere in the app (they may still be used by the admin preview — check before deleting):

```bash
grep -r "ActionPlanSidebar\|FlowChat\|FlowHeader" --include="*.tsx" --include="*.ts" components/ app/
```

If they're only referenced by admin components, leave them. If they have zero references, they can be deleted in a future cleanup.

- [ ] **Step 2: Final manual test**

Run through the entire flow one more time end-to-end. Verify:
- Onboarding quiz works unchanged
- Generating screen works unchanged
- Action plan renders the new stepper + chat + offer layout
- Step transitions animate correctly
- All steps complete with final congratulations message

- [ ] **Step 3: Commit any cleanup**

```bash
git add -A
git commit -m "chore: clean up unused imports after mobile action plan refactor"
```
