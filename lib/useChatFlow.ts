import { useState, useEffect, useRef, useCallback } from 'react';
import { DMessage } from './types';
import { computeTopScrollTop } from './progression/scroll';
import { computeTypingDelayMs } from './progression/scheduler';

interface UseChatFlowOptions {
  onAllRevealed?: () => void;
  getAutoAdvanceDelay?: (msg: DMessage) => number;
}

const DEFAULT_AUTO_ADVANCE_DELAY = 800;

export function useChatFlow({ onAllRevealed, getAutoAdvanceDelay }: UseChatFlowOptions = {}) {
  const [visibleMessages, setVisibleMessages] = useState<DMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingVisible, setThinkingVisible] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [showCta, setShowCta] = useState(false);
  const [answeredMessages, setAnsweredMessages] = useState<Set<string>>(new Set());

  const currentMsgIndexRef = useRef(0);
  const currentMessagesRef = useRef<DMessage[]>([]);
  const hasAnimated = useRef(new Set<string>());
  const timeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const lastItemRef = useRef<HTMLDivElement>(null);
  const thinkingRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scrollGenRef = useRef(0);
  const pinCleanupRef = useRef<(() => void) | null>(null);
  const historyRef = useRef<{ visibleCount: number; msgIndex: number; answeredId: string | null }[]>([]);
  const revealMessageRef = useRef<(index: number, messages: DMessage[]) => void>(() => {});

  const addTimeout = useCallback((fn: () => void, delay: number) => {
    const id = setTimeout(fn, delay);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const alignElementToTop = useCallback((container: HTMLDivElement, el: HTMLElement) => {
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    return computeTopScrollTop({
      containerTop: containerRect.top,
      containerScrollTop: container.scrollTop,
      containerHeight: container.clientHeight,
      containerScrollHeight: container.scrollHeight,
      elementTop: elRect.top,
      elementHeight: elRect.height,
      margin: 16,
    });
  }, []);

  // Scroll the active content element to the top of the scroll container.
  // Uses rAF to wait for DOM paint, then animates smoothly.
  // Each call increments a generation counter so stale animations bail out.
  const scrollLatestToTop = useCallback(() => {
    const gen = ++scrollGenRef.current;
    pinCleanupRef.current?.();
    pinCleanupRef.current = null;

    const align = () => {
      if (scrollGenRef.current !== gen) return;

      const container = scrollContainerRef.current;
      if (!container) return;

      // Find the target: thinkingRef (if visible) or lastItemRef
      const el = thinkingRef.current || lastItemRef.current;
      if (!el) return;

      const clamped = alignElementToTop(container, el);

      const start = container.scrollTop;
      const distance = clamped - start;
      if (Math.abs(distance) < 2) return;

      // A hidden tab (backgrounded window, or a browser-automation capture
      // that isn't the foreground tab) never fires requestAnimationFrame, so
      // the animated path below would stall forever mid-scroll. Snap
      // straight to the target instead — there's nothing being painted to
      // animate for anyway.
      const isHidden = typeof document !== 'undefined' && document.hidden;

      // Snap instantly for tiny adjustments (e.g. thinking→message swap)
      if (isHidden || Math.abs(distance) < 30) {
        container.scrollTop = clamped;
        return;
      }

      const startTime = performance.now();
      // Scale duration to distance: big scrolls get full animation, small ones are quick
      const duration = Math.min(1000, Math.max(300, Math.abs(distance) * 2.5));

      const step = (now: number) => {
        if (scrollGenRef.current !== gen) return;
        const t = Math.min((now - startTime) / duration, 1);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        container.scrollTop = start + distance * eased;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);

      // Keep active element pinned briefly while dynamic content (chips/video/subtitles)
      // changes size to avoid drift after initial alignment.
      const pinDelay = window.setTimeout(() => {
        if (scrollGenRef.current !== gen) return;
        let pinRaf = 0;
        const requestPin = () => {
          cancelAnimationFrame(pinRaf);
          pinRaf = requestAnimationFrame(() => {
            if (scrollGenRef.current !== gen) return;
            container.scrollTop = alignElementToTop(container, el);
          });
        };

        const observer = typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(requestPin)
          : null;
        observer?.observe(el);

        const stopTimer = window.setTimeout(() => {
          cleanup();
        }, 1400);

        const cleanup = () => {
          observer?.disconnect();
          clearTimeout(stopTimer);
          cancelAnimationFrame(pinRaf);
          if (pinCleanupRef.current === cleanup) pinCleanupRef.current = null;
        };

        pinCleanupRef.current = cleanup;
      }, 220);

      const existingCleanup = pinCleanupRef.current;
      pinCleanupRef.current = () => {
        clearTimeout(pinDelay);
        existingCleanup?.();
      };
    };

    // Same hidden-tab problem applies to the paint-wait itself: skip it and
    // align immediately rather than waiting on rAFs that will never fire.
    if (typeof document !== 'undefined' && document.hidden) {
      align();
      return;
    }

    // Double rAF ensures DOM has painted after React state update
    requestAnimationFrame(() => {
      if (scrollGenRef.current !== gen) return;
      requestAnimationFrame(align);
    });
  }, [alignElementToTop]);

  useEffect(() => {
    return () => {
      pinCleanupRef.current?.();
      pinCleanupRef.current = null;
    };
  }, []);

  // Typing indicator visibility delay
  useEffect(() => {
    if (isThinking) {
      const id = requestAnimationFrame(() => setThinkingVisible(true));
      return () => {
        cancelAnimationFrame(id);
        requestAnimationFrame(() => setThinkingVisible(false));
      };
    }
    const hideId = requestAnimationFrame(() => setThinkingVisible(false));
    return () => cancelAnimationFrame(hideId);
  }, [isThinking]);

  const computeAdvanceDelay = useCallback((msg: DMessage) => {
    if (getAutoAdvanceDelay) {
      return getAutoAdvanceDelay(msg);
    }
    return DEFAULT_AUTO_ADVANCE_DELAY;
  }, [getAutoAdvanceDelay]);

  const revealMessage = useCallback(
    (index: number, messages: DMessage[]) => {
      currentMessagesRef.current = messages;

      if (index >= messages.length) {
        onAllRevealed?.();
        return;
      }

      const msg = messages[index];

      // Fit scores / callouts — show directly (no typing indicator)
      if (msg.fitScore || msg.callout) {
        addTimeout(() => {
          hasAnimated.current.add(msg.id);
          setVisibleMessages(prev => [...prev, msg]);
          currentMsgIndexRef.current = index + 1;
          scrollLatestToTop();

          if (msg.triggersPhaseChange) {
            setShowCta(true);
            return;
          }
          if (msg.waitForInput) {
            setWaitingForInput(true);
            return;
          }
          if (index + 1 < messages.length) {
            addTimeout(() => revealMessageRef.current(index + 1, messages), 600);
          } else {
            onAllRevealed?.();
          }
        }, 400);
        return;
      }

      // Normal messages — show typing then reveal
      addTimeout(() => {
        setIsThinking(true);
        // Scroll typing indicator to top
        scrollLatestToTop();

        const typingDuration = computeTypingDelayMs(msg.content ?? '');
        addTimeout(() => {
          setIsThinking(false);
          hasAnimated.current.add(msg.id);
          setVisibleMessages(prev => [...prev, msg]);
          currentMsgIndexRef.current = index + 1;
          // Scroll new message to top (replaces typing indicator position)
          scrollLatestToTop();

          if (msg.triggersPhaseChange) {
            addTimeout(() => setShowCta(true), 600);
            return;
          }
          if (msg.waitForInput || (msg.chips && msg.chips.length > 0)) {
            setWaitingForInput(true);
            return;
          }
          if (index + 1 < messages.length) {
            const delay = computeAdvanceDelay(msg);
            addTimeout(() => revealMessageRef.current(index + 1, messages), delay);
          } else {
            onAllRevealed?.();
          }
        }, typingDuration);
      }, 100);
    },
    [addTimeout, computeAdvanceDelay, onAllRevealed, scrollLatestToTop],
  );
  useEffect(() => {
    revealMessageRef.current = revealMessage;
  }, [revealMessage]);

  const continueReveal = useCallback(() => {
    const nextIndex = currentMsgIndexRef.current;
    const msgs = currentMessagesRef.current;
    if (nextIndex < msgs.length) {
      revealMessage(nextIndex, msgs);
    } else {
      onAllRevealed?.();
    }
  }, [onAllRevealed, revealMessage]);

  const saveSnapshot = useCallback((answeredId: string | null) => {
    setVisibleMessages(prev => {
      historyRef.current.push({
        visibleCount: prev.length,
        msgIndex: currentMsgIndexRef.current,
        answeredId,
      });
      return prev;
    });
  }, []);

  const handleChipSelect = useCallback(
    (messageId: string) => {
      if (!waitingForInput) return;
      saveSnapshot(messageId);
      setAnsweredMessages(prev => new Set(prev).add(messageId));
      setWaitingForInput(false);
      addTimeout(() => continueReveal(), 600);
    },
    [waitingForInput, addTimeout, continueReveal, saveSnapshot],
  );

  const handleMultiSubmit = useCallback(
    (messageId: string) => {
      if (!waitingForInput) return;
      saveSnapshot(messageId);
      setAnsweredMessages(prev => new Set(prev).add(messageId));
      setWaitingForInput(false);
      addTimeout(() => continueReveal(), 600);
    },
    [waitingForInput, addTimeout, continueReveal, saveSnapshot],
  );

  const handleContinue = useCallback(() => {
    if (!waitingForInput) return;
    saveSnapshot(null);
    setWaitingForInput(false);
    continueReveal();
  }, [waitingForInput, continueReveal, saveSnapshot]);

  const activeChipMessageId = waitingForInput
    ? visibleMessages.findLast(m =>
        m.chips && m.waitForInput && !m.fitScore && !m.callout &&
        !answeredMessages.has(m.id)
      )?.id ?? visibleMessages.findLast(m =>
        m.chips && !m.fitScore && !m.callout &&
        !answeredMessages.has(m.id)
      )?.id ?? null
    : null;

  const activeFitScoreId = waitingForInput
    ? visibleMessages.findLast(m => m.fitScore && m.waitForInput)?.id ?? null
    : null;

  const activeCalloutId = waitingForInput
    ? visibleMessages.findLast(m => m.callout && m.waitForInput)?.id ?? null
    : null;

  const activeResultId = waitingForInput
    ? visibleMessages.findLast(m => m.resultComponent && m.waitForInput)?.id ?? null
    : null;

  const clearTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  const goBack = useCallback((): { answeredId: string | null; didGoBack: boolean } => {
    if (historyRef.current.length === 0) return { answeredId: null, didGoBack: false };
    clearTimeouts();
    const entry = historyRef.current.pop()!;

    setVisibleMessages(prev => prev.slice(0, entry.visibleCount));
    currentMsgIndexRef.current = entry.msgIndex;

    if (entry.answeredId) {
      setAnsweredMessages(prev => {
        const next = new Set(prev);
        next.delete(entry.answeredId!);
        return next;
      });
    }

    setIsThinking(false);
    setWaitingForInput(true);
    setShowCta(false);

    addTimeout(() => scrollLatestToTop(), 50);
    return { answeredId: entry.answeredId, didGoBack: true };
  }, [clearTimeouts, addTimeout, scrollLatestToTop]);

  // Jump to a specific message index, pre-populating all prior state instantly.
  // Returns the number of interactive steps skipped (for setting flowIndex).
  const skipTo = useCallback((targetMsgIndex: number, msgs: DMessage[]) => {
    clearTimeouts();
    const visible: DMessage[] = [];
    const answered = new Set<string>();
    let interactiveCount = 0;

    for (let i = 0; i < targetMsgIndex && i < msgs.length; i++) {
      const msg = msgs[i];
      visible.push(msg);
      hasAnimated.current.add(msg.id);
      if (msg.waitForInput || (msg.chips && msg.chips.length > 0)) {
        answered.add(msg.id);
        interactiveCount++;
      }
    }

    setVisibleMessages(visible);
    setAnsweredMessages(answered);
    setIsThinking(false);
    setWaitingForInput(false);
    setShowCta(false);
    currentMsgIndexRef.current = targetMsgIndex;
    currentMessagesRef.current = msgs;
    historyRef.current = [];

    // Start revealing from the target index after state settles
    addTimeout(() => revealMessage(targetMsgIndex, msgs), 50);
    return interactiveCount;
  }, [clearTimeouts, addTimeout, revealMessage]);

  const appendMessages = useCallback((newMsgs: DMessage[]) => {
    const startIndex = currentMessagesRef.current.length;
    currentMessagesRef.current = [...currentMessagesRef.current, ...newMsgs];
    revealMessage(startIndex, currentMessagesRef.current);
  }, [revealMessage]);

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
}
