'use client';

import { useState } from 'react';
import SectionCard from './SectionCard';

interface ActionPlanCardProps {
  productName: string;
}

type ItemState = 'done' | 'next' | 'pending' | 'locked';

interface CheckItem {
  text: string;
  state: ItemState;
}

interface Week {
  title: string;
  locked: boolean;
  items: CheckItem[];
}

function getWeeks(productName: string): Week[] {
  return [
    {
      title: 'Strategy & Discovery',
      locked: false,
      items: [
        { text: 'Complete AI readiness assessment', state: 'done' },
        { text: 'Book your strategy call', state: 'next' },
        { text: 'Map your sales process with our team', state: 'pending' },
        { text: `Define your ${productName} spec`, state: 'pending' },
      ],
    },
    {
      title: 'Content & Training Data',
      locked: true,
      items: [
        { text: 'Gather your training materials & SOPs', state: 'pending' },
        { text: 'Record your methodology walkthrough', state: 'pending' },
        { text: 'Review AI training data with our team', state: 'pending' },
        { text: 'Approve content for AI ingestion', state: 'pending' },
      ],
    },
    {
      title: `Build Your ${productName}`,
      locked: true,
      items: [
        { text: 'Configure AI personality and voice', state: 'locked' },
        { text: 'Train on objection handling scripts', state: 'locked' },
        { text: 'Test and refine AI conversations', state: 'locked' },
      ],
    },
    {
      title: 'Launch & Scale',
      locked: true,
      items: [
        { text: 'Deploy AI product to production', state: 'locked' },
        { text: 'Monitor first-week performance metrics', state: 'locked' },
        { text: 'Optimize conversion and scale traffic', state: 'locked' },
      ],
    },
  ];
}

function CheckBox({ state }: { state: ItemState }) {
  const size = 16;
  const radius = 4;

  if (state === 'done') {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: '#2E7D52',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <svg width="8" height="8" viewBox="0 0 16 16" fill="none">
          <path d="M4 8l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  const borderColor =
    state === 'next' ? '#2E7D52' :
    state === 'pending' ? '#d4d4d8' :
    '#e5e5e8';

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        border: `2px solid ${borderColor}`,
        flexShrink: 0,
        marginTop: 1,
      }}
    />
  );
}

function CheckItemRow({ item }: { item: CheckItem }) {
  const textStyle: React.CSSProperties =
    item.state === 'done'
      ? { color: '#a1a1aa', textDecoration: 'line-through' }
      : item.state === 'next'
      ? { color: '#18181b', fontWeight: 'var(--font-medium)' as string }
      : item.state === 'pending'
      ? { color: '#71717a' }
      : { color: '#a1a1aa', filter: 'blur(4px)', userSelect: 'none' as const };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: 'var(--text-xs)', lineHeight: 1.4 }}>
      <CheckBox state={item.state} />
      <span style={textStyle}>{item.text}</span>
    </div>
  );
}

export default function ActionPlanCard({ productName }: ActionPlanCardProps) {
  const [expandedWeek, setExpandedWeek] = useState(0);
  const weeks = getWeeks(productName);

  const toggleWeek = (i: number) => {
    setExpandedWeek(expandedWeek === i ? -1 : i);
  };

  return (
    <SectionCard label="Your 30-Day Launch Plan" icon={'\uD83D\uDCCB'}>
      {/* Progress bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '14px' }}>
        <div style={{ flex: 1, height: '4px', background: '#e5e5e8', borderRadius: '2px', overflow: 'hidden' }}>
          <div style={{ width: '25%', height: '100%', background: '#2E7D52', borderRadius: '2px' }} />
        </div>
        <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 'var(--font-medium)', flexShrink: 0 }}>1 of 4 weeks</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {weeks.map((week, i) => {
          const isExpanded = expandedWeek === i;
          const isFirst = i === 0;

          // Week 1 expanded: green border card with checklist
          if (isExpanded && !week.locked) {
            return (
              <div
                key={i}
                style={{
                  background: isFirst ? '#f8faf9' : '#fff',
                  border: isFirst ? '1px solid #2E7D52' : '1px solid #e5e5e8',
                  borderRadius: '10px',
                  padding: '14px',
                }}
              >
                {/* Header row */}
                <button
                  type="button"
                  onClick={() => toggleWeek(i)}
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: isFirst ? '#2E7D52' : '#f4f4f5',
                      color: isFirst ? 'white' : '#a1a1aa',
                      fontSize: '11px',
                      fontWeight: 'var(--font-semibold)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-2xs)', color: isFirst ? '#2E7D52' : '#a1a1aa', fontWeight: 'var(--font-semibold)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      {isFirst ? 'Week 1 \u2014 Start Here' : `Week ${i + 1}`}
                    </div>
                    <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#18181b', marginTop: '2px' }}>
                      {week.title}
                    </div>
                  </div>
                </button>

                {/* Sub-checklist */}
                <div style={{ marginTop: '12px', marginLeft: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {week.items.map((item, j) => (
                    <CheckItemRow key={j} item={item} />
                  ))}
                </div>
              </div>
            );
          }

          // Collapsed unlocked week: single row with task count + chevron
          if (!week.locked && !isExpanded) {
            return (
              <button
                key={i}
                type="button"
                onClick={() => toggleWeek(i)}
                style={{
                  background: 'white',
                  border: '1px solid #e5e5e8',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: '#f4f4f5',
                    color: '#a1a1aa',
                    fontSize: '11px',
                    fontWeight: 'var(--font-semibold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', fontWeight: 'var(--font-semibold)', color: '#18181b' }}>{week.title}</div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>{week.items.length} tasks</div>
                </div>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="#a1a1aa"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M6 4l4 4-4 4" />
                </svg>
              </button>
            );
          }

          // Locked week: faded with lock icon + task count
          return (
            <div
              key={i}
              style={{
                background: 'white',
                border: '1px solid #e5e5e8',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                gap: '12px',
                alignItems: 'center',
                opacity: 0.45,
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#f4f4f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="#a1a1aa">
                  <path d="M12 7H4V5a4 4 0 118 0v2zm-6 0h4V5a2 2 0 10-4 0v2zm-3 1h10a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1z" />
                </svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 'var(--text-xs)', fontWeight: 'var(--font-semibold)', color: '#71717a' }}>{week.title}</div>
                <div style={{ fontSize: '12px', color: '#a1a1aa', marginTop: '2px' }}>{week.items.length} tasks</div>
              </div>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
