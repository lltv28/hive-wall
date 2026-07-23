'use client';

import { isDemoAutoplay } from '@/lib/demoMode';
import { asset } from '@/lib/basePath';

interface VideoEmbedProps {
  src: string;
  title: string;
  duration: string;
}

export default function VideoEmbed({ src, title, duration }: VideoEmbedProps) {
  const demo = isDemoAutoplay();
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ maxWidth: 280, background: '#111' }}
    >
      <div className="relative" style={{ aspectRatio: '16/9' }}>
        <video
          className="w-full h-full object-cover"
          src={asset(src)}
          preload={demo ? 'auto' : 'metadata'}
          controls={!demo}
          autoPlay={demo}
          muted={demo}
          loop={demo}
          playsInline
        />
      </div>
      <div className="px-3 py-2 flex items-center justify-between">
        <span
          className="text-white/60 truncate"
          style={{ fontVariationSettings: "'wdth' 100", fontSize: 'var(--text-xs)' }}
        >
          {title}
        </span>
        <span
          className="text-white/40 flex-shrink-0 ml-2"
          style={{ fontVariationSettings: "'wdth' 100", fontSize: 'var(--text-xs)' }}
        >
          {duration}
        </span>
      </div>
    </div>
  );
}
