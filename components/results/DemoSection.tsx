'use client';

import SectionCard from './SectionCard';

const DEMOS = [
  {
    title: 'AI Salesperson in Action',
    description: 'Watch how an AI sales agent pre-qualifies leads, handles objections, and books strategy calls — completely autonomously.',
  },
  {
    title: 'AI Service Delivery Demo',
    description: 'See how a coaching business delivers their entire methodology through an AI-powered experience — without being on a single call.',
  },
  {
    title: 'AI Operations Tool Demo',
    description: 'A real example of an AI operations system managing client onboarding, task delegation, and follow-ups at scale.',
  },
  {
    title: 'From Zero to Live in 14 Days',
    description: 'A walkthrough of the complete build process — from strategy call to a fully deployed AI product generating revenue.',
  },
];

export default function DemoSection() {
  return (
    <SectionCard label="See It In Action" icon={'\uD83C\uDFAC'}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {DEMOS.map((demo, i) => (
          <div key={i}>
            {/* Video placeholder */}
            <div
              style={{
                width: '100%',
                aspectRatio: '1 / 1',
                borderRadius: '10px',
                overflow: 'hidden',
                background: '#18181B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #d4d4d4',
                boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>
            {/* Title + description */}
            <div style={{ marginTop: '10px' }}>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-semibold)',
                  color: '#18181B',
                  letterSpacing: '-0.2px',
                }}
              >
                {demo.title}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#71717A',
                  marginTop: '4px',
                  lineHeight: 1.5,
                }}
              >
                {demo.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}
