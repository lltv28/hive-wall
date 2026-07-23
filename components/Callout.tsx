'use client';

import { useState, useEffect } from 'react';
import { isDemoAutoplay } from '@/lib/demoMode';
import { asset } from '@/lib/basePath';

interface CalloutProps {
  headline: string;
  body: string;
  stat?: string;
  video?: { src: string; title: string };
  onContinue: () => void;
}

export default function Callout({ headline, body, stat, video, onContinue }: CalloutProps) {
  const [showBody, setShowBody] = useState(false);
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const bodyId = setTimeout(() => setShowBody(true), 600);
    const buttonId = setTimeout(() => setShowButton(true), 2000);
    return () => { clearTimeout(bodyId); clearTimeout(buttonId); };
  }, []);

  const demo = isDemoAutoplay();

  return (
    <div
      className="animate-fade-in-up text-center"
      style={{
        background: '#FFFFFF',
        border: '1px solid #E5E5E8',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Video */}
      {video && (
        <div
          style={{
            position: 'relative',
            background: '#000',
            opacity: showBody ? 1 : 0,
            transition: 'opacity 400ms ease',
          }}
        >
          <video
            className="w-full"
            style={{ aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
            src={asset(video.src)}
            preload={demo ? 'auto' : 'metadata'}
            controls={!demo}
            autoPlay={demo}
            muted={demo}
            loop={demo}
            playsInline
          />
          {video.title && (
            <div
              style={{
                padding: '8px 16px',
                background: 'rgba(0,0,0,0.6)',
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
              }}
            >
              <span style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.8)', fontWeight: 'var(--font-medium)' }}>
                {video.title}
              </span>
            </div>
          )}
        </div>
      )}

      <div style={{ padding: video ? '20px 28px 28px' : '28px' }}>
        {/* Stat + headline appear immediately */}
        {stat && (
          <div
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: '#18181B',
              marginBottom: '4px',
              lineHeight: 1.2,
            }}
          >
            {stat}
          </div>
        )}
        <h3
          style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            color: '#18181B',
            marginBottom: '8px',
            lineHeight: 1.4,
          }}
        >
          {headline}
        </h3>

        {/* Body fades in after 600ms */}
        <p
          style={{
            fontSize: 'var(--text-base)',
            lineHeight: 'var(--leading-relaxed)',
            color: '#52525B',
            marginBottom: '16px',
            opacity: showBody ? 1 : 0,
            transform: showBody ? 'translateY(0)' : 'translateY(6px)',
            transition: 'opacity 400ms ease, transform 400ms ease',
          }}
        >
          {body}
        </p>

        {/* Button fades in after 3s */}
        <div style={{ opacity: showButton ? 1 : 0, transition: 'opacity 300ms ease', minHeight: '40px' }}>
          <button
            type="button"
            onClick={onContinue}
            disabled={!showButton}
            className="cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
            style={{
              background: 'var(--gradient-cta-active)',
              padding: '10px 24px',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-medium)',
              color: 'var(--alpha-dark-900)',
              borderRadius: '10px',
              border: 'none',
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
