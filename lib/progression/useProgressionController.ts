import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { createInitialProgressionState, progressionReducer } from './reducer';
import { computeTypingDelayMs, createTransitionScheduler } from './scheduler';
import { computeTopScrollTop } from './scroll';
import type { FlowNode, ProgressionEvent, ProgressionState } from './types';

type ProgressionControllerParams = {
  nodes: FlowNode[];
  scrollMode: 'top';
  onComplete?: () => void;
};

function getMessageContent(payload: unknown) {
  if (!payload || typeof payload !== 'object') {
    return '';
  }

  const content = (payload as { content?: unknown }).content;
  return typeof content === 'string' ? content : '';
}

export function useProgressionController({
  nodes,
  scrollMode,
  onComplete,
}: ProgressionControllerParams) {
  const [state, setState] = useState<ProgressionState>(() => createInitialProgressionState(nodes));
  const schedulerRef = useRef(createTransitionScheduler(clearTimeout));
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const activeElementRef = useRef<HTMLElement | null>(null);
  const latestNodesRef = useRef(nodes);
  const onCompleteRef = useRef(onComplete);
  const isMountedRef = useRef(true);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    // Reset on (re)mount so React StrictMode's dev double-invoke (mount → cleanup
    // → mount) doesn't leave this stuck false, which would make every scheduled
    // transition bail out and freeze the flow on "typing".
    isMountedRef.current = true;
    const scheduler = schedulerRef.current;
    return () => {
      isMountedRef.current = false;
      scheduler.cancelAll();
    };
  }, []);

  useEffect(() => {
    if (latestNodesRef.current === nodes) return;

    const previousNodes = latestNodesRef.current;
    latestNodesRef.current = nodes;
    schedulerRef.current.cancelAll();

    setState((current) => {
      const previousLength = previousNodes.length;
      const isAppendOnly =
        nodes.length >= previousLength &&
        previousNodes.every((node, index) => nodes[index]?.id === node.id);

      if (isAppendOnly) {
        if (current.phase === 'completed' && nodes.length > previousLength) {
          return {
            ...current,
            nodes,
            phase: 'typing',
            activeIndex: previousLength,
            waitingNodeId: null,
          };
        }

        return {
          ...current,
          nodes,
        };
      }

      return createInitialProgressionState(nodes);
    });
  }, [nodes]);

  const dispatch = useCallback((event: ProgressionEvent) => {
    if (event.type === 'RESET') {
      schedulerRef.current.cancelAll();
    }

    setState((current) => progressionReducer(current, event));
  }, []);

  useEffect(() => {
    const scheduler = schedulerRef.current;

    if (state.phase === 'typing') {
      const node = state.nodes[state.activeIndex];
      const delay = computeTypingDelayMs(getMessageContent(node?.payload));
      scheduler.schedule('typing', () => {
        if (!isMountedRef.current) return;
        setState((current) => progressionReducer(current, { type: 'TYPE_DONE' }));
      }, delay);
    }

    if (state.phase === 'revealing') {
      scheduler.schedule('reveal', () => {
        if (!isMountedRef.current) return;
        setState((current) => progressionReducer(current, { type: 'REVEAL_DONE' }));
      }, 80);
    }

    if (state.phase === 'autoAdvancing') {
      const node = state.nodes[state.activeIndex];
      scheduler.schedule('advance', () => {
        if (!isMountedRef.current) return;
        setState((current) => progressionReducer(current, { type: 'AUTO_ADVANCE' }));
      }, node?.autoDelayMs ?? 400);
    }

    if (state.phase === 'completed') {
      onCompleteRef.current?.();
    }

    return () => {
      scheduler.cancelAll();
    };
  }, [state.phase, state.activeIndex, state.nodes]);

  useEffect(() => {
    if (scrollMode !== 'top') {
      return;
    }

    const container = scrollContainerRef.current;
    const activeElement = activeElementRef.current;
    if (!container || !activeElement) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = activeElement.getBoundingClientRect();

    container.scrollTop = computeTopScrollTop({
      containerTop: containerRect.top,
      containerScrollTop: container.scrollTop,
      containerHeight: container.clientHeight,
      containerScrollHeight: container.scrollHeight,
      elementTop: activeRect.top,
      elementHeight: activeRect.height,
      margin: 16,
    });
  }, [scrollMode, state.activeIndex, state.visibleCount, state.phase]);

  const visibleNodes = useMemo(
    () => state.nodes.slice(0, state.visibleCount),
    [state.nodes, state.visibleCount],
  );

  const setScrollContainer = useCallback((element: HTMLDivElement | null) => {
    scrollContainerRef.current = element;
  }, []);

  const setActiveElement = useCallback((element: HTMLElement | null) => {
    activeElementRef.current = element;
  }, []);

  return {
    phase: state.phase,
    activeNodeId: state.nodes[state.activeIndex]?.id ?? null,
    waitingNodeId: state.waitingNodeId,
    answeredIds: state.answeredIds,
    visibleNodes,
    dispatch,
    bindings: {
      setScrollContainer,
      setActiveElement,
    },
  };
}
