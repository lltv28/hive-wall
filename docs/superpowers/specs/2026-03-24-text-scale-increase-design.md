# Text Scale Increase for Mobile Legibility

**Date**: 2026-03-24
**Status**: Draft
**Scope**: Consumer-facing components only (not admin or split-view)

## Problem

Text is too small to read comfortably on mobile devices. All consumer-facing text sizes need to increase by ~25%, with proportional adjustments to spacing, avatars, and containers.

## Approach

Define a formal CSS custom property type scale in `globals.css`. Update each consumer-facing component to reference these tokens instead of hardcoded pixel values. This creates a single source of truth for future tuning.

## Type Scale

| Token | Value | Previous | Role |
|-------|-------|----------|------|
| `--text-2xs` | 10px | 8-9px | Phase labels, stepper numbers, progress pill |
| `--text-xs` | 14px | 11-12px | Captions, descriptions, back buttons |
| `--text-sm` | 16px | 13px | Chip labels, sender name, acknowledgment text |
| `--text-base` | 18px | 14px | Body text, message content, chip pills, typing indicator |
| `--text-lg` | 20px | 16px | CTA buttons, card headlines (differentiate via weight) |
| `--text-xl` | 24px | 20px | Section headings |
| `--text-2xl` | 40px | 32px | Hero stats |

Note: The original scale had separate `--text-md` (15px) for card headlines and `--text-base` (14px) for body. At 25% scale these both land at 18px. Rather than two tokens at the same value, card headlines use `--text-lg` (20px) at `--font-semibold` to maintain visual distinction from body text.

### Token-to-component mapping

| Component | Element | Token |
|-----------|---------|-------|
| `MessageBubble` | AI message body | `--text-base` / `--font-normal` / `--leading-loose` |
| `MessageBubble` | Sender name ("Lucas - Kodara CEO") | `--text-sm` / `--font-semibold` |
| `MessageBubble` | Subtitle | `--text-xs` / `--font-normal` |
| `MessageBubble` | User bubble text | `--text-base` / `--font-medium` |
| `OnboardingChat` | Acknowledgment text | `--text-sm` / `--font-medium` |
| `OnboardingChat` | Back button | `--text-xs` / `--font-medium` |
| `ChipPicker` | Grid chip label | `--text-sm` / `--font-medium` |
| `ChipPicker` | Grid chip description | `--text-xs` |
| `ChipPicker` | Pill chip label | `--text-base` |
| `ChipPicker` | Multi-submit button | `--text-base` (pill) / `--text-lg` (grid) |
| `FitScore` | Percentage in ring | `--text-xl` / `--font-semibold` (unchanged size, tokenized) |
| `FitScore` | Label ("AI Product Readiness Score") | `--text-xs` / `--font-medium` |
| `FitScore` | Message text | `--text-base` |
| `FitScore` | CTA button | `--text-lg` / `--font-medium` |
| `Callout` | Stat number | `--text-2xl` / `--font-bold` |
| `Callout` | Headline | `--text-lg` / `--font-semibold` |
| `Callout` | Body | `--text-base` / `--leading-relaxed` |
| `Callout` | Video overlay title | `--text-xs` / `--font-medium` |
| `OnboardingProgress` | Phase labels | `--text-2xs` / `--font-medium` |
| `OnboardingProgress` | Pill percentage | `--text-2xs` / `--font-bold` |
| `OnboardingProgress` | Insight label | `--text-sm` / `--font-semibold` |
| `OnboardingProgress` | Insight text | `--text-xs` |
| `StepperBar` | Step number | `--text-2xs` / `--font-bold` |
| `GeneratingChecklist` | Heading | `--text-xl` / `--font-medium` |
| `GeneratingChecklist` | Subtitle | `--text-base` |
| `GeneratingChecklist` | Stat number | `--text-2xl` / `--font-bold` |
| `GeneratingChecklist` | Stat label | `--text-base` / `--font-medium` |
| `GeneratingChecklist` | Stat subtext | `--text-xs` |
| `GeneratingChecklist` | Ready title | `--text-lg` / `--font-semibold` |
| `GeneratingChecklist` | Ready subtitle | `--text-xs` |
| `GeneratingChecklist` | Step label | `--text-xs` |
| `OfferCard` | Title | `--text-base` / `--font-bold` |
| `OfferCard` | Description | `--text-xs` |
| `OfferCard` | Price | `--text-xl` / `--font-bold` |
| `OfferCard` | CTA button | `--text-lg` / `--font-semibold` |
| `PinnedOffer` | Title | `--text-xs` / `--font-medium` |
| `PinnedOffer` | Subtitle | `--text-2xs` |
| `VideoEmbed` | Title | `--text-xs` |
| `VideoEmbed` | Duration | `--text-xs` |
| `VisualCard` | Title | `--text-base` / `--font-semibold` |
| `VisualCard` | Item label | `--text-xs` |
| `VisualCard` | Item value | `--text-base` / `--font-medium` |
| `TypingIndicator` | "Lucas is thinking" | `--text-base` / `--font-medium` |
| `FlowHeader` | Title | `--text-base` / `--font-semibold` |
| `FlowHeader` | Type label | `--text-xs` |
| `FlowChat` | "Complete Task" button | `--text-base` / `--font-semibold` |
| `FlowChat` | "Mark Complete" button | `--text-lg` / `--font-semibold` |

## Weight Scale (unchanged)

| Token | Value |
|-------|-------|
| `--font-normal` | 400 |
| `--font-medium` | 500 |
| `--font-semibold` | 600 |
| `--font-bold` | 700 |

## Line-Height Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--leading-tight` | 1.2 | Stats, large numbers |
| `--leading-snug` | 1.4 | Headlines, compact cards |
| `--leading-normal` | 1.6 | General UI text |
| `--leading-relaxed` | 1.7 | Long-form body (callout paragraphs) |
| `--leading-loose` | 1.8 | AI message content (18px * 1.8 = 32px, up from 14px * 2.0 = 28px) |

Note: Line-heights also increase. AI message content goes from 28px to 32px effective line-height. This preserves the spacious feel at the larger font size while tightening the ratio slightly (2.0 to 1.8) to avoid excessive vertical spread.

## Element Sizing Changes

### Layout

| Element | Before | After | Notes |
|---------|--------|-------|-------|
| App max-width | 390px | 430px | On devices < 430px, content still takes full width via `width: 100%` |
| Chat horizontal padding (OnboardingChat, PlanFlow) | `px-4` (16px) | `px-5` (20px) | |
| Message gap (OnboardingChat, PlanFlow) | `gap-6` (24px) | `gap-7` (28px) | |

Note: `FlowChat.tsx` already uses `px-5` and `gap-6`. Only the gap changes to `gap-7`.

### Avatars

| Element | Before | After |
|---------|--------|-------|
| AI message avatar | 28px (w-7) | 36px (w-9) |
| Acknowledgment avatar | 24px (w-6) | 32px (w-8) |

### Message Bubbles

| Element | Before | After |
|---------|--------|-------|
| Padding | 16px | 20px |
| Max-width (AI/user) | 600px / 480px | No change |

### Chip Pickers

| Element | Before | After |
|---------|--------|-------|
| Grid padding | `18px 14px` | `22px 18px` |
| Grid emoji | 28px | 34px |
| Pill padding | `px-3 py-2` | `px-4 py-2.5` |
| Multi-submit padding | `8px 20px` | `10px 24px` |

### CTA Buttons (all components)

| Element | Before | After |
|---------|--------|-------|
| Padding | `8px 20px` | `10px 24px` |
| Border-radius | 8px | 10px |

### Progress Bar (OnboardingProgress)

| Element | Before | After |
|---------|--------|-------|
| Bar height | 6px | 8px |
| Container height | 78px | 90px |
| Pill padding | `2px 8px` | `3px 10px` |
| Segment gap | 6px | No change |

### FitScore Ring

| Element | Before | After |
|---------|--------|-------|
| Container | 128px (w-32) | 160px (w-40) |
| Percentage text | 24px (Tailwind `text-2xl`) | `--text-xl` (24px) -- same size, tokenized |

### Callout Cards

| Element | Before | After |
|---------|--------|-------|
| Padding (no video) | 24px | 28px |
| Padding (with video) | `16px 24px 24px` | `20px 28px 28px` |

### Stepper Bar (PlanFlow)

| Element | Before | After |
|---------|--------|-------|
| Dots | 20px | 24px |
| Step number font | 9px | `--text-2xs` (10px) |
| Lines | 2px | No change |

### Typing Indicator

| Element | Before | After |
|---------|--------|-------|
| Avatar | 28px | 36px (match message avatar) |
| Text | Tailwind `text-sm` (~14px) | `--text-base` (18px) |
| Dots | 3px | 4px |

## Files Modified

Consumer-facing components only:

- `globals.css` -- Add type scale, line-height, and weight custom properties
- `App.tsx` -- Max-width 390 to 430
- `OnboardingChat.tsx` -- Avatar sizes, spacing, gap, padding, acknowledgment text, back button
- `MessageBubble.tsx` -- Text sizes to vars, avatar size, padding, line-height
- `ChipPicker.tsx` -- Chip padding, emoji size, label/desc sizes, submit button
- `FitScore.tsx` -- Ring size, text sizes to vars
- `Callout.tsx` -- Padding (both variants), text sizes to vars
- `OnboardingProgress.tsx` -- Bar height, container height, pill, phase labels, insight text sizes to vars
- `StepperBar.tsx` -- Dot size, number font size
- `TypingIndicator.tsx` -- Avatar size, text size, dot size
- `GeneratingChecklist.tsx` -- Heading, stat, step label, ready text sizes to vars
- `OfferCard.tsx` -- Text sizes to vars, button padding
- `PinnedOffer.tsx` -- Text sizes to vars
- `VideoEmbed.tsx` -- Title/duration text sizes to vars
- `VisualCard.tsx` -- Text sizes to vars
- `PlanFlow.tsx` -- Chat padding, gap
- `FlowChat.tsx` -- Gap only (already uses `px-5`), text sizes in inline elements
- `FlowHeader.tsx` -- Text sizes to vars

## Files NOT Modified

- `app/admin/*` -- Admin panel, not consumer-facing
- `app/split/page.tsx` -- Demo tool, not consumer-facing
- `app/page.tsx`, `app/layout.tsx` -- Entry points, no sizing
- `lib/types.ts`, `lib/quiz-config.ts`, `lib/config-provider.ts` -- Data layer, no sizing
- `lib/seed-config.ts`, `lib/onboardingMessages.ts`, `lib/actionPlanTasks.ts` -- Content data
- `lib/useChatFlow.ts`, `lib/useSplitSync.ts` -- Hooks, no rendering
- `components/ActionPlanSidebar.tsx`, `components/PlanHeader.tsx`, `components/TaskItem.tsx` -- Dead code, not imported by any active component
- `components/StreamingText.tsx` -- Render-prop component, no sizing of its own

## Constraints

- Purely visual change. No logic, data flow, or API changes.
- All new sizes defined as CSS custom properties for single-source-of-truth tuning.
- Admin panel and split-view demo remain unchanged.
