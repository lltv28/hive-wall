import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import CtaBlock from './CtaBlock';

describe('CtaBlock', () => {
  it('matches primary quiz CTA styling', () => {
    render(<CtaBlock href="#book" text="Book Your Strategy Call" />);

    const cta = screen.getByRole('link', { name: 'Book Your Strategy Call' });

    expect(cta).toHaveStyle({
      background: 'var(--gradient-cta-active)',
      color: 'var(--alpha-dark-900)',
      borderRadius: '10px',
      padding: '10px 24px',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--font-medium)',
    });
  });
});
