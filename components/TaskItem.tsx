'use client';

import { ActionTask } from '@/lib/types';

interface TaskItemProps {
  task: ActionTask;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

function CheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M2.5 6.5L5 9L9.5 3.5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M7 1.5L8.55 4.95L12.5 5.35L9.5 8.05L10.35 12L7 10.05L3.65 12L4.5 8.05L1.5 5.35L5.45 4.95L7 1.5Z"
        fill="#f59e0b"
        stroke="#f59e0b"
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function TaskItem({ task, index, isActive, onClick }: TaskItemProps) {
  const isCompleted = task.status === 'completed';
  const isLocked = task.status === 'locked';
  const isOffer = task.type === 'offer';
  // Completed task
  if (isCompleted) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg"
        style={{ padding: 10 }}
      >
        {/* Green check circle with scale-in animation */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 animate-scale-in"
          style={{ background: '#22c55e' }}
        >
          <CheckIcon />
        </div>
        <span
          className="text-sm line-through"
          style={{
            color: 'var(--alpha-light-400)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {task.title}
        </span>
      </div>
    );
  }

  // Offer task
  if (isOffer) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 rounded-lg w-full text-left cursor-pointer"
        style={{
          padding: 10,
          background: '#fffbeb',
          border: '1px solid #fde68a',
        }}
      >
        {/* Star icon in amber circle */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: '#fef3c7' }}
        >
          <StarIcon />
        </div>
        <div className="flex flex-col min-w-0">
          <span
            className="text-sm font-medium truncate"
            style={{
              color: '#92400e',
              fontVariationSettings: "'wdth' 100",
            }}
          >
            {task.title}
          </span>
          {task.subtitle && (
            <span
              className="text-[11px] truncate"
              style={{
                color: '#b45309',
                fontVariationSettings: "'wdth' 100",
              }}
            >
              {task.subtitle}
            </span>
          )}
        </div>
      </button>
    );
  }

  // Locked task
  if (isLocked) {
    return (
      <div
        className="flex items-center gap-2 rounded-lg"
        style={{ padding: 10, opacity: 0.5 }}
      >
        {/* Numbered circle — muted */}
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            border: '2px solid var(--alpha-light-100)',
          }}
        >
          <span
            className="text-[11px] font-semibold"
            style={{
              color: 'var(--alpha-light-300)',
              fontVariationSettings: "'wdth' 100",
            }}
          >
            {index}
          </span>
        </div>
        <span
          className="text-sm"
          style={{
            color: 'var(--alpha-light-400)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {task.title}
        </span>
      </div>
    );
  }

  // Active task
  const typeLabel =
    task.type === 'guided'
      ? `Guided flow${task.estimatedTime ? ` \u00b7 ~${task.estimatedTime}` : ''}`
      : 'Quick task';

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg w-full text-left cursor-pointer transition-colors"
      style={{
        padding: 10,
        background: isActive ? '#ffffff' : 'transparent',
        border: isActive ? '1px solid var(--alpha-light-100)' : '1px solid transparent',
      }}
    >
      {/* Numbered circle — branded */}
      <div
        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          border: '2px solid var(--alpha-brand-950)',
        }}
      >
        <span
          className="text-[11px] font-semibold"
          style={{
            color: 'var(--alpha-brand-950)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {index}
        </span>
      </div>
      <div className="flex flex-col min-w-0">
        <span
          className="text-sm font-medium truncate"
          style={{
            color: 'var(--alpha-light-900)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {task.title}
        </span>
        <span
          className="text-[11px] truncate"
          style={{
            color: 'var(--alpha-brand-950)',
            fontVariationSettings: "'wdth' 100",
          }}
        >
          {typeLabel}
        </span>
      </div>
    </button>
  );
}
