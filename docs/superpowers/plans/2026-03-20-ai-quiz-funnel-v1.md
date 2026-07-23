# AI Quiz Funnel v1 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract Variant D (Freemium Onboarding) from ai-product-creator into a standalone Next.js project at `C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1`.

**Architecture:** Single-route Next.js app with a 4-state machine (onboarding, generating, action-plan, guided-flow). All components are copies from `ai-product-creator/components/D*.tsx` with the `D` prefix removed and imports updated. CSS design system lives in globals.css.

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS 4, TypeScript, Instrument Sans (Google Fonts)

**Source project:** `C:\Users\lucas\OneDrive\Documents\claude-code\ai-product-creator`

---

## Chunk 1: Project Scaffold

### Task 1: Initialize Next.js project

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`

- [ ] **Step 1: Run create-next-app**

Run from `C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1`:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*" --use-npm
```
Accept defaults. This will scaffold into the existing directory (which already has `docs/`).

- [ ] **Step 2: Update .gitignore**

Append to `.gitignore`:
```
# Brainstorm mockups
.superpowers/
```

- [ ] **Step 3: Verify dev server starts**

Run: `npm run dev`
Expected: Server starts on `http://localhost:3000`, default Next.js page renders. Kill the server after confirming.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "scaffold: Next.js project with Tailwind CSS and TypeScript"
```

---

## Chunk 2: Design System & Layout

### Task 2: Set up globals.css and layout

**Files:**
- Modify: `app/globals.css` (replace scaffold content)
- Modify: `app/layout.tsx` (replace scaffold content)

- [ ] **Step 1: Replace globals.css**

Replace the entire contents of `app/globals.css` with the design system CSS vars, animations, and Tailwind import. Copy from source `ai-product-creator/app/globals.css` as-is — all CSS custom properties and keyframe animations are needed.

```css
@import "tailwindcss";

:root {
  /* Base */
  --b-w-white: #ffffff;

  /* Text base */
  --text-rgb: 26, 26, 26;
  --alpha-light-25: rgba(var(--text-rgb), 0.04);
  --alpha-light-50: rgba(var(--text-rgb), 0.06);
  --alpha-light-100: rgba(var(--text-rgb), 0.09);
  --alpha-light-200: rgba(var(--text-rgb), 0.20);
  --alpha-light-300: rgba(var(--text-rgb), 0.28);
  --alpha-light-400: rgba(var(--text-rgb), 0.36);
  --alpha-light-500: rgba(var(--text-rgb), 0.48);
  --alpha-light-600: rgba(var(--text-rgb), 0.60);
  --alpha-light-900: rgba(var(--text-rgb), 0.80);

  /* Button colors */
  --btn-from: #737373;
  --btn-to: #404040;
  --btn-disabled-from: #e5e5e5;
  --btn-disabled-to: #d4d4d4;

  /* Alpha Dark (rgba 255,255,255) */
  --alpha-dark-300: rgba(255, 255, 255, 0.28);
  --alpha-dark-600: rgba(255, 255, 255, 0.60);
  --alpha-dark-800: rgba(255, 255, 255, 0.75);
  --alpha-dark-900: rgba(255, 255, 255, 0.80);

  /* Brand */
  --brand-rgb: 16, 104, 68;
  --alpha-brand-50: rgba(var(--brand-rgb), 0.06);
  --alpha-brand-100: rgba(var(--brand-rgb), 0.08);
  --alpha-brand-950: rgba(var(--brand-rgb), 0.92);

  /* Neutrals */
  --neutral-50: #fafafa;
  --neutral-200: #e5e5e5;
  --neutral-300: #d4d4d4;
  --neutral-500: #737373;
  --neutral-700: #404040;

  /* Semantic */
  --red-600: #dc2626;

  /* Shadows */
  --shadow-card: 0px 22px 6px rgba(0,0,0,0), 0px 14px 6px rgba(0,0,0,0), 0px 8px 5px rgba(0,0,0,0.01), 0px 4px 4px rgba(0,0,0,0.02), 0px 1px 2px rgba(0,0,0,0.02);
  --shadow-modal: 0px 67px 19px rgba(0,0,0,0), 0px 43px 17px rgba(0,0,0,0.01), 0px 24px 15px rgba(0,0,0,0.02), 0px 11px 11px rgba(0,0,0,0.03), 0px 3px 6px rgba(0,0,0,0.04);
  --shadow-avatar: 0px 20px 6px rgba(12,48,70,0), 0px 13px 5px rgba(12,48,70,0.02), 0px 7px 4px rgba(12,48,70,0.07), 0px 3px 3px rgba(12,48,70,0.12), 0px 1px 2px rgba(12,48,70,0.14);
}

body {
  font-family: 'Instrument Sans', sans-serif;
  font-variation-settings: 'wdth' 100;
  background: var(--b-w-white);
  color: var(--alpha-light-600);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
}

@keyframes slideInForward {
  from { transform: translateX(40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
@keyframes slideInBack {
  from { transform: translateX(-40px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slideInForward {
  animation: slideInForward 200ms ease-out;
}
.animate-slideInBack {
  animation: slideInBack 200ms ease-out;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes pulse-dot {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
@keyframes fadeInStep {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes modal-in {
  from { opacity: 0; transform: scale(0.96); }
  to { opacity: 1; transform: scale(1); }
}
.animate-modal-in {
  animation: modal-in 200ms ease-out;
}

@keyframes scale-in {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}
.animate-scale-in {
  animation: scale-in 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 300ms ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
.animate-fade-in {
  animation: fade-in 200ms ease-out;
}

.thinking-dot {
  animation: pulse-dot 1.2s infinite;
}
.thinking-dot:nth-child(2) { animation-delay: 150ms; }
.thinking-dot:nth-child(3) { animation-delay: 300ms; }
```

- [ ] **Step 2: Replace layout.tsx**

Replace the entire contents of `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Quiz Funnel — Discover Your AI Product Opportunity",
  description: "Assess your AI product readiness. A diagnostic tool by Kodara.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/globals.css app/layout.tsx
git commit -m "feat: add design system CSS vars, animations, and layout"
```

---

## Chunk 3: Lib Files

### Task 3: Create lib/types.ts, lib/onboardingMessages.ts, lib/actionPlanTasks.ts

**Files:**
- Create: `lib/types.ts`
- Create: `lib/onboardingMessages.ts`
- Create: `lib/actionPlanTasks.ts`

- [ ] **Step 1: Create lib/types.ts**

Copy from source `ai-product-creator/lib/variantDTypes.ts` as-is (no import changes needed — it has no internal imports):

```ts
export type TaskType = 'quick' | 'guided' | 'offer';
export type TaskStatus = 'completed' | 'active' | 'locked';

export type ActionTask = {
  id: string;
  title: string;
  subtitle?: string;
  type: TaskType;
  status: TaskStatus;
  estimatedTime?: string;
  messages?: DMessage[];
  offerCta?: string;
  offerUrl?: string;
  offerPrice?: string;
};

export type DMessage = {
  id: string;
  sender: 'ai' | 'user';
  content?: string;
  subtitle?: string;
  video?: { src: string; title: string; duration: string };
  visualCard?: { icon: string; title: string; items: { label: string; value: string }[] };
  chips?: { label: string; value: string }[];
  multiSelect?: boolean;
  offerCard?: { title: string; description: string; cta: string; price?: string };
  fitScore?: { percentage: number; message: string; cta: string };
  interstitial?: { headline: string; body: string; stat?: string };
  waitForInput?: boolean;
  triggersPhaseChange?: boolean;
};

export type UserAnswers = Record<string, string>;
```

- [ ] **Step 2: Create lib/onboardingMessages.ts**

Copy from source `ai-product-creator/lib/onboardingMessages.ts`. Change the import from `'./variantDTypes'` to `'./types'`:

```ts
import { DMessage } from './types';
```

The rest of the file is copied as-is (all the step exports and `onboardingSteps` array).

- [ ] **Step 3: Create lib/actionPlanTasks.ts**

Copy from source `ai-product-creator/lib/actionPlanTasks.ts`. Change the import from `'./variantDTypes'` to `'./types'`:

```ts
import { ActionTask, DMessage } from './types';
```

The rest of the file is copied as-is.

- [ ] **Step 4: Commit**

```bash
git add lib/
git commit -m "feat: add types, onboarding messages, and action plan tasks"
```

---

## Chunk 4: Leaf Components (no internal component deps)

### Task 4: Create leaf-level components

These components have NO imports of other project components — they only import from `@/lib/types` or React.

**Files:**
- Create: `components/TypingIndicator.tsx`
- Create: `components/VideoEmbed.tsx`
- Create: `components/VisualCard.tsx`
- Create: `components/ChipPicker.tsx`
- Create: `components/FitScore.tsx`
- Create: `components/Interstitial.tsx`
- Create: `components/OfferCard.tsx`
- Create: `components/PlanHeader.tsx`
- Create: `components/GeneratingChecklist.tsx`

- [ ] **Step 1: Create TypingIndicator.tsx**

Copy from source `DTypingIndicator.tsx`. Rename the export from `DTypingIndicator` to `TypingIndicator`. No `@/lib` imports to change.

- [ ] **Step 2: Create VideoEmbed.tsx**

Copy from source `DVideoEmbed.tsx` as-is. Rename the export from `DVideoEmbed` to `VideoEmbed`. No imports to change.

- [ ] **Step 3: Create VisualCard.tsx**

Copy from source `DVisualCard.tsx` as-is. Rename the export from `DVisualCard` to `VisualCard`. No imports to change.

- [ ] **Step 4: Create ChipPicker.tsx**

Copy from source `DChipPicker.tsx` as-is. Rename the export from `DChipPicker` to `ChipPicker`. No imports to change (only imports `useState` from React).

- [ ] **Step 5: Create FitScore.tsx**

Copy from source `DFitScore.tsx` as-is. Rename the export from `DFitScore` to `FitScore`. No imports to change.

- [ ] **Step 6: Create Interstitial.tsx**

Copy from source `DInterstitial.tsx` as-is. Rename the export from `DInterstitial` to `Interstitial`. No imports to change.

- [ ] **Step 7: Create OfferCard.tsx**

Copy from source `DOfferCard.tsx` as-is. Rename the export from `DOfferCard` to `OfferCard`. No imports to change.

- [ ] **Step 8: Create PlanHeader.tsx**

Copy from source `DPlanHeader.tsx` as-is. Rename the export from `DPlanHeader` to `PlanHeader`. No imports to change.

- [ ] **Step 9: Create GeneratingChecklist.tsx**

Copy from source `GeneratingChecklist.tsx` as-is. No import or export name changes needed.

- [ ] **Step 10: Commit**

```bash
git add components/
git commit -m "feat: add leaf components (TypingIndicator, VideoEmbed, VisualCard, ChipPicker, FitScore, Interstitial, OfferCard, PlanHeader, GeneratingChecklist)"
```

---

## Chunk 5: Components with Internal Dependencies

### Task 5: Create MessageBubble, FlowHeader, TaskItem

These import from `@/lib/types` (was `@/lib/variantDTypes`).

**Files:**
- Create: `components/MessageBubble.tsx`
- Create: `components/FlowHeader.tsx`
- Create: `components/TaskItem.tsx`

- [ ] **Step 1: Create MessageBubble.tsx**

Copy from source `DMessageBubble.tsx`. Three changes:
1. Import: `import { DMessage } from '@/lib/variantDTypes'` → `import { DMessage } from '@/lib/types'`
2. Export: `DMessageBubble` → `MessageBubble`
3. Interface: `DMessageBubbleProps` → `MessageBubbleProps`

- [ ] **Step 2: Create FlowHeader.tsx**

Copy from source `DFlowHeader.tsx`. Three changes:
1. Import: `import { TaskType } from '@/lib/variantDTypes'` → `import { TaskType } from '@/lib/types'`
2. Export: `DFlowHeader` → `FlowHeader`
3. Interface: `DFlowHeaderProps` → `FlowHeaderProps`

- [ ] **Step 3: Create TaskItem.tsx**

Copy from source `DTaskItem.tsx`. Three changes:
1. Import: `import { ActionTask } from '@/lib/variantDTypes'` → `import { ActionTask } from '@/lib/types'`
2. Export: `DTaskItem` → `TaskItem`
3. Interface: `DTaskItemProps` → `TaskItemProps`

- [ ] **Step 4: Commit**

```bash
git add components/MessageBubble.tsx components/FlowHeader.tsx components/TaskItem.tsx
git commit -m "feat: add MessageBubble, FlowHeader, and TaskItem components"
```

---

## Chunk 6: Composite Components

### Task 6: Create OnboardingChat, ActionPlanSidebar, FlowChat

These import both `@/lib/types` and other project components.

**Files:**
- Create: `components/OnboardingChat.tsx`
- Create: `components/ActionPlanSidebar.tsx`
- Create: `components/FlowChat.tsx`

- [ ] **Step 1: Create OnboardingChat.tsx**

Copy from source `DOnboardingChat.tsx`. Update all imports:
```ts
import { DMessage, UserAnswers } from '@/lib/types';
import { onboardingSteps } from '@/lib/onboardingMessages';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';
import VideoEmbed from './VideoEmbed';
import VisualCard from './VisualCard';
import ChipPicker from './ChipPicker';
import FitScore from './FitScore';
import Interstitial from './Interstitial';
```
Update interface name: `DOnboardingChatProps` → `OnboardingChatProps`
Update export name: `DOnboardingChat` → `OnboardingChat`

All JSX component references update accordingly (e.g., `<DTypingIndicator />` → `<TypingIndicator />`).

- [ ] **Step 2: Create ActionPlanSidebar.tsx**

Copy from source `DActionPlanSidebar.tsx`. Update imports:
```ts
import { ActionTask } from '@/lib/types';
import PlanHeader from './PlanHeader';
import TaskItem from './TaskItem';
```
Update interface/export: `DActionPlanSidebar` → `ActionPlanSidebar`, `DActionPlanSidebarProps` → `ActionPlanSidebarProps`

JSX: `<DPlanHeader` → `<PlanHeader`, `<DTaskItem` → `<TaskItem`

- [ ] **Step 3: Create FlowChat.tsx**

Copy from source `DFlowChat.tsx`. Update imports:
```ts
import { ActionTask, DMessage } from '@/lib/types';
import FlowHeader from './FlowHeader';
import TypingIndicator from './TypingIndicator';
import MessageBubble from './MessageBubble';
import VideoEmbed from './VideoEmbed';
import VisualCard from './VisualCard';
import ChipPicker from './ChipPicker';
import OfferCard from './OfferCard';
```
Update interface/export: `DFlowChat` → `FlowChat`, `DFlowChatProps` → `FlowChatProps`

JSX: `<DFlowHeader` → `<FlowHeader`, `<DTypingIndicator />` → `<TypingIndicator />`, `<DMessageBubble` → `<MessageBubble`, `<DVideoEmbed` → `<VideoEmbed`, `<DVisualCard` → `<VisualCard`, `<DChipPicker` → `<ChipPicker`, `<DOfferCard` → `<OfferCard`

- [ ] **Step 4: Commit**

```bash
git add components/OnboardingChat.tsx components/ActionPlanSidebar.tsx components/FlowChat.tsx
git commit -m "feat: add OnboardingChat, ActionPlanSidebar, and FlowChat components"
```

---

## Chunk 7: App Orchestrator

### Task 7: Create App.tsx

This is a simplified version of `DemoApp.tsx` + `VariantDContent.tsx`, merged into one component with only the D states and minimal demo controls.

**Files:**
- Create: `components/App.tsx`

- [ ] **Step 1: Create App.tsx**

Build from source `VariantDContent.tsx` logic + `DemoApp.tsx` demo controls (stripped down). The component should:

1. Import `useState`, `useCallback` from React
2. Import `ActionTask`, `UserAnswers` from `@/lib/types`
3. Import `getInitialTasks` from `@/lib/actionPlanTasks`
4. Import `OnboardingChat`, `GeneratingChecklist`, `ActionPlanSidebar`, `FlowChat`

State:
- `appState`: `'onboarding' | 'generating' | 'action-plan' | 'guided-flow'` — starts at `'onboarding'`
- `activeTaskId`: `string | null` — starts at `null`
- `key`: `number` — starts at `0`, incremented on reset
- `controlsHidden`: `boolean` — starts at `false`
- `tasks`: `ActionTask[]` — from `getInitialTasks()` (lives inside keyed content)
- `userAnswers`: `UserAnswers` — starts `{}` (lives inside keyed content)

Root div: `className="flex flex-col bg-[#f0f0f0]"` with `style={{ width: '100vw', height: '100vh' }}`. Do NOT set `fontFamily` or `fontVariationSettings` inline — these are already set on `body` in `globals.css`.

Demo controls bar structure (from DemoApp but stripped to just):
- Toggle hide/show button (top-right `z-[300]`)
- Main bar: "Demo Controls" label, state display, "Reset Demo" button
- No variant switcher, theme, loading style, or step count controls

Content area: `key={key}` wrapper containing the state machine renders:
- `onboarding` → `<OnboardingChat onComplete={...} />`
- `generating` → card wrapper with `<GeneratingChecklist onComplete={...} steps={generatingSteps} title="Building your AI Product Readiness Report" subtitle="Analyzing your answers against our client database" icon="..." />`
- `action-plan` or `guided-flow` → `<ActionPlanSidebar>` + `<FlowChat>`

The generating steps array (emojis from source `VariantDContent.tsx` lines 22-26):
```ts
const generatingSteps = [
  { label: 'Analyzing your business profile', icon: '\uD83D\uDD0D' },
  { label: 'Evaluating AI product potential', icon: '\uD83E\uDDE0' },
  { label: 'Matching you to client success patterns', icon: '\uD83D\uDCCA' },
  { label: 'Building your personalized report', icon: '\u26A1' },
];
```

Task management callbacks (from VariantDContent):
- `handleOnboardingComplete`: save userAnswers, set state to `generating`
- `handleGeneratingComplete`: set state to `action-plan`
- `handleTaskSelect`: check task is active or offer type, set activeTaskId, set state to `guided-flow`
- `handleTaskComplete`: mark active task completed, unlock next non-offer locked task, clear activeTaskId, set state to `action-plan`
- `handleBackToPlan`: clear activeTaskId, set state to `action-plan`
- `handleReset`: set state to `onboarding`, clear activeTaskId, increment key

**Important — state value prefix stripping:** The source `VariantDContent.tsx` checks against `'d-onboarding'`, `'d-generating'`, etc. In this standalone app, the states no longer have the `d-` prefix. In the inner component's render conditionals, use `'onboarding'`, `'generating'`, `'action-plan'`, and `'guided-flow'` (without the `d-` prefix).

Note: `tasks` and `userAnswers` state must live INSIDE the `key={key}` boundary so they reset on demo reset. This means the content area should be a separate inner component (e.g., `AppContent`) that receives callbacks from the outer `App` and manages its own `tasks`/`userAnswers` state — exactly like `VariantDContent` did.

- [ ] **Step 2: Commit**

```bash
git add components/App.tsx
git commit -m "feat: add App orchestrator with state machine and demo controls"
```

---

## Chunk 8: Page Entry Point

### Task 8: Create page.tsx

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace page.tsx**

Replace the scaffold page with:

```tsx
'use client';

import dynamic from 'next/dynamic';

const App = dynamic(() => import('@/components/App'), { ssr: false });

export default function Home() {
  return <App />;
}
```

- [ ] **Step 2: Delete unused scaffold files**

Remove any scaffold files that are no longer needed (e.g., `app/page.module.css` if it exists, default SVGs from `public/` that aren't used).

- [ ] **Step 3: Commit**

```bash
git add -A app/ public/
git commit -m "feat: wire up page entry point with dynamic App import"
```

---

## Chunk 9: Build Verification

### Task 9: Verify the project builds and runs

- [ ] **Step 1: Run the build**

```bash
cd "C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1"
npm run build
```

Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 2: Run dev server**

```bash
npm run dev
```

Expected: Server starts. App loads at `http://localhost:3000` showing the onboarding chat.

- [ ] **Step 3: Fix any build errors**

If there are TypeScript or import errors, fix them. Common issues:
- Missing `'use client'` directives
- Import path mismatches (`@/lib/variantDTypes` not updated to `@/lib/types`)
- Component name mismatches (JSX still using `D`-prefixed names)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve any build issues from extraction"
```
