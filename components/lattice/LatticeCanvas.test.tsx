import { render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LatticeCanvas } from './LatticeCanvas';
import { HIVE_ORB_COUNT } from '@/lib/lattice/generateHive';

// jsdom has no canvas implementation, so `new CanvasRenderer(canvas)` throws
// and createVisualizerApp falls back to its fatal-path stub, whose
// getLeadNodes() returns []. Injecting a stub renderer keeps the real code
// path alive so the graph is actually generated. This matches how every test
// in lib/lattice/createVisualizerApp.test.ts already works.
const stubDeps = () => ({ rendererFactory: () => ({ render: vi.fn(), resize: vi.fn() }) });

describe('LatticeCanvas', () => {
  it('mounts the visualizer once and hands it back through onReady', async () => {
    const onReady = vi.fn();
    const { unmount } = render(<LatticeCanvas onReady={onReady} dependencies={stubDeps()} />);

    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));

    const app = onReady.mock.calls[0]![0];
    expect(typeof app.focusNode).toBe('function');
    expect(app.getLeadNodes()).toHaveLength(HIVE_ORB_COUNT);

    unmount();
  });

  it('does not remount the visualizer when the parent re-renders', async () => {
    const onReady = vi.fn();
    const { rerender, unmount } = render(
      <LatticeCanvas onReady={onReady} dependencies={stubDeps()} />,
    );
    await waitFor(() => expect(onReady).toHaveBeenCalledTimes(1));

    // The stage re-renders on every live-tally tick; the canvas must survive.
    rerender(<LatticeCanvas onReady={vi.fn()} dependencies={stubDeps()} />);
    expect(onReady).toHaveBeenCalledTimes(1);

    unmount();
  });
});
