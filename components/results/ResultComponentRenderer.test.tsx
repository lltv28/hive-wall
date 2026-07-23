import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import ResultComponentRenderer from './ResultComponentRenderer';

const config = {
  score: 97,
  headline: 'headline',
  description: 'description',
  recommendation: {
    name: 'AI Salesperson',
    icon: '🎯',
    description: 'desc',
    features: [{ value: '24/7', label: 'Always selling' }],
  },
  profileTags: ['Coach'],
  painPoints: ['Pain'],
  testimonial: {
    quote: 'quote',
    name: 'name',
    detail: 'detail',
  },
  ctaUrl: '#book',
};

describe('ResultComponentRenderer', () => {
  it('uses quiz CTA button styling for active continue action', () => {
    render(
      <ResultComponentRenderer
        componentKey="hero"
        config={config}
        isActive
        onContinue={() => {}}
      />,
    );

    const button = screen.getByRole('button', { name: 'Continue' });

    expect(button).toHaveStyle({
      background: 'var(--gradient-cta-active)',
      color: 'var(--alpha-dark-900)',
      borderRadius: '10px',
      padding: '10px 24px',
      fontSize: 'var(--text-lg)',
      fontWeight: 'var(--font-medium)',
    });
  });
});
