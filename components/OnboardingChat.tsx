'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { asset } from '@/lib/basePath';
import { DMessage, UserAnswers } from '@/lib/types';
import { useChatFlow } from '@/lib/useChatFlow';
import { useSplitSync } from '@/lib/useSplitSync';
import { QuizMilestone } from '@/lib/quiz-config';
import OnboardingProgress from './OnboardingProgress';
import GeneratingChecklist from './GeneratingChecklist';

import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';
import StreamingText from './StreamingText';
import VideoEmbed from './VideoEmbed';
import VisualCard from './VisualCard';
import ChipPicker from './ChipPicker';
import FitScore from './FitScore';
import Callout from './Callout';
import { buildResultsMessages, ResultsConfig } from '@/lib/buildResults';
import ResultComponentRenderer from './results/ResultComponentRenderer';
import ResultsPaywall from './paywall/ResultsPaywall';
import BookingCard from './booking/BookingCard';
import { createSeededRandom, pickAutoValues, queryFlag, queryNumber, computeDemoDelay } from '@/lib/demoAuto';
import { deriveDemoOutcome, DemoOutcome, PURCHASE_VALUE_USD } from '@/lib/demoOutcome';

const ACKNOWLEDGMENTS = [
  "Got it — let me factor that in",
  "Interesting — that changes things",
  "Great, that helps narrow it down",
  "Noted — building your profile",
  "Good to know — adjusting my analysis",
  "That's helpful context",
];

const GENERATING_STEPS = [
  { label: 'Analyzing your business profile', icon: '\uD83D\uDD0D' },
  { label: 'Evaluating AI product potential', icon: '\uD83E\uDDE0' },
  { label: 'Matching you to client success patterns', icon: '\uD83D\uDCCA' },
  { label: 'Building your personalized report', icon: '\u26A1' },
];

interface OnboardingChatProps {
  messages: DMessage[];
  milestones: QuizMilestone[];
  totalFlowItems: number;
}

export default function OnboardingChat({ messages, milestones, totalFlowItems }: OnboardingChatProps) {
  const STREAMING_SPEED = 60; // chars/sec — must match MessageBubble
  const { broadcast, onEvent } = useSplitSync();

  const {
    visibleMessages, thinkingVisible, showCta, answeredMessages, waitingForInput,
    lastItemRef, thinkingRef, scrollContainerRef, hasAnimated,
    revealMessage, handleChipSelect, handleMultiSubmit, handleContinue, clearTimeouts,
    scrollLatestToTop, activeChipMessageId, activeFitScoreId, activeCalloutId, activeResultId,
    goBack, skipTo, appendMessages,
  } = useChatFlow({
    getAutoAdvanceDelay: (msg) => {
      const streamingMs = msg.content ? (msg.content.length / STREAMING_SPEED) * 1000 : 0;
      return Math.max(800, streamingMs + 500);
    },
  });

  const [currentFlowIndex, setCurrentFlowIndex] = useState(-1);
  const [acknowledgment, setAcknowledgment] = useState<string | null>(null);
  const [streamedMessages, setStreamedMessages] = useState<Set<string>>(() => new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [isResultsPaywallVisible, setIsResultsPaywallVisible] = useState(false);
  const [isBookingVisible, setIsBookingVisible] = useState(false);
  const outcomeReportedRef = useRef(false);
  const [skipPaywallTimer] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    const value = params.get('skipPaywallTimer');
    return value === '1' || value === 'true';
  });
  const [demoAutoConfig] = useState(() => {
    if (typeof window === 'undefined') {
      return {
        enabled: false,
        speed: 1,
        answerDelayMs: 900,
        loop: false,
        loopDelayMs: 3000,
        startAtMsgIndex: 0,
        seed: 1,
        leadId: -1,
      };
    }

    const params = new URLSearchParams(window.location.search);
    return {
      enabled: queryFlag(params, 'demoAuto'),
      speed: queryNumber(params, 'demoSpeed', 1, { min: 0.25, max: 3 }),
      answerDelayMs: queryNumber(params, 'demoAnswerDelayMs', 900, { min: 120, max: 5000 }),
      loop: queryFlag(params, 'demoLoop'),
      loopDelayMs: queryNumber(params, 'demoLoopDelayMs', 3000, { min: 800, max: 15000 }),
      startAtMsgIndex: Math.floor(queryNumber(params, 'demoStartAt', 0, { min: 0, max: 200 })),
      seed: Math.floor(queryNumber(params, 'demoSeed', Date.now() % 2147483647)),
      leadId: Math.floor(queryNumber(params, 'demoLeadId', -1, { min: -1, max: 100000 })),
    };
  });
  const [demoRandom] = useState(() => createSeededRandom(demoAutoConfig.seed));
  const [hasAppliedDemoStart, setHasAppliedDemoStart] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const ackIndexRef = useRef(0);
  const ackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generatingRef = useRef<HTMLDivElement>(null);

  const userAnswersRef = useRef<UserAnswers>({});
  const resultsConfigRef = useRef<ResultsConfig | null>(null);
  const pendingResultMessagesRef = useRef<DMessage[]>([]);

  useEffect(() => {
    revealMessage(0, messages);
    return () => clearTimeouts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear ack when a new message starts streaming
  useEffect(() => {
    if (acknowledgment && visibleMessages.length > 0) {
      setAcknowledgment(null);
      if (ackTimeoutRef.current) {
        clearTimeout(ackTimeoutRef.current);
        ackTimeoutRef.current = undefined;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleMessages.length]);

  // Cleanup ack timeout on unmount
  useEffect(() => {
    return () => {
      if (ackTimeoutRef.current) clearTimeout(ackTimeoutRef.current);
    };
  }, []);

  // Scroll to generating checklist when it appears
  useEffect(() => {
    if (isGenerating && generatingRef.current) {
      const id = setTimeout(() => {
        scrollLatestToTop();
      }, 200);
      return () => clearTimeout(id);
    }
  }, [isGenerating, scrollLatestToTop]);

  useEffect(() => {
    if (isResultsPaywallVisible || isBookingVisible) {
      const id = setTimeout(() => {
        scrollLatestToTop();
      }, 200);
      return () => clearTimeout(id);
    }
  }, [isResultsPaywallVisible, isBookingVisible, scrollLatestToTop]);

  const handleStreamingComplete = useCallback((messageId: string) => {
    let shouldScroll = false;
    setStreamedMessages(prev => {
      if (prev.has(messageId)) return prev;
      const next = new Set(prev);
      next.add(messageId);
      shouldScroll = true;
      return next;
    });
    if (shouldScroll) {
      // Re-scroll once after chips/children appear.
      setTimeout(() => scrollLatestToTop(), 200);
    }
  }, [scrollLatestToTop]);

  const showAcknowledgment = useCallback(() => {
    const phrase = ACKNOWLEDGMENTS[ackIndexRef.current % ACKNOWLEDGMENTS.length];
    ackIndexRef.current++;
    setAcknowledgment(phrase);
    if (ackTimeoutRef.current) clearTimeout(ackTimeoutRef.current);
    ackTimeoutRef.current = setTimeout(() => setAcknowledgment(null), 4000);
  }, []);

  const doChipSelect = useCallback((messageId: string, chipValue: string) => {
    if (!waitingForInput) return false;
    userAnswersRef.current = { ...userAnswersRef.current, [messageId]: chipValue };
    setCurrentFlowIndex(prev => prev + 1);
    showAcknowledgment();
    handleChipSelect(messageId);
    return true;
  }, [waitingForInput, handleChipSelect, showAcknowledgment]);

  const onChipSelect = useCallback((messageId: string, chipValue: string) => {
    if (doChipSelect(messageId, chipValue)) {
      broadcast({ type: 'chip', messageId, value: chipValue });
    }
  }, [doChipSelect, broadcast]);

  const doMultiSubmit = useCallback((messageId: string, values: string[]) => {
    if (!waitingForInput) return false;
    userAnswersRef.current = { ...userAnswersRef.current, [messageId]: values.join(',') };
    setCurrentFlowIndex(prev => prev + 1);
    showAcknowledgment();
    handleMultiSubmit(messageId);
    return true;
  }, [waitingForInput, handleMultiSubmit, showAcknowledgment]);

  const onMultiSubmit = useCallback((messageId: string, values: string[]) => {
    if (doMultiSubmit(messageId, values)) {
      broadcast({ type: 'multi', messageId, values });
    }
  }, [doMultiSubmit, broadcast]);

  const doContinue = useCallback(() => {
    if (!waitingForInput) return false;
    setCurrentFlowIndex(prev => prev + 1);
    handleContinue();
    return true;
  }, [handleContinue, waitingForInput]);

  const onContinue = useCallback(() => {
    if (doContinue()) {
      broadcast({ type: 'continue' });
    }
  }, [doContinue, broadcast]);

  const doGoBack = useCallback(() => {
    const { answeredId, didGoBack } = goBack();
    if (!didGoBack) return false;
    setCurrentFlowIndex(prev => Math.max(-1, prev - 1));
    setAcknowledgment(null);
    setResetKey(prev => prev + 1);
    if (answeredId) {
      const next = { ...userAnswersRef.current };
      delete next[answeredId];
      userAnswersRef.current = next;
    }
    return true;
  }, [goBack]);

  const onGoBack = useCallback(() => {
    if (doGoBack()) {
      broadcast({ type: 'back' });
    }
  }, [doGoBack, broadcast]);

  const doSeeResults = useCallback(() => {
    if (!showCta || isGenerating || !!resultsConfigRef.current) return false;
    setIsGenerating(true);
    return true;
  }, [showCta, isGenerating]);

  // "See My Results" — start generating inline instead of exiting
  const handleSeeResults = useCallback(() => {
    if (doSeeResults()) {
      broadcast({ type: 'results' });
    }
  }, [doSeeResults, broadcast]);

  // Jump to a specific message index (used by split-view demo bar)
  const doJump = useCallback((targetMsgIndex: number) => {
    const steps = skipTo(targetMsgIndex, messages);
    setCurrentFlowIndex(steps - 1);
    setAcknowledgment(null);
    setResetKey(prev => prev + 1);
    setIsGenerating(false);
    setIsResultsPaywallVisible(false);
    setIsBookingVisible(false);
    outcomeReportedRef.current = false;
    setStreamedMessages(() => {
      const set = new Set<string>();
      for (let i = 0; i < targetMsgIndex && i < messages.length; i++) {
        set.add(messages[i].id);
      }
      return set;
    });
    userAnswersRef.current = {};
    resultsConfigRef.current = null;
    pendingResultMessagesRef.current = [];
  }, [skipTo, messages]);

  useEffect(() => {
    if (!demoAutoConfig.enabled) return;
    if (hasAppliedDemoStart) return;
    if (demoAutoConfig.startAtMsgIndex <= 0) {
      setHasAppliedDemoStart(true);
      return;
    }

    const target = Math.min(messages.length - 1, demoAutoConfig.startAtMsgIndex);
    const id = window.setTimeout(() => {
      doJump(target);
      setHasAppliedDemoStart(true);
    }, 80);

    return () => window.clearTimeout(id);
  }, [
    demoAutoConfig.enabled,
    demoAutoConfig.startAtMsgIndex,
    doJump,
    hasAppliedDemoStart,
    messages.length,
  ]);

  // Report this lead's resolved outcome up to the live-wall parent (once per run).
  const reportOutcome = useCallback((result: DemoOutcome) => {
    if (outcomeReportedRef.current) return;
    outcomeReportedRef.current = true;
    if (typeof window === 'undefined' || window.parent === window) return;
    window.parent.postMessage(
      {
        source: 'kdr-demo',
        leadId: demoAutoConfig.leadId,
        outcome: result,
        valueUsd: result === 'buy' ? PURCHASE_VALUE_USD : 0,
      },
      window.location.origin,
    );
  }, [demoAutoConfig.leadId]);

  const doUnlockResults = useCallback(() => {
    if (!isResultsPaywallVisible) return false;

    const messagesToAppend = pendingResultMessagesRef.current;
    if (messagesToAppend.length === 0) return false;

    pendingResultMessagesRef.current = [];
    setIsResultsPaywallVisible(false);
    reportOutcome('buy');
    appendMessages(messagesToAppend);
    return true;
  }, [appendMessages, isResultsPaywallVisible, reportOutcome]);

  const handlePaywallUnlock = useCallback(() => {
    if (doUnlockResults()) {
      broadcast({ type: 'unlockResults' });
    }
  }, [doUnlockResults, broadcast]);

  // Booking path completion — mirrors paywall unlock, then appends the report.
  const handleBookingComplete = useCallback(() => {
    if (!isBookingVisible) return;
    const messagesToAppend = pendingResultMessagesRef.current;
    pendingResultMessagesRef.current = [];
    setIsBookingVisible(false);
    reportOutcome('book');
    if (messagesToAppend.length > 0) appendMessages(messagesToAppend);
  }, [appendMessages, isBookingVisible, reportOutcome]);

  // Sync listener — non-jump events are filtered to follower inside useSplitSync.
  const doChipSelectRef = useRef(doChipSelect);
  doChipSelectRef.current = doChipSelect;
  const doMultiSubmitRef = useRef(doMultiSubmit);
  doMultiSubmitRef.current = doMultiSubmit;
  const doContinueRef = useRef(doContinue);
  doContinueRef.current = doContinue;
  const doGoBackRef = useRef(doGoBack);
  doGoBackRef.current = doGoBack;
  const doSeeResultsRef = useRef(doSeeResults);
  doSeeResultsRef.current = doSeeResults;
  const doJumpRef = useRef(doJump);
  doJumpRef.current = doJump;
  const doUnlockResultsRef = useRef(doUnlockResults);
  doUnlockResultsRef.current = doUnlockResults;

  useEffect(() => {
    onEvent((event) => {
      // Jump events are handled by both roles
      if (event.type === 'jump') {
        doJumpRef.current(event.targetMsgIndex);
        return;
      }

      const apply = () => {
        switch (event.type) {
          case 'chip': return doChipSelectRef.current(event.messageId, event.value);
          case 'multi': return doMultiSubmitRef.current(event.messageId, event.values);
          case 'continue': return doContinueRef.current();
          case 'back': return doGoBackRef.current();
          case 'results': return doSeeResultsRef.current();
          case 'unlockResults': return doUnlockResultsRef.current();
        }
      };

      if (!apply()) {
        let attempts = 0;
        const retry = setInterval(() => {
          attempts++;
          if (apply() || attempts > 50) clearInterval(retry);
        }, 100);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Generating checklist finished — now transition to action plan
  const handleGeneratingComplete = useCallback(() => {
    const { messages: resultMsgs, config } = buildResultsMessages(userAnswersRef.current);
    // Set ref BEFORE state updates — the re-render from appendMessages will read this ref
    resultsConfigRef.current = config;
    pendingResultMessagesRef.current = resultMsgs;
    setIsGenerating(false);
    // Route to a single outcome based on the answers: stronger-fit leads book a
    // strategy call, the rest are offered the low-ticket report purchase.
    const { outcome } = deriveDemoOutcome(userAnswersRef.current);
    if (outcome === 'book') {
      setIsBookingVisible(true);
    } else {
      setIsResultsPaywallVisible(true);
    }
  }, []);

  // Re-align when the active interactive card changes to keep progression stable.
  useEffect(() => {
    if (activeChipMessageId || activeFitScoreId || activeCalloutId || activeResultId) {
      scrollLatestToTop();
    }
  }, [activeChipMessageId, activeFitScoreId, activeCalloutId, activeResultId, scrollLatestToTop]);

  useEffect(() => {
    if (!demoAutoConfig.enabled || !waitingForInput) return;

    const delay = computeDemoDelay(demoAutoConfig.answerDelayMs, demoAutoConfig.speed, demoRandom, {
      minMs: 1100,
      minJitter: 0.95,
      maxJitter: 1.2,
    });
    const id = window.setTimeout(() => {
      if (activeChipMessageId) {
        const target = visibleMessages.find((msg) => msg.id === activeChipMessageId);
        if (!target?.chips || answeredMessages.has(target.id)) return;

        const values = pickAutoValues(target.chips, !!target.multiSelect, demoRandom);
        if (values.length === 0) return;

        if (target.multiSelect) {
          onMultiSubmit(target.id, values);
        } else {
          onChipSelect(target.id, values[0]);
        }
        return;
      }

      if (activeFitScoreId || activeCalloutId || activeResultId) {
        onContinue();
      }
    }, delay);

    return () => window.clearTimeout(id);
  }, [
    activeCalloutId,
    activeChipMessageId,
    activeFitScoreId,
    activeResultId,
    answeredMessages,
    demoAutoConfig.answerDelayMs,
    demoAutoConfig.enabled,
    demoAutoConfig.speed,
    demoRandom,
    onChipSelect,
    onContinue,
    onMultiSubmit,
    visibleMessages,
    waitingForInput,
  ]);

  useEffect(() => {
    if (!demoAutoConfig.enabled || !showCta || isGenerating || !!resultsConfigRef.current) return;

    const delay = computeDemoDelay(demoAutoConfig.answerDelayMs, demoAutoConfig.speed, demoRandom, {
      minMs: 1200,
      minJitter: 1.0,
      maxJitter: 1.25,
    });
    const id = window.setTimeout(() => {
      handleSeeResults();
    }, delay);

    return () => window.clearTimeout(id);
  }, [
    demoAutoConfig.answerDelayMs,
    demoAutoConfig.enabled,
    demoAutoConfig.speed,
    demoRandom,
    handleSeeResults,
    isGenerating,
    showCta,
  ]);

  useEffect(() => {
    if (!demoAutoConfig.enabled || !isResultsPaywallVisible) return;

    const delay = computeDemoDelay(demoAutoConfig.answerDelayMs, demoAutoConfig.speed, demoRandom, {
      minMs: 1200,
      minJitter: 1.0,
      maxJitter: 1.2,
    });
    const id = window.setTimeout(() => {
      handlePaywallUnlock();
    }, delay);

    return () => window.clearTimeout(id);
  }, [
    demoAutoConfig.answerDelayMs,
    demoAutoConfig.enabled,
    demoAutoConfig.speed,
    demoRandom,
    handlePaywallUnlock,
    isResultsPaywallVisible,
  ]);

  useEffect(() => {
    if (!demoAutoConfig.enabled || !demoAutoConfig.loop) return;

    const hasRenderedResults = !!resultsConfigRef.current;
    const isFinished =
      hasRenderedResults &&
      !isGenerating &&
      !isResultsPaywallVisible &&
      !isBookingVisible &&
      !waitingForInput &&
      !activeResultId &&
      pendingResultMessagesRef.current.length === 0;

    if (!isFinished) return;

    const delay = Math.round(demoAutoConfig.loopDelayMs / demoAutoConfig.speed);
    const id = window.setTimeout(() => {
      window.location.reload();
    }, delay);

    return () => window.clearTimeout(id);
  }, [
    activeResultId,
    demoAutoConfig.enabled,
    demoAutoConfig.loop,
    demoAutoConfig.loopDelayMs,
    demoAutoConfig.speed,
    isGenerating,
    isResultsPaywallVisible,
    isBookingVisible,
    waitingForInput,
  ]);

  return (
    <div className="flex flex-col h-full">
      {totalFlowItems > 0 && !resultsConfigRef.current && (
        <OnboardingProgress
          currentFlowIndex={currentFlowIndex}
          totalFlowItems={totalFlowItems}
          milestones={milestones}
        />
      )}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto" style={{ scrollbarGutter: 'stable' }}>
        <div className="max-w-[640px] mx-auto flex flex-col gap-7 pt-6 pb-[90vh] px-5">
          {visibleMessages.map((msg, index) => {
            const distFromEnd = visibleMessages.length - 1 - index;
            const baseOpacity = distFromEnd === 0 ? 1 : distFromEnd === 1 ? 0.5 : distFromEnd === 2 ? 0.3 : 0.2;
            // Fade all messages down when generating starts
            const opacity = isGenerating ? Math.min(baseOpacity, 0.15) : baseOpacity;
            const isLast = !isGenerating && index === visibleMessages.length - 1 && !thinkingVisible;
            const hasStreamed = streamedMessages.has(msg.id);
            return (
              <div key={msg.id} ref={isLast ? lastItemRef : undefined} style={{ opacity, transition: 'opacity 0.6s ease', scrollMarginTop: '24px' }}>
                {msg.fitScore && (
                  <FitScore
                    percentage={msg.fitScore.percentage}
                    message={msg.fitScore.message}
                    cta={msg.fitScore.cta}
                    onCtaClick={msg.id === activeFitScoreId ? onContinue : (showCta && msg.triggersPhaseChange) ? handleSeeResults : () => {}}
                  />
                )}
                {msg.callout && (
                  <Callout
                    headline={msg.callout.headline}
                    body={msg.callout.body}
                    stat={msg.callout.stat}
                    video={msg.callout.video}
                    onContinue={msg.id === activeCalloutId ? onContinue : () => {}}
                  />
                )}
                {msg.resultComponent && resultsConfigRef.current && (
                  <ResultComponentRenderer
                    componentKey={msg.resultComponent}
                    config={resultsConfigRef.current}
                    isActive={msg.id === activeResultId}
                    onContinue={onContinue}
                  />
                )}
                {!msg.fitScore && !msg.callout && !msg.resultComponent && (
                  <>
                    <MessageBubble
                      message={msg}
                      isNew={hasAnimated.current.has(msg.id)}
                      onStreamingComplete={hasStreamed ? undefined : () => handleStreamingComplete(msg.id)}
                    >
                      {msg.video && <VideoEmbed src={msg.video.src} title={msg.video.title} duration={msg.video.duration} />}
                      {msg.visualCard && <VisualCard icon={msg.visualCard.icon} title={msg.visualCard.title} items={msg.visualCard.items} />}
                    </MessageBubble>
                    {msg.chips && hasStreamed && (msg.id === activeChipMessageId || answeredMessages.has(msg.id)) && (
                      <div className={`mt-3 animate-fade-in ${msg.chips.some(c => c.emoji) ? '' : 'ml-9'}`}>
                        <ChipPicker
                          key={`${msg.id}-${resetKey}`}
                          chips={msg.chips}
                          multiSelect={msg.multiSelect}
                          disabled={answeredMessages.has(msg.id)}
                          onSelect={(value) => {
                            if (!msg.multiSelect) onChipSelect(msg.id, value);
                          }}
                          onMultiSubmit={(values) => onMultiSubmit(msg.id, values)}
                        />
                        {msg.id === activeChipMessageId && currentFlowIndex >= 0 && !isGenerating && (
                          <button
                            type="button"
                            onClick={onGoBack}
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

          {/* Acknowledgment */}
          {acknowledgment && (
            <div className="animate-fade-in-up">
              <div className="flex items-start gap-3">
                <Image
                  src={asset('/profilepicnew.png')}
                  alt="Lucas"
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full flex-shrink-0 mt-0.5 object-cover"
                />
                <StreamingText text={acknowledgment} speed={60}>
                  {(visibleText, isStreaming) => (
                    <span
                      style={{
                        fontSize: 'var(--text-sm)',
                        fontWeight: 'var(--font-medium)',
                        fontStyle: 'italic',
                        color: '#71717A',
                        paddingTop: '4px',
                      }}
                    >
                      {visibleText}
                      {isStreaming && (
                        <span
                          className="inline-block align-middle"
                          style={{
                            width: '2px',
                            height: '12px',
                            background: '#A1A1AA',
                            marginLeft: '1px',
                            animation: 'pulse-dot 0.8s infinite',
                          }}
                        />
                      )}
                    </span>
                  )}
                </StreamingText>
              </div>
            </div>
          )}

          {thinkingVisible && <div ref={thinkingRef} style={{ scrollMarginTop: '16px' }}><TypingIndicator /></div>}

          {/* Generating checklist — appears inline in the chat */}
          {isGenerating && (
            <div
              ref={(el) => {
                generatingRef.current = el;
                lastItemRef.current = el;
              }}
              className="animate-fade-in-up"
              style={{ scrollMarginTop: '24px' }}
            >
              <div
                className="bg-white rounded-2xl border p-6"
                style={{ borderColor: '#E5E5E8', boxShadow: 'var(--shadow-card)' }}
              >
                <GeneratingChecklist
                  onComplete={handleGeneratingComplete}
                  steps={GENERATING_STEPS}
                  title="Building your AI Product Readiness Report"
                  subtitle="Analyzing your answers against our client database"
                  icon={'\uD83D\uDE80'}
                  socialProof={{
                    stat: '500+',
                    statLabel: 'Coaches & consultants have built AI products with Kodara',
                    statSubtext: 'Average time to first revenue: 14 days',
                    readyTitle: 'Your personalized report is ready',
                    readySubtitle: 'Complete action plan with guided steps',
                  }}
                />
              </div>
            </div>
          )}

          {isResultsPaywallVisible && (
            <div
              ref={(el) => {
                lastItemRef.current = el;
              }}
              className="animate-fade-in-up"
              style={{ scrollMarginTop: '24px' }}
            >
              <ResultsPaywall onUnlock={handlePaywallUnlock} skipTimer={skipPaywallTimer} />
            </div>
          )}

          {isBookingVisible && (
            <div
              ref={(el) => {
                lastItemRef.current = el;
              }}
              className="animate-fade-in-up"
              style={{ scrollMarginTop: '24px' }}
            >
              <BookingCard
                onBooked={handleBookingComplete}
                autoComplete={demoAutoConfig.enabled}
                autoDelayMs={demoAutoConfig.answerDelayMs}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
