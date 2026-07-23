# Action Plan Checklist Design Spec

**Date:** 2026-03-25
**Status:** Draft
**Adds to:** Results page (after Recommendation card, before first CTA)

## Overview

Add an interactive 30-day launch plan checklist to the results page. The plan is a teaser roadmap — it shows the full structure of what launching an AI product looks like, but gates later weeks behind a strategy call booking. The progress bar doubles as tab navigation to switch between weeks.

## Goals

- Create desire by showing a concrete, tangible roadmap
- Gate weeks 3-4 behind the strategy call CTA to drive bookings
- Lightly personalize week titles with the recommended product name
- Keep it compact — one card with tabbed content, not a long scroll

## Component Structure

A single `ActionPlanCard` component rendered inside a `SectionCard` wrapper (reusing the existing shared component).

### Layout

- **Section label:** "Your 30-Day Launch Plan" with clipboard icon
- **Progress bar:** 4 segmented tabs, each labeled "Week 1" through "Week 4". Clickable — selecting a tab shows that week's checklist. Active tab has green bar + green text. Completed tabs have green bars. Locked tabs are faded.
- **Week content area:** Shows the checklist for the currently selected tab. Only one week visible at a time. Transitions with a subtle fade-in.

### Week States

**Week 1 (active):**
- Green numbered circle
- Full checklist visible
- First item checked off ("Complete AI readiness assessment") with strikethrough
- Second item highlighted as next action ("Book your strategy call") with green border checkbox and bold text
- Remaining items shown with gray checkboxes and muted text

**Week 2 (upcoming):**
- Gray numbered circle
- Full checklist visible, all items with gray checkboxes and muted text
- No gated banner

**Week 3 (locked):**
- Lock icon instead of number
- Muted title
- Checklist items are blurred (`filter: blur(4px)`, `user-select: none`)
- "Book your call to unlock this step" banner at bottom

**Week 4 (locked):**
- Same treatment as Week 3

## Checklist Content

The week titles and checklist items are lightly personalized — the product name from `ResultsConfig.recommendation.name` is interpolated into Week 3's title.

### Week 1: Strategy & Discovery
1. Complete AI readiness assessment (pre-checked)
2. Book your strategy call (highlighted as next)
3. Map your sales process with our team
4. Define your {productName} spec

### Week 2: Content & Training Data
1. Gather your training materials & SOPs
2. Record your methodology walkthrough
3. Review AI training data with our team
4. Approve content for AI ingestion

### Week 3: Build Your {productName}
1. Configure AI personality and voice
2. Train on objection handling scripts
3. Test and refine AI conversations

### Week 4: Launch & Scale
1. Deploy AI product to production
2. Monitor first-week performance metrics
3. Optimize conversion and scale traffic

## Data Dependencies

The component receives:
- `productName: string` — from `ResultsConfig.recommendation.name` (e.g. "AI Salesperson")

No other quiz answer data is needed. The checklist content is hardcoded with the product name interpolated.

## Placement in Results Page

Current order: Hero -> Profile -> Video -> Recommendation -> **[ACTION PLAN]** -> CTA -> Testimonial -> Process -> Demos -> FAQ -> Social Proof -> CTA

Insert between `RecommendationCard` and first `CtaBlock` in the `sections` array in `ResultsPage.tsx`.

## Component Architecture

### New files

- **`components/results/ActionPlanCard.tsx`** — the complete action plan component. Contains:
  - Tab state management (`useState` for active week index)
  - Progress bar tabs (4 buttons)
  - Week content panels (4 panels, one visible at a time)
  - Checklist items with appropriate states (done, next, pending, locked)
  - Gated banner for locked weeks
  - All content defined as static data within the component, with `productName` prop for interpolation

### Modified files

- **`components/results/ResultsPage.tsx`** — import `ActionPlanCard`, add it to the sections array after `RecommendationCard`, pass `config.recommendation.name` as the `productName` prop.

## Styling

Uses existing design tokens from `globals.css`:
- Colors: `--alpha-brand-950` for green accents, `--red-600` not used, standard grays
- Typography: `--font-medium`, `--font-semibold` for weight hierarchy
- The component uses inline styles consistent with the rest of the results page

### Key styles
- Progress tabs: `border-radius: 6px`, `padding: 8px 4px`, green bar (4px height) at top of active/completed tabs
- Checkboxes: `18px` square, `border-radius: 5px`
  - Done: green fill with white checkmark SVG
  - Next: green border, no fill
  - Pending: gray border (`#d4d4d8`)
  - Locked: light gray border (`#e5e5e8`)
- Locked items: `filter: blur(4px)`, `user-select: none`
- Gated banner: `background: #f8faf9`, `border-radius: 8px`, green text with lock icon
- Week content transition: fade-in animation on tab switch

## Out of Scope (v1)

- Interactive checkboxes (users can't actually check items off)
- Persistence of checked state
- Dynamic checklist content from admin/config
- More than 4 weeks
- Different checklist items per product type (only the title changes)
