'use client';

import SectionCard from './SectionCard';

interface RecommendationCardProps {
  name: string;
  description: string;
  features: { value: string; label: string }[];
}

export default function RecommendationCard({ name, description, features }: RecommendationCardProps) {
  return (
    <SectionCard label="Your AI Product Match" icon={'\uD83C\uDFAF'}>
      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-semibold)',
          color: '#18181B',
          letterSpacing: '-0.3px',
          marginBottom: '6px',
        }}
      >
        {name}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: '#52525B', lineHeight: 'var(--leading-normal)' }}>
        {description}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
        {features.map((f) => (
          <div
            key={f.value}
            style={{
              flex: 1,
              background: '#f8faf9',
              borderRadius: '8px',
              padding: '12px 8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-bold)', color: 'var(--alpha-brand-950)' }}>
              {f.value}
            </div>
            <div style={{ fontSize: 'var(--text-2xs)', color: '#A1A1AA', marginTop: '2px' }}>
              {f.label}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
