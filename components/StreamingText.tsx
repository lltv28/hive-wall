'use client';

import { useState, useEffect, useRef } from 'react';

interface StreamingTextProps {
  text: string;
  speed?: number; // chars per second
  onComplete?: () => void;
  children: (visibleText: string, isStreaming: boolean) => React.ReactNode;
}

export default function StreamingText({ text, speed = 80, onComplete, children }: StreamingTextProps) {
  const [count, setCount] = useState(0);
  const startRef = useRef(0);
  const frameRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    startRef.current = performance.now();
    const resetFrame = requestAnimationFrame(() => setCount(0));
    let completed = false;

    const tick = () => {
      const elapsed = performance.now() - startRef.current;
      const chars = Math.min(Math.floor((elapsed * speed) / 1000), text.length);
      setCount(chars);
      if (chars < text.length) {
        frameRef.current = requestAnimationFrame(tick);
      } else if (!completed) {
        completed = true;
        onCompleteRef.current?.();
      }
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(resetFrame);
      cancelAnimationFrame(frameRef.current);
    };
  }, [text, speed]);

  return <>{children(text.slice(0, count), count < text.length)}</>;
}
