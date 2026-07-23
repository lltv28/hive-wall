'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScoreboardRail } from '@/components/rail/ScoreboardRail';
import { CARD_SIZE, QuizCard } from '@/components/lattice/QuizCard';
import { useTourDriver } from '@/components/lattice/useTourDriver';
import {
  BASE_CALLS,
  BASE_PURCHASES,
  BASE_REVENUE,
  STAGE_H,
  STAGE_W,
  UPSELL_PCT,
  useCountUp,
  useFitStage,
  useLiveTally,
  useRealTileOutcomes,
  useRecordingChrome,
  type FeedEvent,
} from '@/lib/adStage';
import type { VisualizerApp } from '@/lib/lattice/createVisualizerApp';
import { buildLeadIdentities } from '@/lib/lattice/leads';

const LatticeCanvas = dynamic(
  () => import('@/components/lattice/LatticeCanvas').then((m) => m.LatticeCanvas),
  { ssr: false },
);

const PAD = 40;
// 360, not 300. The three stat tiles (PURCHASES / CALLS / UPSELL %) have an
// intrinsic minimum width of 346px together, measured in the browser. At 300
// they overflowed the rail by 46px and the wheel column's background painted
// over the spill, slicing the UPSELL % tile vertically.
//
// Widening the rail is free here: WHEEL_W becomes 1440, and the wheel radius
// is 0.42 * min(WHEEL_W, WHEEL_H) with WHEEL_H = 1000, so the wheel stays
// height-constrained at 420px and does not change size.
const RAIL_W = 360;
const COL_GAP = 40;

// The wheel column's own size. The stage is a fixed 1920x1080 with fixed
// padding, so this is a constant rather than something to measure. Card
// placement works in this space, because getFocusScreenPosition() returns
// canvas-relative coordinates and the canvas fills this column.
const WHEEL_W = STAGE_W - PAD * 2 - RAIL_W - COL_GAP; // 1440
const WHEEL_H = STAGE_H - PAD * 2; // 1000
const CARD_MARGIN = 16;

// Ambient feed lead numbers must not collide with real lead numbers.
// Real leads are Lead 101..196 (see lib/lattice/leads.ts). useLiveTally
// otherwise defaults its numbering to basePurchases + baseCalls + 80, which
// lands at 160 and climbs straight through the real range — the rail would
// report "Lead 160 bought" for a synthetic event while the wheel drills a
// genuinely different Lead 160.
const AMBIENT_FIRST_LEAD_NO = 200;

// Beat between the lattice reacting to a focus (pan, cluster lighting) and
// the quiz card opening, so the two do not land at the same instant. This
// eats into the card's visible time within a drill — DRILL_MS in
// lib/lattice/tour.ts is 18s, so raising this delay shortens how long the
// card is shown before the drill ends; if it were ever raised to or past
// DRILL_MS, the card would never appear at all.
const CARD_OPEN_DELAY_MS = 2_000;

export default function LatticePage() {
  const fit = useFitStage();
  useRecordingChrome('#eef1f5');
  const { tally, feed } = useLiveTally({
    baseRevenue: BASE_REVENUE,
    basePurchases: BASE_PURCHASES,
    baseCalls: BASE_CALLS,
    feedStartLeadNo: AMBIENT_FIRST_LEAD_NO,
  });

  const [app, setApp] = useState<VisualizerApp | null>(null);
  const handleReady = useCallback((ready: VisualizerApp) => setApp(ready), []);

  const tour = useTourDriver(app);
  const shownRevenue = useCountUp(tally.revenue);
  useEffect(() => {
    app?.setBrainRevenue(shownRevenue);
  }, [app, shownRevenue]);
  const outcomes = useRealTileOutcomes();
  const identities = useMemo(() => buildLeadIdentities(), []);

  // COORDINATE SPACE — the single easiest thing to get wrong here.
  //
  // `getFocusScreenPosition()` returns CANVAS-relative coordinates (0..canvas
  // width, 0..canvas height), and QuizCard is absolutely positioned inside the
  // wheel <section>, which the canvas fills. So bounds must ALSO be
  // section-relative, starting at 0 — NOT stage-absolute. Using stage-absolute
  // bounds here pushes the card off by the rail's width and clamps it against
  // the wrong edge.
  //
  // The stage is a fixed 1920x1080 with fixed padding, so the wheel column's
  // size is a constant, not something to measure.
  //
  // On a drill, the wheel pans aside (see asideCamera in CanvasRenderer) so
  // one side of the column is left clear of every node, lit or dimmed. bounds
  // must shrink to exactly that clear slot — not the whole column — or
  // placeCard's clamp would happily put the card back on top of the wheel.
  // getFocusSide() picks which side mirrors CanvasRenderer's own pan choice.
  const focusSide = app?.getFocusSide();
  // The card and connector are driven by whichever node is actually FOCUSED
  // (tour-driven or click-driven), not by tour state — a click moves the
  // focus without moving the tour, and the two must not disagree. Defined
  // only when the focused node is a lead (ring === "avatar"); undefined for
  // a focused hub or nothing focused at all, which is what hides the card.
  const focusedLeadId = app?.getFocusedLeadId();

  // The card must hide immediately when focus changes — to a different lead
  // or to none — but only become visible again after CARD_OPEN_DELAY_MS of
  // the SAME lead staying focused. One piece of state, so "which lead this
  // gate reflects" and "is it open" can never disagree. Resetting visible to
  // false the instant focusedLeadId changes is a synchronous update, which
  // react-hooks/set-state-in-effect forbids inside an effect body — so it's
  // done here during render instead, the same "adjusting state during
  // render" pattern QuizCard's iframe pool uses (components/lattice/QuizCard.tsx).
  const [cardGate, setCardGate] = useState<{ leadId: number | undefined; visible: boolean }>({
    leadId: undefined,
    visible: false,
  });
  if (cardGate.leadId !== focusedLeadId) {
    setCardGate({ leadId: focusedLeadId, visible: false });
  }

  // The delayed open itself. Setting visible = true here happens inside a
  // setTimeout callback, so it's asynchronous and fine inside an effect.
  // Cleanup clears the timer whenever focusedLeadId changes (including to
  // undefined) or the component unmounts, so a stale timer can never pop the
  // card open for a lead that is no longer focused.
  useEffect(() => {
    if (focusedLeadId === undefined) return;
    const timer = setTimeout(() => {
      setCardGate((prev) => ({ ...prev, visible: true }));
    }, CARD_OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [focusedLeadId]);

  const bounds = useMemo(() => {
    if (focusSide === 'left') {
      return {
        left: CARD_MARGIN,
        top: CARD_MARGIN,
        right: CARD_MARGIN + CARD_SIZE.width,
        bottom: WHEEL_H - CARD_MARGIN,
      };
    }
    return {
      left: WHEEL_W - CARD_MARGIN - CARD_SIZE.width,
      top: CARD_MARGIN,
      right: WHEEL_W - CARD_MARGIN,
      bottom: WHEEL_H - CARD_MARGIN,
    };
  }, [focusSide]);

  // A real funnel outcome for the lead currently on screen does two things:
  // flips its node to closed, and pushes a REAL line into the conversions
  // feed. Ambient rail numbers stay on useLiveTally representing the other 95
  // leads; this is the only line whose value came from the funnel itself.
  const [realFeed, setRealFeed] = useState<FeedEvent[]>([]);
  const seenRef = useRef<Set<number>>(new Set());
  const realKeyRef = useRef(1_000_000); // above useLiveTally's key space

  useEffect(() => {
    if (!app || focusedLeadId === undefined) return;
    const outcome = outcomes[focusedLeadId];
    if (!outcome || seenRef.current.has(focusedLeadId)) return;
    seenRef.current.add(focusedLeadId);

    // Whichever lead is actually on screen, not necessarily the tour's own
    // lead — a click can focus a different one than the tour last drilled.
    const node = app.getLeadNodes().find((lead) => lead.leadId === focusedLeadId);
    if (node) app.markClosed(node.id);

    const identity = identities.find((lead) => lead.id === focusedLeadId);
    if (!identity) return;
    setRealFeed((prev) =>
      [
        {
          key: realKeyRef.current++,
          leadNo: identity.leadNo,
          outcome: outcome.outcome,
          valueUsd: outcome.valueUsd,
        },
        ...prev,
      ].slice(0, 4),
    );
  }, [app, outcomes, focusedLeadId, identities]);

  // Real lines sit on top, ambient lines fill the rest, capped at the rail's
  // visible row count.
  const mergedFeed = useMemo(() => [...realFeed, ...feed].slice(0, 9), [realFeed, feed]);

  // Sampling getFocusScreenPosition() once during render (as this used to)
  // only catches the camera wherever it happens to be at the moment React
  // re-renders — usually still easing toward the drill's panned composition,
  // sometimes not even that (a click moves the camera with no React
  // re-render at all). Track it continuously instead via rAF while a lead is
  // focused, so the connector always matches the camera's current, not
  // stale, position. Only setState past a small deadband so React does not
  // re-render every single frame once the camera has settled.
  const [nodePosition, setNodePosition] = useState<{ x: number; y: number } | undefined>(
    undefined,
  );
  useEffect(() => {
    if (!app || focusedLeadId === undefined) return;

    let frameId: number;
    const tick = () => {
      const next = app.getFocusScreenPosition();
      setNodePosition((prev) => {
        if (
          prev &&
          next &&
          Math.abs(prev.x - next.x) < 0.5 &&
          Math.abs(prev.y - next.y) < 0.5
        ) {
          return prev;
        }
        return next;
      });
      frameId = requestAnimationFrame(tick);
    };
    frameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameId);
  }, [app, focusedLeadId]);

  return (
    <main
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${STAGE_W}px`,
          height: `${STAGE_H}px`,
          transform: `scale(${fit})`,
          transformOrigin: 'center center',
          flexShrink: 0,
          padding: `${PAD}px`,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'row',
          gap: `${COL_GAP}px`,
          background: 'linear-gradient(160deg, #ffffff 0%, #f1f5f9 100%)',
          position: 'relative',
        }}
      >
        <ScoreboardRail
          revenue={tally.revenue}
          purchases={tally.purchases}
          calls={tally.calls}
          upsellPct={UPSELL_PCT}
          feed={mergedFeed}
          width={RAIL_W}
        />

        <section style={{ flex: 1, position: 'relative' }}>
          <LatticeCanvas onReady={handleReady} />

          <QuizCard
            leadId={focusedLeadId}
            nextLeadId={tour.nextLeadId}
            nodePosition={nodePosition}
            bounds={bounds}
            visible={cardGate.visible}
          />
        </section>
      </div>
    </main>
  );
}
