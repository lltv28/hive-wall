'use client';

import SectionCard from './SectionCard';

export default function VideoPlaceholder() {
  return (
    <SectionCard label="Walkthrough Preview" icon={'\uD83C\uDFA5'}>
      <div
        style={{ display: 'flex', justifyContent: 'center' }}
      >
        <div
          data-testid="results-video-card"
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            maxWidth: '360px',
            borderRadius: '12px',
            overflow: 'hidden',
            background: '#18181B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {/* Play button */}
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>
      <div
        style={{
          marginTop: '10px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#71717A',
        }}
      >
        Video preview appears centered before the paywall.
      </div>
    </SectionCard>
  );
}
