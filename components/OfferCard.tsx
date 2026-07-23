'use client';

interface OfferCardProps {
  title: string;
  description: string;
  cta: string;
  price?: string;
  variant?: 'amber' | 'green';
  onCtaClick?: () => void;
}

const variantStyles = {
  amber: {
    background: 'linear-gradient(135deg, #fffbeb, #fef3c7)',
    border: '1px solid #fcd34d',
    titleColor: '#92400e',
    ctaBg: '#f59e0b',
    ctaHoverBg: '#d97706',
    ctaText: '#ffffff',
  },
  green: {
    background: '#ffffff',
    border: '1px solid var(--alpha-light-100)',
    titleColor: '#166534',
    ctaBg: '#22c55e',
    ctaHoverBg: '#16a34a',
    ctaText: '#ffffff',
  },
};

export default function OfferCard({
  title,
  description,
  cta,
  price,
  variant = 'amber',
  onCtaClick,
}: OfferCardProps) {
  const styles = variantStyles[variant];

  return (
    <div
      className="rounded-xl p-4"
      style={{
        maxWidth: 360,
        background: styles.background,
        border: styles.border,
      }}
    >
      <h4
        className="mb-1"
        style={{
          color: styles.titleColor,
          fontVariationSettings: "'wdth' 100",
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-bold)',
        }}
      >
        {title}
      </h4>
      <p
        className="mb-3"
        style={{
          color: 'var(--alpha-light-500)',
          fontVariationSettings: "'wdth' 100",
          fontSize: 'var(--text-xs)',
        }}
      >
        {description}
      </p>
      {price && (
        <p
          className="mb-3"
          style={{
            color: styles.titleColor,
            fontVariationSettings: "'wdth' 100",
            fontSize: 'var(--text-xl)',
            fontWeight: 'var(--font-bold)',
          }}
        >
          {price}
        </p>
      )}
      <button
        type="button"
        onClick={onCtaClick}
        className="w-full rounded-full transition-colors"
        style={{
          background: styles.ctaBg,
          color: styles.ctaText,
          padding: '10px 24px',
          fontSize: 'var(--text-lg)',
          fontWeight: 'var(--font-semibold)',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = styles.ctaHoverBg;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = styles.ctaBg;
        }}
      >
        {cta}
      </button>
    </div>
  );
}
