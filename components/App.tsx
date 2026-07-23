'use client';

import { useState, useEffect } from 'react';
import { DMessage } from '@/lib/types';
import { QuizConfig, configToOnboardingMessages, QuizMilestone, FlowItem } from '@/lib/quiz-config';
import OnboardingChat from './OnboardingChat';
import { asset } from '@/lib/basePath';

/* ------------------------------------------------------------------ */
/*  Inner component — resets when key changes                          */
/* ------------------------------------------------------------------ */

function AppContent({
  onboardingMessages,
  milestones,
  flow,
}: {
  onboardingMessages: DMessage[];
  milestones: QuizMilestone[];
  flow: FlowItem[];
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <OnboardingChat messages={onboardingMessages} milestones={milestones} totalFlowItems={flow.length} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Outer component — top-level + demo controls                        */
/* ------------------------------------------------------------------ */

export default function App() {
  const getInitialFlags = () => {
    if (typeof window === 'undefined') {
      return { isSplit: false, hideDemoControls: false, demoScale: 1, demoInsetTop: 0 };
    }
    const params = new URLSearchParams(window.location.search);
    const isSplit = params.get('role') === 'leader' || params.get('role') === 'follower';
    const hideDemoControls = params.get('hideDemoControls') === '1' || params.get('hideDemoControls') === 'true';
    const rawDemoScale = Number(params.get('demoScale'));
    const demoScale = Number.isFinite(rawDemoScale) ? Math.min(1, Math.max(0.5, rawDemoScale)) : 1;
    const rawInsetTop = Number(params.get('demoInsetTop'));
    const demoInsetTop = Number.isFinite(rawInsetTop) ? Math.min(80, Math.max(0, rawInsetTop)) : 0;
    return { isSplit, hideDemoControls, demoScale, demoInsetTop };
  };

  const [{ isSplit, hideDemoControls, demoScale, demoInsetTop }] = useState(getInitialFlags);
  const [key, setKey] = useState(0);
  const [controlsHidden, setControlsHidden] = useState(isSplit || hideDemoControls);
  const [config, setConfig] = useState<QuizConfig | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    fetch(asset('/quiz-config.json'))
      .then((r) => {
        if (!r.ok) throw new Error(`Config fetch failed: ${r.status}`);
        return r.json();
      })
      .then(setConfig)
      .catch(() => setLoadError(true));
  }, []);

  const handleReset = () => {
    setKey((k) => k + 1);
  };

  if (!config) {
    return (
      <div className="flex flex-col" style={{ width: '100vw', height: '100vh', background: '#F6F6F7' }}>
        <div className="flex-1 flex items-center justify-center">
          <p style={{ color: loadError ? '#dc2626' : '#A1A1AA', fontSize: '14px' }}>
            {loadError ? 'Failed to load quiz config.' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  const onboardingMessages = configToOnboardingMessages(config);

  return (
    <div
      className="flex flex-col mx-auto"
      style={{ width: '100%', maxWidth: isSplit ? 'none' : '430px', height: '100vh', background: '#F6F6F7' }}
    >
      {/* Demo Controls */}
      {!isSplit && !hideDemoControls && <button
        onClick={() => setControlsHidden((h) => !h)}
        className="absolute top-2 right-2 z-[300] w-7 h-7 rounded-md flex items-center justify-center bg-white/80 backdrop-blur-[4px] border border-[rgba(26,26,26,0.09)] hover:bg-white transition-colors duration-150 cursor-pointer"
        title={controlsHidden ? 'Show controls' : 'Hide controls'}
      >
        <svg className="w-3.5 h-3.5 text-[rgba(26,26,26,0.48)]" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {controlsHidden ? (
            <path d="M2 5l6 6 6-6" />
          ) : (
            <path d="M2 11l6-6 6 6" />
          )}
        </svg>
      </button>}

      {!controlsHidden && (
        <div className="flex-shrink-0 bg-white border-b border-[rgba(26,26,26,0.09)] px-5 py-2 flex items-center justify-between z-[200] relative">
          <span
            className="text-xs font-semibold uppercase tracking-wider text-[rgba(26,26,26,0.36)]"
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            Demo Controls
          </span>
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-[rgba(26,26,26,0.6)] border border-[rgba(26,26,26,0.09)] hover:bg-[rgba(26,26,26,0.04)] transition-colors duration-150 cursor-pointer"
            style={{ fontVariationSettings: "'wdth' 100" }}
          >
            Reset Demo
          </button>
        </div>
      )}

      {/* Content area. When scaled for demo mode, the inner box is sized to
          1/scale and absolutely filled so that after the transform it covers
          the full viewport (no blank strip at the bottom). */}
      <div className="flex-1 overflow-hidden" key={key} style={{ position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            transform: demoScale === 1 ? undefined : `scale(${demoScale})`,
            transformOrigin: 'top left',
            width: demoScale === 1 ? '100%' : `${100 / demoScale}%`,
            height: demoScale === 1 ? '100%' : `${100 / demoScale}%`,
            paddingTop: demoInsetTop > 0 ? `${demoInsetTop}px` : undefined,
            boxSizing: 'border-box',
          }}
        >
          <AppContent onboardingMessages={onboardingMessages} milestones={config.milestones} flow={config.flow} />
        </div>
      </div>
    </div>
  );
}
