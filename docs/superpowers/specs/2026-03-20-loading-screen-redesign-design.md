# Loading Screen Redesign

## Problem

The current loading screen shows a 4-step checklist with spinners/checkmarks, then cycles through 3 separate social proof cards (stat → testimonial → ready). The multi-phase card swap feels disjointed. The checklist takes visual focus away from the social proof content that builds trust.

## Design

Replace the checklist + multi-card phases with a single persistent proof card and a progress bar.

### Layout (top to bottom)

1. **Header** — emoji icon in a branded circle, title, subtitle. Unchanged from current.
2. **Proof card** — white card with border, centered text:
   - Large stat number ("500+")
   - Stat label ("Coaches & consultants have built AI products with Kodara")
   - Stat subtext ("Average time to first revenue: 14 days")
   - Visible from mount, stays in place throughout loading.
3. **Progress bar** — thin (4px) rounded bar below the card, full width of card (max-w-[360px]).
   - Background: `rgba(var(--brand-rgb), 0.08)`
   - Fill: `rgba(var(--brand-rgb), 0.92)`
   - Width formula: `((currentStep + 1) / steps.length) * 100%` with `transition: width 800ms ease-out`.
   - At mount, `currentStep=0` so bar is already transitioning to 25%. Each 800ms tick advances `currentStep`, smoothly filling the next segment.
   - Total fill time: ~3.2s (4 steps × 800ms).
4. **Step label** — single line of muted text below the progress bar. Uses `steps[currentStep].label` directly from the `steps` prop (no trailing ellipses appended — if ellipses are wanted, add them to the prop values in `App.tsx`).
   - Text swaps instantly (no crossfade needed — the progress bar provides visual continuity).

### Ready State

When the progress bar reaches 100%:
- After a brief pause (~400ms), the proof card content fades to a "ready" state:
  - Stat number changes to a green checkmark icon (same style as current ready phase)
  - Stat label changes to `socialProof.readyTitle`
  - Stat subtext changes to `socialProof.readySubtitle`
  - Transition: set card content opacity to 0, wait 300ms, swap content, set opacity back to 1. Use CSS `transition: opacity 300ms ease`.
- Step label clears.
- After ~2s in ready state, `onComplete` fires and transitions to the action plan.

### Timing Summary

| Time | Event |
|------|-------|
| 0ms | Mount. Proof card visible. Progress at 0%. Step 1 label. |
| 0ms | Progress bar begins filling to 25%. |
| 800ms | Progress reaches 25%. Step 2 label. Bar begins filling to 50%. |
| 1600ms | Progress reaches 50%. Step 3 label. Bar begins filling to 75%. |
| 2400ms | Progress reaches 75%. Step 4 label. Bar begins filling to 100%. |
| 3200ms | Progress reaches 100%. |
| 3600ms | Card fades to "ready" state. |
| 5600ms | `onComplete` fires. |

Total duration: ~5.6s (down from ~10.6s currently).

### What's Removed

- The 4-row checklist with spinner/checkmark rows
- The `Spinner` and `Checkmark` sub-components (no longer needed)
- The separate testimonial card phase
- The separate ready card phase
- The `phase` state machine (`'checklist' | 'social' | 'testimonial' | 'ready'`)
- The fallback path for when `socialProof` is absent (the old checklist-only mode at 1800ms/step). The new design always shows the proof card + progress bar.
- `testimonialQuote` and `testimonialAttribution` fields from `SocialProofContent` (no longer used). Remove from interface and from the call site in `App.tsx`.
- The `icon` field from the `Step` interface (no longer rendered). Keep in the interface for now since it's harmless, but it won't be used.

### What's Kept

- The `GeneratingChecklist` component name
- The `steps` prop is still used for labels and count — just not rendered as a checklist
- The `socialProof` prop provides the card content (trimmed interface, see above)
- The header (icon, title, subtitle)
- The outer card wrapper in `App.tsx` is unchanged

## Component Changes

### `GeneratingChecklist.tsx`

- Remove: `Spinner`, `Checkmark` components
- Remove: `completedSteps` state, `phase` state
- Keep: `currentStep` state (drives progress bar position and step label)
- Add: `isReady` state (boolean, triggers card content swap)
- Replace checklist rendering with: proof card → progress bar → step label
- Simplify timer logic: one interval or sequential timeouts advancing `currentStep` from 0→3, then setting `isReady`, then calling `onComplete`

### `App.tsx`

- Remove `testimonialQuote` and `testimonialAttribution` from the `socialProof` prop object.
- No other changes needed.
