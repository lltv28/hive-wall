# Loading Screen Upgrade — Design Spec

## Overview

Replace the basic checklist-only generating screen with a multi-phase loading experience that uses captive attention for social proof, testimonials, and a report preview teaser.

## Current State

`GeneratingChecklist.tsx` shows 4 animated checklist steps at 1800ms each (~7s total). The `onComplete` callback fires when all steps are done. Called from `App.tsx`'s `AppContent` with custom steps, title, subtitle, and icon.

## New Design

Four content phases that auto-advance. The checklist runs faster, then social proof content rotates in below it.

### Phase 1: Fast Checklist (0-3s)

Keep the current 4 checklist steps but at 800ms per step instead of 1800ms. Title, subtitle, and icon remain the same (passed as props from App.tsx). All 4 steps complete by ~3.2s.

### Phase 2: Social Proof Card (3-7s)

Fades in below the completed checklist. Card content:
- Large stat: "500+" (font-size 32px, font-weight 700, color `#18181B`)
- Headline: "Coaches & consultants have built AI products with Kodara" (font-size 14px, weight 500, color `#3F3F46`)
- Subtext: "Average time to first revenue: 14 days" (font-size 12px, color `#A1A1AA`)

Card style: white background, `1px solid #E5E5E8` border, `14px` radius, `24px` padding, centered text. Uses `animate-fade-in-up` entrance.

### Phase 3: Testimonial Card (7-10s)

Replaces the social proof card (fade transition). Card content:
- 5 star icons (amber `#F59E0B`, inline)
- Quote: "I went from idea to paying customers in 2 weeks. The AI product practically sells itself." (font-size 14px, italic, color `#3F3F46`, line-height 1.6)
- Attribution: "— Coach, Leadership Development" (font-size 12px, color `#A1A1AA`, margin-top 8px)

Same card style as Phase 2.

### Phase 4: Report Preview Teaser (10-12s)

Replaces the testimonial. Card content:
- Green checkmark icon (24px circle, `#22C55E` background, white check)
- "Your personalized report is ready" (font-size 15px, weight 600, color `#18181B`)
- "Complete action plan with guided steps" (font-size 12px, color `#A1A1AA`)

Same card style. After ~2s, fires `onComplete`.

### Total Duration

~12 seconds (up from ~7). Breakdown: 3.2s checklist + 4s social proof + 3s testimonial + 2s report teaser.

## Implementation

### Props Change

Add an optional `socialProof` prop to `GeneratingChecklist`:

```ts
interface SocialProofContent {
  stat: string;
  statLabel: string;
  statSubtext: string;
  testimonialQuote: string;
  testimonialAttribution: string;
  readyTitle: string;
  readySubtitle: string;
}

interface GeneratingChecklistProps {
  onComplete: () => void;
  steps?: Step[];
  title?: string;
  subtitle?: string;
  icon?: string;
  socialProof?: SocialProofContent;
}
```

When `socialProof` is provided, the component runs the 4-phase experience. When omitted, it behaves exactly as before (current checklist-only behavior — backwards compatible).

### State

Add to existing component state:
- `phase: 'checklist' | 'social' | 'testimonial' | 'ready'` — starts at `'checklist'`

Phase transitions are driven by timeouts (same cleanup pattern as current — store in a timers array and clear on unmount).

### Timing

- Step duration: `800ms` when `socialProof` is provided (vs current 1800ms)
- After last step completes: 400ms delay, then transition to `'social'` phase
- Social phase duration: 4000ms, then transition to `'testimonial'`
- Testimonial duration: 3000ms, then transition to `'ready'`
- Ready duration: 2000ms, then fire `onComplete`

### Layout

The social proof cards render below the checklist in the same container. The checklist stays visible (completed state) while the cards rotate beneath it.

```
+------------------------------------------+
|  [icon]                                   |
|  Title                                    |
|  Subtitle                                 |
|                                           |
|  [checklist steps - all completed]        |
|                                           |
|  +--------------------------------------+ |
|  |  [social proof / testimonial / ready] | |
|  +--------------------------------------+ |
+------------------------------------------+
```

### App.tsx Change

Pass `socialProof` content from `AppContent` when rendering `GeneratingChecklist`:

```ts
const socialProof = {
  stat: '500+',
  statLabel: 'Coaches & consultants have built AI products with Kodara',
  statSubtext: 'Average time to first revenue: 14 days',
  testimonialQuote: 'I went from idea to paying customers in 2 weeks. The AI product practically sells itself.',
  testimonialAttribution: '— Coach, Leadership Development',
  readyTitle: 'Your personalized report is ready',
  readySubtitle: 'Complete action plan with guided steps',
};
```

## Files Changed

- Modify: `components/GeneratingChecklist.tsx` — add social proof phases
- Modify: `components/App.tsx` — pass `socialProof` prop

## Design System Alignment

- Card background: `#FFFFFF`
- Card border: `1px solid #E5E5E8`
- Card radius: `14px`
- Text primary: `#18181B`
- Text body: `#3F3F46`
- Text muted: `#A1A1AA`
- Star color: `#F59E0B`
- Success green: `#22C55E`
- Animation: `animate-fade-in-up` (already defined in globals.css)
