# Hive Variant · "The Ladder" — sideways value-ladder pyramid

**Date:** 2026-06-10
**Status:** Approved in brainstorm (Lucas; visual companion — layout B, all-live nodes)

## Why
A new spin-off of the winning Hive ad (`/ad/hive`). The Hive shows one brain → many
live conversations. This variant reframes that as a **sideways value-ladder
pyramid**: the floor is wide on the left (low-ticket, many buyers) and narrows
rightward through mid → high ticket (fewer people climb to the expensive tiers).
Tells the "ascension / value ladder, run entirely by one AI" story.

Visual companion picks: **layout B** (Lucas AI core at the LEFT, powering the
ladder; revenue total at the high-ticket tip) and **all nodes are live funnels**.

## Route & integration
- New page `app/hive/ladder/page.tsx` (1920×1080 recording stage, auto-playing —
  no interaction needed, like the other `/hive/*` variants).
- Add to `components/HiveNav.tsx` (next jump key) and the `app/hive/page.tsx`
  launcher index (16:9 · record at 1920×1080).
- Reuses `lib/adStage.tsx`: `STAGE_W/H`, `C`, `createLeads`, `buildFunnelSrc`,
  `makeAgentStats`, `money`, `saleLabel`, `useFitStage`, `useRecordingChrome`,
  `useLiveTally`, `useRealTileOutcomes` (badge honesty), `useCountUp`. No new deps.

## Layout (left → right, the pyramid narrows)
- **Lucas AI core** — glowing green orb at the left (~x 150, vertical center),
  "LUCAS AI" + a small "powering the ladder" chip. The source.
- **Three tier columns**, each a vertical stack of **live funnel tiles**
  (`buildFunnelSrc`), centered vertically; column total height shrinks each tier
  so the silhouette narrows:
  - **Low · $27** — 7 tiles, small (~250×120), tallest column (the wide base).
  - **Mid · $297** — 5 tiles, medium (~270×150).
  - **High · $1,497** — 3 tiles, large (~300×200), shortest column (the tip).
  Tile size grows with tier (reinforces "more valuable, fewer people").
  Each tile: a thin header (`Low #01` / squad-tinted on a sale) + the funnel
  iframe + a status pill from `useRealTileOutcomes` (Selling… → SOLD $X / BOOKED).
- **Connectors** — faint green lines fanning core → low → mid → high, converging
  rightward (the pyramid edges).
- **Money pulses** — on each `useLiveTally` feed event, a bright green pulse
  travels a connector (toward the core / along the spine), echoing the Hive's
  "AI generating money" beat.
- **Revenue tip** — at the far-right narrow point: a "TODAY $X" panel with a
  count-up total (the culmination of the ladder).
- **Per-tier footer labels** under each column: `LOW · $27 · N sales`,
  `MID · $297 · N sales`, `HIGH · $1,497 · N sales` (seeded `makeAgentStats`-style
  counts that fit the funnel shape: many low sales, few high).
- Header strip: `LUCAS AI · THE VALUE LADDER`.

## Behavior / conventions
- Dark Hive palette (`#0f172a` family, green core/pulses) — matches `/ad/hive`.
- Tier accent colors for headers/labels: Low #3B82F6, Mid #D97706, High #16A46C.
- All 15 tiles are always-mounted live iframes (no skeletons — "all nodes live").
- Badge honesty: SOLD badge on a tile uses the funnel's real value
  (`useRealTileOutcomes`), not a random price.
- Must read correctly at any random moment ≥10s in (long-take recording).
- Lint-clean by construction: no `setState` synchronously in an effect body
  (defer via a cleaned-up `setTimeout(...,0)` / timer callbacks), no `any`, no
  unused imports. `npm run lint` stays at the pre-existing 5-error/8-warning
  baseline (zero new). Static export still succeeds.

## Out of scope
- No interaction/attract choreography (it's a passive recording stage).
- No changes to existing `/ad/*`, `/hive/*` pages, `/brain`, or `adStage.tsx`
  beyond the additive HiveNav + index entries.

## Verification
- `npm run build` (static export includes `/hive/ladder`), `npm test` green
  (no shared code touched), `npm run lint` zero new findings.
- Headless screenshot at 1920×1080 after a ~14s settle: pyramid reads (wide-left
  low → narrow-right high), 15 live funnels render, core + pulses + revenue tip
  present, no console/page errors.
