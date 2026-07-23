'use client';

import { useEffect, useRef, useState } from 'react';
import type { VisualizerApp } from '@/lib/lattice/createVisualizerApp';
import { buildTourCycle, selectDrillNodes, type TourPhase, type TourStep } from '@/lib/lattice/tour';

export interface TourState {
  phase: TourPhase;
  nodeId: string | undefined;
  leadId: number | undefined;
  /**
   * The lead whose drill comes next, including across a cycle boundary. The
   * card preloads this into its idle iframe so the next drill opens on an
   * already-running funnel instead of a reload. Only set during 'wide' and
   * 'pullback' phases — undefined during 'drill', so a lead's funnel gets a
   * short head start rather than running unseen for its own entire drill.
   */
  nextLeadId: number | undefined;
}

/**
 * Walks the tour cycle on a timer, moving the lattice's focus as it goes.
 * A fresh set of drill leads is chosen for each cycle, so a long recording
 * does not repeat the same three nodes forever.
 */
export function useTourDriver(app: VisualizerApp | null): TourState {
  const [state, setState] = useState<TourState>({
    phase: 'wide',
    nodeId: undefined,
    leadId: undefined,
    nextLeadId: undefined,
  });
  const cycleRef = useRef(0);

  useEffect(() => {
    if (!app) return;

    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const runCycle = () => {
      const leads = app.getLeadNodes();
      // Can legitimately be empty: when canvas construction fails,
      // createVisualizerApp returns a stub whose getLeadNodes() yields [].
      // The cycle then degrades to a static wide view rather than throwing.
      const seed = cycleRef.current++;
      const steps: TourStep[] = buildTourCycle(selectDrillNodes(leads, seed));

      // Selection is deterministic on the seed, so the NEXT cycle's first
      // drill is knowable now. Without this the first drill after every wide
      // beat would open on an unloaded iframe, which is the exact flash the
      // two-slot pool exists to prevent.
      const nextCycleFirst = selectDrillNodes(leads, cycleRef.current)[0];
      const leadIdOf = (nodeId: string | undefined) =>
        nodeId ? leads.find((lead) => lead.id === nodeId)?.leadId : undefined;

      const upcomingLeadAfter = (index: number): number | undefined => {
        for (let i = index + 1; i < steps.length; i += 1) {
          if (steps[i]!.phase === 'drill') return leadIdOf(steps[i]!.nodeId);
        }
        return nextCycleFirst?.leadId;
      };

      const runStep = (index: number) => {
        if (cancelled) return;
        if (index >= steps.length) {
          runCycle();
          return;
        }

        const step = steps[index]!;

        app.focusNode(step.phase === 'drill' ? step.nodeId : undefined);
        setState({
          phase: step.phase,
          nodeId: step.nodeId,
          leadId: leadIdOf(step.nodeId),
          // Only preload during wide/pullback. Exposing this during a drill
          // itself would let the idle slot's funnel race to completion (and
          // loop back to its intro) long before that lead's own drill opens,
          // which is what produced a "Potential Complete" banner sitting on
          // a restarted intro screen on camera.
          nextLeadId: step.phase === 'drill' ? undefined : upcomingLeadAfter(index),
        });

        timer = setTimeout(() => runStep(index + 1), step.durationMs);
      };

      runStep(0);
    };

    runCycle();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [app]);

  return state;
}
