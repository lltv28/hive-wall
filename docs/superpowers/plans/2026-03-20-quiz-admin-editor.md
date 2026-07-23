# Quiz Admin Editor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a JSON tree editor at `/admin` with live preview that lets you customize the quiz funnel's question flow, content, and action plan — backed by a JSON config file.

**Architecture:** Extract all hardcoded quiz data into a `QuizConfig` JSON file. API routes read/write the config. Transformer functions convert the config into the `DMessage[]` and `ActionTask[]` shapes the existing components expect. The admin page loads the config into a tree editor with a live preview panel. Zero changes to quiz rendering components — only the data source changes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `@uiw/react-json-view` (JSON tree editor)

**Spec:** `docs/superpowers/specs/2026-03-20-quiz-admin-editor-design.md`

---

## Chunk 1: Config Types & Transformers

### Task 1: Create QuizConfig types and transformer functions

**Files:**
- Create: `lib/quiz-config.ts`

- [ ] **Step 1: Create the config types and transformer functions**

Create `lib/quiz-config.ts` with:

1. All the config types from the spec: `ChipOption`, `QuizQuestion` (with `preamble?`), `QuizInterstitial`, `QuizFitScore`, `FlowItem`, `GuidedMessage`, `ActionPlanTask` (with `initialStatus?`), `QuizConfig`

2. `configToOnboardingMessages(config: QuizConfig): DMessage[]` — walks `config.flow`, for each item:
   - `'question'`: looks up the question by `id` in `config.questions`. If `preamble` is set, emits a `DMessage` with `{ id: 'preamble-' + question.id, sender: 'ai', content: preamble }` first. Then emits the question `DMessage` with `{ id: 'q-' + question.id, sender: 'ai', content, subtitle, chips, multiSelect, waitForInput: true }`.
   - `'interstitial'`: looks up by `id` in `config.interstitials`. Emits a `DMessage` with `{ id: 'inter-' + interstitial.id, sender: 'ai', interstitial: { headline, body, stat }, waitForInput: true }`.
   - `'fitScore'`: looks up by `id` in `config.fitScores`. Emits a `DMessage` with `{ id: 'fit-' + fitScore.id, sender: 'ai', fitScore: { percentage, message, cta }, waitForInput: true }`.
   - **All emitted messages get `sender: 'ai'`** (explicit on every message).
   - **Last flow item exception**: the last item in the `flow` array gets `triggersPhaseChange: true`. The `waitForInput` suppression only applies to fitScores and interstitials at the end — if the last item is a question, it keeps `waitForInput: true` (otherwise the user cannot answer it).

3. `configToActionPlanTasks(config: QuizConfig): ActionTask[]` — maps each `config.actionPlan` item to an `ActionTask`. The config's `initialStatus` field maps to `ActionTask.status` (intentional field name change — config uses `initialStatus`, runtime type uses `status`). If `initialStatus` is not set, derives: first non-offer task = `'active'`, remaining non-offer = `'locked'`, offer tasks get `'active'`. `GuidedMessage[]` maps directly to `DMessage[]` (compatible subset — `GuidedMessage` has all the same fields minus `multiSelect`, `fitScore`, `interstitial`, `triggersPhaseChange`). Returns deep copies (same pattern as current `getInitialTasks`).

Import `DMessage`, `ActionTask` from `@/lib/types`.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Passes (new file, no consumers yet).

- [ ] **Step 3: Commit**

```bash
git add lib/quiz-config.ts
git commit -m "feat: add QuizConfig types and transformer functions"
```

---

## Chunk 2: Config Provider & Seed

### Task 2: Create config provider and seed script

**Files:**
- Create: `lib/config-provider.ts`
- Create: `lib/seed-config.ts`

- [ ] **Step 1: Create config-provider.ts**

Two async functions using `fs/promises`:

```ts
import { promises as fs } from 'fs';
import path from 'path';
import { QuizConfig } from './quiz-config';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'quiz-config.json');

export async function loadConfig(): Promise<QuizConfig> {
  const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
  return JSON.parse(raw) as QuizConfig;
}

export async function saveConfig(config: QuizConfig): Promise<void> {
  const dir = path.dirname(CONFIG_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}
```

- [ ] **Step 2: Create seed-config.ts**

A function `seedConfig()` that builds a `QuizConfig` object from the current hardcoded data and writes it using `saveConfig`. This is a one-time migration utility.

The function should:
1. Import `onboardingSteps` from `@/lib/onboardingMessages` and `getInitialTasks` from `@/lib/actionPlanTasks`
2. Walk `onboardingSteps` (a `DMessage[][]`), classify each step group into questions, interstitials, or fitScores based on the message properties
3. Build the `flow` array preserving the current ordering
4. Build the `questions` array, extracting `preamble` from multi-message steps (e.g., step1BusinessType has a welcome message before the question)
5. Build the `interstitials` and `fitScores` arrays
6. Build the `actionPlan` array from `getInitialTasks()`, including all guided flow messages
7. Call `saveConfig(config)`

Key mapping logic:
- A step group where any message has `.chips` → it's a question. The chip-bearing message provides the `id`, `content`, `subtitle`, `chips`, and `multiSelect` for the `QuizQuestion`. All preceding messages in the same step group contribute their `content` to the `preamble` field (concatenated with `\n\n` if multiple).
- A step group where any message has `.interstitial` → it's an interstitial
- A step group where any message has `.fitScore` → it's a fitScore
- The final step (`triggersPhaseChange: true`) → a fitScore (the final one)

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Passes.

- [ ] **Step 4: Commit**

```bash
git add lib/config-provider.ts lib/seed-config.ts
git commit -m "feat: add config provider and seed migration script"
```

---

## Chunk 3: API Routes

### Task 3: Create GET and POST config API routes

**Files:**
- Create: `app/api/config/route.ts`

- [ ] **Step 1: Create the API route**

```ts
import { loadConfig, saveConfig } from '@/lib/config-provider';
import { seedConfig } from '@/lib/seed-config';
import { promises as fs } from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'data', 'quiz-config.json');

async function ensureConfig() {
  try {
    await fs.access(CONFIG_PATH);
  } catch {
    await seedConfig();
  }
}

export async function GET() {
  await ensureConfig();
  const config = await loadConfig();
  return Response.json(config);
}

export async function POST(request: Request) {
  const body = await request.json();

  // Basic validation: check required top-level keys are arrays
  const requiredKeys = ['flow', 'questions', 'interstitials', 'fitScores', 'actionPlan'];
  for (const key of requiredKeys) {
    if (!Array.isArray(body[key])) {
      return Response.json(
        { error: `Missing or invalid field: ${key}` },
        { status: 400 },
      );
    }
  }

  await saveConfig(body);
  return Response.json({ success: true });
}
```

The `ensureConfig` function checks if the JSON file exists. If not, it runs the seed script to generate it from the hardcoded data. This handles first-run automatically.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Passes.

- [ ] **Step 3: Test the API**

Start dev server: `npm run dev`

Test GET (should auto-seed and return config):
```bash
curl http://localhost:3000/api/config | head -20
```
Expected: JSON output with `flow`, `questions`, `interstitials`, `fitScores`, `actionPlan` keys.

Verify `data/quiz-config.json` was created on disk.

- [ ] **Step 4: Commit**

```bash
git add app/api/config/route.ts
git commit -m "feat: add GET/POST config API routes with auto-seed"
```

---

## Chunk 4: Renderer Refactor

### Task 4: Make the quiz consume dynamic config instead of hardcoded imports

**Files:**
- Modify: `components/OnboardingChat.tsx`
- Modify: `components/App.tsx`

- [ ] **Step 1: Update OnboardingChat to accept messages as a prop**

In `components/OnboardingChat.tsx`:

1. Remove the import:
```ts
import { onboardingSteps } from '@/lib/onboardingMessages';
```

2. Remove the module-level constant:
```ts
const allMessages: DMessage[] = onboardingSteps.flat();
```

3. Add `messages` to the props interface:
```ts
interface OnboardingChatProps {
  onComplete: (answers: UserAnswers) => void;
  messages: DMessage[];
}
```

4. Inside the component, derive `allMessages` from the prop:
```ts
const allMessages = messages;
```

Everything else stays the same — the component already works with `allMessages` internally.

- [ ] **Step 2: Update App.tsx to fetch config and pass messages**

In `components/App.tsx`:

1. Add `useEffect` to the existing React import (`import { useState, useCallback, useEffect } from 'react'`) and add new imports:
```ts
import { DMessage } from '@/lib/types';
import { QuizConfig, configToOnboardingMessages, configToActionPlanTasks } from '@/lib/quiz-config';
```

2. Remove the import:
```ts
import { getInitialTasks } from '@/lib/actionPlanTasks';
```

3. In the outer `App` component, add config loading state:
```ts
const [config, setConfig] = useState<QuizConfig | null>(null);

useEffect(() => {
  fetch('/api/config')
    .then((r) => r.json())
    .then(setConfig);
}, []);
```

4. Show a loading state while config loads:
```tsx
if (!config) {
  return (
    <div className="flex flex-col bg-white" style={{ width: '100vw', height: '100vh' }}>
      <div className="flex-1 flex items-center justify-center">
        <p style={{ color: '#A1A1AA', fontSize: '14px' }}>Loading...</p>
      </div>
    </div>
  );
}
```

5. Compute messages and tasks from config (outside AppContent, passed as props):
```ts
const onboardingMessages = configToOnboardingMessages(config);
const initialTasks = configToActionPlanTasks(config);
```

6. Pass these into `AppContent` as new props:
```ts
<AppContent
  ...existing props...
  onboardingMessages={onboardingMessages}
  initialTasks={initialTasks}
/>
```

7. Update `AppContent` to accept and use these new props:
- Add `onboardingMessages: DMessage[]` and `initialTasks: ActionTask[]` to the props type
- Change `useState<ActionTask[]>(() => getInitialTasks())` to `useState<ActionTask[]>(() => initialTasks.map(t => ({ ...t })))`
- Pass `messages={onboardingMessages}` to `<OnboardingChat>`

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Passes.

- [ ] **Step 4: Test end-to-end**

Run `npm run dev`, open `http://localhost:3000`. The quiz should work exactly as before — same questions, same flow, same action plan — but now reading from the JSON config file via the API.

- [ ] **Step 5: Commit**

```bash
git add components/OnboardingChat.tsx components/App.tsx
git commit -m "feat: refactor quiz to consume dynamic config via API"
```

---

## Chunk 5: Admin UI

### Task 5: Install JSON editor dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install `@uiw/react-json-view`**

```bash
cd "C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1"
npm install @uiw/react-json-view
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add react-json-view dependency for admin editor"
```

---

### Task 6: Build the admin page

**Files:**
- Create: `app/admin/page.tsx`

- [ ] **Step 1: Create the admin page**

Create `app/admin/page.tsx` as a `'use client'` component with:

**State:**
- `config: QuizConfig | null` — loaded from API on mount
- `saving: boolean` — save-in-progress indicator
- `previewStep: number` — which flow step the preview is showing (0-indexed)

**Layout:**
- Full viewport, split horizontally: left panel (55%) and right panel (45%)
- Left panel: dark theme (`#1e1e2e`), contains:
  - Top bar with "Quiz Config Editor" title, "Collapse All" text button, "Save" green button
  - `JsonView` component from `@uiw/react-json-view` with dark theme, editing enabled via `onEdit` / `onAdd` / `onDelete` callbacks (consult `@uiw/react-json-view` README for exact prop names — the API may differ between versions)
  - On value change, update `config` state via these callbacks
- Right panel: white background, contains:
  - "LIVE PREVIEW" header with "Auto-updating" badge
  - Preview area that renders quiz components based on `previewStep`
  - Bottom controls: "Previous" / "Next" buttons to step through the flow

**Save handler:**
- POST the current `config` to `/api/config`
- Show saving state on the button

**Note on flow reordering:** Flow reordering is done by editing the `flow` array directly in the JSON tree (add/remove/reorder items). A drag-and-drop reorder UI is out of scope for this iteration.

**Preview logic:**
- Compute `messages = configToOnboardingMessages(config)` from current state
- The preview shows the message at `previewStep` index (and all messages before it)
- Render using the actual `MessageBubble`, `ChipPicker`, `FitScore`, `Interstitial` components
- Step-through controls let you navigate forward/backward through the flow

**Import the quiz components for the preview:**
```ts
import MessageBubble from '@/components/MessageBubble';
import ChipPicker from '@/components/ChipPicker';
import FitScore from '@/components/FitScore';
import Interstitial from '@/components/Interstitial';
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Passes.

- [ ] **Step 3: Test the admin page**

Run `npm run dev`, open `http://localhost:3000/admin`.
- The JSON tree should display the full config
- Editing a value should update the preview in real-time
- "Save" should persist changes
- "Next" / "Previous" should step through the quiz flow in the preview

- [ ] **Step 4: Commit**

```bash
git add app/admin/page.tsx
git commit -m "feat: add admin editor page with JSON tree and live preview"
```

---

## Chunk 6: Final Verification

### Task 7: End-to-end verification

- [ ] **Step 1: Run the build**

```bash
cd "C:\Users\lucas\OneDrive\Documents\claude-code\ai-quiz-funnel-v1"
npm run build
```

Expected: Build succeeds.

- [ ] **Step 2: Test the full flow**

1. Open `http://localhost:3000` — quiz works as before
2. Open `http://localhost:3000/admin` — editor loads with config
3. Change a question's text in the editor
4. Click "Save"
5. Refresh the quiz page — the changed text appears
6. Step through the preview — all question types render correctly

- [ ] **Step 3: Add data/ to .gitignore (optional)**

If you want to keep the config out of git (since it's generated):
```bash
echo "data/" >> .gitignore
```

Or commit it if you want version control on the config.

- [ ] **Step 4: Fix any issues and final commit**

```bash
git add -A
git commit -m "feat: complete quiz admin editor with config-driven quiz"
```
