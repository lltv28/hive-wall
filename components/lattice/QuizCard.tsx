'use client';

import { useState } from 'react';
import { C, R, buildFunnelSrc } from '@/lib/adStage';
import { placeCard, type Bounds } from '@/lib/lattice/cardPlacement';
import { buildLeadIdentities } from '@/lib/lattice/leads';

export const CARD_SIZE = { width: 420, height: 560 };

// The Hive stage is DARK, so the connector is a soft green-white line with a
// faint green glow (a wider low-alpha line drawn behind the crisp one). The old
// low-alpha dark ink was tuned for lattice-wall's light background and vanished
// on this dark stage. It reads as the "magnifier" link from the orb to the card.
const CONNECTOR_COLOR = 'rgba(190, 255, 215, 0.7)';
const CONNECTOR_GLOW = 'rgba(74, 222, 128, 0.3)';
const CONNECTOR_DOT_RADIUS = 4;
// The line + its dot start at the focused orb's EDGE, not its centre, so the
// connector never paints in front of the orb. The orb lives on the opaque
// canvas below this SVG, so it can't be layered behind via z-index — offsetting
// the start clear of the orb is the equivalent. ~18px = the orb's screen radius
// (ORB_RADIUS_PX at the drill camera's scale of 1).
const CONNECTOR_ORB_CLEARANCE = 18;

const IDENTITIES = buildLeadIdentities();
// speed: 3. Nearly every step of the quiz flow gates on waitingForInput, so
// total run time is dominated by this speed-scaled auto-answer delay (see
// lib/useChatFlow.ts + components/OnboardingChat.tsx), on top of a fixed
// ~10.7s "Building your report" checklist (components/GeneratingChecklist.tsx)
// that speed cannot touch at all.
//
// 3 is also the CEILING: demoSpeed is clamped to { min: 0.25, max: 3 } at
// OnboardingChat.tsx:97 and PlanFlow.tsx:133, so any larger value here is
// silently ignored. An earlier version of this comment claimed 6 "raced the
// funnel to completion" — it never did, because 6 was never in effect.
//
// This value has NOT been tuned against a real visible browser. Automated
// capture cannot measure it: the progress badge and auto-scroll are
// requestAnimationFrame-driven, so headless and background tabs render a
// frozen intro screen no matter how far the quiz has actually advanced. Tune
// this by watching a drill in a focused window, not from a screenshot.
const FUNNEL_OPTS = { count: 8, demoScale: 0.62, speed: 3 };

/**
 * Two iframes are kept mounted and cross-faded. Mounting a fresh iframe per
 * drill would show a visible reload flash on camera, so the inactive slot
 * preloads the next lead's funnel while the wide and pullback beats play.
 */
export function QuizCard({
  leadId,
  nextLeadId,
  nodePosition,
  bounds,
  visible,
}: {
  leadId: number | undefined;
  nextLeadId: number | undefined;
  nodePosition: { x: number; y: number } | undefined;
  bounds: Bounds;
  visible: boolean;
}) {
  // One piece of state, so the active slot, what each slot holds, and the
  // props that produced them can never disagree. `slots[i]` is the lead each
  // iframe currently has loaded; `leadId`/`nextLeadId` are the props that
  // last drove it, so a prop change can be detected during render instead of
  // in an effect (React's sanctioned "adjusting state during render"
  // pattern — see https://react.dev/learn/you-might-not-need-an-effect).
  const [pool, setPool] = useState<{
    slots: [number | undefined, number | undefined];
    active: number;
    leadId: number | undefined;
    nextLeadId: number | undefined;
  }>({ slots: [undefined, undefined], active: 0, leadId: undefined, nextLeadId: undefined });

  if (pool.leadId !== leadId || pool.nextLeadId !== nextLeadId) {
    const slots: [number | undefined, number | undefined] = [pool.slots[0], pool.slots[1]];
    let active = pool.active;

    // Show the current lead. If the idle slot preloaded it during the last
    // wide/pullback beat, this is a pure swap with nothing to fetch.
    if (leadId !== undefined && slots[active] !== leadId) {
      const other = active === 0 ? 1 : 0;
      if (slots[other] !== leadId) slots[other] = leadId;
      active = other;
    }

    // Park the UPCOMING lead in whichever slot is now idle, so its funnel is
    // already running by the time the next drill starts. This is the whole
    // point of a two-iframe pool; without it the pool buys nothing and every
    // drill opens on a visible reload.
    const idle = active === 0 ? 1 : 0;
    if (nextLeadId !== undefined && nextLeadId !== leadId && slots[idle] !== nextLeadId) {
      slots[idle] = nextLeadId;
    }

    setPool({ slots, active, leadId, nextLeadId });
  }

  const { slots, active } = pool;

  const anchor = nodePosition ?? { x: (bounds.left + bounds.right) / 2, y: (bounds.top + bounds.bottom) / 2 };
  const placement = placeCard(anchor, CARD_SIZE, bounds);

  // The connector runs from the focused orb to whichever card edge actually
  // faces the wheel — the left edge when the card sits on the right (side:
  // "right"), the right edge when it sits on the left. It lands at the
  // orb's own height rather than the edge's midpoint, so it doesn't read as
  // disconnected when the orb sits well above or below the card's center;
  // clamped so it can't land past either corner.
  const cardEdgeX = placement.side === 'right' ? placement.x : placement.x + CARD_SIZE.width;
  const cardEdgeY = nodePosition
    ? Math.min(
        Math.max(nodePosition.y, placement.y + 28),
        placement.y + CARD_SIZE.height - 28,
      )
    : placement.y + CARD_SIZE.height / 2;

  // Start the connector at the orb's edge (offset toward the card) rather than
  // its centre, so the line and its dot sit just outside the focused orb instead
  // of painting over it.
  const connectorStart = nodePosition
    ? (() => {
        const dx = cardEdgeX - nodePosition.x;
        const dy = cardEdgeY - nodePosition.y;
        const len = Math.hypot(dx, dy) || 1;
        return {
          x: nodePosition.x + (dx / len) * CONNECTOR_ORB_CLEARANCE,
          y: nodePosition.y + (dy / len) * CONNECTOR_ORB_CLEARANCE,
        };
      })()
    : undefined;

  return (
    <>
      {/* The card is kept as the first child (z-index alone controls the
          stacking, not DOM order) so it stays container.firstElementChild —
          existing QuizCard tests read the card's inline style straight off
          that reference. */}
      <div
        style={{
          position: 'absolute',
          left: `${placement.x}px`,
          top: `${placement.y}px`,
          width: `${CARD_SIZE.width}px`,
          height: `${CARD_SIZE.height}px`,
          borderRadius: R.lg,
          overflow: 'hidden',
          background: C.card,
          border: `1px solid ${C.border}`,
          boxShadow: C.cardShadow,
          opacity: visible ? 1 : 0,
          // Position (left/top) only ever changes between drills, while the
          // card is faded out — animating it bought nothing but guaranteed
          // it visibly disagreed with the (instantly redrawn) connector line
          // whenever it relocated.
          transition: 'opacity 420ms ease',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      >
        {slots.map((slotLeadId, index) => (
          <iframe
            key={index}
            title={`quiz-slot-${index}`}
            src={
              slotLeadId === undefined
                ? 'about:blank'
                : buildFunnelSrc(
                    { id: slotLeadId, seed: IDENTITIES[slotLeadId]?.seed ?? 7000 },
                    index,
                    FUNNEL_OPTS,
                  )
            }
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              border: 'none',
              opacity: index === active ? 1 : 0,
              transition: 'opacity 320ms ease',
              pointerEvents: 'none',
            }}
          />
        ))}
      </div>
      {connectorStart && (
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: visible ? 1 : 0,
            transition: 'opacity 420ms ease',
            zIndex: 4,
          }}
        >
          <line
            x1={connectorStart.x}
            y1={connectorStart.y}
            x2={cardEdgeX}
            y2={cardEdgeY}
            stroke={CONNECTOR_GLOW}
            strokeWidth={4}
            strokeLinecap="round"
          />
          <line
            x1={connectorStart.x}
            y1={connectorStart.y}
            x2={cardEdgeX}
            y2={cardEdgeY}
            stroke={CONNECTOR_COLOR}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <circle
            cx={connectorStart.x}
            cy={connectorStart.y}
            r={CONNECTOR_DOT_RADIUS + 3}
            fill={CONNECTOR_GLOW}
          />
          <circle
            cx={connectorStart.x}
            cy={connectorStart.y}
            r={CONNECTOR_DOT_RADIUS}
            fill={CONNECTOR_COLOR}
          />
        </svg>
      )}
    </>
  );
}
