'use client';

import Image from 'next/image';
import { asset } from '@/lib/basePath';
import { DMessage } from '@/lib/types';
import StreamingText from './StreamingText';

interface MessageBubbleProps {
  message: DMessage;
  isNew: boolean;
  children?: React.ReactNode;
  onStreamingComplete?: () => void;
}

function formatText(text: string, cursor?: React.ReactNode) {
  const lines = text.split('\n');
  return lines.map((line, i) => {
    const isLast = i === lines.length - 1;
    const suffix = isLast ? cursor : null;

    if (line.startsWith('**') && line.endsWith('**')) {
      return (
        <p key={i} className="font-bold mt-3 mb-1" style={{ color: '#18181B' }}>
          {line.slice(2, -2)}{suffix}
        </p>
      );
    }
    if (line.startsWith('• ')) {
      return (
        <p key={i} className="ml-1">
          • {line.slice(2)}{suffix}
        </p>
      );
    }
    if (line === '') return isLast ? <p key={i}>{suffix}</p> : <br key={i} />;
    return <p key={i}>{line}{suffix}</p>;
  });
}

export default function MessageBubble({ message, isNew, children, onStreamingComplete }: MessageBubbleProps) {
  if (message.sender === 'user') {
    return (
      <div className={`flex justify-end ${isNew ? 'animate-fade-in-up' : ''}`}>
        <div
          className="max-w-[480px]"
          style={{
            background: 'rgba(255, 255, 255, 0.28)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            border: '1px solid var(--alpha-light-50)',
            borderRadius: '16px',
            padding: '20px',
          }}
        >
          <p
            className="whitespace-pre-wrap"
            style={{
              fontSize: 'var(--text-base)',
              fontWeight: 'var(--font-medium)',
              lineHeight: '20px',
              color: 'var(--alpha-light-900)',
            }}
          >
            {message.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex justify-start ${isNew ? 'animate-fade-in-up' : ''}`}>
      <div className="max-w-[600px]">
        <div className="flex items-start gap-3">
          <Image
            src={asset('/profilepicnew.png')}
            alt="Lucas"
            width={36}
            height={36}
            className="w-9 h-9 rounded-full flex-shrink-0 mt-0.5 object-cover"
            style={{ boxShadow: 'var(--shadow-avatar)' }}
          />
          <div className="flex flex-col gap-1">
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 'var(--font-semibold)', color: 'var(--alpha-light-900)' }}>
              Lucas - Kodara CEO
            </span>
            <div className="flex flex-col gap-2">
              {message.content && (
                <StreamingText
                  text={message.content}
                  speed={60}
                  onComplete={onStreamingComplete}
                >
                  {(visibleText, isStreaming) => (
                    <div>
                      <div
                        className="whitespace-pre-wrap"
                        style={{
                          fontSize: 'var(--text-base)',
                          fontWeight: 'var(--font-normal)',
                          lineHeight: 'var(--leading-loose)',
                          color: 'var(--alpha-light-900)',
                        }}
                      >
                        {formatText(
                          visibleText,
                          isStreaming ? (
                            <span
                              key="cursor"
                              className="inline-block align-middle"
                              style={{
                                width: '2px',
                                height: '14px',
                                background: '#2E7D52',
                                marginLeft: '1px',
                                animation: 'pulse-dot 0.8s infinite',
                              }}
                            />
                          ) : null,
                        )}
                      </div>
                      {!isStreaming && message.subtitle && (
                        <p
                          className="text-xs leading-5 mt-1 animate-fade-in"
                          style={{
                            fontSize: 'var(--text-xs)',
                            color: '#A1A1AA',
                            fontVariationSettings: "'wdth' 100",
                          }}
                        >
                          {message.subtitle}
                        </p>
                      )}
                    </div>
                  )}
                </StreamingText>
              )}
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
