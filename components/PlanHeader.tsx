'use client';

interface PlanHeaderProps {
  title: string;
  subtitle: string;
  completedCount: number;
  totalCount: number;
}

export default function PlanHeader({ title, subtitle, completedCount, totalCount }: PlanHeaderProps) {
  const pct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div className="flex flex-col gap-2">
      <div>
        <h2
          className="text-[15px] font-semibold leading-tight"
          style={{
            color: 'var(--alpha-light-900)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {title}
        </h2>
        <p
          className="text-[11px] mt-0.5"
          style={{
            color: 'var(--alpha-light-500)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {subtitle}
        </p>
      </div>

      {/* Progress bar */}
      <div>
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 4, background: 'var(--alpha-light-100)' }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'var(--alpha-brand-950)',
              transition: 'width 500ms ease',
            }}
          />
        </div>
        <p
          className="text-[10px] mt-1"
          style={{
            color: 'var(--alpha-light-400)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {completedCount} of {totalCount} complete
        </p>
      </div>
    </div>
  );
}
