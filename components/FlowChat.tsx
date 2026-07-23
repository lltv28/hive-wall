'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActionTask, DMessage } from '@/lib/types';
import { createTransitionScheduler } from '@/lib/progression/scheduler';
import { useProgressionController } from '@/lib/progression/useProgressionController';
import type { FlowNode } from '@/lib/progression/types';
import FlowHeader from './FlowHeader';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';
import VideoEmbed from './VideoEmbed';
import VisualCard from './VisualCard';
import ChipPicker from './ChipPicker';
import OfferCard from './OfferCard';

interface FlowChatProps {
  task: ActionTask | null;
  onTaskComplete: () => void;
  onBack: () => void;
}

const GUIDED_CHIP_DELAY_MS = 300;

function getGuidedWaitMode(message: DMessage): FlowNode['waitMode'] {
  if (message.chips && message.chips.length > 0) {
    return 'userAction';
  }

  if (message.waitForInput || message.fitScore || message.callout || message.resultComponent || message.triggersPhaseChange) {
    return 'phaseChange';
  }

  return 'none';
}

function buildGuidedNodes(messages: DMessage[]): FlowNode[] {
  return messages.map((message, index) => ({
    id: message.id,
    kind: 'guidedTask',
    waitMode: getGuidedWaitMode(message),
    autoDelayMs: index === messages.length - 1 ? 600 : 400,
    payload: message,
  }));
}

export default function FlowChat({ task, onTaskComplete, onBack }: FlowChatProps) {
  const [repliesByMessageId, setRepliesByMessageId] = useState<Record<string, DMessage>>({});
  const [offerConfirmedTaskId, setOfferConfirmedTaskId] = useState<string | null>(null);
  const responseSchedulerRef = useRef(createTransitionScheduler(clearTimeout));
  const taskId = task?.id ?? 'none';
  const offerConfirmed = offerConfirmedTaskId === taskId;

  const guidedNodes = useMemo(
    () => (task?.type === 'guided' ? buildGuidedNodes(task.messages ?? []) : []),
    [task],
  );

  const {
    phase,
    visibleNodes,
    waitingNodeId,
    answeredIds,
    dispatch,
    bindings: { setScrollContainer, setActiveElement },
  } = useProgressionController({
    nodes: guidedNodes,
    scrollMode: 'top',
  });

  useEffect(() => {
    const scheduler = responseSchedulerRef.current;

    scheduler.cancelAll();

    if (guidedNodes.length > 0) {
      dispatch({ type: 'START' });
    }

    return () => {
      scheduler.cancelAll();
    };
  }, [dispatch, guidedNodes]);

  const handleGuidedSelect = useCallback(
    (message: DMessage, value: string | string[]) => {
      const replyText = Array.isArray(value)
        ? value.join(', ')
        : message.chips?.find((chip) => chip.value === value)?.label ?? value;
      const replyKey = `${taskId}:${message.id}`;

      setRepliesByMessageId((prev) => ({
        ...prev,
        [replyKey]: {
          id: `user-reply-${message.id}`,
          sender: 'user',
          content: replyText,
        },
      }));

      responseSchedulerRef.current.schedule(`advance-${message.id}`, () => {
        dispatch(
          message.multiSelect
            ? { type: 'SUBMIT_MULTI', nodeId: message.id }
            : { type: 'SELECT_CHIP', nodeId: message.id },
        );
      }, GUIDED_CHIP_DELAY_MS);
    },
    [dispatch, taskId],
  );

  const handleOfferCta = useCallback(() => {
    setOfferConfirmedTaskId(taskId);
  }, [taskId]);

  // ---------- RENDER: No task selected ----------
  if (!task) {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-8">
            <p
              className="text-sm font-medium mb-2"
              style={{
                color: 'var(--alpha-light-900)',
                fontVariationSettings: "'wdth' 100",
              }}
            >
              Select a task from your action plan to get started
            </p>
            <p
              className="text-xs"
              style={{
                color: 'var(--alpha-light-400)',
                fontVariationSettings: "'wdth' 100",
              }}
            >
              Your progress is saved automatically
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ---------- RENDER: Quick task ----------
  if (task.type === 'quick') {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <FlowHeader taskTitle={task.title} taskType={task.type} onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <div className="max-w-[420px] mx-auto text-center px-5">
            <div
              className="rounded-xl p-6 mb-6"
              style={{
                background: 'var(--alpha-light-25)',
                border: '1px solid var(--alpha-light-100)',
              }}
            >
              <p
                className="text-sm leading-7"
                style={{
                  color: 'var(--alpha-light-900)',
                  fontVariationSettings: "'wdth' 100",
                  fontSize: 'var(--text-base)',
                }}
              >
                {task.subtitle || task.title}
              </p>
            </div>

            <button
              type="button"
              onClick={onTaskComplete}
              className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
              style={{
                background: 'var(--btn-primary)',
                padding: '10px 24px',
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
              }}
            >
              Mark Complete
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- RENDER: Offer task ----------
  if (task.type === 'offer') {
    return (
      <div className="flex-1 flex flex-col bg-white overflow-hidden">
        <FlowHeader taskTitle={task.title} taskType={task.type} onBack={onBack} />
        <div className="flex-1 flex items-center justify-center">
          <div className="px-5">
            {offerConfirmed ? (
              <div className="text-center animate-fade-in-up">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ background: '#22c55e' }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path
                      d="M4 10.5L8 14.5L16 6.5"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p
                  className="text-sm font-semibold mb-4"
                  style={{
                    color: 'var(--alpha-light-900)',
                    fontVariationSettings: "'wdth' 100",
                  }}
                >
                  {task.offerCta?.toLowerCase().includes('book') ? 'Booked!' : 'Purchased!'}
                </p>
                <button
                  type="button"
                  onClick={onBack}
                  className="text-xs cursor-pointer bg-transparent border-none"
                  style={{
                    color: 'var(--alpha-brand-950)',
                    fontVariationSettings: "'wdth' 100",
                  }}
                >
                  &larr; Back to Plan
                </button>
              </div>
            ) : (
              <OfferCard
                title={task.title}
                description={task.subtitle || ''}
                cta={task.offerCta || 'Get Started'}
                price={task.offerPrice}
                onCtaClick={handleOfferCta}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  const activeChipMessageId = waitingNodeId;

  return (
    <div className="flex-1 flex flex-col bg-white overflow-hidden">
      <FlowHeader taskTitle={task.title} taskType={task.type} onBack={onBack} />
      <div ref={setScrollContainer} className="flex-1 overflow-y-auto">
        <div className="max-w-[640px] mx-auto w-full px-5 pt-5 pb-[50vh] flex flex-col gap-7">
          {visibleNodes.map((node, index) => {
            const msg = node.payload as DMessage;
            const distFromEnd = visibleNodes.length - 1 - index;
            const opacity = distFromEnd === 0 ? 1 : distFromEnd === 1 ? 0.5 : distFromEnd === 2 ? 0.3 : 0.2;
            const isLast = index === visibleNodes.length - 1;
            const reply = repliesByMessageId[`${taskId}:${msg.id}`];
            const isNew = !answeredIds.has(msg.id);

            return (
              <div
                key={msg.id}
                ref={isLast && phase !== 'typing' ? setActiveElement : undefined}
                style={{ opacity, transition: 'opacity 0.4s ease' }}
              >
                <MessageBubble message={msg} isNew={isNew}>
                  {msg.video && (
                    <VideoEmbed
                      src={msg.video.src}
                      title={msg.video.title}
                      duration={msg.video.duration}
                    />
                  )}
                  {msg.visualCard && (
                    <VisualCard
                      icon={msg.visualCard.icon}
                      title={msg.visualCard.title}
                      items={msg.visualCard.items}
                    />
                  )}
                  {msg.offerCard && (
                    <OfferCard
                      title={msg.offerCard.title}
                      description={msg.offerCard.description}
                      cta={msg.offerCard.cta}
                      price={msg.offerCard.price}
                    />
                  )}
                </MessageBubble>

                {reply && (
                  <div className="flex justify-end animate-fade-in-up">
                    <div
                      className="max-w-[480px]"
                      style={{
                        background: 'rgba(255, 255, 255, 0.28)',
                        backdropFilter: 'blur(4px)',
                        WebkitBackdropFilter: 'blur(4px)',
                        border: '1px solid var(--alpha-light-50)',
                        borderRadius: '16px',
                        padding: '20px',
                      }}
                    >
                      <p
                        className="whitespace-pre-wrap"
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-medium)',
                          lineHeight: '20px',
                          color: 'var(--alpha-light-900)',
                        }}
                      >
                        {reply.content}
                      </p>
                    </div>
                  </div>
                )}

                {msg.chips && msg.id === activeChipMessageId && (
                  <div className={`mt-3 ${msg.chips.some((c) => c.emoji) ? '' : 'ml-9'}`}>
                    <ChipPicker
                      chips={msg.chips}
                      multiSelect={msg.multiSelect}
                      onSelect={(value) => handleGuidedSelect(msg, value)}
                      onMultiSubmit={(values) => handleGuidedSelect(msg, values)}
                    />
                  </div>
                )}
              </div>
            );
          })}

          {phase === 'typing' && (
            <div ref={setActiveElement}>
              <TypingIndicator />
            </div>
          )}

          {phase === 'completed' && (
            <div ref={setActiveElement} className="flex justify-center pt-2 animate-fade-in-up">
              <button
                type="button"
                onClick={onTaskComplete}
                className="rounded-full text-white cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
                style={{
                  background: 'var(--btn-primary)',
                  padding: '10px 24px',
                  fontSize: 'var(--text-base)',
                  fontWeight: 'var(--font-semibold)',
                }}
              >
                Complete Task
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
