'use client';

import { TaskType } from '@/lib/types';

interface FlowHeaderProps {
  taskTitle: string;
  taskType: TaskType;
  onBack: () => void;
}

const badgeLabels: Record<TaskType, string> = {
  guided: 'Guided flow',
  quick: 'Quick task',
  offer: 'Offer',
};

export default function FlowHeader({ taskTitle, taskType, onBack }: FlowHeaderProps) {
  return (
    <div
      className="flex items-center gap-2 flex-shrink-0"
      style={{
        padding: '12px 20px',
        borderBottom: '1px solid var(--alpha-light-50)',
      }}
    >
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs cursor-pointer bg-transparent border-none"
        style={{
          color: 'var(--alpha-brand-950)',
          fontVariationSettings: "'wdth' 100",
        }}
      >
        &larr; Back to Plan
      </button>

      {/* Divider */}
      <span
        className="text-xs select-none"
        style={{ color: 'var(--alpha-light-200)' }}
      >
        |
      </span>

      {/* Task title */}
      <span
        className="truncate"
        style={{
          color: 'var(--alpha-light-900)',
          fontVariationSettings: "'wdth' 100",
          fontSize: 'var(--text-base)',
          fontWeight: 'var(--font-semibold)',
        }}
      >
        {taskTitle}
      </span>

      {/* Type badge */}
      <span
        className="rounded-full px-2 py-0.5 flex-shrink-0"
        style={{
          background: 'var(--alpha-light-50)',
          color: 'var(--alpha-brand-950)',
          fontVariationSettings: "'wdth' 100",
          fontSize: 'var(--text-xs)',
          fontWeight: 'var(--font-medium)',
        }}
      >
        {badgeLabels[taskType]}
      </span>
    </div>
  );
}
