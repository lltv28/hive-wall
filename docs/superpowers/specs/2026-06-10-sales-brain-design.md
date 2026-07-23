# Sales Brain — Interactive Org-Graph Demo App

**Date:** 2026-06-10
**Status:** Approved in brainstorm (Lucas; visual companion — layout A chosen)

## Why

Reference: an Instagram reel of a founder demoing a custom "Organization Brain"
app built in Claude Code (`localhost:3000`, "Conducting AI") — a force-directed
knowledge graph of a company (employees, departments, projects, sub-agents,
tools, permissions) with drill-down profile pages, a sub-agent chat rail, Slack-
like channels, and an AI-generated status report. Lucas wants the Lucas AI demos
to **feel/look/function like that** — a real, dense, clickable app filmed raw —
rather than stylized marketing animations.

This builds the **Sales Brain**: the legit, interactive version of the winning
Hive ad. Same idea (one Lucas AI brain → many AI salespeople) but executed as a
real app you drive by hand, that also has an auto-playing attract mode so it can
be screen-recorded hands-free as ad b-roll.

Chosen look (visual companion): **layout A — light, concentric rings** (a close
parallel to the reel's closing money-shot).

## Subject & entity model

The Lucas AI sales floor as an "org brain." Deterministic, seeded data (no
backend). Entity types:

- **Core** — Lucas AI (graph center).
- **Squads (6)** — Acquisition (#2563EB), Qualifying (#16A46C), Closing
  (#D97706), Booking (#7C3AED), Follow-up (#DB2777), Reactivation (#0891B2).
- **Agents (44)** — the AI salespeople. `{ id, name, initials, squadId, role,
  status, currentTask, sales, calls, revenue, playbookId, toolIds[],
  leadIds[], subAgentIds[], permissions[] }`. Stats from
  `makeAgentStats(44, seed)` in `lib/adStage.tsx`.
- **Sub-agents (8)** — skills agents invoke: Qualifier, Objection-Handler,
  Closer, Booker, Follow-up Writer, Lead Scorer, Transcript Analyzer, Offer
  Picker. `{ id, name, squadId? }`.
- **Leads / conversations (30)** — `{ id, name, source: 'IG ad'|'FB ad'|
  'YouTube'|'TikTok', stage, agentId, valueUsd, outcome: 'working'|'buy'|
  'book' }`.
- **Tools (8)** — Hyros, Stripe, Google Calendar, CRM, Quiz Funnel, Slack,
  Gmail, Meta Ads. `{ id, name }`.
- **Offers / playbooks (5)** — Low-Ticket Report ($27), Strategy Call, Core
  Program, Order Bump, Upsell. `{ id, name, priceUsd, steps[] }`.
- **Channels** — General + one per squad + one per active offer.

**Graph edges:** core→squad hubs; squad→its agents; agent→tools (access);
agent→leads (working); agent→playbook; agent→sub-agents. The rendered hero
keeps the node count to ≈110 (1 core + 6 hubs + 44 agents + ring of lead dots +
ring of tool/offer squares) so SVG hit-testing stays crisp at 4K.

## Architecture — one app shell, client view-state (no per-entity routes)

Lives in `ads-demos-6-6-2026` as a new route group `/brain`. Static-export-safe:
all physics + view transitions are client-side; there are **no dynamic routes**
— drill-down is React view-state (graph ↔ detail panel ↔ chat), which is both
smoother and essential for attract-mode choreography (no navigations).

```
lib/brain/data.ts          seeded entity model + graph (nodes/edges) builders
lib/brain/layout.ts        d3-force radial simulation → node positions (concentric tiers)
lib/brain/types.ts         shared types
app/brain/page.tsx         app shell: chrome + view-state router (graph|entity|chat) + attract driver
app/brain/layout.tsx       recording-chrome wrapper (hide dev overlay), light bg
components/brain/Graph.tsx        SVG force-graph: pan/zoom, hover-highlight, click→select, live pulses
components/brain/LeftRail.tsx     entity-type browser w/ counts (Agents, Sub-agents, Leads, Tools, Offers, Channels)
components/brain/TopBar.tsx       "Lucas AI · Sales Brain", search, Live toggle
components/brain/EntityPanel.tsx  drill-down detail (agent/tool/offer) with tabs
components/brain/ChatView.tsx     sub-agent rail + channels + AI daily report
components/brain/avatar.tsx       initials-on-color monogram helper
```

`package.json` gains `d3-force`, `d3-zoom`, `d3-selection`, `d3-drag` (and
`@types/d3-*` dev). These are client-only; the app is `'use client'`.

## Surfaces

### 1. Graph hero (default view)
Concentric-ring force layout (layout A): core center; ring1 = 6 labeled squad
hubs; ring2 = lead dots; ring3 = tool/offer squares; rim = 44 agent monograms
(initials-on-squad-color). Built with `d3-force`:
`forceRadial(tierRadius)` per tier + `forceManyBody` (gentle) + `forceCollide` +
`forceLink` for edges; sim runs to a settled layout then stops (static, smooth).
`d3-zoom` for pan/zoom (scroll = zoom to cursor, drag = pan). Hover a node →
highlight it + its edges + neighbors, dim the rest, show a tooltip (name, role,
key stat). Click a node → EntityPanel slides in. A **Live** toggle fires green
pulses traveling core→agent edges on a simulated sale cadence (the ad tie-in).
The sim ticks write positions straight to SVG attrs via refs — **no React
state per tick** (lint + perf).

### 2. Entity drill-down (EntityPanel)
Slides in over/beside the graph. **Agent** (his profile, reframed): header
(avatar, name, role, squad chip, status), tabs **Overview / Access / Activity /
Compliance**. Overview: current task, squad, playbook it follows, leads it's
working. Access: tools it can use + permissions — the "can't see HR" flex
becomes "this Closer can charge Stripe but cannot export raw lead PII." Activity:
recent sales/calls feed. Compliance: guardrails. Stat chips (sales / calls /
revenue from `makeAgentStats`). A **Live conversation** sub-panel embeds an
existing funnel iframe via `buildFunnelSrc`. **Tool** and **Offer** panels are
lighter (what it is, which agents use it, related nodes).

### 3. Chat + channels (ChatView)
The reel's chat money-shot: left rail of **sub-agents**; center = **channels**
(General + per-squad + per-offer) with a thread; and an **AI-generated daily
sales report** (structured like his task-force report): revenue today, top
closers, calls booked, follow-ups owed, at-risk leads, recommended actions.
Static seeded content (no live LLM).

### 4. Attract mode (`?attract=1`)
Auto-drives the whole app for hands-free recording, looping: graph settles and
slowly drifts + live pulses fire → after ~6s auto-selects and opens an agent
EntityPanel, scrolls its tabs → closes → opens ChatView, scrolls the report →
returns to graph, picks a different agent. Optional fake cursor. Uses the
recording-chrome pattern (hide Next dev overlay, reset body) from
`useRecordingChrome`. Driven by one timeline (rAF/timers in callbacks — never
sync setState in an effect body), so it stays lint-clean.

## Conventions / constraints

- Light SaaS aesthetic (his look). Define a small `brain` token set; reuse
  `C`/`makeAgentStats`/`buildFunnelSrc` from `lib/adStage.tsx` where they fit
  (additive only — do not modify existing `/ad`, `/hive`, `/live-wall`, `/split`,
  `/talk` files).
- Avatars: initials-on-color (squad color).
- Lint must stay at the pre-existing baseline (5 errors / 8 warnings); new code
  adds zero. d3 sim updates DOM via refs, not React state, per tick.
- Static export must still succeed (`output: 'export'`); `/brain` is one static
  page driven entirely client-side.

## Phasing (recommended build order)

- **Phase 1 — vertical slice (build + film first):** `lib/brain/*` data+layout,
  `Graph.tsx` (interactive pan/zoom/hover/click), app shell + TopBar, one full
  **agent** EntityPanel, and a minimal attract driver (graph drift + auto-open
  one agent). This is the highest-value, highest-risk piece and is filmable on
  its own.
- **Phase 2:** LeftRail browser + search, Tool/Offer panels, full ChatView +
  AI report, and the full attract choreography (graph → agent → chat → loop).

## Out of scope

- No backend, no real LLM, no auth/permissions enforcement (permissions are
  displayed, not enforced — it's a demo).
- No changes to existing demo routes beyond additive helpers in `lib/adStage.tsx`.
- No new ad recording stage under `/hive` (this is a separate app; the Hive ads
  can later screen-record it).

## Verification

1. `npm run build` — static export includes `/brain`; no SSR errors from d3
   (client-only guards where needed).
2. `npm test` — existing 39 tests stay green (no shared code broken).
3. `npm run lint` — exactly the pre-existing 5 errors / 8 warnings; zero from
   `app/brain/*`, `components/brain/*`, `lib/brain/*`.
4. Headless screenshot sweep at 1920×1080: graph hero (settled, readable),
   hover/selected state, an agent EntityPanel, ChatView; plus an attract-mode
   two-shot ≥8s apart proving it auto-advances (graph → agent panel).
