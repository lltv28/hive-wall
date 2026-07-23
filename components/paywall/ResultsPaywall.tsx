'use client';

import { useEffect, useState } from 'react';
import { isDemoAutoplay } from '@/lib/demoMode';
import { asset } from '@/lib/basePath';

const CTA_DELAY_SECONDS = 120;
const DEFAULT_VIDEO_SRC = process.env.NEXT_PUBLIC_PAYWALL_VIDEO_SRC || '/paywall-video.mp4';

interface ResultsPaywallProps {
  onUnlock: () => void;
  videoSrc?: string;
  skipTimer?: boolean;
}

function formatCountdown(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ResultsPaywall({
  onUnlock,
  videoSrc = DEFAULT_VIDEO_SRC,
  skipTimer = false,
}: ResultsPaywallProps) {
  const demo = isDemoAutoplay();
  const [secondsRemaining, setSecondsRemaining] = useState(() => (skipTimer ? 0 : CTA_DELAY_SECONDS));
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  useEffect(() => {
    if (secondsRemaining <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [secondsRemaining]);

  const isCtaVisible = secondsRemaining <= 0;

  const completeDemoCheckout = () => {
    setIsCheckoutOpen(false);
    onUnlock();
  };

  return (
    <>
      <section
        className="bg-white rounded-2xl border p-6 animate-fade-in-up"
        style={{ borderColor: '#E5E5E8', boxShadow: 'var(--shadow-card)' }}
      >
        <p
          style={{
            color: '#2E7D52',
            fontSize: '12px',
            fontWeight: 'var(--font-semibold)',
            letterSpacing: '0.3px',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          Report Locked
        </p>
        <h2
          style={{
            color: 'var(--alpha-light-900)',
            fontSize: 'var(--text-lg)',
            fontWeight: 'var(--font-semibold)',
            lineHeight: 1.35,
            marginBottom: '10px',
          }}
        >
          Your full AI Readiness Report is ready.
        </h2>
        <p
          style={{
            color: '#71717A',
            fontSize: '14px',
            lineHeight: 1.5,
            marginBottom: '20px',
          }}
        >
          Watch this quick walkthrough first. Purchase unlocks the complete report and action plan immediately.
        </p>

        <div
          className="rounded-xl overflow-hidden"
          style={{ background: '#0A0A0A', width: '100%', maxWidth: '420px', aspectRatio: '1 / 1', margin: '0 auto' }}
        >
          <video
            width={1080}
            height={1080}
            className="w-full h-full object-cover"
            src={asset(videoSrc)}
            preload={demo ? 'auto' : 'metadata'}
            controls={!demo}
            autoPlay={demo}
            muted={demo}
            loop={demo}
            playsInline
          />
        </div>

        {!isCtaVisible && (
          <p
            style={{
              marginTop: '14px',
              textAlign: 'center',
              color: '#A1A1AA',
              fontSize: '13px',
              fontWeight: 'var(--font-medium)',
            }}
          >
            Purchase unlocks in {formatCountdown(secondsRemaining)}
          </p>
        )}

        {isCtaVisible && (
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
            style={{
              marginTop: '14px',
              background: 'var(--gradient-cta-active)',
              color: 'var(--alpha-dark-900)',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 24px',
              fontSize: 'var(--text-lg)',
              fontWeight: 'var(--font-medium)',
            }}
          >
            Unlock Full Report
          </button>
        )}
      </section>

      {isCheckoutOpen && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center p-4"
          style={{ background: 'rgba(10, 10, 10, 0.6)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Demo checkout"
        >
          <div
            className="bg-white rounded-2xl border w-full max-w-[760px] max-h-[90vh] overflow-hidden"
            style={{ borderColor: '#E5E5E8', boxShadow: 'var(--shadow-dropdown)' }}
          >
            <div
              className="flex items-center justify-between px-4 py-3 border-b"
              style={{ borderColor: '#E5E5E8' }}
            >
              <h3 style={{ color: 'var(--alpha-light-900)', fontWeight: 'var(--font-semibold)', fontSize: '16px' }}>
                Demo checkout
              </h3>
              <button
                type="button"
                onClick={() => setIsCheckoutOpen(false)}
                className="cursor-pointer"
                style={{
                  border: 'none',
                  background: 'transparent',
                  color: '#71717A',
                  fontSize: '20px',
                  lineHeight: 1,
                }}
                aria-label="Close checkout"
              >
                x
              </button>
            </div>
            <div className="px-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 58px)' }}>
              <p style={{ color: '#71717A', fontSize: '14px', textAlign: 'center', marginBottom: '16px' }}>
                Placeholder checkout for demo mode.
              </p>
              <button
                type="button"
                onClick={completeDemoCheckout}
                className="w-full cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
                style={{
                  background: 'var(--gradient-cta-active)',
                  color: 'var(--alpha-dark-900)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px 24px',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--font-medium)',
                }}
              >
                Complete Demo Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
