'use client';

interface CtaBlockProps {
  href: string;
  text?: string;
  subtext?: string;
}

export default function CtaBlock({
  href,
  text = 'Book Your Strategy Call',
  subtext = 'Free 30-min call \u00B7 No obligation',
}: CtaBlockProps) {
  return (
    <div>
      <a
        href={href}
        className="block w-full text-center cursor-pointer transition-all duration-200 hover:-translate-y-px active:scale-[0.98]"
        style={{
          background: 'var(--gradient-cta-active)',
          color: 'var(--alpha-dark-900)',
          padding: '10px 24px',
          borderRadius: '10px',
          fontWeight: 'var(--font-medium)',
          fontSize: 'var(--text-lg)',
          textDecoration: 'none',
        }}
      >
        {text}
      </a>
      {subtext && (
        <div
          style={{
            textAlign: 'center',
            fontSize: '12px',
            color: '#A1A1AA',
            marginTop: '8px',
          }}
        >
          {subtext}
        </div>
      )}
    </div>
  );
}
