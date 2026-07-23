'use client';

import SectionCard from './SectionCard';

interface ProfileCardProps {
  tags: string[];
  summary: string;
}

export default function ProfileCard({ tags, summary }: ProfileCardProps) {
  return (
    <SectionCard label="Your Profile" icon={'\uD83D\uDCCB'}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '12px' }}>
        {tags.map((tag) => (
          <span
            key={tag}
            style={{
              background: '#F4F4F5',
              borderRadius: '6px',
              padding: '5px 12px',
              fontSize: '12px',
              fontWeight: 'var(--font-medium)',
              color: '#3F3F46',
            }}
          >
            {tag}
          </span>
        ))}
      </div>
      <div style={{ fontSize: 'var(--text-xs)', color: '#52525B', lineHeight: 'var(--leading-normal)' }}>
        {summary}
      </div>
    </SectionCard>
  );
}
