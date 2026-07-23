'use client';

import SectionCard from './SectionCard';

const STEPS = [
  {
    title: 'Strategy Call',
    description: 'We map your sales process and identify the highest-leverage AI product for your business.',
  },
  {
    title: 'We Build It',
    description: 'Our team builds your AI product end-to-end \u2014 trained on your content, voice, and methodology.',
  },
  {
    title: 'Launch & Scale',
    description: 'Go live in 14 days. We monitor performance and optimize for conversions.',
  },
];

export default function ProcessCard() {
  return (
    <SectionCard label="How Kodara Works" icon={'\uD83D\uDEE0\uFE0F'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {STEPS.map((step, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                background: '#f0f7f3',
                color: 'var(--alpha-brand-950)',
                fontSize: '13px',
                fontWeight: 'var(--font-semibold)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {i + 1}
            </div>
            <div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#18181B', marginBottom: '2px' }}>
                {step.title}
              </div>
              <div style={{ fontSize: '12px', color: '#71717A', lineHeight: 1.5 }}>
                {step.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
