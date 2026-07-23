'use client';

import { useEffect, useRef } from 'react';
import { useState } from 'react';
import { QuizMilestone } from '@/lib/quiz-config';

interface OnboardingProgressProps {
  currentFlowIndex: number;
  totalFlowItems: number;
  milestones: QuizMilestone[];
}

export default function OnboardingProgress({
  currentFlowIndex,
  totalFlowItems,
  milestones,
}: OnboardingProgressProps) {
  const rawPercentage =
    currentFlowIndex < 0 || totalFlowItems <= 0
      ? 0
      : ((currentFlowIndex + 1) / totalFlowItems) * 100;
  // Clamp to 0–100: demo jumps / the results phase can push the flow index
  // past the quiz length, which otherwise produced nonsensical values.
  const percentage = Math.min(100, Math.max(0, Math.round(rawPercentage)));
  const [displayedPercentage, setDisplayedPercentage] = useState(percentage);
  const [activeInsight, setActiveInsight] = useState<{ label: string; insight: string } | null>(null);
  const prevPercentageRef = useRef(percentage);
  const animFrameRef = useRef<number>(0);

  // Ticking percentage animation
  useEffect(() => {
    const from = prevPercentageRef.current;
    const to = percentage;
    prevPercentageRef.current = to;
    if (from === to) return;

    // A hidden tab (backgrounded window, or a browser-automation capture
    // that isn't the foreground tab) never fires requestAnimationFrame, which
    // would otherwise leave the badge stuck at a stale percentage forever.
    // Snap straight to the target — there's nothing being painted to animate
    // for anyway. Deferred via setTimeout (not called synchronously here) to
    // avoid the cascading-render lint rule on effect bodies.
    if (typeof document !== 'undefined' && document.hidden) {
      const id = window.setTimeout(() => setDisplayedPercentage(to), 0);
      return () => window.clearTimeout(id);
    }

    const startTime = performance.now();
    const duration = 400;
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedPercentage(Math.round(from + (to - from) * eased));
      if (progress < 1) animFrameRef.current = requestAnimationFrame(tick);
    };
    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [percentage]);

  useEffect(() => {
    const hit = milestones.find(
      (m) => m.atFlowIndex === currentFlowIndex && m.insight
    );
    if (!hit) return;

    const showId = setTimeout(() => {
      setActiveInsight({ label: hit.label, insight: hit.insight! });
    }, 0);
    const hideId = setTimeout(() => {
      setActiveInsight(null);
    }, 2400);

    return () => {
      clearTimeout(showId);
      clearTimeout(hideId);
    };
  }, [currentFlowIndex, milestones]);

  // Compute fill percentage for each segment
  const getSegmentFill = (i: number) => {
    const segStart = i === 0 ? 0 : milestones[i - 1].atFlowIndex;
    const segEnd = milestones[i].atFlowIndex;
    if (currentFlowIndex < 0) return 0;
    if (currentFlowIndex >= segEnd) return 100;
    if (currentFlowIndex < segStart) return 0;
    const segItems = segEnd - segStart;
    if (segItems === 0) return 100;
    return Math.round(((currentFlowIndex - segStart + 1) / (segItems + 1)) * 100);
  };

  // Find the active segment and compute pill position as a CSS calc() string.
  // Each segment is flex:1 inside a flex container with 6px gaps.
  // Segment i starts at: i * (segWidth + gap). Fill edge is at: segStart + segWidth * fill%.
  const getPillPosition = () => {
    if (currentFlowIndex < 0) return null;
    const n = milestones.length;
    const gap = 6; // px, matches the flex gap

    // Find which segment the current flow index falls in
    let activeIdx = 0;
    for (let i = 0; i < n; i++) {
      const segStart = i === 0 ? 0 : milestones[i - 1].atFlowIndex;
      if (currentFlowIndex >= segStart) activeIdx = i;
    }
    const fill = getSegmentFill(activeIdx);

    // CSS calc: each segment is (100% - totalGaps) / n wide
    // Segment i starts at: i * ((100% - totalGaps) / n + gap)
    // Fill edge within segment: fill% of segment width
    const totalGaps = (n - 1) * gap;
    return `calc(${activeIdx} * ((100% - ${totalGaps}px) / ${n} + ${gap}px) + (100% - ${totalGaps}px) / ${n} * ${fill / 100})`;
  };

  const pillPos = getPillPosition();
  const pillVisible = currentFlowIndex >= 0;

  const showInsight = !!activeInsight;

  return (
    <div
      className="flex-shrink-0"
      style={{ height: '90px', borderBottom: '1px solid #E5E5E8', position: 'relative', overflow: 'hidden' }}
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Quiz progress"
    >
      {/* Segmented progress bars — always visible */}
      <div style={{ padding: '30px 24px 0' }}>
        <div style={{ position: 'relative' }}>
          {/* Pill — positioned relative to bar track width */}
          {pillPos && (
            <div
              style={{
                position: 'absolute',
                top: '-22px',
                left: pillPos,
                transform: 'translateX(-50%)',
                transition: 'left 400ms ease-out, opacity 250ms ease',
                opacity: pillVisible ? 1 : 0,
                zIndex: 3,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  background: '#2E7D52',
                  color: 'white',
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 'var(--font-bold)',
                  padding: '3px 10px',
                  borderRadius: '99px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.3px',
                }}
              >
                {Math.min(100, Math.max(0, displayedPercentage))}%
              </div>
              <div
                style={{
                  width: '1px',
                  height: '3px',
                  background: 'rgba(46,125,82,0.4)',
                  margin: '0 auto',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '6px', height: '8px' }}>
            {milestones.map((milestone, i) => {
              const fill = getSegmentFill(i);
              return (
                <div
                  key={milestone.label}
                  style={{
                    flex: 1,
                    borderRadius: '3px',
                    background: '#E5E5E8',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${fill}%`,
                      background: '#2E7D52',
                      borderRadius: '3px',
                      transition: 'width 400ms ease-out',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Label row — cross-fades between phase labels and insight text */}
        <div style={{ position: 'relative', height: '34px', marginTop: '4px' }}>
          {/* Phase labels */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              opacity: showInsight ? 0 : 1,
              transition: 'opacity 300ms ease',
            }}
          >
            {milestones.map((milestone, i) => {
              const isCompleted = currentFlowIndex >= milestone.atFlowIndex;
              const isActive = !isCompleted && (i === 0 || currentFlowIndex >= milestones[i - 1].atFlowIndex);
              return (
                <span
                  key={milestone.label}
                  style={{
                    flex: 1,
                    fontSize: 'var(--text-2xs)',
                    fontWeight: isCompleted ? 'var(--font-semibold)' : 'var(--font-medium)',
                    color: isCompleted ? '#2E7D52' : isActive ? 'rgba(26,26,26,0.6)' : '#A1A1AA',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    transition: 'color 300ms ease',
                  }}
                >
                  {milestone.label}
                </span>
              );
            })}
          </div>

          {/* Insight text — green banner style */}
          <div
            aria-live="polite"
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px',
              overflow: 'hidden',
              background: '#2E7D52',
              borderRadius: '6px',
              padding: '0 10px',
              opacity: showInsight ? 1 : 0,
              transition: 'opacity 300ms ease',
            }}
          >
            {activeInsight && (
              <>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'white', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {activeInsight.label} Complete
                </span>
                <span
                  style={{
                    fontSize: 'var(--text-xs)',
                    color: 'rgba(255,255,255,0.75)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    minWidth: 0,
                  }}
                >
                  — {activeInsight.insight}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
