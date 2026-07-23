'use client';

import { useEffect, useState } from 'react';

interface Step {
  label: string;
  icon: string;
}

interface SocialProofContent {
  stat: string;
  statLabel: string;
  statSubtext: string;
  readyTitle: string;
  readySubtitle: string;
}

interface GeneratingChecklistProps {
  onComplete: () => void;
  steps: Step[];
  title?: string;
  subtitle?: string;
  icon?: string;
  socialProof: SocialProofContent;
}

export default function GeneratingChecklist({ onComplete, steps, title, subtitle, icon, socialProof }: GeneratingChecklistProps) {
  const [currentStep, setCurrentStep] = useState(-1);
  const [isReady, setIsReady] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    const stepDuration = 2000;

    // Complete first step after a short delay on mount
    const raf = requestAnimationFrame(() => setCurrentStep(0));

    // Advance through remaining steps
    for (let i = 1; i < steps.length; i++) {
      timers.push(setTimeout(() => setCurrentStep(i), i * stepDuration));
    }

    // After last step fills: 400ms pause, then fade to ready
    const fillEnd = steps.length * stepDuration;
    timers.push(setTimeout(() => {
      setContentVisible(false);
    }, fillEnd + 400));

    timers.push(setTimeout(() => {
      setIsReady(true);
      setContentVisible(true);
    }, fillEnd + 400 + 300));

    // Fire onComplete 2s after ready appears
    timers.push(setTimeout(onComplete, fillEnd + 400 + 300 + 2000));

    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[340px]">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-[28px] mx-auto mb-4 border"
          style={{
            background: 'var(--alpha-light-50)',
            borderColor: 'var(--alpha-light-100)',
          }}
        >
          {icon ?? '✨'}
        </div>
        <h2
          className="leading-[28px] font-medium tracking-[-0.5px]"
          style={{ color: 'var(--alpha-light-900)', fontSize: 'var(--text-xl)' }}
        >
          {title ?? 'Crafting your AI product plan'}
        </h2>
        <p className="mt-1" style={{ color: 'var(--alpha-light-500)', fontSize: 'var(--text-base)' }}>
          {subtitle ?? 'This usually takes a few seconds'}
        </p>
      </div>

      {/* Proof card */}
      <div
        className="w-full max-w-[360px]"
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5E5E8',
          borderRadius: '14px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div style={{ opacity: contentVisible ? 1 : 0, transition: 'opacity 300ms ease' }}>
          {!isReady ? (
            <>
              <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--font-bold)', color: '#18181B', marginBottom: '4px' }}>
                {socialProof.stat}
              </div>
              <div style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)', color: '#3F3F46', lineHeight: 1.5 }}>
                {socialProof.statLabel}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#A1A1AA', marginTop: '8px' }}>
                {socialProof.statSubtext}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: '#22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10.5L8.5 14L15 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: '#18181B', marginBottom: '4px' }}>
                {socialProof.readyTitle}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: '#A1A1AA' }}>
                {socialProof.readySubtitle}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stepper progress */}
      <div className="w-full max-w-[360px] mt-6 flex items-center">
        {steps.map((_, i) => {
          const filled = i <= currentStep;
          const isActive = i === currentStep;
          const lineFilled = currentStep >= i;
          return (
            <div key={i} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
              {/* Circle */}
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  flexShrink: 0,
                  background: filled
                    ? 'rgba(var(--brand-rgb), 0.92)'
                    : 'rgba(var(--brand-rgb), 0.08)',
                  transition: 'background 300ms ease, box-shadow 300ms ease',
                  boxShadow: isActive
                    ? '0 0 0 4px rgba(var(--brand-rgb), 0.15)'
                    : 'none',
                }}
              />
              {/* Connecting line */}
              {i < steps.length - 1 && (
                <div
                  style={{
                    flex: 1,
                    height: '2px',
                    background: 'rgba(var(--brand-rgb), 0.08)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: lineFilled ? '100%' : '0%',
                      background: 'rgba(var(--brand-rgb), 0.92)',
                      transition: 'width 2000ms linear',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Step label */}
      {!isReady && (
        <p
          className="w-full max-w-[360px] mt-2 text-center"
          style={{ color: 'var(--alpha-light-500)', fontVariationSettings: "'wdth' 100", fontSize: 'var(--text-xs)' }}
        >
          {steps[currentStep]?.label}
        </p>
      )}
    </div>
  );
}
