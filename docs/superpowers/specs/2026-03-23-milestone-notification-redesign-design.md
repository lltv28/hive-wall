# Milestone Notification Redesign

## Problem

The current milestone insight card is absolutely positioned below the progress bar and overlays the top of the chat content, obscuring the most recent message.

## Design

Replace the overlay card with a cross-fade that swaps the progress bar for a compact insight bar within the same fixed-height container. Zero layout shift, zero content obstruction.

### Layout: Dark Compact Single Row

The insight bar is a solid `#2E7D52` green bar, 65px tall (matching the progress bar exactly), containing:
- **Check icon** (20px circle, `rgba(255,255,255,0.18)` background, white checkmark)
- **Title** (e.g. "Readiness Complete") — 11px, weight 600, white, `nowrap`
- **Vertical separator** (1px wide, 16px tall, `rgba(255,255,255,0.2)`)
- **Description** (e.g. "Your business model is primed for AI products") — 10px, `rgba(255,255,255,0.75)`, line-height 1.35

All elements are flex-row, vertically centered, with `padding: 0 20px` and `gap: 10px`.

### Transition Behavior

1. Milestone triggers: progress bar fades out, insight bar fades in (cross-fade, ~300ms)
2. Insight bar displays for ~2.4s
3. Insight bar fades out, progress bar fades back in (~300ms)

### Container

The outer wrapper gets a fixed height of `64px` + `1px` border-bottom (65px total), with `overflow: hidden`. Both the progress bar and insight bar are children positioned to fill this container. Only one is visible at a time via opacity transitions.

## Scope

Single component change: `components/OnboardingProgress.tsx`

### Remove
- The absolutely-positioned `activeInsight` card that drops below the progress bar
- The `showPill` hide/show logic tied to milestones (the progress pill can stay visible during milestones now since there's no overlay)

### Add
- Fixed-height wrapper around the progress bar area
- Insight bar component (dark green, layout C)
- Cross-fade opacity transition between the two states

### Keep
- All existing milestone detection logic (`checkMilestone`, `activeInsight` state)
- The 2.4s display timeout
- The progress bar checkpoint animations (dot scale-in, label color changes)
- `aria-live="polite"` on the insight bar for accessibility
