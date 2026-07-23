import { act, render, screen } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingChat from '../OnboardingChat';

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src: string; width?: number; height?: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={props.src} width={props.width} height={props.height} />
  ),
}));

vi.mock('@/lib/useSplitSync', () => ({
  useSplitSync: () => ({
    broadcast: () => {},
    onEvent: () => {},
    isFollower: false,
    isLeader: false,
    isSplit: false,
  }),
}));

vi.mock('../OnboardingProgress', () => ({
  default: () => <div data-testid="onboarding-progress" />,
}));

vi.mock('../GeneratingChecklist', () => ({
  default: () => <div data-testid="generating-checklist" />,
}));

vi.mock('../TypingIndicator', () => ({
  default: () => <div data-testid="typing-indicator">Typing</div>,
}));

vi.mock('../MessageBubble', () => ({
  default: function MockMessageBubble({ message, children, onStreamingComplete }: {
    message: { content?: string };
    children?: React.ReactNode;
    onStreamingComplete?: () => void;
  }) {
    const didNotifyRef = useRef(false);

    useEffect(() => {
      if (didNotifyRef.current) return;
      didNotifyRef.current = true;
      onStreamingComplete?.();
    }, [onStreamingComplete]);

    return (
      <div data-testid="message-bubble">
        {message.content}
        {children}
      </div>
    );
  },
}));

vi.mock('../StreamingText', () => ({
  default: ({ text, children }: { text: string; children: (visibleText: string, isStreaming: boolean) => React.ReactNode }) => (
    <>{children(text, false)}</>
  ),
}));

vi.mock('../VideoEmbed', () => ({
  default: () => <div data-testid="video-embed" />,
}));

vi.mock('../VisualCard', () => ({
  default: () => <div data-testid="visual-card" />,
}));

vi.mock('../ChipPicker', () => ({
  default: ({ chips }: { chips: Array<{ label: string }> }) => (
    <div>{chips.map((chip) => <button key={chip.label}>{chip.label}</button>)}</div>
  ),
}));

vi.mock('../FitScore', () => ({
  default: () => <div data-testid="fit-score" />,
}));

vi.mock('../Callout', () => ({
  default: () => <div data-testid="callout" />,
}));

vi.mock('../results/ResultComponentRenderer', () => ({
  default: () => <div data-testid="result-component" />,
}));

describe('OnboardingChat progression', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the first onboarding question before advancing', async () => {
    const messages = [
      {
        id: 'q1',
        sender: 'ai' as const,
        content: 'Question 1',
        chips: [{ label: 'Yes', value: 'yes' }],
        waitForInput: true,
      },
      {
        id: 'q2',
        sender: 'ai' as const,
        content: 'Question 2',
        chips: [{ label: 'No', value: 'no' }],
        waitForInput: true,
      },
    ];

    render(<OnboardingChat messages={messages} milestones={[]} totalFlowItems={2} />);

    await act(async () => {
      vi.advanceTimersByTime(1400);
    });

    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.queryByText('Question 2')).not.toBeInTheDocument();
  });
});
