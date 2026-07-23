// components/PlanFlow.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionTask, DMessage } from '@/lib/types';
import { createSeededRandom, computeDemoDelay, queryFlag, queryNumber } from '@/lib/demoAuto';
import { createTransitionScheduler } from '@/lib/progression/scheduler';
import { useProgressionController } from '@/lib/progression/useProgressionController';
import type { FlowNode } from '@/lib/progression/types';
import StepperBar from './StepperBar';
import PinnedOffer from './PinnedOffer';
import OfferCard from './OfferCard';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';
import VideoEmbed from './VideoEmbed';
import VisualCard from './VisualCard';
import ChipPicker from './ChipPicker';
import Callout from './Callout';
import FitScore from './FitScore';

interface PlanFlowProps {
  steps: ActionTask[];
  offers: ActionTask[];
}

const STEP_ADVANCE_DELAY_MS = 600;
const FINAL_MESSAGE =
  "You've completed your entire action plan! Your AI product foundation is set. Check out the offer below to accelerate your launch.";

function deriveInitialProgress(steps: ActionTask[]) {
  let startIndex = 0;
  let completed = 0;

  for (let i = 0; i < steps.length; i++) {
    if (steps[i].status === 'completed') {
      startIndex = i + 1;
      completed = i + 1;
      continue;
    }
    break;
  }

  return {
    startIndex,
    completed,
    allComplete: startIndex >= steps.length,
    showFinalMessage: startIndex >= steps.length,
  };
}

function getStepMessages(step: ActionTask): DMessage[] {
  if (step.type === 'guided' && step.messages && step.messages.length > 0) {
    return step.messages;
  }

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

function getWaitMode(message: DMessage): FlowNode['waitMode'] {
  if (message.chips && message.chips.length > 0) {
    return 'userAction';
  }

  if (message.waitForInput || message.fitScore || message.callout || message.resultComponent || message.triggersPhaseChange) {
    return 'phaseChange';
  }

  return 'none';
}

// Auto-advance dwell: a message's text streams at ~60 chars/sec (MessageBubble),
// so hold each one long enough to finish typing plus a beat to read — and longer
// when it carries a video or visual card. Prevents messages flashing past / the
// next bubble appearing before the previous has finished.
function dwellMs(message: DMessage): number {
  const text = typeof message.content === 'string' ? message.content : '';
  const streamMs = Math.round((text.length / 60) * 1000);
  const mediaMs = message.video || message.visualCard ? 1700 : 0;
  return Math.min(6500, Math.max(1600, streamMs + 1200 + mediaMs));
}

function buildStepNodes(step: ActionTask): FlowNode[] {
  return getStepMessages(step).map((message) => ({
    id: message.id,
    kind: message.fitScore
      ? 'fitScore'
      : message.callout
        ? 'callout'
        : message.resultComponent
          ? 'resultComponent'
          : 'guidedTask',
    waitMode: getWaitMode(message),
    autoDelayMs: dwellMs(message),
    payload: message,
  }));
}

function buildFinalNodes(): FlowNode[] {
  return [
    {
      id: 'plan-complete',
      kind: 'message',
      waitMode: 'none',
      autoDelayMs: 600,
      payload: {
        id: 'plan-complete',
        sender: 'ai' as const,
        content: FINAL_MESSAGE,
      },
    },
  ];
}

export default function PlanFlow({ steps, offers }: PlanFlowProps) {
  // Demo autoplay config (mirrors OnboardingChat): when ?demoAuto=1 the flow drives
  // itself. demoStartAt staggers each card to a different step so a wall of cards
  // isn't all on the same beat; demoSeed varies the jitter so they drift apart.
  const [demo] = useState(() => {
    if (typeof window === 'undefined') {
      return { enabled: false, speed: 1, answerDelayMs: 1100, loop: false, loopDelayMs: 3500, seed: 1, startAt: 0 };
    }
    const p = new URLSearchParams(window.location.search);
    return {
      enabled: queryFlag(p, 'demoAuto'),
      speed: queryNumber(p, 'demoSpeed', 1, { min: 0.25, max: 3 }),
      answerDelayMs: queryNumber(p, 'demoAnswerDelayMs', 1100, { min: 120, max: 5000 }),
      loop: queryFlag(p, 'demoLoop'),
      loopDelayMs: queryNumber(p, 'demoLoopDelayMs', 3500, { min: 800, max: 15000 }),
      seed: Math.floor(queryNumber(p, 'demoSeed', 1)),
      startAt: Math.floor(queryNumber(p, 'demoStartAt', 0, { min: 0, max: 200 })),
    };
  });
  const [demoRandom] = useState(() => createSeededRandom(demo.seed));
  const autoAdvancedRef = useRef<string | null>(null);

  const initialProgress = useMemo(() => deriveInitialProgress(steps), [steps]);
  // Stagger the starting step per card in demo mode so they aren't synchronized.
  const demoStart = useMemo(() => {
    const base = Math.min(initialProgress.startIndex, Math.max(steps.length - 1, 0));
    if (!demo.enabled || steps.length === 0) return { step: base, completed: initialProgress.completed };
    const step = (base + demo.startAt) % steps.length;
    return { step, completed: step };
  }, [demo.enabled, demo.startAt, initialProgress, steps.length]);
  const [currentStepIndex, setCurrentStepIndex] = useState(demoStart.step);
  const [completedCount, setCompletedCount] = useState(demoStart.completed);
  const [showingOffer, setShowingOffer] = useState(false);
  const [offerConfirmed, setOfferConfirmed] = useState(false);
  const [showFinalMessage, setShowFinalMessage] = useState(initialProgress.showFinalMessage);
  const [pendingAnsweredIds, setPendingAnsweredIds] = useState<Set<string>>(() => new Set());
  const allCompleteRef = useRef(initialProgress.allComplete);
  const stepCompletionHandledRef = useRef(false);
  const responseSchedulerRef = useRef(createTransitionScheduler(clearTimeout));

  const activeNodes = useMemo(() => {
    if (showFinalMessage) {
      return buildFinalNodes();
    }

    const step = steps[currentStepIndex];
    return step ? buildStepNodes(step) : [];
  }, [currentStepIndex, showFinalMessage, steps]);

  const {
    phase,
    visibleNodes,
    waitingNodeId,
    answeredIds,
    dispatch,
    bindings: { setScrollContainer, setActiveElement },
  } = useProgressionController({
    nodes: activeNodes,
    scrollMode: 'top',
    onComplete: () => {
      if (allCompleteRef.current || stepCompletionHandledRef.current) {
        return;
      }

      stepCompletionHandledRef.current = true;

      responseSchedulerRef.current.schedule('step-complete', () => {
        setCompletedCount((prev) => prev + 1);
        setCurrentStepIndex((prev) => {
          const next = prev + 1;
          if (next >= steps.length) {
            allCompleteRef.current = true;
            setShowFinalMessage(true);
            return prev;
          }

          setShowFinalMessage(false);
          return next;
        });
      }, STEP_ADVANCE_DELAY_MS);
    },
  });

  useEffect(() => {
    const scheduler = responseSchedulerRef.current;
    stepCompletionHandledRef.current = false;
    scheduler.cancelAll();

    if (activeNodes.length > 0) {
      dispatch({ type: 'START' });
    }
  }, [activeNodes, dispatch]);

  useEffect(() => {
    const scheduler = responseSchedulerRef.current;
    return () => {
      scheduler.cancelAll();
    };
  }, []);

  const handleGuidedAdvance = useCallback(
    (messageId: string, event: 'SELECT_CHIP' | 'SUBMIT_MULTI' | 'CONTINUE') => {
      setPendingAnsweredIds((prev) => new Set(prev).add(messageId));
      responseSchedulerRef.current.schedule(`advance-${messageId}`, () => {
        setPendingAnsweredIds((prev) => {
          const next = new Set(prev);
          next.delete(messageId);
          return next;
        });
        dispatch(
          event === 'CONTINUE'
            ? { type: 'CONTINUE' }
            : event === 'SUBMIT_MULTI'
              ? { type: 'SUBMIT_MULTI', nodeId: messageId }
              : { type: 'SELECT_CHIP', nodeId: messageId },
        );
      }, STEP_ADVANCE_DELAY_MS);
    },
    [dispatch],
  );

  const handleBack = useCallback(() => {
    responseSchedulerRef.current.cancelAll();
    setPendingAnsweredIds(new Set());
    dispatch({ type: 'BACK' });
  }, [dispatch]);

  // Demo autoplay: whenever a node is waiting on input, auto-answer it after a
  // jittered delay — chips select/submit, everything else continues. Step-to-step
  // advance is already automatic (onComplete), so this just unblocks each wait.
  useEffect(() => {
    if (!demo.enabled || showingOffer || showFinalMessage) return;
    if (!waitingNodeId || phase === 'typing') return;
    if (autoAdvancedRef.current === waitingNodeId) return; // advance each wait once
    const node = visibleNodes.find((n) => n.id === waitingNodeId);
    const msg = node?.payload as DMessage | undefined;
    if (!msg) return;
    const delay = computeDemoDelay(demo.answerDelayMs, demo.speed, demoRandom, { minMs: 1100, minJitter: 0.95, maxJitter: 1.25 });
    const id = window.setTimeout(() => {
      autoAdvancedRef.current = msg.id;
      if (msg.chips && msg.chips.length > 0) {
        handleGuidedAdvance(msg.id, msg.multiSelect ? 'SUBMIT_MULTI' : 'SELECT_CHIP');
      } else {
        handleGuidedAdvance(msg.id, 'CONTINUE');
      }
    }, delay);
    return () => window.clearTimeout(id);
  }, [demo.enabled, demo.answerDelayMs, demo.speed, demoRandom, waitingNodeId, phase, visibleNodes, showingOffer, showFinalMessage, handleGuidedAdvance]);

  // Demo loop: once the whole plan is complete, reload the iframe to start over.
  useEffect(() => {
    if (!demo.enabled || !demo.loop || !showFinalMessage) return;
    const delay = Math.round(demo.loopDelayMs / Math.max(0.1, demo.speed));
    const id = window.setTimeout(() => window.location.reload(), delay);
    return () => window.clearTimeout(id);
  }, [demo.enabled, demo.loop, demo.loopDelayMs, demo.speed, showFinalMessage]);

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
            style={{ color: 'var(--alpha-brand-950)' }}
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
                style={{ color: 'var(--alpha-brand-950)' }}
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

      <div ref={setScrollContainer} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <div className="max-w-[640px] mx-auto flex flex-col gap-7 pt-5 pb-[50vh] px-5">
          {visibleNodes.map((node, index) => {
            const msg = node.payload as DMessage;
            const distFromEnd = visibleNodes.length - 1 - index;
            const opacity = distFromEnd === 0 ? 1 : distFromEnd === 1 ? 0.5 : distFromEnd === 2 ? 0.3 : 0.2;
            const isLast = index === visibleNodes.length - 1;
            const isNew = !answeredIds.has(msg.id);
            const chipsDisabled = answeredIds.has(msg.id) || pendingAnsweredIds.has(msg.id);

            return (
              <div
                key={msg.id}
                ref={isLast && phase !== 'typing' ? setActiveElement : undefined}
                style={{ opacity, transition: 'opacity 0.4s ease' }}
              >
                {msg.fitScore && (
                  <FitScore
                    percentage={msg.fitScore.percentage}
                    message={msg.fitScore.message}
                    cta={msg.fitScore.cta}
                    onCtaClick={msg.id === waitingNodeId ? () => handleGuidedAdvance(msg.id, 'CONTINUE') : () => {}}
                  />
                )}
                {msg.callout && (
                  <Callout
                    headline={msg.callout.headline}
                    body={msg.callout.body}
                    stat={msg.callout.stat}
                    video={msg.callout.video}
                    onContinue={msg.id === waitingNodeId ? () => handleGuidedAdvance(msg.id, 'CONTINUE') : () => {}}
                  />
                )}
                {!msg.fitScore && !msg.callout && (
                  <>
                    <MessageBubble message={msg} isNew={isNew}>
                      {msg.video && <VideoEmbed src={msg.video.src} title={msg.video.title} duration={msg.video.duration} />}
                      {msg.visualCard && <VisualCard icon={msg.visualCard.icon} title={msg.visualCard.title} items={msg.visualCard.items} />}
                    </MessageBubble>
                    {msg.chips && (msg.id === waitingNodeId || answeredIds.has(msg.id)) && (
                      <div className={`mt-3 ${msg.chips.some((c) => c.emoji) ? '' : 'ml-9'}`}>
                        <ChipPicker
                          chips={msg.chips}
                          multiSelect={msg.multiSelect}
                          disabled={chipsDisabled}
                          onSelect={() => {
                            if (!msg.multiSelect) handleGuidedAdvance(msg.id, 'SELECT_CHIP');
                          }}
                          onMultiSubmit={() => handleGuidedAdvance(msg.id, 'SUBMIT_MULTI')}
                        />
                        {msg.id === waitingNodeId && currentStepIndex >= 0 && !showFinalMessage && (
                          <button
                            type="button"
                            onClick={handleBack}
                            className="mt-2 flex items-center gap-1 transition-colors duration-150"
                            style={{
                              fontSize: 'var(--text-xs)',
                              fontWeight: 'var(--font-medium)',
                              color: '#A1A1AA',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '4px 0',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = '#2E7D52'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = '#A1A1AA'; }}
                          >
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M10 12L6 8L10 4" />
                            </svg>
                            Back
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}

          {phase === 'typing' && (
            <div ref={setActiveElement}>
              <TypingIndicator />
            </div>
          )}
        </div>
      </div>

      {offers.length > 0 && (
        <PinnedOffer offer={offers[0]} onTap={() => setShowingOffer(true)} />
      )}
    </div>
  );
}
