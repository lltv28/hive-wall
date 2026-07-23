'use client';

import { useEffect, useRef } from 'react';
import {
  createVisualizerApp,
  type VisualizerApp,
  type VisualizerDependencies,
} from '@/lib/lattice/createVisualizerApp';

export function LatticeCanvas({
  onReady,
  dependencies,
}: {
  onReady: (app: VisualizerApp) => void;
  dependencies?: VisualizerDependencies;
}) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const onReadyRef = useRef(onReady);
  // Refs may not be written during render (react-hooks/refs), so the "latest
  // callback" sync happens in an effect instead. It still runs before the
  // mount effect below on the very first commit, and on every render after
  // that, keeping onReadyRef.current live without touching the mount
  // effect's dependency array.
  useEffect(() => {
    onReadyRef.current = onReady;
  });
  // Captured once so a caller passing an inline object literal cannot cause a
  // remount on every parent render.
  const dependenciesRef = useRef(dependencies);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    const app = createVisualizerApp(host, dependenciesRef.current);
    onReadyRef.current(app);
    return () => app.destroy();
  }, []);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
