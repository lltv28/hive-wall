import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import OnboardingChat from '../OnboardingChat';

type SyncEvent =
  | { type: 'chip'; messageId: string; value: string }
  | { type: 'multi'; messageId: string; values: string[] }
  | { type: 'continue' }
  | { type: 'back' }
  | { type: 'results' }
  | { type: 'unlockResults' }
  | { type: 'jump'; targetMsgIndex: number };

let splitHandler: ((event: SyncEvent) => void) | null = null;

vi.mock('next/image', () => ({
  default: (props: { alt?: string; src: string; width?: number; height?: number }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={props.alt ?? ''} src={props.src} width={props.width} height={props.height} />
  ),
}));

vi.mock('@/lib/useSplitSync', () => ({
  useSplitSync: () => ({
    broadcast: () => {},
    onEvent: (cb: (event: SyncEvent) => void) => {
      splitHandler = cb;
    },
    isFollower: true,
    isLeader: false,
    isSplit: true,
  }),
}));

vi.mock('../OnboardingProgress', () => ({
  default: ({ currentFlowIndex }: { currentFlowIndex: number }) => (
    <div data-testid="flow-index">{currentFlowIndex}</div>
  ),
}));

vi.mock('../GeneratingChecklist', () => ({
  default: () => <div data-testid="generating-checklist" />,
}));

vi.mock('../TypingIndicator', () => ({
  default: () => <div data-testid="typing-indicator">Typing</div>,
}));

vi.mock('../MessageBubble', () => ({
  default: ({ message, children }: { message: { content?: string }; children?: React.ReactNode }) => (
    <div data-testid="message-bubble">
      {message.content}
      {children}
    </div>
  ),
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

describe('OnboardingChat split-sync guards', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    splitHandler = null;
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('ignores continue/back/results events when not yet actionable', async () => {
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

    expect(splitHandler).not.toBeNull();
    expect(screen.getByTestId('flow-index')).toHaveTextContent('-1');

    await act(async () => {
      splitHandler?.({ type: 'continue' });
      splitHandler?.({ type: 'back' });
      splitHandler?.({ type: 'results' });
    });

    expect(screen.getByTestId('flow-index')).toHaveTextContent('-1');
    expect(screen.queryByTestId('generating-checklist')).not.toBeInTheDocument();
  });
});
