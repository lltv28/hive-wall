import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { QuizCard, CARD_SIZE } from './QuizCard';

const BOUNDS = { left: 340, top: 40, right: 1880, bottom: 1040 };

const srcs = (container: HTMLElement) =>
  [...container.querySelectorAll('iframe')].map((frame) => frame.getAttribute('src') ?? '');

describe('QuizCard', () => {
  it('keeps two iframes mounted so a drill never opens on a reload flash', () => {
    const { container } = render(
      <QuizCard leadId={0} nextLeadId={1} nodePosition={{ x: 1400, y: 540 }} bounds={BOUNDS} visible />,
    );
    expect(container.querySelectorAll('iframe')).toHaveLength(2);
  });

  it('preloads the upcoming lead into the idle slot', () => {
    // The pool only earns its keep if the NEXT lead is already loading before
    // its drill begins. Both leads must be live in the DOM at once.
    const { container } = render(
      <QuizCard leadId={7} nextLeadId={8} nodePosition={{ x: 1400, y: 540 }} bounds={BOUNDS} visible />,
    );
    const loaded = srcs(container).join(' ');
    expect(loaded).toContain('demoLeadId=7');
    expect(loaded).toContain('demoLeadId=8');
  });

  it('swaps to the preloaded slot without refetching when the next drill starts', () => {
    const { container, rerender } = render(
      <QuizCard leadId={7} nextLeadId={8} nodePosition={{ x: 1400, y: 540 }} bounds={BOUNDS} visible />,
    );
    const before = srcs(container);

    // Lead 8's drill begins; 9 becomes the upcoming lead.
    rerender(
      <QuizCard leadId={8} nextLeadId={9} nodePosition={{ x: 1400, y: 540 }} bounds={BOUNDS} visible />,
    );
    const after = srcs(container);

    // The iframe that already held lead 8 must keep the identical src, so the
    // browser does not reload it.
    const eight = before.find((src) => src.includes('demoLeadId=8'));
    expect(eight).toBeDefined();
    expect(after).toContain(eight);
  });

  it('positions itself inside the bounds', () => {
    const { container } = render(
      <QuizCard leadId={0} nextLeadId={1} nodePosition={{ x: 1860, y: 1020 }} bounds={BOUNDS} visible />,
    );
    const card = container.firstElementChild as HTMLElement;
    const left = Number.parseFloat(card.style.left);
    const top = Number.parseFloat(card.style.top);

    expect(left).toBeGreaterThanOrEqual(BOUNDS.left);
    expect(top).toBeGreaterThanOrEqual(BOUNDS.top);
    expect(left + CARD_SIZE.width).toBeLessThanOrEqual(BOUNDS.right);
    expect(top + CARD_SIZE.height).toBeLessThanOrEqual(BOUNDS.bottom);
  });

  it('is transparent and non-interactive when not visible', () => {
    const { container } = render(
      <QuizCard leadId={0} nextLeadId={1} nodePosition={{ x: 1400, y: 540 }} bounds={BOUNDS} visible={false} />,
    );
    const card = container.firstElementChild as HTMLElement;
    expect(card.style.opacity).toBe('0');
    expect(card.style.pointerEvents).toBe('none');
  });
});
