'use client';

interface FitScoreProps {
  percentage: number;
  message: string;
  cta: string;
  onCtaClick: () => void;
}

export default function FitScore({ percentage, message, cta, onCtaClick }: FitScoreProps) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="rounded-2xl p-6 text-center animate-fade-in-up"
      style={{
        background: '#ffffff',
        border: '1px solid var(--alpha-light-100)',
      }}
    >
      {/* Circular progress */}
      <div className="relative w-40 h-40 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="var(--alpha-light-100)"
            strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r="54"
            fill="none"
            stroke="var(--alpha-brand-950)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className=""
            style={{ color: 'var(--alpha-brand-950)', fontVariationSettings: "'wdth' 100", fontSize: 'var(--text-xl)', fontWeight: 'var(--font-semibold)' }}
          >
            {percentage}%
          </span>
        </div>
      </div>

      <p
        className="uppercase tracking-wider mb-2"
        style={{ color: 'var(--alpha-brand-950)', fontVariationSettings: "'wdth' 100", fontSize: 'var(--text-xs)', fontWeight: 'var(--font-medium)' }}
      >
        AI Product Readiness Score
      </p>

      <p
        className="mb-4"
        style={{ color: 'var(--alpha-light-600)', fontVariationSettings: "'wdth' 100", fontSize: 'var(--text-base)' }}
      >
        {message}
      </p>

      <button
        type="button"
        onClick={onCtaClick}
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
        {cta}
      </button>
    </div>
  );
}
