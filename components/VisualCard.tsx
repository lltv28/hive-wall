'use client';

interface VisualCardProps {
  icon: string;
  title: string;
  items: { label: string; value: string }[];
}

export default function VisualCard({ icon, title, items }: VisualCardProps) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        maxWidth: 320,
        background: '#ffffff',
        border: '1px solid var(--alpha-light-100)',
      }}
    >
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--alpha-light-100)' }}
      >
        <span className="text-base">{icon}</span>
        <span
          style={{
            color: 'var(--alpha-light-900)',
            fontVariationSettings: "'wdth' 100",
            fontSize: 'var(--text-base)',
            fontWeight: 'var(--font-semibold)',
          }}
        >
          {title}
        </span>
      </div>
      <div className="px-4 py-3 flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-baseline justify-between gap-3">
            <span
              className="flex-shrink-0"
              style={{
                color: 'var(--alpha-light-500)',
                fontVariationSettings: "'wdth' 100",
                fontSize: 'var(--text-xs)',
              }}
            >
              {item.label}
            </span>
            <span
              className="text-right"
              style={{
                color: 'var(--alpha-light-900)',
                fontVariationSettings: "'wdth' 100",
                fontSize: 'var(--text-base)',
                fontWeight: 'var(--font-medium)',
              }}
            >
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
