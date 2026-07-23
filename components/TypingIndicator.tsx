'use client';

import Image from 'next/image';
import { asset } from '@/lib/basePath';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 animate-fade-in-up">
      <Image
        src={asset('/profilepicnew.png')}
        alt="Lucas"
        width={36}
        height={36}
        className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
        style={{ boxShadow: 'var(--shadow-avatar)' }}
      />
      <span
        className="text-[var(--alpha-light-900)] font-medium"
        style={{ fontSize: 'var(--text-base)', fontWeight: 'var(--font-medium)', fontVariationSettings: "'wdth' 100" }}
      >
        Lucas is thinking
      </span>
      <div className="flex gap-1">
        <div className="w-[4px] h-[4px] rounded-full bg-[var(--alpha-light-600)] thinking-dot" />
        <div className="w-[4px] h-[4px] rounded-full bg-[var(--alpha-light-600)] thinking-dot" />
        <div className="w-[4px] h-[4px] rounded-full bg-[var(--alpha-light-600)] thinking-dot" />
      </div>
    </div>
  );
}
