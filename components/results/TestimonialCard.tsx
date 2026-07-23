'use client';

import SectionCard from './SectionCard';

interface TestimonialCardProps {
  quote: string;
  name: string;
  detail: string;
}

export default function TestimonialCard({ quote, name, detail }: TestimonialCardProps) {
  return (
    <SectionCard label="Client Results" icon={'\u2B50'}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #d4d4d8, #a1a1aa)',
            flexShrink: 0,
          }}
        />
        <div>
          <div
            style={{
              fontSize: 'var(--text-xs)',
              fontStyle: 'italic',
              color: '#52525B',
              lineHeight: 'var(--leading-normal)',
            }}
          >
            &ldquo;{quote}&rdquo;
          </div>
          <div style={{ fontSize: '12px', color: '#A1A1AA', marginTop: '6px' }}>
            {name} &mdash; {detail}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
