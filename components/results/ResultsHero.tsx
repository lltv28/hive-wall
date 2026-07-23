'use client';

import { useState, useEffect, useRef } from 'react';

interface ResultsHeroProps {
  score: number;
  headline: string;
  description: string;
  recommendation: {
    name: string;
    icon: string;
  };
}

export default function ResultsHero({ score, headline, description, recommendation }: ResultsHeroProps) {
  const [displayScore, setDisplayScore] = useState(0);
  const [showPill, setShowPill] = useState(false);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setTimeout(() => setShowPill(true), 200);
      }
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [score]);

  return (
    <div
      className="animate-fade-in"
      style={{
        background: 'linear-gradient(165deg, #1a3a2a 0%, #0f2619 100%)',
        color: 'white',
        padding: '40px 28px 32px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 'var(--text-2xs)',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          opacity: 0.4,
          marginBottom: '16px',
        }}
      >
        AI Product Readiness Score
      </div>

      <div
        style={{
          fontSize: '64px',
          fontWeight: 'var(--font-bold)',
          letterSpacing: '-3px',
          lineHeight: 1,
        }}
      >
        {displayScore}
        <span style={{ fontSize: '32px', opacity: 0.45 }}>%</span>
      </div>

      <div
        style={{
          fontSize: 'var(--text-sm)',
          fontWeight: 'var(--font-medium)',
          marginTop: '14px',
          opacity: 0.85,
          letterSpacing: '-0.3px',
        }}
      >
        {headline}
      </div>

      <div
        style={{
          fontSize: '13px',
          opacity: 0.4,
          marginTop: '8px',
          maxWidth: '320px',
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.55,
        }}
      >
        {description}
      </div>

      <div
        style={{
          marginTop: '22px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(58,155,104,0.18)',
          border: '1px solid rgba(58,155,104,0.28)',
          borderRadius: '10px',
          padding: '12px 20px',
          opacity: showPill ? 1 : 0,
          transform: showPill ? 'scale(1)' : 'scale(0.9)',
          transition: 'opacity 300ms ease, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <span style={{ fontSize: '20px' }}>{recommendation.icon}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: '9px', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Recommended
          </div>
          <div style={{ fontSize: '15px', fontWeight: 'var(--font-semibold)', marginTop: '1px' }}>
            {recommendation.name}
          </div>
        </div>
      </div>
    </div>
  );
}
