# AI Quiz Funnel v1 — Design Spec

## Overview

Standalone Next.js app extracted from the `ai-product-creator` project's Variant D (Freemium Onboarding). A conversational quiz funnel that assesses AI product readiness, shows fit scores and interstitials, then delivers a guided action plan with tasks, videos, and offer cards.

## Source

All code originates from `ai-product-creator/` Variant D. Content is copied as-is. Components are renamed to drop the `D` prefix since there are no longer multiple variants.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **Language:** TypeScript
- **Font:** Instrument Sans (Google Fonts, static weights 400/500/600)
- **State Management:** React useState in App.tsx (no context needed)

## User Flow

4 phases, managed by a state machine in `App.tsx`:

1. **Onboarding** (`onboarding`) — Conversational chat with 13 questions, 2 interstitials, 3 mid-flow fit score cards, and 1 final result trigger (also rendered as a fit score). Messages auto-reveal with typing indicators. User responds via chip pickers (single or multi-select). Final fit score has `triggersPhaseChange: true`.

2. **Generating** (`generating`) — Checklist animation with 4 steps: "Analyzing your business profile", "Evaluating AI product potential", "Matching you to client success patterns", "Building your personalized report". Auto-advances after completion.

3. **Action Plan** (`action-plan`) — Sidebar with task list + empty state main area. Tasks have 3 types: `quick` (mark complete), `guided` (chat flow), `offer` (CTA card). Tasks unlock sequentially; offer tasks are always accessible.

4. **Guided Flow** (`guided-flow`) — Selected task opens a chat flow in the main area with auto-playing messages, videos, visual cards, chip interactions, and offer cards. Completing a task returns to the action plan and unlocks the next task.

## Demo Controls Bar

Minimal top bar:
- "Demo Controls" label (left)
- Current state display + "Reset Demo" button (right)
- Toggle button (top-right corner) to hide/show controls

No variant switcher, theme picker, loading style picker, or step count slider.

## File Structure

```
ai-quiz-funnel-v1/
├── app/
│   ├── layout.tsx              # Root layout, Instrument Sans font
│   ├── globals.css             # Tailwind + CSS vars + animations
│   └── page.tsx                # 'use client', dynamic import of App
├── components/
│   ├── App.tsx                 # State machine + demo controls
│   ├── OnboardingChat.tsx      # Conversational quiz (was DOnboardingChat)
│   ├── ActionPlanSidebar.tsx   # Task list sidebar (was DActionPlanSidebar)
│   ├── FlowChat.tsx            # Guided task chat (was DFlowChat)
│   ├── FlowHeader.tsx          # Task header bar (was DFlowHeader)
│   ├── MessageBubble.tsx       # Chat message bubble (was DMessageBubble)
│   ├── TypingIndicator.tsx     # Thinking dots (was DTypingIndicator)
│   ├── VideoEmbed.tsx          # Video player card (was DVideoEmbed)
│   ├── VisualCard.tsx          # Data display card (was DVisualCard)
│   ├── ChipPicker.tsx          # Selection chips (was DChipPicker)
│   ├── FitScore.tsx            # Fit score card (was DFitScore)
│   ├── Interstitial.tsx        # Stat interstitial card (was DInterstitial)
│   ├── OfferCard.tsx           # CTA offer card (was DOfferCard)
│   ├── PlanHeader.tsx          # Action plan header (was DPlanHeader)
│   ├── TaskItem.tsx            # Task list item (was DTaskItem)
│   └── GeneratingChecklist.tsx # Loading checklist animation (copied from shared)
├── lib/
│   ├── types.ts                # ActionTask, DMessage, UserAnswers, TaskType, TaskStatus (was variantDTypes)
│   ├── onboardingMessages.ts   # 13 questions + interstitials + fit scores
│   └── actionPlanTasks.ts      # Task definitions with guided-flow messages
├── package.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
└── .gitignore
```

## Component Mapping

| Original (ai-product-creator) | New (ai-quiz-funnel-v1) | Changes |
|-------------------------------|-------------------------|---------|
| DemoApp.tsx (Variant D logic) | App.tsx | Strip variants A/B/C, themes, QuizProvider. Keep D states + minimal demo controls |
| VariantDContent.tsx | Inlined into App.tsx | State machine logic merged into App since there's only one flow |
| DOnboardingChat.tsx | OnboardingChat.tsx | Rename, update imports |
| DActionPlanSidebar.tsx | ActionPlanSidebar.tsx | Rename, update imports |
| DFlowChat.tsx | FlowChat.tsx | Rename, update imports |
| DFlowHeader.tsx | FlowHeader.tsx | Rename, update imports |
| DMessageBubble.tsx | MessageBubble.tsx | Rename, update imports |
| DTypingIndicator.tsx | TypingIndicator.tsx | Rename, update imports |
| DVideoEmbed.tsx | VideoEmbed.tsx | Rename, update imports |
| DVisualCard.tsx | VisualCard.tsx | Rename, update imports |
| DChipPicker.tsx | ChipPicker.tsx | Rename, update imports |
| DFitScore.tsx | FitScore.tsx | Rename, update imports |
| DInterstitial.tsx | Interstitial.tsx | Rename, update imports |
| DOfferCard.tsx | OfferCard.tsx | Rename, update imports |
| DPlanHeader.tsx | PlanHeader.tsx | Rename, update imports |
| DTaskItem.tsx | TaskItem.tsx | Rename, update imports |
| GeneratingChecklist.tsx | GeneratingChecklist.tsx | Copied as-is |
| variantDTypes.ts | lib/types.ts | Rename, same content |
| onboardingMessages.ts | lib/onboardingMessages.ts | Update import path for types |
| actionPlanTasks.ts | lib/actionPlanTasks.ts | Update import path for types |

## Files NOT Copied

Everything from variants A/B/C and the theme system:
- QuizContext.tsx, questions.ts, recommendations.ts, demoThemes.ts, features.ts, mockMessages.ts
- WelcomeScreen, QuizFlow, QuestionScreen, MultipleChoice, TextInput, TextArea, CurrencyInput, ProgressBar, PrimaryButton, PartialReveal, LeadCapture, FullReveal, GeneratingAnimation, GeneratingGlassCard, GeneratingRing, Chat, HardPaywall, SoftPaywall, CheckoutSim, FeatureIcon, SuccessScreen
- API route (app/api/leads/route.ts)
- render.yaml, scrape-quiz.mjs, scrape-quiz.py, research files

## Design System

CSS custom properties hardcoded in `globals.css` `:root` (no theme system). Do NOT set CSS vars inline on the App.tsx container — `globals.css` is the single source.

- Brand: `--brand-rgb: 16, 104, 68` (Kodara green) + alpha scale (`--alpha-brand-50/100/950`)
- Text: `--text-rgb: 26, 26, 26` + alpha scale (`--alpha-light-25` through `--alpha-light-900`)
- Alpha dark: `--alpha-dark-300/600/800/900` (white-based, for overlays on dark backgrounds)
- Buttons: `--btn-from: #737373`, `--btn-to: #404040` (primary gradient)
- Buttons disabled: `--btn-disabled-from: #e5e5e5`, `--btn-disabled-to: #d4d4d4` (used by ChipPicker multi-select)
- Background: root container uses `bg-[#f0f0f0]`
- Font: `'Instrument Sans', sans-serif` with `font-variation-settings: 'wdth' 100` (width axis is a no-op with current static font URL but kept for consistency with source)
- Shadows: card, modal, avatar (multi-layer stacks from original)

## Animations

Carried over from original `globals.css`:
- `slideInForward` / `slideInBack` (not currently used by D but kept for future)
- `fadeInUp`, `pulse-dot`, `fadeInStep` (used by GeneratingChecklist)
- `modal-in`, `scale-in`, `slide-up` (available for future use)
- `fade-in-up`, `fade-in` (used by chat messages)
- `.thinking-dot` with staggered delays (typing indicator)

## App.tsx State Machine

```
States: 'onboarding' | 'generating' | 'action-plan' | 'guided-flow'

Transitions:
  onboarding → generating     (onboarding quiz complete)
  generating → action-plan    (checklist animation done)
  action-plan → guided-flow   (user selects a task)
  guided-flow → action-plan   (task complete or back button)

Reset: any state → onboarding (demo controls reset, key incremented to force full remount)
```

Top-level state in App.tsx:
- `appState` — current phase
- `activeTaskId` (string | null) — selected task
- `key` (number) — incremented on reset to force full remount of content area, clearing all internal state (tasks, userAnswers, timeouts)

Task list and `userAnswers` state live inside the content area (same pattern as VariantDContent). `userAnswers` is collected during onboarding but currently unused — kept for future personalization.
