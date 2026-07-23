import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PlanFlow from '../PlanFlow';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src: string; width?: number; height?: number }) => (
    <img alt={props.alt ?? ''} src={props.src} width={props.width} height={props.height} />
  ),
}));

vi.mock('../StepperBar', () => ({
  default: ({ currentStepIndex, completedCount }: { currentStepIndex: number; completedCount: number }) => (
    <div data-testid="stepper">
      {currentStepIndex}:{completedCount}
    </div>
  ),
}));

vi.mock('../PinnedOffer', () => ({
  default: () => <div data-testid="pinned-offer" />,
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

vi.mock('../Callout', () => ({
  default: ({ headline, onContinue }: { headline: string; onContinue?: () => void }) => (
    <button type="button" onClick={onContinue}>
      {headline}
    </button>
  ),
}));

vi.mock('../FitScore', () => ({
  default: ({ message, onCtaClick }: { message: string; onCtaClick?: () => void }) => (
    <button type="button" onClick={onCtaClick}>
      {message}
    </button>
  ),
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
      const [phase, setPhase] = React.useState<'idle' | 'typing'>('idle');
      const [visibleNodes, setVisibleNodes] = React.useState<Array<{ id: string; payload: unknown }>>([]);

      const dispatch = React.useCallback((event: { type: string }) => {
        if (event.type === 'START') {
          setVisibleNodes((prev) => (prev.length === 0 ? nodes.slice(0, 1) : prev));
          setPhase('typing');
        }
      }, [nodes]);

      return {
        phase,
        visibleNodes,
        waitingNodeId: null,
        answeredIds: new Set<string>(),
        dispatch,
        bindings: {
          setScrollContainer: () => {},
          setActiveElement: () => {},
        },
      };
    },
  };
});

describe('PlanFlow progression', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the first step message from progression nodes', async () => {
    const steps = [
      {
        id: 'step-1',
        title: 'Define Your Audience',
        type: 'guided',
        status: 'active',
        messages: [
          {
            id: 's1-m1',
            sender: 'ai',
            content: 'Define Your Audience',
          },
        ],
      },
      {
        id: 'step-2',
        title: 'Build Your Offer',
        type: 'guided',
        status: 'locked',
        messages: [
          {
            id: 's2-m1',
            sender: 'ai',
            content: 'Build Your Offer',
          },
        ],
      },
    ];

    render(<PlanFlow steps={steps as never} offers={[]} />);

    expect(await screen.findByText('Define Your Audience')).toBeInTheDocument();
    expect(screen.getByTestId('stepper')).toHaveTextContent('0:0');
  });
});
