import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import FlowChat from '../FlowChat';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src: string; width?: number; height?: number }) => (
    <img alt={props.alt ?? ''} src={props.src} width={props.width} height={props.height} />
  ),
}));

vi.mock('../FlowHeader', () => ({
  default: ({ taskTitle }: { taskTitle: string }) => <div data-testid="flow-header">{taskTitle}</div>,
}));

vi.mock('../TypingIndicator', () => ({
  default: () => <div data-testid="typing-indicator">Typing</div>,
}));

vi.mock('../MessageBubble', () => ({
  default: ({ message, children }: { message: { content?: string; sender: string }; children?: ReactNode }) => (
    <div data-testid={message.sender === 'user' ? 'user-bubble' : 'message-bubble'}>
      {message.content}
      {children}
    </div>
  ),
}));

vi.mock('../VideoEmbed', () => ({
  default: () => <div data-testid="video-embed" />,
}));

vi.mock('../VisualCard', () => ({
  default: () => <div data-testid="visual-card" />,
}));

vi.mock('../OfferCard', () => ({
  default: ({ onCtaClick }: { onCtaClick?: () => void }) => (
    <button type="button" onClick={onCtaClick}>
      Offer
    </button>
  ),
}));

vi.mock('../ChipPicker', () => ({
  default: ({ chips, onSelect }: { chips: { label: string; value: string }[]; onSelect: (value: string) => void }) => (
    <div>
      {chips.map((chip) => (
        <button key={chip.value} type="button" onClick={() => onSelect(chip.value)}>
          {chip.label}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@/lib/progression/useProgressionController', async () => {
  const React = await import('react');

  return {
    useProgressionController: ({ nodes }: { nodes: Array<{ id: string; payload: unknown }> }) => {
      const [phase, setPhase] = React.useState<'idle' | 'waitingInput' | 'completed'>('idle');
      const [visibleNodes, setVisibleNodes] = React.useState<Array<{ id: string; payload: unknown }>>([]);
      const [waitingNodeId, setWaitingNodeId] = React.useState<string | null>(null);
      const [answeredIds, setAnsweredIds] = React.useState<Set<string>>(new Set());

      const dispatch = React.useCallback((event: { type: string; nodeId?: string }) => {
        if (event.type === 'START') {
          setVisibleNodes((prev) => (prev.length === 0 ? nodes.slice(0, 1) : prev));
          setWaitingNodeId((prev) => prev ?? nodes[0]?.id ?? null);
          setPhase((prev) => (prev === 'idle' ? 'waitingInput' : prev));
          return;
        }

        if (event.type === 'SELECT_CHIP' || event.type === 'SUBMIT_MULTI') {
          if (event.nodeId) {
            setAnsweredIds((prev) => {
              const next = new Set(prev);
              next.add(event.nodeId!);
              return next;
            });
          }
          setWaitingNodeId(null);
          setPhase('completed');
        }
      }, [nodes]);

      return {
        phase,
        visibleNodes,
        waitingNodeId,
        answeredIds,
        dispatch,
        bindings: {
          setScrollContainer: () => {},
          setActiveElement: () => {},
        },
      };
    },
  };
});

describe('FlowChat progression', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('reveals a guided message and completes after the chip is selected', async () => {
    const onTaskComplete = vi.fn();
    const task = {
      id: 'guided-1',
      title: 'Guided',
      type: 'guided',
      status: 'active',
      messages: [
        {
          id: 'm1',
          sender: 'ai',
          content: 'Hello guided',
          chips: [
            { label: 'Continue', value: 'continue' },
          ],
          waitForInput: true,
        },
      ],
    };

    render(<FlowChat task={task as never} onTaskComplete={onTaskComplete} onBack={() => {}} />);

    expect(await screen.findByText('Hello guided')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Continue' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(screen.getAllByText('Continue').length).toBeGreaterThan(0);

    expect(await screen.findByRole('button', { name: 'Complete Task' })).toBeInTheDocument();
  });
});
