# Hive Variants — Six New Ad Recording Stages

**Date:** 2026-06-10
**Status:** Approved (brainstorm w/ Lucas, visual companion session)

## Why

The Hive ad (`/ad/hive`) is outperforming every other variant in video tests. The
win factors identified: (1) the one-brain-many-conversations visual metaphor, and
(2) live proof density — real funnels visibly running plus a climbing revenue
tally. This spec defines six new recording stages that keep that DNA and vary the
framing: two close iterations of the Hive scene and four new metaphors, five
landscape and one vertical.

## Scope

Six new routes in a **new `/hive/` route group**, with their **own nav and
launcher index** — the existing `/ad/*` pages, `AdNav`, and `/ad` index are not
touched.

| Route | Concept | Stage | Live iframes |
|---|---|---|---|
| `/hive/orbit` | Hive at Scale — all 50 in orbit | 1920×1080 | 8 |
| `/hive/global` | Global Takeover — world map | 1920×1080 | 2 |
| `/hive/throttle` | The Throttle — 1→50 dial | 1920×1080 | 6 |
| `/hive/mission-control` | Mission Control — ops room | 1920×1080 | 5 |
| `/hive/assembly` | Assembly Line — leads in, customers out | 1920×1080 | 4 |
| `/hive/switchboard` | Switchboard — leads rain into the orb | 1080×1920 | 2 |

All six reuse `lib/adStage.tsx` as-is, each page taking the subset it needs:
`useFitStage` (already supports vertical via arguments), `useRecordingChrome`,
`useLiveTally` (all except Throttle, which needs a variable cadence — see its
section), `useTileOutcomes`, `useCountUp`, `createLeads`, `buildFunnelSrc`,
`makeAgentStats`, `money`, `saleLabel`, and the `C` design tokens. No new
dependencies.

## Shared structure

```
app/hive/layout.tsx          — wraps children with <HiveNav />
app/hive/page.tsx            — launcher index (mirrors /ad page style)
components/HiveNav.tsx       — copy of AdNav pattern, scoped to the 6 new variants
app/hive/<slug>/page.tsx     — one self-contained page per variant (existing /ad/* pattern)
```

- `HiveNav` lists the six variants with jump keys `1–6`, `M` to hide,
  left-edge hover to reveal — same interaction model as `AdNav` but a separate
  component so the two groups stay independent. **Default-unpinned** (hidden
  until edge-hover) so it can never appear in a recording by accident; this
  intentionally differs from `AdNav`.
- The `/hive` index page states each variant's aspect ratio and recording
  viewport explicitly (only Switchboard is 1080×1920; the rest are 1920×1080).
- Each page is self-contained like the existing `/ad/*` pages: layout constants
  at the top, one default export, small private components below.

## Per-variant design

### 1 · `/hive/orbit` — Hive at Scale

The Hive core (radial green orb, revenue counter, count-up) dead center,
~CORE_R 170. Two concentric rings around it:

- **Inner ring:** 8 tiles (~300×210) at fixed angles, each running a live funnel
  iframe (`buildFunnelSrc`, staggered start steps). Header strip with
  `Lucas AI #01–08` + status pill driven by `useTileOutcomes`.
- **Outer ring:** 42 mini skeleton tiles (~120×84) — header dot + 3 placeholder
  chat lines — so all **50** agents are literally on screen. The outer ring
  group rotates slowly (one CSS `rotate` animation, ~120s/rev; each tile
  counter-rotated to stay upright).
- Radial wires (SVG) from core to inner-ring tiles. On each `useLiveTally` feed
  event, a bright pulse travels the wire (Hive's `hive-inbound` dash technique)
  and the target tile flashes `SOLD $97` / `BOOKED` for ~2s.
- Outcome badges on live tiles use the funnel's real low-ticket value (display
  `$27`-tier labels) so the badge never contradicts the tile's own screen.

### 2 · `/hive/global` — Global Takeover

Dark stage (`#0f172a` family). Background: stylized dotted-grid world map as
inline SVG (a coarse lat/lon dot matrix from a small inline boolean array —
continent silhouettes only, no external assets). Brain core center (~CORE_R 150)
with the revenue counter.

- **Cities (10):** Sydney +10, Tokyo +9, Singapore +8, Dubai +4, London +0,
  São Paulo −3, New York −5, Austin −6, Denver −7, Los Angeles −8. (Fixed
  offsets, no DST logic — close enough for an ad.)
- On each tally event: pick a city at random, weighting cities where it is
  currently night (10pm–7am local) at 2× — night-time sales sell the 24/7
  story. Fire an SVG arc pulse core→city, flare the node, and pop a toast:
  `2:47 AM · Sydney · $97` using the city's actual current local time computed
  from `Date` + offset. Toasts stack max 3, newest on top.
- Two live funnel tiles (~340×400) docked bottom-left and bottom-right corners.
- Header: `LUCAS AI · SELLING IN 10 TIME ZONES`.

### 3 · `/hive/throttle` — The Throttle

Light design-system stage (`C.appBg`). A large horizontal "AI AGENTS" slider
control bottom-center (track + knob + big numeral) auto-animates through a
scripted loop, with a fake cursor graphic attached to the knob:

- **Script:** hold 1 (3s) → ease to 5 (2s) → hold (3s) → ease to 15 (2s) →
  hold (3s) → ease to 50 (2.5s) → hold (8s) → snap back to 1 and loop.
  Driven by one rAF timeline; current agent count `N` derives from it.
- **Tile field:** a centered grid that fills as `N` grows. First 6 slots are
  live funnel iframes (mounted once, revealed as `N` passes them — never
  remounted, so playback isn't reset); slots 7–50 are skeletons that pop in
  with a scale-in animation.
- **Gauges:** `REVENUE / HOUR` gauge + total revenue. The tally emit interval
  scales with `N` (interval ≈ `clamp(9000 / N, 700, 9000)`ms — implemented as a
  local cadence loop rather than `useLiveTally`, which has a fixed cadence), so
  money audibly/visibly accelerates as the dial climbs.
- Header: `WHAT IF SALES HEADCOUNT WAS A SETTING?`

### 4 · `/hive/mission-control` — Mission Control

Dark ops-room stage. Top 45%: the **big board** — a wall-screen panel containing
the brain core (smaller, ~CORE_R 110), the revenue counter, and a status strip
(`50 AGENTS · 10 TIME ZONES · 24/7`). Bottom 55%: two rows of desk cards with a
slight CSS perspective (front row larger), 7 + 9 desks:

- 5 desks (3 front, 2 back) have small live funnel iframes as their monitor
  screens; the rest show skeleton screens with blinking cursors / status dots.
- On each tally event: one desk flares green with a `+$97` chip, an SVG beam
  shoots from that desk up to the big board, and the board revenue bumps
  (`node-bump` pattern).
- Front-row desks get name plates (`AI Agent #01…`) with per-agent
  `makeAgentStats` sales/calls chips.

### 5 · `/hive/assembly` — Assembly Line

Light design-system stage. A conveyor belt strip crosses the lower third
(repeating-gradient background-position animation). The brain core sits ON the
line at center, line passing behind it:

- **Lead cards:** gray cards (initials avatar + masked name) slide in from the
  left edge on the belt cadence (~one per tally event, CSS keyframe travel,
  ~7s edge-to-edge), disappear into the core, and a **green card** stamped with
  the sale value (`$27` / `$97` …) or a `CALL BOOKED` card (per the event's
  outcome) emerges right, sliding off into a `TODAY: $4,217` bin counter.
  Implementation: each feed event spawns one scripted card pair (enter card +
  delayed exit card) keyed by the event key; cards are removed on animation end.
- Above the line: 4 live funnel tiles (~330×380) labeled `Lucas AI #01–04`
  showing the work happening.
- Header: `LEADS IN · CUSTOMERS OUT`.

### 6 · `/hive/switchboard` — Switchboard (vertical)

1080×1920 stage via `useFitStage(1080, 1920)`, light/cream (reuse the
ask-the-floor `d4a` token direction). Top→bottom:

1. **Lead rain (top ~28%):** chat-bubble chips (`Maria · IG ad`, `Devon · FB ad`,
   `Priya · YouTube` — seeded name+source pool) fall from the top edge along 3
   lanes toward the orb on a continuous cadence (~1 per 1.2s), shrinking and
   fading as they're "absorbed."
2. **Brain orb (center, ~360px)** with revenue counter inside; flares
   (`core-bump`) on every tally event.
3. **KPI strip:** `Sales today` / `Calls booked` (count-up, `useLiveTally` with
   ask-the-floor-style base numbers).
4. **Live conversations (bottom ~38%):** two stacked full-width funnel tiles
   (~900×330 each) labeled `Conversation #01 / #02` with status pills.

Caption under the orb: `50 conversations · one mind`.

## Cross-cutting rules

- **No nav on camera:** `HiveNav` defaults to hidden (edge-hover reveal).
- **Badge honesty:** where a tile shows its own funnel, any SOLD badge attached
  to that tile uses the funnel's real outcome value (not `randomSalePrice()`),
  matching `/live-wall`'s rule. Off-tile spectacle (arcs, toasts, belt cards)
  may use the rotated `SALE_PRICES` for variety.
- **Lint-clean by construction:** no `setState` directly in effect bodies
  (use timer/rAF callbacks), no ref writes during render, no `any` — the
  patterns that currently fail `npm run lint` on the older pages must not
  appear in the new files.
- **Loop-safety:** every stage must look correct at any random moment ≥10s in
  (these are recorded in long takes and cut later) — no intro-only states
  except Throttle's scripted loop, which restarts itself.

## Out of scope

- No changes to existing `/ad/*` pages, `AdNav`, `/ad` index, or `adStage.tsx`
  beyond exporting nothing new (if a helper is genuinely shared by ≥2 new pages
  it may be added to `adStage.tsx`, additive only).
- No audio. No real Meta ad upload. No quiz-funnel (`components/`, `lib/`
  progression) changes.

## Verification

1. `npm run build` — static export includes all 6 new routes (+ `/hive` index).
2. `npm test` — existing 39 tests stay green (no funnel code touched).
3. `npm run lint` — **zero new errors** (the 5 pre-existing errors in old files
   are out of scope).
4. Headless screenshot sweep (Playwright) of each route at its recording
   resolution after a 14s settle: stage fills frame, animation mid-flight, no
   console/page errors. Two screenshots ≥10s apart for Throttle to verify the
   dial actually moves and the tile field grows.
