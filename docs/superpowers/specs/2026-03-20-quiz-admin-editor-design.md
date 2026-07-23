# Quiz Admin Editor — Design Spec

## Overview

A JSON tree editor at `/admin` with live preview for customizing the quiz funnel's question flow, content, and action plan. Config stored as a JSON file on disk (swappable to database later). The quiz renderer is refactored to consume dynamic config instead of hardcoded TypeScript.

## Scope

### Editable
- Questions: text, subtitle, chips (label, emoji, description, value), single/multi-select
- Flow order: reorder questions, interstitials, and fit scores in the sequence
- Interstitials: headline, body, stat
- Fit scores: percentage, message, CTA text
- Action plan tasks: title, subtitle, type (quick/guided/offer), guided flow messages, offer CTA/price

### Not editable (adjusted in code)
- Visual styling (colors, fonts, spacing, animations)
- Quiz behavior (typing speed, delays, animation timing)
- Component structure

## Architecture

Three layers:

### 1. Config Type (`lib/quiz-config.ts`)

```ts
type ChipOption = {
  label: string;
  value: string;
  emoji?: string;
  description?: string;
};

type QuizQuestion = {
  id: string;
  preamble?: string;           // Optional AI message shown before the question (e.g. welcome text)
  content: string;
  subtitle?: string;
  chips: ChipOption[];
  multiSelect?: boolean;
};

type QuizInterstitial = {
  id: string;
  headline: string;
  body: string;
  stat?: string;
};

type QuizFitScore = {
  id: string;
  percentage: number;
  message: string;
  cta: string;
};

type FlowItem = {
  type: 'question' | 'interstitial' | 'fitScore';
  id: string;
};

type GuidedMessage = {
  id: string;
  sender: 'ai' | 'user';
  content?: string;
  subtitle?: string;
  video?: { src: string; title: string; duration: string };
  visualCard?: { icon: string; title: string; items: { label: string; value: string }[] };
  chips?: ChipOption[];
  offerCard?: { title: string; description: string; cta: string; price?: string };
  waitForInput?: boolean;
};

type ActionPlanTask = {
  id: string;
  title: string;
  subtitle?: string;
  type: 'quick' | 'guided' | 'offer';
  initialStatus?: 'completed' | 'active' | 'locked';  // If omitted, derived: first non-offer = active, rest = locked, offers always accessible
  estimatedTime?: string;
  messages?: GuidedMessage[];
  offerCta?: string;
  offerUrl?: string;
  offerPrice?: string;
};

type QuizConfig = {
  flow: FlowItem[];
  questions: QuizQuestion[];
  interstitials: QuizInterstitial[];
  fitScores: QuizFitScore[];
  actionPlan: ActionPlanTask[];
};
```

### 2. Config Provider (`lib/config-provider.ts`)

Two functions:
- `loadConfig(): QuizConfig` — reads `data/quiz-config.json`, returns parsed config
- `saveConfig(config: QuizConfig): void` — writes config to `data/quiz-config.json`

These are the only functions that touch the file system. Swapping to a database later means only changing these two functions.

Transformer functions convert `QuizConfig` into the `DMessage[]` and `ActionTask[]` shapes the existing components expect:

- `configToOnboardingMessages(config: QuizConfig): DMessage[]` — walks the `flow` array, resolves each item to its question/interstitial/fitScore data, and produces a flat `DMessage[]` (the current `onboardingSteps` is `DMessage[][]` which gets `.flat()`'d immediately — this step-grouping is removed). Key behaviors:
  - If a question has `preamble`, emits an extra `DMessage` (sender: 'ai', content: preamble) before the question message
  - The **last item** in the `flow` array automatically gets `triggersPhaseChange: true` and does NOT get `waitForInput` — this handles the final fit score transition without needing an explicit flag in the config
  - All other fit scores and interstitials get `waitForInput: true`

- `configToActionPlanTasks(config: QuizConfig): ActionTask[]` — maps `actionPlan` items to the `ActionTask` type. `GuidedMessage` maps directly to `DMessage` since it is a compatible subset. If `initialStatus` is set, uses it; otherwise derives: first non-offer task = `'active'`, remaining non-offer tasks = `'locked'`, offer tasks are always accessible

Both functions are async: `loadConfig(): Promise<QuizConfig>`, `saveConfig(config: QuizConfig): Promise<void>` (using `fs/promises` for file I/O in the API route context).

### 3. Initial Config Seed

On first run, if `data/quiz-config.json` doesn't exist, generate it from the current hardcoded data in `onboardingMessages.ts` and `actionPlanTasks.ts`. This is a one-time migration script (`lib/seed-config.ts`) that:
1. Reads the current TypeScript exports
2. Transforms them into `QuizConfig` shape
3. Writes to `data/quiz-config.json`

After seeding, the hardcoded files become unused (but are kept for reference).

## API Routes

### `GET /api/config`
Returns the current `QuizConfig` as JSON.

### `POST /api/config`
Accepts a full `QuizConfig` body, validates it, writes to disk. Returns `{ success: true }`.

No authentication needed — this is a personal tool. When deployed, the `/admin` route can be excluded from the public build or protected with a simple env-var password check.

## Admin UI (`app/admin/page.tsx`)

### Layout
Split-panel layout:
- **Left panel (55%)**: JSON tree editor (dark theme)
- **Right panel (45%)**: Live preview of the quiz

### JSON Tree Editor

Uses a collapsible tree view with:
- Expandable sections: `questions`, `interstitials`, `fitScores`, `flow`, `actionPlan`
- Click any value to edit inline
- Syntax highlighting: keys in pink/red, strings in green, numbers in orange, booleans in orange
- Collapse/expand controls
- "Save" button that POSTs to `/api/config`
- Dark background (`#1e1e2e`) matching the mockup

Implementation: either a lightweight JSON tree library (like `react-json-tree` or `@uiw/react-json-view`) or a custom tree component. A library is preferred to avoid building tree editing from scratch.

### Live Preview Panel

- White background, "LIVE PREVIEW" header
- Renders the actual quiz components (OnboardingChat, ChipPicker, FitScore, Interstitial, etc.) using the in-memory config state
- Updates instantly as edits are made in the tree editor (no save needed for preview — save only persists to disk)
- Step-through controls: "Next" / "Previous" buttons to navigate through the quiz flow in the preview
- Shows the current flow step being previewed

### State Flow

```
Admin loads → GET /api/config → configState (React state)
                                     ↓
                              Tree Editor (edits configState)
                                     ↓
                              Preview (reads configState, renders quiz components)
                                     ↓
                              "Save" button → POST /api/config → disk
```

## Renderer Refactor

### Current flow
```
onboardingMessages.ts (hardcoded) → OnboardingChat
actionPlanTasks.ts (hardcoded) → ActionPlanSidebar / FlowChat
```

### New flow
```
GET /api/config → configToOnboardingMessages() → OnboardingChat
GET /api/config → configToActionPlanTasks() → ActionPlanSidebar / FlowChat
```

### Changes to App.tsx

The `AppContent` component currently:
- Imports `getInitialTasks` from `actionPlanTasks.ts`
- The `OnboardingChat` imports `onboardingSteps` from `onboardingMessages.ts`

After refactor:
- `App.tsx` fetches config on mount via `GET /api/config`
- Passes transformed messages to `OnboardingChat` as a prop (instead of OnboardingChat importing them directly)
- Passes transformed tasks to the action plan (already done via `getInitialTasks`, just change the source)

### OnboardingChat changes

Currently imports `onboardingSteps` at module level:
```ts
import { onboardingSteps } from '@/lib/onboardingMessages';
const allMessages: DMessage[] = onboardingSteps.flat();
```

Change to accept messages as a prop:
```ts
interface OnboardingChatProps {
  onComplete: (answers: UserAnswers) => void;
  messages: DMessage[];
}
```

The `allMessages` computation moves to the parent or is derived from the prop.

## File Structure

```
app/
  admin/
    page.tsx              # Admin editor page (client component)
  api/
    config/
      route.ts            # GET and POST handlers
lib/
  quiz-config.ts          # QuizConfig type + transformer functions
  config-provider.ts      # loadConfig / saveConfig (file I/O)
  seed-config.ts          # One-time migration from hardcoded data
data/
  quiz-config.json        # The config file (gitignored or committed, user's choice)
```

## Deployment Considerations

- The JSON file approach works for local development and any hosting with persistent filesystem (VPS, Docker)
- For serverless (Vercel), swap `config-provider.ts` to read/write from Supabase/Postgres — zero changes to admin UI or quiz renderer
- Analytics (future) will need a database regardless — config migration can happen at the same time
- `/admin` route can be excluded from production builds via Next.js config or protected with env-var auth
