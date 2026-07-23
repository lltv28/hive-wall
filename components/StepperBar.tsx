'use client';

interface StepperBarProps {
  totalSteps: number;
  currentStepIndex: number;
  completedCount: number;
}

function CheckIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      <path d="M2.5 6.5L5 9L9.5 3.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function StepperBar({ totalSteps, currentStepIndex, completedCount }: StepperBarProps) {
  return (
    <div
      className="flex-shrink-0"
      style={{ padding: '14px 24px 12px', borderBottom: '1px solid #E5E5E8' }}
    >
      <div className="flex items-center">
        {Array.from({ length: totalSteps }, (_, i) => {
          const isCompleted = i < completedCount;
          const isActive = i === currentStepIndex;
          const stepNumber = i + 1;

          const lineBefore = i > 0 && (
            <div
              key={`line-${i}`}
              style={{
                flex: 1,
                height: '2px',
                background: i <= completedCount && (isCompleted || isActive)
                  ? 'var(--alpha-brand-950)'
                  : '#E5E5E8',
                transition: 'background 500ms ease',
              }}
            />
          );

          const dot = (
            <div
              key={`dot-${i}`}
              className={isCompleted ? 'animate-scale-in' : ''}
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 300ms ease',
                ...(isCompleted
                  ? { background: 'var(--alpha-brand-950)' }
                  : isActive
                    ? {
                        border: '2px solid var(--alpha-brand-950)',
                        boxShadow: '0 0 0 3px rgba(46,125,82,0.12)',
                      }
                    : {
                        border: '2px solid #E5E5E8',
                        opacity: 0.5,
                      }),
              }}
            >
              {isCompleted ? (
                <CheckIcon />
              ) : (
                <span
                  style={{
                    fontSize: 'var(--text-2xs)',
                    fontWeight: 'var(--font-bold)',
                    color: isActive ? 'var(--alpha-brand-950)' : '#A1A1AA',
                  }}
                >
                  {stepNumber}
                </span>
              )}
            </div>
          );

          return [lineBefore, dot];
        })}
      </div>
    </div>
  );
}
